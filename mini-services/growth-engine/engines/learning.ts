// ─── AGE Learning Engine ──────────────────────────────────────────
// Learns from prediction vs actual results

import { db } from '../../../src/lib/db'

export async function runLearningEngine(): Promise<{ learned: number }> {
  console.log(`[Learning] ${new Date().toISOString()} — Running learning engine...`)

  // Find learning records that have predictions but no actuals
  const pending = await db.growthLearning.findMany({
    where: {
      actualTraffic: null,
      measuredAt: { not: null },
    },
    take: 20,
  })

  let learned = 0

  for (const record of pending) {
    // Get the asset's measured data
    if (!record.assetId) continue

    const asset = await db.growthAsset.findUnique({ where: { id: record.assetId } })
    if (!asset) continue

    const actualTraffic = asset.traffic24h
    const actualCitations = asset.citations7d
    const actualVisibility = asset.aiVisibilityDelta

    // Calculate prediction error
    let predictionError = 0
    let errorDirection = 'accurate'

    if (record.predictedTraffic && actualTraffic > 0) {
      predictionError = Math.abs(record.predictedTraffic - actualTraffic) / actualTraffic
      if (predictionError > 0.2) {
        errorDirection = record.predictedTraffic > actualTraffic ? 'over' : 'under'
      }
    }

    // Generate lesson
    let lessonLearned = ''
    if (errorDirection === 'over') {
      lessonLearned = `Over-predicted traffic for ${asset.type} pages by ${Math.round(predictionError * 100)}%. Consider reducing traffic estimates for this type.`
    } else if (errorDirection === 'under') {
      lessonLearned = `Under-predicted impact for ${asset.type} pages. This type may perform better than expected.`
    } else {
      lessonLearned = `Prediction was accurate for ${asset.type} page "${asset.title}".`
    }

    await db.growthLearning.update({
      where: { id: record.id },
      data: {
        actualTraffic,
        actualCitations,
        actualVisibility,
        actualValue: Math.round((asset.traffic24h * 0.5 + asset.citations7d * 10 + asset.aiVisibilityDelta * 5) * 100) / 100,
        predictionError: Math.round(predictionError * 100) / 100,
        errorDirection,
        lessonLearned,
        modelUpdate: JSON.stringify({
          type: asset.type,
          trafficAdjustment: errorDirection === 'over' ? -0.1 : errorDirection === 'under' ? 0.1 : 0,
        }),
      }
    })

    learned++
  }

  // Update today's snapshot with learning metrics
  if (learned > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const allLearnings = await db.growthLearning.findMany({
      where: { predictionError: { not: null } }
    })

    const avgAccuracy = allLearnings.length > 0
      ? allLearnings.reduce((sum, l) => sum + (1 - (l.predictionError || 0)), 0) / allLearnings.length
      : 0

    await db.growthDailySnapshot.upsert({
      where: { date: today },
      create: { date: today, predictionAccuracy: avgAccuracy, dailyBudget: 20 },
      update: { predictionAccuracy: avgAccuracy }
    })
  }

  console.log(`[Learning] ${new Date().toISOString()} — Learned from ${learned} records`)
  return { learned }
}
