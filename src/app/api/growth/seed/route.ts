/**
 * Growth Engine — Seed Database
 *
 * POST /api/growth/seed
 * Seeds the database with realistic demo data for the AGE dashboard.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randomInt(6, 18), randomInt(0, 59), randomInt(0, 59), 0)
  return d
}

function hoursAgo(n: number): Date {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d
}

// ── Data Pools ────────────────────────────────────────────────────────────────

const TYPES = [
  'blog', 'tool', 'industry', 'vs', 'benchmark', 'research',
  'resource', 'faq', 'entity', 'company', 'api_doc', 'case_study',
  'landing', 'knowledge_graph',
] as const

const SOURCES = [
  'observatory', 'gsc', 'bing', 'trends', 'keyword_cluster',
  'competitor', 'internal_search', 'ai_models', 'directory_gap',
  'industry_gap', 'vs_gap', 'broken_link', 'new_entity', 'citation_shift',
] as const

const STATUSES = [
  'discovered', 'scored', 'queued', 'generating', 'reviewing',
  'approved', 'published', 'rejected', 'archived',
] as const

const PRIORITIES = ['p1', 'p2', 'p3', 'p4'] as const

const REVIEW_STATUSES = ['pending', 'reviewing', 'approved', 'rejected', 'needs_revision'] as const
const EXECUTION_STATUSES = ['pending', 'publishing', 'indexed', 'failed'] as const

const OPPORTUNITY_TITLES: Record<string, string[]> = {
  blog: [
    'AI Visibility for Dentists: Complete Guide',
    'How Plumbers Can Rank in AI Overviews',
    'The Future of Local SEO in AI Search',
    'Understanding GEO: Generative Engine Optimization',
    'AI Citation Strategies for SaaS Companies',
    'Why Your Business Isn\'t Showing in ChatGPT',
    'The Complete Guide to AI Search Optimization',
    'How Real Estate Agents Can Dominate AI Search',
    'Law Firm SEO in the Age of AI Assistants',
    'E-commerce Brands: Getting Featured in AI Answers',
  ],
  tool: [
    'AI Visibility Score Calculator',
    'Citation Tracker Pro',
    'Entity Relationship Mapper',
    'Prompt Rank Monitor',
    'Competitor AI Footprint Analyzer',
  ],
  industry: [
    'Dental AI Visibility Benchmark 2025',
    'Legal Industry AI Citation Report',
    'Healthcare AI Search Trends',
    'Real Estate AI Overview Analysis',
    'Financial Services AI Presence Report',
  ],
  vs: [
    'SeoSights vs Semrush: AI Visibility Comparison',
    'SeoSights vs Ahrefs: Citation Tracking',
    'GEO vs Traditional SEO: What Works in 2025',
    'ChatGPT vs Perplexity: Citation Patterns',
    'Surfer SEO vs SeoSights: Feature Comparison',
  ],
  benchmark: [
    'AI Visibility Benchmark: Top 100 SaaS Companies',
    'Citation Velocity Benchmark by Industry',
    'AI Search Market Share Report Q1 2025',
    'Entity Coverage Benchmark: Healthcare',
  ],
  research: [
    'How AI Models Choose Which Sources to Cite',
    'The Impact of Schema Markup on AI Citations',
    'Entity Authority: A New Ranking Factor',
    'Knowledge Graph Influence on AI Answers',
  ],
  faq: [
    'What is AI Visibility Score?',
    'How Does GEO Differ from SEO?',
    'Why Is My Business Not in AI Overviews?',
    'How to Track AI Citations?',
    'What Entities Should I Build?',
  ],
  entity: [
    'SeoSights Entity Profile',
    'AI Visibility Entity Hub',
    'GEO Entity Knowledge Graph',
  ],
  resource: [
    'AI Search Optimization Checklist',
    'Entity Building Template',
    'Citation Tracking Spreadsheet',
  ],
  company: [
    'Competitor Analysis: SearchAI Inc.',
    'Competitor Analysis: RankZero',
    'Competitor Analysis: AIOverview Pro',
  ],
  case_study: [
    'How Dr. Smith Increased AI Visibility by 340%',
    'Case Study: Law Firm AI Citation Growth',
    'SaaS Startup: From 0 to 50 AI Citations in 90 Days',
  ],
  landing: [
    'AI Visibility Platform for Agencies',
    'Enterprise AI Search Monitoring',
    'Free AI Visibility Audit',
  ],
  knowledge_graph: [
    'AI Search Knowledge Graph Expansion',
    'Entity Relationship Mapping for Dentists',
  ],
  api_doc: [
    'AI Visibility API Documentation',
    'Citation Webhook Integration Guide',
  ],
}

const GOVERNOR_REASONS = [
  'duplicate', 'too_similar', 'low_quality', 'low_confidence',
  'already_covered', 'low_evidence', 'off_brand', 'manual_override',
] as const

const GOVERNOR_DECISIONS = ['approved', 'rejected', 'deferred', 'needs_review'] as const

const ENGINE_NAMES = [
  'discovery', 'scoring', 'generation', 'review',
  'publishing', 'replay', 'learning', 'pruning', 'observatory',
] as const

const PRUNING_REASONS = [
  'low_traffic', 'low_citations', 'negative_trend', 'duplicate', 'outdated',
] as const

const PRUNING_ACTIONS = [
  'rewrite', 'merge', 'redirect', 'archive', 'delete',
] as const

// ── POST: Seed data ───────────────────────────────────────────────────────────

export async function POST() {
  try {
    const results: Record<string, number> = {}

    // ── 1. GrowthOpportunity (30+) ───────────────────────────────────────
    const opportunities = []
    let slugCounter = 0

    for (const type of TYPES) {
      const titles = OPPORTUNITY_TITLES[type] || [`${type} opportunity`]
      for (const title of titles) {
        slugCounter++
        const status = randomFrom([...STATUSES])
        const source = randomFrom([...SOURCES])
        const priority = randomFrom([...PRIORITIES])

        const seoScore = randomInt(30, 95)
        const aiVisibilityScore = randomInt(25, 90)
        const businessScore = randomInt(20, 85)
        const noveltyScore = randomInt(15, 80)
        const competitionScore = randomInt(10, 75)
        const implementationCost = randomInt(5, 60)
        const expectedROI = randomInt(20, 90)
        const growthScore = Math.round(
          (seoScore * 0.2 +
            aiVisibilityScore * 0.25 +
            businessScore * 0.2 +
            noveltyScore * 0.1 +
            (100 - competitionScore) * 0.1 +
            expectedROI * 0.15)
        )

        const discoveredAt = daysAgo(randomInt(0, 14))
        const scoredAt = status !== 'discovered' ? new Date(discoveredAt.getTime() + randomInt(1, 4) * 3600000) : null
        const queuedAt = ['queued', 'generating', 'reviewing', 'approved', 'published'].includes(status)
          ? new Date((scoredAt || discoveredAt).getTime() + randomInt(1, 8) * 3600000)
          : null
        const startedAt = ['generating', 'reviewing', 'approved', 'published'].includes(status)
          ? new Date((queuedAt || scoredAt || discoveredAt).getTime() + randomInt(1, 6) * 3600000)
          : null
        const completedAt = ['published', 'rejected', 'archived'].includes(status)
          ? new Date((startedAt || queuedAt || discoveredAt).getTime() + randomInt(2, 48) * 3600000)
          : null

        const opportunity = await db.growthOpportunity.create({
          data: {
            title,
            description: `Discovered via ${source}: ${title} represents a high-value content opportunity targeting emerging AI search trends.`,
            type,
            source,
            sourceDetails: JSON.stringify({ engine: source, confidence: randomFloat(0.5, 0.95), dataPoints: randomInt(3, 25) }),
            seoScore,
            aiVisibilityScore,
            businessScore,
            noveltyScore,
            competitionScore,
            implementationCost,
            expectedROI,
            growthScore,
            confidence: randomFloat(0.4, 0.95),
            targetKeywords: JSON.stringify([title.toLowerCase().split(' ').slice(0, 4).join(' '), `${type} ${source}`]),
            targetEntities: JSON.stringify([title.split(' ').slice(0, 2).join(' ')]),
            relatedExisting: JSON.stringify([]),
            status,
            priority,
            scheduledAt: status === 'queued' ? hoursAgo(randomInt(1, 12)) : null,
            discoveredAt,
            scoredAt,
            queuedAt,
            startedAt,
            completedAt,
          },
        })
        opportunities.push(opportunity)
      }
    }
    results.opportunities = opportunities.length

    // ── 2. GrowthAsset (20+) ─────────────────────────────────────────────
    const assets = []
    const publishedOpps = opportunities.filter((o) =>
      ['reviewing', 'approved', 'published', 'rejected', 'archived'].includes(o.status)
    )

    for (let i = 0; i < 24; i++) {
      const opp = publishedOpps[i % publishedOpps.length]
      const assetType = opp ? opp.type : randomFrom([...TYPES])
      const title = opp ? opp.title : `Asset ${i + 1}`
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${slugCounter + i}`

      const reviewStatus = opp?.status === 'published'
        ? randomFrom(['approved', 'approved', 'approved', 'needs_revision'])
        : opp?.status === 'rejected'
        ? 'rejected'
        : randomFrom([...REVIEW_STATUSES])

      const executionStatus = opp?.status === 'published'
        ? randomFrom(['indexed', 'indexed', 'indexed', 'pending'])
        : reviewStatus === 'approved'
        ? randomFrom(['pending', 'publishing', 'indexed'])
        : 'pending'

      const qualityScore = reviewStatus === 'approved'
        ? randomInt(70, 98)
        : reviewStatus === 'rejected'
        ? randomInt(15, 55)
        : randomInt(30, 80)

      const publishedAt = executionStatus === 'indexed'
        ? daysAgo(randomInt(0, 10))
        : null

      const asset = await db.growthAsset.create({
        data: {
          opportunityId: opp?.id || null,
          title,
          slug,
          type: assetType,
          content: `# ${title}\n\nThis is generated content for ${title}. It covers key topics related to AI visibility and search optimization.\n\n## Key Insights\n\n- AI search is transforming how businesses get found online\n- Entity building is critical for AI citations\n- Schema markup improves AI visibility by up to 40%\n\n## Conclusion\n\nOptimizing for AI search requires a different approach than traditional SEO.`,
          metaDescription: `${title} - Discover how to improve your AI visibility and search presence with actionable strategies.`,
          schemaMarkup: JSON.stringify({ '@type': 'Article', name: title }),
          internalLinks: JSON.stringify([
            { anchorText: 'AI Visibility', path: '/ai-visibility' },
            { anchorText: 'GEO Guide', path: '/geo-guide' },
          ]),
          reviewStatus,
          reviewScores: JSON.stringify({
            seo: randomInt(60, 95),
            aeo: randomInt(50, 90),
            geo: randomInt(55, 92),
            quality: qualityScore,
            readability: randomInt(65, 95),
          }),
          reviewNotes: reviewStatus === 'needs_revision' ? 'Consider adding more specific examples and data points.' : null,
          qualityScore,
          executionStatus,
          publishedUrl: executionStatus === 'indexed' ? `https://seosights.com/${slug}` : null,
          publishedAt,
          traffic24h: executionStatus === 'indexed' ? randomInt(5, 450) : 0,
          impressions24h: executionStatus === 'indexed' ? randomInt(50, 3000) : 0,
          clicks24h: executionStatus === 'indexed' ? randomInt(2, 180) : 0,
          citations7d: executionStatus === 'indexed' ? randomInt(0, 12) : 0,
          aiVisibilityDelta: executionStatus === 'indexed' ? randomFloat(-0.5, 5.0) : 0,
          conversions7d: executionStatus === 'indexed' ? randomInt(0, 8) : 0,
          isUnderperforming: qualityScore < 40 && executionStatus === 'indexed',
          platformValue: executionStatus === 'indexed' ? randomFloat(10, 500) : randomFloat(0, 50),
        },
      })
      assets.push(asset)
    }
    results.assets = assets.length

    // ── 3. GrowthGovernorDecision (15+) ──────────────────────────────────
    const decisions = []
    for (let i = 0; i < 18; i++) {
      const decision = randomFrom([...GOVERNOR_DECISIONS])
      const reason = decision === 'approved' ? 'manual_override' : randomFrom([...GOVERNOR_REASONS])
      const asset = randomFrom(assets)

      const isOverridden = i < 4 && decision === 'rejected' // 3+ overrides
      const decisionRecord = await db.growthGovernorDecision.create({
        data: {
          assetId: isOverridden ? asset.id : (Math.random() > 0.4 ? asset.id : null),
          opportunityId: isOverridden ? null : (Math.random() > 0.5 ? randomFrom(opportunities).id : null),
          decision,
          reason,
          details: `${decision === 'approved' ? 'Approved after quality review' : `Rejected due to ${reason}`}. Asset quality score: ${randomInt(30, 90)}.`,
          checksPerformed: JSON.stringify([
            'duplicate_check', 'quality_threshold', 'brand_alignment',
            'evidence_sufficiency', 'competition_analysis',
          ].slice(0, randomInt(2, 5))),
          checkResults: JSON.stringify({
            duplicate_check: { passed: Math.random() > 0.3, score: randomFloat(0.5, 1.0) },
            quality_threshold: { passed: decision === 'approved', score: randomFloat(0.4, 0.95) },
            brand_alignment: { passed: Math.random() > 0.2, score: randomFloat(0.6, 1.0) },
          }),
          confidence: randomFloat(0.3, 0.98),
          overrideable: decision !== 'approved',
          overriddenBy: isOverridden ? 'admin-user-001' : null,
          overriddenAt: isOverridden ? hoursAgo(randomInt(1, 48)) : null,
        },
      })
      decisions.push(decisionRecord)
    }
    results.governorDecisions = decisions.length

    // ── 4. GrowthDailySnapshot (past 7 days) ─────────────────────────────
    const snapshots = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayFactor = 7 - i // older days have lower numbers (growth trend)
      const assetsPublished = randomInt(3, 8) + Math.floor(dayFactor * 0.5)

      const snapshot = await db.growthDailySnapshot.create({
        data: {
          date,
          dailyBudget: 20,
          assetsPublished,
          assetsRejected: randomInt(1, 4),
          assetsMerged: randomInt(0, 2),
          assetsArchived: randomInt(0, 3),
          avgQualityScore: randomFloat(68, 88),
          avgConfidence: randomFloat(0.6, 0.85),
          aiVisibilityGain: randomFloat(1.5, 8.0) * (dayFactor / 7),
          citationGain: randomInt(2, 15) * Math.ceil(dayFactor / 3),
          entityGrowth: randomInt(3, 12),
          organicGrowth: randomFloat(0.5, 4.0),
          knowledgeCoverage: randomFloat(0.35, 0.75),
          platformValueAdded: randomFloat(100, 800) * (dayFactor / 5),
          byTypeBreakdown: JSON.stringify({
            blog: randomInt(1, 4),
            tool: randomInt(0, 2),
            industry: randomInt(1, 3),
            vs: randomInt(0, 2),
            faq: randomInt(0, 3),
            entity: randomInt(0, 2),
          }),
          predictionAccuracy: randomFloat(0.65, 0.92),
          successfulRate: randomFloat(0.7, 0.95),
          isSimulated: false,
        },
      })
      snapshots.push(snapshot)
    }
    results.snapshots = snapshots.length

    // ── 5. GrowthSchedule (9 engines) ────────────────────────────────────
    const schedules = []
    const engineIntervals: Record<string, number> = {
      discovery: 30,
      scoring: 15,
      generation: 45,
      review: 20,
      publishing: 30,
      replay: 60,
      learning: 120,
      pruning: 360,
      observatory: 60,
    }

    for (const engineName of ENGINE_NAMES) {
      const lastRunAt = hoursAgo(randomInt(1, engineIntervals[engineName] / 60))
      const schedule = await db.growthSchedule.create({
        data: {
          engineName,
          intervalMinutes: engineIntervals[engineName],
          isEnabled: engineName !== 'pruning' || Math.random() > 0.5,
          lastRunAt,
          lastRunStatus: Math.random() > 0.15 ? 'success' : (Math.random() > 0.5 ? 'failed' : 'timeout'),
          lastRunDuration: randomInt(500, 15000),
          nextRunAt: new Date(lastRunAt.getTime() + engineIntervals[engineName] * 60000),
          configJson: JSON.stringify({
            maxConcurrent: randomInt(1, 3),
            qualityThreshold: randomInt(60, 80),
            budgetPerRun: randomInt(3, 10),
          }),
        },
      })
      schedules.push(schedule)
    }
    results.schedules = schedules.length

    // ── 6. GrowthLearning (10+) ──────────────────────────────────────────
    const learnings = []
    for (let i = 0; i < 14; i++) {
      const asset = randomFrom(assets)
      const predictedTraffic = randomInt(50, 500)
      const actualTraffic = Math.round(predictedTraffic * randomFloat(0.5, 1.5))
      const predictedCitations = randomInt(1, 10)
      const actualCitations = Math.max(0, Math.round(predictedCitations * randomFloat(0.4, 1.8)))
      const predictedVisibility = randomFloat(1, 8)
      const actualVisibility = parseFloat((predictedVisibility * randomFloat(0.6, 1.4)).toFixed(2))

      const errorDirection = Math.abs(actualTraffic - predictedTraffic) / Math.max(predictedTraffic, 1) < 0.2
        ? 'accurate'
        : actualTraffic > predictedTraffic
        ? 'under'
        : 'over'

      const learning = await db.growthLearning.create({
        data: {
          assetId: asset.id,
          predictedTraffic,
          predictedCitations,
          predictedVisibility,
          predictedValue: randomFloat(20, 300),
          predictionConfidence: randomFloat(0.3, 0.95),
          actualTraffic,
          actualCitations,
          actualVisibility,
          actualValue: randomFloat(10, 400),
          predictionError: parseFloat((Math.abs(actualTraffic - predictedTraffic) / Math.max(predictedTraffic, 1)).toFixed(3)),
          errorDirection,
          lessonLearned: errorDirection === 'over'
            ? `Overestimated traffic for ${asset.type} content. Consider lowering weight for similar topics.`
            : errorDirection === 'under'
            ? `Underestimated performance for ${asset.type}. Similar content tends to outperform predictions.`
            : `Prediction was accurate for ${asset.type} content type.`,
          modelUpdate: JSON.stringify({
            type: asset.type,
            adjustment: errorDirection === 'over' ? -0.05 : errorDirection === 'under' ? 0.05 : 0,
            confidence: randomFloat(0.6, 0.9),
          }),
          appliedToNextPrediction: Math.random() > 0.4,
          measuredAt: daysAgo(randomInt(0, 10)),
        },
      })
      learnings.push(learning)
    }
    results.learnings = learnings.length

    // ── 7. GrowthReport (5+) ─────────────────────────────────────────────
    const reports = []
    const headlines = [
      'Platform added 12 high-value assets with +17 AI Visibility',
      'Strong week: 15 assets published, citations up 23%',
      'Growth Engine hits milestone: 100+ AI citations this month',
      'Quality improvements drive 40% better AI Visibility scores',
      'Discovery engine finds 50+ new opportunities, 8 prioritized',
      'Learning model accuracy improves to 82%, reducing waste',
      'Governor blocks 6 low-quality assets, saving budget',
    ]

    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const report = await db.growthReport.create({
        data: {
          date,
          headline: headlines[i % headlines.length],
          summary: `Day ${6 - i} of autonomous growth: The platform continued generating high-quality content targeting AI visibility opportunities. The discovery engine identified new gaps, the generation engine produced content, and the governor maintained quality standards. Overall platform value continues to grow steadily.`,
          assetsAdded: randomInt(4, 15),
          expectedImpact: `+${randomInt(5, 25)} AI Visibility, +${randomInt(3, 20)} Citations`,
          topOpportunities: JSON.stringify(
            opportunities.slice(0, 5).map((o) => ({
              id: o.id,
              title: o.title,
              growthScore: o.growthScore,
            }))
          ),
          governorSummary: JSON.stringify({
            approved: randomInt(3, 10),
            rejected: randomInt(1, 5),
            deferred: randomInt(0, 3),
            needsReview: randomInt(0, 2),
          }),
          learningInsights: JSON.stringify([
            'Blog content outperforms predictions by 15% on average',
            'Entity-focused content gets 2.3x more AI citations',
            'FAQ pages have the highest quality scores',
            'VS comparisons drive the most traffic per asset',
          ]),
          recommendations: JSON.stringify([
            'Increase focus on entity building opportunities',
            'Prioritize FAQ-type content for better AI visibility',
            'Consider publishing frequency increase to 25/day',
            'Review and update low-performing assets from last week',
          ]),
          reportContent: `# Growth Report - Day ${6 - i}\n\n## Executive Summary\n${headlines[i % headlines.length]}\n\n## Assets Added\n${randomInt(4, 15)} new assets were published today across various content types.\n\n## Recommendations\n1. Continue prioritizing entity-focused content\n2. Monitor governor decisions for quality trends\n3. Increase discovery engine frequency for emerging topics`,
        },
      })
      reports.push(report)
    }
    results.reports = reports.length

    // ── 8. GrowthPruningAction (5+) ──────────────────────────────────────
    const pruningActions = []
    const indexedAssets = assets.filter((a) => a.executionStatus === 'indexed')

    for (let i = 0; i < 7; i++) {
      const asset = indexedAssets[i % indexedAssets.length] || randomFrom(assets)
      const action = randomFrom([...PRUNING_ACTIONS])
      const reason = randomFrom([...PRUNING_REASONS])

      const pruningAction = await db.growthPruningAction.create({
        data: {
          assetId: asset.id,
          traffic30d: randomInt(5, 200),
          citations30d: randomInt(0, 5),
          aiVisibilityDelta: randomFloat(-2.0, 0.5),
          qualityScore: randomInt(15, 55),
          platformValue: randomFloat(0, 50),
          action,
          reason,
          targetAssetId: action === 'merge' || action === 'redirect'
            ? (indexedAssets.find((a) => a.id !== asset.id)?.id || null)
            : null,
          status: randomFrom(['pending', 'approved', 'executed', 'reverted']),
          executedAt: Math.random() > 0.5 ? hoursAgo(randomInt(1, 72)) : null,
          executedBy: Math.random() > 0.7 ? 'admin-user-001' : 'system',
          result: Math.random() > 0.5 ? `Successfully ${action}ed asset. Traffic redirected to higher-performing content.` : null,
        },
      })
      pruningActions.push(pruningAction)
    }
    results.pruningActions = pruningActions.length

    return NextResponse.json({
      success: true,
      message: 'Growth Engine database seeded successfully',
      results,
    })
  } catch (error) {
    console.error('[Growth Seed] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to seed growth data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
