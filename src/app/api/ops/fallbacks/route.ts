/**
 * Fallback Logs API — GET /api/ops/fallbacks
 *
 * Returns recent fallback events for the Operations Center.
 * This is an internal API, not exposed to end users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFallbackLogs, getFallbackStats } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const logs = getFallbackLogs(limit, offset)
  const stats = getFallbackStats()

  return NextResponse.json({
    logs,
    stats,
  })
}
