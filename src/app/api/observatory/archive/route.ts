import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/archive
 * AI Search Archive™ — browse historical AI responses.
 * PUBLIC read-only API.
 *
 * Query params:
 *   model    - Filter by AI model (e.g., "chatgpt")
 *   category - Filter by prompt category (e.g., "brand_query")
 *   date     - Filter by month (e.g., "2026-03")
 *   limit    - Max results (default 20, max 100)
 *   offset   - Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model')
    const category = searchParams.get('category')
    const date = searchParams.get('date') // e.g. "2026-03"
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

    // ─── Build where clause ────────────────────────────────────────
    // CRITICAL: Never return isSimulated=true data in public API
    const where: Record<string, unknown> = {
      isSimulated: false,
    }

    if (model) where.aiModel = model
    if (category) where.promptCategory = category

    // Date filter: if "2026-03" → from 2026-03-01 to 2026-04-01
    if (date) {
      const dateRegex = /^\d{4}-\d{2}$/
      if (dateRegex.test(date)) {
        const [year, month] = date.split('-').map(Number)
        const startOfMonth = new Date(Date.UTC(year, month - 1, 1))
        const endOfMonth = new Date(Date.UTC(year, month, 1))
        where.createdAt = { gte: startOfMonth, lt: endOfMonth }
      }
    }

    // ─── Fetch responses with citations ────────────────────────────
    const [responses, total] = await Promise.all([
      db.observatoryResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          citations: {
            orderBy: { citationOrder: 'asc' },
            select: {
              id: true,
              citedUrl: true,
              citedDomain: true,
              citedTitle: true,
              citedSnippet: true,
              citationOrder: true,
            },
          },
        },
      }),
      db.observatoryResponse.count({ where }),
    ])

    // ─── Available filters ─────────────────────────────────────────
    const [availableModels, availableCategories, dateRangeResult] = await Promise.all([
      db.observatoryResponse.findMany({
        where: { isSimulated: false },
        select: { aiModel: true },
        distinct: ['aiModel'],
        orderBy: { aiModel: 'asc' },
      }),
      db.observatoryResponse.findMany({
        where: { isSimulated: false },
        select: { promptCategory: true },
        distinct: ['promptCategory'],
        orderBy: { promptCategory: 'asc' },
      }),
      db.observatoryResponse.aggregate({
        where: { isSimulated: false },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
    ])

    return NextResponse.json({
      responses: responses.map((r) => ({
        id: r.id,
        aiModel: r.aiModel,
        promptCategory: r.promptCategory,
        promptText: r.promptText,
        responseText: r.responseText,
        citationsJson: r.citationsJson,
        sentimentScore: r.sentimentScore,
        confidenceScore: r.confidenceScore,
        createdAt: r.createdAt.toISOString(),
        citations: r.citations.map((c) => ({
          citedUrl: c.citedUrl,
          citedDomain: c.citedDomain,
          citedTitle: c.citedTitle,
          citedSnippet: c.citedSnippet,
          citationOrder: c.citationOrder,
        })),
      })),
      total,
      hasMore: offset + limit < total,
      availableModels: availableModels.map((m) => m.aiModel),
      availableCategories: availableCategories.map((c) => c.promptCategory),
      dateRange: {
        earliest: dateRangeResult._min.createdAt?.toISOString() ?? null,
        latest: dateRangeResult._max.createdAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('[observatory/archive] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch archive data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
