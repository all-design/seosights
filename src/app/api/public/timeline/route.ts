import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const revalidate = 300 // 5 minutes cache

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '300',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS })
}

/**
 * GET /api/public/timeline
 * Public AI Search Timeline™ — same as /api/observatory/timeline but ALWAYS
 * filters out isSimulated data, regardless of environment.
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

    // Build where clause — ALWAYS filter out simulated data for public API
    const where: Record<string, unknown> = {
      isSimulated: false,
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

    return NextResponse.json(
      {
        events: formattedEvents,
        meta: {
          total,
          year: year || 'all',
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/timeline] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch timeline data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
