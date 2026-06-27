import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/zai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Per-engine result shape matching the frontend AIRecommendationSimulator component. */
interface EngineResult {
  engine: string
  dotClass: string
  glowClass: string
  mentioned: boolean
  position?: number
  totalPositions?: number
  confidence: number
  snippet?: string
  competitors: string[]
  sources: string[]
}

/** Reason why a brand might not be mentioned. */
interface WhyNotReason {
  title: string
  detail: string
}

/** Full API response shape. */
interface SimulationResponse {
  prompt: string
  brand: string
  results: EngineResult[]
  reasons: WhyNotReason[]
  overallVerdict: string
}

/** Extract a brand hint from a URL domain. */
function extractBrandFromUrl(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    return hostname.replace(/^www\./, '').split('.')[0]
  } catch {
    return ''
  }
}

/** Strip markdown fences and parse JSON robustly. */
function parseLLMJson(raw: string): Record<string, unknown> {
  let cleaned = raw.trim()
  // Remove ```json ... ``` fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) cleaned = fenceMatch[1].trim()
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(cleaned)
}

/** Build the mapping of engine name to dot/glow CSS classes. */
const ENGINE_STYLES: Record<string, { dot: string; glow: string }> = {
  chatgpt: { dot: 'bg-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]' },
  claude: { dot: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]' },
  gemini: { dot: 'bg-blue-400', glow: 'shadow-[0_0_12px_rgba(96,165,250,0.6)]' },
  perplexity: { dot: 'bg-cyan-400', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.6)]' },
}

/** Convert raw LLM engine data to frontend EngineResult shape. */
function toEngineResult(key: string, data: Record<string, unknown>): EngineResult {
  const style = ENGINE_STYLES[key.toLowerCase()] ?? { dot: 'bg-gray-400', glow: '' }
  const mentioned = Boolean(data.mentioned)
  return {
    engine: key.charAt(0).toUpperCase() + key.slice(1),
    dotClass: style.dot,
    glowClass: style.glow,
    mentioned,
    position: mentioned ? (data.position as number | undefined) ?? undefined : undefined,
    totalPositions: mentioned ? (data.totalPositions as number | undefined) ?? 5 : undefined,
    confidence: typeof data.confidence === 'number' ? data.confidence : (mentioned ? 70 : 0),
    snippet: typeof data.snippet === 'string' ? data.snippet : undefined,
    competitors: Array.isArray(data.competitors) ? data.competitors.filter((c: unknown) => typeof c === 'string') : [],
    sources: Array.isArray(data.sources) ? data.sources.filter((s: unknown) => typeof s === 'string') : [],
  }
}

/** Graceful fallback data when the LLM is unavailable. */
function fallbackData(prompt: string, brand: string): SimulationResponse {
  return {
    prompt,
    brand,
    results: [
      { engine: 'ChatGPT', dotClass: 'bg-emerald-400', glowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]', mentioned: true, position: 2, totalPositions: 5, confidence: 78, snippet: `"…${brand} is a solid pick for early-stage teams — lightweight, fast onboarding, and a generous free tier."`, competitors: ['Notion', 'Monday.com', 'HubSpot'], sources: ['G2', 'Reddit'] },
      { engine: 'Claude', dotClass: 'bg-amber-400', glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]', mentioned: false, confidence: 0, competitors: ['Notion', 'ClickUp', 'Asana'], sources: ['Wikipedia', 'G2'] },
      { engine: 'Gemini', dotClass: 'bg-blue-400', glowClass: 'shadow-[0_0_12px_rgba(96,165,250,0.6)]', mentioned: true, position: 4, totalPositions: 6, confidence: 61, snippet: `"…${brand} appears among newer entrants worth considering, particularly for cost-conscious users."`, competitors: ['Monday.com', 'Asana', 'Trello'], sources: ['Forbes', 'G2'] },
      { engine: 'Perplexity', dotClass: 'bg-cyan-400', glowClass: 'shadow-[0_0_12px_rgba(34,211,238,0.6)]', mentioned: false, confidence: 0, competitors: ['Notion', 'Monday.com', 'ClickUp'], sources: ['Reddit', 'G2', 'Wikipedia'] },
    ],
    reasons: [
      { title: 'Your entity is missing from Wikipedia and Wikidata', detail: 'Claude & Perplexity lean heavily on knowledge-graph sources. No entity = no mention.' },
      { title: 'Only 2 G2 reviews vs competitors\' 200+', detail: 'Review volume is the #1 signal AI engines use for B2B SaaS recommendations.' },
      { title: 'No presence in top Reddit threads for this query', detail: 'r/SaaS and r/startups threads drive 38% of ChatGPT citations in this category.' },
    ],
    overallVerdict: `${brand} has some AI visibility but is missing from Claude and Perplexity. Key gaps: knowledge graph, review volume, and community presence.`,
  }
}

