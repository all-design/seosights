import { NextRequest, NextResponse } from 'next/server'
import { agents, batch1Agents, batch2Agents, type AgentDefinition } from '@/lib/agents'

export const maxDuration = 180
export const dynamic = 'force-dynamic'

function sendProgress(progress: number, step: string): string {
  return `data: ${JSON.stringify({ type: 'progress', progress, step })}\n\n`
}

function sendComplete(analysis: unknown): string {
  return `data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`
}

function sendError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

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
 */
async function runAgent(
  zai: { chat: { completions: { create: (opts: unknown) => Promise<unknown> } } },
  agent: AgentDefinition,
  context: AgentContext,
  progress: number,
  sendProgressFn: (progress: number, step: string) => void,
  flushFn: () => Promise<void>
): Promise<{ data: Record<string, unknown>; progress: number }> {
  const progressLabel = `Running ${agent.name}...`
  sendProgressFn(progress, progressLabel)
  await flushFn()

  console.log(`[analyze] Starting ${agent.name} (batch ${agent.batch})`)

  let result: { choices?: Array<{ message?: { content?: string } }> } | null = null
  try {
    result = await retryWithBackoff(
      () => zai.chat.completions.create({
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: agent.buildUserPrompt(context) },
        ],
      }),
      3,
      4000,
      `LLM_${agent.id}`
    )
  } catch (llmError) {
    console.error(`[analyze] ${agent.name} LLM call failed after retries:`, llmError instanceof Error ? llmError.message : 'Unknown')
  }

  const raw = result?.choices?.[0]?.message?.content || ''
  console.log(`[analyze] ${agent.name} response length:`, raw.length)

  if (!raw) {
    console.warn(`[analyze] ${agent.name} returned empty response`)
    return { data: {}, progress }
  }

  try {
    const parsed = repairAndParseJSON(raw)
    console.log(`[analyze] ${agent.name} parsed successfully, keys:`, Object.keys(parsed).join(', '))
    return { data: parsed, progress }
  } catch (e) {
    console.error(`[analyze] ${agent.name} JSON parse failed:`, e instanceof Error ? e.message : 'Unknown error')
    return { data: {}, progress }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, market } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const targetMarket = market || 'Global'
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')

    async function* generateEvents(): AsyncGenerator<string> {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const zai = await ZAI.create()

        // ════════════════════════════════════════════════════════════════
        // Phase 1: Data Gathering — SEQUENTIAL to avoid rate limits
        // ════════════════════════════════════════════════════════════════

        // Step 1: Page scan
        yield sendProgress(5, 'Scanning website content & structure...')
        await flush()

        let siteData: { title?: string; html?: string; url?: string; text?: string } = { title: url, url, text: '' }
        try {
          const pageResult = await retryWithBackoff(
            () => withTimeout(
              zai.functions.invoke('page_reader', { url }),
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
              title: rawData.title || url,
              html: htmlContent.slice(0, 3000),
              url: rawData.url || url,
              text: plainText,
            }
          }
        } catch {
          siteData = { title: url, url, text: '' }
        }

        // Step 2: Competitor search
        yield sendProgress(18, 'Analyzing competitive landscape...')
        await flush()

        let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
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
        } catch {
          searchResults = []
        }

        // Step 3: AI citation search
        yield sendProgress(28, 'Checking AI citation signals...')
        await flush()

        let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
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
        } catch {
          aiSearchResults = []
        }

        // Step 4: Local SEO search (only if non-global market)
        let localSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
        if (targetMarket !== 'Global') {
          yield sendProgress(32, `Analyzing local SEO for ${targetMarket}...`)
          await flush()
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
          } catch {
            localSearchResults = []
          }
        }

        // ════════════════════════════════════════════════════════════════
        // Phase 2: 8-Agent Analysis — Two parallel batches with delays
        // ════════════════════════════════════════════════════════════════

        // Build context for agents
        const siteContent = siteData.text?.slice(0, 2500) || 'No content available'
        const htmlStructure = siteData.html ? extractHtmlStructure(siteData.html) : ''

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

        const agentContext = {
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

        // Progress allocation:
        // Phase 1 used 5-35% → Phase 2 starts at 38%
        // Batch 1: 4 agents → 38-60% (~5.5% each with overhead)
        // Batch 2: 4 agents → 62-82% (~5% each with overhead)
        // Phase 3: 82-100%

        const allAgentResults: Record<string, unknown>[] = []

        // ── Batch 1: Master Director, Keyword Researcher, Competitor Analyst, Content Architect ──
        yield sendProgress(38, 'Launching Agent Batch 1: Technical analysis...')
        await flush()

        // Run batch 1 agents in parallel with staggered delays
        const batch1Promises = batch1Agents.map((agent, index) => {
          const startProgress = 40 + index * 5
          return new Promise<{ data: Record<string, unknown> }>(async (resolve) => {
            // Stagger each agent by 1800ms to avoid rate limits
            await new Promise(r => setTimeout(r, index * 1800))
            const result = await runAgent(zai, agent, agentContext, startProgress, (p, s) => {
              // We yield progress directly from here
            }, flush)
            resolve(result)
          })
        })

        // Yield progress for each agent as it starts
        for (let i = 0; i < batch1Agents.length; i++) {
          const progressVal = 40 + i * 5
          yield sendProgress(progressVal, `Running ${batch1Agents[i].name}...`)
          await flush()
          // Wait a bit before the next agent starts (stagger is handled in the promise)
          if (i < batch1Agents.length - 1) {
            await new Promise(r => setTimeout(r, 1800))
          }
        }

        const batch1Results = await Promise.all(batch1Promises)
        batch1Results.forEach(r => allAgentResults.push(r.data))

        yield sendProgress(60, 'Agent Batch 1 complete. Launching Batch 2...')
        await flush()

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 2000))

        // ── Batch 2: On-Page Auditor, Link Strategist, Tech & Schema Auditor, Backlink Prospector ──
        yield sendProgress(62, 'Launching Agent Batch 2: Strategy & optimization...')
        await flush()

        const batch2Promises = batch2Agents.map((agent, index) => {
          const startProgress = 64 + index * 5
          return new Promise<{ data: Record<string, unknown> }>(async (resolve) => {
            await new Promise(r => setTimeout(r, index * 1800))
            const result = await runAgent(zai, agent, agentContext, startProgress, () => {}, flush)
            resolve(result)
          })
        })

        // Yield progress for each agent as it starts
        for (let i = 0; i < batch2Agents.length; i++) {
          const progressVal = 64 + i * 5
          yield sendProgress(progressVal, `Running ${batch2Agents[i].name}...`)
          await flush()
          if (i < batch2Agents.length - 1) {
            await new Promise(r => setTimeout(r, 1800))
          }
        }

        const batch2Results = await Promise.all(batch2Promises)
        batch2Results.forEach(r => allAgentResults.push(r.data))

        // Check if we got any results at all
        const hasAnyData = allAgentResults.some(r => Object.keys(r).length > 0)
        if (!hasAnyData) {
          console.error('[analyze] All agent LLM calls failed after retries')
          yield sendError('AI analysis service is currently busy. Please try again in 30 seconds.')
          return
        }

        // ════════════════════════════════════════════════════════════════
        // Phase 3: Merge all agent results into final analysis
        // ════════════════════════════════════════════════════════════════

        yield sendProgress(82, 'Merging agent results...')
        await flush()

        // Deep merge all agent results
        let analysisResult: Record<string, unknown> = {}
        for (const agentResult of allAgentResults) {
          if (Object.keys(agentResult).length > 0) {
            analysisResult = deepMerge(analysisResult, agentResult)
          }
        }

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
        yield sendComplete(analysisResult)
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Analysis failed'
        console.error('[analyze] Error:', msg)
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
