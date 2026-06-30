import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productionGate } from '@/lib/observatory-gate'

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
 * GET /api/public/breaking
 * List published Breaking Research alerts.
 * Returns: headline, summary, aiModel, changeType, evidenceCount, confidence, significance, createdAt
 */
export async function GET() {
  try {
    const breaking = await db.breakingResearch.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        headline: true,
        summary: true,
        aiModel: true,
        changeType: true,
        evidenceCount: true,
        confidence: true,
        significance: true,
        sourceBefore: true,
        sourceAfter: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    const data = breaking.map((b) => ({
      ...b,
      confidence: Math.round(b.confidence * 100),
      significance: Math.round(b.significance * 100),
      publishedAt: b.publishedAt?.toISOString() || null,
      createdAt: b.createdAt.toISOString(),
    }))

    return NextResponse.json(
      { success: true, data },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/breaking] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch breaking research' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
