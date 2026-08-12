import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/status
 * Get full observatory status — overview of the entire pipeline.
 */
export async function GET() {
  try {
    // ── Auto-seed: If AI Model Registry is empty, seed it automatically ──────
    // This fixes the cold start problem where "No models registered yet" shows
    // forever because nobody manually called POST /api/observatory/seed
    const existingModels = await db.aIModelRegistry.count()
    if (existingModels === 0) {
      console.log('[observatory/status] No AI models in registry → auto-seeding')
      const MODEL_SEED = [
        { modelId: 'chatgpt', displayName: 'ChatGPT', provider: 'openai', version: 'GPT-4o', capabilities: JSON.stringify({ web_access: true, citation: true, reasoning: true, multimodal: true }) },
        { modelId: 'claude', displayName: 'Claude', provider: 'anthropic', version: 'Claude 3.5 Sonnet', capabilities: JSON.stringify({ web_access: true, citation: false, reasoning: true, multimodal: true }) },
        { modelId: 'gemini', displayName: 'Gemini', provider: 'google', version: 'Gemini 2.0', capabilities: JSON.stringify({ web_access: true, citation: true, reasoning: true, multimodal: true }) },
        { modelId: 'perplexity', displayName: 'Perplexity', provider: 'perplexity', version: 'Sonar Large', capabilities: JSON.stringify({ web_access: true, citation: true, reasoning: false, multimodal: false }) },
        { modelId: 'grok', displayName: 'Grok', provider: 'xai', version: 'Grok-2', capabilities: JSON.stringify({ web_access: true, citation: false, reasoning: true, multimodal: false }) },
        { modelId: 'deepseek', displayName: 'DeepSeek', provider: 'deepseek', version: 'DeepSeek-V3', capabilities: JSON.stringify({ web_access: false, citation: false, reasoning: true, multimodal: false }) },
      ]
      for (const model of MODEL_SEED) {
        await db.aIModelRegistry.create({
          data: {
            modelId: model.modelId,
            displayName: model.displayName,
            provider: model.provider,
            version: model.version,
            capabilities: model.capabilities,
            isActive: true,
            totalResponses: 0,
            knownChanges: 0,
          },
        })
      }
      console.log(`[observatory/status] Seeded ${MODEL_SEED.length} AI models into registry`)
    }

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
