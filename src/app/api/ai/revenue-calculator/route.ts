import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Revenue projection response shape. */
interface RevenueProjection {
  achievableVisibility: number
  extraImpressions: number
  extraLeads: number
  monthlyRevenue: number
  annualRevenue: number
  conversionRate: number
  avgLeadValue: number
  assumptions: string[]
}

/** Request body schema. */
interface RevenueRequest {
  visitors: number
  currentVisibility: number
  industry?: string
  url?: string
}

/**
 * Strip markdown fences and trailing commas so JSON.parse succeeds
 * even when the LLM wraps output in ```json ... ``` or leaves a
 * trailing comma before a closing brace/bracket.
 */
function sanitizeJSON(raw: string): string {
  let s = raw.trim()
  // Remove markdown code fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1')
  return s
}

/**
 * Build a realistic fallback projection when the LLM is unavailable.
 */
function fallbackProjection(req: RevenueRequest): RevenueProjection {
  const achievable = Math.min(95, req.currentVisibility * 2.5)
  const visibilityGain = achievable - req.currentVisibility
  const extraImpressions = Math.round(req.visitors * (visibilityGain / 100) * 0.35)
  const conversionRate = 0.028
  const avgLeadValue = 180
  const extraLeads = Math.round(extraImpressions * conversionRate)
  const monthlyRevenue = Math.round(extraLeads * avgLeadValue)
  return {
    achievableVisibility: Math.round(achievable),
    extraImpressions,
    extraLeads,
    monthlyRevenue,
    annualRevenue: monthlyRevenue * 12,
    conversionRate,
    avgLeadValue,
    assumptions: [
      'Fallback projection — LLM was unavailable',
      `Estimated ${Math.round(visibilityGain)}pp visibility gain based on 2.5× multiplier`,
      `${req.industry || 'General SaaS'} average conversion rate of ${conversionRate * 100}%`,
    ],
  }
}

/**
 * POST /api/ai/revenue-calculator
 *
 * LLM-powered revenue projection based on current AI visibility,
 * monthly visitors, and industry benchmarks. Returns achievable
 * visibility, extra impressions/leads, and monthly/annual revenue
 * projections with documented assumptions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as RevenueRequest
    const { visitors, currentVisibility, industry, url } = body

    if (!visitors || typeof visitors !== 'number' || visitors <= 0) {
      return NextResponse.json(
        { error: 'visitors must be a positive number' },
        { status: 400 },
      )
    }
    if (
      currentVisibility == null ||
      typeof currentVisibility !== 'number' ||
      currentVisibility < 0 ||
      currentVisibility > 100
    ) {
      return NextResponse.json(
        { error: 'currentVisibility must be 0–100' },
        { status: 400 },
      )
    }

    const industryLabel = industry?.trim() || 'general SaaS'

    const prompt = `You are an AI revenue analyst. Project the revenue impact of improved AI visibility.

Monthly visitors: ${visitors}
Current AI visibility: ${currentVisibility}%
Industry: ${industryLabel}
${url ? `Website: ${url}` : ''}

Based on industry benchmarks:
1. What's the achievable AI visibility? (be realistic, usually 2-4x current)
2. Extra impressions from improved visibility
3. Expected conversion rate from AI traffic
4. Average lead value for this industry
5. Monthly and annual revenue projection

Return JSON:
{
  "achievableVisibility": number,
  "extraImpressions": number,
  "extraLeads": number,
  "monthlyRevenue": number,
  "annualRevenue": number,
  "conversionRate": number,
  "avgLeadValue": number,
  "assumptions": ["assumption1", "assumption2", "assumption3"]
}

Return ONLY the JSON object — no markdown, no commentary.`

    let projection: RevenueProjection & { _meta: { status: DataStatus; model: string; provider: string; latencyMs: number } }

    try {
      const routerResult = await routeLLM(
        [
          { role: 'system', content: 'You are a precise JSON-returning revenue analyst. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        { taskType: 'scoring', temperature: 0.4, allowSimulation: true },
      )
      const raw = routerResult.content
      const dataStatus: DataStatus = routerResult.status

      if (!raw) throw new Error('Empty LLM response')

      const parsed = JSON.parse(sanitizeJSON(raw)) as RevenueProjection

      // Validate required fields with safe defaults — significant processing, mark as estimated
      const finalStatus: DataStatus = dataStatus === 'live' ? 'estimated' : dataStatus
      projection = {
        achievableVisibility: Number(parsed.achievableVisibility) || currentVisibility * 2,
        extraImpressions: Number(parsed.extraImpressions) || 0,
        extraLeads: Number(parsed.extraLeads) || 0,
        monthlyRevenue: Number(parsed.monthlyRevenue) || 0,
        annualRevenue: Number(parsed.annualRevenue) || 0,
        conversionRate: Number(parsed.conversionRate) || 0.028,
        avgLeadValue: Number(parsed.avgLeadValue) || 180,
        assumptions: Array.isArray(parsed.assumptions)
          ? parsed.assumptions.map(String).slice(0, 5)
          : ['LLM-generated projection'],
        _meta: {
          status: finalStatus,
          model: routerResult.model,
          provider: routerResult.provider,
          latencyMs: routerResult.latencyMs,
        },
      }
    } catch (llmErr) {
      console.error(
        '[revenue-calculator] LLM failed, returning simulation:',
        llmErr instanceof Error ? llmErr.message : 'Unknown',
      )
      const fallback = fallbackProjection({ visitors, currentVisibility, industry, url })
      projection = {
        ...fallback,
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
      }
    }

    return NextResponse.json(projection)
  } catch (error) {
    console.error(
      '[revenue-calculator] Unhandled error:',
      error instanceof Error ? error.message : 'Unknown',
    )
    const fallback = fallbackProjection({ visitors: 10000, currentVisibility: 30 })
    return NextResponse.json({
      ...fallback,
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
    })
  }
}
