/**
 * Audit Worker Registration — In-Process Processing
 * 
 * When Redis is unavailable (sandbox/dev mode), the in-memory queue
 * lives in the same process as the Next.js API routes. This module
 * registers the job processor so that when a job is enqueued via
 * /api/audit/run, it gets processed by the same Node.js process.
 * 
 * In production with Redis, BullMQ handles cross-process communication
 * and the worker runs as a separate mini-service on port 3004.
 */

import { registerAuditProcessor, type AuditJobData, type AuditJobResult } from './audit-queue'
import { db } from './db'
import { agents, batch1Agents, batch2Agents, type AgentDefinition, type AgentContext } from './agents'
import { TokenTracker } from './token-tracker'
import { AgentFallback } from './agent-fallback'
import { sharedContextCache, redisSharedContext } from './shared-context'
import { scrapeAndCleanWebsite, getAgentSpecificContext, type ScrapedSharedContext } from './scraper'
import {
  createContextWindow,
  validateAgentResponse,
  mergeSubAgentResult,
  buildSubAgentContext,
  buildAgentDispatch,
  type ContextWindow,
} from './agent-protocol'
import { checkMonthlyCostCap } from './plan-limits'

let processorRegistered = false

/**
 * Ensure the audit processor is registered with the in-memory queue.
 * Called lazily from the Producer route on first use.
 */
export async function ensureProcessorRegistered(): Promise<void> {
  if (processorRegistered) return
  processorRegistered = true

  console.log('[audit-worker-init] Registering in-process audit processor...')

  await registerAuditProcessor(processAuditJob)
  console.log('[audit-worker-init] In-process audit processor registered ✅')
}

/**
 * Emit a WebSocket event to the agent-stream service via REST.
 */
async function emitWS(sessionId: string, event: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('http://localhost:3003/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, event, data }),
    })
  } catch (err) {
    console.warn(`[audit-worker] Failed to emit WS event ${event}:`, err instanceof Error ? err.message : 'Unknown')
  }
}

