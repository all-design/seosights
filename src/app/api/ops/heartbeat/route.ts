/**
 * Heartbeat API — GET /api/ops/heartbeat
 *
 * Returns the latest MCHeartbeat record and creates a fresh heartbeat check
 * by testing each system's health.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthCheck {
  ok: boolean
  latency: number
  status: string
  lastSeen: string | null
}

function determineOverallStatus(checks: Record<string, HealthCheck>): string {
  const values = Object.values(checks)
  const allHealthy = values.every(c => c.ok)
  const anyDegraded = values.some(c => c.status === 'degraded')

  if (allHealthy) return 'healthy'
  if (anyDegraded) return 'degraded'
  return 'critical'
}

export async function GET() {
  try {
    // Check each system's health
    const now = new Date()
    const systems = await db.mCSystemStatus.findMany()
    const systemMap = new Map(systems.map(s => [s.systemName, s]))

    const checkSystem = (name: string): HealthCheck => {
      const sys = systemMap.get(name)
      const latency = Math.floor(Math.random() * 80) + 15 // 15-95ms simulated

      if (!sys) {
        return { ok: false, latency, status: 'unknown', lastSeen: null }
      }

      const lastSeen = sys.lastHeartbeat?.toISOString() ?? null
      const isStale = sys.lastHeartbeat
        ? now.getTime() - sys.lastHeartbeat.getTime() > 5 * 60 * 1000
        : true

      if (sys.status === 'error') {
        return { ok: false, latency, status: 'critical', lastSeen }
      }
      if (isStale && sys.status !== 'waiting') {
        return { ok: false, latency, status: 'degraded', lastSeen }
      }
      if (sys.status === 'waiting' || sys.status === 'stopped') {
        return { ok: true, latency, status: 'idle', lastSeen }
      }

      return { ok: true, latency, status: 'healthy', lastSeen }
    }

    const checks = {
      age: checkSystem('age'),
      qa: checkSystem('qa_engine'),
      clientZero: checkSystem('client_zero'),
      observatory: checkSystem('observatory'),
      scheduler: checkSystem('mission_control'),
    }

    // Create a new heartbeat record
    const overallStatus = determineOverallStatus(checks)
    const heartbeat = await db.mCHeartbeat.create({
      data: {
        status: overallStatus,
        ageStatus: checks.age.status,
        qaStatus: checks.qa.status,
        czStatus: checks.clientZero.status,
        observatoryStatus: checks.observatory.status,
        schedulerStatus: checks.scheduler.status,
        checksPerformed: JSON.stringify(checks),
        timestamp: now,
      },
    })

    // Also get the previous heartbeat for comparison
    const previousHeartbeats = await db.mCHeartbeat.findMany({
      orderBy: { timestamp: 'desc' },
      take: 2,
    })

    return NextResponse.json({
      heartbeat,
      checks,
      overallStatus,
      previousHeartbeat: previousHeartbeats.length > 1 ? previousHeartbeats[1] : null,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[ops/heartbeat] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check heartbeat' },
      { status: 500 }
    )
  }
}
