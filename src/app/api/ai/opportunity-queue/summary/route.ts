/**
 * ROI Opportunity Queue — Summary
 *
 * GET /api/ai/opportunity-queue/summary?domain=...&userId=...
 *   Returns a summary of the queue including:
 *   - Total items
 *   - Total potential score gain
 *   - Top 5 quick wins (highest ROI, effortMinutes <= 30)
 *   - Top 5 big impact items (highest estimatedScoreGain)
 *   - Estimated total effort
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  calculateROIScore,
  ACTIVE_QUEUE_STATUSES,
} from '@/lib/roi'

export const dynamic = 'force-dynamic'

// ── Types ──────────────────────────────────────────────────────────

interface QueueSummaryItem {
  id: string
  actionType: string
  title: string
  description: string
  priority: string
  impact: string
  estimatedScoreGain: number
  effortMinutes: number
  roiScore: number
  queuePosition: number
  status: string
  relatedUrl: string | null
  autoExecuteEnabled: boolean
}

interface QueueSummary {
  totalItems: number
  totalPotentialScoreGain: number
  estimatedTotalEffortMinutes: number
  estimatedTotalEffortHours: number
  topQuickWins: QueueSummaryItem[]
  topBigImpact: QueueSummaryItem[]
  byPriority: Record<string, { count: number; totalScoreGain: number; totalEffort: number }>
  byStatus: Record<string, { count: number; totalScoreGain: number }>
}

// ── GET: Retrieve queue summary ────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId')

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing required parameter: domain' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    // Fetch all active items for the queue
    const items = await db.actionItem.findMany({
      where: {
        domain,
        userId,
        status: { in: [...ACTIVE_QUEUE_STATUSES] },
      },
      orderBy: { roiScore: 'desc' },
    })

    if (items.length === 0) {
      return NextResponse.json({
        totalItems: 0,
        totalPotentialScoreGain: 0,
        estimatedTotalEffortMinutes: 0,
        estimatedTotalEffortHours: 0,
        topQuickWins: [],
        topBigImpact: [],
        byPriority: {},
        byStatus: {},
      } satisfies QueueSummary)
    }

    // Calculate ROI scores and enrich items
    const enriched: QueueSummaryItem[] = items.map((item) => ({
      id: item.id,
      actionType: item.actionType,
      title: item.title,
      description: item.description,
      priority: item.priority,
      impact: item.impact,
      estimatedScoreGain: item.estimatedScoreGain,
      effortMinutes: item.effortMinutes,
      roiScore:
        item.roiScore > 0
          ? item.roiScore
          : calculateROIScore(
              item.estimatedScoreGain,
              item.effortMinutes,
              item.priority
            ),
      queuePosition: item.queuePosition,
      status: item.status,
      relatedUrl: item.relatedUrl,
      autoExecuteEnabled: item.autoExecuteEnabled,
    }))

    // Total potential score gain
    const totalPotentialScoreGain = enriched.reduce(
      (sum, item) => sum + item.estimatedScoreGain,
      0
    )

    // Total estimated effort
    const estimatedTotalEffortMinutes = enriched.reduce(
      (sum, item) => sum + item.effortMinutes,
      0
    )
    const estimatedTotalEffortHours = Math.round(
      (estimatedTotalEffortMinutes / 60) * 10
    ) / 10

    // Quick wins: highest ROI items with effortMinutes <= 30
    const quickWins = enriched
      .filter((item) => item.effortMinutes <= 30 && item.effortMinutes > 0)
      .sort((a, b) => b.roiScore - a.roiScore)
      .slice(0, 5)

    // Big impact: highest estimatedScoreGain items
    const bigImpact = [...enriched]
      .sort((a, b) => b.estimatedScoreGain - a.estimatedScoreGain)
      .slice(0, 5)

    // Breakdown by priority
    const byPriority: Record<
      string,
      { count: number; totalScoreGain: number; totalEffort: number }
    > = {}
    for (const item of enriched) {
      const p = item.priority.toLowerCase()
      if (!byPriority[p]) {
        byPriority[p] = { count: 0, totalScoreGain: 0, totalEffort: 0 }
      }
      byPriority[p].count++
      byPriority[p].totalScoreGain += item.estimatedScoreGain
      byPriority[p].totalEffort += item.effortMinutes
    }

    // Breakdown by status
    const byStatus: Record<
      string,
      { count: number; totalScoreGain: number }
    > = {}
    for (const item of enriched) {
      const s = item.status
      if (!byStatus[s]) {
        byStatus[s] = { count: 0, totalScoreGain: 0 }
      }
      byStatus[s].count++
      byStatus[s].totalScoreGain += item.estimatedScoreGain
    }

    const summary: QueueSummary = {
      totalItems: enriched.length,
      totalPotentialScoreGain,
      estimatedTotalEffortMinutes,
      estimatedTotalEffortHours,
      topQuickWins: quickWins,
      topBigImpact: bigImpact,
      byPriority,
      byStatus,
    }

    return NextResponse.json(summary)
  } catch (err) {
    console.error(
      '[opportunity-queue/summary] GET Error:',
      err instanceof Error ? err.message : 'Unknown'
    )
    return NextResponse.json(
      { error: 'Failed to retrieve queue summary' },
      { status: 500 }
    )
  }
}
