/**
 * AI QA Center — Board Report
 *
 * GET /api/qa/board-report
 * Returns board reports:
 * - Latest QABoardReport
 * - Archive of last 30 reports
 * - Score trend data
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Latest board report ───────────────────────────────────────────
    const latestReport = await db.qABoardReport.findFirst({
      orderBy: { date: 'desc' },
    })

    if (!latestReport) {
      return NextResponse.json({
        hasData: false,
        message: 'No board reports found. Seed the database first.',
      })
    }

    // ── 2. Archive of last 30 reports ────────────────────────────────────
    const archive = await db.qABoardReport.findMany({
      orderBy: { date: 'desc' },
      take: 30,
      select: {
        id: true,
        date: true,
        productScore: true,
        uxScore: true,
        engineeringScore: true,
        researchScore: true,
        conversionScore: true,
        enterpriseScore: true,
        customerDelight: true,
        technicalDebt: true,
        biggestRisk: true,
        todayPriority: true,
        confidence: true,
        scoreDelta: true,
        createdAt: true,
      },
    })

    // ── 3. Score trend data (all reports ordered by date) ────────────────
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const trendData = await db.qABoardReport.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        productScore: true,
        uxScore: true,
        engineeringScore: true,
        conversionScore: true,
        customerDelight: true,
        technicalDebt: true,
        scoreDelta: true,
        confidence: true,
      },
    })

    // ── 4. Calculate averages from archive ───────────────────────────────
    const reportCount = archive.length
    const averages = reportCount > 0
      ? {
          productScore: Math.round(archive.reduce((s, r) => s + r.productScore, 0) / reportCount),
          uxScore: Math.round(archive.reduce((s, r) => s + r.uxScore, 0) / reportCount),
          engineeringScore: Math.round(archive.reduce((s, r) => s + r.engineeringScore, 0) / reportCount),
          conversionScore: Math.round(archive.reduce((s, r) => s + r.conversionScore, 0) / reportCount),
          customerDelight: Math.round(archive.reduce((s, r) => s + r.customerDelight, 0) / reportCount),
          technicalDebt: Math.round(archive.reduce((s, r) => s + r.technicalDebt, 0) / reportCount),
          confidence: parseFloat((archive.reduce((s, r) => s + r.confidence, 0) / reportCount).toFixed(2)),
        }
      : null

    // ── 5. Previous report for comparison ────────────────────────────────
    const previousReport = await db.qABoardReport.findFirst({
      where: { date: { lt: latestReport.date } },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      hasData: true,
      latest: latestReport,
      previous: previousReport,
      archive,
      trend: trendData,
      averages,
    })
  } catch (error) {
    console.error('[QA Board Report] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board report' },
      { status: 500 }
    )
  }
}
