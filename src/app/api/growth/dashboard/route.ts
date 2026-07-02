/**
 * Growth Engine — Dashboard
 *
 * GET /api/growth/dashboard
 * Returns dashboard metrics: today's snapshot, opportunity counts,
 * asset counts, recent governor decisions, and North Star calculation.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Today's snapshot (create if missing) ──────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let snapshot = await db.growthDailySnapshot.findUnique({
      where: { date: today },
    })

    if (!snapshot) {
      snapshot = await db.growthDailySnapshot.create({
        data: {
          date: today,
          dailyBudget: 20,
          assetsPublished: 0,
          assetsRejected: 0,
          assetsMerged: 0,
          assetsArchived: 0,
          avgQualityScore: 0,
          avgConfidence: 0,
          aiVisibilityGain: 0,
          citationGain: 0,
          entityGrowth: 0,
          organicGrowth: 0,
          knowledgeCoverage: 0,
          platformValueAdded: 0,
          byTypeBreakdown: '{}',
          predictionAccuracy: 0,
          successfulRate: 0,
          isSimulated: false,
        },
      })
    }

    // ── 2. Opportunity counts by status ──────────────────────────────────
    const opportunityStatusCounts = await db.growthOpportunity.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    // ── 3. Asset counts by type and status ───────────────────────────────
    const assetsByType = await db.growthAsset.groupBy({
      by: ['type'],
      _count: { type: true },
    })

    const assetsByStatus = await db.growthAsset.groupBy({
      by: ['reviewStatus'],
      _count: { reviewStatus: true },
    })

    const assetsByExecutionStatus = await db.growthAsset.groupBy({
      by: ['executionStatus'],
      _count: { executionStatus: true },
    })

    // ── 4. Recent governor decisions ─────────────────────────────────────
    const recentDecisions = await db.growthGovernorDecision.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // ── 5. North Star calculation ────────────────────────────────────────
    const assetAggregates = await db.growthAsset.aggregate({
      _sum: {
        platformValue: true,
        traffic24h: true,
        impressions24h: true,
        clicks24h: true,
        citations7d: true,
        conversions7d: true,
        aiVisibilityDelta: true,
      },
      _avg: {
        qualityScore: true,
      },
      _count: true,
    })

    const northStar = {
      platformValue: assetAggregates._sum.platformValue || 0,
      totalAssets: assetAggregates._count,
      avgQuality: Math.round((assetAggregates._avg.qualityScore || 0) * 10) / 10,
      totalTraffic24h: assetAggregates._sum.traffic24h || 0,
      totalImpressions24h: assetAggregates._sum.impressions24h || 0,
      totalClicks24h: assetAggregates._sum.clicks24h || 0,
      totalCitations7d: assetAggregates._sum.citations7d || 0,
      totalConversions7d: assetAggregates._sum.conversions7d || 0,
      totalAiVisibilityDelta: assetAggregates._sum.aiVisibilityDelta || 0,
    }

    // ── 6. 7-day snapshot trend ──────────────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const snapshotTrend = await db.growthDailySnapshot.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    })

    // ── 7. Priority distribution ─────────────────────────────────────────
    const opportunityPriorityCounts = await db.growthOpportunity.groupBy({
      by: ['priority'],
      _count: { priority: true },
    })

    return NextResponse.json({
      snapshot,
      opportunityStatusCounts: opportunityStatusCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      opportunityPriorityCounts: opportunityPriorityCounts.map((p) => ({
        priority: p.priority,
        count: p._count.priority,
      })),
      assetsByType: assetsByType.map((t) => ({ type: t.type, count: t._count.type })),
      assetsByReviewStatus: assetsByStatus.map((s) => ({
        reviewStatus: s.reviewStatus,
        count: s._count.reviewStatus,
      })),
      assetsByExecutionStatus: assetsByExecutionStatus.map((s) => ({
        executionStatus: s.executionStatus,
        count: s._count.executionStatus,
      })),
      recentDecisions,
      northStar,
      snapshotTrend,
    })
  } catch (error) {
    console.error('[Growth Dashboard] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
