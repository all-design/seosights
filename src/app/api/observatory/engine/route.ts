import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/engine
 * Full pipeline: Collect → Detect → Evidence → Confidence → Editorial → Publish
 *
 * Steps:
 * 1. Collect: Gather unprocessed changes
 * 2. Detect: Evaluate changes via LLM to determine signal status
 * 3. Evidence: Check if there's sufficient evidence (enough data points)
 * 4. Confidence: Calculate confidence based on sample size, significance, consistency
 * 5. Editorial: Generate reports for signals that pass the confidence gate
 * 6. Publish: Create BreakingResearch alerts for high-significance changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const forceReprocess = body.forceReprocess === true

    // ─── Step 1: Collect ────────────────────────────────────────────
    const whereClause = forceReprocess
      ? { isSignal: true }
      : { isSignal: false, signalReason: null }

    const unprocessedChanges = await db.observatoryChange.findMany({
      where: whereClause,
      orderBy: { significanceScore: 'desc' },
      take: 50,
    })

    if (unprocessedChanges.length === 0) {
      return NextResponse.json({
        message: 'No changes to evaluate.',
        pipeline: { collect: 0, detect: 0, evidence: 0, confidence: 0, editorial: 0, publish: 0 },
      })
    }

    let detectedSignals = 0
    const evaluatedChanges: Array<{
      id: string
      aiModel: string
      changeType: string
      category: string
      significanceScore: number
      isSignal: boolean
      signalReason: string
      businessImpact: string
      recommendedAction: string
    }> = []

    // ─── Step 2: Detect ─────────────────────────────────────────────
    const BATCH_SIZE = 5
    for (let i = 0; i < unprocessedChanges.length; i += BATCH_SIZE) {
      const batch = unprocessedChanges.slice(i, i + BATCH_SIZE)

      const batchPromises = batch.map(async (change) => {
        try {
          const evaluationPrompt = `You are an AI observability analyst. Evaluate whether this detected change in an AI model's behavior constitutes a meaningful signal that warrants attention.

Change Details:
- AI Model: ${change.aiModel}
- Change Type: ${change.changeType}
- Category: ${change.category}
- Before: ${change.beforeSummary}
- After: ${change.afterSummary}
- Initial Significance Score: ${change.significanceScore}

Evaluate:
1. Is this a real, actionable signal (not noise)?
2. How significant is this on a 0-1 scale?
3. Would a business tracking AI visibility care about this?

Return ONLY valid JSON:
{
  "isSignal": true/false,
  "significanceScore": 0.0-1.0,
  "signalReason": "brief explanation of why this is/isn't a signal",
  "businessImpact": "low" | "medium" | "high",
  "recommendedAction": "what should be done about this, if anything"
}`

          const result = await routeLLM([
              {
                role: 'system',
                content: 'You are an expert AI observability analyst who evaluates changes in AI model behavior. You must return ONLY valid JSON with no extra commentary.',
              },
              { role: 'user', content: evaluationPrompt },
            ],
            { taskType: 'classification' }
          )

          const raw = result.content || ''
          let cleaned = raw.trim()
          const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (jsonMatch) cleaned = jsonMatch[1].trim()
          cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

          const parsed = JSON.parse(cleaned)
          const finalScore = Math.min(1, Math.max(0, Number(parsed.significanceScore) || change.significanceScore))
          const isSignal = parsed.isSignal === true && finalScore > 0.6

          await db.observatoryChange.update({
            where: { id: change.id },
            data: {
              isSignal,
              significanceScore: finalScore,
              signalReason: String(parsed.signalReason || '').slice(0, 500),
              detailsJson: JSON.stringify({
                ...(change.detailsJson ? JSON.parse(change.detailsJson) : {}),
                businessImpact: parsed.businessImpact || 'low',
                recommendedAction: parsed.recommendedAction || '',
                engineEvaluatedAt: new Date().toISOString(),
              }),
            },
          })

          if (isSignal) detectedSignals++

          evaluatedChanges.push({
            id: change.id,
            aiModel: change.aiModel,
            changeType: change.changeType,
            category: change.category,
            significanceScore: finalScore,
            isSignal,
            signalReason: String(parsed.signalReason || ''),
            businessImpact: parsed.businessImpact || 'low',
            recommendedAction: parsed.recommendedAction || '',
          })
        } catch (err) {
          console.error(`[observatory/engine] Evaluation failed for change ${change.id}:`, err)

          // Fall back to simple threshold-based evaluation
          const isSignal = change.significanceScore > 0.6
          await db.observatoryChange.update({
            where: { id: change.id },
            data: {
              isSignal,
              signalReason: isSignal
                ? `Significance score ${change.significanceScore.toFixed(2)} exceeds threshold (0.6)`
                : `Significance score ${change.significanceScore.toFixed(2)} below threshold (0.6) — auto-evaluated`,
            },
          })

          if (isSignal) detectedSignals++

          evaluatedChanges.push({
            id: change.id,
            aiModel: change.aiModel,
            changeType: change.changeType,
            category: change.category,
            significanceScore: change.significanceScore,
            isSignal,
            signalReason: isSignal ? 'Threshold-based detection' : 'Below threshold',
            businessImpact: 'medium',
            recommendedAction: '',
          })
        }
      })

      await Promise.all(batchPromises)
    }

    // ─── Step 3: Evidence ───────────────────────────────────────────
    // Check if there's sufficient evidence for signals
    const signals = evaluatedChanges.filter((c) => c.isSignal)

    // Group signals by model and category for evidence counting
    const evidenceMap = new Map<string, { count: number; changes: typeof signals }>()
    for (const signal of signals) {
      const key = `${signal.aiModel}|${signal.category}`
      const existing = evidenceMap.get(key) || { count: 0, changes: [] }
      existing.count++
      existing.changes.push(signal)
      evidenceMap.set(key, existing)
    }

    // Also count related responses as additional evidence
    let evidencePassCount = 0
    const evidenceResults: Array<{
      key: string
      evidenceCount: number
      sufficient: boolean
    }> = []

    for (const [key, data] of evidenceMap) {
      const [aiModel, category] = key.split('|')

      // Count related responses as additional evidence
      const relatedResponses = await db.observatoryResponse.count({
        where: {
          aiModel,
          promptCategory: category,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      })

      const totalEvidence = data.count + relatedResponses
      const sufficient = totalEvidence >= 10

      if (sufficient) evidencePassCount++

      evidenceResults.push({
        key,
        evidenceCount: totalEvidence,
        sufficient,
      })
    }

    // ─── Step 4: Confidence ─────────────────────────────────────────
    // Calculate confidence based on sample size, significance, and consistency
    const confidenceResults: Array<{
      key: string
      confidence: number
      avgSignificance: number
      evidenceCount: number
      passes: boolean
    }> = []

    let confidencePassCount = 0
    for (const evidence of evidenceResults) {
      const matchingSignals = evidenceMap.get(evidence.key)?.changes || []
      const avgSignificance =
        matchingSignals.length > 0
          ? matchingSignals.reduce((sum, s) => sum + s.significanceScore, 0) / matchingSignals.length
          : 0

      // Calculate consistency: how many signals agree on direction
      const sameDirectionCount = matchingSignals.filter(
        (s) => s.significanceScore > 0.5
      ).length
      const consistency = matchingSignals.length > 0 ? sameDirectionCount / matchingSignals.length : 0

      // Confidence formula: weighted combination
      // - 40% significance score
      // - 30% evidence count (capped at 1.0 for 50+ evidence)
      // - 30% consistency
      const evidenceFactor = Math.min(1, evidence.evidenceCount / 50)
      const confidence = avgSignificance * 0.4 + evidenceFactor * 0.3 + consistency * 0.3

      // Gate: significanceScore > 0.6 AND evidenceCount >= 10 AND confidence >= 0.7
      const passesGate =
        avgSignificance > 0.6 && evidence.evidenceCount >= 10 && confidence >= 0.7

      if (passesGate) confidencePassCount++

      confidenceResults.push({
        key: evidence.key,
        confidence,
        avgSignificance,
        evidenceCount: evidence.evidenceCount,
        passes: passesGate,
      })
    }

    // ─── Step 5: Editorial ──────────────────────────────────────────
    // Generate reports only for signals that pass the confidence gate
    let editorialCount = 0
    const passingKeys = confidenceResults
      .filter((r) => r.passes)
      .map((r) => r.key)

    for (const key of passingKeys) {
      const [aiModel, category] = key.split('|')
      const matchingSignals = evidenceMap.get(key)?.changes || []

      if (matchingSignals.length === 0) continue

      try {
        // Check if a draft report already exists for this model+category combo
        const existingReport = await db.observatoryReport.findFirst({
          where: {
            status: 'draft',
            aiModels: { contains: aiModel },
            categories: { contains: category },
          },
        })

        if (existingReport) continue // Don't duplicate draft reports

        const confidenceData = confidenceResults.find((r) => r.key === key)
        const evidenceData = evidenceResults.find((r) => r.key === key)

        const slug = `${aiModel}-${category}-${new Date().toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')

        await db.observatoryReport.create({
          data: {
            slug,
            title: `${aiModel.charAt(0).toUpperCase() + aiModel.slice(1)} ${category.replace(/_/g, ' ')} — Signal Detected`,
            type: 'research',
            status: 'draft',
            editorialScore: confidenceData?.confidence || 0,
            editorialReason: `Auto-generated: confidence ${(confidenceData?.confidence || 0).toFixed(2)}, evidence ${evidenceData?.evidenceCount || 0} points`,
            aiModels: JSON.stringify([aiModel]),
            categories: JSON.stringify([category]),
            relatedChanges: JSON.stringify(matchingSignals.map((s) => s.id)),
            summary: `Detected ${matchingSignals.length} significant changes in ${aiModel}'s ${category.replace(/_/g, ' ')} behavior with ${(confidenceData?.confidence || 0).toFixed(2)} confidence.`,
            keyFindings: JSON.stringify(
              matchingSignals.slice(0, 5).map((s) => ({
                changeType: s.changeType,
                significance: s.significanceScore,
                reason: s.signalReason,
              }))
            ),
            evidenceScore: Math.min(100, (evidenceData?.evidenceCount || 0) * 2),
            confidenceScore: (confidenceData?.confidence || 0) * 100,
            freshnessScore: 80, // Fresh data from recent crawls
            sampleSize: evidenceData?.evidenceCount || 0,
            researchQualityScore: (confidenceData?.confidence || 0) * 100,
          },
        })

        editorialCount++
      } catch (err) {
        console.error(`[observatory/engine] Editorial step failed for ${key}:`, err)
      }
    }

    // ─── Step 6: Publish — Create BreakingResearch alerts ───────────
    let breakingAlertCount = 0
    const highSignificanceChanges = signals.filter(
      (s) => s.significanceScore >= 0.8 && s.businessImpact === 'high'
    )

    for (const change of highSignificanceChanges) {
      try {
        // Check if a breaking alert already exists for this change
        const existingAlert = await db.breakingResearch.findFirst({
          where: { changeId: change.id },
        })

        if (existingAlert) continue

        const headline = `${change.aiModel.charAt(0).toUpperCase() + change.aiModel.slice(1)}: ${change.changeType.replace(/_/g, ' ')} detected in ${change.category.replace(/_/g, ' ')}`

        // Find the original change record for before/after data
        const originalChange = await db.observatoryChange.findUnique({
          where: { id: change.id },
        })

        await db.breakingResearch.create({
          data: {
            changeId: change.id,
            headline,
            summary: `High-significance ${change.changeType.replace(/_/g, ' ')} in ${change.aiModel} (${change.category.replace(/_/g, ' ')}): significance ${(change.significanceScore * 100).toFixed(0)}%, ${change.signalReason}`,
            aiModel: change.aiModel,
            changeType: change.changeType,
            evidenceCount: evidenceMap.get(`${change.aiModel}|${change.category}`)?.count || 1,
            confidence: change.significanceScore,
            significance: change.significanceScore,
            sourceBefore: originalChange?.beforeSummary || null,
            sourceAfter: originalChange?.afterSummary || null,
            isPublished: false,
          },
        })

        breakingAlertCount++
      } catch (err) {
        console.error(`[observatory/engine] Breaking alert creation failed for change ${change.id}:`, err)
      }
    }

    return NextResponse.json({
      message: `Pipeline complete: ${unprocessedChanges.length} changes processed.`,
      pipeline: {
        collect: unprocessedChanges.length,
        detect: detectedSignals,
        evidence: evidencePassCount,
        confidence: confidencePassCount,
        editorial: editorialCount,
        publish: breakingAlertCount,
      },
      details: {
        evidenceResults,
        confidenceResults,
      },
    })
  } catch (error) {
    console.error('[observatory/engine] POST error:', error)
    return NextResponse.json(
      { error: 'Engine evaluation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/observatory/engine
 * Get current signals summary with confidence gate status.
 */
export async function GET() {
  try {
    const totalChanges = await db.observatoryChange.count()
    const totalSignals = await db.observatoryChange.count({ where: { isSignal: true } })
    const unprocessed = await db.observatoryChange.count({
      where: { isSignal: false, signalReason: null },
    })

    // Signals by AI model
    const signalsByModel = await db.observatoryChange.groupBy({
      by: ['aiModel'],
      where: { isSignal: true },
      _count: { id: true },
      _avg: { significanceScore: true },
    })

    // Signals by change type
    const signalsByType = await db.observatoryChange.groupBy({
      by: ['changeType'],
      where: { isSignal: true },
      _count: { id: true },
    })

    // Signals by category
    const signalsByCategory = await db.observatoryChange.groupBy({
      by: ['category'],
      where: { isSignal: true },
      _count: { id: true },
    })

    // Top signals (highest significance)
    const topSignals = await db.observatoryChange.findMany({
      where: { isSignal: true },
      orderBy: { significanceScore: 'desc' },
      take: 10,
    })

    // Confidence gate stats
    const highConfidenceSignals = await db.observatoryChange.count({
      where: {
        isSignal: true,
        significanceScore: { gte: 0.7 },
      },
    })

    // Breaking research stats
    const breakingAlerts = await db.breakingResearch.count()
    const unpublishedBreaking = await db.breakingResearch.count({
      where: { isPublished: false },
    })

    // Recent citation records count
    const citationCount = await db.citationRecord.count()

    // Source tracking stats
    const trackedSources = await db.sourceTracking.count()
    const risingSources = await db.sourceTracking.count({ where: { trend: 'rising' } })
    const fallingSources = await db.sourceTracking.count({ where: { trend: 'falling' } })

    return NextResponse.json({
      summary: {
        totalChanges,
        totalSignals,
        unprocessed,
        signalRate: totalChanges > 0 ? ((totalSignals / totalChanges) * 100).toFixed(1) + '%' : '0%',
        highConfidenceSignals,
      },
      signalsByModel: signalsByModel.map((s) => ({
        aiModel: s.aiModel,
        count: s._count.id,
        avgSignificance: s._avg.significanceScore?.toFixed(2) || '0.00',
      })),
      signalsByType: signalsByType.map((s) => ({
        changeType: s.changeType,
        count: s._count.id,
      })),
      signalsByCategory: signalsByCategory.map((s) => ({
        category: s.category,
        count: s._count.id,
      })),
      topSignals,
      citationWarehouse: {
        totalCitations: citationCount,
        trackedSources,
        risingSources,
        fallingSources,
      },
      breakingResearch: {
        totalAlerts: breakingAlerts,
        unpublished: unpublishedBreaking,
      },
      pipelineFlow: 'Collect → Detect → Evidence → Confidence → Editorial → Publish',
      confidenceGate: {
        criteria: 'significanceScore > 0.6 AND evidenceCount >= 10 AND confidence >= 0.7',
        description: 'Only signals passing all three criteria proceed to editorial and report generation',
      },
    })
  } catch (error) {
    console.error('[observatory/engine] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signal summary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
