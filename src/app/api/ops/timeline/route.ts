/**
 * Timeline API — GET /api/ops/timeline
 *
 * Returns recent MCTimelineEvent records, ordered by timestamp DESC.
 * Supports ?system=age filter and ?limit=20.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const systemFilter = searchParams.get('system') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    const where = systemFilter ? { systemName: systemFilter } : {}

    const events = await db.mCTimelineEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    // Get unique system names for filter options
    const systemNames = await db.mCTimelineEvent.findMany({
      select: { systemName: true },
      distinct: ['systemName'],
    })

    return NextResponse.json({
      events,
      filters: {
        system: systemFilter || null,
        limit,
      },
      availableSystems: systemNames.map(s => s.systemName),
      total: events.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ops/timeline] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline events' },
      { status: 500 }
    )
  }
}
