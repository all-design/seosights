import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { DataStatus } from '@/lib/ai-router'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngineResult {
  mentioned: boolean
  position: number | null
  totalPositions: number | null
  confidence: number
  snippet: string | null
  competitors: string[]
  sources: string[]
  reason: string
}

interface EnginesMap {
  [engine: string]: EngineResult
}

interface DiffChange {
  type: 'gained' | 'lost' | 'position_up' | 'position_down' | 'score_change' | 'competitor_change' | 'confidence_change'
  engine: string
  detail: string
  before?: unknown
  after?: unknown
}

interface DiffResult {
  gained: Array<{ engine: string; detail: string }>
  lost: Array<{ engine: string; detail: string }>
  positionChanges: Array<{ engine: string; direction: 'up' | 'down'; from: number; to: number; detail: string }>
  scoreDelta: number
  confidenceChanges: Array<{ engine: string; direction: 'up' | 'down'; from: number; to: number }>
  competitorChanges: Array<{ engine: string; added: string[]; removed: string[] }>
}

// ─── Helper: Build per-engine change highlights ──────────────────────────────

interface EngineComparison {
  engine: string
  beforeMentioned: boolean
  afterMentioned: boolean
  beforePosition: number | null
  afterPosition: number | null
  beforeConfidence: number
  afterConfidence: number
  beforeCompetitors: string[]
  afterCompetitors: string[]
  addedCompetitors: string[]
  removedCompetitors: string[]
  status: 'gained' | 'lost' | 'improved' | 'declined' | 'unchanged'
}

function buildEngineComparisons(before: EnginesMap, after: EnginesMap): EngineComparison[] {
  const allEngines = new Set([...Object.keys(before), ...Object.keys(after)])
  const comparisons: EngineComparison[] = []

  for (const engine of allEngines) {
    const b = before[engine]
    const a = after[engine]

    // If engine only exists in one snapshot, skip
    if (!b || !a) continue

    const addedCompetitors = (a.competitors || []).filter(c => !(b.competitors || []).includes(c))
    const removedCompetitors = (b.competitors || []).filter(c => !(a.competitors || []).includes(c))

    let status: EngineComparison['status'] = 'unchanged'

    if (!b.mentioned && a.mentioned) {
      status = 'gained'
    } else if (b.mentioned && !a.mentioned) {
      status = 'lost'
    } else if (b.mentioned && a.mentioned) {
      // Both mentioned — check position change
      if (b.position !== null && a.position !== null) {
        if (a.position < b.position) {
          status = 'improved'
        } else if (a.position > b.position) {
          status = 'declined'
        }
      }
      // Check confidence change
      if (status === 'unchanged' && Math.abs(a.confidence - b.confidence) >= 10) {
        status = a.confidence > b.confidence ? 'improved' : 'declined'
      }
    }

    comparisons.push({
      engine,
      beforeMentioned: b.mentioned,
      afterMentioned: a.mentioned,
      beforePosition: b.position,
      afterPosition: a.position,
      beforeConfidence: b.confidence,
      afterConfidence: a.confidence,
      beforeCompetitors: b.competitors || [],
      afterCompetitors: a.competitors || [],
      addedCompetitors,
      removedCompetitors,
      status,
    })
  }

  // Sort: lost first, then declined, gained, improved, unchanged
  const statusOrder: Record<string, number> = { lost: 0, declined: 1, gained: 2, improved: 3, unchanged: 4 }
  comparisons.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5))

  return comparisons
}

// ─── GET: Get a specific diff with full before/after data ─────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ diffId: string }> },
) {
  try {
    const { diffId } = await params

    if (!diffId) {
      return NextResponse.json(
        { error: 'Missing diff ID' },
        { status: 400 },
      )
    }

    // Fetch the diff record
    const diff = await db.recommendationDiff.findUnique({
      where: { id: diffId },
    })

    if (!diff) {
      return NextResponse.json(
        { error: 'Diff not found' },
        { status: 404 },
      )
    }

    // Fetch both snapshots in parallel
    const [beforeSnapshot, afterSnapshot] = await Promise.all([
      db.recommendationSnapshot.findUnique({
        where: { id: diff.beforeSnapshotId },
      }),
      db.recommendationSnapshot.findUnique({
        where: { id: diff.afterSnapshotId },
      }),
    ])

    if (!beforeSnapshot || !afterSnapshot) {
      return NextResponse.json(
        { error: 'Referenced snapshots not found' },
        { status: 404 },
      )
    }

    // Parse engine data
    const beforeEngines: EnginesMap = JSON.parse(beforeSnapshot.engines)
    const afterEngines: EnginesMap = JSON.parse(afterSnapshot.engines)
    const changes: DiffResult = JSON.parse(diff.changes)

    // Build detailed per-engine comparisons
    const engineComparisons = buildEngineComparisons(beforeEngines, afterEngines)

    return NextResponse.json({
      diff: {
        id: diff.id,
        userId: diff.userId,
        domain: diff.domain,
        beforeSnapshotId: diff.beforeSnapshotId,
        afterSnapshotId: diff.afterSnapshotId,
        prompt: diff.prompt,
        changes,
        severity: diff.severity,
        summary: diff.summary,
        capturedAt: diff.capturedAt,
      },
      before: {
        id: beforeSnapshot.id,
        userId: beforeSnapshot.userId,
        domain: beforeSnapshot.domain,
        prompt: beforeSnapshot.prompt,
        brand: beforeSnapshot.brand,
        engines: beforeEngines,
        overallScore: beforeSnapshot.overallScore,
        dataSource: beforeSnapshot.dataSource,
        capturedAt: beforeSnapshot.capturedAt,
      },
      after: {
        id: afterSnapshot.id,
        userId: afterSnapshot.userId,
        domain: afterSnapshot.domain,
        prompt: afterSnapshot.prompt,
        brand: afterSnapshot.brand,
        engines: afterEngines,
        overallScore: afterSnapshot.overallScore,
        dataSource: afterSnapshot.dataSource,
        capturedAt: afterSnapshot.capturedAt,
      },
      engineComparisons,
      scoreDelta: afterSnapshot.overallScore - beforeSnapshot.overallScore,
      _meta: {
        status: 'live' as DataStatus,
        model: 'database',
        provider: 'database',
        latencyMs: 0,
      },
    })
  } catch (err) {
    console.error('[recommendation-recorder/diff] GET error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch diff details' },
      { status: 500 },
    )
  }
}
