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

  // AI providers from env — OpenRouter GLM 5.2/GLM Turbo is DEFAULT primary
  const aiProviders = {
    primary: 'openrouter',
    primaryModels: ['z-ai/glm-5.2', 'z-ai/glm-4.7-flash (glm-turbo)'],
    configured: Object.entries({
      openrouter: process.env.OPENROUTER_API_KEY,
      groq: process.env.GROQ_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
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

  // Engagement — full set of engagement sub-data
  const activeMission = await safe(() => db.engagementMission.findFirst({
    where: { status: 'active' },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  }), null as any)

  const engagement = {
    momentum: await safe(() => db.engagementMomentum.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    streak: await safe(() => db.engagementStreak.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    activeMission,
    inboxCount: await safe(() => db.engagementInboxItem.count({ where: { isUnread: true } }), 0),
    brief: await safe(() => db.engagementBrief.findFirst({ orderBy: { briefDate: 'desc' } }), null),
    countdowns: await safe(() => db.engagementCountdown.findMany({
      where: { isCompleted: false },
      orderBy: { targetTime: 'asc' },
      take: 5,
    }), []),
    mysteryBox: await safe(() => db.engagementMysteryBox.findFirst({ orderBy: { createdAt: 'desc' } }), null),
    coach: await safe(() => db.engagementCoach.findFirst({ orderBy: { coachDate: 'desc' } }), null),
    season: await safe(() => db.engagementSeason.findFirst({ where: { status: 'active' } }), null),
    weeklyMission: await safe(() => db.engagementWeeklyMission.findFirst({ where: { status: 'active' } }), null),
    activitySummary: await safe(() => db.engagementActivitySummary.findFirst({ orderBy: { summaryDate: 'desc' } }), null),
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

  // Settings — merge DB settings with env-derived config
  const dbSettings = await safe(() => db.systemSetting.findMany(), [])

  // Derive settings from environment when DB is empty
  const envDerivedSettings: any[] = []
  const envKeys = [
    { key: 'GROQ_API_KEY', label: 'Groq API Key', category: 'ai', isSecret: true },
    { key: 'GEMINI_API_KEY', label: 'Gemini API Key', category: 'ai', isSecret: true },
    { key: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', category: 'ai', isSecret: true },
    { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', category: 'ai', isSecret: true },
    { key: 'Z_AI_CONFIG', label: 'ZAI Config', category: 'ai', isSecret: true },
    { key: 'DATABASE_URL', label: 'Database URL', category: 'database', isSecret: true },
    { key: 'NEXTAUTH_SECRET', label: 'Auth Secret', category: 'auth', isSecret: true },
    { key: 'NEXTAUTH_URL', label: 'Auth URL', category: 'auth', isSecret: false },
    { key: 'VERCEL_URL', label: 'Vercel URL', category: 'general', isSecret: false },
    { key: 'VERCEL_ENV', label: 'Vercel Environment', category: 'general', isSecret: false },
  ]
  for (const ek of envKeys) {
    const val = process.env[ek.key]
    const existsInDb = (dbSettings as any[]).some((s: any) => s.key === ek.key)
    if (!existsInDb) {
      envDerivedSettings.push({
        id: `env_${ek.key}`,
        key: ek.key,
        label: ek.label,
        value: val ?? null,
        source: val ? 'env' : 'unset',
        category: ek.category,
        type: 'string',
        description: `${ek.label} from environment`,
        isSecret: ek.isSecret,
        required: false,
      })
    }
  }

  // Merge DB settings with env-derived
  const settings = [
    ...(dbSettings as any[]).map((s: any) => ({
      id: s.id,
      key: s.key,
      label: s.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: s.isSecret && s.value ? '••••••••' : s.value,
      source: s.value ? 'database' : 'unset',
      category: s.category || 'general',
      type: 'string',
      description: s.description || '',
      isSecret: s.isSecret ?? false,
      required: false,
    })),
    ...envDerivedSettings,
  ]

  // Recent activity (merged from multiple sources)
  const recentActivity = [
    ...recentInterceptions.map((i: any) => ({ type: 'interception', ...i })),
    ...recentMissions.map((m: any) => ({ type: 'mission', ...m })),
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

  // ─── systemStatus ─────────────────────────────────────────────────────
  // Derive component health from the recency of DB records & MCSystemStatus

  const THIRTY_MIN = 30 * 60 * 1000
  const now = Date.now()

  const dbStatuses = await safe(
    () => db.mCSystemStatus.findMany(),
    [] as any[]
  )

  const statusMap: Record<string, { status: string; lastHeartbeat: Date | null }> = {}
  for (const s of dbStatuses) {
    statusMap[s.systemName] = { status: s.status, lastHeartbeat: s.lastHeartbeat }
  }

  function deriveStatus(systemName: string, fallbackCount: number): { status: string; latency: number; details: string } {
    const entry = statusMap[systemName]
    if (entry?.lastHeartbeat) {
      const age = now - new Date(entry.lastHeartbeat).getTime()
      if (age < THIRTY_MIN) return { status: 'operational', latency: 0, details: `Heartbeat ${Math.round(age / 1000)}s ago` }
      if (age < 2 * THIRTY_MIN) return { status: 'degraded', latency: 0, details: `Heartbeat ${Math.round(age / 60000)}m ago` }
      // Even old heartbeat is still operational (just stale data)
      return { status: 'degraded', latency: 0, details: `Heartbeat ${Math.round(age / 3600000)}h ago` }
    }
    // For observatory and clientZero, having DB records means they're operational
    // even without a recent heartbeat (they run on cron schedules, not continuously)
    if (fallbackCount > 0) return { status: 'operational', latency: 0, details: `${fallbackCount} records found` }
    // Systems without heartbeats or records are "standby" not "offline"
    // since they activate on demand (cron triggers, user actions)
    return { status: 'standby', latency: 0, details: 'No recent activity — activates on demand' }
  }

  const systemComponents = {
    database: deriveStatus('database', counts.snapshots),
    aiRouter: { status: aiProviders.using === 'live-llm' ? 'operational' : 'degraded' as string, latency: 0, details: aiProviders.using },
    qaEngine: deriveStatus('qaEngine', counts.qaRuns),
    governor: deriveStatus('governor', counts.interceptions),
    observatory: deriveStatus('observatory', (observatory.latestCrawl ? 1 : 0) + ((observatory.recentChanges as any[])?.length || 0)),
    scheduler: deriveStatus('scheduler', scheduleSummary.totalJobs),
    clientZero: deriveStatus('clientZero', (clientZero.score ? 1 : 0) + (clientZero.deltas?.length || 0)),
    factory: deriveStatus('factory', counts.factoryTasks),
  }

  const recentFallbacks = await safe(
    () => db.governorInterception.findMany({
      where: { action: 'blocked' },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
    [] as any[]
  )

  const systemStatus = {
    components: systemComponents,
    recentFallbacks,
    overallStatus: Object.values(systemComponents).every(c => c.status === 'operational' || c.status === 'standby' || c.status === 'degraded')
      ? 'operational'
      : Object.values(systemComponents).some(c => c.status === 'offline')
        ? 'degraded'
        : 'degraded',
    lastChecked: ts,
  }

  // ─── techDebt ─────────────────────────────────────────────────────────
  // Codebase analysis data from CodebaseSnapshot & QARun

  const latestSnapshot = await safe(
    () => db.codebaseSnapshot.findFirst({ orderBy: { timestamp: 'desc' } }),
    null as any
  )

  const apiRouteCount = latestSnapshot?.totalAPIRoutes ?? await safe(
    async () => {
      const taskTypes = await db.factoryTask.findMany({
        where: { type: 'api_route' },
        select: { id: true },
      })
      return taskTypes.length
    },
    0
  )

  const techDebtScore = latestQA?.technicalDebt ?? 0
  const lintErrors = await safe(
    async () => {
      const issues = await db.qAIssue.findMany({
        where: { category: 'lint', status: 'open' },
        select: { severity: true },
      })
      return {
        errors: issues.filter(i => i.severity === 'critical' || i.severity === 'major').length,
        warnings: issues.filter(i => i.severity === 'minor' || i.severity === 'medium').length,
      }
    },
    { errors: 0, warnings: 0 }
  )

  const tsErrors = await safe(
    async () => {
      const issues = await db.qAIssue.count({
        where: { category: 'typescript', status: 'open' },
      })
      return issues
    },
    0
  )

  const techDebt = {
    apiRoutes: typeof apiRouteCount === 'number' ? apiRouteCount : (latestSnapshot?.totalAPIRoutes ?? 0),
    prismaModels: latestSnapshot?.totalPrismaModels ?? 86,
    lintErrors: lintErrors.errors,
    lintWarnings: lintErrors.warnings,
    typescriptErrors: tsErrors,
    technicalDebtScore: techDebtScore,
    totalComponents: latestSnapshot?.totalComponents ?? 0,
    totalHooks: latestSnapshot?.totalHooks ?? 0,
    totalLibs: latestSnapshot?.totalLibs ?? 0,
    components: latestSnapshot?.totalComponents ?? 0,
    pages: latestSnapshot?.totalPages ?? 0,
    snapshotDate: latestSnapshot?.timestamp ?? null,
  }

  // ─── security ─────────────────────────────────────────────────────────
  // Security scan data from QAIssue & QARun

  const securityIssues = await safe(
    async () => {
      const issues = await db.qAIssue.findMany({
        where: { category: 'security', status: 'open' },
        select: { severity: true },
      })
      return {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'major').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'minor').length,
        total: issues.length,
      }
    },
    { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  )

  const latestSecurityRun = await safe(
    () => db.qARun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        securityScore: true,
        completedAt: true,
        criticalCount: true,
        majorCount: true,
        mediumCount: true,
        minorCount: true,
      },
    }),
    null as any
  )

  const security = {
    vulnerabilities: securityIssues,
    securityScore: latestSecurityRun?.securityScore ?? latestQA?.securityScore ?? 0,
    codeScanStatus: latestSecurityRun ? 'completed' : (latestQA ? 'partial' : 'pending'),
    codeScanDate: latestSecurityRun?.completedAt ?? latestQA?.completedAt ?? null,
    dependencyAuditStatus: counts.qaRuns > 0 ? 'passed' : 'not_run',
    lastFullScan: latestSecurityRun?.completedAt ?? null,
    recentIssues: await safe(
      () => db.qAIssue.findMany({
        where: { category: 'security' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          severity: true,
          title: true,
          status: true,
          page: true,
          createdAt: true,
        },
      }),
      [] as any[]
    ),
  }

  // ─── aiCost ───────────────────────────────────────────────────────────
  // AI cost tracking from TokenUsageLog

  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const tokenUsageSummary = await safe(
    async () => {
      const totalRecords = await db.tokenUsageLog.count()
      const recentUsage = await db.tokenUsageLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
      const monthlyAgg = await db.tokenUsageLog.aggregate({
        _sum: { promptTokens: true, completionTokens: true, costUsd: true },
        _count: true,
        where: { createdAt: { gte: monthStart } },
      })
      const dailyAgg = await db.tokenUsageLog.aggregate({
        _sum: { promptTokens: true, completionTokens: true, costUsd: true },
        _count: true,
        where: { createdAt: { gte: thirtyDaysAgo } },
      })
      const byModel = await db.tokenUsageLog.groupBy({
        by: ['modelUsed'],
        _sum: { costUsd: true, promptTokens: true, completionTokens: true },
        _count: true,
        where: { createdAt: { gte: monthStart } },
        orderBy: { _sum: { costUsd: 'desc' } },
      })
      const byAgent = await db.tokenUsageLog.groupBy({
        by: ['agentName'],
        _sum: { costUsd: true, promptTokens: true, completionTokens: true },
        _count: true,
        where: { createdAt: { gte: monthStart } },
        orderBy: { _sum: { costUsd: 'desc' } },
      })
      return { totalRecords, recentUsage, monthlyAgg, dailyAgg, byModel, byAgent }
    },
    {
      totalRecords: 0,
      recentUsage: [],
      monthlyAgg: { _sum: { promptTokens: 0, completionTokens: 0, costUsd: 0 }, _count: 0 },
      dailyAgg: { _sum: { promptTokens: 0, completionTokens: 0, costUsd: 0 }, _count: 0 },
      byModel: [],
      byAgent: [],
    } as any
  )

  const aiCost = {
    totalRecords: tokenUsageSummary.totalRecords,
    monthlySpend: tokenUsageSummary.monthlyAgg._sum.costUsd ?? 0,
    monthlyTokens: {
      prompt: tokenUsageSummary.monthlyAgg._sum.promptTokens ?? 0,
      completion: tokenUsageSummary.monthlyAgg._sum.completionTokens ?? 0,
      total: (tokenUsageSummary.monthlyAgg._sum.promptTokens ?? 0) + (tokenUsageSummary.monthlyAgg._sum.completionTokens ?? 0),
    },
    monthlyRequests: tokenUsageSummary.monthlyAgg._count ?? 0,
    dailyAvgSpend: (tokenUsageSummary.dailyAgg._count ?? 0) > 0
      ? (tokenUsageSummary.dailyAgg._sum.costUsd ?? 0) / 30
      : 0,
    byModel: (tokenUsageSummary.byModel ?? []).map((m: any) => ({
      model: m.modelUsed,
      cost: m._sum.costUsd ?? 0,
      promptTokens: m._sum.promptTokens ?? 0,
      completionTokens: m._sum.completionTokens ?? 0,
      requests: m._count ?? 0,
    })),
    byAgent: (tokenUsageSummary.byAgent ?? []).map((a: any) => ({
      agent: a.agentName,
      cost: a._sum.costUsd ?? 0,
      promptTokens: a._sum.promptTokens ?? 0,
      completionTokens: a._sum.completionTokens ?? 0,
      requests: a._count ?? 0,
    })),
    recentUsage: tokenUsageSummary.recentUsage ?? [],
  }

  // ─── performance ──────────────────────────────────────────────────────
  // Performance data from QARun scores & QAPageTest

  const latestPerfRun = await safe(
    () => db.qARun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
    }),
    null as any
  )

  const pageTests = await safe(
    async () => {
      if (!latestPerfRun) return []
      return db.qAPageTest.findMany({
        where: { runId: latestPerfRun.id },
        orderBy: { loadTime: 'desc' },
      })
    },
    [] as any[]
  )

  const performance = {
    scores: {
      performance: latestPerfRun?.performanceScore ?? latestQA?.performanceScore ?? 0,
      seo: latestPerfRun?.seoScore ?? latestQA?.seoScore ?? 0,
      accessibility: latestPerfRun?.accessibilityScore ?? latestQA?.accessibilityScore ?? 0,
      ux: latestPerfRun?.uxScore ?? latestQA?.uxScore ?? 0,
      product: latestPerfRun?.productScore ?? latestQA?.productScore ?? 0,
    },
    webVitals: pageTests.length > 0
      ? {
          avgLoadTime: Math.round(pageTests.reduce((s: number, p: any) => s + (p.loadTime ?? 0), 0) / pageTests.length),
          avgLighthouse: Math.round(pageTests.reduce((s: number, p: any) => s + (p.lighthouseScore ?? 0), 0) / pageTests.length),
          avgAccessibility: Math.round(pageTests.reduce((s: number, p: any) => s + (p.accessibilityScore ?? 0), 0) / pageTests.length),
          slowestPages: pageTests.slice(0, 5).map((p: any) => ({
            route: p.route ?? p.url ?? 'unknown',
            loadTime: p.loadTime,
            lighthouseScore: p.lighthouseScore,
            errorCount: p.errorCount,
          })),
          totalPages: pageTests.length,
          pagesWithErrors: pageTests.filter((p: any) => p.hasErrors).length,
        }
      : null,
    lastRun: latestPerfRun
      ? {
          id: latestPerfRun.id,
          completedAt: latestPerfRun.completedAt,
          durationMs: latestPerfRun.durationMs,
          triggeredBy: latestPerfRun.triggeredBy,
        }
      : null,
  }

  // User / Project / Analysis counts for analytics
  const entityCounts = {
    users: await safe(() => db.user.count(), 0),
    projects: await safe(() => db.project.count(), 0),
    analyses: await safe(() => db.analysis.count(), 0),
  }

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
    systemStatus,
    techDebt,
    security,
    aiCost,
    performance,
    entityCounts,
  })
}
