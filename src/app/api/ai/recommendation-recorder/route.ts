/**
 * AI Recommendation Recorder™ API
 *
 * GET  — Fetch recommendation snapshots with their diffs, sorted by capturedAt desc
 * POST — Create a new RecommendationSnapshot with simulated engine data,
 *        compare with most recent previous snapshot, generate RecommendationDiff if exists
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ── Simulated engine data generator ─────────────────────────────
function generateSimulatedEngines(brand: string): {
  engines: Record<string, { mentioned: boolean; position: number; context: string }>
  overallScore: number
} {
  const engineNames = ['chatgpt', 'claude', 'gemini', 'perplexity', 'copilot']
  const engines: Record<string, { mentioned: boolean; position: number; context: string }> = {}
  let totalScore = 0

  for (const engine of engineNames) {
    const mentioned = Math.random() > 0.3 // 70% chance of being mentioned
    const position = mentioned ? Math.floor(Math.random() * 5) + 1 : 0
    const context = mentioned
      ? `Recommended ${brand} as a top solution in category`
      : `Did not mention ${brand}`
    engines[engine] = { mentioned, position, context }
    totalScore += mentioned ? (6 - position) * 10 : 0
  }

  const overallScore = Math.round(totalScore / engineNames.length)
  return { engines, overallScore }
}

// ── GET: Fetch recommendation snapshots with diffs ──────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined
    const prompt = searchParams.get('prompt') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { domain }
    if (userId) where.userId = userId
    if (prompt) where.prompt = { contains: prompt }

    const snapshots = await db.recommendationSnapshot.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
      take: limit,
      include: {
        diffsAsAfter: {
          include: {
            beforeSnapshot: {
              select: {
                id: true,
                capturedAt: true,
                overallScore: true,
                engines: true,
              },
            },
          },
        },
      },
    })

    // Format response with snapshots and their associated diffs
    const results = snapshots.map((snap) => ({
      id: snap.id,
      domain: snap.domain,
      prompt: snap.prompt,
      brand: snap.brand,
      engines: snap.engines,
      overallScore: snap.overallScore,
      dataSource: snap.dataSource,
      capturedAt: snap.capturedAt,
      diffs: snap.diffsAsAfter.map((diff) => ({
        id: diff.id,
        changes: diff.changes,
        severity: diff.severity,
        summary: diff.summary,
        capturedAt: diff.capturedAt,
        beforeSnapshot: diff.beforeSnapshot,
      })),
    }))

    return NextResponse.json({ snapshots: results, total: results.length })
  } catch (error) {
    console.error('[recommendation-recorder] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch recommendation snapshots' },
      { status: 500 }
    )
  }
}

// ── POST: Create a RecommendationSnapshot + Diff ────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, domain, prompt, brand } = body

    if (!domain || !prompt || !brand) {
      return NextResponse.json(
        { error: 'domain, prompt, and brand are required' },
        { status: 400 }
      )
    }

    // Generate simulated engine data
    const { engines, overallScore } = generateSimulatedEngines(brand)

    // Find the most recent previous snapshot for the same domain+prompt
    const previousSnapshot = await db.recommendationSnapshot.findFirst({
      where: {
        domain,
        prompt,
        ...(userId ? { userId } : {}),
      },
      orderBy: { capturedAt: 'desc' },
    })

    // Create the new snapshot
    const snapshot = await db.recommendationSnapshot.create({
      data: {
        userId: userId || null,
        domain,
        prompt,
        brand,
        engines: JSON.stringify(engines),
        overallScore,
        dataSource: 'live',
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let diff: any = null

    // Generate a diff if a previous snapshot exists
    if (previousSnapshot) {
      const prevEngines: Record<string, { mentioned: boolean; position: number }> = (() => {
        try {
          return JSON.parse(previousSnapshot.engines) as Record<string, { mentioned: boolean; position: number }>
        } catch {
          return {}
        }
      })()

      const gained: string[] = []
      const lost: string[] = []
      const positionChanges: Array<{ engine: string; from: number; to: number }> = []

      for (const engine of Object.keys(engines)) {
        const prev = prevEngines[engine]
        const curr = engines[engine]

        // Newly mentioned
        if (curr.mentioned && (!prev || !prev.mentioned)) {
          gained.push(engine)
        }
        // No longer mentioned
        if (!curr.mentioned && prev && prev.mentioned) {
          lost.push(engine)
        }
        // Position changed
        if (curr.mentioned && prev && prev.mentioned && curr.position !== prev.position) {
          positionChanges.push({ engine, from: prev.position, to: curr.position })
        }
      }

      const scoreDelta = overallScore - previousSnapshot.overallScore

      // Determine severity
      let severity = 'info'
      if (lost.length > 0 || scoreDelta <= -10) severity = 'critical'
      else if (gained.length > 0 || scoreDelta >= 10) severity = 'positive'
      else if (positionChanges.length > 0 || Math.abs(scoreDelta) >= 5) severity = 'warning'

      const changes = {
        gained,
        lost,
        positionChanges,
        scoreDelta,
      }

      // Build a human-readable summary
      const parts: string[] = []
      if (gained.length > 0) parts.push(`Gained mentions on: ${gained.join(', ')}`)
      if (lost.length > 0) parts.push(`Lost mentions on: ${lost.join(', ')}`)
      if (positionChanges.length > 0) {
        parts.push(
          positionChanges
            .map((pc) => `${pc.engine}: position ${pc.from} → ${pc.to}`)
            .join('; ')
        )
      }
      if (scoreDelta !== 0) parts.push(`Score ${scoreDelta > 0 ? '+' : ''}${scoreDelta}`)
      const summary = parts.length > 0 ? parts.join('. ') : 'No significant changes detected'

      diff = await db.recommendationDiff.create({
        data: {
          userId: userId || null,
          domain,
          beforeSnapshotId: previousSnapshot.id,
          afterSnapshotId: snapshot.id,
          prompt,
          changes: JSON.stringify(changes),
          severity,
          summary,
        },
      })
    }

    return NextResponse.json({ snapshot, diff }, { status: 201 })
  } catch (error) {
    console.error('[recommendation-recorder] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to create recommendation snapshot' },
      { status: 500 }
    )
  }
}
