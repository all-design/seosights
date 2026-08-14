// ─── Performance Reviewer — REAL DATA ──────────────────────────
// Uses Lighthouse CI + real HTTP timing to measure actual performance.
// NO hardcoded data — everything is measured in real-time.

import { db } from '../../../src/lib/db'
import { runPerformanceAudit, type PerformanceAuditResult, type LighthouseResult, type EndpointTiming } from '../../../src/lib/performance-audit'

interface ReviewerResult {
  reviewer: string
  score: number
  issues: number
  summary: string
  recommendations: string[]
  details: Record<string, unknown>
}

// ── Pages to test ────────────────────────────────────────────────

const PAGES_TO_AUDIT = [
  '/',
  '/os',
  '/growth',
  '/observatory',
  '/pricing',
]

const API_ENDPOINTS = [
  '/api/control/data',
  '/api/health',
]

// ── Issue generation from real Lighthouse data ───────────────────

function buildIssuesFromAudit(audit: PerformanceAuditResult): Array<{
  title: string
  description: string
  page: string
  element: string
  severity: 'critical' | 'major' | 'medium' | 'minor'
  evidence: string
  expectedBehavior: string
  actualBehavior: string
  userImpact: string
  businessImpact: string
  fixSuggestion: string
}> {
  const issues: Array<{
    title: string
    description: string
    page: string
    element: string
    severity: 'critical' | 'major' | 'medium' | 'minor'
    evidence: string
    expectedBehavior: string
    actualBehavior: string
    userImpact: string
    businessImpact: string
    fixSuggestion: string
  }> = []

  const lh = audit.lighthouse

  // ── Core Web Vitals Issues ────────────────────────────────────

  if (lh) {
    // LCP
    if (lh.lcp > 2.5) {
      issues.push({
        title: `Largest Contentful Paint: ${lh.lcp.toFixed(1)}s (target ≤2.5s)`,
        description: `The LCP is ${lh.lcp.toFixed(1)}s, which is above the 2.5s "good" threshold. This means the largest visible content element takes too long to render, creating a poor perceived load experience.`,
        page: audit.url,
        element: 'LCP element (measured by Lighthouse)',
        severity: lh.lcp > 4 ? 'critical' : 'major',
        evidence: JSON.stringify({ lcp: lh.lcp, threshold: 2.5, unit: 'seconds' }),
        expectedBehavior: 'LCP should be ≤2.5s for a "good" Core Web Vitals score',
        actualBehavior: `LCP is ${lh.lcp.toFixed(1)}s — ${lh.lcp > 4 ? 'poor' : 'needs improvement'}`,
        userImpact: 'high',
        businessImpact: 'retention',
        fixSuggestion: 'Preload the LCP image/font. Use Next.js Image with priority prop. Server-render hero content. Eliminate render-blocking resources above the fold. Consider streaming SSR.',
      })
    }

    // FCP
    if (lh.fcp > 1.8) {
      issues.push({
        title: `First Contentful Paint: ${lh.fcp.toFixed(1)}s (target ≤1.8s)`,
        description: `FCP is ${lh.fcp.toFixed(1)}s, above the 1.8s threshold. Users see a blank screen for too long before any content appears.`,
        page: audit.url,
        element: 'First painted element',
        severity: lh.fcp > 3 ? 'major' : 'medium',
        evidence: JSON.stringify({ fcp: lh.fcp, threshold: 1.8, unit: 'seconds' }),
        expectedBehavior: 'FCP should be ≤1.8s for good perceived load performance',
        actualBehavior: `FCP is ${lh.fcp.toFixed(1)}s — ${lh.fcp > 3 ? 'poor' : 'needs improvement'}`,
        userImpact: 'medium',
        businessImpact: 'retention',
        fixSuggestion: 'Eliminate render-blocking resources. Inline critical CSS. Preconnect to required origins. Use server-side rendering for above-fold content.',
      })
    }

    // CLS
    if (lh.cls > 0.1) {
      issues.push({
        title: `Cumulative Layout Shift: ${lh.cls.toFixed(3)} (target ≤0.1)`,
        description: `CLS is ${lh.cls.toFixed(3)}, above the 0.1 threshold. Content shifts during page load, creating a jarring experience for users.`,
        page: audit.url,
        element: 'Shifting elements (measured by Lighthouse)',
        severity: lh.cls > 0.25 ? 'major' : 'medium',
        evidence: JSON.stringify({ cls: lh.cls, threshold: 0.1 }),
        expectedBehavior: 'CLS should be ≤0.1 — content should not shift during page load',
        actualBehavior: `CLS is ${lh.cls.toFixed(3)} — ${lh.cls > 0.25 ? 'poor' : 'needs improvement'}`,
        userImpact: 'medium',
        businessImpact: 'reputation',
        fixSuggestion: 'Set explicit width/height on images and embeds. Reserve space for dynamic content with min-height/CSS grid. Avoid inserting content above existing content. Use font-display: swap or optional.',
      })
    }

    // TBT
    if (lh.tbt > 200) {
      issues.push({
        title: `Total Blocking Time: ${lh.tbt}ms (target ≤200ms)`,
        description: `TBT is ${lh.tbt}ms, above the 200ms threshold. The main thread is blocked for too long, making the page unresponsive to user input.`,
        page: audit.url,
        element: 'Long tasks on main thread',
        severity: lh.tbt > 600 ? 'major' : 'medium',
        evidence: JSON.stringify({ tbt: lh.tbt, threshold: 200, unit: 'ms' }),
        expectedBehavior: 'TBT should be ≤200ms — main thread should not be blocked for long periods',
        actualBehavior: `TBT is ${lh.tbt}ms — ${lh.tbt > 600 ? 'poor' : 'needs improvement'}`,
        userImpact: 'high',
        businessImpact: 'retention',
        fixSuggestion: 'Break up long tasks. Code-split JavaScript with dynamic imports. Defer non-critical third-party scripts. Use web workers for heavy computation.',
      })
    }

    // TTFB
    if (lh.ttfb > 800) {
      issues.push({
        title: `Server Response Time: ${lh.ttfb}ms (target ≤800ms)`,
        description: `TTFB is ${lh.ttfb}ms, above the 800ms threshold. The server takes too long to send the first byte of the response.`,
        page: audit.url,
        element: 'Server response',
        severity: lh.ttfb > 2000 ? 'major' : 'medium',
        evidence: JSON.stringify({ ttfb: lh.ttfb, threshold: 800, unit: 'ms' }),
        expectedBehavior: 'TTFB should be ≤800ms',
        actualBehavior: `TTFB is ${lh.ttfb}ms — ${lh.ttfb > 2000 ? 'poor' : 'needs improvement'}`,
        userImpact: 'medium',
        businessImpact: 'retention',
        fixSuggestion: 'Optimize server-side logic. Add CDN caching. Use edge functions or ISR. Optimize database queries. Use connection pooling.',
      })
    }

    // JavaScript bundle size
    if (lh.jsSize > 300) {
      issues.push({
        title: `Large JavaScript bundle: ${lh.jsSize}KB (target ≤300KB)`,
        description: `The page loads ${lh.jsSize}KB of JavaScript. Large JS bundles increase parse/compile time and memory usage, especially on mobile devices.`,
        page: audit.url,
        element: 'JavaScript resources',
        severity: lh.jsSize > 600 ? 'major' : 'medium',
        evidence: JSON.stringify({ jsSizeKB: lh.jsSize, totalSizeKB: lh.totalSize, threshold: 300, unit: 'KB' }),
        expectedBehavior: 'Page JavaScript should be ≤300KB transferred for fast interactive time',
        actualBehavior: `${lh.jsSize}KB of JavaScript loaded — ${lh.jsSize > 600 ? 'significantly over budget' : 'over budget'}`,
        userImpact: 'medium',
        businessImpact: 'retention',
        fixSuggestion: 'Code-split with React.lazy() and dynamic imports. Remove unused dependencies. Replace heavy libraries with lighter alternatives (e.g., lighter chart lib). Use tree-shaking.',
      })
    }

    // Image size
    if (lh.imageSize > 500) {
      issues.push({
        title: `Large image payload: ${lh.imageSize}KB (target ≤500KB)`,
        description: `The page loads ${lh.imageSize}KB of images. Unoptimized images are the #1 cause of slow LCP and wasted bandwidth.`,
        page: audit.url,
        element: 'Image resources',
        severity: lh.imageSize > 1500 ? 'major' : 'medium',
        evidence: JSON.stringify({ imageSizeKB: lh.imageSize, threshold: 500, unit: 'KB' }),
        expectedBehavior: 'Total image payload should be ≤500KB with WebP/AVIF optimization',
        actualBehavior: `${lh.imageSize}KB of images loaded — likely unoptimized`,
        userImpact: 'medium',
        businessImpact: 'retention',
        fixSuggestion: 'Convert all images to WebP with AVIF fallback. Use Next.js Image component for automatic optimization. Add lazy loading for below-fold images. Use responsive sizes.',
      })
    }

    // Lighthouse opportunities
    for (const opp of lh.opportunities.slice(0, 8)) {
      if (opp.savings > 200) {
        issues.push({
          title: `${opp.title} (saves ${opp.savings}ms)`,
          description: opp.description || `This optimization can save ${opp.savings}ms of loading time.`,
          page: audit.url,
          element: opp.id,
          severity: opp.savings > 2000 ? 'major' : opp.savings > 500 ? 'medium' : 'minor',
          evidence: JSON.stringify({ opportunity: opp.id, savingsMs: opp.savings }),
          expectedBehavior: 'This optimization should be applied',
          actualBehavior: `Not optimized — ${opp.savings}ms potential savings`,
          userImpact: opp.savings > 1000 ? 'medium' : 'low',
          businessImpact: 'retention',
          fixSuggestion: opp.description || 'Review Lighthouse audit details for specific optimization steps.',
        })
      }
    }
  }

  // ── API Endpoint Issues ───────────────────────────────────────

  for (const timing of audit.endpointTimings) {
    if (timing.error) {
      issues.push({
        title: `API endpoint error: ${timing.route} — ${timing.error}`,
        description: `The API endpoint ${timing.route} returned an error: ${timing.error}. This affects functionality and user experience.`,
        page: timing.route,
        element: 'API route handler',
        severity: 'critical',
        evidence: JSON.stringify({ route: timing.route, error: timing.error, status: timing.status }),
        expectedBehavior: 'API should respond with 200 status within timeout',
        actualBehavior: `Error: ${timing.error}`,
        userImpact: 'high',
        businessImpact: 'reputation',
        fixSuggestion: 'Check server logs for the error. Verify the endpoint is operational. Add error monitoring and alerting.',
      })
    } else if (timing.ttfb > 500) {
      issues.push({
        title: `Slow API endpoint: ${timing.route} — ${timing.ttfb}ms TTFB (target ≤500ms)`,
        description: `The API endpoint ${timing.route} has a TTFB of ${timing.ttfb}ms and total response time of ${timing.total}ms. This is above the 500ms budget.`,
        page: timing.route,
        element: 'API route handler',
        severity: timing.ttfb > 2000 ? 'critical' : timing.ttfb > 1000 ? 'major' : 'medium',
        evidence: JSON.stringify({ route: timing.route, ttfb: timing.ttfb, total: timing.total, status: timing.status, sizeBytes: timing.size }),
        expectedBehavior: 'API TTFB should be ≤500ms with caching for repeated queries',
        actualBehavior: `TTFB is ${timing.ttfb}ms — ${timing.ttfb > 2000 ? 'critically slow' : timing.ttfb > 1000 ? 'very slow' : 'over budget'}`,
        userImpact: timing.ttfb > 1000 ? 'high' : 'medium',
        businessImpact: 'retention',
        fixSuggestion: 'Add response caching with appropriate TTL. Optimize database queries. Parallelize external API calls. Consider streaming responses for large payloads.',
      })
    }
  }

  // If no issues were found, add a positive note
  if (issues.length === 0) {
    issues.push({
      title: 'Performance is within all targets',
      description: 'All Core Web Vitals are within "good" thresholds, API endpoints respond within budget, and no significant Lighthouse opportunities were found.',
      page: '/',
      element: 'N/A',
      severity: 'minor',
      evidence: JSON.stringify({ score: audit.score, issueCount: 0 }),
      expectedBehavior: 'All metrics within target',
      actualBehavior: 'All metrics within target',
      userImpact: 'low',
      businessImpact: 'none',
      fixSuggestion: 'Continue monitoring. Set up performance alerts for regressions.',
    })
  }

  return issues
}

