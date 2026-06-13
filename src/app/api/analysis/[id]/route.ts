import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analysis/[id]
 *
 * Returns a completed analysis by ID.
 * Used by the frontend as a fallback when the completion signal
 * (WebSocket or SSE) is missed but the analysis is in the database.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const analysisRecord = await db.analysis.findUnique({
      where: { id },
    })

    if (!analysisRecord) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    let analysis = null
    if (analysisRecord.result) {
      try {
        analysis = JSON.parse(analysisRecord.result)
      } catch {
        analysis = null
      }
    }

    return NextResponse.json({
      id: analysisRecord.id,
      url: analysisRecord.url,
      domain: analysisRecord.domain,
      market: analysisRecord.market,
      status: analysisRecord.status,
      mode: analysisRecord.mode,
      createdAt: analysisRecord.createdAt.toISOString(),
      updatedAt: analysisRecord.updatedAt.toISOString(),
      analysis,
    })
  } catch (error) {
    console.error('[analysis/id] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({
      error: 'Failed to fetch analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
