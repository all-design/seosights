/**
 * ROI Opportunity Queue — Single Item Update
 *
 * PATCH /api/ai/opportunity-queue/[actionItemId]
 *   Body: { status?, effortMinutes?, autoExecuteEnabled? }
 *   Updates an item in the queue and recalculates ROI/positions.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  calculateROIScore,
  rankAndPositionItems,
  ACTIVE_QUEUE_STATUSES,
  VALID_STATUSES,
} from '@/lib/roi'

export const dynamic = 'force-dynamic'

// ── PATCH: Update a single queue item ──────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ actionItemId: string }> }
) {
  try {
    const { actionItemId } = await params

    if (!actionItemId) {
      return NextResponse.json(
        { error: 'Missing actionItemId' },
        { status: 400 }
      )
    }

    // Verify the item exists
    const existingItem = await db.actionItem.findUnique({
      where: { id: actionItemId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { status, effortMinutes, autoExecuteEnabled } = body as {
      status?: string
      effortMinutes?: number
      autoExecuteEnabled?: boolean
    }

    // Validate status if provided
    if (status !== undefined && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate effortMinutes if provided
    if (effortMinutes !== undefined && (typeof effortMinutes !== 'number' || effortMinutes < 0)) {
      return NextResponse.json(
        { error: 'effortMinutes must be a non-negative number' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      updateData.status = status
      // Set timestamps based on status changes
      if (status === 'completed') {
        updateData.completedAt = new Date()
      }
      if (status === 'auto_executed') {
        updateData.autoExecutedAt = new Date()
      }
    }

    if (effortMinutes !== undefined) {
      updateData.effortMinutes = effortMinutes
    }

    if (autoExecuteEnabled !== undefined) {
      updateData.autoExecuteEnabled = autoExecuteEnabled
    }

    // Recalculate ROI score if effortMinutes changed (or status changed to something active)
    const newEffortMinutes =
      effortMinutes !== undefined ? effortMinutes : existingItem.effortMinutes
    const shouldRecalcROI =
      effortMinutes !== undefined ||
      (existingItem.roiScore === 0 && ACTIVE_QUEUE_STATUSES.includes(existingItem.status as (typeof ACTIVE_QUEUE_STATUSES)[number]))

    if (shouldRecalcROI) {
      updateData.roiScore = calculateROIScore(
        existingItem.estimatedScoreGain,
        newEffortMinutes,
        existingItem.priority
      )
    }

    // Update the item
    const updatedItem = await db.actionItem.update({
      where: { id: actionItemId },
      data: updateData,
    })

    // Re-position all active items in the same domain/user queue
    await repositionQueue(existingItem.domain, existingItem.userId)

    return NextResponse.json({ item: updatedItem })
  } catch (err) {
    console.error(
      '[opportunity-queue/[actionItemId]] PATCH Error:',
      err instanceof Error ? err.message : 'Unknown'
    )
    return NextResponse.json(
      { error: 'Failed to update queue item' },
      { status: 500 }
    )
  }
}

// ── Helper: Re-position all items in a domain queue ────────────────

async function repositionQueue(domain: string, userId: string): Promise<void> {
  const activeItems = await db.actionItem.findMany({
    where: {
      domain,
      userId,
      status: { in: [...ACTIVE_QUEUE_STATUSES] },
    },
  })

  if (activeItems.length === 0) return

  const ranked = rankAndPositionItems(activeItems)

  // Only update positions that changed
  const updatesNeeded = ranked.filter(
    (r) => r.item.queuePosition !== r.queuePosition || r.item.roiScore !== r.roiScore
  )

  if (updatesNeeded.length > 0) {
    await Promise.all(
      updatesNeeded.map((r) =>
        db.actionItem.update({
          where: { id: r.item.id },
          data: {
            queuePosition: r.queuePosition,
            roiScore: r.roiScore,
          },
        })
      )
    )
  }
}
