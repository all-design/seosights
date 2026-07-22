/**
 * Content Engine — Briefs
 *
 * GET  /api/content-engine/briefs   — List all briefs with filtering
 * POST /api/content-engine/briefs   — Create a new brief from a topic/opportunity
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateBriefBody {
  topic: string
  keywordTarget: string
  pillar: string
  cluster?: string
  suggestedTitle: string
  targetWordCount?: number
  estimatedScoreGain?: number
  opportunitySource?: string
  opportunityData?: string
}

// ── GET: List all briefs ──────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const status = searchParams.get('status') || undefined
    const pillar = searchParams.get('pillar') || undefined
    const priority = searchParams.get('priority') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { domain }
    if (status) where.status = status
    if (pillar) where.pillar = pillar
    if (priority) where.priority = priority

    const [briefs, total] = await Promise.all([
      db.contentBrief.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          _count: { select: { articles: true } },
        },
      }),
      db.contentBrief.count({ where }),
    ])

    return NextResponse.json({ briefs, total })
  } catch (error) {
    console.error('[Content Engine Briefs] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list briefs' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new brief ──────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBriefBody

    if (!body.topic || !body.keywordTarget || !body.suggestedTitle) {
      return NextResponse.json(
        { error: 'topic, keywordTarget, and suggestedTitle are required' },
        { status: 400 }
      )
    }

    const validPillars = ['seo', 'aeo', 'geo', 'all']
    if (body.pillar && !validPillars.includes(body.pillar)) {
      return NextResponse.json(
        { error: 'pillar must be one of: seo, aeo, geo, all' },
        { status: 400 }
      )
    }

    // Generate structured editorial brief using AI
    const briefPrompt = `You are an expert SEO/AEO/GEO content strategist. Generate a detailed editorial brief for the following content piece:

**Topic:** ${body.topic}
**Target Keyword:** ${body.keywordTarget}
**Suggested Title:** ${body.suggestedTitle}
**Content Pillar:** ${body.pillar || 'geo'}
**Cluster:** ${body.cluster || 'General'}
**Target Word Count:** ${body.targetWordCount || 2500}

Return a JSON object with these fields (and ONLY a valid JSON object, no markdown):
{
  "outline": [
    { "heading": "H2 Title", "subheadings": ["H3 Subtitle 1", "H3 Subtitle 2"], "wordCount": 300 }
  ],
  "entities": ["Entity1", "Entity2"],
  "faqSuggestions": [
    { "question": "FAQ question?", "answerOutline": "Brief outline of answer" }
  ],
  "internalLinkSuggestions": [
    { "anchorText": "Link text", "suggestedPath": "/suggested/url-path", "reason": "Why this link is relevant" }
  ],
  "schemaRecommendations": ["Article", "FAQPage", "HowTo"],
  "aeoOptimizations": ["Optimization tip 1", "Optimization tip 2"],
  "geoOptimizations": ["GEO tip 1", "GEO tip 2"],
  "targetAudience": "Description of target audience",
  "searchIntent": "informational|transactional|navigational|commercial",
  "competitorGaps": ["Gap 1", "Gap 2"],
  "llmsTxtConsiderations": "How to optimize for llms.txt visibility"
}`

    let briefContent: string
    try {
      const aiResult = await routeLLM([
        { role: 'system', content: 'You are a senior content strategist specializing in SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization). Always respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: briefPrompt },
      ], { taskType: 'summarization', temperature: 0.7 })

      // Try to parse and re-serialize to ensure valid JSON
      const parsed = JSON.parse(aiResult.content)
      briefContent = JSON.stringify(parsed)
    } catch (aiError) {
      console.warn('[Content Engine Briefs] AI brief generation failed, using fallback:', aiError)
      briefContent = JSON.stringify({
        outline: [
          { heading: `Introduction to ${body.topic}`, subheadings: ['Why this matters in 2025'], wordCount: 300 },
          { heading: 'Core Concepts', subheadings: ['Definition', 'Key Principles'], wordCount: 500 },
          { heading: 'Implementation Guide', subheadings: ['Step-by-step process', 'Best practices'], wordCount: 700 },
          { heading: 'Advanced Strategies', subheadings: ['Pro tips', 'Common pitfalls'], wordCount: 500 },
          { heading: 'FAQ', subheadings: [], wordCount: 300 },
          { heading: 'Conclusion', subheadings: ['Key takeaways', 'Next steps'], wordCount: 200 },
        ],
        entities: [body.keywordTarget, body.topic],
        faqSuggestions: [
          { question: `What is ${body.keywordTarget}?`, answerOutline: 'Define and explain the core concept' },
          { question: `How does ${body.keywordTarget} work?`, answerOutline: 'Explain the mechanism and process' },
        ],
        internalLinkSuggestions: [
          { anchorText: body.keywordTarget, suggestedPath: `/blog/${body.keywordTarget.replace(/\s+/g, '-')}`, reason: 'Primary keyword target' },
        ],
        schemaRecommendations: ['Article', 'FAQPage'],
        aeoOptimizations: ['Use question-based headings', 'Include concise answer blocks'],
        geoOptimizations: ['Optimize entity mentions', 'Include structured data'],
        targetAudience: 'SEO professionals and digital marketers',
        searchIntent: 'informational',
        competitorGaps: [],
        llmsTxtConsiderations: 'Ensure key entities and definitions are clearly stated',
      })
    }

    const brief = await db.contentBrief.create({
      data: {
        domain: DEFAULT_DOMAIN,
        topic: body.topic,
        keywordTarget: body.keywordTarget,
        pillar: body.pillar || 'geo',
        cluster: body.cluster || null,
        suggestedTitle: body.suggestedTitle,
        targetWordCount: body.targetWordCount || 2500,
        estimatedScoreGain: body.estimatedScoreGain || 0,
        opportunitySource: body.opportunitySource || null,
        opportunityData: body.opportunityData || null,
        briefContent,
        status: 'draft',
        priority: 'medium',
      },
    })

    return NextResponse.json({ brief }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Briefs] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create brief' },
      { status: 500 }
    )
  }
}
