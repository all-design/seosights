import { NextRequest, NextResponse } from 'next/server'
import { agents, batch1Agents, batch2Agents, type AgentDefinition, type AgentContext } from '@/lib/agents'
import { TokenTracker } from '@/lib/token-tracker'
import { AgentFallback } from '@/lib/agent-fallback'
import { db } from '@/lib/db'
import { sharedContextCache, redisSharedContext } from '@/lib/shared-context'
import { scrapeAndCleanWebsite, getAgentSpecificContext, type ScrapedSharedContext } from '@/lib/scraper'
import {
  createContextWindow,
  validateAgentResponse,
  mergeSubAgentResult,
  buildSubAgentContext,
  buildAgentDispatch,
  assembleFinalReport,
  type ContextWindow,
  type AgentResponse,
  type AnalysisInitPayload,
} from '@/lib/agent-protocol'
import { checkAllLimits, checkAgentAccess, getEnabledAgents, getPlanLimits } from '@/lib/plan-limits'
import { randomUUID } from 'crypto'

export const maxDuration = 180
export const dynamic = 'force-dynamic'

function sendProgress(progress: number, step: string, sessionId?: string): string {
  const payload: Record<string, unknown> = { type: 'progress', progress, step }
  if (sessionId) payload.sessionId = sessionId
  return `data: ${JSON.stringify(payload)}\n\n`
}

function sendComplete(analysis: unknown): string {
  return `data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`
}

function sendError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/**
 * Emit a WebSocket event to the agent-stream service via REST.
 * Non-blocking — failures are logged but don't break the analysis.
 */
async function emitWS(sessionId: string, event: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('http://localhost:3003/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, event, data }),
    })
  } catch (err) {
    // WebSocket emission is best-effort — don't break the analysis
    console.warn(`[analyze] Failed to emit WS event ${event}:`, err instanceof Error ? err.message : 'Unknown')
  }
}

/**
 * Retry wrapper with exponential backoff for 429 errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 3000,
  label: string = 'API'
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const is429 = error instanceof Error && (
        error.message.includes('429') ||
        error.message.includes('Too many requests') ||
        error.message.includes('rate limit')
      )
      const is500 = error instanceof Error && (
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503')
      )

      if ((is429 || is500) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        console.log(`[analyze] ${label} got ${is429 ? '429' : '5xx'}, retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

/**
 * Robust JSON repair for truncated LLM responses.
 */
function repairAndParseJSON(raw: string): Record<string, unknown> {
  // Remove code fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  let jsonStr = fenceMatch ? fenceMatch[1].trim() : raw

  // Find outermost braces
  const braceStart = jsonStr.indexOf('{')
  if (braceStart === -1) throw new Error('No JSON object found')
  const braceEnd = jsonStr.lastIndexOf('}')
  jsonStr = jsonStr.slice(braceStart, braceEnd > braceStart ? braceEnd + 1 : jsonStr.length)

  // Direct parse
  try { return JSON.parse(jsonStr) } catch { /* continue */ }

  // Fix trailing commas
  try { return JSON.parse(jsonStr.replace(/,\s*([}\]])/g, '$1')) } catch { /* continue */ }

  // Advanced repair
  let fixed = jsonStr
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/[\x00-\x1f]/g, (ch) => (ch === '\n' || ch === '\r' || ch === '\t' ? ' ' : ''))

  let inString = false
  let escape = false
  for (let i = 0; i < fixed.length; i++) {
    const ch = fixed[i]
    if (escape) { escape = false; continue }
    if (ch === '\\') { escape = true; continue }
    if (ch === '"') { inString = !inString }
  }
  if (inString) fixed = fixed + '"'

  const openBraces = (fixed.match(/{/g) || []).length
  const closeBraces = (fixed.match(/}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/]/g) || []).length

  fixed += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
  fixed += '}'.repeat(Math.max(0, openBraces - closeBraces))
  fixed = fixed.replace(/,\s*([}\]])/g, '$1')

  try { return JSON.parse(fixed) } catch { /* continue */ }

  // Try truncation repair
  const safeEndPatterns = [
    /\]\s*\}\s*$/, /\}\s*\}\s*$/, /\]\s*$/, /\}\s*$/,
    /"\s*\}\s*$/, /\d+\s*\}\s*$/, /true\s*\}\s*$/,
    /false\s*\}\s*$/, /null\s*\}\s*$/,
  ]
  for (const pattern of safeEndPatterns) {
    const match = fixed.match(pattern)
    if (match && match.index && match.index > fixed.length * 0.5) {
      let truncated = fixed.slice(0, match.index + match[0].length)
      const tOpenB = (truncated.match(/{/g) || []).length
      const tCloseB = (truncated.match(/}/g) || []).length
      const tOpenBr = (truncated.match(/\[/g) || []).length
      const tCloseBr = (truncated.match(/]/g) || []).length
      truncated += ']'.repeat(Math.max(0, tOpenBr - tCloseBr))
      truncated += '}'.repeat(Math.max(0, tOpenB - tCloseB))
      truncated = truncated.replace(/,\s*([}\]])/g, '$1')
      try { return JSON.parse(truncated) } catch { continue }
    }
  }
  throw new Error('Failed to parse AI response as JSON after repair attempts')
}

/**
 * Extract HTML structure (headings, meta tags) for context.
 */
function extractHtmlStructure(html: string): string {
  const headings: string[] = []
  const metas: string[] = []

  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi
  let m
  while ((m = headingRegex.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, '').trim()
    if (text) headings.push(`H${m[1]}: ${text.slice(0, 80)}`)
  }

  const metaRegex = /<meta\s+([^>]*?)>/gi
  while ((m = metaRegex.exec(html)) !== null) {
    const attrs = m[1]
    const nameMatch = attrs.match(/name=["']([^"']+)["']/i)
    const contentMatch = attrs.match(/content=["']([^"']+)["']/i)
    if (nameMatch && contentMatch) {
      metas.push(`${nameMatch[1]}: ${contentMatch[1].slice(0, 80)}`)
    }
  }

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  if (titleMatch) metas.push(`title: ${titleMatch[1].slice(0, 80)}`)

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  if (canonicalMatch) metas.push(`canonical: ${canonicalMatch[1]}`)

  let result = ''
  if (headings.length > 0) result += 'Headings: ' + headings.slice(0, 8).join('; ') + '\n'
  if (metas.length > 0) result += 'Meta: ' + metas.slice(0, 6).join('; ')
  return result || 'No structure data available'
}

/**
 * Deep merge helper for combining agent results.
 * Merges nested objects, concatenates arrays.
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (key in result) {
      const targetVal = result[key]
      const sourceVal = source[key]
      if (
        targetVal && sourceVal &&
        typeof targetVal === 'object' && typeof sourceVal === 'object' &&
        !Array.isArray(targetVal) && !Array.isArray(sourceVal)
      ) {
        result[key] = deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>
        )
      } else if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
        // For arrays from different agents, concatenate (e.g., deepStrategy fields)
        result[key] = [...targetVal, ...sourceVal]
      } else {
        // Source overwrites target for primitive values
        result[key] = sourceVal
      }
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Run a single agent and return its parsed JSON result.
 * Also tracks token usage via tokenTracker.
 */
