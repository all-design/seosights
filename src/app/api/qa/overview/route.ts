/**
 * AI QA Center — Overview
 *
 * GET /api/qa/overview
 * Returns the latest QARun with all related data.
 * Each section is wrapped in its own try/catch for resilience.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ── 1. Latest run (try multiple status values) ────────────────────────
    let latestRun: any = null
    for (const statuses of [
      ['completed', 'passed', 'failed', 'warning'],
      ['completed'],
      ['passed'],
    ]) {
      try {
        latestRun = await db.qARun.findFirst({
          where: { status: { in: statuses } },
          orderBy: { completedAt: 'desc' },
          include: {
            reviewerResults: { orderBy: { score: 'desc' } },
          },
        })
        if (latestRun) break
      } catch {
        // Try next status list
      }
    }

    // Try without include if the above failed
    if (!latestRun) {
      try {
        latestRun = await db.qARun.findFirst({
          orderBy: { completedAt: 'desc' },
        })
      } catch {
        // DB completely unavailable
      }
    }

    if (!latestRun) {
      return NextResponse.json({
        hasData: false,
        message: 'No completed QA runs found. Run a QA scan first.',
      })
    }

    // ── 2. Issue counts by severity ─────────────────────────────────────
    let issueCounts: any[] = []
    try {
      issueCounts = await db.qAIssue.groupBy({
        by: ['severity'],
        where: { runId: latestRun.id },
        _count: { severity: true },
      })
    } catch {
      // Ignore
    }

    // ── 3. Issue counts by status ───────────────────────────────────────
    let issueStatusCounts: any[] = []
    try {
      issueStatusCounts = await db.qAIssue.groupBy({
        by: ['status'],
        where: { runId: latestRun.id },
        _count: { status: true },
      })
    } catch {
      // Ignore
    }

    // ── 4. Issue counts by category ─────────────────────────────────────
    let issueCategoryCounts: any[] = []
    try {
      issueCategoryCounts = await db.qAIssue.groupBy({
        by: ['category'],
        where: { runId: latestRun.id },
        _count: { category: true },
      })
    } catch {
      // Ignore
    }

    // ── 5. Recent 10 issues ─────────────────────────────────────────────
    let recentIssues: any[] = []
    try {
      recentIssues = await db.qAIssue.findMany({
        where: { runId: latestRun.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    } catch {
      // Ignore
    }

    // ── 6. 7-day score trend ────────────────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    let trendRuns: any[] = []
    try {
      trendRuns = await db.qARun.findMany({
        where: {
          status: { in: ['completed', 'passed', 'failed', 'warning'] },
          completedAt: { gte: sevenDaysAgo },
        },
        orderBy: { completedAt: 'asc' },
        select: {
          id: true,
          completedAt: true,
          productScore: true,
          uxScore: true,
          engineeringScore: true,
          securityScore: true,
          performanceScore: true,
          seoScore: true,
          accessibilityScore: true,
          conversionScore: true,
          customerDelight: true,
          technicalDebt: true,
          criticalCount: true,
          majorCount: true,
          mediumCount: true,
          minorCount: true,
        },
      })
    } catch {
      // Ignore
    }

    // ── 7. Product health score ─────────────────────────────────────────
    const healthScore = Math.round(
      (latestRun.productScore || 0) * 0.25 +
      (latestRun.uxScore || 0) * 0.15 +
      (latestRun.securityScore || 0) * 0.15 +
      (latestRun.performanceScore || 0) * 0.10 +
      (latestRun.seoScore || 0) * 0.10 +
      (latestRun.accessibilityScore || 0) * 0.10 +
      (latestRun.conversionScore || 0) * 0.08 +
      (latestRun.customerDelight || 0) * 0.07
    )

    // ── 8. Score delta from previous run ────────────────────────────────
    let scoreDelta = 0
    try {
      const previousRun = await db.qARun.findFirst({
        where: {
          status: { in: ['completed', 'passed', 'failed', 'warning'] },
          completedAt: { lt: latestRun.completedAt! },
        },
        orderBy: { completedAt: 'desc' },
        select: { productScore: true },
      })
      scoreDelta = previousRun ? (latestRun.productScore || 0) - (previousRun.productScore || 0) : 0
    } catch {
      // Ignore
    }

    // ── 9. Critical/major open issues count ─────────────────────────────
    let openCriticalMajor = 0
    try {
      openCriticalMajor = await db.qAIssue.count({
        where: {
          runId: latestRun.id,
          severity: { in: ['critical', 'major'] },
          status: { in: ['open', 'confirmed'] },
        },
      })
    } catch {
      // Ignore
    }

    return NextResponse.json({
      hasData: true,
      run: latestRun,
      issueCounts: {
        critical: issueCounts.find((i: any) => i.severity === 'critical')?._count.severity || 0,
        major: issueCounts.find((i: any) => i.severity === 'major')?._count.severity || 0,
        medium: issueCounts.find((i: any) => i.severity === 'medium')?._count.severity || 0,
        minor: issueCounts.find((i: any) => i.severity === 'minor')?._count.severity || 0,
        total: issueCounts.reduce((sum: number, i: any) => sum + i._count.severity, 0),
      },
      issueStatusCounts: issueStatusCounts.map((s: any) => ({
        status: s.status,
        count: s._count.status,
      })),
      issueCategoryCounts: issueCategoryCounts.map((c: any) => ({
        category: c.category,
        count: c._count.category,
      })),
      recentIssues,
      scoreTrend: trendRuns.map((r: any) => ({
        date: r.completedAt,
        productScore: r.productScore,
        uxScore: r.uxScore,
        engineeringScore: r.engineeringScore,
        securityScore: r.securityScore,
        performanceScore: r.performanceScore,
        seoScore: r.seoScore,
        accessibilityScore: r.accessibilityScore,
        conversionScore: r.conversionScore,
        customerDelight: r.customerDelight,
        technicalDebt: r.technicalDebt,
        totalIssues: (r.criticalCount || 0) + (r.majorCount || 0) + (r.mediumCount || 0) + (r.minorCount || 0),
      })),
      healthScore,
      scoreDelta,
      openCriticalMajor,
    })
  } catch (error) {
    console.error('[QA Overview] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QA overview' },
      { status: 500 }
    )
  }
}
