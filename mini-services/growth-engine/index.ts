// ─── Autonomous Growth Engine™ (AGE) — Background Service ──────────
// The operating system that increases platform value every day.
// Port: 3005

import { runDiscoveryEngine } from './engines/discovery'
import { runScoringEngine } from './engines/scoring'
import { runQueueEngine } from './engines/queue'
import { runGenerationEngine } from './engines/generation'
import { runReviewEngine } from './engines/review'
import { runExecutionEngine } from './engines/execution'
import { runMeasurementEngine } from './engines/measurement'
import { runLearningEngine } from './engines/learning'
import { runGovernorEngine } from './engines/governor'
import { runPruningEngine } from './engines/pruning'

// ── Engine Registry ────────────────────────────────────────────────

const engines: Record<string, () => Promise<{ [key: string]: number }>> = {
  discovery: runDiscoveryEngine,
  scoring: runScoringEngine,
  queue: runQueueEngine,
  generation: runGenerationEngine,
  review: runReviewEngine,
  execution: runExecutionEngine,
  measurement: runMeasurementEngine,
  learning: runLearningEngine,
  governor: runGovernorEngine,
  pruning: runPruningEngine,
}

// ── Schedule Config ────────────────────────────────────────────────

const defaultSchedule: Record<string, number> = {
  discovery: 120,     // every 2h
  scoring: 240,       // every 4h
  queue: 120,         // every 2h
  generation: 60,     // every 1h
  review: 30,         // every 30 min
  execution: 30,      // every 30 min
  measurement: 240,   // every 4h
  learning: 1440,     // daily
  governor: 30,       // every 30 min
  pruning: 10080,     // weekly
}

// ── State ──────────────────────────────────────────────────────────

const engineStatus: Record<string, { lastRun: Date | null; lastResult: Record<string, number> | null; running: boolean }> = {}

for (const name of Object.keys(engines)) {
  engineStatus[name] = { lastRun: null, lastResult: null, running: false }
}

const timers: Record<string, Timer> = {}

// ── Engine Runner ──────────────────────────────────────────────────

async function runEngine(name: string): Promise<void> {
  const engine = engines[name]
  if (!engine) {
    console.log(`[AGE] Unknown engine: ${name}`)
    return
  }

  if (engineStatus[name].running) {
    console.log(`[AGE] Engine "${name}" already running, skipping`)
    return
  }

  engineStatus[name].running = true
  const start = Date.now()

  try {
    console.log(`[AGE] Running engine: ${name}`)
    const result = await engine()
    const duration = Date.now() - start

    engineStatus[name].lastRun = new Date()
    engineStatus[name].lastResult = result

    console.log(`[AGE] Engine "${name}" completed in ${duration}ms:`, result)
  } catch (error) {
    console.error(`[AGE] Engine "${name}" failed:`, error)
    engineStatus[name].lastResult = { error: 1 }
  } finally {
    engineStatus[name].running = false
  }
}

// ── Scheduler ──────────────────────────────────────────────────────

function startScheduler(): void {
  console.log('[AGE] Starting scheduler...')

  for (const [name, intervalMin] of Object.entries(defaultSchedule)) {
    const intervalMs = intervalMin * 60 * 1000

    // Run immediately on start (staggered)
    const initialDelay = Math.random() * 10000
    setTimeout(() => {
      runEngine(name)
    }, initialDelay)

    // Set interval
    timers[name] = setInterval(() => {
      runEngine(name)
    }, intervalMs)

    console.log(`[AGE] Scheduled "${name}" every ${intervalMin}min`)
  }
}

// ── HTTP Server ────────────────────────────────────────────────────

const PORT = 3005

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'Autonomous Growth Engine™',
        uptime: process.uptime(),
        engines: Object.keys(engines).length,
        timestamp: new Date().toISOString(),
      })
    }

    // Status
    if (url.pathname === '/status') {
      return Response.json({
        engines: engineStatus,
        schedule: defaultSchedule,
        timestamp: new Date().toISOString(),
      })
    }

    // Manual trigger
    if (url.pathname.startsWith('/trigger/') && req.method === 'POST') {
      const engineName = url.pathname.split('/trigger/')[1]
      if (!engines[engineName]) {
        return Response.json({ error: `Unknown engine: ${engineName}` }, { status: 404 })
      }

      // Run asynchronously
      runEngine(engineName)
      return Response.json({ triggered: engineName, timestamp: new Date().toISOString() })
    }

    // Seed (calls main app API)
    if (url.pathname === '/seed' && req.method === 'POST') {
      try {
        const response = await fetch('http://localhost:3000/api/growth/seed', { method: 'POST' })
        const data = await response.json()
        return Response.json({ seeded: true, data })
      } catch (error) {
        return Response.json({ error: 'Failed to seed data' }, { status: 500 })
      }
    }

    // Run all engines
    if (url.pathname === '/run-all' && req.method === 'POST') {
      for (const name of Object.keys(engines)) {
        await runEngine(name)
      }
      return Response.json({ completed: true, engines: engineStatus })
    }

    return Response.json({ error: 'Not found' }, { status: 404 })
  },
})

console.log(`\n🧠 Autonomous Growth Engine™ running on port ${PORT}`)
console.log(`   Health: http://localhost:${PORT}/health`)
console.log(`   Status: http://localhost:${PORT}/status`)
console.log(`   Trigger: POST http://localhost:${PORT}/trigger/:engine`)
console.log(`   Seed: POST http://localhost:${PORT}/seed`)
console.log(`   Run All: POST http://localhost:${PORT}/run-all\n`)

// Start the scheduler
startScheduler()
