import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'

    // Pending predictions (not yet executed)
    const pending = await db.engagementPrediction.findMany({
      where: { domain, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })

    // Recently measured predictions (executed, measuring, correct, or incorrect)
    const recentlyMeasured = await db.engagementPrediction.findMany({
      where: {
        domain,
        status: { in: ['executed', 'measuring', 'correct', 'incorrect'] },
      },
      orderBy: { measuredAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      pending,
      recentlyMeasured,
    })
  } catch (error) {
    console.error('[engagement/predictions] Error:', error)
    return NextResponse.json({ error: 'Failed to load predictions' }, { status: 500 })
  }
}
