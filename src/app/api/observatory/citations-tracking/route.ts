import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/citations-tracking
 * Observatory Citations™ — external citations of Observatory research.
 *
 * Query params:
 *   reportId - Filter by report ID
 *   verified - Filter by verified status ("true" | "false")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId') || undefined
    const verifiedParam = searchParams.get('verified')
    const verified = verifiedParam === 'true' ? true : verifiedParam === 'false' ? false : undefined

    // Build where clause
    const where: Record<string, unknown> = {}
    if (reportId) where.reportId = reportId
    if (verified !== undefined) where.verified = verified

    // Fetch citations with report title via include
    const [citations, totalCitations, verifiedCount, uniqueSourceNames] = await Promise.all([
      db.observatoryExternalCitation.findMany({
        where,
        include: {
          report: {
            select: { title: true },
          },
        },
        orderBy: { citedAt: 'desc' },
        take: 200,
      }),
      db.observatoryExternalCitation.count({ where }),
      db.observatoryExternalCitation.count({
        where: { ...where, verified: true },
      }),
      db.observatoryExternalCitation.findMany({
        where,
        select: { sourceName: true },
        distinct: ['sourceName'],
      }),
    ])

    const formattedCitations = citations.map((c) => ({
      id: c.id,
      reportId: c.reportId,
      reportTitle: c.report.title,
      sourceName: c.sourceName,
      sourceUrl: c.sourceUrl,
      sourceType: c.sourceType,
      citedAt: c.citedAt.toISOString(),
      context: c.context,
      verified: c.verified,
    }))

    return NextResponse.json({
      citations: formattedCitations,
      meta: {
        totalCitations,
        verifiedCount,
        uniqueSources: uniqueSourceNames.length,
      },
    })
  } catch (error) {
    console.error('[observatory/citations-tracking] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch citations tracking data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
