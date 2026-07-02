/**
 * Growth Engine — Governor
 *
 * GET /api/growth/governor
 * Returns recent GrowthGovernorDecision records,
 * reason breakdown counts, and override statistics.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Recent decisions ──────────────────────────────────────────────
    const recentDecisions = await db.growthGovernorDecision.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    // ── 2. Reason breakdown counts ───────────────────────────────────────
    const reasonBreakdown = await db.growthGovernorDecision.groupBy({
      by: ['reason'],
      _count: { reason: true },
      orderBy: { _count: { reason: 'desc' } },
    })

    // ── 3. Decision breakdown ────────────────────────────────────────────
    const decisionBreakdown = await db.growthGovernorDecision.groupBy({
      by: ['decision'],
      _count: { decision: true },
      orderBy: { _count: { decision: 'desc' } },
    })

    // ── 4. Override statistics ───────────────────────────────────────────
    const [
      totalDecisions,
      totalOverridden,
      overrideableCount,
      avgConfidence,
    ] = await Promise.all([
      db.growthGovernorDecision.count(),
      db.growthGovernorDecision.count({ where: { overriddenBy: { not: null } } }),
      db.growthGovernorDecision.count({ where: { overrideable: true } }),
      db.growthGovernorDecision.aggregate({
        _avg: { confidence: true },
      }),
    ])

    const overrideRate = totalDecisions > 0
      ? Math.round((totalOverridden / totalDecisions) * 100)
      : 0

    // ── 5. Recent overrides ──────────────────────────────────────────────
    const recentOverrides = await db.growthGovernorDecision.findMany({
      where: { overriddenBy: { not: null } },
      take: 10,
      orderBy: { overriddenAt: 'desc' },
    })

    // ── 6. Confidence distribution ───────────────────────────────────────
    const highConfidence = await db.growthGovernorDecision.count({
      where: { confidence: { gte: 0.8 } },
    })
    const mediumConfidence = await db.growthGovernorDecision.count({
      where: { confidence: { gte: 0.5, lt: 0.8 } },
    })
    const lowConfidence = await db.growthGovernorDecision.count({
      where: { confidence: { lt: 0.5 } },
    })

    return NextResponse.json({
      decisions: recentDecisions,
      reasonBreakdown: reasonBreakdown.map((r) => ({
        reason: r.reason,
        count: r._count.reason,
      })),
      decisionBreakdown: decisionBreakdown.map((d) => ({
        decision: d.decision,
        count: d._count.decision,
      })),
      overrideStats: {
        totalDecisions,
        totalOverridden,
        overrideableCount,
        overrideRate,
        avgConfidence: Math.round((avgConfidence._avg.confidence || 0) * 100),
        recentOverrides,
      },
      confidenceDistribution: {
        high: highConfidence,
        medium: mediumConfidence,
        low: lowConfidence,
      },
    })
  } catch (error) {
    console.error('[Growth Governor] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch governor data' },
      { status: 500 }
    )
  }
}
