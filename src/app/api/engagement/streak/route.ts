import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'

    const streak = await db.engagementStreak.findFirst({
      where: { domain },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ streak: streak ?? null })
  } catch (error) {
    console.error('[engagement/streak] Error:', error)
    return NextResponse.json({ error: 'Failed to load streak' }, { status: 500 })
  }
}
