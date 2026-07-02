/**
 * Growth Engine — Execution
 *
 * GET /api/growth/execution
 * Returns currently publishing assets, recently published assets,
 * and execution statistics.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Currently publishing ──────────────────────────────────────────
    const currentlyPublishing = await db.growthAsset.findMany({
      where: { executionStatus: 'publishing' },
      orderBy: { updatedAt: 'desc' },
      include: { opportunity: true },
    })

    // ── 2. Recently published (last 20) ──────────────────────────────────
    const recentlyPublished = await db.growthAsset.findMany({
      where: {
        executionStatus: { in: ['indexed', 'pending'] },
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      include: { opportunity: true },
    })

    // ── 3. Execution statistics ──────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalPublishing,
      totalIndexed,
      totalFailed,
      publishedToday,
      totalPublished,
    ] = await Promise.all([
      db.growthAsset.count({ where: { executionStatus: 'publishing' } }),
      db.growthAsset.count({ where: { executionStatus: 'indexed' } }),
      db.growthAsset.count({ where: { executionStatus: 'failed' } }),
      db.growthAsset.count({
        where: {
          publishedAt: { gte: today },
        },
      }),
      db.growthAsset.count({
        where: { publishedAt: { not: null } },
      }),
    ])

    // ── 4. Performance of published assets ───────────────────────────────
    const publishedPerformance = await db.growthAsset.aggregate({
      _sum: {
        traffic24h: true,
        impressions24h: true,
        clicks24h: true,
        citations7d: true,
        conversions7d: true,
      },
      _avg: {
        aiVisibilityDelta: true,
        platformValue: true,
      },
      where: {
        executionStatus: 'indexed',
      },
    })

    // ── 5. Success rate ──────────────────────────────────────────────────
    const successRate = totalPublished > 0
      ? Math.round((totalIndexed / totalPublished) * 100)
      : 0

    return NextResponse.json({
      currentlyPublishing,
      recentlyPublished,
      stats: {
        totalPublishing,
        totalIndexed,
        totalFailed,
        publishedToday,
        totalPublished,
        successRate,
        performance: {
          totalTraffic24h: publishedPerformance._sum.traffic24h || 0,
          totalImpressions24h: publishedPerformance._sum.impressions24h || 0,
          totalClicks24h: publishedPerformance._sum.clicks24h || 0,
          totalCitations7d: publishedPerformance._sum.citations7d || 0,
          totalConversions7d: publishedPerformance._sum.conversions7d || 0,
          avgAiVisibilityDelta: Math.round((publishedPerformance._avg.aiVisibilityDelta || 0) * 100) / 100,
          avgPlatformValue: Math.round((publishedPerformance._avg.platformValue || 0) * 100) / 100,
        },
      },
    })
  } catch (error) {
    console.error('[Growth Execution] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution data' },
      { status: 500 }
    )
  }
}
