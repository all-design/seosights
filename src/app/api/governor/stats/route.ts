/**
 * Governor Stats API — GET /api/governor/stats
 *
 * Returns aggregate Governor statistics for the control panel:
 *   - totalIntercepted    : all-time count of GovernorInterception rows
 *   - totalApproved        : count where outcome='approved'
 *   - rejectionRate        : totalRejected / totalIntercepted (0 if empty)
 *   - violationsPrevented  : count where outcome='rejected'
 *   - recentInterceptions  : last 10 by createdAt desc
 *
 * If the DB is empty (first run), returns zeros with an empty array — never crashes.
 */

import { NextResponse } from 'next/server'
import { getGovernorStats } from '@/lib/ai-governor'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getGovernorStats()

    return NextResponse.json({
      totalIntercepted: stats.totalIntercepted ?? 0,
      totalApproved: stats.totalApproved ?? 0,
      rejectionRate: stats.rejectionRate ?? 0,
      violationsPrevented: stats.violationsPrevented ?? 0,
      recentInterceptions: stats.recentInterceptions ?? [],
    })
  } catch (error) {
    console.error('[api/governor/stats] Failed:', error)
    // Defensive: return zeros so the dashboard still renders
    return NextResponse.json({
      totalIntercepted: 0,
      totalApproved: 0,
      rejectionRate: 0,
      violationsPrevented: 0,
      recentInterceptions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 200 }) // 200 even on failure so the UI doesn't break
  }
}