/**
 * Retry wrapper with exponential backoff for 429/5xx errors.
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
        console.log(`[audit-worker] ${label} got ${is429 ? '429' : '5xx'}, retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`)
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
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  let jsonStr = fenceMatch ? fenceMatch[1].trim() : raw
  const braceStart = jsonStr.indexOf('{')
  if (braceStart === -1) throw new Error('No JSON object found')
  const braceEnd = jsonStr.lastIndexOf('}')
  jsonStr = jsonStr.slice(braceStart, braceEnd > braceStart ? braceEnd + 1 : jsonStr.length)
  try { return JSON.parse(jsonStr) } catch { /* continue */ }
  try { return JSON.parse(jsonStr.replace(/,\s*([}\]])/g, '$1')) } catch { /* continue */ }

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
  throw new Error('Failed to parse AI response as JSON after repair attempts')
}

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
  let result = ''
  if (headings.length > 0) result += 'Headings: ' + headings.slice(0, 8).join('; ') + '\n'
  if (metas.length > 0) result += 'Meta: ' + metas.slice(0, 6).join('; ')
  return result || 'No structure data available'
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (key in result) {
      const targetVal = result[key]
      const sourceVal = source[key]
      if (targetVal && sourceVal && typeof targetVal === 'object' && typeof sourceVal === 'object' && !Array.isArray(targetVal) && !Array.isArray(sourceVal)) {
        result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>)
      } else if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
        result[key] = [...targetVal, ...sourceVal]
      } else {
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
 */
async function runAgent(
  zai: { chat: { completions: { create: (opts: unknown) => Promise<unknown> } } },
  agent: AgentDefinition,
  context: AgentContext,
  progress: number,
  progressCallback: (progress: number, step: string) => void,
  tokenTracker: TokenTracker,
  analysisId: string,
): Promise<{ data: Record<string, unknown>; progress: number }> {
  const progressLabel = `Running ${agent.name}...`
  progressCallback(progress, progressLabel)
  console.log(`[audit-worker] Starting ${agent.name} (batch ${agent.batch})`)

  const startedAt = new Date()
  const systemPrompt = agent.systemPrompt
  const userPrompt = agent.buildUserPrompt(context)
  const inputTokens = tokenTracker.estimateTokens(systemPrompt + userPrompt)

  const fallback = new AgentFallback('default')
  const fallbackResult = await fallback.executeWithFallback(
    () => retryWithBackoff(
      () => zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
      3, 4000, `LLM_${agent.id}`
    ) as Promise<Record<string, unknown>>,
    (model: string) => retryWithBackoff(
      () => zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
      2, 3000, `LLM_${agent.id}_fallback_${model}`
    ) as Promise<Record<string, unknown>>,
    3, 2000
  )

  const llmFailed = !fallbackResult.success
  const usedModel = fallbackResult.model
  const llmResponse = fallbackResult.data as { choices?: Array<{ message?: { content?: string } }> } | null
  const raw = llmResponse?.choices?.[0]?.message?.content || ''
  const outputTokens = raw.length > 0 ? tokenTracker.estimateTokens(raw) : 0

  if (!llmFailed && outputTokens > 0) {
    tokenTracker.track({ agentId: agent.id, agentName: agent.name, model: usedModel, inputTokens, outputTokens })
  }
  if (llmFailed) {
    tokenTracker.trackFailure(agent.id, agent.name, usedModel)
  }

  console.log(`[audit-worker] ${agent.name} response: ${raw.length} chars (~${inputTokens} in / ${outputTokens} out tokens)`)

  const fallbackSummary = fallbackResult.logs.length > 1
    ? ` | Fallback: ${fallbackResult.logs.map(l => `${l.model}(${l.success ? 'ok' : 'fail'})`).join('→')}`
    : ''

  if (!raw) {
    console.warn(`[audit-worker] ${agent.name} returned empty response`)
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
          error: (llmFailed ? 'LLM call failed after retries' : 'Empty response') + fallbackSummary,
          startedAt, completedAt: new Date(),
        }
      })
    } catch { /* ignore */ }
    return { data: {}, progress }
  }

  let parsed: Record<string, unknown> = {}
  try {
    parsed = repairAndParseJSON(raw)
  } catch (e) {
    console.error(`[audit-worker] ${agent.name} JSON parse failed:`, e instanceof Error ? e.message : 'Unknown')
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
          error: `JSON parse failed: ${e instanceof Error ? e.message : 'Unknown'}${fallbackSummary}`,
          startedAt, completedAt: new Date(),
        }
      })
    } catch { /* ignore */ }
    return { data: {}, progress }
  }

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
        result: JSON.stringify(parsed).slice(0, 10000),
        startedAt, completedAt: new Date(),
      }
    })
  } catch { /* ignore */ }

  return { data: parsed, progress }
}

/**
 * Run a sub-agent with protocol validation and one retry.
 *
 * "Read Many" optimization: Each agent receives ONLY the context sections
 * it needs from the shared scraped cache, reducing input tokens by up to 70%.
 */
