/**
 * Seed API — POST /api/ops/seed
 *
 * Seeds ALL Operations Center tables with realistic demo data.
 * Creates a full day's story of a productive autonomous platform.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getTodayStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function makeTime(hours: number, minutes: number, seconds: number = 0): Date {
  const d = getTodayStart()
  d.setHours(hours, minutes, seconds, 0)
  return d
}

function daysAgo(n: number): Date {
  const d = getTodayStart()
  d.setDate(d.getDate() - n)
  return d
}

export async function POST() {
  try {
    console.log('[ops/seed] Starting full seed...')

    // ── 1. MCSystemStatus ──────────────────────────────────────────────
    const systemStatuses = [
      {
        systemName: 'client_zero',
        displayName: 'Client Zero',
        status: 'running',
        phase: 'Execute',
        progress: 68,
        reasoning: 'Processing batch 3 of 5 — 12 articles remaining',
        startedAt: makeTime(7, 30),
        nextRunAt: makeTime(14, 0),
        lastHeartbeat: new Date(),
        todayTotal: 20,
        todayCompleted: 18,
        todayFailed: 1,
      },
      {
        systemName: 'age',
        displayName: 'Autonomous Growth Engine',
        status: 'running',
        phase: 'Measurement',
        progress: 82,
        reasoning: 'Discovery complete — measuring ROI for 14 published articles',
        startedAt: makeTime(6, 50),
        nextRunAt: makeTime(22, 0),
        lastHeartbeat: new Date(),
        todayTotal: 34,
        todayCompleted: 30,
        todayFailed: 2,
      },
      {
        systemName: 'qa_engine',
        displayName: 'QA Engine',
        status: 'waiting',
        phase: 'Idle',
        progress: 100,
        reasoning: 'Nightly review completed at 06:42 — next run at 03:00 UTC',
        startedAt: makeTime(6, 0),
        nextRunAt: makeTime(3, 0),
        lastHeartbeat: makeTime(6, 42),
        todayTotal: 10,
        todayCompleted: 10,
        todayFailed: 0,
      },
      {
        systemName: 'observatory',
        displayName: 'Observatory',
        status: 'running',
        phase: 'Collecting',
        progress: 55,
        reasoning: 'Collecting citation data from 23 sources — batch 4 of 6',
        startedAt: makeTime(8, 0),
        nextRunAt: makeTime(14, 0),
        lastHeartbeat: new Date(),
        todayTotal: 156,
        todayCompleted: 89,
        todayFailed: 3,
      },
      {
        systemName: 'mission_control',
        displayName: 'Mission Control',
        status: 'running',
        phase: 'Orchestrating',
        progress: 91,
        reasoning: 'All systems operational — monitoring 4 active pipelines',
        startedAt: makeTime(6, 0),
        nextRunAt: makeTime(23, 0),
        lastHeartbeat: new Date(),
        todayTotal: 13,
        todayCompleted: 11,
        todayFailed: 0,
      },
    ]

    // Upsert system statuses
    for (const s of systemStatuses) {
      await db.mCSystemStatus.upsert({
        where: { systemName: s.systemName },
        update: s,
        create: s,
      })
    }
    console.log('[ops/seed] ✅ MCSystemStatus: 5 systems seeded')

    // ── 2. MCTimelineEvent ─────────────────────────────────────────────
    // Delete existing timeline events for today to avoid duplicates
    const todayStart = getTodayStart()
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    await db.mCTimelineEvent.deleteMany({
      where: {
        timestamp: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    })

    const timelineEvents = [
      // 06:00 — QA Engine starts
      { systemName: 'qa_engine', eventType: 'started', title: 'QA Engine Nightly Review Started', description: 'Initiating 10-reviewer scan across all pages and APIs', icon: 'shield', color: 'blue', timestamp: makeTime(6, 0, 12) },
      { systemName: 'mission_control', eventType: 'scheduled', title: 'Daily Schedule Activated', description: '13 jobs scheduled for today — first dependency chain starting', icon: 'calendar', color: 'default', timestamp: makeTime(6, 0, 5) },

      // 06:10-06:30 — QA reviewers running
      { systemName: 'qa_engine', eventType: 'discovered', title: 'Functional QA Review Complete', description: 'All 6 pages passed — 0 functional issues detected', icon: 'check-circle', color: 'green', timestamp: makeTime(6, 10, 34) },
      { systemName: 'qa_engine', eventType: 'discovered', title: 'Performance Review Complete', description: 'Lighthouse avg: 94 — 2 minor bundle optimizations suggested', icon: 'zap', color: 'green', timestamp: makeTime(6, 15, 8) },
      { systemName: 'qa_engine', eventType: 'discovered', title: 'SEO Review Complete', description: 'All meta tags valid — 1 canonical URL suggestion', icon: 'search', color: 'green', timestamp: makeTime(6, 18, 22) },
      { systemName: 'qa_engine', eventType: 'alert', title: 'Accessibility: 2 Contrast Issues', description: 'Footer links and sidebar labels fail WCAG AA contrast ratio', icon: 'alert-triangle', color: 'yellow', timestamp: makeTime(6, 22, 45) },
      { systemName: 'qa_engine', eventType: 'discovered', title: 'Security Review Complete', description: 'All headers properly configured — no secrets exposed', icon: 'lock', color: 'green', timestamp: makeTime(6, 28, 11) },

      // 06:42 — QA finishes
      { systemName: 'qa_engine', eventType: 'completed', title: 'QA Nightly Review Complete', description: 'Product Score: 89/100 — 68 issues (2 Critical, 8 Major, 14 Medium, 44 Minor)', icon: 'check-circle', color: 'green', timestamp: makeTime(6, 42, 0) },
      { systemName: 'mission_control', eventType: 'completed', title: 'QA Finished Check: PASSED', description: 'All quality gates green — proceeding to AGE Discovery', icon: 'check-circle', color: 'green', timestamp: makeTime(6, 45, 0) },

      // 06:50 — AGE Discovery starts
      { systemName: 'age', eventType: 'started', title: 'AGE Discovery Phase Started', description: 'Scanning 847 opportunity signals across 12 verticals', icon: 'search', color: 'blue', timestamp: makeTime(6, 50, 0) },
      { systemName: 'age', eventType: 'discovered', title: '156 Opportunities Discovered', description: 'High-confidence signals in SaaS, Cloud, and AI verticals', icon: 'eye', color: 'blue', timestamp: makeTime(7, 5, 30) },

      // 07:15 — AGE Review
      { systemName: 'age', eventType: 'completed', title: 'AGE Review Complete', description: '34 opportunities approved — 12 high priority, 22 medium priority', icon: 'check-circle', color: 'green', timestamp: makeTime(7, 15, 0) },
      { systemName: 'age', eventType: 'alert', title: 'AGE Budget: 21/20 Used', description: 'Daily generation budget exceeded by 1 — governor activated', icon: 'alert-triangle', color: 'yellow', timestamp: makeTime(7, 18, 0) },
      { systemName: 'age', eventType: 'learning', title: 'AGE Governor: Pruning Low-ROI', description: 'Removed 3 opportunities with projected ROI < 2.5x', icon: 'scissors', color: 'purple', timestamp: makeTime(7, 20, 0) },

      // 07:30 — Client Zero starts
      { systemName: 'client_zero', eventType: 'started', title: 'Client Zero Execution Started', description: 'Processing 5 client missions — 20 articles in queue', icon: 'rocket', color: 'blue', timestamp: makeTime(7, 30, 0) },
      { systemName: 'client_zero', eventType: 'generated', title: 'Batch 1 Complete: 4 Articles', description: 'Client #7: SEO audit content generated and queued', icon: 'file-text', color: 'green', timestamp: makeTime(8, 15, 0) },
      { systemName: 'client_zero', eventType: 'generated', title: 'Batch 2 Complete: 4 Articles', description: 'Client #3: Competitive analysis content published', icon: 'file-text', color: 'green', timestamp: makeTime(8, 45, 0) },
      { systemName: 'client_zero', eventType: 'error', title: 'Client #12: API Timeout', description: 'Content generation failed — retrying in 5 minutes', icon: 'alert-triangle', color: 'red', timestamp: makeTime(9, 10, 0) },
      { systemName: 'client_zero', eventType: 'completed', title: 'Client #12: Retry Successful', description: 'Article generated on second attempt — 30s delay', icon: 'check-circle', color: 'green', timestamp: makeTime(9, 15, 0) },

      // 08:00 — Observatory collects
      { systemName: 'observatory', eventType: 'started', title: 'Observatory Collection Started', description: 'Scanning 23 sources for citation and authority data', icon: 'telescope', color: 'blue', timestamp: makeTime(8, 0, 0) },
      { systemName: 'observatory', eventType: 'discovered', title: '89 Citations Collected', description: 'Strong signal from TechCrunch, The Verge, and 6 industry journals', icon: 'bookmark', color: 'green', timestamp: makeTime(8, 30, 0) },
      { systemName: 'observatory', eventType: 'discovered', title: '3 Breaking Signals Detected', description: 'Google core update, OpenAI model release, new AI regulation', icon: 'zap', color: 'yellow', timestamp: makeTime(8, 45, 0) },

      // 09:00 — Publish Window #1
      { systemName: 'mission_control', eventType: 'completed', title: 'Publish Window #1 Complete', description: '4 articles published to production successfully', icon: 'upload', color: 'green', timestamp: makeTime(9, 0, 0) },
      { systemName: 'age', eventType: 'completed', title: 'Measurement Cycle Complete', description: 'ROI measured for 14 published articles — avg 3.2x return', icon: 'bar-chart', color: 'green', timestamp: makeTime(9, 30, 0) },

      // 10:00-12:00 — Mid-day activity
      { systemName: 'client_zero', eventType: 'generated', title: 'Batch 3 In Progress', description: 'Generating technology vertical content for clients #7, #3', icon: 'loader', color: 'blue', timestamp: makeTime(10, 0, 0) },
      { systemName: 'observatory', eventType: 'discovered', title: 'Citation Quality Score: 8.7/10', description: 'High confidence in collected data — ready for publishing', icon: 'award', color: 'green', timestamp: makeTime(10, 30, 0) },
      { systemName: 'age', eventType: 'learning', title: 'Learning Model Updated', description: 'Incorporated 14 new data points from yesterday\'s performance', icon: 'brain', color: 'purple', timestamp: makeTime(11, 0, 0) },
      { systemName: 'age', eventType: 'discovered', title: 'New Opportunity: AI Regulation', description: 'Trending topic detected — 3 queries ready for content generation', icon: 'lightbulb', color: 'yellow', timestamp: makeTime(11, 30, 0) },

      // 12:00-14:00
      { systemName: 'client_zero', eventType: 'heartbeat', title: 'Client Zero: Healthy', description: 'All 4 workers operational — batch 3 at 68% completion', icon: 'heart', color: 'green', timestamp: makeTime(12, 0, 0) },
      { systemName: 'qa_engine', eventType: 'heartbeat', title: 'QA Engine: Idle (Healthy)', description: 'Waiting for next scheduled run — all systems nominal', icon: 'heart', color: 'green', timestamp: makeTime(12, 30, 0) },
      { systemName: 'mission_control', eventType: 'scheduled', title: 'Publish Window #2 Approaching', description: '2 articles queued for 14:00 publication', icon: 'clock', color: 'default', timestamp: makeTime(13, 30, 0) },

      // 14:00 — Publish Window #2
      { systemName: 'mission_control', eventType: 'started', title: 'Publish Window #2 Started', description: 'Publishing 2 articles to production', icon: 'upload', color: 'blue', timestamp: makeTime(14, 0, 0) },
      { systemName: 'observatory', eventType: 'started', title: 'Observatory: Afternoon Collection', description: 'Secondary collection cycle initiated for real-time signals', icon: 'telescope', color: 'blue', timestamp: makeTime(14, 30, 0) },

      // 15:00-17:00
      { systemName: 'age', eventType: 'discovered', title: 'Scoring: 8 New High-Value Queries', description: 'Queries in AI/ML vertical show 4.5x ROI potential', icon: 'trending-up', color: 'green', timestamp: makeTime(15, 0, 0) },
      { systemName: 'client_zero', eventType: 'generated', title: 'Batch 3: 4 More Articles Complete', description: 'Technology vertical content ready for review', icon: 'file-text', color: 'green', timestamp: makeTime(15, 30, 0) },
      { systemName: 'observatory', eventType: 'completed', title: 'Afternoon Collection Complete', description: '23 new citations added — 3 breaking updates catalogued', icon: 'check-circle', color: 'green', timestamp: makeTime(16, 0, 0) },
      { systemName: 'mission_control', eventType: 'heartbeat', title: 'Platform Health: All Systems Green', description: '4 active pipelines, 0 errors in last hour', icon: 'heart', color: 'green', timestamp: makeTime(16, 30, 0) },

      // 17:00
      { systemName: 'age', eventType: 'learning', title: 'Governor: Budget Status Check', description: '21/20 budget used — generation paused, measurement continues', icon: 'shield', color: 'yellow', timestamp: makeTime(17, 0, 0) },
      { systemName: 'client_zero', eventType: 'completed', title: 'Client Zero: 14/20 Articles Complete', description: '6 articles remaining — estimated completion by 18:30', icon: 'bar-chart', color: 'blue', timestamp: makeTime(17, 30, 0) },

      // Current time events
      { systemName: 'mission_control', eventType: 'heartbeat', title: 'Mission Control: Orchestrating', description: 'Monitoring 4 active pipelines — all within SLA', icon: 'activity', color: 'green', timestamp: new Date() },
    ]

    for (const event of timelineEvents) {
      await db.mCTimelineEvent.create({ data: event })
    }
    console.log(`[ops/seed] ✅ MCTimelineEvent: ${timelineEvents.length} events seeded`)

    // ── 3. MCWorker ────────────────────────────────────────────────────
    await db.mCWorker.deleteMany({})

    const workers = [
      // AGE workers
      { systemName: 'age', workerName: 'discovery', status: 'running', reasoning: 'Scanning 847 opportunity signals across 12 verticals', currentTask: 'Vertical scan: SaaS/Cloud', totalRuns: 342, successRate: 0.94, startedAt: makeTime(6, 50) },
      { systemName: 'age', workerName: 'scoring', status: 'running', reasoning: 'Scoring 156 discovered opportunities by ROI potential', currentTask: 'Priority queue #7', totalRuns: 312, successRate: 0.97, startedAt: makeTime(7, 5) },
      { systemName: 'age', workerName: 'generation', status: 'stopped', reasoning: 'Daily budget exhausted (21/20)', currentTask: null, totalRuns: 287, successRate: 0.91, startedAt: null, completedAt: makeTime(7, 18) },
      { systemName: 'age', workerName: 'review', status: 'idle', reasoning: 'Review cycle complete — next cycle at 07:15 tomorrow', currentTask: null, totalRuns: 156, successRate: 0.89, startedAt: null, completedAt: makeTime(7, 15) },
      { systemName: 'age', workerName: 'execution', status: 'stopped', reasoning: 'Daily budget exhausted (21/20) — governor halted', currentTask: null, totalRuns: 89, successRate: 0.86, startedAt: null, completedAt: makeTime(7, 20) },
      { systemName: 'age', workerName: 'measurement', status: 'running', reasoning: 'Measuring ROI for 14 published articles', currentTask: 'Batch measurement cycle', totalRuns: 234, successRate: 0.93, startedAt: makeTime(9, 30) },
      { systemName: 'age', workerName: 'learning', status: 'idle', reasoning: 'Scheduled for 22:00 replay session', currentTask: null, totalRuns: 78, successRate: 0.88 },
      { systemName: 'age', workerName: 'governor', status: 'running', reasoning: 'Monitoring budget utilization and quality gates — 21/20 used', currentTask: 'Budget gate: generation paused', totalRuns: 456, successRate: 0.99, startedAt: makeTime(6, 50) },
      { systemName: 'age', workerName: 'pruning', status: 'idle', reasoning: '3 low-ROI opportunities pruned today — next cycle at 22:00', currentTask: null, totalRuns: 23, successRate: 0.96, startedAt: null, completedAt: makeTime(7, 20) },

      // QA workers
      { systemName: 'qa_engine', workerName: 'functional', status: 'idle', reasoning: 'Nightly review complete — all pages passed', currentTask: null, totalRuns: 90, successRate: 0.95, startedAt: null, completedAt: makeTime(6, 10) },
      { systemName: 'qa_engine', workerName: 'ux', status: 'idle', reasoning: 'Nightly review complete — 3 UX suggestions noted', currentTask: null, totalRuns: 90, successRate: 0.92, startedAt: null, completedAt: makeTime(6, 25) },
      { systemName: 'qa_engine', workerName: 'product', status: 'idle', reasoning: 'Nightly review complete — product score: 89', currentTask: null, totalRuns: 90, successRate: 0.88, startedAt: null, completedAt: makeTime(6, 30) },
      { systemName: 'qa_engine', workerName: 'growth', status: 'idle', reasoning: 'Nightly review complete — funnel analysis OK', currentTask: null, totalRuns: 90, successRate: 0.91, startedAt: null, completedAt: makeTime(6, 35) },
      { systemName: 'qa_engine', workerName: 'copy', status: 'idle', reasoning: 'Nightly review complete — 2 copy improvements suggested', currentTask: null, totalRuns: 90, successRate: 0.87, startedAt: null, completedAt: makeTime(6, 32) },
      { systemName: 'qa_engine', workerName: 'accessibility', status: 'idle', reasoning: '2 WCAG AA contrast issues flagged for fix', currentTask: null, totalRuns: 90, successRate: 0.94, startedAt: null, completedAt: makeTime(6, 22) },
      { systemName: 'qa_engine', workerName: 'performance', status: 'idle', reasoning: 'Lighthouse avg: 94 — 2 minor optimizations suggested', currentTask: null, totalRuns: 90, successRate: 0.96, startedAt: null, completedAt: makeTime(6, 15) },
      { systemName: 'qa_engine', workerName: 'security', status: 'idle', reasoning: 'All headers properly configured — no issues', currentTask: null, totalRuns: 90, successRate: 0.98, startedAt: null, completedAt: makeTime(6, 28) },
      { systemName: 'qa_engine', workerName: 'seo', status: 'idle', reasoning: 'All meta tags valid — 1 canonical suggestion', currentTask: null, totalRuns: 90, successRate: 0.93, startedAt: null, completedAt: makeTime(6, 18) },
      { systemName: 'qa_engine', workerName: 'observatory', status: 'idle', reasoning: 'Methodology integrity check passed', currentTask: null, totalRuns: 90, successRate: 0.90, startedAt: null, completedAt: makeTime(6, 40) },

      // Client Zero workers
      { systemName: 'client_zero', workerName: 'mission_planner', status: 'running', reasoning: 'Planning content mission for 3 active clients', currentTask: 'Client #7: SEO audit mission', totalRuns: 167, successRate: 0.93, startedAt: makeTime(7, 30) },
      { systemName: 'client_zero', workerName: 'content_executor', status: 'running', reasoning: 'Executing batch 3 of 5 — 12 articles remaining', currentTask: 'Batch execution: Technology vertical', totalRuns: 234, successRate: 0.89, startedAt: makeTime(7, 30) },
      { systemName: 'client_zero', workerName: 'replay_scheduler', status: 'idle', reasoning: 'No replays scheduled until next cycle', currentTask: null, totalRuns: 45, successRate: 0.91 },
      { systemName: 'client_zero', workerName: 'learning_engine', status: 'running', reasoning: 'Updating client models with latest performance data', currentTask: 'Model update: Client #3, #7, #12', totalRuns: 89, successRate: 0.87, startedAt: makeTime(10, 0) },

      // Observatory workers
      { systemName: 'observatory', workerName: 'collector', status: 'running', reasoning: 'Collecting citation data from 23 sources — batch 4/6', currentTask: 'Source scan: batch 4/6', totalRuns: 456, successRate: 0.95, startedAt: makeTime(8, 0) },
      { systemName: 'observatory', workerName: 'analyzer', status: 'running', reasoning: 'Analyzing 89 collected citations for quality scoring', currentTask: 'Quality assessment pipeline', totalRuns: 378, successRate: 0.93, startedAt: makeTime(8, 30) },
      { systemName: 'observatory', workerName: 'detector', status: 'running', reasoning: 'Monitoring for breaking industry signals — 3 detected today', currentTask: 'Real-time signal detection', totalRuns: 567, successRate: 0.91, startedAt: makeTime(8, 0) },
      { systemName: 'observatory', workerName: 'publisher', status: 'idle', reasoning: 'Next publish window at 14:00 — 89 citations ready', currentTask: null, totalRuns: 123, successRate: 0.97, startedAt: null, completedAt: makeTime(9, 0) },
    ]

    for (const w of workers) {
      await db.mCWorker.create({ data: w })
    }
    console.log(`[ops/seed] ✅ MCWorker: ${workers.length} workers seeded`)

    // ── 4. MCHeartbeat ────────────────────────────────────────────────
    await db.mCHeartbeat.create({
      data: {
        status: 'healthy',
        ageStatus: 'healthy',
        qaStatus: 'idle',
        czStatus: 'healthy',
        observatoryStatus: 'healthy',
        schedulerStatus: 'healthy',
        checksPerformed: JSON.stringify({
          age: { ok: true, latency: 42, status: 'healthy' },
          qa: { ok: true, latency: 18, status: 'idle' },
          clientZero: { ok: true, latency: 55, status: 'healthy' },
          observatory: { ok: true, latency: 67, status: 'healthy' },
          scheduler: { ok: true, latency: 23, status: 'healthy' },
        }),
        timestamp: new Date(),
      },
    })
    console.log('[ops/seed] ✅ MCHeartbeat: 1 heartbeat created')

    // ── 5. MCScheduleJob ──────────────────────────────────────────────
    await db.mCScheduleJob.deleteMany({
      where: {
        scheduledDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    })

    const scheduleJobs = [
      { name: 'Start QA Engine', systemName: 'qa_engine', scheduledTime: '06:00', dependsOn: '[]', condition: null, status: 'completed', reasoning: 'QA Engine started successfully — nightly review initiated', startedAt: makeTime(6, 0), completedAt: makeTime(6, 42), duration: 2520000, result: '{"success":true,"score":89}' },
      { name: 'QA Finished Check', systemName: 'mission_control', scheduledTime: '06:45', dependsOn: '["Start QA Engine"]', condition: 'qa_pass', status: 'completed', reasoning: 'QA passed with 89/100 product score — all gates green', startedAt: makeTime(6, 45), completedAt: makeTime(6, 47), duration: 120000, result: '{"success":true,"qaPassed":true}' },
      { name: 'AGE Discovery', systemName: 'age', scheduledTime: '06:50', dependsOn: '["QA Finished Check"]', condition: null, status: 'completed', reasoning: 'Discovery completed — 156 opportunities found across 12 verticals', startedAt: makeTime(6, 50), completedAt: makeTime(7, 5), duration: 900000, result: '{"success":true,"opportunities":156}' },
      { name: 'AGE Review', systemName: 'age', scheduledTime: '07:15', dependsOn: '["AGE Discovery"]', condition: null, status: 'completed', reasoning: 'Review completed — 34 opportunities approved for generation', startedAt: makeTime(7, 15), completedAt: makeTime(7, 18), duration: 180000, result: '{"success":true,"approved":34}' },
      { name: 'Client Zero Execute', systemName: 'client_zero', scheduledTime: '07:30', dependsOn: '["AGE Review"]', condition: null, status: 'running', reasoning: 'Executing batch 3 of 5 — 12 articles remaining', startedAt: makeTime(7, 30), completedAt: null, duration: null, result: null },
      { name: 'Observatory Collect', systemName: 'observatory', scheduledTime: '08:00', dependsOn: '[]', condition: null, status: 'completed', reasoning: 'Collection complete — 89 citations from 23 sources', startedAt: makeTime(8, 0), completedAt: makeTime(8, 30), duration: 1800000, result: '{"success":true,"citations":89}' },
      { name: 'Publish Window #1', systemName: 'mission_control', scheduledTime: '09:00', dependsOn: '["Client Zero Execute"]', condition: null, status: 'completed', reasoning: 'Published 4 articles to production', startedAt: makeTime(9, 0), completedAt: makeTime(9, 5), duration: 300000, result: '{"success":true,"published":4}' },
      { name: 'Publish Window #2', systemName: 'mission_control', scheduledTime: '14:00', dependsOn: '[]', condition: null, status: 'pending', reasoning: 'Waiting for publish window to open', startedAt: null, completedAt: null, duration: null, result: null },
      { name: 'Publish Window #3', systemName: 'mission_control', scheduledTime: '18:00', dependsOn: '[]', condition: null, status: 'pending', reasoning: 'Waiting for publish window to open', startedAt: null, completedAt: null, duration: null, result: null },
      { name: 'Replay + Learning', systemName: 'age', scheduledTime: '22:00', dependsOn: '[]', condition: null, status: 'pending', reasoning: 'Scheduled for evening learning cycle', startedAt: null, completedAt: null, duration: null, result: null },
      { name: 'Executive Daily Report', systemName: 'mission_control', scheduledTime: '23:00', dependsOn: '["Replay + Learning"]', condition: null, status: 'pending', reasoning: 'Waiting for replay + learning to complete', startedAt: null, completedAt: null, duration: null, result: null },
    ]

    for (const job of scheduleJobs) {
      await db.mCScheduleJob.create({
        data: {
          ...job,
          scheduledDate: todayStart,
        },
      })
    }
    console.log(`[ops/seed] ✅ MCScheduleJob: ${scheduleJobs.length} jobs seeded`)

    // ── 6. MCAutonomyMetric ───────────────────────────────────────────
    const todayMetrics = [
      { date: todayStart, systemName: 'client_zero', planned: 20, completed: 18, failed: 1, rate: 18 / 20 },
      { date: todayStart, systemName: 'age', planned: 34, completed: 30, failed: 2, rate: 30 / 34 },
      { date: todayStart, systemName: 'qa_engine', planned: 10, completed: 10, failed: 0, rate: 1.0 },
      { date: todayStart, systemName: 'observatory', planned: 12, completed: 9, failed: 1, rate: 9 / 12 },
      { date: todayStart, systemName: 'mission_control', planned: 13, completed: 12, failed: 0, rate: 12 / 13 },
    ]

    const historicalMetrics = [
      // 6 days ago
      { date: daysAgo(6), systemName: 'client_zero', planned: 18, completed: 15, failed: 1, rate: 15 / 18 },
      { date: daysAgo(6), systemName: 'age', planned: 30, completed: 24, failed: 3, rate: 24 / 30 },
      { date: daysAgo(6), systemName: 'qa_engine', planned: 10, completed: 10, failed: 0, rate: 1.0 },
      { date: daysAgo(6), systemName: 'observatory', planned: 12, completed: 9, failed: 1, rate: 9 / 12 },
      { date: daysAgo(6), systemName: 'mission_control', planned: 12, completed: 10, failed: 1, rate: 10 / 12 },
      // 5 days ago
      { date: daysAgo(5), systemName: 'client_zero', planned: 19, completed: 16, failed: 2, rate: 16 / 19 },
      { date: daysAgo(5), systemName: 'age', planned: 32, completed: 27, failed: 2, rate: 27 / 32 },
      { date: daysAgo(5), systemName: 'qa_engine', planned: 10, completed: 10, failed: 0, rate: 1.0 },
      { date: daysAgo(5), systemName: 'observatory', planned: 12, completed: 11, failed: 1, rate: 11 / 12 },
      { date: daysAgo(5), systemName: 'mission_control', planned: 13, completed: 12, failed: 0, rate: 12 / 13 },
      // 4 days ago
      { date: daysAgo(4), systemName: 'client_zero', planned: 22, completed: 18, failed: 1, rate: 18 / 22 },
      { date: daysAgo(4), systemName: 'age', planned: 35, completed: 30, failed: 1, rate: 30 / 35 },
      { date: daysAgo(4), systemName: 'qa_engine', planned: 10, completed: 9, failed: 1, rate: 9 / 10 },
      { date: daysAgo(4), systemName: 'observatory', planned: 12, completed: 10, failed: 0, rate: 10 / 12 },
      { date: daysAgo(4), systemName: 'mission_control', planned: 13, completed: 12, failed: 1, rate: 12 / 13 },
      // 3 days ago
      { date: daysAgo(3), systemName: 'client_zero', planned: 21, completed: 19, failed: 0, rate: 19 / 21 },
      { date: daysAgo(3), systemName: 'age', planned: 33, completed: 29, failed: 2, rate: 29 / 33 },
      { date: daysAgo(3), systemName: 'qa_engine', planned: 10, completed: 10, failed: 0, rate: 1.0 },
      { date: daysAgo(3), systemName: 'observatory', planned: 12, completed: 11, failed: 1, rate: 11 / 12 },
      { date: daysAgo(3), systemName: 'mission_control', planned: 13, completed: 13, failed: 0, rate: 1.0 },
      // 2 days ago
      { date: daysAgo(2), systemName: 'client_zero', planned: 20, completed: 17, failed: 1, rate: 17 / 20 },
      { date: daysAgo(2), systemName: 'age', planned: 34, completed: 30, failed: 1, rate: 30 / 34 },
      { date: daysAgo(2), systemName: 'qa_engine', planned: 10, completed: 10, failed: 0, rate: 1.0 },
      { date: daysAgo(2), systemName: 'observatory', planned: 12, completed: 10, failed: 1, rate: 10 / 12 },
      { date: daysAgo(2), systemName: 'mission_control', planned: 13, completed: 11, failed: 1, rate: 11 / 13 },
      // 1 day ago
      { date: daysAgo(1), systemName: 'client_zero', planned: 21, completed: 19, failed: 1, rate: 19 / 21 },
      { date: daysAgo(1), systemName: 'age', planned: 33, completed: 29, failed: 2, rate: 29 / 33 },
      { date: daysAgo(1), systemName: 'qa_engine', planned: 10, completed: 10, failed: 0, rate: 1.0 },
      { date: daysAgo(1), systemName: 'observatory', planned: 12, completed: 11, failed: 1, rate: 11 / 12 },
      { date: daysAgo(1), systemName: 'mission_control', planned: 13, completed: 12, failed: 0, rate: 12 / 13 },
    ]

    for (const m of [...todayMetrics, ...historicalMetrics]) {
      await db.mCAutonomyMetric.upsert({
        where: {
          date_systemName: {
            date: m.date,
            systemName: m.systemName,
          },
        },
        update: m,
        create: m,
      })
    }
    console.log(`[ops/seed] ✅ MCAutonomyMetric: ${todayMetrics.length + historicalMetrics.length} metrics seeded (7 days)`)

    // ── 7. MCDailyReport ──────────────────────────────────────────────
    const totalPlanned = todayMetrics.reduce((s, m) => s + m.planned, 0)
    const totalCompleted = todayMetrics.reduce((s, m) => s + m.completed, 0)
    const totalFailed = todayMetrics.reduce((s, m) => s + m.failed, 0)
    const autonomyRate = totalPlanned > 0 ? totalCompleted / totalPlanned : 0

    await db.mCDailyReport.upsert({
      where: { date: todayStart },
      update: {},
      create: {
        date: todayStart,
        autonomyRate,
        totalPlanned,
        totalCompleted,
        totalFailed,
        systemBreakdown: JSON.stringify({
          client_zero: { planned: 20, completed: 18, failed: 1, rate: 0.90 },
          age: { planned: 34, completed: 30, failed: 2, rate: 0.88 },
          qa_engine: { planned: 10, completed: 10, failed: 0, rate: 1.0 },
          observatory: { planned: 12, completed: 9, failed: 1, rate: 0.75 },
          mission_control: { planned: 13, completed: 12, failed: 0, rate: 0.92 },
        }),
        highlights: JSON.stringify([
          'QA Engine achieved 100% completion rate — all 10 reviewers passed',
          'AGE discovered 156 opportunities — highest daily count this week',
          'Client Zero at 90% autonomy — 18/20 tasks completed',
          'Observatory collected 89 citations from 23 sources',
          'Publish Window #1: 4 articles live on production',
        ]),
        issues: JSON.stringify([
          'AGE budget exceeded (21/20) — generation paused, governor activated',
          'Client #12: API timeout during content generation — auto-retried successfully',
          'Accessibility: 2 WCAG AA contrast issues flagged in footer',
          'Observatory: 1 collection batch failed — auto-retried',
        ]),
        reportContent: `# Mission Control Daily Report\n\n## Platform Autonomy™ Rate: ${Math.round(autonomyRate * 100)}%\n\n### System Performance\n\n| System | Planned | Completed | Failed | Rate |\n|--------|---------|-----------|--------|------|\n| Client Zero | 20 | 18 | 1 | 90% |\n| AGE | 34 | 30 | 2 | 88% |\n| QA Engine | 10 | 10 | 0 | 100% |\n| Observatory | 12 | 9 | 1 | 75% |\n| Mission Control | 13 | 12 | 0 | 92% |\n\n### Highlights\n- QA Engine achieved 100% completion rate\n- AGE discovered 156 opportunities\n- Client Zero at 90% autonomy\n- 4 articles published\n\n### Issues\n- AGE budget exceeded (21/20)\n- Client #12: API timeout (retried)\n- 2 WCAG AA contrast issues\n- Observatory: 1 collection batch failed\n\n### Recommendations\n1. Increase AGE daily budget from 20 to 25\n2. Implement exponential backoff for Client Zero API timeouts\n3. Fix WCAG AA contrast issues\n4. Add fallback sources for Observatory collection pipeline`,
      },
    })
    console.log('[ops/seed] ✅ MCDailyReport: 1 report created')

    return NextResponse.json({
      success: true,
      message: 'Operations Center seeded successfully',
      data: {
        systemStatuses: systemStatuses.length,
        timelineEvents: timelineEvents.length,
        workers: workers.length,
        heartbeats: 1,
        scheduleJobs: scheduleJobs.length,
        autonomyMetrics: todayMetrics.length + historicalMetrics.length,
        dailyReports: 1,
      },
    })
  } catch (error) {
    console.error('[ops/seed] Error:', error)
    return NextResponse.json(
      { error: 'Failed to seed Operations Center data', details: String(error) },
      { status: 500 }
    )
  }
}
