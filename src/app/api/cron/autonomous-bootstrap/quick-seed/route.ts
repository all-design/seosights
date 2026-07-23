/**
 * Cron API — Quick Seed
 *
 * GET /api/cron/autonomous-bootstrap/quick-seed
 *
 * Purpose: Minimal seed data for fast testing. Creates only:
 * 1. System user (system@seosights.com)
 * 2. ClientZero project (seosights.com)
 * 3. 3 content articles with briefs
 *
 * Use this when you need the system functional quickly without the full bootstrap.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─── Authorization ──────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  const vercelHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelHeader && vercelHeader === secret) return true

  return false
}

// ─── Helper ─────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Minimal Article Content ────────────────────────────────────────

const QUICK_ARTICLES = [
  {
    slug: 'what-is-ai-visibility-score',
    title: 'What Is an AI Visibility Score? The New Metric That Matters More Than Rankings',
    pillar: 'all',
    cluster: 'ai-visibility-fundamentals',
    keywords: ['AI visibility score', 'AI search visibility', 'LLM visibility'],
    content: `# What Is an AI Visibility Score? The New Metric That Matters More Than Rankings

For over two decades, SEO professionals lived by one metric: where you rank on Google. Position 1 was the holy grail, and anything beyond page two was essentially invisible. But the world has fundamentally changed. When someone asks ChatGPT for a recommendation or queries Perplexity for advice, your Google ranking doesn't matter. What matters is your **AI Visibility Score**.

## What Is an AI Visibility Score?

An AI Visibility Score measures how frequently and favorably your business appears in responses from large language models like ChatGPT, Claude, Gemini, and Perplexity. It ranges from 0 to 100 and incorporates citation frequency, recommendation rate, sentiment favorability, cross-model consistency, and query coverage.

## Why It Matters More Than Rankings

Over 40% of information-seeking queries now start in an AI interface. If ChatGPT recommends competitors but never mentions you, you don't exist in that conversation — regardless of your Google rankings. The AI Visibility Score captures this new reality.

## How to Improve Your Score

1. **Measure it first** — track citation rates across all major AI models
2. **Structure your content** — write clear, authoritative statements that AI can extract
3. **Build multi-platform presence** — ensure consistent information across sources AI models rely on
4. **Strengthen entity recognition** — make your brand unmistakable to AI systems

Businesses that understand and optimize their AI Visibility Score today will dominate the next era of search.`,
  },
  {
    slug: 'aeo-answer-engine-optimization-guide',
    title: 'AEO Guide: How to Get Your Business Cited by AI Search Engines',
    pillar: 'aeo',
    cluster: 'answer-engine-optimization',
    keywords: ['AEO', 'answer engine optimization', 'AI search optimization'],
    content: `# AEO Guide: How to Get Your Business Cited by AI Search Engines

Search engines are evolving from link-display machines into answer-generation engines. This shift demands Answer Engine Optimization (AEO) — structuring content so AI-powered answer engines can extract and cite your information.

## What Is AEO?

Answer Engine Optimization ensures your content can be extracted, understood, and cited by AI systems like ChatGPT, Claude, Gemini, and Perplexity. Unlike SEO (which drives clicks), AEO drives citations.

## The AEO Framework

**Layer 1: Content Structure** — Direct answers early, definitive statements, schema markup, clear headings.

**Layer 2: Entity Clarity** — Consistent naming, disambiguation, rich entity profiles across platforms.

**Layer 3: Source Authority** — Domain authority, publication partnerships, citation velocity.

**Layer 4: Conversation Readiness** — FAQ-style content, comparison-ready statements, quote-worthy language.

## Getting Started

1. Audit your current AI visibility across all models
2. Map the questions your audience asks AI
3. Restructure key pages with the AEO framework
4. Build your entity profile consistently
5. Monitor your AI Visibility Score and iterate

AEO is the frontier of search visibility. Master it now for a decisive advantage.`,
  },
  {
    slug: 'seo-aeo-geo-difference',
    title: 'SEO vs AEO vs GEO: The Three Pillars of Modern Search Visibility',
    pillar: 'all',
    cluster: 'search-visibility-pillars',
    keywords: ['SEO vs AEO vs GEO', 'search visibility pillars', 'modern search optimization'],
    content: `# SEO vs AEO vs GEO: The Three Pillars of Modern Search Visibility

The search landscape has fractured into three distinct disciplines. Understanding SEO, AEO, and GEO — and their connections — is essential for complete visibility.

## SEO: The Foundation

Search Engine Optimization ensures discoverability by all systems. Rankings, traffic, crawlability. Without SEO, even the best AEO and GEO strategies fail — AI models can't cite content they can't find.

## AEO: The Structure

Answer Engine Optimization ensures content can be extracted and cited by AI systems. Citation rate, content structure, schema markup, definitive statements. AEO bridges discoverability and citation.

## GEO: The Strategy

Generative Engine Optimization shapes how AI models perceive and recommend your business across platforms and over time. Multi-model visibility, training data influence, recommendation consistency.

## The Stack Connection

SEO → AEO → GEO. Each pillar builds on the previous:
- SEO provides discoverability (content must be found)
- AEO provides extraction (content must be structured)
- GEO provides perception (being cited leads to being recommended)

All three are necessary for complete AI visibility. Start with SEO, add AEO immediately, and build GEO over time.`,
  },
]

// ─── Main Handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  try {
    // ─── 1. Create System User ──────────────────────────────────────
    const systemUser = await db.user.upsert({
      where: { email: 'system@seosights.com' },
      update: { role: 'superadmin', name: 'System Autonomous Agent' },
      create: {
        email: 'system@seosights.com',
        name: 'System Autonomous Agent',
        role: 'superadmin',
        subscriptionStatus: 'active',
        tier: 'managed',
      },
    })
    results.user = { id: systemUser.id, email: systemUser.email }

    // ─── 2. Create ClientZero Project ──────────────────────────────
    const project = await db.project.upsert({
      where: { id: 'clientzero-project' },
      update: {},
      create: {
        id: 'clientzero-project',
        userId: systemUser.id,
        url: 'https://seosights.com',
        domain: 'seosights.com',
        targetMarket: 'global',
        executionMode: 'auto-pilot',
        isInternalAutopilot: true,
        cmsPlatform: 'nextjs',
        autopilotPostsPerMonth: 30,
      },
    })
    results.project = { id: project.id, domain: project.domain }

    // ─── 3. Create 3 Content Articles ─────────────────────────────
    const articleRecords = []
    for (let i = 0; i < QUICK_ARTICLES.length; i++) {
      const article = QUICK_ARTICLES[i]

      const brief = await db.contentBrief.create({
        data: {
          domain: 'seosights.com',
          topic: article.title,
          keywordTarget: article.keywords[0],
          pillar: article.pillar,
          cluster: article.cluster,
          suggestedTitle: article.title,
          targetWordCount: 1500,
          estimatedScoreGain: 200,
          opportunitySource: 'quick-seed',
          status: 'completed',
          priority: 'high',
        },
      })

      const wordCount = article.content.split(/\s+/).length

      const contentArticle = await db.contentArticle.create({
        data: {
          briefId: brief.id,
          domain: 'seosights.com',
          title: article.title,
          slug: article.slug,
          content: article.content,
          wordCount,
          format: 'blog',
          pillar: article.pillar,
          status: 'published',
          seoScore: 70 + i * 5,
          aeoScore: 75 + i * 5,
          geoScore: 65 + i * 5,
          publishedAt: daysAgo(2 - i),
          metadata: JSON.stringify({
            cluster: article.cluster,
            keywords: article.keywords,
            quickSeed: true,
          }),
        },
      })

      articleRecords.push({
        id: contentArticle.id,
        slug: contentArticle.slug,
        title: contentArticle.title,
        pillar: contentArticle.pillar,
        wordCount: contentArticle.wordCount,
      })
    }
    results.articles = articleRecords

    return NextResponse.json({
      success: true,
      message: 'Quick seed completed — minimum data for testing',
      created: {
        user: 1,
        project: 1,
        contentBriefs: 3,
        contentArticles: 3,
      },
      details: results,
    })
  } catch (error) {
    console.error('[quick-seed] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Quick seed failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        partialResults: results,
      },
      { status: 500 }
    )
  }
}
