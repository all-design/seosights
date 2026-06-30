import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { productionGate } from '@/lib/observatory-gate'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/pulse
 * Live AI Search Pulse™ — real-time overview of the Observatory.
 * PUBLIC read-only API.
 */
export async function GET() {
  try {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // ─── Parallel queries ─────────────────────────────────────────
    const [
      activeModels,
      recentSignals,
      recentIndustries,
      totalArchived,
      breakingAlerts,
      latestCrawl,
    ] = await Promise.all([
      // Active models with recent data
      db.aIModelRegistry.findMany({
        where: { isActive: true },
        orderBy: { totalResponses: 'desc' },
        select: {
          modelId: true,
          displayName: true,
          lastCrawledAt: true,
          totalResponses: true,
        },
      }),

      // Recent signals (last 24h, isSignal=true)
      db.observatoryChange.findMany({
        where: {
          isSignal: true,
          createdAt: { gte: last24h },
        },
        orderBy: { significanceScore: 'desc' },
        take: 20,
        select: {
          id: true,
          aiModel: true,
          changeType: true,
          category: true,
          significanceScore: true,
          createdAt: true,
          beforeSummary: true,
          afterSummary: true,
        },
      }),

      // Industries with recent activity (based on recent changes referencing their categories)
      db.observatoryIndustry.findMany({
        where: {
          lastUpdated: { gte: last24h },
        },
        select: { id: true },
      }),

      // Total archived responses (production gate filters simulated in prod)
      db.observatoryResponse.count({
        where: { ...productionGate() },
      }),

      // Recent breaking research
      db.breakingResearch.findMany({
        where: {
          isPublished: true,
          createdAt: { gte: last24h },
        },
        orderBy: { significance: 'desc' },
        take: 10,
        select: {
          id: true,
          headline: true,
          aiModel: true,
          changeType: true,
          significance: true,
          createdAt: true,
        },
      }),

      // Latest crawl for lastCrawlAt
      db.observatoryCrawl.findFirst({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
    ])

    // ─── Build recentSignals output ────────────────────────────────
    const signals = recentSignals.map((s) => ({
      id: s.id,
      headline: buildSignalHeadline(s.aiModel, s.changeType, s.category, s.afterSummary),
      aiModel: s.aiModel,
      changeType: s.changeType,
      significance: Math.round(s.significanceScore * 100),
      timeAgo: formatTimeAgo(s.createdAt, now),
    }))

    // Merge breaking alerts into signals
    const breakingSignals = breakingAlerts.map((a) => ({
      id: a.id,
      headline: `🚨 ${a.headline}`,
      aiModel: a.aiModel,
      changeType: a.changeType,
      significance: Math.round(a.significance * 100),
      timeAgo: formatTimeAgo(a.createdAt, now),
    }))

    // Count citation shifts in last 24h
    const citationShifts24h = await db.observatoryChange.count({
      where: {
        changeType: 'citation_shift',
        createdAt: { gte: last24h },
      },
    })

    // Count models with recent data (crawled in last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const modelsUpdated = activeModels.filter(
      (m) => m.lastCrawledAt && m.lastCrawledAt >= sevenDaysAgo
    ).length

    return NextResponse.json({
      lastCrawlAt: latestCrawl?.completedAt?.toISOString() ?? null,
      modelsUpdated,
      newCitationShifts: citationShifts24h,
      industriesAffected: recentIndustries.length,
      totalArchivedResponses: totalArchived,
      recentSignals: [...breakingSignals, ...signals].slice(0, 20),
      activeModels: activeModels.map((m) => ({
        modelId: m.modelId,
        displayName: m.displayName,
        lastCrawledAt: m.lastCrawledAt?.toISOString() ?? null,
        totalResponses: m.totalResponses,
      })),
    })
  } catch (error) {
    console.error('[observatory/pulse] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch pulse data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function buildSignalHeadline(
  aiModel: string,
  changeType: string,
  category: string,
  afterSummary: string | null
): string {
  const model = aiModel.charAt(0).toUpperCase() + aiModel.slice(1)
  const typeLabel = changeType.replace(/_/g, ' ')

  if (afterSummary && afterSummary.length > 0) {
    const truncated = afterSummary.length > 80 ? afterSummary.slice(0, 77) + '...' : afterSummary
    return `${model}: ${truncated}`
  }

  return `${model}: ${typeLabel} detected in ${category.replace(/_/g, ' ')}`
}

function formatTimeAgo(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
