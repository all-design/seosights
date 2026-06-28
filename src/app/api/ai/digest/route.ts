/**
 * Email Digest API — "What changed overnight?"
 *
 * GET  — Fetch EmailDigest records sorted by createdAt desc
 * POST — Create a new EmailDigest by fetching VisibilitySnapshots,
 *         CitationEvents, FeedItems, ActionItems for the period
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

const VALID_DIGEST_TYPES = ['overnight', 'weekly', 'monthly']

/**
 * Get the date range for a digest type
 */
function getDateRangeForDigestType(digestType: string): { from: Date; to: Date } {
  const now = new Date()
  const from = new Date(now)

  switch (digestType) {
    case 'overnight':
      from.setDate(from.getDate() - 1)
      break
    case 'weekly':
      from.setDate(from.getDate() - 7)
      break
    case 'monthly':
      from.setMonth(from.getMonth() - 1)
      break
    default:
      from.setDate(from.getDate() - 1)
  }

  return { from, to: now }
}

/**
 * Build a subject line for the digest
 */
function buildSubject(
  digestType: string,
  domain: string,
  scoreDelta: number,
  citationsGained: number
): string {
  const typeLabel = digestType === 'overnight' ? 'Daily' : digestType === 'weekly' ? 'Weekly' : 'Monthly'

  const deltaStr = scoreDelta > 0
    ? `↑ +${scoreDelta}`
    : scoreDelta < 0
      ? `↓ ${scoreDelta}`
      : '→ No change'

  const citationStr = citationsGained > 0 ? ` | ${citationsGained} new citation${citationsGained > 1 ? 's' : ''}` : ''

  return `[seosights] ${typeLabel} Digest for ${domain} — AI Visibility ${deltaStr}${citationStr}`
}

// ── GET: Fetch EmailDigest records ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId') || undefined
    const digestType = searchParams.get('digestType') || undefined
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (digestType && !VALID_DIGEST_TYPES.includes(digestType)) {
      return NextResponse.json(
        { error: `digestType must be one of: ${VALID_DIGEST_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {}
    if (domain) where.domain = domain
    if (userId) where.userId = userId
    if (digestType) where.digestType = digestType

    const digests = await safeQuery(
      (d) => d.emailDigest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      []
    )

    return NextResponse.json({ digests, total: digests.length })
  } catch (error) {
    console.error('[digest] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ digests: [], total: 0 })
  }
}

// ── POST: Create an EmailDigest ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, domain, digestType } = body

    if (!userId || !domain || !digestType) {
      return NextResponse.json(
        { error: 'userId, domain, and digestType are required' },
        { status: 400 }
      )
    }

    if (!VALID_DIGEST_TYPES.includes(digestType)) {
      return NextResponse.json(
        { error: `digestType must be one of: ${VALID_DIGEST_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const { from, to } = getDateRangeForDigestType(digestType)

    // ── Fetch VisibilitySnapshots for the period ────────────────
    const snapshots = await safeQuery(
      (d) => d.visibilitySnapshot.findMany({
        where: {
          domain,
          capturedAt: { gte: from, lte: to },
        },
        orderBy: { capturedAt: 'asc' },
      }),
      [] as any[]
    )

    const scoreBefore = snapshots.length > 0 ? snapshots[0].overallScore : 0
    const scoreAfter = snapshots.length > 0 ? snapshots[snapshots.length - 1].overallScore : 0
    const scoreDelta = scoreAfter - scoreBefore

    // ── Fetch CitationEvents for the period ─────────────────────
    const citationEvents = await safeQuery(
      (d) => d.citationEvent.findMany({
        where: {
          domain,
          createdAt: { gte: from, lte: to },
        },
      }),
      [] as any[]
    )

    const citationsGained = citationEvents.filter(
      (e) => e.eventType === 'cited' || e.eventType === 'first_mention' || e.eventType === 'rank_up'
    ).length

    const citationsLost = citationEvents.filter(
      (e) => e.eventType === 'uncited' || e.eventType === 'rank_down' || e.eventType === 'competitor_overtake'
    ).length

    // ── Fetch FeedItems for the period ──────────────────────────
    const feedItems = await safeQuery(
      (d) => d.feedItem.findMany({
        where: {
          domain,
          createdAt: { gte: from, lte: to },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      [] as any[]
    )

    const feedHighlights = feedItems.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      title: item.title,
      severity: item.severity,
      createdAt: item.createdAt,
    }))

    // ── Fetch ActionItems (new opportunities) for the period ────
    const actionItems = await safeQuery(
      (d) => d.actionItem.findMany({
        where: {
          domain,
          userId,
          createdAt: { gte: from, lte: to },
          status: { in: ['pending', 'queued'] },
        },
        orderBy: { roiScore: 'desc' },
        take: 5,
      }),
      [] as any[]
    )

    const newOpportunities = actionItems.length
    const topOpportunity = actionItems.length > 0
      ? {
          id: actionItems[0].id,
          title: actionItems[0].title,
          actionType: actionItems[0].actionType,
          priority: actionItems[0].priority,
          estimatedScoreGain: actionItems[0].estimatedScoreGain,
          roiScore: actionItems[0].roiScore,
        }
      : null

    // ── Build engine changes summary ────────────────────────────
    const engineChanges: Record<string, { gained: number; lost: number }> = {}
    for (const event of citationEvents) {
      if (!engineChanges[event.engine]) {
        engineChanges[event.engine] = { gained: 0, lost: 0 }
      }
      if (event.eventType === 'cited' || event.eventType === 'first_mention') {
        engineChanges[event.engine].gained++
      }
      if (event.eventType === 'uncited') {
        engineChanges[event.engine].lost++
      }
    }

    // ── Build subject line ──────────────────────────────────────
    const subject = buildSubject(digestType, domain, scoreDelta, citationsGained)

    // ── Create the EmailDigest record ───────────────────────────
    const digest = await safeQuery(
      (d) => d.emailDigest.create({
        data: {
          userId,
          domain,
          digestType,
          subject,
          scoreBefore,
          scoreAfter,
          scoreDelta,
          citationsGained,
          citationsLost,
          newOpportunities,
          topOpportunity: topOpportunity ? JSON.stringify(topOpportunity) : null,
          engineChanges: Object.keys(engineChanges).length > 0 ? JSON.stringify(engineChanges) : null,
          feedHighlights: feedHighlights.length > 0 ? JSON.stringify(feedHighlights) : null,
          status: 'pending',
        },
      }),
      null as any
    )

    return NextResponse.json({ digest }, { status: 201 })
  } catch (error) {
    console.error('[digest] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ digest: null, message: 'Failed to create email digest — tables may not exist yet' })
  }
}
