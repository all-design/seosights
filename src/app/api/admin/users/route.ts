import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: { analyses: true },
          },
        },
      }),
      db.user.count({ where }),
    ])

    // Add a "plan" field derived from analyses count (mock)
    const usersWithPlan = users.map((user) => ({
      ...user,
      plan: user._count.analyses > 10 ? 'Pro' : user._count.analyses > 3 ? 'Starter' : 'Free',
      analysesCount: user._count.analyses,
    }))

    return NextResponse.json({ users: usersWithPlan, total })
  } catch (error) {
    console.error('[Admin Users API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
