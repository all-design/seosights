/**
 * Auto Execute™ API
 *
 * GET  — Fetch AutoExecution records for a domain with optional filters
 * POST — Create a new AutoExecution record with status "pending"
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

const VALID_PLATFORMS = ['wordpress', 'webflow', 'shopify', 'custom']
const VALID_ACTION_TYPES = ['schema_update', 'meta_tag', 'content_publish', 'robots_update', 'redirect_create']
const VALID_STATUSES = ['pending', 'executing', 'success', 'failed', 'rolled_back']

// ── GET: Fetch AutoExecution records ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { domain }
    if (userId) where.userId = userId
    if (status) where.status = status

    const executionsResult = await safeQuery(
      (d) => d.autoExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          actionItem: {
            select: {
              id: true,
              actionType: true,
              title: true,
              priority: true,
              status: true,
            },
          },
        },
      }),
      [] as any[]
    )
    const executions = executionsResult.data

    // Summary stats
    const totalExecutionsResult = await safeQuery(
      (d) => d.autoExecution.count({ where: { domain } }),
      0
    )
    const totalExecutions = totalExecutionsResult.data
    const pendingCountResult = await safeQuery(
      (d) => d.autoExecution.count({ where: { domain, status: 'pending' } }),
      0
    )
    const pendingCount = pendingCountResult.data
    const successCountResult = await safeQuery(
      (d) => d.autoExecution.count({ where: { domain, status: 'success' } }),
      0
    )
    const successCount = successCountResult.data
    const failedCountResult = await safeQuery(
      (d) => d.autoExecution.count({ where: { domain, status: 'failed' } }),
      0
    )
    const failedCount = failedCountResult.data

    return NextResponse.json({
      executions,
      stats: {
        total: totalExecutions,
        pending: pendingCount,
        success: successCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('[auto-execute] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({
      executions: [],
      stats: { total: 0, pending: 0, success: 0, failed: 0 },
    })
  }
}

// ── POST: Create a new AutoExecution ────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionItemId, userId, domain, platform, actionType, payload } = body

    // Validate required fields
    if (!actionItemId || !userId || !domain || !platform || !actionType) {
      return NextResponse.json(
        { error: 'actionItemId, userId, domain, platform, and actionType are required' },
        { status: 400 }
      )
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `platform must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_ACTION_TYPES.includes(actionType)) {
      return NextResponse.json(
        { error: `actionType must be one of: ${VALID_ACTION_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify the action item exists
    const actionItemResult = await safeQuery(
      (d) => d.actionItem.findUnique({
        where: { id: actionItemId },
      }),
      null as any
    )
    const actionItem = actionItemResult.data

    if (!actionItem) {
      return NextResponse.json(
        { error: 'ActionItem not found' },
        { status: 404 }
      )
    }

    // Verify the action item belongs to the user and domain
    if (actionItem.userId !== userId || actionItem.domain !== domain) {
      return NextResponse.json(
        { error: 'ActionItem does not belong to the specified user/domain' },
        { status: 403 }
      )
    }

    // Create the AutoExecution with status "pending"
    const executionResult = await safeQuery(
      (d) => d.autoExecution.create({
        data: {
          actionItemId,
          userId,
          domain,
          platform,
          actionType,
          payload: payload ? JSON.stringify(payload) : '{}',
          status: 'pending',
          attempts: 0,
        },
      }),
      null as any
    )
    const execution = executionResult.data

    // Update the ActionItem status to indicate auto-execution is queued
    await safeQuery(
      (d) => d.actionItem.update({
        where: { id: actionItemId },
        data: {
          status: 'auto_executing',
          autoExecuteEnabled: true,
        },
      }),
      null as any
    )
    // Result not needed — fire and forget update

    return NextResponse.json({ execution }, { status: 201 })
  } catch (error) {
    console.error('[auto-execute] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ execution: null, message: 'Failed to create auto execution — tables may not exist yet' })
  }
}
