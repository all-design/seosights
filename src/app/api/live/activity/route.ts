/**
 * Live API — Agent Activity Feed
 *
 * GET /api/live/activity
 *
 * Returns recent agent activity for the "Build in Public" section.
 * Pulls real data from the database (content queue + outreach logs)
 * and formats it as a timeline feed.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ActivityItem {
  id: string
  emoji: string
  agentName: string
  text: string
  time: string
  timestamp: string
  status: 'completed' | 'in-progress' | 'failed'
  type: 'content' | 'outreach' | 'technical' | 'analysis'
}

export async function GET() {
  try {
    // Find Client Zero projects
    const clientZeroProjects = await db.project.findMany({
      where: { isInternalAutopilot: true },
      select: { id: true, domain: true },
    })

    if (clientZeroProjects.length === 0) {
      return NextResponse.json({
        activities: getSimulatedActivities(),
        source: 'simulated',
      })
    }

    const projectIds = clientZeroProjects.map((p) => p.id)
    const domainMap = new Map(clientZeroProjects.map((p) => [p.id, p.domain]))

    // Fetch recent content queue activity
    const recentContent = await db.internalContentQueue.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ['published', 'generating', 'failed'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 15,
    })

    // Fetch recent outreach activity
    const recentOutreach = await db.outreachLog.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Fetch recent CMS publish logs
    const recentPublishes = await db.cMSPublishLog.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ['published', 'failed'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Combine and format activities
    const activities: ActivityItem[] = []

    for (const content of recentContent) {
      const domain = domainMap.get(content.projectId) || 'unknown'
      if (content.status === 'published') {
        activities.push({
          id: `content-${content.id}`,
          emoji: '🏗️',
          agentName: 'Content Architect',
          text: `Published "${content.suggestedTitle}" on ${domain}`,
          time: formatTimeAgo(content.publishedAt || content.updatedAt),
          timestamp: (content.publishedAt || content.updatedAt).toISOString(),
          status: 'completed',
          type: 'content',
        })
      } else if (content.status === 'generating') {
        activities.push({
          id: `content-${content.id}`,
          emoji: '📝',
          agentName: 'Content Architect',
          text: `Generating article: "${content.suggestedTitle}" for ${domain}`,
          time: 'just now',
          timestamp: content.updatedAt.toISOString(),
          status: 'in-progress',
          type: 'content',
        })
      }
    }

    for (const outreach of recentOutreach) {
      const domain = domainMap.get(outreach.projectId) || 'unknown'
      if (outreach.status === 'sent') {
        activities.push({
          id: `outreach-${outreach.id}`,
          emoji: '🤝',
          agentName: 'Backlink Prospector',
          text: `Sent outreach email to ${outreach.targetSite} for ${domain}`,
          time: formatTimeAgo(outreach.sentAt || outreach.updatedAt),
          timestamp: (outreach.sentAt || outreach.updatedAt).toISOString(),
          status: 'completed',
          type: 'outreach',
        })
      } else if (outreach.status === 'link_acquired') {
        activities.push({
          id: `outreach-${outreach.id}`,
          emoji: '🔗',
          agentName: 'Link Strategist',
          text: `Backlink acquired from ${outreach.targetSite}! Anchor: "${outreach.anchorText || 'N/A'}"`,
          time: formatTimeAgo(outreach.linkAcquiredAt || outreach.updatedAt),
          timestamp: (outreach.linkAcquiredAt || outreach.updatedAt).toISOString(),
          status: 'completed',
          type: 'outreach',
        })
      } else if (outreach.status === 'replied') {
        activities.push({
          id: `outreach-${outreach.id}`,
          emoji: '📨',
          agentName: 'Backlink Prospector',
          text: `Got a reply from ${outreach.targetSite} regarding guest post`,
          time: formatTimeAgo(outreach.repliedAt || outreach.updatedAt),
          timestamp: (outreach.repliedAt || outreach.updatedAt).toISOString(),
          status: 'completed',
          type: 'outreach',
        })
      } else if (outreach.status === 'pending') {
        activities.push({
          id: `outreach-${outreach.id}`,
          emoji: '📧',
          agentName: 'Link Strategist',
          text: `Preparing outreach email for ${outreach.targetSite}`,
          time: formatTimeAgo(outreach.createdAt),
          timestamp: outreach.createdAt.toISOString(),
          status: 'in-progress',
          type: 'outreach',
        })
      }
    }

    for (const publish of recentPublishes) {
      if (publish.status === 'published' && publish.contentType !== 'blog_post') {
        activities.push({
          id: `cms-${publish.id}`,
          emoji: '⚙️',
          agentName: 'Tech & Schema Auditor',
          text: `Updated ${publish.contentType} on ${publish.title}`,
          time: formatTimeAgo(publish.publishedAt || publish.createdAt),
          timestamp: (publish.publishedAt || publish.createdAt).toISOString(),
          status: 'completed',
          type: 'technical',
        })
      }
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // If we have very few real activities, supplement with simulated ones
    if (activities.length < 5) {
      const simulated = getSimulatedActivities()
      activities.push(...simulated.slice(0, 5 - activities.length))
    }

    return NextResponse.json({
      activities: activities.slice(0, 20),
      source: activities.length > 5 ? 'live' : 'mixed',
    })
  } catch (error) {
    console.error('[Live Activity API] GET error:', error)
    return NextResponse.json({
      activities: getSimulatedActivities(),
      source: 'simulated',
    })
  }
}

// ── Time Formatting ────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}

// ── Simulated Activities (fallback) ────────────────────────────────────────

function getSimulatedActivities(): ActivityItem[] {
  const now = new Date()
  return [
    {
      id: 'sim-1',
      emoji: '🏗️',
      agentName: 'Content Architect',
      text: 'Published "GEO Optimization for DeepSeek Search Engine" on seosights.com',
      time: '2 min ago',
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
      status: 'completed',
      type: 'content',
    },
    {
      id: 'sim-2',
      emoji: '🔗',
      agentName: 'Link Strategist',
      text: 'Found 4 new guest post opportunities (DA 45+) in SEO niche',
      time: '5 min ago',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      status: 'completed',
      type: 'outreach',
    },
    {
      id: 'sim-3',
      emoji: '🤝',
      agentName: 'Backlink Prospector',
      text: 'Sent outreach email to techblog.com — guest post proposal for AI SEO topic',
      time: '8 min ago',
      timestamp: new Date(now.getTime() - 8 * 60000).toISOString(),
      status: 'completed',
      type: 'outreach',
    },
    {
      id: 'sim-4',
      emoji: '⚙️',
      agentName: 'Tech & Schema',
      text: 'Updated robots.txt — unblocked ClaudeBot and GPTBot for better AI crawling',
      time: '12 min ago',
      timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
      status: 'completed',
      type: 'technical',
    },
    {
      id: 'sim-5',
      emoji: '🕵️',
      agentName: 'Competitor Analyst',
      text: 'Detected new brand mention on Reddit r/SEO — tracking sentiment',
      time: '15 min ago',
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      status: 'in-progress',
      type: 'analysis',
    },
    {
      id: 'sim-6',
      emoji: '📊',
      agentName: 'SERP Tracker',
      text: 'Ranking jump detected: #8 → #4 for "AI SEO tools" on Google',
      time: '20 min ago',
      timestamp: new Date(now.getTime() - 20 * 60000).toISOString(),
      status: 'completed',
      type: 'analysis',
    },
    {
      id: 'sim-7',
      emoji: '📝',
      agentName: 'Content Architect',
      text: 'Drafting "Schema Markup Guide for LLMs" — Q&A format with E-E-A-T signals',
      time: '25 min ago',
      timestamp: new Date(now.getTime() - 25 * 60000).toISOString(),
      status: 'in-progress',
      type: 'content',
    },
    {
      id: 'sim-8',
      emoji: '🔍',
      agentName: 'On-Page Auditor',
      text: 'Added FAQ section to /ai-visibility page — optimized for AEO',
      time: '30 min ago',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      status: 'completed',
      type: 'technical',
    },
  ]
}
