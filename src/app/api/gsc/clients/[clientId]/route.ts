import { NextResponse } from 'next/server'
import {
  isGSCConfigured,
  getTopQueries,
  getTopPages,
  getSummaryMetrics,
  getPerformanceOverTime,
  getQueryPageCorrelation,
} from '@/lib/gsc-api'
import type { GSCQueryRow, GSCPageRow } from '@/lib/gsc-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gsc/clients/[clientId]
 *
 * Returns a rich, client-facing dataset for a single client site.
 * Designed to power a polished, marketing-ready dashboard that we
 * can show to prospective customers (sell a subscription).
 *
 * Includes:
 *  - Site info (label, domain, siteUrl, industry)
 *  - Summary metrics for multiple windows (7d, 28d, 90d)
 *  - Top queries (50)
 *  - Top pages (50)
 *  - Performance over time (90d daily)
 *  - Query/page correlation
 *  - SEO opportunities (re-framed weak points with impact + effort)
 *  - Health score breakdown
 *  - Recommendations (auto-generated action plan)
 *  - Industry benchmarks
 *  - Plan comparison (for upgrade CTA)
 */

interface ClientSite {
  id: string
  label: string
  siteUrl: string
  domain: string
  industry: string
  plan: 'trial' | 'starter' | 'pro' | 'enterprise'
}

const CLIENT_SITES: ClientSite[] = [
  {
    id: 'client-one',
    label: 'Client One',
    siteUrl: 'https://kilim.rs',
    domain: 'kilim.rs',
    industry: 'Home & Decor / Handmade Rugs',
    plan: 'trial',
  },
  {
    id: 'client-two',
    label: 'Client Two',
    siteUrl: 'https://zlatnistandard.rs',
    domain: 'zlatnistandard.rs',
    industry: 'Finance / Precious Metals',
    plan: 'trial',
  },
  {
    id: 'client-three',
    label: 'Client Three',
    siteUrl: 'https://investiciono-zlato.rs',
    domain: 'investiciono-zlato.rs',
    industry: 'Finance / Investment Gold',
    plan: 'trial',
  },
]

// ── Types ────────────────────────────────────────────────────────────

interface Opportunity {
  id: string
  type: 'low_ctr' | 'declining_position' | 'high_impression_low_click' | 'content_gap' | 'poor_performance' | 'missing_query'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  query?: string
  page?: string
  metric: string
  value: number
  benchmark: number
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  estimatedUplift: string
  recommendedAction: string
}

interface HealthFactor {
  label: string
  score: number
  weight: number
  detail: string
}

interface Recommendation {
  id: string
  priority: 'P0' | 'P1' | 'P2'
  category: 'content' | 'technical' | 'ctr' | 'keywords' | 'structure'
  title: string
  description: string
  impact: string
  timeframe: string
}

// ── Opportunity Analyzer ────────────────────────────────────────────

