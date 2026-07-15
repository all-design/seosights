/**
 * Factory Status API — GET /api/factory/status
 *
 * Returns the overall autonomous Software Factory™ system health snapshot.
 * Designed for the dashboard's "Is the autonomous system alive?" widget —
 * a single call that tells the user whether every engine is breathing.
 *
 * Output shape:
 *   {
 *     ok, timestamp,
 *     system:    { codebaseScanner, governor, aiRouter,
 *                  dailyMissionGenerator, qaEngine },
 *     counts:    { factoryTasks, governorInterceptions, dailyMissions,
 *                  qaRuns, codebaseSnapshots, engineeringMemories,
 *                  factoryChangelogs },
 *     today:     { mission: null | { id, goal, status,
 *                                    candidatesApproved,
 *                                    candidatesEvaluated } },
 *     recentActivity: [ { type, id, engineName?, outcome?,
 *                          title?, status?, errorCount?,
 *                          timestamp?, createdAt } ],
 *     aiProviders: { configured, available, using }
 *   }
 *
 * Every DB query is wrapped in try/catch so a missing migration in
 * production Turso degrades gracefully — a count falls back to 0, a
 * recency probe returns null, a component rolls down to 'offline'.
 * The endpoint itself NEVER throws: it always returns HTTP 200 with as
 * much real data as it could gather.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ─── Types ────────────────────────────────────────────────────────────────────

type SystemStatus = 'operational' | 'degraded' | 'offline'

interface SystemHealth {
  codebaseScanner: SystemStatus
  governor: SystemStatus
  aiRouter: SystemStatus
  dailyMissionGenerator: SystemStatus
  qaEngine: SystemStatus
}

interface Counts {
  factoryTasks: number
  governorInterceptions: number
  dailyMissions: number
  qaRuns: number
  codebaseSnapshots: number
  engineeringMemories: number
  factoryChangelogs: number
}

interface TodayMission {
  id: string
  goal: string
  status: string
  candidatesApproved: number
  candidatesEvaluated: number
}

interface ActivityItem {
  type: 'interception' | 'task' | 'qaRun'
  id: string
  // interception
  engineName?: string
  outcome?: string
  // task
  title?: string
  status?: string
  // qaRun
  errorCount?: number
  timestamp?: string
  // shared sort key (ISO string)
  createdAt: string
}

interface AIProviders {
  configured: string[]
  available: string[]
  using: 'rule-based-fallback' | 'live-llm'
}

interface StatusResponse {
  ok: boolean
  timestamp: string
  system: SystemHealth
  counts: Counts
  today: { mission: TodayMission | null }
  recentActivity: ActivityItem[]
  aiProviders: AIProviders
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Today at midnight — used to match DailyMission.date.
 *  Mirrors the helper in /api/factory/daily-mission so we always read the
 *  same row that the generator wrote. */
function todayAtMidnight(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Compute a component status from the latest record timestamp.
 *   - any record in last 24h  → 'operational'
 *   - any record in last 7d   → 'degraded'
 *   - never / older than 7d   → 'offline'
 */
function statusFromRecency(latestAt: Date | null | undefined): SystemStatus {
  if (!latestAt) return 'offline'
  const ageMs = Date.now() - latestAt.getTime()
  if (Number.isNaN(ageMs)) return 'offline'
  const ONE_DAY = 24 * 60 * 60 * 1000
  const SEVEN_DAYS = 7 * ONE_DAY
  if (ageMs <= ONE_DAY) return 'operational'
  if (ageMs <= SEVEN_DAYS) return 'degraded'
  return 'offline'
}

/** Run a count() promise safely — returns 0 on any error
 *  (e.g. missing table in production Turso). */
async function safeCount(fn: () => Promise<number>): Promise<number> {
  try {
    return await fn()
  } catch (err) {
    console.warn(
      '[api/factory/status] count failed:',
      err instanceof Error ? err.message : err,
    )
    return 0
  }
}

/** Run a findFirst promise safely — returns null on any error. */
async function safeFind<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.warn(
      '[api/factory/status] findFirst failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

/** Run a findMany promise safely — returns [] on any error. */
async function safeFindMany<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn()
  } catch (err) {
    console.warn(
      '[api/factory/status] findMany failed:',
      err instanceof Error ? err.message : err,
    )
    return []
  }
}

// ─── AI provider detection ────────────────────────────────────────────────────

/** Provider → env var that gates it. Z_AI_CONFIG is the ZAI SDK config blob. */
const PROVIDER_ENV_KEYS: Record<string, string> = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  zai: 'Z_AI_CONFIG',
}

/** Stable display order for the provider list. */
const PROVIDER_ORDER = ['groq', 'gemini', 'openrouter', 'openai', 'zai']

