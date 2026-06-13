import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const [analyses, total] = await Promise.all([
      db.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          agentLogs: {
            select: {
              id: true,
              agentId: true,
              agentName: true,
              action: true,
              status: true,
              tokensUsed: true,
              costUsd: true,
              model: true,
              error: true,
              startedAt: true,
              completedAt: true,
            },
            orderBy: { startedAt: 'asc' },
          },
        },
      }),
      db.analysis.count({ where }),
    ])

    return NextResponse.json({ analyses, total })
  } catch (error) {
    console.error('[Admin Analyses API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}
