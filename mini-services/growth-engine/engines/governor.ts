// ─── AGE Governor Engine ──────────────────────────────────────────
// Prevents spam, checks for duplicates, enforces quality standards

import { db } from '../../../src/lib/db'

export async function runGovernorEngine(): Promise<{ checked: number; rejected: number }> {
  console.log(`[Governor] ${new Date().toISOString()} — Running governor engine...`)

  // Check queued and reviewing items for issues
  const candidates = await db.growthOpportunity.findMany({
    where: { status: { in: ['scored', 'queued'] } },
    take: 30,
  })

  let checked = 0
  let rejected = 0

  for (const opp of candidates) {
    checked++

    // Check 1: Duplicate detection — check if similar title exists
    const words = opp.title.split(' ').filter(w => w.length > 3)
    const searchTerms = words.slice(0, 3)

    if (searchTerms.length >= 2) {
      const similar = await db.growthOpportunity.findFirst({
        where: {
          id: { not: opp.id },
          status: { notIn: ['archived', 'rejected'] },
          title: { contains: searchTerms[0] },
        }
      })

      if (similar) {
        // Too similar
        await db.growthOpportunity.update({
          where: { id: opp.id },
          data: { status: 'rejected' }
        })
        await db.growthGovernorDecision.create({
          data: {
            opportunityId: opp.id,
            decision: 'rejected',
            reason: 'too_similar',
            details: `Too similar to existing: "${similar.title}"`,
            checksPerformed: JSON.stringify(['duplicate_check', 'similarity_check']),
            checkResults: JSON.stringify({ similarTo: similar.id, similarTitle: similar.title }),
            confidence: 0.82,
            overrideable: true,
          }
        })
        rejected++

        // Update snapshot
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        await db.growthDailySnapshot.upsert({
          where: { date: today },
          create: { date: today, assetsRejected: 1, dailyBudget: 20 },
          update: { assetsRejected: { increment: 1 } }
        })

        continue
      }
    }

    // Check 2: Already covered — check if an asset with similar type/keywords exists
    const existingAsset = await db.growthAsset.findFirst({
      where: {
        type: opp.type,
        title: { contains: searchTerms[0] || opp.title.split(' ')[0] },
        executionStatus: { not: 'failed' },
      }
    })

    if (existingAsset) {
      await db.growthGovernorDecision.create({
        data: {
          opportunityId: opp.id,
          decision: 'deferred',
          reason: 'already_covered',
          details: `Similar content exists: "${existingAsset.title}" at ${existingAsset.publishedUrl || 'N/A'}`,
          checksPerformed: JSON.stringify(['coverage_check']),
          checkResults: JSON.stringify({ existingAssetId: existingAsset.id }),
          confidence: 0.75,
          overrideable: true,
        }
      })
      // Don't reject, just flag — defer
    }

    // Check 3: Low evidence — if confidence is very low
    if (opp.confidence < 0.3) {
      await db.growthOpportunity.update({
        where: { id: opp.id },
        data: { status: 'rejected' }
      })
      await db.growthGovernorDecision.create({
        data: {
          opportunityId: opp.id,
          decision: 'rejected',
          reason: 'low_evidence',
          details: `Confidence ${opp.confidence} is too low to proceed`,
          checksPerformed: JSON.stringify(['confidence_check', 'evidence_check']),
          checkResults: JSON.stringify({ confidence: opp.confidence, threshold: 0.3 }),
          confidence: 0.9,
          overrideable: true,
        }
      })
      rejected++
    }
  }

  console.log(`[Governor] ${new Date().toISOString()} — Checked ${checked}, rejected ${rejected}`)
  return { checked, rejected }
}
