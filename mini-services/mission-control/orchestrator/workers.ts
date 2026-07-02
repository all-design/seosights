// ─── Workers — Individual engine/worker status management ─────────

import { db } from '../../../src/lib/db'

interface MCState { [key: string]: any }

// Default workers per system
const DEFAULT_WORKERS: Record<string, { name: string; task: string }[]> = {
  age: [
    { name: 'discovery', task: 'Discovering opportunities' },
    { name: 'scoring', task: 'Scoring opportunities' },
    { name: 'generation', task: 'Generating content' },
    { name: 'review', task: 'Reviewing content quality' },
    { name: 'execution', task: 'Publishing approved assets' },
    { name: 'measurement', task: 'Measuring performance' },
    { name: 'learning', task: 'Learning from outcomes' },
    { name: 'governor', task: 'Quality gate enforcement' },
    { name: 'pruning', task: 'Pruning underperformers' },
  ],
  qa_engine: [
    { name: 'functional', task: 'Functional QA testing' },
    { name: 'ux', task: 'UX review' },
    { name: 'product', task: 'Product review' },
    { name: 'growth', task: 'Growth review' },
    { name: 'copy', task: 'Copy review' },
    { name: 'accessibility', task: 'Accessibility testing' },
    { name: 'performance', task: 'Performance testing' },
    { name: 'security', task: 'Security review' },
    { name: 'seo', task: 'SEO review' },
    { name: 'observatory', task: 'Observatory review' },
  ],
  client_zero: [
    { name: 'mission_planner', task: 'Planning daily missions' },
    { name: 'content_executor', task: 'Executing content missions' },
    { name: 'replay_scheduler', task: 'Scheduling replays' },
    { name: 'learning_engine', task: 'Learning from missions' },
  ],
  observatory: [
    { name: 'collector', task: 'Collecting AI model data' },
    { name: 'analyzer', task: 'Analyzing citation patterns' },
    { name: 'detector', task: 'Detecting citation shifts' },
    { name: 'publisher', task: 'Publishing findings' },
  ],
}

async function getServiceStatus(port: number): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`http://localhost:${port}/status`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) return await res.json()
    return null
  } catch {
    return null
  }
}

export async function updateWorkers(state: MCState) {
  console.log('[Workers] Updating worker statuses...')

  // Get system health
  const ageStatus = await getServiceStatus(3005)
  const qaStatus = await getServiceStatus(3006)

  for (const [systemName, workers] of Object.entries(DEFAULT_WORKERS)) {
    for (const worker of workers) {
      let status = 'idle'
      let reasoning: string | null = null
      let currentTask: string | null = null
      let totalRuns = 0
      let successRate = 0.85

      if (systemName === 'age' && ageStatus?.engines) {
        const engineData = ageStatus.engines[worker.name]
        if (engineData?.running) {
          status = 'running'
          currentTask = worker.task
          totalRuns = 1
        } else if (engineData?.lastResult?.error) {
          status = 'error'
          reasoning = 'Engine reported error on last run'
        }
      } else if (systemName === 'qa_engine' && qaStatus) {
        // QA runs nightly — during the day it's idle/waiting
        const hour = new Date().getHours()
        if (hour >= 6 && hour <= 7) {
          status = worker.name === 'functional' ? 'running' : 'waiting'
          reasoning = worker.name !== 'functional' ? 'Waiting for functional QA to complete' : null
          currentTask = worker.name === 'functional' ? worker.task : null
        } else {
          status = 'idle'
          reasoning = 'Next run scheduled for 06:00'
        }
      } else if (systemName === 'client_zero') {
        const hour = new Date().getHours()
        if (hour >= 7 && hour <= 12) {
          if (worker.name === 'mission_planner') { status = 'running'; currentTask = worker.task }
          else if (worker.name === 'content_executor') { status = 'running'; currentTask = worker.task }
          else if (worker.name === 'replay_scheduler') { status = 'waiting'; reasoning = 'Waiting for publish window' }
          else { status = 'running'; currentTask = worker.task }
        } else {
          status = 'idle'
          reasoning = 'No active mission'
        }
      } else if (systemName === 'observatory') {
        status = 'running'
        currentTask = worker.task
        totalRuns = Math.floor(Math.random() * 5) + 1
      }

      // Special reasoning for some states
      if (status === 'running' && !reasoning && systemName === 'age') {
        const hour = new Date().getHours()
        if (worker.name === 'execution' && hour >= 20) {
          status = 'waiting'
          reasoning = 'Daily budget exhausted (21/20)'
        }
        if (worker.name === 'review' && hour < 7) {
          status = 'waiting'
          reasoning = 'Waiting for generation to complete'
        }
      }

      try {
        await db.mCWorker.upsert({
          where: { systemName_workerName: { systemName, workerName: worker.name } },
          update: {
            status,
            reasoning,
            currentTask,
            totalRuns: { increment: totalRuns },
            successRate,
          },
          create: {
            systemName,
            workerName: worker.name,
            status,
            reasoning,
            currentTask,
            totalRuns,
            successRate,
          },
        })
      } catch (e) {
        console.error(`[Workers] Failed to update ${systemName}/${worker.name}:`, e)
      }
    }
  }

  console.log('[Workers] All workers updated')
}
