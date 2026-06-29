import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// ─── Change Types ───────────────────────────────────────────────────
const CHANGE_TYPES = [
  'citation_shift',
  'sentiment_shift',
  'source_shift',
  'ranking_change',
  'new_capability',
  'behavior_change',
] as const

interface ComparisonGroup {
  aiModel: string
  promptCategory: string
  current: { promptText: string; responseText: string }
  previous: { promptText: string; responseText: string } | null
}

/**
 * POST /api/observatory/detect
 * Run detection on the latest crawl vs. the previous one.
 * Uses LLM to intelligently compare responses and detect changes.
 */
export async function POST() {
  try {
    // Get the two most recent completed crawls
    const recentCrawls = await db.observatoryCrawl.findMany({
      where: { status: { in: ['completed', 'partial'] } },
      orderBy: { startedAt: 'desc' },
      take: 2,
      include: { responses: true },
    })

    if (recentCrawls.length === 0) {
      return NextResponse.json({ error: 'No completed crawls found. Run a crawl first.' }, { status: 400 })
    }

    const currentCrawl = recentCrawls[0]
    const previousCrawl = recentCrawls.length > 1 ? recentCrawls[1] : null

    // If no previous crawl, we can only detect "initial" observations
    if (!previousCrawl) {
      return NextResponse.json({
        message: 'Only one crawl exists. Detection requires at least two crawls to compare.',
        changesDetected: 0,
      })
    }

    // Group responses by aiModel + promptCategory
    const currentMap = new Map<string, { promptText: string; responseText: string }>()
    for (const r of currentCrawl.responses) {
      const key = `${r.aiModel}::${r.promptCategory}::${r.promptText}`
      currentMap.set(key, { promptText: r.promptText, responseText: r.responseText })
    }

    const previousMap = new Map<string, { promptText: string; responseText: string }>()
    for (const r of previousCrawl.responses) {
      const key = `${r.aiModel}::${r.promptCategory}::${r.promptText}`
      previousMap.set(key, { promptText: r.promptText, responseText: r.responseText })
    }

    // Build comparison groups
    const comparisons: ComparisonGroup[] = []
    for (const [key, current] of currentMap) {
      const [aiModel, promptCategory] = key.split('::')
      const previous = previousMap.get(key) || null
      if (previous) {
        comparisons.push({ aiModel, promptCategory, current, previous })
      }
    }

    if (comparisons.length === 0) {
      return NextResponse.json({
        message: 'No matching prompt pairs found between the two crawls.',
        changesDetected: 0,
      })
    }

    // Use LLM to compare each pair and detect changes
    const zai = await ZAI.create()
    const detectedChanges: Array<{
      aiModel: string
      changeType: string
      category: string
      beforeSummary: string
      afterSummary: string
      significanceScore: number
      detailsJson: string
    }> = []

    // Process comparisons in batches to avoid overwhelming the LLM
    const BATCH_SIZE = 5
    for (let i = 0; i < comparisons.length; i += BATCH_SIZE) {
      const batch = comparisons.slice(i, i + BATCH_SIZE)

      const batchPromises = batch.map(async (comp) => {
        try {
          const comparisonPrompt = `Compare these two AI model responses and detect any meaningful changes.

AI Model: ${comp.aiModel}
Category: ${comp.promptCategory}
Prompt: "${comp.current.promptText}"

PREVIOUS RESPONSE:
${comp.previous!.responseText.slice(0, 2000)}

CURRENT RESPONSE:
${comp.current.responseText.slice(0, 2000)}

Analyze the differences and return ONLY valid JSON:
{
  "hasChange": true/false,
  "changeType": "citation_shift" | "sentiment_shift" | "source_shift" | "ranking_change" | "new_capability" | "behavior_change",
  "beforeSummary": "brief summary of what was said before",
  "afterSummary": "brief summary of what is said now",
  "significanceScore": 0.0-1.0,
  "details": { "keyDifferences": ["diff1", "diff2"], "notes": "any additional context" }
}

If the responses are essentially the same, set hasChange to false. Only report meaningful changes.`

          const completion = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are an expert at detecting changes in AI model behavior and responses. You must return ONLY valid JSON with no extra commentary.',
              },
              { role: 'user', content: comparisonPrompt },
            ],
            thinking: { type: 'disabled' },
          })

          const raw = completion.choices?.[0]?.message?.content || ''
          // Parse JSON from the response
          let cleaned = raw.trim()
          const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (jsonMatch) cleaned = jsonMatch[1].trim()
          cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

          const parsed = JSON.parse(cleaned)

          if (parsed.hasChange === true) {
            const changeType = CHANGE_TYPES.includes(parsed.changeType)
              ? parsed.changeType
              : 'behavior_change'

            detectedChanges.push({
              aiModel: comp.aiModel,
              changeType,
              category: comp.promptCategory,
              beforeSummary: String(parsed.beforeSummary || '').slice(0, 500),
              afterSummary: String(parsed.afterSummary || '').slice(0, 500),
              significanceScore: Math.min(1, Math.max(0, Number(parsed.significanceScore) || 0)),
              detailsJson: JSON.stringify(parsed.details || {}),
            })
          }
        } catch (err) {
          console.error(`[observatory/detect] Comparison failed for ${comp.aiModel}/${comp.promptCategory}:`, err)
        }
      })

      await Promise.all(batchPromises)
    }

    // Save detected changes to the database
    for (const change of detectedChanges) {
      await db.observatoryChange.create({
        data: {
          crawlId: currentCrawl.id,
          previousCrawlId: previousCrawl.id,
          aiModel: change.aiModel,
          changeType: change.changeType,
          category: change.category,
          beforeSummary: change.beforeSummary,
          afterSummary: change.afterSummary,
          significanceScore: change.significanceScore,
          detailsJson: change.detailsJson,
          isSignal: false,
        },
      })
    }

    return NextResponse.json({
      crawlId: currentCrawl.id,
      previousCrawlId: previousCrawl.id,
      comparisonsAnalyzed: comparisons.length,
      changesDetected: detectedChanges.length,
      changes: detectedChanges.map((c) => ({
        aiModel: c.aiModel,
        changeType: c.changeType,
        category: c.category,
        significanceScore: c.significanceScore,
      })),
    })
  } catch (error) {
    console.error('[observatory/detect] POST error:', error)
    return NextResponse.json(
      { error: 'Detection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/observatory/detect
 * List recent detected changes.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
    const signalsOnly = url.searchParams.get('signals') === 'true'

    const where = signalsOnly ? { isSignal: true } : {}

    const changes = await db.observatoryChange.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const total = await db.observatoryChange.count({ where })
    const signalCount = await db.observatoryChange.count({ where: { isSignal: true } })

    return NextResponse.json({
      changes,
      total,
      signalCount,
    })
  } catch (error) {
    console.error('[observatory/detect] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch changes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
