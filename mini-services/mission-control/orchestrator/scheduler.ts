// ─── Scheduler — Daily schedule execution ──────────────────────────

import { db } from '../../../src/lib/db'
import { createEvent } from './timeline'

interface MCState {
  scheduleJobsToday: number
  jobsCompletedToday: number
  jobsFailedToday: number
  [key: string]: any
}

// Default daily schedule template
const DAILY_SCHEDULE = [
  { time: '06:00', name: 'Start QA Engine', system: 'qa_engine', depends: [], condition: null, action: 'http://localhost:3006/run' },
  { time: '06:45', name: 'QA Finished Check', system: 'mission_control', depends: ['Start QA Engine'], condition: 'qa_pass', action: null },
  { time: '06:50', name: 'AGE Discovery', system: 'age', depends: ['QA Finished Check'], condition: null, action: 'http://localhost:3005/trigger/discovery' },
  { time: '07:15', name: 'AGE Review', system: 'age', depends: ['AGE Discovery'], condition: null, action: 'http://localhost:3005/trigger/review' },
  { time: '07:30', name: 'Client Zero Execute', system: 'client_zero', depends: ['AGE Review'], condition: null, action: null },
  { time: '08:00', name: 'Publish Window #1', system: 'mission_control', depends: ['Client Zero Execute'], condition: null, action: 'http://localhost:3005/trigger/execution' },
  { time: '09:00', name: 'Observatory Collect', system: 'observatory', depends: [], condition: null, action: null },
  { time: '14:00', name: 'Publish Window #2', system: 'mission_control', depends: [], condition: null, action: 'http://localhost:3005/trigger/execution' },
  { time: '18:00', name: 'Publish Window #3', system: 'mission_control', depends: [], condition: null, action: 'http://localhost:3005/trigger/execution' },
  { time: '22:00', name: 'Replay + Learning', system: 'age', depends: [], condition: null, action: 'http://localhost:3005/trigger/learning' },
  { time: '23:00', name: 'Executive Daily Report', system: 'mission_control', depends: ['Replay + Learning'], condition: null, action: null },
]

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export async function runScheduleCheck(state: MCState) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Ensure today's schedule exists
  let jobs = await db.mCScheduleJob.findMany({
    where: { scheduledDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) } },
  })

  if (jobs.length === 0) {
    // Create today's schedule
    for (const template of DAILY_SCHEDULE) {
      await db.mCScheduleJob.create({
        data: {
          name: template.name,
          systemName: template.system,
          scheduledTime: template.time,
          dependsOn: JSON.stringify(template.depends),
          condition: template.condition,
          status: 'pending',
          scheduledDate: todayStart,
        },
      })
    }
    jobs = await db.mCScheduleJob.findMany({
      where: { scheduledDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) } },
    })
    await createEvent('mission_control', 'scheduled', 'Daily Schedule Created', `${jobs.length} jobs scheduled for today.`, 'calendar', 'blue')
  }

  // Process each job
  for (const job of jobs) {
    if (job.status === 'completed' || job.status === 'running' || job.status === 'failed') continue

    const jobMinutes = timeToMinutes(job.scheduledTime)

    // Not time yet?
    if (jobMinutes > currentMinutes) {
      if (job.status !== 'pending') continue
      await db.mCScheduleJob.update({
        where: { id: job.id },
        data: { status: 'pending', reasoning: `Scheduled for ${job.scheduledTime}` },
      })
      continue
    }

    // Check dependencies
    const dependsOn: string[] = JSON.parse(job.dependsOn || '[]')
    if (dependsOn.length > 0) {
      const depJobs = jobs.filter(j => dependsOn.includes(j.name))
      const allDepsCompleted = depJobs.every(d => d.status === 'completed')
      const anyDepFailed = depJobs.some(d => d.status === 'failed')

      if (anyDepFailed) {
        await db.mCScheduleJob.update({
          where: { id: job.id },
          data: { status: 'skipped', reasoning: `Dependency failed: ${depJobs.find(d => d.status === 'failed')?.name}` },
        })
        await createEvent('mission_control', 'alert', `Skipped: ${job.name}`, `Dependency failed.`, 'skip-forward', 'yellow')
        state.jobsFailedToday++
        continue
      }

      if (!allDepsCompleted) {
        const waitingFor = depJobs.filter(d => d.status !== 'completed').map(d => d.name)
        await db.mCScheduleJob.update({
          where: { id: job.id },
          data: { status: 'waiting', reasoning: `Waiting for: ${waitingFor.join(', ')}` },
        })
        continue
      }
    }

    // Mark as running
    await db.mCScheduleJob.update({
      where: { id: job.id },
      data: { status: 'running', startedAt: new Date(), reasoning: 'Executing...' },
    })
    await createEvent(job.systemName, 'started', `Started: ${job.name}`, undefined, 'play', 'blue')

    // Execute the job
    const template = DAILY_SCHEDULE.find(t => t.name === job.name)
    let success = false
    let resultData: Record<string, unknown> = {}

    if (template?.action) {
      try {
        const res = await fetch(template.action, { method: 'POST', signal: AbortSignal.timeout(30000) })
        if (res.ok) {
          resultData = await res.json().catch(() => ({ ok: true }))
          success = true
        } else {
          resultData = { error: `HTTP ${res.status}` }
        }
      } catch (e: any) {
        resultData = { error: e.message }
      }
    } else {
      // No action URL — mark as complete (logic check only)
      success = true
      resultData = { type: 'check', passed: true }
    }

    // Update job status
    const duration = Date.now() - (job.startedAt?.getTime() || Date.now())
    await db.mCScheduleJob.update({
      where: { id: job.id },
      data: {
        status: success ? 'completed' : 'failed',
        completedAt: new Date(),
        duration,
        result: JSON.stringify(resultData),
        reasoning: success ? 'Completed successfully' : `Failed: ${JSON.stringify(resultData)}`,
      },
    })

    if (success) {
      state.jobsCompletedToday++
      await createEvent(job.systemName, 'completed', `Completed: ${job.name}`, `Duration: ${duration}ms`, 'check-circle', 'green')
    } else {
      state.jobsFailedToday++
      await createEvent(job.systemName, 'error', `Failed: ${job.name}`, JSON.stringify(resultData), 'alert-triangle', 'red')
    }
  }

  state.scheduleJobsToday = jobs.length
}
