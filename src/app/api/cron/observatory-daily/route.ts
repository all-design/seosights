/**
 * Cron API — Observatory Daily Pipeline
 *
 * GET /api/cron/observatory-daily
 *
 * Schedule: Every day at 02:00 UTC
 * Purpose: Daily data collection, detection, engine evaluation, and draft report generation.
 *
 * Pipeline steps:
 * 1. Create a daily ObservatoryCrawl record
 * 2. Query simulated AI models with 5 brand/industry prompts
 * 3. Save responses as ObservatoryResponse records
 * 4. Compare latest two crawls to detect changes (LLM-powered)
 * 5. Evaluate changes for signal significance
 * 6. Generate draft ObservatoryReport records for significant signals
 * 7. Seed GrowthOpportunity records from observatory signals (→ content queue)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'
import { parseLLMJson } from '@/lib/llm-utils'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret → dev/sandbox mode

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  return false
}

// ─── AI Model Configs ──────────────────────────────────────────────
const AI_MODEL_CONFIGS = [
  {
    modelId: 'chatgpt',
    systemPrompt: 'You are ChatGPT, an AI assistant by OpenAI. Respond as ChatGPT would.',
  },
  {
    modelId: 'claude',
    systemPrompt: 'You are Claude, an AI assistant by Anthropic. Respond as Claude would.',
  },
  {
    modelId: 'gemini',
    systemPrompt: 'You are Gemini, an AI assistant by Google. Respond as Gemini would.',
  },
  {
    modelId: 'perplexity',
    systemPrompt: 'You are Perplexity AI, a search-focused AI assistant. Respond as Perplexity would with citations.',
  },
  {
    modelId: 'grok',
    systemPrompt: 'You are Grok, an AI assistant by xAI. Respond as Grok would with a witty tone.',
  },
]

// ─── Daily Prompt Set ──────────────────────────────────────────────
const DAILY_PROMPTS = [
  { category: 'brand_query', prompt: 'What is SeoSights and what does it do?' },
  { category: 'competitive_query', prompt: 'What are the best AI visibility tools?' },
  { category: 'factual_query', prompt: 'How do AI search engines choose which sources to cite?' },
  { category: 'recommendation_query', prompt: 'Can you recommend a tool to track AI visibility?' },
  { category: 'industry_query', prompt: 'What are the top SEO tools for small businesses in 2026?' },
]

// ─── Change Types ──────────────────────────────────────────────────
const CHANGE_TYPES = [
  'citation_shift',
  'sentiment_shift',
  'source_shift',
  'ranking_change',
  'new_capability',
  'behavior_change',
] as const

// parseLLMJson imported from '@/lib/llm-utils' (shared robust JSON extraction)

/**
 * Generate a URL-friendly slug from a title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// ─── GET handler (for easy browser testing) ────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  const pipelineStart = Date.now()
  const summary: {
    crawl: Record<string, unknown> | null
    detection: Record<string, unknown> | null
    engine: Record<string, unknown> | null
    generation: Record<string, unknown> | null
    growthSeeding: Record<string, unknown> | null
    errors: string[]
    totalDurationMs: number
  } = {
    crawl: null,
    detection: null,
    engine: null,
    generation: null,
    growthSeeding: null,
    errors: [],
    totalDurationMs: 0,
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Create daily crawl & query AI models
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-daily] Step 1: Starting daily crawl...')

    const crawl = await db.observatoryCrawl.create({
      data: {
        type: 'daily',
        status: 'running',
        modelsQueried: AI_MODEL_CONFIGS.length,
        promptsTotal: AI_MODEL_CONFIGS.length * DAILY_PROMPTS.length,
        promptsCompleted: 0,
      },
    })

    const crawlStart = Date.now()
    let promptsCompleted = 0
    const crawlErrors: string[] = []

    // Query all model+prompt combinations
    const responsePromises = AI_MODEL_CONFIGS.flatMap((modelConfig) =>
      DAILY_PROMPTS.map(async (promptSet) => {
        const responseStart = Date.now()
        try {
          const llmResult = await routeLLM(
            [
              { role: 'system', content: modelConfig.systemPrompt },
              { role: 'user', content: promptSet.prompt },
            ],
            { taskType: 'chat', temperature: 0.7 }
          )
          const responseText = llmResult.content
          const responseTimeMs = Date.now() - responseStart

          // Extract citations (basic heuristic — look for URLs)
          const urlRegex = /https?:\/\/[^\s)\]"']+/g
          const citations = responseText.match(urlRegex) || []

          await db.observatoryResponse.create({
            data: {
              crawlId: crawl.id,
              aiModel: modelConfig.modelId,
              promptCategory: promptSet.category,
              promptText: promptSet.prompt,
              responseText,
              citationsJson: citations.length > 0 ? JSON.stringify(citations) : null,
              responseTimeMs,
              tokensUsed: responseText.length ? Math.ceil(responseText.length / 4) : null,
            },
          })

          promptsCompleted++
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'
          crawlErrors.push(`${modelConfig.modelId}/${promptSet.category}: ${errMsg}`)

          await db.observatoryResponse.create({
            data: {
              crawlId: crawl.id,
              aiModel: modelConfig.modelId,
              promptCategory: promptSet.category,
              promptText: promptSet.prompt,
              responseText: `[Error: ${errMsg}]`,
              responseTimeMs: Date.now() - responseStart,
            },
          })

          promptsCompleted++
        }
      })
    )

    await Promise.all(responsePromises)

    const crawlDurationMs = Date.now() - crawlStart

    // Update crawl record
    await db.observatoryCrawl.update({
      where: { id: crawl.id },
      data: {
        status:
          crawlErrors.length === 0
            ? 'completed'
            : crawlErrors.length < promptsCompleted
              ? 'partial'
              : 'failed',
        promptsCompleted,
        durationMs: crawlDurationMs,
        completedAt: new Date(),
        errorLog: crawlErrors.length > 0 ? crawlErrors.join('\n') : null,
      },
    })

    // Update AI Model Registry lastCrawledAt
    for (const modelConfig of AI_MODEL_CONFIGS) {
      await db.aIModelRegistry.updateMany({
        where: { modelId: modelConfig.modelId },
        data: { lastCrawledAt: new Date() },
      })
    }

    summary.crawl = {
      id: crawl.id,
      type: 'daily',
      modelsQueried: AI_MODEL_CONFIGS.length,
      promptsTotal: AI_MODEL_CONFIGS.length * DAILY_PROMPTS.length,
      promptsCompleted,
      durationMs: crawlDurationMs,
      errors: crawlErrors.length,
    }

    if (crawlErrors.length > 0) {
      summary.errors.push(`Crawl errors: ${crawlErrors.join('; ')}`)
    }

    console.log(
      `[cron/observatory-daily] Step 1 complete: ${promptsCompleted} prompts, ${crawlErrors.length} errors, ${crawlDurationMs}ms`
    )

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Detection — compare latest two crawls
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-daily] Step 2: Running detection...')

    try {
      // Find the 2 most recent completed crawls (without include — Turso compat)
      const recentCrawls = await db.observatoryCrawl.findMany({
        where: { status: { in: ['completed', 'partial'] } },
        orderBy: { startedAt: 'desc' },
        take: 2,
      })

      if (recentCrawls.length < 2) {
        summary.detection = {
          skipped: true,
          reason: `Only ${recentCrawls.length} completed crawls — need 2 for comparison`,
        }
      } else {
        const currentCrawlId = recentCrawls[0].id
        const previousCrawlId = recentCrawls[1].id

        // Fetch responses separately (Turso doesn't handle large includes well)
        const currentResponses = await db.observatoryResponse.findMany({
          where: { crawlId: currentCrawlId },
        })
        const previousResponses = await db.observatoryResponse.findMany({
          where: { crawlId: previousCrawlId },
        })

        // Build maps for comparison
        const currentMap = new Map<string, { promptText: string; responseText: string }>()
        for (const r of currentResponses) {
          const key = `${r.aiModel}::${r.promptCategory}::${r.promptText}`
          currentMap.set(key, { promptText: r.promptText, responseText: r.responseText })
        }

        const previousMap = new Map<string, { promptText: string; responseText: string }>()
        for (const r of previousResponses) {
          const key = `${r.aiModel}::${r.promptCategory}::${r.promptText}`
          previousMap.set(key, { promptText: r.promptText, responseText: r.responseText })
        }

        // Build comparison pairs
        const comparisons: Array<{
          aiModel: string
          promptCategory: string
          current: { promptText: string; responseText: string }
          previous: { promptText: string; responseText: string }
        }> = []

        for (const [key, current] of currentMap) {
          const [aiModel, promptCategory] = key.split('::')
          const previous = previousMap.get(key)
          if (previous) {
            comparisons.push({ aiModel, promptCategory, current, previous })
          }
        }

        let changesDetected = 0
        const detectErrors: string[] = []

        // Process comparisons — batch of 5 to respect LLM rate limits
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
${comp.previous.responseText.slice(0, 2000)}

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

              const llmResult = await routeLLM(
                [
                  {
                    role: 'system',
                    content:
                      'You are an expert at detecting changes in AI model behavior and responses. You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text. Start with { and end with }.',
                  },
                  { role: 'user', content: comparisonPrompt },
                ],
                { taskType: 'classification', temperature: 0.3, jsonMode: true }
              )
              const raw = llmResult.content
              const parsed = parseLLMJson(raw)

              if (parsed.hasChange === true) {
                const changeType = CHANGE_TYPES.includes(parsed.changeType as typeof CHANGE_TYPES[number])
                  ? (parsed.changeType as string)
                  : 'behavior_change'

                await db.observatoryChange.create({
                  data: {
                    crawlId: currentCrawlId,
                    previousCrawlId: previousCrawlId,
                    aiModel: comp.aiModel,
                    changeType,
                    category: comp.promptCategory,
                    beforeSummary: String(parsed.beforeSummary || '').slice(0, 500),
                    afterSummary: String(parsed.afterSummary || '').slice(0, 500),
                    significanceScore: Math.min(1, Math.max(0, Number(parsed.significanceScore) || 0)),
                    detailsJson: JSON.stringify(parsed.details || {}),
                    isSignal: false,
                  },
                })

                changesDetected++
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : 'Unknown error'
              detectErrors.push(`${comp.aiModel}/${comp.promptCategory}: ${errMsg}`)
            }
          })

          await Promise.all(batchPromises)
        }

        summary.detection = {
          crawlId: currentCrawlId,
          previousCrawlId: previousCrawlId,
          comparisonsAnalyzed: comparisons.length,
          changesDetected,
          errors: detectErrors.length,
        }

        if (detectErrors.length > 0) {
          summary.errors.push(`Detection errors: ${detectErrors.join('; ')}`)
        }

        console.log(
          `[cron/observatory-daily] Step 2 complete: ${comparisons.length} comparisons, ${changesDetected} changes detected`
        )
      }
    } catch (detectError) {
      const msg = detectError instanceof Error ? detectError.message : 'Unknown error'
      summary.errors.push(`Detection step failed: ${msg}`)
      summary.detection = { failed: true, error: msg }
      console.error('[cron/observatory-daily] Step 2 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Engine — evaluate changes for signals
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-daily] Step 3: Running engine evaluation...')

    try {
      const unprocessedChanges = await db.observatoryChange.findMany({
        where: {
          isSignal: false,
          signalReason: null,
        },
        orderBy: { significanceScore: 'desc' },
        take: 10,
      })

      if (unprocessedChanges.length === 0) {
        summary.engine = {
          evaluated: 0,
          signalsFound: 0,
          message: 'No unprocessed changes to evaluate.',
        }
      } else {
        let signalsFound = 0
        const engineErrors: string[] = []

        // Process in batches of 5
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

              const llmResult = await routeLLM(
                [
                  {
                    role: 'system',
                    content:
                      'You are an expert AI observability analyst who evaluates changes in AI model behavior. You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text. Start with { and end with }.',
                  },
                  { role: 'user', content: evaluationPrompt },
                ],
                { taskType: 'scoring', temperature: 0.3, jsonMode: true }
              )
              const raw = llmResult.content
              const parsed = parseLLMJson(raw)
              const finalScore = Math.min(
                1,
                Math.max(0, Number(parsed.significanceScore) || change.significanceScore)
              )
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
              engineErrors.push(`Change ${change.id}: fallback threshold used`)
            }
          })

          await Promise.all(batchPromises)
        }

        summary.engine = {
          evaluated: unprocessedChanges.length,
          signalsFound,
          errors: engineErrors.length,
        }

        if (engineErrors.length > 0) {
          summary.errors.push(`Engine errors: ${engineErrors.join('; ')}`)
        }

        console.log(
          `[cron/observatory-daily] Step 3 complete: ${unprocessedChanges.length} evaluated, ${signalsFound} signals found`
        )
      }
    } catch (engineError) {
      const msg = engineError instanceof Error ? engineError.message : 'Unknown error'
      summary.errors.push(`Engine step failed: ${msg}`)
      summary.engine = { failed: true, error: msg }
      console.error('[cron/observatory-daily] Step 3 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Generate draft reports for new signals
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-daily] Step 4: Generating draft reports...')

    try {
      // Get all signaled changes
      const signals = await db.observatoryChange.findMany({
        where: { isSignal: true },
        orderBy: { significanceScore: 'desc' },
        take: 10,
      })

      if (signals.length === 0) {
        summary.generation = {
          skipped: true,
          reason: 'No signals found — nothing to report',
        }
      } else {
        // Check which signals already have reports
        const existingReports = await db.observatoryReport.findMany({
          select: { relatedChanges: true },
        })
        const reportedChangeIds = new Set<string>()
        for (const report of existingReports) {
          try {
            const ids = JSON.parse(report.relatedChanges || '[]') as string[]
            ids.forEach((id) => reportedChangeIds.add(id))
          } catch {
            // Skip malformed JSON
          }
        }

        const unreportedSignals = signals.filter((s) => !reportedChangeIds.has(s.id))

        if (unreportedSignals.length === 0) {
          summary.generation = {
            skipped: true,
            reason: 'All signals already have reports',
          }
        } else {
          // Build context for LLM
          const signalContext = unreportedSignals
            .map(
              (s, i) =>
                `[Signal ${i + 1}]
AI Model: ${s.aiModel}
Change Type: ${s.changeType}
Category: ${s.category}
Before: ${s.beforeSummary}
After: ${s.afterSummary}
Significance: ${s.significanceScore.toFixed(2)}
Reason: ${s.signalReason || 'N/A'}`
            )
            .join('\n\n')

          const generationPrompt = `Based on these AI observability signals, generate a comprehensive research report.

SIGNALS:
${signalContext}

Generate a research report with the following structure. Return ONLY valid JSON:
{
  "title": "Compelling, SEO-friendly title for this report",
  "type": "research" | "blog" | "industry_update" | "benchmark" | "monthly_report",
  "summary": "2-3 sentence executive summary",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content in markdown format with analysis and insights"
    }
  ],
  "conclusion": "Conclusion and actionable takeaways",
  "aiModels": ["list of AI models mentioned"],
  "categories": ["list of categories mentioned"]
}

The report should be:
- Data-driven and analytical
- Actionable for businesses tracking AI visibility
- Written in a professional but accessible tone
- At least 800 words in total content`

          const llmResult = await routeLLM(
            [
              {
                role: 'system',
                content:
                  'You are an expert research analyst who writes high-quality reports about AI model behavior, visibility, and search trends. You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text. Start with { and end with }.',
              },
              { role: 'user', content: generationPrompt },
            ],
            { taskType: 'long_report', temperature: 0.4, jsonMode: true }
          )
          const raw = llmResult.content
          const parsed = parseLLMJson<{
            title: string
            type: string
            summary: string
            keyFindings: string[]
            sections: Array<{ heading: string; content: string }>
            conclusion: string
            aiModels: string[]
            categories: string[]
          }>(raw)

          // Build markdown content
          const markdownSections = (parsed.sections || [])
            .map((s) => `## ${s.heading}\n\n${s.content}`)
            .join('\n\n')

          const contentMarkdown = `# ${parsed.title}\n\n${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}`
          const wordCount = contentMarkdown.split(/\s+/).length
          const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

          const baseSlug = slugify(String(parsed.title || 'ai-observatory-report'))
          const slug = `${baseSlug}-${Date.now().toString(36)}`

          const report = await db.observatoryReport.create({
            data: {
              slug,
              title: String(parsed.title || 'AI Observatory Report').slice(0, 200),
              type: ['research', 'blog', 'industry_update', 'benchmark', 'monthly_report'].includes(
                parsed.type as string
              )
                ? (parsed.type as string)
                : 'research',
              status: 'proposed',
              editorialScore: 0,
              aiModels: JSON.stringify(parsed.aiModels || []),
              categories: JSON.stringify(parsed.categories || []),
              contentJson: JSON.stringify(parsed),
              contentMarkdown,
              summary: String(parsed.summary || '').slice(0, 1000),
              keyFindings: JSON.stringify(parsed.keyFindings || []),
              relatedChanges: JSON.stringify(unreportedSignals.map((s) => s.id)),
              wordCount,
              readingTimeMin,
            },
          })

          summary.generation = {
            reportId: report.id,
            slug: report.slug,
            title: report.title,
            type: report.type,
            status: report.status,
            wordCount,
            readingTimeMin,
            signalsProcessed: unreportedSignals.length,
          }

          console.log(
            `[cron/observatory-daily] Step 4 complete: Report "${report.title}" (${wordCount} words, ${unreportedSignals.length} signals)`
          )
        }
      }
    } catch (generateError) {
      const msg = generateError instanceof Error ? generateError.message : 'Unknown error'
      summary.errors.push(`Generation step failed: ${msg}`)
      summary.generation = { failed: true, error: msg }
      console.error('[cron/observatory-daily] Step 4 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Seed GrowthOpportunity records from observatory signals
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-daily] Step 5: Seeding growth opportunities from signals...')

    try {
      // Get today's signals that haven't been seeded as growth opportunities yet
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const signals = await db.observatoryChange.findMany({
        where: {
          isSignal: true,
          createdAt: { gte: today },
        },
        orderBy: { significanceScore: 'desc' },
        take: 15,
      })

      if (signals.length === 0) {
        summary.growthSeeding = {
          skipped: true,
          reason: 'No new signals today to seed as growth opportunities',
        }
      } else {
        let opportunitiesSeeded = 0
        const seedingErrors: string[] = []

        for (const signal of signals) {
          try {
            // Check if this signal already has a growth opportunity (avoid duplicates)
            const existing = await db.growthOpportunity.findFirst({
              where: {
                source: 'observatory',
                sourceDetails: { contains: signal.id },
              },
            })

            if (existing) continue // Already seeded

            // Determine content type based on change category
            const typeMap: Record<string, string> = {
              citation_shift: 'blog',
              sentiment_shift: 'research',
              source_shift: 'blog',
              ranking_change: 'research',
              new_capability: 'blog',
              behavior_change: 'research',
            }
            const contentType = typeMap[signal.changeType] || 'research'

            // Build title from signal data
            const titlePrefix = signal.changeType === 'citation_shift'
              ? 'AI Citation Shift'
              : signal.changeType === 'ranking_change'
              ? 'AI Ranking Change'
              : signal.changeType === 'new_capability'
              ? 'New AI Capability'
              : signal.changeType === 'sentiment_shift'
              ? 'AI Sentiment Shift'
              : 'AI Behavior Change'

            const title = `${titlePrefix}: ${signal.aiModel} — ${signal.category}`
            const description = `Observatory signal detected: ${signal.aiModel} changed ${signal.changeType} in ${signal.category}. Before: "${signal.beforeSummary}". After: "${signal.afterSummary}". Significance: ${signal.significanceScore.toFixed(2)}. Reason: ${signal.signalReason || 'N/A'}.`

            // Calculate growth scores
            const seoScore = Math.round(signal.significanceScore * 60 + 20)
            const aiVisibilityScore = Math.round(signal.significanceScore * 80 + 10)
            const businessScore = Math.round(signal.significanceScore * 50 + 25)
            const noveltyScore = Math.round(signal.significanceScore * 70 + 15)
            const competitionScore = 30 // Observatory signals are unique, low competition
            const implementationCost = 25 // Content creation cost
            const expectedROI = Math.round(signal.significanceScore * 70 + 20)
            const growthScore = Math.round(
              seoScore * 0.2 +
              aiVisibilityScore * 0.25 +
              businessScore * 0.2 +
              noveltyScore * 0.1 +
              (100 - competitionScore) * 0.1 +
              expectedROI * 0.15
            )

            const priority = signal.significanceScore > 0.8 ? 'p1'
              : signal.significanceScore > 0.6 ? 'p2'
              : 'p3'

            await db.growthOpportunity.create({
              data: {
                title,
                description,
                type: contentType,
                source: 'observatory',
                sourceDetails: JSON.stringify({
                  engine: 'observatory',
                  signalId: signal.id,
                  changeType: signal.changeType,
                  aiModel: signal.aiModel,
                  category: signal.category,
                  significanceScore: signal.significanceScore,
                  confidence: signal.significanceScore,
                  dataPoints: 1,
                }),
                seoScore,
                aiVisibilityScore,
                businessScore,
                noveltyScore,
                competitionScore,
                implementationCost,
                expectedROI,
                growthScore,
                confidence: signal.significanceScore,
                targetKeywords: JSON.stringify([
                  `${signal.aiModel} ${signal.changeType}`,
                  `${signal.category} AI visibility`,
                  'AI observatory',
                ]),
                targetEntities: JSON.stringify([signal.aiModel, signal.category]),
                relatedExisting: JSON.stringify([]),
                status: 'discovered',
                priority,
                discoveredAt: new Date(),
              },
            })

            opportunitiesSeeded++
          } catch (seedErr) {
            seedingErrors.push(`Signal ${signal.id}: ${seedErr instanceof Error ? seedErr.message : 'Unknown'}`)
          }
        }

        summary.growthSeeding = {
          signalsAnalyzed: signals.length,
          opportunitiesSeeded,
          errors: seedingErrors.length,
        }

        if (seedingErrors.length > 0) {
          summary.errors.push(`Growth seeding errors: ${seedingErrors.join('; ')}`)
        }

        console.log(
          `[cron/observatory-daily] Step 5 complete: ${signals.length} signals → ${opportunitiesSeeded} growth opportunities seeded`
        )
      }
    } catch (seedError) {
      const msg = seedError instanceof Error ? seedError.message : 'Unknown error'
      summary.errors.push(`Growth seeding step failed: ${msg}`)
      summary.growthSeeding = { failed: true, error: msg }
      console.error('[cron/observatory-daily] Step 5 failed:', msg)
    }
  } catch (fatalError) {
    const msg = fatalError instanceof Error ? fatalError.message : 'Unknown error'
    summary.errors.push(`Fatal error: ${msg}`)
    console.error('[cron/observatory-daily] Fatal error:', msg)
  }

  summary.totalDurationMs = Date.now() - pipelineStart

  console.log(
    `[cron/observatory-daily] Pipeline complete in ${summary.totalDurationMs}ms with ${summary.errors.length} errors`
  )

  return NextResponse.json({
    pipeline: 'observatory-daily',
    schedule: 'Every day at 02:00 UTC',
    timestamp: new Date().toISOString(),
    summary,
  })
}
