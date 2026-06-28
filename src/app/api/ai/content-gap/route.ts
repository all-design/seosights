import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// POST /api/ai/content-gap
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { domain, competitors } = body as { domain?: string; competitors?: string[] }

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
    }

    const routerResult = await routeLLM(
      [
        { role: 'system', content: 'You are an AI content gap analyst. You identify topics and entities that AI search engines associate with competitors but NOT with the target brand. Return ONLY valid JSON.' },
        { role: 'user', content: `Analyze content gaps for domain "${domain}" compared to competitors ${competitors?.length ? competitors.join(', ') : 'in their industry'}.

Identify:
1. Topics AI engines associate with competitors but not this brand
2. Entity gaps (missing from knowledge graph)
3. Content format gaps (missing FAQ, guides, comparisons)
4. Source gaps (not cited in Reddit, G2, Wikipedia, etc.)

Return JSON:
{
  "gaps": [
    {
      "topic": "topic name",
      "competitorsWhoHaveIt": ["comp1", "comp2"],
      "gapType": "topic|entity|format|source",
      "severity": "critical|high|medium|low",
      "estimatedScoreGain": 0-10,
      "recommendation": "what to create or fix"
    }
  ],
  "summary": "brief summary of biggest opportunities"
}` }
      ],
      { taskType: 'strategy', temperature: 0.5, allowSimulation: true }
    )

    if (routerResult.status === 'simulation' || !routerResult.content) {
      return NextResponse.json({
        ...getSimulationContentGap(domain),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
      })
    }

    let parsed: Record<string, unknown>
    try {
      const c = routerResult.content.trim()
      const m = c.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = m ? m[1].trim() : c.replace(/,\s*([}\]])/g, '$1')
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({
        ...getSimulationContentGap(domain),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: routerResult.latencyMs }
      })
    }

    const gaps = (parsed.gaps as Array<Record<string, unknown>> || []).map((g, i) => ({
      id: `gap-${Date.now()}-${i}`,
      topic: String(g.topic || ''),
      competitorsWhoHaveIt: Array.isArray(g.competitorsWhoHaveIt) ? g.competitorsWhoHaveIt : [],
      gapType: String(g.gapType || 'topic'),
      severity: String(g.severity || 'medium'),
      estimatedScoreGain: Math.min(10, Math.max(0, Number(g.estimatedScoreGain) || 3)),
      recommendation: String(g.recommendation || ''),
    }))

    return NextResponse.json({
      gaps,
      summary: String(parsed.summary || ''),
      _meta: { status: 'estimated' as DataStatus, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
    })
  } catch (err) {
    console.error('[ai/content-gap] Error:', err instanceof Error ? err.message : 'Unknown')
    const body = await req.json().catch(() => ({}))
    const domain = (body as { domain?: string }).domain || 'example.com'
    return NextResponse.json({
      ...getSimulationContentGap(domain),
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}

function getSimulationContentGap(domain: string) {
  const brand = domain.replace(/^www\./, '').split('.')[0]
  return {
    gaps: [
      { id: 'gap-1', topic: 'AI-powered analytics', competitorsWhoHaveIt: ['CompetitorA', 'CompetitorB'], gapType: 'topic', severity: 'critical', estimatedScoreGain: 8, recommendation: `Create a detailed guide about AI-powered analytics that positions ${brand} as an expert.` },
      { id: 'gap-2', topic: 'Wikipedia presence', competitorsWhoHaveIt: ['CompetitorA'], gapType: 'entity', severity: 'high', estimatedScoreGain: 7, recommendation: `Create or improve your Wikipedia article. Claude and Perplexity rely heavily on this.` },
      { id: 'gap-3', topic: 'Comparison pages', competitorsWhoHaveIt: ['CompetitorB', 'CompetitorC'], gapType: 'format', severity: 'high', estimatedScoreGain: 6, recommendation: `Create "${brand} vs [Competitor]" comparison pages.` },
      { id: 'gap-4', topic: 'Reddit community presence', competitorsWhoHaveIt: ['CompetitorA'], gapType: 'source', severity: 'high', estimatedScoreGain: 5, recommendation: `Engage in relevant subreddit discussions. Reddit drives 38% of ChatGPT citations.` },
      { id: 'gap-5', topic: 'G2 review volume', competitorsWhoHaveIt: ['CompetitorA', 'CompetitorB', 'CompetitorC'], gapType: 'source', severity: 'critical', estimatedScoreGain: 9, recommendation: `You have 8 G2 reviews vs competitors' 200+. Launch a review campaign.` },
      { id: 'gap-6', topic: 'FAQ section', competitorsWhoHaveIt: ['CompetitorB'], gapType: 'format', severity: 'medium', estimatedScoreGain: 4, recommendation: `Add a comprehensive FAQ page with FAQPage schema markup.` },
    ],
    summary: `${brand} has significant gaps in entity presence (Wikipedia/Wikidata) and social proof (G2 reviews, Reddit). These are the highest-impact opportunities.`
  }
}
