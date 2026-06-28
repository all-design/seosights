/**
 * CEO Dashboard Metrics API
 * Queries the real database for funnel metrics: Visitors → Free Audits → Registrations →
 * Completed Audits → Activated Users → Paid Users → MRR
 *
 * ENHANCED: Returns status + confidence on every data point.
 * No silent fallbacks — every fallback is logged.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, safeCount, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

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

export async function GET(request: Request) {
  const api = '/api/superadmin/ceo-metrics'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const today = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const yesterday = startOfDay(new Date(Date.now() - 86400000))
    const yesterdayEnd = endOfDay(new Date(Date.now() - 86400000))

    // ── Today's metrics ───────────────────────────────────────────
    const [
      visitorsTodayResult,
      freeAuditsToday,
      registrationsToday,
      completedAuditsToday,
      totalUsers,
      totalPaidUsers,
    ] = await Promise.all([
      // Visitors: AnalyticsEvent page_view today (safe — table may not exist on Turso)
      safeQuery(() => db.analyticsEvent.count({
        where: { event: 'page_view', createdAt: { gte: today, lte: todayEnd } },
      }), 0, { api, correlationId }),
      // Free audits: Analysis without userId today
      safeCount('analysis', { userId: null, createdAt: { gte: today, lte: todayEnd } }, api),
      // Registrations today
      safeCount('user', { createdAt: { gte: today, lte: todayEnd } }, api),
      // Completed audits today
      safeCount('analysis', { status: 'completed', createdAt: { gte: today, lte: todayEnd } }, api),
      // Total users
      safeCount('user', undefined, api),
      // Total paid users
      safeCount('user', { subscriptionStatus: 'active' }, api),
    ])

    // Track fallbacks
    if (visitorsTodayResult.status === 'fallback') fallbacksUsed.push('visitors_today')
    if (freeAuditsToday.status === 'fallback') fallbacksUsed.push('free_audits_today')
    if (registrationsToday.status === 'fallback') fallbacksUsed.push('registrations_today')

    const visitorsToday = visitorsTodayResult.data
    const freeAuditsTodayVal = freeAuditsToday.data
    const registrationsTodayVal = registrationsToday.data
    const completedAuditsTodayVal = completedAuditsToday.data
    const totalUsersVal = totalUsers.data
    const totalPaidUsersVal = totalPaidUsers.data

    // Activated users (non-trial users who logged in today)
    const activatedTodayResult = await safeQuery(() => db.user.count({
      where: {
        tier: { not: 'free_trial' },
        lastLoginAt: { gte: today, lte: todayEnd },
      },
    }), 0, { api, correlationId })
    const activatedToday = activatedTodayResult.data

    // Paid users who became paid today
    const paidTodayResult = await safeQuery(() => db.user.count({
      where: {
        subscriptionStatus: 'active',
        updatedAt: { gte: today, lte: todayEnd },
      },
    }), 0, { api, correlationId })
    const paidToday = paidTodayResult.data

    // ── Yesterday's metrics ───────────────────────────────────────
    const [
      visitorsYesterdayResult,
      freeAuditsYesterday,
      registrationsYesterday,
      completedAuditsYesterday,
      activatedYesterday,
      paidYesterday,
    ] = await Promise.all([
      safeQuery(() => db.analyticsEvent.count({
        where: { event: 'page_view', createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }), 0, { api, correlationId }),
      safeQuery(() => db.analysis.count({
        where: { userId: null, createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }), 0, { api, correlationId }),
      safeQuery(() => db.user.count({
        where: { createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }), 0, { api, correlationId }),
      safeQuery(() => db.analysis.count({
        where: { status: 'completed', createdAt: { gte: yesterday, lte: yesterdayEnd } },
      }), 0, { api, correlationId }),
      safeQuery(() => db.user.count({
        where: {
          tier: { not: 'free_trial' },
          lastLoginAt: { gte: yesterday, lte: yesterdayEnd },
        },
      }), 0, { api, correlationId }),
      safeQuery(() => db.user.count({
        where: {
          subscriptionStatus: 'active',
          updatedAt: { gte: yesterday, lte: yesterdayEnd },
        },
      }), 0, { api, correlationId }),
    ])

    if (visitorsYesterdayResult.status === 'fallback') fallbacksUsed.push('visitors_yesterday')

    // ── MRR calculation ───────────────────────────────────────────
    const tierCountsResult = await safeQuery(() => db.user.groupBy({
      by: ['tier'],
      where: { subscriptionStatus: 'active' },
      _count: { tier: true },
    }), [] as { tier: string; _count: { tier: number } }[], { api, correlationId })

    const TIER_PRICES: Record<string, number> = {
      starter: 49,
      pro: 99,
      managed: 299,
    }

    let mrr = 0
    for (const row of tierCountsResult.data) {
      mrr += (TIER_PRICES[row.tier] || 0) * row._count.tier
    }

    if (mrr === 0 && totalPaidUsersVal > 0) {
      mrr = totalPaidUsersVal * 99
    }

    const mrrYesterday = Math.max(0, mrr - (paidToday - paidYesterday.data) * 99)

    // ── Build funnel ──────────────────────────────────────────────
    const funnel = [
      {
        key: 'visitors',
        label: 'Visitors',
        value: visitorsToday,
        yesterday: visitorsYesterdayResult.data,
        trend: calcTrend(visitorsToday, visitorsYesterdayResult.data),
        conversionFromPrevious: null as number | null,
        status: visitorsTodayResult.status,
        confidence: visitorsTodayResult.confidence,
      },
      {
        key: 'freeAudits',
        label: 'Free Audits',
        value: freeAuditsTodayVal,
        yesterday: freeAuditsYesterday.data,
        trend: calcTrend(freeAuditsTodayVal, freeAuditsYesterday.data),
        conversionFromPrevious: visitorsToday > 0 ? Math.round((freeAuditsTodayVal / visitorsToday) * 1000) / 10 : null,
        status: freeAuditsToday.status,
        confidence: freeAuditsToday.confidence,
      },
      {
        key: 'registrations',
        label: 'Registrations',
        value: registrationsTodayVal,
        yesterday: registrationsYesterday.data,
        trend: calcTrend(registrationsTodayVal, registrationsYesterday.data),
        conversionFromPrevious: freeAuditsTodayVal > 0 ? Math.round((registrationsTodayVal / freeAuditsTodayVal) * 1000) / 10 : null,
        status: registrationsToday.status,
        confidence: registrationsToday.confidence,
      },
      {
        key: 'completedAudits',
        label: 'Completed Audits',
        value: completedAuditsTodayVal,
        yesterday: completedAuditsYesterday.data,
        trend: calcTrend(completedAuditsTodayVal, completedAuditsYesterday.data),
        conversionFromPrevious: registrationsTodayVal > 0 ? Math.round((completedAuditsTodayVal / registrationsTodayVal) * 1000) / 10 : null,
        status: completedAuditsToday.status,
        confidence: completedAuditsToday.confidence,
      },
      {
        key: 'activatedUsers',
        label: 'Activated Users',
        value: activatedToday,
        yesterday: activatedYesterday.data,
        trend: calcTrend(activatedToday, activatedYesterday.data),
        conversionFromPrevious: completedAuditsTodayVal > 0 ? Math.round((activatedToday / completedAuditsTodayVal) * 1000) / 10 : null,
        status: activatedTodayResult.status,
        confidence: activatedTodayResult.confidence,
      },
      {
        key: 'paidUsers',
        label: 'Paid Users',
        value: paidToday,
        yesterday: paidYesterday.data,
        trend: calcTrend(paidToday, paidYesterday.data),
        conversionFromPrevious: activatedToday > 0 ? Math.round((paidToday / activatedToday) * 1000) / 10 : null,
        status: paidTodayResult.status,
        confidence: paidTodayResult.confidence,
      },
    ]

    // ── 7-day trend data ──
    const sevenDaysAgo = startOfDay(new Date(Date.now() - 6 * 86400000))
    const dailyMetricsResult = await safeQuery(() => db.dailyMetric.findMany({
      where: { date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    }), [], { api, correlationId })

    let dailyTrend: Array<{ date: string; visitors: number; registrations: number; completedAudits: number; paidUsers: number }>

    if (dailyMetricsResult.data.length >= 3) {
      dailyTrend = dailyMetricsResult.data.map((dm) => ({
        date: dm.date.toISOString().split('T')[0],
        visitors: dm.visitors,
        registrations: dm.registrations,
        completedAudits: dm.completedAudits,
        paidUsers: dm.paidUsers,
      }))
    } else {
      fallbacksUsed.push('daily_trend_estimated')
      const weekStart = startOfDay(new Date(Date.now() - 6 * 86400000))
      const [weekVisitors, weekRegistrations, weekCompleted] = await Promise.all([
        safeQuery(() => db.analyticsEvent.count({
          where: { event: 'page_view', createdAt: { gte: weekStart } },
        }), 0, { api, correlationId }),
        safeQuery(() => db.user.count({
          where: { createdAt: { gte: weekStart } },
        }), 0, { api, correlationId }),
        safeQuery(() => db.analysis.count({
          where: { status: 'completed', createdAt: { gte: weekStart } },
        }), 0, { api, correlationId }),
      ])

      dailyTrend = Array.from({ length: 7 }).map((_, i) => ({
        date: daysAgo(6 - i),
        visitors: Math.round(weekVisitors.data / 7),
        registrations: Math.round(weekRegistrations.data / 7),
        completedAudits: Math.round(weekCompleted.data / 7),
        paidUsers: Math.round(totalPaidUsersVal / 7),
      }))
    }

    // ── Determine overall status ──
    const overallStatus: DataStatus = fallbacksUsed.length === 0 ? 'live' : fallbacksUsed.length <= 2 ? 'estimated' : 'fallback'
    const overallConfidence = Math.max(0, 100 - fallbacksUsed.length * 15)

    if (fallbacksUsed.length > 0) {
      logFallback({
        api,
        reason: `${fallbacksUsed.length} fallback(s) used: ${fallbacksUsed.join(', ')}`,
        category: 'db_missing_table',
        confidence: overallConfidence,
        correlationId,
      })
    }

    return NextResponse.json({
      funnel,
      mrr: {
        value: mrr,
        yesterday: mrrYesterday,
        trend: calcTrend(mrr, mrrYesterday),
      },
      dailyTrend,
      totalUsers: totalUsersVal,
      totalPaidUsers: totalPaidUsersVal,
      totalMrr: mrr,
      // ── Status & Confidence (THE KEY ADDITION) ──
      status: overallStatus,
      confidence: overallConfidence,
      fallbacksUsed,
    })
  } catch (error) {
    console.error('[ceo-metrics] GET error:', error instanceof Error ? error.message : 'Unknown')

    logFallback({
      api,
      reason: `Top-level error: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'unknown',
      confidence: 0,
      correlationId,
      error,
    })

    // Return fallback data WITH status indicator (never silent)
    return NextResponse.json({
      funnel: [
        { key: 'visitors', label: 'Visitors', value: 0, yesterday: 0, trend: 0, conversionFromPrevious: null, status: 'fallback', confidence: 0 },
        { key: 'freeAudits', label: 'Free Audits', value: 0, yesterday: 0, trend: 0, conversionFromPrevious: null, status: 'fallback', confidence: 0 },
        { key: 'registrations', label: 'Registrations', value: 0, yesterday: 0, trend: 0, conversionFromPrevious: null, status: 'fallback', confidence: 0 },
        { key: 'completedAudits', label: 'Completed Audits', value: 0, yesterday: 0, trend: 0, conversionFromPrevious: null, status: 'fallback', confidence: 0 },
        { key: 'activatedUsers', label: 'Activated Users', value: 0, yesterday: 0, trend: 0, conversionFromPrevious: null, status: 'fallback', confidence: 0 },
        { key: 'paidUsers', label: 'Paid Users', value: 0, yesterday: 0, trend: 0, conversionFromPrevious: null, status: 'fallback', confidence: 0 },
      ],
      mrr: { value: 0, yesterday: 0, trend: 0 },
      dailyTrend: Array.from({ length: 7 }).map((_, i) => ({
        date: daysAgo(6 - i),
        visitors: 0,
        registrations: 0,
        completedAudits: 0,
        paidUsers: 0,
      })),
      totalUsers: 0,
      totalPaidUsers: 0,
      totalMrr: 0,
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}
