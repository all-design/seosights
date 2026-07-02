/**
 * AI QA Center — Issues
 *
 * GET /api/qa/issues?severity=critical&category=functional&reviewer=functional_qa&status=open&page=1
 * Returns filtered QAIssue records with total count.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // ── Parse query params ───────────────────────────────────────────────
    const severity = searchParams.get('severity')
    const category = searchParams.get('category')
    const reviewer = searchParams.get('reviewer')
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const runId = searchParams.get('runId')

    // ── Build where clause ───────────────────────────────────────────────
    const where: Record<string, unknown> = {}

    if (runId) {
      where.runId = runId
    } else {
      // Default to latest completed run
      const latestRun = await db.qARun.findFirst({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: { id: true },
      })
      if (latestRun) {
        where.runId = latestRun.id
      }
    }

    if (severity) {
      const severities = severity.split(',').map((s) => s.trim())
      if (severities.length === 1) {
        where.severity = severities[0]
      } else {
        where.severity = { in: severities }
      }
    }

    if (category) {
      const categories = category.split(',').map((c) => c.trim())
      if (categories.length === 1) {
        where.category = categories[0]
      } else {
        where.category = { in: categories }
      }
    }

    if (reviewer) {
      const reviewers = reviewer.split(',').map((r) => r.trim())
      if (reviewers.length === 1) {
        where.reviewer = reviewers[0]
      } else {
        where.reviewer = { in: reviewers }
      }
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim())
      if (statuses.length === 1) {
        where.status = statuses[0]
      } else {
        where.status = { in: statuses }
      }
    }

    // ── Get total count ──────────────────────────────────────────────────
    const totalCount = await db.qAIssue.count({ where })

    // ── Get paginated issues ─────────────────────────────────────────────
    const issues = await db.qAIssue.findMany({
      where,
      orderBy: [
        { severity: 'asc' }, // critical first (alphabetical: critical < major < medium < minor)
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    })

    // ── Get severity distribution for current filter ─────────────────────
    const severityDistribution = await db.qAIssue.groupBy({
      by: ['severity'],
      where,
      _count: { severity: true },
    })

    // ── Get category distribution for current filter ─────────────────────
    const categoryDistribution = await db.qAIssue.groupBy({
      by: ['category'],
      where,
      _count: { category: true },
    })

    return NextResponse.json({
      issues,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
        hasMore: page * PAGE_SIZE < totalCount,
      },
      filters: {
        severity: severity || null,
        category: category || null,
        reviewer: reviewer || null,
        status: status || null,
        runId: where.runId || null,
      },
      severityDistribution: severityDistribution.map((s) => ({
        severity: s.severity,
        count: s._count.severity,
      })),
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
    })
  } catch (error) {
    console.error('[QA Issues] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}
