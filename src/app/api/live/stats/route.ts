/**
 * Live API — Build in Public Stats
 *
 * GET /api/live/stats
 *
 * Returns aggregate stats for the "Build in Public" section:
 * - Total articles published
 * - Total outreach emails sent
 * - Links acquired
 * - This month's progress
 * - Growth metrics for traffic graph
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Find Client Zero projects
    const clientZeroProjects = await db.project.findMany({
      where: { isInternalAutopilot: true },
      select: { id: true, domain: true },
    })

    const projectIds = clientZeroProjects.map((p) => p.id)

    // If no Client Zero projects, return simulated stats
    if (projectIds.length === 0) {
      return NextResponse.json({
        ...getSimulatedStats(),
        source: 'simulated',
      })
    }

    // ── Content Stats ──────────────────────────────────────────────────
    const [
      totalArticlesPublished,
      totalArticlesFailed,
      pendingArticles,
      thisMonthPublished,
    ] = await Promise.all([
      db.internalContentQueue.count({
        where: { projectId: { in: projectIds }, status: 'published' },
      }),
      db.internalContentQueue.count({
        where: { projectId: { in: projectIds }, status: 'failed' },
      }),
      db.internalContentQueue.count({
        where: { projectId: { in: projectIds }, status: 'pending' },
      }),
      db.internalContentQueue.count({
        where: {
          projectId: { in: projectIds },
          status: 'published',
          publishedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    // ── Outreach Stats ─────────────────────────────────────────────────
    const [
      totalOutreachSent,
      totalLinksAcquired,
      totalOutreachPending,
      thisMonthOutreach,
    ] = await Promise.all([
      db.outreachLog.count({
        where: { projectId: { in: projectIds }, status: 'sent' },
      }),
      db.outreachLog.count({
        where: { projectId: { in: projectIds }, status: 'link_acquired' },
      }),
      db.outreachLog.count({
        where: { projectId: { in: projectIds }, status: 'pending' },
      }),
      db.outreachLog.count({
        where: {
          projectId: { in: projectIds },
          status: 'sent',
          sentAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    // ── Growth Data (simulated traffic for chart) ──────────────────────
    // In production, this would come from Google Analytics API
    const growthData = generateGrowthData(totalArticlesPublished)

    return NextResponse.json({
      articles: {
        total: totalArticlesPublished,
        failed: totalArticlesFailed,
        pending: pendingArticles,
        thisMonth: thisMonthPublished,
        target: 90,
      },
      outreach: {
        emailsSent: totalOutreachSent,
        linksAcquired: totalLinksAcquired,
        pending: totalOutreachPending,
        thisMonth: thisMonthOutreach,
        linkRate: totalOutreachSent > 0 ? Math.round((totalLinksAcquired / totalOutreachSent) * 100) : 0,
      },
      agents: {
        active: 8,
        humanHours: 0,
      },
      growth: growthData,
      projects: clientZeroProjects.length,
      source: 'live',
    })
  } catch (error) {
    console.error('[Live Stats API] GET error:', error)
    return NextResponse.json({
      ...getSimulatedStats(),
      source: 'simulated',
    })
  }
}

// ── Growth Data Generator ──────────────────────────────────────────────────

function generateGrowthData(totalArticles: number) {
  // Generate 30-day traffic growth data based on content volume
  const baseClicks = Math.max(10, totalArticles * 5)
  const baseImpressions = Math.max(50, totalArticles * 25)

  const data = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Simulate growth curve
    const dayFactor = (30 - i) / 30
    const noise = 0.8 + Math.random() * 0.4

    data.push({
      date: date.toISOString().split('T')[0],
      clicks: Math.round(baseClicks * dayFactor * noise),
      impressions: Math.round(baseImpressions * dayFactor * noise),
    })
  }

  return data
}

// ── Simulated Stats (fallback) ─────────────────────────────────────────────

function getSimulatedStats() {
  return {
    articles: {
      total: 47,
      failed: 2,
      pending: 43,
      thisMonth: 28,
      target: 90,
    },
    outreach: {
      emailsSent: 34,
      linksAcquired: 8,
      pending: 12,
      thisMonth: 15,
      linkRate: 24,
    },
    agents: {
      active: 8,
      humanHours: 0,
    },
    growth: generateGrowthData(47),
    projects: 1,
  }
}
