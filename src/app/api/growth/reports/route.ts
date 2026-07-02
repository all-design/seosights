/**
 * Growth Engine — Reports
 *
 * GET /api/growth/reports
 * Returns the latest GrowthReport and an archive of the last 30 reports.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Latest report ─────────────────────────────────────────────────
    const latestReport = await db.growthReport.findFirst({
      orderBy: { date: 'desc' },
    })

    // ── 2. Archive of reports (last 30) ──────────────────────────────────
    const archive = await db.growthReport.findMany({
      take: 30,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        headline: true,
        assetsAdded: true,
        expectedImpact: true,
        createdAt: true,
      },
    })

    // ── 3. Report statistics ─────────────────────────────────────────────
    const totalReports = await db.growthReport.count()

    const reportStats = await db.growthReport.aggregate({
      _sum: { assetsAdded: true },
      _avg: { assetsAdded: true },
    })

    return NextResponse.json({
      latest: latestReport,
      archive,
      stats: {
        totalReports,
        totalAssetsAdded: reportStats._sum.assetsAdded || 0,
        avgAssetsPerReport: Math.round((reportStats._avg.assetsAdded || 0) * 10) / 10,
      },
    })
  } catch (error) {
    console.error('[Growth Reports] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports data' },
      { status: 500 }
    )
  }
}
