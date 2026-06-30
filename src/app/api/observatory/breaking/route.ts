import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/breaking
 * List Breaking Research alerts (most recent first).
 *
 * Query params:
 *   isPublished - Filter by published status (true/false)
 *   aiModel     - Filter by AI model
 *   changeType  - Filter by change type
 *   limit       - Max results (default 20)
 *   offset      - Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublished = searchParams.get('isPublished')
    const aiModel = searchParams.get('aiModel')
    const changeType = searchParams.get('changeType')
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (isPublished !== null && isPublished !== '') {
      where.isPublished = isPublished === 'true'
    }
    if (aiModel) where.aiModel = aiModel
    if (changeType) where.changeType = changeType

    const alerts = await db.breakingResearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.breakingResearch.count({ where })

    // Stats
    const totalAlerts = await db.breakingResearch.count()
    const publishedCount = await db.breakingResearch.count({ where: { isPublished: true } })
    const unpublishedCount = await db.breakingResearch.count({ where: { isPublished: false } })
    const avgSignificance = await db.breakingResearch.aggregate({
      _avg: { significance: true },
    })

    // By change type
    const byType = await db.breakingResearch.groupBy({
      by: ['changeType'],
      _count: { id: true },
      _avg: { significance: true },
    })

    // By AI model
    const byModel = await db.breakingResearch.groupBy({
      by: ['aiModel'],
      _count: { id: true },
      _avg: { significance: true },
    })

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        changeId: a.changeId,
        headline: a.headline,
        summary: a.summary,
        aiModel: a.aiModel,
        changeType: a.changeType,
        evidenceCount: a.evidenceCount,
        confidence: a.confidence,
        significance: a.significance,
        sourceBefore: a.sourceBefore,
        sourceAfter: a.sourceAfter,
        isPublished: a.isPublished,
        publishedAt: a.publishedAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        totalAlerts,
        published: publishedCount,
        unpublished: unpublishedCount,
        avgSignificance: avgSignificance._avg.significance?.toFixed(3) || '0.000',
        byType: byType.map((t) => ({
          changeType: t.changeType,
          count: t._count.id,
          avgSignificance: t._avg.significance?.toFixed(3) || '0.000',
        })),
        byModel: byModel.map((m) => ({
          aiModel: m.aiModel,
          count: m._count.id,
          avgSignificance: m._avg.significance?.toFixed(3) || '0.000',
        })),
      },
    })
  } catch (error) {
    console.error('[observatory/breaking] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch breaking research alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/observatory/breaking
 * Create a Breaking Research alert from a high-significance change.
 *
 * Body:
 *   changeId     - ID of the ObservatoryChange to create alert from
 *   headline     - Custom headline (auto-generated if not provided)
 *   summary      - Custom summary (auto-generated if not provided)
 *   isPublished  - Whether to publish immediately (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { changeId, headline, summary, isPublished = false } = body

    if (!changeId) {
      return NextResponse.json({ error: 'changeId is required' }, { status: 400 })
    }

    // Fetch the change
    const change = await db.observatoryChange.findUnique({
      where: { id: changeId },
    })

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    if (!change.isSignal) {
      return NextResponse.json(
        { error: 'This change is not a signal. Only signals can generate breaking research alerts.' },
        { status: 400 }
      )
    }

    // Check if an alert already exists for this change
    const existingAlert = await db.breakingResearch.findFirst({
      where: { changeId },
    })

    if (existingAlert) {
      return NextResponse.json({
        error: 'A breaking research alert already exists for this change.',
        existingAlertId: existingAlert.id,
      }, { status: 409 })
    }

    // Count evidence (related changes with same model+type)
    const evidenceCount = await db.observatoryChange.count({
      where: {
        aiModel: change.aiModel,
        changeType: change.changeType,
        isSignal: true,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    })

    // Auto-generate headline and summary if not provided
    const finalHeadline = headline || `${change.aiModel.charAt(0).toUpperCase() + change.aiModel.slice(1)}: ${change.changeType.replace(/_/g, ' ')} in ${change.category.replace(/_/g, ' ')}`
    const finalSummary = summary || `Detected ${change.changeType.replace(/_/g, ' ')} in ${change.aiModel} regarding ${change.category.replace(/_/g, ' ')}. Significance: ${(change.significanceScore * 100).toFixed(0)}%. ${change.signalReason || ''}`

    // Determine change type for the breaking alert
    const alertChangeType = mapChangeType(change.changeType)

    const alert = await db.breakingResearch.create({
      data: {
        changeId,
        headline: finalHeadline,
        summary: finalSummary,
        aiModel: change.aiModel,
        changeType: alertChangeType,
        evidenceCount: Math.max(1, evidenceCount),
        confidence: change.significanceScore,
        significance: change.significanceScore,
        sourceBefore: change.beforeSummary,
        sourceAfter: change.afterSummary,
        isPublished: isPublished === true,
        publishedAt: isPublished === true ? new Date() : null,
      },
    })

    // If published, also mark any related report as breaking
    if (isPublished) {
      await db.observatoryReport.updateMany({
        where: {
          aiModels: { contains: change.aiModel },
          categories: { contains: change.category },
          status: { in: ['draft', 'proposed', 'approved'] },
        },
        data: {
          isBreaking: true,
          breakingAlertId: alert.id,
        },
      })
    }

    return NextResponse.json({
      message: 'Breaking research alert created.',
      alert: {
        id: alert.id,
        headline: alert.headline,
        summary: alert.summary,
        aiModel: alert.aiModel,
        changeType: alert.changeType,
        evidenceCount: alert.evidenceCount,
        confidence: alert.confidence,
        significance: alert.significance,
        isPublished: alert.isPublished,
        createdAt: alert.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[observatory/breaking] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create breaking research alert', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Map ObservatoryChange changeType to BreakingResearch changeType
 */
function mapChangeType(changeType: string): string {
  const mapping: Record<string, string> = {
    citation_shift: 'citation_shift',
    sentiment_shift: 'behavior_change',
    source_shift: 'source_shift',
    ranking_change: 'behavior_change',
    new_capability: 'new_capability',
    behavior_change: 'behavior_change',
  }
  return mapping[changeType] || 'behavior_change'
}
