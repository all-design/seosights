import { NextRequest, NextResponse } from 'next/server'
import { getAuditJobStatus } from '@/lib/audit-queue'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/audit/[jobId]
 * 
 * Returns the current status of an audit job.
 * Used by the frontend for polling when WebSocket is not available.
 * 
 * The status is derived from the shared database (Analysis record),
 * not the in-memory queue, since the worker runs in a separate process.
 * 
 * Response:
 * {
 *   jobId: string,
 *   status: 'queued' | 'running' | 'completed' | 'failed',
 *   progress: number,  // 0-100
 *   result?: { analysisId, overallScores, ... },  // When completed
 *   error?: string,     // When failed
 *   analysis?: {...},   // Full analysis data when completed (from DB)
 *   timestamps: { created, started?, finished? }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    // ── Step 1: Try in-memory queue first (same-process jobs) ────────
    const jobInfo = await getAuditJobStatus(jobId)

    if (jobInfo && jobInfo.status !== 'unknown') {
      // Found in the same-process queue — use its status
      let analysis = null
      if (jobInfo.status === 'completed' && jobInfo.data?.analysisId) {
        try {
          const analysisRecord = await db.analysis.findUnique({
            where: { id: jobInfo.data.analysisId },
          })
          if (analysisRecord?.result) {
            try {
              analysis = JSON.parse(analysisRecord.result)
            } catch {
              analysis = null
            }
          }
        } catch (dbError) {
          console.warn('[audit/status] Failed to fetch analysis from DB:', dbError instanceof Error ? dbError.message : 'Unknown')
        }
      }

      const response: Record<string, unknown> = {
        jobId: jobInfo.jobId,
        status: jobInfo.status === 'delayed' ? 'queued' : jobInfo.status,
        progress: jobInfo.progress,
        data: jobInfo.data,
        result: jobInfo.result,
        failedReason: jobInfo.failedReason,
        timestamps: {
          created: jobInfo.timestamp,
          started: jobInfo.processedOn,
          finished: jobInfo.finishedOn,
        },
      }

      if (analysis) {
        response.analysis = analysis
      }

      return NextResponse.json(response)
    }

    // ── Step 2: Not in queue — check database directly ───────────────
    // The worker updates the Analysis record in the shared SQLite DB.
    // This is the primary source of truth for cross-process status.
    
    // Try to find by analysisId if the jobId format contains it
    // Job IDs are "job-N" format, but we can also check if the 
    // frontend passes the analysisId as the jobId
    let analysisId: string | null = jobId

    // If jobId is in "job-N" format, we need to find the analysis
    // by looking at the most recent queued/running analyses
    const analysisRecord = await db.analysis.findFirst({
      where: {
        OR: [
          { id: jobId },
          { status: { in: ['queued', 'running', 'completed', 'failed'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!analysisRecord) {
      return NextResponse.json({
        jobId,
        status: 'unknown',
        message: 'Job not found. It may have been processed already.',
      }, { status: 404 })
    }

    analysisId = analysisRecord.id

    // Map DB status to queue status
    const statusMap: Record<string, string> = {
      'pending': 'queued',
      'queued': 'queued',
      'running': 'active',
      'completed': 'completed',
      'failed': 'failed',
    }

    const mappedStatus = statusMap[analysisRecord.status] || analysisRecord.status

    // Parse the result if completed
    let analysis = null
    let result = null
    if (analysisRecord.status === 'completed' && analysisRecord.result) {
      try {
        analysis = JSON.parse(analysisRecord.result)
        result = {
          analysisId: analysisRecord.id,
          status: 'completed',
          overallScores: analysis.overallScores || null,
          completedAt: analysisRecord.updatedAt.toISOString(),
        }
      } catch {
        analysis = null
      }
    }

    // Calculate progress based on status and agent logs
    let progress = 0
    if (analysisRecord.status === 'queued') progress = 5
    else if (analysisRecord.status === 'running') {
      // Check how many agent logs exist to estimate progress
      const agentLogCount = await db.agentLog.count({
        where: { analysisId: analysisRecord.id, status: 'completed' },
      })
      // 8 agents total + data gathering = ~9 steps
      // Allow progress to reach up to 98% (100% is reserved for 'completed' status)
      // Previously capped at 95% which caused the UI to appear stuck
      if (agentLogCount >= 8) {
        progress = 92  // All agents done, merging/finalizing
      } else {
        progress = Math.min(90, 35 + (agentLogCount * 7))
      }
      // If the analysis has been running for >60s, nudge progress higher
      const runningDuration = Date.now() - analysisRecord.createdAt.getTime()
      if (runningDuration > 90_000 && progress < 95) progress = 95
      if (runningDuration > 120_000) progress = 98
    }
    else if (analysisRecord.status === 'completed') progress = 100
    else if (analysisRecord.status === 'failed') progress = 0

    const response: Record<string, unknown> = {
      jobId,
      analysisId,
      status: mappedStatus,
      progress,
      data: {
        analysisId: analysisRecord.id,
        targetUrl: analysisRecord.url,
        targetMarket: analysisRecord.market,
        executionMode: analysisRecord.mode,
      },
      result,
      failedReason: analysisRecord.status === 'failed' ? 'Analysis failed. Please try again.' : undefined,
      timestamps: {
        created: analysisRecord.createdAt.getTime(),
        started: analysisRecord.createdAt.getTime(), // DB doesn't track start time separately
        finished: analysisRecord.status === 'completed' || analysisRecord.status === 'failed' 
          ? analysisRecord.updatedAt.getTime() 
          : undefined,
      },
    }

    if (analysis) {
      response.analysis = analysis
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[audit/status] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
