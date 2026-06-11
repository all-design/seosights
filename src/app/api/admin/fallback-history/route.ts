import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const failedLogs = await db.agentLog.findMany({
      where: { status: 'failed' },
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        agentId: true,
        agentName: true,
        action: true,
        status: true,
        model: true,
        error: true,
        startedAt: true,
      },
    })

    return NextResponse.json({ history: failedLogs })
  } catch (error) {
    console.error('[Admin Fallback History API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fallback history' },
      { status: 500 }
    )
  }
}
