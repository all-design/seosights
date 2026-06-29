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
 * GET /api/public/industries/[slug]
 * Get a single industry by slug.
 * Returns full industry data including rankings and benchmarks.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const industry = await db.observatoryIndustry.findUnique({
      where: { slug },
    })

    if (!industry) {
      return NextResponse.json(
        { success: false, error: 'Industry not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    const data = {
      ...industry,
      topModelsJson: industry.topModelsJson ? JSON.parse(industry.topModelsJson) : {},
      rankingsJson: industry.rankingsJson ? JSON.parse(industry.rankingsJson) : [],
      benchmarksJson: industry.benchmarksJson ? JSON.parse(industry.benchmarksJson) : {},
      lastUpdated: industry.lastUpdated?.toISOString() || null,
      createdAt: industry.createdAt.toISOString(),
      updatedAt: industry.updatedAt.toISOString(),
    }

    return NextResponse.json(
      { success: true, data },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/industries/[slug]] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch industry' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
