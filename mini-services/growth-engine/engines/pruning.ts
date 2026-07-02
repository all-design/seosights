// ─── AGE Self-Pruning Engine ──────────────────────────────────────────
// Identifies and handles underperforming assets

import { db } from '../../../src/lib/db'

export async function runPruningEngine(): Promise<{ pruned: number }> {
  console.log(`[Pruning] ${new Date().toISOString()} — Running pruning engine...`)

  // Find assets older than 30 days with low performance
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const candidates = await db.growthAsset.findMany({
    where: {
      publishedAt: { lt: thirtyDaysAgo },
      isUnderperforming: false,
      executionStatus: 'indexed',
    },
    take: 20,
  })

  let pruned = 0

  for (const asset of candidates) {
    const isUnderperforming = asset.traffic24h < 10 && asset.citations7d < 1

    if (isUnderperforming) {
      await db.growthAsset.update({
        where: { id: asset.id },
        data: { isUnderperforming: true, lastPrunedAt: new Date() }
      })

      // Determine action
      let action: string
      let reason: string

      if (asset.traffic24h === 0 && asset.citations7d === 0) {
        action = 'archive'
        reason = 'low_traffic'
      } else if (asset.traffic24h < 5) {
        action = 'merge'
        reason = 'low_citations'
      } else {
        action = 'rewrite'
        reason = 'negative_trend'
      }

      await db.growthPruningAction.create({
        data: {
          assetId: asset.id,
          traffic30d: asset.traffic24h * 30,
          citations30d: asset.citations7d * 4,
          aiVisibilityDelta: asset.aiVisibilityDelta,
          qualityScore: asset.qualityScore,
          platformValue: asset.platformValue,
          action,
          reason,
          status: 'pending',
        }
      })

      pruned++
    }
  }

  console.log(`[Pruning] ${new Date().toISOString()} — Flagged ${pruned} underperforming assets`)
  return { pruned }
}
