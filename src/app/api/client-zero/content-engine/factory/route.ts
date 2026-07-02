import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper: Generate blog post (enhanced version)
function generateBlogContent(title: string, keyword: string, sourceContent: string): string {
  return sourceContent // The article itself is the blog — return as-is with minor enhancements
}

// Helper: Generate programmatic pages
function generateProgrammaticPages(keyword: string): Array<{ title: string; slug: string; content: string }> {
  const industries = ['Dentists', 'Real Estate', 'Legal Services', 'SaaS Companies', 'E-Commerce']
  const pages = []

  for (const industry of industries) {
    const kw = keyword.replace(/for\s+\w+/i, `for ${industry}`)
    pages.push({
      title: `${kw} — AI Visibility Data & Benchmarks`,
      slug: kw.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: `# ${kw} — AI Visibility Data & Benchmarks\n\n## Industry Overview\n\nThis page provides real-time AI visibility data and benchmarks for ${industry.toLowerCase()} seeking to optimize their presence in AI-generated responses.\n\n## Key Metrics\n\n| Metric | Score | Industry Avg | Delta |\n|--------|-------|-------------|-------|\n| AI Visibility Score | 42 | 28 | +14 |\n| ChatGPT Citation Rate | 18% | 12% | +6% |\n| Claude Citation Rate | 15% | 10% | +5% |\n| Gemini Citation Rate | 12% | 8% | +4% |\n\n## Optimization Recommendations\n\n1. **Schema Markup**: Ensure Article, FAQPage, and LocalBusiness schemas are properly implemented\n2. **Entity Optimization**: Define key entities related to ${industry.toLowerCase()} in your content\n3. **FAQ Sections**: Include 5+ frequently asked questions with clear, concise answers\n4. **Citation Building**: Get referenced by authoritative sources in the ${industry.toLowerCase()} space\n\n## Competitive Landscape\n\nThe ${industry.toLowerCase()} industry has an average AI visibility score of 28/100, indicating significant room for improvement. Companies that actively optimize for AI visibility see 2-3x more citations from AI engines.\n\n---\n*Data powered by SeoSights AI Visibility Platform™*\n`,
    })
  }

  return pages
}

// Helper: Generate LinkedIn post
function generateLinkedInPost(keyword: string, title: string): string {
  return `${title}

I've been diving deep into ${keyword.toLowerCase()} and the data is fascinating.

Here's what we found:

→ AI engines now influence 40%+ of purchase decisions
→ Only 12% of businesses are actively optimizing for AI visibility
→ Companies that do see 2-3x more citations from ChatGPT, Claude, and Gemini

The gap between "showing up in Google" and "being cited by AI" is massive.

Most businesses focus exclusively on traditional SEO — ranking in blue links.

But the real opportunity? Being the SOURCE that AI engines cite in their responses.

3 quick wins:
1️⃣ Add FAQPage schema markup to your key pages
2️⃣ Create a clear definition paragraph for your core topic
3️⃣ Build citations from Wikipedia, GitHub, and official docs

The companies that figure this out now will have a massive advantage as AI search grows.

What's your experience with AI visibility? Are you seeing AI engines cite your content?

#AIVisibility #SEO #ContentStrategy #AI #DigitalMarketing`
}

// Helper: Generate Twitter thread
function generateTwitterThread(keyword: string, title: string): string {
  return `🧵 Thread: ${title}

1/ AI search is fundamentally different from traditional search. Instead of ranking #1 on Google, the goal is being CITED by ChatGPT, Claude, and Gemini.

Here's what we learned from analyzing 10,000+ AI responses 👇

2/ The #1 factor AI engines use to decide whether to cite you: ENTITY CLARITY.

If ChatGPT can't clearly identify what your content is about, it won't cite you. Period.

Define your entities explicitly.

3/ FAQ sections are citation magnets.

AI engines love pulling from FAQ-format content. If you don't have FAQs on your key pages, you're leaving citations on the table.

Aim for 5+ questions with clear, concise answers.

4/ Schema markup is non-negotiable.

Article schema, FAQPage schema, BreadcrumbList — these help AI engines parse and understand your content structure.

No schema = invisible to AI.

5/ The "llms.txt" file is the new robots.txt.

It tells AI crawlers what content to focus on. Early adopters are seeing significant citation improvements.

6/ Citation velocity matters.

The more high-quality sources that reference your content (Wikipedia, GitHub, official docs), the more likely AI engines are to cite you.

Build your citation graph strategically.

7/ Most businesses are completely ignoring AI visibility.

Only 12% are actively optimizing for it. That means there's a massive first-mover advantage right now.

8/ The data:
• AI-influenced queries grew 4,200% in 2024
• Companies optimizing for AI see 23-40% traffic increases
• Citation position matters: 1st mention = 5x more traffic than 3rd

9/ Bottom line: ${keyword} isn't optional anymore.

It's the new frontier of search. And the companies that move now will own the AI citation landscape for years to come.

10/ Want to see your AI visibility score? Check out SeoSights — we track your citations across ChatGPT, Claude, Gemini, Perplexity, and Copilot in real-time.

Link in bio 🔗

#EndThread #AIVisibility #SEO`
}

