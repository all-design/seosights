/**
 * Governor Tasks API — GET /api/governor/tasks
 *
 * Returns FactoryTask records, ordered by createdAt desc.
 *
 * Query params:
 *   ?status=pending|approved|rejected|done  (optional filter)
 *
 * Limit: 50 results.
 *
 * On DB failure (first run, schema not pushed), returns an empty array —
 * the dashboard still renders.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = new Set([
  'pending',
  'approved',
  'rejected',
  'returned',
  'implementing',
  'qa',
  'ready',
  'deployed',
  'done',
])

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status && VALID_STATUSES.has(status) ? { status } : {}

    const tasks = await db.factoryTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ tasks, count: tasks.length })
  } catch (error) {
    console.error('[api/governor/tasks] Failed:', error)
    // Defensive: return empty list rather than 500 — the UI shows an empty state
    return NextResponse.json(
      {
        tasks: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 },
    )
  }
}
