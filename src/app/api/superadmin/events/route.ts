/**
 * Analytics Events API
 * GET  — Fetch events from the database with filters and counts
 * POST — Track a new analytics event
 *
 * ENHANCED: Returns status + confidence. No silent fallbacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

// ── GET: Fetch analytics events ────────────────────────────────────
export async function GET(request: NextRequest) {
  const api = '/api/superadmin/events'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event') || undefined
    const userId = searchParams.get('userId') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const where: Record<string, unknown> = {}
    if (event) where.event = event
    if (userId) where.userId = userId

    // Fetch events (safe — AnalyticsEvent table may not exist on Turso)
    const [eventsResult, totalResult] = await Promise.all([
      safeQuery(() => db.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }), [] as { id: string; event: string; userId: string | null; domain: string | null; metadata: string | null; createdAt: Date }[], { api, correlationId }),
      safeQuery(() => db.analyticsEvent.count({ where }), 0, { api, correlationId }),
    ])

    if (eventsResult.status === 'fallback') fallbacksUsed.push('events_list')
    if (totalResult.status === 'fallback') fallbacksUsed.push('events_count')

    // Count by event type
    const allEventsResult = await safeQuery(() => db.analyticsEvent.findMany({
      select: { event: true },
    }), [] as { event: string }[], { api, correlationId })

    if (allEventsResult.status === 'fallback') fallbacksUsed.push('events_by_type')

    const countMap: Record<string, number> = {}
    for (const evt of allEventsResult.data) {
      countMap[evt.event] = (countMap[evt.event] || 0) + 1
    }

    const countsByType = Object.entries(countMap)
      .map(([ev, count]) => ({ event: ev, count }))
      .sort((a, b) => b.count - a.count)

    const status: DataStatus = fallbacksUsed.length === 0 ? 'live' : 'fallback'
    const confidence = Math.max(0, 100 - fallbacksUsed.length * 25)

    if (fallbacksUsed.length > 0) {
      logFallback({
        api,
        reason: `${fallbacksUsed.length} fallback(s): ${fallbacksUsed.join(', ')}`,
        category: 'db_missing_table',
        confidence,
        correlationId,
      })
    }

    return NextResponse.json({
      events: eventsResult.data,
      total: totalResult.data,
      countsByType,
      status,
      confidence,
      fallbacksUsed,
    })
  } catch (error) {
    console.error('[events] GET error:', error instanceof Error ? error.message : 'Unknown')

    logFallback({
      api,
      reason: `Top-level error: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'unknown',
      confidence: 0,
      correlationId,
      error,
    })

    return NextResponse.json({
      events: [],
      total: 0,
      countsByType: [],
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}

// ── POST: Track a new analytics event ──────────────────────────────
export async function POST(request: NextRequest) {
  const api = '/api/superadmin/events'
  const correlationId = request.headers.get('x-request-id') || undefined

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

    return NextResponse.json({ success: true, event: newEvent, status: 'live', confidence: 100 }, { status: 201 })
  } catch (error) {
    console.error('[events] POST error:', error instanceof Error ? error.message : 'Unknown')

    logFallback({
      api,
      reason: `Failed to create event: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'db_missing_table',
      confidence: 0,
      correlationId,
      error,
    })

    return NextResponse.json({
      success: false,
      error: 'Event tracking unavailable',
      note: 'Table may not exist yet',
      status: 'fallback' as DataStatus,
      confidence: 0,
    })
  }
}
