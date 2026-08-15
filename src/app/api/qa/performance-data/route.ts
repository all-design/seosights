/**
 * QA Performance Data — GET /api/qa/performance-data
 *
 * Queries real performance audit results from the database:
 *  1. Latest QARun with performanceScore > 0 (from Lighthouse audit)
 *  2. Performance-related QAIssues from that run
 *  3. QAPageTest entries (TTFB/load-time by route)
 *  4. RUM vitals from the vitals endpoint
 *
 * Returns { hasRealData: true, ... } when real data exists,
 * or { hasRealData: false } when no audit has been run.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ── 1. Latest performance audit run ──────────────────────────────
    let auditRun: any = null
    try {
      auditRun = await db.qARun.findFirst({
        where: {
          status: { in: ['completed', 'passed'] },
          performanceScore: { gt: 0 },
        },
        orderBy: { completedAt: 'desc' },
      })
    } catch {
      // DB may be unavailable
    }

    if (!auditRun) {
      return NextResponse.json({ hasRealData: false })
    }

    // ── 2. Performance issues from the audit run ─────────────────────
    let perfIssues: any[] = []
    try {
      perfIssues = await db.qAIssue.findMany({
        where: {
          runId: auditRun.id,
          category: { startsWith: 'performance' },
        },
        orderBy: { severity: 'desc' },
        take: 20,
      })
    } catch {
      // Ignore
    }

    // ── 3. Page test results (route-level timings) ──────────────────
    let pageTests: any[] = []
    try {
      pageTests = await db.qAPageTest.findMany({
        where: { runId: auditRun.id },
        orderBy: { loadTime: 'desc' },
      })
    } catch {
      // Ignore
    }

    // ── 4. RUM vitals data ──────────────────────────────────────────
    let rumData: any = null
    try {
      const rumRun = await db.qARun.findFirst({
        where: { triggeredBy: 'rum_vitals', status: 'completed' },
        orderBy: { startedAt: 'desc' },
      })

      if (rumRun) {
        const rumTests = await db.qAPageTest.findMany({
          where: { runId: rumRun.id },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })

        // Aggregate RUM by route
        const byRoute: Record<string, { count: number; avgLoadTime: number; maxLoadTime: number; poorCount: number }> = {}
        for (const test of rumTests) {
          const route = test.route || '/'
          if (!byRoute[route]) {
            byRoute[route] = { count: 0, avgLoadTime: 0, maxLoadTime: 0, poorCount: 0 }
          }
          byRoute[route].count++
          byRoute[route].avgLoadTime += test.loadTime
          byRoute[route].maxLoadTime = Math.max(byRoute[route].maxLoadTime, test.loadTime)
          if (test.hasErrors) byRoute[route].poorCount++
        }
        for (const route of Object.keys(byRoute)) {
          byRoute[route].avgLoadTime = Math.round(byRoute[route].avgLoadTime / byRoute[route].count)
        }

        rumData = {
          runId: rumRun.id,
          startedAt: rumRun.startedAt,
          totalMeasurements: rumTests.length,
          byRoute,
        }
      }
    } catch {
      // Ignore
    }

    // ── 5. Build lighthouse metrics from the run ────────────────────
    // The performance audit stores lighthouse data in QAIssue evidence fields
    // and the performanceScore on the run.
    const performanceScore = auditRun.performanceScore || 0
    const accessibilityScore = auditRun.accessibilityScore || 0
    const seoScore = auditRun.seoScore || 0

    // Extract core vitals from issues (they store metric values in evidence JSON)
    let fcp: number | null = null
    let lcp: number | null = null
    let cls: number | null = null
    let ttfb: number | null = null
    let tti: number | null = null
    let tbt: number | null = null
    let inp: number | null = null

    for (const issue of perfIssues) {
      try {
        const evidence = JSON.parse(issue.evidence || '{}')
        const metric = evidence.metric || ''
        const value = evidence.value
        if (typeof value !== 'number') continue
        if (metric === 'FCP' && fcp === null) fcp = value
        else if (metric === 'LCP' && lcp === null) lcp = value
        else if (metric === 'CLS' && cls === null) cls = value
        else if (metric === 'TTFB' && ttfb === null) ttfb = value
        else if (metric === 'TTI' && tti === null) tti = value
        else if (metric === 'TBT' && tbt === null) tbt = value
        else if (metric === 'INP' && inp === null) inp = value
      } catch {
        // Skip malformed evidence
      }
    }

    // ── 6. Build bundle data from issues ────────────────────────────
    const bundleIssues = perfIssues.filter((i: any) => i.category === 'performance_bundle')
    const bundleData = bundleIssues.map((issue: any) => {
      try {
        const evidence = JSON.parse(issue.evidence || '{}')
        return {
          name: issue.title.replace(/ bundle:.*/,'').trim(),
          size: evidence.value || 0,
          unit: 'KB',
        }
      } catch {
        return null
      }
    }).filter(Boolean)

    // ── 7. Build image issues from category ─────────────────────────
    const imageIssues = perfIssues
      .filter((i: any) => i.category === 'performance_image-optimization')
      .map((issue: any) => ({
        image: issue.page || 'unknown',
        issue: issue.title,
        savings: issue.fixSuggestion || '',
      }))

    // ── 8. Build TTFB by route from page tests ──────────────────────
    const ttfbByRoute = pageTests.map((test: any) => ({
      route: test.route || test.url || '/',
      ttfb: `${test.loadTime}ms`,
      loadTime: test.loadTime,
      status: test.loadTime < 200 ? 'good' : test.loadTime < 500 ? 'needs-work' : 'poor',
    }))

    // ── 9. Build core web vitals assessment ─────────────────────────
    const coreWebVitals = [
      {
        name: 'LCP',
        value: lcp !== null ? `${lcp.toFixed(1)}s` : null,
        rawValue: lcp,
        threshold: '< 2.5s',
        status: lcp !== null ? (lcp <= 2.5 ? 'pass' : 'fail') : null,
      },
      {
        name: 'FID',
        value: tbt !== null ? `${Math.round(tbt * 0.2)}ms` : null, // FID approximated from TBT
        rawValue: tbt !== null ? tbt * 0.2 : null,
        threshold: '< 100ms',
        status: tbt !== null ? (tbt * 0.2 < 100 ? 'pass' : 'fail') : null,
      },
      {
        name: 'CLS',
        value: cls !== null ? `${cls.toFixed(3)}` : null,
        rawValue: cls,
        threshold: '< 0.1',
        status: cls !== null ? (cls <= 0.1 ? 'pass' : 'fail') : null,
      },
      {
        name: 'INP',
        value: inp !== null ? `${Math.round(inp)}ms` : (tti !== null ? `${Math.round(tti * 0.3)}ms` : null),
        rawValue: inp ?? (tti !== null ? tti * 0.3 : null),
        threshold: '< 200ms',
        status: (inp ?? (tti !== null ? tti * 0.3 : null)) !== null
          ? ((inp ?? (tti! * 0.3)) <= 200 ? 'pass' : 'fail')
          : null,
      },
      {
        name: 'TTFB',
        value: ttfb !== null ? `${Math.round(ttfb)}ms` : null,
        rawValue: ttfb,
        threshold: '< 800ms',
        status: ttfb !== null ? (ttfb <= 800 ? 'pass' : 'fail') : null,
      },
    ]

    return NextResponse.json({
      hasRealData: true,
      auditRun: {
        id: auditRun.id,
        performanceScore,
        accessibilityScore,
        seoScore,
        completedAt: auditRun.completedAt,
        triggeredBy: auditRun.triggeredBy,
        duration: auditRun.duration,
      },
      lighthouse: {
        performance: performanceScore,
        fcp,
        lcp,
        cls,
        ttfb,
        tti,
        tbt,
      },
      bundleData,
      imageIssues,
      ttfbByRoute,
      coreWebVitals,
      rumData,
      issueCount: perfIssues.length,
      pageTestCount: pageTests.length,
    })
  } catch (error: any) {
    console.error('[QA Performance Data] Error:', error)
    return NextResponse.json({ hasRealData: false, error: error.message })
  }
}
