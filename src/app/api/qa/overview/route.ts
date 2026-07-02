/**
 * AI QA Center — Overview
 *
 * GET /api/qa/overview
 * Returns the latest QARun with all related data:
 * - Latest completed run with scores
 * - Issue counts by severity
 * - Recent 10 issues
 * - 7-day trend of scores
 * - Current product health score
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Latest completed run ──────────────────────────────────────────
    const latestRun = await db.qARun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      include: {
        reviewerResults: {
          orderBy: { score: 'desc' },
        },
      },
    })

    if (!latestRun) {
      return NextResponse.json({
        hasData: false,
        message: 'No completed QA runs found. Seed the database first.',
      })
    }

    // ── 2. Issue counts by severity ─────────────────────────────────────
    const issueCounts = await db.qAIssue.groupBy({
      by: ['severity'],
      where: { runId: latestRun.id },
      _count: { severity: true },
    })

    // ── 3. Issue counts by status ───────────────────────────────────────
    const issueStatusCounts = await db.qAIssue.groupBy({
      by: ['status'],
      where: { runId: latestRun.id },
      _count: { status: true },
    })

    // ── 4. Issue counts by category ─────────────────────────────────────
    const issueCategoryCounts = await db.qAIssue.groupBy({
      by: ['category'],
      where: { runId: latestRun.id },
      _count: { category: true },
    })

    // ── 5. Recent 10 issues ─────────────────────────────────────────────
    const recentIssues = await db.qAIssue.findMany({
      where: { runId: latestRun.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // ── 6. 7-day score trend ────────────────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const trendRuns = await db.qARun.findMany({
      where: {
        status: 'completed',
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

    // ── 7. Product health score ─────────────────────────────────────────
    // Composite health: weighted average of key scores
    const healthScore = Math.round(
      latestRun.productScore * 0.25 +
      latestRun.uxScore * 0.15 +
      latestRun.securityScore * 0.15 +
      latestRun.performanceScore * 0.10 +
      latestRun.seoScore * 0.10 +
      latestRun.accessibilityScore * 0.10 +
      latestRun.conversionScore * 0.08 +
      latestRun.customerDelight * 0.07
    )

    // ── 8. Score delta from previous run ────────────────────────────────
    const previousRun = await db.qARun.findFirst({
      where: {
        status: 'completed',
        completedAt: { lt: latestRun.completedAt! },
      },
      orderBy: { completedAt: 'desc' },
      select: { productScore: true },
    })

    const scoreDelta = previousRun
      ? latestRun.productScore - previousRun.productScore
      : 0

    // ── 9. Critical/major open issues count ─────────────────────────────
    const openCriticalMajor = await db.qAIssue.count({
      where: {
        runId: latestRun.id,
        severity: { in: ['critical', 'major'] },
        status: { in: ['open', 'confirmed'] },
      },
    })

    return NextResponse.json({
      hasData: true,
      run: latestRun,
      issueCounts: {
        critical: issueCounts.find((i) => i.severity === 'critical')?._count.severity || 0,
        major: issueCounts.find((i) => i.severity === 'major')?._count.severity || 0,
        medium: issueCounts.find((i) => i.severity === 'medium')?._count.severity || 0,
        minor: issueCounts.find((i) => i.severity === 'minor')?._count.severity || 0,
        total: issueCounts.reduce((sum, i) => sum + i._count.severity, 0),
      },
      issueStatusCounts: issueStatusCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      issueCategoryCounts: issueCategoryCounts.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      recentIssues,
      scoreTrend: trendRuns.map((r) => ({
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
        totalIssues: r.criticalCount + r.majorCount + r.mediumCount + r.minorCount,
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
