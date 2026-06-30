/**
 * Learning System Seed — Comprehensive Demo Data
 *
 * POST /api/content-engine/learning-seed
 *
 * Seeds the Learning System with realistic demo data:
 * - GrowthMemory entries spanning 6 months
 * - EvidenceEntry records with varied confidence levels
 * - KnowledgeGraph nodes and edges for "seosights.com"
 * - Sprints with different statuses
 * - ArticleROI records
 * - AIDailyRecommendation entries
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

export async function POST(request: Request) {
  try {
    let domain = DEFAULT_DOMAIN
    try {
      const body = await request.json()
      domain = body?.domain || DEFAULT_DOMAIN
    } catch {
      // No body or invalid JSON — use defaults
    }

    const results: Record<string, number> = {}

    // ── 0. Clean up old seed data to make this idempotent ─────────────
    try {
      await db.aIDailyRecommendation.deleteMany({ where: { domain } })
      await db.articleROI.deleteMany({ where: { domain } })
      await db.sprint.deleteMany({ where: { domain } })
      await db.knowledgeEdge.deleteMany({ where: { sourceNode: { domain } } })
      await db.knowledgeNode.deleteMany({ where: { domain } })
      await db.evidenceEntry.deleteMany({ where: { domain } })
      await db.growthMemory.deleteMany({ where: { domain } })
      // Don't delete visibility snapshots — they're useful
    } catch {
      // Ignore cleanup errors
    }

    // ── 1. GrowthMemory — 6 months of action→outcome data ───────────────
    const actionTypes = [
      { type: 'published_article', baseVis: 5, baseCit: 2, baseOrg: 30, baseLead: 1, baseRev: 50 },
      { type: 'created_faq', baseVis: 3, baseCit: 1, baseOrg: 10, baseLead: 0, baseRev: 0 },
      { type: 'added_author', baseVis: 2, baseCit: 1, baseOrg: 5, baseLead: 0, baseRev: 0 },
      { type: 'created_schema', baseVis: 2, baseCit: 1, baseOrg: 8, baseLead: 0, baseRev: 0 },
      { type: 'added_internal_link', baseVis: 1, baseCit: 0, baseOrg: 5, baseLead: 0, baseRev: 0 },
      { type: 'fixed_robots', baseVis: 4, baseCit: 0, baseOrg: 20, baseLead: 0, baseRev: 0 },
      { type: 'updated_llms_txt', baseVis: 3, baseCit: 2, baseOrg: 15, baseLead: 0, baseRev: 0 },
      { type: 'created_entity', baseVis: 6, baseCit: 3, baseOrg: 25, baseLead: 2, baseRev: 100 },
      { type: 'added_citation_source', baseVis: 2, baseCit: 3, baseOrg: 5, baseLead: 0, baseRev: 0 },
    ]

    const entities = [
      'AI Visibility', 'Entity SEO', 'AEO', 'GEO', 'Seosights',
      'AI Visibility for Dentists', 'Claude SEO', 'Perplexity Optimization',
      'ChatGPT Optimization', 'Schema Markup', 'FAQ Schema',
      'llms.txt', 'Knowledge Graph', 'Content Engine',
    ]

    const actionDetails: Record<string, string[]> = {
      'published_article': [
        'Published article: "Complete Guide to AI Visibility"',
        'Published article: "Entity SEO for AI Engines"',
        'Published article: "How to Optimize for Claude and Perplexity"',
        'Published article: "AI Visibility for Dentists: Complete Guide"',
        'Published article: "AEO vs GEO: Key Differences"',
        'Published article: "Schema Markup for AI Visibility"',
        'Published article: "llms.txt: The New robots.txt for AI"',
        'Published article: "Knowledge Graph Optimization Guide"',
        'Published article: "Building Entity Authority in 2025"',
        'Published article: "Self-Optimizing Blog: How It Works"',
      ],
      'created_faq': [
        'Created FAQ: "What is AI Visibility Score?"',
        'Created FAQ: "How does GEO differ from AEO?"',
        'Created FAQ: "What is Entity SEO?"',
        'Created FAQ: "How to measure AI Visibility?"',
        'Created FAQ: "What is llms.txt?"',
      ],
      'added_author': [
        'Added author byline with E-E-A-T credentials to AI Visibility guide',
        'Added author schema markup with organizational affiliation',
      ],
      'created_schema': [
        'Created FAQPage schema for top 3 articles',
        'Added Article schema with author and publisher info',
        'Implemented Organization schema on homepage',
      ],
      'added_internal_link': [
        'Added 5 internal links from high-authority pages to new articles',
        'Built topic cluster linking for Entity SEO pillar',
        'Added breadcrumb internal links across all guides',
      ],
      'fixed_robots': [
        'Fixed robots.txt blocking AI crawlers',
        'Resolved canonical URL issues on blog pages',
        'Fixed 404 errors on 3 key article pages',
      ],
      'updated_llms_txt': [
        'Updated llms.txt with 5 new articles and entities',
        'Added citation sources to llms.txt',
        'Refreshed llms.txt with latest product features',
      ],
      'created_entity': [
        'Created entity page for "Seosights" with structured data',
        'Created entity page for "AI Visibility Score" metric',
        'Created Wikipedia citation source for Seosights',
      ],
      'added_citation_source': [
        'Added citation sources: research papers on AI search behavior',
        'Added competitor analysis citations to GEO guide',
        'Added industry report citations to AEO article',
      ],
    }

    let growthMemoryCount = 0
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Generate ~120 growth memory entries over 6 months
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo)
      monthStart.setMonth(monthStart.getMonth() + month)

      // More actions in recent months (ramp up)
      const actionsThisMonth = 12 + month * 4

      for (let i = 0; i < actionsThisMonth; i++) {
        const actionDef = actionTypes[Math.floor(Math.random() * actionTypes.length)]
        const detail = actionDetails[actionDef.type]?.[Math.floor(Math.random() * (actionDetails[actionDef.type]?.length ?? 1))] || `Performed ${actionDef.type}`

        // Add variance to outcomes
        const variance = () => Math.random() > 0.3 ? 1 : -1 // 70% positive
        const visibilityDelta = Math.round(actionDef.baseVis * (0.5 + Math.random()) * variance())
        const citationDelta = Math.round(actionDef.baseCit * (0.5 + Math.random()) * (variance() > 0 ? 1 : 0))
        const organicDelta = Math.round(actionDef.baseOrg * (0.3 + Math.random() * 0.7) * variance())
        const leadDelta = Math.round(actionDef.baseLead * Math.random() * (variance() > 0 ? 1 : 0))
        const revenueDelta = Math.round(actionDef.baseRev * Math.random() * (variance() > 0 ? 1 : 0) * 100) / 100

        // Random date within the month
        const actionDate = new Date(monthStart)
        actionDate.setDate(actionDate.getDate() + Math.floor(Math.random() * 28))
        actionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60))

        await db.growthMemory.create({
          data: {
            domain,
            actionType: actionDef.type,
            actionDetail: detail,
            targetEntity: entities[Math.floor(Math.random() * entities.length)],
            visibilityDelta,
            citationDelta,
            organicDelta,
            leadDelta,
            revenueDelta,
            confidence: 50 + Math.floor(Math.random() * 40),
            measuredAt: new Date(actionDate.getTime() + 24 * 60 * 60 * 1000), // Measured 24h later
            metadata: JSON.stringify({ month, seeded: true }),
          },
        })
        growthMemoryCount++
      }
    }
    results.growthMemories = growthMemoryCount

    // ── 2. EvidenceEntry ─────────────────────────────────────────────────
    const evidenceTypes = [
      { type: 'publish_article', rec: 'Publish entity-optimized articles — strongest driver of AI visibility', conf: 88, companies: 5, replay: 23, competitors: 8, articles: 47, memories: 42, avgGain: 5.2 },
      { type: 'create_faq', rec: 'Add FAQ sections to articles — fast AEO visibility win', conf: 82, companies: 3, replay: 15, competitors: 6, articles: 32, memories: 28, avgGain: 3.1 },
      { type: 'add_author', rec: 'Add author bylines with E-E-A-T signals — builds entity authority', conf: 71, companies: 2, replay: 8, competitors: 4, articles: 18, memories: 12, avgGain: 2.3 },
      { type: 'create_schema', rec: 'Implement structured data (FAQPage, Article) — improves AI parsing', conf: 78, companies: 4, replay: 12, competitors: 7, articles: 25, memories: 22, avgGain: 2.8 },
      { type: 'add_internal_links', rec: 'Build internal link clusters — distributes authority across content', conf: 68, companies: 3, replay: 10, competitors: 5, articles: 20, memories: 18, avgGain: 1.5 },
      { type: 'fix_technical', rec: 'Fix robots.txt and crawl issues — removes blockers for AI engines', conf: 85, companies: 6, replay: 19, competitors: 9, articles: 35, memories: 30, avgGain: 4.1 },
      { type: 'update_llms_txt', rec: 'Maintain llms.txt — ensures AI engines index latest content', conf: 74, companies: 2, replay: 7, competitors: 3, articles: 15, memories: 14, avgGain: 3.0 },
      { type: 'create_entity', rec: 'Create entity pages with structured data — highest single-action impact', conf: 79, companies: 3, replay: 11, competitors: 6, articles: 22, memories: 20, avgGain: 6.4 },
      { type: 'add_citation_source', rec: 'Add citation sources — improves AI engine trust signals', conf: 65, companies: 2, replay: 5, competitors: 4, articles: 12, memories: 10, avgGain: 2.1 },
    ]

    let evidenceCount = 0
    for (const ev of evidenceTypes) {
      await db.evidenceEntry.upsert({
        where: { id: `evidence-${domain}-${ev.type}` },
        update: {
          recommendation: ev.rec,
          basedOnCompanies: ev.companies,
          basedOnReplaySessions: ev.replay,
          basedOnCompetitors: ev.competitors,
          basedOnArticles: ev.articles,
          basedOnGrowthMemories: ev.memories,
          avgVisibilityGain: ev.avgGain,
          confidence: ev.conf,
          sourceBreakdown: JSON.stringify({
            sampleSize: ev.memories,
            avgVisibilityGain: ev.avgGain,
            positiveRate: Math.round(70 + Math.random() * 20),
            companiesAnalyzed: ev.companies,
            competitorInsights: ev.competitors,
            lastUpdated: new Date().toISOString(),
          }),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          id: `evidence-${domain}-${ev.type}`,
          domain,
          recommendationType: ev.type,
          recommendation: ev.rec,
          basedOnCompanies: ev.companies,
          basedOnReplaySessions: ev.replay,
          basedOnCompetitors: ev.competitors,
          basedOnArticles: ev.articles,
          basedOnGrowthMemories: ev.memories,
          avgVisibilityGain: ev.avgGain,
          confidence: ev.conf,
          sourceBreakdown: JSON.stringify({
            sampleSize: ev.memories,
            avgVisibilityGain: ev.avgGain,
            positiveRate: Math.round(70 + Math.random() * 20),
            companiesAnalyzed: ev.companies,
            competitorInsights: ev.competitors,
            lastUpdated: new Date().toISOString(),
          }),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
      evidenceCount++
    }
    results.evidenceEntries = evidenceCount

    // ── 3. KnowledgeGraph Nodes & Edges ──────────────────────────────────
    const nodes = [
      { nodeType: 'brand', label: 'Seosights', description: 'AI Visibility Platform', url: `https://${domain}`, impact: 95, complete: false, missing: ['wikipedia', 'crunchbase', 'reddit'] },
      { nodeType: 'feature', label: 'AI Visibility Score', description: 'Real-time AI visibility measurement across 5 engines', url: `https://${domain}/features/ai-visibility-score`, impact: 90, complete: true, missing: [] },
      { nodeType: 'feature', label: 'Replay', description: 'Measures AI visibility changes over time', url: `https://${domain}/features/replay`, impact: 85, complete: true, missing: [] },
      { nodeType: 'feature', label: 'Recorder', description: 'Records AI engine responses', url: `https://${domain}/features/recorder`, impact: 75, complete: true, missing: [] },
      { nodeType: 'feature', label: 'Content Engine', description: 'AI content creation and optimization pipeline', url: `https://${domain}/features/content-engine`, impact: 80, complete: false, missing: ['demo_video'] },
      { nodeType: 'feature', label: 'Learning System', description: 'Autonomous action→outcome tracking', url: `https://${domain}/features/learning-system`, impact: 70, complete: false, missing: ['documentation', 'case_study'] },
      { nodeType: 'topic', label: 'SEO', description: 'Search Engine Optimization', url: null, impact: 60, complete: true, missing: [] },
      { nodeType: 'topic', label: 'AEO', description: 'Answer Engine Optimization', url: null, impact: 65, complete: false, missing: ['wikipedia'] },
      { nodeType: 'topic', label: 'GEO', description: 'Generative Engine Optimization', url: null, impact: 70, complete: false, missing: ['wikipedia'] },
      { nodeType: 'topic', label: 'Entity SEO', description: 'Entity-based SEO for AI engines', url: null, impact: 55, complete: false, missing: ['wikipedia', 'reddit'] },
      { nodeType: 'entity', label: 'AI Visibility for Dentists', description: 'Vertical use case for dental AI visibility', url: `https://${domain}/blog/ai-visibility-for-dentists`, impact: 40, complete: true, missing: [] },
      { nodeType: 'industry', label: 'MarTech', description: 'Marketing Technology industry', url: null, impact: 50, complete: true, missing: [] },
      { nodeType: 'competitor', label: 'Profound', description: 'AI search analytics competitor', url: 'https://profound.com', impact: 35, complete: true, missing: [] },
      { nodeType: 'competitor', label: 'Peec AI', description: 'AI visibility monitoring competitor', url: 'https://peec.ai', impact: 30, complete: true, missing: [] },
      { nodeType: 'source', label: 'Wikipedia', description: 'Authoritative citation source for entity building', url: 'https://wikipedia.org', impact: 45, complete: true, missing: [] },
    ]

    const createdNodes: Record<string, string> = {}
    let nodeCount = 0
    for (const node of nodes) {
      const created = await db.knowledgeNode.create({
        data: {
          domain,
          nodeType: node.nodeType,
          label: node.label,
          description: node.description,
          url: node.url,
          properties: JSON.stringify({ seeded: true }),
          aiVisibilityImpact: node.impact,
          isComplete: node.complete,
          missingData: node.missing.length > 0 ? JSON.stringify(node.missing) : null,
        },
      })
      createdNodes[node.label] = created.id
      nodeCount++
    }
    results.knowledgeNodes = nodeCount

    const edges = [
      { source: 'Seosights', target: 'AI Visibility Score', rel: 'owns', strength: 95 },
      { source: 'Seosights', target: 'Replay', rel: 'owns', strength: 90 },
      { source: 'Seosights', target: 'Recorder', rel: 'owns', strength: 85 },
      { source: 'Seosights', target: 'Content Engine', rel: 'owns', strength: 80 },
      { source: 'Seosights', target: 'Learning System', rel: 'owns', strength: 75 },
      { source: 'Seosights', target: 'MarTech', rel: 'part_of', strength: 80 },
      { source: 'Content Engine', target: 'Learning System', rel: 'related_to', strength: 70 },
      { source: 'AI Visibility Score', target: 'SEO', rel: 'covers', strength: 60 },
      { source: 'AI Visibility Score', target: 'AEO', rel: 'covers', strength: 80 },
      { source: 'AI Visibility Score', target: 'GEO', rel: 'covers', strength: 85 },
      { source: 'AEO', target: 'GEO', rel: 'related_to', strength: 75 },
      { source: 'Entity SEO', target: 'GEO', rel: 'related_to', strength: 80 },
      { source: 'Entity SEO', target: 'SEO', rel: 'related_to', strength: 70 },
      { source: 'AI Visibility for Dentists', target: 'AI Visibility Score', rel: 'about', strength: 60 },
      { source: 'AI Visibility for Dentists', target: 'Entity SEO', rel: 'mentions', strength: 50 },
      { source: 'Seosights', target: 'Profound', rel: 'competes_with', strength: 70 },
      { source: 'Seosights', target: 'Peec AI', rel: 'competes_with', strength: 60 },
      { source: 'Seosights', target: 'Wikipedia', rel: 'cites', strength: 40 },
      { source: 'Content Engine', target: 'SEO', rel: 'covers', strength: 55 },
      { source: 'Replay', target: 'GEO', rel: 'covers', strength: 75 },
    ]

    let edgeCount = 0
    for (const edge of edges) {
      const sourceId = createdNodes[edge.source]
      const targetId = createdNodes[edge.target]
      if (!sourceId || !targetId) continue

      try {
        await db.knowledgeEdge.create({
          data: {
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            relationship: edge.rel,
            strength: edge.strength,
          },
        })
        edgeCount++
      } catch {
        // Skip duplicate edges
      }
    }
    results.knowledgeEdges = edgeCount

    // ── 4. Sprints ──────────────────────────────────────────────────────
    const sprintData = [
      {
        number: 23, goal: '+8 AI Visibility', metric: 'ai_visibility', target: 58, current: 50,
        status: 'completed', executed: 7, total: 7,
        plan: { articles: 2, faqs: 2, schemas: 1, links: 5, fixes: 1 },
        actions: [
          { action: 'Publish "Entity SEO Guide"', type: 'content', estimatedImpact: '+4 AI Visibility', effort: '30 min', order: 1 },
          { action: 'Add FAQ schema to top articles', type: 'schema', estimatedImpact: '+2 AI Visibility', effort: '15 min', order: 2 },
          { action: 'Fix robots.txt for AI crawlers', type: 'technical', estimatedImpact: '+3 AI Visibility', effort: '10 min', order: 3 },
        ],
        result: { goalMet: true, delta: 9, startValue: 50, endValue: 59 },
      },
      {
        number: 24, goal: '+5 Citations', metric: 'citations', target: 25, current: 20,
        status: 'completed', executed: 5, total: 5,
        plan: { articles: 1, faqs: 1, schemas: 1, links: 3, fixes: 0 },
        actions: [
          { action: 'Add citation sources to key articles', type: 'citation', estimatedImpact: '+3 citations', effort: '20 min', order: 1 },
          { action: 'Update llms.txt with entities', type: 'technical', estimatedImpact: '+2 citations', effort: '10 min', order: 2 },
        ],
        result: { goalMet: true, delta: 6, startValue: 20, endValue: 26 },
      },
      {
        number: 25, goal: '+10 AI Visibility', metric: 'ai_visibility', target: 72, current: 62,
        status: 'active', executed: 3, total: 7,
        plan: { articles: 3, faqs: 2, schemas: 1, links: 5, fixes: 1, entities: 1 },
        actions: [
          { action: 'Publish "Claude SEO Optimization Guide"', type: 'content', estimatedImpact: '+4 AI Visibility', effort: '30 min', order: 1 },
          { action: 'Publish "AI Visibility for Dentists"', type: 'content', estimatedImpact: '+3 AI Visibility', effort: '30 min', order: 2 },
          { action: 'Create entity page for Seosights', type: 'entity', estimatedImpact: '+2 AI Visibility', effort: '60 min', order: 3 },
          { action: 'Add FAQ schema to pillar pages', type: 'schema', estimatedImpact: '+2 AI Visibility', effort: '15 min', order: 4 },
          { action: 'Build internal links for topic clusters', type: 'link', estimatedImpact: '+2 AI Visibility', effort: '20 min', order: 5 },
          { action: 'Update llms.txt with all content', type: 'technical', estimatedImpact: '+1 AI Visibility', effort: '10 min', order: 6 },
          { action: 'Create Wikipedia citation source', type: 'entity', estimatedImpact: '+3 AI Visibility', effort: '60 min', order: 7 },
        ],
        result: null,
      },
      {
        number: 26, goal: '+12 AI Visibility', metric: 'ai_visibility', target: 84, current: 72,
        status: 'planning', executed: 0, total: 8,
        plan: { articles: 3, faqs: 2, schemas: 2, links: 8, fixes: 2, entities: 2 },
        actions: [
          { action: 'Publish "GEO vs AEO Comparison Guide"', type: 'content', estimatedImpact: '+4 AI Visibility', effort: '30 min', order: 1 },
          { action: 'Publish "Self-Optimizing Blog Guide"', type: 'content', estimatedImpact: '+3 AI Visibility', effort: '30 min', order: 2 },
          { action: 'Publish "Knowledge Graph for SEO"', type: 'content', estimatedImpact: '+3 AI Visibility', effort: '30 min', order: 3 },
          { action: 'Create Seosights Crunchbase entry', type: 'entity', estimatedImpact: '+2 AI Visibility', effort: '60 min', order: 4 },
        ],
        result: null,
      },
    ]

    let sprintCount = 0
    for (const s of sprintData) {
      const startedAt = s.status !== 'planning' ? new Date(Date.now() - (s.status === 'completed' ? 30 : 7) * 24 * 60 * 60 * 1000) : null
      const endsAt = new Date(Date.now() + (s.status === 'planning' ? 14 : s.status === 'active' ? 7 : 0) * 24 * 60 * 60 * 1000)

      await db.sprint.create({
        data: {
          domain,
          sprintNumber: s.number,
          goal: s.goal,
          goalMetric: s.metric,
          goalTarget: s.target,
          currentValue: s.current,
          status: s.status,
          aiPlan: JSON.stringify(s.plan),
          plannedActions: JSON.stringify(s.actions),
          executedActions: s.executed,
          totalActions: s.total,
          resultSummary: s.result ? JSON.stringify(s.result) : null,
          startedAt,
          endsAt,
        },
      })
      sprintCount++
    }
    results.sprints = sprintCount

    // ── 5. ArticleROI ────────────────────────────────────────────────────
    // Get existing articles to attach ROI data
    const existingArticles = await db.contentArticle.findMany({
      where: { domain },
      select: { id: true },
      take: 15,
    })

    let roiCount = 0
    for (const article of existingArticles) {
      const totalCost = Math.round((0.05 + Math.random() * 0.3) * 100) / 100
      const revenue = Math.round((Math.random() * 200 + 10) * 100) / 100
      const visBefore = Math.floor(Math.random() * 40) + 30
      const visDelta = Math.floor(Math.random() * 15) + 1
      const citations = Math.floor(Math.random() * 8)
      const leads = Math.floor(Math.random() * 5)
      const organic = Math.floor(Math.random() * 300) + 10

      await db.articleROI.create({
        data: {
          articleId: article.id,
          domain,
          writingCostUsd: Math.round((totalCost * 0.5) * 100) / 100,
          reviewCostUsd: Math.round((totalCost * 0.5) * 100) / 100,
          totalCostUsd: totalCost,
          writingTimeMinutes: Math.floor(Math.random() * 45) + 5,
          visibilityBefore: visBefore,
          visibilityAfter: visBefore + visDelta,
          visibilityDelta: visDelta,
          citationsGained: citations,
          organicClicks: organic,
          leadsGenerated: leads,
          revenueAttributed: revenue,
          roi: totalCost > 0 ? Math.round(((revenue - totalCost) / totalCost) * 100) / 100 : 0,
          costPerCitation: citations > 0 ? Math.round((totalCost / citations) * 100) / 100 : 0,
          costPerLead: leads > 0 ? Math.round((totalCost / leads) * 100) / 100 : 0,
          measuredAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        },
      })
      roiCount++
    }
    results.articleROI = roiCount

    // ── 6. AIDailyRecommendation ─────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const recommendations = [
      { priority: 1, category: 'content', rec: 'Publish article on "Claude SEO Optimization Strategies"', rationale: 'Claude is the fastest-growing AI engine; no coverage exists', evidence: 'Based on 42 article actions with avg +5.2 visibility gain', confidence: 88, impact: '+5 AI Visibility', effort: 30, status: 'pending' },
      { priority: 2, category: 'schema', rec: 'Add FAQPage schema to top 5 articles', rationale: 'FAQ schema is the highest-confidence AEO win', evidence: '82% confidence across 28 FAQ actions, avg +3.1 visibility', confidence: 82, impact: '+3 AI Visibility', effort: 15, status: 'pending' },
      { priority: 3, category: 'entity', rec: 'Create Seosights Wikipedia citation source', rationale: 'Wikipedia citation is the #1 missing authority signal', evidence: 'Knowledge graph shows "Wikipedia page missing" as high-priority gap', confidence: 75, impact: '+4 AI Visibility', effort: 60, status: 'pending' },
      { priority: 4, category: 'technical', rec: 'Update llms.txt with latest 10 articles and entity definitions', rationale: 'llms.txt is the primary discovery mechanism for AI crawlers', evidence: '74% confidence, +3.0 avg visibility from llms.txt updates', confidence: 74, impact: '+2 AI Visibility', effort: 10, status: 'pending' },
      { priority: 5, category: 'link', rec: 'Build 8 internal links between topic cluster articles', rationale: 'Internal linking distributes authority to new content', evidence: '68% confidence, +1.5 avg visibility from link building', confidence: 68, impact: '+2 AI Visibility', effort: 20, status: 'pending' },
      // Yesterday's completed recommendations
      { priority: 1, category: 'content', rec: 'Publish "Entity SEO for AI Engines" guide', rationale: 'Entity SEO is the strongest content pillar with no dedicated guide', evidence: '79% confidence for entity creation actions', confidence: 79, impact: '+6 AI Visibility', effort: 30, status: 'completed', executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), resultNote: 'Published successfully, initial +3 visibility measured' },
      { priority: 2, category: 'schema', rec: 'Add Article schema to all blog posts', rationale: 'Article schema enables rich snippets in AI responses', evidence: '78% confidence across 22 schema actions', confidence: 78, impact: '+2 AI Visibility', effort: 20, status: 'completed', executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), resultNote: 'Schema added to 12 articles' },
    ]

    let recCount = 0
    for (const r of recommendations) {
      await db.aIDailyRecommendation.create({
        data: {
          domain,
          date: r.status === 'completed' ? new Date(Date.now() - 24 * 60 * 60 * 1000) : today,
          priority: r.priority,
          category: r.category,
          recommendation: r.rec,
          rationale: r.rationale,
          evidenceSummary: r.evidence,
          confidence: r.confidence,
          estimatedImpact: r.impact,
          effortMinutes: r.effort,
          status: r.status,
          executedAt: r.executedAt ? new Date(r.executedAt) : null,
          resultNote: r.resultNote || null,
        },
      })
      recCount++
    }
    results.dailyRecommendations = recCount

    // ── 7. Visibility Snapshots (for timeline) ──────────────────────────
    let snapshotCount = 0
    for (let i = 0; i < 26; i++) { // Weekly snapshots for 6 months
      const date = new Date()
      date.setDate(date.getDate() - (26 - i) * 7)
      date.setHours(12, 0, 0, 0)

      // Simulate gradual improvement from ~35 to ~72
      const baseScore = 35 + Math.round((i / 26) * 37)
      const variance = Math.floor(Math.random() * 8) - 3

      await db.visibilitySnapshot.create({
        data: {
          domain,
          overallScore: Math.max(20, Math.min(95, baseScore + variance)),
          trustScore: Math.max(20, baseScore - 5 + Math.floor(Math.random() * 10)),
          freshnessScore: Math.max(20, baseScore + Math.floor(Math.random() * 15) - 5),
          authorityScore: Math.max(20, baseScore - 10 + Math.floor(Math.random() * 15)),
          perEngine: JSON.stringify({
            chatgpt: Math.max(20, baseScore + Math.floor(Math.random() * 10) - 3),
            claude: Math.max(20, baseScore + Math.floor(Math.random() * 15) - 5),
            gemini: Math.max(20, baseScore + Math.floor(Math.random() * 12) - 4),
            perplexity: Math.max(20, baseScore + Math.floor(Math.random() * 10) + 5),
            copilot: Math.max(20, baseScore - 5 + Math.floor(Math.random() * 10)),
          }),
          dataSource: 'estimated',
          capturedAt: date,
        },
      })
      snapshotCount++
    }
    results.visibilitySnapshots = snapshotCount

    return NextResponse.json({
      message: 'Learning System seeded successfully',
      results,
    }, { status: 201 })
  } catch (error) {
    console.error('[Learning Seed] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to seed learning system data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
