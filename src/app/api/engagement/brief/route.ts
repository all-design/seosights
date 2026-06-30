import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Try to find today's brief first
    const todayBrief = await db.engagementBrief.findFirst({
      where: { domain, briefDate: { gte: todayStart } },
      orderBy: { briefDate: 'desc' },
    })

    // Fallback to most recent brief
    const brief =
      todayBrief ??
      (await db.engagementBrief.findFirst({
        where: { domain },
        orderBy: { briefDate: 'desc' },
      }))

    if (!brief) {
      return NextResponse.json({ brief: null })
    }

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('[engagement/brief] Error:', error)
    return NextResponse.json({ error: 'Failed to load brief' }, { status: 500 })
  }
}
