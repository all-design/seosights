// ─── Mission Control Scheduler™ — Background Service ───────────────
// The 4th autonomous system. Orchestrates all other engines.
// Port: 3007

import { runScheduleCheck } from './orchestrator/scheduler'
import { runHeartbeatCheck } from './orchestrator/heartbeat'
import { updateWorkers } from './orchestrator/workers'
import { calculateAutonomy } from './orchestrator/autonomy'
import { generateDailyReport } from './orchestrator/reporter'
import { createEvent } from './orchestrator/timeline'

// ── State ──────────────────────────────────────────────────────────

const state = {
  startedAt: new Date(),
  lastHeartbeat: null as Date | null,
  lastScheduleCheck: null as Date | null,
  lastWorkerUpdate: null as Date | null,
  lastAutonomyCalc: null as Date | null,
  heartbeatStatus: 'unknown' as string,
  scheduleJobsToday: 0,
  jobsCompletedToday: 0,
  jobsFailedToday: 0,
}

// ── Startup ────────────────────────────────────────────────────────

async function startup() {
  console.log('[MC] Mission Control Scheduler™ starting...')

  // Create startup event
  await createEvent('mission_control', 'started', 'Mission Control Started', 'Orchestrator service started successfully.', 'play', 'green')

  // Initial heartbeat
  await runHeartbeatCheck(state)
  state.lastHeartbeat = new Date()

  // Initial schedule check
  await runScheduleCheck(state)
  state.lastScheduleCheck = new Date()

  // Initial worker update
  await updateWorkers(state)
  state.lastWorkerUpdate = new Date()

  // Initial autonomy calculation
  await calculateAutonomy(state)
  state.lastAutonomyCalc = new Date()

  console.log('[MC] All initial checks completed')
}

// ── Scheduler Intervals ────────────────────────────────────────────

const intervals: Record<string, Timer> = {}

function startIntervals() {
  // Heartbeat every 30 seconds
  intervals.heartbeat = setInterval(async () => {
    try {
      await runHeartbeatCheck(state)
      state.lastHeartbeat = new Date()
    } catch (e) {
      console.error('[MC] Heartbeat check failed:', e)
    }
  }, 30_000)

  // Schedule check every 60 seconds
  intervals.schedule = setInterval(async () => {
    try {
      await runScheduleCheck(state)
      state.lastScheduleCheck = new Date()
    } catch (e) {
      console.error('[MC] Schedule check failed:', e)
    }
  }, 60_000)

  // Worker update every 60 seconds
  intervals.workers = setInterval(async () => {
    try {
      await updateWorkers(state)
      state.lastWorkerUpdate = new Date()
    } catch (e) {
      console.error('[MC] Worker update failed:', e)
    }
  }, 60_000)

  // Autonomy calculation every 5 minutes
  intervals.autonomy = setInterval(async () => {
    try {
      await calculateAutonomy(state)
      state.lastAutonomyCalc = new Date()
    } catch (e) {
      console.error('[MC] Autonomy calculation failed:', e)
    }
  }, 300_000)

  // Daily report at 23:00 (check every minute)
  intervals.reporter = setInterval(async () => {
    const now = new Date()
    if (now.getHours() === 23 && now.getMinutes() === 0) {
      try {
        await generateDailyReport(state)
        console.log('[MC] Daily report generated')
      } catch (e) {
        console.error('[MC] Daily report generation failed:', e)
      }
    }
  }, 60_000)

  console.log('[MC] All intervals started')
}

// ── HTTP Server ────────────────────────────────────────────────────

const PORT = 3007

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // Health
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'Mission Control Scheduler™',
        uptime: process.uptime(),
        state: {
          heartbeatStatus: state.heartbeatStatus,
          lastHeartbeat: state.lastHeartbeat,
          lastScheduleCheck: state.lastScheduleCheck,
          lastWorkerUpdate: state.lastWorkerUpdate,
          lastAutonomyCalc: state.lastAutonomyCalc,
          jobsToday: state.scheduleJobsToday,
          jobsCompleted: state.jobsCompletedToday,
          jobsFailed: state.jobsFailedToday,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Status
    if (url.pathname === '/status') {
      return Response.json({
        state,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    }

    // Force heartbeat
    if (url.pathname === '/heartbeat' && req.method === 'POST') {
      await runHeartbeatCheck(state)
      state.lastHeartbeat = new Date()
      return Response.json({ ok: true, status: state.heartbeatStatus })
    }

    // Force schedule run
    if (url.pathname === '/run-schedule' && req.method === 'POST') {
      await runScheduleCheck(state)
      state.lastScheduleCheck = new Date()
      return Response.json({ ok: true })
    }

    // Force autonomy calc
    if (url.pathname === '/calc-autonomy' && req.method === 'POST') {
      await calculateAutonomy(state)
      state.lastAutonomyCalc = new Date()
      return Response.json({ ok: true })
    }

    // Force worker update
    if (url.pathname === '/update-workers' && req.method === 'POST') {
      await updateWorkers(state)
      state.lastWorkerUpdate = new Date()
      return Response.json({ ok: true })
    }

    // Generate report
    if (url.pathname === '/generate-report' && req.method === 'POST') {
      await generateDailyReport(state)
      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Not found' }, { status: 404 })
  },
})

console.log(`\n🎮 Mission Control Scheduler™ running on port ${PORT}`)
console.log(`   Health:  GET http://localhost:${PORT}/health`)
console.log(`   Status:  GET http://localhost:${PORT}/status`)
console.log(`   Heartbeat: POST http://localhost:${PORT}/heartbeat`)
console.log(`   Schedule: POST http://localhost:${PORT}/run-schedule`)
console.log(`   Workers:  POST http://localhost:${PORT}/update-workers`)
console.log(`   Autonomy: POST http://localhost:${PORT}/calc-autonomy`)
console.log(`   Report:   POST http://localhost:${PORT}/generate-report\n`)

// Start everything
startup().then(() => startIntervals())
