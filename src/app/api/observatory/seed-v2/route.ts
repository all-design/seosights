import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/seed-v2
 * Seeds 3 new Observatory models:
 *   1. AISearchGraphEdge — AI Search Graph™ citation chains
 *   2. ObservatoryTimeline — AI Search Timeline™ events
 *   3. ObservatoryExternalCitation — "Cited by" data (requires sample ObservatoryReport)
 */

// Simple seeded pseudo-random for consistent citationCounts
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function randomCitationCount(seed: number): number {
  return Math.floor(seededRandom(seed) * 195) + 5 // 5-200
}

export async function POST() {
  try {
    const results: string[] = []
    const now = new Date()

    // ─── 1. AISearchGraphEdge ──────────────────────────────────────
    // Citation chains with: sourceNode, sourceType, targetNode, targetType, relation, aiModel, weight, period, citationCount, isSimulated

    const graphEdges: Array<{
      sourceNode: string
      sourceType: string
      targetNode: string
      targetType: string
      relation: string
      aiModel: string | null
      weight: number
      period: string
      citationCount: number
      isSimulated: boolean
    }> = []

    // Helper to push edge
    const edge = (
      sourceNode: string,
      sourceType: string,
      targetNode: string,
      targetType: string,
      relation: string,
      aiModel: string | null,
      weight: number,
      seed: number
    ) => {
      graphEdges.push({
        sourceNode,
        sourceType,
        targetNode,
        targetType,
        relation,
        aiModel,
        weight,
        period: '2026-07',
        citationCount: randomCitationCount(seed),
        isSimulated: true,
      })
    }

    // Chain 1: ChatGPT → Wikipedia → Health → CDC → Mayo Clinic
    edge('ChatGPT', 'ai_model', 'Wikipedia', 'source', 'cites', 'ChatGPT', 10, 101)
    edge('Wikipedia', 'source', 'Health', 'industry', 'belongs_to', null, 7, 102)
    edge('Health', 'industry', 'CDC', 'entity', 'recommends', null, 6, 103)
    edge('CDC', 'entity', 'Mayo Clinic', 'entity', 'influences', null, 4, 104)

    // Chain 2: ChatGPT → Wikipedia → Health → WebMD (shared edges with Chain 1, deduped below)
    edge('ChatGPT', 'ai_model', 'Wikipedia', 'source', 'cites', 'ChatGPT', 10, 105) // duplicate - deduped
    edge('Wikipedia', 'source', 'Health', 'industry', 'belongs_to', null, 7, 106) // duplicate - deduped
    edge('Health', 'industry', 'WebMD', 'entity', 'recommends', null, 5, 107)

    // Chain 3: ChatGPT → GitHub → React → Vercel
    edge('ChatGPT', 'ai_model', 'GitHub', 'source', 'cites', 'ChatGPT', 9, 108)
    edge('GitHub', 'source', 'React', 'entity', 'references', null, 7, 109)
    edge('React', 'entity', 'Vercel', 'entity', 'influences', null, 4, 110)

    // Chain 4: Claude → GitHub → React → Vercel (shared edges with Chain 3, deduped below)
    edge('Claude', 'ai_model', 'GitHub', 'source', 'cites', 'Claude', 8, 111)
    edge('GitHub', 'source', 'React', 'entity', 'references', null, 7, 112) // duplicate - deduped
    edge('React', 'entity', 'Vercel', 'entity', 'influences', null, 4, 113) // duplicate - deduped

    // Chain 5: Claude → GitHub → Docs → MDN (Claude→GitHub deduped below)
    edge('Claude', 'ai_model', 'GitHub', 'source', 'cites', 'Claude', 8, 114) // duplicate - deduped
    edge('GitHub', 'source', 'Docs', 'industry', 'belongs_to', null, 6, 115)
    edge('Docs', 'industry', 'MDN', 'entity', 'recommends', null, 5, 116)

    // Chain 6: Claude → Reddit → Discussion → Stack Overflow
    edge('Claude', 'ai_model', 'Reddit', 'source', 'cites', 'Claude', 7, 117)
    edge('Reddit', 'source', 'Discussion', 'industry', 'belongs_to', null, 5, 118)
    edge('Discussion', 'industry', 'Stack Overflow', 'entity', 'recommends', null, 5, 119)

    // Chain 7: Gemini → LinkedIn → Professional → Forbes
    edge('Gemini', 'ai_model', 'LinkedIn', 'source', 'cites', 'Gemini', 7, 120)
    edge('LinkedIn', 'source', 'Professional', 'industry', 'belongs_to', null, 5, 121)
    edge('Professional', 'industry', 'Forbes', 'entity', 'recommends', null, 4, 122)

    // Chain 8: Gemini → YouTube → Tutorial → Udemy
    edge('Gemini', 'ai_model', 'YouTube', 'source', 'cites', 'Gemini', 8, 123)
    edge('YouTube', 'source', 'Tutorial', 'industry', 'belongs_to', null, 6, 124)
    edge('Tutorial', 'industry', 'Udemy', 'entity', 'recommends', null, 4, 125)

    // Chain 9: Gemini → Wikipedia → Science → Nature
    edge('Gemini', 'ai_model', 'Wikipedia', 'source', 'cites', 'Gemini', 9, 126)
    edge('Wikipedia', 'source', 'Science', 'industry', 'belongs_to', null, 6, 127)
    edge('Science', 'industry', 'Nature', 'entity', 'recommends', null, 5, 128)

    // Chain 10: Perplexity → Reddit → Discussion → Hacker News (Reddit→Discussion deduped below)
    edge('Perplexity', 'ai_model', 'Reddit', 'source', 'cites', 'Perplexity', 7, 129)
    edge('Reddit', 'source', 'Discussion', 'industry', 'belongs_to', null, 5, 130) // duplicate - deduped
    edge('Discussion', 'industry', 'Hacker News', 'entity', 'recommends', null, 4, 131)

    // Chain 11: Perplexity → ArXiv → Research → PubMed
    edge('Perplexity', 'ai_model', 'ArXiv', 'source', 'cites', 'Perplexity', 9, 132)
    edge('ArXiv', 'source', 'Research', 'industry', 'belongs_to', null, 6, 133)
    edge('Research', 'industry', 'PubMed', 'entity', 'recommends', null, 6, 134)

    // Chain 12: Grok → X/Twitter → News → Reuters
    edge('Grok', 'ai_model', 'X/Twitter', 'source', 'cites', 'Grok', 8, 135)
    edge('X/Twitter', 'source', 'News', 'industry', 'belongs_to', null, 6, 136)
    edge('News', 'industry', 'Reuters', 'entity', 'recommends', null, 5, 137)

    // Chain 13: Grok → X/Twitter → News → AP News (shared edges with Chain 12, deduped below)
    edge('Grok', 'ai_model', 'X/Twitter', 'source', 'cites', 'Grok', 8, 138) // duplicate - deduped
    edge('X/Twitter', 'source', 'News', 'industry', 'belongs_to', null, 6, 139) // duplicate - deduped
    edge('News', 'industry', 'AP News', 'entity', 'recommends', null, 4, 140)

    // Chain 14: DeepSeek → Wikipedia → Technology → IEEE
    edge('DeepSeek', 'ai_model', 'Wikipedia', 'source', 'cites', 'DeepSeek', 9, 141)
    edge('Wikipedia', 'source', 'Technology', 'industry', 'belongs_to', null, 6, 142)
    edge('Technology', 'industry', 'IEEE', 'entity', 'recommends', null, 5, 143)

    // Chain 15: DeepSeek → GitHub → Python → PyPI
    edge('DeepSeek', 'ai_model', 'GitHub', 'source', 'cites', 'DeepSeek', 8, 144)
    edge('GitHub', 'source', 'Python', 'entity', 'references', null, 6, 145)
    edge('Python', 'entity', 'PyPI', 'entity', 'influences', null, 3, 146)

    // Deduplicate edges by unique key: sourceNode + targetNode + relation + period
    const seen = new Set<string>()
    const uniqueEdges = graphEdges.filter((e) => {
      const key = `${e.sourceNode}|${e.targetNode}|${e.relation}|${e.period}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const graphResult = await db.aISearchGraphEdge.createMany({
      data: uniqueEdges,
    })
    results.push(`AISearchGraphEdge: ${graphResult.count} created (from ${graphEdges.length} total edges, ${graphEdges.length - uniqueEdges.length} duplicates removed)`)

    // ─── 2. ObservatoryTimeline ──────────────────────────────────────
    const timelineEvents = [
      {
        date: new Date('2025-06-01'),
        event: 'ChatGPT added real-time web browsing capability',
        aiModel: 'ChatGPT',
        category: 'new_capability',
        significance: 0.9,
        description: 'OpenAI enabled real-time web browsing in ChatGPT, allowing the model to access and cite current web sources rather than relying solely on training data. This fundamentally changed citation patterns across AI search.',
        isSimulated: true,
      },
      {
        date: new Date('2025-09-01'),
        event: 'Claude started citing academic papers (ArXiv)',
        aiModel: 'Claude',
        category: 'source_shift',
        significance: 0.7,
        description: 'Anthropic updated Claude to include ArXiv preprints and published papers in its citation chain, marking a significant shift toward academic sources for factual queries.',
        isSimulated: true,
      },
      {
        date: new Date('2025-11-01'),
        event: 'Gemini began prioritizing YouTube sources',
        aiModel: 'Gemini',
        category: 'source_shift',
        significance: 0.75,
        description: 'Google\'s Gemini started surfacing YouTube videos and transcripts as primary sources, leveraging Google\'s video platform ownership for enriched citation data.',
        isSimulated: true,
      },
      {
        date: new Date('2026-01-01'),
        event: 'Claude stopped using Reddit for health queries',
        aiModel: 'Claude',
        category: 'citation_shift',
        significance: 0.85,
        description: 'Anthropic removed Reddit from Claude\'s health-related citation sources after identifying reliability concerns with community-generated medical advice.',
        isSimulated: true,
      },
      {
        date: new Date('2026-01-15'),
        event: 'ChatGPT switched to PubMed for medical queries',
        aiModel: 'ChatGPT',
        category: 'source_shift',
        significance: 0.8,
        description: 'OpenAI reconfigured ChatGPT to prefer PubMed and peer-reviewed medical literature over general web sources for health-related queries, improving citation reliability.',
        isSimulated: true,
      },
      {
        date: new Date('2026-02-01'),
        event: 'Perplexity doubled citation volume',
        aiModel: 'Perplexity',
        category: 'citation_shift',
        significance: 0.6,
        description: 'Perplexity AI significantly increased the number of citations per response, moving from an average of 3 sources to 6+ sources per answer.',
        isSimulated: true,
      },
      {
        date: new Date('2026-02-15'),
        event: 'All major models dropped unverified health blogs',
        aiModel: null,
        category: 'behavior_change',
        significance: 0.9,
        description: 'A coordinated shift across ChatGPT, Claude, Gemini, and Perplexity to exclude unverified health blogs and personal medical websites from citation sources, prioritizing institutional and peer-reviewed content.',
        isSimulated: true,
      },
      {
        date: new Date('2026-03-01'),
        event: 'Gemini started citing Docs and technical documentation',
        aiModel: 'Gemini',
        category: 'source_shift',
        significance: 0.7,
        description: 'Google\'s Gemini began incorporating official technical documentation (MDN, Google Developers, Microsoft Docs) as primary sources for developer-related queries.',
        isSimulated: true,
      },
      {
        date: new Date('2026-03-15'),
        event: 'Grok added real-time X/Twitter source attribution',
        aiModel: 'Grok',
        category: 'new_capability',
        significance: 0.8,
        description: 'xAI\'s Grok integrated real-time X/Twitter source attribution, citing specific posts and threads as sources for news and current events queries.',
        isSimulated: true,
      },
      {
        date: new Date('2026-04-01'),
        event: 'DeepSeek increased Wikipedia references by 19%',
        aiModel: 'DeepSeek',
        category: 'citation_shift',
        significance: 0.55,
        description: 'DeepSeek significantly increased its reliance on Wikipedia as a source, with Wikipedia citations rising 19% month-over-month across all query categories.',
        isSimulated: true,
      },
      {
        date: new Date('2026-05-01'),
        event: 'Reddit blocked AI crawlers — citation drop across all models',
        aiModel: null,
        category: 'policy_change',
        significance: 0.95,
        description: 'Reddit implemented technical measures blocking AI model crawlers, causing an immediate and significant drop in Reddit citations across all major AI search models. This represents one of the most impactful policy changes in AI search history.',
        isSimulated: true,
      },
      {
        date: new Date('2026-06-01'),
        event: 'Stack Overflow citation decline accelerated to -22%',
        aiModel: null,
        category: 'citation_shift',
        significance: 0.7,
        description: 'Stack Overflow citations in AI search results declined 22% year-over-year, accelerating from the -14% trend seen in Q1. The decline correlates with AI models shifting to official documentation and self-hosted community resources.',
        isSimulated: true,
      },
    ]

    const timelineResult = await db.observatoryTimeline.createMany({
      data: timelineEvents,
    })
    results.push(`ObservatoryTimeline: ${timelineResult.count} events created`)

    // ─── 3. ObservatoryExternalCitation (with sample report) ────────

    // First, create the sample ObservatoryReport
    const report = await db.observatoryReport.upsert({
      where: { slug: 'ai-citation-trends-q1-2026' },
      update: {
        title: 'AI Citation Trends Q1 2026',
        type: 'quarterly_report',
        status: 'published',
        methodologyVersion: 'v1.4',
        promptSet: '2026-Q1',
        modelsStudied: JSON.stringify(['ChatGPT', 'Claude', 'Gemini', 'Perplexity']),
        studyPeriod: '90 days',
        significanceCriteria: 'p < 0.05, minimum 50 queries per model',
        doi: 'OBS-2026-0001',
        confidenceDistribution: JSON.stringify({ '90plus': 42, '80plus': 18, '70plus': 5, '60plus': 2, below60: 1 }),
        permanentUrl: '/research/2026/q1/ai-citation-trends',
        citedByCount: 8,
        citedBySources: JSON.stringify(['HubSpot', 'Search Engine Land', 'Ahrefs', 'Moz', 'TechCrunch', 'Semrush', 'Marketing Land', 'Search Engine Journal']),
        isSimulated: true,
        publishedAt: now,
      },
      create: {
        slug: 'ai-citation-trends-q1-2026',
        title: 'AI Citation Trends Q1 2026',
        type: 'quarterly_report',
        status: 'published',
        methodologyVersion: 'v1.4',
        promptSet: '2026-Q1',
        modelsStudied: JSON.stringify(['ChatGPT', 'Claude', 'Gemini', 'Perplexity']),
        studyPeriod: '90 days',
        significanceCriteria: 'p < 0.05, minimum 50 queries per model',
        doi: 'OBS-2026-0001',
        confidenceDistribution: JSON.stringify({ '90plus': 42, '80plus': 18, '70plus': 5, '60plus': 2, below60: 1 }),
        permanentUrl: '/research/2026/q1/ai-citation-trends',
        citedByCount: 8,
        citedBySources: JSON.stringify(['HubSpot', 'Search Engine Land', 'Ahrefs', 'Moz', 'TechCrunch', 'Semrush', 'Marketing Land', 'Search Engine Journal']),
        isSimulated: true,
        publishedAt: now,
      },
    })

    const externalCitations = [
      {
        reportId: report.id,
        sourceName: 'HubSpot',
        sourceUrl: 'https://blog.hubspot.com/marketing/ai-citation-patterns-2026',
        sourceType: 'blog',
        citedAt: new Date('2026-03-15'),
        context: 'According to AI Search Observatory, ChatGPT citation patterns shifted dramatically in Q1 2026, with medical queries now predominantly citing institutional sources.',
        verified: true,
      },
      {
        reportId: report.id,
        sourceName: 'Search Engine Land',
        sourceUrl: 'https://searchengineland.com/reddit-citations-declining-ai-search-2026',
        sourceType: 'news',
        citedAt: new Date('2026-04-02'),
        context: 'AI Search Observatory reports Reddit citations declining across all major AI models following platform policy changes.',
        verified: true,
      },
      {
        reportId: report.id,
        sourceName: 'Ahrefs',
        sourceUrl: 'https://ahrefs.com/blog/ai-search-observatory-github-citations',
        sourceType: 'blog',
        citedAt: new Date('2026-05-10'),
        context: 'Data from AI Search Observatory shows GitHub citations rising steadily as AI models increasingly reference code repositories and technical documentation.',
        verified: true,
      },
      {
        reportId: report.id,
        sourceName: 'Moz',
        sourceUrl: 'https://moz.com/blog/ai-search-observatory-q1-report',
        sourceType: 'blog',
        citedAt: new Date('2026-02-28'),
        context: "AI Search Observatory's Q1 report found significant shifts in how AI models attribute sources, with implications for SEO strategy.",
        verified: false,
      },
      {
        reportId: report.id,
        sourceName: 'TechCrunch',
        sourceUrl: 'https://techcrunch.com/2026/06/01/ai-search-observatory-major-shift/',
        sourceType: 'news',
        citedAt: new Date('2026-06-01'),
        context: 'The AI Search Observatory detected a major shift in citation behavior following Reddit\'s crawler blockade, with cascading effects across all models.',
        verified: true,
      },
      {
        reportId: report.id,
        sourceName: 'Semrush',
        sourceUrl: 'https://semrush.com/blog/ai-visibility-observability-trends',
        sourceType: 'blog',
        citedAt: new Date('2026-04-20'),
        context: 'Based on AI Search Observatory data, AI visibility for technical documentation sites increased 34% in Q1 2026.',
        verified: true,
      },
      {
        reportId: report.id,
        sourceName: 'Marketing Land',
        sourceUrl: 'https://marketingland.com/ai-search-observatory-breaking-research',
        sourceType: 'news',
        citedAt: new Date('2026-05-15'),
        context: "AI Search Observatory's breaking research alert showed real-time citation drops following Reddit's policy change.",
        verified: false,
      },
      {
        reportId: report.id,
        sourceName: 'Search Engine Journal',
        sourceUrl: 'https://searchenginejournal.com/ai-search-observatory-index-q1',
        sourceType: 'news',
        citedAt: new Date('2026-03-08'),
        context: 'According to the AI Search Observatory Index, industry citation health scores improved for healthcare and technology sectors while community-driven sources declined.',
        verified: true,
      },
    ]

    const citationResult = await db.observatoryExternalCitation.createMany({
      data: externalCitations,
    })
    results.push(`ObservatoryExternalCitation: ${citationResult.count} citations created (report: ${report.slug})`)

    return NextResponse.json({
      success: true,
      message: 'Seed v2 complete — 3 new models seeded',
      results,
      summary: {
        graphEdges: graphResult.count,
        timelineEvents: timelineResult.count,
        reportCreated: report.slug,
        externalCitations: citationResult.count,
      },
    })
  } catch (error) {
    console.error('[observatory/seed-v2] POST error:', error)
    return NextResponse.json(
      {
        error: 'Seed v2 failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
