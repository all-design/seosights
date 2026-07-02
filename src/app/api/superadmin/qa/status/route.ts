import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const latestRun = await db.qASuiteRun.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        testResults: {
          orderBy: { category: 'asc' },
        },
      },
    })

    if (!latestRun) {
      // Return seed data if no runs exist yet
      return NextResponse.json({
        run: null,
        seedData: generateSeedQAData(),
      })
    }

    // Build category summary from test results
    const categoryMap: Record<string, { passed: number; failed: number; warnings: number; degraded: number; critical: number; total: number; tests: typeof latestRun.testResults }> = {}

    for (const result of latestRun.testResults) {
      if (!categoryMap[result.category]) {
        categoryMap[result.category] = { passed: 0, failed: 0, warnings: 0, degraded: 0, critical: 0, total: 0, tests: [] }
      }
      categoryMap[result.category].total++
      categoryMap[result.category].tests.push(result)

      if (result.status === 'passed') categoryMap[result.category].passed++
      else if (result.status === 'failed') categoryMap[result.category].failed++
      else if (result.status === 'warning') categoryMap[result.category].warnings++
      else if (result.status === 'degraded') categoryMap[result.category].degraded++
      else if (result.status === 'critical') categoryMap[result.category].critical++
    }

    // Get run history for trend
    const recentRuns = await db.qASuiteRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 7,
      select: {
        id: true,
        passRate: true,
        totalTests: true,
        passed: true,
        failed: true,
        warnings: true,
        trigger: true,
        startedAt: true,
      },
    })

    return NextResponse.json({
      run: latestRun,
      categories: categoryMap,
      recentRuns,
    })
  } catch (error) {
    console.error('[qa/status] Error:', error)
    return NextResponse.json(
      { run: null, seedData: generateSeedQAData(), error: error instanceof Error ? error.message : 'Failed to fetch QA status' },
      { status: 200 }
    )
  }
}

