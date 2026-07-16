/**
 * QA Loop Status — Most Recent QA Run
 *
 * GET endpoint that returns the most recent QARun from the database
 * with all test results stored as JSON in the summary field.
 *
 * Protected by the superadmin secret (same pattern as /api/superadmin/check).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const bearerToken = authHeader.replace('Bearer ', '')
    if (bearerToken === SUPERADMIN_SECRET) return true
  }
  const cookieKey = request.cookies.get('superadmin_key')?.value
  if (cookieKey && cookieKey === SUPERADMIN_SECRET) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const latestRun = await db.qARun.findFirst({
      where: { triggeredBy: 'qa-loop' },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestRun) {
      return NextResponse.json({
        hasRun: false,
        message: 'No QA loop run found. POST to /api/qa-loop/run to start one.',
        lastRun: null,
        results: null,
      })
    }

    // Parse the full test results from the summary JSON field
    let results = null
    if (latestRun.summary) {
      try {
        results = JSON.parse(latestRun.summary)
      } catch {
        results = null
      }
    }

    return NextResponse.json({
      hasRun: true,
      lastRun: {
        id: latestRun.id,
        status: latestRun.status,
        triggeredBy: latestRun.triggeredBy,
        overallScore: latestRun.productScore,
        durationMs: latestRun.durationMs,
        startedAt: latestRun.startedAt,
        completedAt: latestRun.completedAt,
        criticalCount: latestRun.criticalCount,
        majorCount: latestRun.majorCount,
        mediumCount: latestRun.mediumCount,
        minorCount: latestRun.minorCount,
        scores: {
          product: latestRun.productScore,
          ux: latestRun.uxScore,
          engineering: latestRun.engineeringScore,
          research: latestRun.researchScore,
          conversion: latestRun.conversionScore,
          enterprise: latestRun.enterpriseScore,
          security: latestRun.securityScore,
          performance: latestRun.performanceScore,
          seo: latestRun.seoScore,
          accessibility: latestRun.accessibilityScore,
          customerDelight: latestRun.customerDelight,
          technicalDebt: latestRun.technicalDebt,
        },
        metrics: {
          pagesTested: latestRun.pagesTested,
          apisTested: latestRun.apisTested,
          clicksTested: latestRun.clicksTested,
          formsTested: latestRun.formsTested,
        },
      },
      results,
    })
  } catch (err) {
    console.error('[qa-loop/status] Error:', err)
    return NextResponse.json(
      {
        hasRun: false,
        message: 'Failed to fetch QA loop status',
        lastRun: null,
        results: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