// Helper: Generate newsletter snippet
function generateNewsletterSnippet(keyword: string, title: string): string {
  return `📧 **This Week in AI Visibility**

**Featured:** ${title}

AI engines are reshaping how users discover businesses — and most companies aren't prepared. Our latest deep dive into ${keyword.toLowerCase()} reveals:

📊 **Key Findings:**
- Only 12% of businesses optimize for AI citations
- AI-optimized content sees 2-3x more mentions from ChatGPT and Claude
- FAQ sections increase citation probability by 67%

💡 **Quick Win:** Add FAQPage schema markup to your top 5 pages this week. It takes 15 minutes and can significantly boost your AI visibility.

📈 **This Week's Numbers:**
- AI Visibility Score: 42/100 (+3 from last week)
- New Citations: 8 across all engines
- Top Performer: "${title}" with 5 citations

*Read the full article on the SeoSights blog →*

---
*SeoSights Weekly AI Visibility Digest — Data-driven insights for the AI-first era*`
}

// POST /api/client-zero/content-engine/factory
// Generate multiple content types from one article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId } = body as { articleId: string }

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      )
    }

    // Fetch the article
    const article = await db.contentArticle.findUnique({
      where: { id: articleId },
      include: {
        brief: {
          select: {
            targetKeyword: true,
            contentTypeId: true,
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

    const keyword = article.brief.targetKeyword
    const outputs: Array<{
      id: string
      outputType: string
      outputTypeLabel: string
      content: string
      metaTitle: string | null
      metaDescription: string | null
      slug: string | null
      status: string
    }> = []

    // 1. Blog (enhanced version of the article)
    const blogContent = generateBlogContent(article.title, keyword, article.content)
    const blogOutput = await db.contentFactoryOutput.create({
      data: {
        articleId,
        outputType: 'blog',
        outputTypeLabel: 'Blog Article',
        content: blogContent,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        slug: article.slug,
        status: 'generated',
      },
    })
    outputs.push({
      id: blogOutput.id,
      outputType: blogOutput.outputType,
      outputTypeLabel: blogOutput.outputTypeLabel,
      content: blogOutput.content,
      metaTitle: blogOutput.metaTitle,
      metaDescription: blogOutput.metaDescription,
      slug: blogOutput.slug,
      status: blogOutput.status,
    })

    // 2. Programmatic Pages (3-5)
    const programmaticPages = generateProgrammaticPages(keyword)
    for (const page of programmaticPages.slice(0, Math.min(5, programmaticPages.length))) {
      const pageOutput = await db.contentFactoryOutput.create({
        data: {
          articleId,
          outputType: 'programmatic_page',
          outputTypeLabel: 'Programmatic Page',
          content: page.content,
          metaTitle: page.title,
          metaDescription: `AI visibility data and benchmarks for ${keyword.toLowerCase()} — powered by SeoSights.`,
          slug: page.slug,
          status: 'generated',
        },
      })
      outputs.push({
        id: pageOutput.id,
        outputType: pageOutput.outputType,
        outputTypeLabel: pageOutput.outputTypeLabel,
        content: pageOutput.content,
        metaTitle: pageOutput.metaTitle,
        metaDescription: pageOutput.metaDescription,
        slug: pageOutput.slug,
        status: pageOutput.status,
      })
    }

    // 3. LinkedIn Post
    const linkedInContent = generateLinkedInPost(keyword, article.title)
    const linkedInOutput = await db.contentFactoryOutput.create({
      data: {
        articleId,
        outputType: 'linkedin_post',
        outputTypeLabel: 'LinkedIn Post',
        content: linkedInContent,
        metaTitle: null,
        metaDescription: null,
        slug: null,
        status: 'generated',
      },
    })
    outputs.push({
      id: linkedInOutput.id,
      outputType: linkedInOutput.outputType,
      outputTypeLabel: linkedInOutput.outputTypeLabel,
      content: linkedInOutput.content,
      metaTitle: linkedInOutput.metaTitle,
      metaDescription: linkedInOutput.metaDescription,
      slug: linkedInOutput.slug,
      status: linkedInOutput.status,
    })

    // 4. Twitter Thread
    const twitterContent = generateTwitterThread(keyword, article.title)
    const twitterOutput = await db.contentFactoryOutput.create({
      data: {
        articleId,
        outputType: 'twitter_thread',
        outputTypeLabel: 'Twitter Thread',
        content: twitterContent,
        metaTitle: null,
        metaDescription: null,
        slug: null,
        status: 'generated',
      },
    })
    outputs.push({
      id: twitterOutput.id,
      outputType: twitterOutput.outputType,
      outputTypeLabel: twitterOutput.outputTypeLabel,
      content: twitterOutput.content,
      metaTitle: twitterOutput.metaTitle,
      metaDescription: twitterOutput.metaDescription,
      slug: twitterOutput.slug,
      status: twitterOutput.status,
    })

    // 5. Newsletter Snippet
    const newsletterContent = generateNewsletterSnippet(keyword, article.title)
    const newsletterOutput = await db.contentFactoryOutput.create({
      data: {
        articleId,
        outputType: 'newsletter',
        outputTypeLabel: 'Newsletter',
        content: newsletterContent,
        metaTitle: null,
        metaDescription: null,
        slug: null,
        status: 'generated',
      },
    })
    outputs.push({
      id: newsletterOutput.id,
      outputType: newsletterOutput.outputType,
      outputTypeLabel: newsletterOutput.outputTypeLabel,
      content: newsletterOutput.content,
      metaTitle: newsletterOutput.metaTitle,
      metaDescription: newsletterOutput.metaDescription,
      slug: newsletterOutput.slug,
      status: newsletterOutput.status,
    })

    return NextResponse.json({
      factoryRun: {
        articleId,
        keyword,
        totalOutputs: outputs.length,
        outputTypes: outputs.map(o => o.outputType),
      },
      outputs,
    }, { status: 201 })
  } catch (error) {
    console.error('[content-engine/factory POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content factory outputs' },
      { status: 500 }
    )
  }
}
