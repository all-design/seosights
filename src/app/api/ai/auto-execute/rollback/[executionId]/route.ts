import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rollbackWordPress, type WordPressCredentials } from '@/lib/cms-integrations/wordpress'
import { rollbackWebflow, type WebflowCredentials } from '@/lib/cms-integrations/webflow'

export const dynamic = 'force-dynamic'

// ── POST /api/ai/auto-execute/rollback/[executionId] ──────────────────────────
// Rolls back a previously executed action

interface RollbackRequestBody {
  userId: string
  credentials: WordPressCredentials | WebflowCredentials
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { executionId } = await params
    const body: RollbackRequestBody = await req.json()
    const { userId, credentials } = body

    // ── Validate required fields ──────────────────────────────────────────
    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      )
    }

    if (!userId || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, credentials' },
        { status: 400 }
      )
    }

    // ── Fetch the execution record ────────────────────────────────────────
    const execution = await db.autoExecution.findUnique({
      where: { id: executionId },
      include: {
        actionItem: {
          select: {
            id: true,
            userId: true,
            actionType: true,
            title: true,
            status: true,
          },
        },
      },
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution record not found' },
        { status: 404 }
      )
    }

    // ── Verify ownership ──────────────────────────────────────────────────
    if (execution.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to rollback this execution' },
        { status: 403 }
      )
    }

    // ── Verify the execution can be rolled back ──────────────────────────
    if (execution.status !== 'success') {
      return NextResponse.json(
        { error: `Only successful executions can be rolled back. Current status: ${execution.status}` },
        { status: 400 }
      )
    }

    if (!execution.rollbackPayload) {
      return NextResponse.json(
        { error: 'No rollback payload available for this execution. The change cannot be automatically reversed.' },
        { status: 400 }
      )
    }

    // ── Parse rollback payload ────────────────────────────────────────────
    let rollbackPayload: Record<string, unknown>
    try {
      rollbackPayload = JSON.parse(execution.rollbackPayload) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: 'Invalid rollback payload stored for this execution' },
        { status: 500 }
      )
    }

    // ── Update execution status to indicate rollback in progress ──────────
    await db.autoExecution.update({
      where: { id: executionId },
      data: {
        status: 'executing',
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
      },
    })

    // ── Execute rollback on the CMS ───────────────────────────────────────
    let rollbackResult: {
      success: boolean
      platform: string
      actionType: string
      responseData?: Record<string, unknown>
      error?: string
    }

    try {
      if (execution.platform === 'wordpress') {
        const wpCreds = credentials as WordPressCredentials
        if (!wpCreds.siteUrl || !wpCreds.username || !wpCreds.applicationPassword) {
          return NextResponse.json(
            { error: 'WordPress credentials require siteUrl, username, and applicationPassword' },
            { status: 400 }
          )
        }
        rollbackResult = await rollbackWordPress(wpCreds, execution.actionType, rollbackPayload)
      } else if (execution.platform === 'webflow') {
        const wfCreds = credentials as WebflowCredentials
        if (!wfCreds.siteId || !wfCreds.apiToken) {
          return NextResponse.json(
            { error: 'Webflow credentials require siteId and apiToken' },
            { status: 400 }
          )
        }
        rollbackResult = await rollbackWebflow(wfCreds, execution.actionType, rollbackPayload)
      } else {
        return NextResponse.json(
          { error: `Unsupported platform for rollback: ${execution.platform}` },
          { status: 400 }
        )
      }
    } catch (err) {
      rollbackResult = {
        success: false,
        platform: execution.platform,
        actionType: execution.actionType,
        error: err instanceof Error ? err.message : 'Unknown rollback error',
      }
    }

    // ── Update execution record with rollback result ──────────────────────
    const now = new Date()
    if (rollbackResult.success) {
      await db.autoExecution.update({
        where: { id: executionId },
        data: {
          status: 'rolled_back',
          result: JSON.stringify({
            ...(execution.result ? (JSON.parse(execution.result) as Record<string, unknown>) : {}),
            rollbackResult: rollbackResult.responseData,
          }),
          completedAt: now,
        },
      })

      // Update ActionItem status back to its pre-execution state
      await db.actionItem.update({
        where: { id: execution.actionItemId },
        data: {
          status: 'pending',
          autoExecutedAt: null,
        },
      })
    } else {
      // Rollback failed — revert status back to 'success' since the original change is still in place
      await db.autoExecution.update({
        where: { id: executionId },
        data: {
          status: 'success',
          errorMessage: `Rollback failed: ${rollbackResult.error || 'Unknown error'}`,
          lastAttemptAt: now,
        },
      })
    }

    return NextResponse.json({
      success: rollbackResult.success,
      execution: {
        id: executionId,
        actionItemId: execution.actionItemId,
        platform: execution.platform,
        actionType: execution.actionType,
        status: rollbackResult.success ? 'rolled_back' : 'success',
        rollbackResult: rollbackResult.responseData,
        error: rollbackResult.error,
      },
    })
  } catch (err) {
    console.error('[auto-execute/rollback] POST error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json(
      { error: 'An unexpected error occurred during rollback' },
      { status: 500 }
    )
  }
}
