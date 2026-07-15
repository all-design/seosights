import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productionGate, isProduction } from '@/lib/observatory-gate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/health
 * Returns today's Observatory Health metrics.
 * If no ObservatoryHealthMetric record exists for today, compute from database tables.
 * Filters isSimulated in production.
 */
export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayStr = todayStart.toISOString().split('T')[0]

    // Check if a health metric already exists for today
    const existing = await db.observatoryHealthMetric.findFirst({
      where: {
        date: { gte: todayStart, lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
        ...productionGate(),
      },
    })

    if (existing) {
      // Return the pre-computed metric
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const externalCitationsThisMonth = isProduction()
        ? await db.observatoryExternalCitation.count({
            where: { citedAt: { gte: monthStart } },
          })
        : existing.externalCitations

      return NextResponse.json({
        date: existing.date.toISOString().split('T')[0],
        promptsCollected: existing.promptsCollected,
        uniqueDomains: existing.uniqueDomains,
        citationChanges: existing.citationChanges,
        newEntities: existing.newEntities,
        newReports: existing.newReports,
        activeModels: existing.activeModels,
        totalArchiveSize: existing.totalArchiveSize,
        externalCitations: existing.externalCitations,
        researchCitationsThisMonth: externalCitationsThisMonth,
      })
    }

    // No metric for today — compute from database tables
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      promptsCollected,
      uniqueDomainsResult,
      citationChanges,
      newEntitiesResult,
      newReports,
      activeModels,
      totalArchiveSize,
      externalCitations,
    ] = await Promise.all([
      // Prompts collected = ObservatoryResponse count today
      db.observatoryResponse.count({
        where: {
          createdAt: { gte: todayStart, lt: tomorrowStart },
          ...productionGate(),
        },
      }),

      // Unique domains from SourceTracking
      db.sourceTracking.findMany({
        select: { domain: true },
        distinct: ['domain'],
      }),

      // Citation changes today
      db.observatoryChange.count({
        where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
      }),

      // Distinct entities from CitationRecord
      db.citationRecord.findMany({
        where: { entities: { not: null } },
        select: { entities: true },
      }),

      // Reports published today
      db.observatoryReport.count({
        where: {
          publishedAt: { gte: todayStart, lt: tomorrowStart },
          status: 'published',
          ...productionGate(),
        },
      }),

      // Active models
      db.aIModelRegistry.count({
        where: { isActive: true },
      }),

      // Total archive size
      db.observatoryResponse.count({
        where: { ...productionGate() },
      }),

      // External citations this month
      db.observatoryExternalCitation.count({
        where: { citedAt: { gte: monthStart } },
      }),
    ])

    // Parse entities from JSON strings and count unique
    const entitySet = new Set<string>()
    for (const record of newEntitiesResult) {
      try {
        const parsed = JSON.parse(record.entities || '[]') as string[]
        for (const e of parsed) entitySet.add(e)
      } catch {
        // skip malformed JSON
      }
    }

    const result = {
      date: todayStr,
      promptsCollected,
      uniqueDomains: uniqueDomainsResult.length,
      citationChanges,
      newEntities: entitySet.size,
      newReports,
      activeModels,
      totalArchiveSize,
      externalCitations,
      researchCitationsThisMonth: externalCitations,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[observatory/health] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch health metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
