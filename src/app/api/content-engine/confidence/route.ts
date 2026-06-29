/**
 * AI Confidence Learning™ — Prediction Accuracy Tracking
 *
 * GET  /api/content-engine/confidence          → Confidence analytics
 * POST /api/content-engine/confidence          → Create prediction log
 * PUT  /api/content-engine/confidence          → Measure actual result
 * POST /api/content-engine/confidence?seed=true → Seed demo data
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

const ACTION_TYPES = [
  'created_faq',
  'published_article',
  'created_schema',
  'added_author',
  'added_internal_link',
  'fixed_robots',
  'updated_llms_txt',
  'created_entity',
  'added_citation_source',
] as const

// ── GET: Confidence Analytics ─────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const days = parseInt(searchParams.get('days') || '180', 10)

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch all prediction logs in range
    const allPredictions = await db.predictionLog.findMany({
      where: { domain, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    })

    const measuredPredictions = allPredictions.filter(p => p.actualImpact !== null && p.accuracyScore !== null)

    // ── Overall confidence ────────────────────────────────────────────────
    const recentConfidence = allPredictions
      .filter(p => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return p.createdAt >= thirtyDaysAgo
      })

    const olderConfidence = allPredictions
      .filter(p => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        return p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo
      })

    const avgRecentConfidence = recentConfidence.length > 0
      ? Math.round(recentConfidence.reduce((s, p) => s + p.confidence, 0) / recentConfidence.length)
      : 0

    const avgOlderConfidence = olderConfidence.length > 0
      ? Math.round(olderConfidence.reduce((s, p) => s + p.confidence, 0) / olderConfidence.length)
      : 0

    const overallConfidence = allPredictions.length > 0
      ? Math.round(allPredictions.reduce((s, p) => s + p.confidence, 0) / allPredictions.length)
      : 50

    const confidenceDelta30d = avgRecentConfidence - avgOlderConfidence

    let confidenceTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (confidenceDelta30d > 3) confidenceTrend = 'improving'
    else if (confidenceDelta30d < -3) confidenceTrend = 'declining'

    // ── Average accuracy ──────────────────────────────────────────────────
    const avgAccuracy = measuredPredictions.length > 0
      ? Math.round((measuredPredictions.reduce((s, p) => s + (p.accuracyScore ?? 0), 0) / measuredPredictions.length) * 100) / 100
      : 0

    // ── By action type ────────────────────────────────────────────────────
    const byActionType: Record<string, {
      predicted: number
      actual: number
      accuracy: number
      confidenceDelta: number
      sampleSize: number
    }> = {}

    for (const actionType of ACTION_TYPES) {
      const entries = measuredPredictions.filter(p => p.actionType === actionType)
      if (entries.length === 0) continue

      const avgPredicted = entries.reduce((s, p) => s + p.predictedImpact, 0) / entries.length
      const avgActual = entries.reduce((s, p) => s + (p.actualImpact ?? 0), 0) / entries.length
      const avgAcc = entries.reduce((s, p) => s + (p.accuracyScore ?? 0), 0) / entries.length
      const avgConfDelta = entries.reduce((s, p) => s + (p.confidenceDelta ?? 0), 0) / entries.length

      byActionType[actionType] = {
        predicted: Math.round(avgPredicted * 10) / 10,
        actual: Math.round(avgActual * 10) / 10,
        accuracy: Math.round(avgAcc * 100) / 100,
        confidenceDelta: Math.round(avgConfDelta),
        sampleSize: entries.length,
      }
    }

    // ── Recent corrections (biggest prediction misses) ────────────────────
    const recentCorrections = measuredPredictions
      .filter(p => p.measuredAt)
      .sort((a, b) => {
        const dateA = a.measuredAt ? a.measuredAt.getTime() : 0
        const dateB = b.measuredAt ? b.measuredAt.getTime() : 0
        return dateB - dateA
      })
      .slice(0, 10)
      .map(p => ({
        actionType: p.actionType,
        predicted: p.predictedImpact,
        actual: p.actualImpact ?? 0,
        delta: (p.actualImpact ?? 0) - p.predictedImpact,
        confidenceDelta: p.confidenceDelta ?? 0,
        date: p.measuredAt ? p.measuredAt.toISOString().split('T')[0] : '',
      }))

    // ── Learning curve (monthly) ──────────────────────────────────────────
    const monthMap = new Map<string, { confidences: number[]; accuracies: number[] }>()

    for (const p of allPredictions) {
      const d = new Date(p.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap.has(key)) monthMap.set(key, { confidences: [], accuracies: [] })
      const bucket = monthMap.get(key)!
      bucket.confidences.push(p.confidence)
      if (p.accuracyScore !== null) bucket.accuracies.push(p.accuracyScore)
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const learningCurve = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => {
        const [year, month] = key.split('-')
        return {
          month: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
          avgConfidence: bucket.confidences.length > 0
            ? Math.round(bucket.confidences.reduce((s, c) => s + c, 0) / bucket.confidences.length)
            : 0,
          avgAccuracy: bucket.accuracies.length > 0
            ? Math.round((bucket.accuracies.reduce((s, a) => s + a, 0) / bucket.accuracies.length) * 100) / 100
            : 0,
        }
      })

    return NextResponse.json({
      overallConfidence,
      confidenceTrend,
      confidenceDelta30d,
      totalPredictions: allPredictions.length,
      measuredPredictions: measuredPredictions.length,
      avgAccuracy,
      byActionType,
      recentCorrections,
      learningCurve,
    })
  } catch (error) {
    console.error('[Confidence] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch confidence analytics' },
      { status: 500 }
    )
  }
}

// ── POST: Create Prediction Log ───────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shouldSeed = searchParams.get('seed') === 'true'

    if (shouldSeed) {
      return seedPredictionData()
    }

    const body = await request.json()
    const {
      domain = DEFAULT_DOMAIN,
      actionType,
      predictedImpact,
      confidence = 50,
      recommendation,
      evidenceId,
    } = body

    if (!actionType || predictedImpact === undefined) {
      return NextResponse.json(
        { error: 'actionType and predictedImpact are required' },
        { status: 400 }
      )
    }

    const entry = await db.predictionLog.create({
      data: {
        domain,
        actionType,
        predictedImpact,
        confidence: Math.min(100, Math.max(0, confidence)),
        recommendation,
        evidenceId,
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('[Confidence] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create prediction log' },
      { status: 500 }
    )
  }
}

// ── PUT: Measure Actual Result ────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, actualImpact } = body

    if (!id || actualImpact === undefined) {
      return NextResponse.json(
        { error: 'id and actualImpact are required' },
        { status: 400 }
      )
    }

    const prediction = await db.predictionLog.findUnique({ where: { id } })

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      )
    }

    // Calculate accuracy score: 1 - |predicted - actual| / max(predicted, actual, 1)
    const predicted = prediction.predictedImpact
    const actual = actualImpact
    const accuracyScore = 1 - Math.abs(predicted - actual) / Math.max(predicted, actual, 1)

    // Calculate confidence delta
    let confidenceDelta: number
    if (accuracyScore > 0.7) {
      confidenceDelta = 5
    } else if (accuracyScore > 0.4) {
      confidenceDelta = 0
    } else {
      confidenceDelta = -8
    }

    const confidenceAfter = Math.min(100, Math.max(0, prediction.confidence + confidenceDelta))

    const daysToMeasure = Math.round(
      (new Date().getTime() - prediction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const updated = await db.predictionLog.update({
      where: { id },
      data: {
        actualImpact,
        measuredAt: new Date(),
        daysToMeasure,
        accuracyScore: Math.round(accuracyScore * 1000) / 1000,
        confidenceDelta,
        confidenceAfter,
      },
    })

    return NextResponse.json({ entry: updated })
  } catch (error) {
    console.error('[Confidence] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to measure prediction result' },
      { status: 500 }
    )
  }
}

// ── Seed: Generate realistic prediction data ──────────────────────────────

async function seedPredictionData() {
  const domain = DEFAULT_DOMAIN

  try {
    // Clean up old prediction seed data
    await db.predictionLog.deleteMany({ where: { domain } })
  } catch {
    // Ignore cleanup errors
  }

  const now = new Date()
  const seeds: Array<{
    actionType: string
    predictedImpact: number
    actualImpact: number | null
    confidence: number
    confidenceAfter: number | null
    recommendation: string
    accuracyScore: number | null
    confidenceDelta: number | null
    daysToMeasure: number | null
    createdAt: Date
    measuredAt: Date | null
  }> = []

  // Generate 50 prediction logs over 6 months
  // Learning curve: early = low confidence + low accuracy, recent = higher confidence + higher accuracy
  const totalPredictions = 50

  for (let i = 0; i < totalPredictions; i++) {
    // Distribute across 6 months, slightly more in recent months
    const daysAgo = Math.floor(Math.random() * 180)
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // How old is this prediction? (0 = today, 180 = 6 months ago)
    const ageRatio = daysAgo / 180 // 0 = recent, 1 = oldest

    const actionType = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)]

    // Confidence improves over time: early months 30-55, recent months 65-90
    const baseConfidence = Math.round(30 + (1 - ageRatio) * 55 + (Math.random() - 0.5) * 15)
    const confidence = Math.min(95, Math.max(25, baseConfidence))

    // Predicted impact: ranges from 1 to 10
    const predictedImpact = Math.floor(Math.random() * 9) + 1

    // Early predictions tend to overestimate, recent predictions more accurate
    const overestimateBias = ageRatio * 0.6 * predictedImpact // Older = more overestimate
    const noise = (Math.random() - 0.5) * 4

    let actualImpact: number
    if (ageRatio > 0.6) {
      // Old: significant overestimation
      actualImpact = Math.max(0, Math.round(predictedImpact - overestimateBias + noise))
    } else if (ageRatio > 0.3) {
      // Middle: moderate overestimation, improving
      actualImpact = Math.max(0, Math.round(predictedImpact - overestimateBias * 0.4 + noise))
    } else {
      // Recent: fairly accurate, slight underestimation sometimes
      actualImpact = Math.max(0, Math.round(predictedImpact + noise * 0.7))
    }

    // Determine if this prediction has been "measured" already
    // More recent predictions are less likely to be measured
    const isMeasured = daysAgo > 7 && Math.random() < 0.75

    const recommendation = getRecommendationText(actionType)

    if (isMeasured) {
      const accuracyScore = 1 - Math.abs(predictedImpact - actualImpact) / Math.max(predictedImpact, actualImpact, 1)
      const confDelta = accuracyScore > 0.7 ? 5 : accuracyScore > 0.4 ? 0 : -8
      const confAfter = Math.min(100, Math.max(0, confidence + confDelta))
      const daysToMeasure = Math.floor(Math.random() * 14) + 1

      seeds.push({
        actionType,
        predictedImpact,
        actualImpact,
        confidence,
        confidenceAfter: confAfter,
        recommendation,
        accuracyScore: Math.round(accuracyScore * 1000) / 1000,
        confidenceDelta: confDelta,
        daysToMeasure,
        createdAt,
        measuredAt: new Date(createdAt.getTime() + daysToMeasure * 24 * 60 * 60 * 1000),
      })
    } else {
      seeds.push({
        actionType,
        predictedImpact,
        actualImpact: null,
        confidence,
        confidenceAfter: null,
        recommendation,
        accuracyScore: null,
        confidenceDelta: null,
        daysToMeasure: null,
        createdAt,
        measuredAt: null,
      })
    }
  }

  // Sort by createdAt and insert using createMany for efficiency
  seeds.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const created = await db.predictionLog.createMany({
    data: seeds.map(seed => ({ domain, ...seed })),
  })

  return NextResponse.json({
    seeded: true,
    predictionLogs: created.count,
    message: `Seeded ${created.count} prediction logs over 6 months with learning curve`,
  })
}

function getRecommendationText(actionType: string): string {
  const recommendations: Record<string, string[]> = {
    'created_faq': [
      'Add FAQ to pricing page for AEO visibility',
      'Create FAQ section on homepage for schema markup',
      'Add FAQ to product comparison page',
    ],
    'published_article': [
      'Publish article on AI Visibility trends for SaaS',
      'Write comprehensive guide on entity optimization',
      'Publish comparison article targeting competitor keywords',
    ],
    'created_schema': [
      'Add Article schema to blog posts',
      'Implement FAQPage schema on support pages',
      'Add Organization schema to about page',
    ],
    'added_author': [
      'Create author page for CEO with expertise signals',
      'Add author bio with E-E-A-T signals to articles',
      'Create author entity with Google Knowledge Panel signals',
    ],
    'added_internal_link': [
      'Link from high-authority homepage to new articles',
      'Add contextual links between related topics',
      'Create hub-and-spoke linking structure for pillar content',
    ],
    'fixed_robots': [
      'Fix robots.txt blocking AI crawlers',
      'Remove noindex from key entity pages',
      'Update robots.txt to allow GPTBot and ClaudeBot',
    ],
    'updated_llms_txt': [
      'Update llms.txt with latest articles and entities',
      'Add structured entity descriptions to llms.txt',
      'Include citation sources in llms.txt for AI crawlers',
    ],
    'created_entity': [
      'Create Wikipedia-style entity page for brand',
      'Build Crunchbase-style company profile page',
      'Create standalone entity page for AI Visibility concept',
    ],
    'added_citation_source': [
      'Add citation to authoritative research paper',
      'Reference industry report in key articles',
      'Cite original data source for statistics',
    ],
  }

  const options = recommendations[actionType] || ['Take action on ' + actionType]
  return options[Math.floor(Math.random() * options.length)]
}
