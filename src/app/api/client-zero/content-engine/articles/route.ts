import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper: Generate realistic article content from a brief
function generateArticleContent(
  keyword: string,
  outline: Array<{ h2: string; h3s: string[]; points: string[] }>,
  secondaryKeywords: string[],
  entityTargets: Array<{ entity: string; type: string; reason: string }>,
  contentType: string
): { title: string; slug: string; content: string; metaTitle: string; metaDescription: string; faqEntries: string; wordCount: number } {
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const title = `${keyword}: The Complete Guide for 2025`
  const metaTitle = `${keyword} | Complete Guide 2025 — SeoSights`
  const metaDescription = `Master ${keyword} with our comprehensive 2025 guide. Learn proven strategies, tools, and best practices to boost your AI visibility and get cited by ChatGPT, Claude, and Gemini.`

  let content = `# ${title}\n\n`
  content += `In today's AI-driven search landscape, ${keyword.toLowerCase()} has become a critical factor for businesses seeking online visibility. As AI engines like ChatGPT, Claude, and Gemini increasingly influence how users discover and evaluate solutions, understanding and optimizing for ${keyword.toLowerCase()} is no longer optional — it's essential.\n\n`
  content += `This comprehensive guide covers everything you need to know about ${keyword.toLowerCase()}, from foundational concepts to advanced strategies that top-performing companies are using right now.\n\n`

  // Add table of contents
  content += `## Table of Contents\n\n`
  for (let i = 0; i < outline.length; i++) {
    content += `${i + 1}. [${outline[i].h2}](#${outline[i].h2.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`
  }
  content += `\n`

  // Generate each section
  for (const section of outline) {
    content += `## ${section.h2}\n\n`

    // Intro paragraph for section
    content += `Understanding ${section.h2.toLowerCase()} is fundamental to succeeding with ${keyword.toLowerCase()}. This section breaks down the key aspects you need to master.\n\n`

    for (const h3 of section.h3s) {
      content += `### ${h3}\n\n`

      // Generate realistic content for each h3
      if (h3.toLowerCase().includes('definition') || h3.toLowerCase().includes('what is')) {
        content += `${keyword} refers to the strategic process of optimizing your digital presence so that AI-powered search engines and language models can discover, understand, and cite your content. Unlike traditional SEO that focuses on ranking in search engine results pages, ${keyword.toLowerCase()} focuses on becoming a cited source in AI-generated responses.\n\n`
        content += `The core principle is simple: when someone asks ChatGPT, Claude, or Gemini a question related to your expertise, your brand should be one of the sources these AI engines reference. This requires a fundamentally different approach to content creation and optimization.\n\n`
      } else if (h3.toLowerCase().includes('mechanic') || h3.toLowerCase().includes('how')) {
        content += `The process works through a multi-layered optimization framework. First, AI engines crawl and index content from across the web, building knowledge graphs that inform their responses. Second, these engines evaluate content quality, authority, and relevance using sophisticated algorithms. Third, when generating responses, they select the most authoritative and relevant sources to cite.\n\n`
        content += `To optimize for this process, you need to ensure your content is:\n\n`
        content += `- **Discoverable**: AI engines can find and access your content\n`
        content += `- **Understandable**: Content is structured with clear entities, definitions, and relationships\n`
        content += `- **Authoritative**: Your brand demonstrates expertise through consistent, high-quality content\n`
        content += `- **Citation-worthy**: Your content provides unique value that AI engines want to reference\n\n`
      } else if (h3.toLowerCase().includes('strateg') || h3.toLowerCase().includes('proven')) {
        content += `Based on our analysis of over 10,000 AI-generated responses, we've identified the strategies that consistently lead to citations:\n\n`
        content += `**1. Entity-First Content Architecture**\nStructure your content around well-defined entities. AI engines rely heavily on entity recognition to understand and categorize content. Each piece of content should clearly define its primary entities and their relationships.\n\n`
        content += `**2. FAQ-Optimized Sections**\nIncluding comprehensive FAQ sections dramatically increases your chances of being cited. AI engines frequently use FAQ-format content to generate their responses, making this a high-impact optimization.\n\n`
        content += `**3. Multi-Engine Targeting**\nDifferent AI engines have different citation patterns. ChatGPT tends to cite content from well-established domains with clear definitions. Claude favors in-depth, nuanced analysis. Gemini prioritizes fresh, factual content. Tailor your approach accordingly.\n\n`
        content += `**4. Citation-Worthy Data Points**\nInclude specific statistics, case studies, and original research. AI engines are more likely to cite content that provides concrete, verifiable data rather than vague generalizations.\n\n`
      } else if (h3.toLowerCase().includes('mistake') || h3.toLowerCase().includes('avoid')) {
        content += `Many organizations make critical errors that prevent AI citation, even when their content is otherwise excellent:\n\n`
        content += `- **Neglecting Schema Markup**: Without proper schema (Article, FAQPage, SoftwareApplication), AI engines struggle to parse your content structure\n`
        content += `- **Thin Content**: Articles under 1,500 words rarely get cited because they lack the depth AI engines seek\n`
        content += `- **Missing Entity Definitions**: If you don't clearly define key terms and concepts, AI engines can't properly categorize your content\n`
        content += `- **Ignoring llms.txt**: The llms.txt file is becoming essential for AI discoverability, similar to how robots.txt serves traditional crawlers\n`
        content += `- **No External Citations**: AI engines evaluate the quality of your sources. Citing Wikipedia, official documentation, and peer-reviewed research signals authority\n\n`
      } else if (h3.toLowerCase().includes('tool') || h3.toLowerCase().includes('platform') || h3.toLowerCase().includes('solution')) {
        content += `The market for ${keyword.toLowerCase()} tools has expanded significantly in 2025. Here's a comparison of the leading platforms:\n\n`
        content += `| Feature | SeoSights | Competitor A | Competitor B |\n`
        content += `|---------|-----------|--------------|-------------|\n`
        content += `| AI Visibility Score | ✅ Real-time | ⚠️ Weekly | ❌ Not available |\n`
        content += `| Multi-Engine Coverage | ✅ 5 engines | ⚠️ 3 engines | ⚠️ 2 engines |\n`
        content += `| Citation Tracking | ✅ Full | ⚠️ Basic | ❌ Not available |\n`
        content += `| Auto-Optimization | ✅ AI-powered | ❌ Manual | ❌ Manual |\n`
        content += `| Content Engine | ✅ Full pipeline | ❌ Not available | ❌ Not available |\n\n`
      } else if (h3.toLowerCase().includes('metric') || h3.toLowerCase().includes('roi') || h3.toLowerCase().includes('measur')) {
        content += `Measuring the impact of ${keyword.toLowerCase()} requires tracking both direct and indirect metrics:\n\n`
        content += `**Direct Metrics:**\n- AI Citation Rate: How often your brand appears in AI-generated responses\n- Citation Position: Where your brand appears in the AI response (1st mention = highest impact)\n- Engine Coverage: Number of AI engines citing your content\n\n`
        content += `**Indirect Metrics:**\n- Organic Traffic Lift: Increases in search traffic from AI-influenced queries\n- Brand Search Volume: Growth in branded search queries\n- Lead Quality: Improvement in lead-to-customer conversion rates\n\n`
        content += `Industry benchmarks suggest that companies actively optimizing for AI visibility see a 23-40% increase in organic traffic within 90 days, with the most significant gains coming from ChatGPT and Claude citations.\n\n`
      } else if (h3.toLowerCase().includes('trend') || h3.toLowerCase().includes('future') || h3.toLowerCase().includes('predict')) {
        content += `The landscape of ${keyword.toLowerCase()} is evolving rapidly. Key trends to watch include:\n\n`
        content += `- **AI Engine Consolidation**: As AI engines mature, citation patterns are becoming more stable and predictable\n`
        content += `- **Multimodal Citations**: AI engines are beginning to cite images, videos, and interactive content alongside text\n`
        content += `- **Real-Time Optimization**: New tools enable real-time content adjustment based on AI engine responses\n`
        content += `- **Competitive Intelligence**: Advanced platforms now monitor competitor AI visibility and identify gap opportunities\n`
        content += `- **Automated Content Factories**: AI-powered content engines can now generate, review, and publish optimized content autonomously\n\n`
      } else if (h3.toLowerCase().includes('comparison') || h3.toLowerCase().includes('glance')) {
        content += `Here's a quick overview comparing the key options:\n\n`
        content += `When evaluating solutions for ${keyword.toLowerCase()}, consider your specific needs, budget, and technical capabilities. The right choice depends on whether you need basic monitoring or a full-scale content operation.\n\n`
      } else if (h3.toLowerCase().includes('pricing') || h3.toLowerCase().includes('plan')) {
        content += `Pricing varies significantly across platforms and typically scales with the number of domains, queries tracked, and features included. Most platforms offer tiered pricing from starter plans ($49-99/month) to enterprise solutions ($499+/month).\n\n`
        content += `When evaluating pricing, consider the total cost of ownership including implementation time, training, and any additional services required.\n\n`
      } else if (h3.toLowerCase().includes('review') || h3.toLowerCase().includes('rating') || h3.toLowerCase().includes('pros')) {
        content += `User feedback consistently highlights the importance of accuracy, real-time monitoring, and actionable recommendations. The most valued features tend to be those that provide direct, measurable improvements to AI visibility scores.\n\n`
      } else if (h3.toLowerCase().includes('verdict') || h3.toLowerCase().includes('recommend')) {
        content += `Based on our comprehensive analysis, we recommend choosing a solution that aligns with your primary goals. For teams focused on AI visibility as a strategic advantage, platforms that offer multi-engine coverage and automated optimization deliver the highest ROI.\n\n`
      } else if (h3.toLowerCase().includes('prerequisite') || h3.toLowerCase().includes('getting started') || h3.toLowerCase().includes('installation')) {
        content += `Before you begin, ensure you have the following prerequisites in place: a verified domain, access to your website's CMS or codebase, and a basic understanding of SEO principles. The setup process typically takes 15-30 minutes.\n\n`
      } else if (h3.toLowerCase().includes('config') || h3.toLowerCase().includes('setting') || h3.toLowerCase().includes('option')) {
        content += `Configuration involves setting up your tracking parameters, defining target keywords, and configuring alert thresholds. Most platforms offer sensible defaults that work well for initial setup, with advanced options available for fine-tuning.\n\n`
      } else if (h3.toLowerCase().includes('api') || h3.toLowerCase().includes('endpoint') || h3.toLowerCase().includes('auth')) {
        content += `The API provides programmatic access to all platform features. Authentication uses API keys with configurable permissions. Rate limits apply based on your plan tier, with enterprise plans offering higher throughput.\n\n`
      } else if (h3.toLowerCase().includes('troubleshoot') || h3.toLowerCase().includes('issue') || h3.toLowerCase().includes('error')) {
        content += `Common issues typically fall into three categories: connectivity problems, configuration errors, and data synchronization delays. Most can be resolved through the troubleshooting steps below, with our support team available for complex issues.\n\n`
      } else {
        content += `This area is constantly evolving, and staying current with the latest developments is crucial. We recommend subscribing to industry newsletters and regularly testing your AI visibility to identify optimization opportunities.\n\n`
      }
    }

    // Add a point summary
    if (section.points.length > 0) {
      content += `**Key Takeaways:**\n\n`
      for (const point of section.points) {
        content += `- ${point}\n`
      }
      content += `\n`
    }
  }

  // Add FAQ section
  content += `## Frequently Asked Questions\n\n`
  const faqs = [
    { q: `What is ${keyword}?`, a: `${keyword} is the strategic process of optimizing your content and digital presence so that AI search engines like ChatGPT, Claude, and Gemini can discover, understand, and cite your brand in their generated responses.` },
    { q: `How is ${keyword} different from traditional SEO?`, a: `While traditional SEO focuses on ranking in search engine results pages, ${keyword} focuses on being cited by AI engines in their generated responses. This requires different optimization strategies including entity optimization, schema markup, and AI-specific content structures.` },
    { q: `How long does it take to see results from ${keyword}?`, a: `Most organizations see initial improvements within 30-60 days of implementing ${keyword.toLowerCase()} strategies. Significant, measurable results typically appear within 90 days, with the most impactful gains coming from consistent, ongoing optimization.` },
    { q: `Do I need technical expertise for ${keyword}?`, a: `While some aspects of ${keyword.toLowerCase()} benefit from technical knowledge, many core strategies can be implemented by content teams. Platforms like SeoSights automate much of the technical work, making AI visibility optimization accessible to teams of all skill levels.` },
    { q: `What tools do I need for ${keyword}?`, a: `A comprehensive AI visibility platform like SeoSights provides all the tools you need, including AI visibility scoring, citation tracking, content optimization, and automated review pipelines. Additional tools like schema validators and content analysis platforms can supplement your workflow.` },
  ]

  for (const faq of faqs) {
    content += `### ${faq.q}\n\n${faq.a}\n\n`
  }

  // Add conclusion
  content += `## Conclusion\n\n`
  content += `${keyword} represents a fundamental shift in how businesses need to think about online visibility. As AI engines become the primary way users discover and evaluate solutions, optimizing for AI citation is no longer a nice-to-have — it's a competitive necessity.\n\n`
  content += `By following the strategies outlined in this guide, you'll be well-positioned to increase your AI visibility, earn more citations from major AI engines, and ultimately drive more qualified traffic and leads to your business.\n\n`
  content += `Ready to take your AI visibility to the next level? [Start your free trial of SeoSights](https://seosights.com) today and see how our AI-powered platform can transform your content strategy.\n\n`
  content += `---\n*This article was generated by the SeoSights Content Engine™ — our closed-loop content operating system that Detects → Writes → Reviews → Optimizes → Publishes → Measures → Improves content for maximum AI visibility.*\n`

  // Count words approximately
  const wordCount = content.split(/\s+/).length

  const faqEntries = JSON.stringify(faqs)

  return { title, slug, content, metaTitle, metaDescription, faqEntries, wordCount }
}

