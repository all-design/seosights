/**
 * Article ROI — Full Funnel Cost→Revenue Tracking
 *
 * GET  /api/content-engine/article-roi  → List article ROI data
 * POST /api/content-engine/article-roi  → Calculate/update ROI for an article
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: List Article ROI ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const days = parseInt(searchParams.get('days') || '90', 10)
    const sortBy = searchParams.get('sortBy') || 'roi'

    const since = new Date()
    since.setDate(since.getDate() - days)

    const roiEntries = await db.articleROI.findMany({
      where: {
        domain,
        measuredAt: { gte: since },
      },
      orderBy: getSortOrder(sortBy),
    })

    // Calculate aggregated stats
    const totalCost = roiEntries.reduce((s, r) => s + r.totalCostUsd, 0)
    const totalRevenue = roiEntries.reduce((s, r) => s + r.revenueAttributed, 0)
    const totalCitations = roiEntries.reduce((s, r) => s + r.citationsGained, 0)
    const totalLeads = roiEntries.reduce((s, r) => s + r.leadsGenerated, 0)
    const avgROI = roiEntries.length > 0
      ? roiEntries.reduce((s, r) => s + r.roi, 0) / roiEntries.length
      : 0
    const avgVisibilityDelta = roiEntries.length > 0
      ? roiEntries.reduce((s, r) => s + r.visibilityDelta, 0) / roiEntries.length
      : 0
    const avgCostPerCitation = totalCitations > 0 ? totalCost / totalCitations : 0
    const avgCostPerLead = totalLeads > 0 ? totalCost / totalLeads : 0

    // Enrich with article details
    const enriched = await Promise.all(
      roiEntries.map(async (roi) => {
        const article = await db.contentArticle.findUnique({
          where: { id: roi.articleId },
          select: {
            title: true,
            format: true,
            pillar: true,
            status: true,
            publishedAt: true,
            seoScore: true,
            aeoScore: true,
            geoScore: true,
          },
        })

        return {
          ...roi,
          article,
        }
      })
    )

    return NextResponse.json({
      roiEntries: enriched,
      aggregated: {
        totalArticles: roiEntries.length,
        totalCostUsd: Math.round(totalCost * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCitations,
        totalLeads,
        avgROI: Math.round(avgROI * 100) / 100,
        avgVisibilityDelta: Math.round(avgVisibilityDelta * 10) / 10,
        avgCostPerCitation: Math.round(avgCostPerCitation * 100) / 100,
        avgCostPerLead: Math.round(avgCostPerLead * 100) / 100,
        netProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('[Article ROI] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article ROI data' },
      { status: 500 }
    )
  }
}

// ── POST: Calculate/Update ROI for an Article ─────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      )
    }

    // Fetch article
    const article = await db.contentArticle.findUnique({
      where: { id: articleId },
      include: {
        reviews: true,
        brief: { select: { createdAt: true } },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // ── Calculate Cost ──────────────────────────────────────────────────
    // Writing cost: from reviews
    const writingCost = article.reviews
      .filter((r) => r.reviewerType === 'seo_review' || r.reviewerType === 'aeo_review')
      .reduce((s, r) => s + r.costUsd, 0)

    // Review cost: all reviews
    const reviewCost = article.reviews.reduce((s, r) => s + r.costUsd, 0)

    // Total cost: reviews + estimated base cost
    const baseWritingCost = 0.15 // Estimated AI writing cost per article
    const totalCost = baseWritingCost + reviewCost

    // Writing time: from brief creation to published
    let writingTimeMinutes = 0
    if (article.brief?.createdAt && article.publishedAt) {
      writingTimeMinutes = Math.round(
        (new Date(article.publishedAt).getTime() - new Date(article.brief.createdAt).getTime()) / (60 * 1000)
      )
    } else {
      writingTimeMinutes = 15 // Default estimate
    }

    // ── Calculate Results ───────────────────────────────────────────────
    // Get growth memory entries for this article
    const growthMemories = await db.growthMemory.findMany({
      where: { articleId },
    })

    // Visibility before/after from growth memories
    const visibilityBefore = growthMemories.length > 0
      ? Math.max(0, growthMemories[0].visibilityDelta > 0
          ? 0 : Math.abs(growthMemories[0].visibilityDelta))
      : 0

    const totalVisibilityDelta = growthMemories.reduce((s, m) => s + m.visibilityDelta, 0)
    const visibilityAfter = visibilityBefore + totalVisibilityDelta

    const citationsGained = growthMemories.reduce((s, m) => s + m.citationDelta, 0)
    const organicClicks = growthMemories.reduce((s, m) => s + m.organicDelta, 0)
    const leadsGenerated = growthMemories.reduce((s, m) => s + m.leadDelta, 0)
    const revenueAttributed = growthMemories.reduce((s, m) => s + m.revenueDelta, 0)

    // Use article's own AI visibility gain if no growth memories
    const effectiveVisibilityDelta = totalVisibilityDelta || article.aiVisibilityGain

    // ── Calculate ROI ───────────────────────────────────────────────────
    const roi = totalCost > 0
      ? Math.round(((revenueAttributed - totalCost) / totalCost) * 100) / 100
      : 0

    const costPerCitation = citationsGained > 0
      ? Math.round((totalCost / citationsGained) * 100) / 100
      : 0

    const costPerLead = leadsGenerated > 0
      ? Math.round((totalCost / leadsGenerated) * 100) / 100
      : 0

    // ── Upsert ROI Entry ────────────────────────────────────────────────
    const roiEntry = await db.articleROI.upsert({
      where: { articleId },
      create: {
        articleId,
        domain: article.domain,
        writingCostUsd: baseWritingCost,
        reviewCostUsd: reviewCost,
        totalCostUsd: totalCost,
        writingTimeMinutes,
        visibilityBefore,
        visibilityAfter,
        visibilityDelta: effectiveVisibilityDelta,
        citationsGained,
        organicClicks,
        leadsGenerated,
        revenueAttributed: Math.round(revenueAttributed * 100) / 100,
        roi,
        costPerCitation,
        costPerLead,
        measuredAt: new Date(),
      },
      update: {
        writingCostUsd: baseWritingCost,
        reviewCostUsd: reviewCost,
        totalCostUsd: totalCost,
        writingTimeMinutes,
        visibilityBefore,
        visibilityAfter,
        visibilityDelta: effectiveVisibilityDelta,
        citationsGained,
        organicClicks,
        leadsGenerated,
        revenueAttributed: Math.round(revenueAttributed * 100) / 100,
        roi,
        costPerCitation,
        costPerLead,
        measuredAt: new Date(),
      },
    })

    return NextResponse.json({
      roi: roiEntry,
      breakdown: {
        cost: {
          writing: baseWritingCost,
          review: reviewCost,
          total: totalCost,
        },
        results: {
          visibilityDelta: effectiveVisibilityDelta,
          citationsGained,
          organicClicks,
          leadsGenerated,
          revenueAttributed: Math.round(revenueAttributed * 100) / 100,
        },
        calculated: {
          roi,
          costPerCitation,
          costPerLead,
        },
        writingTimeMinutes,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Article ROI] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate article ROI' },
      { status: 500 }
    )
  }
}

// ── Helper: Get sort order ────────────────────────────────────────────────────

function getSortOrder(sortBy: string) {
  switch (sortBy) {
    case 'roi':
      return { roi: 'desc' as const }
    case 'cost':
      return { totalCostUsd: 'desc' as const }
    case 'revenue':
      return { revenueAttributed: 'desc' as const }
    case 'visibility':
      return { visibilityDelta: 'desc' as const }
    default:
      return { roi: 'desc' as const }
  }
}