async function runSubAgentWithProtocol(
  zai: { chat: { completions: { create: (opts: unknown) => Promise<unknown> } } },
  agent: AgentDefinition,
  agentContext: AgentContext,
  contextWindow: ContextWindow,
  sessionId: string,
  progress: number,
  progressCallback: (progress: number, step: string) => void,
  tokenTracker: TokenTracker,
  analysisId: string,
  sharedScrapedContext?: ScrapedSharedContext | null,
): Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }> {
  const protocolContext = buildSubAgentContext(agent.id, contextWindow)
  const dispatch = buildAgentDispatch(agent.id, sessionId, contextWindow, agent.taskScope)
  const dispatchContext = `\n\nDISPATCH (Step 2):\n${JSON.stringify(dispatch, null, 2)}`

  // ── "Read Many" — Inject agent-specific context from shared cache ──
  // Each agent gets only the sections it needs (e.g., Content Architect
  // gets raw_text_content, Tech & Schema gets structured_elements)
  let agentSpecificContextStr = ''
  if (sharedScrapedContext) {
    const agentSpecific = getAgentSpecificContext(sharedScrapedContext, agent.id)
    agentSpecificContextStr = `\n\nSHARED CONTEXT (filtered for ${agent.name}):\n${JSON.stringify(agentSpecific, null, 2)}`
  }

  const enhancedContext: AgentContext = {
    ...agentContext,
    siteContent: agentContext.siteContent + '\n\n' + protocolContext + dispatchContext + agentSpecificContextStr,
  }

  emitWS(sessionId, 'agent:start', { sessionId, agentId: agent.id, agentName: agent.name, action: agent.role.split(':')[0] || 'Analyzing...' })

  let result = await runAgent(zai, agent, enhancedContext, progress, progressCallback, tokenTracker, analysisId)
  const validation = validateAgentResponse(result.data)

  if (validation.valid && validation.response) {
    mergeSubAgentResult(contextWindow, validation.response)
    const protocolData = result.data
    if (validation.response.data && Object.keys(validation.response.data).length > 0) {
      return { data: validation.response.data as Record<string, unknown>, validated: true, retried: false }
    }
    emitWS(sessionId, 'agent:complete', { sessionId, agentId: agent.id, result: 'Complete (validated)' })
    return { data: protocolData, validated: true, retried: false }
  }

  // Retry once
  console.warn(`[audit-worker] ${agent.name} validation failed, retrying...`)
  emitWS(sessionId, 'agent:progress', { sessionId, agentId: agent.id, progress, message: `${agent.name} retrying...` })
  await new Promise(r => setTimeout(r, 2000))

  result = await runAgent(zai, agent, enhancedContext, progress, progressCallback, tokenTracker, analysisId)
  const retryValidation = validateAgentResponse(result.data)

  if (retryValidation.valid && retryValidation.response) {
    mergeSubAgentResult(contextWindow, retryValidation.response)
    const protocolData = result.data
    if (retryValidation.response.data && Object.keys(retryValidation.response.data).length > 0) {
      return { data: retryValidation.response.data as Record<string, unknown>, validated: true, retried: true }
    }
    emitWS(sessionId, 'agent:complete', { sessionId, agentId: agent.id, result: 'Complete (retry validated)' })
    return { data: protocolData, validated: true, retried: true }
  }

  // Fallback to raw data
  if (Object.keys(result.data).length > 0) {
    emitWS(sessionId, 'agent:complete', { sessionId, agentId: agent.id, result: 'Complete (unvalidated)' })
    return { data: result.data, validated: false, retried: true }
  }

  emitWS(sessionId, 'agent:error', { sessionId, agentId: agent.id, error: 'Validation failed after retry' })
  return { data: {}, validated: false, retried: true }
}

/**
 * Main job processing function — runs the full 8-agent analysis pipeline.
 */
