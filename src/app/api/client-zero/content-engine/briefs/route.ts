import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper: Generate outline from keyword
function generateOutline(keyword: string, contentType: string): Array<{ h2: string; h3s: string[]; points: string[] }> {
  const baseOutline: Array<{ h2: string; h3s: string[]; points: string[] }> = [
    {
      h2: `What Is ${keyword}?`,
      h3s: ['Definition and Core Concepts', 'Why It Matters in 2025'],
      points: ['Clear, authoritative definition', 'Current market context and trends'],
    },
    {
      h2: `How ${keyword} Works`,
      h3s: ['The Mechanics Behind It', 'Key Components and Framework'],
      points: ['Step-by-step process explanation', 'Essential elements that drive results'],
    },
    {
      h2: `${keyword} Best Practices`,
      h3s: ['Proven Strategies', 'Common Mistakes to Avoid'],
      points: ['Data-backed strategies with examples', 'Pitfalls that reduce effectiveness'],
    },
    {
      h2: `${keyword} Tools and Platforms`,
      h3s: ['Top Solutions Compared', 'How to Choose the Right Tool'],
      points: ['Feature comparison matrix', 'Decision framework for selection'],
    },
    {
      h2: `${keyword} ROI and Measurement`,
      h3s: ['Key Metrics to Track', 'Calculating Return on Investment'],
      points: ['KPIs that matter most', 'ROI formula and benchmark data'],
    },
    {
      h2: `The Future of ${keyword}`,
      h3s: ['Emerging Trends', 'Predictions for 2026 and Beyond'],
      points: ['AI-driven evolution', 'Industry expert predictions'],
    },
  ]

  if (contentType === 'vs_page') {
    return [
      { h2: 'Quick Comparison', h3s: ['At a Glance', 'Key Differences'], points: ['Side-by-side feature table', 'Pricing comparison'] },
      { h2: 'Feature Deep Dive', h3s: ['AI Visibility Features', 'Reporting and Analytics'], points: ['Head-to-head feature analysis', 'Accuracy and coverage comparison'] },
      { h2: 'Pricing and Plans', h3s: ['Starter Plans', 'Enterprise Plans'], points: ['Value per dollar analysis', 'Hidden costs to watch'] },
      { h2: 'User Reviews and Ratings', h3s: ['Pros and Cons'], points: ['Verified user feedback', 'Common complaints'] },
      { h2: 'Final Verdict', h3s: ['Who Should Choose Each'], points: ['Recommendation by use case', 'Bottom line'] },
    ]
  }

  if (contentType === 'docs') {
    return [
      { h2: 'Overview', h3s: [], points: ['Technical overview and architecture'] },
      { h2: 'Getting Started', h3s: ['Prerequisites', 'Installation'], points: ['System requirements', 'Quick start guide'] },
      { h2: 'Configuration', h3s: ['Basic Settings', 'Advanced Options'], points: ['Configuration file reference', 'Environment variables'] },
      { h2: 'API Reference', h3s: ['Endpoints', 'Authentication'], points: ['Full endpoint documentation', 'Auth flow explanation'] },
      { h2: 'Troubleshooting', h3s: ['Common Issues', 'Error Codes'], points: ['Solutions to frequent problems', 'Error code reference table'] },
    ]
  }

  return baseOutline
}

// Helper: Generate secondary keywords
function generateSecondaryKeywords(keyword: string): string[] {
  const lower = keyword.toLowerCase()
  const secondaries: string[] = []

  secondaries.push(`${lower} guide`)
  secondaries.push(`${lower} best practices`)
  secondaries.push(`how to ${lower}`)
  secondaries.push(`${lower} tools`)
  secondaries.push(`${lower} strategy`)
  secondaries.push(`${lower} 2025`)
  secondaries.push(`${lower} vs alternatives`)
  secondaries.push(`${lower} for small business`)

  return secondaries
}

// Helper: Generate entity targets for AEO/GEO
function generateEntityTargets(keyword: string): Array<{ entity: string; type: string; reason: string }> {
  return [
    { entity: keyword, type: 'Topic', reason: 'Primary topic entity for knowledge graph alignment' },
    { entity: 'Search Engine Optimization', type: 'Concept', reason: 'Broader category for entity linking' },
    { entity: 'Artificial Intelligence', type: 'Technology', reason: 'AI is core to the subject matter' },
    { entity: 'ChatGPT', type: 'SoftwareApplication', reason: 'Major AI engine reference for citation' },
    { entity: 'Claude (language model)', type: 'SoftwareApplication', reason: 'Key AI engine for AEO targeting' },
    { entity: 'Google Gemini', type: 'SoftwareApplication', reason: 'Third major AI engine reference' },
    { entity: 'Digital Marketing', type: 'Industry', reason: 'Industry context for entity association' },
    { entity: 'Content Marketing', type: 'Strategy', reason: 'Content strategy entity connection' },
  ]
}