function analyzeOpportunities(
  queries: GSCQueryRow[],
  pages: GSCPageRow[],
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null
): Opportunity[] {
  const opportunities: Opportunity[] = []
  let idCounter = 0
  const nextId = () => `opp-${++idCounter}`

  // 1. Low CTR queries (high impressions but low clicks) — biggest revenue leak
  for (const q of queries) {
    if (q.impressions > 50 && q.ctr < 2) {
      const lostClicks = Math.round(q.impressions * (3 - q.ctr) / 100)
      opportunities.push({
        id: nextId(),
        type: 'low_ctr',
        severity: q.ctr < 1 ? 'critical' : 'warning',
        title: `Low click-through rate for "${q.query}"`,
        description: `"${q.query}" gets ${q.impressions.toLocaleString()} impressions but only ${q.ctr}% CTR. Users see your result but don't click — typically a title/meta description issue.`,
        query: q.query,
        metric: 'CTR',
        value: q.ctr,
        benchmark: 3,
        impact: q.impressions > 500 ? 'high' : q.impressions > 150 ? 'medium' : 'low',
        effort: 'low',
        estimatedUplift: `+${lostClicks} clicks/mo (est. +${Math.round(lostClicks * 0.4)} conversions)`,
        recommendedAction: 'Rewrite the page title and meta description to be more compelling. Test emotional triggers, numbers, and a clear value proposition.',
      })
    }
  }

  // 2. Page-2 queries (position 11-20) — closest to first page wins
  for (const q of queries) {
    if (q.position > 10 && q.position <= 20 && q.impressions > 20) {
      opportunities.push({
        id: nextId(),
        type: 'content_gap',
        severity: 'info',
        title: `"${q.query}" is on page 2 (position #${q.position.toFixed(1)})`,
        description: `Small improvement could push this query to page 1, where CTR jumps from <1% to 3-15%. Page 1 visibility is worth 5-10x more clicks.`,
        query: q.query,
        metric: 'Position',
        value: q.position,
        benchmark: 10,
        impact: q.impressions > 200 ? 'high' : 'medium',
        effort: 'medium',
        estimatedUplift: `+${Math.round(q.impressions * 0.05)} clicks/mo if reaches top 10`,
        recommendedAction: 'Refresh the existing content, add more depth, internal links, and earn a few quality backlinks to push it onto page 1.',
      })
    }
  }

  // 3. High position but low CTR (title/description underperformance)
  for (const q of queries) {
    if (q.position <= 5 && q.ctr < 3 && q.impressions > 30) {
      opportunities.push({
        id: nextId(),
        type: 'high_impression_low_click',
        severity: 'warning',
        title: `"${q.query}" ranks #${q.position.toFixed(1)} but CTR is only ${q.ctr}%`,
        description: `Top-5 ranking should yield 5-15% CTR. You're losing 60-80% of potential clicks despite strong rankings.`,
        query: q.query,
        metric: 'CTR vs Position',
        value: q.ctr,
        benchmark: q.position <= 3 ? 8 : 5,
        impact: 'high',
        effort: 'low',
        estimatedUplift: `+${Math.round(q.impressions * 0.05)} clicks/mo`,
        recommendedAction: 'A/B test title tags, add schema markup (FAQ/How-To), and ensure the meta description matches search intent.',
      })
    }
  }

  // 4. Pages with poor position (>20) — content needs help
  for (const p of pages.slice(0, 15)) {
    if (p.position > 20 && p.impressions > 20) {
      const path = p.url.split('/').slice(3).join('/') || '/'
      opportunities.push({
        id: nextId(),
        type: 'declining_position',
        severity: p.position > 50 ? 'critical' : 'warning',
        title: `Page averaging position #${p.position.toFixed(1)}`,
        description: `/${path} has ${p.impressions.toLocaleString()} impressions but ranks beyond page 2. Content may need a complete refresh or be targeting the wrong queries.`,
        page: p.url,
        metric: 'Position',
        value: p.position,
        benchmark: 10,
        impact: p.impressions > 200 ? 'high' : 'medium',
        effort: 'high',
        estimatedUplift: `+${Math.round(p.impressions * 0.08)} clicks/mo if reaches top 10`,
        recommendedAction: 'Audit the page for content quality, search intent match, and on-page SEO. Consider consolidating with a stronger page or rewriting.',
      })
    }
  }

  // 5. Overall performance issues
  if (summary) {
    if (summary.ctr < 2) {
      opportunities.push({
        id: nextId(),
        type: 'poor_performance',
        severity: 'critical',
        title: 'Site-wide CTR is below industry benchmark',
        description: `Overall CTR of ${summary.ctr}% is significantly below the 3% industry average. This indicates systemic title/meta issues across the site.`,
        metric: 'Overall CTR',
        value: summary.ctr,
        benchmark: 3,
        impact: 'high',
        effort: 'medium',
        estimatedUplift: `+${Math.round(summary.impressions * 0.01)} clicks/mo`,
        recommendedAction: 'Run a site-wide title tag audit. Use a consistent template with primary keyword + value proposition + brand name.',
      })
    }
    if (summary.position > 15) {
      opportunities.push({
        id: nextId(),
        type: 'poor_performance',
        severity: 'warning',
        title: 'Average position is on page 2 or lower',
        description: `Average position of #${summary.position.toFixed(1)} means most queries rank beyond page 1, where click volume drops dramatically.`,
        metric: 'Avg Position',
        value: summary.position,
        benchmark: 10,
        impact: 'high',
        effort: 'high',
        estimatedUplift: `+${Math.round(summary.impressions * 0.15)} clicks/mo if avg improves to top 10`,
        recommendedAction: 'Prioritize content improvements for queries in position 8-15 (closest to page 1). Build topical authority through cluster content.',
      })
    }
  }

  // Sort by severity then impact
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  const impactOrder = { high: 0, medium: 1, low: 2 }
  opportunities.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return impactOrder[a.impact] - impactOrder[b.impact]
  })

  return opportunities
}

