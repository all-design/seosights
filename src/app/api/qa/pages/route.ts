/**
 * AI QA Center — Page Test Results
 *
 * GET /api/qa/pages
 * Returns page test results:
 * - QAPageTest records for latest run
 * - Summary stats (avg load time, error rate, etc.)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── Get latest completed run ─────────────────────────────────────────
    const latestRun = await db.qARun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        productScore: true,
        completedAt: true,
        pagesTested: true,
        clicksTested: true,
        apisTested: true,
        formsTested: true,
      },
    })

    if (!latestRun) {
      return NextResponse.json({
        hasData: false,
        message: 'No completed QA runs found.',
      })
    }

    // ── Get all page tests for this run ──────────────────────────────────
    const pageTests = await db.qAPageTest.findMany({
      where: { runId: latestRun.id },
      orderBy: [
        { hasErrors: 'desc' },  // error pages first
        { loadTime: 'desc' },   // slowest pages first
      ],
    })

    // ── Calculate summary stats ──────────────────────────────────────────
    const totalPages = pageTests.length
    const errorPages = pageTests.filter((p) => p.hasErrors)
    const pagesWithLoadTime = pageTests.filter((p) => p.loadTime !== null)
    const pagesWithLighthouse = pageTests.filter((p) => p.lighthouseScore !== null)
    const pagesWithAccessibility = pageTests.filter((p) => p.accessibilityScore !== null)

    const avgLoadTime = pagesWithLoadTime.length > 0
      ? Math.round(
          pagesWithLoadTime.reduce((sum, p) => sum + (p.loadTime || 0), 0) /
          pagesWithLoadTime.length
        )
      : 0

    const maxLoadTime = pagesWithLoadTime.length > 0
      ? Math.max(...pagesWithLoadTime.map((p) => p.loadTime || 0))
      : 0

    const minLoadTime = pagesWithLoadTime.length > 0
      ? Math.min(...pagesWithLoadTime.map((p) => p.loadTime || 0))
      : 0

    const avgLighthouseScore = pagesWithLighthouse.length > 0
      ? Math.round(
          pagesWithLighthouse.reduce((sum, p) => sum + (p.lighthouseScore || 0), 0) /
          pagesWithLighthouse.length
        )
      : 0

    const avgAccessibilityScore = pagesWithAccessibility.length > 0
      ? Math.round(
          pagesWithAccessibility.reduce((sum, p) => sum + (p.accessibilityScore || 0), 0) /
          pagesWithAccessibility.length
        )
      : 0

    const errorRate = totalPages > 0
      ? parseFloat(((errorPages.length / totalPages) * 100).toFixed(1))
      : 0

    const totalConsoleErrors = pageTests.reduce((sum, p) => sum + p.errorCount, 0)
    const totalClicksTested = pageTests.reduce((sum, p) => sum + p.clicksTested, 0)
    const totalFormsTested = pageTests.reduce((sum, p) => sum + p.formsTested, 0)
    const totalModalsOpened = pageTests.reduce((sum, p) => sum + p.modalsOpened, 0)

    // ── Performance categories ───────────────────────────────────────────
    const fastPages = pagesWithLoadTime.filter((p) => (p.loadTime || 0) < 1000).length
    const moderatePages = pagesWithLoadTime.filter((p) => {
      const lt = p.loadTime || 0
      return lt >= 1000 && lt < 2500
    }).length
    const slowPages = pagesWithLoadTime.filter((p) => (p.loadTime || 0) >= 2500).length

    // ── Slowest pages ────────────────────────────────────────────────────
    const slowestPages = [...pageTests]
      .filter((p) => p.loadTime !== null)
      .sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0))
      .slice(0, 5)
      .map((p) => ({
        route: p.route,
        url: p.url,
        loadTime: p.loadTime,
        lighthouseScore: p.lighthouseScore,
        hasErrors: p.hasErrors,
      }))

    // ── Pages with errors detail ─────────────────────────────────────────
    const errorPageDetails = errorPages.map((p) => ({
      route: p.route,
      url: p.url,
      errorCount: p.errorCount,
      consoleErrors: p.consoleErrors,
      networkErrors: p.networkErrors,
      loadTime: p.loadTime,
    }))

    return NextResponse.json({
      hasData: true,
      runId: latestRun.id,
      runStats: {
        pagesTested: latestRun.pagesTested,
        clicksTested: latestRun.clicksTested,
        apisTested: latestRun.apisTested,
        formsTested: latestRun.formsTested,
      },
      pages: pageTests,
      summary: {
        totalPages,
        errorPages: errorPages.length,
        errorRate,
        avgLoadTime,
        maxLoadTime,
        minLoadTime,
        avgLighthouseScore,
        avgAccessibilityScore,
        totalConsoleErrors,
        totalClicksTested,
        totalFormsTested,
        totalModalsOpened,
        performanceBreakdown: {
          fast: fastPages,      // < 1s
          moderate: moderatePages, // 1-2.5s
          slow: slowPages,      // > 2.5s
        },
      },
      slowestPages,
      errorPageDetails,
    })
  } catch (error) {
    console.error('[QA Pages] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page test results' },
      { status: 500 }
    )
  }
}
