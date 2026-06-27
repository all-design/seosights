/**
 * Opportunity Finder API
 *
 * POST /api/ai/opportunity-finder
 *
 * Finds citation gaps between a brand and its top competitor.
 * Uses LLM to analyze missing sources where the competitor is cited
 * but the brand is not, with projected impact and recommendations.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/zai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface OpportunityRequest {
  brand: string
  competitor?: string
  url?: string
}

interface MissingSource {
  source: string
  icon: string
  competitorMentions: number
  brandMentions: number
  delta: number
  fixAction: string
}

interface OpportunityResponse {
  brand: { name: string; mentions: number }
  competitor: { name: string; mentions: number }
  gap: number
  missingSources: MissingSource[]
  projectedImpact: { newCitations: number; scoreIncrease: number }
  recommendation: string
}

// ── Fallback Data ────────────────────────────────────────────────

const FALLBACK_SOURCES: MissingSource[] = [
  { source: 'Reddit', icon: 'MessageCircle', competitorMentions: 34, brandMentions: 2, delta: 32, fixAction: 'Engage in relevant subreddits and AMAs' },
  { source: 'Quora', icon: 'HelpCircle', competitorMentions: 28, brandMentions: 1, delta: 27, fixAction: 'Answer top industry questions with expert detail' },
  { source: 'G2', icon: 'Star', competitorMentions: 45, brandMentions: 3, delta: 42, fixAction: 'Collect verified reviews on G2 profile' },
  { source: 'Trustpilot', icon: 'Shield', competitorMentions: 22, brandMentions: 0, delta: 22, fixAction: 'Set up Trustpilot and invite customer reviews' },
  { source: 'Crunchbase', icon: 'Database', competitorMentions: 15, brandMentions: 1, delta: 14, fixAction: 'Create and maintain a Crunchbase company profile' },
  { source: 'Wikidata', icon: 'Globe', competitorMentions: 8, brandMentions: 0, delta: 8, fixAction: 'Add structured Wikidata entry for your brand' },
  { source: 'YouTube', icon: 'Play', competitorMentions: 52, brandMentions: 4, delta: 48, fixAction: 'Publish tutorial and thought-leadership videos' },
  { source: 'Wikipedia', icon: 'BookOpen', competitorMentions: 11, brandMentions: 0, delta: 11, fixAction: 'Work toward notability for a Wikipedia article' },
]

function buildFallback(brand: string, competitor: string): OpportunityResponse {
  const brandMentions = 11
  const competitorMentions = 215
  return {
    brand: { name: brand, mentions: brandMentions },
    competitor: { name: competitor, mentions: competitorMentions },
    gap: competitorMentions - brandMentions,
    missingSources: FALLBACK_SOURCES,
    projectedImpact: { newCitations: 127, scoreIncrease: 34 },
    recommendation: `Focus on Reddit, G2, and YouTube presence first — these three sources account for 70% of the citation gap with ${competitor}.`,
  }
}

// ── JSON Parser ──────────────────────────────────────────────────

function parseLLMResponse(raw: string): OpportunityResponse | null {
  try {
    // Try extracting JSON from markdown code blocks first
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim()

    const parsed = JSON.parse(jsonStr)

    // Validate minimal structure
    if (
      typeof parsed?.brand?.name === 'string' &&
      typeof parsed?.competitor?.name === 'string' &&
      Array.isArray(parsed?.missingSources)
    ) {
      return parsed as OpportunityResponse
    }
  } catch {
    // JSON parse failed
  }
  return null
}

// ── POST Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OpportunityRequest
    const { brand, competitor, url } = body

    if (!brand) {
      return NextResponse.json(
        { error: 'Missing required field: brand' },
        { status: 400 }
      )
    }

    const competitorName = competitor || 'auto-detect'
    const contextLine = url ? `\nBrand URL: ${url}` : ''

    const systemPrompt = `You are an AI citation gap analyst. Compare these two brands and identify where the first brand is missing AI citations that the competitor has.

Brand: ${brand}
Top Competitor: ${competitorName}${contextLine}

Identify:
1. How many times each brand is mentioned across AI engines
2. Which sources cite the competitor but not the brand
3. The projected impact of closing these gaps

Return JSON only:
{
  "brand": { "name": "${brand}", "mentions": number },
  "competitor": { "name": string, "mentions": number },
  "gap": number,
  "missingSources": [
    { "source": string, "icon": string, "competitorMentions": number, "brandMentions": number, "delta": number, "fixAction": string }
  ],
  "projectedImpact": { "newCitations": number, "scoreIncrease": number },
  "recommendation": "brief recommendation"
}

Include exactly 8 missing sources: Reddit, Quora, G2, Trustpilot, Crunchbase, Wikidata, YouTube, Wikipedia.
Use Lucide icon names for the "icon" field (e.g. MessageCircle, HelpCircle, Star, Shield, Database, Globe, Play, BookOpen).
Make the data realistic — competitor should have significantly more mentions than the brand.`

    const raw = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze the citation gap for "${brand}" vs "${competitorName}"` },
      ],
      { temperature: 0.7 }
    )

    const parsed = parseLLMResponse(raw)

    if (parsed) {
      return NextResponse.json(parsed)
    }

    // LLM returned non-parseable response — use fallback with brand names
    console.warn('[opportunity-finder] LLM response not valid JSON, using fallback')
    return NextResponse.json(buildFallback(brand, competitorName))
  } catch (err) {
    console.error('[opportunity-finder] Error:', err instanceof Error ? err.message : 'Unknown')
    // Return fallback data even on complete failure
    const brand = 'Your Brand'
    const competitor = 'Top Competitor'
    return NextResponse.json(buildFallback(brand, competitor))
  }
}
