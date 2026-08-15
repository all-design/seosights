// ─── AGE Scoring Engine ──────────────────────────────────────────
// Scores discovered opportunities — deterministic, data-quality-driven

import { db } from '../../../src/lib/db'

/**
 * Check if a JSON string field is populated with meaningful content.
 * Returns true if the string parses to an object with at least one key.
 */
function isPopulatedJson(jsonStr: string | null | undefined): boolean {
  if (!jsonStr || jsonStr.trim() === '') return false
  try {
    const parsed = JSON.parse(jsonStr)
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.keys(parsed).length > 0
    }
    return false
  } catch {
    return false
  }
}

/**
 * Extract domain-like strings from a JSON array field (targetEntities, targetKeywords).
 * Returns an array of potential domain strings to query against.
 */
function extractDomains(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return []
  try {
    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) return []
    // Filter for entries that look like domains (contain a dot and no spaces)
    return parsed.filter(
      (item: unknown) => typeof item === 'string' && item.includes('.') && !item.includes(' ')
    ) as string[]
  } catch {
    return []
  }
}

/**
 * Extract keyword terms from targetKeywords for citation matching.
 */
function extractKeywords(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return []
  try {
    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item: unknown) => typeof item === 'string' && (item as string).length > 2) as string[]
  } catch {
    return []
  }
}

export async function runScoringEngine(): Promise<{ scored: number }> {
  console.log(`[Scoring] ${new Date().toISOString()} — Running scoring engine...`)

  const discovered = await db.growthOpportunity.findMany({
    where: { status: 'discovered' },
    take: 50,
  })

  let scored = 0

  for (const opp of discovered) {
    // ── Type and source bonuses (proven heuristics — kept as-is) ──
    const typeBonus: Record<string, number> = {
      industry: 10, tool: 8, vs: 7, benchmark: 9, research: 6, blog: 5, entity: 6, faq: 4
    }
    const sourceBonus: Record<string, number> = {
      observatory: 12, citation_shift: 10, ai_models: 8, trends: 7, gsc: 6, competitor: 5
    }

    const bonus = (typeBonus[opp.type ?? ''] || 0) + (sourceBonus[opp.source ?? ''] || 0)

    // ── Data quality signals ──

    // 1. Check if sourceDetails and data fields are populated
    const hasSourceDetails = isPopulatedJson(opp.sourceDetails)
    const hasData = isPopulatedJson(opp.data)

    // 2. Extract domains and keywords from the opportunity for DB queries
    const domains = extractDomains(opp.targetEntities)
    const keywords = extractKeywords(opp.targetKeywords)

    // 3. Count CitationRecords that reference the opportunity's domains
    let citationCount = 0
    if (domains.length > 0) {
      citationCount = await db.citationRecord.count({
        where: {
          citedDomain: { in: domains }
        }
      })
    }
    // If no domain matches, try matching keywords against promptCategory or entities
    if (citationCount === 0 && keywords.length > 0) {
      // Check by promptCategory matching the opportunity type
      const categoryMap: Record<string, string> = {
        industry: 'industry_query', vs: 'competitive_query', benchmark: 'competitive_query',
        research: 'factual_query', entity: 'brand_query', faq: 'recommendation_query'
      }
      const mappedCategory = categoryMap[opp.type ?? '']
      if (mappedCategory) {
        citationCount = await db.citationRecord.count({
          where: { promptCategory: mappedCategory }
        })
        // Cap the count to avoid inflating score from generic category matches
        citationCount = Math.min(citationCount, 3)
      }
    }

    // 4. Count VisibilitySnapshots for the opportunity's domains
    let visibilityCount = 0
    if (domains.length > 0) {
      visibilityCount = await db.visibilitySnapshot.count({
        where: {
          domain: { in: domains }
        }
      })
    }

    // ── Compute dataQualityBonus ──
    // Each signal contributes a small deterministic bonus
    let dataQualityBonus = 0
    if (hasSourceDetails) dataQualityBonus += 3  // Source details present → more trustworthy
    if (hasData) dataQualityBonus += 3            // Extra data fields populated → richer context
    // Citation backing: +2 per citation found, capped at +6 (3 citations)
    dataQualityBonus += Math.min(citationCount, 3) * 2
    // Visibility data: +2 per snapshot, capped at +4 (2 snapshots)
    dataQualityBonus += Math.min(visibilityCount, 2) * 2

    // ── Deterministic growth score ──
    const newGrowthScore = Math.min(100, opp.growthScore + bonus + dataQualityBonus)

    // ── Deterministic confidence increment based on data quality ──
    let confidenceIncrement = 0.05  // base increment
    if (hasSourceDetails) confidenceIncrement += 0.02
    if (hasData) confidenceIncrement += 0.02
    if (citationCount > 0) confidenceIncrement += 0.03
    if (visibilityCount > 0) confidenceIncrement += 0.03
    const newConfidence = Math.min(1, opp.confidence + confidenceIncrement)

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
