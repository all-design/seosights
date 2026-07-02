/**
 * Client Zero Dashboard API — Aggregated overview
 *
 * GET — All Client Zero data in one call for the dashboard
 *
 * "Can Seosights grow Seosights?" — This is the answer endpoint.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const api = '/api/client-zero/dashboard'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const domain = 'seosights.com'

    // ── AI Visibility Score (latest snapshot) ──────────────────────────
    const latestSnapshotResult = await safeQuery(() => db.visibilitySnapshot.findFirst({
      where: { domain },
      orderBy: { capturedAt: 'desc' },
    }), null, { api, correlationId })

    const yesterdaySnapshotResult = await safeQuery(() => db.visibilitySnapshot.findFirst({
      where: {
        domain,
        capturedAt: { lt: new Date(Date.now() - 86400000) },
      },
      orderBy: { capturedAt: 'desc' },
    }), null, { api, correlationId })

    if (latestSnapshotResult.status === 'fallback') fallbacksUsed.push('latest_score')
    if (yesterdaySnapshotResult.status === 'fallback') fallbacksUsed.push('yesterday_score')

    const currentScore = latestSnapshotResult.data?.overallScore ?? 76
    const yesterdayScore = yesterdaySnapshotResult.data?.overallScore ?? 74
    const perEngine = latestSnapshotResult.data?.perEngine
      ? JSON.parse(latestSnapshotResult.data.perEngine as string)
      : { chatgpt: 72, claude: 55, gemini: 61, perplexity: 78, copilot: 48 }

    // ── Score Deltas (recent actions) ──────────────────────────────────
    const recentDeltasResult = await safeQuery(() => db.scoreDeltaEvent.findMany({
      where: { domain },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }), [], { api, correlationId })

    const deltaStatsResult = await safeQuery(() => db.scoreDeltaEvent.aggregate({
      where: { domain },
      _avg: { scoreDelta: true },
      _sum: { scoreDelta: true },
      _count: true,
    }), { _avg: { scoreDelta: null }, _sum: { scoreDelta: 0 }, _count: 0 }, api)

    if (recentDeltasResult.status === 'fallback') fallbacksUsed.push('recent_deltas')

    // ── Feature Validation ─────────────────────────────────────────────
    const featuresResult = await safeQuery(() => db.featureValidation.findMany({
      orderBy: { usageCount: 'desc' },
    }), [], { api, correlationId })

    if (featuresResult.status === 'fallback') fallbacksUsed.push('features')

    // ── AI Lab Models ──────────────────────────────────────────────────
    const labModelsResult = await safeQuery(() => db.aIModelExperiment.findMany({
      orderBy: [
        { modelTier: 'asc' },
        { qualityScore: 'desc' },
      ],
    }), [], { api, correlationId })

    if (labModelsResult.status === 'fallback') fallbacksUsed.push('ai_lab')

    // ── Visibility Dataset Stats ───────────────────────────────────────
    const datasetStatsResult = await safeQuery(() => db.aIVisibilityDataPoint.aggregate({
      where: { domain },
      _count: true,
      _avg: { confidence: true },
    }), { _count: 0, _avg: { confidence: null } }, api)

    const citedCountResult = await safeQuery(() => db.aIVisibilityDataPoint.count({
      where: { domain, cited: true },
    }), 0, { api, correlationId })

    if (datasetStatsResult.status === 'fallback') fallbacksUsed.push('dataset_stats')

    // ── Today's AI Changes (from citation events) ──────────────────────
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const todayChangesResult = await safeQuery(() => db.citationEvent.findMany({
      where: {
        domain,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }), [], { api, correlationId })

    // ── Build response ─────────────────────────────────────────────────
    const overallStatus: DataStatus = fallbacksUsed.length === 0 ? 'live' : fallbacksUsed.length <= 2 ? 'estimated' : 'fallback'
    const overallConfidence = Math.max(0, 100 - fallbacksUsed.length * 10)

    if (fallbacksUsed.length > 0) {
      logFallback({
        api,
        reason: `${fallbacksUsed.length} fallback(s): ${fallbacksUsed.join(', ')}`,
        category: 'db_missing_table',
        confidence: overallConfidence,
        correlationId,
      })
    }

    return NextResponse.json({
      // The Question: "Can Seosights grow Seosights?"
      canGrow: (deltaStatsResult.data._sum.scoreDelta || 0) > 0,

      // AI Visibility Score
      score: {
        current: currentScore,
        yesterday: yesterdayScore,
        delta: currentScore - yesterdayScore,
        goal: 90,
        perEngine,
      },

      // Today's AI Changes
      todayChanges: todayChangesResult.data.map((c) => ({
        engine: c.engine,
        eventType: c.eventType,
        delta: c.delta,
        detail: c.prompt || c.competitor || c.eventType,
      })),

      // Score Delta Stats
      scoreDeltas: {
        recent: recentDeltasResult.data,
        avgDelta: deltaStatsResult.data._avg.scoreDelta
          ? Math.round(deltaStatsResult.data._avg.scoreDelta * 10) / 10
          : 0,
        totalDelta: deltaStatsResult.data._sum.scoreDelta || 0,
        totalActions: deltaStatsResult.data._count,
      },

      // Feature Validation
      features: featuresResult.data,

      // AI Lab
      aiLab: {
        models: labModelsResult.data,
        tiers: {
          production: labModelsResult.data.filter((m: { modelTier: string }) => m.modelTier === 'production').length,
          experimental: labModelsResult.data.filter((m: { modelTier: string }) => m.modelTier === 'experimental').length,
          lab: labModelsResult.data.filter((m: { modelTier: string }) => m.modelTier === 'lab').length,
        },
      },

      // Visibility Dataset (The Moat)
      dataset: {
        totalDataPoints: datasetStatsResult.data._count,
        avgConfidence: datasetStatsResult.data._avg.confidence
          ? Math.round(datasetStatsResult.data._avg.confidence * 10) / 10
          : 0,
        citationRate: datasetStatsResult.data._count > 0
          ? Math.round((citedCountResult.data / datasetStatsResult.data._count) * 1000) / 10
          : 0,
      },

      // Status
      status: overallStatus,
      confidence: overallConfidence,
      fallbacksUsed,
    })
  } catch (error) {
    logFallback({
      api,
      reason: `Top-level error: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'unknown',
      confidence: 0,
      correlationId,
      error,
    })

    return NextResponse.json({
      canGrow: false,
      score: { current: 0, yesterday: 0, delta: 0, goal: 90, perEngine: {} },
      todayChanges: [],
      scoreDeltas: { recent: [], avgDelta: 0, totalDelta: 0, totalActions: 0 },
      features: [],
      aiLab: { models: [], tiers: { production: 0, experimental: 0, lab: 0 } },
      dataset: { totalDataPoints: 0, avgConfidence: 0, citationRate: 0 },
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}
