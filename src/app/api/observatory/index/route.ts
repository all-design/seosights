import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productionGate } from '@/lib/observatory-gate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/index
 * Observatory Index™ — industry index scores.
 * PUBLIC read-only API.
 *
 * Query params:
 *   industry - Optional industry slug (e.g., "healthcare") for specific industry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const industrySlug = searchParams.get('industry')

    // ─── Specific industry ─────────────────────────────────────────
    if (industrySlug) {
      const industry = await db.observatoryIndustry.findUnique({
        where: { slug: industrySlug },
      })

      if (!industry) {
        return NextResponse.json(
          { error: `Industry "${industrySlug}" not found` },
          { status: 404 }
        )
      }

      const allIndustries = await db.observatoryIndustry.findMany({
        select: { indexScore: true, dataPoints: true },
      })

      const overallIndex = computeWeightedAverage(allIndustries)

      return NextResponse.json({
        industries: [
          {
            slug: industry.slug,
            name: industry.name,
            indexScore: Math.round(industry.indexScore * 10) / 10,
            previousScore: Math.round(industry.previousScore * 10) / 10,
            trend: industry.trend,
            dataPoints: industry.dataPoints,
            signalsCount: industry.signalsCount,
            lastUpdated: industry.lastUpdated?.toISOString() ?? null,
          },
        ],
        overallIndex,
        trend: computeOverallTrend(allIndustries),
      })
    }

    // ─── All industries ────────────────────────────────────────────
    const industries = await db.observatoryIndustry.findMany({
      orderBy: { indexScore: 'desc' },
    })

    const overallIndex = computeWeightedAverage(industries)

    return NextResponse.json({
      industries: industries.map((i) => ({
        slug: i.slug,
        name: i.name,
        indexScore: Math.round(i.indexScore * 10) / 10,
        previousScore: Math.round(i.previousScore * 10) / 10,
        trend: i.trend,
        dataPoints: i.dataPoints,
        signalsCount: i.signalsCount,
        lastUpdated: i.lastUpdated?.toISOString() ?? null,
      })),
      overallIndex,
      trend: computeOverallTrend(industries),
    })
  } catch (error) {
    console.error('[observatory/index] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch index data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function computeWeightedAverage(
  industries: Array<{ indexScore: number; dataPoints: number }>
): number {
  if (industries.length === 0) return 0

  const totalWeight = industries.reduce((sum, i) => sum + Math.max(1, i.dataPoints), 0)
  const weightedSum = industries.reduce(
    (sum, i) => sum + i.indexScore * Math.max(1, i.dataPoints),
    0
  )

  return Math.round((weightedSum / totalWeight) * 10) / 10
}

function computeOverallTrend(
  industries: Array<{ trend: string }>
): string {
  const rising = industries.filter((i) => i.trend === 'rising').length
  const falling = industries.filter((i) => i.trend === 'falling').length

  if (rising > falling * 1.5) return 'rising'
  if (falling > rising * 1.5) return 'falling'
  return 'stable'
}
