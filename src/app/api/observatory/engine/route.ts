import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/engine
 * Evaluate unprocessed changes and determine which are real signals.
 * Uses LLM to score significance and determine signal status.
 */
export async function POST() {
  try {
    // Get all unprocessed changes (isSignal = false, no signalReason)
    const unprocessedChanges = await db.observatoryChange.findMany({
      where: {
        isSignal: false,
        signalReason: null,
      },
      orderBy: { significanceScore: 'desc' },
      take: 20,
    })

    if (unprocessedChanges.length === 0) {
      return NextResponse.json({
        message: 'No unprocessed changes to evaluate.',
        signalsFound: 0,
      })
    }

    const zai = await ZAI.create()
    let signalsFound = 0

    // Process changes in batches
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

          const completion = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are an expert AI observability analyst who evaluates changes in AI model behavior. You must return ONLY valid JSON with no extra commentary.',
              },
              { role: 'user', content: evaluationPrompt },
            ],
            thinking: { type: 'disabled' },
          })

          const raw = completion.choices?.[0]?.message?.content || ''
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

          if (isSignal) signalsFound++
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

          if (isSignal) signalsFound++
        }
      })

      await Promise.all(batchPromises)
    }

    return NextResponse.json({
      evaluated: unprocessedChanges.length,
      signalsFound,
      message: `Evaluated ${unprocessedChanges.length} changes, found ${signalsFound} signals.`,
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
 * Get current signals summary.
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

    return NextResponse.json({
      summary: {
        totalChanges,
        totalSignals,
        unprocessed,
        signalRate: totalChanges > 0 ? (totalSignals / totalChanges * 100).toFixed(1) + '%' : '0%',
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
    })
  } catch (error) {
    console.error('[observatory/engine] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signal summary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
