import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/score
 * Get Observatory Score for a specific report.
 *
 * Query params:
 *   reportId - ID of the ObservatoryReport
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const report = await db.observatoryReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({
      reportId: report.id,
      slug: report.slug,
      title: report.title,
      status: report.status,
      observatoryScore: {
        evidenceScore: report.evidenceScore,
        confidenceScore: report.confidenceScore,
        freshnessScore: report.freshnessScore,
        sampleSize: report.sampleSize,
        researchQualityScore: report.researchQualityScore,
        isBreaking: report.isBreaking,
        breakingAlertId: report.breakingAlertId,
      },
      editorialScore: report.editorialScore,
      editorialReason: report.editorialReason,
    })
  } catch (error) {
    console.error('[observatory/score] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Observatory Score', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/observatory/score
 * Calculate and update Observatory Score for a report.
 *
 * Body:
 *   reportId - ID of the ObservatoryReport to score
 *
 * Scoring methodology:
 *   evidenceScore (0-100):
 *     - Based on sample size and data quality
 *     - 0-10 data points → 0-30
 *     - 10-30 data points → 30-60
 *     - 30-50 data points → 60-80
 *     - 50+ data points → 80-100
 *
 *   confidenceScore (0-100):
 *     - Based on consistency and significance
 *     - Weighted avg of: editorialScore * 100 (40%), signal consistency (30%), significance (30%)
 *
 *   freshnessScore (0-100):
 *     - Based on how recent the data is
 *     - Data < 24h old → 90-100
 *     - Data < 7d old → 70-90
 *     - Data < 30d old → 40-70
 *     - Data > 30d old → 0-40
 *
 *   researchQualityScore (0-100):
 *     - Weighted average: evidenceScore * 0.3 + confidenceScore * 0.4 + freshnessScore * 0.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId } = body

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const report = await db.observatoryReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // ─── Calculate Evidence Score ──────────────────────────────────
    // Count data points: related changes + citations + responses
    let sampleSize = 0

    // Count from related changes
    let relatedChangeIds: string[] = []
    if (report.relatedChanges) {
      try {
        relatedChangeIds = JSON.parse(report.relatedChanges)
        sampleSize += relatedChangeIds.length
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Count signals for the relevant models
    let reportModels: string[] = []
    let reportCategories: string[] = []
    try {
      reportModels = report.aiModels ? JSON.parse(report.aiModels) : []
      reportCategories = report.categories ? JSON.parse(report.categories) : []
    } catch {
      // Invalid JSON, ignore
    }

    // Count related responses
    for (const model of reportModels) {
      for (const category of reportCategories) {
        const responseCount = await db.observatoryResponse.count({
          where: {
            aiModel: model,
            promptCategory: category,
          },
        })
        sampleSize += responseCount
      }
    }

    // Count related citations
    for (const model of reportModels) {
      const citationCount = await db.citationRecord.count({
        where: { aiModel: model },
      })
      sampleSize += citationCount
    }

    // Evidence score calculation
    let evidenceScore: number
    if (sampleSize >= 50) {
      evidenceScore = Math.min(100, 80 + (sampleSize - 50) * 0.4)
    } else if (sampleSize >= 30) {
      evidenceScore = 60 + ((sampleSize - 30) / 20) * 20
    } else if (sampleSize >= 10) {
      evidenceScore = 30 + ((sampleSize - 10) / 20) * 30
    } else {
      evidenceScore = (sampleSize / 10) * 30
    }
    evidenceScore = Math.round(Math.min(100, Math.max(0, evidenceScore)))

    // ─── Calculate Confidence Score ────────────────────────────────
    // Based on editorial score, signal consistency, and significance
    const editorialFactor = (report.editorialScore || 0) * 100 * 0.4

    // Signal consistency: how many changes are actual signals
    let signalConsistency = 0.5 // default
    if (relatedChangeIds.length > 0) {
      const signalCount = await db.observatoryChange.count({
        where: {
          id: { in: relatedChangeIds },
          isSignal: true,
        },
      })
      signalConsistency = relatedChangeIds.length > 0 ? signalCount / relatedChangeIds.length : 0
    }
    const consistencyFactor = signalConsistency * 100 * 0.3

    // Significance: average significance of related signals
    let avgSignificance = 0.5 // default
    if (relatedChangeIds.length > 0) {
      const significanceResult = await db.observatoryChange.aggregate({
        where: {
          id: { in: relatedChangeIds },
          isSignal: true,
        },
        _avg: { significanceScore: true },
      })
      avgSignificance = significanceResult._avg.significanceScore || 0
    }
    const significanceFactor = avgSignificance * 100 * 0.3

    const confidenceScore = Math.round(
      Math.min(100, Math.max(0, editorialFactor + consistencyFactor + significanceFactor))
    )

    // ─── Calculate Freshness Score ─────────────────────────────────
    const now = new Date()
    const reportAge = now.getTime() - report.createdAt.getTime()
    const ageInHours = reportAge / (1000 * 60 * 60)

    let freshnessScore: number
    if (ageInHours <= 24) {
      freshnessScore = 90 + (1 - ageInHours / 24) * 10
    } else if (ageInHours <= 168) { // 7 days
      freshnessScore = 70 + (1 - (ageInHours - 24) / 144) * 20
    } else if (ageInHours <= 720) { // 30 days
      freshnessScore = 40 + (1 - (ageInHours - 168) / 552) * 30
    } else {
      freshnessScore = Math.max(0, 40 - ((ageInHours - 720) / 720) * 40)
    }
    freshnessScore = Math.round(Math.min(100, Math.max(0, freshnessScore)))

    // ─── Calculate Research Quality Score ──────────────────────────
    const researchQualityScore = Math.round(
      evidenceScore * 0.3 + confidenceScore * 0.4 + freshnessScore * 0.3
    )

    // ─── Update the report ─────────────────────────────────────────
    await db.observatoryReport.update({
      where: { id: reportId },
      data: {
        evidenceScore,
        confidenceScore,
        freshnessScore,
        sampleSize,
        researchQualityScore,
      },
    })

    return NextResponse.json({
      message: 'Observatory Score calculated and updated.',
      reportId,
      observatoryScore: {
        evidenceScore,
        confidenceScore,
        freshnessScore,
        sampleSize,
        researchQualityScore,
      },
      breakdown: {
        evidence: {
          sampleSize,
          formula: 'sample size tier-based (0-10: 0-30, 10-30: 30-60, 30-50: 60-80, 50+: 80-100)',
        },
        confidence: {
          editorialFactor: editorialFactor.toFixed(1),
          consistencyFactor: consistencyFactor.toFixed(1),
          significanceFactor: significanceFactor.toFixed(1),
          signalConsistency: (signalConsistency * 100).toFixed(1) + '%',
          avgSignificance: (avgSignificance * 100).toFixed(1) + '%',
          formula: 'editorial(40%) + consistency(30%) + significance(30%)',
        },
        freshness: {
          ageInHours: Math.round(ageInHours),
          formula: '<24h: 90-100, <7d: 70-90, <30d: 40-70, >30d: 0-40',
        },
        quality: {
          formula: 'evidence(30%) + confidence(40%) + freshness(30%)',
        },
      },
    })
  } catch (error) {
    console.error('[observatory/score] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate Observatory Score', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
