/**
 * Cron API — Generate Overnight Digests for All Active Users
 *
 * POST /api/cron/digest
 *
 * Finds all users with visibility snapshots in the last 24 hours
 * and generates an "overnight" digest for each active domain.
 * Returns generation stats.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ── GET: Vercel Cron Jobs support (delegates to POST) ──────────
export async function GET() {
  return POST(new NextRequest('https://localhost/api/cron/digest'))
}

// ── POST: Generate overnight digests for all active users ───────
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    // Find all distinct userId+domain pairs with recent visibility snapshots
    // This indicates "active" users who have monitoring set up
    const activePairs = await db.visibilitySnapshot.findMany({
      where: {
        capturedAt: { gte: yesterday },
      },
      select: {
        userId: true,
        domain: true,
      },
      distinct: ['userId', 'domain'],
    })

    // Filter out null userIds
    const validPairs = activePairs.filter((p) => p.userId !== null) as Array<{
      userId: string
      domain: string
    }>

    if (validPairs.length === 0) {
      return NextResponse.json({
        message: 'No active users found for overnight digest generation',
        generated: 0,
        skipped: 0,
        failed: 0,
      })
    }

    let generated = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const pair of validPairs) {
      try {
        // Check if a digest was already generated for this user+domain today
        const existingDigest = await db.emailDigest.findFirst({
          where: {
            userId: pair.userId,
            domain: pair.domain,
            digestType: 'overnight',
            createdAt: { gte: yesterday },
          },
        })

        if (existingDigest) {
          skipped++
          continue
        }

        // ── Fetch data for the digest ───────────────────────────

        // Visibility snapshots from the last 24h
        const snapshots = await db.visibilitySnapshot.findMany({
          where: {
            domain: pair.domain,
            capturedAt: { gte: yesterday, lte: now },
          },
          orderBy: { capturedAt: 'asc' },
        })

        const scoreBefore = snapshots.length > 0 ? snapshots[0].overallScore : 0
        const scoreAfter = snapshots.length > 0 ? snapshots[snapshots.length - 1].overallScore : 0
        const scoreDelta = scoreAfter - scoreBefore

        // Citation events from the last 24h
        const citationEvents = await db.citationEvent.findMany({
          where: {
            domain: pair.domain,
            createdAt: { gte: yesterday, lte: now },
          },
        })

        const citationsGained = citationEvents.filter(
          (e) => e.eventType === 'cited' || e.eventType === 'first_mention' || e.eventType === 'rank_up'
        ).length

        const citationsLost = citationEvents.filter(
          (e) => e.eventType === 'uncited' || e.eventType === 'rank_down' || e.eventType === 'competitor_overtake'
        ).length

        // Feed items from the last 24h
        const feedItems = await db.feedItem.findMany({
          where: {
            domain: pair.domain,
            createdAt: { gte: yesterday, lte: now },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })

        const feedHighlights = feedItems.map((item) => ({
          id: item.id,
          itemType: item.itemType,
          title: item.title,
          severity: item.severity,
          createdAt: item.createdAt,
        }))

        // Action items (new opportunities) from the last 24h
        const actionItems = await db.actionItem.findMany({
          where: {
            domain: pair.domain,
            userId: pair.userId,
            createdAt: { gte: yesterday, lte: now },
            status: { in: ['pending', 'queued'] },
          },
          orderBy: { roiScore: 'desc' },
          take: 5,
        })

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

        // Engine changes summary
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

        // Build subject line
        const deltaStr = scoreDelta > 0
          ? `↑ +${scoreDelta}`
          : scoreDelta < 0
            ? `↓ ${scoreDelta}`
            : '→ No change'
        const citationStr = citationsGained > 0
          ? ` | ${citationsGained} new citation${citationsGained > 1 ? 's' : ''}`
          : ''
        const subject = `[seosights] Daily Digest for ${pair.domain} — AI Visibility ${deltaStr}${citationStr}`

        // Create the digest
        await db.emailDigest.create({
          data: {
            userId: pair.userId,
            domain: pair.domain,
            digestType: 'overnight',
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
        })

        generated++
      } catch (pairError) {
        failed++
        const msg = pairError instanceof Error ? pairError.message : 'Unknown error'
        errors.push(`${pair.userId}/${pair.domain}: ${msg}`)
        console.error(`[cron/digest] Error generating digest for ${pair.userId}/${pair.domain}:`, msg)
      }
    }

    console.log(
      `[cron/digest] Overnight digest generation complete: ${generated} generated, ${skipped} skipped, ${failed} failed`
    )

    return NextResponse.json({
      message: 'Overnight digest generation complete',
      generated,
      skipped,
      failed,
      totalActivePairs: validPairs.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[cron/digest] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to generate overnight digests' },
      { status: 500 }
    )
  }
}
