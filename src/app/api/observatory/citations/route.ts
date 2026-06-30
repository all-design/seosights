import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/citations
 * Query CitationRecord table with filters and return citation stats.
 *
 * Query params:
 *   aiModel        - Filter by AI model (chatgpt, claude, gemini, etc.)
 *   citedDomain    - Filter by cited domain
 *   promptCategory - Filter by prompt category
 *   dateFrom       - Start date (ISO string)
 *   dateTo         - End date (ISO string)
 *   limit          - Max results (default 50)
 *   offset         - Pagination offset
 *   view           - "list" | "stats" | "trends" | "ranking"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const aiModel = searchParams.get('aiModel')
    const citedDomain = searchParams.get('citedDomain')
    const promptCategory = searchParams.get('promptCategory')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0)
    const view = searchParams.get('view') || 'list'

    // Build where clause
    const where: Record<string, unknown> = {}
    if (aiModel) where.aiModel = aiModel
    if (citedDomain) where.citedDomain = citedDomain
    if (promptCategory) where.promptCategory = promptCategory
    if (dateFrom || dateTo) {
      where.crawlDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    if (view === 'stats') {
      // ─── Citation Statistics ─────────────────────────────────────
      const totalCount = await db.citationRecord.count({ where })

      // Top domains by citation count
      const topDomains = await db.citationRecord.groupBy({
        by: ['citedDomain'],
        where,
        _count: { id: true },
        _avg: { confidence: true, citationOrder: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      })

      // Citations by AI model
      const byModel = await db.citationRecord.groupBy({
        by: ['aiModel'],
        where,
        _count: { id: true },
        _avg: { confidence: true },
      })

      // Citations by prompt category
      const byCategory = await db.citationRecord.groupBy({
        by: ['promptCategory'],
        where,
        _count: { id: true },
        _avg: { confidence: true },
      })

      // Average confidence
      const avgConfidenceResult = await db.citationRecord.aggregate({
        where,
        _avg: { confidence: true },
      })

      return NextResponse.json({
        totalCount,
        avgConfidence: avgConfidenceResult._avg.confidence?.toFixed(3) || '0.000',
        topDomains: topDomains.map((d) => ({
          domain: d.citedDomain,
          citationCount: d._count.id,
          avgConfidence: d._avg.confidence?.toFixed(3) || '0.000',
          avgPosition: d._avg.citationOrder?.toFixed(1) || '0.0',
        })),
        byModel: byModel.map((m) => ({
          aiModel: m.aiModel,
          citationCount: m._count.id,
          avgConfidence: m._avg.confidence?.toFixed(3) || '0.000',
        })),
        byCategory: byCategory.map((c) => ({
          category: c.promptCategory,
          citationCount: c._count.id,
          avgConfidence: c._avg.confidence?.toFixed(3) || '0.000',
        })),
      })
    }

    if (view === 'ranking') {
      // ─── Domain Ranking per Model ────────────────────────────────
      const models = aiModel ? [aiModel] : ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek']
      const rankings: Record<string, Array<{ domain: string; count: number; avgPosition: number }>> = {}

      for (const model of models) {
        const modelWhere = { ...where, aiModel: model }
        const domainRanking = await db.citationRecord.groupBy({
          by: ['citedDomain'],
          where: modelWhere,
          _count: { id: true },
          _avg: { citationOrder: true },
          orderBy: { _count: { id: 'desc' } },
          take: 20,
        })

        rankings[model] = domainRanking.map((d) => ({
          domain: d.citedDomain,
          count: d._count.id,
          avgPosition: Number(d._avg.citationOrder?.toFixed(1) || 0),
        }))
      }

      return NextResponse.json({
        rankings,
        models: Object.keys(rankings),
      })
    }

    if (view === 'trends') {
      // ─── Citation Trends ─────────────────────────────────────────
      // Get source tracking data alongside citation trends
      const sourceTrackingWhere: Record<string, unknown> = {}
      if (aiModel) sourceTrackingWhere.aiModel = aiModel
      if (citedDomain) sourceTrackingWhere.domain = citedDomain

      const sourceTrackingData = await db.sourceTracking.findMany({
        where: sourceTrackingWhere,
        orderBy: { period: 'desc' },
        take: 100,
      })

      // Recent citation volume by date
      const recentCitations = await db.citationRecord.findMany({
        where,
        select: { crawlDate: true, aiModel: true, citedDomain: true },
        orderBy: { crawlDate: 'desc' },
        take: 500,
      })

      // Group citations by date
      const byDate: Record<string, number> = {}
      for (const c of recentCitations) {
        const dateKey = c.crawlDate.toISOString().split('T')[0]
        byDate[dateKey] = (byDate[dateKey] || 0) + 1
      }

      return NextResponse.json({
        citationTrends: Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        sourceTracking: sourceTrackingData.map((s) => ({
          domain: s.domain,
          aiModel: s.aiModel,
          period: s.period,
          citationCount: s.citationCount,
          previousCount: s.previousCount,
          percentChange: s.percentChange,
          avgPosition: s.avgPosition,
          trend: s.trend,
          categories: s.categories ? JSON.parse(s.categories) : [],
        })),
      })
    }

    // ─── Default: List citations ──────────────────────────────────
    const citations = await db.citationRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        response: {
          select: {
            id: true,
            aiModel: true,
            promptCategory: true,
          },
        },
      },
    })

    const total = await db.citationRecord.count({ where })

    return NextResponse.json({
      citations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('[observatory/citations] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch citations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/observatory/citations
 * Extract citations from a specific response and create CitationRecord entries.
 *
 * Body:
 *   responseId - ID of the ObservatoryResponse to extract citations from
 *   citations  - Optional: pre-extracted citations array (skips parsing)
 *   overwrite  - If true, delete existing citations for this response first
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { responseId, citations: providedCitations, overwrite = false } = body

    if (!responseId) {
      return NextResponse.json({ error: 'responseId is required' }, { status: 400 })
    }

    // Fetch the response
    const response = await db.observatoryResponse.findUnique({
      where: { id: responseId },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Generate answerHash (SHA-256 of responseText)
    const answerHash = createHash('sha256').update(response.responseText).digest('hex')

    // Update the response with the hash
    await db.observatoryResponse.update({
      where: { id: responseId },
      data: { answerHash },
    })

    // If overwrite, delete existing citations for this response
    if (overwrite) {
      await db.citationRecord.deleteMany({
        where: { responseId },
      })
    }

    let citationsToCreate: Array<{
      citedUrl: string
      citedDomain: string
      citedTitle?: string
      citedSnippet?: string
      citationOrder: number
      entities?: string[]
    }>

    if (providedCitations && Array.isArray(providedCitations)) {
      // Use pre-extracted citations
      citationsToCreate = providedCitations.map((c: Record<string, unknown>, i: number) => ({
        citedUrl: String(c.citedUrl || c.url || ''),
        citedDomain: String(c.citedDomain || c.domain || extractDomain(String(c.citedUrl || c.url || ''))),
        citedTitle: c.citedTitle || c.title ? String(c.citedTitle || c.title) : undefined,
        citedSnippet: c.citedSnippet || c.snippet ? String(c.citedSnippet || c.snippet) : undefined,
        citationOrder: Number(c.citationOrder || c.order || i + 1),
        entities: Array.isArray(c.entities) ? c.entities as string[] : undefined,
      }))
    } else {
      // Parse the responseText to find cited URLs
      citationsToCreate = extractCitationsFromText(response.responseText, response.citationsJson)
    }

    if (citationsToCreate.length === 0) {
      return NextResponse.json({
        message: 'No citations found in this response.',
        answerHash,
        citationsCreated: 0,
      })
    }

    // Create CitationRecord entries
    const created = await db.citationRecord.createMany({
      data: citationsToCreate.map((c) => ({
        responseId,
        aiModel: response.aiModel,
        promptText: response.promptText,
        citedUrl: c.citedUrl,
        citedDomain: c.citedDomain,
        citedTitle: c.citedTitle || null,
        citedSnippet: c.citedSnippet || null,
        citationOrder: c.citationOrder,
        promptCategory: response.promptCategory,
        entities: c.entities ? JSON.stringify(c.entities) : null,
        answerHash,
        confidence: response.confidenceScore || 0,
        crawlDate: response.createdAt,
      })),
    })

    return NextResponse.json({
      message: `Extracted and created ${created.count} citation records.`,
      answerHash,
      citationsCreated: created.count,
      citations: citationsToCreate.map((c) => ({
        url: c.citedUrl,
        domain: c.citedDomain,
        order: c.citationOrder,
      })),
    })
  } catch (error) {
    console.error('[observatory/citations] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to extract citations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Extract domain from a URL string
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    // If it's not a valid URL, return as-is
    return url.split('/')[0]?.replace(/^www\./, '') || url
  }
}

/**
 * Extract citations from AI response text and optional citationsJson
 */
function extractCitationsFromText(
  responseText: string,
  citationsJson: string | null
): Array<{
  citedUrl: string
  citedDomain: string
  citedTitle?: string
  citedSnippet?: string
  citationOrder: number
  entities?: string[]
}> {
  const citations: Array<{
    citedUrl: string
    citedDomain: string
    citedTitle?: string
    citedSnippet?: string
    citationOrder: number
    entities?: string[]
  }> = []

  // First, try to parse from citationsJson if available
  if (citationsJson) {
    try {
      const parsed = JSON.parse(citationsJson)
      if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
          const entry = parsed[i] as Record<string, unknown>
          const url = String(entry.url || entry.link || entry.citedUrl || '')
          if (url) {
            citations.push({
              citedUrl: url,
              citedDomain: String(entry.domain || extractDomain(url)),
              citedTitle: entry.title || entry.name ? String(entry.title || entry.name) : undefined,
              citedSnippet: entry.snippet || entry.text ? String(entry.snippet || entry.text) : undefined,
              citationOrder: i + 1,
            })
          }
        }
      }
    } catch {
      // Failed to parse citationsJson, fall through to text extraction
    }
  }

  // If no citations from JSON, extract URLs from text
  if (citations.length === 0) {
    // Match URLs in the response text
    const urlRegex = /https?:\/\/[^\s<>\"')\]]+/g
    const urls = responseText.match(urlRegex) || []
    const seenUrls = new Set<string>()

    for (let i = 0; i < urls.length; i++) {
      let url = urls[i]
      // Clean trailing punctuation
      url = url.replace(/[.,;:!?\)\]>]+$/, '')

      if (seenUrls.has(url)) continue
      seenUrls.add(url)

      const domain = extractDomain(url)

      // Try to extract a snippet around the URL
      const urlIndex = responseText.indexOf(url)
      const snippetStart = Math.max(0, urlIndex - 100)
      const snippetEnd = Math.min(responseText.length, urlIndex + url.length + 100)
      const snippet = responseText.slice(snippetStart, snippetEnd).trim()

      citations.push({
        citedUrl: url,
        citedDomain: domain,
        citedSnippet: snippet.length > 200 ? snippet.slice(0, 200) + '...' : snippet || undefined,
        citationOrder: i + 1,
      })
    }
  }

  return citations
}