// ── Health Score Calculator ─────────────────────────────────────────

function calculateHealthScore(
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null,
  opportunities: Opportunity[]
): { score: number; factors: HealthFactor[] } {
  if (!summary) {
    return { score: 0, factors: [] }
  }

  // CTR Score (target: 3%+, max: 8%)
  const ctrScore = Math.min(100, (summary.ctr / 8) * 100)

  // Position Score (target: top 10, max: top 3)
  const positionScore = summary.position > 30 ? 10 : Math.max(0, Math.min(100, ((30 - summary.position) / 27) * 100))

  // Volume Score (target: 5000+ impressions/mo)
  const volumeScore = Math.min(100, (summary.impressions / 5000) * 100)

  // Opportunity Burden Score (fewer opportunities = healthier)
  const criticalCount = opportunities.filter(o => o.severity === 'critical').length
  const warningCount = opportunities.filter(o => o.severity === 'warning').length
  const opportunityBurden = Math.max(0, 100 - (criticalCount * 15 + warningCount * 5))

  const factors: HealthFactor[] = [
    {
      label: 'Click-through Rate',
      score: Math.round(ctrScore),
      weight: 30,
      detail: `${summary.ctr}% (benchmark: 3%+)`,
    },
    {
      label: 'Average Position',
      score: Math.round(positionScore),
      weight: 30,
      detail: `#${summary.position.toFixed(1)} (goal: top 10)`,
    },
    {
      label: 'Search Visibility',
      score: Math.round(volumeScore),
      weight: 20,
      detail: `${summary.impressions.toLocaleString()} impressions/mo`,
    },
    {
      label: 'SEO Issue Burden',
      score: Math.round(opportunityBurden),
      weight: 20,
      detail: `${criticalCount} critical, ${warningCount} warnings`,
    },
  ]

  const overall = Math.round(factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0))

  return { score: Math.max(0, Math.min(100, overall)), factors }
}

// ── Recommendation Generator ────────────────────────────────────────

