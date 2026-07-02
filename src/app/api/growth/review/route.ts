/**
 * Growth Engine — Review
 *
 * GET /api/growth/review
 * Returns GrowthAsset records needing review (pending or reviewing status),
 * including review scores and quality data.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // ── 1. Items needing review ──────────────────────────────────────────
    const pendingReview = await db.growthAsset.findMany({
      where: {
        reviewStatus: { in: ['pending', 'reviewing'] },
      },
      orderBy: [
        { reviewStatus: 'asc' },  // 'pending' first, then 'reviewing'
        { qualityScore: 'desc' },
      ],
      include: {
        opportunity: true,
      },
    })

    // ── 2. Review statistics ─────────────────────────────────────────────
    const [
      totalPending,
      totalReviewing,
      approvedToday,
      rejectedToday,
      avgQualityScore,
    ] = await Promise.all([
      db.growthAsset.count({ where: { reviewStatus: 'pending' } }),
      db.growthAsset.count({ where: { reviewStatus: 'reviewing' } }),
      db.growthAsset.count({
        where: {
          reviewStatus: 'approved',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      db.growthAsset.count({
        where: {
          reviewStatus: 'rejected',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      db.growthAsset.aggregate({
        _avg: { qualityScore: true },
        where: { reviewStatus: { in: ['pending', 'reviewing'] } },
      }),
    ])

    // ── 3. Quality score distribution ────────────────────────────────────
    const qualityBuckets = {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      fair: 0,      // 50-69
      poor: 0,      // 0-49
    }

    for (const asset of pendingReview) {
      if (asset.qualityScore >= 90) qualityBuckets.excellent++
      else if (asset.qualityScore >= 70) qualityBuckets.good++
      else if (asset.qualityScore >= 50) qualityBuckets.fair++
      else qualityBuckets.poor++
    }

    return NextResponse.json({
      items: pendingReview,
      stats: {
        totalPending,
        totalReviewing,
        approvedToday,
        rejectedToday,
        avgQualityScore: Math.round((avgQualityScore._avg.qualityScore || 0) * 10) / 10,
      },
      qualityBuckets,
    })
  } catch (error) {
    console.error('[Growth Review] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review data' },
      { status: 500 }
    )
  }
}
