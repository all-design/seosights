import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// ─── AI Model System Prompts ────────────────────────────────────────
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

// ─── Prompt Sets ────────────────────────────────────────────────────
const PROMPT_SETS = [
  { category: 'brand_query', prompt: 'What is SeoSights and what does it do?' },
  { category: 'brand_query', prompt: 'What are the best AI visibility tools for businesses?' },
  { category: 'industry_query', prompt: 'What are the top SEO tools for dentists in 2026?' },
  { category: 'industry_query', prompt: 'What are the best marketing tools for law firms?' },
  { category: 'competitive_query', prompt: 'How does SeoSights compare to Semrush?' },
  { category: 'competitive_query', prompt: 'What is the best alternative to Ahrefs for AI visibility?' },
  { category: 'factual_query', prompt: 'How do AI search engines like ChatGPT and Perplexity choose which sources to cite?' },
  { category: 'factual_query', prompt: 'What is AI visibility and why does it matter for businesses?' },
  { category: 'recommendation_query', prompt: 'Can you recommend a tool to track how often my brand appears in AI search results?' },
  { category: 'recommendation_query', prompt: 'What tools help businesses get cited by AI models like ChatGPT and Claude?' },
]

/**
 * POST /api/observatory/crawl
 * Trigger a crawl session across multiple AI models.
 *
 * Body: { type?: string, limit?: number }
 * - type: crawl type (daily | weekly | monthly | manual), default "manual"
 * - limit: max prompts to send per model (default 3, max 5)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const crawlType = (body as { type?: string }).type || 'manual'
    const limit = Math.min(Math.max((body as { limit?: number }).limit || 3, 1), 5)

    // Create the crawl record
    const crawl = await db.observatoryCrawl.create({
      data: {
        type: crawlType,
        status: 'running',
        modelsQueried: AI_MODEL_CONFIGS.length,
        promptsTotal: AI_MODEL_CONFIGS.length * limit,
        promptsCompleted: 0,
      },
    })

    const startTime = Date.now()
    let promptsCompleted = 0
    const errors: string[] = []

    // Select the first `limit` prompts from the set
    const selectedPrompts = PROMPT_SETS.slice(0, limit)

    // Run all model+prompt combinations
    const promises = AI_MODEL_CONFIGS.flatMap((modelConfig) =>
      selectedPrompts.map(async (promptSet) => {
        const responseStart = Date.now()
        try {
          const result = await routeLLM([
              { role: 'system', content: modelConfig.systemPrompt },
              { role: 'user', content: promptSet.prompt },
            ],
            { taskType: 'chat' }
          )

          const responseText = result.content || ''
          const responseTimeMs = Date.now() - responseStart

          // Extract citations (basic heuristic — look for URLs in the response)
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
          errors.push(`${modelConfig.modelId}/${promptSet.category}: ${errMsg}`)

          // Save a placeholder response with the error
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

    await Promise.all(promises)

    const durationMs = Date.now() - startTime

    // Update crawl record with final stats
    await db.observatoryCrawl.update({
      where: { id: crawl.id },
      data: {
        status: errors.length === 0 ? 'completed' : errors.length < promptsCompleted ? 'partial' : 'failed',
        promptsCompleted,
        durationMs,
        completedAt: new Date(),
        errorLog: errors.length > 0 ? errors.join('\n') : null,
      },
    })

    // Update AI Model Registry lastCrawledAt
    for (const modelConfig of AI_MODEL_CONFIGS) {
      await db.aIModelRegistry.updateMany({
        where: { modelId: modelConfig.modelId },
        data: { lastCrawledAt: new Date() },
      })
    }

    const result = await db.observatoryCrawl.findUnique({
      where: { id: crawl.id },
      include: { responses: true },
    })

    return NextResponse.json({
      crawl: {
        id: crawl.id,
        type: crawlType,
        status: result?.status,
        modelsQueried: result?.modelsQueried,
        promptsTotal: result?.promptsTotal,
        promptsCompleted: result?.promptsCompleted,
        durationMs: result?.durationMs,
        responseCount: result?.responses.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    console.error('[observatory/crawl] POST error:', error)
    return NextResponse.json(
      { error: 'Crawl failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/observatory/crawl
 * List recent crawls with stats.
 */
export async function GET() {
  try {
    const crawls = await db.observatoryCrawl.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        _count: { select: { responses: true, changes: true } },
      },
    })

    const formatted = crawls.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      modelsQueried: c.modelsQueried,
      promptsTotal: c.promptsTotal,
      promptsCompleted: c.promptsCompleted,
      durationMs: c.durationMs,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
      responseCount: c._count.responses,
      changeCount: c._count.changes,
    }))

    return NextResponse.json({ crawls: formatted })
  } catch (error) {
    console.error('[observatory/crawl] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crawls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
