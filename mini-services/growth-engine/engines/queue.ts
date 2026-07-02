// ─── AGE Queue Engine ──────────────────────────────────────────
// Prioritizes and queues scored opportunities

import { db } from '../../../src/lib/db'

export async function runQueueEngine(): Promise<{ queued: number; skipped: number }> {
  console.log(`[Queue] ${new Date().toISOString()} — Running queue engine...`)

  // Check today's budget
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let snapshot = await db.growthDailySnapshot.findUnique({
    where: { date: today }
  })

  if (!snapshot) {
    snapshot = await db.growthDailySnapshot.create({
      data: { date: today, dailyBudget: 20 }
    })
  }

  const remaining = snapshot.dailyBudget - snapshot.assetsPublished - snapshot.assetsRejected

  if (remaining <= 0) {
    console.log(`[Queue] ${new Date().toISOString()} — Daily budget exhausted (${snapshot.assetsPublished}/${snapshot.dailyBudget})`)
    return { queued: 0, skipped: 0 }
  }

  // Get scored opportunities, sorted by priority and growth score
  const scored = await db.growthOpportunity.findMany({
    where: { status: 'scored' },
    orderBy: [
      { priority: 'asc' },  // p1 first
      { growthScore: 'desc' },
    ],
    take: remaining,
  })

  let queued = 0
  let skipped = 0

  for (const opp of scored) {
    // Governor check: skip if confidence too low
    if (opp.confidence < 0.4) {
      await db.growthOpportunity.update({
        where: { id: opp.id },
        data: { status: 'archived' }
      })
      await db.growthGovernorDecision.create({
        data: {
          opportunityId: opp.id,
          decision: 'rejected',
          reason: 'low_confidence',
          details: `Confidence ${opp.confidence} below threshold 0.4`,
          checksPerformed: JSON.stringify(['confidence_check']),
          checkResults: JSON.stringify({ confidence: opp.confidence, threshold: 0.4 }),
          confidence: 0.9,
          overrideable: true,
        }
      })
      skipped++
      continue
    }

    await db.growthOpportunity.update({
      where: { id: opp.id },
      data: {
        status: 'queued',
        queuedAt: new Date(),
        scheduledAt: new Date(Date.now() + queued * 15 * 60 * 1000), // stagger by 15 min
      }
    })
    queued++
  }

  console.log(`[Queue] ${new Date().toISOString()} — Queued ${queued}, skipped ${skipped}`)
  return { queued, skipped }
}