// GET /api/client-zero/content-engine/articles
// List articles with filtering (status, briefId, needsRewrite)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const briefId = searchParams.get('briefId') || undefined
    const needsRewrite = searchParams.get('needsRewrite')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (briefId) where.briefId = briefId
    if (needsRewrite === 'true') where.needsRewrite = true

    const [articles, total] = await Promise.all([
      db.contentArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brief: {
            select: {
              targetKeyword: true,
              contentTypeId: true,
              contentTypeLabel: true,
            },
          },
        },
      }),
      db.contentArticle.count({ where }),
    ])

    // If no articles exist and no filters, return seed data
    if (articles.length === 0 && !status && !briefId) {
      return NextResponse.json({
        articles: [
          {
            id: 'seed-article-1',
            briefId: 'seed-brief-1',
            version: 1,
            title: 'AI Visibility for Dentists: The Complete Guide for 2025',
            slug: 'ai-visibility-for-dentists',
            content: '# AI Visibility for Dentists: The Complete Guide for 2025\n\n*Seed article content — 2,500+ words of structured content about AI visibility for dental practices.*\n\n## What Is AI Visibility for Dentists?\n\nAI visibility for dentists refers to the strategic process of optimizing a dental practice\'s online presence so that AI-powered search engines can discover, understand, and cite the practice in their generated responses...\n\n*(Full content generated by Content Engine™)*',
            metaTitle: 'AI Visibility for Dentists | Complete Guide 2025 — SeoSights',
            metaDescription: 'Master AI visibility for dentists with our comprehensive 2025 guide.',
            wordCount: 2547,
            seoScore: 82,
            aeoScore: 75,
            geoScore: 78,
            citationReadiness: 68,
            schemaJson: null,
            faqEntries: '[{"q":"What is AI Visibility for Dentists?","a":"AI Visibility for Dentists is the process of optimizing your dental practice content so AI engines cite you."}]',
            internalLinks: '[{"anchor":"AI Router","href":"/features/ai-router"},{"anchor":"Mission Control","href":"/features/mission-control"}]',
            externalCitations: '[{"title":"Wikipedia - Search Engine Optimization","url":"https://en.wikipedia.org/wiki/Search_engine_optimization"}]',
            ogImageUrl: null,
            publishedUrl: null,
            publishedAt: null,
            platform: 'wordpress',
            aiScoreBefore: 42,
            aiScoreAfter: 0,
            aiScoreDelta: 0,
            citationsGained: 0,
            organicClicks: 0,
            aiMentions: 0,
            needsRewrite: false,
            rewriteReason: null,
            parentArticleId: null,
            experimentId: null,
            status: 'reviewing',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            brief: { targetKeyword: 'AI Visibility for Dentists', contentTypeId: 'blog', contentTypeLabel: 'Blog Article' },
          },
          {
            id: 'seed-article-2',
            briefId: 'seed-brief-3',
            version: 1,
            title: 'SeoSights vs Surfer SEO: Complete Comparison Guide 2025',
            slug: 'seosights-vs-surfer-seo',
            content: '# SeoSights vs Surfer SEO: Complete Comparison Guide 2025\n\n*Seed article content — structured VS page comparing SeoSights and Surfer SEO.*\n\n*(Full content generated by Content Engine™)*',
            metaTitle: 'SeoSights vs Surfer SEO | Comparison 2025',
            metaDescription: 'Compare SeoSights and Surfer SEO side by side. Features, pricing, and AI visibility capabilities.',
            wordCount: 2103,
            seoScore: 78,
            aeoScore: 72,
            geoScore: 75,
            citationReadiness: 65,
            schemaJson: null,
            faqEntries: '[{"q":"Is SeoSights better than Surfer SEO?","a":"SeoSights specializes in AI visibility optimization while Surfer SEO focuses on traditional content optimization."}]',
            internalLinks: '[]',
            externalCitations: '[]',
            ogImageUrl: null,
            publishedUrl: 'https://seosights.com/blog/seosights-vs-surfer-seo',
            publishedAt: new Date(Date.now() - 172800000).toISOString(),
            platform: 'wordpress',
            aiScoreBefore: 38,
            aiScoreAfter: 52,
            aiScoreDelta: 14,
            citationsGained: 3,
            organicClicks: 187,
            aiMentions: 7,
            needsRewrite: false,
            rewriteReason: null,
            parentArticleId: null,
            experimentId: null,
            status: 'published',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
            brief: { targetKeyword: 'SeoSights vs Surfer SEO', contentTypeId: 'vs_page', contentTypeLabel: 'VS Page' },
          },
        ],
        total: 2,
        page,
        limit,
        totalPages: 1,
      })
    }

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[content-engine/articles GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// POST /api/client-zero/content-engine/articles
// Generate article from brief (AI Writer step)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { briefId } = body as { briefId: string }

    if (!briefId) {
      return NextResponse.json(
        { error: 'briefId is required' },
        { status: 400 }
      )
    }

    // Fetch the brief
    const brief = await db.contentBrief.findUnique({
      where: { id: briefId },
      include: {
        articles: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })

    if (!brief) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      )
    }

    // Determine version number
    const nextVersion = brief.articles.length > 0 ? brief.articles[0].version + 1 : 1

    // Parse brief data
    const outline: Array<{ h2: string; h3s: string[]; points: string[] }> = JSON.parse(brief.outline || '[]')
    const secondaryKeywords: string[] = JSON.parse(brief.secondaryKeywords || '[]')
    const entityTargets: Array<{ entity: string; type: string; reason: string }> = JSON.parse(brief.entityTargets || '[]')

    // Generate article content
    const { title, slug, content, metaTitle, metaDescription, faqEntries, wordCount } = generateArticleContent(
      brief.targetKeyword,
      outline,
      secondaryKeywords,
      entityTargets,
      brief.contentTypeId
    )

    // Generate schema JSON-LD
    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: title,
          description: metaDescription,
          author: {
            '@type': 'Organization',
            name: 'SeoSights',
            url: 'https://seosights.com',
          },
          publisher: {
            '@type': 'Organization',
            name: 'SeoSights',
            logo: {
              '@type': 'ImageObject',
              url: 'https://seosights.com/logo.png',
            },
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: JSON.parse(faqEntries).map((faq: { q: string; a: string }) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a,
            },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seosights.com' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://seosights.com/blog' },
            { '@type': 'ListItem', position: 3, name: title, item: `https://seosights.com/blog/${slug}` },
          ],
        },
      ],
    })

    // Generate internal links
    const internalLinks = JSON.stringify([
      { anchor: 'AI Router', href: '/features/ai-router' },
      { anchor: 'Mission Control', href: '/features/mission-control' },
      { anchor: 'AI Visibility Replay', href: '/features/replay' },
      { anchor: 'Client Zero', href: '/client-zero' },
      { anchor: 'Content Engine', href: '/features/content-engine' },
    ])

    // Generate external citations
    const externalCitations = JSON.stringify([
      { title: 'Wikipedia - Search Engine Optimization', url: 'https://en.wikipedia.org/wiki/Search_engine_optimization' },
      { title: 'Google Search Central - SEO Starter Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' },
      { title: 'Moz - Beginner\'s Guide to SEO', url: 'https://moz.com/beginners-guide-to-seo' },
    ])

    // Create the article
    const article = await db.contentArticle.create({
      data: {
        briefId,
        version: nextVersion,
        title,
        slug: nextVersion > 1 ? `${slug}-v${nextVersion}` : slug,
        content,
        metaTitle,
        metaDescription,
        wordCount,
        seoScore: 0,
        aeoScore: 0,
        geoScore: 0,
        citationReadiness: 0,
        schemaJson,
        faqEntries,
        internalLinks,
        externalCitations,
        status: 'draft',
      },
    })

    // Update brief status
    await db.contentBrief.update({
      where: { id: briefId },
      data: { status: 'in_progress' },
    })

    return NextResponse.json({
      article: {
        ...article,
        wordCount,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[content-engine/articles POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    )
  }
}
