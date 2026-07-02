/**
 * AI Digest Detail API — Get a specific digest with full details
 *
 * GET /api/ai/digest/[digestId]
 *
 * Returns the full digest record including parsed JSON fields:
 * - topOpportunity, engineChanges, feedHighlights
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ digestId: string }> }
) {
  try {
    const { digestId } = await params

    if (!digestId) {
      return NextResponse.json(
        { error: 'Missing digestId parameter' },
        { status: 400 }
      )
    }

    const digest = await db.emailDigest.findUnique({
      where: { id: digestId },
    })

    if (!digest) {
      return NextResponse.json(
        { error: 'Digest not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields for convenience
    let topOpportunity = null
    if (digest.topOpportunity) {
      try {
        topOpportunity = JSON.parse(digest.topOpportunity)
      } catch {
        topOpportunity = null
      }
    }

    let engineChanges = null
    if (digest.engineChanges) {
      try {
        engineChanges = JSON.parse(digest.engineChanges)
      } catch {
        engineChanges = null
      }
    }

    let feedHighlights = null
    if (digest.feedHighlights) {
      try {
        feedHighlights = JSON.parse(digest.feedHighlights)
      } catch {
        feedHighlights = null
      }
    }

    return NextResponse.json({
      id: digest.id,
      userId: digest.userId,
      domain: digest.domain,
      digestType: digest.digestType,
      subject: digest.subject,
      scoreBefore: digest.scoreBefore,
      scoreAfter: digest.scoreAfter,
      scoreDelta: digest.scoreDelta,
      citationsGained: digest.citationsGained,
      citationsLost: digest.citationsLost,
      newOpportunities: digest.newOpportunities,
      topOpportunity,
      engineChanges,
      feedHighlights,
      status: digest.status,
      sentAt: digest.sentAt?.toISOString() ?? null,
      createdAt: digest.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[ai/digest/[digestId]] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digest' },
      { status: 500 }
    )
  }
}
