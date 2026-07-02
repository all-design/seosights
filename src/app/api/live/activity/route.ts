/**
 * Live API — Agent Activity Feed
 *
 * GET /api/live/activity
 *
 * Returns recent agent activity for the "Build in Public" section.
 * FIXED: No longer queries non-existent models (internalContentQueue, outreachLog, cMSPublishLog).
 * Uses real data from existing models (analysis, agentLog) with simulated fallback.
 * Status indicators show data source (live/estimated/simulated).
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

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

export const dynamic = 'force-dynamic'

export async function GET() {
  const api = '/api/live/activity'

  try {
    // ── Try to get real data from existing tables ──────────────────────
    const [recentAnalyses, recentAgentLogs] = await Promise.all([
      safeQuery(() => db.analysis.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          domain: true,
          status: true,
          mode: true,
          createdAt: true,
        },
      }), [], { api }),
      safeQuery(() => db.agentLog.findMany({
        take: 15,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          agentId: true,
          agentName: true,
          action: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      }), [], { api }),
    ])

    const activities: ActivityItem[] = []
    let hasLiveData = false

    // ── Build activities from real agent logs ──────────────────────────
    if (recentAgentLogs.data.length > 0) {
      hasLiveData = true
      for (const log of recentAgentLogs.data) {
        const emoji = getAgentEmoji(log.agentId)
        activities.push({
          id: `agent-${log.id}`,
          emoji,
          agentName: log.agentName,
          text: log.action || `${log.agentName} processing...`,
          time: formatTimeAgo(log.startedAt),
          timestamp: log.startedAt.toISOString(),
          status: log.status === 'completed' ? 'completed' : log.status === 'failed' ? 'failed' : 'in-progress',
          type: getAgentType(log.agentId),
        })
      }
    }

    // ── Build activities from real analyses ────────────────────────────
    if (recentAnalyses.data.length > 0) {
      hasLiveData = true
      for (const analysis of recentAnalyses.data) {
        activities.push({
          id: `analysis-${analysis.id}`,
          emoji: '🔍',
          agentName: 'Master Director',
          text: `${analysis.status === 'completed' ? 'Completed' : 'Started'} audit for ${analysis.domain}`,
          time: formatTimeAgo(analysis.createdAt),
          timestamp: analysis.createdAt.toISOString(),
          status: analysis.status === 'completed' ? 'completed' : 'in-progress',
          type: 'analysis',
        })
      }
    }

    // ── Sort by timestamp and supplement if needed ─────────────────────
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    let source: DataStatus | 'simulated' = 'live'
    if (!hasLiveData) {
      source = 'simulated' as DataStatus | 'simulated'
    } else if (activities.length < 5) {
      source = 'estimated'
      // Supplement with simulated
      const simulated = getSimulatedActivities()
      activities.push(...simulated.slice(0, 5 - activities.length))
    }

    // Always ensure we have some content
    if (activities.length === 0) {
      activities.push(...getSimulatedActivities().slice(0, 8))
      source = 'simulated' as DataStatus | 'simulated'
    }

    return NextResponse.json({
      activities: activities.slice(0, 20),
      source: source as DataStatus,
      confidence: source === 'live' ? 100 : source === 'estimated' ? 50 : 0,
    })
  } catch (error) {
    console.error('[Live Activity API] GET error:', error)
    logFallback({
      api,
      reason: `Top-level error: ${error instanceof Error ? error.message : 'Unknown'}`,
      category: 'unknown',
      confidence: 0,
      error,
    })

    return NextResponse.json({
      activities: getSimulatedActivities(),
      source: 'simulated' as DataStatus,
      confidence: 0,
    })
  }
}

// ── Helper Functions ──────────────────────────────────────────────────────

function getAgentEmoji(agentId: string): string {
  const emojiMap: Record<string, string> = {
    'master-director': '🎯',
    'keyword-researcher': '🔑',
    'content-analyst': '📝',
    'technical-seo': '⚙️',
    'competitor-analyst': '🕵️',
    'backlink-prospector': '🔗',
    'local-seo': '📍',
    'schema-specialist': '📊',
  }
  return emojiMap[agentId] || '🤖'
}

function getAgentType(agentId: string): ActivityItem['type'] {
  if (agentId.includes('content') || agentId.includes('keyword')) return 'content'
  if (agentId.includes('backlink') || agentId.includes('outreach')) return 'outreach'
  if (agentId.includes('technical') || agentId.includes('schema')) return 'technical'
  return 'analysis'
}

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

// ── Simulated Activities (fallback) ──────────────────────────────────────

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
