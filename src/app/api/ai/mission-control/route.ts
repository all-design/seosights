import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface EngineStatus {
  name: string
  indexed: boolean
  citations: number
  lastCrawled: string | null
}

interface MissionControlResponse {
  score: {
    overall: number
    trust: number
    freshness: number
    authority: number
  }
  engines: EngineStatus[]
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    engine: string | null
    delta: number
    severity: string
    createdAt: string
  }>
  opportunities: number
  alerts: number
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Mock / Fallback Data ─────────────────────────────────────────

function buildMockResponse(domain: string): MissionControlResponse {
  const brand = domain.replace(/^www\./, '').split('.')[0]
  const now = Date.now()
  const base = 45 + Math.floor(Math.random() * 25)

  return {
    score: {
      overall: base,
      trust: base - 8 + Math.floor(Math.random() * 5),
      freshness: base + 4 + Math.floor(Math.random() * 6),
      authority: base - 6 + Math.floor(Math.random() * 4),
    },
    engines: [
      { name: 'ChatGPT', indexed: true, citations: 12 + Math.floor(Math.random() * 8), lastCrawled: new Date(now - 4 * 3600000).toISOString() },
      { name: 'Claude', indexed: true, citations: 7 + Math.floor(Math.random() * 5), lastCrawled: new Date(now - 12 * 3600000).toISOString() },
      { name: 'Gemini', indexed: true, citations: 5 + Math.floor(Math.random() * 4), lastCrawled: new Date(now - 24 * 3600000).toISOString() },
      { name: 'Perplexity', indexed: true, citations: 18 + Math.floor(Math.random() * 10), lastCrawled: new Date(now - 2 * 3600000).toISOString() },
      { name: 'Copilot', indexed: false, citations: 2 + Math.floor(Math.random() * 3), lastCrawled: new Date(now - 72 * 3600000).toISOString() },
    ],
    recentActivity: [
      { id: `mc-${now}-1`, type: 'citation_gained', title: `${brand} now cited by ChatGPT`, description: `ChatGPT started citing your FAQ page for related queries.`, engine: 'chatgpt', delta: 6, severity: 'positive', createdAt: new Date(now - 2 * 3600000).toISOString() },
      { id: `mc-${now}-2`, type: 'citation_lost', title: `Gemini stopped citing pricing page`, description: `Your pricing page is no longer included in Gemini recommendations.`, engine: 'gemini', delta: -3, severity: 'warning', createdAt: new Date(now - 5 * 3600000).toISOString() },
      { id: `mc-${now}-3`, type: 'competitor_alert', title: `Competitor overtook you in Perplexity`, description: `A competitor now ranks #2 in Perplexity results.`, engine: 'perplexity', delta: -2, severity: 'critical', createdAt: new Date(now - 8 * 3600000).toISOString() },
      { id: `mc-${now}-4`, type: 'rank_change', title: `Claude visibility +4% this week`, description: `Your overall Claude visibility increased by 4 percentage points.`, engine: 'claude', delta: 4, severity: 'positive', createdAt: new Date(now - 14 * 3600000).toISOString() },
      { id: `mc-${now}-5`, type: 'ai_discovery', title: `Perplexity indexed your blog post`, description: `Perplexity now includes your recent blog post in its answer sources.`, engine: 'perplexity', delta: 2, severity: 'info', createdAt: new Date(now - 24 * 3600000).toISOString() },
    ],
    opportunities: 7 + Math.floor(Math.random() * 5),
    alerts: 2 + Math.floor(Math.random() * 3),
    _meta: { status: 'simulation', source: 'mock' },
  }
}

