/**
 * Content Engine — Decision Log
 *
 * GET  /api/content-engine/decision-log   — List decision log entries
 * POST /api/content-engine/decision-log   — Create decision log entry
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateDecisionLogBody {
  decisionType: string
  context?: string
  decision: string
  rationale?: string
  impact?: string
  automated?: boolean
  articleId?: string
}

// ── GET: List decision log entries ────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const decisionType = searchParams.get('decisionType') || undefined
    const automated = searchParams.get('automated')
    const articleId = searchParams.get('articleId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { domain }
    if (decisionType) where.decisionType = decisionType
    if (automated !== null && automated !== undefined && automated !== '') {
      where.automated = automated === 'true'
    }
    if (articleId) where.articleId = articleId

    const [entries, total] = await Promise.all([
      db.contentDecisionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.contentDecisionLog.count({ where }),
    ])

    return NextResponse.json({ entries, total })
  } catch (error) {
    console.error('[Content Engine Decision Log] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list decision log entries' },
      { status: 500 }
    )
  }
}

// ── POST: Create decision log entry ───────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateDecisionLogBody

    if (!body.decisionType || !body.decision) {
      return NextResponse.json(
        { error: 'decisionType and decision are required' },
        { status: 400 }
      )
    }

    const validDecisionTypes = [
      'auto_publish',
      'auto_rewrite',
      'experiment_winner',
      'topic_selection',
      'review_override',
      'replay_trigger',
    ]

    if (!validDecisionTypes.includes(body.decisionType)) {
      return NextResponse.json(
        { error: `decisionType must be one of: ${validDecisionTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const entry = await db.contentDecisionLog.create({
      data: {
        domain: DEFAULT_DOMAIN,
        decisionType: body.decisionType,
        context: body.context || null,
        decision: body.decision,
        rationale: body.rationale || null,
        impact: body.impact || null,
        automated: body.automated !== undefined ? body.automated : true,
        articleId: body.articleId || null,
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Decision Log] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create decision log entry' },
      { status: 500 }
    )
  }
}
