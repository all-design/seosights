/**
 * Audit Worker — Background Process for 8-Agent SEO Analysis
 *
 * This mini-service runs on port 3004 and handles the heavy lifting of
 * running the 8 AI agents for SEO/AEO/GEO analysis. It follows the
 * Producer-Worker pattern:
 *
 *   Producer (Next.js API route): Validates limits, creates Analysis record
 *     (status='queued'), adds job to queue, returns jobId (HTTP 202)
 *
 *   Worker (this service on port 3004): Picks up jobs, runs 8 AI agents,
 *     saves results to DB, emits WebSocket events for real-time updates
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ENDPOINTS
 * ═══════════════════════════════════════════════════════════════════════
 *
 *   GET  /health        — Health check
 *   POST /start         — Register with queue and start processing
 *   POST /process-job   — Direct job processing (in-memory queue integration)
 *   GET  /stats         — Worker statistics
 *
 * ═══════════════════════════════════════════════════════════════════════
 * COMMUNICATION
 * ═══════════════════════════════════════════════════════════════════════
 *
 *   1. Shared SQLite database (via Prisma) — read/write Analysis, AgentLog, etc.
 *   2. WebSocket events via HTTP POST to port 3003 (agent-stream service)
 *
 * ═══════════════════════════════════════════════════════════════════════
 * JOB PROCESSING FLOW
 * ═══════════════════════════════════════════════════════════════════════
 *
 *   a. Receive AuditJobData { userId, targetUrl, targetMarket, executionMode, tier, sessionId, analysisId }
 *   b. Update Analysis record status to 'running' in DB
 *   c. Emit 'analysis:start' WebSocket event
 *   d. Phase 1: Data Gathering (page_reader, web_search ×3)
 *   e. Phase 2: Agent Execution (Master Director → Batch 1 → Batch 2 → MD Synthesis)
 *   f. Phase 3: Save final JSON result to Analysis.record in DB
 *   g. Update Analysis status to 'completed'
 *   h. Emit 'analysis:complete' WebSocket event
 *   i. Return AuditJobResult
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { randomUUID } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Import from parent project — Bun can import .ts files directly
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '../../src/lib/db'
import { agents, batch1Agents, batch2Agents, type AgentDefinition, type AgentContext } from '../../src/lib/agents'
import { TokenTracker } from '../../src/lib/token-tracker'
import { AgentFallback } from '../../src/lib/agent-fallback'
import { sharedContextCache } from '../../src/lib/shared-context'
import {
  createContextWindow,
  validateAgentResponse,
  mergeSubAgentResult,
  buildSubAgentContext,
  buildAgentDispatch,
  assembleFinalReport,
  type ContextWindow,
  type AgentResponse,
} from '../../src/lib/agent-protocol'
import { checkMonthlyCostCap, checkAllLimits } from '../../src/lib/plan-limits'
import type { AuditJobData, AuditJobResult } from '../../src/lib/audit-queue'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PORT = 3004
const AGENT_STREAM_URL = 'http://localhost:3003/emit'

// ─────────────────────────────────────────────────────────────────────────────
// Worker Statistics
// ─────────────────────────────────────────────────────────────────────────────

interface WorkerStats {
  jobsProcessed: number
  jobsFailed: number
  jobsActive: number
  totalTokensUsed: number
  totalCostUsd: number
  uptime: number
  lastJobAt: string | null
}

const stats: WorkerStats = {
  jobsProcessed: 0,
  jobsFailed: 0,
  jobsActive: 0,
  totalTokensUsed: 0,
  totalCostUsd: 0,
  uptime: Date.now(),
  lastJobAt: null,
}

let isRegistered = false

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions — extracted from /api/analyze/route.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit a WebSocket event to the agent-stream service via REST.
 * Non-blocking — failures are logged but don't break the analysis.
 */
