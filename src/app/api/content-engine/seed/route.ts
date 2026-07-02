/**
 * Content Engine — Seed Database
 *
 * POST /api/content-engine/seed
 * Seeds the database with sample data for testing.
 * Uses generateContentTopics() from client-zero-topics.ts
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContentTopics } from '@/lib/client-zero-topics'

const DEFAULT_DOMAIN = 'seosights.com'

// ── POST: Seed sample data ────────────────────────────────────────────────────

export async function POST() {
  try {
    const topics = generateContentTopics()
    const results: Record<string, number> = {}

    // ── 1. Create sample briefs ────────────────────────────────────────────
    const briefTopics = topics.slice(0, 15) // Use first 15 topics
    const briefs: any[] = []

    for (const topic of briefTopics) {
      const brief = await db.contentBrief.create({
        data: {
          domain: DEFAULT_DOMAIN,
          topic: topic.suggestedTitle,
          keywordTarget: topic.keywordTarget,
          pillar: topic.pillar,
          cluster: topic.cluster,
          suggestedTitle: topic.suggestedTitle,
          targetWordCount: 2500,
          estimatedScoreGain: Math.floor(Math.random() * 30) + 10,
          opportunitySource: 'topic_database',
          opportunityData: JSON.stringify({ cluster: topic.cluster, pillar: topic.pillar }),
          briefContent: JSON.stringify({
            outline: [
              { heading: 'Introduction', subheadings: ['Why this matters'], wordCount: 300 },
              { heading: 'Core Concepts', subheadings: ['Definition', 'Key principles'], wordCount: 500 },
              { heading: 'Implementation Guide', subheadings: ['Step-by-step', 'Best practices'], wordCount: 700 },
              { heading: 'Advanced Strategies', subheadings: ['Pro tips', 'Common pitfalls'], wordCount: 500 },
              { heading: 'FAQ', subheadings: [], wordCount: 300 },
              { heading: 'Conclusion', subheadings: ['Key takeaways'], wordCount: 200 },
            ],
            entities: [topic.keywordTarget],
            faqSuggestions: [
              { question: `What is ${topic.keywordTarget}?`, answerOutline: 'Core definition' },
            ],
            internalLinkSuggestions: [
              { anchorText: topic.keywordTarget, suggestedPath: `/blog/${topic.keywordTarget.replace(/\s+/g, '-')}`, reason: 'Primary keyword' },
            ],
            schemaRecommendations: ['Article', 'FAQPage'],
            aeoOptimizations: ['Use question-based headings'],
            geoOptimizations: ['Optimize entity mentions'],
            targetAudience: 'SEO professionals',
            searchIntent: 'informational',
          }),
          status: ['draft', 'approved', 'in_progress', 'completed'][Math.floor(Math.random() * 4)] as string,
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as string,
        },
      })
      briefs.push(brief)
    }
    results.briefs = briefs.length

    // ── 2. Create sample articles ──────────────────────────────────────────
    const articles: any[] = []
    const formats = ['blog', 'landing_page', 'case_study', 'linkedin', 'twitter_thread', 'newsletter', 'docs', 'vs_page']

    for (const brief of briefs.slice(0, 10)) {
      const format = formats[Math.floor(Math.random() * formats.length)]
      const article = await db.contentArticle.create({
        data: {
          briefId: brief.id,
          domain: DEFAULT_DOMAIN,
          title: brief.suggestedTitle,
          slug: brief.suggestedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          content: `# ${brief.suggestedTitle}\n\n## Introduction\n\nThis is a sample article about ${brief.keywordTarget}. ${brief.topic} is an essential topic for modern SEO professionals.\n\n## Key Concepts\n\nUnderstanding ${brief.keywordTarget} is critical for AI search visibility.\n\n## Implementation\n\nHere are the steps to implement ${brief.keywordTarget} effectively.\n\n## Conclusion\n\n${brief.keywordTarget} represents the future of search optimization.`,
          wordCount: 1200 + Math.floor(Math.random() * 800),
          format,
          pillar: brief.pillar,
          status: ['draft', 'writing', 'review', 'approved', 'published'][Math.floor(Math.random() * 5)] as string,
          seoScore: Math.floor(Math.random() * 40) + 60,
          aeoScore: Math.floor(Math.random() * 40) + 60,
          geoScore: Math.floor(Math.random() * 40) + 60,
          aiVisibilityGain: Math.floor(Math.random() * 30),
          publishedUrl: `https://${DEFAULT_DOMAIN}/blog/${brief.suggestedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          publishedAt: Math.random() > 0.5 ? new Date() : null,
          schemaMarkup: JSON.stringify([
            { '@context': 'https://schema.org', '@type': 'Article', headline: brief.suggestedTitle },
          ]),
          internalLinks: JSON.stringify([
            { anchorText: brief.keywordTarget, url: `/blog/${brief.keywordTarget.replace(/\s+/g, '-')}` },
          ]),
          ogImageUrl: `https://og.${DEFAULT_DOMAIN}/api/og?title=${encodeURIComponent(brief.suggestedTitle)}`,
          metadata: JSON.stringify({ seeded: true }),
        },
      })
      articles.push(article)
    }
    results.articles = articles.length

    // ── 3. Create sample reviews ───────────────────────────────────────────
    const reviewerTypes = ['seo_review', 'aeo_review', 'geo_review', 'fact_checker', 'citation_optimizer', 'internal_linker', 'schema_builder']
    let reviewCount = 0

    for (const article of articles.slice(0, 5)) {
      for (const reviewerType of reviewerTypes.slice(0, 3 + Math.floor(Math.random() * 5))) {
        await db.contentReview.create({
          data: {
            articleId: article.id,
            reviewerType,
            status: ['passed', 'failed', 'needs_revision'][Math.floor(Math.random() * 3)] as string,
            score: Math.floor(Math.random() * 40) + 60,
            findings: JSON.stringify({
              issues: [`Sample issue for ${reviewerType}`],
              suggestions: [`Sample suggestion for ${reviewerType}`],
              passes: [`Sample pass for ${reviewerType}`],
            }),
            autoFixes: JSON.stringify([]),
            confidence: Math.floor(Math.random() * 30) + 70,
            model: 'seed-data',
            tokensUsed: Math.floor(Math.random() * 2000) + 500,
            costUsd: Math.random() * 0.05,
            reviewedAt: new Date(),
          },
        })
        reviewCount++
      }
    }
    results.reviews = reviewCount

    // ── 4. Create editorial calendar entries ────────────────────────────────
    const weeklyThemes: Record<number, string> = {
      1: 'Entity SEO Mondays',
      2: 'Claude SEO / GEO Tuesdays',
      3: 'AI Visibility Score Wednesdays',
      4: 'AEO & Featured Snippets Thursdays',
      5: 'Content Strategy & E-E-A-T Fridays',
      6: 'Product Updates & Case Studies',
      7: 'Weekly Roundup / Newsletter',
    }

    let calendarCount = 0
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      date.setHours(0, 0, 0, 0)

      const jsDay = date.getDay()
      const dayOfWeek = jsDay === 0 ? 7 : jsDay
      const theme = weeklyThemes[dayOfWeek] || 'General'

      try {
        await db.editorialCalendarEntry.upsert({
          where: { domain_date: { domain: DEFAULT_DOMAIN, date } },
          create: {
            domain: DEFAULT_DOMAIN,
            date,
            dayOfWeek,
            theme,
            status: ['scheduled', 'brief_generated', 'writing', 'review', 'published'][Math.floor(Math.random() * 5)] as string,
            briefId: i < briefs.length ? briefs[i].id : null,
            articleId: i < articles.length ? articles[i].id : null,
            notes: `Sample calendar entry for ${theme}`,
          },
          update: {},
        })
        calendarCount++
      } catch {
        // Skip duplicates
      }
    }
    results.calendarEntries = calendarCount

    // ── 5. Create KPI entries ───────────────────────────────────────────────
    let kpiCount = 0
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      try {
        await db.contentKPI.upsert({
          where: { domain_date: { domain: DEFAULT_DOMAIN, date } },
          create: {
            domain: DEFAULT_DOMAIN,
            date,
            articlesPublished: Math.floor(Math.random() * 3) + 1,
            avgAIScoreGain: Math.random() * 20 + 5,
            totalCitationGain: Math.floor(Math.random() * 15),
            totalAIMentions: Math.floor(Math.random() * 50) + 10,
            organicClicksDelta: Math.floor(Math.random() * 200) - 50,
            articlesReplayed: Math.floor(Math.random() * 2),
            articlesRewritten: Math.random() > 0.7 ? 1 : 0,
            autoExecuteRate: Math.random() * 40 + 60,
            avgReviewScore: Math.random() * 20 + 70,
            contentFactoryOutputs: Math.floor(Math.random() * 5),
          },
          update: {},
        })
        kpiCount++
      } catch {
        // Skip duplicates
      }
    }
    results.kpiEntries = kpiCount

    // ── 6. Create sample experiments ───────────────────────────────────────
    const experiments: any[] = []
    if (articles.length >= 4) {
      const exp = await db.contentExperiment.create({
        data: {
          domain: DEFAULT_DOMAIN,
          title: 'Blog vs Landing Page: AI Visibility Comparison',
          hypothesis: 'Blog format will get more AI citations than landing page format',
          metric: 'ai_visibility',
          status: 'running',
          startDate: new Date(),
          variants: {
            create: [
              {
                articleId: articles[0].id,
                label: 'Version A (Blog)',
                aiVisibilityBefore: articles[0].aiVisibilityGain,
                aiVisibilityAfter: articles[0].aiVisibilityGain + Math.floor(Math.random() * 15),
                citationsBefore: Math.floor(Math.random() * 3),
                citationsAfter: Math.floor(Math.random() * 5) + 2,
                organicClicks: Math.floor(Math.random() * 100),
              },
              {
                articleId: articles[1].id,
                label: 'Version B (Landing Page)',
                aiVisibilityBefore: articles[1].aiVisibilityGain,
                aiVisibilityAfter: articles[1].aiVisibilityGain + Math.floor(Math.random() * 10),
                citationsBefore: Math.floor(Math.random() * 2),
                citationsAfter: Math.floor(Math.random() * 3) + 1,
                organicClicks: Math.floor(Math.random() * 80),
              },
            ],
          },
        },
      })
      experiments.push(exp)
    }

    if (articles.length >= 6) {
      const exp2 = await db.contentExperiment.create({
        data: {
          domain: DEFAULT_DOMAIN,
          title: 'AEO-Optimized vs Standard Content',
          hypothesis: 'AEO-optimized content will achieve higher citation rates',
          metric: 'citations',
          status: Math.random() > 0.5 ? 'running' : 'completed',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          variants: {
            create: [
              {
                articleId: articles[2].id,
                label: 'Version A (AEO-Optimized)',
                aiVisibilityBefore: articles[2].aiVisibilityGain,
                aiVisibilityAfter: articles[2].aiVisibilityGain + 20,
                citationsBefore: 2,
                citationsAfter: 8,
                organicClicks: 150,
              },
              {
                articleId: articles[3].id,
                label: 'Version B (Standard)',
                aiVisibilityBefore: articles[3].aiVisibilityGain,
                aiVisibilityAfter: articles[3].aiVisibilityGain + 8,
                citationsBefore: 1,
                citationsAfter: 3,
                organicClicks: 90,
              },
            ],
          },
        },
      })
      experiments.push(exp2)
    }
    results.experiments = experiments.length

    // ── 7. Create decision log entries ─────────────────────────────────────
    const decisionTypes = ['auto_publish', 'auto_rewrite', 'experiment_winner', 'topic_selection', 'review_override', 'replay_trigger']
    let decisionCount = 0

    for (const article of articles.slice(0, 5)) {
      const dtype = decisionTypes[Math.floor(Math.random() * decisionTypes.length)]
      await db.contentDecisionLog.create({
        data: {
          domain: DEFAULT_DOMAIN,
          decisionType: dtype,
          context: JSON.stringify({ articleId: article.id, format: article.format }),
          decision: `Sample ${dtype} decision for article: ${article.title}`,
          rationale: `Automated decision based on ${dtype} rules`,
          impact: Math.random() > 0.5 ? `Positive impact on ${article.format} content` : null,
          automated: Math.random() > 0.3,
          articleId: article.id,
        },
      })
      decisionCount++
    }

    // Add a few more random decisions
    for (let i = 0; i < 5; i++) {
      const dtype = decisionTypes[Math.floor(Math.random() * decisionTypes.length)]
      await db.contentDecisionLog.create({
        data: {
          domain: DEFAULT_DOMAIN,
          decisionType: dtype,
          context: JSON.stringify({ source: 'seed' }),
          decision: `Sample ${dtype} decision`,
          rationale: 'Seeded for testing',
          automated: true,
        },
      })
      decisionCount++
    }
    results.decisionLogEntries = decisionCount

    return NextResponse.json({
      message: 'Database seeded successfully',
      results,
    }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Seed] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
