import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'
    const now = new Date()

    const countdowns = await db.engagementCountdown.findMany({
      where: { domain, isCompleted: false, targetTime: { gt: now } },
      orderBy: { targetTime: 'asc' },
    })

    // Calculate remaining time for each countdown
    const withRemaining = countdowns.map((c) => {
      const remainingMs = c.targetTime.getTime() - now.getTime()
      return {
        ...c,
        remainingMs,
        remainingHuman: formatRemaining(remainingMs),
        remainingHours: Math.floor(remainingMs / 3600000),
        remainingMinutes: Math.floor((remainingMs % 3600000) / 60000),
        remainingSeconds: Math.floor((remainingMs % 60000) / 1000),
      }
    })

    return NextResponse.json({ countdowns: withRemaining })
  } catch (error) {
    console.error('[engagement/countdowns] Error:', error)
    return NextResponse.json({ error: 'Failed to load countdowns' }, { status: 500 })
  }
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Now'
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