function detectAIProviders(): AIProviders {
  const configured: string[] = []
  const available: string[] = []

  for (const [provider, envVar] of Object.entries(PROVIDER_ENV_KEYS)) {
    const value = process.env[envVar]
    if (typeof value === 'string' && value.trim().length > 0) {
      configured.push(provider)
      available.push(provider)
    }
  }

  configured.sort(
    (a, b) =>
      PROVIDER_ORDER.indexOf(a) - PROVIDER_ORDER.indexOf(b),
  )
  available.sort(
    (a, b) =>
      PROVIDER_ORDER.indexOf(a) - PROVIDER_ORDER.indexOf(b),
  )

  const using: AIProviders['using'] =
    available.length > 0 ? 'live-llm' : 'rule-based-fallback'

  return { configured, available, using }
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const timestamp = new Date().toISOString()

  // ─── Counts (all parallel, all wrapped in safeCount) ──────────────────────
  const [
    factoryTasksCount,
    governorInterceptionsCount,
    dailyMissionsCount,
    qaRunsCount,
    codebaseSnapshotsCount,
    engineeringMemoriesCount,
    factoryChangelogsCount,
  ] = await Promise.all([
    safeCount(() => db.factoryTask.count()),
    safeCount(() => db.governorInterception.count()),
    safeCount(() => db.dailyMission.count()),
    safeCount(() => db.qARun.count()),
    safeCount(() => db.codebaseSnapshot.count()),
    safeCount(() => db.engineeringMemory.count()),
    safeCount(() => db.factoryChangelog.count()),
  ])

  const counts: Counts = {
    factoryTasks: factoryTasksCount,
    governorInterceptions: governorInterceptionsCount,
    dailyMissions: dailyMissionsCount,
    qaRuns: qaRunsCount,
    codebaseSnapshots: codebaseSnapshotsCount,
    engineeringMemories: engineeringMemoriesCount,
    factoryChangelogs: factoryChangelogsCount,
  }

  // ─── Today's mission ──────────────────────────────────────────────────────
  let todayMission: TodayMission | null = null
  try {
    const mission = await db.dailyMission.findFirst({
      where: { date: { gte: todayAtMidnight() } },
    })
    if (mission) {
      todayMission = {
        id: mission.id,
        goal: mission.title,
        status: mission.status,
        candidatesApproved: 0,
        candidatesEvaluated: 0,
      }
    }
  } catch (err) {
    console.warn(
      '[api/factory/status] today mission lookup failed:',
      err instanceof Error ? err.message : err,
    )
  }

  // ─── Recent activity (5 most recent across 3 sources) ─────────────────────
  // Fetch 5 from each of: GovernorInterception, FactoryTask, QARun.
  // Merge, sort by createdAt desc, take 5.
  const [interceptions, tasks, qaRuns] = await Promise.all([
    safeFindMany(() =>
      db.governorInterception.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          engine: true,
          action: true,
          createdAt: true,
        },
      }),
    ),
    safeFindMany(() =>
      db.factoryTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
    ),
    safeFindMany(() =>
      db.qARun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          criticalCount: true,
          createdAt: true,
        },
      }),
    ),
  ])

  const mergedActivity: ActivityItem[] = []

  for (const i of interceptions) {
    mergedActivity.push({
      type: 'interception',
      id: i.id,
      engineName: i.engine || '',
      outcome: i.action || '',
      createdAt: i.createdAt.toISOString(),
    })
  }
  for (const t of tasks) {
    mergedActivity.push({
      type: 'task',
      id: t.id,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })
  }
  for (const q of qaRuns) {
    mergedActivity.push({
      type: 'qaRun',
      id: q.id,
      status: q.status,
      errorCount: q.criticalCount,
      timestamp: q.createdAt.toISOString(),
      createdAt: q.createdAt.toISOString(),
    })
  }

  // Sort by createdAt desc and keep only the top 5.
  mergedActivity.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const recentActivity = mergedActivity.slice(0, 5)

  // ─── System component recency probes ──────────────────────────────────────
  // Each engine's operational/degraded/offline state is derived from the
  // freshness of its latest DB record (24h = operational, 7d = degraded,
  // never/older = offline).
  const [
    latestSnapshot,
    latestInterception,
    latestMission,
    latestQARun,
  ] = await Promise.all([
    safeFind(() =>
      db.codebaseSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ),
    safeFind(() =>
      db.governorInterception.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ),
    safeFind(() =>
      db.dailyMission.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ),
    safeFind(() =>
      db.qARun.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ),
  ])

  const aiProviders = detectAIProviders()

  const system: SystemHealth = {
    codebaseScanner: statusFromRecency(latestSnapshot?.createdAt),
    governor: statusFromRecency(latestInterception?.createdAt),
    // AI Router status comes from provider config, not DB recency.
    aiRouter:
      aiProviders.using === 'live-llm' ? 'operational' : 'degraded',
    dailyMissionGenerator: statusFromRecency(latestMission?.createdAt),
    qaEngine: statusFromRecency(latestQARun?.createdAt),
  }

  const response: StatusResponse = {
    ok: true,
    timestamp,
    system,
    counts,
    today: { mission: todayMission },
    recentActivity,
    aiProviders,
  }

  return NextResponse.json(response)
}
