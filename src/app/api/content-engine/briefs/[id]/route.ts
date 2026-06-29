/**
 * Content Engine — Single Brief
 *
 * GET  /api/content-engine/briefs/[id]   — Get a single brief with its articles
 * PUT  /api/content-engine/briefs/[id]   — Update brief (change status, approve, etc.)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UpdateBriefBody {
  status?: string
  priority?: string
  suggestedTitle?: string
  briefContent?: string
  topic?: string
  keywordTarget?: string
  pillar?: string
  cluster?: string
  targetWordCount?: number
  estimatedScoreGain?: number
}

// ── GET: Single brief with articles ───────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const brief = await db.contentBrief.findUnique({
      where: { id },
      include: {
        articles: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            format: true,
            status: true,
            seoScore: true,
            aeoScore: true,
            geoScore: true,
            wordCount: true,
            createdAt: true,
            publishedAt: true,
          },
        },
      },
    })

    if (!brief) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('[Content Engine Brief Detail] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brief' },
      { status: 500 }
    )
  }
}

// ── PUT: Update brief ─────────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as UpdateBriefBody

    // Verify brief exists
    const existing = await db.contentBrief.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      )
    }

    const validStatuses = ['draft', 'approved', 'in_progress', 'completed', 'archived']
    const validPriorities = ['low', 'medium', 'high', 'critical']
    const validPillars = ['seo', 'aeo', 'geo', 'all']

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    if (body.pillar && !validPillars.includes(body.pillar)) {
      return NextResponse.json(
        { error: `pillar must be one of: ${validPillars.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.suggestedTitle !== undefined) updateData.suggestedTitle = body.suggestedTitle
    if (body.briefContent !== undefined) updateData.briefContent = body.briefContent
    if (body.topic !== undefined) updateData.topic = body.topic
    if (body.keywordTarget !== undefined) updateData.keywordTarget = body.keywordTarget
    if (body.pillar !== undefined) updateData.pillar = body.pillar
    if (body.cluster !== undefined) updateData.cluster = body.cluster
    if (body.targetWordCount !== undefined) updateData.targetWordCount = body.targetWordCount
    if (body.estimatedScoreGain !== undefined) updateData.estimatedScoreGain = body.estimatedScoreGain

    const brief = await db.contentBrief.update({
      where: { id },
      data: updateData,
      include: {
        articles: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            format: true,
            status: true,
            seoScore: true,
            aeoScore: true,
            geoScore: true,
            wordCount: true,
          },
        },
      },
    })

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('[Content Engine Brief Detail] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update brief' },
      { status: 500 }
    )
  }
}
