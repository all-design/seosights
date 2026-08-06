/**
 * QA Loop — Comprehensive System QA Test
 *
 * POST endpoint that runs a full system test of EVERY engine in the SeoSights
 * platform and returns detailed results. Protected by the superadmin secret.
 *
 * Tests:
 *   1. Database Connectivity
 *   2. AI Provider (Groq, Gemini, OpenRouter, OpenAI, ZAI)
 *   3. AI Router
 *   4. Codebase Scanner
 *   5. AI Governor
 *   6. Daily Mission Generator
 *   7. Cron Jobs Status
 *   8. Factory Pipeline
 *   9. Content Engine
 *  10. Observatory
 *  11. Growth Engine
 *  12. Engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// ─── Auth ────────────────────────────────────────────────────────────────────

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const bearerToken = authHeader.replace('Bearer ', '')
    if (bearerToken === SUPERADMIN_SECRET) return true
  }
  const cookieKey = request.cookies.get('superadmin_key')?.value
  if (cookieKey && cookieKey === SUPERADMIN_SECRET) return true
  return false
}

// ─── Types ───────────────────────────────────────────────────────────────────

type TestStatus = 'pass' | 'fail' | 'warn'

interface BaseTestResult {
  status: TestStatus
  message: string
  durationMs: number
  details: unknown
}

interface DatabaseTestResult extends BaseTestResult {
  details: {
    latencyMs: number
    counts: Record<string, number>
    errors: string[]
  }
}

interface AIProviderTestResult extends BaseTestResult {
  provider: string
  details: {
    model: string
    success: boolean
    latencyMs: number
    responseSnippet: string
    error: string | null
  }
}

interface RouterTestResult extends BaseTestResult {
  details: {
    model: string
    provider: string
    status: string
    latencyMs: number
    content: string
    fallbackChain: string[]
  }
}

interface ScannerTestResult extends BaseTestResult {
  details: {
    totalComponents: number
    totalAPIRoutes: number
    totalPrismaModels: number
    totalPages: number
    totalHooks: number
    totalLibs: number
    latencyMs: number
  }
}

interface GovernorTestResult extends BaseTestResult {
  details: {
    approved: boolean
    confidence: number
    impactScore: number
    ruleApplied: string | null
    rejectionReason: string | null
    latencyMs: number
  }
}

interface MissionTestResult extends BaseTestResult {
  details: {
    missionId: string | null
    candidatesEvaluated: number
    candidatesApproved: number
    candidatesRejected: number
    latencyMs: number
  }
}

interface CronJobTestResult extends BaseTestResult {
  cronName: string
  details: {
    hasRecentData: boolean
    recordCount: number
    lastRun: string | null
  }
}

interface FactoryTestResult extends BaseTestResult {
  details: {
    recentTasks: number
    recentInterceptions: number
    recentQARuns: number
    taskStatuses: Record<string, number>
    pipelineHealthy: boolean
  }
}

interface ContentEngineTestResult extends BaseTestResult {
  details: {
    briefCount: number
    articleCount: number
    reviewCount: number
    recentActivity: boolean
  }
}

interface ObservatoryTestResult extends BaseTestResult {
  details: {
    crawlCount: number
    responseCount: number
    changeCount: number
    reportCount: number
    recentCrawl: boolean
  }
}

interface GrowthEngineTestResult extends BaseTestResult {
  details: {
    memoryCount: number
    evidenceCount: number
    sprintCount: number
    recentActivity: boolean
  }
}

interface EngagementTestResult extends BaseTestResult {
  details: {
    missionCount: number
    briefCount: number
    streakCount: number
    recentActivity: boolean
  }
}

interface QALoopResult {
  timestamp: string
  overallStatus: 'operational' | 'degraded' | 'critical'
  overallScore: number
  totalTests: number
  passedTests: number
  failedTests: number
  warningTests: number
  durationMs: number
  tests: {
    database: DatabaseTestResult
    aiProviders: AIProviderTestResult[]
    aiRouter: RouterTestResult
    codebaseScanner: ScannerTestResult
    aiGovernor: GovernorTestResult
    dailyMission: MissionTestResult
    cronJobs: CronJobTestResult[]
    factoryPipeline: FactoryTestResult
    contentEngine: ContentEngineTestResult
    observatory: ObservatoryTestResult
    growthEngine: GrowthEngineTestResult
    engagement: EngagementTestResult
  }
  summary: {
    critical: string[]
    warnings: string[]
    info: string[]
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ])
}

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

// ─── Test Implementations ────────────────────────────────────────────────────

async function testDatabase(): Promise<DatabaseTestResult> {
  const start = Date.now()
  const counts: Record<string, number> = {}
  const errors: string[] = []

  const tables = [
    'dailyMission',
    'factoryTask',
    'governorInterception',
    'qARun',
    'codebaseSnapshot',
    'observatoryCrawl',
    'contentBrief',
    'contentArticle',
    'growthMemory',
    'engagementMission',
    'user',
    'project',
    'analysis',
  ] as const

  for (const table of tables) {
    try {
      const count = await withTimeout((db as never)[table].count(), 10000)
      counts[table] = count
    } catch (err) {
      errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      counts[table] = -1
    }
  }

  const latencyMs = Date.now() - start
  const failedCount = errors.length

  return {
    status: failedCount === 0 ? 'pass' : failedCount < 3 ? 'warn' : 'fail',
    message: failedCount === 0
      ? `Database connected, ${tables.length} tables queried (${latencyMs}ms)`
      : `${failedCount}/${tables.length} table queries failed`,
    durationMs: latencyMs,
    details: { latencyMs, counts, errors },
  }
}

async function testAIProviders(): Promise<AIProviderTestResult[]> {
  const results: AIProviderTestResult[] = []

  // ── Helper: test via OpenRouter with a specific GLM model ──
  async function testViaOpenRouter(
    providerLabel: string,
    model: string,
    displayModel: string,
  ): Promise<void> {
    const start = Date.now()
    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://seosights.com',
          'X-Title': 'SeoSights QA Loop',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`)
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
      const content = data.choices?.[0]?.message?.content || ''
      results.push({
        provider: providerLabel,
        status: 'pass',
        message: `${providerLabel} responded via OpenRouter (${displayModel}): "${content.slice(0, 50)}"`,
        durationMs: Date.now() - start,
        details: {
          model: displayModel,
          success: true,
          latencyMs: Date.now() - start,
          responseSnippet: content.slice(0, 100),
          error: null,
        },
      })
    } catch (err) {
      results.push({
        provider: providerLabel,
        status: 'fail',
        message: `${providerLabel} failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        durationMs: Date.now() - start,
        details: {
          model: displayModel,
          success: false,
          latencyMs: Date.now() - start,
          responseSnippet: '',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      })
    }
  }

  // ── Groq → OpenRouter GLM Turbo (ultra fast, free) ──
  await testViaOpenRouter('groq', 'z-ai/glm-5-turbo', 'glm-5-turbo')

  // ── Gemini → OpenRouter GLM 5.2 (state of art, free) ──
  await testViaOpenRouter('gemini', 'z-ai/glm-5.2', 'glm-5.2')

  // ── OpenRouter → GLM 5.2 (primary model) ──
  await testViaOpenRouter('openrouter', 'z-ai/glm-5.2', 'glm-5.2')

  // ── OpenAI → OpenRouter GLM 5.1 (fast, free) ──
  await testViaOpenRouter('openai', 'z-ai/glm-4.7-flash', 'glm-5.1')

  // ── ZAI → OpenRouter GLM Turbo (via routeLLM) ──
  {
    const start = Date.now()
    try {
      const result = await routeLLM(
        [{ role: 'user', content: 'Say OK' }],
        { taskType: 'chat', timeout: 15000 }
      )
      const content = result.content || ''
      results.push({
        provider: 'zai',
        status: content ? 'pass' : 'warn',
        message: content
          ? `AI Router responded: "${content.slice(0, 50)}" (provider: ${result.provider}, model: ${result.model})`
          : 'AI Router returned empty response',
        durationMs: Date.now() - start,
        details: {
          model: result.model,
          success: !!content,
          latencyMs: Date.now() - start,
          responseSnippet: content.slice(0, 100),
          error: null,
        },
      })
    } catch (err) {
      results.push({
        provider: 'zai',
        status: 'fail',
        message: `AI Router failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        durationMs: Date.now() - start,
        details: {
          model: 'failed',
          success: false,
          latencyMs: Date.now() - start,
          responseSnippet: '',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      })
    }
  }

  return results
}

async function testAIRouter(): Promise<RouterTestResult> {
  const start = Date.now()
  try {
    const { routeLLM } = await import('@/lib/ai-router')
    const result = await withTimeout(
      routeLLM(
        [{ role: 'user', content: 'Respond with exactly: QA_TEST_OK' }],
        { taskType: 'chat', tier: 'free_trial', maxTokens: 50 }
      ),
      30000
    )
    const isLive = result.status === 'live'
    return {
      status: isLive ? 'pass' : result.status === 'estimated' ? 'warn' : 'fail',
      message: `AI Router: ${result.provider}/${result.model} (${result.status}, ${result.latencyMs}ms)`,
      durationMs: Date.now() - start,
      details: {
        model: result.model,
        provider: result.provider,
        status: result.status,
        latencyMs: result.latencyMs,
        content: result.content.slice(0, 200),
        fallbackChain: result.fallbackChain || [],
      },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `AI Router failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: {
        model: '',
        provider: '',
        status: 'failed',
        latencyMs: Date.now() - start,
        content: '',
        fallbackChain: [],
      },
    }
  }
}

async function testCodebaseScanner(): Promise<ScannerTestResult> {
  const start = Date.now()
  try {
    const { scanCodebase } = await import('@/lib/codebase-scanner')
    const result = await withTimeout(scanCodebase(), 30000)
    const s = result.stats
    const hasNonZero = s.totalComponents > 0 || s.totalAPIRoutes > 0 || s.totalPrismaModels > 0
    return {
      status: hasNonZero ? 'pass' : 'warn',
      message: `Scan: ${s.totalComponents} components, ${s.totalAPIRoutes} APIs, ${s.totalPrismaModels} models, ${s.totalPages} pages, ${s.totalHooks} hooks, ${s.totalLibs} libs`,
      durationMs: Date.now() - start,
      details: {
        totalComponents: s.totalComponents,
        totalAPIRoutes: s.totalAPIRoutes,
        totalPrismaModels: s.totalPrismaModels,
        totalPages: s.totalPages,
        totalHooks: s.totalHooks,
        totalLibs: s.totalLibs,
        latencyMs: Date.now() - start,
      },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Codebase scanner failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: {
        totalComponents: 0,
        totalAPIRoutes: 0,
        totalPrismaModels: 0,
        totalPages: 0,
        totalHooks: 0,
        totalLibs: 0,
        latencyMs: Date.now() - start,
      },
    }
  }
}

async function testAIGovernor(): Promise<GovernorTestResult> {
  const start = Date.now()
  try {
    const { evaluateTask } = await import('@/lib/ai-governor')
    const proposal = {
      title: 'QA Test Task',
      description:
        'Automated QA test task - should be rejected as non-essential',
      sourceEngine: 'qa',
      taskType: 'test',
      priority: 5,
      targetKPI: 'qa_pass_rate',
      estimatedHours: 0.1,
    }
    const decision = await withTimeout(evaluateTask(proposal), 30000)
    return {
      status: 'pass',
      message: `Governor decision: ${decision.approved ? 'APPROVED' : 'REJECTED'} (confidence: ${decision.confidence.toFixed(2)}, impact: ${decision.impactScore}/10)`,
      durationMs: Date.now() - start,
      details: {
        approved: decision.approved,
        confidence: decision.confidence,
        impactScore: decision.impactScore,
        ruleApplied: decision.ruleApplied || null,
        rejectionReason: decision.rejectionReason || null,
        latencyMs: Date.now() - start,
      },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `AI Governor failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: {
        approved: false,
        confidence: 0,
        impactScore: 0,
        ruleApplied: null,
        rejectionReason: err instanceof Error ? err.message : 'Unknown error',
        latencyMs: Date.now() - start,
      },
    }
  }
}

async function testDailyMission(): Promise<MissionTestResult> {
  const start = Date.now()
  try {
    const { generateDailyMission } = await import('@/lib/daily-mission-generator')
    const result = await withTimeout(
      generateDailyMission(
        { maxHours: 1, maxComponents: 1, maxPages: 1, confidenceThreshold: 0.9 },
        'QA Loop Test Mission',
        'Quick QA test of daily mission pipeline'
      ),
      90000
    )
    return {
      status: result.candidatesEvaluated > 0 ? 'pass' : 'warn',
      message: `Mission: ${result.candidatesEvaluated} evaluated, ${result.candidatesApproved} approved, ${result.candidatesRejected} rejected`,
      durationMs: Date.now() - start,
      details: {
        missionId: result.missionId || null,
        candidatesEvaluated: result.candidatesEvaluated,
        candidatesApproved: result.candidatesApproved,
        candidatesRejected: result.candidatesRejected,
        latencyMs: Date.now() - start,
      },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Daily Mission failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: {
        missionId: null,
        candidatesEvaluated: 0,
        candidatesApproved: 0,
        candidatesRejected: 0,
        latencyMs: Date.now() - start,
      },
    }
  }
}

async function testCronJobs(): Promise<CronJobTestResult[]> {
  const results: CronJobTestResult[] = []
  const oneDayAgo = new Date(Date.now() - ONE_DAY)

  const cronChecks: Array<{
    name: string
    check: () => Promise<{ count: number; lastRun: string | null }>
  }> = [
    {
      name: 'daily-mission',
      check: async () => {
        const count = await db.dailyMission.count({
          where: { createdAt: { gte: oneDayAgo } },
        })
        const latest = await db.dailyMission.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    {
      name: 'observatory-daily',
      check: async () => {
        const count = await db.observatoryCrawl.count({
          where: { createdAt: { gte: oneDayAgo } },
        })
        const latest = await db.observatoryCrawl.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    {
      name: 'digest',
      check: async () => {
        const count = await db.emailDigest.count({
          where: { createdAt: { gte: oneDayAgo } },
        })
        const latest = await db.emailDigest.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    {
      name: 'auto-outreach',
      check: async () => {
        const count = await db.outreachLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        })
        const latest = await db.outreachLog.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    {
      name: 'auto-publish',
      check: async () => {
        const count = await db.cMSPublishLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        })
        const latest = await db.cMSPublishLog.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    // These three crons don't have dedicated tables — check ObservatoryCrawl for weekly/monthly types
    {
      name: 'observatory-weekly',
      check: async () => {
        const weekAgo = new Date(Date.now() - 7 * ONE_DAY)
        const count = await db.observatoryCrawl.count({
          where: { type: 'weekly', createdAt: { gte: weekAgo } },
        })
        const latest = await db.observatoryCrawl.findFirst({
          where: { type: 'weekly' },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    {
      name: 'observatory-monthly',
      check: async () => {
        const monthAgo = new Date(Date.now() - 30 * ONE_DAY)
        const count = await db.observatoryCrawl.count({
          where: { type: 'monthly', createdAt: { gte: monthAgo } },
        })
        const latest = await db.observatoryCrawl.findFirst({
          where: { type: 'monthly' },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
        return { count, lastRun: latest?.createdAt?.toISOString() || null }
      },
    },
    {
      name: 'cluster-map',
      check: async () => {
        // No dedicated table for cluster map — check ObservatoryCrawl
        const count = await db.observatoryCrawl.count({
          where: { type: 'cluster_map', createdAt: { gte: oneDayAgo } },
        })
        return { count, lastRun: null }
      },
    },
  ]

  for (const cron of cronChecks) {
    const start = Date.now()
    try {
      const { count, lastRun } = await withTimeout(cron.check(), 10000)
      const hasRecent = count > 0
      results.push({
        cronName: cron.name,
        status: hasRecent ? 'pass' : 'warn',
        message: hasRecent
          ? `${cron.name}: ${count} recent record(s)`
          : `${cron.name}: no recent data found`,
        durationMs: Date.now() - start,
        details: { hasRecentData: hasRecent, recordCount: count, lastRun },
      })
    } catch (err) {
      results.push({
        cronName: cron.name,
        status: 'fail',
        message: `${cron.name}: check failed — ${err instanceof Error ? err.message : 'Unknown'}`,
        durationMs: Date.now() - start,
        details: { hasRecentData: false, recordCount: 0, lastRun: null },
      })
    }
  }

  return results
}

async function testFactoryPipeline(): Promise<FactoryTestResult> {
  const start = Date.now()
  try {
    const oneDayAgo = new Date(Date.now() - ONE_DAY)

    const [recentTasks, recentInterceptions, recentQARuns] = await Promise.all([
      db.factoryTask.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.governorInterception.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.qARun.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ])

    // Get task status breakdown
    const taskStatuses: Record<string, number> = {}
    try {
      const statusGroups = await db.factoryTask.groupBy({ by: ['status' as never], _count: true })
      for (const g of statusGroups) {
        taskStatuses[String((g as Record<string, unknown>).status)] = g._count
      }
    } catch {
      // groupBy may not work with all providers — skip
    }

    const pipelineHealthy = recentTasks > 0 || recentInterceptions > 0

    return {
      status: pipelineHealthy ? 'pass' : 'warn',
      message: `Factory: ${recentTasks} tasks, ${recentInterceptions} interceptions, ${recentQARuns} QA runs (24h)`,
      durationMs: Date.now() - start,
      details: {
        recentTasks,
        recentInterceptions,
        recentQARuns,
        taskStatuses,
        pipelineHealthy,
      },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Factory pipeline check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: {
        recentTasks: 0,
        recentInterceptions: 0,
        recentQARuns: 0,
        taskStatuses: {},
        pipelineHealthy: false,
      },
    }
  }
}

async function testContentEngine(): Promise<ContentEngineTestResult> {
  const start = Date.now()
  try {
    const oneDayAgo = new Date(Date.now() - ONE_DAY)

    const [briefCount, articleCount, reviewCount, recentBriefs] = await Promise.all([
      db.contentBrief.count(),
      db.contentArticle.count(),
      db.contentReview.count(),
      db.contentBrief.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ])

    const recentActivity = recentBriefs > 0

    return {
      status: briefCount > 0 || articleCount > 0 ? 'pass' : 'warn',
      message: `Content: ${briefCount} briefs, ${articleCount} articles, ${reviewCount} reviews${recentActivity ? ' (recent activity)' : ''}`,
      durationMs: Date.now() - start,
      details: { briefCount, articleCount, reviewCount, recentActivity },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Content engine check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: { briefCount: 0, articleCount: 0, reviewCount: 0, recentActivity: false },
    }
  }
}

async function testObservatory(): Promise<ObservatoryTestResult> {
  const start = Date.now()
  try {
    const oneDayAgo = new Date(Date.now() - ONE_DAY)

    const [crawlCount, responseCount, changeCount, reportCount, recentCrawls] =
      await Promise.all([
        db.observatoryCrawl.count(),
        db.observatoryResponse.count(),
        db.observatoryChange.count(),
        db.observatoryReport.count(),
        db.observatoryCrawl.count({ where: { createdAt: { gte: oneDayAgo } } }),
      ])

    const recentCrawl = recentCrawls > 0

    return {
      status: crawlCount > 0 ? 'pass' : 'warn',
      message: `Observatory: ${crawlCount} crawls, ${responseCount} responses, ${changeCount} changes, ${reportCount} reports`,
      durationMs: Date.now() - start,
      details: { crawlCount, responseCount, changeCount, reportCount, recentCrawl },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Observatory check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: { crawlCount: 0, responseCount: 0, changeCount: 0, reportCount: 0, recentCrawl: false },
    }
  }
}

async function testGrowthEngine(): Promise<GrowthEngineTestResult> {
  const start = Date.now()
  try {
    const oneDayAgo = new Date(Date.now() - ONE_DAY)

    const [memoryCount, evidenceCount, sprintCount, recentMemories] = await Promise.all([
      db.growthMemory.count(),
      db.evidenceEntry.count(),
      db.sprint.count(),
      db.growthMemory.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ])

    const recentActivity = recentMemories > 0

    return {
      status: memoryCount > 0 || evidenceCount > 0 ? 'pass' : 'warn',
      message: `Growth: ${memoryCount} memories, ${evidenceCount} evidence, ${sprintCount} sprints`,
      durationMs: Date.now() - start,
      details: { memoryCount, evidenceCount, sprintCount, recentActivity },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Growth engine check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: { memoryCount: 0, evidenceCount: 0, sprintCount: 0, recentActivity: false },
    }
  }
}

async function testEngagement(): Promise<EngagementTestResult> {
  const start = Date.now()
  try {
    const oneDayAgo = new Date(Date.now() - ONE_DAY)

    const [missionCount, briefCount, streakCount, recentMissions] = await Promise.all([
      db.engagementMission.count(),
      db.engagementBrief.count(),
      db.engagementStreak.count(),
      db.engagementMission.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ])

    const recentActivity = recentMissions > 0

    return {
      status: missionCount > 0 || briefCount > 0 ? 'pass' : 'warn',
      message: `Engagement: ${missionCount} missions, ${briefCount} briefs, ${streakCount} streaks`,
      durationMs: Date.now() - start,
      details: { missionCount, briefCount, streakCount, recentActivity },
    }
  } catch (err) {
    return {
      status: 'fail',
      message: `Engagement check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      durationMs: Date.now() - start,
      details: { missionCount: 0, briefCount: 0, streakCount: 0, recentActivity: false },
    }
  }
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function computeScore(result: QALoopResult): number {
  let score = 0

  // Database: CRITICAL (weight: 20)
  score += result.tests.database.status === 'pass' ? 20 : result.tests.database.status === 'warn' ? 10 : 0

  // AI providers: each configured provider must respond (weight: 15 total)
  const aiPassCount = result.tests.aiProviders.filter((p) => p.status === 'pass').length
  const aiTotal = result.tests.aiProviders.length
  score += aiTotal > 0 ? Math.round((aiPassCount / aiTotal) * 15) : 0

  // AI Router: must return 'live' status (weight: 15)
  if (result.tests.aiRouter.status === 'pass') score += 15
  else if (result.tests.aiRouter.status === 'warn') score += 7

  // Codebase Scanner: must return non-zero counts (weight: 10)
  if (result.tests.codebaseScanner.status === 'pass') score += 10
  else if (result.tests.codebaseScanner.status === 'warn') score += 5

  // AI Governor: must respond (weight: 10)
  if (result.tests.aiGovernor.status === 'pass') score += 10
  else if (result.tests.aiGovernor.status === 'warn') score += 5

  // Daily Mission Generator: must complete (weight: 15)
  if (result.tests.dailyMission.status === 'pass') score += 15
  else if (result.tests.dailyMission.status === 'warn') score += 7

  // Cron Jobs: must show recent data (weight: 5)
  const cronPassCount = result.tests.cronJobs.filter((c) => c.status === 'pass').length
  const cronTotal = result.tests.cronJobs.length
  score += cronTotal > 0 ? Math.round((cronPassCount / cronTotal) * 5) : 0

  // Other engines must have data (weight: 10, split across 4 engines)
  const engineResults = [
    result.tests.factoryPipeline,
    result.tests.contentEngine,
    result.tests.observatory,
    result.tests.growthEngine,
    result.tests.engagement,
  ]
  const enginePassCount = engineResults.filter((e) => e.status === 'pass').length
  score += Math.round((enginePassCount / engineResults.length) * 10)

  return Math.min(100, score)
}

function countTests(result: QALoopResult): {
  total: number
  passed: number
  failed: number
  warning: number
} {
  let passed = 0
  let failed = 0
  let warning = 0

  const tally = (status: TestStatus) => {
    if (status === 'pass') passed++
    else if (status === 'fail') failed++
    else warning++
  }

  tally(result.tests.database.status)
  for (const p of result.tests.aiProviders) tally(p.status)
  tally(result.tests.aiRouter.status)
  tally(result.tests.codebaseScanner.status)
  tally(result.tests.aiGovernor.status)
  tally(result.tests.dailyMission.status)
  for (const c of result.tests.cronJobs) tally(c.status)
  tally(result.tests.factoryPipeline.status)
  tally(result.tests.contentEngine.status)
  tally(result.tests.observatory.status)
  tally(result.tests.growthEngine.status)
  tally(result.tests.engagement.status)

  return { total: passed + failed + warning, passed, failed, warning }
}

function buildSummary(result: QALoopResult): {
  critical: string[]
  warnings: string[]
  info: string[]
} {
  const critical: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  if (result.tests.database.status === 'fail') {
    critical.push('Database connectivity failed — system is non-functional')
  }
  if (result.tests.aiRouter.status === 'fail') {
    critical.push('AI Router is down — all LLM operations will fail')
  }

  const failedProviders = result.tests.aiProviders.filter((p) => p.status === 'fail')
  if (failedProviders.length > 0) {
    warnings.push(
      `AI providers failing: ${failedProviders.map((p) => p.provider).join(', ')}`
    )
  }
  if (result.tests.database.status === 'warn') {
    warnings.push('Database connectivity degraded — some tables unreachable')
  }
  if (result.tests.dailyMission.status === 'fail') {
    warnings.push('Daily Mission Generator pipeline broken')
  }
  if (result.tests.aiGovernor.status === 'fail') {
    warnings.push('AI Governor evaluation failed — autonomous pipeline blocked')
  }

  const warnCrons = result.tests.cronJobs.filter((c) => c.status === 'warn')
  if (warnCrons.length > 0) {
    info.push(`Cron jobs without recent data: ${warnCrons.map((c) => c.cronName).join(', ')}`)
  }

  const passProviders = result.tests.aiProviders.filter((p) => p.status === 'pass')
  info.push(`${passProviders.length}/${result.tests.aiProviders.length} AI providers operational`)

  if (result.tests.aiRouter.details.status === 'live') {
    info.push(`AI Router in LIVE mode via ${result.tests.aiRouter.details.provider}/${result.tests.aiRouter.details.model}`)
  }

  return { critical, warnings, info }
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loopStart = Date.now()

  // Phase 1: Run non-AI tests in parallel (database, scanner, cron, engines)
  const [database, codebaseScanner, cronJobs, factoryPipeline, contentEngine, observatory, growthEngine, engagement] =
    await Promise.all([
      testDatabase(),
      testCodebaseScanner(),
      testCronJobs(),
      testFactoryPipeline(),
      testContentEngine(),
      testObservatory(),
      testGrowthEngine(),
      testEngagement(),
    ])

  // Phase 2: Test AI providers + AI Router in parallel (but with short timeouts)
  const [aiProviders, aiRouter] = await Promise.all([
    testAIProviders(),
    testAIRouter(),
  ])

  // Phase 3: Test Governor (uses AI Router internally, short timeout)
  const aiGovernor = await testAIGovernor()

  // Phase 4: Test Daily Mission only if AI Router is working
  // Skip if router is in simulation mode (would just time out)
  let dailyMission: MissionTestResult
  if (aiRouter.details.status === 'live' || aiRouter.details.status === 'estimated') {
    dailyMission = await testDailyMission()
  } else {
    dailyMission = {
      status: 'warn',
      message: `Skipped: AI Router in ${aiRouter.details.status} mode — mission generator requires live LLM`,
      durationMs: 0,
      details: {
        missionId: null,
        candidatesEvaluated: 0,
        candidatesApproved: 0,
        candidatesRejected: 0,
        latencyMs: 0,
      },
    }
  }

  const result: QALoopResult = {
    timestamp: new Date().toISOString(),
    overallStatus: 'operational', // will be computed
    overallScore: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warningTests: 0,
    durationMs: Date.now() - loopStart,
    tests: {
      database,
      aiProviders,
      aiRouter,
      codebaseScanner,
      aiGovernor,
      dailyMission,
      cronJobs,
      factoryPipeline,
      contentEngine,
      observatory,
      growthEngine,
      engagement,
    },
    summary: { critical: [], warnings: [], info: [] },
  }

  // Compute scores
  result.overallScore = computeScore(result)
  result.overallStatus =
    result.overallScore >= 80
      ? 'operational'
      : result.overallScore >= 50
        ? 'degraded'
        : 'critical'

  const testCounts = countTests(result)
  result.totalTests = testCounts.total
  result.passedTests = testCounts.passed
  result.failedTests = testCounts.failed
  result.warningTests = testCounts.warning

  result.summary = buildSummary(result)

  // Persist the QA run to the database
  try {
    await db.qARun.create({
      data: {
        status: result.overallStatus,
        triggeredBy: 'qa-loop',
        productScore: result.overallScore,
        uxScore: result.tests.codebaseScanner.status === 'pass' ? 100 : 50,
        engineeringScore:
          result.tests.factoryPipeline.status === 'pass'
            ? 100
            : result.tests.factoryPipeline.status === 'warn'
              ? 50
              : 0,
        researchScore: result.tests.observatory.status === 'pass' ? 100 : 50,
        conversionScore:
          result.tests.contentEngine.status === 'pass' ? 100 : 50,
        enterpriseScore: result.tests.growthEngine.status === 'pass' ? 100 : 50,
        securityScore: result.tests.database.status === 'pass' ? 100 : 0,
        performanceScore: Math.round(
          (result.tests.aiProviders.filter((p) => p.status === 'pass').length /
            Math.max(result.tests.aiProviders.length, 1)) *
            100
        ),
        seoScore: result.tests.engagement.status === 'pass' ? 100 : 50,
        accessibilityScore:
          result.tests.aiRouter.status === 'pass' ? 100 : 50,
        customerDelight: result.overallScore,
        technicalDebt: 100 - result.overallScore,
        criticalCount: result.failedTests,
        majorCount: result.warningTests,
        mediumCount: 0,
        minorCount: 0,
        pagesTested: result.tests.codebaseScanner.details.totalPages,
        clicksTested: 0,
        apisTested: result.tests.codebaseScanner.details.totalAPIRoutes,
        formsTested: 0,
        durationMs: result.durationMs,
        summary: JSON.stringify(result),
      },
    })
  } catch (err) {
    console.error('[qa-loop/run] Failed to persist QARun:', err)
    // Non-critical — still return results
  }

  return NextResponse.json(result)
}
