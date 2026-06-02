import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

function sendProgress(progress: number, step: string): string {
  return `data: ${JSON.stringify({ type: 'progress', progress, step })}\n\n`
}

function sendComplete(analysis: unknown): string {
  return `data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`
}

function sendError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', message })}\n\n`
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

/**
 * Robust JSON repair for truncated LLM responses.
 * Handles: truncated strings, missing closing braces/brackets, trailing commas, etc.
 */
function repairAndParseJSON(raw: string): Record<string, unknown> {
  // Strategy 1: Remove code fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  let jsonStr = fenceMatch ? fenceMatch[1].trim() : raw

  // Strategy 2: Find outermost braces
  const braceStart = jsonStr.indexOf('{')
  if (braceStart === -1) throw new Error('No JSON object found')
  const braceEnd = jsonStr.lastIndexOf('}')
  jsonStr = jsonStr.slice(braceStart, braceEnd > braceStart ? braceEnd + 1 : jsonStr.length)

  // Strategy 3: Direct parse
  try {
    return JSON.parse(jsonStr)
  } catch {
    // Continue to repair
  }

  // Strategy 4: Fix trailing commas
  try {
    return JSON.parse(jsonStr.replace(/,\s*([}\]])/g, '$1'))
  } catch {
    // Continue to repair
  }

  // Strategy 5: Advanced repair - fix truncated strings and close structures
  let fixed = jsonStr
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/[\x00-\x1f]/g, (ch) => (ch === '\n' || ch === '\r' || ch === '\t' ? ' ' : ''))

  // Fix truncated strings: find unclosed string values and close them
  // Walk character by character to track string state
  let inString = false
  let escape = false
  let lastStringStart = -1
  for (let i = 0; i < fixed.length; i++) {
    const ch = fixed[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      continue
    }
    if (ch === '"') {
      if (inString) {
        inString = false
      } else {
        inString = true
        lastStringStart = i
      }
    }
  }

  // If we're still in a string at the end, it was truncated - close it
  if (inString) {
    fixed = fixed + '"'
  }

  // Remove any trailing partial content after the last complete key-value pair
  // Find the last complete value (number, boolean, null, or closed string/array/object)
  // Simple approach: remove trailing incomplete content

  // Count and close unclosed brackets and braces
  const openBraces = (fixed.match(/{/g) || []).length
  const closeBraces = (fixed.match(/}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/]/g) || []).length

  // Close arrays first, then objects
  fixed += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
  fixed += '}'.repeat(Math.max(0, openBraces - closeBraces))

  // Fix trailing commas again after closures
  fixed = fixed.replace(/,\s*([}\]])/g, '$1')

  try {
    return JSON.parse(fixed)
  } catch {
    // Last resort: try to find the last complete object boundary
    // Walk backwards from the end to find a safe truncation point
    const safeEndPatterns = [
      /\]\s*\}\s*$/,
      /\}\s*\}\s*$/,
      /\]\s*$/,
      /\}\s*$/,
      /"\s*\}\s*$/,
      /\d+\s*\}\s*$/,
      /true\s*\}\s*$/,
      /false\s*\}\s*$/,
      /null\s*\}\s*$/,
    ]

    for (const pattern of safeEndPatterns) {
      const match = fixed.match(pattern)
      if (match && match.index && match.index > fixed.length * 0.5) {
        // Found a safe ending point - try parsing up to there
        // But we need to make sure we close all open structures
        let truncated = fixed.slice(0, match.index + match[0].length)

        // Re-count and close
        const tOpenB = (truncated.match(/{/g) || []).length
        const tCloseB = (truncated.match(/}/g) || []).length
        const tOpenBr = (truncated.match(/\[/g) || []).length
        const tCloseBr = (truncated.match(/]/g) || []).length

        truncated += ']'.repeat(Math.max(0, tOpenBr - tCloseBr))
        truncated += '}'.repeat(Math.max(0, tOpenB - tCloseB))
        truncated = truncated.replace(/,\s*([}\]])/g, '$1')

        try {
          return JSON.parse(truncated)
        } catch {
          continue
        }
      }
    }

    throw new Error('Failed to parse AI response as JSON after repair attempts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, market } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const targetMarket = market || 'Global'

    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (data: string) => {
          controller.enqueue(encoder.encode(data))
        }

        try {
          const ZAI = (await import('z-ai-web-dev-sdk')).default
          const zai = await ZAI.create()

          // ── Phase 1: Gather Data ──────────────────────────────────────
          enqueue(sendProgress(8, 'Phase 1: Scanning your website...'))

          let siteData: { title?: string; html?: string; url?: string; text?: string }
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
                html: htmlContent.slice(0, 2000),
                url: rawData.url || url,
                text: plainText,
              }
            } else {
              siteData = { title: url, url, text: '' }
            }
          } catch {
            siteData = { title: url, url, text: '' }
          }

          enqueue(sendProgress(20, 'Analyzing technical SEO & AEO readiness...'))

          // Step 2: Search for competitor & niche info
          let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
          let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
          let localSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
          try {
            const domain = new URL(url).hostname.replace('www.', '')
            const nicheQuery = `best ${siteData.title || domain} alternatives competitors`
            const results = await withTimeout(
              zai.functions.invoke('web_search', { query: nicheQuery, num: 5 }),
              10000,
              []
            )
            searchResults = Array.isArray(results) ? results : []

            enqueue(sendProgress(30, 'Checking GEO visibility & AI citation landscape...'))

            const aiResults = await withTimeout(
              zai.functions.invoke('web_search', {
                query: `${domain} AI citation authority ChatGPT Perplexity`,
                num: 3,
              }),
              10000,
              []
            )
            aiSearchResults = Array.isArray(aiResults) ? aiResults : []

            if (targetMarket !== 'Global') {
              enqueue(sendProgress(38, `Analyzing local SEO for ${targetMarket}...`))
              const localResults = await withTimeout(
                zai.functions.invoke('web_search', {
                  query: `${domain} ${targetMarket} local SEO business`,
                  num: 3,
                }),
                10000,
                []
              )
              localSearchResults = Array.isArray(localResults) ? localResults : []
            }
          } catch {
            // Continue without search data
          }

          // ── Phase 2: LLM Analysis (2 calls for reliability) ──────────────────
          enqueue(sendProgress(45, 'Phase 2: Running comprehensive analysis...'))

          const siteContent = siteData.text?.slice(0, 3000) || 'No content available'
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
          const auditSystemPrompt = 'You are an elite SEO/AEO/GEO strategist. Respond with ONLY valid JSON. No markdown. No code fences. Be extremely concise - all string values under 12 words. This is critical to avoid truncation.'

          const auditUserPrompt = `Analyze ${url} for market: ${targetMarket}. Title: ${siteData.title}. Content: ${siteContent.slice(0, 1500)}. Competitors: ${competitorInfo.slice(0, 300) || 'None'}. AI: ${aiInfo.slice(0, 200) || 'None'}. Local: ${localInfo.slice(0, 200) || 'None'}.

Return JSON with this EXACT structure. All strings max 12 words. Minimize items:

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

QUANTITY: 2 technicalSEO issues, 1 crawlability, 2 coreVitals, 1 indexation issue, 1 aeoReadiness issue, 1 geoVisibility issue, 1 finding per eeat dimension, 1 finding per geoCitability dimension, 2 aiCrawlerAccess, 1 robotsTxtAnalysis, 2 platformPresence, 1 citationSource, 1 humanizationTip, 1 fillerDetected, 1 originalityIndicator, 1 parasiteRisk finding+rec, 1 localSEO finding per sub, 1 sxo persona+rec.

SCORES: Realistic. Average site: 30-50. Combined = 40%SEO+30%AEO+30%GEO. localSEO.applicable=true if local business.

IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`

          // ── Call 2: Strategy + Creative + Measure ──────────────────
          const strategySystemPrompt = 'You are an elite SEO/AEO/GEO content strategist. Respond with ONLY valid JSON. No markdown. No code fences. Be extremely concise - all string values under 15 words. This is critical to avoid truncation.'

          const strategyUserPrompt = `Create strategy for ${url} (${siteData.title}). Market: ${targetMarket}. Competitors: ${competitorInfo.slice(0, 200) || 'None'}.

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
  "summary": "2-3 sentence summary",
  "executiveActions": ["action1", "action2", "action3", "action4", "action5"]
}

QUANTITY: 2 topicClusters (1 supportingKeyword each), 3 keywordGaps, 2 contentArchitecture recommended, 1 internalLink, 1 schemaRecommendation, 2 contentBriefs (1 structure heading each), 1 onPageOptimization (1 aeoTweak + 1 geoTweak), 2 answerBlocks, 1 KPI per pillar, 1 competitorBenchmark, 3 weeks of weeklyActions (2 tasks each), 5 executiveActions.

IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`

          // Run both LLM calls in parallel
          enqueue(sendProgress(50, 'Running AI analysis engine...'))

          const [auditResult, strategyResult] = await Promise.all([
            zai.chat.completions.create({
              messages: [
                { role: 'system', content: auditSystemPrompt },
                { role: 'user', content: auditUserPrompt },
              ],
            }),
            zai.chat.completions.create({
              messages: [
                { role: 'system', content: strategySystemPrompt },
                { role: 'user', content: strategyUserPrompt },
              ],
            }),
          ])

          // ── Phase 3: Parse & Merge ──────────────────────────────────
          enqueue(sendProgress(75, 'Phase 3: Building your strategy...'))

          const auditRaw = auditResult.choices[0]?.message?.content || ''
          const strategyRaw = strategyResult.choices[0]?.message?.content || ''

          console.log('[analyze] Audit response length:', auditRaw.length)
          console.log('[analyze] Strategy response length:', strategyRaw.length)

          let auditData: Record<string, unknown>
          let strategyData: Record<string, unknown>

          try {
            auditData = repairAndParseJSON(auditRaw)
          } catch (e) {
            console.error('[analyze] Audit JSON parse failed:', e instanceof Error ? e.message : 'Unknown error')
            // Provide minimal fallback audit data
            auditData = {
              siteName: siteData.title || url,
              market: targetMarket,
              overallScores: { seo: 35, aeo: 25, geo: 20, combined: 27 },
              audit: {
                technicalSEO: { score: 35, issues: [{ issue: 'Analysis incomplete', severity: 'warning', fix: 'Try again later' }] },
                crawlability: { score: 40, issues: [{ issue: 'Could not fully analyze', impact: 'Medium' }] },
                pageSpeed: { score: 50, coreVitals: [{ metric: 'LCP', value: 'Unknown', status: 'needs-improvement' }] },
                indexation: { score: 40, indexedPages: 0, orphanPages: 0, issues: ['Could not determine'] },
                aeoReadiness: { score: 25, hasFAQ: false, hasSchema: false, hasStructuredData: false, answerFormatScore: 20, issues: ['Could not fully analyze'] },
                geoVisibility: { score: 20, citedByAI: [], entityRecognition: 15, knowledgeGraphPresence: false, issues: ['Could not fully analyze'] },
              },
              eeat: { overallScore: 30, experience: { score: 30, findings: ['Partial analysis'] }, expertise: { score: 25, findings: ['Partial analysis'] }, authoritativeness: { score: 20, findings: ['Partial analysis'] }, trustworthiness: { score: 35, findings: ['Partial analysis'] }, whoHowWhyTest: { who: 'N/A', how: 'N/A', why: 'N/A' } },
              geoCitability: { overallScore: 25, citabilityScore: { score: 25, weight: 25, findings: ['Partial'] }, structuralReadability: { score: 30, weight: 20, findings: ['Partial'] }, multiModalContent: { score: 20, weight: 15, findings: ['Partial'] }, authorityBrandSignals: { score: 20, weight: 20, findings: ['Partial'] }, technicalAccessibility: { score: 30, weight: 20, findings: ['Partial'] } },
              aiCrawler: { aiCrawlerAccess: [{ bot: 'GPTBot', allowed: true, recommendation: 'Unknown' }, { bot: 'ClaudeBot', allowed: true, recommendation: 'Unknown' }], robotsTxtAnalysis: ['Could not analyze'], llmsTxtPresence: false, jsRenderingDependency: 'medium', ssrVsCsr: 'Unknown' },
              brandMentions: { brandMentionScore: 20, backlinkCorrelation: 'Could not determine', platformPresence: [{ platform: 'Wikipedia', detected: false, strength: 'none' }, { platform: 'Reddit', detected: false, strength: 'none' }], citationSources: [{ engine: 'ChatGPT', topSource: 'Unknown', percentage: 0 }] },
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

          // Merge both results into a single analysis
          const analysisResult = {
            ...auditData,
            ...strategyData,
            // Ensure critical fields from audit take precedence
            siteName: auditData.siteName || strategyData.siteName || siteData.title || url,
            market: targetMarket,
            overallScores: auditData.overallScores || strategyData.overallScores,
            audit: auditData.audit || strategyData.audit,
            url,
          }

          enqueue(sendProgress(90, 'Parsing analysis results...'))
          await new Promise((resolve) => setTimeout(resolve, 200))

          enqueue(sendProgress(95, 'Finalizing your strategy...'))
          await new Promise((resolve) => setTimeout(resolve, 300))

          enqueue(sendProgress(100, 'Analysis complete!'))
          enqueue(sendComplete(analysisResult))
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Analysis failed'
          console.error('[analyze] Error:', msg)
          enqueue(sendError(msg))
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
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
