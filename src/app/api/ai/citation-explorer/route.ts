import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'
import { parseLLMJson } from '@/lib/llm-utils'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** A single citation source entry. */
interface CitationSource {
  name: string
  type: string
  icon: string
  mentions: number
  lastSeen: string
  authority: 'High' | 'Medium' | 'Low'
  snippet: string
}

/** Per-engine citation data. */
interface EngineCitations {
  mentionCount: number
  sources: CitationSource[]
}

/** Full citation-explorer response shape. */
interface CitationExplorerResponse {
  totalCitations: number
  engines: {
    chatgpt: EngineCitations
    claude: EngineCitations
    gemini: EngineCitations
    perplexity: EngineCitations
  }
}

/** Ensure a value is a valid authority level. */
function toAuthority(v: unknown): 'High' | 'Medium' | 'Low' {
  if (v === 'High' || v === 'Medium' || v === 'Low') return v
  return 'Medium'
}

/** Normalize raw source data from LLM into CitationSource shape. */
function toSource(raw: Record<string, unknown>): CitationSource {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Unknown Source',
    type: typeof raw.type === 'string' ? raw.type : 'website',
    icon: typeof raw.icon === 'string' ? raw.icon : 'globe',
    mentions: typeof raw.mentions === 'number' ? raw.mentions : 1,
    lastSeen: typeof raw.lastSeen === 'string' ? raw.lastSeen : '2025-01-15',
    authority: toAuthority(raw.authority),
    snippet: typeof raw.snippet === 'string' ? raw.snippet : '',
  }
}

/** Build fallback data when the LLM is unavailable. */
function fallbackData(brand: string): CitationExplorerResponse {
  const makeSources = (prefix: string): CitationSource[] => [
    { name: 'Reddit r/SaaS', type: 'Reddit', icon: 'messages-square', mentions: 8 + Math.floor(Math.random() * 6), lastSeen: '2h ago', authority: 'Medium', snippet: `${brand} came up in a thread about the best tools for startups. Users highlighted the onboarding speed.` },
    { name: 'Wikipedia', type: 'Encyclopedia', icon: 'book-open', mentions: 2, lastSeen: '3d ago', authority: 'High', snippet: `${brand} is listed as a notable company in the SaaS category with a brief overview.` },
    { name: 'G2 Reviews', type: 'Review Platform', icon: 'star', mentions: 14 + Math.floor(Math.random() * 8), lastSeen: '1d ago', authority: 'High', snippet: `${brand} has a 4.3/5 rating on G2 with users praising the free tier and API access.` },
    { name: 'Forbes Tech', type: 'News', icon: 'newspaper', mentions: 3, lastSeen: '1w ago', authority: 'High', snippet: `${brand} was featured in a Forbes roundup of emerging productivity tools for 2025.` },
    { name: 'GitHub Discussions', type: 'Developer', icon: 'github', mentions: 5, lastSeen: '5d ago', authority: 'Medium', snippet: `Developers discuss ${brand}'s API documentation quality and integration ease.` },
  ]

  return {
    totalCitations: 78 + Math.floor(Math.random() * 30),
    engines: {
      chatgpt: { mentionCount: 24 + Math.floor(Math.random() * 8), sources: makeSources('chatgpt') },
      claude: { mentionCount: 12 + Math.floor(Math.random() * 6), sources: makeSources('claude') },
      gemini: { mentionCount: 8 + Math.floor(Math.random() * 5), sources: makeSources('gemini') },
      perplexity: { mentionCount: 34 + Math.floor(Math.random() * 10), sources: makeSources('perplexity') },
    },
  }
}

/** System prompt for the LLM. */
const SYSTEM_PROMPT = `You are an AI citation analyst. You analyze where AI search engines might have learned about a brand. You must return ONLY valid JSON with no extra commentary.`

/**
 * POST /api/ai/citation-explorer
 *
 * Returns citation sources per AI engine for a brand,
 * using LLM analysis to identify likely sources, mention counts,
 * authority levels, and representative snippets.
 */
export async function POST(req: NextRequest) {
  let brand = ''
  try {
    const body = await req.json()
    const rawBrand = (body as { brand?: string; url?: string }).brand
    const url = (body as { brand?: string; url?: string }).url || ''

    if (!rawBrand) {
      return NextResponse.json({ error: 'Missing required field: brand' }, { status: 400 })
    }

    brand = rawBrand

    const userMessage = `Analyze where AI search engines might have learned about this brand.

Brand: ${brand}
${url ? `Website: ${url}` : ''}

For each AI engine (ChatGPT, Claude, Gemini, Perplexity), list the most likely citation sources:
- Source name and type (Reddit, Wikipedia, G2, Forbes, GitHub, Medium, docs, etc.)
- How many times this source likely contributes to AI citations
- Authority level (High/Medium/Low)
- A snippet of what the AI might have read there

Return ONLY valid JSON:
{
  "totalCitations": number,
  "engines": {
    "chatgpt": {
      "mentionCount": number,
      "sources": [
        { "name": "source name", "type": "source type", "icon": "icon-name", "mentions": number, "lastSeen": "relative time", "authority": "High|Medium|Low", "snippet": "what AI might have read" }
      ]
    },
    "claude": { "mentionCount": number, "sources": [...] },
    "gemini": { "mentionCount": number, "sources": [...] },
    "perplexity": { "mentionCount": number, "sources": [...] }
  }
}`

    const routerResult = await routeLLM(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      { taskType: 'entity_extraction', temperature: 0.4, allowSimulation: true }
    )
    const raw = routerResult.content
    const dataStatus: DataStatus = routerResult.status

    if (!raw) throw new Error('Empty LLM response')

    const parsed = parseLLMJson(raw)
    const rawEngines = (parsed.engines ?? {}) as Record<string, Record<string, unknown>>
    const engineKeys = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const

    const engines: CitationExplorerResponse['engines'] = {} as CitationExplorerResponse['engines']
    let totalCitations = 0

    for (const key of engineKeys) {
      const engData = rawEngines[key] ?? {}
      const mentionCount = typeof engData.mentionCount === 'number' ? engData.mentionCount : Math.floor(Math.random() * 20) + 5
      const rawSources = Array.isArray(engData.sources) ? engData.sources : []
      const sources = rawSources
        .filter((s: unknown) => typeof s === 'object' && s !== null)
        .map((s: unknown) => toSource(s as Record<string, unknown>))
        .slice(0, 8)
      totalCitations += mentionCount
      engines[key] = { mentionCount, sources }
    }

    return NextResponse.json({
      totalCitations: typeof parsed.totalCitations === 'number' ? parsed.totalCitations : totalCitations,
      engines,
      _meta: {
        status: dataStatus,
        model: routerResult.model,
        provider: routerResult.provider,
        latencyMs: routerResult.latencyMs,
      },
    })
  } catch (err) {
    console.error('[citation-explorer] LLM failed, returning simulation:', err instanceof Error ? err.message : 'Unknown')
    const fallback = fallbackData(brand || 'your brand')
    return NextResponse.json({
      ...fallback,
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
    })
  }
}
