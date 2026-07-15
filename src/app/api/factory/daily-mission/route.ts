/**
 * Daily Mission API
 *
 *   GET  /api/factory/daily-mission  → returns today's DailyMission (or null)
 *   POST /api/factory/daily-mission  → generates today's mission
 *
 * The POST endpoint is the public "Generate Mission" button on the dashboard.
 * The cron endpoint (`/api/cron/daily-mission`) reuses the same generator.
 *
 * Budget defaults: maxHours=4, maxComponents=2, maxPages=5, confidence=0.8
 * Goal: "Increase platform value through highest-impact improvement"
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateDailyMission,
  DEFAULT_BUDGET,
} from '@/lib/daily-mission-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // mission generation may invoke the LLM multiple times

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a Date to midnight UTC so day-matching against the DB is stable. */
function todayAtMidnight(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── GET: today's mission ────────────────────────────────────────────────────

export async function GET() {
  try {
    const today = todayAtMidnight()

    const mission = await db.dailyMission.findFirst({
      where: { date: today },
    })

    if (!mission) {
      return NextResponse.json({ mission: null })
    }

    return NextResponse.json({ mission })
  } catch (error) {
    console.error('[api/factory/daily-mission GET] Failed:', error)
    // Return null mission so the dashboard shows the "Generate" CTA
    return NextResponse.json(
      {
        mission: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 },
    )
  }
}

// ─── POST: generate today's mission ──────────────────────────────────────────

export async function POST() {
  try {
    const generated = await generateDailyMission(
      DEFAULT_BUDGET,
      'Increase platform value through highest-impact improvement',
      'Scan the codebase, surface documentation / QA / cleanup gaps, evaluate each through the Governor, and ship the highest-confidence improvements within budget.',
    )

    return NextResponse.json({
      success: true,
      missionId: generated.missionId,
      goal: generated.goal,
      strategy: generated.strategy,
      budget: generated.budget,
      candidatesEvaluated: generated.candidatesEvaluated,
      candidatesApproved: generated.candidatesApproved,
      candidatesRejected: generated.candidatesRejected,
      approvedTasks: generated.approvedTasks,
    })
  } catch (error) {
    console.error('[api/factory/daily-mission POST] Failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
