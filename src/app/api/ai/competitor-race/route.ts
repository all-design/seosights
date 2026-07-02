import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface RankingEntry {
  rank: number
  domain: string
  score: number
  change: number
  isYou: boolean
}

interface CompetitorRaceResponse {
  rankings: RankingEntry[]
  yourPosition: number
  totalCompetitors: number
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Mock / Fallback Data ─────────────────────────────────────────

function buildMockRace(domain: string): CompetitorRaceResponse {
  const yourScore = 42 + Math.floor(Math.random() * 15)
  const competitors: RankingEntry[] = [
    { rank: 1, domain: 'competitor-alpha.com', score: yourScore + 22 + Math.floor(Math.random() * 8), change: 3, isYou: false },
    { rank: 2, domain: 'competitor-beta.io', score: yourScore + 14 + Math.floor(Math.random() * 6), change: -1, isYou: false },
    { rank: 3, domain: 'market-leader.com', score: yourScore + 8 + Math.floor(Math.random() * 5), change: 2, isYou: false },
    { rank: 4, domain: 'rival-gamma.co', score: yourScore + 3 + Math.floor(Math.random() * 4), change: 0, isYou: false },
    { rank: 5, domain, score: yourScore, change: 1, isYou: true },
  ]

  return {
    rankings: competitors,
    yourPosition: 5,
    totalCompetitors: 5,
    _meta: { status: 'simulation', source: 'mock' },
  }
}

// ── GET Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined
    const industry = searchParams.get('industry') || undefined

    if (!domain) {
      return NextResponse.json({ error: 'Missing required parameter: domain' }, { status: 400 })
    }

    // ── Fetch the domain's latest VisibilitySnapshot ─────────────
    const snapshotWhere: Record<string, unknown> = { domain }
    if (userId) snapshotWhere.userId = userId

    const yourSnapshotResult = await safeQuery(
      (d) => d.visibilitySnapshot.findFirst({
        where: snapshotWhere,
        orderBy: { capturedAt: 'desc' },
      }),
      null
    )
    const yourSnapshot = yourSnapshotResult.data

    // ── Fetch IndustryBenchmark for competitor context ───────────
    let benchmark: {
      industry: string
      industryLabel: string
      avgAIVisibility: number
      perEngine: string
      sampleSize: number
    } | null = null

    if (industry) {
      benchmark = (await safeQuery(
        (d) => d.industryBenchmark.findUnique({
          where: { industry },
        }),
        null
      )).data
    }

    // ── Fetch competitor domains from CitationEvent ──────────────
    const citationWhere: Record<string, unknown> = { domain }
    if (userId) citationWhere.userId = userId

    const competitorEventsResult = await safeQuery(
      (d) => d.citationEvent.findMany({
        where: {
          ...citationWhere,
          competitor: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      []
    )
    const competitorEvents = competitorEventsResult.data

    // ── Gather unique competitor domains ─────────────────────────
    const competitorDomains = [...new Set(
      competitorEvents
        .map((e) => e.competitor)
        .filter((c): c is string => c !== null && c.trim() !== '')
    )].slice(0, 5)

    // ── Fetch snapshots for each competitor ──────────────────────
    const competitorSnapshotsResult = competitorDomains.length > 0
      ? await safeQuery(
          (d) => d.visibilitySnapshot.findMany({
            where: {
              domain: { in: competitorDomains },
            },
            orderBy: { capturedAt: 'desc' },
            distinct: ['domain'],
          }),
          []
        )
      : null
    const competitorSnapshots = competitorSnapshotsResult ? competitorSnapshotsResult.data : []

    // ── Build rankings ───────────────────────────────────────────
    const yourScore = yourSnapshot?.overallScore ?? 0
    const yourChange = yourSnapshot
      ? (() => {
          // Try to find a previous snapshot for delta
          // We don't have a previous snapshot easily, so derive from events
          const rankUps = competitorEvents.filter((e) => e.eventType === 'rank_up')
          const rankDowns = competitorEvents.filter((e) => e.eventType === 'rank_down')
          return rankUps.length - rankDowns.length
        })()
      : 0

    const yourEntry: RankingEntry = {
      rank: 0, // will be computed after sorting
      domain,
      score: yourScore,
      change: Math.max(-10, Math.min(10, yourChange)),
      isYou: true,
    }

    const competitorEntries: RankingEntry[] = competitorSnapshots.map((cs) => {
      // Find the change from CitationEvent for this competitor
      const compEvents = competitorEvents.filter((e) => e.competitor === cs.domain)
      const compRankUps = compEvents.filter((e) => e.eventType === 'rank_up').length
      const compRankDowns = compEvents.filter((e) => e.eventType === 'rank_down').length
      return {
        rank: 0,
        domain: cs.domain,
        score: cs.overallScore,
        change: Math.max(-10, Math.min(10, compRankUps - compRankDowns)),
        isYou: false,
      }
    })

    // ── If industry benchmark exists but no competitor snapshots, ─
    //    generate synthetic competitors from benchmark data
    if (competitorEntries.length === 0 && benchmark) {
      const avgScore = benchmark.avgAIVisibility
      const syntheticCompetitors: RankingEntry[] = [
        { rank: 0, domain: 'industry-leader.com', score: avgScore + 18, change: 2, isYou: false },
        { rank: 0, domain: 'top-performer.io', score: avgScore + 10, change: -1, isYou: false },
        { rank: 0, domain: 'market-player.co', score: avgScore + 3, change: 1, isYou: false },
        { rank: 0, domain: 'emerging-rival.com', score: avgScore - 5, change: 0, isYou: false },
      ]
      competitorEntries.push(...syntheticCompetitors)
    }

    // ── Combine & sort all entries by score (desc) ───────────────
    const allEntries = [yourEntry, ...competitorEntries]
    allEntries.sort((a, b) => b.score - a.score)

    // Assign ranks
    allEntries.forEach((entry, idx) => {
      entry.rank = idx + 1
    })

    const yourPosition = allEntries.find((e) => e.isYou)?.rank ?? allEntries.length

    // ── If no data at all, fall back to mock ─────────────────────
    if (!yourSnapshot && competitorSnapshots.length === 0 && !benchmark) {
      return NextResponse.json(buildMockRace(domain))
    }

    const response: CompetitorRaceResponse = {
      rankings: allEntries,
      yourPosition,
      totalCompetitors: allEntries.length,
      _meta: {
        status: yourSnapshot?.dataSource === 'live' ? 'live' : 'estimated',
        source: yourSnapshot ? 'database' : 'partial',
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[ai/competitor-race] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    return NextResponse.json(buildMockRace(domain))
  }
}
