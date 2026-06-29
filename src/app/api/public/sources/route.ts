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
 * GET /api/public/sources
 * Get source tracking summary.
 * Query params: model, period
 * Returns: top domains, rising domains, falling domains, trend data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model') || undefined
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const now = new Date()
    const periodDays = parseInt(period.replace('d', '')) || 30
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Build where clause for responses
    const responseWhere: Record<string, unknown> = {
      createdAt: { gte: startDate },
    }
    if (model) {
      responseWhere.aiModel = model
    }

    // Get responses with citations
    const responses = await db.observatoryResponse.findMany({
      where: responseWhere,
      select: {
        citationsJson: true,
        aiModel: true,
        createdAt: true,
      },
      take: 500,
    })

    // Parse citations and aggregate domain data
    const domainMap = new Map<string, { total: number; models: Set<string>; dates: string[] }>()

    for (const resp of responses) {
      if (!resp.citationsJson) continue
      try {
        const citations = JSON.parse(resp.citationsJson) as string[]
        for (const citation of citations) {
          try {
            const url = new URL(citation.startsWith('http') ? citation : `https://${citation}`)
            const domain = url.hostname.replace(/^www\./, '')
            const existing = domainMap.get(domain) || { total: 0, models: new Set<string>(), dates: [] }
            existing.total++
            existing.models.add(resp.aiModel)
            existing.dates.push(resp.createdAt.toISOString().split('T')[0])
            domainMap.set(domain, existing)
          } catch {
            // Skip invalid URLs
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    // Sort by total citations
    const sortedDomains = [...domainMap.entries()]
      .sort((a, b) => b[1].total - a[1].total)

    // Categorize domains (top, rising, falling) based on recency
    const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const topDomains = sortedDomains.slice(0, 20).map(([domain, data]) => ({
      domain,
      totalCitations: data.total,
      models: Array.from(data.models),
      trend: data.dates.filter(d => d >= recentCutoff).length > data.dates.length * 0.3 ? 'rising' as const
        : data.dates.filter(d => d >= recentCutoff).length < data.dates.length * 0.1 ? 'falling' as const
        : 'stable' as const,
    }))

    const risingDomains = topDomains.filter(d => d.trend === 'rising')
    const fallingDomains = topDomains.filter(d => d.trend === 'falling')

    return NextResponse.json(
      {
        success: true,
        data: {
          topDomains,
          risingDomains,
          fallingDomains,
          totalDomains: domainMap.size,
          totalCitations: sortedDomains.reduce((sum, [, d]) => sum + d.total, 0),
          period,
          model: model || 'all',
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/sources] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch source data' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
