/**
 * Growth Engine — Generation Status
 *
 * GET /api/growth/generation
 * Returns currently generating opportunities, the generation queue,
 * and recently generated assets.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Currently generating ──────────────────────────────────────────
    const currentlyGenerating = await db.growthOpportunity.findMany({
      where: { status: 'generating' },
      orderBy: [{ priority: 'asc' }, { growthScore: 'desc' }],
    })

    // ── 2. Queue of next opportunities ───────────────────────────────────
    const queue = await db.growthOpportunity.findMany({
      where: { status: 'queued' },
      orderBy: [{ priority: 'asc' }, { growthScore: 'desc' }],
      take: 20,
    })

    // ── 3. Recently generated assets (last 10) ───────────────────────────
    const recentlyGenerated = await db.growthAsset.findMany({
      where: {
        reviewStatus: { in: ['pending', 'reviewing', 'approved', 'rejected', 'needs_revision'] },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // ── 4. Generation statistics ─────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [generatedToday, avgGenerationTime] = await Promise.all([
      db.growthOpportunity.count({
        where: {
          status: { in: ['reviewing', 'approved', 'published'] },
          startedAt: { gte: today },
        },
      }),
      db.growthOpportunity.aggregate({
        _avg: { confidence: true },
        where: {
          status: { in: ['reviewing', 'approved', 'published'] },
          startedAt: { gte: today },
        },
      }),
    ])

    return NextResponse.json({
      currentlyGenerating,
      queue,
      recentlyGenerated,
      stats: {
        generating: currentlyGenerating.length,
        queued: queue.length,
        generatedToday,
        avgConfidence: Math.round((avgGenerationTime._avg.confidence || 0) * 100),
      },
    })
  } catch (error) {
    console.error('[Growth Generation] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation data' },
      { status: 500 }
    )
  }
}
