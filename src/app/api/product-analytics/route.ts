import { NextRequest, NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

/**
 * Product Analytics Engine API
 * POST /api/product-analytics — Track a product event
 * GET  /api/product-analytics — Get event stats
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, userId, companyId, plan, sessionId, correlationId, metadata } = body

    if (!event) {
      return NextResponse.json({ error: 'event is required' }, { status: 400 })
    }

    const validEvents = [
      'audit_started', 'audit_completed', 'gsc_connected', 'wp_connected',
      'auto_execute_clicked', 'report_downloaded', 'upgrade_clicked',
      'payment_completed', 'replay_opened', 'digest_opened',
      'mission_control_opened', 'recorder_used', 'feed_viewed'
    ]

    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: `Invalid event. Must be one of: ${validEvents.join(', ')}` }, { status: 400 })
    }

    const result = await safeQuery(
      (db) => db.productEvent.create({
        data: {
          event,
          userId: userId || null,
          companyId: companyId || null,
          plan: plan || null,
          sessionId: sessionId || null,
          correlationId: correlationId || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      }),
      null,
      { api: 'product-analytics', confidence: 100 }
    )

    return NextResponse.json({
      success: result.status === 'live',
      status: result.status,
      confidence: result.confidence,
      data: result.data,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const event = searchParams.get('event')
  const userId = searchParams.get('userId')
  const days = parseInt(searchParams.get('days') || '30')

  const since = new Date()
  since.setDate(since.getDate() - days)

  // Get event counts
  const statsResult = await safeQuery(
    (db) => db.productEvent.groupBy({
      by: ['event'],
      where: {
        ...(event ? { event } : {}),
        ...(userId ? { userId } : {}),
        createdAt: { gte: since },
      },
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
    }),
    [],
    { api: 'product-analytics', confidence: 95 }
  )

  // Get total events
  const totalResult = await safeQuery(
    (db) => db.productEvent.count({
      where: {
        ...(event ? { event } : {}),
        ...(userId ? { userId } : {}),
        createdAt: { gte: since },
      },
    }),
    0,
    { api: 'product-analytics', confidence: 95 }
  )

  // Get daily breakdown (last 7 days)
  const dailyResult = await safeQuery(
    (db) => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return db.productEvent.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          event: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    },
    [],
    { api: 'product-analytics', confidence: 90 }
  )

  return NextResponse.json({
    status: statsResult.status,
    confidence: statsResult.confidence,
    data: {
      eventCounts: statsResult.data,
      totalEvents: totalResult.data,
      days,
      dailyEvents: dailyResult.data,
    },
  })
}
