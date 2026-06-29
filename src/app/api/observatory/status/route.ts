import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/status
 * Get full observatory status — overview of the entire pipeline.
 */
export async function GET() {
  try {
    // ─── Core Counts ───────────────────────────────────────────────
    const [
      totalCrawls,
      totalResponses,
      totalChanges,
      totalSignals,
      totalReports,
      totalPublications,
      totalLearnings,
      totalIndustries,
    ] = await Promise.all([
      db.observatoryCrawl.count(),
      db.observatoryResponse.count(),
      db.observatoryChange.count(),
      db.observatoryChange.count({ where: { isSignal: true } }),
      db.observatoryReport.count(),
      db.observatoryPublication.count(),
      db.observatoryLearning.count(),
      db.observatoryIndustry.count(),
    ])

    // ─── Latest Crawl ──────────────────────────────────────────────
    const latestCrawl = await db.observatoryCrawl.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        _count: { select: { responses: true, changes: true } },
      },
    })

    // ─── Latest Detected Changes ───────────────────────────────────
    const latestChanges = await db.observatoryChange.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        aiModel: true,
        changeType: true,
        category: true,
        significanceScore: true,
        isSignal: true,
        signalReason: true,
        createdAt: true,
      },
    })

    // ─── Recent Reports ────────────────────────────────────────────
    const recentReports = await db.observatoryReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        editorialScore: true,
        wordCount: true,
        createdAt: true,
        publishedAt: true,
      },
    })

    // ─── AI Model Registry ─────────────────────────────────────────
    const modelRegistry = await db.aIModelRegistry.findMany({
      where: { isActive: true },
      orderBy: { totalResponses: 'desc' },
    })

    // ─── Pipeline Stats ────────────────────────────────────────────
    const reportByStatus = await db.observatoryReport.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const changesByType = await db.observatoryChange.groupBy({
      by: ['changeType'],
      _count: { id: true },
    })

    const responsesByModel = await db.observatoryResponse.groupBy({
      by: ['aiModel'],
      _count: { id: true },
    })

    // ─── Unprocessed Items ─────────────────────────────────────────
    const unprocessedChanges = await db.observatoryChange.count({
      where: { isSignal: false, signalReason: null },
    })
    const proposedReports = await db.observatoryReport.count({
      where: { status: 'proposed' },
    })

    return NextResponse.json({
      overview: {
        totalCrawls,
        totalResponses,
        totalChanges,
        totalSignals,
        totalReports,
        totalPublications,
        totalLearnings,
        totalIndustries,
        signalRate: totalChanges > 0 ? (totalSignals / totalChanges * 100).toFixed(1) + '%' : '0%',
      },
      latestCrawl: latestCrawl
        ? {
            id: latestCrawl.id,
            type: latestCrawl.type,
            status: latestCrawl.status,
            modelsQueried: latestCrawl.modelsQueried,
            promptsTotal: latestCrawl.promptsTotal,
            promptsCompleted: latestCrawl.promptsCompleted,
            durationMs: latestCrawl.durationMs,
            responseCount: latestCrawl._count.responses,
            changeCount: latestCrawl._count.changes,
            startedAt: latestCrawl.startedAt,
            completedAt: latestCrawl.completedAt,
          }
        : null,
      latestChanges,
      recentReports,
      modelRegistry: modelRegistry.map((m) => ({
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        provider: m.provider,
        version: m.version,
        totalResponses: m.totalResponses,
        knownChanges: m.knownChanges,
        lastCrawledAt: m.lastCrawledAt,
        isActive: m.isActive,
      })),
      pipeline: {
        reportByStatus: reportByStatus.map((r) => ({
          status: r.status,
          count: r._count.id,
        })),
        changesByType: changesByType.map((c) => ({
          changeType: c.changeType,
          count: c._count.id,
        })),
        responsesByModel: responsesByModel.map((r) => ({
          aiModel: r.aiModel,
          count: r._count.id,
        })),
      },
      queue: {
        unprocessedChanges,
        proposedReports,
      },
    })
  } catch (error) {
    console.error('[observatory/status] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch observatory status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
