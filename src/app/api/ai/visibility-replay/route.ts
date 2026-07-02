/**
 * AI Visibility Replay™ API
 *
 * GET  — Fetch visibility snapshots for a domain+date range, calculate score deltas & highlight moments
 * POST — Create a new ReplaySession record
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// ── GET: Fetch visibility replay frames ─────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    // Default date range: 30 days ago → now
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const fromDate = fromParam ? new Date(fromParam) : thirtyDaysAgo
    const toDate = toParam ? new Date(toParam) : now

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for from/to parameters. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Record<string, unknown> = {
      domain,
      capturedAt: {
        gte: fromDate,
        lte: toDate,
      },
    }
    if (userId) where.userId = userId

    // Fetch snapshots in chronological order
    const snapshotsResult = await safeQuery(
      (d) => d.visibilitySnapshot.findMany({
        where,
        orderBy: { capturedAt: 'asc' },
      }),
      [] as any[]
    )
    const snapshots = snapshotsResult.data

    // Build frames with score deltas
    const frames = snapshots.map((snap, idx) => {
      const prev = idx > 0 ? snapshots[idx - 1] : null
      const overallDelta = prev ? snap.overallScore - prev.overallScore : 0
      const trustDelta = prev ? snap.trustScore - prev.trustScore : 0
      const freshnessDelta = prev ? snap.freshnessScore - prev.freshnessScore : 0
      const authorityDelta = prev ? snap.authorityScore - prev.authorityScore : 0

      let perEngineDelta: Record<string, number> = {}
      if (prev) {
        try {
          const prevEngines = JSON.parse(prev.perEngine) as Record<string, number>
          const currEngines = JSON.parse(snap.perEngine) as Record<string, number>
          for (const engine of Object.keys(currEngines)) {
            perEngineDelta[engine] = (currEngines[engine] || 0) - (prevEngines[engine] || 0)
          }
        } catch {
          perEngineDelta = {}
        }
      }

      return {
        id: snap.id,
        capturedAt: snap.capturedAt,
        overallScore: snap.overallScore,
        trustScore: snap.trustScore,
        freshnessScore: snap.freshnessScore,
        authorityScore: snap.authorityScore,
        perEngine: snap.perEngine,
        dataSource: snap.dataSource,
        deltas: {
          overall: overallDelta,
          trust: trustDelta,
          freshness: freshnessDelta,
          authority: authorityDelta,
          perEngine: perEngineDelta,
        },
      }
    })

    // Identify highlight moments (biggest absolute score changes)
    const highlights = frames
      .filter((f) => Math.abs(f.deltas.overall) >= 5)
      .sort((a, b) => Math.abs(b.deltas.overall) - Math.abs(a.deltas.overall))
      .slice(0, 10)
      .map((f) => ({
        capturedAt: f.capturedAt,
        overallScore: f.overallScore,
        delta: f.deltas.overall,
        direction: f.deltas.overall > 0 ? 'up' : 'down',
        perEngine: f.perEngine,
      }))

    // Calculate score range
    const scores = snapshots.map((s) => s.overallScore)
    const scoreRange = snapshots.length > 0
      ? { min: Math.min(...scores), max: Math.max(...scores), start: scores[0], end: scores[scores.length - 1] }
      : { min: 0, max: 0, start: 0, end: 0 }

    // Build summary
    const summary = {
      totalSnapshots: snapshots.length,
      overallChange: snapshots.length >= 2
        ? snapshots[snapshots.length - 1].overallScore - snapshots[0].overallScore
        : 0,
      highlightCount: highlights.length,
      avgScore: snapshots.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
    }

    return NextResponse.json({
      domain,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      totalFrames: frames.length,
      frames,
      highlights,
      scoreRange,
      summary,
    })
  } catch (error) {
    console.error('[visibility-replay] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({
      domain: '',
      from: new Date().toISOString(),
      to: new Date().toISOString(),
      totalFrames: 0,
      frames: [],
      highlights: [],
      scoreRange: { min: 0, max: 0, start: 0, end: 0 },
      summary: { totalSnapshots: 0, overallChange: 0, highlightCount: 0, avgScore: 0 },
    })
  }
}

// ── POST: Create a ReplaySession ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, domain, title, startDate, endDate } = body

    if (!userId || !domain || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, domain, title, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startDate/endDate. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    // Count total frames from VisibilitySnapshot data in the date range
    const totalFramesResult = await safeQuery(
      (d) => d.visibilitySnapshot.count({
        where: {
          domain,
          capturedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      0
    )
    const totalFrames = totalFramesResult.data

    // Identify highlights for the session
    const snapshotsResult = await safeQuery(
      (d) => d.visibilitySnapshot.findMany({
        where: {
          domain,
          capturedAt: { gte: start, lte: end },
        },
        orderBy: { capturedAt: 'asc' },
      }),
      [] as any[]
    )
    const snapshots = snapshotsResult.data

    const highlightMoments: Array<{ capturedAt: string; delta: number; direction: string }> = []
    for (let i = 1; i < snapshots.length; i++) {
      const delta = snapshots[i].overallScore - snapshots[i - 1].overallScore
      if (Math.abs(delta) >= 5) {
        highlightMoments.push({
          capturedAt: snapshots[i].capturedAt.toISOString(),
          delta,
          direction: delta > 0 ? 'up' : 'down',
        })
      }
    }

    const sessionResult = await safeQuery(
      (d) => d.replaySession.create({
        data: {
          userId,
          domain,
          title,
          startDate: start,
          endDate: end,
          totalFrames,
          highlights: JSON.stringify(highlightMoments.slice(0, 10)),
          status: 'ready',
        },
      }),
      null as any
    )
    const session = sessionResult.data

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('[visibility-replay] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ session: null, message: 'Failed to create replay session — tables may not exist yet' })
  }
}
