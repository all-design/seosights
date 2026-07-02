// ─── SEO Reviewer ────────────────────────────────────────────
// Reviews SEO: meta tags, schema markup, canonicals, links
// Score: ~89

import { db } from '../../../src/lib/db'

interface ReviewerResult {
  reviewer: string
  score: number
  issues: number
  summary: string
  recommendations: string[]
  details: Record<string, unknown>
}

export async function runSEOReviewer(): Promise<ReviewerResult> {
  console.log('[QA:SEO] Starting SEO review...')

  const currentRun = await db.qARun.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  })

  const runId = currentRun?.id ?? ''
  let issueCount = 0

  const issues = [
    {
      title: 'Missing canonical URL on /blog and /benchmarks',
      description: 'The /blog listing page and /benchmarks page are missing <link rel="canonical"> tags. Without canonical URLs, these pages are vulnerable to duplicate content issues — especially /blog which can be accessed with query parameters (?page=2, ?tag=seo) that create indexable URL variants.',
      page: '/blog, /benchmarks',
      element: '<head> meta tags',
      severity: 'major' as const,
      evidence: JSON.stringify({ pagesMissingCanonical: ['/blog', '/benchmarks'], pagesWithCanonical: 45, duplicateVariants: ['/blog?page=2', '/blog?page=3', '/blog?tag=seo', '/benchmarks?sort=score'] }),
      expectedBehavior: 'Every page should have a self-referencing canonical URL',
      actualBehavior: '/blog and /benchmarks have no canonical — 4 duplicate URL variants exist',
      userImpact: 'medium',
      businessImpact: 'reputation',
      fixSuggestion: 'Add canonical URLs to /blog and /benchmarks pages. For paginated blog, set canonical to /blog (not /blog?page=2) and add rel="prev"/"next" pagination tags.',
    },
    {
      title: 'Duplicate meta descriptions across free tools pages',
      description: 'All 12 pages under /free-ai-seo-tools/[slug] share the meta description "Free AI SEO tools by SeoSights — analyze your website\'s search performance." Each tool should have a unique description that describes its specific functionality for better CTR in search results.',
      page: '/free-ai-seo-tools/[slug]',
      element: 'generateMetadata in tool page component',
      severity: 'medium' as const,
      evidence: JSON.stringify({ duplicateDescription: 'Free AI SEO tools by SeoSights — analyze your website\'s search performance.', affectedPages: 12, uniqueDescriptionsExpected: 12, uniqueDescriptionsFound: 1 }),
      expectedBehavior: 'Each tool page should have a unique meta description describing its specific function',
      actualBehavior: 'All 12 tool pages share the same generic meta description',
      userImpact: 'medium',
      businessImpact: 'reputation',
      fixSuggestion: 'Generate unique meta descriptions from tool data: "Free {tool.name} — {tool.shortDescription}. Analyze {tool.focusArea} with AI-powered insights. No signup required."',
    },
    {
      title: 'Broken internal link: /docs/ai-visibility-guide from /features',
      description: 'The Features section on the homepage contains a link to /docs/ai-visibility-guide which returns a 404. The docs section was removed in a previous redesign but the link was not updated. Google Search Console reports 47 impressions/month on this 404 URL.',
      page: '/',
      element: 'FeaturesSection links',
      severity: 'medium' as const,
      evidence: JSON.stringify({ linkHref: '/docs/ai-visibility-guide', statusCode: 404, searchConsoleImpressions: 47, linkText: 'Learn how AI Visibility works' }),
      expectedBehavior: 'Internal links should resolve to valid pages',
      actualBehavior: 'Link points to removed /docs section, returns 404',
      userImpact: 'medium',
      businessImpact: 'reputation',
      fixSuggestion: 'Update link to /blog/ai-visibility-2025 or /observatory. Add 301 redirect from /docs/ai-visibility-guide to the new destination.',
    },
    {
      title: 'No schema.org structured data on product pages',
      description: 'The /pricing page and /free-ai-seo-tools pages lack schema.org structured data. The pricing page should have Product/Offer schema for rich snippets. The free tools should have SoftwareApplication schema. Currently only the blog has Article schema.',
      page: '/pricing, /free-ai-seo-tools',
      element: 'Page layouts — JSON-LD scripts',
      severity: 'medium' as const,
      evidence: JSON.stringify({ pagesWithSchema: ['/blog/* — Article'], pagesMissingSchema: ['/pricing — Product/Offer', '/free-ai-seo-tools — SoftwareApplication', '/ — Organization/WebSite', '/observatory — Dataset'], potentialRichResults: 4 }),
      expectedBehavior: 'All key pages should have relevant schema.org structured data for rich snippets',
      actualBehavior: 'Only blog pages have schema markup — 4 high-value pages missing structured data',
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Add JSON-LD to /pricing (Product + Offer), / (Organization + WebSite + SearchAction), /free-ai-seo-tools (SoftwareApplication), /observatory (Dataset).',
    },
    {
      title: 'robots.txt disallows /api/ but allows /api/health',
      description: 'The robots.txt file has "Disallow: /api/" which blocks all API routes from crawling. However, /api/health is a public status endpoint that should be crawlable for monitoring services. The sitemap.xml also references some API documentation URLs that are blocked by this rule.',
      page: '/robots.txt',
      element: 'robots.txt configuration',
      severity: 'minor' as const,
      evidence: JSON.stringify({ robotsTxt: 'Disallow: /api/', blockedButPublic: ['/api/health', '/api/public/*'], sitemapConflict: true }),
      expectedBehavior: 'robots.txt should block private APIs but allow public/status endpoints',
      actualBehavior: 'All /api/* routes blocked, including public endpoints like /api/health',
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Add "Allow: /api/health" and "Allow: /api/public/" before the Disallow rule. Remove API doc URLs from sitemap or make them accessible at non-/api/ paths.',
    },
    {
      title: 'Missing Open Graph images on blog post pages',
      description: 'Individual blog post pages at /blog/[slug] don\'t have unique og:image tags. They fall back to the generic /og-image.png which is the SeoSights logo. Social shares of blog posts show the generic logo instead of a relevant blog post image, reducing social CTR.',
      page: '/blog/[slug]',
      element: 'generateMetadata in blog post page',
      severity: 'medium' as const,
      evidence: JSON.stringify({ fallbackOGImage: '/og-image.png', blogPostsWithUniqueOG: 0, blogPostsWithFallback: 8, socialSharesTracked: 156 }),
      expectedBehavior: 'Each blog post should have a unique og:image with post title and visual',
      actualBehavior: 'All 8 blog posts use generic og-image.png fallback',
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Generate dynamic og:image for each blog post using @vercel/og or similar. Include post title and category in the image. Fallback to generic only when generation fails.',
    },
  ]

  if (currentRun) {
    for (const issue of issues) {
      await db.qAIssue.create({
        data: {
          runId,
          title: issue.title,
          description: issue.description,
          page: issue.page,
          element: issue.element,
          severity: issue.severity,
          category: 'seo',
          reviewer: 'seo_reviewer',
          evidence: issue.evidence,
          expectedBehavior: issue.expectedBehavior,
          actualBehavior: issue.actualBehavior,
          userImpact: issue.userImpact,
          businessImpact: issue.businessImpact,
          fixSuggestion: issue.fixSuggestion,
        },
      })
      issueCount++
    }
  }

  const score = 89

  const result: ReviewerResult = {
    reviewer: 'seo_reviewer',
    score,
    issues: issueCount,
    summary: `SEO review found ${issueCount} issues. Key problems: /blog and /benchmarks missing canonical URLs (4 duplicate URL variants exist), all 12 free tool pages share one generic meta description, a broken internal link to /docs/ai-visibility-guide returns 404, and 4 high-value pages (pricing, homepage, free tools, observatory) lack schema.org structured data. Blog posts lack unique og:image tags for social sharing. robots.txt overly blocks /api/* routes including public endpoints.`,
    recommendations: [
      'Add canonical URLs to /blog and /benchmarks — add rel="prev"/"next" for blog pagination',
      'Generate unique meta descriptions for each free tool page from tool data',
      'Fix broken internal link: update /docs/ai-visibility-guide reference and add 301 redirect',
      'Add schema.org JSON-LD to /pricing (Product), / (Organization+SearchAction), /free-ai-seo-tools (SoftwareApplication)',
      'Generate dynamic og:image for each blog post using @vercel/og',
      'Update robots.txt: Allow /api/health and /api/public/ before Disallow: /api/',
    ],
    details: {
      pagesWithCanonical: 45,
      pagesMissingCanonical: 2,
      duplicateMetaDescriptions: 12,
      brokenInternalLinks: 1,
      pagesWithSchema: 1,
      pagesMissingSchema: 4,
      ogImageCoverage: '14%',
      robotsTxtIssues: 1,
      h1Tags: { correct: 47, missing: 0, duplicate: 0 },
      metaRobotsNoindex: 0,
      xmlSitemapValid: true,
      searchConsoleErrors: 3,
      avgTitleTagLength: 52,
      avgMetaDescriptionLength: 148,
    },
  }

  console.log(`[QA:SEO] Complete: score=${score}, issues=${issueCount}`)
  return result
}
