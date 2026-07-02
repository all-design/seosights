/**
 * AI Visibility Dataset API — The Moat
 *
 * Date → Prompt → Engine → Answer → Entities → Sources → Position → Confidence
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

// GET: Query the dataset
export async function GET(request: NextRequest) {
  const api = '/api/client-zero/visibility-dataset'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || 'seosights.com'
    const engine = searchParams.get('engine') || undefined
    const cited = searchParams.get('cited') || undefined
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    const where: Record<string, unknown> = {
      domain,
      date: { gte: since },
    }
    if (engine) where.engine = engine
    if (cited !== undefined) where.cited = cited === 'true'

    const [dataPointsResult, statsResult, engineBreakdownResult] = await Promise.all([
      safeQuery(() => db.aIVisibilityDataPoint.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
      }), [], { api, correlationId }),
      safeQuery(() => db.aIVisibilityDataPoint.aggregate({
        where: { domain, date: { gte: since } },
        _count: true,
        _avg: { confidence: true, position: true, scoreImpact: true },
      }), { _count: 0, _avg: { confidence: null, position: null, scoreImpact: null } }, api),
      safeQuery(() => db.aIVisibilityDataPoint.groupBy({
        by: ['engine'],
        where: { domain, date: { gte: since } },
        _count: { engine: true },
        _avg: { confidence: true, position: true },
      }), [], { api, correlationId }),
    ])

    if (dataPointsResult.status === 'fallback') fallbacksUsed.push('data_points')
    if (statsResult.status === 'fallback') fallbacksUsed.push('stats')
    if (engineBreakdownResult.status === 'fallback') fallbacksUsed.push('engine_breakdown')

    const citedCountResult = await safeQuery(() => db.aIVisibilityDataPoint.count({
      where: { domain, date: { gte: since }, cited: true },
    }), 0, { api, correlationId })

    const totalPoints = statsResult.data._count
    const citationRate = totalPoints > 0
      ? Math.round((citedCountResult.data / totalPoints) * 1000) / 10
      : 0

    const status: DataStatus = fallbacksUsed.length === 0 ? 'live' : 'fallback'
    const confidence = Math.max(0, 100 - fallbacksUsed.length * 15)

    return NextResponse.json({
      dataPoints: dataPointsResult.data,
      stats: {
        total: totalPoints,
        avgConfidence: statsResult.data._avg.confidence
          ? Math.round(statsResult.data._avg.confidence * 10) / 10
          : 0,
        avgPosition: statsResult.data._avg.position
          ? Math.round(statsResult.data._avg.position * 10) / 10
          : 0,
        avgScoreImpact: statsResult.data._avg.scoreImpact
          ? Math.round(statsResult.data._avg.scoreImpact * 10) / 10
          : 0,
        citationRate,
      },
      engineBreakdown: engineBreakdownResult.data,
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
      dataPoints: [],
      stats: { total: 0, avgConfidence: 0, avgPosition: 0, avgScoreImpact: 0, citationRate: 0 },
      engineBreakdown: [],
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}

// POST: Record a new data point
export async function POST(request: NextRequest) {
  const api = '/api/client-zero/visibility-dataset'
  const correlationId = request.headers.get('x-request-id') || undefined

  try {
    const body = await request.json()
    const {
      domain, date, prompt, engine, answer,
      cited, position, confidence, entities, sources,
      sentiment, scoreImpact, rawData,
    } = body as {
      domain?: string
      date?: string
      prompt: string
      engine: string
      answer?: string
      cited?: boolean
      position?: number
      confidence?: number
      entities?: string
      sources?: string
      sentiment?: string
      scoreImpact?: number
      rawData?: string
    }

    if (!prompt || !engine) {
      return NextResponse.json({ success: false, error: 'prompt and engine are required' }, { status: 400 })
    }

    const dataPoint = await db.aIVisibilityDataPoint.create({
      data: {
        domain: domain || 'seosights.com',
        date: date ? new Date(date) : new Date(),
        prompt,
        engine,
        answer: answer || null,
        cited: cited || false,
        position: position || 0,
        confidence: confidence || 0,
        entities: entities || null,
        sources: sources || null,
        sentiment: sentiment || null,
        scoreImpact: scoreImpact || 0,
        rawData: rawData || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: dataPoint,
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
      error: 'Failed to record visibility data',
      status: 'fallback' as DataStatus,
      confidence: 0,
    }, { status: 500 })
  }
}
