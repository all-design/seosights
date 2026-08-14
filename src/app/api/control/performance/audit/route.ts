/**
 * Performance Audit API — POST /api/control/performance/audit
 * Triggers a real Lighthouse + HTTP timing performance audit.
 *
 * Uses dynamic import for performance-audit to avoid webpack
 * bundling issues with the lighthouse package.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const baseUrl = body.baseUrl || 'http://localhost:3000'

    console.log(`[PerfAudit:API] Starting real performance audit...`)

    // Dynamic import to avoid webpack bundling lighthouse
    const { runPerformanceAudit } = await import('@/lib/performance-audit')
    const { PerformanceAuditResult: _type } = await import('@/lib/performance-audit')

    const audit = await runPerformanceAudit(baseUrl)

    // Save results to database
    const run = await db.qARun.create({
      data: {
        status: 'completed',
        triggeredBy: 'manual_api',
        startedAt: new Date(),
        completedAt: new Date(),
        duration: audit.durationMs,
        durationMs: audit.durationMs,
        performanceScore: audit.score,
        accessibilityScore: audit.lighthouse?.accessibility ?? 0,
        seoScore: audit.lighthouse?.seo ?? 0,
        productScore: audit.score,
      }
    })

    // Save issues to database
    let issueCount = 0
    for (const issue of audit.issues) {
      await db.qAIssue.create({
        data: {
          runId: run.id,
          title: issue.title,
          severity: issue.severity,
          category: `performance_${issue.category}`,
          page: issue.page,
          evidence: JSON.stringify({
            metric: issue.metric,
            value: issue.value,
            threshold: issue.threshold,
          }),
          fixSuggestion: issue.fixSuggestion,
          reviewer: 'performance_audit_api',
        },
      })
      issueCount++
    }

    // Save endpoint timings as page tests
    for (const timing of audit.endpointTimings) {
      await db.qAPageTest.create({
        data: {
          runId: run.id,
          route: timing.route,
          url: `${baseUrl}${timing.route}`,
          loadTime: timing.total,
          statusCode: timing.status,
          hasErrors: !!timing.error,
          errorCount: timing.error ? 1 : 0,
          lighthouseScore: audit.lighthouse?.performance ?? 0,
          accessibilityScore: audit.lighthouse?.accessibility ?? 0,
        },
      })
    }

    console.log(`[PerfAudit:API] Audit complete: score=${audit.score}, issues=${issueCount}`)

    return NextResponse.json({
      success: true,
      audit: {
        score: audit.score,
        timestamp: audit.timestamp,
        durationMs: audit.durationMs,
        lighthouse: audit.lighthouse ? {
          performance: audit.lighthouse.performance,
          accessibility: audit.lighthouse.accessibility,
          bestPractices: audit.lighthouse.bestPractices,
          seo: audit.lighthouse.seo,
          fcp: audit.lighthouse.fcp,
          lcp: audit.lighthouse.lcp,
          cls: audit.lighthouse.cls,
          tti: audit.lighthouse.tti,
          tbt: audit.lighthouse.tbt,
          si: audit.lighthouse.si,
          ttfb: audit.lighthouse.ttfb,
          jsSize: audit.lighthouse.jsSize,
          cssSize: audit.lighthouse.cssSize,
          imageSize: audit.lighthouse.imageSize,
          totalSize: audit.lighthouse.totalSize,
          domSize: audit.lighthouse.domSize,
          topOpportunities: audit.lighthouse.opportunities.slice(0, 10),
        } : null,
        coreVitals: audit.coreVitals,
        endpointTimings: audit.endpointTimings,
        issues: audit.issues,
        runId: run.id,
      },
    })
  } catch (error: any) {
    console.error('[PerfAudit:API] Error:', error)
    return NextResponse.json(
      { error: 'Performance audit failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET — Returns latest audit results without running a new audit
 */
export async function GET() {
  try {
    const latestRun = await db.qARun.findFirst({
      where: { status: 'completed', performanceScore: { gt: 0 } },
      orderBy: { completedAt: 'desc' },
    })

    if (!latestRun) {
      return NextResponse.json({ hasData: false, message: 'No performance audit has been run yet' })
    }

    const issues = await db.qAIssue.findMany({
      where: {
        runId: latestRun.id,
        category: { startsWith: 'performance' },
      },
      orderBy: { severity: 'desc' },
      take: 20,
    })

    const pageTests = await db.qAPageTest.findMany({
      where: { runId: latestRun.id },
      orderBy: { loadTime: 'desc' },
    })

    return NextResponse.json({
      hasData: true,
      run: {
        id: latestRun.id,
        performanceScore: latestRun.performanceScore,
        accessibilityScore: latestRun.accessibilityScore,
        seoScore: latestRun.seoScore,
        completedAt: latestRun.completedAt,
        duration: latestRun.duration,
        triggeredBy: latestRun.triggeredBy,
      },
      issues,
      pageTests,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch audit data', details: error.message }, { status: 500 })
  }
}
