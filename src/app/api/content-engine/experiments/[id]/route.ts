/**
 * Content Engine — Single Experiment
 *
 * GET  /api/content-engine/experiments/[id]   — Get experiment with variants
 * PUT  /api/content-engine/experiments/[id]   — Update experiment (declare winner, etc.)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UpdateExperimentBody {
  status?: string
  winnerVariantId?: string
  results?: string
  endDate?: string
}

// ── GET: Single experiment with variants ──────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const experiment = await db.contentExperiment.findUnique({
      where: { id },
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
                aiVisibilityGain: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ experiment })
  } catch (error) {
    console.error('[Content Engine Experiment Detail] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    )
  }
}

// ── PUT: Update experiment ────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as UpdateExperimentBody

    const existing = await db.contentExperiment.findUnique({
      where: { id },
      include: { variants: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      )
    }

    const validStatuses = ['running', 'completed', 'inconclusive']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.results !== undefined) updateData.results = body.results
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)

    // If declaring a winner
    if (body.winnerVariantId) {
      const winnerVariant = existing.variants.find((v) => v.id === body.winnerVariantId)
      if (!winnerVariant) {
        return NextResponse.json(
          { error: 'Winner variant not found in this experiment' },
          { status: 400 }
        )
      }

      updateData.winnerVariantId = body.winnerVariantId
      updateData.status = 'completed'
      updateData.endDate = new Date()

      // Mark the winning variant
      await db.contentExperimentVariant.update({
        where: { id: body.winnerVariantId },
        data: { isWinner: true },
      })

      // Log the decision
      await db.contentDecisionLog.create({
        data: {
          domain: existing.domain,
          decisionType: 'experiment_winner',
          context: JSON.stringify({
            experimentId: id,
            winnerVariantId: body.winnerVariantId,
            experimentTitle: existing.title,
          }),
          decision: `Declared winner for experiment: ${existing.title}`,
          rationale: `Variant ${winnerVariant.label} outperformed in ${existing.metric}`,
          automated: true,
        },
      })
    }

    const experiment = await db.contentExperiment.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ experiment })
  } catch (error) {
    console.error('[Content Engine Experiment Detail] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    )
  }
}
