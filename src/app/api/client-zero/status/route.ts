import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client-zero/status
 * Returns Client Zero project status, KPIs, and recent score deltas.
 */
export async function GET() {
  try {
    const [project, latestKPI, recentDeltas] = await Promise.all([
      db.project.findFirst({ where: { isInternalAutopilot: true } }),
      db.clientZeroKPI.findFirst({ orderBy: { createdAt: 'desc' } }),
      db.clientZeroScoreDelta.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ])

    const status = project || latestKPI ? 'operational' : 'standby'

    return NextResponse.json({
      status,
      project: project ? {
        id: project.id,
        domain: project.domain,
        url: project.url,
      } : null,
      latestKPI,
      recentDeltas: recentDeltas.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[client-zero/status] Error:', error)
    return NextResponse.json({ status: 'error', error: 'Failed to fetch client zero status' }, { status: 500 })
  }
}
