import { NextResponse } from 'next/server'
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
 * GET /api/public/models
 * List AI models being tracked.
 * Only returns active models.
 */
export async function GET() {
  try {
    const models = await db.aIModelRegistry.findMany({
      where: { isActive: true },
      orderBy: { totalResponses: 'desc' },
      select: {
        modelId: true,
        displayName: true,
        provider: true,
        version: true,
        capabilities: true,
        totalResponses: true,
        knownChanges: true,
        lastCrawledAt: true,
      },
    })

    const data = models.map((m) => ({
      ...m,
      capabilities: m.capabilities ? JSON.parse(m.capabilities) : {},
      lastCrawledAt: m.lastCrawledAt?.toISOString() || null,
    }))

    return NextResponse.json(
      { success: true, data },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/models] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI models' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
