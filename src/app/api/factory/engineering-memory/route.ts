/**
 * Engineering Memory API — GET /api/factory/engineering-memory
 *
 * Returns EngineeringMemory records ordered by createdAt desc.
 * Limited to the 50 most recent memories.
 *
 * Each record exposes the key learning fields used by the dashboard:
 *   - feature             : feature name (what was attempted)
 *   - filesChanged        : comma-separated file list (string)
 *   - testsPassed         : number of tests that passed
 *   - outcome             : success | partial | failed | rolled_back
 *   - rollbackNeeded      : boolean — whether a rollback was required
 *   - performanceDelta    : nullable + / - % change
 *   - confidence          : 0.0 - 1.0 — how confident we are in the learning
 *
 * On DB failure, returns an empty list with HTTP 200.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const records = await db.engineeringMemory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const memories = records.map((r) => ({
      id: r.id,
      taskId: r.taskId,
      missionId: r.missionId,
      feature: r.feature,
      filesChanged: r.filesChanged,
      testsAdded: r.testsAdded,
      testsPassed: r.testsPassed,
      testsFailed: r.testsFailed,
      outcome: r.outcome,
      rollbackNeeded: r.rollbackNeeded,
      performanceDelta: r.performanceDelta,
      confidence: r.confidence,
      patternLearned: r.patternLearned,
      appliedAgain: r.appliedAgain,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({ memories, count: memories.length })
  } catch (error) {
    console.error('[api/factory/engineering-memory] Failed:', error)
    return NextResponse.json(
      {
        memories: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 },
    )
  }
}
