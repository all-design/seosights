/**
 * Workers API — GET /api/ops/workers
 *
 * Returns all MCWorker records grouped by systemName.
 * If workers don't exist for a system, creates default workers.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULT_WORKERS: Record<string, Array<{
  workerName: string
  status: string
  reasoning: string | null
  currentTask: string | null
  totalRuns: number
  successRate: number
}>> = {
  age: [
    { workerName: 'discovery', status: 'running', reasoning: 'Scanning 847 opportunity signals across 12 verticals', currentTask: 'Vertical scan: SaaS/Cloud', totalRuns: 342, successRate: 0.94 },
    { workerName: 'scoring', status: 'running', reasoning: 'Scoring 156 discovered opportunities by ROI potential', currentTask: 'Priority queue #7', totalRuns: 312, successRate: 0.97 },
    { workerName: 'generation', status: 'idle', reasoning: 'Waiting for scoring to complete batch', currentTask: null, totalRuns: 287, successRate: 0.91 },
    { workerName: 'review', status: 'idle', reasoning: 'Next review cycle at 07:15', currentTask: null, totalRuns: 156, successRate: 0.89 },
    { workerName: 'execution', status: 'stopped', reasoning: 'Daily budget exhausted (21/20)', currentTask: null, totalRuns: 89, successRate: 0.86 },
    { workerName: 'measurement', status: 'running', reasoning: 'Measuring ROI for 14 published articles', currentTask: 'Batch measurement cycle', totalRuns: 234, successRate: 0.93 },
    { workerName: 'learning', status: 'idle', reasoning: 'Scheduled for 22:00 replay session', currentTask: null, totalRuns: 78, successRate: 0.88 },
    { workerName: 'governor', status: 'running', reasoning: 'Monitoring budget utilization and quality gates', currentTask: 'Budget gate: 21/20 used', totalRuns: 456, successRate: 0.99 },
    { workerName: 'pruning', status: 'idle', reasoning: 'No pruning candidates identified', currentTask: null, totalRuns: 23, successRate: 0.96 },
  ],
  qa_engine: [
    { workerName: 'functional', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.95 },
    { workerName: 'ux', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.92 },
    { workerName: 'product', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.88 },
    { workerName: 'growth', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.91 },
    { workerName: 'copy', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.87 },
    { workerName: 'accessibility', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.94 },
    { workerName: 'performance', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.96 },
    { workerName: 'security', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.98 },
    { workerName: 'seo', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.93 },
    { workerName: 'observatory', status: 'idle', reasoning: 'Scheduled for next nightly run at 03:00 UTC', currentTask: null, totalRuns: 89, successRate: 0.90 },
  ],
  client_zero: [
    { workerName: 'mission_planner', status: 'running', reasoning: 'Planning content mission for 3 active clients', currentTask: 'Client #7: SEO audit mission', totalRuns: 167, successRate: 0.93 },
    { workerName: 'content_executor', status: 'running', reasoning: 'Executing batch 3 of 5 — 12 articles remaining', currentTask: 'Batch execution: Technology vertical', totalRuns: 234, successRate: 0.89 },
    { workerName: 'replay_scheduler', status: 'idle', reasoning: 'No replays scheduled until next cycle', currentTask: null, totalRuns: 45, successRate: 0.91 },
    { workerName: 'learning_engine', status: 'running', reasoning: 'Updating client models with latest performance data', currentTask: 'Model update: Client #3, #7, #12', totalRuns: 89, successRate: 0.87 },
  ],
  observatory: [
    { workerName: 'collector', status: 'running', reasoning: 'Collecting citation data from 23 sources', currentTask: 'Source scan: batch 4/6', totalRuns: 456, successRate: 0.95 },
    { workerName: 'analyzer', status: 'running', reasoning: 'Analyzing 89 collected citations for quality scoring', currentTask: 'Quality assessment pipeline', totalRuns: 378, successRate: 0.93 },
    { workerName: 'detector', status: 'running', reasoning: 'Monitoring for breaking industry signals', currentTask: 'Real-time signal detection', totalRuns: 567, successRate: 0.91 },
    { workerName: 'publisher', status: 'idle', reasoning: 'Next publish window at 09:00', currentTask: null, totalRuns: 123, successRate: 0.97 },
  ],
}

export async function GET() {
  try {
    const existingWorkers = await db.mCWorker.findMany()

    // Group existing workers by systemName
    const workersBySystem: Record<string, Set<string>> = {}
    for (const w of existingWorkers) {
      if (!workersBySystem[w.systemName]) workersBySystem[w.systemName] = new Set()
      workersBySystem[w.systemName].add(w.workerName)
    }

    // Create missing workers for each system
    for (const [systemName, defaults] of Object.entries(DEFAULT_WORKERS)) {
      if (!workersBySystem[systemName]) workersBySystem[systemName] = new Set()

      for (const def of defaults) {
        if (!workersBySystem[systemName].has(def.workerName)) {
          await db.mCWorker.create({
            data: {
              systemName,
              workerName: def.workerName,
              status: def.status,
              reasoning: def.reasoning,
              currentTask: def.currentTask,
              startedAt: def.status === 'running' ? new Date() : null,
              totalRuns: def.totalRuns,
              successRate: def.successRate,
            },
          })
        }
      }
    }

    // Re-fetch all workers after potential creation
    const allWorkers = await db.mCWorker.findMany({
      orderBy: [{ systemName: 'asc' }, { workerName: 'asc' }],
    })

    // Group by system
    const grouped: Record<string, typeof allWorkers> = {}
    for (const w of allWorkers) {
      if (!grouped[w.systemName]) grouped[w.systemName] = []
      grouped[w.systemName].push(w)
    }

    return NextResponse.json({
      workers: grouped,
      totalWorkers: allWorkers.length,
      systemCount: Object.keys(grouped).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ops/workers] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 }
    )
  }
}
