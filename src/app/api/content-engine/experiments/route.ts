/**
 * Content Engine — Experiments
 *
 * GET  /api/content-engine/experiments   — List experiments with variants
 * POST /api/content-engine/experiments   — Create A/B experiment
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateExperimentBody {
  title: string
  hypothesis: string
  metric?: string
  variantA: { articleId: string }
  variantB: { articleId: string }
}

// ── GET: List experiments ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { domain }
    if (status) where.status = status

    const [experiments, total] = await Promise.all([
      db.contentExperiment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          variants: {
            include: {
              article: {
                select: {
                  id: true,
                  title: true,
                  format: true,
                  seoScore: true,
                  aeoScore: true,
                  geoScore: true,
                },
              },
            },
          },
        },
      }),
      db.contentExperiment.count({ where }),
    ])

    return NextResponse.json({ experiments, total })
  } catch (error) {
    console.error('[Content Engine Experiments] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list experiments' },
      { status: 500 }
    )
  }
}

// ── POST: Create A/B experiment ───────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateExperimentBody

    if (!body.title || !body.hypothesis) {
      return NextResponse.json(
        { error: 'title and hypothesis are required' },
        { status: 400 }
      )
    }

    if (!body.variantA?.articleId || !body.variantB?.articleId) {
      return NextResponse.json(
        { error: 'variantA.articleId and variantB.articleId are required' },
        { status: 400 }
      )
    }

    const validMetrics = ['ai_visibility', 'citations', 'organic_clicks', 'engagement']
    if (body.metric && !validMetrics.includes(body.metric)) {
      return NextResponse.json(
        { error: `metric must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify both articles exist
    const [articleA, articleB] = await Promise.all([
      db.contentArticle.findUnique({ where: { id: body.variantA.articleId } }),
      db.contentArticle.findUnique({ where: { id: body.variantB.articleId } }),
    ])

    if (!articleA) {
      return NextResponse.json(
        { error: 'Variant A article not found' },
        { status: 404 }
      )
    }

    if (!articleB) {
      return NextResponse.json(
        { error: 'Variant B article not found' },
        { status: 404 }
      )
    }

    // Create experiment with variants
    const experiment = await db.contentExperiment.create({
      data: {
        domain: DEFAULT_DOMAIN,
        title: body.title,
        hypothesis: body.hypothesis,
        metric: body.metric || 'ai_visibility',
        status: 'running',
        startDate: new Date(),
        variants: {
          create: [
            {
              articleId: body.variantA.articleId,
              label: 'Version A',
              aiVisibilityBefore: articleA.aiVisibilityGain,
              citationsBefore: 0,
            },
            {
              articleId: body.variantB.articleId,
              label: 'Version B',
              aiVisibilityBefore: articleB.aiVisibilityGain,
              citationsBefore: 0,
            },
          ],
        },
      },
      include: {
        variants: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                format: true,
                seoScore: true,
                aeoScore: true,
                geoScore: true,
              },
            },
          },
        },
      },
    })

    // Log the decision
    await db.contentDecisionLog.create({
      data: {
        domain: DEFAULT_DOMAIN,
        decisionType: 'experiment_winner',
        context: JSON.stringify({
          experimentId: experiment.id,
          variantA: body.variantA.articleId,
          variantB: body.variantB.articleId,
          metric: body.metric || 'ai_visibility',
        }),
        decision: `Created A/B experiment: ${body.title}`,
        rationale: body.hypothesis,
        automated: true,
      },
    })

    return NextResponse.json({ experiment }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Experiments] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    )
  }
}
