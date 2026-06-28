/**
 * CEO Dashboard Metrics API
 * Queries the real database for funnel metrics: Visitors → Free Audits → Registrations →
 * Completed Audits → Activated Users → Paid Users → MRR
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function GET() {
  try {
    const today = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const yesterday = startOfDay(new Date(Date.now() - 86400000))
    const yesterdayEnd = endOfDay(new Date(Date.now() - 86400000))

    // ── Today's metrics ───────────────────────────────────────────
    const [
      visitorsToday,
      freeAuditsToday,
      registrationsToday,
      completedAuditsToday,
      totalUsers,
      totalPaidUsers,
    ] = await Promise.all([
      // Visitors: AnalyticsEvent page_view today (safe — table may not exist on Turso)
      safeQuery(() => db.analyticsEvent.count({
        where: { event: 'page_view', createdAt: { gte: today, lte: todayEnd } },
      }), 0),
      // Free audits: Analysis without userId today
      db.analysis.count({
        where: { userId: null, createdAt: { gte: today, lte: todayEnd } },
      }),
      // Registrations today
      db.user.count({
        where: { createdAt: { gte: today, lte: todayEnd } },
      }),
      // Completed audits today
      db.analysis.count({
        where: { status: 'completed', createdAt: { gte: today, lte: todayEnd } },
      }),
      // Total users
      db.user.count(),
      // Total paid users
      db.user.count({
        where: { subscriptionStatus: 'active' },
      }),
    ])

    // Activated users (non-trial users who logged in today)
    const activatedToday = await db.user.count({
      where: {
        tier: { not: 'free_trial' },
        lastLoginAt: { gte: today, lte: todayEnd },
      },
    })

    // Paid users who became paid today
    const paidToday = await db.user.count({
      where: {
        subscriptionStatus: 'active',
        updatedAt: { gte: today, lte: todayEnd },
      },
    })

    // ── Yesterday's metrics ───────────────────────────────────────
    const [
      visitorsYesterday,
      freeAuditsYesterday,
      registrationsYesterday,
      completedAuditsYesterday,
      activatedYesterday,
      paidYesterday,
    ] = await Promise.all([
      safeQuery(() => db.analyticsEvent.count({
        where: { event: 'page_view', createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }), 0),
      db.analysis.count({
        where: { userId: null, createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }),
      db.user.count({
        where: { createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }),
      db.analysis.count({
        where: { status: 'completed', createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }),
      db.user.count({
        where: {
          tier: { not: 'free_trial' },
          lastLoginAt: { gte: yesterday, lte: yesterdayEnd },
        },
      }),
      db.user.count({
        where: {
          subscriptionStatus: 'active',
          updatedAt: { gte: yesterday, lte: yesterdayEnd },
        },
      }),
    ])

    // ── MRR calculation ───────────────────────────────────────────
    const tierCounts = await db.user.groupBy({
      by: ['tier'],
      where: { subscriptionStatus: 'active' },
      _count: { tier: true },
    })

    const TIER_PRICES: Record<string, number> = {
      starter: 49,
      pro: 99,
      managed: 299,
    }

    let mrr = 0
    let mrrYesterday = 0
    for (const row of tierCounts) {
      mrr += (TIER_PRICES[row.tier] || 0) * row._count.tier
    }

    // Simple MRR estimate: if no tier data, use average $99 per paid user
    if (mrr === 0 && totalPaidUsers > 0) {
      mrr = totalPaidUsers * 99
    }

    // Yesterday MRR approximation (use same rate)
    mrrYesterday = mrr - (paidToday - paidYesterday) * 99
    if (mrrYesterday < 0) mrrYesterday = 0

    // ── Build funnel ──────────────────────────────────────────────
    const funnel = [
      {
        key: 'visitors',
        label: 'Visitors',
        value: visitorsToday,
        yesterday: visitorsYesterday,
        trend: calcTrend(visitorsToday, visitorsYesterday),
        conversionFromPrevious: null as number | null,
      },
      {
        key: 'freeAudits',
        label: 'Free Audits',
        value: freeAuditsToday,
        yesterday: freeAuditsYesterday,
        trend: calcTrend(freeAuditsToday, freeAuditsYesterday),
        conversionFromPrevious: visitorsToday > 0 ? Math.round((freeAuditsToday / visitorsToday) * 1000) / 10 : null,
      },
      {
        key: 'registrations',
        label: 'Registrations',
        value: registrationsToday,
        yesterday: registrationsYesterday,
        trend: calcTrend(registrationsToday, registrationsYesterday),
        conversionFromPrevious: freeAuditsToday > 0 ? Math.round((registrationsToday / freeAuditsToday) * 1000) / 10 : null,
      },
      {
        key: 'completedAudits',
        label: 'Completed Audits',
        value: completedAuditsToday,
        yesterday: completedAuditsYesterday,
        trend: calcTrend(completedAuditsToday, completedAuditsYesterday),
        conversionFromPrevious: registrationsToday > 0 ? Math.round((completedAuditsToday / registrationsToday) * 1000) / 10 : null,
      },
      {
        key: 'activatedUsers',
        label: 'Activated Users',
        value: activatedToday,
        yesterday: activatedYesterday,
        trend: calcTrend(activatedToday, activatedYesterday),
        conversionFromPrevious: completedAuditsToday > 0 ? Math.round((activatedToday / completedAuditsToday) * 1000) / 10 : null,
      },
      {
        key: 'paidUsers',
        label: 'Paid Users',
        value: paidToday,
        yesterday: paidYesterday,
        trend: calcTrend(paidToday, paidYesterday),
        conversionFromPrevious: activatedToday > 0 ? Math.round((paidToday / activatedToday) * 1000) / 10 : null,
      },
    ]

    // ── 7-day trend data (from DailyMetric table if available, else simplified) ──
    const sevenDaysAgo = startOfDay(new Date(Date.now() - 6 * 86400000))
    const dailyMetrics = await safeQuery(() => db.dailyMetric.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    }), [])

    let dailyTrend: Array<{ date: string; visitors: number; registrations: number; completedAudits: number; paidUsers: number }>

    if (dailyMetrics.length >= 3) {
      // Use pre-computed daily metrics
      dailyTrend = dailyMetrics.map((dm) => ({
        date: dm.date.toISOString().split('T')[0],
        visitors: dm.visitors,
        registrations: dm.registrations,
        completedAudits: dm.completedAudits,
        paidUsers: dm.paidUsers,
      }))
    } else {
      // Lightweight approach: use aggregate counts for last 7 days in a single batch
      const weekStart = startOfDay(new Date(Date.now() - 6 * 86400000))
      const [weekVisitors, weekRegistrations, weekCompleted] = await Promise.all([
        safeQuery(() => db.analyticsEvent.count({
          where: { event: 'page_view', createdAt: { gte: weekStart } },
        }), 0),
        db.user.count({
          where: { createdAt: { gte: weekStart } },
        }),
        db.analysis.count({
          where: { status: 'completed', createdAt: { gte: weekStart } },
        }),
      ])

      // Distribute evenly as approximate daily values
      dailyTrend = Array.from({ length: 7 }).map((_, i) => ({
        date: daysAgo(6 - i),
        visitors: Math.round(weekVisitors / 7),
        registrations: Math.round(weekRegistrations / 7),
        completedAudits: Math.round(weekCompleted / 7),
        paidUsers: Math.round(totalPaidUsers / 7),
      }))
    }

    return NextResponse.json({
      funnel,
      mrr: {
        value: mrr,
        yesterday: mrrYesterday,
        trend: calcTrend(mrr, mrrYesterday),
      },
      dailyTrend,
      totalUsers,
      totalPaidUsers,
      totalMrr: mrr,
    })
  } catch (error) {
    console.error('[ceo-metrics] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch CEO metrics' },
      { status: 500 }
    )
  }
}
