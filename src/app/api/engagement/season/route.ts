import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'

    // Find the active season
    const season = await db.engagementSeason.findFirst({
      where: { domain, status: 'active' },
      orderBy: { startDate: 'desc' },
    })

    if (!season) {
      // Fallback: find the most recent upcoming or any season
      const fallback = await db.engagementSeason.findFirst({
        where: { domain },
        orderBy: { startDate: 'desc' },
      })
      return NextResponse.json({ season: fallback ?? null })
    }

    return NextResponse.json({ season })
  } catch (error) {
    console.error('[engagement/season] Error:', error)
    return NextResponse.json({ error: 'Failed to load season' }, { status: 500 })
  }
}
