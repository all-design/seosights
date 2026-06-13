import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enqueueAuditJob, type AuditJobData } from '@/lib/audit-queue'
import { checkAllLimits, getPlanLimits } from '@/lib/plan-limits'
import { ensureProcessorRegistered } from '@/lib/audit-worker-init'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 180 // Keep function alive for up to 3 minutes (Pro/Enterprise)

/**
 * POST /api/audit/run
 * 
 * Producer endpoint: Validates limits, creates Analysis record, enqueues job.
 * Returns immediately with jobId (HTTP 202 Accepted).
 * The Worker processes the job in the background.
 * 
 * Request body:
 * {
 *   url: string,           // Target URL to analyze
 *   market?: string,       // Target market (default: 'Global')
 *   execution_mode?: string, // 'auto-pilot' | 'co-pilot' (default: 'auto-pilot')
 *   userId?: string,       // User ID for rate limiting
 *   projectId?: string,    // Existing project ID
 * }
 * 
 * Response (202):
 * {
 *   success: true,
 *   message: 'Audit queued. 8 AI agents will analyze in the background.',
 *   jobId: string,
 *   analysisId: string,
 *   status: 'queued',
 *   estimatedTime: '1-3 minutes'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, market, execution_mode, userId, projectId } = body

    // ── Step 1: Validate input ──────────────────────────────────────
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const targetMarket = market || 'Global'
    const executionMode = (execution_mode === 'co-pilot' ? 'co-pilot' : 'auto-pilot') as 'auto-pilot' | 'co-pilot'
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')

    // ── Step 2: Rate Limiting ───────────────────────────────────────
    let tier = 'free_trial'
    
    if (userId) {
      const limitCheck = await checkAllLimits(userId)
      
      if (!limitCheck.allowed) {
        return NextResponse.json({
          error: limitCheck.reason,
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            auditLimit: {
              used: limitCheck.checks.auditLimit.currentUsage,
              limit: limitCheck.checks.auditLimit.limit,
            },
            costCap: {
              used: limitCheck.checks.costCap.currentMonthlySpend,
              cap: limitCheck.checks.costCap.monthlyCap,
              percentUsed: Math.round(limitCheck.checks.costCap.usagePercent),
            },
            tier: limitCheck.checks.costCap.tier,
          },
        }, { status: 403 })
      }

      tier = limitCheck.checks.costCap.tier
    }

    // ── Step 3: Create Analysis record ──────────────────────────────
    const analysisSessionId = randomUUID()
    let analysisId = analysisSessionId

    try {
      const analysisRecord = await db.analysis.create({
        data: {
          url,
          domain,
          market: targetMarket,
          status: 'queued',
          mode: executionMode,
          ...(userId ? { userId } : {}),
          ...(projectId ? { projectId } : {}),
        }
      })
      analysisId = analysisRecord.id
    } catch (dbError) {
      console.error('[audit/run] Failed to create Analysis record:', dbError instanceof Error ? dbError.message : 'Unknown')
    }

    // ── Step 4: Enqueue job ─────────────────────────────────────────
    const jobData: AuditJobData = {
      projectId,
      userId,
      targetUrl: url,
      targetMarket,
      executionMode,
      tier,
      sessionId: analysisSessionId,
      analysisId,
    }

    const job = await enqueueAuditJob(jobData)

    console.log(`[audit/run] Job ${job.jobId} queued for ${url} (tier: ${tier}, analysis: ${analysisId})`)

    // ── Step 4b: Ensure the in-process worker is registered ──────────
    // In sandbox/dev mode (no Redis), the in-memory queue runs in the
    // same process. We register the processor lazily on first use.
    // In production with Redis, BullMQ handles cross-process communication
    // and the worker runs as a separate mini-service on port 3004.
    try {
      await ensureProcessorRegistered()
    } catch (registerErr) {
      console.warn('[audit/run] Failed to register in-process processor:', registerErr instanceof Error ? registerErr.message : 'Unknown')
      // Also try the external worker as fallback
      try {
        const workerUrl = process.env.AUDIT_WORKER_URL || 'http://localhost:3004'
        fetch(`${workerUrl}/process-job`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData),
        }).catch(() => { /* non-blocking */ })
      } catch { /* non-blocking */ }
    }

    // ── Step 5: Return immediately with jobId ───────────────────────
    return NextResponse.json({
      success: true,
      message: 'Audit queued. 8 AI agents will analyze in the background.',
      jobId: job.jobId,
      analysisId,
      sessionId: analysisSessionId,
      status: 'queued',
      estimatedTime: '1-3 minutes',
    }, { status: 202 })

  } catch (error) {
    console.error('[audit/run] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({
      error: 'Failed to queue audit',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
