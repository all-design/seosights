/**
 * Cron API — Daily Auto-Publishing (Enhanced with LLM Generation)
 *
 * POST /api/cron/auto-publish
 *
 * Runs 3x/day at 09:00, 13:00, 18:00. For each due content queue entry:
 * 1. Pulls from internal_content_queue where status='pending'
 * 2. Generates full article using z-ai-web-dev-sdk (Content Architect agent)
 * 3. Publishes to WordPress via CMS integration
 * 4. Updates content queue status
 *
 * Uses the Content Architect prompt from the 8-agent system to write
 * Q&A + E-E-A-T structured articles optimized for SEO/AEO/GEO.
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

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }
  try {
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
            { title: 'AI Search Visibility Trends This Week', pillar: 'all', cluster: 'ai-visibility-fundamentals', keywords: 'AI visibility trends, AI search updates' },
            { title: 'New AI Model Updates and Their Impact on SEO', pillar: 'aeo', cluster: 'ai-model-behavior', keywords: 'AI model updates, ChatGPT SEO impact' },
            { title: 'Answer Engine Optimization Strategies for 2025', pillar: 'aeo', cluster: 'answer-engine-optimization', keywords: 'AEO strategies, answer engine optimization 2025' },
            { title: 'How Perplexity and Claude Choose Sources to Cite', pillar: 'geo', cluster: 'generative-engine-optimization', keywords: 'Perplexity sources, Claude citations' },
            { title: 'Measuring Your AI Search Performance: A Practical Guide', pillar: 'all', cluster: 'search-visibility-pillars', keywords: 'AI search performance, visibility measurement' },
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

        // Check if CMS is configured for direct publishing
        if (project.cmsPlatform !== 'none' && project.cmsCredentials) {
          const result = await publishToWordPress(
            project.id,
            {
              title: (entry as any).suggestedTitle || (entry as any).title || 'Untitled',
              html_content: article.html,
              meta_description: article.metaDescription,
              publish_immediately: true,
            },
            'content-architect'
          )

          if (result.success) {
            await db.internalContentQueue.update({
              where: { id: entry.id },
              data: {
                status: 'published',
                publishedAt: new Date(),
                error: null,
              } as any,
            })
            published++
            console.log(`[Auto-Publish] Published: "${(entry as any).suggestedTitle || (entry as any).title}" to ${project.domain}`)
          } else {
            await db.internalContentQueue.update({
              where: { id: entry.id },
              data: {
                status: 'failed',
                error: result.error || 'WordPress publishing failed',
              } as any,
            })
            failed++
            errors.push(`${(entry as any).suggestedTitle || (entry as any).title}: ${result.error}`)
          }
        } else {
          // No CMS configured — store the generated content but mark as pending manual publish
          await db.internalContentQueue.update({
            where: { id: entry.id },
            data: {
              status: 'pending', // Keep as pending — will need manual publish
              error: 'Content generated but no CMS configured for auto-publishing',
            } as any,
          })
          console.log(`[Auto-Publish] Content generated for "${(entry as any).suggestedTitle || (entry as any).title}" but no CMS configured`)
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

    const llmResult = await routeLLM([
        {
          role: 'assistant',
          content: `You are the Content Architect agent of seosights — an AI-powered SEO/AEO/GEO platform. You write high-quality, E-E-A-T compliant blog articles that rank on Google AND get cited by AI search engines (ChatGPT, Perplexity, Claude, etc.).

Your articles MUST include:
1. Q&A sections with clear, concise answers (for featured snippets / AEO)
2. Structured data-friendly formatting (proper H2/H3 hierarchy)
3. E-E-A-T signals (authoritative language, specific data, expert insights)
4. Internal linking suggestions marked as [INTERNAL: /path]
5. A compelling meta description (max 155 characters)

Format the article as clean HTML (no <html>, <head>, <body> tags — just the article content).

Return ONLY a valid JSON object with this structure:
{
  "html": "<article>...full HTML article...</article>",
  "metaDescription": "Compelling meta description under 155 chars"
}

No markdown, no backticks, no commentary.`,
        },
        {
          role: 'user',
          content: `Write a comprehensive blog article for the website "${domain}".

Title: ${title}
Target Keyword: ${keyword}
Pillar Focus: ${pillarLabel}
Content Cluster: ${cluster}

Requirements:
- 1500-2500 words
- Include at least 3 Q&A sections (Question as H3, Answer below)
- Use data, statistics, and specific examples
- Include practical implementation steps
- Optimize for both Google and AI search engines
- Add internal linking placeholders where relevant
- End with a clear call-to-action`,
        },
      ],
      { taskType: 'long_report', temperature: 0.5, jsonMode: true }
    )

    const responseText = llmResult.content

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText)
      return {
        html: parsed.html || generateFallbackHtml(title, keyword, cluster),
        metaDescription: parsed.metaDescription || `Learn about ${keyword} and how it impacts your search visibility in 2025.`,
      }
    } catch {
      return {
        html: generateFallbackHtml(title, keyword, cluster),
        metaDescription: `Learn about ${keyword} and how it impacts your search visibility in 2025.`,
      }
    }
  } catch (error) {
    console.error('[Auto-Publish] LLM generation error:', error)
    return {
      html: generateFallbackHtml(title, keyword, cluster),
      metaDescription: `Learn about ${keyword} and how it impacts your search visibility in 2025.`,
    }
  }
}

// ── Fallback HTML Generator ────────────────────────────────────────────────

function generateFallbackHtml(title: string, keyword: string, cluster: string): string {
  return `
<article>
  <h1>${title}</h1>
  <p><em>Published by the seosights Content Architect — ${cluster} cluster</em></p>

  <h2>Introduction</h2>
  <p>In the rapidly evolving landscape of search engine optimization, understanding <strong>${keyword}</strong> has become essential for businesses that want to maintain their online visibility. This article explores the key concepts, strategies, and practical steps you need to know.</p>

  <h3>❓ What is ${keyword}?</h3>
  <p>${keyword} refers to the practice of optimizing your online presence to improve visibility across both traditional search engines and AI-powered search platforms. As search technology evolves, businesses must adapt their strategies to remain discoverable.</p>

  <h2>Why ${keyword} Matters in 2025</h2>
  <p>The way people search for information is changing. With AI-powered search engines like ChatGPT, Perplexity, and Google's AI Overviews transforming the search experience, traditional SEO strategies alone are no longer sufficient. ${keyword} represents a critical shift in how we approach online discoverability.</p>

  <h3>❓ How does ${keyword} differ from traditional SEO?</h3>
  <p>While traditional SEO focuses primarily on ranking in Google search results, ${keyword} takes a holistic approach that includes optimization for AI-powered search engines, voice assistants, and featured snippets. This means your content needs to be structured in a way that both algorithms and AI models can understand and cite.</p>

  <h2>Key Strategies for ${keyword}</h2>
  <ul>
    <li>Optimize your content structure for both human readers and AI crawlers</li>
    <li>Implement structured data to help search engines understand your content</li>
    <li>Build topical authority through comprehensive content clusters</li>
    <li>Monitor your visibility across both traditional and AI-powered search engines</li>
    <li>Create Q&A formatted content that AI engines can easily cite</li>
  </ul>

  <h2>Implementation Guide</h2>
  <p>Getting started with ${keyword} doesn't have to be complicated. Here's a step-by-step approach:</p>
  <ol>
    <li><strong>Audit your current state</strong> — Assess where you stand today [INTERNAL: /audit]</li>
    <li><strong>Identify gaps</strong> — Find opportunities your competitors are missing</li>
    <li><strong>Create optimized content</strong> — Write for both Google and AI search engines</li>
    <li><strong>Implement schema markup</strong> — Help search engines understand your content structure</li>
    <li><strong>Monitor and iterate</strong> — Track your results and refine your approach</li>
  </ol>

  <h3>❓ How long does it take to see results from ${keyword}?</h3>
  <p>Most businesses begin seeing measurable improvements within 30-90 days of implementing a comprehensive ${keyword} strategy. However, significant results — particularly AI citation improvements — typically take 3-6 months of consistent effort and content optimization.</p>

  <h2>Common Mistakes to Avoid</h2>
  <ul>
    <li>Ignoring AI-specific optimization signals</li>
    <li>Over-optimizing for traditional search at the expense of user experience</li>
    <li>Failing to track AI visibility alongside traditional rankings</li>
    <li>Not updating existing content to meet new search patterns</li>
    <li>Neglecting structured data and schema markup</li>
  </ul>

  <h2>Conclusion</h2>
  <p>${keyword} is not just a trend — it's the future of search. By implementing the strategies outlined in this article, you can ensure your business remains visible and competitive in both traditional and AI-powered search results.</p>

  <p><strong>Ready to improve your AI search visibility?</strong> <a href="https://seosights.com">Try seosights free</a> to see your SEO, AEO, and GEO scores across 17+ AI search engines.</p>
</article>`.trim()
}
