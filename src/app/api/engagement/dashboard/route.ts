import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Fetch all dashboard data in parallel
    const [
      momentum,
      todayBrief,
      activeMission,
      streak,
      activitySummary,
      unreadCount,
      activeCountdowns,
      mysteryBox,
      coach,
      season,
      weeklyMission,
    ] = await Promise.all([
      db.engagementMomentum.findFirst({ where: { domain }, orderBy: { createdAt: 'desc' } }),
      db.engagementBrief.findFirst({
        where: { domain, briefDate: { gte: todayStart } },
        orderBy: { briefDate: 'desc' },
      }),
      db.engagementMission.findFirst({
        where: { domain, missionDate: { gte: todayStart }, status: 'active' },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      }),
      db.engagementStreak.findFirst({ where: { domain }, orderBy: { createdAt: 'desc' } }),
      db.engagementActivitySummary.findFirst({
        where: { domain, summaryDate: { gte: todayStart } },
        orderBy: { summaryDate: 'desc' },
      }),
      db.engagementInboxItem.count({ where: { domain, isUnread: true } }),
      db.engagementCountdown.findMany({
        where: { domain, isCompleted: false, targetTime: { gt: now } },
        orderBy: { targetTime: 'asc' },
        take: 5,
      }),
      db.engagementMysteryBox.findFirst({
        where: { domain, revealDate: { gte: todayStart } },
        orderBy: { revealDate: 'asc' },
      }),
      db.engagementCoach.findFirst({
        where: { domain, coachDate: { gte: todayStart } },
        orderBy: { coachDate: 'desc' },
      }),
      db.engagementSeason.findFirst({
        where: { domain, status: 'active' },
        orderBy: { startDate: 'desc' },
      }),
      db.engagementWeeklyMission.findFirst({
        where: { domain, status: 'active' },
        orderBy: { weekStart: 'desc' },
      }),
    ])

    // Fallback to most recent brief if today's doesn't exist
    const brief =
      todayBrief ??
      (await db.engagementBrief.findFirst({
        where: { domain },
        orderBy: { briefDate: 'desc' },
      }))

    // Calculate remaining time for countdowns
    const countdownsWithRemaining = activeCountdowns.map((c) => ({
      ...c,
      remainingMs: c.targetTime.getTime() - now.getTime(),
      remainingHuman: formatRemaining(c.targetTime.getTime() - now.getTime()),
    }))

    return NextResponse.json({
      momentum,
      brief,
      activeMission,
      streak,
      activitySummary,
      unreadInboxCount: unreadCount,
      countdowns: countdownsWithRemaining,
      mysteryBox,
      coach,
      season,
      weeklyMission,
    })
  } catch (error) {
    console.error('[engagement/dashboard] Error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Now'
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