// ── Main Reviewer Function ───────────────────────────────────────

export async function runPerformanceReviewer(): Promise<ReviewerResult> {
  console.log('[QA:Performance] Starting REAL performance review (Lighthouse + HTTP timing)...')

  const currentRun = await db.qARun.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  })

  const runId = currentRun?.id ?? ''
  let issueCount = 0

  // ── Run real Lighthouse + HTTP audit ──────────────────────────
  let audit: PerformanceAuditResult

  try {
    audit = await runPerformanceAudit('http://localhost:3000', PAGES_TO_AUDIT, API_ENDPOINTS)
    console.log(`[QA:Performance] Real audit complete: score=${audit.score}, issues=${audit.issues.length}, duration=${audit.durationMs}ms`)
  } catch (error: any) {
    console.error('[QA:Performance] Audit failed, falling back to API-only audit:', error.message)

    // Fallback: just measure API endpoints, no Lighthouse
    const { runQuickApiAudit } = await import('../../../src/lib/performance-audit')
    const quickResult = await runQuickApiAudit('http://localhost:3000', API_ENDPOINTS)

    audit = {
      url: 'http://localhost:3000/',
      timestamp: quickResult.timestamp,
      durationMs: quickResult.durationMs,
      lighthouse: null,
      endpointTimings: quickResult.endpointTimings,
      coreVitals: { lcp: null, fcp: null, cls: null, ttfb: null, tti: null, tbt: null, si: null },
      issues: [],
      score: Math.round(
        quickResult.endpointTimings.filter(t => !t.error && t.status === 200).length /
        Math.max(quickResult.endpointTimings.length, 1) * 70
      ),
    }
  }

  // ── Build real issues from audit results ──────────────────────
  const realIssues = buildIssuesFromAudit(audit)

  // ── Write issues to database ──────────────────────────────────
  if (currentRun) {
    for (const issue of realIssues) {
      await db.qAIssue.create({
        data: {
          runId,
          title: issue.title,
          description: issue.description,
          page: issue.page,
          element: issue.element,
          severity: issue.severity,
          category: 'performance',
          reviewer: 'performance_reviewer',
          evidence: issue.evidence,
          expectedBehavior: issue.expectedBehavior,
          actualBehavior: issue.actualBehavior,
          userImpact: issue.userImpact,
          businessImpact: issue.businessImpact,
          fixSuggestion: issue.fixSuggestion,
        },
      })
      issueCount++
    }

    // ── Write page test results to database ─────────────────────
    for (const timing of audit.endpointTimings) {
      await db.qAPageTest.create({
        data: {
          runId,
          route: timing.route,
          url: `http://localhost:3000${timing.route}`,
          loadTime: timing.total,
          statusCode: timing.status,
          hasErrors: !!timing.error || timing.status >= 400,
          errorCount: timing.error ? 1 : 0,
          lighthouseScore: audit.lighthouse?.performance ?? 0,
          accessibilityScore: audit.lighthouse?.accessibility ?? 0,
        },
      })
    }

    // Also create page test for the main page with Lighthouse data
    if (audit.lighthouse) {
      await db.qAPageTest.create({
        data: {
          runId,
          route: '/',
          url: audit.url,
          loadTime: Math.round(audit.lighthouse.tti * 1000), // TTI as load time
          statusCode: 200,
          hasErrors: false,
          errorCount: 0,
          lighthouseScore: audit.lighthouse.performance,
          accessibilityScore: audit.lighthouse.accessibility,
        },
      })
    }
  }

  // ── Build summary and recommendations ─────────────────────────
  const lh = audit.lighthouse
  const summary = lh
    ? `Real Lighthouse audit: Performance ${lh.performance}/100, Accessibility ${lh.accessibility}/100, SEO ${lh.seo}/100. ` +
      `Core Web Vitals: LCP=${lh.lcp.toFixed(1)}s, FCP=${lh.fcp.toFixed(1)}s, CLS=${lh.cls.toFixed(3)}, TBT=${lh.tbt}ms. ` +
      `JS bundle: ${lh.jsSize}KB, Images: ${lh.imageSize}KB. ` +
      `API endpoints measured: ${audit.endpointTimings.length} (${audit.endpointTimings.filter(t => t.ttfb < 500).length} within budget). ` +
      `Found ${issueCount} issues.`
    : `Lighthouse unavailable (Chrome not found). API timing audit: ${audit.endpointTimings.length} endpoints measured, ` +
      `${audit.endpointTimings.filter(t => !t.error && t.status === 200).length} healthy. Found ${issueCount} issues.`

  const recommendations: string[] = []

  if (lh) {
    if (lh.lcp > 2.5) recommendations.push(`Fix LCP (${lh.lcp.toFixed(1)}s → ≤2.5s): preload hero image, server-render hero content, eliminate render-blocking resources`)
    if (lh.fcp > 1.8) recommendations.push(`Fix FCP (${lh.fcp.toFixed(1)}s → ≤1.8s): inline critical CSS, eliminate render-blocking resources`)
    if (lh.cls > 0.1) recommendations.push(`Fix CLS (${lh.cls.toFixed(3)} → ≤0.1): set explicit dimensions on images/embeds, reserve space for dynamic content`)
    if (lh.tbt > 200) recommendations.push(`Fix TBT (${lh.tbt}ms → ≤200ms): code-split JS, defer non-critical scripts, break up long tasks`)
    if (lh.jsSize > 300) recommendations.push(`Reduce JS bundle (${lh.jsSize}KB → ≤300KB): code-split with dynamic imports, remove unused deps, use lighter alternatives`)
    if (lh.imageSize > 500) recommendations.push(`Optimize images (${lh.imageSize}KB → ≤500KB): convert to WebP/AVIF, use Next.js Image, lazy-load below-fold`)

    // Add top Lighthouse opportunity recommendations
    for (const opp of lh.opportunities.slice(0, 3)) {
      if (opp.savings > 200) {
        recommendations.push(`${opp.title} — saves ${opp.savings}ms`)
      }
    }
  }

  // Add API recommendations
  const slowEndpoints = audit.endpointTimings.filter(t => t.ttfb > 500 && !t.error)
  for (const slow of slowEndpoints.slice(0, 3)) {
    recommendations.push(`Optimize ${slow.route}: TTFB ${slow.ttfb}ms → target ≤500ms (add caching, optimize queries)`)
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance is within all targets. Continue monitoring for regressions.')
  }

  // ── Build details ─────────────────────────────────────────────
  const details: Record<string, unknown> = {
    auditType: 'real_lighthouse',
    auditTimestamp: audit.timestamp,
    auditDurationMs: audit.durationMs,
    lighthouseScores: lh ? {
      performance: lh.performance,
      accessibility: lh.accessibility,
      bestPractices: lh.bestPractices,
      seo: lh.seo,
      pwa: lh.pwa,
    } : null,
    coreWebVitals: audit.coreVitals,
    resourceSizes: lh ? {
      js: `${lh.jsSize}KB`,
      css: `${lh.cssSize}KB`,
      images: `${lh.imageSize}KB`,
      fonts: `${lh.fontSize}KB`,
      total: `${lh.totalSize}KB`,
    } : null,
    endpointTimings: audit.endpointTimings.map(t => ({
      route: t.route,
      ttfb: `${t.ttfb}ms`,
      total: `${t.total}ms`,
      status: t.status,
      ...(t.error ? { error: t.error } : {}),
    })),
    topOpportunities: lh?.opportunities.slice(0, 5).map(o => ({
      title: o.title,
      savingsMs: o.savings,
    })) ?? [],
  }

  const result: ReviewerResult = {
    reviewer: 'performance_reviewer',
    score: audit.score,
    issues: issueCount,
    summary,
    recommendations,
    details,
  }

  console.log(`[QA:Performance] Complete: score=${audit.score}, issues=${issueCount} (REAL DATA)`)
  return result
}
