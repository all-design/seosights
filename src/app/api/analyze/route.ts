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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (data: string) => {
          controller.enqueue(encoder.encode(data))
        }

        try {
          const ZAI = (await import('z-ai-web-dev-sdk')).default
          const zai = await ZAI.create()

          // ── Phase 1: Audit ──────────────────────────────────────────────
          enqueue(sendProgress(10, 'Phase 1: Auditing your site...'))

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
                .slice(0, 8000)

              siteData = {
                title: rawData.title || url,
                html: htmlContent.slice(0, 3000),
                url: rawData.url || url,
                text: plainText,
              }
            } else {
              siteData = { title: url, url, text: '' }
            }
          } catch {
            siteData = { title: url, url, text: '' }
          }

          enqueue(sendProgress(25, 'Analyzing technical SEO & AEO readiness...'))

          // Step 2: Search for competitor & niche info
          let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
          let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
          try {
            const domain = new URL(url).hostname.replace('www.', '')
            const nicheQuery = `best ${siteData.title || domain} alternatives competitors`
            const results = await withTimeout(
              zai.functions.invoke('web_search', { query: nicheQuery, num: 8 }),
              10000,
              []
            )
            searchResults = Array.isArray(results) ? results : []

            enqueue(sendProgress(35, 'Checking GEO visibility & AI citation landscape...'))

            const aiResults = await withTimeout(
              zai.functions.invoke('web_search', {
                query: `${domain} AI citation authority ChatGPT Perplexity`,
                num: 5,
              }),
              10000,
              []
            )
            aiSearchResults = Array.isArray(aiResults) ? aiResults : []
          } catch {
            // Continue without search data
          }

          // ── Phase 2: Structure ──────────────────────────────────────────
          enqueue(sendProgress(50, 'Phase 2: Structuring your strategy...'))

          // Step 3: LLM — Comprehensive SEO / AEO / GEO Analysis
          const siteContent = siteData.text?.slice(0, 5000) || 'No content available'
          const competitorInfo = searchResults
            .slice(0, 5)
            .map((r) => `${r.name} (${r.host_name}): ${r.snippet}`)
            .join('\n')
          const aiInfo = aiSearchResults
            .slice(0, 3)
            .map((r) => `${r.name}: ${r.snippet}`)
            .join('\n')

          const systemPrompt =
            'You are an elite SEO/AEO/GEO strategist specializing in SEO (Google rankings), AEO (featured snippets, voice answers), and GEO (AI citation by ChatGPT, Claude, Perplexity). ALWAYS respond with ONLY valid JSON. No markdown. No code fences. Be concise - keep all string values under 15 words.'

          const userPrompt = `Analyze ${url} across SEO, AEO, GEO pillars. Title: ${siteData.title}. Content: ${siteContent.slice(0, 2000)}. Competitors: ${competitorInfo.slice(0, 500) || 'None'}. AI context: ${aiInfo.slice(0, 300) || 'None'}.

Return JSON with EXACTLY this structure. Keep values SHORT (max 15 words per string). Generate FEWER items to stay within output limits:

{
  "siteName": "name",
  "overallScores": { "seo": 1-100, "aeo": 1-100, "geo": 1-100, "combined": 1-100 },
  "audit": {
    "technicalSEO": { "score": 1-100, "issues": [{ "issue": "short", "severity": "critical|warning|info", "fix": "short fix" }] },
    "crawlability": { "score": 1-100, "issues": [{ "issue": "short", "impact": "short" }] },
    "pageSpeed": { "score": 1-100, "coreVitals": [{ "metric": "LCP|FID|CLS", "value": "est. value", "status": "good|needs-improvement|poor" }] },
    "indexation": { "score": 1-100, "indexedPages": 0, "orphanPages": 0, "issues": ["short"] },
    "aeoReadiness": { "score": 1-100, "hasFAQ": false, "hasSchema": false, "hasStructuredData": false, "answerFormatScore": 1-100, "issues": ["short"] },
    "geoVisibility": { "score": 1-100, "citedByAI": ["ChatGPT"], "entityRecognition": 1-100, "knowledgeGraphPresence": false, "issues": ["short"] }
  },
  "structure": {
    "topicClusters": [{ "cluster": "name", "pillarKeyword": "kw", "supportingKeywords": ["kw1","kw2"], "seoOpportunity": "short", "aeoOpportunity": "short", "geoOpportunity": "short" }],
    "keywordGaps": [{ "keyword": "kw", "volume": "High|Med|Low", "difficulty": "Hard|Med|Easy", "type": "seo|aeo|geo", "opportunity": "short" }],
    "contentArchitecture": { "recommended": [{ "section": "name", "purpose": "short", "pillar": "seo|aeo|geo|all" }], "internalLinkMap": [{ "from": "page", "to": "page", "anchor": "text" }] },
    "schemaRecommendations": [{ "schemaType": "type", "purpose": "short", "pillar": "seo|aeo|geo", "implementation": "short" }]
  },
  "creative": {
    "contentBriefs": [{ "title": "title", "type": "blog|guide|faq|tool|comparison", "targetKeyword": "kw", "pillar": "seo|aeo|geo|all", "brief": "short brief", "estimatedImpact": "short", "wordCount": "1000-2000", "structure": ["H2","H2"] }],
    "onPageOptimizations": [{ "page": "url", "currentTitle": "old", "suggestedTitle": "new", "suggestedDescription": "desc", "aeoTweaks": ["tweak"], "geoTweaks": ["tweak"] }],
    "answerBlocks": [{ "question": "Q?", "suggestedAnswer": "40-60 word answer", "format": "faq|featured-snippet|people-also-ask|knowledge-panel", "targetEngine": "Google|ChatGPT|Perplexity" }]
  },
  "measure": {
    "kpiTracking": {
      "seo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3 months" }],
      "aeo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3 months" }],
      "geo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3 months" }]
    },
    "competitorBenchmarks": [{ "competitor": "name", "url": "url", "seoScore": 1-100, "aeoScore": 1-100, "geoScore": 1-100, "citedBy": ["AI"] }],
    "weeklyActions": [{ "week": "Week 1", "tasks": [{ "task": "short task", "pillar": "seo|aeo|geo", "priority": "high|medium|low" }] }]
  },
  "summary": "2-3 sentence summary",
  "executiveActions": ["action1", "action2", "action3", "action4", "action5"]
}

QUANTITY RULES: 3 technicalSEO issues, 2 crawlability issues, 3 coreVitals, 2 indexation issues, 2 aeoReadiness issues, 2 geoVisibility issues, 3 topicClusters (2 supportingKeywords each), 4 keywordGaps, 3 contentArchitecture recommended, 2 internalLinks, 2 schemaRecommendations, 3 contentBriefs (2 structure headings each), 2 onPageOptimizations (1 aeoTweak + 1 geoTweak each), 3 answerBlocks, 2 KPIs per pillar, 2 competitorBenchmarks, 3 weeks of weeklyActions (3 tasks each), 5 executiveActions.

SCORE RULES: Realistic scores. Average site: 30-50. Combined = 40% SEO + 30% AEO + 30% GEO.

IMPORTANT: Return ONLY raw JSON. No code fences. No extra text. Keep all strings concise.`

          // ── Phase 3: Creative ───────────────────────────────────────────
          enqueue(sendProgress(65, 'Phase 3: Creating content briefs & answer blocks...'))

          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          })

          // ── Phase 4: Measure ────────────────────────────────────────────
          enqueue(sendProgress(80, 'Phase 4: Building measurement framework...'))

          let analysisResult: Record<string, unknown>
          const rawResponse = completion.choices[0]?.message?.content || ''
          console.log('[analyze] Raw response length:', rawResponse.length)

          // Try multiple JSON extraction strategies
          let jsonStr = rawResponse

          // Strategy 1: Remove code fences
          const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim()
          }

          // Strategy 2: Try direct parse
          try {
            analysisResult = JSON.parse(jsonStr)
          } catch (e1) {
            // Strategy 3: Find outermost braces
            const braceStart = rawResponse.indexOf('{')
            const braceEnd = rawResponse.lastIndexOf('}')
            if (braceStart !== -1 && braceEnd !== -1) {
              jsonStr = rawResponse.slice(braceStart, braceEnd + 1)
              try {
                analysisResult = JSON.parse(jsonStr)
              } catch (e2) {
                // Strategy 4: Fix trailing commas
                let fixed = jsonStr.replace(/,\s*([}\]])/g, '$1')
                try {
                  analysisResult = JSON.parse(fixed)
                } catch (e3) {
                  // Strategy 5: Fix unescaped quotes in strings and other common issues
                  fixed = fixed
                    .replace(/\\n/g, ' ')
                    .replace(/\\t/g, ' ')
                    .replace(/[\x00-\x1f]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ' ' : '')
                  // Fix unclosed strings at end (truncation)
                  const openBraces = (fixed.match(/{/g) || []).length
                  const closeBraces = (fixed.match(/}/g) || []).length
                  if (openBraces > closeBraces) {
                    // Add missing closing braces
                    fixed += '}'.repeat(openBraces - closeBraces)
                  }
                  const openBrackets = (fixed.match(/\[/g) || []).length
                  const closeBrackets = (fixed.match(/]/g) || []).length
                  if (openBrackets > closeBrackets) {
                    fixed += ']'.repeat(openBrackets - closeBrackets)
                  }
                  try {
                    analysisResult = JSON.parse(fixed)
                  } catch (e4) {
                    console.error('[analyze] JSON parse failed. Raw length:', rawResponse.length, 'First 200:', rawResponse.slice(0, 200), 'Last 200:', rawResponse.slice(-200))
                    throw new Error('Failed to parse AI response as JSON')
                  }
                }
              }
            } else {
              throw new Error('No JSON object found in AI response')
            }
          }

          analysisResult.url = url

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
