import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Quick Audit API — "Trojan Horse" Free Scanner
 * Fast, lightweight scan that returns:
 * - GEO Score (0-100)
 * - AEO Score (0-100)
 * - SEO Score (0-100)
 * - Blocked bots list
 * - Quick findings
 * 
 * Does NOT run the full 8-agent analysis — that requires the full trial.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // ── Step 1: Fetch the page ──
    let siteData: { title?: string; html?: string; text?: string } = { title: url, text: '' }
    try {
      const pageResult = await zai.functions.invoke('page_reader', { url })
      if (pageResult) {
        const rawData = pageResult.data || pageResult
        const htmlContent = rawData.html || ''
        const plainText = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 4000)

        siteData = {
          title: rawData.title || url,
          html: htmlContent.slice(0, 2000),
          text: plainText,
        }
      }
    } catch {
      siteData = { title: url, text: '' }
    }

    // ── Step 2: Try to fetch robots.txt ──
    let robotsTxt = ''
    try {
      const robotsResult = await zai.functions.invoke('page_reader', {
        url: `${parsedUrl.origin}/robots.txt`,
      })
      if (robotsResult) {
        const rd = robotsResult.data || robotsResult
        robotsTxt = (rd.html || rd.text || '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000)
      }
    } catch {
      robotsTxt = ''
    }

    // ── Step 3: Check for llms.txt ──
    let llmsTxtExists = false
    try {
      const llmsResult = await zai.functions.invoke('page_reader', {
        url: `${parsedUrl.origin}/llms.txt`,
      })
      if (llmsResult) {
        const ld = llmsResult.data || llmsResult
        const content = (ld.html || ld.text || '').trim()
        llmsTxtExists = content.length > 10
      }
    } catch {
      llmsTxtExists = false
    }

    // ── Step 4: Analyze blocked bots from robots.txt ──
    const aiBots = [
      { bot: 'GPTBot', patterns: ['GPTBot', 'gptbot'] },
      { bot: 'ChatGPT-User', patterns: ['ChatGPT-User', 'chatgpt-user'] },
      { bot: 'ClaudeBot', patterns: ['ClaudeBot', 'claudbot'] },
      { bot: 'PerplexityBot', patterns: ['PerplexityBot', 'perplexity'] },
      { bot: 'Google-Extended', patterns: ['Google-Extended', 'google-extended'] },
      { bot: 'Bytespider', patterns: ['Bytespider', 'bytespider'] },
      { bot: 'FacebookBot', patterns: ['FacebookBot', 'facebookbot'] },
      { bot: 'Applebot-Extended', patterns: ['Applebot-Extended', 'applebot'] },
      { bot: 'CCBot', patterns: ['CCBot', 'ccbot'] },
      { bot: 'cohere-ai', patterns: ['cohere-ai', 'cohere'] },
      { bot: 'Diffbot', patterns: ['Diffbot', 'diffbot'] },
      { bot: 'YouBot', patterns: ['YouBot', 'youbot'] },
    ]

    const blockedBots: { bot: string; blocked: boolean; detail: string }[] = []
    const allowedBots: { bot: string; blocked: boolean; detail: string }[] = []

    for (const aiBot of aiBots) {
      const isBlocked = aiBot.patterns.some(pattern => {
        const botSectionRegex = new RegExp(`User-agent:\\s*${pattern}[\\s\\S]*?(?=User-agent:|$)`, 'gi')
        const botSection = robotsTxt.match(botSectionRegex)
        if (botSection) {
          const hasDisallowAll = botSection.some(section => /Disallow:\s*\/\s*$/im.test(section))
          return hasDisallowAll
        }
        return false
      })

      const entry = { bot: aiBot.bot, blocked: isBlocked, detail: isBlocked ? 'Blocked in robots.txt' : 'Access allowed' }
      if (isBlocked) {
        blockedBots.push(entry)
      } else {
        allowedBots.push(entry)
      }
    }

    // ── Step 5: Quick analysis using LLM ──
    const quickAnalysisPrompt = `You are a fast SEO/AEO/GEO auditor. Analyze this website quickly and return ONLY valid JSON.

Website: ${url}
Domain: ${domain}
Title: ${siteData.title}
Content snippet: ${siteData.text.slice(0, 1500)}
Robots.txt: ${robotsTxt.slice(0, 500) || 'Not found'}
llms.txt present: ${llmsTxtExists}

Return JSON with EXACT structure. All strings max 20 words:
{
  "siteName": "name",
  "scores": { "seo": 1-100, "aeo": 1-100, "geo": 1-100 },
  "quickFindings": {
    "critical": ["finding1", "finding2"],
    "warnings": ["finding1", "finding2"],
    "opportunities": ["opportunity1", "opportunity2"]
  },
  "aeoReadiness": { "hasFAQ": true/false, "hasSchema": true/false, "answerFormatScore": 1-100 },
  "geoReadiness": { "llmsTxtPresent": true/false, "aiCrawlerAccess": "full|partial|blocked", "entityRecognition": 1-100 },
  "topRecommendation": "single most impactful recommendation"
}

SCORES: Be realistic. Average site: SEO 30-50, AEO 20-35, GEO 15-30.
QUANTITY: 2-3 critical, 2-3 warnings, 2-3 opportunities.
IMPORTANT: Return ONLY raw JSON. No code fences.`

    let analysisResult: Record<string, unknown> = {}
    try {
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a fast, accurate SEO/AEO/GEO auditor. Return ONLY valid JSON. No markdown. No code fences. Be concise.' },
          { role: 'user', content: quickAnalysisPrompt },
        ],
      })

      const raw = (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || ''
      
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
      let jsonStr = fenceMatch ? fenceMatch[1].trim() : raw
      const braceStart = jsonStr.indexOf('{')
      const braceEnd = jsonStr.lastIndexOf('}')
      if (braceStart !== -1 && braceEnd > braceStart) {
        jsonStr = jsonStr.slice(braceStart, braceEnd + 1)
      }
      
      try {
        analysisResult = JSON.parse(jsonStr)
      } catch {
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')
        try { analysisResult = JSON.parse(jsonStr) } catch { /* fallback */ }
      }
    } catch (error) {
      console.error('[quick-audit] LLM error:', error instanceof Error ? error.message : 'Unknown')
    }

    // ── Build response ──
    const scores = (analysisResult.scores as Record<string, number>) || { seo: 35, aeo: 25, geo: 20 }
    const quickFindings = (analysisResult.quickFindings as Record<string, string[]>) || {
      critical: ['Could not fully analyze — run full audit for details'],
      warnings: ['Partial scan only'],
      opportunities: ['Run full 8-agent analysis for complete strategy'],
    }
    const aeoReadiness = (analysisResult.aeoReadiness as Record<string, unknown>) || { hasFAQ: false, hasSchema: false, answerFormatScore: 20 }
    const geoReadiness = (analysisResult.geoReadiness as Record<string, unknown>) || { llmsTxtPresent: llmsTxtExists, aiCrawlerAccess: blockedBots.length > 0 ? 'partial' : 'unknown', entityRecognition: 15 }

    return NextResponse.json({
      url,
      domain,
      siteName: (analysisResult.siteName as string) || siteData.title || url,
      scores: {
        seo: Math.max(1, Math.min(100, scores.seo || 35)),
        aeo: Math.max(1, Math.min(100, scores.aeo || 25)),
        geo: Math.max(1, Math.min(100, scores.geo || 20)),
      },
      blockedBots,
      allowedBots,
      quickFindings,
      aeoReadiness,
      geoReadiness,
      llmsTxtPresent: llmsTxtExists,
      topRecommendation: (analysisResult.topRecommendation as string) || 'Run full 8-agent analysis for complete SEO/AEO/GEO strategy',
      fullReportAvailable: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quick audit failed' },
      { status: 500 }
    )
  }
}