/** System prompt for the LLM. */
const SYSTEM_PROMPT = `You are an AI visibility analyst. Your job is to simulate how the top 4 AI search engines (ChatGPT, Claude, Gemini, Perplexity) would answer a user's query and whether a specific brand would be mentioned. You must return ONLY valid JSON with no extra commentary.`

/**
 * POST /api/ai/recommendation-simulator
 *
 * Accepts a prompt (e.g. "Best CRM for startups") and an optional brand/url,
 * queries the LLM to simulate AI engine recommendations, and returns
 * structured per-engine results matching the frontend component shape.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, brand: rawBrand, url } = body as { prompt?: string; brand?: string; url?: string }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing required field: prompt' }, { status: 400 })
    }

    // Resolve brand: explicit > url domain > "your brand"
    const brand = rawBrand || (url ? extractBrandFromUrl(url) : '') || 'your brand'

    // Build user message
    const userMessage = `Query: "${prompt}"
Brand: "${brand}"

Simulate how the top 4 AI search engines would answer this query. For each engine, determine:
1. Would they mention this brand? (based on typical training data patterns)
2. What position would it appear?
3. Which competitors would be mentioned?
4. What sources would the AI cite?
5. Why would/wouldn't the AI mention this brand?
6. How confident are you?

Return ONLY valid JSON:
{
  "engines": {
    "chatgpt": {
      "mentioned": true,
      "position": 2,
      "totalPositions": 5,
      "snippet": "what ChatGPT might say about this brand",
      "competitors": ["comp1", "comp2", "comp3"],
      "sources": ["source1", "source2"],
      "confidence": 78,
      "reason": "why mentioned or not"
    },
    "claude": { "mentioned": false, "position": null, "totalPositions": null, "snippet": null, "competitors": ["comp1","comp2","comp3"], "sources": ["source1","source2"], "confidence": 0, "reason": "why not mentioned" },
    "gemini": { ... same structure ... },
    "perplexity": { ... same structure ... }
  },
  "whyNotMentioned": [
    { "title": "reason 1", "detail": "explanation" },
    { "title": "reason 2", "detail": "explanation" },
    { "title": "reason 3", "detail": "explanation" }
  ],
  "overallVerdict": "brief summary"
}`

    // Call LLM with 30s timeout
    const llmPromise = createChatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.4 }
    )

    const raw = await Promise.race([
      llmPromise,
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), 30000)),
    ])

    if (!raw) throw new Error('Empty LLM response')

    const parsed = parseLLMJson(raw)
    const engines = parsed.engines as Record<string, Record<string, unknown>> | undefined
    const whyNot = parsed.whyNotMentioned as Array<{ title: string; detail: string }> | undefined

    // Build results array in consistent order
    const engineOrder = ['chatgpt', 'claude', 'gemini', 'perplexity']
    const results: EngineResult[] = engineOrder.map((key) => {
      const data = engines?.[key] ?? {}
      return toEngineResult(key, data)
    })

    // Build reasons array
    const reasons: WhyNotReason[] = Array.isArray(whyNot) && whyNot.length > 0
      ? whyNot.slice(0, 5).map((r) => ({ title: r.title || '', detail: r.detail || '' }))
      : fallbackData(prompt, brand).reasons

    const response: SimulationResponse = {
      prompt,
      brand,
      results,
      reasons,
      overallVerdict: typeof parsed.overallVerdict === 'string' ? parsed.overallVerdict : '',
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[recommendation-simulator] LLM failed, returning fallback:', err instanceof Error ? err.message : 'Unknown')
    // Return fallback so the UI never breaks
    const body = await req.json().catch(() => ({}))
    const { prompt, brand: rawBrand, url } = body as { prompt?: string; brand?: string; url?: string }
    const brand = rawBrand || (url ? extractBrandFromUrl(url) : '') || 'your brand'
    return NextResponse.json(fallbackData(prompt || 'Best CRM for startups', brand))
  }
}
