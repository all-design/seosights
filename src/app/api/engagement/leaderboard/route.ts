import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const domain = 'seosights.com'
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'visibility_gains'
    const period = searchParams.get('period') || 'monthly'

    // Determine the periodKey based on the period
    const now = new Date()
    let periodKey: string
    if (period === 'weekly') {
      // ISO week number
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      )
      periodKey = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
    } else {
      // Monthly
      periodKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    }

    const entries = await db.engagementLeaderboard.findMany({
      where: { domain, category, periodKey },
      orderBy: { rank: 'asc' },
    })

    return NextResponse.json({
      category,
      period,
      periodKey,
      entries,
    })
  } catch (error) {
    console.error('[engagement/leaderboard] Error:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
