/**
 * Growth Engine — Learning
 *
 * GET /api/growth/learning
 * Returns recent GrowthLearning records, prediction accuracy stats,
 * and confidence over time.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Recent learning records (last 50) ─────────────────────────────
    const recentLearnings = await db.growthLearning.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    // ── 2. Prediction accuracy stats ─────────────────────────────────────
    const [
      totalLearnings,
      overPredictions,
      underPredictions,
      accuratePredictions,
      appliedToNext,
      avgPredictionError,
    ] = await Promise.all([
      db.growthLearning.count(),
      db.growthLearning.count({ where: { errorDirection: 'over' } }),
      db.growthLearning.count({ where: { errorDirection: 'under' } }),
      db.growthLearning.count({ where: { errorDirection: 'accurate' } }),
      db.growthLearning.count({ where: { appliedToNextPrediction: true } }),
      db.growthLearning.aggregate({
        _avg: { predictionError: true },
      }),
    ])

    const accuracyRate = totalLearnings > 0
      ? Math.round((accuratePredictions / totalLearnings) * 100)
      : 0

    // ── 3. Confidence over time (last 30 days) ───────────────────────────
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const confidenceOverTime = await db.growthLearning.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        predictionConfidence: { gt: 0 },
      },
      select: {
        createdAt: true,
        predictionConfidence: true,
        predictionError: true,
        errorDirection: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // ── 4. Error distribution ────────────────────────────────────────────
    const errorDistribution = {
      over: overPredictions,
      under: underPredictions,
      accurate: accuratePredictions,
    }

    // ── 5. Average confidence by direction ───────────────────────────────
    const avgConfidenceByDirection = await db.growthLearning.groupBy({
      by: ['errorDirection'],
      _avg: { predictionConfidence: true },
      where: { errorDirection: { not: null } },
    })

    return NextResponse.json({
      learnings: recentLearnings,
      stats: {
        totalLearnings,
        accuracyRate,
        avgPredictionError: Math.round((avgPredictionError._avg.predictionError || 0) * 100) / 100,
        appliedToNextCount: appliedToNext,
        feedbackLoopRate: totalLearnings > 0
          ? Math.round((appliedToNext / totalLearnings) * 100)
          : 0,
      },
      errorDistribution,
      avgConfidenceByDirection: avgConfidenceByDirection.map((d) => ({
        direction: d.errorDirection,
        avgConfidence: Math.round((d._avg.predictionConfidence || 0) * 100),
      })),
      confidenceOverTime,
    })
  } catch (error) {
    console.error('[Growth Learning] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning data' },
      { status: 500 }
    )
  }
}