function generateSeedQAData() {
  const categories = [
    { id: 'ui', name: 'UI', icon: 'Monitor', passed: 5, total: 5, status: 'PASS', tests: [
      { testName: 'ui:cls_check', description: 'Cumulative Layout Shift within threshold', status: 'passed', latencyMs: 134 },
      { testName: 'ui:hydration', description: 'Next.js hydration mismatch check', status: 'passed', latencyMs: 98 },
      { testName: 'ui:dark_mode', description: 'Dark mode renders correctly', status: 'passed', latencyMs: 245 },
      { testName: 'ui:mobile_responsive', description: 'Mobile viewport renders without overflow', status: 'passed', latencyMs: 312 },
      { testName: 'ui:accessibility', description: 'WCAG 2.1 AA compliance basics', status: 'passed', latencyMs: 498 },
    ]},
    { id: 'api', name: 'API', icon: 'Globe', passed: 40, total: 42, status: 'WARNING', tests: [
      { testName: 'api:/api/analyze:status', description: 'Status check for /api/analyze', status: 'passed', latencyMs: 87 },
      { testName: 'api:/api/analyze:latency', description: 'Latency check for /api/analyze', status: 'passed', latencyMs: 87 },
      { testName: 'api:/api/superadmin/check:latency', description: 'Latency check for /api/superadmin/check', status: 'degraded', latencyMs: 1203, errorMessage: 'Response time 1203ms exceeds 1000ms threshold' },
      { testName: 'api:/api/superadmin/p1-overview:fallback', description: 'Fallback check for /api/superadmin/p1-overview', status: 'warning', latencyMs: 456, errorMessage: 'Fallback was used for partial data' },
    ]},
    { id: 'ai', name: 'AI', icon: 'Brain', passed: 22, total: 24, status: 'WARNING', tests: [
      { testName: 'ai:groq:timeout', description: 'Groq timeout test', status: 'passed', latencyMs: 156 },
      { testName: 'ai:groq:hallucination', description: 'Groq hallucination test', status: 'passed', latencyMs: 230 },
      { testName: 'ai:openrouter:rate_limit', description: 'OpenRouter rate limit test', status: 'warning', latencyMs: 890, errorMessage: 'Rate limit approached (80% threshold)' },
      { testName: 'ai:gemini:empty_response', description: 'Gemini empty response test', status: 'failed', latencyMs: 30456, errorMessage: 'Empty response received, retry also failed' },
    ]},
    { id: 'database', name: 'Database', icon: 'Database', passed: 5, total: 5, status: 'PASS', tests: [
      { testName: 'database:missing_tables', description: 'Database missing tables test', status: 'passed', latencyMs: 32 },
      { testName: 'database:slow_query', description: 'Database slow query test', status: 'passed', latencyMs: 45 },
      { testName: 'database:null_check', description: 'Database null check test', status: 'passed', latencyMs: 28 },
      { testName: 'database:duplicate_check', description: 'Database duplicate check test', status: 'passed', latencyMs: 51 },
      { testName: 'database:migration_mismatch', description: 'Database migration mismatch test', status: 'passed', latencyMs: 67 },
    ]},
    { id: 'stripe', name: 'Stripe', icon: 'CreditCard', passed: 4, total: 4, status: 'PASS', tests: [
      { testName: 'stripe:sandbox', description: 'Stripe sandbox test', status: 'passed', latencyMs: 78 },
      { testName: 'stripe:cancel', description: 'Stripe cancel test', status: 'passed', latencyMs: 92 },
      { testName: 'stripe:expired', description: 'Stripe expired card test', status: 'passed', latencyMs: 65 },
      { testName: 'stripe:duplicate_webhook', description: 'Stripe duplicate webhook test', status: 'passed', latencyMs: 43 },
    ]},
    { id: 'email', name: 'Email', icon: 'Mail', passed: 3, total: 3, status: 'PASS', tests: [
      { testName: 'email:resend:bounce', description: 'Resend bounce test', status: 'passed', latencyMs: 55 },
      { testName: 'email:resend:retry', description: 'Resend retry test', status: 'passed', latencyMs: 78 },
      { testName: 'email:resend:unsubscribe', description: 'Resend unsubscribe test', status: 'passed', latencyMs: 62 },
    ]},
    { id: 'auto_execute', name: 'Auto Execute', icon: 'Zap', passed: 3, total: 3, status: 'PASS', tests: [
      { testName: 'auto_execute:rollback', description: 'Auto Execute rollback test', status: 'passed', latencyMs: 134 },
      { testName: 'auto_execute:conflict', description: 'Auto Execute conflict test', status: 'passed', latencyMs: 98 },
      { testName: 'auto_execute:permission_denied', description: 'Auto Execute permission denied test', status: 'passed', latencyMs: 87 },
    ]},
    { id: 'chrome_extension', name: 'Chrome Extension', icon: 'Puzzle', passed: 3, total: 3, status: 'PASS', tests: [
      { testName: 'chrome_extension:manifest', description: 'Chrome Extension manifest test', status: 'passed', latencyMs: 34 },
      { testName: 'chrome_extension:injection', description: 'Chrome Extension injection test', status: 'passed', latencyMs: 56 },
      { testName: 'chrome_extension:permissions', description: 'Chrome Extension permissions test', status: 'passed', latencyMs: 41 },
    ]},
    { id: 'seo', name: 'SEO', icon: 'Search', passed: 6, total: 7, status: 'WARNING', tests: [
      { testName: 'seo:robots', description: 'SEO robots test', status: 'passed', latencyMs: 89 },
      { testName: 'seo:llms_txt', description: 'SEO llms.txt test', status: 'failed', latencyMs: 124, errorMessage: 'llms.txt not found or invalid' },
      { testName: 'seo:schema', description: 'SEO schema test', status: 'passed', latencyMs: 156 },
      { testName: 'seo:og_image', description: 'SEO OG image test', status: 'passed', latencyMs: 78 },
      { testName: 'seo:sitemap', description: 'SEO sitemap test', status: 'passed', latencyMs: 92 },
      { testName: 'seo:canonical', description: 'SEO canonical test', status: 'passed', latencyMs: 67 },
      { testName: 'seo:hreflang', description: 'SEO hreflang test', status: 'passed', latencyMs: 81 },
    ]},
  ]

  const totalPassed = categories.reduce((acc, c) => acc + c.passed, 0)
  const totalTests = categories.reduce((acc, c) => acc + c.total, 0)
  const totalWarnings = categories.reduce((acc, c) => acc + c.tests.filter((t: { status: string }) => t.status === 'warning').length, 0)
  const totalDegraded = categories.reduce((acc, c) => acc + c.tests.filter((t: { status: string }) => t.status === 'degraded').length, 0)
  const totalCritical = categories.reduce((acc, c) => acc + c.tests.filter((t: { status: string }) => t.status === 'critical').length, 0)
  const totalFailed = categories.reduce((acc, c) => acc + c.tests.filter((t: { status: string }) => t.status === 'failed').length, 0)
  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0

  return {
    run: {
      id: 'seed-run',
      trigger: 'daily',
      totalTests,
      passed: totalPassed,
      failed: totalFailed,
      warnings: totalWarnings,
      degraded: totalDegraded,
      critical: totalCritical,
      passRate: Math.round(passRate * 10) / 10,
      durationMs: 12450,
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3580000).toISOString(),
    },
    categories: categories.reduce((acc, cat) => {
      acc[cat.id] = {
        passed: cat.passed,
        failed: cat.tests.filter((t: { status: string }) => t.status === 'failed').length,
        warnings: cat.tests.filter((t: { status: string }) => t.status === 'warning').length,
        degraded: cat.tests.filter((t: { status: string }) => t.status === 'degraded').length,
        critical: cat.tests.filter((t: { status: string }) => t.status === 'critical').length,
        total: cat.total,
        tests: cat.tests,
      }
      return acc
    }, {} as Record<string, { passed: number; failed: number; warnings: number; degraded: number; critical: number; total: number; tests: unknown[] }>),
    recentRuns: [
      { id: 'seed-1', passRate: 97.2, totalTests, passed: totalPassed, failed: totalFailed, warnings: totalWarnings, trigger: 'daily', startedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'seed-2', passRate: 98.1, totalTests, passed: totalPassed + 1, failed: totalFailed - 1, warnings: totalWarnings, trigger: 'deploy', startedAt: new Date(Date.now() - 172800000).toISOString() },
      { id: 'seed-3', passRate: 96.8, totalTests, passed: totalPassed - 2, failed: totalFailed + 2, warnings: totalWarnings + 1, trigger: 'daily', startedAt: new Date(Date.now() - 259200000).toISOString() },
    ],
  }
}
