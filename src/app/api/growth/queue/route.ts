/**
 * Growth Engine — Queue (Kanban View)
 *
 * GET /api/growth/queue
 * Returns GrowthOpportunity records with active statuses,
 * grouped by status for Kanban view.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const QUEUE_STATUSES = [
  'queued',
  'generating',
  'reviewing',
  'approved',
  'publishing',
  'measuring',
  'learning',
] as const

export async function GET() {
  try {
    // ── 1. Fetch all queue items ─────────────────────────────────────────
    const queueItems = await db.growthOpportunity.findMany({
      where: {
        status: { in: [...QUEUE_STATUSES] },
      },
      orderBy: [{ priority: 'asc' }, { growthScore: 'desc' }],
    })

    // ── 2. Group by status ───────────────────────────────────────────────
    const grouped: Record<string, typeof queueItems> = {}
    for (const status of QUEUE_STATUSES) {
      grouped[status] = queueItems.filter((item) => item.status === status)
    }

    // ── 3. Queue statistics ──────────────────────────────────────────────
    const stats = {
      totalInQueue: queueItems.length,
      byStatus: QUEUE_STATUSES.map((status) => ({
        status,
        count: grouped[status].length,
      })),
      avgGrowthScore: queueItems.length > 0
        ? Math.round(
            (queueItems.reduce((sum, item) => sum + item.growthScore, 0) /
              queueItems.length) *
              10
          ) / 10
        : 0,
      priorityBreakdown: {
        p1: queueItems.filter((i) => i.priority === 'p1').length,
        p2: queueItems.filter((i) => i.priority === 'p2').length,
        p3: queueItems.filter((i) => i.priority === 'p3').length,
        p4: queueItems.filter((i) => i.priority === 'p4').length,
      },
    }

    return NextResponse.json({
      grouped,
      stats,
    })
  } catch (error) {
    console.error('[Growth Queue] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue data' },
      { status: 500 }
    )
  }
}
