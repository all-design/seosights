/**
 * Analytics Events API
 * GET  — Fetch events from the database with filters and counts
 * POST — Track a new analytics event
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

const VALID_EVENTS = [
  'started_audit',
  'completed_audit',
  'viewed_replay',
  'opened_diff',
  'connected_wordpress',
  'executed_fix',
  'opened_digest',
  'clicked_upgrade',
  'connected_gsc',
  'registered',
  'activated',
  'paid',
  'page_view',
]

// ── GET: Fetch analytics events ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event') || undefined
    const userId = searchParams.get('userId') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const where: Record<string, unknown> = {}
    if (event) where.event = event
    if (userId) where.userId = userId

    // Fetch events (safe — AnalyticsEvent table may not exist on Turso)
    const [events, total] = await Promise.all([
      safeQuery(() => db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }), [] as typeof events),
      safeQuery(() => db.analyticsEvent.count({ where }), 0),
    ])

    // Count by event type
    const allEvents = await safeQuery(() => db.analyticsEvent.findMany({
      select: { event: true },
    }), [] as { event: string }[])

    const countMap: Record<string, number> = {}
    for (const evt of allEvents) {
      countMap[evt.event] = (countMap[evt.event] || 0) + 1
    }

    const countsByType = Object.entries(countMap)
      .map(([ev, count]) => ({ event: ev, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      events,
      total,
      countsByType,
    })
  } catch (error) {
    console.error('[events] GET error:', error instanceof Error ? error.message : 'Unknown')
    // Return fallback data instead of 500 error
    return NextResponse.json({
      events: [],
      total: 0,
      countsByType: [],
    })
  }
}

// ── POST: Track a new analytics event ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, userId, domain, metadata } = body as {
      event: string
      userId?: string
      domain?: string
      metadata?: Record<string, unknown>
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'event is required' },
        { status: 400 }
      )
    }

    const newEvent = await db.analyticsEvent.create({
      data: {
        event,
        userId: userId || null,
        domain: domain || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 })
  } catch (error) {
    console.error('[events] POST error:', error instanceof Error ? error.message : 'Unknown')
    // Return graceful error instead of 500
    return NextResponse.json({ success: false, error: 'Event tracking unavailable', note: 'Table may not exist yet' })
  }
}
