import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productionGate } from '@/lib/observatory-gate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/client-zero
 * Returns the Client Zero pipeline: Articles → Citations → Recommendations → Pipeline → Revenue
 * Query params: ?domain=seosights.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || 'seosights.com'

    // Try to get KPI records for this domain
    const kpiRecords = await db.clientZeroKPI.findMany({
      where: {
        domain,
        ...productionGate(),
      },
      orderBy: { date: 'desc' },
    })

    if (kpiRecords.length > 0) {
      // Build response from KPI records
      const latest = kpiRecords[0]

      // Aggregate totals for pipeline
      let totalArticles = 0
      let totalCitations = 0
      let totalRecommendations = 0
      let totalPipelineValue = 0
      let totalRevenue = 0

      for (const r of kpiRecords) {
        totalArticles += r.articlesCreated
        totalCitations += r.citationsGained
        totalRecommendations += r.recommendationsGained
        totalPipelineValue += r.pipelineValue
        totalRevenue += r.revenueAttributed
      }

      // History from last 30 days of records
      const history = kpiRecords
        .slice(0, 30)
        .reverse()
        .map((r) => ({
          date: r.date.toISOString().split('T')[0],
          articles: r.articlesCreated,
          citations: r.citationsGained,
          recommendations: r.recommendationsGained,
        }))

      return NextResponse.json({
        domain,
        pipeline: {
          articles: totalArticles,
          citations: totalCitations,
          recommendations: totalRecommendations,
          pipelineValue: totalPipelineValue,
          revenue: totalRevenue,
        },
        aiVisibilityScore: latest.aiVisibilityScore,
        history,
      })
    }

    // No ClientZeroKPI records — compute from available data
    const [
      articlesCount,
      citationsCount,
      sourceTrackings,
      recommendationsCount,
    ] = await Promise.all([
      db.contentArticle.count({
        where: { domain },
      }),
      db.citationRecord.count({
        where: { citedDomain: { contains: domain } },
      }),
      db.sourceTracking.findMany({
        where: { domain: { contains: domain } },
        select: { citationCount: true },
      }),
      db.observatoryResponse.count({
        where: {
          ...productionGate(),
          responseText: { contains: domain },
        },
      }),
    ])

    const totalSourceCitations = sourceTrackings.reduce(
      (sum, s) => sum + s.citationCount,
      0
    )

    const pipelineValue = citationsCount * 250 + recommendationsCount * 500
    const revenue = Math.round(pipelineValue * 0.12)

    return NextResponse.json({
      domain,
      pipeline: {
        articles: articlesCount,
        citations: citationsCount,
        recommendations: recommendationsCount,
        pipelineValue,
        revenue,
      },
      aiVisibilityScore: 0,
      history: [],
    })
  } catch (error) {
    console.error('[observatory/client-zero] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Client Zero KPI',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