function generateRecommendations(
  opportunities: Opportunity[],
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null,
  queries: GSCQueryRow[],
  pages: GSCPageRow[]
): Recommendation[] {
  const recs: Recommendation[] = []
  let idCounter = 0
  const nextId = () => `rec-${++idCounter}`

  // Recommendation 1: CTR optimization (always relevant)
  if (summary && summary.ctr < 3) {
    recs.push({
      id: nextId(),
      priority: 'P0',
      category: 'ctr',
      title: 'Run a site-wide title & meta description overhaul',
      description: `Your overall CTR is ${summary.ctr}% (below the 3% benchmark). Rewriting titles and descriptions for top 20 pages typically yields a 30-50% click lift within 2-4 weeks.`,
      impact: `+${Math.round(summary.impressions * 0.015)} clicks/mo`,
      timeframe: '2-4 weeks',
    })
  }

  // Recommendation 2: Content refresh for page-2 queries
  const page2Queries = queries.filter(q => q.position > 10 && q.position <= 20)
  if (page2Queries.length > 0) {
    recs.push({
      id: nextId(),
      priority: 'P1',
      category: 'content',
      title: `Refresh content for ${page2Queries.length} queries on page 2`,
      description: `${page2Queries.length} queries rank between positions 11-20. With focused content improvements, 40-60% can reach page 1, where CTR is 5-15x higher.`,
      impact: `+${Math.round(page2Queries.reduce((s, q) => s + q.impressions, 0) * 0.04)} clicks/mo`,
      timeframe: '4-8 weeks',
    })
  }

  // Recommendation 3: Top page optimization
  const lowCtrTopPages = pages.filter(p => p.position <= 10 && p.ctr < 5).slice(0, 5)
  if (lowCtrTopPages.length > 0) {
    recs.push({
      id: nextId(),
      priority: 'P1',
      category: 'technical',
      title: 'Add structured data (schema) to top-ranking pages',
      description: `${lowCtrTopPages.length} pages rank in the top 10 but have CTR below 5%. Adding FAQ, How-To, or Product schema can unlock rich results and boost CTR by 20-30%.`,
      impact: `+${Math.round(lowCtrTopPages.reduce((s, p) => s + p.impressions, 0) * 0.05)} clicks/mo`,
      timeframe: '1-2 weeks',
    })
  }

  // Recommendation 4: Keyword expansion
  if (queries.length > 0) {
    const topQuery = queries[0]
    recs.push({
      id: nextId(),
      priority: 'P2',
      category: 'keywords',
      title: 'Expand content around your strongest topic cluster',
      description: `Your best-performing query is "${topQuery.query}" (${topQuery.impressions.toLocaleString()} impressions). Build supporting content (guides, comparisons, FAQs) to dominate this topic.`,
      impact: '+25-40% topic authority',
      timeframe: '6-12 weeks',
    })
  }

  // Recommendation 5: Internal linking / structure
  if (pages.length > 10) {
    recs.push({
      id: nextId(),
      priority: 'P2',
      category: 'structure',
      title: 'Strengthen internal linking architecture',
      description: `${pages.length}+ pages indexed. A strategic internal linking pass can transfer authority from high-ranking pages to those stuck on page 2-3.`,
      impact: '+10-15% crawl efficiency',
      timeframe: '2-3 weeks',
    })
  }

  return recs
}

// ── Plan Comparison (for upgrade CTA) ───────────────────────────────

const PLAN_COMPARISON = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: 'mo',
    tagline: 'For small sites finding their footing',
    highlighted: false,
    features: [
      'Weekly SEO audit',
      'Top 100 keywords tracked',
      '1 competitor monitored',
      'Monthly performance report',
      'Email support',
    ],
    cta: 'Start Starter Plan',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 299,
    period: 'mo',
    tagline: 'For growing businesses that need real visibility',
    highlighted: true,
    features: [
      'Everything in Starter, plus:',
      'Daily SEO audit + alerts',
      'Top 1,000 keywords tracked',
      '5 competitors monitored',
      'AI Visibility tracking (ChatGPT, Claude, Gemini, Perplexity)',
      'Weekly action plan with priorities',
      'Content briefs (10/mo)',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: 'mo',
    tagline: 'For agencies and multi-site operations',
    highlighted: false,
    features: [
      'Everything in Pro, plus:',
      'Unlimited keywords & competitors',
      'Multi-site dashboard',
      'White-label reports',
      'Dedicated SEO strategist',
      'API access',
      'Custom AI model training',
      '24/7 phone support',
    ],
    cta: 'Talk to Sales',
  },
]

