import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

type ReviewType = 'seo' | 'aeo' | 'geo' | 'citation' | 'internal_links' | 'schema' | 'fact_check' | 'image'

interface Finding {
  check: string
  result: 'pass' | 'fail' | 'warning'
  detail: string
}

interface Suggestion {
  suggestion: string
  impact: 'high' | 'medium' | 'low'
}

// SEO Review checks
function runSeoReview(article: {
  title: string
  content: string
  metaTitle: string | null
  metaDescription: string | null
  schemaJson: string | null
  faqEntries: string | null
  internalLinks: string | null
  externalCitations: string | null
  ogImageUrl: string | null
  wordCount: number
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  // Title check
  const hasH1 = article.content.startsWith('# ')
  findings.push({
    check: 'H1 Tag',
    result: hasH1 ? 'pass' : 'fail',
    detail: hasH1 ? 'Content starts with H1 heading' : 'Missing H1 heading at start of content',
  })
  if (hasH1) score += 10

  // Title optimization
  const titleLength = article.title.length
  findings.push({
    check: 'Title Length',
    result: titleLength >= 30 && titleLength <= 70 ? 'pass' : 'warning',
    detail: `Title is ${titleLength} characters (ideal: 30-70)`,
  })
  if (titleLength >= 30 && titleLength <= 70) score += 10
  else suggestions.push({ suggestion: 'Adjust title length to 30-70 characters for optimal display', impact: 'medium' })

  // Meta title
  const hasMetaTitle = !!article.metaTitle
  findings.push({
    check: 'Meta Title',
    result: hasMetaTitle ? 'pass' : 'fail',
    detail: hasMetaTitle ? 'Meta title is set' : 'Missing meta title',
  })
  if (hasMetaTitle) score += 10
  else {
    suggestions.push({ suggestion: 'Add a meta title for search engine display', impact: 'high' })
    autoFixes.metaTitle = `${article.title} — SeoSights`
  }

  // Meta description
  const hasMetaDesc = !!article.metaDescription
  findings.push({
    check: 'Meta Description',
    result: hasMetaDesc ? 'pass' : 'fail',
    detail: hasMetaDesc ? 'Meta description is set' : 'Missing meta description',
  })
  if (hasMetaDesc) score += 10
  else {
    suggestions.push({ suggestion: 'Add a meta description (150-160 characters)', impact: 'high' })
  }

  // Word count
  const wc = article.wordCount
  findings.push({
    check: 'Word Count',
    result: wc >= 2000 ? 'pass' : wc >= 1200 ? 'warning' : 'fail',
    detail: `Article has ${wc} words (ideal: 2000+ for AI citation)`,
  })
  if (wc >= 2000) score += 10
  else suggestions.push({ suggestion: 'Expand content to 2000+ words for better AI citation potential', impact: 'high' })

  // FAQ section
  let faqCount = 0
  try {
    faqCount = article.faqEntries ? JSON.parse(article.faqEntries).length : 0
  } catch { /* empty */ }
  findings.push({
    check: 'FAQ Section',
    result: faqCount >= 3 ? 'pass' : faqCount > 0 ? 'warning' : 'fail',
    detail: `Has ${faqCount} FAQ entries (ideal: 5+)`,
  })
  if (faqCount >= 3) score += 10
  else suggestions.push({ suggestion: 'Add more FAQ entries (aim for 5+) to improve AI citation potential', impact: 'high' })

  // Schema markup
  const hasSchema = !!article.schemaJson
  findings.push({
    check: 'Schema Markup',
    result: hasSchema ? 'pass' : 'fail',
    detail: hasSchema ? 'JSON-LD schema is present' : 'Missing JSON-LD schema markup',
  })
  if (hasSchema) score += 10

  // Internal links
  let internalLinkCount = 0
  try {
    internalLinkCount = article.internalLinks ? JSON.parse(article.internalLinks).length : 0
  } catch { /* empty */ }
  findings.push({
    check: 'Internal Links',
    result: internalLinkCount >= 3 ? 'pass' : internalLinkCount > 0 ? 'warning' : 'fail',
    detail: `Has ${internalLinkCount} internal links (ideal: 3+)`,
  })
  if (internalLinkCount >= 3) score += 10
  else suggestions.push({ suggestion: 'Add more internal links to related pages', impact: 'medium' })

  // External citations
  let externalCiteCount = 0
  try {
    externalCiteCount = article.externalCitations ? JSON.parse(article.externalCitations).length : 0
  } catch { /* empty */ }
  findings.push({
    check: 'External Citations',
    result: externalCiteCount >= 2 ? 'pass' : externalCiteCount > 0 ? 'warning' : 'fail',
    detail: `Has ${externalCiteCount} external citations (ideal: 3+)`,
  })
  if (externalCiteCount >= 2) score += 10
  else suggestions.push({ suggestion: 'Add external citations from Wikipedia, official docs, or authoritative sources', impact: 'high' })

  // llms.txt reference
  const mentionsLlmsTxt = article.content.toLowerCase().includes('llms.txt')
  findings.push({
    check: 'llms.txt Reference',
    result: mentionsLlmsTxt ? 'pass' : 'warning',
    detail: mentionsLlmsTxt ? 'Article mentions llms.txt' : 'Consider referencing llms.txt for AI discoverability',
  })
  if (mentionsLlmsTxt) score += 5
  else suggestions.push({ suggestion: 'Add a reference to llms.txt for improved AI discoverability', impact: 'medium' })

  // OG Image
  const hasOgImage = !!article.ogImageUrl
  findings.push({
    check: 'OG Image',
    result: hasOgImage ? 'pass' : 'warning',
    detail: hasOgImage ? 'Open Graph image is set' : 'Missing Open Graph image',
  })
  if (hasOgImage) score += 5
  else suggestions.push({ suggestion: 'Add an Open Graph image for better social sharing', impact: 'low' })

  return { score, findings, suggestions, autoFixes }
}

// AEO Review checks
function runAeoReview(article: {
  title: string
  content: string
  faqEntries: string | null
  schemaJson: string | null
  wordCount: number
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  // Will ChatGPT use this paragraph?
  const paragraphs = article.content.split('\n\n').filter(p => p.trim().length > 0)
  const hasDefinitionParagraph = paragraphs.some(p =>
    p.toLowerCase().includes('refers to') ||
    p.toLowerCase().includes('is the') ||
    p.toLowerCase().includes('is a') ||
    p.toLowerCase().includes('means the')
  )
  findings.push({
    check: 'Definition Paragraph',
    result: hasDefinitionParagraph ? 'pass' : 'fail',
    detail: hasDefinitionParagraph ? 'Content includes clear definition paragraph AI engines can extract' : 'Missing clear definition paragraph for AI extraction',
  })
  if (hasDefinitionParagraph) score += 20
  else suggestions.push({ suggestion: 'Add a clear definition paragraph early in the content (e.g., "X refers to...")', impact: 'high' })

  // Entity definitions
  const entityKeywords = ['chatgpt', 'claude', 'gemini', 'ai visibility', 'seo', 'aeo', 'geo']
  const mentionedEntities = entityKeywords.filter(e => article.content.toLowerCase().includes(e))
  findings.push({
    check: 'Entity Coverage',
    result: mentionedEntities.length >= 4 ? 'pass' : mentionedEntities.length >= 2 ? 'warning' : 'fail',
    detail: `Mentions ${mentionedEntities.length}/${entityKeywords.length} key entities: ${mentionedEntities.join(', ')}`,
  })
  if (mentionedEntities.length >= 4) score += 15
  else suggestions.push({ suggestion: 'Include more key entity terms that AI engines look for', impact: 'high' })

  // Source attribution
  const hasSourceAttribution = article.content.includes('https://') || article.content.includes('http://')
  findings.push({
    check: 'Source Attribution',
    result: hasSourceAttribution ? 'pass' : 'warning',
    detail: hasSourceAttribution ? 'Content includes source URLs' : 'Add source URLs for factual claims',
  })
  if (hasSourceAttribution) score += 15

  // FAQ for AEO
  let faqCount = 0
  try {
    faqCount = article.faqEntries ? JSON.parse(article.faqEntries).length : 0
  } catch { /* empty */ }
  findings.push({
    check: 'FAQ for AEO',
    result: faqCount >= 4 ? 'pass' : faqCount >= 2 ? 'warning' : 'fail',
    detail: `${faqCount} FAQ entries (ideal: 5+ for Answer Engine Optimization)`,
  })
  if (faqCount >= 4) score += 20
  else suggestions.push({ suggestion: 'Add more FAQ entries — these are the #1 format AI engines cite', impact: 'high' })

  // FAQ Schema
  const hasFaqSchema = article.schemaJson?.includes('FAQPage') || false
  findings.push({
    check: 'FAQ Schema',
    result: hasFaqSchema ? 'pass' : 'fail',
    detail: hasFaqSchema ? 'FAQPage schema markup is present' : 'Missing FAQPage schema — critical for AEO',
  })
  if (hasFaqSchema) score += 15
  else suggestions.push({ suggestion: 'Add FAQPage schema markup for Answer Engine Optimization', impact: 'high' })

  // Concise answers
  const hasConciseAnswers = article.content.includes('**Key Takeaways**') || article.content.includes('**Key takeaway**')
  findings.push({
    check: 'Concise Summary Blocks',
    result: hasConciseAnswers ? 'pass' : 'warning',
    detail: hasConciseAnswers ? 'Content includes concise summary blocks' : 'Add summary blocks that AI engines can extract directly',
  })
  if (hasConciseAnswers) score += 15
  else suggestions.push({ suggestion: 'Add "Key Takeaways" summary blocks after each section', impact: 'medium' })

  return { score, findings, suggestions, autoFixes }
}

// GEO Review checks
function runGeoReview(article: {
  title: string
  content: string
  wordCount: number
  schemaJson: string | null
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  // Fact extractability
  const hasDataPoints = /\d+%|\$\d+|\d{4}/.test(article.content)
  findings.push({
    check: 'Fact Extractability',
    result: hasDataPoints ? 'pass' : 'warning',
    detail: hasDataPoints ? 'Content includes numerical data points that AI engines can extract' : 'Add specific statistics and data points for better fact extraction',
  })
  if (hasDataPoints) score += 20
  else suggestions.push({ suggestion: 'Include specific statistics, percentages, and numerical data', impact: 'high' })

  // Structured data
  const hasStructuredData = !!article.schemaJson
  findings.push({
    check: 'Structured Data',
    result: hasStructuredData ? 'pass' : 'fail',
    detail: hasStructuredData ? 'JSON-LD structured data present for generative engine parsing' : 'Missing structured data — critical for GEO',
  })
  if (hasStructuredData) score += 20

  // Content depth
  findings.push({
    check: 'Content Depth',
    result: article.wordCount >= 2000 ? 'pass' : article.wordCount >= 1200 ? 'warning' : 'fail',
    detail: `${article.wordCount} words (ideal: 2000+ for comprehensive AI coverage)`,
  })
  if (article.wordCount >= 2000) score += 20
  else suggestions.push({ suggestion: 'Expand content depth for better generative engine coverage', impact: 'high' })

  // Confidence markers
  const hasConfidenceMarkers = article.content.includes('based on') || article.content.includes('according to') || article.content.includes('research shows')
  findings.push({
    check: 'Confidence Markers',
    result: hasConfidenceMarkers ? 'pass' : 'warning',
    detail: hasConfidenceMarkers ? 'Content uses confidence markers that AI engines evaluate' : 'Add phrases like "based on", "according to", "research shows"',
  })
  if (hasConfidenceMarkers) score += 20
  else suggestions.push({ suggestion: 'Add confidence markers and source attributions', impact: 'medium' })

  // Multi-perspective coverage
  const hasMultiplePerspectives = article.content.includes('however') || article.content.includes('on the other hand') || article.content.includes('alternatively')
  findings.push({
    check: 'Multi-Perspective Coverage',
    result: hasMultiplePerspectives ? 'pass' : 'warning',
    detail: hasMultiplePerspectives ? 'Content presents multiple perspectives' : 'Add alternative viewpoints for balanced coverage',
  })
  if (hasMultiplePerspectives) score += 20
  else suggestions.push({ suggestion: 'Include multiple perspectives for more balanced, citation-worthy content', impact: 'medium' })

  return { score, findings, suggestions, autoFixes }
}

// Citation Optimizer
function runCitationReview(article: {
  title: string
  content: string
  externalCitations: string | null
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  let existingCitations: Array<{ title: string; url: string }> = []
  try {
    existingCitations = article.externalCitations ? JSON.parse(article.externalCitations) : []
  } catch { /* empty */ }

  const hasWikipedia = existingCitations.some(c => c.url.includes('wikipedia.org'))
  const hasGitHub = existingCitations.some(c => c.url.includes('github.com'))
  const hasReddit = existingCitations.some(c => c.url.includes('reddit.com'))
  const hasOfficialDocs = existingCitations.some(c => c.url.includes('developers.') || c.url.includes('docs.'))

  findings.push({
    check: 'Wikipedia Citation',
    result: hasWikipedia ? 'pass' : 'warning',
    detail: hasWikipedia ? 'Wikipedia citation present' : 'Add Wikipedia citation — AI engines heavily weight Wikipedia sources',
  })
  if (hasWikipedia) score += 25
  else suggestions.push({ suggestion: 'Add a Wikipedia citation to boost AI engine trust', impact: 'high' })

  findings.push({
    check: 'GitHub Reference',
    result: hasGitHub ? 'pass' : 'warning',
    detail: hasGitHub ? 'GitHub reference present' : 'Add GitHub reference for technical credibility',
  })
  if (hasGitHub) score += 15
  else suggestions.push({ suggestion: 'Add a GitHub repository reference for technical topics', impact: 'medium' })

  findings.push({
    check: 'Reddit Discussion',
    result: hasReddit ? 'pass' : 'warning',
    detail: hasReddit ? 'Reddit discussion reference present' : 'Add Reddit discussion for social proof',
  })
  if (hasReddit) score += 10
  else suggestions.push({ suggestion: 'Reference a relevant Reddit discussion for social proof', impact: 'low' })

  findings.push({
    check: 'Official Documentation',
    result: hasOfficialDocs ? 'pass' : 'warning',
    detail: hasOfficialDocs ? 'Official documentation citation present' : 'Add official documentation reference for authority',
  })
  if (hasOfficialDocs) score += 25
  else suggestions.push({ suggestion: 'Cite official documentation (e.g., Google Developers, OpenAI Docs)', impact: 'high' })

  findings.push({
    check: 'Total Citation Count',
    result: existingCitations.length >= 3 ? 'pass' : existingCitations.length >= 1 ? 'warning' : 'fail',
    detail: `${existingCitations.length} external citations (ideal: 3+)`,
  })
  if (existingCitations.length >= 3) score += 25
  else suggestions.push({ suggestion: 'Add more external citations to reach 3+ authoritative sources', impact: 'high' })

  // Auto-fix: suggest citation additions
  if (!hasWikipedia || !hasOfficialDocs) {
    autoFixes.suggestedCitations = [
      { title: 'Wikipedia - Search Engine Optimization', url: 'https://en.wikipedia.org/wiki/Search_engine_optimization', type: 'wikipedia' },
      { title: 'Google Search Central', url: 'https://developers.google.com/search', type: 'official_docs' },
      { title: 'OpenAI API Documentation', url: 'https://platform.openai.com/docs', type: 'official_docs' },
    ].filter(c => {
      if (c.type === 'wikipedia' && !hasWikipedia) return true
      if (c.type === 'official_docs' && !hasOfficialDocs) return true
      return false
    })
  }

  return { score, findings, suggestions, autoFixes }
}

// Internal Links Review
function runInternalLinksReview(article: {
  content: string
  internalLinks: string | null
  title: string
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  let existingLinks: Array<{ anchor: string; href: string }> = []
  try {
    existingLinks = article.internalLinks ? JSON.parse(article.internalLinks) : []
  } catch { /* empty */ }

  const relatedPages = [
    { anchor: 'AI Router', href: '/features/ai-router', keywords: ['ai router', 'model routing', 'fallback'] },
    { anchor: 'Mission Control', href: '/features/mission-control', keywords: ['mission control', 'dashboard', 'monitoring'] },
    { anchor: 'AI Visibility Replay', href: '/features/replay', keywords: ['replay', 'visibility over time', 'tracking'] },
    { anchor: 'Client Zero', href: '/client-zero', keywords: ['client zero', 'dogfooding', 'auto-execute'] },
    { anchor: 'Content Engine', href: '/features/content-engine', keywords: ['content engine', 'content generation', 'auto-write'] },
    { anchor: 'Pricing', href: '/pricing', keywords: ['pricing', 'plans', 'cost'] },
    { anchor: 'AI Score', href: '/features/ai-score', keywords: ['ai score', 'visibility score', 'scoring'] },
    { anchor: 'Citation Explorer', href: '/features/citation-explorer', keywords: ['citation', 'mention', 'reference'] },
  ]

  const contentLower = article.content.toLowerCase()
  const missingLinks = relatedPages.filter(page =>
    !existingLinks.some(l => l.href === page.href) &&
    page.keywords.some(kw => contentLower.includes(kw))
  )

  findings.push({
    check: 'Internal Link Count',
    result: existingLinks.length >= 4 ? 'pass' : existingLinks.length >= 2 ? 'warning' : 'fail',
    detail: `${existingLinks.length} internal links (ideal: 4+)`,
  })
  if (existingLinks.length >= 4) score += 30
  else suggestions.push({ suggestion: 'Add more internal links to related SeoSights pages', impact: 'high' })

  findings.push({
    check: 'Related Page Coverage',
    result: missingLinks.length === 0 ? 'pass' : missingLinks.length <= 2 ? 'warning' : 'fail',
    detail: missingLinks.length === 0 ? 'All relevant related pages are linked' : `${missingLinks.length} related pages could be linked: ${missingLinks.map(p => p.anchor).join(', ')}`,
  })
  if (missingLinks.length === 0) score += 40
  else suggestions.push({ suggestion: `Add internal links to: ${missingLinks.map(p => p.anchor).join(', ')}`, impact: 'high' })

  findings.push({
    check: 'Anchor Text Quality',
    result: existingLinks.every(l => l.anchor.length > 3) ? 'pass' : 'warning',
    detail: 'Checking if anchor texts are descriptive',
  })
  if (existingLinks.every(l => l.anchor.length > 3)) score += 30
  else suggestions.push({ suggestion: 'Use descriptive anchor text instead of generic text like "click here"', impact: 'medium' })

  // Auto-fix: suggest missing links
  if (missingLinks.length > 0) {
    autoFixes.suggestedInternalLinks = missingLinks.map(p => ({ anchor: p.anchor, href: p.href }))
  }

  return { score, findings, suggestions, autoFixes }
}

// Schema Builder Review
function runSchemaReview(article: {
  title: string
  content: string
  schemaJson: string | null
  faqEntries: string | null
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  const schemaTypes: string[] = []
  if (article.schemaJson) {
    try {
      const schema = JSON.parse(article.schemaJson)
      const graph = schema['@graph'] || [schema]
      for (const item of graph) {
        if (item['@type']) schemaTypes.push(item['@type'])
      }
    } catch { /* empty */ }
  }

  const requiredSchemas = ['Article', 'FAQPage', 'BreadcrumbList', 'SoftwareApplication', 'Organization', 'Author']

  for (const reqSchema of requiredSchemas) {
    const hasIt = schemaTypes.includes(reqSchema)
    findings.push({
      check: `${reqSchema} Schema`,
      result: hasIt ? 'pass' : 'warning',
      detail: hasIt ? `${reqSchema} schema is present` : `Missing ${reqSchema} schema markup`,
    })
    if (hasIt) score += 15
    else suggestions.push({ suggestion: `Add ${reqSchema} schema markup`, impact: reqSchema === 'Article' || reqSchema === 'FAQPage' ? 'high' : 'medium' })
  }

  findings.push({
    check: 'Schema Validity',
    result: article.schemaJson ? 'pass' : 'fail',
    detail: article.schemaJson ? 'JSON-LD schema is valid' : 'No schema found',
  })
  if (article.schemaJson) score += 10

  // Auto-fix: generate missing schemas
  const missingSchemas = requiredSchemas.filter(s => !schemaTypes.includes(s))
  if (missingSchemas.length > 0) {
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    autoFixes.generatedSchemas = {} as Record<string, unknown>

    if (missingSchemas.includes('SoftwareApplication')) {
      (autoFixes.generatedSchemas as Record<string, unknown>).SoftwareApplication = {
        '@type': 'SoftwareApplication',
        name: 'SeoSights',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'AI Visibility Platform for monitoring and optimizing your brand\'s presence in AI-generated responses.',
      }
    }
    if (missingSchemas.includes('Organization')) {
      (autoFixes.generatedSchemas as Record<string, unknown>).Organization = {
        '@type': 'Organization',
        name: 'SeoSights',
        url: 'https://seosights.com',
        logo: 'https://seosights.com/logo.png',
      }
    }
    if (missingSchemas.includes('BreadcrumbList')) {
      (autoFixes.generatedSchemas as Record<string, unknown>).BreadcrumbList = {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seosights.com' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://seosights.com/blog' },
          { '@type': 'ListItem', position: 3, name: article.title, item: `https://seosights.com/blog/${slug}` },
        ],
      }
    }
  }

  return { score: Math.min(score, 100), findings, suggestions, autoFixes }
}

// Fact Check Review
function runFactCheckReview(article: {
  content: string
  title: string
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  // Check for specific year claims
  const yearClaims = article.content.match(/\b(2024|2025|2026)\b/g) || []
  findings.push({
    check: 'Year-Specific Claims',
    result: yearClaims.length > 0 ? 'pass' : 'warning',
    detail: yearClaims.length > 0 ? `Found ${yearClaims.length} year-specific references` : 'Add current year references for freshness signals',
  })
  if (yearClaims.length > 0) score += 20

  // Check for numerical claims
  const numClaims = article.content.match(/\d+%|\$\d+|\d{1,3},\d{3}/g) || []
  findings.push({
    check: 'Numerical Claims',
    result: numClaims.length >= 3 ? 'pass' : numClaims.length > 0 ? 'warning' : 'fail',
    detail: `Found ${numClaims.length} numerical claims: ${numClaims.slice(0, 5).join(', ')}`,
  })
  if (numClaims.length >= 3) score += 25
  else suggestions.push({ suggestion: 'Add more specific numerical data points with verifiable statistics', impact: 'high' })

  // Check for source attribution
  const sourcePatterns = article.content.match(/according to|based on|research shows|study found|reported by/gi) || []
  findings.push({
    check: 'Source Attribution Phrases',
    result: sourcePatterns.length >= 2 ? 'pass' : sourcePatterns.length > 0 ? 'warning' : 'fail',
    detail: `Found ${sourcePatterns.length} source attribution phrases`,
  })
  if (sourcePatterns.length >= 2) score += 25
  else suggestions.push({ suggestion: 'Add more "according to" and "based on" phrases with specific source references', impact: 'high' })

  // Check for hedging language
  const hedgingPhrases = article.content.match(/may|might|could|suggests|indicates|appears to/gi) || []
  findings.push({
    check: 'Hedging Language',
    result: hedgingPhrases.length >= 2 ? 'pass' : 'warning',
    detail: `Found ${hedgingPhrases.length} hedging phrases (appropriate uncertainty markers)`,
  })
  if (hedgingPhrases.length >= 2) score += 15

  // Superlatives check (caution)
  const superlatives = article.content.match(/\b(best|worst|only|always|never|guaranteed)\b/gi) || []
  findings.push({
    check: 'Superlative Usage',
    result: superlatives.length <= 2 ? 'pass' : 'warning',
    detail: superlatives.length <= 2 ? 'Appropriate use of superlatives' : `Found ${superlatives.length} superlative claims — verify accuracy`,
  })
  if (superlatives.length <= 2) score += 15
  else suggestions.push({ suggestion: 'Reduce unverifiable superlative claims for better factual accuracy', impact: 'medium' })

  return { score, findings, suggestions, autoFixes }
}

// Image Review
function runImageReview(article: {
  content: string
  ogImageUrl: string | null
  title: string
}): { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> } {
  const findings: Finding[] = []
  const suggestions: Suggestion[] = []
  const autoFixes: Record<string, unknown> = {}
  let score = 0

  // Check for image references in content
  const imageRefs = article.content.match(/!\[.*?\]\(.*?\)/g) || []
  findings.push({
    check: 'Inline Images',
    result: imageRefs.length >= 2 ? 'pass' : imageRefs.length > 0 ? 'warning' : 'fail',
    detail: `Found ${imageRefs.length} images in content (ideal: 2+)`,
  })
  if (imageRefs.length >= 2) score += 25
  else suggestions.push({ suggestion: 'Add more images to break up text and improve engagement', impact: 'medium' })

  // OG Image
  findings.push({
    check: 'OG Image',
    result: article.ogImageUrl ? 'pass' : 'fail',
    detail: article.ogImageUrl ? 'Open Graph image is set' : 'Missing OG image — critical for social sharing and AI preview',
  })
  if (article.ogImageUrl) score += 25
  else {
    suggestions.push({ suggestion: 'Generate an OG image for social sharing previews', impact: 'high' })
    autoFixes.ogImageSuggestion = `https://seosights.com/og/${article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  }

  // Image alt text check
  const imagesWithAlt = article.content.match(/!\[.+\]\(.*?\)/g) || []
  const imagesWithoutAlt = article.content.match(/!\[\s*\]\(.*?\)/g) || []
  findings.push({
    check: 'Image Alt Text',
    result: imagesWithoutAlt.length === 0 && imagesWithAlt.length > 0 ? 'pass' : imagesWithoutAlt.length > 0 ? 'warning' : 'fail',
    detail: imagesWithoutAlt.length > 0 ? `${imagesWithoutAlt.length} images missing alt text` : imagesWithAlt.length > 0 ? 'All images have alt text' : 'No images found to check',
  })
  if (imagesWithoutAlt.length === 0 && imagesWithAlt.length > 0) score += 25
  else suggestions.push({ suggestion: 'Add descriptive alt text to all images for accessibility and SEO', impact: 'high' })

  // Visual content diversity
  const hasTable = article.content.includes('|---')
  const hasList = article.content.includes('- **') || article.content.includes('1. ')
  findings.push({
    check: 'Visual Content Diversity',
    result: hasTable && hasList ? 'pass' : hasTable || hasList ? 'warning' : 'fail',
    detail: `Content includes: ${[hasTable ? 'tables' : '', hasList ? 'lists' : ''].filter(Boolean).join(', ') || 'no visual elements'}`,
  })
  if (hasTable && hasList) score += 25
  else suggestions.push({ suggestion: 'Add tables and structured lists to improve visual content diversity', impact: 'medium' })

  return { score, findings, suggestions, autoFixes }
}

// POST /api/client-zero/content-engine/review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, reviewType } = body as { articleId: string; reviewType: ReviewType }

    if (!articleId || !reviewType) {
      return NextResponse.json(
        { error: 'articleId and reviewType are required' },
        { status: 400 }
      )
    }

    const validReviewTypes: ReviewType[] = ['seo', 'aeo', 'geo', 'citation', 'internal_links', 'schema', 'fact_check', 'image']
    if (!validReviewTypes.includes(reviewType)) {
      return NextResponse.json(
        { error: `Invalid reviewType. Must be one of: ${validReviewTypes.join(', ')}` },
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
            entityTargets: true,
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

    // Run the appropriate review
    let reviewResult: { score: number; findings: Finding[]; suggestions: Suggestion[]; autoFixes: Record<string, unknown> }

    switch (reviewType) {
      case 'seo':
        reviewResult = runSeoReview(article)
        break
      case 'aeo':
        reviewResult = runAeoReview(article)
        break
      case 'geo':
        reviewResult = runGeoReview(article)
        break
      case 'citation':
        reviewResult = runCitationReview(article)
        break
      case 'internal_links':
        reviewResult = runInternalLinksReview(article)
        break
      case 'schema':
        reviewResult = runSchemaReview(article)
        break
      case 'fact_check':
        reviewResult = runFactCheckReview(article)
        break
      case 'image':
        reviewResult = runImageReview(article)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid reviewType' },
          { status: 400 }
        )
    }

    const passed = reviewResult.score >= 70

    // Auto-fix what we can
    let autoFixed = false
    const autoFixDetails: Record<string, unknown> = {}

    if (reviewResult.autoFixes && Object.keys(reviewResult.autoFixes).length > 0) {
      const updateData: Record<string, unknown> = {}

      // Auto-fix meta title if missing
      if (reviewResult.autoFixes.metaTitle && !article.metaTitle) {
        updateData.metaTitle = reviewResult.autoFixes.metaTitle as string
        autoFixDetails.metaTitle = reviewResult.autoFixes.metaTitle
        autoFixed = true
      }

      // Auto-fix internal links if suggestions exist
      if (reviewResult.autoFixes.suggestedInternalLinks) {
        const existingLinks: Array<{ anchor: string; href: string }> = JSON.parse(article.internalLinks || '[]')
        const newLinks = reviewResult.autoFixes.suggestedInternalLinks as Array<{ anchor: string; href: string }>
        const mergedLinks = [...existingLinks, ...newLinks]
        updateData.internalLinks = JSON.stringify(mergedLinks)
        autoFixDetails.addedInternalLinks = newLinks
        autoFixed = true
      }

      // Auto-fix external citations if suggestions exist
      if (reviewResult.autoFixes.suggestedCitations) {
        const existingCitations: Array<{ title: string; url: string }> = JSON.parse(article.externalCitations || '[]')
        const newCitations = reviewResult.autoFixes.suggestedCitations as Array<{ title: string; url: string }>
        const mergedCitations = [...existingCitations, ...newCitations]
        updateData.externalCitations = JSON.stringify(mergedCitations)
        autoFixDetails.addedCitations = newCitations
        autoFixed = true
      }

      // Auto-fix schema if generated
      if (reviewResult.autoFixes.generatedSchemas) {
        let currentSchema: Record<string, unknown> = { '@context': 'https://schema.org', '@graph': [] }
        if (article.schemaJson) {
          try {
            currentSchema = JSON.parse(article.schemaJson)
          } catch { /* empty */ }
        }
        const graph = (currentSchema['@graph'] as Array<Record<string, unknown>>) || []
        const generatedSchemas = reviewResult.autoFixes.generatedSchemas as Record<string, unknown>
        for (const [, schemaObj] of Object.entries(generatedSchemas)) {
          graph.push(schemaObj as Record<string, unknown>)
        }
        currentSchema['@graph'] = graph
        updateData.schemaJson = JSON.stringify(currentSchema)
        autoFixDetails.addedSchemas = Object.keys(generatedSchemas)
        autoFixed = true
      }

      // Apply auto-fixes to the article
      if (Object.keys(updateData).length > 0) {
        // Also update review scores on the article
        const scoreFieldMap: Record<string, string> = {
          seo: 'seoScore',
          aeo: 'aeoScore',
          geo: 'geoScore',
          citation: 'citationReadiness',
        }
        if (scoreFieldMap[reviewType]) {
          updateData[scoreFieldMap[reviewType]] = reviewResult.score
        }

        await db.contentArticle.update({
          where: { id: articleId },
          data: updateData,
        })
      }
    }

    // Update article scores even without auto-fixes
    if (!autoFixed) {
      const scoreFieldMap: Record<string, string> = {
        seo: 'seoScore',
        aeo: 'aeoScore',
        geo: 'geoScore',
        citation: 'citationReadiness',
      }
      if (scoreFieldMap[reviewType]) {
        await db.contentArticle.update({
          where: { id: articleId },
          data: { [scoreFieldMap[reviewType]]: reviewResult.score },
        })
      }
    }

    // Store the review
    const review = await db.contentReview.create({
      data: {
        articleId,
        reviewType,
        reviewer: 'ai',
        score: reviewResult.score,
        passed,
        findings: JSON.stringify(reviewResult.findings),
        suggestions: JSON.stringify(reviewResult.suggestions),
        autoFixed,
        autoFixDetails: autoFixed ? JSON.stringify(autoFixDetails) : null,
      },
    })

    // Update article status to reviewing if it was draft
    if (article.status === 'draft') {
      await db.contentArticle.update({
        where: { id: articleId },
        data: { status: 'reviewing' },
      })
    }

    return NextResponse.json({
      review: {
        id: review.id,
        reviewType: review.reviewType,
        score: review.score,
        passed: review.passed,
        findings: reviewResult.findings,
        suggestions: reviewResult.suggestions,
        autoFixed: review.autoFixed,
        autoFixDetails: autoFixed ? autoFixDetails : null,
        createdAt: review.createdAt,
      },
    })
  } catch (error) {
    console.error('[content-engine/review POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to run review' },
      { status: 500 }
    )
  }
}
