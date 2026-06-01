import { NextRequest, NextResponse } from 'next/server'

async function* analyzeSite(url: string): AsyncGenerator<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()

  const sendProgress = (progress: number, step: string): string => {
    return `data: ${JSON.stringify({ type: 'progress', progress, step })}\n\n`
  }

  const sendComplete = (analysis: unknown): string => {
    return `data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`
  }

  const sendError = (message: string): string => {
    return `data: ${JSON.stringify({ type: 'error', message })}\n\n`
  }

  try {
    // Step 1: Scrape the website
    yield sendProgress(10, 'Scanning your website...')
    let siteData: { title?: string; html?: string; url?: string; text?: string }
    try {
      const pageResult = await zai.functions.invoke('page_reader', { url })
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
    } catch {
      siteData = { title: url, url, text: '' }
    }

    yield sendProgress(25, 'Analyzing content & structure...')

    // Step 2: Search for competitor & niche info
    let searchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
    let aiSearchResults: Array<{ name?: string; url?: string; snippet?: string; host_name?: string }> = []
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      const nicheQuery = `best ${siteData.title || domain} alternatives competitors`
      const results = await zai.functions.invoke('web_search', {
        query: nicheQuery,
        num: 8,
      })
      searchResults = Array.isArray(results) ? results : []

      yield sendProgress(35, 'Checking AI citation landscape...')

      const aiResults = await zai.functions.invoke('web_search', {
        query: `${domain} AI citation SEO authority`,
        num: 5,
      })
      aiSearchResults = Array.isArray(aiResults) ? aiResults : []
    } catch {
      // Continue without search data
    }

    yield sendProgress(50, 'Running AI-powered SEO analysis...')

    // Step 3: LLM - Full SEO Analysis
    const siteContent = siteData.text?.slice(0, 5000) || 'No content available'
    const competitorInfo = searchResults
      .slice(0, 5)
      .map((r) => `${r.name} (${r.host_name}): ${r.snippet}`)
      .join('\n')
    const aiInfo = aiSearchResults
      .slice(0, 3)
      .map((r) => `${r.name}: ${r.snippet}`)
      .join('\n')

    const seoPrompt = `You are an elite AI SEO strategist who specializes in helping websites rank on Google AND get cited by ChatGPT, Claude, and Perplexity. You have deep expertise in backlink strategy, AI citation optimization, and content strategy.

Analyze this website and generate a comprehensive SEO strategy:

**Website URL:** ${url}
**Website Title:** ${siteData.title}
**Website Content (excerpt):**
${siteContent}

**Competitor/Alternative Search Results:**
${competitorInfo || 'No competitor data available'}

**AI Citation Context:**
${aiInfo || 'No AI citation data available'}

Generate a complete analysis as a JSON object with EXACTLY this structure (respond with ONLY valid JSON, no markdown):

{
  "siteName": "string - the website/business name",
  "scores": {
    "overall": number 1-100,
    "aiCitationReadiness": number 1-100,
    "contentQuality": number 1-100,
    "backlinkProfile": number 1-100,
    "technicalSEO": number 1-100,
    "keywordCoverage": number 1-100
  },
  "citationGap": {
    "competitors": [
      {"name": "string", "url": "string", "citedBy": "which AI cites them - e.g. ChatGPT, Claude, Perplexity"}
    ],
    "gapSummary": "string - why competitors are cited instead",
    "fixes": ["string - specific fix 1", "string - specific fix 2", "string - specific fix 3"]
  },
  "keywords": {
    "primary": [
      {"keyword": "string", "volume": "High/Medium/Low", "difficulty": "Hard/Medium/Easy", "opportunity": "string brief why"}
    ],
    "secondary": [
      {"keyword": "string", "volume": "High/Medium/Low", "difficulty": "Hard/Medium/Easy", "opportunity": "string brief why"}
    ]
  },
  "backlinkStrategy": {
    "currentProfile": "string - assessment of current backlink situation",
    "recommendedActions": [
      {"title": "string", "description": "string", "impact": "high/medium/low"}
    ],
    "linkableAssets": ["string - asset type that could earn backlinks"]
  },
  "contentStrategy": {
    "priority": [
      {"title": "string - article title", "type": "blog/guide/tool/infographic/case-study", "targetKeyword": "string", "estimatedImpact": "string"}
    ],
    "contentGaps": ["string - gap description"]
  },
  "roadmap": [
    {
      "phase": "string - Phase name",
      "timeframe": "string - e.g. Week 1-2",
      "tasks": ["string - specific task"]
    }
  ],
  "summary": "string - executive summary of the analysis and top recommendation"
}

Be specific, actionable, and data-driven. Make the scores realistic (not too generous). Generate 4-5 primary keywords, 4-5 secondary keywords, 3-4 competitors, 4-5 backlink actions, 4-5 content priorities, 4-5 linkable assets, 3-4 content gaps, and 3-4 roadmap phases.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are an elite AI SEO strategist who specializes in helping websites rank on Google AND get cited by ChatGPT, Claude, and Perplexity. You have deep expertise in backlink strategy, AI citation optimization, and content strategy. Always respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: seoPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    yield sendProgress(80, 'Parsing analysis results...')

    let analysisResult
    const rawResponse = completion.choices[0]?.message?.content || ''

    let jsonStr = rawResponse
    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    try {
      analysisResult = JSON.parse(jsonStr)
    } catch {
      const braceStart = rawResponse.indexOf('{')
      const braceEnd = rawResponse.lastIndexOf('}')
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonStr = rawResponse.slice(braceStart, braceEnd + 1)
        analysisResult = JSON.parse(jsonStr)
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    analysisResult.url = url

    yield sendProgress(95, 'Finalizing your strategy...')

    await new Promise((resolve) => setTimeout(resolve, 500))

    yield sendProgress(100, 'Analysis complete!')
    yield sendComplete(analysisResult)
  } catch (error) {
    yield sendError(error instanceof Error ? error.message : 'Analysis failed')
  }
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
        for await (const chunk of analyzeSite(url)) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
