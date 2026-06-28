import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface PeriodScore {
  score: {
    overall: number
    trust: number
    freshness: number
    authority: number
  }
  perEngine: Record<string, number>
}

interface DiffChanges {
  gained: string[]
  lost: string[]
  positionChanges: Array<{ engine: string; before: number; after: number; delta: number }>
  scoreDelta: number
}

interface DiffResponse {
  before: PeriodScore
  after: PeriodScore
  changes: DiffChanges
  summary: string
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Mock / Fallback Data ─────────────────────────────────────────

function buildMockDiff(domain: string, beforeDate: string, afterDate: string): DiffResponse {
  const beforeBase = 38 + Math.floor(Math.random() * 15)
  const afterBase = beforeBase + Math.floor(Math.random() * 12) - 2

  const beforePerEngine: Record<string, number> = {
    chatgpt: beforeBase + 6,
    claude: beforeBase - 8,
    gemini: beforeBase - 2,
    perplexity: beforeBase + 10,
    copilot: beforeBase - 5,
  }

  const afterPerEngine: Record<string, number> = {
    chatgpt: afterBase + 8,
    claude: afterBase - 4,
    gemini: afterBase + 1,
    perplexity: afterBase + 12,
    copilot: afterBase - 2,
  }

  const positionChanges = Object.keys(beforePerEngine).map((engine) => ({
    engine,
    before: beforePerEngine[engine],
    after: afterPerEngine[engine],
    delta: afterPerEngine[engine] - beforePerEngine[engine],
  }))

  const delta = afterBase - beforeBase

  return {
    before: {
      score: {
        overall: beforeBase,
        trust: beforeBase - 6,
        freshness: beforeBase + 4,
        authority: beforeBase - 4,
      },
      perEngine: beforePerEngine,
    },
    after: {
      score: {
        overall: afterBase,
        trust: afterBase - 4,
        freshness: afterBase + 6,
        authority: afterBase - 2,
      },
      perEngine: afterPerEngine,
    },
    changes: {
      gained: ['ChatGPT citation for FAQ page', 'Perplexity indexed new blog post'],
      lost: ['Gemini dropped pricing page citation'],
      positionChanges,
      scoreDelta: delta,
    },
    summary: delta > 0
      ? `AI Visibility improved by ${delta} points. Key gains on ChatGPT and Perplexity, with a minor loss on Gemini.`
      : delta < 0
        ? `AI Visibility decreased by ${Math.abs(delta)} points. Lost ground on Gemini and Claude, offset partially by Perplexity gains.`
        : `AI Visibility remained stable. Minor position shifts across engines.`,
    _meta: { status: 'simulation', source: 'mock' },
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function parsePerEngine(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, number>
    }
  } catch {
    // not valid JSON
  }
  return {}
}

function buildPeriodScore(
  snapshot: {
    overallScore: number
    trustScore: number
    freshnessScore: number
    authorityScore: number
    perEngine: string
  }
): PeriodScore {
  return {
    score: {
      overall: snapshot.overallScore,
      trust: snapshot.trustScore,
      freshness: snapshot.freshnessScore,
      authority: snapshot.authorityScore,
    },
    perEngine: parsePerEngine(snapshot.perEngine),
  }
}

function buildSummary(delta: number, gained: string[], lost: string[], positionChanges: Array<{ engine: string; delta: number }>): string {
  const positiveEngines = positionChanges.filter((p) => p.delta > 0).map((p) => p.engine)
  const negativeEngines = positionChanges.filter((p) => p.delta < 0).map((p) => p.engine)

  const parts: string[] = []

  if (delta > 0) {
    parts.push(`AI Visibility improved by ${delta} points.`)
  } else if (delta < 0) {
    parts.push(`AI Visibility decreased by ${Math.abs(delta)} points.`)
  } else {
    parts.push(`AI Visibility remained stable.`)
  }

  if (positiveEngines.length > 0) {
    parts.push(`Gains on ${positiveEngines.join(', ')}.`)
  }
  if (negativeEngines.length > 0) {
    parts.push(`Losses on ${negativeEngines.join(', ')}.`)
  }
  if (gained.length > 0) {
    parts.push(`Gained citations: ${gained.slice(0, 3).join('; ')}.`)
  }
  if (lost.length > 0) {
    parts.push(`Lost citations: ${lost.slice(0, 3).join('; ')}.`)
  }

  return parts.join(' ')
}

// ── GET Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined
    const beforeParam = searchParams.get('before')
    const afterParam = searchParams.get('after')

    if (!domain) {
      return NextResponse.json({ error: 'Missing required parameter: domain' }, { status: 400 })
    }

