/**
 * ROI Opportunity Queue API
 *
 * GET  — Fetch ActionItems sorted by roiScore DESC with on-the-fly ROI calculation
 * POST — Recalculate roiScore for all pending items and update queuePosition
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// Priority weight mapping for ROI calculation
const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Calculate ROI score: estimatedScoreGain / max(effortMinutes, 1) * priorityWeight
 */
function calculateRoiScore(
  estimatedScoreGain: number,
  effortMinutes: number,
  priority: string
): number {
  const priorityWeight = PRIORITY_WEIGHTS[priority.toLowerCase()] || 1
  return (estimatedScoreGain / Math.max(effortMinutes, 1)) * priorityWeight
}

// ── GET: Fetch ranked ActionItems with ROI ──────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      domain,
      userId,
    }
    if (status) where.status = status

    // Fetch items — we'll sort by roiScore in-memory since we may need to recalculate
    const itemsResult = await safeQuery(
      (d) => d.actionItem.findMany({
        where,
        orderBy: { roiScore: 'desc' },
      }),
      [] as any[]
    )
    const items = itemsResult.data

    // Calculate ROI on-the-fly if missing (roiScore === 0)
    const enrichedItems = items.map((item) => {
      let roiScore = item.roiScore

      // Recalculate if roiScore is 0 or missing
      if (roiScore === 0) {
        roiScore = calculateRoiScore(
          item.estimatedScoreGain,
          item.effortMinutes,
          item.priority
        )
      }

      return {
        ...item,
        roiScore: Math.round(roiScore * 100) / 100,
      }
    })

    // Sort by roiScore descending
    enrichedItems.sort((a, b) => b.roiScore - a.roiScore)

    // Calculate cumulative score gain
    let cumulativeScoreGain = 0
    const rankedItems = enrichedItems.slice(0, limit).map((item, index) => {
      cumulativeScoreGain += item.estimatedScoreGain
      return {
        ...item,
        queuePosition: index + 1,
        cumulativeScoreGain,
      }
    })

    return NextResponse.json({
      items: rankedItems,
      totalItems: enrichedItems.length,
      totalEstimatedGain: enrichedItems.reduce((sum, i) => sum + i.estimatedScoreGain, 0),
    })
  } catch (error) {
    console.error('[opportunity-queue] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ items: [], totalItems: 0, totalEstimatedGain: 0 })
  }
}

// ── POST: Recalculate roiScore for all pending items ────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, userId } = body

    if (!domain || !userId) {
      return NextResponse.json(
        { error: 'domain and userId are required' },
        { status: 400 }
      )
    }

    // Fetch all pending items for this user+domain
    const pendingItemsResult = await safeQuery(
      (d) => d.actionItem.findMany({
        where: {
          domain,
          userId,
          status: { in: ['pending', 'queued'] },
        },
      }),
      [] as any[]
    )
    const pendingItems = pendingItemsResult.data

    if (pendingItems.length === 0) {
      return NextResponse.json({
        message: 'No pending items to recalculate',
        updatedCount: 0,
      })
    }

    // Calculate new roiScores
    const itemsWithRoi = pendingItems.map((item) => ({
      id: item.id,
      roiScore: calculateRoiScore(
        item.estimatedScoreGain,
        item.effortMinutes,
        item.priority
      ),
    }))

    // Sort by roiScore descending to determine queue positions
    itemsWithRoi.sort((a, b) => b.roiScore - a.roiScore)

    // Update each item with its new roiScore and queuePosition
    let updatedCount = 0
    for (let i = 0; i < itemsWithRoi.length; i++) {
      const item = itemsWithRoi[i]
      const updateResult = (await safeQuery(
        (d) => d.actionItem.update({
          where: { id: item.id },
          data: {
            roiScore: Math.round(item.roiScore * 100) / 100,
            queuePosition: i + 1,
          },
        }),
        null as any
      )).data
      if (updateResult) updatedCount++
    }

    return NextResponse.json({
      message: 'ROI scores recalculated successfully',
      updatedCount,
      totalPending: pendingItems.length,
    })
  } catch (error) {
    console.error('[opportunity-queue] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ message: 'Failed to recalculate ROI scores', updatedCount: 0 })
  }
}
