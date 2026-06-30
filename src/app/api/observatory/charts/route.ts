import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/charts
 * Public Charts — embeddable chart data for Observatory.
 * PUBLIC read-only API.
 *
 * Query params:
 *   type - Chart type filter (e.g., "source_trend")
 *   key  - Chart key filter (e.g., "github-365d")
 *
 * If type+key provided: return single chart with embed HTML.
 * Otherwise: list all public charts.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chartType = searchParams.get('type')
    const chartKey = searchParams.get('key')

    // ─── Single chart requested ────────────────────────────────────
    if (chartType && chartKey) {
      const chart = await db.observatoryChartData.findUnique({
        where: {
          chartType_chartKey: {
            chartType,
            chartKey,
          },
        },
      })

      if (!chart || !chart.isPublic) {
        return NextResponse.json(
          { error: 'Chart not found or not publicly available' },
          { status: 404 }
        )
      }

      // Increment embed count
      await db.observatoryChartData.update({
        where: { id: chart.id },
        data: { embedCount: { increment: 1 } },
      })

      const embedHtml = generateEmbedHtml(chart)

      return NextResponse.json({
        chart: {
          chartType: chart.chartType,
          chartKey: chart.chartKey,
          title: chart.title,
          description: chart.description,
          dataJson: safeParseJson(chart.dataJson),
          dateRange: chart.dateRange,
          dataPoints: chart.dataPoints,
          embedCount: chart.embedCount + 1,
          lastUpdated: chart.lastUpdated.toISOString(),
        },
        embedHtml,
      })
    }

    // ─── List all public charts ────────────────────────────────────
    const where: Record<string, unknown> = { isPublic: true }
    if (chartType) where.chartType = chartType

    const charts = await db.observatoryChartData.findMany({
      where,
      orderBy: { lastUpdated: 'desc' },
    })

    return NextResponse.json({
      charts: charts.map((c) => ({
        chartType: c.chartType,
        chartKey: c.chartKey,
        title: c.title,
        description: c.description,
        dataJson: safeParseJson(c.dataJson),
        dateRange: c.dateRange,
        dataPoints: c.dataPoints,
        embedCount: c.embedCount,
        lastUpdated: c.lastUpdated.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[observatory/charts] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch chart data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function safeParseJson(jsonStr: string): unknown {
  try {
    return JSON.parse(jsonStr)
  } catch {
    return jsonStr
  }
}

function generateEmbedHtml(chart: {
  chartType: string
  chartKey: string
  title: string
}): string {
  const embedUrl = `/api/observatory/charts?type=${encodeURIComponent(chart.chartType)}&key=${encodeURIComponent(chart.chartKey)}`
  return `<iframe src="${embedUrl}" title="${escapeHtml(chart.title)}" width="800" height="400" frameborder="0" style="border:1px solid #e5e7eb;border-radius:8px;"></iframe>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
