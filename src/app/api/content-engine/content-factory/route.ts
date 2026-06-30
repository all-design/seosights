/**
 * Content Engine — Content Factory (Multi-Format Output Generator)
 *
 * POST /api/content-engine/content-factory
 * Takes a briefId and generates all multi-format outputs.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createChatCompletion } from '@/lib/zai'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentFactoryBody {
  briefId: string
  formats: string[]
}

const VALID_FORMATS = [
  'blog',
  'landing_page',
  'case_study',
  'linkedin',
  'twitter_thread',
  'newsletter',
  'docs',
  'vs_page',
]

// ── Format-specific prompts ───────────────────────────────────────────────────

const FORMAT_PROMPTS: Record<string, string> = {
  blog: `Rewrite this content as a comprehensive blog post. Use markdown with proper H2/H3 headings, include an introduction, multiple sections, FAQ, and conclusion. Optimize for SEO with keyword-rich headings and internal link placeholders. Target: 2000-3000 words.`,

  landing_page: `Rewrite this content as a high-converting landing page. Structure with: hero section (headline + subheadline + CTA), problem section, solution section, features/benefits, social proof, FAQ, and final CTA. Use persuasive copy and action-oriented language. Target: 800-1200 words.`,

  case_study: `Rewrite this content as a case study. Structure: executive summary, challenge, solution, implementation, results (with metrics), and key takeaways. Use professional tone with data-driven storytelling. Target: 1500-2000 words.`,

  linkedin: `Rewrite this content as a LinkedIn post. Use a hook line, concise paragraphs, bullet points, and a call-to-action. Keep it professional but conversational. Add relevant hashtags. Target: 300-600 words.`,

  twitter_thread: `Rewrite this content as a Twitter/X thread. Create 8-12 tweets that flow as a narrative. Start with a hook tweet, deliver insights in digestible chunks, end with a summary/CTA tweet. Each tweet under 280 characters. Number each tweet (1/8, 2/8, etc).`,

  newsletter: `Rewrite this content as an email newsletter. Include: subject line, preview text, greeting, main content (scannable with bold key points), and CTA. Use a friendly, expert tone. Target: 500-800 words.`,

  docs: `Rewrite this content as technical documentation. Structure with: overview, prerequisites, step-by-step instructions, code examples (where applicable), API references, and troubleshooting. Use clear, precise language. Target: 1500-2500 words.`,

  vs_page: `Rewrite this content as a comparison/versus page (e.g., "Tool A vs Tool B"). Structure: overview table, detailed comparison sections (features, pricing, pros/cons), use case recommendations, and verdict. Use objective, balanced language. Target: 1500-2000 words.`,
}

// ── POST: Generate multi-format content ───────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContentFactoryBody

    if (!body.briefId) {
      return NextResponse.json(
        { error: 'briefId is required' },
        { status: 400 }
      )
    }

    if (!body.formats || body.formats.length === 0) {
      return NextResponse.json(
        { error: 'formats array is required (at least one format)' },
        { status: 400 }
      )
    }

    const invalidFormats = body.formats.filter((f) => !VALID_FORMATS.includes(f))
    if (invalidFormats.length > 0) {
      return NextResponse.json(
        { error: `Invalid formats: ${invalidFormats.join(', ')}. Valid: ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the brief
    const brief = await db.contentBrief.findUnique({
      where: { id: body.briefId },
      include: {
        articles: {
          where: { format: 'blog' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!brief) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      )
    }

    // Use existing blog article as source if available, otherwise use brief content
    const sourceContent = brief.articles[0]?.content || brief.briefContent || ''
    const sourceTitle = brief.articles[0]?.title || brief.suggestedTitle

    // Generate content for each format
    const generatedArticles: Array<{
      id: string
      title: string
      format: string
      wordCount: number
      status: string
    }> = []

    for (const format of body.formats) {
      const formatPrompt = FORMAT_PROMPTS[format]
      if (!formatPrompt) continue

      try {
        const contentPrompt = `${formatPrompt}

**Source Content:**
Title: ${sourceTitle}
Keyword: ${brief.keywordTarget}
Pillar: ${brief.pillar}
Cluster: ${brief.cluster || 'General'}

**Source Material:**
${sourceContent.substring(0, 6000)}

Generate the adapted content now. Use markdown format.`

        const articleContent = await createChatCompletion([
          {
            role: 'system',
            content: `You are a content adaptation specialist for seosights.com. Transform content across formats while preserving key messages and SEO optimization. Domain: ${DEFAULT_DOMAIN}.`,
          },
          { role: 'user', content: contentPrompt },
        ], { temperature: 0.7 })

        const wordCount = articleContent.split(/\s+/).length

        // Generate format-specific title
        const titleFormats: Record<string, string> = {
          blog: sourceTitle,
          landing_page: `${brief.keywordTarget} — Get Started with seosights`,
          case_study: `Case Study: ${brief.keywordTarget} Success Story`,
          linkedin: sourceTitle,
          twitter_thread: `Thread: ${brief.keywordTarget}`,
          newsletter: `${sourceTitle} — This Week's Deep Dive`,
          docs: `${brief.keywordTarget} — Technical Documentation`,
          vs_page: `${brief.keywordTarget} — Comparison Guide`,
        }

        const title = titleFormats[format] || sourceTitle
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${format}`

        const article = await db.contentArticle.create({
          data: {
            briefId: brief.id,
            domain: DEFAULT_DOMAIN,
            title,
            slug,
            content: articleContent,
            wordCount,
            format,
            pillar: brief.pillar,
            status: 'draft',
          },
        })

        generatedArticles.push({
          id: article.id,
          title: article.title,
          format: article.format,
          wordCount: article.wordCount,
          status: article.status,
        })
      } catch (aiError) {
        console.warn(`[Content Factory] ${format} generation failed:`, aiError)

        // Create a placeholder article
        const fallbackContent = `# ${sourceTitle} (${format})\n\nContent generation for ${format} format is pending. Please regenerate.\n\n**Keyword:** ${brief.keywordTarget}\n**Pillar:** ${brief.pillar}`

        const title = `${sourceTitle} (${format})`
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

        const article = await db.contentArticle.create({
          data: {
            briefId: brief.id,
            domain: DEFAULT_DOMAIN,
            title,
            slug,
            content: fallbackContent,
            wordCount: fallbackContent.split(/\s+/).length,
            format,
            pillar: brief.pillar,
            status: 'draft',
          },
        })

        generatedArticles.push({
          id: article.id,
          title: article.title,
          format: article.format,
          wordCount: article.wordCount,
          status: article.status,
        })
      }
    }

    // Log the decision
    await db.contentDecisionLog.create({
      data: {
        domain: DEFAULT_DOMAIN,
        decisionType: 'auto_publish',
        context: JSON.stringify({
          briefId: body.briefId,
          formats: body.formats,
          articlesCreated: generatedArticles.length,
        }),
        decision: `Content Factory: Generated ${generatedArticles.length} articles in ${body.formats.length} formats`,
        rationale: `Multi-format content generation for brief: ${brief.suggestedTitle}`,
        automated: true,
      },
    })

    // Update KPI
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.contentKPI.upsert({
      where: { domain_date: { domain: DEFAULT_DOMAIN, date: today } },
      create: {
        domain: DEFAULT_DOMAIN,
        date: today,
        contentFactoryOutputs: generatedArticles.length,
      },
      update: {
        contentFactoryOutputs: { increment: generatedArticles.length },
      },
    })

    return NextResponse.json({
      briefId: body.briefId,
      formats: body.formats,
      articles: generatedArticles,
      totalGenerated: generatedArticles.length,
    }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Content Factory] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate multi-format content' },
      { status: 500 }
    )
  }
}
