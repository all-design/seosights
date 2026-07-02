// ─── Reporter — Daily Operations Report generation ────────────────

import { db } from '../../../src/lib/db'
import { createEvent } from './timeline'

interface MCState {
  scheduleJobsToday: number
  jobsCompletedToday: number
  jobsFailedToday: number
  [key: string]: any
}

export async function generateDailyReport(state: MCState) {
  console.log('[Reporter] Generating Daily Operations Report...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get today's autonomy metrics
  const metrics = await db.mCAutonomyMetric.findMany({
    where: { date: { gte: today } },
  })

  const totalPlanned = metrics.reduce((sum, m) => sum + m.planned, 0)
  const totalCompleted = metrics.reduce((sum, m) => sum + m.completed, 0)
  const totalFailed = metrics.reduce((sum, m) => sum + m.failed, 0)
  const autonomyRate = totalPlanned > 0 ? totalCompleted / totalPlanned : 0

  // Get today's timeline events
  const events = await db.mCTimelineEvent.findMany({
    where: { timestamp: { gte: today } },
    orderBy: { timestamp: 'desc' },
    take: 20,
  })

  // Build system breakdown
  const systemBreakdown: Record<string, { planned: number; completed: number; failed: number }> = {}
  for (const m of metrics) {
    systemBreakdown[m.systemName] = { planned: m.planned, completed: m.completed, failed: m.failed }
  }

  // Highlights
  const highlights = events
    .filter(e => e.eventType === 'completed' || e.eventType === 'published')
    .slice(0, 5)
    .map(e => e.title)

  // Issues
  const issues = events
    .filter(e => e.eventType === 'error' || e.eventType === 'alert')
    .slice(0, 5)
    .map(e => e.title)

  // Generate report content
  const reportContent = `# Daily Operations Report — ${today.toLocaleDateString()}

## Platform Autonomy™: ${(autonomyRate * 100).toFixed(1)}%

- **Total Planned**: ${totalPlanned}
- **Total Completed**: ${totalCompleted}
- **Total Failed**: ${totalFailed}

## System Breakdown

${Object.entries(systemBreakdown)
  .map(([sys, data]) => `- **${sys}**: ${data.completed}/${data.planned} completed (${data.failed} failed)`)
  .join('\n')}

## Highlights

${highlights.map(h => `- ✅ ${h}`).join('\n') || '- No highlights today'}

## Issues

${issues.map(i => `- ⚠️ ${i}`).join('\n') || '- No issues today'}

## Classification

${autonomyRate > 0.95 ? '🟢 Fully Autonomous' : autonomyRate > 0.8 ? '🟢 High Autonomy' : autonomyRate > 0.6 ? '🟡 Semi-Autonomous' : '🔴 Requires Attention'}
`

  // Create or update report
  try {
    await db.mCDailyReport.upsert({
      where: { date: today },
      update: {
        autonomyRate,
        totalPlanned,
        totalCompleted,
        totalFailed,
        systemBreakdown: JSON.stringify(systemBreakdown),
        highlights: JSON.stringify(highlights),
        issues: JSON.stringify(issues),
        reportContent,
      },
      create: {
        date: today,
        autonomyRate,
        totalPlanned,
        totalCompleted,
        totalFailed,
        systemBreakdown: JSON.stringify(systemBreakdown),
        highlights: JSON.stringify(highlights),
        issues: JSON.stringify(issues),
        reportContent,
      },
    })
  } catch (e) {
    console.error('[Reporter] Failed to save report:', e)
  }

  await createEvent('mission_control', 'completed', 'Daily Report Generated', `Platform Autonomy: ${(autonomyRate * 100).toFixed(1)}%`, 'file-text', 'blue')

  console.log('[Reporter] Daily report generated successfully')
}
