import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analysis/[id]
 *
 * Fetch an analysis record by ID.
 * Used by the queue-based flow to retrieve completed analysis results.
 *
 * Response:
 * {
 *   id: string,
 *   status: 'queued' | 'running' | 'completed' | 'failed',
 *   url: string,
 *   domain: string,
 *   market: string,
 *   mode: string,
 *   result: object | null,  // Parsed from JSON string in DB
 *   createdAt: string,
 *   updatedAt: string
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const analysis = await db.analysis.findUnique({
      where: { id },
      include: {
        agentLogs: {
          select: {
            agentId: true,
            agentName: true,
            status: true,
            tokensUsed: true,
            costUsd: true,
            model: true,
            startedAt: true,
            completedAt: true,
          },
          orderBy: { startedAt: 'asc' },
        },
      },
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Parse the JSON result if present
    let parsedResult = null
    if (analysis.result) {
      try {
        parsedResult = JSON.parse(analysis.result)
      } catch {
        parsedResult = null
      }
    }

    return NextResponse.json({
      id: analysis.id,
      status: analysis.status,
      url: analysis.url,
      domain: analysis.domain,
      market: analysis.market,
      mode: analysis.mode,
      analysis: parsedResult,
      agentLogs: analysis.agentLogs,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    })

  } catch (error) {
    console.error('[analysis/id] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}
