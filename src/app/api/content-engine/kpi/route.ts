/**
 * Content Engine — KPI Data
 *
 * GET /api/content-engine/kpi
 * Returns aggregated KPI metrics and daily breakdown.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: KPI data ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const days = parseInt(searchParams.get('days') || '30')

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get daily KPI breakdown
    const dailyKpis = await db.contentKPI.findMany({
      where: {
        domain,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate aggregated metrics
    const totalArticlesPublished = dailyKpis.reduce((sum, k) => sum + k.articlesPublished, 0)
    const avgAIScoreGain = dailyKpis.length > 0
      ? dailyKpis.reduce((sum, k) => sum + k.avgAIScoreGain, 0) / dailyKpis.length
      : 0
    const totalCitationGain = dailyKpis.reduce((sum, k) => sum + k.totalCitationGain, 0)
    const totalAIMentions = dailyKpis.reduce((sum, k) => sum + k.totalAIMentions, 0)
    const totalArticlesReplayed = dailyKpis.reduce((sum, k) => sum + k.articlesReplayed, 0)
    const totalArticlesRewritten = dailyKpis.reduce((sum, k) => sum + k.articlesRewritten, 0)
    const avgAutoExecuteRate = dailyKpis.length > 0
      ? dailyKpis.reduce((sum, k) => sum + k.autoExecuteRate, 0) / dailyKpis.length
      : 0
    const avgReviewScore = dailyKpis.length > 0
      ? dailyKpis.reduce((sum, k) => sum + k.avgReviewScore, 0) / dailyKpis.length
      : 0
    const totalContentFactoryOutputs = dailyKpis.reduce((sum, k) => sum + k.contentFactoryOutputs, 0)

    // Get article counts by status
    const articlesByStatus = await db.contentArticle.groupBy({
      by: ['status'],
      where: { domain },
      _count: { status: true },
    })

    // Get brief counts by status
    const briefsByStatus = await db.contentBrief.groupBy({
      by: ['status'],
      where: { domain },
      _count: { status: true },
    })

    // Get article counts by format
    const articlesByFormat = await db.contentArticle.groupBy({
      by: ['format'],
      where: { domain },
      _count: { format: true },
    })

    // Get review stats
    const reviewStats = await db.contentReview.aggregate({
      _avg: { score: true },
      _count: true,
      where: {
        article: { domain },
        reviewedAt: { gte: startDate },
      },
    })

    // Get active experiments
    const activeExperiments = await db.contentExperiment.count({
      where: { domain, status: 'running' },
    })

    return NextResponse.json({
      aggregated: {
        days,
        totalArticlesPublished,
        avgAIScoreGain: Math.round(avgAIScoreGain * 10) / 10,
        totalCitationGain,
        totalAIMentions,
        totalArticlesReplayed,
        totalArticlesRewritten,
        avgAutoExecuteRate: Math.round(avgAutoExecuteRate * 10) / 10,
        avgReviewScore: Math.round(avgReviewScore * 10) / 10,
        totalContentFactoryOutputs,
        rewriteRate: totalArticlesReplayed > 0
          ? Math.round((totalArticlesRewritten / totalArticlesReplayed) * 100)
          : 0,
      },
      breakdown: {
        articlesByStatus: articlesByStatus.map((s) => ({ status: s.status, count: s._count.status })),
        briefsByStatus: briefsByStatus.map((s) => ({ status: s.status, count: s._count.status })),
        articlesByFormat: articlesByFormat.map((f) => ({ format: f.format, count: f._count.format })),
      },
      reviewStats: {
        avgScore: reviewStats._avg.score ? Math.round(reviewStats._avg.score * 10) / 10 : 0,
        totalReviews: reviewStats._count,
      },
      activeExperiments,
      daily: dailyKpis,
    })
  } catch (error) {
    console.error('[Content Engine KPI] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    )
  }
}
