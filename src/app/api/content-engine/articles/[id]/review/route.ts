/**
 * Content Engine — Article Review Pipeline
 *
 * POST /api/content-engine/articles/[id]/review
 * Runs the multi-agent review pipeline on an article.
 * Creates ContentReview records for each reviewer type.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewRequestBody {
  reviewerTypes?: string[]
}

const ALL_REVIEWER_TYPES = [
  'seo_review',
  'aeo_review',
  'geo_review',
  'fact_checker',
  'citation_optimizer',
  'internal_linker',
  'schema_builder',
]

// ── Reviewer Prompts ──────────────────────────────────────────────────────────

const REVIEWER_PROMPTS: Record<string, { system: string; prompt: string }> = {
  seo_review: {
    system: 'You are a senior SEO auditor. Analyze content for SEO best practices. Respond in valid JSON only.',
    prompt: `Perform a comprehensive SEO review of this article. Check these areas:
1. **Title Tag**: Is it under 60 chars? Does it contain the primary keyword?
2. **H1 Tag**: Single H1, contains keyword, compelling?
3. **Entities**: Are key entities mentioned and well-defined?
4. **Internal Links**: Are there at least 3 internal links with relevant anchor text?
5. **Canonical**: Is the canonical URL set correctly?
6. **FAQ Section**: Is there an FAQ section with FAQ schema?
7. **Schema Markup**: What schema types should be present?
8. **llms.txt**: Is the content structured for llms.txt discoverability?
9. **Images**: Are images optimized with alt tags?
10. **OG Tags**: Are Open Graph tags properly configured?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": ["issue1", "issue2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "passes": ["pass1", "pass2"]
  },
  "autoFixes": [
    { "type": "title_tag", "value": "Suggested title tag" }
  ]
}`,
  },

  aeo_review: {
    system: 'You are an Answer Engine Optimization expert. Analyze content for AI search visibility. Respond in valid JSON only.',
    prompt: `Perform a comprehensive AEO (Answer Engine Optimization) review of this article. Check these areas:
1. **Question-Based Headings**: Are there question-format headings?
2. **Concise Answer Blocks**: Are answers within 40-60 words under each question heading?
3. **FAQ Schema**: Is FAQPage schema markup implemented?
4. **Featured Snippet Optimization**: Does content use lists, tables, or step-by-step formats?
5. **People Also Ask Coverage**: Are PAA questions addressed?
6. **Voice Search Readiness**: Is content conversational and scannable?
7. **Zero-Click Optimization**: Can answers stand alone without context?
8. **Natural Language Queries**: Does content match conversational search patterns?
9. **How-To Schema**: Are step-by-step guides marked up?
10. **SGE/Overview Optimization**: Is content structured for AI overview inclusion?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": [],
    "suggestions": [],
    "passes": []
  },
  "autoFixes": []
}`,
  },

  geo_review: {
    system: 'You are a Generative Engine Optimization specialist. Analyze content for AI model visibility. Respond in valid JSON only.',
    prompt: `Perform a comprehensive GEO (Generative Engine Optimization) review. Check these areas:
1. **Entity Clarity**: Are entities well-defined and consistently referenced?
2. **Knowledge Graph Signals**: Are there signals that help AI models build knowledge?
3. **Factual Statements**: Are claims supported by data and citations?
4. **AI Citation Readiness**: Is content structured so AI models would want to cite it?
5. **llms.txt Optimization**: Is content discoverable via llms.txt?
6. **Multi-Model Compatibility**: Does content work for ChatGPT, Claude, Perplexity, Gemini?
7. **Structured Data Completeness**: Are all relevant schema types implemented?
8. **Brand Mention Optimization**: Is the brand positioned as an authority?
9. **AI Overview Inclusion**: Is content optimized for Google AI Overviews?
10. **Perplexity/ChatGPT Citation Potential**: Would AI models cite this content?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": [],
    "suggestions": [],
    "passes": []
  },
  "autoFixes": []
}`,
  },

  fact_checker: {
    system: 'You are a meticulous fact-checker for SEO and AI marketing content. Verify claims and statistics. Respond in valid JSON only.',
    prompt: `Fact-check this article for accuracy. Verify:
1. **Statistics**: Are cited statistics accurate and attributed?
2. **Technical Claims**: Are SEO/AEO/GEO technical claims correct?
3. **Best Practices**: Are recommended practices current for 2025?
4. **Tool References**: Are mentions of tools/platforms accurate?
5. **Algorithm Updates**: Are references to Google/AI algorithm updates correct?
6. **Industry Standards**: Are claims about SEO standards accurate?
7. **Dates & Timelines**: Are temporal references correct?
8. **Credibility**: Are claims properly sourced or marked as opinion?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": ["Inaccurate claim: ..."],
    "suggestions": ["Add citation for ..."],
    "passes": ["Verified: ..."]
  },
  "autoFixes": []
}`,
  },

  citation_optimizer: {
    system: 'You are a citation optimization specialist for AI search visibility. Improve content citability. Respond in valid JSON only.',
    prompt: `Optimize this article for AI citation potential. Analyze:
1. **Quotable Statements**: Are there clear, quotable statements AI models would extract?
2. **Definition Blocks**: Are key terms defined in a citeable format?
3. **Data Points**: Are statistics presented in a way AI models reference?
4. **Authority Signals**: Are author/expert credentials established?
5. **Source Attribution**: Are sources properly cited?
6. **Unique Insights**: Does the content offer original analysis AI models would value?
7. **Summary Blocks**: Are there concise summaries AI could reference?
8. **Comparison Tables**: Are comparisons presented in structured formats?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": [],
    "suggestions": [],
    "passes": []
  },
  "autoFixes": [
    { "type": "add_definition", "value": "Suggested definition block" }
  ]
}`,
  },

  internal_linker: {
    system: 'You are an internal linking strategist. Optimize content internal link structure. Respond in valid JSON only.',
    prompt: `Analyze and optimize internal linking for this article. Check:
1. **Link Density**: Are there enough internal links (3+ per 1000 words)?
2. **Anchor Text**: Is anchor text descriptive and keyword-rich?
3. **Link Relevance**: Are links contextually relevant?
4. **Hub & Spoke**: Does the article link to/from pillar pages?
5. **Orphan Risk**: Is this article reachable from other content?
6. **Cluster Linking**: Are related cluster articles interconnected?
7. **Navigation Path**: Is there a clear content hierarchy via links?
8. **Link Distribution**: Are links evenly distributed throughout?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": [],
    "suggestions": [],
    "passes": []
  },
  "autoFixes": [
    { "type": "add_link", "anchorText": "text", "url": "/path", "context": "where to add" }
  ]
}`,
  },

  schema_builder: {
    system: 'You are a schema markup specialist. Generate and validate structured data. Respond in valid JSON only.',
    prompt: `Generate and validate schema markup for this article. Analyze:
1. **Article Schema**: Is Article schema properly implemented?
2. **FAQPage Schema**: Should FAQ schema be added?
3. **HowTo Schema**: Are there step-by-step processes to mark up?
4. **BreadcrumbList**: Is breadcrumb navigation schema present?
5. **Author/Organization**: Are author and publisher schemas set?
6. **Date Modified**: Is dateModified tracked?
7. **Image Object**: Are images marked up?
8. **Speakable Specification**: Is content marked for voice assistants?

Return a JSON object:
{
  "score": 0-100,
  "status": "passed|failed|needs_revision",
  "findings": {
    "issues": [],
    "suggestions": [],
    "passes": []
  },
  "autoFixes": [
    { "type": "schema_markup", "value": { "@context": "https://schema.org", "@type": "..." } }
  ]
}`,
  },
}

// ── POST: Run review pipeline ─────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as ReviewRequestBody

    const reviewerTypes = body.reviewerTypes || ALL_REVIEWER_TYPES

    // Validate reviewer types
    const invalidTypes = reviewerTypes.filter((t) => !ALL_REVIEWER_TYPES.includes(t))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid reviewer types: ${invalidTypes.join(', ')}. Valid types: ${ALL_REVIEWER_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get article with brief
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
        { error: 'Article has no content to review' },
        { status: 400 }
      )
    }

    // Update article status to 'review'
    await db.contentArticle.update({
      where: { id },
      data: { status: 'review' },
    })

    // Truncate content for AI context (avoid token limits)
    const contentPreview = article.content.length > 8000
      ? article.content.substring(0, 8000) + '\n\n[... content truncated for review ...]'
      : article.content

    // Run reviews in parallel
    const reviewPromises = reviewerTypes.map(async (reviewerType) => {
      const reviewerConfig = REVIEWER_PROMPTS[reviewerType]
      if (!reviewerConfig) return null

      try {
        const aiResult = await routeLLM([
          { role: 'system', content: reviewerConfig.system },
          {
            role: 'user',
            content: `${reviewerConfig.prompt}\n\n**Article Title:** ${article.title}\n**Target Keyword:** ${article.brief.keywordTarget}\n**Pillar:** ${article.brief.pillar}\n\n**Article Content:**\n${contentPreview}`,
          },
        ], { taskType: 'classification', temperature: 0.3 })

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(aiResult.content)
        } catch {
          parsed = {
            score: 50,
            status: 'needs_revision',
            findings: {
              issues: ['AI response was not valid JSON'],
              suggestions: [],
              passes: [],
            },
            autoFixes: [],
            rawResponse: aiResponse,
          }
        }

        const score = typeof parsed.score === 'number' ? parsed.score : 50
        const status = ['passed', 'failed', 'needs_revision'].includes(parsed.status as string)
          ? parsed.status
          : 'needs_revision'

        const review = await db.contentReview.create({
          data: {
            articleId: article.id,
            reviewerType,
            status: status as string,
            score,
            findings: JSON.stringify(parsed.findings || {}),
            autoFixes: JSON.stringify(parsed.autoFixes || []),
            confidence: Math.min(score + 10, 100),
            model: 'ai-router',
            tokensUsed: 0,
            costUsd: 0,
            reviewedAt: new Date(),
          },
        })

        return review
      } catch (aiError) {
        console.warn(`[Content Engine Review] ${reviewerType} failed:`, aiError)

        // Create a fallback review entry
        const review = await db.contentReview.create({
          data: {
            articleId: article.id,
            reviewerType,
            status: 'needs_revision',
            score: 0,
            findings: JSON.stringify({
              issues: ['Review pipeline failed - AI unavailable'],
              suggestions: ['Retry review later'],
              passes: [],
            }),
            autoFixes: JSON.stringify([]),
            confidence: 0,
            model: 'fallback',
            tokensUsed: 0,
            costUsd: 0,
            reviewedAt: new Date(),
          },
        })

        return review
      }
    })

    const reviews = (await Promise.all(reviewPromises)).filter(Boolean)

    // Calculate aggregate scores
    const seoReviews = reviews.filter((r) => r?.reviewerType === 'seo_review')
    const aeoReviews = reviews.filter((r) => r?.reviewerType === 'aeo_review')
    const geoReviews = reviews.filter((r) => r?.reviewerType === 'geo_review')

    const avgScore = (arr: (typeof reviews)[0][]) =>
      arr.length > 0 ? Math.round(arr.reduce((sum, r) => sum + (r?.score || 0), 0) / arr.length) : 0

    // Update article with review scores
    await db.contentArticle.update({
      where: { id },
      data: {
        seoScore: avgScore(seoReviews),
        aeoScore: avgScore(aeoReviews),
        geoScore: avgScore(geoReviews),
        reviewResults: JSON.stringify(
          reviews.map((r) => ({
            reviewerType: r?.reviewerType,
            score: r?.score,
            status: r?.status,
          }))
        ),
      },
    })

    // Log the decision
    await db.contentDecisionLog.create({
      data: {
        domain: article.domain,
        decisionType: 'review_override',
        context: JSON.stringify({ articleId: id, reviewerTypes }),
        decision: `Completed ${reviews.length} reviews`,
        rationale: 'Automated multi-agent review pipeline',
        automated: true,
        articleId: id,
      },
    })

    return NextResponse.json({
      reviews,
      aggregate: {
        seoScore: avgScore(seoReviews),
        aeoScore: avgScore(aeoReviews),
        geoScore: avgScore(geoReviews),
        overallScore: avgScore(reviews as (typeof reviews)[0][]),
        totalReviews: reviews.length,
      },
    })
  } catch (error) {
    console.error('[Content Engine Review] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to run review pipeline' },
      { status: 500 }
    )
  }
}
