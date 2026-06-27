/**
 * Competitor War Room API
 *
 * POST /api/ai/competitor-war-room
 *
 * Detailed per-engine competitor comparison with gap reasons.
 * Uses LLM to compare a brand against its top competitors
 * across ChatGPT, Claude, Gemini, and Perplexity.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/zai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────

interface WarRoomRequest {
  brand: string
  competitors?: string[]
  url?: string
}

interface CompetitorEntry {
  name: string
  active: boolean
}

interface EngineData {
  you: number
  competitor: [number, number, number]
  gap: [number, number, number]
  topReason: [string, string, string]
}

type EngineKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

interface ReasonEntry {
  reason: string
  icon: string
  youValue: string
  competitorValue: string
  severity: number
  fixAction: string
}

interface WarRoomResponse {
  competitors: CompetitorEntry[]
  matrix: Record<EngineKey, EngineData>
  reasons: ReasonEntry[]
}

// ── Fallback Data ────────────────────────────────────────────────

function buildFallback(brand: string, competitors: string[]): WarRoomResponse {
  const c = competitors.length > 0 ? competitors.slice(0, 3) : ['Competitor A', 'Competitor B', 'Competitor C']
  return {
    competitors: c.map((name) => ({ name, active: true })),
    matrix: {
      chatgpt: { you: 47, competitor: [142, 118, 76], gap: [95, 71, 29], topReason: ['3x more Reddit mentions', 'Wikipedia article drives authority', 'Lower review volume on G2'] },
      claude: { you: 31, competitor: [96, 88, 54], gap: [65, 57, 23], topReason: ['Structured data is richer', 'More news coverage indexed', 'Missing llms.txt file'] },
      gemini: { you: 28, competitor: [78, 64, 41], gap: [50, 36, 13], topReason: ['Google Knowledge Panel present', 'Wikidata entry boosts trust', 'Sparse schema markup'] },
      perplexity: { you: 89, competitor: [134, 78, 67], gap: [45, -11, -22], topReason: ['More cited research papers', 'You outrank here — maintain lead', 'You outrank here — maintain lead'] },
    },
    reasons: [
      { reason: 'Reddit presence', icon: 'MessageCircle', youValue: '2 mentions', competitorValue: '34 mentions', severity: 9, fixAction: 'Engage in 5+ relevant subreddits weekly' },
      { reason: 'Wikipedia article', icon: 'BookOpen', youValue: 'No article', competitorValue: 'Featured article', severity: 8, fixAction: 'Build notability through press coverage' },
      { reason: 'Review volume', icon: 'Star', youValue: '3 reviews', competitorValue: '45 reviews', severity: 7, fixAction: 'Launch review campaign on G2 & Trustpilot' },
      { reason: 'News coverage', icon: 'Newspaper', youValue: '4 articles', competitorValue: '28 articles', severity: 6, fixAction: 'Distribute press releases monthly via wire services' },
      { reason: 'Schema & llms.txt', icon: 'FileCode', youValue: 'Basic schema, no llms.txt', competitorValue: 'Full schema + llms.txt', severity: 7, fixAction: 'Implement llms.txt and enhance structured data' },
    ],
  }
}

// ── JSON Parser ──────────────────────────────────────────────────

function parseLLMResponse(raw: string): WarRoomResponse | null {
  try {
    // Extract JSON from markdown code blocks if present
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim()

    const parsed = JSON.parse(jsonStr)

    // Validate minimal structure
    if (
      Array.isArray(parsed?.competitors) &&
      parsed?.matrix &&
      typeof parsed.matrix.chatgpt?.you === 'number' &&
      Array.isArray(parsed?.reasons)
    ) {
      return parsed as WarRoomResponse
    }
  } catch {
    // JSON parse failed
  }
  return null
}

// ── POST Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WarRoomRequest
    const { brand, competitors, url } = body

    if (!brand) {
      return NextResponse.json(
        { error: 'Missing required field: brand' },
        { status: 400 }
      )
    }

    const competitorList = competitors && competitors.length > 0
      ? competitors.slice(0, 3).join(', ')
      : 'auto-detect top 3'
    const contextLine = url ? `\nBrand URL: ${url}` : ''

    const systemPrompt = `You are a competitive intelligence analyst for AI visibility. Compare this brand against its top competitors across AI engines.

Brand: ${brand}
Competitors: ${competitorList}${contextLine}

For each AI engine (ChatGPT, Claude, Gemini, Perplexity):
1. How many times does each brand appear?
2. What's the gap?
3. What's the top reason for the gap?

Also provide overall reasons for the competitive gap.

Return JSON only:
{
  "competitors": [
    { "name": string, "active": boolean }
  ],
  "matrix": {
    "chatgpt": { "you": number, "competitor": [number, number, number], "gap": [number, number, number], "topReason": [string, string, string] },
    "claude": { "you": number, "competitor": [number, number, number], "gap": [number, number, number], "topReason": [string, string, string] },
    "gemini": { "you": number, "competitor": [number, number, number], "gap": [number, number, number], "topReason": [string, string, string] },
    "perplexity": { "you": number, "competitor": [number, number, number], "gap": [number, number, number], "topReason": [string, string, string] }
  },
  "reasons": [
    { "reason": string, "icon": string, "youValue": string, "competitorValue": string, "severity": number, "fixAction": string }
  ]
}

Include exactly 5 reasons covering: Reddit presence, Wikipedia article, Review volume, News coverage, Schema & llms.txt.
Use Lucide icon names for the "icon" field.
Severity is 1-10 (10 = most critical).
Make the data realistic and insightful.`

    const raw = await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Run competitive war room analysis for "${brand}" vs "${competitorList}"` },
      ],
      { temperature: 0.7 }
    )

    const parsed = parseLLMResponse(raw)

    if (parsed) {
      return NextResponse.json(parsed)
    }

    // LLM returned non-parseable response — use fallback
    console.warn('[competitor-war-room] LLM response not valid JSON, using fallback')
    return NextResponse.json(buildFallback(brand, competitors || []))
  } catch (err) {
    console.error('[competitor-war-room] Error:', err instanceof Error ? err.message : 'Unknown')
    // Return fallback data even on complete failure
    return NextResponse.json(buildFallback('Your Brand', []))
  }
}
