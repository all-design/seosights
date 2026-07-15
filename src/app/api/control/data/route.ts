/**
 * Unified Control Panel Data API — GET /api/control/data
 *
 * Lightweight endpoint that consolidates key database queries
 * for the control panel. Each section is wrapped in try/catch.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function todayStart(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

async function safe<T>(fn: () => Promise<T>, fb: T): Promise<T> {
  try { return await fn() } catch { return fb }
}

export async function GET() {
  const ts = new Date().toISOString()
  const today = todayStart()

  // Core counts
  const counts = await safe(async () => ({
    factoryTasks: await db.factoryTask.count(),
    interceptions: await db.governorInterception.count(),
    missions: await db.dailyMission.count(),
    qaRuns: await db.qARun.count(),
    snapshots: await db.codebaseSnapshot.count(),
    memories: await db.engineeringMemory.count(),
    changelogs: await db.factoryChangelog.count(),
  }), { factoryTasks: 0, interceptions: 0, missions: 0, qaRuns: 0, snapshots: 0, memories: 0, changelogs: 0 })

  // Schedule
  const scheduleJobs = await safe(
    () => db.mCScheduleJob.findMany({ where: { scheduledDate: { gte: today } }, orderBy: { scheduledTime: 'asc' } }),
    []
  )
  const scheduleSummary = {
    totalJobs: scheduleJobs.length,
    completed: scheduleJobs.filter((j: any) => j.status === 'completed').length,
    running: scheduleJobs.filter((j: any) => j.status === 'running').length,
    pending: scheduleJobs.filter((j: any) => j.status === 'pending').length,
    failed: scheduleJobs.filter((j: any) => j.status === 'failed').length,
  }

  // Recent items
  const recentInterceptions = await safe(
    () => db.governorInterception.findMany({ take: 5, orderBy: { createdAt: 'desc' } }), []
  )
  const recentMissions = await safe(
    () => db.dailyMission.findMany({ take: 5, orderBy: { createdAt: 'desc' } }), []
  )
  const recentMemories = await safe(
    () => db.engineeringMemory.findMany({ take: 10, orderBy: { createdAt: 'desc' } }), []
  )
  const recentChangelogs = await safe(
    () => db.factoryChangelog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }), []
  )

  // Today's mission
  const todayMission = await safe(
    () => db.dailyMission.findFirst({ where: { date: { gte: today } } }), null
  )

  // Latest QA
  const latestQA = await safe(
    () => db.qARun.findFirst({ orderBy: { createdAt: 'desc' } }), null
  )

  // System health from latest records
  const system = {
    codebaseScanner: counts.snapshots > 0 ? 'operational' : 'offline',
    governor: counts.interceptions > 0 ? 'operational' : 'offline',
    aiRouter: 'degraded' as string,
    dailyMissionGenerator: counts.missions > 0 ? 'operational' : 'offline',
    qaEngine: counts.qaRuns > 0 ? 'operational' : 'offline',
  }

  // AI providers from env
  const aiProviders = {
    configured: Object.entries({
      groq: process.env.GROQ_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      zai: process.env.Z_AI_CONFIG,
    }).filter(([, v]) => typeof v === 'string' && v.trim().length > 0).map(([k]) => k),
    available: [] as string[],
    using: 'rule-based-fallback' as string,
  }
  aiProviders.available = [...aiProviders.configured]
  if (aiProviders.configured.length > 0) {
    aiProviders.using = 'live-llm'
    system.aiRouter = 'operational'
  }

  // Engagement
  const engagement = {
    momentum: await safe(() => db.engagementMomentum.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    streak: await safe(() => db.engagementStreak.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    activeMission: await safe(() => db.engagementMission.findFirst({ where: { status: 'active' } }), null),
    inboxCount: await safe(() => db.engagementInboxItem.count({ where: { isUnread: true } }), 0),
  }

  // Growth
  const growth = {
    snapshot: await safe(() => db.growthDailySnapshot.findFirst({ orderBy: { date: 'desc' } }), null),
    opportunities: await safe(() => db.growthOpportunity.findMany({ take: 5, orderBy: { createdAt: 'desc' } }), []),
  }

  // Observatory
  const observatory = {
    latestCrawl: await safe(() => db.observatoryCrawl.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    recentChanges: await safe(() => db.observatoryChange.findMany({ take: 5, orderBy: { createdAt: 'desc' } }), []),
  }

  // Client Zero
  const clientZero = {
    score: await safe(() => db.clientZeroKPI.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    deltas: await safe(() => db.clientZeroScoreDelta.findMany({ take: 10, orderBy: { createdAt: 'desc' } }), []),
  }

  // Settings
  const settings = await safe(() => db.systemSetting.findMany(), [])

  // Recent activity (merged from multiple sources)
  const recentActivity = [
    ...recentInterceptions.map((i: any) => ({ type: 'interception', ...i })),
    ...recentMissions.map((m: any) => ({ type: 'mission', ...m })),
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

  return NextResponse.json({
    factory: {
      system,
      counts,
      todayMission,
      recentInterceptions,
      recentMissions,
      recentMemories,
      recentChangelogs,
      latestQA,
      scheduleJobs,
      scheduleSummary,
      aiProviders,
      recentActivity,
      timestamp: ts,
    },
    engagement,
    growth,
    observatory,
    clientZero,
    productQA: latestQA,
    settings,
  })
}
