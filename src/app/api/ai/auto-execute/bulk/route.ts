import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  executeWordPressAction,
  mapActionTypeToExecutionType as mapWP,
  type WordPressCredentials,
} from '@/lib/cms-integrations/wordpress'
import {
  executeWebflowAction,
  mapActionTypeToExecutionType as mapWF,
  type WebflowCredentials,
} from '@/lib/cms-integrations/webflow'

export const dynamic = 'force-dynamic'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulkExecuteRequestBody {
  actionItemIds: string[]
  userId: string
  platform: 'wordpress' | 'webflow'
  credentials: WordPressCredentials | WebflowCredentials
}

interface BulkExecutionItemResult {
  actionItemId: string
  success: boolean
  executionId: string
  actionType: string
  error?: string
}

// ── Priority ordering map ─────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// ── POST /api/ai/auto-execute/bulk ────────────────────────────────────────────
// Bulk executes multiple approved action items in priority order

export async function POST(req: NextRequest) {
  try {
    const body: BulkExecuteRequestBody = await req.json()
    const { actionItemIds, userId, platform, credentials } = body

    // ── Validate required fields ──────────────────────────────────────────
    if (!actionItemIds || !Array.isArray(actionItemIds) || actionItemIds.length === 0) {
      return NextResponse.json(
        { error: 'actionItemIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (actionItemIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 action items can be bulk executed at once' },
        { status: 400 }
      )
    }

    if (!userId || !platform || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, platform, credentials' },
        { status: 400 }
      )
    }

    const validPlatforms = ['wordpress', 'webflow']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform "${platform}". Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    // ── Validate credentials ──────────────────────────────────────────────
    if (platform === 'wordpress') {
      const wpCreds = credentials as WordPressCredentials
      if (!wpCreds.siteUrl || !wpCreds.username || !wpCreds.applicationPassword) {
        return NextResponse.json(
          { error: 'WordPress credentials require siteUrl, username, and applicationPassword' },
          { status: 400 }
        )
      }
    } else if (platform === 'webflow') {
      const wfCreds = credentials as WebflowCredentials
      if (!wfCreds.siteId || !wfCreds.apiToken) {
        return NextResponse.json(
          { error: 'Webflow credentials require siteId and apiToken' },
          { status: 400 }
        )
      }
    }

    // ── Fetch all action items ────────────────────────────────────────────
    const actionItems = await db.actionItem.findMany({
      where: {
        id: { in: actionItemIds },
        userId,
      },
    })

    // Check for missing items
    const foundIds = new Set(actionItems.map((a) => a.id))
    const missingIds = actionItemIds.filter((id) => !foundIds.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Action items not found or not owned by user: ${missingIds.join(', ')}` },
        { status: 404 }
      )
    }

    // ── Filter to only approved/executable items ──────────────────────────
    const approvedStatuses = ['pending', 'queued', 'in_progress']
    const executableItems = actionItems.filter((item) => approvedStatuses.includes(item.status))
    const nonExecutableItems = actionItems.filter((item) => !approvedStatuses.includes(item.status))

    // ── Sort by priority (critical first) ─────────────────────────────────
    executableItems.sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority] ?? 2
      const priorityB = PRIORITY_ORDER[b.priority] ?? 2
      if (priorityA !== priorityB) return priorityA - priorityB
      // Secondary sort: higher estimatedScoreGain first
      return (b.estimatedScoreGain || 0) - (a.estimatedScoreGain || 0)
    })

    // ── Execute items sequentially in priority order ──────────────────────
    const results: BulkExecutionItemResult[] = []

    // Add skipped items to results first
    for (const item of nonExecutableItems) {
      results.push({
        actionItemId: item.id,
        success: false,
        executionId: '',
        actionType: item.actionType,
        error: `Skipped: item status is "${item.status}", expected one of: ${approvedStatuses.join(', ')}`,
      })
    }

    // Execute each item
    for (const actionItem of executableItems) {
      const executionActionType = platform === 'wordpress'
        ? mapWP(actionItem.actionType)
        : mapWF(actionItem.actionType)

      // Parse action payload from metadata
      let actionPayload: Record<string, unknown> = {}
      if (actionItem.metadata) {
        try {
          actionPayload = JSON.parse(actionItem.metadata) as Record<string, unknown>
        } catch {
          actionPayload = {}
        }
      }

      // Create AutoExecution record
      const execution = await db.autoExecution.create({
        data: {
          actionItemId: actionItem.id,
          userId,
          domain: actionItem.domain,
          platform,
          actionType: executionActionType,
          payload: JSON.stringify(actionPayload),
          status: 'executing',
          attempts: 1,
          lastAttemptAt: new Date(),
        },
      })

      // Update ActionItem status
      await db.actionItem.update({
        where: { id: actionItem.id },
        data: {
          status: 'auto_executing',
          autoExecuteEnabled: true,
        },
      })

      // Execute on CMS
      let executionResult: {
        success: boolean
        platform: string
        actionType: string
        responseData?: Record<string, unknown>
        rollbackPayload?: Record<string, unknown>
        error?: string
      }

      try {
        if (platform === 'wordpress') {
          const wpCreds = credentials as WordPressCredentials
          executionResult = await executeWordPressAction(wpCreds, executionActionType, actionPayload)
        } else {
          const wfCreds = credentials as WebflowCredentials
          executionResult = await executeWebflowAction(wfCreds, executionActionType, actionPayload)
        }
      } catch (err) {
        executionResult = {
          success: false,
          platform,
          actionType: executionActionType,
          error: err instanceof Error ? err.message : 'Unknown execution error',
        }
      }

      // Update AutoExecution record with result
      const now = new Date()
      if (executionResult.success) {
        await db.autoExecution.update({
          where: { id: execution.id },
          data: {
            status: 'success',
            result: JSON.stringify(executionResult.responseData || {}),
            rollbackPayload: executionResult.rollbackPayload
              ? JSON.stringify(executionResult.rollbackPayload)
              : null,
            completedAt: now,
          },
        })

        await db.actionItem.update({
          where: { id: actionItem.id },
          data: {
            status: 'auto_executed',
            autoExecutedAt: now,
          },
        })
      } else {
        await db.autoExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            result: JSON.stringify(executionResult.responseData || {}),
            errorMessage: executionResult.error || 'Execution failed',
            completedAt: now,
          },
        })

        await db.actionItem.update({
          where: { id: actionItem.id },
          data: {
            status: 'auto_failed',
          },
        })
      }

      results.push({
        actionItemId: actionItem.id,
        success: executionResult.success,
        executionId: execution.id,
        actionType: executionActionType,
        error: executionResult.error,
      })

      // Brief pause between executions to avoid rate limiting (500ms)
      if (executableItems.indexOf(actionItem) < executableItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // ── Build summary ─────────────────────────────────────────────────────
    const totalExecuted = results.length
    const successCount = results.filter((r) => r.success).length
    const failedCount = results.filter((r) => !r.success).length
    const skippedCount = nonExecutableItems.length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: totalExecuted,
        succeeded: successCount,
        failed: failedCount,
        skipped: skippedCount,
      },
    })
  } catch (err) {
    console.error('[auto-execute/bulk] POST error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json(
      { error: 'An unexpected error occurred during bulk execution' },
      { status: 500 }
    )
  }
}
