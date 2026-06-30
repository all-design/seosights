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
 * GET /api/public/industries
 * List industries with AI visibility data.
 * Query params: limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    const [industries, total] = await Promise.all([
      db.observatoryIndustry.findMany({
        orderBy: { aiVisibilityAvg: 'desc' },
        take: limit,
        skip: offset,
        select: {
          slug: true,
          name: true,
          description: true,
          aiVisibilityAvg: true,
          topModelsJson: true,
          lastUpdated: true,
        },
      }),
      db.observatoryIndustry.count(),
    ])

    const data = industries.map((i) => ({
      ...i,
      topModelsJson: i.topModelsJson ? JSON.parse(i.topModelsJson) : {},
      lastUpdated: i.lastUpdated?.toISOString() || null,
    }))

    return NextResponse.json(
      { success: true, data, pagination: { total, limit, offset, hasMore: offset + limit < total } },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/industries] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch industries' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
