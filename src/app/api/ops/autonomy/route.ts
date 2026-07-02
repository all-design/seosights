/**
 * Autonomy Metrics API — GET /api/ops/autonomy
 *
 * Returns today's MCAutonomyMetric records plus the overall Platform Autonomy™ rate
 * and a 7-day trend.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getTodayStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function GET() {
  try {
    const todayStart = getTodayStart()
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Today's metrics
    const todayMetrics = await db.mCAutonomyMetric.findMany({
      where: {
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      orderBy: { systemName: 'asc' },
    })

    // Calculate overall autonomy rate for today
    const totalPlanned = todayMetrics.reduce((sum, m) => sum + m.planned, 0)
    const totalCompleted = todayMetrics.reduce((sum, m) => sum + m.completed, 0)
    const totalFailed = todayMetrics.reduce((sum, m) => sum + m.failed, 0)
    const overallRate = totalPlanned > 0 ? totalCompleted / totalPlanned : 0

    // 7-day trend
    const trendMetrics = await db.mCAutonomyMetric.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
          lt: tomorrowStart,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Group trend by date
    const trendByDate: Record<string, { planned: number; completed: number; failed: number; rate: number }> = {}
    for (const m of trendMetrics) {
      const dateKey = m.date.toISOString().split('T')[0]
      if (!trendByDate[dateKey]) {
        trendByDate[dateKey] = { planned: 0, completed: 0, failed: 0, rate: 0 }
      }
      trendByDate[dateKey].planned += m.planned
      trendByDate[dateKey].completed += m.completed
      trendByDate[dateKey].failed += m.failed
    }

    // Calculate rates
    const trend = Object.entries(trendByDate)
      .map(([date, data]) => ({
        date,
        ...data,
        rate: data.planned > 0 ? Math.round((data.completed / data.planned) * 1000) / 1000 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Also get the daily report for today if it exists
    const dailyReport = await db.mCDailyReport.findFirst({
      where: {
        date: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    })

    return NextResponse.json({
      today: {
        metrics: todayMetrics,
        totalPlanned,
        totalCompleted,
        totalFailed,
        overallRate: Math.round(overallRate * 1000) / 1000,
        autonomyPercentage: Math.round(overallRate * 100),
      },
      trend,
      dailyReport,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ops/autonomy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch autonomy metrics' },
      { status: 500 }
    )
  }
}
