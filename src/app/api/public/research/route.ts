import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { filterSimulated, productionGate } from '@/lib/observatory-gate'

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
 * GET /api/public/research
 * List published research reports.
 * Query params: type, limit (max 20, default 10), offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { status: 'published', ...productionGate() }
    if (type) {
      where.type = type
    }

    const [rawReports, total] = await Promise.all([
      db.observatoryReport.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
          summary: true,
          keyFindings: true,
          publishedAt: true,
          readingTimeMin: true,
          researchQualityScore: true,
          evidenceScore: true,
          confidenceScore: true,
          freshnessScore: true,
          sampleSize: true,
          isSimulated: true,
        },
      }),
      db.observatoryReport.count({ where }),
    ])

    // ─── Apply production gate filter (defense-in-depth) ─────────────
    const reports = filterSimulated(rawReports)

    const data = reports.map((r) => ({
      ...r,
      keyFindings: r.keyFindings ? JSON.parse(r.keyFindings) : [],
      publishedAt: r.publishedAt?.toISOString() || null,
      researchQualityScore: Math.round(r.researchQualityScore),
      evidenceScore: Math.round(r.evidenceScore),
      confidenceScore: Math.round(r.confidenceScore),
      freshnessScore: Math.round(r.freshnessScore),
    }))

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/research] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch research reports' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
