import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isProduction } from '@/lib/observatory-gate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/evidence
 * Evidence Explorer™ — click a source domain, see its AI visibility stats.
 *
 * Query params:
 *   domain - Required. The source domain to inspect (e.g., "github.com")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing required query param: domain' },
        { status: 400 }
      )
    }

    // Fetch all source tracking records for this domain
    const trackingRecords = await db.sourceTracking.findMany({
      where: {
        domain,
        ...productionGate(),
      },
      orderBy: { period: 'desc' },
    })

    if (trackingRecords.length === 0) {
      return NextResponse.json(
        { error: 'No evidence data found for domain', domain },
        { status: 404 }
      )
    }

    // ─── Build usedBy (unique AI models citing this domain) ──────
    const usedBy = [...new Set(trackingRecords.map((r) => r.aiModel))]

    // ─── Build growth (most recent percent change) ──────────────
    const latestRecord = trackingRecords[0]
    const growth = latestRecord.percentChange

    // ─── Build citationTrend (period → count) ──────────────────
    const citationTrend = trackingRecords
      .map((r) => ({
        period: r.period,
        count: r.citationCount,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // ─── Compute avgPosition (weighted average across models) ───
    const totalCitations = trackingRecords.reduce((sum, r) => sum + r.citationCount, 0)
    const weightedPosition = trackingRecords.reduce(
      (sum, r) => sum + r.avgPosition * r.citationCount,
      0
    )
    const avgPosition = totalCitations > 0 ? Math.round((weightedPosition / totalCitations) * 100) / 100 : 0

    // ─── Build categories (merge from all records) ─────────────
    const categorySet = new Set<string>()
    for (const r of trackingRecords) {
      if (r.categories) {
        try {
          const cats = JSON.parse(r.categories) as string[]
          for (const c of cats) categorySet.add(c)
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return NextResponse.json({
      domain,
      growth,
      usedBy,
      citationTrend,
      avgPosition,
      categories: Array.from(categorySet),
      totalCitations,
    })
  } catch (error) {
    console.error('[observatory/evidence] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch evidence data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Returns production gate filter for isSimulated field.
 * SourceTracking does not have isSimulated, but we keep the gate
 * for consistency and future-proofing.
 */
function productionGate(): Record<string, never> {
  // SourceTracking model has no isSimulated field
  // but the gate function is kept for API consistency
  return isProduction() ? {} : {}
}
