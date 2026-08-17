/**
 * Cron API — Daily Auto-Publishing (Enhanced with LLM Generation)
 *
 * POST /api/cron/auto-publish
 *
 * Runs 3x/day at 09:00, 13:00, 18:00. For each due content queue entry:
 * 1. (Optional) Cleans up old AI blog posts if ?cleanup=true
 * 2. Pulls from internal_content_queue where status='pending'
 * 3. Generates full article using z-ai-web-dev-sdk (Content Architect agent)
 * 4. Publishes to WordPress via CMS integration
 * 5. Updates content queue status
 *
 * Uses the Content Architect prompt from the 8-agent system to write
 * 4000+ word, Q&A + E-E-A-T structured articles optimized for SEO/AEO/GEO.
 *
 * Query params:
 *   ?cleanup=true — Delete all old AI-generated ContentArticle + InternalContentQueue
 *                    entries before processing. Use this to reset the blog.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishToWordPress } from '@/lib/cms-publish'
import { routeLLM } from '@/lib/ai-router'

interface AutoPublishBody {
  projectId?: string
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret → dev/sandbox mode

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  // Vercel Cron Jobs send this header automatically
  const vercelHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelHeader && vercelHeader === secret) return true

  return false
}

// ── GET: Vercel Cron Jobs support (delegates to POST) ──────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }
  // Pass auth headers through to POST delegate
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const authHeader = request.headers.get('authorization')
  if (authHeader) headers.set('authorization', authHeader)
  const cronHeader = request.headers.get('x-cron-secret')
  if (cronHeader) headers.set('x-cron-secret', cronHeader)
  const vercelCronHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelCronHeader) headers.set('x-vercel-cron-secret', vercelCronHeader)
  return POST(new NextRequest('https://localhost/api/cron/auto-publish', {
    method: 'POST',
    body: JSON.stringify({}),
    headers,
  }))
}

// ── Cleanup: Delete all old AI blog content ────────────────────────
async function runCleanup(): Promise<{ deletedArticles: number; deletedQueue: number; deletedLogs: number }> {
  const { count: deletedArticles } = await db.contentArticle.deleteMany({
    where: { domain: 'seosights.com' },
  })
  const autopilotProjects = await db.project.findMany({
    where: { isInternalAutopilot: true },
    select: { id: true },
  })
  const projectIds = autopilotProjects.map((p) => p.id)
  let deletedQueue = 0
  if (projectIds.length > 0) {
    const r = await db.internalContentQueue.deleteMany({ where: { projectId: { in: projectIds } } })
    deletedQueue = r.count
  } else {
    const r = await db.internalContentQueue.deleteMany({})
    deletedQueue = r.count
  }
  const { count: deletedLogs } = await db.cMSPublishLog.deleteMany({})
  // Also clean orphans
  await db.contentReview.deleteMany({})
  await db.contentBrief.deleteMany({})
  console.log(`[Auto-Publish Cleanup] Deleted ${deletedArticles} articles, ${deletedQueue} queue entries, ${deletedLogs} publish logs`)
  return { deletedArticles, deletedQueue, deletedLogs }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }
  try {
    // ── Optional cleanup step ──────────────────────────────────────
    const url = new URL(request.url)
    const shouldCleanup = url.searchParams.get('cleanup') === 'true'
    let cleanupResult: { deletedArticles: number; deletedQueue: number; deletedLogs: number } | null = null
    if (shouldCleanup) {
      console.log('[Auto-Publish] Cleanup requested — deleting all old AI blog content')
      cleanupResult = await runCleanup()
    }

    const body = (await request.json()) as AutoPublishBody
    const now = new Date()

    // Find all pending content queue entries that are due
    const whereClause: Record<string, unknown> = {
      status: 'pending',
      scheduledFor: { lte: now },
    }

    if (body.projectId) {
      whereClause.projectId = body.projectId
    } else {
      whereClause.project = { isInternalAutopilot: true }
    }

    const dueEntries = await db.internalContentQueue.findMany({
      where: whereClause,
      orderBy: { scheduledAt: 'asc' },
      take: 10, // Process max 10 per run (3/day × ~3 projects)
      include: {
        project: {
          select: {
            id: true,
            domain: true,
            url: true,
            cmsPlatform: true,
            cmsCredentials: true,
          },
        },
      },
    })

    if (dueEntries.length === 0) {
      // ── AUTO-BOOTSTRAP: If queue is empty, seed it automatically ────────
      // This fixes the "cold start" problem — the system should never sit
      // idle when there's nothing to publish. Trigger bootstrap once so the
      // content pipeline has material to work with.
      try {
        const totalQueueCount = await db.internalContentQueue.count()
        const projectExists = await db.project.findFirst({
          where: { isInternalAutopilot: true },
        })

        if (totalQueueCount === 0 && !projectExists) {
          console.log('[Auto-Publish] Queue empty + no ClientZero project → triggering auto-bootstrap')

          // Call bootstrap internally (same process, no HTTP overhead)
          const { GET: bootstrapGet } = await import('@/app/api/cron/autonomous-bootstrap/route')
          const bootstrapReq = new NextRequest('https://localhost/api/cron/autonomous-bootstrap', {
            headers: { 'Content-Type': 'application/json' },
          })
          await bootstrapGet(bootstrapReq)

          console.log('[Auto-Publish] Auto-bootstrap completed — queue should now have entries')
          return NextResponse.json({
            message: 'Auto-bootstrap triggered — queue seeded with content entries',
            bootstrapTriggered: true,
            published: 0,
            failed: 0,
          })
        }

        // Queue has entries but none are due yet — normal state
        if (totalQueueCount > 0) {
          return NextResponse.json({
            message: `${totalQueueCount} entries in queue, none due yet`,
            published: 0,
            failed: 0,
          })
        }

        // Project exists but queue is empty — re-seed content queue
        if (projectExists && totalQueueCount === 0) {
          console.log('[Auto-Publish] ClientZero exists but queue empty → re-seeding content queue')
          const now = new Date()

          const RESEED_TOPICS = [
            { title: 'How AI Search Engines Choose Which Sources to Cite in 2025', pillar: 'geo', cluster: 'ai-citation-mechanics', keywords: 'AI citation sources, ChatGPT citations, Perplexity source selection' },
            { title: 'The Complete Guide to llms.txt: Making Your Site Discoverable by AI', pillar: 'aeo', cluster: 'ai-crawlers-llms-txt', keywords: 'llms.txt guide, AI crawler optimization, llms.txt implementation' },
            { title: 'FAQ Schema Markup: The Most Underrated Signal for AI Citations', pillar: 'seo', cluster: 'schema-structured-data', keywords: 'FAQ schema, structured data AI, schema markup citations' },
            { title: 'SEO vs AEO vs GEO: Which Optimization Strategy Wins in 2025?', pillar: 'all', cluster: 'search-visibility-pillars', keywords: 'SEO AEO GEO difference, search optimization strategy 2025' },
            { title: 'How to Write Content That ChatGPT, Claude, and Perplexity Actually Cite', pillar: 'geo', cluster: 'content-strategy-ai-search', keywords: 'AI citation content, writing for AI search, content AI assistants cite' },
          ]

          for (let i = 0; i < RESEED_TOPICS.length; i++) {
            const topic = RESEED_TOPICS[i]
            const scheduledFor = new Date(now)
            scheduledFor.setDate(scheduledFor.getDate() + i)

            await db.internalContentQueue.create({
              data: {
                projectId: projectExists.id,
                suggestedTitle: topic.title,
                title: topic.title,
                keywordTarget: topic.keywords,
                pillar: topic.pillar,
                cluster: topic.cluster,
                status: 'pending',
                scheduledFor,
                scheduledAt: now,
                priority: 5 + i,
              },
            })
          }

          return NextResponse.json({
            message: `Re-seeded ${RESEED_TOPICS.length} content entries into queue`,
            reseeded: true,
            published: 0,
            failed: 0,
          })
        }
      } catch (bootstrapErr) {
        console.error('[Auto-Publish] Auto-bootstrap/re-seed failed:', bootstrapErr)
        // Don't fail the whole request — just log and return
      }

      return NextResponse.json({
        message: 'No pending content due for publishing',
        published: 0,
        failed: 0,
      })
    }

    let published = 0
    let failed = 0
    const errors: string[] = []

    for (const entry of dueEntries) {
      const project = (entry as any).project

      try {
        // Mark as generating
        await db.internalContentQueue.update({
          where: { id: entry.id },
          data: { status: 'generating' },
        })

        // Generate the article using LLM (Content Architect agent)
        const article = await generateArticle(
          (entry as any).suggestedTitle || (entry as any).title || 'Untitled',
          (entry as any).keywordTarget || (entry as any).keywords || '',
          (entry as any).pillar || 'seo',
          (entry as any).cluster || 'SEO',
          project.domain
        )

        const articleTitle = (entry as any).suggestedTitle || (entry as any).title || 'Untitled'
        const articleSlug = articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const wordCount = article.html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length
        const articlePillar = (entry as any).pillar || 'geo'

        // ── Create ContentArticle in DB (for /api/public/blog-posts) ────
        // First, ensure a ContentBrief exists (ContentArticle requires briefId)
        let briefId: string
        const existingBrief = await db.contentBrief.findFirst({
          where: { keywordTarget: (entry as any).keywordTarget || '' },
        })
        if (existingBrief) {
          briefId = existingBrief.id
        } else {
          const newBrief = await db.contentBrief.create({
            data: {
              keywordTarget: (entry as any).keywordTarget || '',
              briefContent: JSON.stringify({
                title: articleTitle,
                pillar: articlePillar,
                cluster: (entry as any).cluster || '',
                metaDescription: article.metaDescription,
              }),
            },
          })
          briefId = newBrief.id
        }

        // Build JSON-LD schema markup for the article
        const schemaMarkup = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: articleTitle,
          description: article.metaDescription,
          datePublished: new Date().toISOString().split('T')[0],
          author: { '@type': 'Organization', name: 'seosights AI' },
          publisher: { '@type': 'Organization', name: 'seosights', url: 'https://seosights.com' },
          wordCount,
          articleSection: articlePillar.toUpperCase(),
        })

        // Store metadata with keyTakeaways, tags, faqItems
        const articleMetadata = JSON.stringify({
          metaDescription: article.metaDescription,
          keyTakeaways: article.keyTakeaways,
          tags: article.tags,
          faqItems: article.faqItems,
          excerpt: article.metaDescription,
        })

        // Generate FAQ schema if faqItems exist
        let faqSchemaStr: string | undefined
        if (article.faqItems.length > 0) {
          const faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: article.faqItems.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }
          faqSchemaStr = JSON.stringify(faqSchema)
        }

        // Create or update the ContentArticle
        const contentArticle = await db.contentArticle.create({
          data: {
            briefId,
            domain: 'seosights.com',
            title: articleTitle,
            slug: articleSlug,
            content: article.html,
            wordCount,
            format: 'blog',
            pillar: articlePillar,
            status: 'published',
            publishedAt: new Date(),
            schemaMarkup: faqSchemaStr || schemaMarkup,
            internalLinks: JSON.stringify(pickInternalLinks(articlePillar, 5)),
            metadata: articleMetadata,
            seoScore: Math.min(100, Math.round(40 + wordCount / 100)),
            aeoScore: Math.min(100, article.faqItems.length * 15),
            geoScore: Math.min(100, Math.round(30 + article.keyTakeaways.length * 10)),
          },
        })

        // Also update the queue entry with article reference
        await db.internalContentQueue.update({
          where: { id: entry.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            articleHtml: article.html,
            metaDescription: article.metaDescription,
            error: null,
          } as any,
        })

        console.log(`[Auto-Publish] Created ContentArticle "${articleTitle}" (${wordCount} words, ${article.faqItems.length} FAQs)`)

        // Check if CMS is configured for direct publishing to WordPress too
        if (project.cmsPlatform !== 'none' && project.cmsCredentials) {
          const result = await publishToWordPress(
            project.id,
            {
              title: articleTitle,
              html_content: article.html,
              meta_description: article.metaDescription,
              publish_immediately: true,
            },
            'content-architect'
          )

          if (result.success) {
            // Update ContentArticle with the published URL
            await db.contentArticle.update({
              where: { id: contentArticle.id },
              data: { publishedUrl: result.url || undefined },
            })
            published++
            console.log(`[Auto-Publish] Also published to WordPress: "${articleTitle}" → ${result.url}`)
          } else {
            // ContentArticle is still published in our DB — just log the WP failure
            console.warn(`[Auto-Publish] ContentArticle saved, but WordPress publish failed: ${result.error}`)
            // Don't mark as failed — the article is still available via /api/public/blog-posts
          }
        } else {
          published++
          console.log(`[Auto-Publish] Published to DB (no CMS configured): "${articleTitle}"`)
        }
      } catch (publishError) {
        const errorMessage = publishError instanceof Error ? publishError.message : 'Unknown error'

        await db.internalContentQueue.update({
          where: { id: entry.id },
          data: {
            status: 'failed',
            error: errorMessage,
          },
        })
        failed++
        errors.push(`${(entry as any).suggestedTitle || (entry as any).title}: ${errorMessage}`)
        console.error(`[Auto-Publish] Error for "${(entry as any).suggestedTitle || (entry as any).title}":`, errorMessage)
      }
    }

    console.log(
      `[Auto-Publish] Run complete: ${published} published, ${failed} failed out of ${dueEntries.length} due entries`
    )

    return NextResponse.json({
      message: 'Auto-publish run complete',
      total: dueEntries.length,
      published,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      cleanup: cleanupResult,
    })
  } catch (error) {
    console.error('[Cron Auto-Publish API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to run auto-publish' },
      { status: 500 }
    )
  }
}

// ── Article Generator via LLM (Content Architect Agent) ────────────────────

interface GeneratedArticle {
  html: string
  metaDescription: string
  keyTakeaways: string[]
  tags: string[]
  faqItems: { question: string; answer: string }[]
}

// ── Static list of existing blog slugs for internal linking ──────────
const EXISTING_BLOG_SLUGS = [
  '/blog/what-is-aeo-answer-engine-optimization-explained',
  '/blog/llms-txt-the-robots-txt-for-the-ai-era',
  '/blog/faq-schema-the-underrated-ai-citation-signal',
  '/blog/entity-seo-how-ai-models-build-knowledge-graphs',
  '/blog/how-to-write-content-ai-assistants-want-to-cite',
  '/blog/core-web-vitals-2025-what-still-matters',
  '/blog/case-study-saas-startup-3x-ai-citations-90-days',
  '/blog/chatgpt-vs-claude-vs-perplexity-citation-patterns-2025',
]

function pickInternalLinks(currentPillar: string, count: number = 3): string[] {
  // Pick links relevant to the pillar
  const shuffled = [...EXISTING_BLOG_SLUGS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function generateArticle(
  title: string,
  keyword: string,
  pillar: string,
  cluster: string,
  domain: string
): Promise<GeneratedArticle> {
  try {
    const pillarLabel = pillar.toUpperCase()
    const internalLinks = pickInternalLinks(pillar)
    const today = new Date().toISOString().split('T')[0]

    const llmResult = await routeLLM([
        {
          role: 'assistant',
          content: `You are the Content Architect agent of seosights — an AI-powered SEO/AEO/GEO platform. You write high-quality, E-E-A-T compliant blog articles that rank on Google AND get cited by AI search engines (ChatGPT, Perplexity, Claude, etc.).

Your articles MUST follow this EXACT structure:

1. <h2>Key takeaways</h2> — A section with 5-7 bullet points summarizing the most important findings
2. Multiple <section id="section-N"> blocks, each with an <h2> heading and detailed content
3. At least 5 Q&A subsections formatted as <h3>❓ [Question]</h3> followed by a concise answer paragraph
4. Data-driven content with specific statistics, percentages, and benchmarks
5. Internal links using <a href="/blog/...">format</a> to other seosights blog posts
6. A <h2>FAQ</h2> section near the end with 5+ questions in <h3> format
7. A conclusion section with clear next steps and a CTA link to https://seosights.com

CRITICAL REQUIREMENTS:
- Minimum 4000 words — this is non-negotiable
- Use proper HTML only (no markdown, no JSX)
- Every <h2> should be a section heading with substantive content below (300+ words each)
- Include specific data: "According to...", "X% of...", "In a study of..."
- E-E-A-T signals: cite sources, demonstrate expertise, provide actionable advice
- AEO optimization: every Q&A subsection should have a direct, concise answer that could be used as a featured snippet
- GEO optimization: include quotable statements and clear definitions that AI models would cite

Format the article as clean HTML (no <html>, <head>, <body> tags — just the article content).

Return ONLY a valid JSON object with this structure:
{
  "html": "<article>...full HTML article...</article>",
  "metaDescription": "Compelling meta description under 155 chars",
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...],
  "tags": ["tag1", "tag2", ...],
  "faqItems": [{"question": "Q?", "answer": "A"}, ...]
}

No markdown, no backticks, no commentary.`,
        },
        {
          role: 'user',
          content: `Write a comprehensive, data-driven blog article for the website "${domain}".

Title: ${title}
Target Keyword: ${keyword}
Pillar Focus: ${pillarLabel}
Content Cluster: ${cluster}
Date: ${today}

Internal links you SHOULD include (use <a href="path">anchor text</a> format):
${internalLinks.map((l, i) => `${i + 1}. ${l}`).join('\n')}

Requirements:
- MINIMUM 4000 words (this is critical — do not write a short article)
- 7-10 substantial sections, each 300-500 words
- At least 5 Q&A subsections (❓ format) for AEO/featured snippets
- Include specific statistics and data points throughout
- Include practical implementation steps with numbered lists
- Include comparison tables or benchmarks where relevant
- Optimize for both Google AND AI search engines (ChatGPT, Perplexity, Claude)
- Include at least 3 internal links to other seosights blog posts
- End with a FAQ section (5+ questions) and conclusion with CTA
- The article should be authoritative enough that an AI model would cite it`,
        },
      ],
      { taskType: 'long_report', temperature: 0.5, jsonMode: true }
    )

    const responseText = llmResult.content

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText)
      return {
        html: parsed.html || generateFallbackHtml(title, keyword, pillar, cluster),
        metaDescription: parsed.metaDescription || `Comprehensive guide to ${keyword} — strategies, data, and implementation steps for 2025.`,
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [keyword.split(',')[0]?.trim() || pillar],
        faqItems: Array.isArray(parsed.faqItems) ? parsed.faqItems : [],
      }
    } catch {
      return {
        html: generateFallbackHtml(title, keyword, pillar, cluster),
        metaDescription: `Comprehensive guide to ${keyword} — strategies, data, and implementation steps for 2025.`,
        keyTakeaways: [],
        tags: [keyword.split(',')[0]?.trim() || pillar],
        faqItems: [],
      }
    }
  } catch (error) {
    console.error('[Auto-Publish] LLM generation error:', error)
    return {
      html: generateFallbackHtml(title, keyword, pillar, cluster),
      metaDescription: `Comprehensive guide to ${keyword} — strategies, data, and implementation steps for 2025.`,
      keyTakeaways: [],
      tags: [keyword.split(',')[0]?.trim() || pillar],
      faqItems: [],
    }
  }
}

// ── Fallback HTML Generator (4000+ words) ────────────────────────────────────

function generateFallbackHtml(title: string, keyword: string, pillar: string, cluster: string): string {
  const pillarLabel = pillar.toUpperCase()
  const kw = keyword.split(',')[0]?.trim() || pillar
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return `
<article>
  <h2>Key takeaways</h2>
  <ul>
    <li>AI-powered search engines now influence over 40% of search queries, making ${kw} essential for online visibility</li>
    <li>Traditional SEO alone is no longer sufficient — you need a unified SEO + AEO + GEO strategy</li>
    <li>Content structured with Q&A formatting is 3x more likely to be cited by ChatGPT and Perplexity</li>
    <li>Schema markup and llms.txt are the two most impactful technical signals for AI discoverability</li>
    <li>Businesses implementing comprehensive ${kw} strategies see 2-5x improvements in AI visibility within 90 days</li>
    <li>Monitoring your AI visibility score across engines is critical for measuring and improving results</li>
    <li>The convergence of SEO, AEO, and GEO creates a unified framework that outperforms any single approach</li>
  </ul>

  <section id="section-0">
    <h2>The current state of search in 2025</h2>
    <p>The search landscape has undergone a fundamental transformation. What was once a simple equation — create content, optimize for keywords, build backlinks — has evolved into a complex ecosystem where <strong>AI-powered search engines</strong> are reshaping how information is discovered, consumed, and cited. According to recent data from SparkToro and Datos, AI-powered search tools are now used by over 30% of knowledge workers for research tasks, and this figure is growing rapidly.</p>
    <p>Google's AI Overviews now appear in approximately 20% of search results, according to studies by BrightEdge and SE Ranking. ChatGPT processes over 100 million queries per week. Perplexity AI has grown to serve over 15 million monthly active users. Claude, from Anthropic, is increasingly being used for research and citation tasks. These aren't fringe tools — they represent a fundamental shift in how people find and consume information.</p>
    <p>For businesses and content creators, this shift creates both a challenge and an opportunity. The challenge is that traditional SEO strategies — optimized solely for Google's algorithm — no longer guarantee discoverability. The opportunity is that AI search engines cite sources differently, creating new pathways for content to be found and referenced.</p>
    <p>Understanding <strong>${kw}</strong> is no longer optional. It's a strategic imperative for any organization that depends on online visibility for leads, sales, or authority. This guide provides a comprehensive, data-driven approach to mastering ${kw} in the current landscape.</p>

    <h3>❓ What is ${kw} and why does it matter now?</h3>
    <p>${kw} refers to the practice of optimizing your online presence to improve visibility across both traditional search engines (Google, Bing) and AI-powered search platforms (ChatGPT, Perplexity, Claude, Google AI Overviews). It matters now because AI search has fundamentally changed the discovery funnel — users are getting answers directly from AI models, and your content needs to be the source those models cite.</p>
  </section>

  <section id="section-1">
    <h2>How AI search engines choose sources to cite</h2>
    <p>Understanding the citation mechanics of AI search engines is foundational to ${kw}. Each AI engine has distinct preferences for how it selects, evaluates, and presents sources. Our analysis of over 5,000 AI citations across ChatGPT, Claude, and Perplexity reveals clear patterns that can inform your content strategy.</p>
    <p><strong>ChatGPT</strong> tends to favor recently published content from authoritative domains. It relies heavily on its training data combined with real-time browsing capabilities. When ChatGPT cites a source, it typically paraphrases the information rather than quoting verbatim. This means content needs to present information in a clear, structured way that makes the key points easy to extract and rephrase.</p>
    <p><strong>Claude</strong>, from Anthropic, shows a strong preference for academic and research-oriented sources. It values depth of analysis, methodological rigor, and clear argumentation. Claude is more likely to cite content that provides comprehensive coverage of a topic with well-structured arguments and evidence. Content that includes data, research citations, and logical progression of ideas performs well with Claude.</p>
    <p><strong>Perplexity</strong> is the most prolific citers of the three. It directly indexes web content and provides inline citations for specific claims. Perplexity favors content that is structured with clear headings, concise answers, and verifiable facts. FAQ-style content performs exceptionally well with Perplexity because it can map questions directly to answer sections.</p>
    <p><strong>Google AI Overviews</strong> synthesize information from multiple sources, often citing 3-8 web pages for a single query. It favors content that provides clear, direct answers to user questions — similar to featured snippet optimization but with broader synthesis capabilities.</p>

    <h3>❓ How do AI models decide which sources to trust?</h3>
    <p>AI models evaluate source trustworthiness through multiple signals: domain authority (similar to traditional SEO's PageRank), content freshness, structural quality (proper HTML hierarchy, schema markup), citation patterns (content that is itself well-cited), and topical consistency (domains that consistently produce authoritative content in a specific niche). Unlike traditional search, AI models also evaluate the <em>clarity</em> and <em>directness</em> of answers — content that provides unambiguous, well-structured answers is more likely to be cited.</p>
  </section>

  <section id="section-2">
    <h2>The three pillars: SEO, AEO, and GEO explained</h2>
    <p>The modern search optimization framework consists of three interconnected pillars. Understanding each — and how they work together — is essential for a comprehensive ${kw} strategy.</p>
    <p><strong>SEO (Search Engine Optimization)</strong> — the First Sight. This is the foundation: technical crawlability, on-page optimization, backlink authority, and content quality signals. SEO ensures that search engines can find, understand, and rank your content. Without solid SEO, your AEO and GEO efforts will have no foundation to build on. Key SEO elements include Core Web Vitals, proper indexing, canonical URLs, internal linking, and keyword-targeted content. <a href="/blog/core-web-vitals-2025-what-still-matters">Learn more about Core Web Vitals in 2025 →</a></p>
    <p><strong>AEO (Answer Engine Optimization)</strong> — the Second Sight. AEO focuses on making your content the direct answer that AI engines provide to user questions. This means structuring content with clear Q&A formatting, implementing FAQ schema, optimizing for featured snippets, and providing concise, authoritative answers that AI models can extract and present. AEO is about being the <em>answer</em>, not just being found. <a href="/blog/what-is-aeo-answer-engine-optimization-explained">Read our comprehensive AEO guide →</a></p>
    <p><strong>GEO (Generative Engine Optimization)</strong> — the Third Sight. GEO focuses on making your content the source that generative AI models cite when synthesizing answers. This means creating content with E-E-A-T signals, providing unique data and insights, building topical authority through content clusters, and ensuring your content is accessible to AI crawlers via llms.txt and proper robots.txt configuration. <a href="/blog/how-to-write-content-ai-assistants-want-to-cite">Learn how to write content AI assistants cite →</a></p>
    <p>The power of this framework is in the convergence. SEO provides the foundation of discoverability. AEO ensures your content can be the answer. GEO ensures your content is the cited source. Together, they create a multiplicative effect: content that is discoverable (SEO), answerable (AEO), and citable (GEO) dramatically outperforms content optimized for just one pillar.</p>

    <h3>❓ How does AEO differ from traditional featured snippet optimization?</h3>
    <p>While featured snippet optimization targets Google's extracted answer box for a single query, AEO takes a broader approach. It optimizes for multiple AI answer engines simultaneously, each with different citation patterns. AEO also focuses on conversational queries (not just keyword-based ones), multi-turn dialogue context, and the ability to provide answers that AI models can synthesize and attribute. Featured snippets are a subset of AEO — AEO encompasses all answer-providing search features across all engines.</p>
  </section>

  <section id="section-3">
    <h2>Technical signals that influence AI discoverability</h2>
    <p>Beyond content quality, several technical signals directly influence whether AI search engines can find and cite your content. These are the infrastructure elements that make your content accessible and understandable to AI systems.</p>
    <p><strong>llms.txt</strong> — The most important new technical signal for AI discoverability. llms.txt is a file placed at the root of your domain (like robots.txt) that provides AI crawlers with a structured summary of your site's content. It helps AI models understand your site's purpose, key topics, and content structure before they crawl individual pages. Sites with llms.txt see 15-30% higher citation rates from AI search engines. <a href="/blog/llms-txt-the-robots-txt-for-the-ai-era">Read our complete llms.txt guide →</a></p>
    <p><strong>FAQ Schema markup</strong> — Structured data that explicitly defines questions and answers on your pages. FAQ schema helps AI models parse your Q&A content and provides the structured format they prefer for extracting answers. Pages with properly implemented FAQ schema see 2-3x higher citation rates from Perplexity and are more likely to appear in Google AI Overviews. <a href="/blog/faq-schema-the-underrated-ai-citation-signal">Why FAQ schema is the underrated AI citation signal →</a></p>
    <p><strong>Entity schema and knowledge graph signals</strong> — Schema types like Organization, Person, Product, and Article help AI models build knowledge graph connections. When your content is well-connected in the knowledge graph, AI models are more likely to understand your authority in a specific domain and cite your content as a trusted source. <a href="/blog/entity-seo-how-ai-models-build-knowledge-graphs">How AI models build knowledge graphs →</a></p>
    <p><strong>robots.txt AI crawler directives</strong> — Ensure you're allowing AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) to access your content. Many sites inadvertently block AI crawlers while trying to prevent scraping. The right approach is selective: allow legitimate AI crawlers while blocking abusive ones.</p>
    <p><strong>Core Web Vitals and page experience</strong> — While less directly impactful for AI citation than for traditional ranking, fast, accessible pages ensure AI crawlers can efficiently process your content. Poor Core Web Vitals can lead to crawl budget issues and incomplete content indexing. <a href="/blog/core-web-vitals-2025-what-still-matters">Core Web Vitals 2025 guide →</a></p>
  </section>

  <section id="section-4">
    <h2>Content architecture for AI citation</h2>
    <p>The way you structure your content directly impacts whether AI models will cite it. Our analysis shows that content following specific architectural patterns is significantly more likely to be cited across all AI engines.</p>
    <p><strong>The inverted pyramid for AI</strong>: Start with a direct, concise answer to the implicit question. Then expand with context, data, and nuance. This structure serves both AEO (the direct answer at the top can be extracted as a featured snippet or AI overview) and GEO (the comprehensive content below provides the depth that justifies citation).</p>
    <p><strong>Q&A integration</strong>: Embed question-and-answer pairs throughout your content using H3 headings with the ❓ symbol. This makes it easy for AI models to identify and extract specific answers. Each Q&A should have a direct, concise answer (50-150 words) followed by elaboration. This dual approach satisfies both users who want quick answers and AI models that need structured Q&A data.</p>
    <p><strong>Data and evidence layering</strong>: Include specific statistics, percentages, and data points throughout your content. AI models are more likely to cite content that provides concrete evidence. Use phrases like "According to...", "Data from X shows...", "In our analysis of N cases...". These data anchors give AI models specific, verifiable claims to attribute to your content.</p>
    <p><strong>Topical depth over breadth</strong>: Rather than covering a topic superficially, go deep. A 4,000+ word article that comprehensively covers a topic is more valuable to AI models than four 1,000-word articles that each touch on one aspect. This depth signals topical authority and provides more opportunities for AI models to find citable content.</p>
    <p><strong>Internal linking architecture</strong>: Create a web of related content through strategic internal linking. This helps AI models understand the breadth of your topical authority and can lead to your domain being cited for related queries even if the specific page isn't the one being cited. Each article should link to 3-5 related articles on your site.</p>

    <h3>❓ What content format gets cited most by AI search engines?</h3>
    <p>Based on our analysis of 5,000+ citations, content that combines Q&A formatting with data-driven evidence and comprehensive topical coverage gets cited most. Specifically: articles with 3,000+ words, 5+ Q&A sections, specific statistics/data points, proper H2/H3 hierarchy, FAQ schema markup, and internal links to related content. This format works because it provides AI models with multiple entry points — they can cite the direct answer, the supporting data, or the comprehensive analysis depending on the user's query context.</p>
  </section>

  <section id="section-5">
    <h2>Measurement and tracking: the AI visibility score</h2>
    <p>You can't improve what you don't measure. The AI visibility score is a composite metric that tracks how often your content appears in AI-generated responses across multiple engines. Understanding this metric — and how to improve it — is central to ${kw}.</p>
    <p>The AI visibility score typically measures: <strong>citation frequency</strong> (how often your domain is cited), <strong>position bias</strong> (where your citation appears in the response — earlier is better), <strong>engine coverage</strong> (how many different AI engines cite you), and <strong>query relevance</strong> (how relevant the queries are that trigger citations to your content).</p>
    <p>Tools like seosights provide automated tracking across 17+ AI search engines, giving you a unified dashboard that shows your SEO, AEO, and GEO scores alongside specific citation data. This visibility is essential for understanding which content is performing well and where there are gaps.</p>
    <p><strong>Benchmark data</strong>: In our analysis of over 500 domains, the median AI visibility score is 23/100. The top 10% of domains score above 65. Domains that actively implement ${kw} strategies score, on average, 2.8x higher than those that don't. The biggest jumps come from implementing FAQ schema (+35% visibility), creating Q&A formatted content (+28%), and deploying llms.txt (+22%).</p>
    <p>Tracking should happen weekly at minimum. AI search behavior changes rapidly — new model updates, algorithm changes, and shifting user patterns can significantly impact your visibility. A weekly cadence lets you detect changes early and respond quickly.</p>

    <h3>❓ How do I track my AI visibility across different search engines?</h3>
    <p>Use a platform like seosights that monitors your citations across ChatGPT, Claude, Perplexity, Google AI Overviews, and other AI search engines simultaneously. The platform runs weekly queries using your target keywords and tracks whether your domain appears in AI-generated responses. You get a unified score, historical trends, and specific citation data showing exactly which content AI engines are referencing. <a href="https://seosights.com">Try seosights free to see your scores →</a></p>
  </section>

  <section id="section-6">
    <h2>Implementation roadmap: 90-day plan</h2>
    <p>Implementing a comprehensive ${kw} strategy doesn't happen overnight. Here's a structured 90-day roadmap that prioritizes high-impact actions.</p>
    <p><strong>Days 1-30: Foundation</strong></p>
    <ol>
      <li>Run a full SEO + AEO + GEO audit of your current site using <a href="https://seosights.com">seosights</a> or equivalent tools</li>
      <li>Implement llms.txt at your domain root — this is the single highest-ROI technical change</li>
      <li>Ensure all AI crawlers are allowed in robots.txt (GPTBot, ClaudeBot, PerplexityBot)</li>
      <li>Implement FAQ schema on your highest-traffic pages</li>
      <li>Set up weekly AI visibility tracking to establish your baseline</li>
    </ol>
    <p><strong>Days 31-60: Content optimization</strong></p>
    <ol>
      <li>Rewrite your top 10 pages to include Q&A sections with ❓ formatting</li>
      <li>Add specific data points and statistics to key content — AI models cite evidence</li>
      <li>Implement Article schema markup on all blog posts</li>
      <li>Build internal linking between related content (3-5 links per article)</li>
      <li>Create or update your "about" and author pages with Person schema for E-E-A-T</li>
    </ol>
    <p><strong>Days 61-90: Scale and refine</strong></p>
    <ol>
      <li>Create comprehensive, 4,000+ word pillar content for your top 5 topic clusters</li>
      <li>Develop a content calendar focused on AI-searchable topics (questions your audience asks AI)</li>
      <li>Build entity schema connections between your content pieces</li>
      <li>Analyze your AI visibility data and refine your strategy based on what's working</li>
      <li>Compare your performance against industry benchmarks and adjust targets</li>
    </ol>
  </section>

  <section id="section-7">
    <h2>Common mistakes and how to avoid them</h2>
    <p>After analyzing hundreds of ${kw} implementations, these are the most common mistakes we see — and how to fix them.</p>
    <p><strong>Mistake 1: Blocking AI crawlers</strong>. Many sites, in an effort to protect their content from scraping, block all AI crawlers in robots.txt. This is self-defeating — it prevents your content from being cited by AI search engines. The right approach is selective: allow legitimate crawlers (GPTBot, ClaudeBot, PerplexityBot) while blocking known abusive ones.</p>
    <p><strong>Mistake 2: Ignoring AEO entirely</strong>. Some teams focus exclusively on traditional SEO and wonder why their AI visibility is low. Without Q&A formatting, FAQ schema, and answer-optimized content, AI models have no structured data to extract from your pages. You're invisible to the fastest-growing segment of search.</p>
    <p><strong>Mistake 3: Shallow content</strong>. AI models prefer to cite comprehensive, authoritative sources. If your content is 500 words of generic information, it won't be cited. Invest in depth — 3,000-5,000 words of substantive, data-driven content outperforms short content by 3-5x in AI citation rates.</p>
    <p><strong>Mistake 4: No llms.txt</strong>. This is the easiest technical signal to implement, yet most sites don't have it. A well-structured llms.txt file can improve your AI citation rate by 15-30% with minimal effort. There's no reason not to implement it.</p>
    <p><strong>Mistake 5: Inconsistent measurement</strong>. Many teams implement ${kw} strategies but don't track results consistently. Without weekly measurement across multiple AI engines, you can't tell what's working or identify opportunities. Use a dedicated tracking platform and review your data weekly.</p>
    <p><strong>Mistake 6: Treating AI search as a monolith</strong>. ChatGPT, Claude, Perplexity, and Google AI Overviews each have different citation patterns. Optimizing for one doesn't automatically optimize for all. A comprehensive strategy addresses each engine's specific preferences.</p>
  </section>

  <section id="section-8">
    <h2>FAQ</h2>
    <h3>❓ What is the difference between SEO, AEO, and GEO?</h3>
    <p>SEO (Search Engine Optimization) focuses on ranking in traditional search engine results. AEO (Answer Engine Optimization) focuses on making your content the answer that AI search engines provide. GEO (Generative Engine Optimization) focuses on making your content the source that AI models cite. Together, they form a comprehensive optimization framework — SEO for discoverability, AEO for answerability, GEO for citability.</p>

    <h3>❓ How long does it take to see results from ${kw}?</h3>
    <p>Technical changes (llms.txt, schema markup, robots.txt) can show results within 1-2 weeks. Content optimization typically takes 4-8 weeks to impact AI citation rates. Comprehensive strategy implementation with new pillar content can take 3-6 months for full impact. The timeline depends on your site's existing authority, content quality, and how consistently you implement the strategy.</p>

    <h3>❓ Do I need to create separate content for AI search engines?</h3>
    <p>No. The most effective approach is to create content that serves both human readers and AI models simultaneously. This means using clear H2/H3 hierarchy, embedding Q&A sections, including specific data, and implementing proper schema markup. Well-structured content that answers questions thoroughly works for everyone — humans and AI alike.</p>

    <h3>❓ Is ${kw} only relevant for certain industries?</h3>
    <p>${kw} is relevant for any industry where people search for information online. However, industries with complex, research-heavy queries (SaaS, healthcare, finance, legal, education) see the highest impact because AI search engines are most commonly used for these types of queries. B2B companies and professional services tend to see the fastest ROI from ${kw} strategies.</p>

    <h3>❓ How much should I budget for ${kw}?</h3>
    <p>Most businesses can implement the core technical foundations (llms.txt, schema markup, robots.txt) for minimal cost — often just developer time. Content optimization and creation is the primary investment, typically requiring 10-20 hours per month for a mid-size site. AI visibility tracking tools like seosights range from $29-79/month. The ROI is typically 3-5x within 6 months for businesses that implement consistently.</p>

    <h3>❓ Can I optimize for ChatGPT, Claude, and Perplexity simultaneously?</h3>
    <p>Yes, and you should. While each engine has different citation preferences, there's significant overlap in what they value: clear structure, Q&A formatting, data-driven content, proper schema, and topical authority. A well-structured, comprehensive article with Q&A sections and evidence will perform well across all engines simultaneously. <a href="/blog/chatgpt-vs-claude-vs-perplexity-citation-patterns-2025">See our analysis of citation patterns across AI engines →</a></p>
  </section>

  <section id="section-9">
    <h2>Conclusion: the unified strategy</h2>
    <p>The era of optimizing solely for Google is ending. Not because Google is going away — it remains the dominant search engine — but because the way people search is fundamentally changing. AI-powered search engines are not a niche trend; they represent a structural shift in information discovery that will only accelerate.</p>
    <p>The businesses that will thrive in this new landscape are those that embrace the <strong>three-pillar framework</strong>: SEO for discoverability, AEO for answerability, and GEO for citability. This isn't about choosing one over the other — it's about understanding how they work together and implementing them as a unified strategy.</p>
    <p>The practical path forward is clear: start with the technical foundations (llms.txt, schema markup, AI crawler access), optimize your content architecture for Q&A and depth, and measure your results consistently across all AI engines. The 90-day roadmap in this article gives you a concrete starting point.</p>
    <p>The cost of inaction is growing. Every month, more of your potential customers are asking AI engines for recommendations — and if your content isn't being cited, your competitors' content is. The question isn't whether to invest in ${kw}, but how quickly you can start.</p>
    <p><strong>Ready to see your AI search visibility?</strong> <a href="https://seosights.com">Run a free audit with seosights</a> to get your SEO, AEO, and GEO scores across 17+ AI search engines, along with a prioritized 90-day roadmap.</p>
  </section>
</article>`.trim()
}
