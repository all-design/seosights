import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─── Types ──────────────────────────────────────────────────────────────

interface PerEngine {
  chatgpt?: number
  claude?: number
  gemini?: number
  perplexity?: number
  copilot?: number
  [key: string]: number | undefined
}

interface HighlightMoment {
  timestamp: string
  label: string
  scoreDelta: number
  type: 'jump' | 'drop' | 'engine_shift'
  details: string
  engine?: string
}

interface SnapshotFrame {
  id: string
  capturedAt: string
  overallScore: number
  trustScore: number
  freshnessScore: number
  authorityScore: number
  perEngine: PerEngine
  dataSource: string
  scoreDelta: number | null
}

interface ReplaySessionDetail {
  id: string
  userId: string
  domain: string
  title: string
  startDate: string
  endDate: string
  totalFrames: number
  highlights: HighlightMoment[]
  status: string
  createdAt: string
  frames: SnapshotFrame[]
  scoreRange: {
    min: number
    max: number
    start: number
    end: number
  }
  summary: {
    totalChange: number
    avgDailyChange: number
    bestEngine: string
    worstEngine: string
    volatility: number
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Safely parse the perEngine JSON field from VisibilitySnapshot */
function parsePerEngine(raw: string): PerEngine {
  try {
    return JSON.parse(raw) as PerEngine
  } catch {
    return {}
  }
}

/** Compute volatility (standard deviation of frame-to-frame deltas) */
function computeVolatility(frames: SnapshotFrame[]): number {
  if (frames.length < 2) return 0
  const deltas = frames.slice(1).map((f, i) => f.overallScore - frames[i].overallScore)
  const mean = deltas.reduce((s, d) => s + d, 0) / deltas.length
  const variance = deltas.reduce((s, d) => s + (d - mean) ** 2, 0) / deltas.length
  return Math.round(Math.sqrt(variance) * 100) / 100
}

/** Find best/worst engine from the last frame */
function findBestWorstEngine(frames: SnapshotFrame[]): { best: string; worst: string } {
  if (frames.length === 0) return { best: 'N/A', worst: 'N/A' }
  const lastFrame = frames[frames.length - 1]
  const engines = Object.entries(lastFrame.perEngine)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
  return {
    best: engines.length > 0 ? engines[0][0] : 'N/A',
    worst: engines.length > 0 ? engines[engines.length - 1][0] : 'N/A',
  }
}

// ─── GET /api/ai/visibility-replay/[sessionId] ──────────────────────────
// Gets a specific replay session with its full data.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid sessionId' },
        { status: 400 }
      )
    }

    // Fetch the session
    const session = await db.replaySession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Replay session not found' },
        { status: 404 }
      )
    }

    // Parse stored highlights
    let highlights: HighlightMoment[] = []
    try {
      highlights = session.highlights ? (JSON.parse(session.highlights) as HighlightMoment[]) : []
    } catch {
      highlights = []
    }

    // Fetch the full snapshot data for this session's date range & domain
    const snapshots = await db.visibilitySnapshot.findMany({
      where: {
        domain: session.domain,
        capturedAt: { gte: session.startDate, lte: session.endDate },
      },
      orderBy: { capturedAt: 'asc' },
    })

    // Build frames with score deltas
    const frames: SnapshotFrame[] = snapshots.map((snap, idx) => {
      const perEngine = parsePerEngine(snap.perEngine)
      const prevScore = idx > 0 ? snapshots[idx - 1].overallScore : null
      return {
        id: snap.id,
        capturedAt: snap.capturedAt.toISOString(),
        overallScore: snap.overallScore,
        trustScore: snap.trustScore,
        freshnessScore: snap.freshnessScore,
        authorityScore: snap.authorityScore,
        perEngine,
        dataSource: snap.dataSource,
        scoreDelta: prevScore !== null ? snap.overallScore - prevScore : null,
      }
    })

    // Compute score range
    const scores = frames.map((f) => f.overallScore)
    const scoreRange = {
      min: scores.length > 0 ? Math.min(...scores) : 0,
      max: scores.length > 0 ? Math.max(...scores) : 0,
      start: scores.length > 0 ? scores[0] : 0,
      end: scores.length > 0 ? scores[scores.length - 1] : 0,
    }

    // Compute summary stats
    const totalChange = scoreRange.end - scoreRange.start
    const daySpan = Math.max(
      1,
      Math.ceil(
        (session.endDate.getTime() - session.startDate.getTime()) / (24 * 3600_000)
      )
    )
    const avgDailyChange = Math.round((totalChange / daySpan) * 100) / 100
    const { best, worst } = findBestWorstEngine(frames)
    const volatility = computeVolatility(frames)

    const response: ReplaySessionDetail = {
      id: session.id,
      userId: session.userId,
      domain: session.domain,
      title: session.title,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
      totalFrames: session.totalFrames,
      highlights,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      frames,
      scoreRange,
      summary: {
        totalChange,
        avgDailyChange,
        bestEngine: best,
        worstEngine: worst,
        volatility,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error(
      '[visibility-replay/:sessionId] GET error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    return NextResponse.json(
      { error: 'Failed to fetch replay session' },
      { status: 500 }
    )
  }
}
