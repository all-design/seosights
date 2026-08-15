// ─── Autonomy — Platform Autonomy™ KPI calculation ────────────────

import { db } from '../../../src/lib/db'

interface MCState {
  scheduleJobsToday: number
  jobsCompletedToday: number
  jobsFailedToday: number
  [key: string]: any
}

export async function calculateAutonomy(state: MCState) {
  console.log('[Autonomy] Calculating Platform Autonomy™ metrics...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get today's schedule jobs
  const todayJobs = await db.mCScheduleJob.findMany({
    where: { scheduledDate: { gte: today } },
  })

  // Per-system counts
  const systems = ['client_zero', 'age', 'qa_engine', 'observatory', 'ai_router'] as const
  let totalPlanned = 0
  let totalCompleted = 0
  let totalFailed = 0

  for (const sys of systems) {
    let planned = 0
    let completed = 0
    let failed = 0

    if (sys === 'ai_router') {
      // AI Router — use real TokenUsageLog data for today
      // Each logged entry represents a completed LLM API call.
      // TokenUsageLog only records successful calls (token counts exist),
      // so failed = 0 and planned = completed.
      try {
        completed = await db.tokenUsageLog.count({
          where: { createdAt: { gte: today } },
        })
      } catch (e) {
        console.error('[Autonomy] Failed to query TokenUsageLog for ai_router:', e)
        completed = 0
      }
      failed = 0 // No failure tracking in TokenUsageLog schema
      planned = completed + failed
    } else {
      // Other systems — use real schedule job data only, no fake fallbacks
      const sysJobs = todayJobs.filter(j => j.systemName === sys)
      planned = sysJobs.length
      completed = sysJobs.filter(j => j.status === 'completed').length
      failed = sysJobs.filter(j => j.status === 'failed').length
    }

    const rate = planned > 0 ? completed / planned : 0

    totalPlanned += planned
    totalCompleted += completed
    totalFailed += failed

    // Log per-system metrics (MCAutonomyMetric model does not exist in schema,
    // so we update MCSystemStatus for each system and log to console)
    console.log(
      `[Autonomy] ${sys}: planned=${planned}, completed=${completed}, failed=${failed}, rate=${(rate * 100).toFixed(1)}%`
    )

    try {
      await db.mCSystemStatus.upsert({
        where: { systemName: sys },
        update: {
          todayTotal: planned,
          todayCompleted: completed,
          todayFailed: failed,
        },
        create: {
          systemName: sys,
          displayName: sys.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          status: planned > 0 ? 'running' : 'idle',
          todayTotal: planned,
          todayCompleted: completed,
          todayFailed: failed,
        },
      })
    } catch (e) {
      console.error(`[Autonomy] Failed to update MCSystemStatus for ${sys}:`, e)
    }
  }

  const overallRate = totalPlanned > 0 ? totalCompleted / totalPlanned : 0
  console.log(`[Autonomy] Platform Autonomy™: ${(overallRate * 100).toFixed(1)}% (${totalCompleted}/${totalPlanned})`)

  // Also update Mission Control system status with today's totals
  try {
    await db.mCSystemStatus.upsert({
      where: { systemName: 'mission_control' },
      update: {
        todayTotal: totalPlanned,
        todayCompleted: totalCompleted,
        todayFailed: totalFailed,
      },
      create: {
        systemName: 'mission_control',
        displayName: 'Mission Control',
        status: 'running',
        todayTotal: totalPlanned,
        todayCompleted: totalCompleted,
        todayFailed: totalFailed,
      },
    })
  } catch (e) {
    console.error('[Autonomy] Failed to update MC system status:', e)
  }
}
