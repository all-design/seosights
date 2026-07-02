/**
 * System Status API — GET /api/ops/status
 *
 * Returns all 5 system statuses. Creates missing ones on the fly with defaults.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SYSTEM_DEFAULTS = [
  {
    systemName: 'client_zero',
    displayName: 'Client Zero',
    status: 'running',
    phase: 'Execute',
    progress: 68,
    reasoning: 'Processing batch 3 of 5 — 12 articles remaining',
    todayTotal: 20,
    todayCompleted: 18,
    todayFailed: 1,
  },
  {
    systemName: 'age',
    displayName: 'Autonomous Growth Engine',
    status: 'running',
    phase: 'Discovery',
    progress: 82,
    reasoning: 'Discovery phase — scanning 847 opportunity signals',
    todayTotal: 34,
    todayCompleted: 30,
    todayFailed: 2,
  },
  {
    systemName: 'qa_engine',
    displayName: 'QA Engine',
    status: 'waiting',
    phase: 'Idle',
    progress: 0,
    reasoning: 'Scheduled for next nightly run at 03:00 UTC',
    todayTotal: 0,
    todayCompleted: 0,
    todayFailed: 0,
  },
  {
    systemName: 'observatory',
    displayName: 'Observatory',
    status: 'running',
    phase: 'Collecting',
    progress: 55,
    reasoning: 'Collecting citation data from 23 sources',
    todayTotal: 156,
    todayCompleted: 89,
    todayFailed: 3,
  },
  {
    systemName: 'mission_control',
    displayName: 'Mission Control',
    status: 'running',
    phase: 'Orchestrating',
    progress: 91,
    reasoning: 'All systems operational — monitoring 4 active pipelines',
    todayTotal: 13,
    todayCompleted: 11,
    todayFailed: 0,
  },
]

export async function GET() {
  try {
    const existingStatuses = await db.mCSystemStatus.findMany()
    const existingMap = new Map(existingStatuses.map(s => [s.systemName, s]))

    // Ensure all 5 systems exist
    for (const def of SYSTEM_DEFAULTS) {
      if (!existingMap.has(def.systemName)) {
        const created = await db.mCSystemStatus.create({
          data: {
            systemName: def.systemName,
            displayName: def.displayName,
            status: def.status,
            phase: def.phase,
            progress: def.progress,
            reasoning: def.reasoning,
            startedAt: def.status === 'running' ? new Date() : null,
            lastHeartbeat: new Date(),
            todayTotal: def.todayTotal,
            todayCompleted: def.todayCompleted,
            todayFailed: def.todayFailed,
          },
        })
        existingMap.set(def.systemName, created)
      }
    }

    // Return in canonical order
    const ordered = SYSTEM_DEFAULTS.map(d => existingMap.get(d.systemName))

    return NextResponse.json({
      systems: ordered,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ops/status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system statuses' },
      { status: 500 }
    )
  }
}
