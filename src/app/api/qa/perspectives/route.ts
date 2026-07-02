/**
 * AI QA Center — Executive Perspectives
 *
 * GET /api/qa/perspectives?role=ceo
 * Returns executive perspectives:
 * - All 9 perspectives for latest run
 * - If query param `role` specified, returns just that role
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_ROLES = [
  'ceo', 'cto', 'cmo', 'ux_lead', 'investor',
  'customer', 'competitor', 'hacker', 'enterprise_buyer',
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    // ── Get latest completed run ─────────────────────────────────────────
    const latestRun = await db.qARun.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: { id: true, productScore: true, completedAt: true },
    })

    if (!latestRun) {
      return NextResponse.json({
        hasData: false,
        message: 'No completed QA runs found.',
      })
    }

    if (role) {
      // ── Specific role perspective ──────────────────────────────────────
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({
          error: `Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}`,
        }, { status: 400 })
      }

      const perspective = await db.qAExecutivePerspective.findUnique({
        where: {
          runId_role: {
            runId: latestRun.id,
            role,
          },
        },
      })

      if (!perspective) {
        return NextResponse.json({
          hasData: false,
          message: `No perspective found for role "${role}" in the latest run.`,
        }, { status: 404 })
      }

      // Get related issues that this role would care about
      const roleToCategory: Record<string, string[]> = {
        ceo: ['functional', 'growth', 'product'],
        cto: ['functional', 'performance', 'security', 'observatory'],
        cmo: ['growth', 'copy', 'seo'],
        ux_lead: ['ux', 'accessibility'],
        investor: ['growth', 'product', 'functional'],
        customer: ['functional', 'ux', 'copy'],
        competitor: ['growth', 'product', 'seo'],
        hacker: ['security'],
        enterprise_buyer: ['security', 'accessibility', 'performance'],
      }

      const relevantCategories = roleToCategory[role] || []
      const criticalIssues = relevantCategories.length > 0
        ? await db.qAIssue.findMany({
            where: {
              runId: latestRun.id,
              category: { in: relevantCategories },
              severity: { in: ['critical', 'major'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              title: true,
              severity: true,
              category: true,
              status: true,
            },
          })
        : []

      return NextResponse.json({
        hasData: true,
        runId: latestRun.id,
        perspective,
        relevantCriticalIssues: criticalIssues,
      })
    }

    // ── All 9 perspectives for latest run ────────────────────────────────
    const perspectives = await db.qAExecutivePerspective.findMany({
      where: { runId: latestRun.id },
      orderBy: { score: 'desc' },
    })

    // Score summary
    const scores = perspectives.map((p) => p.score)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    // Role ranking
    const roleRanking = perspectives.map((p, index) => ({
      role: p.role,
      score: p.score,
      rank: index + 1,
      topConcern: p.topConcern,
      recommendation: p.recommendation,
      confidence: p.confidence,
    }))

    return NextResponse.json({
      hasData: true,
      runId: latestRun.id,
      perspectives,
      summary: {
        total: perspectives.length,
        avgScore,
        highestRole: perspectives[0]?.role || null,
        highestScore: perspectives[0]?.score || 0,
        lowestRole: perspectives[perspectives.length - 1]?.role || null,
        lowestScore: perspectives[perspectives.length - 1]?.score || 0,
      },
      roleRanking,
    })
  } catch (error) {
    console.error('[QA Perspectives] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch perspectives' },
      { status: 500 }
    )
  }
}
