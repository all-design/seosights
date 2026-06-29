import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/learning
 * Record a learning metric for a report.
 *
 * Body: { reportId: string, metric: string, value: number, source?: string, previousValue?: number, notes?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { reportId, metric, value, source, previousValue, notes } = body as {
      reportId?: string
      metric?: string
      value?: number
      source?: string
      previousValue?: number
      notes?: string
    }

    if (!reportId || !metric || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId, metric, value' },
        { status: 400 }
      )
    }

    const validMetrics = ['citations', 'ai_visibility', 'traffic', 'leads', 'conversions', 'backlinks']
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      )
    }

    const validSources = ['analytics', 'manual', 'api', 'crawl']
    const metricSource = validSources.includes(source || '') ? source! : 'api'

    // Verify the report exists
    const report = await db.observatoryReport.findUnique({ where: { id: reportId } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const learning = await db.observatoryLearning.create({
      data: {
        reportId,
        metric,
        value: Number(value),
        previousValue: previousValue !== undefined ? Number(previousValue) : null,
        source: metricSource,
        notes: notes ? String(notes).slice(0, 500) : null,
      },
    })

    return NextResponse.json({
      learning: {
        id: learning.id,
        reportId: learning.reportId,
        metric: learning.metric,
        value: learning.value,
        previousValue: learning.previousValue,
        source: learning.source,
        notes: learning.notes,
        measuredAt: learning.measuredAt,
        delta: learning.previousValue !== null ? learning.value - learning.previousValue : null,
      },
    })
  } catch (error) {
    console.error('[observatory/learning] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to record learning', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/observatory/learning
 * Get learning data for a specific report or all reports.
 *
 * Query params: reportId (optional), metric (optional), limit (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const reportId = url.searchParams.get('reportId')
    const metric = url.searchParams.get('metric')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

    const where: Record<string, unknown> = {}
    if (reportId) where.reportId = reportId
    if (metric) where.metric = metric

    const learnings = await db.observatoryLearning.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: limit,
      include: {
        report: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
          },
        },
      },
    })

    // Compute aggregated stats if no specific reportId
    let aggregated: Array<{ metric: string; count: number; avgValue: string; maxValue: number | null; minValue: number | null }> | undefined
    if (!reportId) {
      const byMetric = await db.observatoryLearning.groupBy({
        by: ['metric'],
        _count: { id: true },
        _avg: { value: true },
        _max: { value: true },
        _min: { value: true },
      })

      aggregated = byMetric.map((m) => ({
        metric: m.metric,
        count: m._count.id,
        avgValue: m._avg.value?.toFixed(2) || '0.00',
        maxValue: m._max.value,
        minValue: m._min.value,
      }))
    }

    const total = await db.observatoryLearning.count({ where })

    const response: Record<string, unknown> = { learnings, total }
    if (aggregated) response.aggregated = aggregated

    return NextResponse.json(response)
  } catch (error) {
    console.error('[observatory/learning] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
