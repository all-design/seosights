/**
 * Comprehensive QA Loop — GET /api/control/qa-loop
 *
 * Systematically tests the ENTIRE production system:
 * 1. Database connectivity & real data counts
 * 2. AI providers & LLM router
 * 3. Autonomous engines (governor, factory, observatory)
 * 4. Content generation (pages, articles, reports)
 * 5. Self-growth (new pages, opportunities, suggestions)
 * 6. Cron execution & recent activity
 * 7. Real-time data verification (not mock/simulated)
 *
 * Returns comprehensive status with pass/fail per component.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface QATestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'DEGRADED' | 'WARN'
  details: string
  data?: Record<string, unknown>
}

interface QALoopResult {
  timestamp: string
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE' | 'CRITICAL'
  totalTests: number
  passed: number
  failed: number
  degraded: number
  warnings: number
  tests: QATestResult[]
  summary: Record<string, unknown>
  autonomousCycleStatus: string
  selfGrowthStatus: string
  liveDataVerification: string
}

// ── Time helpers ──
const nowMs = Date.now()
const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
const weekStart = new Date(nowMs - 7 * 24 * 60 * 60 * 1000)

async function safe<T>(fn: () => Promise<T>, fb: T): Promise<T> {
  try { return await fn() } catch { return fb }
}

export async function GET() {
  const tests: QATestResult[] = []
  const ts = new Date().toISOString()

  // ══════════════════════════════════════════════════════════════════
  // SECTION 1: DATABASE CONNECTIVITY & REAL DATA
  // (Sequential queries — Turso can't handle 38 concurrent queries)
  // ══════════════════════════════════════════════════════════════════

  const dbCounts: Record<string, number> = {}
  const countQueries: [string, () => Promise<number>][] = [
    ['factoryTasks', () => db.factoryTask.count()],
    ['governorInterceptions', () => db.governorInterception.count()],
    ['dailyMissions', () => db.dailyMission.count()],
    ['qaRuns', () => db.qARun.count()],
    ['codebaseSnapshots', () => db.codebaseSnapshot.count()],
    ['engineeringMemories', () => db.engineeringMemory.count()],
    ['factoryChangelogs', () => db.factoryChangelog.count()],
    ['growthOpportunities', () => db.growthOpportunity.count()],
    ['growthDailySnapshots', () => db.growthDailySnapshot.count()],
    ['observatoryCrawls', () => db.observatoryCrawl.count()],
    ['observatoryChanges', () => db.observatoryChange.count()],
    ['observatoryReports', () => db.observatoryReport.count()],
    ['observatoryResponses', () => db.observatoryResponse.count()],
    ['tokenUsageLogs', () => db.tokenUsageLog.count()],
    ['engagementMomentum', () => db.engagementMomentum.count()],
    ['engagementMissions', () => db.engagementMission.count()],
    ['engagementStreaks', () => db.engagementStreak.count()],
    ['engagementInboxItems', () => db.engagementInboxItem.count()],
    ['clientZeroKPIs', () => db.clientZeroKPI.count()],
    ['clientZeroScoreDeltas', () => db.clientZeroScoreDelta.count()],
    ['internalContentQueue', () => db.internalContentQueue.count()],
    ['outreachLogs', () => db.outreachLog.count()],
    ['aIModelRegistry', () => db.aIModelRegistry.count()],
    ['qAIssues', () => db.qAIssue.count()],
    ['qAPageTests', () => db.qAPageTest.count()],
    ['mCSystemStatuses', () => db.mCSystemStatus.count()],
    ['mCScheduleJobs', () => db.mCScheduleJob.count()],
    ['vSPages', () => db.vSPage.count()],
    ['systemSettings', () => db.systemSetting.count()],
    ['contentEngineArticles', () => db.contentEngineArticle.count()],
    ['contentEngineBriefs', () => db.contentEngineBrief.count()],
    ['contentEngineSprints', () => db.contentEngineSprint.count()],
    ['contentEngineExperiments', () => db.contentEngineExperiment.count()],
    ['digestRecords', () => db.digest.count()],
    ['industries', () => db.industryPage.count()],
    ['blogPosts', () => db.blogPost.count()],
    ['freeToolPages', () => db.freeToolPage.count()],
  ]

  for (const [key, fn] of countQueries) {
    dbCounts[key] = await safe(fn, 0)
  }

  const totalDbRecords = Object.values(dbCounts).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)

  tests.push({
    name: 'Database Connectivity',
    status: totalDbRecords > 0 ? 'PASS' : 'FAIL',
    details: totalDbRecords > 0
      ? `Database accessible. ${Object.keys(dbCounts).length} tables queried, ${totalDbRecords} total records.`
      : 'Database returned zero records across all tables. System may be empty or disconnected.',
    data: dbCounts as Record<string, unknown>,
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 2: AI PROVIDERS & LLM ROUTER
  // ══════════════════════════════════════════════════════════════════

  const aiProviders = {
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    zai: !!process.env.Z_AI_CONFIG,
  }
  const configuredProviders = Object.entries(aiProviders).filter(([, v]) => v).map(([k]) => k)
  const totalProviders = configuredProviders.length

  const aiModelsInDb = await safe(
    () => db.aIModelRegistry.findMany({ take: 20, orderBy: { lastCrawledAt: 'desc' } }),
    [] as any[]
  )
  const modelsWithRecentActivity = aiModelsInDb.filter(
    (m: any) => m.lastCrawledAt && new Date(m.lastCrawledAt).getTime() > weekStart.getTime()
  )

  const recentTokenUsage = await safe(
    () => db.tokenUsageLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, modelUsed: true, agentName: true, createdAt: true, costUsd: true, promptTokens: true, completionTokens: true },
    }),
    [] as any[]
  )

  tests.push({
    name: 'AI Router & Providers',
    status: totalProviders >= 2 ? 'PASS' : (totalProviders >= 1 ? 'DEGRADED' : 'FAIL'),
    details: `${totalProviders} AI providers configured (${configuredProviders.join(', ')}). ${aiModelsInDb.length} models in registry, ${modelsWithRecentActivity.length} with recent activity. ${recentTokenUsage.length} recent token usage logs.`,
    data: { providers: aiProviders, modelsInRegistry: aiModelsInDb.length, modelsWithRecentActivity, recentTokenUsageCount: recentTokenUsage.length, recentModelsUsed: recentTokenUsage.map((t: any) => t.modelUsed) },
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 3: AUTONOMOUS ENGINE STATUS
  // ══════════════════════════════════════════════════════════════════

  // Governor
  const recentInterceptions = await safe(
    () => db.governorInterception.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, action: true, reason: true, createdAt: true },
    }),
    [] as any[]
  )
  const todayInterceptions = await safe(
    () => db.governorInterception.count({ where: { createdAt: { gte: todayStart } } }),
    0
  )
  const weekInterceptions = await safe(
    () => db.governorInterception.count({ where: { createdAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Governor Engine',
    status: weekInterceptions > 0 ? 'PASS' : (dbCounts.governorInterceptions > 0 ? 'DEGRADED' : 'FAIL'),
    details: `${dbCounts.governorInterceptions} total interceptions, ${weekInterceptions} this week, ${todayInterceptions} today. Recent: ${recentInterceptions.slice(0, 3).map((i: any) => `${i.action} (${i.createdAt?.toISOString?.()?.slice(0, 10) || 'N/A'})`).join(', ')}`,
    data: { total: dbCounts.governorInterceptions, thisWeek: weekInterceptions, today: todayInterceptions, recent: recentInterceptions },
  })

  // Factory / Daily Mission
  const recentMissions = await safe(
    () => db.dailyMission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, createdAt: true, date: true },
    }),
    [] as any[]
  )
  const todayMission = await safe(
    () => db.dailyMission.findFirst({ where: { date: { gte: todayStart } } }),
    null as any
  )
  const weekMissions = await safe(
    () => db.dailyMission.count({ where: { createdAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Daily Mission Generator',
    status: weekMissions > 0 ? 'PASS' : (dbCounts.dailyMissions > 0 ? 'WARN' : 'FAIL'),
    details: `${dbCounts.dailyMissions} total missions, ${weekMissions} this week. Today's mission: ${todayMission ? `"${todayMission.title}" (${todayMission.status})` : 'No mission generated today'}. Recent: ${recentMissions.slice(0, 3).map((m: any) => `"${m.title}" (${m.status})`).join(', ')}`,
    data: { total: dbCounts.dailyMissions, thisWeek: weekMissions, todayMission, recent: recentMissions },
  })

  // Factory Tasks (the autonomous improvement loop)
  const recentTasks = await safe(
    () => db.factoryTask.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, title: true, status: true, createdAt: true },
    }),
    [] as any[]
  )
  const tasksByStatus = await safe(
    async () => {
      const statuses = ['pending', 'approved', 'implementing', 'qa', 'deployed', 'done', 'rejected']
      const counts: Record<string, number> = {}
      for (const s of statuses) {
        counts[s] = await db.factoryTask.count({ where: { status: s } })
      }
      return counts
    },
    {} as Record<string, number>
  )
  const deployedOrDone = (tasksByStatus['deployed'] || 0) + (tasksByStatus['done'] || 0)
  const todayTasks = await safe(
    () => db.factoryTask.count({ where: { createdAt: { gte: todayStart } } }),
    0
  )

  tests.push({
    name: 'Factory Task Pipeline',
    status: deployedOrDone > 0 ? 'PASS' : (dbCounts.factoryTasks > 0 ? 'DEGRADED' : 'FAIL'),
    details: `${dbCounts.factoryTasks} total tasks. ${deployedOrDone} deployed/done. Pipeline: pending=${tasksByStatus['pending'] || 0}, approved=${tasksByStatus['approved'] || 0}, implementing=${tasksByStatus['implementing'] || 0}, qa=${tasksByStatus['qa'] || 0}, deployed=${tasksByStatus['deployed'] || 0}, done=${tasksByStatus['done'] || 0}. ${todayTasks} new today.`,
    data: { total: dbCounts.factoryTasks, byStatus: tasksByStatus, todayNew: todayTasks, recent: recentTasks },
  })

  // QA Engine
  const recentQARuns = await safe(
    () => db.qARun.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, triggeredBy: true, createdAt: true, completedAt: true, performanceScore: true, securityScore: true },
    }),
    [] as any[]
  )
  const completedQARuns = await safe(
    () => db.qARun.count({ where: { status: 'completed' } }),
    0
  )

  tests.push({
    name: 'QA Engine',
    status: completedQARuns > 0 ? 'PASS' : (dbCounts.qaRuns > 0 ? 'DEGRADED' : 'FAIL'),
    details: `${dbCounts.qaRuns} total QA runs, ${completedQARuns} completed. Recent: ${recentQARuns.slice(0, 3).map((q: any) => `status=${q.status} perfScore=${q.performanceScore || 'N/A'}`).join(', ')}`,
    data: { total: dbCounts.qaRuns, completed: completedQARuns, recent: recentQARuns },
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 4: CONTENT GENERATION & NEW PAGES
  // ══════════════════════════════════════════════════════════════════

  // Observatory Reports (AI-generated research pages)
  const publishedReports = await safe(
    () => db.observatoryReport.findMany({
      where: { status: 'published' },
      take: 10,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, slug: true, title: true, type: true, publishedAt: true, wordCount: true, isSimulated: true },
    }),
    [] as any[]
  )
  const proposedReports = await safe(
    () => db.observatoryReport.findMany({
      where: { status: 'proposed' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, title: true, type: true, createdAt: true },
    }),
    [] as any[]
  )
  const realPublishedReports = publishedReports.filter((r: any) => !r.isSimulated)
  const todayReports = await safe(
    () => db.observatoryReport.count({ where: { createdAt: { gte: todayStart } } }),
    0
  )
  const weekReports = await safe(
    () => db.observatoryReport.count({ where: { createdAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Observatory Research Pages',
    status: realPublishedReports.length > 0 ? 'PASS' : (publishedReports.length > 0 ? 'WARN' : 'DEGRADED'),
    details: `${dbCounts.observatoryReports} total reports. ${realPublishedReports.length} real published (non-simulated). ${proposedReports.length} proposed (pending publish). ${weekReports} created this week, ${todayReports} today.`,
    data: { total: dbCounts.observatoryReports, publishedReal: realPublishedReports.length, publishedSimulated: publishedReports.length - realPublishedReports.length, proposed: proposedReports.length, thisWeek: weekReports, today: todayReports, recentPublished: realPublishedReports.slice(0, 5), recentProposed: proposedReports.slice(0, 5) },
  })

  // Internal Content Queue (auto-publish pipeline)
  const contentQueueByStatus = await safe(
    async () => {
      const statuses = ['pending', 'generating', 'published', 'failed']
      const counts: Record<string, number> = {}
      for (const s of statuses) {
        counts[s] = await db.internalContentQueue.count({ where: { status: s } })
      }
      return counts
    },
    {} as Record<string, number>
  )

  tests.push({
    name: 'Auto-Publish Content Queue',
    status: (contentQueueByStatus['published'] || 0) > 0 ? 'PASS' : ((contentQueueByStatus['pending'] || 0) > 0 ? 'WARN' : 'DEGRADED'),
    details: `${dbCounts.internalContentQueue} total entries. Published=${contentQueueByStatus['published'] || 0}, Pending=${contentQueueByStatus['pending'] || 0}, Generating=${contentQueueByStatus['generating'] || 0}, Failed=${contentQueueByStatus['failed'] || 0}.`,
    data: { total: dbCounts.internalContentQueue, byStatus: contentQueueByStatus },
  })

  // Blog Posts
  const publishedBlogPosts = await safe(
    () => db.blogPost.findMany({
      where: { status: 'published' },
      take: 10,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, slug: true, title: true, publishedAt: true, createdAt: true },
    }),
    [] as any[]
  )
  const todayBlog = await safe(
    () => db.blogPost.count({ where: { createdAt: { gte: todayStart } } }),
    0
  )

  tests.push({
    name: 'Blog Posts (Live Pages)',
    status: publishedBlogPosts.length > 0 ? 'PASS' : (dbCounts.blogPosts > 0 ? 'DEGRADED' : 'WARN'),
    details: `${dbCounts.blogPosts} total blog posts, ${publishedBlogPosts.length} published. ${todayBlog} new today. Recent: ${publishedBlogPosts.slice(0, 3).map((b: any) => `"${b.title}"`).join(', ')}`,
    data: { total: dbCounts.blogPosts, published: publishedBlogPosts.length, today: todayBlog, recent: publishedBlogPosts },
  })

  // VS Pages (comparison pages)
  const liveVSPages = await safe(
    () => db.vSPage.findMany({
      where: { status: 'live' },
      take: 10,
      select: { id: true, competitorKey: true, status: true },
    }),
    [] as any[]
  )

  tests.push({
    name: 'VS Comparison Pages',
    status: liveVSPages.length > 0 ? 'PASS' : 'WARN',
    details: `${dbCounts.vSPages} total VS pages in DB, ${liveVSPages.length} live. Hardcoded vs-data available for: ahrefs, semrush, surfer, profound, goodie.`,
    data: { total: dbCounts.vSPages, live: liveVSPages.length },
  })

  // Industry Pages
  const publishedIndustries = await safe(
    () => db.industryPage.findMany({
      where: { status: 'published' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, name: true, createdAt: true },
    }),
    [] as any[]
  )

  tests.push({
    name: 'Industry Pages',
    status: publishedIndustries.length > 0 ? 'PASS' : 'WARN',
    details: `${dbCounts.industries} total industry pages, ${publishedIndustries.length} published.`,
    data: { total: dbCounts.industries, published: publishedIndustries },
  })

  // Free Tool Pages
  const publishedTools = await safe(
    () => db.freeToolPage.findMany({
      where: { status: 'published' },
      take: 10,
      select: { id: true, slug: true, name: true },
    }),
    [] as any[]
  )

  tests.push({
    name: 'Free AI Tool Pages',
    status: publishedTools.length > 0 ? 'PASS' : 'WARN',
    details: `${dbCounts.freeToolPages} total tool pages, ${publishedTools.length} published.`,
    data: { total: dbCounts.freeToolPages, published: publishedTools },
  })

  // Content Engine Articles
  const contentEngineArticlesByStatus = await safe(
    async () => {
      const statuses = ['draft', 'published', 'review', 'failed']
      const counts: Record<string, number> = {}
      for (const s of statuses) {
        counts[s] = await db.contentEngineArticle.count({ where: { status: s } })
      }
      return counts
    },
    {} as Record<string, number>
  )

  tests.push({
    name: 'Content Engine Articles',
    status: (contentEngineArticlesByStatus['published'] || 0) > 0 ? 'PASS' : (dbCounts.contentEngineArticles > 0 ? 'DEGRADED' : 'WARN'),
    details: `${dbCounts.contentEngineArticles} total articles. Published=${contentEngineArticlesByStatus['published'] || 0}, Draft=${contentEngineArticlesByStatus['draft'] || 0}, Review=${contentEngineArticlesByStatus['review'] || 0}, Failed=${contentEngineArticlesByStatus['failed'] || 0}.`,
    data: { total: dbCounts.contentEngineArticles, byStatus: contentEngineArticlesByStatus },
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 5: SELF-GROWTH & AUTONOMOUS BEHAVIOR
  // ══════════════════════════════════════════════════════════════════

  // Growth Opportunities (auto-discovered)
  const recentGrowthOps = await safe(
    () => db.growthOpportunity.findMany({
      take: 10,
      orderBy: { discoveredAt: 'desc' },
      select: { id: true, type: true, source: true, title: true, growthScore: true, discoveredAt: true, status: true },
    }),
    [] as any[]
  )
  const todayGrowthOps = await safe(
    () => db.growthOpportunity.count({ where: { discoveredAt: { gte: todayStart } } }),
    0
  )
  const weekGrowthOps = await safe(
    () => db.growthOpportunity.count({ where: { discoveredAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Growth Opportunity Discovery',
    status: weekGrowthOps > 0 ? 'PASS' : (dbCounts.growthOpportunities > 0 ? 'DEGRADED' : 'FAIL'),
    details: `${dbCounts.growthOpportunities} total opportunities discovered. ${weekGrowthOps} this week, ${todayGrowthOps} today. Recent: ${recentGrowthOps.slice(0, 3).map((o: any) => `"${o.title}" (${o.source}, score=${o.growthScore})`).join(', ')}`,
    data: { total: dbCounts.growthOpportunities, thisWeek: weekGrowthOps, today: todayGrowthOps, recent: recentGrowthOps },
  })

  // Outreach (auto-outreach system)
  const outreachByStatus = await safe(
    async () => {
      const statuses = ['pending', 'sent', 'failed']
      const counts: Record<string, number> = {}
      for (const s of statuses) {
        counts[s] = await db.outreachLog.count({ where: { status: s } })
      }
      return counts
    },
    {} as Record<string, number>
  )

  tests.push({
    name: 'Auto-Outreach System',
    status: (outreachByStatus['sent'] || 0) > 0 ? 'PASS' : ((outreachByStatus['pending'] || 0) > 0 ? 'WARN' : 'DEGRADED'),
    details: `${dbCounts.outreachLogs} total outreach logs. Sent=${outreachByStatus['sent'] || 0}, Pending=${outreachByStatus['pending'] || 0}, Failed=${outreachByStatus['failed'] || 0}.`,
    data: { total: dbCounts.outreachLogs, byStatus: outreachByStatus },
  })

  // Observatory Changes (AI model behavior tracking)
  const recentChanges = await safe(
    () => db.observatoryChange.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, aiModel: true, changeType: true, isSignal: true, significanceScore: true, createdAt: true },
    }),
    [] as any[]
  )
  const signals = recentChanges.filter((c: any) => c.isSignal === true)
  const todayChanges = await safe(
    () => db.observatoryChange.count({ where: { createdAt: { gte: todayStart } } }),
    0
  )
  const weekChanges = await safe(
    () => db.observatoryChange.count({ where: { createdAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Observatory Change Detection',
    status: weekChanges > 0 ? 'PASS' : (dbCounts.observatoryChanges > 0 ? 'DEGRADED' : 'FAIL'),
    details: `${dbCounts.observatoryChanges} total changes detected, ${signals.length} classified as signals. ${weekChanges} this week, ${todayChanges} today. Recent: ${recentChanges.slice(0, 3).map((c: any) => `${c.aiModel}/${c.changeType} (score=${c.significanceScore}, signal=${c.isSignal})`).join(', ')}`,
    data: { total: dbCounts.observatoryChanges, signals: signals.length, thisWeek: weekChanges, today: todayChanges, recent: recentChanges },
  })

  // Observatory Crawls (daily AI model querying)
  const recentCrawls = await safe(
    () => db.observatoryCrawl.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, status: true, promptsCompleted: true, modelsQueried: true, createdAt: true, durationMs: true },
    }),
    [] as any[]
  )
  const completedCrawls = await safe(
    () => db.observatoryCrawl.count({ where: { status: { in: ['completed', 'partial'] } } }),
    0
  )
  const weekCrawls = await safe(
    () => db.observatoryCrawl.count({ where: { createdAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Observatory Crawl Pipeline',
    status: weekCrawls > 0 ? 'PASS' : (completedCrawls > 0 ? 'DEGRADED' : 'FAIL'),
    details: `${dbCounts.observatoryCrawls} total crawls, ${completedCrawls} completed. ${weekCrawls} this week. Recent: ${recentCrawls.slice(0, 2).map((c: any) => `type=${c.type}, status=${c.status}, ${c.promptsCompleted}/${c.modelsQueried} prompts`).join(', ')}`,
    data: { total: dbCounts.observatoryCrawls, completed: completedCrawls, thisWeek: weekCrawls, recent: recentCrawls },
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 6: LIVE DATA VERIFICATION
  // ══════════════════════════════════════════════════════════════════

  const simulatedReports = await safe(
    () => db.observatoryReport.count({ where: { isSimulated: true } }),
    0
  )
  const nonSimulatedReports = await safe(
    () => db.observatoryReport.count({ where: { isSimulated: false } }),
    0
  )

  const systemHeartbeats = await safe(
    () => db.mCSystemStatus.findMany({
      take: 10,
      orderBy: { lastHeartbeat: 'desc' },
      select: { systemName: true, status: true, lastHeartbeat: true },
    }),
    [] as any[]
  )
  const recentHeartbeats = systemHeartbeats.filter(
    (h: any) => h.lastHeartbeat && new Date(h.lastHeartbeat).getTime() > weekStart.getTime()
  )

  const totalCost = await safe(
    async () => {
      const agg = await db.tokenUsageLog.aggregate({ _sum: { costUsd: true } })
      return agg._sum.costUsd ?? 0
    },
    0
  )

  const isLiveData = totalDbRecords > 100 && totalCost > 0 && nonSimulatedReports > 0
  const hasRecentData = weekMissions > 0 || weekChanges > 0 || weekGrowthOps > 0 || todayTasks > 0

  tests.push({
    name: 'Live Data Verification',
    status: isLiveData ? 'PASS' : (totalDbRecords > 0 ? 'WARN' : 'FAIL'),
    details: isLiveData
      ? `CONFIRMED LIVE DATA: ${totalDbRecords} real DB records, $${totalCost.toFixed(2)} total AI spend, ${nonSimulatedReports} non-simulated reports. ${recentHeartbeats.length} recent heartbeats. ${hasRecentData ? 'NEW data created this week.' : 'No new data this week — cron jobs may need to run.'}`
      : `Data may be simulated or empty: ${totalDbRecords} records, $${totalCost.toFixed(2)} spend, ${nonSimulatedReports} real reports, ${simulatedReports} simulated.`,
    data: { totalRecords: totalDbRecords, totalCostUsd: totalCost, simulatedReports, nonSimulatedReports, heartbeats: systemHeartbeats, recentHeartbeats: recentHeartbeats.length, hasRecentData },
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 7: CRON EXECUTION TIMESTAMPS
  // ══════════════════════════════════════════════════════════════════

  const lastMissionDate = await safe(
    () => db.dailyMission.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, title: true } }),
    null as any
  )
  const lastQARunDate = await safe(
    () => db.qARun.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, status: true } }),
    null as any
  )
  const lastCrawlDate = await safe(
    () => db.observatoryCrawl.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, status: true } }),
    null as any
  )
  const lastContentQueueDate = await safe(
    () => db.internalContentQueue.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, status: true } }),
    null as any
  )
  const lastGrowthOpDate = await safe(
    () => db.growthOpportunity.findFirst({ orderBy: { discoveredAt: 'desc' }, select: { discoveredAt: true, title: true } }),
    null as any
  )
  const lastTaskDate = await safe(
    () => db.factoryTask.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, type: true, title: true, status: true } }),
    null as any
  )
  const lastInterceptionDate = await safe(
    () => db.governorInterception.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, action: true } }),
    null as any
  )

  const cronTimestamps = {
    dailyMission: lastMissionDate?.createdAt?.toISOString?.() || null,
    qaRun: lastQARunDate?.createdAt?.toISOString?.() || null,
    observatoryCrawl: lastCrawlDate?.createdAt?.toISOString?.() || null,
    contentQueue: lastContentQueueDate?.createdAt?.toISOString?.() || null,
    growthOpportunity: lastGrowthOpDate?.discoveredAt?.toISOString?.() || null,
    factoryTask: lastTaskDate?.createdAt?.toISOString?.() || null,
    interception: lastInterceptionDate?.createdAt?.toISOString?.() || null,
  }

  const cronRanToday = Object.values(cronTimestamps).some(tsVal => tsVal && new Date(tsVal).getTime() >= todayStart.getTime())
  const cronRanThisWeek = Object.values(cronTimestamps).some(tsVal => tsVal && new Date(tsVal).getTime() >= weekStart.getTime())

  tests.push({
    name: 'Cron Execution & Timestamps',
    status: cronRanToday ? 'PASS' : (cronRanThisWeek ? 'DEGRADED' : 'FAIL'),
    details: cronRanToday
      ? `Crons running today. Last: mission=${cronTimestamps.dailyMission?.slice(0, 16) || 'N/A'}, QA=${cronTimestamps.qaRun?.slice(0, 16) || 'N/A'}, crawl=${cronTimestamps.observatoryCrawl?.slice(0, 16) || 'N/A'}, content=${cronTimestamps.contentQueue?.slice(0, 16) || 'N/A'}, growth=${cronTimestamps.growthOpportunity?.slice(0, 16) || 'N/A'}, task=${cronTimestamps.factoryTask?.slice(0, 16) || 'N/A'}, interception=${cronTimestamps.interception?.slice(0, 16) || 'N/A'}`
      : `No crons ran today. Last week exists. Timestamps: mission=${cronTimestamps.dailyMission?.slice(0, 16) || 'N/A'}, crawl=${cronTimestamps.observatoryCrawl?.slice(0, 16) || 'N/A'}`,
    data: cronTimestamps,
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 8: ENGINEERING MEMORY & LEARNING
  // ══════════════════════════════════════════════════════════════════

  const recentMemories = await safe(
    () => db.engineeringMemory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, category: true, title: true, createdAt: true, confidence: true },
    }),
    [] as any[]
  )
  const weekMemories = await safe(
    () => db.engineeringMemory.count({ where: { createdAt: { gte: weekStart } } }),
    0
  )

  tests.push({
    name: 'Engineering Memory (Learning)',
    status: dbCounts.engineeringMemories > 0 ? 'PASS' : 'DEGRADED',
    details: `${dbCounts.engineeringMemories} total memories, ${weekMemories} this week. Recent: ${recentMemories.slice(0, 3).map((m: any) => `"${m.title}" (${m.category}, conf=${m.confidence})`).join(', ')}`,
    data: { total: dbCounts.engineeringMemories, thisWeek: weekMemories, recent: recentMemories },
  })

  // ══════════════════════════════════════════════════════════════════
  // SECTION 9: ENGAGEMENT SYSTEM
  // ══════════════════════════════════════════════════════════════════

  const activeEngagementMissions = await safe(
    () => db.engagementMission.count({ where: { status: 'active' } }),
    0
  )
  const unreadInboxItems = await safe(
    () => db.engagementInboxItem.count({ where: { isUnread: true } }),
    0
  )

  tests.push({
    name: 'Engagement System',
    status: dbCounts.engagementMissions > 0 ? 'PASS' : 'DEGRADED',
    details: `${dbCounts.engagementMissions} missions, ${activeEngagementMissions} active. ${unreadInboxItems} unread inbox items. ${dbCounts.engagementStreaks} streaks, ${dbCounts.engagementMomentum} momentum.`,
    data: { missions: dbCounts.engagementMissions, activeMissions: activeEngagementMissions, unreadInbox: unreadInboxItems },
  })

  // ══════════════════════════════════════════════════════════════════
  // COMPILE RESULTS
  // ══════════════════════════════════════════════════════════════════

  const passed = tests.filter(t => t.status === 'PASS').length
  const failed = tests.filter(t => t.status === 'FAIL').length
  const degraded = tests.filter(t => t.status === 'DEGRADED').length
  const warnings = tests.filter(t => t.status === 'WARN').length

  const overallStatus: QALoopResult['overallStatus'] =
    failed >= 3 ? 'CRITICAL'
    : failed >= 1 ? 'DEGRADED'
    : degraded >= 3 ? 'DEGRADED'
    : passed >= tests.length * 0.7 ? 'OPERATIONAL'
    : 'DEGRADED'

  const autonomousActive = (weekMissions > 0 || weekInterceptions > 0) && deployedOrDone > 0 && completedQARuns > 0
  const autonomousCycleStatus = autonomousActive
    ? 'ACTIVE — Missions generated, tasks processed, QA running, improvements deployed'
    : 'PARTIAL — Some components active but full Mission→Task→QA→Deploy loop may not be cycling'

  const selfGrowthActive = weekReports > 0 || weekGrowthOps > 0 || todayTasks > 0 || weekChanges > 0
  const selfGrowthStatus = selfGrowthActive
    ? `ACTIVE — ${weekReports} new reports, ${weekGrowthOps} new growth ops, ${todayTasks} new factory tasks, ${weekChanges} new changes this week`
    : 'INACTIVE — No new content/opportunities/changes this week. Cron jobs may need triggering.'

  const liveDataVerification = isLiveData
    ? 'VERIFIED — Real DB records with actual AI spend. Non-simulated data confirmed.'
    : 'UNVERIFIED — Data may be simulated. Check token usage for LLM call evidence.'

  const result: QALoopResult = {
    timestamp: ts,
    overallStatus,
    totalTests: tests.length,
    passed,
    failed,
    degraded,
    warnings,
    tests,
    summary: {
      totalDbRecords,
      dbTablesQueried: Object.keys(dbCounts).length,
      aiProvidersConfigured: configuredProviders,
      aiModelsInRegistry: aiModelsInDb.length,
      totalAiSpend: totalCost,
      factoryPipelineHealth: `${deployedOrDone}/${dbCounts.factoryTasks} deployed/done`,
      observatoryCrawlsCompleted: completedCrawls,
      publishedPages: publishedBlogPosts.length + publishedIndustries.length + publishedTools.length + realPublishedReports.length,
      growthOpportunitiesTotal: dbCounts.growthOpportunities,
      outreachSent: outreachByStatus['sent'] || 0,
    },
    autonomousCycleStatus,
    selfGrowthStatus,
    liveDataVerification,
  }

  return NextResponse.json(result)
}
