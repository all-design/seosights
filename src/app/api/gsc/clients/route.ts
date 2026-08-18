import { NextResponse } from 'next/server'
import {
  isGSCConfigured,
  getTopQueries,
  getTopPages,
  getSummaryMetrics,
  getPerformanceOverTime,
} from '@/lib/gsc-api'

export const dynamic = 'force-dynamic'

/**
 * Fetch GSC data for all client sites.
 * GET /api/gsc/clients
 */

interface ClientSite {
  id: string
  label: string
  siteUrl: string
  domain: string
}

const CLIENT_SITES: ClientSite[] = [
  { id: 'client-one', label: 'Client One', siteUrl: 'https://kilim.rs', domain: 'kilim.rs' },
  { id: 'client-two', label: 'Client Two', siteUrl: 'https://zlatnistandard.rs', domain: 'zlatnistandard.rs' },
  { id: 'client-three', label: 'Client Three', siteUrl: 'https://investiciono-zlato.rs', domain: 'investiciono-zlato.rs' },
]

interface WeakPoint {
  type: 'low_ctr' | 'declining_position' | 'high_impression_low_click' | 'content_gap' | 'poor_performance'
  severity: 'critical' | 'warning' | 'info'
  query?: string
  page?: string
  message: string
  metric: string
  value: number
  benchmark: number
}

function analyzeWeakPoints(
  queries: Array<{ query: string; impressions: number; clicks: number; ctr: number; position: number }>,
  pages: Array<{ url: string; impressions: number; clicks: number; ctr: number; position: number }>,
  summary: { impressions: number; clicks: number; ctr: number; position: number } | null
): WeakPoint[] {
  const weakPoints: WeakPoint[] = []

  // 1. Low CTR queries (high impressions but low clicks)
  for (const q of queries) {
    if (q.impressions > 50 && q.ctr < 2) {
      weakPoints.push({
        type: 'low_ctr',
        severity: q.ctr < 1 ? 'critical' : 'warning',
        query: q.query,
        message: `"${q.query}" has ${q.impressions} impressions but only ${q.ctr}% CTR — users see but don't click`,
        metric: 'CTR',
        value: q.ctr,
        benchmark: 3,
      })
    }
  }

  // 2. High position but low CTR (title/meta description issue)
  for (const q of queries) {
    if (q.position <= 5 && q.ctr < 3 && q.impressions > 30) {
      weakPoints.push({
        type: 'high_impression_low_click',
        severity: 'warning',
        query: q.query,
        message: `"${q.query}" ranks #${q.position.toFixed(1)} but CTR is only ${q.ctr}% — improve title/description`,
        metric: 'CTR vs Position',
        value: q.ctr,
        benchmark: q.position <= 3 ? 8 : 5,
      })
    }
  }

  // 3. Pages with declining performance (high position = bad)
  for (const p of pages) {
    if (p.position > 20 && p.impressions > 20) {
      weakPoints.push({
        type: 'declining_position',
        severity: p.position > 50 ? 'critical' : 'warning',
        page: p.url,
        message: `Page averages position #${p.position.toFixed(1)} — very low visibility`,
        metric: 'Position',
        value: p.position,
        benchmark: 10,
      })
    }
  }

  // 4. Content gaps — queries where position is > 10 (page 2+)
  for (const q of queries) {
    if (q.position > 10 && q.position <= 20 && q.impressions > 20) {
      weakPoints.push({
        type: 'content_gap',
        severity: 'info',
        query: q.query,
        message: `"${q.query}" is on page 2 (position #${q.position.toFixed(1)}) — small improvement could reach page 1`,
        metric: 'Position',
        value: q.position,
        benchmark: 10,
      })
    }
  }

  // 5. Overall poor performance
  if (summary) {
    if (summary.ctr < 2) {
      weakPoints.push({
        type: 'poor_performance',
        severity: 'critical',
        message: `Overall CTR is ${summary.ctr}% — significantly below the 3% benchmark`,
        metric: 'Overall CTR',
        value: summary.ctr,
        benchmark: 3,
      })
    }
    if (summary.position > 15) {
      weakPoints.push({
        type: 'poor_performance',
        severity: 'warning',
        message: `Average position is #${summary.position.toFixed(1)} — most queries rank on page 2 or lower`,
        metric: 'Avg Position',
        value: summary.position,
        benchmark: 10,
      })
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  weakPoints.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return weakPoints
}

export async function GET() {
  const configured = isGSCConfigured()

  if (!configured) {
    return NextResponse.json({
      connected: false,
      clients: CLIENT_SITES.map(s => ({
        ...s,
        data: null,
        weakPoints: [],
        dataSource: 'not_configured',
      })),
    })
  }

  try {
    const clientResults = await Promise.all(
      CLIENT_SITES.map(async (site) => {
        try {
          const [summary, topQueries, topPages, performanceOverTime] = await Promise.all([
            getSummaryMetrics(28, site.siteUrl),
            getTopQueries(28, 25, site.siteUrl),
            getTopPages(28, 25, site.siteUrl),
            getPerformanceOverTime(28, site.siteUrl),
          ])

          const hasData = topQueries.length > 0 || topPages.length > 0

          if (!hasData) {
            return {
              ...site,
              data: null,
              weakPoints: [],
              dataSource: 'no_data',
            }
          }

          const weakPoints = analyzeWeakPoints(topQueries, topPages, summary)

          return {
            ...site,
            data: {
              summary: summary ? {
                totalImpressions: summary.impressions,
                totalClicks: summary.clicks,
                avgCtr: summary.ctr,
                avgPosition: summary.position,
              } : null,
              topQueries: topQueries.slice(0, 15),
              topPages: topPages.slice(0, 10),
              performanceOverTime: performanceOverTime.slice(-14), // Last 14 days
            },
            weakPoints,
            weakPointSummary: {
              critical: weakPoints.filter(w => w.severity === 'critical').length,
              warning: weakPoints.filter(w => w.severity === 'warning').length,
              info: weakPoints.filter(w => w.severity === 'info').length,
              total: weakPoints.length,
            },
            dataSource: 'google_search_console',
          }
        } catch (err) {
          console.error(`[GSC clients] Error fetching ${site.domain}:`, err)
          return {
            ...site,
            data: null,
            weakPoints: [],
            dataSource: 'error',
          }
        }
      })
    )

    return NextResponse.json({
      connected: true,
      clients: clientResults,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[GSC clients] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 })
  }
}
