import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Find today's coach
    const coach = await db.engagementCoach.findFirst({
      where: { domain, coachDate: { gte: todayStart } },
      orderBy: { coachDate: 'desc' },
    })

    if (!coach) {
      // Fallback to most recent
      const fallback = await db.engagementCoach.findFirst({
        where: { domain },
        orderBy: { coachDate: 'desc' },
      })
      return NextResponse.json({ coach: fallback ?? null })
    }

    return NextResponse.json({ coach })
  } catch (error) {
    console.error('[engagement/coach] Error:', error)
    return NextResponse.json({ error: 'Failed to load coach' }, { status: 500 })
  }
}
