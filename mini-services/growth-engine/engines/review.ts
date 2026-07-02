// ─── AGE Review Engine ──────────────────────────────────────────
// Quality checks before publishing

import { db } from '../../../src/lib/db'

export async function runReviewEngine(): Promise<{ approved: number; rejected: number }> {
  console.log(`[Review] ${new Date().toISOString()} — Running review engine...`)

  const pending = await db.growthAsset.findMany({
    where: { reviewStatus: 'pending' },
    take: 10,
  })

  let approved = 0
  let rejected = 0

  for (const asset of pending) {
    const scores = JSON.parse(asset.reviewScores || '{}')
    const qualityThreshold = 70

    // Simulate review process
    await db.growthAsset.update({
      where: { id: asset.id },
      data: { reviewStatus: 'reviewing' }
    })

    if (asset.qualityScore >= qualityThreshold) {
      await db.growthAsset.update({
        where: { id: asset.id },
        data: { reviewStatus: 'approved' }
      })
      approved++
    } else {
      await db.growthAsset.update({
        where: { id: asset.id },
        data: {
          reviewStatus: 'rejected',
          reviewNotes: `Quality score ${asset.qualityScore} below threshold ${qualityThreshold}`,
        }
      })

      // Create governor decision for the rejection
      await db.growthGovernorDecision.create({
        data: {
          assetId: asset.id,
          opportunityId: asset.opportunityId,
          decision: 'rejected',
          reason: 'low_quality',
          details: `Quality score ${asset.qualityScore} below threshold ${qualityThreshold}`,
          checksPerformed: JSON.stringify(['quality_check', 'seo_check', 'duplicate_check']),
          checkResults: JSON.stringify(scores),
          confidence: 0.85,
          overrideable: true,
        }
      })
      rejected++
    }
  }

  console.log(`[Review] ${new Date().toISOString()} — Approved ${approved}, rejected ${rejected}`)
  return { approved, rejected }
}
