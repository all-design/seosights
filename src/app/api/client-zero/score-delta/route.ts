/**
 * Score Delta API — Track how every action impacts AI Visibility Score
 *
 * GET  — List score delta events with filters
 * POST — Record a new score delta event
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

// GET: List score delta events
export async function GET(request: NextRequest) {
  const api = '/api/client-zero/score-delta'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || 'seosights.com'
    const actionType = searchParams.get('actionType') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    const where: Record<string, unknown> = { domain }
    if (actionType) where.actionType = actionType

    const [eventsResult, statsResult] = await Promise.all([
      safeQuery(() => db.scoreDeltaEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }), [], { api, correlationId }),
      safeQuery(() => db.scoreDeltaEvent.aggregate({
        where: { domain },
        _avg: { scoreDelta: true },
        _sum: { scoreDelta: true },
        _count: true,
      }), { _avg: { scoreDelta: null }, _sum: { scoreDelta: 0 }, _count: 0 }, api),
    ])

    if (eventsResult.status === 'fallback') fallbacksUsed.push('events')
    if (statsResult.status === 'fallback') fallbacksUsed.push('stats')

    const byTypeResult = await safeQuery(() => db.scoreDeltaEvent.groupBy({
      by: ['actionType'],
      where: { domain },
      _avg: { scoreDelta: true },
      _count: { actionType: true },
      orderBy: { _avg: { scoreDelta: 'desc' } },
    }), [], { api, correlationId })

    if (byTypeResult.status === 'fallback') fallbacksUsed.push('by_type')

    const status: DataStatus = fallbacksUsed.length === 0 ? 'live' : 'fallback'
    const confidence = Math.max(0, 100 - fallbacksUsed.length * 15)

    return NextResponse.json({
      events: eventsResult.data,
      stats: {
        avgDelta: statsResult.data._avg.scoreDelta
          ? Math.round(statsResult.data._avg.scoreDelta * 10) / 10
          : 0,
        totalDelta: statsResult.data._sum.scoreDelta || 0,
        totalEvents: statsResult.data._count,
      },
      byActionType: byTypeResult.data,
      status,
      confidence,
      fallbacksUsed,
    })
  } catch (error) {
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
      stats: { avgDelta: 0, totalDelta: 0, totalEvents: 0 },
      byActionType: [],
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}

// POST: Record a new score delta event
export async function POST(request: NextRequest) {
  const api = '/api/client-zero/score-delta'
  const correlationId = request.headers.get('x-request-id') || undefined

  try {
    const body = await request.json()
    const { domain, actionType, actionTitle, scoreBefore, scoreAfter, engine, autoExecuted } = body as {
      domain?: string
      actionType: string
      actionTitle: string
      scoreBefore: number
      scoreAfter: number
      engine?: string
      autoExecuted?: boolean
    }

    if (!actionType || !actionTitle) {
      return NextResponse.json({ success: false, error: 'actionType and actionTitle are required' }, { status: 400 })
    }

    const event = await db.scoreDeltaEvent.create({
      data: {
        domain: domain || 'seosights.com',
        actionType,
        actionTitle,
        scoreBefore,
        scoreAfter,
        scoreDelta: scoreAfter - scoreBefore,
        engine: engine || null,
        autoExecuted: autoExecuted || false,
      },
    })

    return NextResponse.json({
      success: true,
      data: event,
      status: 'live' as DataStatus,
      confidence: 100,
    }, { status: 201 })
  } catch (error) {
    logFallback({
      api,
      reason: `POST error: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'db_query',
      confidence: 0,
      correlationId,
      error,
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to record score delta',
      status: 'fallback' as DataStatus,
      confidence: 0,
    }, { status: 500 })
  }
}
