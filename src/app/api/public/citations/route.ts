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
 * GET /api/public/citations
 * Get citation statistics.
 * Query params: model, domain, category
 * Returns: total citations, top cited domains, citation trends
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model') || undefined
    const domain = searchParams.get('domain') || undefined
    const category = searchParams.get('category') || undefined

    // Build where clause
    const responseWhere: Record<string, unknown> = {}
    if (model) responseWhere.aiModel = model
    if (category) responseWhere.promptCategory = category

    // If a specific domain is requested, filter for that
    if (domain) {
      responseWhere.citationsJson = { contains: domain }
    }

    // Get total responses
    const totalResponses = await db.observatoryResponse.count({
      where: responseWhere,
    })

    // Get responses with citations
    const responses = await db.observatoryResponse.findMany({
      where: { ...responseWhere, citationsJson: { not: null } },
      select: {
        citationsJson: true,
        aiModel: true,
        promptCategory: true,
        sentimentScore: true,
        createdAt: true,
      },
      take: 500,
    })

    // Parse and aggregate citations
    const domainMap = new Map<string, { count: number; models: Set<string>; categories: Set<string> }>()

    for (const resp of responses) {
      if (!resp.citationsJson) continue
      try {
        const citations = JSON.parse(resp.citationsJson) as string[]
        for (const citation of citations) {
          try {
            const url = new URL(citation.startsWith('http') ? citation : `https://${citation}`)
            const d = url.hostname.replace(/^www\./, '')
            const existing = domainMap.get(d) || { count: 0, models: new Set<string>(), categories: new Set<string>() }
            existing.count++
            existing.models.add(resp.aiModel)
            existing.categories.add(resp.promptCategory)
            domainMap.set(d, existing)
          } catch {
            // Skip invalid URLs
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    // Top cited domains
    const topCitedDomains = [...domainMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([d, data]) => ({
        domain: d,
        citationCount: data.count,
        models: Array.from(data.models),
        categories: Array.from(data.categories),
      }))

    // Citation trends by model
    const modelCitationMap = new Map<string, number>()
    for (const resp of responses) {
      if (!resp.citationsJson) continue
      try {
        const citations = JSON.parse(resp.citationsJson) as string[]
        const current = modelCitationMap.get(resp.aiModel) || 0
        modelCitationMap.set(resp.aiModel, current + citations.length)
      } catch {
        // Skip invalid JSON
      }
    }

    const citationTrends = [...modelCitationMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([aiModel, count]) => ({ aiModel, citationCount: count }))

    // Total citations
    const totalCitations = [...domainMap.values()].reduce((sum, d) => sum + d.count, 0)

    return NextResponse.json(
      {
        success: true,
        data: {
          totalCitations,
          totalResponses,
          uniqueDomains: domainMap.size,
          topCitedDomains,
          citationTrends,
          model: model || 'all',
          domain: domain || 'all',
          category: category || 'all',
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/citations] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch citation statistics' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
