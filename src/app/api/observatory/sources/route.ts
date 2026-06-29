import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/sources
 * Get source tracking data — top domains by AI model, trends, comparisons.
 *
 * Query params:
 *   aiModel  - Filter by AI model
 *   period   - Filter by period (e.g., "2026-06", "2026-W26")
 *   trend    - Filter by trend (rising, falling, stable, new)
 *   domain   - Filter by specific domain
 *   view     - "top" | "trends" | "comparison" | "list"
 *   limit    - Max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const aiModel = searchParams.get('aiModel')
    const period = searchParams.get('period')
    const trend = searchParams.get('trend')
    const domain = searchParams.get('domain')
    const view = searchParams.get('view') || 'top'
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))

    // Build where clause
    const where: Record<string, unknown> = {}
    if (aiModel) where.aiModel = aiModel
    if (period) where.period = period
    if (trend) where.trend = trend
    if (domain) where.domain = { contains: domain }

    if (view === 'top') {
      // ─── Top Domains by AI Model ─────────────────────────────────
      const models = aiModel ? [aiModel] : ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek']
      const topByModel: Record<string, Array<{
        domain: string
        citationCount: number
        previousCount: number
        percentChange: number
        avgPosition: number
        trend: string
        categories: string[]
        period: string
      }>> = {}

      for (const model of models) {
        const modelWhere = { ...where, aiModel: model }
        const topSources = await db.sourceTracking.findMany({
          where: modelWhere,
          orderBy: { citationCount: 'desc' },
          take: limit,
        })

        topByModel[model] = topSources.map((s) => ({
          domain: s.domain,
          citationCount: s.citationCount,
          previousCount: s.previousCount,
          percentChange: s.percentChange,
          avgPosition: s.avgPosition,
          trend: s.trend,
          categories: s.categories ? JSON.parse(s.categories) : [],
          period: s.period,
        }))
      }

      // Overall top domains across all models
      const overallTop = await db.sourceTracking.groupBy({
        by: ['domain'],
        _sum: { citationCount: true },
        _avg: { avgPosition: true, percentChange: true },
        orderBy: { _sum: { citationCount: 'desc' } },
        take: limit,
      })

      return NextResponse.json({
        topByModel,
        overallTop: overallTop.map((d) => ({
          domain: d.domain,
          totalCitations: d._sum.citationCount || 0,
          avgPosition: d._avg.avgPosition?.toFixed(1) || '0.0',
          avgPercentChange: d._avg.percentChange?.toFixed(1) || '0.0',
        })),
      })
    }

    if (view === 'trends') {
      // ─── Domain Trends ───────────────────────────────────────────
      const rising = await db.sourceTracking.findMany({
        where: { ...where, trend: 'rising' },
        orderBy: { percentChange: 'desc' },
        take: limit,
      })

      const falling = await db.sourceTracking.findMany({
        where: { ...where, trend: 'falling' },
        orderBy: { percentChange: 'asc' },
        take: limit,
      })

      const newEntries = await db.sourceTracking.findMany({
        where: { ...where, trend: 'new' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      const stable = await db.sourceTracking.findMany({
        where: { ...where, trend: 'stable' },
        orderBy: { citationCount: 'desc' },
        take: limit,
      })

      // Trend summary stats
      const totalRising = await db.sourceTracking.count({ where: { ...where, trend: 'rising' } })
      const totalFalling = await db.sourceTracking.count({ where: { ...where, trend: 'falling' } })
      const totalNew = await db.sourceTracking.count({ where: { ...where, trend: 'new' } })
      const totalStable = await db.sourceTracking.count({ where: { ...where, trend: 'stable' } })

      return NextResponse.json({
        summary: {
          rising: totalRising,
          falling: totalFalling,
          new: totalNew,
          stable: totalStable,
          total: totalRising + totalFalling + totalNew + totalStable,
        },
        rising: rising.map(formatSourceTracking),
        falling: falling.map(formatSourceTracking),
        new: newEntries.map(formatSourceTracking),
        stable: stable.map(formatSourceTracking),
      })
    }

    if (view === 'comparison') {
      // ─── Domain Comparison Across Models ─────────────────────────
      // Get all unique domains
      const domains = await db.sourceTracking.groupBy({
        by: ['domain'],
        _sum: { citationCount: true },
        orderBy: { _sum: { citationCount: 'desc' } },
        take: limit,
      })

      const models = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek']
      const comparison: Array<{
        domain: string
        totalCitations: number
        byModel: Record<string, { citationCount: number; avgPosition: number; trend: string }>
      }> = []

      for (const d of domains) {
        const modelData: Record<string, { citationCount: number; avgPosition: number; trend: string }> = {}

        for (const model of models) {
          const latestEntry = await db.sourceTracking.findFirst({
            where: { domain: d.domain, aiModel: model },
            orderBy: { period: 'desc' },
          })

          if (latestEntry) {
            modelData[model] = {
              citationCount: latestEntry.citationCount,
              avgPosition: latestEntry.avgPosition,
              trend: latestEntry.trend,
            }
          }
        }

        comparison.push({
          domain: d.domain,
          totalCitations: d._sum.citationCount || 0,
          byModel: modelData,
        })
      }

      return NextResponse.json({
        comparison,
        models,
      })
    }

    // ─── Default: List source tracking entries ────────────────────
    const sources = await db.sourceTracking.findMany({
      where,
      orderBy: { citationCount: 'desc' },
      take: limit,
    })

    const total = await db.sourceTracking.count({ where })

    return NextResponse.json({
      sources: sources.map(formatSourceTracking),
      total,
      limit,
    })
  } catch (error) {
    console.error('[observatory/sources] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch source tracking data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Format a SourceTracking record for API response
 */
function formatSourceTracking(s: {
  id: string
  domain: string
  aiModel: string
  period: string
  citationCount: number
  previousCount: number
  percentChange: number
  avgPosition: number
  categories: string | null
  trend: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    domain: s.domain,
    aiModel: s.aiModel,
    period: s.period,
    citationCount: s.citationCount,
    previousCount: s.previousCount,
    percentChange: s.percentChange,
    avgPosition: s.avgPosition,
    categories: s.categories ? JSON.parse(s.categories) : [],
    trend: s.trend,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}
