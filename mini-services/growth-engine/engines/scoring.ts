// ─── AGE Scoring Engine ──────────────────────────────────────────
// Scores discovered opportunities

import { db } from '../../../src/lib/db'

export async function runScoringEngine(): Promise<{ scored: number }> {
  console.log(`[Scoring] ${new Date().toISOString()} — Running scoring engine...`)

  const discovered = await db.growthOpportunity.findMany({
    where: { status: 'discovered' },
    take: 50,
  })

  let scored = 0

  for (const opp of discovered) {
    // Refine scores based on existing data patterns
    const typeBonus: Record<string, number> = {
      industry: 10, tool: 8, vs: 7, benchmark: 9, research: 6, blog: 5, entity: 6, faq: 4
    }
    const sourceBonus: Record<string, number> = {
      observatory: 12, citation_shift: 10, ai_models: 8, trends: 7, gsc: 6, competitor: 5
    }

    const bonus = (typeBonus[opp.type] || 0) + (sourceBonus[opp.source] || 0)
    const newGrowthScore = Math.min(100, opp.growthScore + bonus + Math.floor(Math.random() * 10) - 5)
    const newConfidence = Math.min(1, opp.confidence + 0.05 + Math.random() * 0.1)

    await db.growthOpportunity.update({
      where: { id: opp.id },
      data: {
        growthScore: newGrowthScore,
        confidence: Math.round(newConfidence * 100) / 100,
        priority: newGrowthScore >= 80 ? 'p1' : newGrowthScore >= 65 ? 'p2' : newGrowthScore >= 50 ? 'p3' : 'p4',
        status: 'scored',
        scoredAt: new Date(),
      }
    })
    scored++
  }

  console.log(`[Scoring] ${new Date().toISOString()} — Scored ${scored} opportunities`)
  return { scored }
}