// ── GET Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined

    if (!domain) {
      return NextResponse.json({ error: 'Missing required parameter: domain' }, { status: 400 })
    }

    // ── Fetch latest VisibilitySnapshot ──────────────────────────
    const snapshotWhere: Record<string, unknown> = { domain }
    if (userId) snapshotWhere.userId = userId

    const latestSnapshotResult = await safeQuery(
      (d) => d.visibilitySnapshot.findFirst({
        where: snapshotWhere,
        orderBy: { capturedAt: 'desc' },
      }),
      null
    )
    const latestSnapshot = latestSnapshotResult.data

    // ── Fetch CitationEvent counts per engine ────────────────────
    const citationWhere: Record<string, unknown> = { domain }
    if (userId) citationWhere.userId = userId

    const citationEventsResult = await safeQuery(
      (d) => d.citationEvent.findMany({
        where: citationWhere,
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      [] as unknown[]
    )
    const citationEvents = citationEventsResult.data

    // ── Fetch recent FeedItem activity ───────────────────────────
    const feedWhere: Record<string, unknown> = { domain }
    if (userId) feedWhere.userId = userId

    const recentFeedItemsResult = await safeQuery(
      (d) => d.feedItem.findMany({
        where: feedWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      [] as unknown[]
    )
    const recentFeedItems = recentFeedItemsResult.data

    // ── Fetch alert counts ───────────────────────────────────────
    const unreadAlertsResult = await safeQuery(
      (d) => d.visibilityAlert.count({
        where: { domain, isRead: false },
      }),
      0
    )
    const unreadAlerts = unreadAlertsResult.data

    // ── Count opportunities (pending ActionItems) ────────────────
    const opportunityWhere: Record<string, unknown> = { domain, status: 'pending' }
    if (userId) opportunityWhere.userId = userId

    const opportunityCountResult = await safeQuery(
      (d) => d.actionItem.count({
        where: opportunityWhere,
      }),
      0
    )
    const opportunityCount = opportunityCountResult.data

    // ── If no snapshot and no citation data, fall back to mock ──
    if (!latestSnapshot && citationEvents.length === 0 && recentFeedItems.length === 0) {
      return NextResponse.json(buildMockResponse(domain))
    }

    // ── Build engine status from CitationEvents ──────────────────
    const engineNames = ['chatgpt', 'claude', 'gemini', 'perplexity', 'copilot'] as const
    const engineLabelMap: Record<string, string> = {
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      perplexity: 'Perplexity',
      copilot: 'Copilot',
    }

    const engines: EngineStatus[] = engineNames.map((engineKey) => {
      const engineEvents = citationEvents.filter((e: any) => (e as any).engine === engineKey)
      const citedEvents = engineEvents.filter((e: any) => (e as any).eventType === 'cited' || (e as any).eventType === 'first_mention')
      const lastEvent = engineEvents[0] as any // already ordered desc
      return {
        name: engineLabelMap[engineKey] || engineKey,
        indexed: engineEvents.length > 0,
        citations: citedEvents.length,
        lastCrawled: lastEvent?.createdAt?.toISOString?.() ?? null,
      }
    })

    // ── Build score from snapshot ────────────────────────────────
    const score = latestSnapshot
      ? {
          overall: latestSnapshot.overallScore,
          trust: latestSnapshot.trustScore,
          freshness: latestSnapshot.freshnessScore,
          authority: latestSnapshot.authorityScore,
        }
      : {
          overall: 40 + Math.floor(Math.random() * 20),
          trust: 35 + Math.floor(Math.random() * 20),
          freshness: 45 + Math.floor(Math.random() * 20),
          authority: 30 + Math.floor(Math.random() * 20),
        }

    // ── Build recent activity from FeedItems ─────────────────────
    const recentActivity = recentFeedItems.map((item: any) => ({
      id: item.id,
      type: item.itemType,
      title: item.title,
      description: item.description,
      engine: item.engine,
      delta: item.delta,
      severity: item.severity,
      createdAt: item.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }))

    const response: MissionControlResponse = {
      score,
      engines,
      recentActivity,
      opportunities: opportunityCount,
      alerts: unreadAlerts,
      _meta: {
        status: latestSnapshot?.dataSource === 'live' ? 'live' : 'estimated',
        source: latestSnapshot ? 'database' : 'partial',
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[ai/mission-control] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    return NextResponse.json(buildMockResponse(domain))
  }
}
