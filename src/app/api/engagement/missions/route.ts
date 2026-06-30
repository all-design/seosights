import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart.getTime() - 86400000)
    const yesterdayEnd = new Date(todayStart.getTime() - 1)

    // Today's mission with steps
    const todayMission = await db.engagementMission.findFirst({
      where: { domain, missionDate: { gte: todayStart } },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { missionDate: 'desc' },
    })

    // Yesterday's completed mission if exists
    const yesterdayMission = await db.engagementMission.findFirst({
      where: {
        domain,
        missionDate: { gte: yesterdayStart, lte: yesterdayEnd },
        status: 'completed',
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })

    return NextResponse.json({
      todayMission,
      yesterdayMission,
    })
  } catch (error) {
    console.error('[engagement/missions] Error:', error)
    return NextResponse.json({ error: 'Failed to load missions' }, { status: 500 })
  }
}
