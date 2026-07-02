// ─── AGE Measurement Engine ──────────────────────────────────────────
// Measures results of published assets

import { db } from '../../../src/lib/db'

export async function runMeasurementEngine(): Promise<{ measured: number }> {
  console.log(`[Measurement] ${new Date().toISOString()} — Running measurement engine...`)

  // Find recently published assets (last 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentAssets = await db.growthAsset.findMany({
    where: {
      publishedAt: { gte: yesterday },
      executionStatus: 'indexed',
    },
    take: 20,
  })

  let measured = 0

  for (const asset of recentAssets) {
    // Simulate measurement data
    const traffic24h = Math.floor(Math.random() * 200) + 10
    const impressions24h = Math.floor(Math.random() * 2000) + 100
    const clicks24h = Math.floor(Math.random() * 300) + 5
    const citations7d = Math.floor(Math.random() * 10)
    const aiVisibilityDelta = Math.round((Math.random() * 5 - 1) * 100) / 100

    await db.growthAsset.update({
      where: { id: asset.id },
      data: {
        traffic24h,
        impressions24h,
        clicks24h,
        citations7d,
        aiVisibilityDelta,
        conversions7d: Math.floor(Math.random() * 5),
      }
    })

    // Create learning record
    await db.growthLearning.create({
      data: {
        assetId: asset.id,
        predictedTraffic: Math.floor(Math.random() * 200) + 50,
        predictedCitations: Math.floor(Math.random() * 8) + 1,
        predictedVisibility: Math.round((Math.random() * 5) * 100) / 100,
        predictedValue: Math.round((Math.random() * 50 + 10) * 100) / 100,
        predictionConfidence: Math.round((0.5 + Math.random() * 0.4) * 100) / 100,
        measuredAt: new Date(),
      }
    })

    measured++
  }

  console.log(`[Measurement] ${new Date().toISOString()} — Measured ${measured} assets`)
  return { measured }
}
