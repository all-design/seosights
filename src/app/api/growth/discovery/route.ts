/**
 * Growth Engine — Discovery Feed
 *
 * GET /api/growth/discovery
 * Returns recent GrowthOpportunity records, source distribution,
 * and count of new opportunities discovered today.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Recent opportunities (limit 50) ───────────────────────────────
    const opportunities = await db.growthOpportunity.findMany({
      take: 50,
      orderBy: { discoveredAt: 'desc' },
    })

    // ── 2. Source distribution counts ────────────────────────────────────
    const sourceDistribution = await db.growthOpportunity.groupBy({
      by: ['source'],
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    })

    // ── 3. New opportunities today ───────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const newTodayCount = await db.growthOpportunity.count({
      where: { discoveredAt: { gte: today } },
    })

    // ── 4. Type distribution ─────────────────────────────────────────────
    const typeDistribution = await db.growthOpportunity.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
    })

    // ── 5. Average growth score by source ────────────────────────────────
    const avgScoreBySource = await db.growthOpportunity.groupBy({
      by: ['source'],
      _avg: { growthScore: true },
      orderBy: { _avg: { growthScore: 'desc' } },
    })

    return NextResponse.json({
      opportunities,
      sourceDistribution: sourceDistribution.map((s) => ({
        source: s.source,
        count: s._count.source,
      })),
      typeDistribution: typeDistribution.map((t) => ({
        type: t.type,
        count: t._count.type,
      })),
      avgScoreBySource: avgScoreBySource.map((s) => ({
        source: s.source,
        avgGrowthScore: Math.round((s._avg.growthScore || 0) * 10) / 10,
      })),
      newTodayCount,
    })
  } catch (error) {
    console.error('[Growth Discovery] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discovery data' },
      { status: 500 }
    )
  }
}