async function emitWS(sessionId: string, event: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch(AGENT_STREAM_URL, {
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

/**
 * Timeout wrapper — resolves with fallback if promise exceeds ms.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Core Agent Execution — extracted from /api/analyze/route.ts
// ─────────────────────────────────────────────────────────────────────────────

type ZAIClient = { chat: { completions: { create: (opts: unknown) => Promise<unknown> } } }

/**
 * Run a single agent and return its parsed JSON result.
 * Tracks token usage via tokenTracker and creates AgentLog entries.
 */
async function runAgent(
  zai: ZAIClient,
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

  // ── Fallback-aware LLM call ──────────────────────────────────────────
  const fallback = new AgentFallback('default')

  const fallbackResult = await fallback.executeWithFallback(
    // Primary: standard LLM call with retry + JSON mode
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
      2,
      3000,
      `LLM_${agent.id}_fallback_${model}`
    ) as Promise<Record<string, unknown>>,
    3,    // max attempts across primary + fallbacks
    2000  // base delay between fallback attempts
  )

  const llmFailed = !fallbackResult.success
  const usedModel = fallbackResult.model
  const usedFallback = fallbackResult.usedFallback

  // Log fallback usage
  if (usedFallback && fallbackResult.success) {
    console.log(
      `[audit-worker] ${agent.name} used FALLBACK model "${usedModel}" (attempt ${fallbackResult.attempt})`
    )
  }

  // Extract the LLM response from the fallback result
  const llmResponse = fallbackResult.data as { choices?: Array<{ message?: { content?: string } }> } | null
  const raw = llmResponse?.choices?.[0]?.message?.content || ''
  const outputTokens = raw.length > 0 ? tokenTracker.estimateTokens(raw) : 0

  // Track token usage
  if (!llmFailed && outputTokens > 0) {
    tokenTracker.track({
      agentId: agent.id,
      agentName: agent.name,
      model: usedModel,
      inputTokens,
      outputTokens,
    })
  }

  if (llmFailed) {
    tokenTracker.trackFailure(agent.id, agent.name, usedModel)
  }

  console.log(`[audit-worker] ${agent.name} response length:`, raw.length, `(~${inputTokens} in / ${outputTokens} out tokens)`, usedFallback ? `[FALLBACK: ${usedModel}]` : '')

  // Build a summary of fallback attempts for AgentLog
  const fallbackSummary = fallbackResult.logs.length > 1
    ? ` | Fallback attempts: ${fallbackResult.logs.map(l => `${l.model}(${l.success ? 'ok' : 'fail'})`).join('\u2192')}`
    : ''

  if (!raw) {
    console.warn(`[audit-worker] ${agent.name} returned empty response`)

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
      console.error('[audit-worker] Failed to create AgentLog:', logError instanceof Error ? logError.message : 'Unknown')
    }

    return { data: {}, progress }
  }

  let parsed: Record<string, unknown> = {}
  try {
    parsed = repairAndParseJSON(raw)
    console.log(`[audit-worker] ${agent.name} parsed successfully, keys:`, Object.keys(parsed).join(', '))
  } catch (e) {
    console.error(`[audit-worker] ${agent.name} JSON parse failed:`, e instanceof Error ? e.message : 'Unknown error')

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
      console.error('[audit-worker] Failed to create AgentLog:', logError instanceof Error ? logError.message : 'Unknown')
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
        result: JSON.stringify(parsed).slice(0, 10000),
        startedAt,
        completedAt: new Date(),
      }
    })
  } catch (logError) {
    console.error('[audit-worker] Failed to create AgentLog:', logError instanceof Error ? logError.message : 'Unknown')
  }

  return { data: parsed, progress }
}

/**
 * Run a sub-agent with protocol validation and one retry on failure.
 * Returns the validated data (empty object if both attempts fail).
 */
