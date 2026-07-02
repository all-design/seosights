/**
 * AI QA Center — Reviewer Results
 *
 * GET /api/qa/reviewer?reviewer=functional_qa
 * Returns reviewer results:
 * - If no reviewer specified, returns all reviewer results for latest run
 * - If reviewer specified, returns detailed results for that reviewer + related issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewer = searchParams.get('reviewer')

    // ── Get latest completed run ─────────────────────────────────────────
    const latestRun = await db.qARun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: { id: true, productScore: true, completedAt: true },
    })

    if (!latestRun) {
      return NextResponse.json({
        hasData: false,
        message: 'No completed QA runs found.',
      })
    }

    if (reviewer) {
      // ── Specific reviewer detailed results ─────────────────────────────
      const reviewerResult = await db.qAReviewerResult.findUnique({
        where: {
          runId_reviewer: {
            runId: latestRun.id,
            reviewer,
          },
        },
      })

      if (!reviewerResult) {
        return NextResponse.json({
          hasData: false,
          message: `No results found for reviewer "${reviewer}" in the latest run.`,
        }, { status: 404 })
      }

      // Get related issues for this reviewer
      const relatedIssues = await db.qAIssue.findMany({
        where: {
          runId: latestRun.id,
          reviewer,
        },
        orderBy: [
          { severity: 'asc' }, // critical first
          { createdAt: 'desc' },
        ],
      })

      // Severity breakdown for this reviewer's issues
      const severityBreakdown = await db.qAIssue.groupBy({
        by: ['severity'],
        where: {
          runId: latestRun.id,
          reviewer,
        },
        _count: { severity: true },
      })

      // Status breakdown
      const statusBreakdown = await db.qAIssue.groupBy({
        by: ['status'],
        where: {
          runId: latestRun.id,
          reviewer,
        },
        _count: { status: true },
      })

      return NextResponse.json({
        hasData: true,
        runId: latestRun.id,
        reviewer: reviewerResult,
        issues: relatedIssues,
        severityBreakdown: severityBreakdown.map((s) => ({
          severity: s.severity,
          count: s._count.severity,
        })),
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        totalIssues: relatedIssues.length,
      })
    }

    // ── All reviewer results for latest run ──────────────────────────────
    const reviewerResults = await db.qAReviewerResult.findMany({
      where: { runId: latestRun.id },
      orderBy: { score: 'desc' },
    })

    // Get issue counts per reviewer
    const issuesPerReviewer = await db.qAIssue.groupBy({
      by: ['reviewer'],
      where: { runId: latestRun.id },
      _count: { reviewer: true },
    })

    const issueCountMap = new Map(
      issuesPerReviewer.map((r) => [r.reviewer, r._count.reviewer])
    )

    // Score summary
    const scores = reviewerResults.map((r) => r.score)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
    const minScore = scores.length > 0 ? Math.min(...scores) : 0
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0

    return NextResponse.json({
      hasData: true,
      runId: latestRun.id,
      reviewers: reviewerResults.map((r) => ({
        ...r,
        issueCount: issueCountMap.get(r.reviewer) || 0,
      })),
      summary: {
        total: reviewerResults.length,
        avgScore,
        minScore,
        maxScore,
        topReviewer: reviewerResults[0]?.reviewer || null,
        lowestReviewer: reviewerResults[reviewerResults.length - 1]?.reviewer || null,
      },
    })
  } catch (error) {
    console.error('[QA Reviewer] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviewer results' },
      { status: 500 }
    )
  }
}
