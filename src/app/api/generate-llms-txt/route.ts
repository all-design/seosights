import { NextRequest, NextResponse } from 'next/server'
import { TokenTracker } from '@/lib/token-tracker'
import { randomUUID } from 'crypto'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * llms.txt Generator API
 * Generates both llms.txt (concise) and llms-full.txt (detailed)
 * tailored to the user's website based on analysis data.
 *
 * Now with token & cost tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, siteName, siteContent, analysisData } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')
    const origin = parsedUrl.origin

    const sessionId = randomUUID()
    const tokenTracker = new TokenTracker(sessionId)

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Gather site content if not provided
    let content = siteContent || ''
    let title = siteName || url

    if (!content) {
      try {
        const pageResult = await zai.functions.invoke('page_reader', { url })
        if (pageResult) {
          const rawData = pageResult.data || pageResult
          const htmlContent = rawData.html || ''
          content = htmlContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000)
          title = rawData.title || title
        }

        // Track page_reader data gathering
        tokenTracker.track({
          agentId: 'llms-txt-page-reader',
          agentName: 'llms.txt Generator (Page Reader)',
          model: 'default',
          inputTokens: tokenTracker.estimateTokens(url),
          outputTokens: tokenTracker.estimateTokens(content),
        })
      } catch {
        content = ''
      }
    }

    // If we have analysis data, use it for richer output
    const analysisContext = analysisData
      ? `SEO Score: ${analysisData.overallScores?.seo || 'N/A'}, AEO Score: ${analysisData.overallScores?.aeo || 'N/A'}, GEO Score: ${analysisData.overallScores?.geo || 'N/A'}. Key topics: ${(analysisData.structure?.topicClusters || []).map((c: { cluster: string; pillarKeyword: string }) => c.pillarKeyword || c.cluster).join(', ')}. Schema types recommended: ${(analysisData.structure?.schemaRecommendations || []).map((s: { schemaType: string }) => s.schemaType).join(', ')}.`
      : ''

    // ── Generate llms.txt (concise version) ──
    const llmsTxtSystemPrompt = 'You generate valid llms.txt files following the standard format. Return ONLY markdown content. No code fences.'
    const llmsTxtPrompt = `Generate a valid llms.txt file for this website. The llms.txt standard is a markdown file placed at /llms.txt that helps LLMs understand a website's content.

Website: ${url}
Domain: ${domain}
Title: ${title}
Content: ${content.slice(0, 2000)}
${analysisContext ? `Analysis context: ${analysisContext}` : ''}

The llms.txt format MUST follow this exact structure:
# [Company/Product Name]
> [One-line description of the company/product]

## Info
- [Key information about the company, what they do, their main value proposition]

## URLs
- [URL to main page]: [Brief description]
- [URL to docs/api]: [Brief description]
- [URL to about]: [Brief description]
- [URL to key resource 1]: [Brief description]
- [URL to key resource 2]: [Brief description]

Rules:
1. Start with # heading (the site name)
2. Second line is > blockquote with one-line description
3. ## Info section with bullet points about the company
4. ## URLs section with links and descriptions (use realistic URL paths based on the site)
5. Keep it concise — this is the "concise" version
6. Use REALISTIC URLs based on the domain: ${origin}/path
7. Return ONLY the markdown content, no code fences, no extra text`

    const llmsTxtInputTokens = tokenTracker.estimateTokens(llmsTxtSystemPrompt + llmsTxtPrompt)
    let llmsTxtOutputTokens = 0

    let llmsTxt = ''
    try {
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: llmsTxtSystemPrompt },
          { role: 'user', content: llmsTxtPrompt },
        ],
      })
      llmsTxt = (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || ''
      llmsTxt = llmsTxt.replace(/```(?:markdown|md)?\s*/g, '').replace(/```\s*$/g, '').trim()

      llmsTxtOutputTokens = tokenTracker.estimateTokens(llmsTxt)
      tokenTracker.track({
        agentId: 'llms-txt-generator',
        agentName: 'llms.txt Generator (Concise)',
        model: 'default',
        inputTokens: llmsTxtInputTokens,
        outputTokens: llmsTxtOutputTokens,
      })
    } catch (error) {
      console.error('[generate-llms-txt] llms.txt generation error:', error instanceof Error ? error.message : 'Unknown')
      tokenTracker.trackFailure('llms-txt-generator', 'llms.txt Generator (Concise)', 'default')
    }

    // ── Generate llms-full.txt (detailed version) ──
    const llmsFullTxtSystemPrompt = 'You generate valid llms-full.txt files following the extended standard format. Return ONLY markdown content. No code fences.'
    const llmsFullTxtPrompt = `Generate a valid llms-full.txt file for this website. The llms-full.txt is the extended version of llms.txt with more detailed content that LLMs can use for comprehensive understanding.

Website: ${url}
Domain: ${domain}
Title: ${title}
Content: ${content.slice(0, 3000)}
${analysisContext ? `Analysis context: ${analysisContext}` : ''}

The llms-full.txt format MUST follow this structure:
# [Company/Product Name]
> [One-line description]

## Details
[2-3 paragraphs describing the company/product in detail — what they do, who they serve, their key differentiators, and their technology/approach. This content should be what you'd want an LLM to know when someone asks about this company.]

## Products & Services
- **[Product/Service 1]**: [Detailed description of what it does, key features, and benefits]
- **[Product/Service 2]**: [Detailed description]
- **[Product/Service 3]**: [Detailed description]

## Use Cases
- [Use case 1 with detail]
- [Use case 2 with detail]
- [Use case 3 with detail]

## Technical Details
- [Technical capability 1]
- [Technical capability 2]
- [Integration or API information if relevant]

## URLs
- [${origin}/]: [Detailed description of what's on this page]
- [${origin}/docs or /resources]: [Description]
- [${origin}/about]: [Description]
- [${origin}/pricing]: [Description]
- [${origin}/blog or /articles]: [Description]
- [${origin}/contact]: [Description]

Rules:
1. Start with # heading and > blockquote
2. Include detailed sections with real content (not just bullet points)
3. Use realistic URL paths based on the domain: ${origin}/path
4. Make the content informative enough that an LLM could answer questions about this company
5. Include specific details, not generic filler
6. Return ONLY the markdown content, no code fences, no extra text`

    const llmsFullTxtInputTokens = tokenTracker.estimateTokens(llmsFullTxtSystemPrompt + llmsFullTxtPrompt)
    let llmsFullTxtOutputTokens = 0

    let llmsFullTxt = ''
    try {
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: llmsFullTxtSystemPrompt },
          { role: 'user', content: llmsFullTxtPrompt },
        ],
      })
      llmsFullTxt = (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || ''
      llmsFullTxt = llmsFullTxt.replace(/```(?:markdown|md)?\s*/g, '').replace(/```\s*$/g, '').trim()

      llmsFullTxtOutputTokens = tokenTracker.estimateTokens(llmsFullTxt)
      tokenTracker.track({
        agentId: 'llms-txt-generator',
        agentName: 'llms.txt Generator (Full)',
        model: 'default',
        inputTokens: llmsFullTxtInputTokens,
        outputTokens: llmsFullTxtOutputTokens,
      })
    } catch (error) {
      console.error('[generate-llms-txt] llms-full.txt generation error:', error instanceof Error ? error.message : 'Unknown')
      tokenTracker.trackFailure('llms-txt-generator', 'llms.txt Generator (Full)', 'default')
    }

    // Fallback if LLM failed
    if (!llmsTxt) {
      llmsTxt = `# ${title || domain}
> Website at ${domain}

## Info
- Website: ${url}
- Domain: ${domain}

## URLs
- ${origin}/: Main website
`
    }

    if (!llmsFullTxt) {
      llmsFullTxt = `# ${title || domain}
> Website at ${domain}

## Details
${title || domain} is a website at ${url}. For more information, visit the site directly.

## URLs
- ${origin}/: Main website
`
    }

    // Save token usage to database (fire and forget)
    const tokenSummary = tokenTracker.getSummary()
    console.log(`[generate-llms-txt] Token usage: ${tokenSummary.totalTokens} tokens, $${tokenSummary.totalCost.toFixed(4)} estimated cost`)

    tokenTracker.saveToDatabase().catch((err) => {
      console.error('[generate-llms-txt] Failed to save token tracking:', err instanceof Error ? err.message : 'Unknown')
    })

    return NextResponse.json({
      llmsTxt,
      llmsFullTxt,
      domain,
      url,
      _tokenSummary: {
        totalTokens: tokenSummary.totalTokens,
        totalCost: tokenSummary.totalCost,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'llms.txt generation failed' },
      { status: 500 }
    )
  }
}
