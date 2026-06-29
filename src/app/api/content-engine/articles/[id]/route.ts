/**
 * Content Engine — Single Article
 *
 * GET  /api/content-engine/articles/[id]   — Get single article with reviews
 * PUT  /api/content-engine/articles/[id]   — Update article (change status, content, etc.)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UpdateArticleBody {
  status?: string
  title?: string
  content?: string
  seoScore?: number
  aeoScore?: number
  geoScore?: number
  schemaMarkup?: string
  internalLinks?: string
  ogImageUrl?: string
  reviewResults?: string
  metadata?: string
}

// ── GET: Single article with reviews ──────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const article = await db.contentArticle.findUnique({
      where: { id },
      include: {
        brief: {
          select: {
            id: true,
            topic: true,
            pillar: true,
            cluster: true,
            keywordTarget: true,
            briefContent: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('[Content Engine Article Detail] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

// ── PUT: Update article ───────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as UpdateArticleBody

    // Verify article exists
    const existing = await db.contentArticle.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const validStatuses = ['draft', 'writing', 'review', 'approved', 'published', 'replay_scheduled', 'replayed', 'rewriting']

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) {
      updateData.content = body.content
      updateData.wordCount = body.content.split(/\s+/).length
    }
    if (body.seoScore !== undefined) updateData.seoScore = body.seoScore
    if (body.aeoScore !== undefined) updateData.aeoScore = body.aeoScore
    if (body.geoScore !== undefined) updateData.geoScore = body.geoScore
    if (body.schemaMarkup !== undefined) updateData.schemaMarkup = body.schemaMarkup
    if (body.internalLinks !== undefined) updateData.internalLinks = body.internalLinks
    if (body.ogImageUrl !== undefined) updateData.ogImageUrl = body.ogImageUrl
    if (body.reviewResults !== undefined) updateData.reviewResults = body.reviewResults
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    // If status is 'published', set publishedAt
    if (body.status === 'published' && !existing.publishedAt) {
      updateData.publishedAt = new Date()
      updateData.publishedUrl = `https://${existing.domain}/blog/${existing.slug || existing.id}`
    }

    const article = await db.contentArticle.update({
      where: { id },
      data: updateData,
      include: {
        brief: {
          select: {
            id: true,
            topic: true,
            pillar: true,
            keywordTarget: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('[Content Engine Article Detail] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}
