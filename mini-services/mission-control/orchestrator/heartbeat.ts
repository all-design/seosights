// ─── Heartbeat — 5-second platform health pulse ───────────────────

import { db } from '../../../src/lib/db'
import { createEvent } from './timeline'

interface MCState {
  heartbeatStatus: string
  [key: string]: any
}

async function checkService(name: string, url: string, timeout = 5000): Promise<{ ok: boolean; latency: number; status?: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return { ok: res.ok, latency: Date.now() - start, status: res.status }
  } catch {
    return { ok: false, latency: Date.now() - start }
  }
}

export async function runHeartbeatCheck(state: MCState) {
  console.log('[Heartbeat] Running health check...')

  // Check each system
  const ageCheck = await checkService('AGE', 'http://localhost:3005/health')
  const qaCheck = await checkService('QA Engine', 'http://localhost:3006/health')
  const appCheck = await checkService('Main App', 'http://localhost:3000/')

  // Client Zero & Observatory are part of the main app
  const czCheck = appCheck.ok ? { ok: true, latency: appCheck.latency } : { ok: false, latency: appCheck.latency }
  const obsCheck = appCheck.ok ? { ok: true, latency: appCheck.latency } : { ok: false, latency: appCheck.latency }

  // Determine per-system status
  const getStatus = (check: { ok: boolean; latency: number }) => {
    if (!check.ok) return 'critical'
    if (check.latency > 3000) return 'degraded'
    return 'healthy'
  }

  const ageStatus = getStatus(ageCheck)
  const qaStatus = getStatus(qaCheck)
  const czStatus = getStatus(czCheck)
  const obsStatus = getStatus(obsCheck)
  const schedulerStatus = 'healthy' // We're running, so we're healthy

  // Overall status
  const statuses = [ageStatus, qaStatus, czStatus, obsStatus, schedulerStatus]
  const overallStatus = statuses.includes('critical') ? 'critical'
    : statuses.includes('degraded') ? 'degraded'
    : 'healthy'

  // Create heartbeat record
  try {
    await db.mCHeartbeat.create({
      data: {
        status: overallStatus,
        ageStatus,
        qaStatus,
        czStatus,
        observatoryStatus: obsStatus,
        schedulerStatus,
        checksPerformed: JSON.stringify({
          age: ageCheck,
          qa: qaCheck,
          clientZero: czCheck,
          observatory: obsCheck,
          mainApp: appCheck,
        }),
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error('[Heartbeat] Failed to save:', error)
  }

  // Update system status records
  const systems = [
    { name: 'age', status: ageStatus, check: ageCheck },
    { name: 'qa_engine', status: qaStatus, check: qaCheck },
    { name: 'client_zero', status: czStatus, check: czCheck },
    { name: 'observatory', status: obsStatus, check: obsCheck },
  ]

  for (const sys of systems) {
    try {
      await db.mCSystemStatus.upsert({
        where: { systemName: sys.name },
        update: {
          lastHeartbeat: new Date(),
          status: sys.status === 'critical' ? 'error' : sys.status === 'degraded' ? 'waiting' : 'running',
        },
        create: {
          systemName: sys.name,
          displayName: sys.name === 'age' ? 'Autonomous Growth Engine' : sys.name === 'qa_engine' ? 'QA Engine' : sys.name === 'client_zero' ? 'Client Zero' : 'Observatory',
          status: sys.status === 'critical' ? 'error' : sys.status === 'degraded' ? 'waiting' : 'running',
          lastHeartbeat: new Date(),
        },
      })
    } catch (e) {
      console.error(`[Heartbeat] Failed to update ${sys.name}:`, e)
    }
  }

  // Also update Mission Control status
  try {
    await db.mCSystemStatus.upsert({
      where: { systemName: 'mission_control' },
      update: { lastHeartbeat: new Date(), status: 'running' },
      create: {
        systemName: 'mission_control',
        displayName: 'Mission Control',
        status: 'running',
        lastHeartbeat: new Date(),
      },
    })
  } catch (e) {
    console.error('[Heartbeat] Failed to update mission_control:', e)
  }

  // Create alert events on status changes
  if (overallStatus !== state.heartbeatStatus && state.heartbeatStatus !== 'unknown') {
    if (overallStatus === 'critical') {
      await createEvent('mission_control', 'alert', 'Platform Health: CRITICAL', 'One or more systems are down.', 'alert-triangle', 'red')
    } else if (overallStatus === 'degraded') {
      await createEvent('mission_control', 'alert', 'Platform Health: Degraded', 'Some systems are slow or partially available.', 'alert-triangle', 'yellow')
    } else if (overallStatus === 'healthy') {
      await createEvent('mission_control', 'heartbeat', 'Platform Health: Restored', 'All systems operational.', 'check-circle', 'green')
    }
  }

  state.heartbeatStatus = overallStatus
  console.log(`[Heartbeat] Status: ${overallStatus} (AGE:${ageStatus} QA:${qaStatus} CZ:${czStatus} OBS:${obsStatus})`)
}
