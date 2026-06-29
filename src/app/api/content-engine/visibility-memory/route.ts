/**
 * AI Visibility Memory™ — Historical Visibility with Causal Links
 *
 * GET /api/content-engine/visibility-memory  → Historical visibility timeline with causal links
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: Visibility Memory Timeline ──────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const months = Math.min(parseInt(searchParams.get('months') || '6', 10), 24)

    // Calculate start date
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    // Fetch all data sources in parallel
    const [visibilitySnapshots, growthMemories, articles] = await Promise.all([
      // Visibility snapshots
      db.visibilitySnapshot.findMany({
        where: {
          domain,
          capturedAt: { gte: startDate },
        },
        orderBy: { capturedAt: 'asc' },
      }),
      // Growth memory entries
      db.growthMemory.findMany({
        where: {
          domain,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
      }),
      // Published articles
      db.contentArticle.findMany({
        where: {
          domain,
          status: 'published',
          publishedAt: { gte: startDate },
        },
        select: {
          id: true,
          title: true,
          format: true,
          pillar: true,
          seoScore: true,
          aeoScore: true,
          geoScore: true,
          aiVisibilityGain: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'asc' },
      }),
    ])

    // Build month-by-month timeline
    const timeline: Array<{
      month: string
      year: number
      monthNum: number
      aiVisibilityScore: number
      visibilityBefore: number
      visibilityAfter: number
      actionsTaken: Array<{ actionType: string; actionDetail: string; visibilityDelta: number }>
      articlesPublished: Array<{ id: string; title: string; aiVisibilityGain: number }>
      totalActions: number
      totalCitationDelta: number
      totalOrganicDelta: number
      impact: string
    }> = []

    const now = new Date()
    for (let m = 0; m < months; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1 - m), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
      const monthLabel = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })

      // Visibility snapshots in this month
      const monthSnapshots = visibilitySnapshots.filter((s) => {
        const d = new Date(s.capturedAt)
        return d >= monthDate && d <= monthEnd
      })

      // Growth memories in this month
      const monthMemories = growthMemories.filter((m) => {
        const d = new Date(m.createdAt)
        return d >= monthDate && d <= monthEnd
      })

      // Articles published in this month
      const monthArticles = articles.filter((a) => {
        if (!a.publishedAt) return false
        const d = new Date(a.publishedAt)
        return d >= monthDate && d <= monthEnd
      })

      // Calculate visibility scores
      const firstSnapshot = monthSnapshots.length > 0 ? monthSnapshots[0] : null
      const lastSnapshot = monthSnapshots.length > 0 ? monthSnapshots[monthSnapshots.length - 1] : null

      const visibilityBefore = firstSnapshot?.overallScore ?? (timeline.length > 0 ? timeline[timeline.length - 1].aiVisibilityScore : 0)
      const visibilityAfter = lastSnapshot?.overallScore ?? visibilityBefore
      const aiVisibilityScore = visibilityAfter

      // Calculate totals
      const totalActions = monthMemories.length
      const totalCitationDelta = monthMemories.reduce((s, m) => s + m.citationDelta, 0)
      const totalOrganicDelta = monthMemories.reduce((s, m) => s + m.organicDelta, 0)

      // Determine impact description
      const visDelta = visibilityAfter - visibilityBefore
      let impact: string
      if (visDelta > 10) impact = 'Strong positive — major visibility gains'
      else if (visDelta > 3) impact = 'Positive — steady visibility growth'
      else if (visDelta > 0) impact = 'Slight positive — incremental gains'
      else if (visDelta === 0) impact = 'Neutral — no measurable change'
      else if (visDelta > -5) impact = 'Slight decline — needs attention'
      else impact = 'Significant decline — urgent action needed'

      timeline.push({
        month: monthLabel,
        year: monthDate.getFullYear(),
        monthNum: monthDate.getMonth(),
        aiVisibilityScore,
        visibilityBefore,
        visibilityAfter,
        actionsTaken: monthMemories.map((m) => ({
          actionType: m.actionType,
          actionDetail: m.actionDetail,
          visibilityDelta: m.visibilityDelta,
        })),
        articlesPublished: monthArticles.map((a) => ({
          id: a.id,
          title: a.title,
          aiVisibilityGain: a.aiVisibilityGain,
        })),
        totalActions,
        totalCitationDelta,
        totalOrganicDelta,
        impact,
      })
    }

    // Calculate current score and trend
    const currentScore = timeline.length > 0 ? timeline[timeline.length - 1].aiVisibilityScore : 0
    const recentMonths = timeline.slice(-3)
    const avgRecentDelta = recentMonths.length > 0
      ? recentMonths.reduce((s, m) => s + (m.visibilityAfter - m.visibilityBefore), 0) / recentMonths.length
      : 0

    let trend: string
    if (avgRecentDelta > 5) trend = 'Accelerating upward'
    else if (avgRecentDelta > 1) trend = 'Steadily improving'
    else if (avgRecentDelta > 0) trend = 'Slowly improving'
    else if (avgRecentDelta === 0) trend = 'Flat'
    else if (avgRecentDelta > -3) trend = 'Slowly declining'
    else trend = 'Declining — needs intervention'

    return NextResponse.json({
      timeline,
      currentScore,
      trend,
      summary: {
        totalMonthsAnalyzed: months,
        totalActions: growthMemories.length,
        totalArticlesPublished: articles.length,
        totalCitationGained: growthMemories.reduce((s, m) => s + m.citationDelta, 0),
        totalOrganicGained: growthMemories.reduce((s, m) => s + m.organicDelta, 0),
        avgMonthlyVisibilityDelta: Math.round(avgRecentDelta * 10) / 10,
      },
    })
  } catch (error) {
    console.error('[Visibility Memory] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visibility memory' },
      { status: 500 }
    )
  }
}
