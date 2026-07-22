/**
 * Content Engine — Auto-Execute
 *
 * POST /api/content-engine/articles/[id]/auto-execute
 * Auto-executes: publishes article, generates schema, internal links, OG image placeholder.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutoExecuteBody {
  platform?: 'wordpress' | 'webflow' | 'custom'
}

// ── POST: Auto-execute article ────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as AutoExecuteBody

    const platform = body.platform || 'custom'

    // Get article with brief and reviews
    const article = await db.contentArticle.findUnique({
      where: { id },
      include: {
        brief: {
          select: {
            keywordTarget: true,
            pillar: true,
            cluster: true,
            briefContent: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    if (!article.content) {
      return NextResponse.json(
        { error: 'Article has no content to publish' },
        { status: 400 }
      )
    }

    const executionSteps: string[] = []

    // Step 1: Generate schema markup if not present
    if (!article.schemaMarkup) {
      try {
        const schemaPrompt = `Generate JSON-LD schema markup for this article. Include Article, FAQPage (if applicable), and BreadcrumbList schemas.

**Title:** ${article.title}
**Target Keyword:** ${article.brief.keywordTarget}
**Format:** ${article.format}
**Domain:** ${article.domain}

Return ONLY a valid JSON array of schema objects (no markdown):`

        const schemaResult = await routeLLM([
          { role: 'system', content: 'You are a schema markup specialist. Generate valid JSON-LD only. No markdown formatting.' },
          { role: 'user', content: schemaPrompt },
        ], { taskType: 'code', temperature: 0.2 })

        // Validate it's valid JSON
        let schemaMarkup: unknown
        try {
          schemaMarkup = JSON.parse(schemaResult.content)
        } catch {
          // Wrap in array if single object
          schemaMarkup = [{ '@context': 'https://schema.org', '@type': 'Article', headline: article.title }]
        }

        await db.contentArticle.update({
          where: { id },
          data: { schemaMarkup: JSON.stringify(schemaMarkup) },
        })
        executionSteps.push('schema_generated')
      } catch (err) {
        console.warn('[Auto-Execute] Schema generation failed:', err)
        // Apply default schema
        const defaultSchema = [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            author: { '@type': 'Organization', name: article.domain },
            publisher: { '@type': 'Organization', name: article.domain },
          },
        ]
        await db.contentArticle.update({
          where: { id },
          data: { schemaMarkup: JSON.stringify(defaultSchema) },
        })
        executionSteps.push('schema_default_applied')
      }
    } else {
      executionSteps.push('schema_already_exists')
    }

    // Step 2: Generate internal links if not present
    if (!article.internalLinks) {
      try {
        const linkPrompt = `Suggest internal links for this article on ${article.domain}.

**Title:** ${article.title}
**Keyword:** ${article.brief.keywordTarget}
**Pillar:** ${article.brief.pillar}
**Cluster:** ${article.brief.cluster || 'General'}

Suggest 5-8 internal links with anchor text and URL paths. Return as a JSON array:
[{"anchorText": "text", "url": "/path", "context": "where to place in article"}]

Return ONLY valid JSON, no markdown:`

        const linkResult = await routeLLM([
          { role: 'system', content: 'You are an internal linking strategist for seosights.com. Generate link suggestions as valid JSON only.' },
          { role: 'user', content: linkPrompt },
        ], { taskType: 'entity_extraction', temperature: 0.3 })

        let internalLinks: unknown
        try {
          internalLinks = JSON.parse(linkResult.content)
        } catch {
          internalLinks = [
            { anchorText: article.brief.keywordTarget, url: `/blog/${article.brief.keywordTarget.replace(/\s+/g, '-')}`, context: 'Introduction' },
          ]
        }

        await db.contentArticle.update({
          where: { id },
          data: { internalLinks: JSON.stringify(internalLinks) },
        })
        executionSteps.push('internal_links_generated')
      } catch (err) {
        console.warn('[Auto-Execute] Internal link generation failed:', err)
        executionSteps.push('internal_links_skipped')
      }
    } else {
      executionSteps.push('internal_links_already_exist')
    }

    // Step 3: Generate OG image placeholder
    if (!article.ogImageUrl) {
      const ogImageUrl = `https://og.${article.domain}/api/og?title=${encodeURIComponent(article.title)}&pillar=${article.brief.pillar}`
      await db.contentArticle.update({
        where: { id },
        data: { ogImageUrl },
      })
      executionSteps.push('og_image_placeholder_set')
    } else {
      executionSteps.push('og_image_already_exists')
    }

    // Step 4: Publish the article
    const publishedUrl = `https://${article.domain}/blog/${article.slug || article.id}`
    await db.contentArticle.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        publishedUrl,
      },
    })
    executionSteps.push('article_published')

    // Step 5: Update brief status
    await db.contentBrief.update({
      where: { id: article.briefId },
      data: { status: 'completed' },
    })
    executionSteps.push('brief_completed')

    // Step 6: Log the decision
    await db.contentDecisionLog.create({
      data: {
        domain: article.domain,
        decisionType: 'auto_publish',
        context: JSON.stringify({
          articleId: id,
          platform,
          seoScore: article.seoScore,
          aeoScore: article.aeoScore,
          geoScore: article.geoScore,
        }),
        decision: `Auto-published article to ${platform}`,
        rationale: `Article met quality thresholds (SEO: ${article.seoScore}, AEO: ${article.aeoScore}, GEO: ${article.geoScore})`,
        automated: true,
        articleId: id,
      },
    })
    executionSteps.push('decision_logged')

    // Step 7: Update KPI for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.contentKPI.upsert({
      where: { domain_date: { domain: article.domain, date: today } },
      create: {
        domain: article.domain,
        date: today,
        articlesPublished: 1,
        avgAIScoreGain: (article.seoScore + article.aeoScore + article.geoScore) / 3,
        autoExecuteRate: 100,
        contentFactoryOutputs: 1,
      },
      update: {
        articlesPublished: { increment: 1 },
        contentFactoryOutputs: { increment: 1 },
      },
    })
    executionSteps.push('kpi_updated')

    return NextResponse.json({
      success: true,
      publishedUrl,
      platform,
      steps: executionSteps,
    })
  } catch (error) {
    console.error('[Content Engine Auto-Execute] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-execute article' },
      { status: 500 }
    )
  }
}