// GET /api/client-zero/content-engine/briefs
// List all content briefs with pagination, filtering by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const [briefs, total] = await Promise.all([
      db.contentBrief.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          articles: {
            select: { id: true, title: true, status: true, version: true },
          },
        },
      }),
      db.contentBrief.count({ where }),
    ])

    // If no briefs exist, return seed data
    if (briefs.length === 0 && !status) {
      const seedBriefs = [
        {
          id: 'seed-brief-1',
          opportunitySource: 'opportunity_queue',
          targetKeyword: 'AI Visibility for Dentists',
          secondaryKeywords: JSON.stringify(['ai visibility dentist guide', 'chatgpt dental seo', 'claude dentist citations', 'ai visibility dentist best practices', 'how to ai visibility dentist', 'ai visibility dentist tools', 'ai visibility dentist strategy', 'ai visibility dentist 2025']),
          estimatedScoreGain: 6,
          contentTypeId: 'blog',
          contentTypeLabel: 'Blog Article',
          targetEngines: JSON.stringify(['chatgpt', 'claude', 'gemini']),
          targetWordCount: 2500,
          dataSourcesUsed: JSON.stringify([{ source: 'ai_visibility_dataset', ref: 'dental-queries-2025' }]),
          outline: JSON.stringify(generateOutline('AI Visibility for Dentists', 'blog')),
          entityTargets: JSON.stringify(generateEntityTargets('AI Visibility for Dentists')),
          status: 'approved',
          priority: 'high',
          scheduledDate: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          articles: [],
        },
        {
          id: 'seed-brief-2',
          opportunitySource: 'ai_visibility_gap',
          targetKeyword: 'How to Get Cited by ChatGPT',
          secondaryKeywords: JSON.stringify(['chatgpt citation guide', 'how to get cited by chatgpt best practices', 'how to get cited by chatgpt tools', 'how to get cited by chatgpt strategy']),
          estimatedScoreGain: 8,
          contentTypeId: 'blog',
          contentTypeLabel: 'Blog Article',
          targetEngines: JSON.stringify(['chatgpt']),
          targetWordCount: 3000,
          dataSourcesUsed: JSON.stringify([{ source: 'ai_visibility_dataset', ref: 'citation-patterns' }]),
          outline: JSON.stringify(generateOutline('How to Get Cited by ChatGPT', 'blog')),
          entityTargets: JSON.stringify(generateEntityTargets('How to Get Cited by ChatGPT')),
          status: 'draft',
          priority: 'critical',
          scheduledDate: null,
          approvedAt: null,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          articles: [],
        },
        {
          id: 'seed-brief-3',
          opportunitySource: 'industry_benchmark',
          targetKeyword: 'SeoSights vs Surfer SEO',
          secondaryKeywords: JSON.stringify(['seosights vs surfer seo guide', 'seosights vs surfer seo comparison']),
          estimatedScoreGain: 7,
          contentTypeId: 'vs_page',
          contentTypeLabel: 'VS Page',
          targetEngines: JSON.stringify(['chatgpt', 'claude', 'gemini']),
          targetWordCount: 2000,
          dataSourcesUsed: JSON.stringify([{ source: 'competitor_analysis', ref: 'surfer-seo-comparison' }]),
          outline: JSON.stringify(generateOutline('SeoSights vs Surfer SEO', 'vs_page')),
          entityTargets: JSON.stringify(generateEntityTargets('SeoSights vs Surfer SEO')),
          status: 'approved',
          priority: 'high',
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
          approvedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date().toISOString(),
          articles: [],
        },
      ]

      return NextResponse.json({
        briefs: seedBriefs,
        total: seedBriefs.length,
        page,
        limit,
        totalPages: 1,
      })
    }

    return NextResponse.json({
      briefs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[content-engine/briefs GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch briefs' },
      { status: 500 }
    )
  }
}

// POST /api/client-zero/content-engine/briefs
// Create a new content brief from an opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, opportunitySource, contentTypeId, estimatedScoreGain } = body as {
      keyword: string
      opportunitySource: string
      contentTypeId?: string
      estimatedScoreGain?: number
    }

    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword is required' },
        { status: 400 }
      )
    }

    const contentType = contentTypeId || 'blog'
    const contentTypeLabels: Record<string, string> = {
      blog: 'Blog Article',
      programmatic: 'Programmatic Page',
      case_study: 'Case Study',
      linkedin: 'LinkedIn Post',
      twitter_thread: 'Twitter Thread',
      newsletter: 'Newsletter',
      docs: 'Documentation',
      vs_page: 'VS Page',
    }
    const contentTypeLabel = contentTypeLabels[contentType] || 'Blog Article'

    const outline = generateOutline(keyword, contentType)
    const secondaryKeywords = generateSecondaryKeywords(keyword)
    const entityTargets = generateEntityTargets(keyword)

    const targetWordCounts: Record<string, number> = {
      blog: 2500,
      programmatic: 800,
      case_study: 2000,
      linkedin: 500,
      twitter_thread: 600,
      newsletter: 400,
      docs: 1500,
      vs_page: 2000,
    }

    const brief = await db.contentBrief.create({
      data: {
        opportunitySource: opportunitySource || 'manual',
        targetKeyword: keyword,
        secondaryKeywords: JSON.stringify(secondaryKeywords),
        estimatedScoreGain: estimatedScoreGain || 5,
        contentTypeId: contentType,
        contentTypeLabel,
        targetEngines: JSON.stringify(['chatgpt', 'claude', 'gemini']),
        targetWordCount: targetWordCounts[contentType] || 2500,
        dataSourcesUsed: JSON.stringify([
          { source: 'ai_visibility_dataset', ref: 'auto-generated' },
          { source: 'opportunity_queue', ref: keyword },
        ]),
        outline: JSON.stringify(outline),
        entityTargets: JSON.stringify(entityTargets),
        status: 'draft',
        priority: (estimatedScoreGain || 5) >= 7 ? 'high' : (estimatedScoreGain || 5) >= 4 ? 'medium' : 'low',
      },
    })

    return NextResponse.json({
      brief: {
        ...brief,
        secondaryKeywords: JSON.parse(brief.secondaryKeywords || '[]'),
        outline: JSON.parse(brief.outline || '[]'),
        entityTargets: JSON.parse(brief.entityTargets || '[]'),
        targetEngines: JSON.parse(brief.targetEngines || '[]'),
        dataSourcesUsed: JSON.parse(brief.dataSourcesUsed || '[]'),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[content-engine/briefs POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create brief' },
      { status: 500 }
    )
  }
}
