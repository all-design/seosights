import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * One-Click Fix API
 *
 * GET  — Returns the list of detected technical AI-search issues,
 *         each with ready-to-paste fix code, plus a summary.
 * POST — Accepts `{ issueIds: string[] }` and simulates applying
 *         fixes. Manual-review issues are skipped; everything else
 *         is marked `fixed`.
 *
 * Query param: ?url=<site url> — used to scope the demo data to
 * the supplied domain so the generated snippets reference the
 * correct origin.
 */

type IssueType =
  | 'Schema'
  | 'llms.txt'
  | 'robots.txt'
  | 'Meta'
  | 'Canonical'
  | 'Sitemap'

type Severity = 'Critical' | 'Warning' | 'Info'
type FixStatus = 'not_fixed' | 'fixing' | 'fixed' | 'manual_review'

interface FixIssue {
  id: string
  type: IssueType
  severity: Severity
  title: string
  description: string
  status: FixStatus
  fixCode: string
  fixLanguage: string
}

interface FixSummary {
  total: number
  fixable: number
  fixed: number
  manualReview: number
}

// ── URL helpers ─────────────────────────────────────────────────
function parseSite(url?: string): { domain: string; origin: string; brand: string } {
  const fallback = { domain: 'acme.com', origin: 'https://acme.com', brand: 'Acme' }
  if (!url) return fallback
  try {
    const u = new URL(url)
    const domain = u.hostname.replace(/^www\./, '')
    const rawBrand = domain.split('.')[0] || 'Acme'
    const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1)
    return { domain, origin: u.origin, brand }
  } catch {
    return fallback
  }
}

// ── Demo issue data with realistic fix code ─────────────────────
function buildIssues(url?: string): FixIssue[] {
  const { domain, origin, brand } = parseSite(url)
  const brandSlug = brand.toLowerCase()

  return [
    {
      id: 'schema-org',
      type: 'Schema',
      severity: 'Critical',
      title: 'Missing Organization schema markup',
      description:
        'No structured data detected. AI crawlers cannot resolve your brand entity.',
      status: 'not_fixed',
      fixLanguage: 'json',
      fixCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${brand}",
  "url": "${origin}",
  "logo": "${origin}/logo.png",
  "description": "${brand} builds AI-powered software for modern teams.",
  "sameAs": [
    "https://twitter.com/${brandSlug}",
    "https://linkedin.com/company/${brandSlug}",
    "https://github.com/${brandSlug}"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@${domain}"
  }
}
</script>`,
    },
    {
      id: 'llms-txt',
      type: 'llms.txt',
      severity: 'Critical',
      title: 'Missing /llms.txt file',
      description:
        'No llms.txt at site root. LLMs lack a curated summary of your site.',
      status: 'not_fixed',
      fixLanguage: 'markdown',
      fixCode: `# ${brand}

> A concise, AI-readable summary of what ${domain} offers.

## About
${brand} builds AI-powered software that helps teams ship faster.
This file helps language models understand our site at a glance.

## Pages
- [Home](${origin}/): Product overview and value proposition
- [Pricing](${origin}/pricing): Plans for every team size
- [Docs](${origin}/docs): API reference and guides
- [Blog](${origin}/blog): Engineering and product updates

## Optional
- [Contact](${origin}/contact)
- [Changelog](${origin}/changelog)`,
    },
    {
      id: 'robots-ai',
      type: 'robots.txt',
      severity: 'Warning',
      title: 'robots.txt blocks GPTBot and ClaudeBot',
      description:
        'AI crawlers are explicitly disallowed. Remove blocks for AI search visibility.',
      status: 'not_fixed',
      fixLanguage: 'text',
      fixCode: `# robots.txt — explicitly allow AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

# Block private areas from all bots
User-agent: *
Disallow: /admin/
Disallow: /private/
Disallow: /*?session=
Allow: /`,
    },
    {
      id: 'meta-desc',
      type: 'Meta',
      severity: 'Warning',
      title: 'Missing meta description on homepage',
      description:
        'No <meta name="description"> tag. Hurts SERP CTR and AI snippet extraction.',
      status: 'not_fixed',
      fixLanguage: 'html',
      fixCode: `<meta
  name="description"
  content="${brand} builds AI-powered software that helps teams ship faster. Start your free trial today — no credit card required."
/>
<!-- Recommended length: 120-155 characters -->`,
    },
    {
      id: 'canonical',
      type: 'Canonical',
      severity: 'Critical',
      title: 'Broken canonical link returns 404',
      description:
        'Current canonical points to a non-existent URL. Causes duplicate-content confusion.',
      status: 'not_fixed',
      fixLanguage: 'html',
      fixCode: `<!-- Replace the broken canonical in <head> with this -->
<link rel="canonical" href="${origin}/" />
<!-- Ensure each page has exactly one canonical pointing to the
     preferred URL variant. Remove any duplicate tags. -->`,
    },
    {
      id: 'sitemap',
      type: 'Sitemap',
      severity: 'Info',
      title: 'Key pages missing from sitemap.xml',
      description:
        'Sitemap references 12 URLs but /pricing and /docs are excluded.',
      status: 'manual_review',
      fixLanguage: 'xml',
      fixCode: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/pricing</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/docs</loc>
    <lastmod>2025-01-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`,
    },
  ]
}

// ── Summary helper ──────────────────────────────────────────────
function summarize(issues: FixIssue[]): FixSummary {
  return {
    total: issues.length,
    fixable: issues.filter((i) => i.status !== 'manual_review').length,
    fixed: issues.filter((i) => i.status === 'fixed').length,
    manualReview: issues.filter((i) => i.status === 'manual_review').length,
  }
}

// ── GET — list detected issues ──────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url') || undefined
    const issues = buildIssues(url)
    return NextResponse.json({ issues, summary: summarize(issues) })
  } catch (error) {
    console.error(
      '[one-click-fix] GET error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    return NextResponse.json({ issues: [], summary: { total: 0, fixable: 0, fixed: 0, manualReview: 0 } })
  }
}

// ── POST — simulate applying fixes ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as unknown))
    const { issueIds } = (body || {}) as { issueIds?: string[] }

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json(
        { error: 'issueIds must be a non-empty array' },
        { status: 400 }
      )
    }

    const url = new URL(request.url).searchParams.get('url') || undefined
    const allIssues = buildIssues(url)

    const updatedIssues = allIssues.map((issue) => {
      if (!issueIds.includes(issue.id)) return issue
      if (issue.status === 'manual_review') return issue
      return { ...issue, status: 'fixed' as FixStatus }
    })

    const applied = issueIds.filter((id) => {
      const found = allIssues.find((x) => x.id === id)
      return found && found.status !== 'manual_review'
    })

    return NextResponse.json({
      issues: updatedIssues,
      summary: summarize(updatedIssues),
      applied,
      skipped: issueIds.filter((id) => !applied.includes(id)),
    })
  } catch (error) {
    console.error(
      '[one-click-fix] POST error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    return NextResponse.json({
      issues: [],
      summary: { total: 0, fixable: 0, fixed: 0, manualReview: 0 },
      applied: [],
      skipped: [],
    })
  }
}