// ── Main Handler ────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const site = CLIENT_SITES.find(s => s.id === clientId)

  if (!site) {
    return NextResponse.json(
      { error: 'Client not found', clientId },
      { status: 404 }
    )
  }

  if (!isGSCConfigured()) {
    return NextResponse.json({
      client: site,
      connected: false,
      dataSource: 'not_configured',
      summary: null,
      summary7d: null,
      summary90d: null,
      topQueries: [],
      topPages: [],
      performanceOverTime: [],
      queryPageCorrelation: [],
      opportunities: [],
      healthScore: { score: 0, factors: [] },
      recommendations: [],
      plans: PLAN_COMPARISON,
    })
  }

  try {
    // Fetch rich data: 28d for primary, plus 7d and 90d for comparison
    const [
      summary,
      summary7d,
      summary90d,
      topQueries,
      topPages,
      performanceOverTime,
      queryPageCorrelation,
    ] = await Promise.all([
      getSummaryMetrics(28, site.siteUrl),
      getSummaryMetrics(7, site.siteUrl),
      getSummaryMetrics(90, site.siteUrl),
      getTopQueries(28, 50, site.siteUrl),
      getTopPages(28, 50, site.siteUrl),
      getPerformanceOverTime(90, site.siteUrl),
      getQueryPageCorrelation(28, 100, site.siteUrl),
    ])

    const hasData = topQueries.length > 0 || topPages.length > 0

    if (!hasData) {
      return NextResponse.json({
        client: site,
        connected: true,
        dataSource: 'no_data',
        summary: null,
        summary7d: null,
        summary90d: null,
        topQueries: [],
        topPages: [],
        performanceOverTime: [],
        queryPageCorrelation: [],
        opportunities: [],
        healthScore: { score: 0, factors: [] },
        recommendations: [],
        plans: PLAN_COMPARISON,
        generatedAt: new Date().toISOString(),
      })
    }

    const opportunities = analyzeOpportunities(topQueries, topPages, summary)
    const healthScore = calculateHealthScore(summary, opportunities)
    const recommendations = generateRecommendations(opportunities, summary, topQueries, topPages)

    // Calculate week-over-week deltas (7d vs previous 7d is approximate via 28d/7d ratio)
    const delta7dVs28d = summary && summary7d
      ? {
          impressions: summary7d.impressions - (summary.impressions / 4),
          clicks: summary7d.clicks - (summary.clicks / 4),
        }
      : null

    return NextResponse.json({
      client: site,
      connected: true,
      dataSource: 'google_search_console',
      summary: summary ? {
        totalImpressions: summary.impressions,
        totalClicks: summary.clicks,
        avgCtr: summary.ctr,
        avgPosition: summary.position,
      } : null,
      summary7d: summary7d ? {
        totalImpressions: summary7d.impressions,
        totalClicks: summary7d.clicks,
        avgCtr: summary7d.ctr,
        avgPosition: summary7d.position,
      } : null,
      summary90d: summary90d ? {
        totalImpressions: summary90d.impressions,
        totalClicks: summary90d.clicks,
        avgCtr: summary90d.ctr,
        avgPosition: summary90d.position,
      } : null,
      deltas: delta7dVs28d ? {
        impressionsPct: summary.impressions > 0
          ? Math.round((delta7dVs28d.impressions / (summary.impressions / 4)) * 1000) / 10
          : 0,
        clicksPct: summary.clicks > 0
          ? Math.round((delta7dVs28d.clicks / (summary.clicks / 4)) * 1000) / 10
          : 0,
      } : null,
      topQueries,
      topPages,
      performanceOverTime,
      queryPageCorrelation: queryPageCorrelation.slice(0, 50),
      opportunities,
      opportunitySummary: {
        critical: opportunities.filter(o => o.severity === 'critical').length,
        warning: opportunities.filter(o => o.severity === 'warning').length,
        info: opportunities.filter(o => o.severity === 'info').length,
        total: opportunities.length,
        highImpact: opportunities.filter(o => o.impact === 'high').length,
      },
      healthScore,
      recommendations,
      plans: PLAN_COMPARISON,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[GSC clients/${clientId}] Error:`, err)
    return NextResponse.json(
      { error: 'Failed to fetch client data', clientId },
      { status: 500 }
    )
  }
}
