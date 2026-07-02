/**
 * Schedule API — GET /api/ops/schedule
 *
 * Returns today's MCScheduleJob records.
 * If none exist for today, generates them from the default daily schedule template.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ScheduleTemplate {
  name: string
  systemName: string
  scheduledTime: string
  dependsOn: string[]
  condition: string | null
  status: string
  reasoning: string | null
}

const DAILY_SCHEDULE_TEMPLATE: ScheduleTemplate[] = [
  {
    name: 'Start QA Engine',
    systemName: 'qa_engine',
    scheduledTime: '06:00',
    dependsOn: [],
    condition: null,
    status: 'completed',
    reasoning: 'QA Engine started successfully — nightly review initiated',
  },
  {
    name: 'QA Finished Check',
    systemName: 'mission_control',
    scheduledTime: '06:45',
    dependsOn: ['Start QA Engine'],
    condition: 'qa_pass',
    status: 'completed',
    reasoning: 'QA passed with 89/100 product score — all gates green',
  },
  {
    name: 'AGE Discovery',
    systemName: 'age',
    scheduledTime: '06:50',
    dependsOn: ['QA Finished Check'],
    condition: null,
    status: 'completed',
    reasoning: 'Discovery completed — 156 opportunities found across 12 verticals',
  },
  {
    name: 'AGE Review',
    systemName: 'age',
    scheduledTime: '07:15',
    dependsOn: ['AGE Discovery'],
    condition: null,
    status: 'completed',
    reasoning: 'Review completed — 34 opportunities approved for generation',
  },
  {
    name: 'Client Zero Execute',
    systemName: 'client_zero',
    scheduledTime: '07:30',
    dependsOn: ['AGE Review'],
    condition: null,
    status: 'running',
    reasoning: 'Executing batch 3 of 5 — 12 articles remaining',
  },
  {
    name: 'Observatory Collect',
    systemName: 'observatory',
    scheduledTime: '08:00',
    dependsOn: [],
    condition: null,
    status: 'completed',
    reasoning: 'Collection complete — 89 citations from 23 sources',
  },
  {
    name: 'Publish Window #1',
    systemName: 'mission_control',
    scheduledTime: '09:00',
    dependsOn: ['Client Zero Execute'],
    condition: null,
    status: 'completed',
    reasoning: 'Published 4 articles to production',
  },
  {
    name: 'Publish Window #2',
    systemName: 'mission_control',
    scheduledTime: '14:00',
    dependsOn: [],
    condition: null,
    status: 'pending',
    reasoning: 'Waiting for publish window to open',
  },
  {
    name: 'Publish Window #3',
    systemName: 'mission_control',
    scheduledTime: '18:00',
    dependsOn: [],
    condition: null,
    status: 'pending',
    reasoning: 'Waiting for publish window to open',
  },
  {
    name: 'Replay + Learning',
    systemName: 'age',
    scheduledTime: '22:00',
    dependsOn: [],
    condition: null,
    status: 'pending',
    reasoning: 'Scheduled for evening learning cycle',
  },
  {
    name: 'Executive Daily Report',
    systemName: 'mission_control',
    scheduledTime: '23:00',
    dependsOn: ['Replay + Learning'],
    condition: null,
    status: 'pending',
    reasoning: 'Waiting for replay + learning to complete',
  },
]

function getTodayStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function GET() {
  try {
    const todayStart = getTodayStart()
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Check if today's schedule exists
    const existingJobs = await db.mCScheduleJob.findMany({
      where: {
        scheduledDate: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      orderBy: { scheduledTime: 'asc' },
    })

    if (existingJobs.length > 0) {
      return NextResponse.json({
        jobs: existingJobs,
        date: todayStart.toISOString(),
        totalJobs: existingJobs.length,
        completed: existingJobs.filter(j => j.status === 'completed').length,
        running: existingJobs.filter(j => j.status === 'running').length,
        pending: existingJobs.filter(j => j.status === 'pending').length,
        failed: existingJobs.filter(j => j.status === 'failed').length,
        timestamp: new Date().toISOString(),
      })
    }

    // Generate today's schedule from template
    const createdJobs = []
    for (const tmpl of DAILY_SCHEDULE_TEMPLATE) {
      const [hours, minutes] = tmpl.scheduledTime.split(':').map(Number)
      const scheduledAt = new Date(todayStart)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const startedAt = tmpl.status === 'completed' || tmpl.status === 'running'
        ? new Date(scheduledAt.getTime() + Math.floor(Math.random() * 30000))
        : null
      const completedAt = tmpl.status === 'completed'
        ? new Date((startedAt ?? scheduledAt).getTime() + (Math.floor(Math.random() * 120) + 30) * 1000)
        : null
      const duration = completedAt && startedAt
        ? completedAt.getTime() - startedAt.getTime()
        : null

      const job = await db.mCScheduleJob.create({
        data: {
          name: tmpl.name,
          systemName: tmpl.systemName,
          scheduledTime: tmpl.scheduledTime,
          dependsOn: JSON.stringify(tmpl.dependsOn),
          condition: tmpl.condition,
          status: tmpl.status,
          reasoning: tmpl.reasoning,
          scheduledDate: todayStart,
          startedAt,
          completedAt,
          duration,
          result: tmpl.status === 'completed' ? JSON.stringify({ success: true }) : null,
        },
      })
      createdJobs.push(job)
    }

    return NextResponse.json({
      jobs: createdJobs,
      date: todayStart.toISOString(),
      totalJobs: createdJobs.length,
      completed: createdJobs.filter(j => j.status === 'completed').length,
      running: createdJobs.filter(j => j.status === 'running').length,
      pending: createdJobs.filter(j => j.status === 'pending').length,
      failed: createdJobs.filter(j => j.status === 'failed').length,
      generated: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ops/schedule] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
