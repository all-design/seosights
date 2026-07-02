/**
 * AI Lab API — Internal AI model testing on seosights.com
 *
 * GET  — List model experiments
 * POST — Create a new model experiment
 * PUT  — Promote/demote a model between tiers
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

// GET: List model experiments
export async function GET(request: NextRequest) {
  const api = '/api/client-zero/ai-lab'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') || undefined
    const taskType = searchParams.get('taskType') || undefined

    const where: Record<string, unknown> = {}
    if (tier) where.modelTier = tier
    if (taskType) where.taskType = taskType

    const [modelsResult, byTierResult] = await Promise.all([
      safeQuery(() => db.aIModelExperiment.findMany({
        where,
        orderBy: [
          { modelTier: 'asc' },
          { qualityScore: 'desc' },
        ],
      }), [], { api, correlationId }),
      safeQuery(() => db.aIModelExperiment.groupBy({
        by: ['modelTier'],
        _count: { modelTier: true },
        _avg: { qualityScore: true, successRate: true, latencyMs: true },
      }), [], { api, correlationId }),
    ])

    if (modelsResult.status === 'fallback') fallbacksUsed.push('models')
    if (byTierResult.status === 'fallback') fallbacksUsed.push('by_tier')

    const status: DataStatus = fallbacksUsed.length === 0 ? 'live' : 'fallback'
    const confidence = Math.max(0, 100 - fallbacksUsed.length * 15)

    return NextResponse.json({
      models: modelsResult.data,
      byTier: byTierResult.data,
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
      models: [],
      byTier: [],
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}

// POST: Create a new model experiment
export async function POST(request: NextRequest) {
  const api = '/api/client-zero/ai-lab'
  const correlationId = request.headers.get('x-request-id') || undefined

  try {
    const body = await request.json()
    const { modelName, provider, taskType, modelTier, costPer1kTokens } = body as {
      modelName: string
      provider: string
      taskType: string
      modelTier?: string
      costPer1kTokens?: number
    }

    if (!modelName || !provider || !taskType) {
      return NextResponse.json({ success: false, error: 'modelName, provider, and taskType are required' }, { status: 400 })
    }

    const experiment = await db.aIModelExperiment.create({
      data: {
        modelName,
        provider,
        taskType,
        modelTier: modelTier || 'lab',
        costPer1kTokens: costPer1kTokens || 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: experiment,
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
      error: 'Failed to create model experiment',
      status: 'fallback' as DataStatus,
      confidence: 0,
    }, { status: 500 })
  }
}

// PUT: Update model (promote/demote, record test results)
export async function PUT(request: NextRequest) {
  const api = '/api/client-zero/ai-lab'
  const correlationId = request.headers.get('x-request-id') || undefined

  try {
    const body = await request.json()
    const { id, modelTier, qualityScore, latencyMs, successRate, recordRun } = body as {
      id: string
      modelTier?: string
      qualityScore?: number
      latencyMs?: number
      successRate?: number
      recordRun?: boolean
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    const existing = await db.aIModelExperiment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: `Model ${id} not found` }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (modelTier) {
      updateData.modelTier = modelTier
      if (modelTier === 'production') {
        updateData.promotedAt = new Date()
      }
    }
    if (qualityScore !== undefined) updateData.qualityScore = qualityScore
    if (latencyMs !== undefined) updateData.latencyMs = latencyMs
    if (successRate !== undefined) updateData.successRate = successRate
    if (recordRun) updateData.totalRuns = existing.totalRuns + 1

    const updated = await db.aIModelExperiment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: updated,
      status: 'live' as DataStatus,
      confidence: 100,
    })
  } catch (error) {
    logFallback({
      api,
      reason: `PUT error: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'db_query',
      confidence: 0,
      correlationId,
      error,
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to update model experiment',
      status: 'fallback' as DataStatus,
      confidence: 0,
    }, { status: 500 })
  }
}
