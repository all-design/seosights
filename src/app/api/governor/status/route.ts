import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/governor/status
 * Returns AI Governor status and recent interceptions.
 */
export async function GET() {
  try {
    const [totalInterceptions, recentInterceptions] = await Promise.all([
      db.governorInterception.count(),
      db.governorInterception.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    ])

    const status = totalInterceptions > 0 ? 'operational' : 'standby'

    return NextResponse.json({
      status,
      totalInterceptions,
      recentInterceptions,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[governor/status] Error:', error)
    return NextResponse.json({ status: 'error', error: 'Failed to fetch governor status' }, { status: 500 })
  }
}