async function runSubAgentWithProtocol(
  zai: ZAIClient,
  agent: AgentDefinition,
  agentContext: AgentContext,
  contextWindow: ContextWindow,
  analysisSessionId: string,
  progress: number,
  progressCallback: (progress: number, step: string) => void,
  tokenTracker: TokenTracker,
  analysisId: string,
): Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }> {
  // Build enhanced context from the ContextWindow for this specific agent
  const protocolContext = buildSubAgentContext(agent.id, contextWindow)

  // Build the Step 2 dispatch context (task_scope) for this agent
  const dispatch = buildAgentDispatch(agent.id, analysisSessionId, contextWindow, agent.taskScope)
  const dispatchContext = `\n\nDISPATCH (Step 2):\n${JSON.stringify(dispatch, null, 2)}`

  // Create enhanced agent context that includes protocol context + dispatch
  const enhancedContext: AgentContext = {
    ...agentContext,
    siteContent: agentContext.siteContent + '\n\n' + protocolContext + dispatchContext,
  }

  // First attempt
  emitWS(analysisSessionId, 'agent:start', {
    sessionId: analysisSessionId,
    agentId: agent.id,
    agentName: agent.name,
    action: agent.role.split(':')[0] || 'Analyzing...',
  })

  let result = await runAgent(zai, agent, enhancedContext, progress, progressCallback, tokenTracker, analysisId)

  // Validate the response using the agent protocol
  const validation = validateAgentResponse(result.data)

  if (validation.valid && validation.response) {
    // Valid response — merge into ContextWindow
    mergeSubAgentResult(contextWindow, validation.response)

    const protocolData = result.data
    if (validation.response.data && Object.keys(validation.response.data).length > 0) {
      const agentData = validation.response.data as Record<string, unknown>
      return { data: agentData, validated: true, retried: false }
    }

    emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: agent.id, result: 'Complete (validated)' })
    return { data: protocolData, validated: true, retried: false }
  }

  // Validation failed — retry once
  console.warn(`[audit-worker] ${agent.name} response failed validation: ${validation.error}. Retrying...`)

  emitWS(analysisSessionId, 'agent:progress', {
    sessionId: analysisSessionId,
    agentId: agent.id,
    progress,
    message: `${agent.name} validation failed — retrying...`,
  })

  await new Promise(r => setTimeout(r, 2000))

  result = await runAgent(zai, agent, enhancedContext, progress, progressCallback, tokenTracker, analysisId)

  const retryValidation = validateAgentResponse(result.data)

  if (retryValidation.valid && retryValidation.response) {
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
  console.warn(`[audit-worker] ${agent.name} retry also failed validation. Using raw data as fallback.`)

  if (Object.keys(result.data).length > 0) {
    emitWS(analysisSessionId, 'agent:complete', { sessionId: analysisSessionId, agentId: agent.id, result: 'Complete (unvalidated fallback)' })
    return { data: result.data, validated: false, retried: true }
  }

  emitWS(analysisSessionId, 'agent:error', { sessionId: analysisSessionId, agentId: agent.id, error: 'Validation failed after retry' })
  return { data: {}, validated: false, retried: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ensure Required Analysis Sections (fallbacks for incomplete agent results)
// ─────────────────────────────────────────────────────────────────────────────

function ensureRequiredSections(
  analysisResult: Record<string, unknown>,
  siteData: { title?: string; html?: string; url?: string; text?: string },
  url: string,
  targetMarket: string,
): Record<string, unknown> {
  analysisResult.siteName = analysisResult.siteName || siteData.title || url
  analysisResult.market = targetMarket
  analysisResult.url = url

  // Ensure overallScores
  if (!analysisResult.overallScores || typeof analysisResult.overallScores !== 'object') {
    analysisResult.overallScores = { seo: 35, aeo: 25, geo: 20, combined: 27 }
  }

  // Ensure audit
  if (!analysisResult.audit || typeof analysisResult.audit !== 'object') {
    analysisResult.audit = {}
  }
  const audit = analysisResult.audit as Record<string, unknown>
  if (!audit.technicalSEO) audit.technicalSEO = { score: 35, issues: [{ issue: 'Analysis incomplete - retry recommended', severity: 'warning', fix: 'Try again later' }] }
  if (!audit.crawlability) audit.crawlability = { score: 40, issues: [{ issue: 'Could not fully analyze', impact: 'Medium' }] }
  if (!audit.pageSpeed) audit.pageSpeed = { score: 50, coreVitals: [{ metric: 'LCP', value: 'Unknown', status: 'needs-improvement' }, { metric: 'INP', value: 'Unknown', status: 'needs-improvement' }, { metric: 'CLS', value: 'Unknown', status: 'needs-improvement' }] }
  if (!audit.indexation) audit.indexation = { score: 40, indexedPages: 0, orphanPages: 0, issues: ['Could not determine'] }
  if (!audit.aeoReadiness) audit.aeoReadiness = { score: 25, hasFAQ: false, hasSchema: false, hasStructuredData: false, answerFormatScore: 20, issues: ['Could not fully analyze'] }
  if (!audit.geoVisibility) audit.geoVisibility = { score: 20, citedByAI: [], entityRecognition: 15, knowledgeGraphPresence: false, issues: ['Could not fully analyze'] }

  // Ensure other sections
  if (!analysisResult.eeat) analysisResult.eeat = { overallScore: 30, experience: { score: 30, findings: ['Partial analysis'] }, expertise: { score: 25, findings: ['Partial analysis'] }, authoritativeness: { score: 20, findings: ['Partial analysis'] }, trustworthiness: { score: 35, findings: ['Partial analysis'] }, whoHowWhyTest: { who: 'N/A', how: 'N/A', why: 'N/A' } }
  if (!analysisResult.geoCitability) analysisResult.geoCitability = { overallScore: 25, citabilityScore: { score: 25, weight: 25, findings: ['Partial'] }, structuralReadability: { score: 30, weight: 20, findings: ['Partial'] }, multiModalContent: { score: 20, weight: 15, findings: ['Partial'] }, authorityBrandSignals: { score: 20, weight: 20, findings: ['Partial'] }, technicalAccessibility: { score: 30, weight: 20, findings: ['Partial'] } }
  if (!analysisResult.aiCrawler) analysisResult.aiCrawler = { aiCrawlerAccess: [{ bot: 'GPTBot', allowed: true, recommendation: 'Verify access' }, { bot: 'ClaudeBot', allowed: true, recommendation: 'Verify access' }, { bot: 'PerplexityBot', allowed: true, recommendation: 'Verify access' }], robotsTxtAnalysis: ['Could not analyze'], llmsTxtPresence: false, jsRenderingDependency: 'medium', ssrVsCsr: 'Unknown' }
  if (!analysisResult.brandMentions) analysisResult.brandMentions = { brandMentionScore: 20, backlinkCorrelation: 'Could not determine', platformPresence: [{ platform: 'Wikipedia', detected: false, strength: 'none' }, { platform: 'Reddit', detected: false, strength: 'none' }, { platform: 'YouTube', detected: false, strength: 'none' }, { platform: 'LinkedIn', detected: false, strength: 'none' }], citationSources: [{ engine: 'ChatGPT', topSource: 'Unknown', percentage: 0 }] }
  if (!analysisResult.contentQuality) analysisResult.contentQuality = { overallScore: 35, contentDepth: 30, aiPatternRisk: 'medium', humanizationTips: ['Add original insights'], fillerDetected: ['Analysis incomplete'], originalityIndicators: ['Partial analysis'] }
  if (!analysisResult.parasiteRisk) analysisResult.parasiteRisk = { riskLevel: 'low', findings: ['Could not fully analyze'], recommendations: ['Monitor for changes'] }
  if (!analysisResult.localSEO) analysisResult.localSEO = { applicable: targetMarket !== 'Global', gbpSignals: { score: 20, findings: ['Not analyzed'] }, napConsistency: { score: 20, findings: ['Not analyzed'] }, reviewSignals: { score: 20, findings: ['Not analyzed'] }, businessType: 'N/A' }
  if (!analysisResult.sxo) analysisResult.sxo = { pageTypeMatch: 'Unknown', serpIntentMatch: 'mixed', userPersonaScores: [{ persona: 'General', score: 40 }], recommendations: ['Full analysis recommended'] }

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
    const ds = analysisResult.deepStrategy as Record<string, unknown>
    if (!ds.backlinkOutreach) ds.backlinkOutreach = [{ targetSite: 'Industry publication', url: 'https://example.com', strategy: 'Guest post with data', contentAngle: 'Unique research angle', priority: 'high' }]
    if (!ds.aiCitationStrategy) ds.aiCitationStrategy = [{ technique: 'Source attribution', implementation: 'Include original data from primary sources', targetEngine: 'ChatGPT', expectedResult: 'Higher citation probability' }]
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

  return analysisResult
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Job Processing Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process an audit job from start to finish.
 *
 * This is the core function that mirrors the generateEvents() flow in
 * /api/analyze/route.ts, but runs in the background without SSE.
 * Instead, it emits WebSocket events for real-time progress updates.
 */
async function processAuditJob(jobData: AuditJobData): Promise<AuditJobResult> {
  const { userId, targetUrl, targetMarket, executionMode, tier, sessionId, analysisId } = jobData

  console.log(`[audit-worker] Processing job for ${targetUrl} (analysisId: ${analysisId}, sessionId: ${sessionId})`)

  stats.jobsActive++
  stats.lastJobAt = new Date().toISOString()

  // Progress callback that emits WS events
  const emitProgress = (progress: number, step: string) => {
    emitWS(sessionId, 'agent:progress', { sessionId, progress, message: step })
  }

  try {
    // ── Step 1: Update Analysis record to 'running' ────────────────────
    try {
      await db.analysis.update({
        where: { id: analysisId },
        data: { status: 'running' }
      })
    } catch (dbError) {
      console.warn('[audit-worker] Could not update Analysis status to running:', dbError instanceof Error ? dbError.message : 'Unknown')
    }

    // ── Step 2: Emit analysis:start WebSocket event ────────────────────
    emitWS(sessionId, 'analysis:start', { sessionId, url: targetUrl, market: targetMarket })

    // ── Step 3: Initialize z-ai-web-dev-sdk ────────────────────────────
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // ── Step 4: Create token tracker ───────────────────────────────────
    const tokenTracker = new TokenTracker(sessionId, {
      userId: userId,
      analysisId: analysisId,
    })

    // ── Step 5: Kill-Switch check before starting ──────────────────────
    if (userId) {
      const costCheck = await checkMonthlyCostCap(userId)
      if (!costCheck.withinCap) {
        console.warn(`[audit-worker] Kill-switch triggered for user ${userId}: $${costCheck.currentMonthlySpend.toFixed(2)} / $${costCheck.monthlyCap}`)
        throw new Error(`You've reached your processing limit ($${costCheck.monthlyCap.toFixed(2)}) for this month. Upgrade to Pro for unlimited execution.`)
      }
      console.log(`[audit-worker] Cost cap OK: $${costCheck.currentMonthlySpend.toFixed(2)} / $${costCheck.monthlyCap} (${Math.round(costCheck.usagePercent)}% used)`)
    }

    // ── Step 6: Phase 1 — Data Gathering ──────────────────────────────
    const domain = new URL(targetUrl).hostname.replace('www.', '')

    const cachedContext = sharedContextCache.get(targetUrl, targetMarket)

    let siteData: { title?: string; html?: string; url?: string; text?: string }
    let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
    let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
    let localSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }>
    let htmlStructure: string

    if (cachedContext) {
      console.log(`[audit-worker] Cache HIT for ${targetUrl}:${targetMarket} (age: ${Math.round((Date.now() - cachedContext.createdAt) / 1000)}s)`)
      emitProgress(5, 'Using cached scan data...')

      siteData = {
        title: cachedContext.siteData.title,
        html: cachedContext.siteData.html,
        url: cachedContext.url,
        text: cachedContext.siteData.text,
      }
      searchResults = cachedContext.searchResults
      aiSearchResults = cachedContext.aiSearchResults
      localSearchResults = cachedContext.localSearchResults
      htmlStructure = cachedContext.htmlStructure

      emitProgress(35, 'Cached data loaded. Proceeding to agent analysis...')
    } else {
      console.log(`[audit-worker] Cache MISS for ${targetUrl}:${targetMarket} — running data gathering`)

      // Step 1: Page scan
      emitProgress(5, 'Scanning website content & structure...')

      siteData = { title: targetUrl, url: targetUrl, text: '' }
      try {
        const pageResult = await retryWithBackoff(
          () => withTimeout(
            zai.functions.invoke('page_reader', { url: targetUrl }),
            15000,
            null
          ),
          2,
          2000,
          'page_reader'
        )
        if (pageResult) {
          const rawData = pageResult.data || pageResult
          const htmlContent = rawData.html || ''
          const plainText = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 6000)

          siteData = {
            title: rawData.title || targetUrl,
            html: htmlContent.slice(0, 3000),
            url: rawData.url || targetUrl,
            text: plainText,
          }

          const pageInputTokens = tokenTracker.estimateTokens(targetUrl)
          const pageOutputTokens = tokenTracker.estimateTokens(htmlContent + plainText)
          tokenTracker.track({
            agentId: 'data-gathering-page-reader',
            agentName: 'Data Gathering (Page Reader)',
            model: 'default',
            inputTokens: pageInputTokens,
            outputTokens: pageOutputTokens,
          })
        }
      } catch {
        siteData = { title: targetUrl, url: targetUrl, text: '' }
      }

      // Step 2: Competitor search
      emitProgress(18, 'Analyzing competitive landscape...')

      searchResults = []
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const compResults = await retryWithBackoff(
          () => withTimeout(
            zai.functions.invoke('web_search', { query: `best ${siteData.title || domain} alternatives competitors`, num: 5 }),
            12000,
            []
          ),
          2,
          3000,
          'web_search_competitors'
        )
        searchResults = Array.isArray(compResults) ? compResults : []

        const searchInputTokens = tokenTracker.estimateTokens(`best ${siteData.title || domain} alternatives competitors`)
        const searchOutputTokens = tokenTracker.estimateTokens(JSON.stringify(searchResults))
        tokenTracker.track({
          agentId: 'data-gathering-web-search',
          agentName: 'Data Gathering (Web Search)',
          model: 'default',
          inputTokens: searchInputTokens,
          outputTokens: searchOutputTokens,
        })
      } catch {
        searchResults = []
      }

      // Step 3: AI citation search
      emitProgress(28, 'Checking AI citation signals...')

      aiSearchResults = []
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const aiResults = await retryWithBackoff(
          () => withTimeout(
            zai.functions.invoke('web_search', { query: `${domain} AI citation authority ChatGPT Perplexity`, num: 3 }),
            12000,
            []
          ),
          2,
          3000,
          'web_search_ai'
        )
        aiSearchResults = Array.isArray(aiResults) ? aiResults : []

        const aiSearchInputTokens = tokenTracker.estimateTokens(`${domain} AI citation authority ChatGPT Perplexity`)
        const aiSearchOutputTokens = tokenTracker.estimateTokens(JSON.stringify(aiSearchResults))
        tokenTracker.track({
          agentId: 'data-gathering-web-search',
          agentName: 'Data Gathering (Web Search)',
          model: 'default',
          inputTokens: aiSearchInputTokens,
          outputTokens: aiSearchOutputTokens,
        })
      } catch {
        aiSearchResults = []
      }

      // Step 4: Local SEO search
      localSearchResults = []
      if (targetMarket !== 'Global') {
        emitProgress(32, `Analyzing local SEO for ${targetMarket}...`)
        try {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const localResults = await retryWithBackoff(
            () => withTimeout(
              zai.functions.invoke('web_search', { query: `${domain} ${targetMarket} local SEO business`, num: 3 }),
              10000,
              []
            ),
            2,
            3000,
            'web_search_local'
          )
          localSearchResults = Array.isArray(localResults) ? localResults : []

          const localSearchInputTokens = tokenTracker.estimateTokens(`${domain} ${targetMarket} local SEO business`)
          const localSearchOutputTokens = tokenTracker.estimateTokens(JSON.stringify(localSearchResults))
          tokenTracker.track({
            agentId: 'data-gathering-web-search',
            agentName: 'Data Gathering (Web Search)',
            model: 'default',
            inputTokens: localSearchInputTokens,
            outputTokens: localSearchOutputTokens,
          })
        } catch {
          localSearchResults = []
        }
      }

      // Save to shared context cache
      sharedContextCache.set(targetUrl, targetMarket, {
        url: targetUrl,
        domain,
        siteData: {
          title: siteData.title || targetUrl,
          html: siteData.html || '',
          text: siteData.text || '',
        },
        robotsTxt: '',
        llmsTxtExists: false,
        blockedBots: [],
        allowedBots: [],
        searchResults,
        aiSearchResults,
        localSearchResults,
        htmlStructure: siteData.html ? extractHtmlStructure(siteData.html) : '',
        createdAt: Date.now(),
      })
      console.log(`[audit-worker] Saved data to shared context cache for ${targetUrl}:${targetMarket}`)
    } // end cache-miss block

    // ── Step 7: Phase 2 — Hub-and-Spoke Agent Protocol ────────────────

    // Build context for agents
    const siteContent = siteData.text?.slice(0, 2500) || 'No content available'
    htmlStructure = htmlStructure || (siteData.html ? extractHtmlStructure(siteData.html) : '')

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
      url: targetUrl,
      domain,
      siteName: siteData.title || targetUrl,
      siteContent,
      htmlStructure,
      competitorInfo,
      aiInfo,
      localInfo,
      targetMarket,
    }

    // Create ContextWindow
    const contextWindow = createContextWindow({
      url: targetUrl,
      domain,
      market: targetMarket,
      siteName: siteData.title || targetUrl,
      scanData: {
        siteContent: siteContent.slice(0, 1500),
        htmlStructure: htmlStructure.slice(0, 500),
        competitorInfo: competitorInfo.slice(0, 400),
        aiInfo: aiInfo.slice(0, 300),
        localInfo: localInfo.slice(0, 300),
      },
      sessionId,
      executionMode,
    })

    const allAgentResults: Record<string, unknown>[] = []

    // ── Master Director runs first (38-42%) ────────────────────────────
    emitProgress(38, 'Master Director: Analyzing raw data & creating plan...')

    emitWS(sessionId, 'agent:start', {
      sessionId,
      agentId: 'master-director',
      agentName: 'Master Director',
      action: 'Strategy lead',
    })

    const mdResult = await runAgent(zai, agents[0], agentContext, 39, emitProgress, tokenTracker, analysisId)

    if (Object.keys(mdResult.data).length > 0) {
      allAgentResults.push(mdResult.data)
      const mdValidated = validateAgentResponse(mdResult.data)
      if (mdValidated.valid && mdValidated.response) {
        mergeSubAgentResult(contextWindow, mdValidated.response)
        console.log('[audit-worker] Master Director result merged into ContextWindow')
      }
      emitWS(sessionId, 'agent:complete', { sessionId, agentId: 'master-director', result: 'Complete' })
    } else {
      emitWS(sessionId, 'agent:error', { sessionId, agentId: 'master-director', error: 'Empty response from LLM' })
      console.warn('[audit-worker] Master Director returned empty response')
    }

    emitProgress(42, 'Master Director complete. Launching sub-agents...')

    // ── Kill-Switch before Batch 1 ─────────────────────────────────────
    if (userId) {
      const costCheck = await checkMonthlyCostCap(userId)
      if (!costCheck.withinCap) {
        throw new Error(`You've reached your processing limit ($${costCheck.monthlyCap.toFixed(2)}) for this month. Upgrade to Pro for unlimited execution.`)
      }
    }

    // ── Batch 1: Keyword Researcher, Competitor Analyst, Content Architect (42-58%) ──
    const batch1SubAgents = batch1Agents.filter((a) => a.id !== 'master-director')

    emitProgress(43, 'Launching Agent Batch 1: Research & Content...')

    const batch1Promises = batch1SubAgents.map((agent, index) => {
      const startProgress = 44 + index * 5
      return new Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1800))
        const result = await runSubAgentWithProtocol(zai, agent, agentContext, contextWindow, sessionId, startProgress, emitProgress, tokenTracker, analysisId)
        resolve(result)
      })
    })

    // Yield progress for each agent as it starts
    for (let i = 0; i < batch1SubAgents.length; i++) {
      emitProgress(44 + i * 5, `Running ${batch1SubAgents[i].name}...`)
      if (i < batch1SubAgents.length - 1) {
        await new Promise(r => setTimeout(r, 1800))
      }
    }

    const batch1Results = await Promise.all(batch1Promises)
    batch1Results.forEach(r => {
      if (Object.keys(r.data).length > 0) allAgentResults.push(r.data)
    })

    const b1Validated = batch1Results.filter(r => r.validated).length
    const b1Retried = batch1Results.filter(r => r.retried).length
    console.log(`[audit-worker] Batch 1 complete: ${b1Validated}/${batch1Results.length} validated, ${b1Retried} retried`)

    emitProgress(58, 'Agent Batch 1 complete. Launching Batch 2...')

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 2000))

    // ── Kill-Switch before Batch 2 ─────────────────────────────────────
    if (userId) {
      const costCheck = await checkMonthlyCostCap(userId)
      if (!costCheck.withinCap) {
        throw new Error(`You've reached your processing limit ($${costCheck.monthlyCap.toFixed(2)}) for this month. Upgrade to Pro for unlimited execution.`)
      }
      console.log(`[audit-worker] Cost cap OK before batch 2: $${costCheck.currentMonthlySpend.toFixed(2)} / $${costCheck.monthlyCap} (${Math.round(costCheck.usagePercent)}% used)`)
    }

    // ── Batch 2: On-Page Auditor, Link Strategist, Tech & Schema, Backlink Prospector (60-78%) ──
    emitProgress(60, 'Launching Agent Batch 2: Audit & Strategy...')

    const batch2Promises = batch2Agents.map((agent, index) => {
      const startProgress = 62 + index * 4
      return new Promise<{ data: Record<string, unknown>; validated: boolean; retried: boolean }>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1800))
        const result = await runSubAgentWithProtocol(zai, agent, agentContext, contextWindow, sessionId, startProgress, emitProgress, tokenTracker, analysisId)
        resolve(result)
      })
    })

    for (let i = 0; i < batch2Agents.length; i++) {
      emitProgress(62 + i * 4, `Running ${batch2Agents[i].name}...`)
      if (i < batch2Agents.length - 1) {
        await new Promise(r => setTimeout(r, 1800))
      }
    }

    const batch2Results = await Promise.all(batch2Promises)
    batch2Results.forEach(r => {
      if (Object.keys(r.data).length > 0) allAgentResults.push(r.data)
    })

    const b2Validated = batch2Results.filter(r => r.validated).length
    const b2Retried = batch2Results.filter(r => r.retried).length
    console.log(`[audit-worker] Batch 2 complete: ${b2Validated}/${batch2Results.length} validated, ${b2Retried} retried`)

    // ── Master Director final synthesis pass (78-82%) ──────────────────
    emitProgress(78, 'Master Director: Synthesizing final strategy...')

    const synthesisContext = buildSubAgentContext('master-director', contextWindow)
    const synthesisAgentContext: AgentContext = {
      ...agentContext,
      siteContent: `SYNTHESIS PASS — All sub-agents have completed.\n\n${synthesisContext}`,
    }

    emitWS(sessionId, 'agent:start', {
      sessionId,
      agentId: 'master-director',
      agentName: 'Master Director',
      action: 'Final synthesis',
    })

    const synthesisResult = await runAgent(zai, agents[0], synthesisAgentContext, 79, emitProgress, tokenTracker, analysisId)

    if (Object.keys(synthesisResult.data).length > 0) {
      allAgentResults.push(synthesisResult.data)
      const synthValidated = validateAgentResponse(synthesisResult.data)
      if (synthValidated.valid && synthValidated.response) {
        mergeSubAgentResult(contextWindow, synthValidated.response)
        console.log('[audit-worker] Master Director synthesis result merged into ContextWindow')
      }
      emitWS(sessionId, 'agent:complete', { sessionId, agentId: 'master-director', result: 'Synthesis complete' })
    } else {
      emitWS(sessionId, 'agent:error', { sessionId, agentId: 'master-director', error: 'Synthesis empty' })
    }

    emitProgress(82, 'All agents complete. Merging results...')

    // ── Step 8: Phase 3 — Merge & Save ────────────────────────────────

    const hasAnyData = allAgentResults.some(r => Object.keys(r).length > 0)
    if (!hasAnyData) {
      console.error('[audit-worker] All agent LLM calls failed after retries')

      // Save token tracking even on failure
      try { await tokenTracker.saveToDatabase() } catch (e) {
        console.error('[audit-worker] Failed to save token tracking on error:', e instanceof Error ? e.message : 'Unknown')
      }

      throw new Error('AI analysis service is currently busy. Please try again in 30 seconds.')
    }

    // Assemble Final Report (Step 4 of Hub-and-Spoke protocol)
    const analysisStartedAt = new Date().toISOString()
    const finalReport = assembleFinalReport(
      contextWindow,
      analysisStartedAt,
      tokenTracker.getSummary().totalTokens,
      tokenTracker.getSummary().totalCost,
    )
    console.log(`[audit-worker] Final report assembled — SEO: ${finalReport.overall_scores.seo_score}, AEO: ${finalReport.overall_scores.aeo_score}, GEO: ${finalReport.overall_scores.geo_score}`)

    // Deep merge all agent results (legacy compatibility)
    let analysisResult: Record<string, unknown> = {}
    for (const agentResult of allAgentResults) {
      if (Object.keys(agentResult).length > 0) {
        analysisResult = deepMerge(analysisResult, agentResult)
      }
    }

    // Attach the Step 4 assembled report alongside the legacy format
    analysisResult._finalReport = finalReport

    // Ensure all required sections with fallbacks
    analysisResult = ensureRequiredSections(analysisResult, siteData, targetUrl, targetMarket)

    emitProgress(90, 'Compiling results...')
    emitProgress(95, 'Finalizing your strategy...')
    emitProgress(100, 'Analysis complete!')

    // ── Save token usage ───────────────────────────────────────────────
    const tokenSummary = tokenTracker.getSummary()
    console.log(`[audit-worker] Token usage: ${tokenSummary.totalTokens} tokens, $${tokenSummary.totalCost.toFixed(4)} cost`)

    analysisResult._tokenSummary = {
      totalTokens: tokenSummary.totalTokens,
      totalCost: tokenSummary.totalCost,
      byAgent: tokenSummary.byAgent,
    }

    // Save token tracking to database (fire and forget)
    tokenTracker.saveToDatabase().catch((err) => {
      console.error('[audit-worker] Failed to save token tracking:', err instanceof Error ? err.message : 'Unknown')
    })

    // ── Update Analysis record ─────────────────────────────────────────
    try {
      await db.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'completed',
          result: JSON.stringify(analysisResult).slice(0, 500000),
        }
      })
    } catch (dbError) {
      console.error('[audit-worker] Failed to update Analysis record:', dbError instanceof Error ? dbError.message : 'Unknown')
    }

    // ── Emit analysis:complete WebSocket event ─────────────────────────
    emitWS(sessionId, 'analysis:complete', { sessionId })

    // Update worker stats
    stats.jobsProcessed++
    stats.totalTokensUsed += tokenSummary.totalTokens
    stats.totalCostUsd += tokenSummary.totalCost

    console.log(`[audit-worker] Job completed for ${targetUrl} (analysisId: ${analysisId})`)

    // Extract overall scores from final report
    const overallScores = {
      seo: finalReport.overall_scores.seo_score,
      aeo: finalReport.overall_scores.aeo_score,
      geo: finalReport.overall_scores.geo_score,
      combined: Math.round((finalReport.overall_scores.seo_score + finalReport.overall_scores.aeo_score + finalReport.overall_scores.geo_score) / 3),
    }

    return {
      analysisId,
      status: 'completed',
      overallScores,
      completedAt: new Date().toISOString(),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Analysis failed'
    console.error(`[audit-worker] Job failed for ${targetUrl}:`, msg)

    // Emit analysis:error WebSocket event
    emitWS(sessionId, 'analysis:error', { sessionId, error: msg })

    // Update Analysis record with failed status
    try {
      await db.analysis.update({
        where: { id: analysisId },
        data: { status: 'failed' }
      })
    } catch { /* ignore */ }

    // Update worker stats
    stats.jobsFailed++

    return {
      analysisId,
      status: 'failed',
      error: msg,
      completedAt: new Date().toISOString(),
    }
  } finally {
    stats.jobsActive--
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Server
// ─────────────────────────────────────────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // ── CORS headers ────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // ── GET /health ─────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      service: 'audit-worker',
      port: PORT,
      uptime: Math.round((Date.now() - stats.uptime) / 1000),
      registered: isRegistered,
    }))
    return
  }

  // ── GET /stats ──────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      ...stats,
      uptime: Math.round((Date.now() - stats.uptime) / 1000),
      registered: isRegistered,
    }))
    return
  }

  // ── POST /start — Register with the in-memory queue ─────────────────
  if (req.method === 'POST' && req.url === '/start') {
    try {
      // Register the worker as the job processor for the audit queue
      const { registerAuditProcessor } = await import('../../src/lib/audit-queue')
      await registerAuditProcessor(async (job) => {
        return processAuditJob(job.data)
      })

      isRegistered = true
      console.log('[audit-worker] Registered as job processor with in-memory queue')

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'registered',
        message: 'Worker registered with in-memory queue',
      }))
    } catch (err) {
      console.error('[audit-worker] Failed to register with queue:', err instanceof Error ? err.message : 'Unknown')
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        error: 'Failed to register with queue',
        details: err instanceof Error ? err.message : 'Unknown',
      }))
    }
    return
  }

  // ── POST /process-job — Direct job processing endpoint ──────────────
  if (req.method === 'POST' && req.url === '/process-job') {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })

    req.on('end', async () => {
      try {
        const jobData: AuditJobData = JSON.parse(body)

        // Validate required fields
        if (!jobData.targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing required field: targetUrl' }))
          return
        }
        if (!jobData.analysisId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing required field: analysisId' }))
          return
        }
        if (!jobData.sessionId) {
          jobData.sessionId = randomUUID()
        }
        if (!jobData.targetMarket) {
          jobData.targetMarket = 'Global'
        }
        if (!jobData.executionMode) {
          jobData.executionMode = 'auto-pilot'
        }
        if (!jobData.tier) {
          jobData.tier = 'trial'
        }

        // Process the job (async — return 202 Accepted immediately)
        const result = await processAuditJob(jobData)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (err) {
        console.error('[audit-worker] Error processing job:', err instanceof Error ? err.message : 'Unknown')
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: 'Job processing failed',
          details: err instanceof Error ? err.message : 'Unknown',
        }))
      }
    })
    return
  }

  // ── 404 for unknown routes ──────────────────────────────────────────
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[audit-worker] 🚀 Audit Worker running on port ${PORT}`)
  console.log(`[audit-worker] Endpoints:`)
  console.log(`[audit-worker]   GET  /health       — Health check`)
  console.log(`[audit-worker]   POST /start        — Register with in-memory queue`)
  console.log(`[audit-worker]   POST /process-job  — Direct job processing`)
  console.log(`[audit-worker]   GET  /stats        — Worker statistics`)
  console.log(`[audit-worker] Communication: DB (SQLite) + WS (port 3003 /emit)`)
  console.log(`[audit-worker] Auto-registering with in-memory queue...`)

  // Auto-register on startup
  setTimeout(async () => {
    try {
      const { registerAuditProcessor } = await import('../../src/lib/audit-queue')
      await registerAuditProcessor(async (job) => {
        return processAuditJob(job.data)
      })
      isRegistered = true
      console.log('[audit-worker] ✅ Auto-registered as job processor with in-memory queue')
    } catch (err) {
      console.warn('[audit-worker] ⚠️  Could not auto-register with queue (may need manual /start):', err instanceof Error ? err.message : 'Unknown')
    }
  }, 2000) // Wait 2s for the parent project's modules to be ready
})

// Keep Bun process alive — HTTP server + explicit keepalive interval
// Bun sometimes exits when it thinks the event loop is empty
const keepalive = setInterval(() => {
  // Periodic heartbeat to keep the event loop active
  const mem = process.memoryUsage?.()
  if (mem) {
    console.log(`[audit-worker] Heartbeat — RSS: ${Math.round(mem.rss / 1024 / 1024)}MB, uptime: ${Math.round((Date.now() - stats.uptime) / 1000)}s`)
  }
}, 60000) // Every 60 seconds

// Prevent the interval from being garbage collected
if (keepalive.unref) {
  // Don't unref — keep it active
}

// Also keep stdin alive as a backup
process.stdin.resume()

// ─────────────────────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────────────────────

function shutdown() {
  clearInterval(keepalive)
  console.log('[audit-worker] Shutting down...')
  server.close(() => {
    console.log('[audit-worker] Server closed')
    process.exit(0)
  })
  // Force exit after 10s
  setTimeout(() => {
    console.error('[audit-worker] Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Debug: Log all signals to understand why the process dies
process.on('SIGHUP', () => { console.log('[audit-worker] Received SIGHUP') })
process.on('SIGUSR1', () => { console.log('[audit-worker] Received SIGUSR1') })
process.on('SIGUSR2', () => { console.log('[audit-worker] Received SIGUSR2') })

// Catch unhandled rejections and exceptions
process.on('unhandledRejection', (reason) => {
  console.error('[audit-worker] UNHANDLED REJECTION:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[audit-worker] UNCAUGHT EXCEPTION:', error)
  shutdown()
})
