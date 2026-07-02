/**
 * Cron: Daily Mission — GET /api/cron/daily-mission
 *
 * Vercel Cron endpoint triggered externally at 06:00 UTC.
 * Calls the same `generateDailyMission()` logic as POST /api/factory/daily-mission.
 *
 * Security:
 *   - If `CRON_SECRET` is set in env, the `Authorization: Bearer <secret>`
 *     header MUST match. Otherwise the request is rejected with 401.
 *   - If `CRON_SECRET` is NOT set, the endpoint is open (useful for local dev
 *     and sandboxes without configured secrets).
 *
 * Response:
 *   {
 *     success: true,
 *     missionId,
 *     candidatesEvaluated,
 *     candidatesApproved
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateDailyMission,
  DEFAULT_BUDGET,
} from '@/lib/daily-mission-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured → allow (dev / sandbox mode)
    return true
  }

  // Accept either:
  //   - Authorization: Bearer <secret>
  //   - x-cron-secret: <secret>
  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  try {
    const generated = await generateDailyMission(
      DEFAULT_BUDGET,
      'Increase platform value through highest-impact improvement',
      'Daily cron mission: scan the codebase, surface gaps, evaluate each through the Governor, ship highest-confidence improvements within budget.',
    )

    return NextResponse.json({
      success: true,
      missionId: generated.missionId,
      candidatesEvaluated: generated.candidatesEvaluated,
      candidatesApproved: generated.candidatesApproved,
      candidatesRejected: generated.candidatesRejected,
    })
  } catch (error) {
    console.error('[api/cron/daily-mission] Failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
