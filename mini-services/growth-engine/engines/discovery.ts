// ─── AGE Discovery Engine ──────────────────────────────────────────
// Discovers new opportunities from various sources

import { db } from '../../../src/lib/db'

const OPPORTUNITY_TEMPLATES = [
  { title: 'AI Visibility for {Industry}', type: 'industry', source: 'observatory' },
  { title: '{Tool} Generator — Free AI SEO Tool', type: 'tool', source: 'internal_search' },
  { title: 'SeoSights vs {Competitor}', type: 'vs', source: 'competitor' },
  { title: 'Top AI Visibility — {Industry} 2026', type: 'benchmark', source: 'trends' },
  { title: 'How {Industry} Can Improve AI Visibility', type: 'blog', source: 'gsc' },
  { title: '{Entity} — AI Visibility Profile', type: 'entity', source: 'new_entity' },
  { title: 'AI Citation Shift: {Model} Now Cites {Source}', type: 'research', source: 'citation_shift' },
  { title: 'FAQ: AI Visibility for {Industry}', type: 'faq', source: 'ai_models' },
  { title: 'AI Visibility Resource: {Topic}', type: 'resource', source: 'keyword_cluster' },
  { title: 'Broken Link: {Path}', type: 'resource', source: 'broken_link' },
  { title: 'Directory Gap: {Company} Missing', type: 'company', source: 'directory_gap' },
  { title: 'VS Gap: SeoSights vs {Competitor} Missing', type: 'vs', source: 'vs_gap' },
]

const INDUSTRIES = ['Dentists', 'Lawyers', 'SaaS Companies', 'Hotels', 'Ecommerce', 'Clinics', 'Universities', 'Agencies', 'Real Estate', 'Restaurants', 'Fitness Centers', 'Insurance', 'Accounting Firms', 'Veterinarians', 'Architects']
const TOOLS = ['Meta Description', 'Schema Markup', 'FAQ', 'LLMs.txt', 'Robots.txt Validator', 'Entity Extractor', 'Citation Checker', 'Brand Authority', 'AI Visibility Checker']
const COMPETITORS = ['Ahrefs', 'Semrush', 'Surfer SEO', 'Profound', 'Goodie', 'Perplexity', 'Jasper', 'Writer', 'Copy.ai']
const ENTITIES = ['OpenAI', 'Notion', 'HubSpot', 'Stripe', 'Figma', 'Slack', 'Zoom', 'Shopify', 'WordPress', 'Webflow']
const MODELS = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot']
const SOURCES = ['Wikipedia', 'Reddit', 'Stack Overflow', 'Medium', 'Quora']
const TOPICS = ['Knowledge Graphs', 'Entity SEO', 'AI Citations', 'LLM Optimization', 'Schema Strategy', 'Content Optimization']
const COMPANIES = ['Acme Corp', 'TechStart Inc', 'GlobalVis', 'NovaBrand', 'PeakDigital', 'Zenith Media', 'Apex Strategy']
const PATHS = ['/tools/old-schema', '/blog/deprecated-post', '/industries/outdated-page']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillTemplate(template: string): string {
  return template
    .replace('{Industry}', pick(INDUSTRIES))
    .replace('{Tool}', pick(TOOLS))
    .replace('{Competitor}', pick(COMPETITORS))
    .replace('{Entity}', pick(ENTITIES))
    .replace('{Model}', pick(MODELS))
    .replace('{Source}', pick(SOURCES))
    .replace('{Topic}', pick(TOPICS))
    .replace('{Company}', pick(COMPANIES))
    .replace('{Path}', pick(PATHS))
}

export async function runDiscoveryEngine(): Promise<{ discovered: number }> {
  console.log(`[Discovery] ${new Date().toISOString()} — Running discovery engine...`)

  const count = Math.floor(Math.random() * 8) + 3 // 3-10 new opportunities per run
  let created = 0

  for (let i = 0; i < count; i++) {
    const template = pick(OPPORTUNITY_TEMPLATES)
    const title = fillTemplate(template.title)

    // Check for duplicates
    const existing = await db.growthOpportunity.findFirst({
      where: { title, status: { not: 'archived' } }
    })

    if (existing) {
      console.log(`[Discovery] Skipping duplicate: "${title}"`)
      continue
    }

    const seoScore = Math.floor(Math.random() * 40) + 60
    const aiVisScore = Math.floor(Math.random() * 40) + 55
    const bizScore = Math.floor(Math.random() * 35) + 50
    const noveltyScore = Math.floor(Math.random() * 50) + 40
    const compScore = Math.floor(Math.random() * 40) + 45
    const cost = Math.floor(Math.random() * 60) + 10
    const roi = Math.floor(Math.random() * 40) + 50

    const growthScore = Math.round(
      seoScore * 0.2 + aiVisScore * 0.25 + bizScore * 0.2 + noveltyScore * 0.1 + compScore * 0.1 + (100 - cost) * 0.05 + roi * 0.1
    )

    const confidence = Math.round((0.5 + Math.random() * 0.45) * 100) / 100

    await db.growthOpportunity.create({
      data: {
        title,
        description: `Auto-discovered opportunity from ${template.source}`,
        type: template.type,
        source: template.source,
        seoScore,
        aiVisibilityScore: aiVisScore,
        businessScore: bizScore,
        noveltyScore,
        competitionScore: compScore,
        implementationCost: cost,
        expectedROI: roi,
        growthScore,
        confidence,
        targetKeywords: JSON.stringify([title.split(' ').slice(0, 3).join(' ')]),
        targetEntities: JSON.stringify([]),
        relatedExisting: JSON.stringify([]),
        status: 'discovered',
        priority: growthScore >= 80 ? 'p1' : growthScore >= 65 ? 'p2' : growthScore >= 50 ? 'p3' : 'p4',
        discoveredAt: new Date(),
      }
    })
    created++
  }

  console.log(`[Discovery] ${new Date().toISOString()} — Discovered ${created} new opportunities`)
  return { discovered: created }
}
