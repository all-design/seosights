import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** A single day-score projection point. */
interface ProjectionPoint { day: number; score: number }

/** A task item that impacts the visibility score. */
interface ForecastTask { label: string; completed: boolean; scoreImpact: number }

/** Full 90-day forecast response. */
interface ForecastResponse {
  currentScore: number; projections: ProjectionPoint[]; tasks: ForecastTask[]; summary: string
}

interface ForecastRequest { brand: string; currentScore?: number; url?: string }

/** Strip markdown fences and trailing commas for robust JSON parsing. */
function sanitizeJSON(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  s = s.replace(/,\s*([}\]])/g, '$1')
  return s
}

/** Realistic fallback forecast using logarithmic growth when LLM is unavailable. */
function fallbackForecast(brand: string, currentScore: number): ForecastResponse {
  const base = currentScore || 28
  const gain30 = Math.round(base * 0.15)
  const gain60 = Math.round(base * 0.28)
  const gain90 = Math.round(base * 0.38)
  const projections: ProjectionPoint[] = [
    { day: 0, score: base },
    { day: 30, score: Math.min(95, base + gain30) },
    { day: 60, score: Math.min(95, base + gain60) },
    { day: 90, score: Math.min(95, base + gain90) },
  ]
  const tasks: ForecastTask[] = [
    { label: 'Add JSON-LD Organization & Product schema', completed: false, scoreImpact: 8 },
    { label: 'Create llms.txt for AI crawlers', completed: false, scoreImpact: 6 },
    { label: 'Claim G2 & Trustpilot profiles', completed: false, scoreImpact: 5 },
    { label: 'Publish 4 AI-optimized blog posts', completed: false, scoreImpact: 7 },
    { label: 'Build Wikipedia/Wikidata presence', completed: false, scoreImpact: 9 },
    { label: 'Secure 2+ press mentions', completed: false, scoreImpact: 4 },
  ]
  return {
    currentScore: base, projections, tasks,
    summary: `Fallback projection for ${brand}: from ${base} to ${projections[3].score} over 90 days with moderate effort. LLM was unavailable.`,
  }
}

const DEFAULT_DAYS = [0, 30, 60, 90]

/**
 * POST /api/ai/forecast
 *
 * LLM-powered 90-day AI Visibility Score forecast. Projects the
 * trajectory of a brand's visibility across AI engines over 30/60/90
 * day horizons, with specific tasks and their score impact.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ForecastRequest
    const { brand, currentScore, url } = body

    if (!brand || typeof brand !== 'string' || brand.trim().length < 1) {
      return NextResponse.json({ error: 'brand is required' }, { status: 400 })
    }

    const scoreLabel = currentScore != null ? String(currentScore) : 'estimate'

    const prompt = `You are an AI visibility forecaster. Project the AI Visibility Score trajectory for this brand over 90 days.

Brand: ${brand}
Current score: ${scoreLabel}
${url ? `Website: ${url}` : ''}

Based on typical improvement patterns:
1. Current score
2. 30-day projection (with moderate effort)
3. 60-day projection
4. 90-day projection
5. Key tasks needed to achieve this trajectory

Return JSON:
{
  "currentScore": number,
  "projections": [
    { "day": 0, "score": number },
    { "day": 30, "score": number },
    { "day": 60, "score": number },
    { "day": 90, "score": number }
  ],
  "tasks": [
    { "label": string, "completed": boolean, "scoreImpact": number }
  ],
  "summary": "brief projection summary"
}

Return ONLY the JSON object — no markdown, no commentary.`

    let forecast: ForecastResponse & { _meta: { status: DataStatus; model: string; provider: string; latencyMs: number } }
    try {
      const routerResult = await routeLLM(
        [
          { role: 'system', content: 'You are a precise JSON-returning AI visibility forecaster. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        { taskType: 'reasoning', temperature: 0.4, allowSimulation: true },
      )
      const raw = routerResult.content
      const dataStatus: DataStatus = routerResult.status

      if (!raw) throw new Error('Empty LLM response')

      const parsed = JSON.parse(sanitizeJSON(raw)) as ForecastResponse
      const cs = Number(parsed.currentScore) || currentScore || 28

      // Scores are clamped to [1,99] range — mark as estimated if originally 'live'
      const finalStatus: DataStatus = dataStatus === 'live' ? 'estimated' : dataStatus

      forecast = {
        currentScore: cs,
        projections: Array.isArray(parsed.projections) && parsed.projections.length >= 4
          ? parsed.projections.slice(0, 4).map((p: Partial<ProjectionPoint>, i: number) => ({
              day: Number(p.day) || DEFAULT_DAYS[i],
              score: Math.min(99, Math.max(1, Number(p.score) || cs)),
            }))
          : fallbackForecast(brand, cs).projections,
        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks.map((t: Partial<ForecastTask>) => ({
              label: String(t.label || 'Unnamed task'), completed: Boolean(t.completed),
              scoreImpact: Number(t.scoreImpact) || 1,
            }))
          : fallbackForecast(brand, cs).tasks,
        summary: String(parsed.summary || `${brand} AI visibility forecast over 90 days.`),
        _meta: {
          status: finalStatus,
          model: routerResult.model,
          provider: routerResult.provider,
          latencyMs: routerResult.latencyMs,
        },
      }
    } catch (llmErr) {
      console.error('[forecast] LLM failed, using fallback:', llmErr instanceof Error ? llmErr.message : 'Unknown')
      const fallback = fallbackForecast(brand, currentScore || 28)
      forecast = {
        ...fallback,
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
      }
    }

    return NextResponse.json(forecast)
  } catch (error) {
    console.error('[forecast] Unhandled error:', error instanceof Error ? error.message : 'Unknown')
    const fallback = fallbackForecast('Unknown', 28)
    return NextResponse.json({
      ...fallback,
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
    })
  }
}
