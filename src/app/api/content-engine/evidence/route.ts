/**
 * Evidence Engine — Proof Behind Recommendations
 *
 * GET  /api/content-engine/evidence  → List evidence entries with filtering
 * POST /api/content-engine/evidence  → Generate/update evidence for a recommendation type
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: List Evidence Entries ────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const recommendationType = searchParams.get('recommendationType')
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0', 10)

    const where: Record<string, unknown> = {
      domain,
      confidence: { gte: minConfidence },
    }
    if (recommendationType) where.recommendationType = recommendationType

    const entries = await db.evidenceEntry.findMany({
      where,
      orderBy: { confidence: 'desc' },
    })

    // Enrich with source breakdown parsed
    const enriched = entries.map((e) => ({
      ...e,
      sourceBreakdownParsed: e.sourceBreakdown ? JSON.parse(e.sourceBreakdown) : null,
    }))

    return NextResponse.json({
      entries: enriched,
      total: entries.length,
    })
  } catch (error) {
    console.error('[Evidence] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evidence entries' },
      { status: 500 }
    )
  }
}

// ── POST: Generate/Update Evidence ────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recommendationType, domain = DEFAULT_DOMAIN } = body

    if (!recommendationType) {
      return NextResponse.json(
        { error: 'recommendationType is required' },
        { status: 400 }
      )
    }

    // Map recommendationType back to actionType(s) in GrowthMemory
    const actionTypeMap: Record<string, string[]> = {
      'publish_article': ['published_article'],
      'create_faq': ['created_faq'],
      'add_author': ['added_author'],
      'create_schema': ['created_schema'],
      'add_internal_links': ['added_internal_link'],
      'fix_technical': ['fixed_robots'],
      'update_llms_txt': ['updated_llms_txt'],
      'create_entity': ['created_entity'],
      'add_citation_source': ['added_citation_source'],
    }

    const actionTypes = actionTypeMap[recommendationType] || [recommendationType]

    // Query GrowthMemory data for these action types
    const memories = await db.growthMemory.findMany({
      where: {
        domain,
        actionType: { in: actionTypes },
      },
    })

    // Query related articles
    const relatedArticles = await db.contentArticle.findMany({
      where: {
        domain,
        status: 'published',
      },
      select: { id: true, aiVisibilityGain: true, createdAt: true },
      take: 100,
    })

    // Calculate evidence metrics
    const totalMemories = memories.length
    const positiveVisibilityMemories = memories.filter((m) => m.visibilityDelta > 0)
    const avgVisibilityGain = totalMemories > 0
      ? Math.round((memories.reduce((s, m) => s + m.visibilityDelta, 0) / totalMemories) * 10) / 10
      : 0
    const avgCitationGain = totalMemories > 0
      ? Math.round((memories.reduce((s, m) => s + m.citationDelta, 0) / totalMemories) * 10) / 10
      : 0
    const avgOrganicGain = totalMemories > 0
      ? Math.round((memories.reduce((s, m) => s + m.organicDelta, 0) / totalMemories) * 10) / 10
      : 0
    const avgLeadGain = totalMemories > 0
      ? Math.round((memories.reduce((s, m) => s + m.leadDelta, 0) / totalMemories) * 10) / 10
      : 0
    const avgRevenueGain = totalMemories > 0
      ? Math.round((memories.reduce((s, m) => s + m.revenueDelta, 0) / totalMemories) * 100) / 100
      : 0
    const avgConfidence = totalMemories > 0
      ? Math.round(memories.reduce((s, m) => s + m.confidence, 0) / totalMemories)
      : 0

    // Calculate overall confidence score
    // Factors: sample size, consistency (% positive), avg confidence of measurements
    const positiveRate = totalMemories > 0 ? positiveVisibilityMemories.length / totalMemories : 0
    const sampleSizeScore = Math.min(totalMemories / 20, 1) * 40 // Up to 40 points for sample size
    const consistencyScore = positiveRate * 40 // Up to 40 points for consistency
    const measurementConfidenceScore = (avgConfidence / 100) * 20 // Up to 20 points for measurement confidence
    const overallConfidence = Math.round(sampleSizeScore + consistencyScore + measurementConfidenceScore)

    // Count source diversity
    const uniqueArticles = new Set(memories.map((m) => m.articleId).filter(Boolean))
    const uniqueEntities = new Set(memories.map((m) => m.targetEntity).filter(Boolean))

    // Build detailed source breakdown
    const sourceBreakdown = {
      growthMemories: {
        total: totalMemories,
        positive: positiveVisibilityMemories.length,
        neutral: memories.filter((m) => m.visibilityDelta === 0).length,
        negative: memories.filter((m) => m.visibilityDelta < 0).length,
      },
      visibility: {
        avgGain: avgVisibilityGain,
        maxGain: memories.length > 0 ? Math.max(...memories.map((m) => m.visibilityDelta)) : 0,
        minGain: memories.length > 0 ? Math.min(...memories.map((m) => m.visibilityDelta)) : 0,
      },
      citations: {
        avgGain: avgCitationGain,
        totalGained: memories.reduce((s, m) => s + m.citationDelta, 0),
      },
      organic: {
        avgGain: avgOrganicGain,
        totalGained: memories.reduce((s, m) => s + m.organicDelta, 0),
      },
      revenue: {
        avgGain: avgRevenueGain,
        totalGained: Math.round(memories.reduce((s, m) => s + m.revenueDelta, 0) * 100) / 100,
      },
      diversity: {
        uniqueArticles: uniqueArticles.size,
        uniqueEntities: uniqueEntities.size,
        publishedArticles: relatedArticles.length,
      },
      confidence: {
        overall: overallConfidence,
        sampleSizeContribution: Math.round(sampleSizeScore),
        consistencyContribution: Math.round(consistencyScore),
        measurementContribution: Math.round(measurementConfidenceScore),
        positiveRate: Math.round(positiveRate * 100),
      },
    }

    // Upsert evidence entry
    const evidenceId = `evidence-${domain}-${recommendationType}`
    const evidence = await db.evidenceEntry.upsert({
      where: { id: evidenceId },
      create: {
        id: evidenceId,
        domain,
        recommendationType,
        recommendation: generateRecommendationText(recommendationType, avgVisibilityGain, positiveRate),
        basedOnCompanies: 1, // Self data
        basedOnReplaySessions: memories.filter((m) => m.actionType.includes('replay') || m.metadata?.includes('replay')).length,
        basedOnCompetitors: 0,
        basedOnArticles: relatedArticles.length,
        basedOnGrowthMemories: totalMemories,
        avgVisibilityGain,
        confidence: overallConfidence,
        sourceBreakdown: JSON.stringify(sourceBreakdown),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
      },
      update: {
        recommendation: generateRecommendationText(recommendationType, avgVisibilityGain, positiveRate),
        basedOnGrowthMemories: totalMemories,
        basedOnArticles: relatedArticles.length,
        avgVisibilityGain,
        confidence: overallConfidence,
        sourceBreakdown: JSON.stringify(sourceBreakdown),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      evidence,
      sourceBreakdown,
    }, { status: 201 })
  } catch (error) {
    console.error('[Evidence] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate evidence' },
      { status: 500 }
    )
  }
}

// ── Helper: Generate recommendation text ──────────────────────────────────────

function generateRecommendationText(type: string, avgGain: number, positiveRate: number): string {
  const confidence = positiveRate > 0.7 ? 'strongly' : positiveRate > 0.4 ? 'moderately' : 'weakly'

  const recommendations: Record<string, string> = {
    'publish_article': `Continue publishing articles — ${confidence} supported with avg +${avgGain} visibility gain`,
    'create_faq': `Add FAQ sections — ${confidence} supported with avg +${avgGain} visibility gain per FAQ`,
    'add_author': `Add author bylines — ${confidence} supported with avg +${avgGain} visibility gain`,
    'create_schema': `Implement structured data — ${confidence} supported with avg +${avgGain} visibility gain`,
    'add_internal_links': `Build internal links — ${confidence} supported with avg +${avgGain} visibility gain`,
    'fix_technical': `Fix technical issues — ${confidence} supported with avg +${avgGain} visibility gain`,
    'update_llms_txt': `Update llms.txt — ${confidence} supported with avg +${avgGain} visibility gain`,
    'create_entity': `Create entity pages — ${confidence} supported with avg +${avgGain} visibility gain`,
    'add_citation_source': `Add citation sources — ${confidence} supported with avg +${avgGain} visibility gain`,
  }

  return recommendations[type] || `Continue ${type} actions — ${confidence} supported with avg +${avgGain} visibility gain`
}
