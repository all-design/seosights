/**
 * Feature Validation API — Track whether each feature actually works on seosights.com
 *
 * GET  — List feature validations with status
 * POST — Create or update a feature validation entry
 * PUT  — Update validation status (experimental → validating → validated)
 *
 * Dogfood Rule: No feature ships until it's been used 14+ days on seosights.com
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, safeAction, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

// GET: List feature validations
export async function GET(request: NextRequest) {
  const api = '/api/client-zero/feature-validation'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [featuresResult, countsResult] = await Promise.all([
      safeQuery(() => db.featureValidation.findMany({
        where,
        orderBy: { usageCount: 'desc' },
      }), [], { api, correlationId }),
      safeQuery(() => db.featureValidation.groupBy({
        by: ['status'],
        _count: { status: true },
      }), [], { api, correlationId }),
    ])

    if (featuresResult.status === 'fallback') fallbacksUsed.push('features')
    if (countsResult.status === 'fallback') fallbacksUsed.push('counts')

    const overallStatus: DataStatus = fallbacksUsed.length === 0 ? 'live' : 'fallback'
    const confidence = Math.max(0, 100 - fallbacksUsed.length * 15)

    return NextResponse.json({
      features: featuresResult.data,
      countsByStatus: countsResult.data,
      status: overallStatus,
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
      features: [],
      countsByStatus: [],
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}

// POST: Create a new feature validation entry
export async function POST(request: NextRequest) {
  const api = '/api/client-zero/feature-validation'
  const correlationId = request.headers.get('x-request-id') || undefined

  try {
    const body = await request.json()
    const { featureKey, featureName, status, notes } = body as {
      featureKey: string
      featureName: string
      status?: string
      notes?: string
    }

    if (!featureKey || !featureName) {
      return NextResponse.json({ success: false, error: 'featureKey and featureName are required' }, { status: 400 })
    }

    const feature = await db.featureValidation.upsert({
      where: { featureKey },
      create: {
        featureKey,
        featureName,
        status: status || 'experimental',
        notes: notes || null,
        dogfoodStartAt: status === 'validating' ? new Date() : null,
      },
      update: {
        featureName,
        status: status || undefined,
        notes: notes || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: feature,
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
      error: 'Failed to create feature validation',
      status: 'fallback' as DataStatus,
      confidence: 0,
    }, { status: 500 })
  }
}

// PUT: Update feature status (e.g. mark as validated, increment usage)
export async function PUT(request: NextRequest) {
  const api = '/api/client-zero/feature-validation'
  const correlationId = request.headers.get('x-request-id') || undefined

  try {
    const body = await request.json()
    const { featureKey, status, incrementUsage, avgScoreGain, notes } = body as {
      featureKey: string
      status?: string
      incrementUsage?: boolean
      avgScoreGain?: number
      notes?: string
    }

    if (!featureKey) {
      return NextResponse.json({ success: false, error: 'featureKey is required' }, { status: 400 })
    }

    const existing = await db.featureValidation.findUnique({ where: { featureKey } })
    if (!existing) {
      return NextResponse.json({ success: false, error: `Feature ${featureKey} not found` }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      if (status === 'validating' && !existing.dogfoodStartAt) {
        updateData.dogfoodStartAt = new Date()
      }
      if (status === 'validated') {
        updateData.validatedAt = new Date()
      }
    }
    if (incrementUsage) {
      updateData.usageCount = existing.usageCount + 1
      updateData.lastUsedAt = new Date()
    }
    if (avgScoreGain !== undefined) {
      updateData.avgScoreGain = avgScoreGain
    }
    if (notes) {
      updateData.notes = notes
    }

    const updated = await db.featureValidation.update({
      where: { featureKey },
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
      error: 'Failed to update feature validation',
      status: 'fallback' as DataStatus,
      confidence: 0,
    }, { status: 500 })
  }
}
