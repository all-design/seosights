import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface EngineIndexStatus {
  name: string
  indexed: boolean
  pagesIndexed: number
  citations: number
  lastCrawled: string | null
  completeness: number // 0-100 percentage
}

interface IndexStatusSummary {
  indexed: number
  total: number
  percentage: number
}

interface IndexStatusResponse {
  engines: EngineIndexStatus[]
  summary: IndexStatusSummary
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Mock / Fallback Data ─────────────────────────────────────────

function buildMockIndexStatus(domain: string): IndexStatusResponse {
  const now = Date.now()

  const engines: EngineIndexStatus[] = [
    { name: 'ChatGPT', indexed: true, pagesIndexed: 42, citations: 14, lastCrawled: new Date(now - 4 * 3600000).toISOString(), completeness: 78 },
    { name: 'Claude', indexed: true, pagesIndexed: 28, citations: 8, lastCrawled: new Date(now - 14 * 3600000).toISOString(), completeness: 62 },
    { name: 'Gemini', indexed: true, pagesIndexed: 35, citations: 6, lastCrawled: new Date(now - 26 * 3600000).toISOString(), completeness: 55 },
    { name: 'Perplexity', indexed: true, pagesIndexed: 51, citations: 22, lastCrawled: new Date(now - 2 * 3600000).toISOString(), completeness: 85 },
    { name: 'Copilot', indexed: false, pagesIndexed: 8, citations: 2, lastCrawled: new Date(now - 72 * 3600000).toISOString(), completeness: 22 },
  ]

  const indexedCount = engines.filter((e) => e.indexed).length
  const totalCount = engines.length

  return {
    engines,
    summary: {
      indexed: indexedCount,
      total: totalCount,
      percentage: Math.round((indexedCount / totalCount) * 100),
    },
    _meta: { status: 'simulation', source: 'mock' },
  }
}

// ── Engine Key Mapping ───────────────────────────────────────────

const ENGINE_KEYS = ['chatgpt', 'claude', 'gemini', 'perplexity', 'copilot'] as const

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  copilot: 'Copilot',
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

    // ── Fetch CitationEvents grouped by engine ───────────────────
    const citationWhere: Record<string, unknown> = { domain }
    if (userId) citationWhere.userId = userId

    const citationEventsResult = await safeQuery(
      (d) => d.citationEvent.findMany({
        where: citationWhere,
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      []
    )
    const citationEvents = citationEventsResult.data

    // ── Fetch latest VisibilitySnapshot for per-engine data ──────
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

    // ── If no data at all, fall back to mock ─────────────────────
    if (citationEvents.length === 0 && !latestSnapshot) {
      return NextResponse.json(buildMockIndexStatus(domain))
    }

    // ── Parse perEngine from snapshot ────────────────────────────
    let snapshotPerEngine: Record<string, number> = {}
    if (latestSnapshot?.perEngine) {
      try {
        snapshotPerEngine = JSON.parse(latestSnapshot.perEngine)
      } catch {
        snapshotPerEngine = {}
      }
    }

    // ── Build engine status from CitationEvents ──────────────────
    const engines: EngineIndexStatus[] = ENGINE_KEYS.map((engineKey) => {
      const label = ENGINE_LABELS[engineKey]
      const engineEvents = citationEvents.filter((e) => e.engine === engineKey)

      // Cited events = how many times this engine cited the domain
      const citedEvents = engineEvents.filter(
        (e) => e.eventType === 'cited' || e.eventType === 'first_mention'
      )

      // Unique pages from pageUrl field
      const uniquePages = new Set(
        engineEvents
          .map((e) => e.pageUrl)
          .filter((url): url is string => url !== null && url.trim() !== '')
      )

      // Last crawled = most recent event timestamp
      const lastCrawled = engineEvents.length > 0
        ? engineEvents[0].createdAt.toISOString()
        : null

      // Indexed if there are any citation events
      const indexed = engineEvents.length > 0

      // Completeness based on perEngine score from snapshot, or derived from citation ratio
      const engineScore = snapshotPerEngine[engineKey]
      const completeness = engineScore !== undefined
        ? engineScore
        : indexed
          ? Math.min(100, Math.round((citedEvents.length / Math.max(1, engineEvents.length)) * 100))
          : 0

      return {
        name: label,
        indexed,
        pagesIndexed: uniquePages.size || (indexed ? Math.ceil(citedEvents.length * 2.5) : 0),
        citations: citedEvents.length,
        lastCrawled,
        completeness,
      }
    })

    // ── Build summary ────────────────────────────────────────────
    const indexedCount = engines.filter((e) => e.indexed).length
    const totalCount = engines.length
    const percentage = Math.round((indexedCount / totalCount) * 100)

    const response: IndexStatusResponse = {
      engines,
      summary: {
        indexed: indexedCount,
        total: totalCount,
        percentage,
      },
      _meta: {
        status: latestSnapshot?.dataSource === 'live' ? 'live' : 'estimated',
        source: citationEvents.length > 0 || latestSnapshot ? 'database' : 'partial',
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[ai/index-status] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    return NextResponse.json(buildMockIndexStatus(domain))
  }
}
