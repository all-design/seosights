/**
 * Sprint Detail — Single Sprint Operations
 *
 * GET /api/content-engine/sprints/[id]  → Single sprint detail
 * PUT /api/content-engine/sprints/[id]  → Update sprint (start, complete, fail)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Single Sprint Detail ─────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sprint = await db.sprint.findUnique({
      where: { id },
    })

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sprint: {
        ...sprint,
        progressPercentage: sprint.totalActions > 0
          ? Math.round((sprint.executedActions / sprint.totalActions) * 100)
          : 0,
        aiPlanParsed: sprint.aiPlan ? JSON.parse(sprint.aiPlan) : null,
        plannedActionsParsed: sprint.plannedActions ? JSON.parse(sprint.plannedActions) : null,
        resultSummaryParsed: sprint.resultSummary ? JSON.parse(sprint.resultSummary) : null,
      },
    })
  } catch (error) {
    console.error('[Sprint Detail] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprint' },
      { status: 500 }
    )
  }
}

// ── PUT: Update Sprint Status ─────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, resultSummary } = body

    // Verify sprint exists
    const existing = await db.sprint.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'start':
        updateData = {
          status: 'active',
          startedAt: new Date(),
        }
        break

      case 'complete': {
        // Get current visibility for result
        const latestVisibility = await db.visibilitySnapshot.findFirst({
          where: { domain: existing.domain },
          orderBy: { capturedAt: 'desc' },
        })
        const finalValue = latestVisibility?.overallScore ?? existing.currentValue
        const goalAchieved = existing.goalMetric === 'ai_visibility'
          ? finalValue >= existing.goalTarget
          : true

        updateData = {
          status: 'completed',
          resultSummary: JSON.stringify({
            goalMet: goalAchieved,
            startValue: existing.currentValue,
            endValue: finalValue,
            delta: finalValue - existing.currentValue,
            goalTarget: existing.goalTarget,
            executedActions: existing.executedActions,
            totalActions: existing.totalActions,
            ...resultSummary,
          }),
        }
        break
      }

      case 'fail':
        updateData = {
          status: 'failed',
          resultSummary: JSON.stringify({
            goalMet: false,
            startValue: existing.currentValue,
            executedActions: existing.executedActions,
            totalActions: existing.totalActions,
            reason: resultSummary?.reason || 'Sprint failed to achieve goal',
          }),
        }
        break

      case 'progress':
        updateData = {
          executedActions: Math.min(
            (existing.executedActions || 0) + (body.actionsCompleted || 1),
            existing.totalActions
          ),
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, complete, fail, or progress' },
          { status: 400 }
        )
    }

    const updated = await db.sprint.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      sprint: {
        ...updated,
        progressPercentage: updated.totalActions > 0
          ? Math.round((updated.executedActions / updated.totalActions) * 100)
          : 0,
        aiPlanParsed: updated.aiPlan ? JSON.parse(updated.aiPlan) : null,
        plannedActionsParsed: updated.plannedActions ? JSON.parse(updated.plannedActions) : null,
        resultSummaryParsed: updated.resultSummary ? JSON.parse(updated.resultSummary) : null,
      },
    })
  } catch (error) {
    console.error('[Sprint Detail] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update sprint' },
      { status: 500 }
    )
  }
}
