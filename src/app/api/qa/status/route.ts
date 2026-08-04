import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/qa/status
 * Returns QA Engine status, recent runs, and issue counts.
 */
export async function GET() {
  try {
    const [totalRuns, latestRun, openIssues, totalIssues] = await Promise.all([
      db.qARun.count(),
      db.qARun.findFirst({ orderBy: { createdAt: 'desc' } }),
      db.qAIssue.count({ where: { status: 'open' } }),
      db.qAIssue.count(),
    ])

    const status = totalRuns > 0 ? 'operational' : 'standby'

    return NextResponse.json({
      status,
      runs: {
        total: totalRuns,
        latest: latestRun ? {
          id: latestRun.id,
          status: latestRun.status,
          completedAt: latestRun.completedAt,
          securityScore: latestRun.securityScore,
          performanceScore: latestRun.performanceScore,
        } : null,
      },
      issues: {
        open: openIssues,
        total: totalIssues,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[qa/status] Error:', error)
    return NextResponse.json({ status: 'error', error: 'Failed to fetch QA status' }, { status: 500 })
  }
}
