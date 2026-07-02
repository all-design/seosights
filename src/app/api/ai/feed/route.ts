import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// GET /api/ai/feed?domain=example.com&limit=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    // Try to get feed items from database first
    const existingItemsResult = await safeQuery(
      (d) => d.feedItem.findMany({
        where: { domain },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      []
    )
    const existingItems = existingItemsResult.data

    if (existingItems.length > 0) {
      return NextResponse.json({
        items: existingItems,
        _meta: { status: 'live' as DataStatus, model: 'database', provider: 'database', latencyMs: 0 }
      })
    }

    // No existing items — generate via LLM
    const routerResult = await routeLLM(
      [
        { role: 'system', content: 'You are an AI visibility monitoring system. Generate realistic feed items showing recent changes in a brand\'s AI visibility. Return ONLY valid JSON.' },
        { role: 'user', content: `Generate 10 recent feed items for domain "${domain}". Each item should represent a real change in AI visibility: citations gained/lost, rank changes, competitor alerts, new entities discovered, AI engine discoveries. Make it specific and actionable.

Return JSON:
{
  "items": [
    {
      "itemType": "citation_gained|citation_lost|rank_change|competitor_alert|new_entity|score_milestone|ai_discovery",
      "title": "short title",
      "description": "1-2 sentence description",
      "engine": "chatgpt|claude|gemini|perplexity|copilot|null",
      "delta": number (e.g. +3, -5),
      "severity": "info|warning|positive|critical",
      "iconEmoji": "emoji",
      "hoursAgo": number
    }
  ]
}` }
      ],
      { taskType: 'summarization', temperature: 0.6, allowSimulation: true }
    )

    if (routerResult.status === 'simulation' || !routerResult.content) {
      // Return simulation feed items
      const simulationItems = generateSimulationFeed(domain)
      return NextResponse.json({
        items: simulationItems,
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
      const simulationItems = generateSimulationFeed(domain)
      return NextResponse.json({
        items: simulationItems,
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: routerResult.latencyMs }
      })
    }

    const items = (parsed.items as Array<Record<string, unknown>> || []).slice(0, limit).map((item, i) => ({
      id: `feed-${Date.now()}-${i}`,
      domain,
      itemType: String(item.itemType || 'score_milestone'),
      title: String(item.title || ''),
      description: String(item.description || ''),
      engine: item.engine ? String(item.engine) : null,
      delta: Number(item.delta) || 0,
      severity: String(item.severity || 'info'),
      iconEmoji: String(item.iconEmoji || '📊'),
      isRead: false,
      metadata: null,
      createdAt: new Date(Date.now() - (Number(item.hoursAgo) || 1) * 3600000).toISOString(),
    }))

    return NextResponse.json({
      items,
      _meta: { status: routerResult.status, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
    })
  } catch (err) {
    console.error('[ai/feed] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    return NextResponse.json({
      items: generateSimulationFeed(domain),
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}

function generateSimulationFeed(domain: string) {
  const brand = domain.replace(/^www\./, '').split('.')[0]
  const now = Date.now()
  return [
    { id: `sim-${now}-1`, domain, itemType: 'citation_gained', title: `${brand} now cited by ChatGPT`, description: `ChatGPT started citing your FAQ page for related queries.`, engine: 'chatgpt', delta: 6, severity: 'positive', iconEmoji: '✅', isRead: false, metadata: null, createdAt: new Date(now - 2 * 3600000).toISOString() },
    { id: `sim-${now}-2`, domain, itemType: 'citation_lost', title: `Gemini stopped citing pricing page`, description: `Your pricing page is no longer included in Gemini's recommendations for this query type.`, engine: 'gemini', delta: -3, severity: 'warning', iconEmoji: '⚠️', isRead: false, metadata: null, createdAt: new Date(now - 5 * 3600000).toISOString() },
    { id: `sim-${now}-3`, domain, itemType: 'competitor_alert', title: `Competitor overtook you in Perplexity`, description: `A competitor now ranks #2 in Perplexity results, pushing you to #4.`, engine: 'perplexity', delta: -2, severity: 'critical', iconEmoji: '🔥', isRead: false, metadata: null, createdAt: new Date(now - 8 * 3600000).toISOString() },
    { id: `sim-${now}-4`, domain, itemType: 'new_entity', title: `Claude discovered new entity`, description: `Claude now associates "${brand}" with "AI visibility" entity cluster.`, engine: 'claude', delta: 4, severity: 'positive', iconEmoji: '🧠', isRead: false, metadata: null, createdAt: new Date(now - 12 * 3600000).toISOString() },
    { id: `sim-${now}-5`, domain, itemType: 'rank_change', title: `GPT visibility +6% this week`, description: `Your overall ChatGPT visibility increased by 6 percentage points over the past 7 days.`, engine: 'chatgpt', delta: 6, severity: 'positive', iconEmoji: '📈', isRead: false, metadata: null, createdAt: new Date(now - 18 * 3600000).toISOString() },
    { id: `sim-${now}-6`, domain, itemType: 'ai_discovery', title: `Perplexity indexed your blog post`, description: `Perplexity now includes your recent blog post in its answer sources.`, engine: 'perplexity', delta: 2, severity: 'info', iconEmoji: '🔍', isRead: true, metadata: null, createdAt: new Date(now - 24 * 3600000).toISOString() },
    { id: `sim-${now}-7`, domain, itemType: 'score_milestone', title: `AI Visibility Score hit 75!`, description: `${brand} reached the "Dominant" tier. Top 5% in your industry.`, engine: null, delta: 3, severity: 'positive', iconEmoji: '🏆', isRead: true, metadata: null, createdAt: new Date(now - 36 * 3600000).toISOString() },
    { id: `sim-${now}-8`, domain, itemType: 'citation_gained', title: `Reddit thread now cites ${brand}`, description: `A popular r/SaaS thread now mentions your product as a top recommendation.`, engine: null, delta: 5, severity: 'positive', iconEmoji: '💬', isRead: true, metadata: null, createdAt: new Date(now - 48 * 3600000).toISOString() },
  ]
}