async function runAgent(
  zai: { chat: { completions: { create: (opts: unknown) => Promise<unknown> } } },
  agent: AgentDefinition,
  context: AgentContext,
  progress: number,
  sendProgressFn: (progress: number, step: string) => void,
  flushFn: () => Promise<void>,
  tokenTracker: TokenTracker,
  analysisId: string,
): Promise<{ data: Record<string, unknown>; progress: number }> {
  const progressLabel = `Running ${agent.name}...`
  sendProgressFn(progress, progressLabel)
  await flushFn()

  console.log(`[analyze] Starting ${agent.name} (batch ${agent.batch})`)

  const startedAt = new Date()
  const systemPrompt = agent.systemPrompt
  const userPrompt = agent.buildUserPrompt(context)
  const inputTokens = tokenTracker.estimateTokens(systemPrompt + userPrompt)

  // ── Fallback-aware LLM call ──────────────────────────────────────────────
  // The AgentFallback system tries the primary model first, then falls back
  // through the configured model chain on 429/5xx/timeout errors.
  // Since z-ai-web-dev-sdk handles model routing internally, the fallback
  // currently retries the same SDK call but logs which model was attempted,
  // providing infrastructure for when multi-model support is added.

  const fallback = new AgentFallback('default')

  const fallbackResult = await fallback.executeWithFallback(
    // Primary: standard LLM call with retry + JSON mode enforcement
    // Structured Outputs: "response_format": { "type": "json_object" }
    () => retryWithBackoff(
      () => zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
      3,
      4000,
      `LLM_${agent.id}`
    ) as Promise<Record<string, unknown>>,
    // Fallback: same SDK call (SDK handles model routing internally)
    (model: string) => retryWithBackoff(
      () => zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
      2, // fewer retries for fallback to avoid long waits
      3000,
      `LLM_${agent.id}_fallback_${model}`
    ) as Promise<Record<string, unknown>>,
    3,    // max attempts across primary + fallbacks
    2000  // base delay between fallback attempts
  )

  const llmFailed = !fallbackResult.success
  const usedModel = fallbackResult.model
  const usedFallback = fallbackResult.usedFallback

  // Log fallback usage for the Superadmin panel
  if (usedFallback && fallbackResult.success) {
    console.log(
      `[analyze] ${agent.name} used FALLBACK model "${usedModel}" (attempt ${fallbackResult.attempt}) — primary model failed`
    )
  }

  // Extract the LLM response from the fallback result
  const llmResponse = fallbackResult.data as { choices?: Array<{ message?: { content?: string } }> } | null
  const raw = llmResponse?.choices?.[0]?.message?.content || ''
  const outputTokens = raw.length > 0 ? tokenTracker.estimateTokens(raw) : 0

  // Track token usage for this agent's LLM call
  if (!llmFailed && outputTokens > 0) {
    tokenTracker.track({
      agentId: agent.id,
      agentName: agent.name,
      model: usedModel,
      inputTokens,
      outputTokens,
    })
  }

  // Track failure if LLM call failed
  if (llmFailed) {
    tokenTracker.trackFailure(agent.id, agent.name, usedModel)
  }

  console.log(`[analyze] ${agent.name} response length:`, raw.length, `(~${inputTokens} in / ${outputTokens} out tokens)`, usedFallback ? `[FALLBACK: ${usedModel}]` : '')

  // Build a summary of fallback attempts for AgentLog
  const fallbackSummary = fallbackResult.logs.length > 1
    ? ` | Fallback attempts: ${fallbackResult.logs.map(l => `${l.model}(${l.success ? 'ok' : 'fail'})`).join('\u2192')}`
    : ''

  if (!raw) {
    console.warn(`[analyze] ${agent.name} returned empty response`)

    // Create AgentLog entry for failed/empty agent
    try {
      await db.agentLog.create({
        data: {
          analysisId,
          agentId: agent.id,
          agentName: agent.name,
          action: agent.role.split(':')[0] || 'Analyzing...',
          status: llmFailed ? 'failed' : 'completed',
          tokensUsed: inputTokens + outputTokens,
          costUsd: tokenTracker.calculateCost({ agentId: agent.id, agentName: agent.name, model: usedModel, inputTokens, outputTokens }),
          model: usedModel,
          error: (llmFailed ? `LLM call failed after retries (${fallback.getAttemptSummary()})` : 'Empty response from LLM') + fallbackSummary,
          startedAt,
          completedAt: new Date(),
        }
      })
    } catch (logError) {
      console.error('[analyze] Failed to create AgentLog:', logError instanceof Error ? logError.message : 'Unknown')
    }

    return { data: {}, progress }
  }

  let parsed: Record<string, unknown> = {}
  try {
    parsed = repairAndParseJSON(raw)
    console.log(`[analyze] ${agent.name} parsed successfully, keys:`, Object.keys(parsed).join(', '))
  } catch (e) {
    console.error(`[analyze] ${agent.name} JSON parse failed:`, e instanceof Error ? e.message : 'Unknown error')

    // Create AgentLog entry for parse failure
    try {
      await db.agentLog.create({
        data: {
          analysisId,
          agentId: agent.id,
          agentName: agent.name,
          action: agent.role.split(':')[0] || 'Analyzing...',
          status: 'failed',
          tokensUsed: inputTokens + outputTokens,
          costUsd: tokenTracker.calculateCost({ agentId: agent.id, agentName: agent.name, model: usedModel, inputTokens, outputTokens }),
          model: usedModel,
          error: `JSON parse failed: ${e instanceof Error ? e.message : 'Unknown error'}${fallbackSummary}`,
          startedAt,
          completedAt: new Date(),
        }
      })
    } catch (logError) {
      console.error('[analyze] Failed to create AgentLog:', logError instanceof Error ? logError.message : 'Unknown')
    }

    return { data: {}, progress }
  }

  // Create AgentLog entry for successful agent run
  try {
    await db.agentLog.create({
      data: {
        analysisId,
        agentId: agent.id,
        agentName: agent.name,
        action: agent.role.split(':')[0] || 'Analyzing...',
        status: 'completed',
        tokensUsed: inputTokens + outputTokens,
        costUsd: tokenTracker.calculateCost({ agentId: agent.id, agentName: agent.name, model: usedModel, inputTokens, outputTokens }),
        model: usedModel,
        result: JSON.stringify(parsed).slice(0, 10000), // Truncate to avoid DB bloat
        startedAt,
        completedAt: new Date(),
      }
    })
  } catch (logError) {
    console.error('[analyze] Failed to create AgentLog:', logError instanceof Error ? logError.message : 'Unknown')
  }

  return { data: parsed, progress }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, market, execution_mode } = body

    // ── Step 1: Validate input using AnalysisInitPayload ──────────────
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const targetMarket = market || 'Global'
    const executionMode = execution_mode === 'auto-pilot' ? 'auto-pilot' as const : 'co-pilot' as const
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')

    // ── Rate Limiting: Check plan limits before consuming any LLM tokens ──
    const userId = body.userId as string | undefined

    if (userId) {
      console.log(`[analyze] Checking rate limits for user: ${userId}`)
      const limitCheck = await checkAllLimits(userId)

      if (!limitCheck.allowed) {
        console.warn(`[analyze] Rate limit blocked for user ${userId}: ${limitCheck.reason}`)

        // Emit a WebSocket event about the limit hit
        emitWS('system', 'rate_limit:blocked', {
          userId,
          reason: limitCheck.reason,
          checks: {
            auditLimit: limitCheck.checks.auditLimit,
            costCap: {
              withinCap: limitCheck.checks.costCap.withinCap,
              currentSpend: limitCheck.checks.costCap.currentMonthlySpend,
              cap: limitCheck.checks.costCap.monthlyCap,
              usagePercent: limitCheck.checks.costCap.usagePercent,
            },
          },
        })

        return NextResponse.json({
          error: limitCheck.reason,
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            auditLimit: {
              used: limitCheck.checks.auditLimit.currentUsage,
              limit: limitCheck.checks.auditLimit.limit,
            },
            costCap: {
              used: limitCheck.checks.costCap.currentMonthlySpend,
              cap: limitCheck.checks.costCap.monthlyCap,
              percentUsed: Math.round(limitCheck.checks.costCap.usagePercent),
            },
            tier: limitCheck.checks.costCap.tier,
          },
        }, { status: 403 })
      }

      console.log(`[analyze] Rate limits OK for user ${userId} — tier: ${limitCheck.checks.costCap.tier}, audits: ${limitCheck.checks.auditLimit.currentUsage}/${limitCheck.checks.auditLimit.limit}, spend: $${limitCheck.checks.costCap.currentMonthlySpend.toFixed(2)}/$${limitCheck.checks.costCap.monthlyCap}`)
    }

    // Generate a unique session ID for this analysis run
    const analysisSessionId = randomUUID()

    // Create an Analysis record in the database
    let analysisId = analysisSessionId
    try {
      const analysisRecord = await db.analysis.create({
        data: {
          url,
          domain,
          market: targetMarket,
          status: 'running',
          mode: executionMode,
          userId: userId || null,
        }
      })
      analysisId = analysisRecord.id
    } catch (dbError) {
      console.error('[analyze] Failed to create Analysis record:', dbError instanceof Error ? dbError.message : 'Unknown')
      // Continue with the session ID as fallback
    }

    async function* generateEvents(): AsyncGenerator<string> {
      try {
        const { getZAI } = await import('@/lib/zai')
        const zai = await getZAI()

        // Create the token tracker for this analysis session
        const tokenTracker = new TokenTracker(analysisSessionId, {
          userId: userId,
          analysisId: analysisId,
        })

        // Emit analysis:start via WebSocket
        emitWS(analysisSessionId, 'analysis:start', { sessionId: analysisSessionId, url, market: targetMarket })

        // ════════════════════════════════════════════════════════════════
        // Phase 1: "Scrape Once, Read Many" — Data Gathering
        //
        // Master Director scrapes the site ONCE and caches the structured
        // result in Redis. All 7 sub-agents then read from this shared cache,
        // each receiving only the context section they need (up to 70% token
        // reduction vs. sending full context to every agent).
        // ════════════════════════════════════════════════════════════════

        const cacheProjectId = `${domain}:${targetMarket}`

        // Try Redis shared context first (cross-process, 1-hour TTL)
        let scrapedContext: ScrapedSharedContext | null = await redisSharedContext.getScrapedContext(cacheProjectId)

        // Also check legacy in-memory cache for backward compat
        if (!scrapedContext) {
          const cachedLegacy = sharedContextCache.get(url, targetMarket)
          if (cachedLegacy) {
            scrapedContext = {
              meta_data: { title: cachedLegacy.siteData.title, description: '', robots_txt: cachedLegacy.robotsTxt, llms_txt_exists: cachedLegacy.llmsTxtExists, url: cachedLegacy.url, domain: cachedLegacy.domain },
              raw_text_content: cachedLegacy.siteData.text,
              structured_elements: { headings: {}, links: [], schema_markup: { has_faq: false, has_organization: false, has_article: false, has_product: false, has_local_business: false, detected_types: [] } },
              search_context: { competitor_results: cachedLegacy.searchResults, ai_citation_results: cachedLegacy.aiSearchResults, local_seo_results: cachedLegacy.localSearchResults },
              html_structure: cachedLegacy.htmlStructure,
              scraped_at: cachedLegacy.createdAt,
            }
          }
        }

        let siteData: { title?: string; html?: string; url?: string; text?: string }
        let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
        let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
        let localSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
        let htmlStructure: string

        if (scrapedContext) {
          // ── Cache HIT: Skip scraping entirely ──
          console.log(`[analyze] Cache HIT for ${cacheProjectId} — skipping scrape (age: ${Math.round((Date.now() - scrapedContext.scraped_at) / 1000)}s)`)
          yield sendProgress(5, 'Using cached scan data (Redis shared context)...', analysisSessionId)
          await flush()

          siteData = { title: scrapedContext.meta_data.title, html: '', url: scrapedContext.meta_data.url, text: scrapedContext.raw_text_content }
          searchResults = scrapedContext.search_context.competitor_results
          aiSearchResults = scrapedContext.search_context.ai_citation_results
          localSearchResults = scrapedContext.search_context.local_seo_results
          htmlStructure = scrapedContext.html_structure

          yield sendProgress(35, 'Cached data loaded. Proceeding to agent analysis...', analysisSessionId)
          await flush()
        } else {
          // ── Cache MISS: Scrape Once using the new scraper ──
          console.log(`[analyze] Cache MISS for ${cacheProjectId} — running scrapeAndCleanWebsite()`)
          yield sendProgress(5, 'Scanning website (Scrape Once, Read Many)...', analysisSessionId)
          await flush()

          scrapedContext = await scrapeAndCleanWebsite(url, zai, {
            includeSearchData: true,
            targetMarket,
          })

          // Cache in Redis (1-hour TTL) for future requests
          await redisSharedContext.setScrapedContext(cacheProjectId, scrapedContext)
          console.log(`[analyze] Context cached in Redis for 1 hour (key: ${cacheProjectId})`)

          siteData = { title: scrapedContext.meta_data.title, html: '', url: scrapedContext.meta_data.url, text: scrapedContext.raw_text_content }
          searchResults = scrapedContext.search_context.competitor_results
          aiSearchResults = scrapedContext.search_context.ai_citation_results
          localSearchResults = scrapedContext.search_context.local_seo_results
          htmlStructure = scrapedContext.html_structure

          // Also write to legacy in-memory cache for backward compat
          sharedContextCache.set(url, targetMarket, {
            url, domain, siteData: { title: scrapedContext.meta_data.title, html: '', text: scrapedContext.raw_text_content },
            robotsTxt: scrapedContext.meta_data.robots_txt, llmsTxtExists: scrapedContext.meta_data.llms_txt_exists, blockedBots: [], allowedBots: [],
            searchResults, aiSearchResults, localSearchResults,
            htmlStructure: scrapedContext.html_structure,
            createdAt: Date.now(),
          })
        }

        // Store the full scraped context for agent-specific context injection
        const sharedScrapedContext = scrapedContext

        // ════════════════════════════════════════════════════════════════
        // Phase 2: Hub-and-Spoke Agent Protocol
        //
        // 1. Create ContextWindow
        // 2. Master Director runs first → result merged into ContextWindow
        // 3. Sub-agents run in parallel batches, each receiving context
        // 4. After each sub-agent: validate response, retry once if invalid
        // 5. Merge validated results into ContextWindow
        // 6. Master Director runs final synthesis pass
        // ════════════════════════════════════════════════════════════════

        // Build context for agents
        const siteContent = siteData.text?.slice(0, 2500) || 'No content available'
        htmlStructure = htmlStructure || scrapedContext?.html_structure || (siteData.html ? extractHtmlStructure(siteData.html) : '')

        const competitorInfo = searchResults
          .slice(0, 3)
          .map((r) => `${r.name} (${r.host_name}): ${(r.snippet || '').slice(0, 80)}`)
          .join(' | ')

        const aiInfo = aiSearchResults
          .slice(0, 2)
          .map((r) => `${r.name}: ${(r.snippet || '').slice(0, 60)}`)
          .join(' | ')

        const localInfo = localSearchResults
          .slice(0, 2)
          .map((r) => `${r.name}: ${(r.snippet || '').slice(0, 60)}`)
          .join(' | ')

        const agentContext: AgentContext = {
          url,
          domain,
          siteName: siteData.title || url,
          siteContent,
          htmlStructure,
          competitorInfo,
          aiInfo,
          localInfo,
          targetMarket,
        }

        // ── Step 1: Create ContextWindow ──────────────────────────────────────
        const contextWindow = createContextWindow({
          url,
          domain,
          market: targetMarket,
          siteName: siteData.title || url,
          scanData: {
            siteContent: siteContent.slice(0, 1500),
            htmlStructure: htmlStructure.slice(0, 500),
            competitorInfo: competitorInfo.slice(0, 400),
            aiInfo: aiInfo.slice(0, 300),
            localInfo: localInfo.slice(0, 300),
          },
          sessionId: analysisSessionId,
          executionMode,
        })

        // Progress allocation:
        // Phase 1 used 5-35% → Phase 2 starts at 38%
        // Master Director: 38-42%
        // Batch 1 (3 sub-agents): 42-58%
        // Batch 2 (4 sub-agents): 60-78%
        // Master Director synthesis: 78-82%
        // Phase 3: 82-100%

        const allAgentResults: Record<string, unknown>[] = []

        // ── Step 2: Master Director runs first ────────────────────────────────
        yield sendProgress(38, 'Master Director: Analyzing raw data & creating plan...')
        await flush()

        emitWS(analysisSessionId, 'agent:start', {
          sessionId: analysisSessionId,
          agentId: 'master-director',
          agentName: 'Master Director',
          action: 'Strategy lead',
        })

        const mdResult = await runAgent(zai, agents[0], agentContext, 39, (p, s) => {
          emitWS(analysisSessionId, 'agent:progress', { sessionId: analysisSessionId, agentId: 'master-director', progress: p, message: s })
        }, flush, tokenTracker, analysisId)

        if (Object.keys(mdResult.data).length > 0) {
          allAgentResults.push(mdResult.data)
          // Merge Master Director result into ContextWindow so sub-agents can access it
          const mdValidated = validateAgentResponse(mdResult.data)
          if (mdValidated.valid && mdValidated.response) {
            mergeSubAgentResult(contextWindow, mdValidated.response)
            console.log('[analyze] Master Director result merged into ContextWindow')
          }
          emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: 'master-director', result: 'Complete' })
        } else {
          emitWS(analysisSessionId, 'agent:error', { sessionId: analysisSessionId, agentId: 'master-director', error: 'Empty response from LLM' })
          console.warn('[analyze] Master Director returned empty response — sub-agents will proceed without director context')
        }

        yield sendProgress(42, 'Master Director complete. Launching sub-agents...')
        await flush()

        // ── Step 3: Run sub-agents in parallel batches with validation ────────

        /**
         * Run a sub-agent with protocol validation and one retry on failure.
         * Returns the validated data (empty object if both attempts fail).
         */
        async function runSubAgentWithProtocol(
          agent: AgentDefinition,
          progress: number,
        ): Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }> {
          // Build enhanced context from the ContextWindow for this specific agent
          const protocolContext = buildSubAgentContext(agent.id, contextWindow)

          // Build the Step 2 dispatch context (task_scope) for this agent
          const dispatch = buildAgentDispatch(agent.id, analysisSessionId, contextWindow, agent.taskScope)
          const dispatchContext = `\n\nDISPATCH (Step 2):\n${JSON.stringify(dispatch, null, 2)}`

          // ── "Read Many" — Inject agent-specific context from shared cache ──
          // Each agent gets only the sections it needs (up to 70% token reduction)
          let agentSpecificContextStr = ''
          if (sharedScrapedContext) {
            const agentSpecific = getAgentSpecificContext(sharedScrapedContext, agent.id)
            agentSpecificContextStr = `\n\nSHARED CONTEXT (filtered for ${agent.name}):\n${JSON.stringify(agentSpecific, null, 2)}`
          }

          // Create enhanced agent context that includes protocol context + dispatch
          const enhancedContext: AgentContext = {
            ...agentContext,
            siteContent: agentContext.siteContent + '\n\n' + protocolContext + dispatchContext + agentSpecificContextStr,
          }

          // First attempt
          emitWS(analysisSessionId, 'agent:start', {
            sessionId: analysisSessionId,
            agentId: agent.id,
            agentName: agent.name,
            action: agent.role.split(':')[0] || 'Analyzing...',
          })

          let result = await runAgent(zai, agent, enhancedContext, progress, (p, s) => {
            emitWS(analysisSessionId, 'agent:progress', { sessionId: analysisSessionId, agentId: agent.id, progress: p, message: s })
          }, flush, tokenTracker, analysisId)

          // Validate the response using the agent protocol
          const validation = validateAgentResponse(result.data)

          if (validation.valid && validation.response) {
            // Valid response — merge into ContextWindow
            mergeSubAgentResult(contextWindow, validation.response)

            // Also include the raw data for backward compatibility
            const protocolData = result.data
            // If the response was wrapped in protocol format, extract the data field
            if (validation.response.data && Object.keys(validation.response.data).length > 0) {
              // Merge the agent-specific data (not protocol metadata) into results
              const agentData = validation.response.data as Record<string, unknown>
              return { data: agentData, validated: true, retried: false }
            }

            emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: agent.id, result: 'Complete (validated)' })
            return { data: protocolData, validated: true, retried: false }
          }

          // Validation failed — retry once
          console.warn(`[analyze] ${agent.name} response failed validation: ${validation.error}. Retrying...`)

          emitWS(analysisSessionId, 'agent:progress', {
            sessionId: analysisSessionId,
            agentId: agent.id,
            progress,
            message: `${agent.name} validation failed — retrying...`,
          })

          // Wait a moment before retry
          await new Promise(r => setTimeout(r, 2000))

          result = await runAgent(zai, agent, enhancedContext, progress, (p, s) => {
            emitWS(analysisSessionId, 'agent:progress', { sessionId: analysisSessionId, agentId: agent.id, progress: p, message: s })
          }, flush, tokenTracker, analysisId)

          const retryValidation = validateAgentResponse(result.data)

          if (retryValidation.valid && retryValidation.response) {
            // Retry succeeded — merge into ContextWindow
            mergeSubAgentResult(contextWindow, retryValidation.response)

            const protocolData = result.data
            if (retryValidation.response.data && Object.keys(retryValidation.response.data).length > 0) {
              const agentData = retryValidation.response.data as Record<string, unknown>
              return { data: agentData, validated: true, retried: true }
            }

            emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: agent.id, result: 'Complete (retry validated)' })
            return { data: protocolData, validated: true, retried: true }
          }

          // Both attempts failed validation — use raw data as fallback (lenient)
          console.warn(`[analyze] ${agent.name} retry also failed validation. Using raw data as fallback.`)

          if (Object.keys(result.data).length > 0) {
            // Even though validation failed, we still have parseable data — use it
            // This is the lenient path that preserves backward compatibility
            emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: agent.id, result: 'Complete (unvalidated fallback)' })
            return { data: result.data, validated: false, retried: true }
          }

          emitWS(analysisSessionId, 'agent:error', { sessionId: analysisSessionId, agentId: agent.id, error: 'Validation failed after retry' })
          return { data: {}, validated: false, retried: true }
        }

        // ── Batch 1: Keyword Researcher, Competitor Analyst, Content Architect ──
        // Kill-Switch: Check monthly cost cap before launching agents
        if (userId) {
          const { checkMonthlyCostCap } = await import('@/lib/plan-limits')
          const costCheck = await checkMonthlyCostCap(userId)
          if (!costCheck.withinCap) {
            console.warn(`[analyze] Kill-switch triggered for user ${userId}: $${costCheck.currentMonthlySpend.toFixed(2)} / $${costCheck.monthlyCap}`)
            yield sendError(`You've reached your processing limit ($${costCheck.monthlyCap.toFixed(2)}) for this month. Upgrade to Pro for unlimited execution.`)
            return
          }
        }

        const batch1SubAgents = batch1Agents.filter((a) => a.id !== 'master-director')

        yield sendProgress(43, 'Launching Agent Batch 1: Research & Content...')
        await flush()

        const batch1Promises = batch1SubAgents.map((agent, index) => {
          const startProgress = 44 + index * 5
          return new Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }>(async (resolve) => {
            await new Promise(r => setTimeout(r, index * 1800))
            const result = await runSubAgentWithProtocol(agent, startProgress)
            resolve(result)
          })
        })

        // Yield progress for each agent as it starts
        for (let i = 0; i < batch1SubAgents.length; i++) {
          const progressVal = 44 + i * 5
          yield sendProgress(progressVal, `Running ${batch1SubAgents[i].name}...`)
          await flush()
          if (i < batch1SubAgents.length - 1) {
            await new Promise(r => setTimeout(r, 1800))
          }
        }

        const batch1Results = await Promise.all(batch1Promises)
        batch1Results.forEach(r => {
          if (Object.keys(r.data).length > 0) allAgentResults.push(r.data)
        })

        // Log validation stats for batch 1
        const b1Validated = batch1Results.filter(r => r.validated).length
        const b1Retried = batch1Results.filter(r => r.retried).length
        console.log(`[analyze] Batch 1 complete: ${b1Validated}/${batch1Results.length} validated, ${b1Retried} retried`)

        yield sendProgress(58, 'Agent Batch 1 complete. Launching Batch 2...')
        await flush()

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000))

        // ── Batch 2: On-Page Auditor, Link Strategist, Tech & Schema Auditor, Backlink Prospector ──
        // Kill-Switch: Re-check monthly cost cap before launching batch 2
        if (userId) {
          const { checkMonthlyCostCap } = await import('@/lib/plan-limits')
          const costCheck = await checkMonthlyCostCap(userId)
          if (!costCheck.withinCap) {
            console.warn(`[analyze] Kill-switch triggered before batch 2 for user ${userId}: $${costCheck.currentMonthlySpend.toFixed(2)} / $${costCheck.monthlyCap}`)
            yield sendError(`You've reached your processing limit ($${costCheck.monthlyCap.toFixed(2)}) for this month. Upgrade to Pro for unlimited execution.`)
            return
          }
          console.log(`[analyze] Cost cap OK before batch 2: $${costCheck.currentMonthlySpend.toFixed(2)} / $${costCheck.monthlyCap} (${Math.round(costCheck.usagePercent)}% used)`)
        }

        yield sendProgress(60, 'Launching Agent Batch 2: Audit & Strategy...')
        await flush()

        const batch2Promises = batch2Agents.map((agent, index) => {
          const startProgress = 62 + index * 4
          return new Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }>(async (resolve) => {
            await new Promise(r => setTimeout(r, index * 1800))
            const result = await runSubAgentWithProtocol(agent, startProgress)
            resolve(result)
          })
        })

        // Yield progress for each agent as it starts
        for (let i = 0; i < batch2Agents.length; i++) {
          const progressVal = 62 + i * 4
          yield sendProgress(progressVal, `Running ${batch2Agents[i].name}...`)
          await flush()
          if (i < batch2Agents.length - 1) {
            await new Promise(r => setTimeout(r, 1800))
          }
        }

        const batch2Results = await Promise.all(batch2Promises)
        batch2Results.forEach(r => {
          if (Object.keys(r.data).length > 0) allAgentResults.push(r.data)
        })

        // Log validation stats for batch 2
        const b2Validated = batch2Results.filter(r => r.validated).length
        const b2Retried = batch2Results.filter(r => r.retried).length
        console.log(`[analyze] Batch 2 complete: ${b2Validated}/${batch2Results.length} validated, ${b2Retried} retried`)

        // ── Step 6: Master Director final synthesis pass ──────────────────────
        yield sendProgress(78, 'Master Director: Synthesizing final strategy...')
        await flush()

        // Build synthesis context from the full ContextWindow
        const synthesisContext = buildSubAgentContext('master-director', contextWindow)
        const synthesisAgentContext: AgentContext = {
          ...agentContext,
          siteContent: `SYNTHESIS PASS — All sub-agents have completed.\n\n${synthesisContext}`,
        }

        emitWS(analysisSessionId, 'agent:start', {
          sessionId: analysisSessionId,
          agentId: 'master-director',
          agentName: 'Master Director',
          action: 'Final synthesis',
        })

        const synthesisResult = await runAgent(zai, agents[0], synthesisAgentContext, 79, (p, s) => {
          emitWS(analysisSessionId, 'agent:progress', { sessionId: analysisSessionId, agentId: 'master-director', progress: p, message: s })
        }, flush, tokenTracker, analysisId)

        if (Object.keys(synthesisResult.data).length > 0) {
          // Synthesis result can refine overallScores, summary, executiveActions
          allAgentResults.push(synthesisResult.data)
          const synthValidated = validateAgentResponse(synthesisResult.data)
          if (synthValidated.valid && synthValidated.response) {
            mergeSubAgentResult(contextWindow, synthValidated.response)
            console.log('[analyze] Master Director synthesis result merged into ContextWindow')
          }
          emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: 'master-director', result: 'Synthesis complete' })
        } else {
          emitWS(analysisSessionId, 'agent:error', { sessionId: analysisSessionId, agentId: 'master-director', error: 'Synthesis empty' })
        }

        yield sendProgress(82, 'All agents complete. Merging results...')
        await flush()

        // Check if we got any results at all
        const hasAnyData = allAgentResults.some(r => Object.keys(r).length > 0)
        if (!hasAnyData) {
          console.error('[analyze] All agent LLM calls failed after retries')

          // Save token tracking even on failure
          try {
            await tokenTracker.saveToDatabase()
          } catch (e) {
            console.error('[analyze] Failed to save token tracking on error:', e instanceof Error ? e.message : 'Unknown')
          }

          // Update Analysis record status
          try {
            await db.analysis.update({
              where: { id: analysisId },
              data: { status: 'failed' }
            })
          } catch { /* ignore */ }

          yield sendError('AI analysis service is currently busy. Please try again in 30 seconds.')
          return
        }

        // ════════════════════════════════════════════════════════════════
        // Phase 3: Merge all agent results into final analysis
        // ════════════════════════════════════════════════════════════════

        yield sendProgress(82, 'Merging agent results...')
        await flush()

        // ── Step 4: Assemble Final Report (Hub-and-Spoke Protocol) ──────────
        const analysisStartedAt = new Date().toISOString() // approximate start time
        const finalReport = assembleFinalReport(
          contextWindow,
          analysisStartedAt,
          tokenTracker.getSummary().totalTokens,
          tokenTracker.getSummary().totalCost,
        )
        console.log(`[analyze] Step 4: Final report assembled — SEO: ${finalReport.overall_scores.seo_score}, AEO: ${finalReport.overall_scores.aeo_score}, GEO: ${finalReport.overall_scores.geo_score}`)
        console.log(`[analyze] ${finalReport.all_recommended_actions.length} total recommended actions, ${finalReport.meta.agents_completed} agents completed`)

        // Deep merge all agent results (legacy compatibility)
        let analysisResult: Record<string, unknown> = {}
        for (const agentResult of allAgentResults) {
          if (Object.keys(agentResult).length > 0) {
            analysisResult = deepMerge(analysisResult, agentResult)
          }
        }

        // Attach the Step 4 assembled report alongside the legacy format
        // The frontend can use either format
        analysisResult._finalReport = finalReport

        // Ensure required top-level fields
        analysisResult.siteName = analysisResult.siteName || siteData.title || url
        analysisResult.market = targetMarket
        analysisResult.url = url

        // Ensure overallScores exists and is realistic
        if (!analysisResult.overallScores || typeof analysisResult.overallScores !== 'object') {
          analysisResult.overallScores = { seo: 35, aeo: 25, geo: 20, combined: 27 }
        }

        // Ensure audit exists with all sub-sections
        if (!analysisResult.audit || typeof analysisResult.audit !== 'object') {
          analysisResult.audit = {}
        }
        const audit = analysisResult.audit as Record<string, unknown>

        if (!audit.technicalSEO) {
          audit.technicalSEO = { score: 35, issues: [{ issue: 'Analysis incomplete - retry recommended', severity: 'warning', fix: 'Try again later' }] }
        }
        if (!audit.crawlability) {
          audit.crawlability = { score: 40, issues: [{ issue: 'Could not fully analyze', impact: 'Medium' }] }
        }
        if (!audit.pageSpeed) {
          audit.pageSpeed = { score: 50, coreVitals: [{ metric: 'LCP', value: 'Unknown', status: 'needs-improvement' }, { metric: 'INP', value: 'Unknown', status: 'needs-improvement' }, { metric: 'CLS', value: 'Unknown', status: 'needs-improvement' }] }
        }
        if (!audit.indexation) {
          audit.indexation = { score: 40, indexedPages: 0, orphanPages: 0, issues: ['Could not determine'] }
        }
        if (!audit.aeoReadiness) {
          audit.aeoReadiness = { score: 25, hasFAQ: false, hasSchema: false, hasStructuredData: false, answerFormatScore: 20, issues: ['Could not fully analyze'] }
        }
        if (!audit.geoVisibility) {
          audit.geoVisibility = { score: 20, citedByAI: [], entityRecognition: 15, knowledgeGraphPresence: false, issues: ['Could not fully analyze'] }
        }

        // Ensure other required sections with fallbacks
        if (!analysisResult.eeat) {
          analysisResult.eeat = { overallScore: 30, experience: { score: 30, findings: ['Partial analysis'] }, expertise: { score: 25, findings: ['Partial analysis'] }, authoritativeness: { score: 20, findings: ['Partial analysis'] }, trustworthiness: { score: 35, findings: ['Partial analysis'] }, whoHowWhyTest: { who: 'N/A', how: 'N/A', why: 'N/A' } }
        }
        if (!analysisResult.geoCitability) {
          analysisResult.geoCitability = { overallScore: 25, citabilityScore: { score: 25, weight: 25, findings: ['Partial'] }, structuralReadability: { score: 30, weight: 20, findings: ['Partial'] }, multiModalContent: { score: 20, weight: 15, findings: ['Partial'] }, authorityBrandSignals: { score: 20, weight: 20, findings: ['Partial'] }, technicalAccessibility: { score: 30, weight: 20, findings: ['Partial'] } }
        }
        if (!analysisResult.aiCrawler) {
          analysisResult.aiCrawler = { aiCrawlerAccess: [{ bot: 'GPTBot', allowed: true, recommendation: 'Verify access' }, { bot: 'ClaudeBot', allowed: true, recommendation: 'Verify access' }, { bot: 'PerplexityBot', allowed: true, recommendation: 'Verify access' }], robotsTxtAnalysis: ['Could not analyze'], llmsTxtPresence: false, jsRenderingDependency: 'medium', ssrVsCsr: 'Unknown' }
        }
        if (!analysisResult.brandMentions) {
          analysisResult.brandMentions = { brandMentionScore: 20, backlinkCorrelation: 'Could not determine', platformPresence: [{ platform: 'Wikipedia', detected: false, strength: 'none' }, { platform: 'Reddit', detected: false, strength: 'none' }, { platform: 'YouTube', detected: false, strength: 'none' }, { platform: 'LinkedIn', detected: false, strength: 'none' }], citationSources: [{ engine: 'ChatGPT', topSource: 'Unknown', percentage: 0 }] }
        }
        if (!analysisResult.contentQuality) {
          analysisResult.contentQuality = { overallScore: 35, contentDepth: 30, aiPatternRisk: 'medium', humanizationTips: ['Add original insights'], fillerDetected: ['Analysis incomplete'], originalityIndicators: ['Partial analysis'] }
        }
        if (!analysisResult.parasiteRisk) {
          analysisResult.parasiteRisk = { riskLevel: 'low', findings: ['Could not fully analyze'], recommendations: ['Monitor for changes'] }
        }
        if (!analysisResult.localSEO) {
          analysisResult.localSEO = { applicable: targetMarket !== 'Global', gbpSignals: { score: 20, findings: ['Not analyzed'] }, napConsistency: { score: 20, findings: ['Not analyzed'] }, reviewSignals: { score: 20, findings: ['Not analyzed'] }, businessType: 'N/A' }
        }
        if (!analysisResult.sxo) {
          analysisResult.sxo = { pageTypeMatch: 'Unknown', serpIntentMatch: 'mixed', userPersonaScores: [{ persona: 'General', score: 40 }], recommendations: ['Full analysis recommended'] }
        }
        if (!analysisResult.structure) {
          analysisResult.structure = {
            topicClusters: [{ cluster: 'Core Topic', pillarKeyword: 'primary keyword', supportingKeywords: ['secondary'], seoOpportunity: 'Optimize existing pages', aeoOpportunity: 'Add FAQ section', geoOpportunity: 'Create cite-worthy content' }],
            keywordGaps: [{ keyword: 'target keyword', volume: 'Med', difficulty: 'Med', type: 'seo', opportunity: 'Create content' }],
            contentArchitecture: { recommended: [{ section: 'Main Content', purpose: 'Core topic coverage', pillar: 'all' }], internalLinkMap: [{ from: 'Home', to: 'Blog', anchor: 'Learn more' }] },
            schemaRecommendations: [{ schemaType: 'Organization', purpose: 'Brand identity', pillar: 'geo', implementation: 'Add to homepage', status: 'active' }],
          }
        }
        if (!analysisResult.creative) {
          analysisResult.creative = {
            contentBriefs: [{ title: 'Comprehensive Guide', type: 'guide', targetKeyword: 'main keyword', pillar: 'all', brief: 'Cover topic thoroughly', estimatedImpact: 'High', wordCount: '2000-3000', structure: ['Introduction', 'Main Content'] }],
            onPageOptimizations: [{ page: '/', currentTitle: 'Current', suggestedTitle: 'Optimized Title', suggestedDescription: 'Optimized description', aeoTweaks: ['Add FAQ'], geoTweaks: ['Add structured data'] }],
            answerBlocks: [{ question: 'What is...?', suggestedAnswer: 'A clear concise answer that AI can cite.', format: 'faq', targetEngine: 'Google' }],
          }
        }
        if (!analysisResult.measure) {
          analysisResult.measure = {
            kpiTracking: {
              seo: [{ metric: 'Organic Traffic', current: '0', target: '+50%', timeline: '3mo' }],
              aeo: [{ metric: 'Featured Snippets', current: '0', target: '+3', timeline: '3mo' }],
              geo: [{ metric: 'AI Citations', current: '0', target: '+2', timeline: '3mo' }],
            },
            competitorBenchmarks: [{ competitor: 'Top Competitor', url: 'https://example.com', seoScore: 70, aeoScore: 60, geoScore: 50, citedBy: ['ChatGPT'] }],
            weeklyActions: [
              { week: 'Week 1', tasks: [{ task: 'Fix critical SEO issues', pillar: 'seo', priority: 'high' }, { task: 'Add FAQ schema', pillar: 'aeo', priority: 'high' }] },
              { week: 'Week 2', tasks: [{ task: 'Create pillar content', pillar: 'seo', priority: 'high' }, { task: 'Optimize for AI citation', pillar: 'geo', priority: 'medium' }] },
              { week: 'Week 3', tasks: [{ task: 'Build backlinks', pillar: 'seo', priority: 'medium' }, { task: 'Add answer blocks', pillar: 'aeo', priority: 'medium' }] },
              { week: 'Week 4', tasks: [{ task: 'Content refresh', pillar: 'seo', priority: 'low' }, { task: 'Monitor AI citations', pillar: 'geo', priority: 'medium' }] },
            ],
          }
        }
        if (!analysisResult.algorithmUpdates) {
          analysisResult.algorithmUpdates = {
            recentUpdates: [
              { name: 'Google Core Update March 2025', date: '2025-03', impact: 'high', description: 'Content quality and E-E-A-T signals prioritized', affectedPillar: 'all' },
              { name: 'AI Overview Expansion', date: '2025-02', impact: 'medium', description: 'AI Overviews shown for more query types', affectedPillar: 'aeo' },
            ],
          }
        }
        if (!analysisResult.roadmap) {
          const scores = (analysisResult.overallScores as Record<string, number>) || { seo: 35, aeo: 25, geo: 20 }
          analysisResult.roadmap = {
            quarters: [
              { label: 'Q1: Foundation', seoGoal: 'Fix critical issues, optimize meta tags', aeoGoal: 'Add FAQ schema, structured data', geoGoal: 'Create cite-worthy content, add llms.txt', targetScores: { seo: Math.min(100, (scores.seo || 35) + 15), aeo: Math.min(100, (scores.aeo || 25) + 12), geo: Math.min(100, (scores.geo || 20) + 10) } },
              { label: 'Q2: Growth', seoGoal: 'Build backlinks, expand topic clusters', aeoGoal: 'Optimize answer blocks, target snippets', geoGoal: 'Increase AI citation presence', targetScores: { seo: Math.min(100, (scores.seo || 35) + 25), aeo: Math.min(100, (scores.aeo || 25) + 22), geo: Math.min(100, (scores.geo || 20) + 20) } },
              { label: 'Q3: Authority', seoGoal: 'Dominate niche keywords', aeoGoal: 'Voice search optimization', geoGoal: 'Multi-platform AI visibility', targetScores: { seo: Math.min(100, (scores.seo || 35) + 35), aeo: Math.min(100, (scores.aeo || 25) + 32), geo: Math.min(100, (scores.geo || 20) + 30) } },
              { label: 'Q4: Scale', seoGoal: 'Scale content production', aeoGoal: 'Cross-platform AEO coverage', geoGoal: 'AI-first content strategy', targetScores: { seo: Math.min(100, (scores.seo || 35) + 45), aeo: Math.min(100, (scores.aeo || 25) + 40), geo: Math.min(100, (scores.geo || 20) + 38) } },
            ],
          }
        }
        if (!analysisResult.trafficInsights) {
          analysisResult.trafficInsights = {
            winners: [{ page: '/blog/guide', change: '+25%', pillar: 'seo' }, { page: '/faq', change: '+18%', pillar: 'aeo' }],
            losers: [{ page: '/old-page', change: '-12%', pillar: 'seo' }, { page: '/about', change: '-8%', pillar: 'geo' }],
          }
        }
        if (!analysisResult.deepStrategy) {
          analysisResult.deepStrategy = {
            technicalImplementations: [
              { type: 'schema', description: 'Add Organization schema', codeSnippet: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Your Brand","url":"https://yoursite.com"}</script>', priority: 'high', pillar: 'geo' },
              { type: 'robots', description: 'Allow AI crawlers in robots.txt', codeSnippet: 'User-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /', priority: 'high', pillar: 'geo' },
            ],
            backlinkOutreach: [{ targetSite: 'Industry publication', url: 'https://example.com', strategy: 'Guest post with data', contentAngle: 'Unique research angle', priority: 'high' }],
            aiCitationStrategy: [
              { technique: 'Source attribution', implementation: 'Include original data and quotes from primary sources', targetEngine: 'ChatGPT', expectedResult: 'Higher citation probability' },
              { technique: 'Structured answers', implementation: 'Use clear Q&A format with concise 40-60 word answers', targetEngine: 'Perplexity', expectedResult: 'Direct citation in AI responses' },
            ],
          }
        } else {
          // Ensure deepStrategy has all sub-sections
          const ds = analysisResult.deepStrategy as Record<string, unknown>
          if (!ds.backlinkOutreach) {
            ds.backlinkOutreach = [{ targetSite: 'Industry publication', url: 'https://example.com', strategy: 'Guest post with data', contentAngle: 'Unique research angle', priority: 'high' }]
          }
          if (!ds.aiCitationStrategy) {
            ds.aiCitationStrategy = [{ technique: 'Source attribution', implementation: 'Include original data from primary sources', targetEngine: 'ChatGPT', expectedResult: 'Higher citation probability' }]
          }
        }
        if (!analysisResult.summary) {
          analysisResult.summary = `Analysis of ${siteData.title || url} shows significant opportunities for improvement across SEO, AEO, and GEO pillars. Focus on building authority and creating cite-worthy content.`
        }
        if (!analysisResult.executiveActions || !Array.isArray(analysisResult.executiveActions) || (analysisResult.executiveActions as string[]).length === 0) {
          analysisResult.executiveActions = [
            'Fix critical technical SEO issues identified in the audit',
            'Add FAQ schema and structured data for AEO optimization',
            'Create comprehensive, cite-worthy content for GEO visibility',
            'Build high-quality backlinks from authoritative sources',
            'Implement AI crawler access in robots.txt and add llms.txt',
          ]
        }

        yield sendProgress(90, 'Compiling results...')
        await flush()
        await new Promise((resolve) => setTimeout(resolve, 200))

        yield sendProgress(95, 'Finalizing your strategy...')
        await flush()
        await new Promise((resolve) => setTimeout(resolve, 300))

        yield sendProgress(100, 'Analysis complete!')

        // ═══ Emit completion signals FIRST (before slow DB writes) ═══
        // This ensures the frontend receives the complete event even if
        // the DB write is slow or the serverless function times out.
        yield sendComplete(analysisResult)

        // Emit analysis:complete via WebSocket
        emitWS(analysisSessionId, 'analysis:complete', { sessionId: analysisSessionId })

        // ════════════════════════════════════════════════════════════════
        // Save token usage to database (non-blocking, at the end)
        // ════════════════════════════════════════════════════════════════
        const tokenSummary = tokenTracker.getSummary()
        console.log(`[analyze] Token usage summary: ${tokenSummary.totalTokens} tokens, $${tokenSummary.totalCost.toFixed(4)} estimated cost`)
        console.log(`[analyze] By agent:`, Object.entries(tokenSummary.byAgent).map(([id, data]) => `${id}: ${data.tokens} tokens, $${data.cost.toFixed(4)}`).join('; '))

        // Attach token summary to analysis result
        analysisResult._tokenSummary = {
          totalTokens: tokenSummary.totalTokens,
          totalCost: tokenSummary.totalCost,
          byAgent: tokenSummary.byAgent,
        }

        // Save token tracking to database (fire and forget, don't block the response)
        tokenTracker.saveToDatabase().catch((err) => {
          console.error('[analyze] Failed to save token tracking:', err instanceof Error ? err.message : 'Unknown')
        })

        // Update Analysis record with completed status and result (fire-and-forget)
        db.analysis.update({
          where: { id: analysisId },
          data: {
            status: 'completed',
            result: JSON.stringify(analysisResult).slice(0, 500000), // Limit to prevent DB issues
          }
        }).catch((dbError) => {
          console.error('[analyze] Failed to update Analysis record:', dbError instanceof Error ? dbError.message : 'Unknown')
        })

        // Fire and forget webhook dispatch
        try {
          const { WebhookDispatcher } = await import('@/lib/webhook-dispatcher')
          const dispatcher = new WebhookDispatcher()
          dispatcher.dispatch('system', { type: 'analysis.complete', domain, message: `Analysis complete for ${domain}` }).catch(() => {})
        } catch {}
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Analysis failed'
        console.error('[analyze] Error:', msg)

        // Emit analysis:error via WebSocket
        emitWS(analysisSessionId, 'analysis:error', { sessionId: analysisSessionId, error: msg })

        // Update Analysis record with failed status
        try {
          await db.analysis.update({
            where: { id: analysisId },
            data: { status: 'failed' }
          })
        } catch { /* ignore */ }

        yield sendError(msg)
      }
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of generateEvents()) {
            controller.enqueue(encoder.encode(event))
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Stream error'
          console.error('[analyze] Stream error:', msg)
          try {
            controller.enqueue(encoder.encode(sendError(msg)))
          } catch {
            // Controller already closed
          }
        } finally {
          try {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch {
            // Controller already closed
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