    if (!beforeParam || !afterParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: before and after (ISO date strings)' },
        { status: 400 }
      )
    }

    const beforeDate = new Date(beforeParam)
    const afterDate = new Date(afterParam)

    if (isNaN(beforeDate.getTime()) || isNaN(afterDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for before or after parameter' },
        { status: 400 }
      )
    }

    // ── Fetch "before" snapshot (closest to beforeDate) ──────────
    const snapshotWhereBase: Record<string, unknown> = { domain }
    if (userId) snapshotWhereBase.userId = userId

    const beforeSnapshot = await db.visibilitySnapshot.findFirst({
      where: {
        ...snapshotWhereBase,
        capturedAt: { lte: beforeDate },
      },
      orderBy: { capturedAt: 'desc' },
    })

    // ── Fetch "after" snapshot (closest to afterDate) ────────────
    const afterSnapshot = await db.visibilitySnapshot.findFirst({
      where: {
        ...snapshotWhereBase,
        capturedAt: { lte: afterDate },
      },
      orderBy: { capturedAt: 'desc' },
    })

    // ── If both snapshots missing, fall back to mock ─────────────
    if (!beforeSnapshot && !afterSnapshot) {
      return NextResponse.json(buildMockDiff(domain, beforeParam, afterParam))
    }

    // ── Build period scores ──────────────────────────────────────
    const before: PeriodScore = beforeSnapshot
      ? buildPeriodScore(beforeSnapshot)
      : {
          score: { overall: 0, trust: 0, freshness: 0, authority: 0 },
          perEngine: {},
        }

    const after: PeriodScore = afterSnapshot
      ? buildPeriodScore(afterSnapshot)
      : {
          score: { overall: 0, trust: 0, freshness: 0, authority: 0 },
          perEngine: {},
        }

    // ── Compute changes ──────────────────────────────────────────
    const scoreDelta = after.score.overall - before.score.overall

    // Build position changes by comparing per-engine scores
    const allEngines = new Set([...Object.keys(before.perEngine), ...Object.keys(after.perEngine)])
    const positionChanges = Array.from(allEngines).map((engine) => ({
      engine,
      before: before.perEngine[engine] ?? 0,
      after: after.perEngine[engine] ?? 0,
      delta: (after.perEngine[engine] ?? 0) - (before.perEngine[engine] ?? 0),
    }))

    // ── Fetch citation events in both periods for gained/lost ────
    const citationWhere: Record<string, unknown> = { domain }
    if (userId) citationWhere.userId = userId

    const beforeCitations = await db.citationEvent.findMany({
      where: {
        ...citationWhere,
        createdAt: { gte: new Date(beforeDate.getTime() - 7 * 24 * 3600000), lte: beforeDate },
      },
      orderBy: { createdAt: 'desc' },
    })

    const afterCitations = await db.citationEvent.findMany({
      where: {
        ...citationWhere,
        createdAt: { gte: new Date(afterDate.getTime() - 7 * 24 * 3600000), lte: afterDate },
      },
      orderBy: { createdAt: 'desc' },
    })

    const gained = afterCitations
      .filter((e) => e.eventType === 'cited' || e.eventType === 'first_mention' || e.eventType === 'rank_up')
      .map((e) => `${e.engine}: ${e.prompt || e.pageUrl || 'citation gained'}`)

    const lost = afterCitations
      .filter((e) => e.eventType === 'uncited' || e.eventType === 'rank_down' || e.eventType === 'competitor_overtake')
      .map((e) => `${e.engine}: ${e.prompt || e.pageUrl || 'citation lost'}`)

    // If no citation events, derive from perEngine diffs
    const finalGained = gained.length > 0
      ? gained
      : positionChanges.filter((p) => p.delta > 0).map((p) => `${p.engine} score increased by ${p.delta}`)

    const finalLost = lost.length > 0
      ? lost
      : positionChanges.filter((p) => p.delta < 0).map((p) => `${p.engine} score decreased by ${Math.abs(p.delta)}`)

    const changes: DiffChanges = {
      gained: finalGained,
      lost: finalLost,
      positionChanges,
      scoreDelta,
    }

    const summary = buildSummary(scoreDelta, finalGained, finalLost, positionChanges)

    const response: DiffResponse = {
      before,
      after,
      changes,
      summary,
      _meta: {
        status: beforeSnapshot && afterSnapshot ? (beforeSnapshot.dataSource === 'live' && afterSnapshot.dataSource === 'live' ? 'live' : 'estimated') : 'estimated',
        source: beforeSnapshot && afterSnapshot ? 'database' : 'partial',
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[ai/diff] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    const before = new URL(req.url).searchParams.get('before') || new Date(Date.now() - 30 * 24 * 3600000).toISOString()
    const after = new URL(req.url).searchParams.get('after') || new Date().toISOString()
    return NextResponse.json(buildMockDiff(domain, before, after))
  }
}
