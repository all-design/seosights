/**
 * Factory QA — GET /api/factory/qa
 *
 * Returns the most recent persisted QARun record from the DB.
 * Always returns HTTP 200 — `qaRun: null` is a valid empty state.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const latest = await db.qARun.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        reviewerResults: { orderBy: { score: 'desc' } },
      },
    })

    if (latest) {
      return NextResponse.json({ qaRun: latest })
    }
    return NextResponse.json({ qaRun: null })
  } catch (error) {
    console.error('[api/factory/qa GET] Failed:', error)
    return NextResponse.json({
      qaRun: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
