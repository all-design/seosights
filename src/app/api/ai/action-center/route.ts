import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

// GET /api/ai/action-center?domain=example.com
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    // Check database for existing actions
    const existing = await safeQuery(
      (d) => d.actionItem.findMany({
        where: { domain, status: 'pending' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      [] as any[]
    )

    if (existing.length > 0) {
      return NextResponse.json({
        actions: existing,
        _meta: { status: 'live' as DataStatus, model: 'database', provider: 'database', latencyMs: 0 }
      })
    }

    // Generate actions via LLM
    const routerResult = await routeLLM(
      [
        { role: 'system', content: 'You are an AI visibility action advisor. Based on common SEO/AEO/GEO issues, you generate specific actionable tasks to improve a brand\'s AI visibility score. Return ONLY valid JSON.' },
        { role: 'user', content: `Generate 8-12 actionable tasks for domain "${domain}" to improve their AI Visibility Score.

Task types: fix_schema, create_faq, add_author, create_llms_txt, reddit_answer, g2_review, wikipedia, entity_fix, content_update, crawl_fix

Return JSON:
{
  "actions": [
    {
      "actionType": "task_type",
      "title": "short actionable title",
      "description": "what to do and why",
      "priority": "critical|high|medium|low",
      "impact": "high|medium|low",
      "estimatedScoreGain": number (0-15),
      "relatedUrl": "suggested URL or null"
    }
  ]
}` }
      ],
      { taskType: 'strategy', temperature: 0.5, allowSimulation: true }
    )

    if (routerResult.status === 'simulation' || !routerResult.content) {
      return NextResponse.json({
        actions: getSimulationActions(domain),
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
        actions: getSimulationActions(domain),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: routerResult.latencyMs }
      })
    }

    const actions = (parsed.actions as Array<Record<string, unknown>> || []).map((a, i) => ({
      id: `action-${Date.now()}-${i}`,
      domain,
      actionType: String(a.actionType || 'content_update'),
      title: String(a.title || ''),
      description: String(a.description || ''),
      priority: String(a.priority || 'medium'),
      impact: String(a.impact || 'medium'),
      estimatedScoreGain: Math.min(15, Math.max(0, Number(a.estimatedScoreGain) || 3)),
      status: 'pending',
      relatedUrl: a.relatedUrl ? String(a.relatedUrl) : null,
      metadata: null,
      createdAt: new Date().toISOString(),
    }))

    return NextResponse.json({
      actions,
      _meta: { status: 'estimated' as DataStatus, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
    })
  } catch (err) {
    console.error('[ai/action-center] Error:', err instanceof Error ? err.message : 'Unknown')
    const domain = new URL(req.url).searchParams.get('domain') || 'example.com'
    return NextResponse.json({
      actions: getSimulationActions(domain),
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}

// PUT /api/ai/action-center — Update action status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { actionId, status } = body as { actionId?: string; status?: string }

    if (!actionId || !status) {
      return NextResponse.json({ error: 'Missing actionId or status' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await safeQuery(
      (d) => d.actionItem.update({
        where: { id: actionId },
        data: { status, completedAt: status === 'completed' ? new Date() : null },
      }),
      null as any
    )

    return NextResponse.json({ action: updated })
  } catch (err) {
    console.error('[ai/action-center] PUT Error:', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ action: null })
  }
}

function getSimulationActions(domain: string) {
  const brand = domain.replace(/^www\./, '').split('.')[0]
  const now = new Date().toISOString()
  return [
    { id: `sim-act-1`, domain, actionType: 'create_llms_txt', title: 'Create llms.txt file', description: `Add a llms.txt file to your root directory so AI crawlers can understand your site structure. This is the #1 quick win for AI visibility.`, priority: 'critical', impact: 'high', estimatedScoreGain: 8, status: 'pending', relatedUrl: `https://${domain}/llms.txt`, metadata: null, createdAt: now },
    { id: `sim-act-2`, domain, actionType: 'fix_schema', title: 'Add Organization schema markup', description: `Your site is missing structured data for Organization. Adding it helps AI engines understand who you are.`, priority: 'high', impact: 'high', estimatedScoreGain: 6, status: 'pending', relatedUrl: `https://${domain}`, metadata: null, createdAt: now },
    { id: `sim-act-3`, domain, actionType: 'create_faq', title: 'Create FAQ page with schema', description: `FAQ pages are heavily cited by AI engines. Create one with FAQPage schema markup.`, priority: 'high', impact: 'high', estimatedScoreGain: 7, status: 'pending', relatedUrl: null, metadata: null, createdAt: now },
    { id: `sim-act-4`, domain, actionType: 'add_author', title: 'Add author bios to blog posts', description: `AI engines trust content with identified authors. Add author schema and bio sections.`, priority: 'medium', impact: 'medium', estimatedScoreGain: 4, status: 'pending', relatedUrl: null, metadata: null, createdAt: now },
    { id: `sim-act-5`, domain, actionType: 'g2_review', title: 'Get 5 more G2 reviews', description: `Review volume is the #1 signal for B2B AI recommendations. Ask happy customers for reviews.`, priority: 'high', impact: 'high', estimatedScoreGain: 9, status: 'pending', relatedUrl: null, metadata: null, createdAt: now },
    { id: `sim-act-6`, domain, actionType: 'reddit_answer', title: 'Answer 3 Reddit threads', description: `Reddit citations drive 38% of ChatGPT recommendations. Find and answer relevant threads.`, priority: 'medium', impact: 'medium', estimatedScoreGain: 5, status: 'pending', relatedUrl: null, metadata: null, createdAt: now },
    { id: `sim-act-7`, domain, actionType: 'entity_fix', title: 'Create Wikidata entity', description: `${brand} doesn't have a Wikidata entry. Claude and Perplexity rely heavily on this.`, priority: 'high', impact: 'high', estimatedScoreGain: 10, status: 'pending', relatedUrl: null, metadata: null, createdAt: now },
    { id: `sim-act-8`, domain, actionType: 'crawl_fix', title: 'Fix robots.txt for AI crawlers', description: `Your robots.txt may be blocking some AI crawlers. Review and update permissions.`, priority: 'critical', impact: 'high', estimatedScoreGain: 12, status: 'pending', relatedUrl: `https://${domain}/robots.txt`, metadata: null, createdAt: now },
    { id: `sim-act-9`, domain, actionType: 'content_update', title: 'Update pricing page', description: `AI engines prefer fresh pricing information. Last update was 90+ days ago.`, priority: 'low', impact: 'medium', estimatedScoreGain: 3, status: 'pending', relatedUrl: `https://${domain}/pricing`, metadata: null, createdAt: now },
  ]
}
