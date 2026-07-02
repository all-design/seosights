import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// GET /api/ai/recommendation-history?domain=example.com&prompt=best+crm&days=30
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const prompt = searchParams.get('prompt') || 'best service near me'
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    // Check database for existing snapshots
    const since = new Date(Date.now() - days * 86400000)
    const existingResult = await safeQuery(
      (d) => d.recommendationSnapshot.findMany({
        where: { domain, capturedAt: { gte: since } },
        orderBy: { capturedAt: 'desc' },
      }),
      []
    )
    const existing = existingResult.data

    if (existing.length >= 3) {
      return NextResponse.json({
        history: existing,
        _meta: { status: 'live' as DataStatus, model: 'database', provider: 'database', latencyMs: 0 }
      })
    }

    // Generate history via LLM
    const routerResult = await routeLLM(
      [
        { role: 'system', content: 'You are an AI recommendation historian. You simulate how AI search engine recommendations have changed over time. Return ONLY valid JSON.' },
        { role: 'user', content: `Generate a ${days}-day history of AI recommendation changes for domain "${domain}" for the query "${prompt}".

Show how recommendations evolved across ChatGPT, Claude, Gemini, and Perplexity over this period.

Return JSON:
{
  "history": [
    {
      "date": "YYYY-MM-DD",
      "chatgpt": { "mentioned": true/false, "position": number, "competitors": ["comp1", "comp2", "comp3"] },
      "claude": { "mentioned": true/false, "position": number, "competitors": ["comp1", "comp2", "comp3"] },
      "gemini": { "mentioned": true/false, "position": number, "competitors": ["comp1", "comp2", "comp3"] },
      "perplexity": { "mentioned": true/false, "position": number, "competitors": ["comp1", "comp2", "comp3"] },
      "overallScore": 0-100,
      "notableEvent": "description of any significant change"
    }
  ]
}` }
      ],
      { taskType: 'reasoning', temperature: 0.4, allowSimulation: true }
    )

    if (routerResult.status === 'simulation' || !routerResult.content) {
      return NextResponse.json({
        history: generateSimulationHistory(domain, days),
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
        history: generateSimulationHistory(domain, days),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: routerResult.latencyMs }
      })
    }

    const history = (parsed.history as Array<Record<string, unknown>> || []).map((h, i) => ({
      id: `hist-${Date.now()}-${i}`,
      domain,
      prompt,
      engines: JSON.stringify({
        chatgpt: h.chatgpt,
        claude: h.claude,
        gemini: h.gemini,
        perplexity: h.perplexity,
      }),
      overallScore: Math.min(100, Math.max(0, Number(h.overallScore) || 50)),
      dataSource: 'estimated',
      capturedAt: h.date ? new Date(String(h.date)).toISOString() : new Date(Date.now() - i * 86400000).toISOString(),
    }))

    return NextResponse.json({
      history,
      _meta: { status: 'estimated' as DataStatus, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
    })
  } catch (err) {
    console.error('[ai/recommendation-history] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    const days = parseInt(new URL(req.url).searchParams.get('days') || '30')
    return NextResponse.json({
      history: generateSimulationHistory(domain, days),
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}

function generateSimulationHistory(domain: string, days: number) {
  const entries: any[] = []
  const baseScore = 55
  for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 10))) {
    const date = new Date(Date.now() - i * 86400000)
    const trend = Math.floor((days - i) / days * 15) // gradually improving
    const jitter = Math.floor(Math.random() * 8) - 4
    const score = Math.min(100, Math.max(10, baseScore + trend + jitter))
    const mentioned = score > 40
    entries.push({
      id: `sim-hist-${i}`,
      domain,
      prompt: 'best service near me',
      engines: JSON.stringify({
        chatgpt: { mentioned: mentioned && Math.random() > 0.2, position: mentioned ? Math.floor(Math.random() * 4) + 1 : null, competitors: ['CompetitorA', 'CompetitorB', 'CompetitorC'] },
        claude: { mentioned: mentioned && Math.random() > 0.3, position: mentioned ? Math.floor(Math.random() * 5) + 1 : null, competitors: ['CompetitorA', 'CompetitorD', 'CompetitorE'] },
        gemini: { mentioned: mentioned && Math.random() > 0.25, position: mentioned ? Math.floor(Math.random() * 4) + 1 : null, competitors: ['CompetitorB', 'CompetitorF', 'CompetitorG'] },
        perplexity: { mentioned: mentioned && Math.random() > 0.15, position: mentioned ? Math.floor(Math.random() * 3) + 1 : null, competitors: ['CompetitorA', 'CompetitorC', 'CompetitorH'] },
      }),
      overallScore: score,
      dataSource: 'simulation',
      capturedAt: date.toISOString(),
    })
  }
  return entries
}
