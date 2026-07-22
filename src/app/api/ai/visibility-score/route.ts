import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'
import { parseLLMJson } from '@/lib/llm-utils'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Full visibility-score response shape. */
interface VisibilityScoreResponse {
  overallScore: number
  dimensions: { citationFrequency: number; entityAuthority: number; contentAccessibility: number; sourceDiversity: number }
  perEngine: { chatgpt: number; claude: number; gemini: number; perplexity: number; copilot: number }
  weeklyDelta: number
  verdict: 'Dominant' | 'Competitive' | 'Emerging' | 'Invisible'
  insight: string
}

/** Extract a brand hint from a URL domain. */
function extractBrandFromUrl(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    return hostname.replace(/^www\./, '').split('.')[0]
  } catch { return '' }
}

/** Clamp a number to [0, 100]. */
function clamp(v: unknown, fb: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fb
}

/** Graceful fallback when the LLM is unavailable (overall in 44-73 range). */
function fallbackData(brand: string): VisibilityScoreResponse {
  const b = 44 + Math.floor(Math.random() * 30)
  return {
    overallScore: b,
    dimensions: { citationFrequency: b - 8, entityAuthority: b - 12, contentAccessibility: b + 4, sourceDiversity: b - 3 },
    perEngine: { chatgpt: b + 6, claude: b - 8, gemini: b - 2, perplexity: b + 10, copilot: b - 5 },
    weeklyDelta: +(Math.random() * 6 - 2).toFixed(1),
    verdict: b >= 75 ? 'Dominant' : b >= 55 ? 'Competitive' : b >= 35 ? 'Emerging' : 'Invisible',
    insight: `${brand} has moderate AI visibility. Focus on building entity authority and getting cited in high-trust sources like Wikipedia and G2.`,
  }
}

const SYSTEM_PROMPT = `You are an AI visibility scoring engine. You evaluate brands on their likelihood of being recommended by AI search engines. You must return ONLY valid JSON with no extra commentary.`

/**
 * POST /api/ai/visibility-score
 *
 * Computes the AI Visibility Score (0-100) for a given URL/brand
 * using LLM analysis across dimensions plus per-engine breakdowns.
 */
export async function POST(req: NextRequest) {
  let brand = ''
  let url = ''
  try {
    const body = await req.json()
    const rawBrand = (body as { brand?: string; url?: string }).brand
    url = (body as { brand?: string; url?: string }).url || ''
    if (!rawBrand && !url) return NextResponse.json({ error: 'Missing required field: url or brand' }, { status: 400 })
    brand = rawBrand || extractBrandFromUrl(url) || 'your brand'

    const userMessage = `Evaluate this brand's AI visibility across 5 dimensions and return a structured score.

Brand: ${brand}
Website: ${url || 'unknown'}

Score each dimension 0-100:
1. Citation Frequency — How likely are ChatGPT, Claude, Gemini, Perplexity to cite this brand?
2. Entity Authority — Does this brand have strong entity presence (Wikipedia, Wikidata, Knowledge Graph)?
3. Content Accessibility — Can AI crawlers access the content? Is there llms.txt, structured data?
4. Source Diversity — Is this brand mentioned across diverse sources (Reddit, G2, news, docs)?
5. Per-engine scores: ChatGPT, Claude, Gemini, Perplexity, Copilot

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "dimensions": { "citationFrequency": 0-100, "entityAuthority": 0-100, "contentAccessibility": 0-100, "sourceDiversity": 0-100 },
  "perEngine": { "chatgpt": 0-100, "claude": 0-100, "gemini": 0-100, "perplexity": 0-100, "copilot": 0-100 },
  "weeklyDelta": number,
  "verdict": "Dominant|Competitive|Emerging|Invisible",
  "insight": "one-line actionable insight"
}`

    const routerResult = await routeLLM(
      [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userMessage }],
      { taskType: 'scoring', temperature: 0.35, allowSimulation: true }
    )
    const raw = routerResult.content
    const dataStatus: DataStatus = routerResult.status
    if (!raw) throw new Error('Empty LLM response')

    const parsed = parseLLMJson(raw)
    const dims = (parsed.dimensions ?? {}) as Record<string, unknown>
    const eng = (parsed.perEngine ?? {}) as Record<string, unknown>
    const overall = clamp(parsed.overallScore, 50)

    // Data is heavily clamped to [0,100] range — mark as estimated if it was originally 'live'
    const finalStatus: DataStatus = dataStatus === 'live' ? 'estimated' : dataStatus

    const response: VisibilityScoreResponse & { _meta: { status: DataStatus; model: string; provider: string; latencyMs: number } } = {
      overallScore: overall,
      dimensions: {
        citationFrequency: clamp(dims.citationFrequency, overall - 5),
        entityAuthority: clamp(dims.entityAuthority, overall - 8),
        contentAccessibility: clamp(dims.contentAccessibility, overall),
        sourceDiversity: clamp(dims.sourceDiversity, overall - 3),
      },
      perEngine: {
        chatgpt: clamp(eng.chatgpt, overall), claude: clamp(eng.claude, overall - 5),
        gemini: clamp(eng.gemini, overall - 3), perplexity: clamp(eng.perplexity, overall + 2),
        copilot: clamp(eng.copilot, overall - 4),
      },
      weeklyDelta: typeof parsed.weeklyDelta === 'number' ? +parsed.weeklyDelta.toFixed(1) : +(Math.random() * 4 - 1).toFixed(1),
      verdict: ['Dominant', 'Competitive', 'Emerging', 'Invisible'].includes(parsed.verdict as string)
        ? (parsed.verdict as VisibilityScoreResponse['verdict'])
        : overall >= 75 ? 'Dominant' : overall >= 55 ? 'Competitive' : overall >= 35 ? 'Emerging' : 'Invisible',
      insight: typeof parsed.insight === 'string' ? parsed.insight : fallbackData(brand).insight,
      _meta: {
        status: finalStatus,
        model: routerResult.model,
        provider: routerResult.provider,
        latencyMs: routerResult.latencyMs,
      },
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[visibility-score] LLM failed, returning simulation:', err instanceof Error ? err.message : 'Unknown')
    const fallback = fallbackData(brand || 'your brand')
    return NextResponse.json({
      ...fallback,
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
    })
  }
}
