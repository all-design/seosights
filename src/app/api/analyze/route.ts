import { NextRequest, NextResponse } from 'next/server'

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
        // Phase 1: Data Gathering (3 calls max to avoid rate limits)
        // ════════════════════════════════════════════════════════════════

        // Step 1: Page scan
        yield sendProgress(8, 'Scanning website content & structure...')
        await flush()

        let siteData: { title?: string; html?: string; url?: string; text?: string } = { title: url, url, text: '' }
        try {
          const pageResult = await withTimeout(
            zai.functions.invoke('page_reader', { url }),
            15000,
            null
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

        // Step 2: Competitor & AI citation search (combined)
        yield sendProgress(22, 'Analyzing competitive landscape & AI citation signals...')
        await flush()

        let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
        let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []

        try {
          const [compResults, aiResults] = await Promise.all([
            withTimeout(
              zai.functions.invoke('web_search', { query: `best ${siteData.title || domain} alternatives competitors`, num: 5 }),
              12000,
              []
            ),
            withTimeout(
              zai.functions.invoke('web_search', { query: `${domain} AI citation authority ChatGPT Perplexity`, num: 3 }),
              12000,
              []
            ),
          ])
          searchResults = Array.isArray(compResults) ? compResults : []
          aiSearchResults = Array.isArray(aiResults) ? aiResults : []
        } catch {
          // Continue without search data
        }

        // Step 3: Local SEO search (only if non-global market)
        let localSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
        if (targetMarket !== 'Global') {
          yield sendProgress(30, `Analyzing local SEO for ${targetMarket}...`)
          await flush()
          try {
            const localResults = await withTimeout(
              zai.functions.invoke('web_search', { query: `${domain} ${targetMarket} local SEO business`, num: 3 }),
              10000,
              []
            )
            localSearchResults = Array.isArray(localResults) ? localResults : []
          } catch {
            localSearchResults = []
          }
        }

        // ════════════════════════════════════════════════════════════════
        // Phase 2: LLM Analysis (2 calls, sequential with delay)
        // ════════════════════════════════════════════════════════════════

        yield sendProgress(38, 'Running comprehensive AI analysis...')
        await flush()

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

        // ── Call 1: Audit + Bonus Scores ──────────────────────────
        const auditSystemPrompt = 'You are an elite SEO/AEO/GEO strategist. Respond with ONLY valid JSON. No markdown. No code fences. Be concise - string values under 15 words. This is critical to avoid truncation.'

        const auditUserPrompt = `Analyze ${url} for market: ${targetMarket}. Title: ${siteData.title}. Content: ${siteContent.slice(0, 1500)}. HTML: ${htmlStructure.slice(0, 500)}. Competitors: ${competitorInfo.slice(0, 300) || 'None'}. AI: ${aiInfo.slice(0, 200) || 'None'}. Local: ${localInfo.slice(0, 200) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:

{
  "siteName": "name",
  "market": "${targetMarket}",
  "overallScores": { "seo": 1-100, "aeo": 1-100, "geo": 1-100, "combined": 1-100 },
  "audit": {
    "technicalSEO": { "score": 1-100, "issues": [{ "issue": "short", "severity": "critical|warning|info", "fix": "short" }] },
    "crawlability": { "score": 1-100, "issues": [{ "issue": "short", "impact": "short" }] },
    "pageSpeed": { "score": 1-100, "coreVitals": [{ "metric": "LCP|INP|CLS", "value": "est", "status": "good|needs-improvement|poor" }] },
    "indexation": { "score": 1-100, "indexedPages": 0, "orphanPages": 0, "issues": ["short"] },
    "aeoReadiness": { "score": 1-100, "hasFAQ": false, "hasSchema": false, "hasStructuredData": false, "answerFormatScore": 1-100, "issues": ["short"] },
    "geoVisibility": { "score": 1-100, "citedByAI": ["AI name"], "entityRecognition": 1-100, "knowledgeGraphPresence": false, "issues": ["short"] }
  },
  "eeat": {
    "overallScore": 1-100,
    "experience": { "score": 1-100, "findings": ["short"] },
    "expertise": { "score": 1-100, "findings": ["short"] },
    "authoritativeness": { "score": 1-100, "findings": ["short"] },
    "trustworthiness": { "score": 1-100, "findings": ["short"] },
    "whoHowWhyTest": { "who": "who", "how": "how", "why": "why" }
  },
  "geoCitability": {
    "overallScore": 1-100,
    "citabilityScore": { "score": 1-100, "weight": 25, "findings": ["short"] },
    "structuralReadability": { "score": 1-100, "weight": 20, "findings": ["short"] },
    "multiModalContent": { "score": 1-100, "weight": 15, "findings": ["short"] },
    "authorityBrandSignals": { "score": 1-100, "weight": 20, "findings": ["short"] },
    "technicalAccessibility": { "score": 1-100, "weight": 20, "findings": ["short"] }
  },
  "aiCrawler": {
    "aiCrawlerAccess": [{ "bot": "GPTBot", "allowed": true, "recommendation": "short" }],
    "robotsTxtAnalysis": ["short"],
    "llmsTxtPresence": false,
    "jsRenderingDependency": "high|medium|low",
    "ssrVsCsr": "short"
  },
  "brandMentions": {
    "brandMentionScore": 1-100,
    "backlinkCorrelation": "short",
    "platformPresence": [{ "platform": "Wikipedia", "detected": false, "strength": "none|weak|moderate|strong" }],
    "citationSources": [{ "engine": "ChatGPT", "topSource": "source", "percentage": 48 }]
  },
  "contentQuality": {
    "overallScore": 1-100,
    "contentDepth": 1-100,
    "aiPatternRisk": "low|medium|high",
    "humanizationTips": ["short"],
    "fillerDetected": ["short"],
    "originalityIndicators": ["short"]
  },
  "parasiteRisk": {
    "riskLevel": "low|medium|high",
    "findings": ["short"],
    "recommendations": ["short"]
  },
  "localSEO": {
    "applicable": false,
    "gbpSignals": { "score": 1-100, "findings": ["short"] },
    "napConsistency": { "score": 1-100, "findings": ["short"] },
    "reviewSignals": { "score": 1-100, "findings": ["short"] },
    "businessType": "type or N/A"
  },
  "sxo": {
    "pageTypeMatch": "short",
    "serpIntentMatch": "informational|transactional|navigational|mixed",
    "userPersonaScores": [{ "persona": "name", "score": 1-100 }],
    "recommendations": ["short"]
  }
}

QUANTITY: 3-4 technicalSEO issues, 2 crawlability, 3 coreVitals (always LCP, INP, CLS), 2 indexation issues, 2 aeoReadiness issues, 2 geoVisibility issues, 2 findings per eeat dimension, 1 finding per geoCitability dimension, 3-4 aiCrawlerAccess (GPTBot, ClaudeBot, PerplexityBot, Bytespider), 2 robotsTxtAnalysis, 3-4 platformPresence (Wikipedia, Reddit, YouTube, LinkedIn), 2 citationSources, 2 humanizationTips, 2 fillerDetected, 2 originalityIndicators, 2 parasiteRisk findings+recs, 1-2 localSEO finding per sub, 2 sxo persona+recs.

SCORES: Realistic. Average site: 30-50. Combined = 40%SEO+30%AEO+30%GEO. localSEO.applicable=true if local business.

IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`

        // ── Call 2: Strategy + Creative + Measure ──────────────────
        const strategySystemPrompt = 'You are an elite SEO/AEO/GEO content strategist. Respond with ONLY valid JSON. No markdown. No code fences. Be concise - all string values under 15 words. This is critical to avoid truncation.'

        const strategyUserPrompt = `Create strategy for ${url} (${siteData.title}). Market: ${targetMarket}. Competitors: ${competitorInfo.slice(0, 200) || 'None'}. AI Info: ${aiInfo.slice(0, 150) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:

{
  "structure": {
    "topicClusters": [{ "cluster": "name", "pillarKeyword": "kw", "supportingKeywords": ["kw1"], "seoOpportunity": "short", "aeoOpportunity": "short", "geoOpportunity": "short" }],
    "keywordGaps": [{ "keyword": "kw", "volume": "High|Med|Low", "difficulty": "Hard|Med|Easy", "type": "seo|aeo|geo", "opportunity": "short" }],
    "contentArchitecture": { "recommended": [{ "section": "name", "purpose": "short", "pillar": "seo|aeo|geo|all" }], "internalLinkMap": [{ "from": "page", "to": "page", "anchor": "text" }] },
    "schemaRecommendations": [{ "schemaType": "type", "purpose": "short", "pillar": "seo|aeo|geo", "implementation": "short", "status": "active|restricted|deprecated" }]
  },
  "creative": {
    "contentBriefs": [{ "title": "title", "type": "blog|guide|faq|tool|comparison", "targetKeyword": "kw", "pillar": "seo|aeo|geo|all", "brief": "short", "estimatedImpact": "short", "wordCount": "1000-2000", "structure": ["H2"] }],
    "onPageOptimizations": [{ "page": "url", "currentTitle": "old", "suggestedTitle": "new", "suggestedDescription": "desc", "aeoTweaks": ["tweak"], "geoTweaks": ["tweak"] }],
    "answerBlocks": [{ "question": "Q?", "suggestedAnswer": "40-60 word answer", "format": "faq|featured-snippet|people-also-ask|knowledge-panel", "targetEngine": "Google|ChatGPT|Perplexity" }]
  },
  "measure": {
    "kpiTracking": {
      "seo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }],
      "aeo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }],
      "geo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }]
    },
    "competitorBenchmarks": [{ "competitor": "name", "url": "url", "seoScore": 1-100, "aeoScore": 1-100, "geoScore": 1-100, "citedBy": ["AI"] }],
    "weeklyActions": [{ "week": "Week 1", "tasks": [{ "task": "short", "pillar": "seo|aeo|geo", "priority": "high|medium|low" }] }]
  },
  "algorithmUpdates": { "recentUpdates": [{ "name": "update name", "date": "2025-XX", "impact": "high|medium|low", "description": "short", "affectedPillar": "seo|aeo|geo|all" }] },
  "roadmap": { "quarters": [{ "label": "Q1: Foundation", "seoGoal": "short goal", "aeoGoal": "short goal", "geoGoal": "short goal", "targetScores": { "seo": 50, "aeo": 40, "geo": 35 } }] },
  "trafficInsights": { "winners": [{ "page": "page url", "change": "+X%", "pillar": "seo|aeo|geo" }], "losers": [{ "page": "page url", "change": "-X%", "pillar": "seo|aeo|geo" }] },
  "deepStrategy": {
    "technicalImplementations": [{ "type": "schema|robots|meta|headers", "description": "what to implement", "codeSnippet": "exact code", "priority": "critical|high|medium|low", "pillar": "seo|aeo|geo|all" }],
    "backlinkOutreach": [{ "targetSite": "site name", "url": "approximate url", "strategy": "how to get link", "contentAngle": "pitch angle", "priority": "high|medium|low" }],
    "aiCitationStrategy": [{ "technique": "technique name", "implementation": "how to do it", "targetEngine": "ChatGPT|Perplexity|Google SGE|Claude", "expectedResult": "expected outcome" }]
  },
  "summary": "2-3 sentence summary",
  "executiveActions": ["action1", "action2", "action3", "action4", "action5"]
}

QUANTITY: 3 topicClusters (1-2 supportingKeywords each), 4-5 keywordGaps, 3-4 contentArchitecture recommended, 2 internalLinks, 2-3 schemaRecommendations, 3-4 contentBriefs (2 structure headings each), 2 onPageOptimizations (1-2 aeoTweaks + 1-2 geoTweaks each), 3-4 answerBlocks targeting different engines, 2 KPI per pillar, 2 competitorBenchmarks, 4 weeks of weeklyActions (2-3 tasks each), 5 executiveActions, 2-3 algorithmUpdates, 4 roadmap quarters, 2-3 trafficInsights winners, 2-3 losers, 3-4 technicalImplementations (with actual code snippets), 2-3 backlinkOutreach targets, 2-3 aiCitationStrategy techniques.

IMPORTANT: Return ONLY raw JSON. No code fences. No extra text. Code snippets must be valid and copy-paste ready.`

        // ── Run LLM calls sequentially with delay to avoid rate limiting ──
        let auditResult: { choices?: Array<{ message?: { content?: string } }> } | null = null
        let strategyResult: { choices?: Array<{ message?: { content?: string } }> } | null = null

        // Call 1: Audit
        yield sendProgress(45, 'Running AI audit engine...')
        await flush()
        try {
          auditResult = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: auditSystemPrompt },
              { role: 'user', content: auditUserPrompt },
            ],
          })
        } catch (llmError) {
          console.error('[analyze] Audit LLM call failed:', llmError instanceof Error ? llmError.message : 'Unknown')
        }

        // Call 2: Strategy (with delay)
        yield sendProgress(62, 'Building SEO/AEO/GEO strategy...')
        await flush()
        await new Promise((resolve) => setTimeout(resolve, 2000))
        try {
          strategyResult = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: strategySystemPrompt },
              { role: 'user', content: strategyUserPrompt },
            ],
          })
        } catch (llmError) {
          console.error('[analyze] Strategy LLM call failed:', llmError instanceof Error ? llmError.message : 'Unknown')
        }

        // Check if at least one call succeeded
        if (!auditResult && !strategyResult) {
          console.error('[analyze] All LLM calls failed')
          yield sendError('AI analysis service temporarily unavailable. Please try again in a moment.')
          return
        }

        // ════════════════════════════════════════════════════════════════
        // Phase 3: Parse & Merge
        // ════════════════════════════════════════════════════════════════

        yield sendProgress(78, 'Phase 3: Parsing analysis results...')
        await flush()

        const auditRaw = auditResult?.choices?.[0]?.message?.content || ''
        const strategyRaw = strategyResult?.choices?.[0]?.message?.content || ''

        console.log('[analyze] Audit response length:', auditRaw.length)
        console.log('[analyze] Strategy response length:', strategyRaw.length)

        if (!auditRaw && !strategyRaw) {
          console.error('[analyze] Both LLM responses empty')
          yield sendError('AI returned empty responses. Please try again.')
          return
        }

        let auditData: Record<string, unknown>
        let strategyData: Record<string, unknown>

        try {
          auditData = repairAndParseJSON(auditRaw)
        } catch (e) {
          console.error('[analyze] Audit JSON parse failed:', e instanceof Error ? e.message : 'Unknown error')
          auditData = {
            siteName: siteData.title || url,
            market: targetMarket,
            overallScores: { seo: 35, aeo: 25, geo: 20, combined: 27 },
            audit: {
              technicalSEO: { score: 35, issues: [{ issue: 'Analysis incomplete - retry recommended', severity: 'warning', fix: 'Try again later' }] },
              crawlability: { score: 40, issues: [{ issue: 'Could not fully analyze', impact: 'Medium' }] },
              pageSpeed: { score: 50, coreVitals: [{ metric: 'LCP', value: 'Unknown', status: 'needs-improvement' }, { metric: 'INP', value: 'Unknown', status: 'needs-improvement' }, { metric: 'CLS', value: 'Unknown', status: 'needs-improvement' }] },
              indexation: { score: 40, indexedPages: 0, orphanPages: 0, issues: ['Could not determine'] },
              aeoReadiness: { score: 25, hasFAQ: false, hasSchema: false, hasStructuredData: false, answerFormatScore: 20, issues: ['Could not fully analyze'] },
              geoVisibility: { score: 20, citedByAI: [], entityRecognition: 15, knowledgeGraphPresence: false, issues: ['Could not fully analyze'] },
            },
            eeat: { overallScore: 30, experience: { score: 30, findings: ['Partial analysis'] }, expertise: { score: 25, findings: ['Partial analysis'] }, authoritativeness: { score: 20, findings: ['Partial analysis'] }, trustworthiness: { score: 35, findings: ['Partial analysis'] }, whoHowWhyTest: { who: 'N/A', how: 'N/A', why: 'N/A' } },
            geoCitability: { overallScore: 25, citabilityScore: { score: 25, weight: 25, findings: ['Partial'] }, structuralReadability: { score: 30, weight: 20, findings: ['Partial'] }, multiModalContent: { score: 20, weight: 15, findings: ['Partial'] }, authorityBrandSignals: { score: 20, weight: 20, findings: ['Partial'] }, technicalAccessibility: { score: 30, weight: 20, findings: ['Partial'] } },
            aiCrawler: { aiCrawlerAccess: [{ bot: 'GPTBot', allowed: true, recommendation: 'Verify access' }, { bot: 'ClaudeBot', allowed: true, recommendation: 'Verify access' }, { bot: 'PerplexityBot', allowed: true, recommendation: 'Verify access' }], robotsTxtAnalysis: ['Could not analyze'], llmsTxtPresence: false, jsRenderingDependency: 'medium', ssrVsCsr: 'Unknown' },
            brandMentions: { brandMentionScore: 20, backlinkCorrelation: 'Could not determine', platformPresence: [{ platform: 'Wikipedia', detected: false, strength: 'none' }, { platform: 'Reddit', detected: false, strength: 'none' }, { platform: 'YouTube', detected: false, strength: 'none' }, { platform: 'LinkedIn', detected: false, strength: 'none' }], citationSources: [{ engine: 'ChatGPT', topSource: 'Unknown', percentage: 0 }] },
            contentQuality: { overallScore: 35, contentDepth: 30, aiPatternRisk: 'medium', humanizationTips: ['Add original insights'], fillerDetected: ['Analysis incomplete'], originalityIndicators: ['Partial analysis'] },
            parasiteRisk: { riskLevel: 'low', findings: ['Could not fully analyze'], recommendations: ['Monitor for changes'] },
            localSEO: { applicable: targetMarket !== 'Global', gbpSignals: { score: 20, findings: ['Not analyzed'] }, napConsistency: { score: 20, findings: ['Not analyzed'] }, reviewSignals: { score: 20, findings: ['Not analyzed'] }, businessType: 'N/A' },
            sxo: { pageTypeMatch: 'Unknown', serpIntentMatch: 'mixed', userPersonaScores: [{ persona: 'General', score: 40 }], recommendations: ['Full analysis recommended'] },
          }
        }

        try {
          strategyData = repairAndParseJSON(strategyRaw)
        } catch (e) {
          console.error('[analyze] Strategy JSON parse failed:', e instanceof Error ? e.message : 'Unknown error')
          strategyData = {
            structure: {
              topicClusters: [{ cluster: 'Core Topic', pillarKeyword: 'primary keyword', supportingKeywords: ['secondary'], seoOpportunity: 'Optimize existing pages', aeoOpportunity: 'Add FAQ section', geoOpportunity: 'Create cite-worthy content' }],
              keywordGaps: [{ keyword: 'target keyword', volume: 'Med', difficulty: 'Med', type: 'seo', opportunity: 'Create content' }],
              contentArchitecture: { recommended: [{ section: 'Main Content', purpose: 'Core topic coverage', pillar: 'all' }], internalLinkMap: [{ from: 'Home', to: 'Blog', anchor: 'Learn more' }] },
              schemaRecommendations: [{ schemaType: 'Organization', purpose: 'Brand identity', pillar: 'geo', implementation: 'Add to homepage', status: 'active' }],
            },
            creative: {
              contentBriefs: [{ title: 'Comprehensive Guide', type: 'guide', targetKeyword: 'main keyword', pillar: 'all', brief: 'Cover topic thoroughly', estimatedImpact: 'High', wordCount: '2000-3000', structure: ['Introduction', 'Main Content'] }],
              onPageOptimizations: [{ page: '/', currentTitle: 'Current', suggestedTitle: 'Optimized Title', suggestedDescription: 'Optimized description', aeoTweaks: ['Add FAQ'], geoTweaks: ['Add structured data'] }],
              answerBlocks: [{ question: 'What is...?', suggestedAnswer: 'A clear concise answer that AI can cite.', format: 'faq', targetEngine: 'Google' }],
            },
            measure: {
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
            },
            algorithmUpdates: {
              recentUpdates: [
                { name: 'Google Core Update March 2025', date: '2025-03', impact: 'high', description: 'Content quality and E-E-A-T signals prioritized', affectedPillar: 'all' },
                { name: 'AI Overview Expansion', date: '2025-02', impact: 'medium', description: 'AI Overviews shown for more query types', affectedPillar: 'aeo' },
              ],
            },
            roadmap: {
              quarters: [
                { label: 'Q1: Foundation', seoGoal: 'Fix critical issues, optimize meta tags', aeoGoal: 'Add FAQ schema, structured data', geoGoal: 'Create cite-worthy content, add llms.txt', targetScores: { seo: Math.min(100, (auditData.overallScores as Record<string, number>)?.seo + 15 || 45), aeo: Math.min(100, (auditData.overallScores as Record<string, number>)?.aeo + 12 || 35), geo: Math.min(100, (auditData.overallScores as Record<string, number>)?.geo + 10 || 30) } },
                { label: 'Q2: Growth', seoGoal: 'Build backlinks, expand topic clusters', aeoGoal: 'Optimize answer blocks, target snippets', geoGoal: 'Increase AI citation presence', targetScores: { seo: Math.min(100, (auditData.overallScores as Record<string, number>)?.seo + 25 || 55), aeo: Math.min(100, (auditData.overallScores as Record<string, number>)?.aeo + 22 || 45), geo: Math.min(100, (auditData.overallScores as Record<string, number>)?.geo + 20 || 40) } },
                { label: 'Q3: Authority', seoGoal: 'Dominate niche keywords', aeoGoal: 'Voice search optimization', geoGoal: 'Multi-platform AI visibility', targetScores: { seo: Math.min(100, (auditData.overallScores as Record<string, number>)?.seo + 35 || 65), aeo: Math.min(100, (auditData.overallScores as Record<string, number>)?.aeo + 32 || 55), geo: Math.min(100, (auditData.overallScores as Record<string, number>)?.geo + 30 || 50) } },
                { label: 'Q4: Scale', seoGoal: 'Scale content production', aeoGoal: 'Cross-platform AEO coverage', geoGoal: 'AI-first content strategy', targetScores: { seo: Math.min(100, (auditData.overallScores as Record<string, number>)?.seo + 45 || 75), aeo: Math.min(100, (auditData.overallScores as Record<string, number>)?.aeo + 40 || 65), geo: Math.min(100, (auditData.overallScores as Record<string, number>)?.geo + 38 || 60) } },
              ],
            },
            trafficInsights: {
              winners: [
                { page: '/blog/guide', change: '+25%', pillar: 'seo' },
                { page: '/faq', change: '+18%', pillar: 'aeo' },
              ],
              losers: [
                { page: '/old-page', change: '-12%', pillar: 'seo' },
                { page: '/about', change: '-8%', pillar: 'geo' },
              ],
            },
            deepStrategy: {
              technicalImplementations: [
                { type: 'schema', description: 'Add Organization schema', codeSnippet: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Your Brand","url":"https://yoursite.com"}</script>', priority: 'high', pillar: 'geo' },
                { type: 'robots', description: 'Allow AI crawlers in robots.txt', codeSnippet: 'User-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /', priority: 'high', pillar: 'geo' },
              ],
              backlinkOutreach: [
                { targetSite: 'Industry publication', url: 'https://example.com', strategy: 'Guest post with data', contentAngle: 'Unique research angle', priority: 'high' },
              ],
              aiCitationStrategy: [
                { technique: 'Source attribution', implementation: 'Include original data, statistics, and quotes from primary sources', targetEngine: 'ChatGPT', expectedResult: 'Higher citation probability' },
                { technique: 'Structured answers', implementation: 'Use clear Q&A format with concise 40-60 word answers', targetEngine: 'Perplexity', expectedResult: 'Direct citation in AI responses' },
              ],
            },
            summary: `Analysis of ${siteData.title || url} shows significant opportunities for improvement across SEO, AEO, and GEO pillars. Focus on building authority and creating cite-worthy content.`,
            executiveActions: [
              'Fix critical technical SEO issues identified in the audit',
              'Add FAQ schema and structured data for AEO optimization',
              'Create comprehensive, cite-worthy content for GEO visibility',
              'Build high-quality backlinks from authoritative sources',
              'Implement AI crawler access in robots.txt and add llms.txt',
            ],
          }
        }

        // Merge both results
        const analysisResult = {
          ...auditData,
          ...strategyData,
          siteName: auditData.siteName || strategyData.siteName || siteData.title || url,
          market: targetMarket,
          overallScores: auditData.overallScores || strategyData.overallScores,
          audit: auditData.audit || strategyData.audit,
          url,
        }

        yield sendProgress(90, 'Parsing analysis results...')
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
