/**
 * Growth Engine — Settings
 *
 * GET /api/growth/settings
 * Returns GrowthSchedule records and current budget settings.
 *
 * PUT /api/growth/settings
 * Updates schedule configuration and budget settings.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// ── GET: Fetch settings ──────────────────────────────────────────────────────

export async function GET() {
  try {
    // ── 1. All schedule records ──────────────────────────────────────────
    const schedules = await db.growthSchedule.findMany({
      orderBy: { engineName: 'asc' },
    })

    // ── 2. Current budget from today's snapshot ──────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let todaySnapshot = await db.growthDailySnapshot.findUnique({
      where: { date: today },
    })

    // If no snapshot, calculate from latest
    if (!todaySnapshot) {
      todaySnapshot = await db.growthDailySnapshot.findFirst({
        orderBy: { date: 'desc' },
      })
    }

    const budgetSettings = {
      dailyBudget: todaySnapshot?.dailyBudget || 20,
      avgQualityScore: todaySnapshot?.avgQualityScore || 0,
      avgConfidence: todaySnapshot?.avgConfidence || 0,
    }

    // ── 3. Engine health summary ─────────────────────────────────────────
    const engineSummary = schedules.map((s) => ({
      engineName: s.engineName,
      isEnabled: s.isEnabled,
      intervalMinutes: s.intervalMinutes,
      lastRunAt: s.lastRunAt,
      lastRunStatus: s.lastRunStatus,
      lastRunDuration: s.lastRunDuration,
      nextRunAt: s.nextRunAt,
    }))

    return NextResponse.json({
      schedules,
      budgetSettings,
      engineSummary,
    })
  } catch (error) {
    console.error('[Growth Settings] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// ── PUT: Update settings ─────────────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { schedules, budgetSettings } = body as {
      schedules?: Array<{
        engineName: string
        isEnabled?: boolean
        intervalMinutes?: number
        cronExpression?: string
        configJson?: string
      }>
      budgetSettings?: {
        dailyBudget?: number
      }
    }

    const updated: string[] = []

    // ── 1. Update schedules ──────────────────────────────────────────────
    if (schedules && Array.isArray(schedules)) {
      for (const schedule of schedules) {
        const updateData: Prisma.GrowthScheduleUpdateInput = {}
        if (schedule.isEnabled !== undefined) updateData.isEnabled = schedule.isEnabled
        if (schedule.intervalMinutes !== undefined) updateData.intervalMinutes = schedule.intervalMinutes
        if (schedule.cronExpression !== undefined) updateData.cronExpression = schedule.cronExpression
        if (schedule.configJson !== undefined) updateData.configJson = schedule.configJson

        if (Object.keys(updateData).length > 0) {
          await db.growthSchedule.update({
            where: { engineName: schedule.engineName },
            data: updateData,
          })
          updated.push(`schedule:${schedule.engineName}`)
        }
      }
    }

    // ── 2. Update budget settings ────────────────────────────────────────
    if (budgetSettings?.dailyBudget !== undefined) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await db.growthDailySnapshot.upsert({
        where: { date: today },
        update: { dailyBudget: budgetSettings.dailyBudget },
        create: {
          date: today,
          dailyBudget: budgetSettings.dailyBudget,
        },
      })
      updated.push('budget:dailyBudget')
    }

    return NextResponse.json({
      success: true,
      updated,
    })
  } catch (error) {
    console.error('[Growth Settings] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
