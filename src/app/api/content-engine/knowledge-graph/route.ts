/**
 * Knowledge Graph — Brand Entity Graph
 *
 * GET    /api/content-engine/knowledge-graph  → Full knowledge graph for a domain
 * POST   /api/content-engine/knowledge-graph  → Build/update knowledge graph using AI
 * DELETE /api/content-engine/knowledge-graph  → Delete a node by ID
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createChatCompletion } from '@/lib/zai'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: Full Knowledge Graph ─────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN

    const [nodes, edges] = await Promise.all([
      db.knowledgeNode.findMany({
        where: { domain },
        include: {
          outgoingEdges: true,
          incomingEdges: true,
        },
        orderBy: { aiVisibilityImpact: 'desc' },
      }),
      db.knowledgeEdge.findMany({
        where: {
          sourceNode: { domain },
        },
        include: {
          sourceNode: { select: { id: true, label: true, nodeType: true } },
          targetNode: { select: { id: true, label: true, nodeType: true } },
        },
      }),
    ])

    // Identify incomplete nodes (missing data)
    const incompleteNodes = nodes.filter((n) => !n.isComplete)

    // Highest impact nodes
    const highestImpactNodes = nodes
      .sort((a, b) => b.aiVisibilityImpact - a.aiVisibilityImpact)
      .slice(0, 10)

    // Parse missing data for gaps
    const gaps = incompleteNodes
      .map((n) => ({
        nodeId: n.id,
        label: n.label,
        nodeType: n.nodeType,
        missingData: n.missingData ? JSON.parse(n.missingData) : [],
      }))
      .filter((g) => g.missingData.length > 0)

    return NextResponse.json({
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        incompleteNodes: incompleteNodes.length,
        gaps,
        highestImpactNodes: highestImpactNodes.map((n) => ({
          id: n.id,
          label: n.label,
          nodeType: n.nodeType,
          aiVisibilityImpact: n.aiVisibilityImpact,
          isComplete: n.isComplete,
        })),
      },
    })
  } catch (error) {
    console.error('[Knowledge Graph] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge graph' },
      { status: 500 }
    )
  }
}

// ── POST: Build/Update Knowledge Graph ────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const domain = body?.domain || DEFAULT_DOMAIN

    // Fetch existing content to analyze
    const [articles, briefs, existingNodes] = await Promise.all([
      db.contentArticle.findMany({
        where: { domain, status: 'published' },
        select: { id: true, title: true, content: true, pillar: true },
        take: 20,
      }),
      db.contentBrief.findMany({
        where: { domain },
        select: { id: true, topic: true, keywordTarget: true, pillar: true, cluster: true },
        take: 30,
      }),
      db.knowledgeNode.findMany({
        where: { domain },
        select: { id: true, label: true, nodeType: true },
      }),
    ])

    // Build AI prompt for entity extraction
    const contentSummary = articles
      .map((a) => `- "${a.title}" (pillar: ${a.pillar})`)
      .join('\n')

    const briefSummary = briefs
      .map((b) => `- "${b.topic}" (keyword: ${b.keywordTarget}, pillar: ${b.pillar})`)
      .join('\n')

    const existingNodeLabels = existingNodes.map((n) => n.label).join(', ')

    const systemPrompt = `You are an AI Knowledge Graph Builder for the brand "${domain}". Analyze the following content and identify all entities that should be nodes in the brand's knowledge graph.

Existing nodes: ${existingNodeLabels || 'None'}

Published articles:
${contentSummary}

Content briefs:
${briefSummary}

Generate a JSON response with nodes and edges. For each node, identify if data is missing (e.g. "No Wikipedia page", "No Crunchbase entry", "No Reddit presence", "No author page").

Response format:
{
  "nodes": [
    {
      "nodeType": "brand|founder|product|service|author|topic|entity|mention|source|industry|feature",
      "label": "string",
      "description": "string",
      "url": "string or null",
      "properties": {},
      "aiVisibilityImpact": number (0-100),
      "isComplete": boolean,
      "missingData": ["wikipedia", "crunchbase", etc.]
    }
  ],
  "edges": [
    {
      "sourceLabel": "string (must match a node label)",
      "targetLabel": "string (must match a node label)",
      "relationship": "owns|founded|covers|mentions|cites|competes_with|related_to|author_of|about|part_of",
      "strength": number (0-100)
    }
  ],
  "gaps": [
    {
      "label": "string",
      "gap": "string describing what's missing",
      "priority": "high|medium|low"
    }
  ]
}

Important:
- Include nodes for: the brand itself, key products/features, key topics covered, key entities mentioned
- For "${domain}", the brand is "Seosights" — an AI Visibility platform
- Key features: AI Visibility Score, Replay, Recorder, Content Engine, Learning System
- Key topics: SEO, AEO (Answer Engine Optimization), GEO (Generative Engine Optimization), AI Visibility, Entity SEO
- Identify gaps like missing Wikipedia page, no Crunchbase, no Reddit presence, etc.`

    let graphData: {
      nodes: Array<{
        nodeType: string
        label: string
        description: string
        url: string | null
        properties: Record<string, unknown>
        aiVisibilityImpact: number
        isComplete: boolean
        missingData: string[]
      }>
      edges: Array<{
        sourceLabel: string
        targetLabel: string
        relationship: string
        strength: number
      }>
      gaps: Array<{
        label: string
        gap: string
        priority: string
      }>
    }

    try {
      const aiResponse = await createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Build the knowledge graph for this brand.' },
      ], { temperature: 0.5 })

      graphData = JSON.parse(aiResponse)
    } catch {
      // Fallback: build a basic graph without AI
      graphData = buildFallbackGraph(domain)
    }

    // Create or update nodes
    const createdNodes: Array<{ id: string; label: string; nodeType: string }> = []
    const nodeLabelToId: Record<string, string> = {}

    // Map existing nodes
    for (const existing of existingNodes) {
      nodeLabelToId[existing.label] = existing.id
    }

    for (const node of graphData.nodes) {
      const existingId = nodeLabelToId[node.label]

      if (existingId) {
        // Update existing node
        await db.knowledgeNode.update({
          where: { id: existingId },
          data: {
            nodeType: node.nodeType,
            description: node.description,
            url: node.url,
            properties: node.properties ? JSON.stringify(node.properties) : null,
            aiVisibilityImpact: node.aiVisibilityImpact,
            isComplete: node.isComplete,
            missingData: node.missingData.length > 0 ? JSON.stringify(node.missingData) : null,
          },
        })
        createdNodes.push({ id: existingId, label: node.label, nodeType: node.nodeType })
      } else {
        // Create new node
        const created = await db.knowledgeNode.create({
          data: {
            domain,
            nodeType: node.nodeType,
            label: node.label,
            description: node.description,
            url: node.url,
            properties: node.properties ? JSON.stringify(node.properties) : null,
            aiVisibilityImpact: node.aiVisibilityImpact,
            isComplete: node.isComplete,
            missingData: node.missingData.length > 0 ? JSON.stringify(node.missingData) : null,
          },
        })
        nodeLabelToId[node.label] = created.id
        createdNodes.push({ id: created.id, label: node.label, nodeType: node.nodeType })
      }
    }

    // Create edges
    const createdEdges: Array<{ id: string; source: string; target: string; relationship: string }> = []
    for (const edge of graphData.edges) {
      const sourceId = nodeLabelToId[edge.sourceLabel]
      const targetId = nodeLabelToId[edge.targetLabel]

      if (!sourceId || !targetId) continue
      if (sourceId === targetId) continue // Skip self-edges

      try {
        const created = await db.knowledgeEdge.create({
          data: {
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            relationship: edge.relationship,
            strength: edge.strength,
          },
        })
        createdEdges.push({
          id: created.id,
          source: edge.sourceLabel,
          target: edge.targetLabel,
          relationship: edge.relationship,
        })
      } catch {
        // Skip duplicate edges
      }
    }

    return NextResponse.json({
      nodes: createdNodes,
      edges: createdEdges,
      gaps: graphData.gaps,
      message: `Knowledge graph updated: ${createdNodes.length} nodes, ${createdEdges.length} edges, ${graphData.gaps.length} gaps identified`,
    }, { status: 201 })
  } catch (error) {
    console.error('[Knowledge Graph] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to build knowledge graph' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete a Node ─────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('nodeId')

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify node exists
    const node = await db.knowledgeNode.findUnique({
      where: { id: nodeId },
    })

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    // Delete the node (cascades to edges)
    await db.knowledgeNode.delete({
      where: { id: nodeId },
    })

    return NextResponse.json({
      message: `Node "${node.label}" and all connected edges deleted`,
      deletedNodeId: nodeId,
    })
  } catch (error) {
    console.error('[Knowledge Graph] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    )
  }
}

// ── Fallback Graph Builder ────────────────────────────────────────────────────

function buildFallbackGraph(domain: string) {
  return {
    nodes: [
      {
        nodeType: 'brand',
        label: 'Seosights',
        description: 'AI Visibility Platform — helps brands get found by AI engines',
        url: `https://${domain}`,
        properties: { type: 'SaaS', industry: 'MarTech' },
        aiVisibilityImpact: 95,
        isComplete: false,
        missingData: ['wikipedia', 'crunchbase', 'reddit'],
      },
      {
        nodeType: 'feature',
        label: 'AI Visibility Score',
        description: 'Real-time measurement of how visible a brand is across AI engines (ChatGPT, Claude, Gemini, Perplexity, Copilot)',
        url: `https://${domain}/features/ai-visibility-score`,
        properties: { metricType: 'composite', range: '0-100' },
        aiVisibilityImpact: 90,
        isComplete: true,
        missingData: [],
      },
      {
        nodeType: 'feature',
        label: 'Replay',
        description: 'Measures AI visibility changes over time with causal attribution',
        url: `https://${domain}/features/replay`,
        properties: { metricType: 'longitudinal' },
        aiVisibilityImpact: 85,
        isComplete: true,
        missingData: [],
      },
      {
        nodeType: 'feature',
        label: 'Recorder',
        description: 'Records AI engine responses for competitive analysis',
        url: `https://${domain}/features/recorder`,
        properties: { metricType: 'observational' },
        aiVisibilityImpact: 75,
        isComplete: true,
        missingData: [],
      },
      {
        nodeType: 'feature',
        label: 'Content Engine',
        description: 'AI-powered content creation and optimization pipeline',
        url: `https://${domain}/features/content-engine`,
        properties: { type: 'automation' },
        aiVisibilityImpact: 80,
        isComplete: false,
        missingData: ['demo_video'],
      },
      {
        nodeType: 'feature',
        label: 'Learning System',
        description: 'Autonomous learning system that tracks actions→outcomes and builds institutional memory',
        url: `https://${domain}/features/learning-system`,
        properties: { type: 'intelligence' },
        aiVisibilityImpact: 70,
        isComplete: false,
        missingData: ['documentation', 'case_study'],
      },
      {
        nodeType: 'topic',
        label: 'SEO',
        description: 'Search Engine Optimization — traditional search visibility',
        url: null,
        properties: { category: 'core_topic' },
        aiVisibilityImpact: 60,
        isComplete: true,
        missingData: [],
      },
      {
        nodeType: 'topic',
        label: 'AEO',
        description: 'Answer Engine Optimization — optimizing for AI answer engines',
        url: null,
        properties: { category: 'core_topic' },
        aiVisibilityImpact: 65,
        isComplete: false,
        missingData: ['wikipedia'],
      },
      {
        nodeType: 'topic',
        label: 'GEO',
        description: 'Generative Engine Optimization — optimizing for generative AI responses',
        url: null,
        properties: { category: 'core_topic' },
        aiVisibilityImpact: 70,
        isComplete: false,
        missingData: ['wikipedia'],
      },
      {
        nodeType: 'topic',
        label: 'Entity SEO',
        description: 'SEO strategy focused on building entity authority for AI engines',
        url: null,
        properties: { category: 'emerging_topic' },
        aiVisibilityImpact: 55,
        isComplete: false,
        missingData: ['wikipedia', 'reddit'],
      },
      {
        nodeType: 'entity',
        label: 'AI Visibility for Dentists',
        description: 'Industry-specific AI visibility use case for dental practices',
        url: `https://${domain}/blog/ai-visibility-for-dentists`,
        properties: { industry: 'dental', vertical: 'healthcare' },
        aiVisibilityImpact: 40,
        isComplete: true,
        missingData: [],
      },
      {
        nodeType: 'industry',
        label: 'MarTech',
        description: 'Marketing Technology industry',
        url: null,
        properties: { category: 'industry' },
        aiVisibilityImpact: 50,
        isComplete: true,
        missingData: [],
      },
    ],
    edges: [
      { sourceLabel: 'Seosights', targetLabel: 'AI Visibility Score', relationship: 'owns', strength: 95 },
      { sourceLabel: 'Seosights', targetLabel: 'Replay', relationship: 'owns', strength: 90 },
      { sourceLabel: 'Seosights', targetLabel: 'Recorder', relationship: 'owns', strength: 85 },
      { sourceLabel: 'Seosights', targetLabel: 'Content Engine', relationship: 'owns', strength: 80 },
      { sourceLabel: 'Seosights', targetLabel: 'Learning System', relationship: 'owns', strength: 75 },
      { sourceLabel: 'Seosights', targetLabel: 'MarTech', relationship: 'part_of', strength: 80 },
      { sourceLabel: 'Content Engine', targetLabel: 'Learning System', relationship: 'related_to', strength: 70 },
      { sourceLabel: 'AI Visibility Score', targetLabel: 'SEO', relationship: 'covers', strength: 60 },
      { sourceLabel: 'AI Visibility Score', targetLabel: 'AEO', relationship: 'covers', strength: 80 },
      { sourceLabel: 'AI Visibility Score', targetLabel: 'GEO', relationship: 'covers', strength: 85 },
      { sourceLabel: 'AEO', targetLabel: 'GEO', relationship: 'related_to', strength: 75 },
      { sourceLabel: 'Entity SEO', targetLabel: 'GEO', relationship: 'related_to', strength: 80 },
      { sourceLabel: 'Entity SEO', targetLabel: 'SEO', relationship: 'related_to', strength: 70 },
      { sourceLabel: 'AI Visibility for Dentists', targetLabel: 'AI Visibility Score', relationship: 'about', strength: 60 },
      { sourceLabel: 'AI Visibility for Dentists', targetLabel: 'Entity SEO', relationship: 'mentions', strength: 50 },
    ],
    gaps: [
      { label: 'Seosights', gap: 'No Wikipedia page — major authority signal missing', priority: 'high' },
      { label: 'Seosights', gap: 'No Crunchbase entry — limits investor/partner discovery', priority: 'high' },
      { label: 'Seosights', gap: 'No Reddit presence — missing community engagement channel', priority: 'medium' },
      { label: 'AEO', gap: 'No Wikipedia page for AEO concept — opportunity to define the category', priority: 'medium' },
      { label: 'GEO', gap: 'No Wikipedia page for GEO concept — opportunity to define the category', priority: 'medium' },
      { label: 'Entity SEO', gap: 'No Wikipedia page — emerging concept without authoritative source', priority: 'medium' },
      { label: 'Content Engine', gap: 'No demo video — missing conversion asset', priority: 'low' },
    ],
  }
}
