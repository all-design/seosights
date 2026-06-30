import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isProduction } from '@/lib/observatory-gate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/timeline
 * AI Search Timeline™ — internet-wide AI search history events.
 *
 * Query params:
 *   year     - Filter by year (e.g., 2026)
 *   category - Filter by category (e.g., "citation_shift")
 *   limit    - Max events to return (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
    const category = searchParams.get('category') || undefined
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))

    // Build where clause
    const where: Record<string, unknown> = {
      ...productionGate(),
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year + 1, 0, 1)
      where.date = { gte: startOfYear, lt: endOfYear }
    }
    if (category) where.category = category

    // Fetch events and total count in parallel
    const [events, total] = await Promise.all([
      db.observatoryTimeline.findMany({
        where,
        orderBy: [{ significance: 'desc' }, { date: 'desc' }],
        take: limit,
      }),
      db.observatoryTimeline.count({ where }),
    ])

    const formattedEvents = events.map((e) => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      event: e.event,
      aiModel: e.aiModel,
      category: e.category,
      significance: Math.round(e.significance * 100) / 100,
      description: e.description,
      evidenceUrl: e.evidenceUrl,
    }))

    return NextResponse.json({
      events: formattedEvents,
      meta: {
        total,
        year: year || 'all',
      },
    })
  } catch (error) {
    console.error('[observatory/timeline] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch timeline data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Returns production gate filter for isSimulated field.
 * In production, filters out simulated data. In dev, returns empty filter.
 */
function productionGate(): { isSimulated: false } | Record<string, never> {
  return isProduction() ? { isSimulated: false } : {}
}
