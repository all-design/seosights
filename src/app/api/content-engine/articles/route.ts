/**
 * Content Engine — Articles
 *
 * GET  /api/content-engine/articles   — List articles with filtering
 * POST /api/content-engine/articles   — Create article from brief (uses AI to write full content)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createChatCompletion } from '@/lib/zai'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateArticleBody {
  briefId: string
  format?: string
  title?: string
}

// ── GET: List articles ────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const status = searchParams.get('status') || undefined
    const format = searchParams.get('format') || undefined
    const briefId = searchParams.get('briefId') || undefined
    const pillar = searchParams.get('pillar') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { domain }
    if (status) where.status = status
    if (format) where.format = format
    if (briefId) where.briefId = briefId
    if (pillar) where.pillar = pillar

    const [articles, total] = await Promise.all([
      db.contentArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          brief: {
            select: {
              id: true,
              topic: true,
              pillar: true,
              cluster: true,
              keywordTarget: true,
            },
          },
          _count: { select: { reviews: true } },
        },
      }),
      db.contentArticle.count({ where }),
    ])

    return NextResponse.json({ articles, total })
  } catch (error) {
    console.error('[Content Engine Articles] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list articles' },
      { status: 500 }
    )
  }
}

// ── POST: Create article from brief ───────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateArticleBody

    if (!body.briefId) {
      return NextResponse.json(
        { error: 'briefId is required' },
        { status: 400 }
      )
    }

    const validFormats = ['blog', 'landing_page', 'case_study', 'linkedin', 'twitter_thread', 'newsletter', 'docs', 'vs_page']
    if (body.format && !validFormats.includes(body.format)) {
      return NextResponse.json(
        { error: `format must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the brief
    const brief = await db.contentBrief.findUnique({
      where: { id: body.briefId },
    })

    if (!brief) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      )
    }

    // Update brief status to in_progress
    await db.contentBrief.update({
      where: { id: brief.id },
      data: { status: 'in_progress' },
    })

    const format = body.format || 'blog'
    const title = body.title || brief.suggestedTitle

    // Parse briefContent for context
    let briefContext = ''
    try {
      const parsed = JSON.parse(brief.briefContent || '{}')
      briefContext = JSON.stringify(parsed, null, 2)
    } catch {
      briefContext = brief.briefContent || 'No structured brief available'
    }

    // Generate the full article using AI
    const articlePrompt = `You are an expert content writer specializing in SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

Write a complete, publication-ready article based on this editorial brief:

**Title:** ${title}
**Target Keyword:** ${brief.keywordTarget}
**Pillar:** ${brief.pillar}
**Format:** ${format}
**Target Word Count:** ${brief.targetWordCount}
**Cluster:** ${brief.cluster || 'General'}

**Editorial Brief:**
${briefContext}

Requirements:
1. Write in markdown format
2. Use proper H2 (##) and H3 (###) headings following the outline
3. Naturally incorporate the target keyword "${brief.keywordTarget}" and related entities
4. Include FAQ section with question-based headings (## FAQ) and concise answer blocks
5. Add internal link placeholders like [Internal: anchor text](/suggested/path)
6. Optimize for AI citation: use clear, factual statements and define key terms
7. Include a compelling introduction and actionable conclusion
8. For "${format}" format, adjust tone and structure accordingly
9. Add schema-friendly markup hints where applicable
10. Ensure E-E-A-T signals: cite experience, provide evidence, show expertise

Write the complete article now:`

    let articleContent: string
    try {
      articleContent = await createChatCompletion([
        {
          role: 'system',
          content: `You are a senior content writer for seosights.com, an AI-powered SEO/AEO/GEO platform. Write authoritative, data-driven content that ranks in both traditional search and AI search engines. Domain: ${DEFAULT_DOMAIN}. Always use markdown format.`,
        },
        { role: 'user', content: articlePrompt },
      ], { temperature: 0.7 })
    } catch (aiError) {
      console.warn('[Content Engine Articles] AI article generation failed, using fallback:', aiError)
      articleContent = `# ${title}\n\n## Introduction\n\n${brief.topic} is a critical area of focus for modern SEO professionals. In this guide, we explore ${brief.keywordTarget} and how it impacts your search visibility.\n\n## Key Concepts\n\nUnderstanding ${brief.keywordTarget} requires a grasp of the fundamental principles that drive AI search visibility.\n\n## Conclusion\n\n${brief.keywordTarget} represents the future of search optimization. Start implementing these strategies today.`
    }

    const wordCount = articleContent.split(/\s+/).length

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

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
      include: {
        brief: {
          select: {
            id: true,
            topic: true,
            pillar: true,
            keywordTarget: true,
          },
        },
      },
    })

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Articles] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