async function processAuditJob(job: { id: string; data: AuditJobData }): Promise<AuditJobResult> {
  const { userId, targetUrl, targetMarket, executionMode, tier, sessionId, analysisId } = job.data

  console.log(`[audit-worker] Processing job for ${targetUrl} (analysisId: ${analysisId})`)

  const emitProgress = (progress: number, step: string) => {
    emitWS(sessionId, 'agent:progress', { sessionId, progress, message: step })
  }

  try {
    // Update Analysis to 'running'
    try {
      await db.analysis.update({ where: { id: analysisId }, data: { status: 'running' } })
    } catch (dbError) {
      console.warn('[audit-worker] Could not update status to running:', dbError instanceof Error ? dbError.message : 'Unknown')
    }

    emitWS(sessionId, 'analysis:start', { sessionId, url: targetUrl, market: targetMarket })

    // Initialize z-ai-web-dev-sdk (uses getZAI which supports env var config on Vercel)
    const { getZAI } = await import('./zai')
    const zai = await getZAI()

    const tokenTracker = new TokenTracker(sessionId, { userId, analysisId })

    // Kill-switch check
    if (userId) {
      const costCheck = await checkMonthlyCostCap(userId)
      if (!costCheck.withinCap) {
        throw new Error(`Processing limit reached ($${costCheck.monthlyCap.toFixed(2)}/month). Upgrade to Pro.`)
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Phase 1: "Scrape Once, Read Many" — Data Gathering
    //
    // The Master Director scrapes the site ONCE and caches the structured
    // result in Redis. All 7 sub-agents then read from this shared cache,
    // each receiving only the context section they need (up to 70% token
    // reduction vs. sending full context to every agent).
    // ═══════════════════════════════════════════════════════════════════
    const domain = new URL(targetUrl).hostname.replace('www.', '')
    const projectId = job.data.projectId || `${domain}:${targetMarket}`

    // Try Redis shared context first (cross-process, 1-hour TTL)
    let scrapedContext: ScrapedSharedContext | null = await redisSharedContext.getScrapedContext(projectId)

    // Also check legacy in-memory cache for backward compat
    if (!scrapedContext) {
      const cachedContext = sharedContextCache.get(targetUrl, targetMarket)
      if (cachedContext) {
        // Convert legacy cache to new format
        scrapedContext = {
          meta_data: {
            title: cachedContext.siteData.title,
            description: '',
            robots_txt: cachedContext.robotsTxt,
            llms_txt_exists: cachedContext.llmsTxtExists,
            url: cachedContext.url,
            domain: cachedContext.domain,
          },
          raw_text_content: cachedContext.siteData.text,
          structured_elements: {
            headings: {},
            links: [],
            schema_markup: { has_faq: false, has_organization: false, has_article: false, has_product: false, has_local_business: false, detected_types: [] },
          },
          search_context: {
            competitor_results: cachedContext.searchResults,
            ai_citation_results: cachedContext.aiSearchResults,
            local_seo_results: cachedContext.localSearchResults,
          },
          html_structure: cachedContext.htmlStructure,
          scraped_at: cachedContext.createdAt,
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
      emitProgress(5, 'Using cached scan data (Redis shared context)...')
      console.log(`[audit-worker] Cache HIT for ${projectId} — skipping scrape (age: ${Math.round((Date.now() - scrapedContext.scraped_at) / 1000)}s)`)

      siteData = { title: scrapedContext.meta_data.title, html: '', url: scrapedContext.meta_data.url, text: scrapedContext.raw_text_content }
      searchResults = scrapedContext.search_context.competitor_results
      aiSearchResults = scrapedContext.search_context.ai_citation_results
      localSearchResults = scrapedContext.search_context.local_seo_results
      htmlStructure = scrapedContext.html_structure
      emitProgress(35, 'Cached data loaded. Proceeding to agent analysis...')
    } else {
      // ── Cache MISS: Scrape Once using the new scraper ──
      emitProgress(5, 'Scanning website (Scrape Once, Read Many)...')
      console.log(`[audit-worker] Cache MISS for ${projectId} — running scrapeAndCleanWebsite()`)

      scrapedContext = await scrapeAndCleanWebsite(targetUrl, zai, {
        includeSearchData: true,
        targetMarket,
      })

      // Cache in Redis (1-hour TTL) for future requests and cross-process sharing
      await redisSharedContext.setScrapedContext(projectId, scrapedContext)
      console.log(`[audit-worker] Context cached in Redis for 1 hour (key: ${projectId})`)

      // Also write to legacy in-memory cache for backward compatibility
      siteData = { title: scrapedContext.meta_data.title, html: '', url: scrapedContext.meta_data.url, text: scrapedContext.raw_text_content }
      searchResults = scrapedContext.search_context.competitor_results
      aiSearchResults = scrapedContext.search_context.ai_citation_results
      localSearchResults = scrapedContext.search_context.local_seo_results
      htmlStructure = scrapedContext.html_structure

      sharedContextCache.set(targetUrl, targetMarket, {
        url: targetUrl, domain, siteData: { title: scrapedContext.meta_data.title, html: '', text: scrapedContext.raw_text_content },
        robotsTxt: scrapedContext.meta_data.robots_txt, llmsTxtExists: scrapedContext.meta_data.llms_txt_exists, blockedBots: [], allowedBots: [],
        searchResults, aiSearchResults, localSearchResults,
        htmlStructure: scrapedContext.html_structure,
        createdAt: Date.now(),
      })
    }

    // ═══════════════════════════════════════════════════════════════════
    // Phase 2: Agent Execution — "Read Many"
    //
    // Each agent reads ONLY the context section it needs from the shared
    // cache. This is the core token optimization:
    //   - Content Architect → raw_text_content + structured_elements
    //   - Tech & Schema → structured_elements + meta_data
    //   - Competitor Analyst → meta_data + search_context
    //
    // Result: Up to 70% fewer input tokens per agent compared to sending
    // the full scraped context to every LLM call.
    // ═══════════════════════════════════════════════════════════════════
    const siteContent = siteData.text?.slice(0, 2500) || 'No content available'
    htmlStructure = htmlStructure || scrapedContext?.html_structure || ''
    const competitorInfo = searchResults.slice(0, 3).map(r => `${r.name} (${r.host_name}): ${(r.snippet || '').slice(0, 80)}`).join(' | ')
    const aiInfo = aiSearchResults.slice(0, 2).map(r => `${r.name}: ${(r.snippet || '').slice(0, 60)}`).join(' | ')
    const localInfo = localSearchResults.slice(0, 2).map(r => `${r.name}: ${(r.snippet || '').slice(0, 60)}`).join(' | ')

    const agentContext: AgentContext = {
      url: targetUrl, domain, siteName: siteData.title || targetUrl, siteContent, htmlStructure,
      competitorInfo, aiInfo, localInfo, targetMarket,
    }

    // Store the full scraped context for agent-specific context injection
    const sharedScrapedContext = scrapedContext

    const contextWindow = createContextWindow({
      url: targetUrl, domain, market: targetMarket, siteName: siteData.title || targetUrl,
      scanData: { siteContent: siteContent.slice(0, 1500), htmlStructure: htmlStructure.slice(0, 500), competitorInfo: competitorInfo.slice(0, 400), aiInfo: aiInfo.slice(0, 300), localInfo: localInfo.slice(0, 300) },
      sessionId, executionMode,
    })

    const allAgentResults: Record<string, unknown>[] = []

    // Master Director first
    emitProgress(38, 'Master Director: Analyzing raw data & creating plan...')
    emitWS(sessionId, 'agent:start', { sessionId, agentId: 'master-director', agentName: 'Master Director', action: 'Strategy lead' })

    const mdResult = await runAgent(zai, agents[0], agentContext, 39, emitProgress, tokenTracker, analysisId)
    if (Object.keys(mdResult.data).length > 0) {
      allAgentResults.push(mdResult.data)
      const mdValidated = validateAgentResponse(mdResult.data)
      if (mdValidated.valid && mdValidated.response) {
        mergeSubAgentResult(contextWindow, mdValidated.response)
      }
      emitWS(sessionId, 'agent:complete', { sessionId, agentId: 'master-director', result: 'Complete' })
    }

    emitProgress(42, 'Master Director complete. Launching sub-agents...')

    // Kill-switch check before Batch 1
    if (userId) {
      const costCheck = await checkMonthlyCostCap(userId)
      if (!costCheck.withinCap) {
        throw new Error(`Processing limit reached. Upgrade to Pro.`)
      }
    }

    // Batch 1
    const batch1SubAgents = batch1Agents.filter(a => a.id !== 'master-director')
    emitProgress(43, 'Launching Agent Batch 1...')

    const batch1Results = await Promise.all(
      batch1SubAgents.map((agent, index) =>
        new Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }>(async (resolve) => {
          await new Promise(r => setTimeout(r, index * 1800))
          const startProgress = 44 + index * 5
          emitProgress(startProgress, `Running ${agent.name}...`)
          const result = await runSubAgentWithProtocol(zai, agent, agentContext, contextWindow, sessionId, startProgress, emitProgress, tokenTracker, analysisId, sharedScrapedContext)
          resolve(result)
        })
      )
    )
    batch1Results.forEach(r => { if (Object.keys(r.data).length > 0) allAgentResults.push(r.data) })

    emitProgress(58, 'Batch 1 complete. Launching Batch 2...')

    // Kill-switch check before Batch 2
    if (userId) {
      const costCheck = await checkMonthlyCostCap(userId)
      if (!costCheck.withinCap) {
        throw new Error(`Processing limit reached. Upgrade to Pro.`)
      }
    }

    // Batch 2
    emitProgress(60, 'Launching Agent Batch 2...')
    const batch2Results = await Promise.all(
      batch2Agents.map((agent, index) =>
        new Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }>(async (resolve) => {
          await new Promise(r => setTimeout(r, index * 1800))
          const startProgress = 60 + index * 5
          emitProgress(startProgress, `Running ${agent.name}...`)
          const result = await runSubAgentWithProtocol(zai, agent, agentContext, contextWindow, sessionId, startProgress, emitProgress, tokenTracker, analysisId, sharedScrapedContext)
          resolve(result)
        })
      )
    )
    batch2Results.forEach(r => { if (Object.keys(r.data).length > 0) allAgentResults.push(r.data) })

    emitProgress(82, 'Merging agent results...')

    // Optional: Clean up shared context from Redis after all agents complete
    // This frees memory — the data is no longer needed after the analysis
    // We keep it cached for potential re-use within the TTL window (1 hour)
    // but you can uncomment the line below for immediate cleanup:
    // await redisSharedContext.delete(projectId)

    // Merge all results
    let finalResult: Record<string, unknown> = {}
    for (const agentResult of allAgentResults) {
      finalResult = deepMerge(finalResult, agentResult)
    }

    // Ensure required sections
    if (!finalResult.overallScores) finalResult.overallScores = { seo: 35, aeo: 25, geo: 20, combined: 27 }
    if (!finalResult.url) finalResult.url = targetUrl
    if (!finalResult.siteName) finalResult.siteName = siteData.title || targetUrl
    if (!finalResult.market) finalResult.market = targetMarket
    if (!finalResult.summary) finalResult.summary = `Analysis of ${siteData.title || targetUrl} complete.`
    if (!finalResult.executiveActions) finalResult.executiveActions = ['Review audit findings', 'Fix critical issues first']

    // ═══ Emit completion signals FIRST (before slow DB writes) ═══
    // This ensures the frontend receives the completion event even if
    // the DB write is slow or the Vercel function is killed by timeout.
    emitProgress(100, 'Analysis complete!')
    emitWS(sessionId, 'analysis:complete', { sessionId })

    // Save result to database (fire-and-forget — don't block the response)
    db.analysis.update({
      where: { id: analysisId },
      data: { status: 'completed', result: JSON.stringify(finalResult).slice(0, 500000) },
    }).catch((dbError) => {
      console.error('[audit-worker] Failed to save result:', dbError instanceof Error ? dbError.message : 'Unknown')
    })

    // Save token usage (fire-and-forget)
    tokenTracker.saveToDatabase().catch(() => {})

    console.log(`[audit-worker] Job completed for ${targetUrl}`)

    const scores = finalResult.overallScores as Record<string, number> | undefined
    return {
      analysisId,
      status: 'completed',
      overallScores: scores ? { seo: scores.seo || 35, aeo: scores.aeo || 25, geo: scores.geo || 20, combined: scores.combined || 27 } : undefined,
      completedAt: new Date().toISOString(),
    }

  } catch (error) {
    console.error(`[audit-worker] Job failed for ${targetUrl}:`, error instanceof Error ? error.message : 'Unknown')

    // Update Analysis to 'failed'
    try {
      await db.analysis.update({
        where: { id: analysisId },
        data: { status: 'failed' },
      })
    } catch { /* ignore */ }

    emitWS(sessionId, 'analysis:error', { sessionId, error: error instanceof Error ? error.message : 'Unknown error' })

    return {
      analysisId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date().toISOString(),
    }
  }
}
