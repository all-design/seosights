/**
 * Growth Memory — Action→Outcome Tracking
 *
 * GET  /api/content-engine/growth-memory  → List entries with filtering & stats
 * POST /api/content-engine/growth-memory  → Create a growth memory entry
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: List Growth Memory Entries ───────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const actionType = searchParams.get('actionType')
    const targetEntity = searchParams.get('targetEntity')
    const days = parseInt(searchParams.get('days') || '30', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Build where clause
    const where: Record<string, unknown> = {
      domain,
      createdAt: { gte: since },
    }
    if (actionType) where.actionType = actionType
    if (targetEntity) where.targetEntity = targetEntity

    // Fetch entries
    const entries = await db.growthMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Fetch all entries in range for stats (no limit)
    const allInRange = await db.growthMemory.findMany({
      where: { domain, createdAt: { gte: since } },
    })

    // Aggregate stats
    const totalEntries = allInRange.length

    // By action type
    const byActionType: Record<string, { count: number; avgVisibilityDelta: number; avgCitationDelta: number; avgOrganicDelta: number; avgRevenueDelta: number }> = {}
    for (const entry of allInRange) {
      if (!byActionType[entry.actionType]) {
        byActionType[entry.actionType] = {
          count: 0,
          avgVisibilityDelta: 0,
          avgCitationDelta: 0,
          avgOrganicDelta: 0,
          avgRevenueDelta: 0,
        }
      }
      const s = byActionType[entry.actionType]
      s.count++
      s.avgVisibilityDelta += entry.visibilityDelta
      s.avgCitationDelta += entry.citationDelta
      s.avgOrganicDelta += entry.organicDelta
      s.avgRevenueDelta += entry.revenueDelta
    }

    // Compute averages
    for (const key of Object.keys(byActionType)) {
      const s = byActionType[key]
      const n = s.count
      s.avgVisibilityDelta = n > 0 ? Math.round((s.avgVisibilityDelta / n) * 10) / 10 : 0
      s.avgCitationDelta = n > 0 ? Math.round((s.avgCitationDelta / n) * 10) / 10 : 0
      s.avgOrganicDelta = n > 0 ? Math.round((s.avgOrganicDelta / n) * 10) / 10 : 0
      s.avgRevenueDelta = n > 0 ? Math.round((s.avgRevenueDelta / n) * 100) / 100 : 0
    }

    // Top performers (sorted by avg visibility delta desc)
    const topPerformers = Object.entries(byActionType)
      .map(([actionType, stats]) => ({ actionType, ...stats }))
      .sort((a, b) => b.avgVisibilityDelta - a.avgVisibilityDelta)
      .slice(0, 5)

    return NextResponse.json({
      entries,
      stats: {
        totalEntries,
        byActionType,
        topPerformers,
      },
    })
  } catch (error) {
    console.error('[Growth Memory] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch growth memory entries' },
      { status: 500 }
    )
  }
}

// ── POST: Create Growth Memory Entry ──────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      domain = DEFAULT_DOMAIN,
      actionType,
      actionDetail,
      targetEntity,
      visibilityDelta = 0,
      citationDelta = 0,
      organicDelta = 0,
      leadDelta = 0,
      revenueDelta = 0,
      confidence = 0,
      articleId,
      briefId,
      metadata,
    } = body

    if (!actionType || !actionDetail) {
      return NextResponse.json(
        { error: 'actionType and actionDetail are required' },
        { status: 400 }
      )
    }

    const entry = await db.growthMemory.create({
      data: {
        domain,
        actionType,
        actionDetail,
        targetEntity,
        visibilityDelta,
        citationDelta,
        organicDelta,
        leadDelta,
        revenueDelta,
        confidence,
        articleId,
        briefId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        measuredAt: new Date(),
      },
    })

    // Trigger: update EvidenceEntry for this actionType if enough data exists
    const memoryCount = await db.growthMemory.count({
      where: { domain, actionType },
    })

    if (memoryCount >= 3) {
      // Recalculate evidence for this action type
      const memories = await db.growthMemory.findMany({
        where: { domain, actionType },
      })

      const avgVisGain = memories.reduce((s, m) => s + m.visibilityDelta, 0) / memories.length
      const avgCitGain = memories.reduce((s, m) => s + m.citationDelta, 0) / memories.length
      const avgConf = memories.reduce((s, m) => s + m.confidence, 0) / memories.length

      // Map actionType to recommendationType
      const recommendationTypeMap: Record<string, string> = {
        'published_article': 'publish_article',
        'created_faq': 'create_faq',
        'added_author': 'add_author',
        'created_schema': 'create_schema',
        'added_internal_link': 'add_internal_links',
        'fixed_robots': 'fix_technical',
        'updated_llms_txt': 'update_llms_txt',
        'created_entity': 'create_entity',
        'added_citation_source': 'add_citation_source',
      }

      const recommendationType = recommendationTypeMap[actionType] || actionType

      // Upsert evidence
      await db.evidenceEntry.upsert({
        where: {
          id: `evidence-${domain}-${recommendationType}`,
        },
        create: {
          id: `evidence-${domain}-${recommendationType}`,
          domain,
          recommendationType,
          recommendation: `Continue ${actionType} actions — data shows positive outcomes`,
          basedOnGrowthMemories: memories.length,
          avgVisibilityGain: Math.round(avgVisGain * 10) / 10,
          confidence: Math.round(avgConf),
          sourceBreakdown: JSON.stringify({
            avgVisibilityGain: Math.round(avgVisGain * 10) / 10,
            avgCitationGain: Math.round(avgCitGain * 10) / 10,
            sampleSize: memories.length,
            lastUpdated: new Date().toISOString(),
          }),
        },
        update: {
          basedOnGrowthMemories: memories.length,
          avgVisibilityGain: Math.round(avgVisGain * 10) / 10,
          confidence: Math.round(avgConf),
          sourceBreakdown: JSON.stringify({
            avgVisibilityGain: Math.round(avgVisGain * 10) / 10,
            avgCitationGain: Math.round(avgCitGain * 10) / 10,
            sampleSize: memories.length,
            lastUpdated: new Date().toISOString(),
          }),
        },
      })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('[Growth Memory] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create growth memory entry' },
      { status: 500 }
    )
  }
}
