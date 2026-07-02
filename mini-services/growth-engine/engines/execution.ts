// ─── AGE Execution Engine ──────────────────────────────────────────
// Publishes approved assets

import { db } from '../../../src/lib/db'

export async function runExecutionEngine(): Promise<{ published: number }> {
  console.log(`[Execution] ${new Date().toISOString()} — Running execution engine...`)

  const approved = await db.growthAsset.findMany({
    where: { reviewStatus: 'approved', executionStatus: 'pending' },
    take: 5,
  })

  let published = 0

  for (const asset of approved) {
    // Simulate publishing steps
    await db.growthAsset.update({
      where: { id: asset.id },
      data: { executionStatus: 'publishing' }
    })

    const publishedUrl = `/${asset.type === 'vs' ? 'compare' : asset.type === 'industry' ? 'industries' : asset.type === 'tool' ? 'free-ai-seo-tools' : asset.type}/${asset.slug}`

    await db.growthAsset.update({
      where: { id: asset.id },
      data: {
        executionStatus: 'indexed',
        publishedUrl,
        publishedAt: new Date(),
      }
    })

    // Update the opportunity status
    if (asset.opportunityId) {
      await db.growthOpportunity.update({
        where: { id: asset.opportunityId },
        data: { status: 'published', completedAt: new Date() }
      })
    }

    // Update today's snapshot
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.growthDailySnapshot.upsert({
      where: { date: today },
      create: { date: today, assetsPublished: 1, dailyBudget: 20 },
      update: { assetsPublished: { increment: 1 } }
    })

    published++
  }

  console.log(`[Execution] ${new Date().toISOString()} — Published ${published} assets`)
  return { published }
}
