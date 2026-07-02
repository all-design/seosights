/**
 * Content Engine — Mission Control (Daily Briefing)
 *
 * GET /api/content-engine/mission-control
 * Returns today's daily briefing with opportunities, today's article, KPIs, and calendar.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContentTopics } from '@/lib/client-zero-topics'

const DEFAULT_DOMAIN = 'seosights.com'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Parallel data fetch
    const [pendingBriefs, inProgressArticles, todayCalendar, latestKpi, recentArticles] =
      await Promise.all([
        // Pending briefs (opportunities to act on)
        db.contentBrief.findMany({
          where: { domain, status: { in: ['draft', 'approved'] } },
          orderBy: { priority: 'desc' },
          take: 10,
        }),
        // Articles currently in progress
        db.contentArticle.findMany({
          where: { domain, status: { in: ['writing', 'review'] } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: { brief: { select: { topic: true, pillar: true } } },
        }),
        // Today's calendar entry
        db.editorialCalendarEntry.findFirst({
          where: { domain, date: { gte: today, lt: tomorrow } },
        }),
        // Latest KPI
        db.contentKPI.findFirst({
          where: { domain },
          orderBy: { date: 'desc' },
        }),
        // Recent published articles for context
        db.contentArticle.findMany({
          where: { domain, status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: { id: true, title: true, format: true, seoScore: true, aeoScore: true, geoScore: true, publishedAt: true },
        }),
      ])

    // Generate opportunity suggestions from topics data
    const allTopics = generateContentTopics()

    // Find topics not yet covered by existing briefs
    const coveredKeywords = new Set(
      (await db.contentBrief.findMany({
        where: { domain },
        select: { keywordTarget: true },
      })).map((b) => b.keywordTarget.toLowerCase())
    )

    const uncoveredTopics = allTopics.filter(
      (t) => !coveredKeywords.has(t.keywordTarget.toLowerCase())
    )

    // Pick top opportunities based on pillar rotation
    const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
    const pillarRotation: Record<number, string> = {
      1: 'seo',  // Monday: Entity SEO
      2: 'geo',  // Tuesday: Claude SEO / GEO
      3: 'geo',  // Wednesday: AI Visibility Score
      4: 'aeo',  // Thursday: AEO & Featured Snippets
      5: 'seo',  // Friday: Content Strategy & E-E-A-T
      6: 'all',  // Saturday: Product Updates & Case Studies
      0: 'all',  // Sunday: Weekly Roundup / Newsletter
    }

    const todayPillar = pillarRotation[dayOfWeek] || 'all'
    const prioritizedTopics = uncoveredTopics
      .filter((t) => t.pillar === todayPillar || t.pillar === 'all')
      .slice(0, 5)

    const otherTopics = uncoveredTopics
      .filter((t) => !prioritizedTopics.includes(t))
      .slice(0, 5)

    const opportunities = [
      ...prioritizedTopics.map((t) => ({
        ...t,
        relevance: 'high' as const,
        reason: `Matches today's ${todayPillar.toUpperCase()} focus`,
      })),
      ...otherTopics.map((t) => ({
        ...t,
        relevance: 'medium' as const,
        reason: 'Uncovered topic in backlog',
      })),
    ]

    // Determine today's article (from calendar or in-progress)
    let todayArticle: any = null
    if (todayCalendar?.articleId) {
      todayArticle = await db.contentArticle.findUnique({
        where: { id: todayCalendar.articleId },
        include: { brief: { select: { topic: true, pillar: true, cluster: true } } },
      })
    } else if (inProgressArticles.length > 0) {
      todayArticle = inProgressArticles[0]
    }

    // KPI summary
    const kpi = latestKpi
      ? {
          date: latestKpi.date,
          articlesPublished: latestKpi.articlesPublished,
          avgAIScoreGain: latestKpi.avgAIScoreGain,
          totalCitationGain: latestKpi.totalCitationGain,
          totalAIMentions: latestKpi.totalAIMentions,
          autoExecuteRate: latestKpi.autoExecuteRate,
          avgReviewScore: latestKpi.avgReviewScore,
          contentFactoryOutputs: latestKpi.contentFactoryOutputs,
        }
      : {
          date: today,
          articlesPublished: 0,
          avgAIScoreGain: 0,
          totalCitationGain: 0,
          totalAIMentions: 0,
          autoExecuteRate: 0,
          avgReviewScore: 0,
          contentFactoryOutputs: 0,
        }

    // Calendar summary
    const calendar = todayCalendar
      ? {
          id: todayCalendar.id,
          date: todayCalendar.date,
          theme: todayCalendar.theme,
          status: todayCalendar.status,
          briefId: todayCalendar.briefId,
          articleId: todayCalendar.articleId,
        }
      : null

    return NextResponse.json({
      opportunities,
      todayArticle,
      kpi,
      calendar,
      stats: {
        pendingBriefs: pendingBriefs.length,
        inProgressArticles: inProgressArticles.length,
        recentPublished: recentArticles.length,
        uncoveredTopics: uncoveredTopics.length,
        todayPillar,
      },
    })
  } catch (error) {
    console.error('[Content Engine Mission Control] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load mission control data' },
      { status: 500 }
    )
  }
}
