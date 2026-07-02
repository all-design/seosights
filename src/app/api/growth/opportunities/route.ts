/**
 * Growth Engine — Opportunities
 *
 * GET /api/growth/opportunities
 * Returns scored opportunities with filtering and pagination.
 * Query params: type, source, priority, status, search, limit, offset
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const source = searchParams.get('source')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Prisma.GrowthOpportunityWhereInput = {}

    if (type) where.type = type
    if (source) where.source = source
    if (priority) where.priority = priority
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [opportunities, total] = await Promise.all([
      db.growthOpportunity.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ growthScore: 'desc' }, { discoveredAt: 'desc' }],
      }),
      db.growthOpportunity.count({ where }),
    ])

    return NextResponse.json({
      opportunities,
      total,
      limit,
      offset,
      hasMore: offset + opportunities.length < total,
    })
  } catch (error) {
    console.error('[Growth Opportunities] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}
