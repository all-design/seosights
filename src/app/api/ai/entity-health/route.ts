import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// POST /api/ai/entity-health
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { domain } = body as { domain?: string }

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
    }

    const routerResult = await routeLLM(
      [
        { role: 'system', content: 'You are an entity health analyst. You evaluate how well a brand\'s entities are connected in AI knowledge graphs. Return ONLY valid JSON.' },
        { role: 'user', content: `Evaluate entity health for domain "${domain}".

For each entity related to this brand, classify as:
- "strong": Well-connected, frequently cited, good authority
- "weak": Exists but poorly connected, low citation frequency
- "disconnected": Exists but not linked to the brand
- "missing": Should exist but doesn't

Return JSON:
{
  "entities": [
    {
      "name": "entity name",
      "type": "Person|Organization|Product|Service|Concept",
      "status": "strong|weak|disconnected|missing",
      "authority": 0-100,
      "connections": number,
      "recommendation": "what to do to improve",
      "priority": "critical|high|medium|low"
    }
  ],
  "overallEntityHealth": 0-100,
  "strongCount": number,
  "weakCount": number,
  "disconnectedCount": number,
  "missingCount": number
}` }
      ],
      { taskType: 'entity_extraction', temperature: 0.4, allowSimulation: true }
    )

    if (routerResult.status === 'simulation' || !routerResult.content) {
      return NextResponse.json({
        ...getSimulationEntityHealth(domain),
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
        ...getSimulationEntityHealth(domain),
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: routerResult.latencyMs }
      })
    }

    const entities = (parsed.entities as Array<Record<string, unknown>> || []).map((e, i) => ({
      id: `entity-${Date.now()}-${i}`,
      name: String(e.name || ''),
      type: String(e.type || 'Concept'),
      status: String(e.status || 'weak'),
      authority: Math.min(100, Math.max(0, Number(e.authority) || 30)),
      connections: Number(e.connections) || 0,
      recommendation: String(e.recommendation || ''),
      priority: String(e.priority || 'medium'),
    }))

    const overallHealth = Math.min(100, Math.max(0, Number(parsed.overallEntityHealth) || 45))

    return NextResponse.json({
      entities,
      overallEntityHealth: overallHealth,
      strongCount: Number(parsed.strongCount) || 0,
      weakCount: Number(parsed.weakCount) || 0,
      disconnectedCount: Number(parsed.disconnectedCount) || 0,
      missingCount: Number(parsed.missingCount) || 0,
      _meta: { status: 'estimated' as DataStatus, model: routerResult.model, provider: routerResult.provider, latencyMs: routerResult.latencyMs }
    })
  } catch (err) {
    console.error('[ai/entity-health] Error:', err instanceof Error ? err.message : 'Unknown')
    const body = await req.json().catch(() => ({}))
    const domain = (body as { domain?: string }).domain || 'example.com'
    return NextResponse.json({
      ...getSimulationEntityHealth(domain),
      _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 }
    })
  }
}

function getSimulationEntityHealth(domain: string) {
  const brand = domain.replace(/^www\./, '').split('.')[0]
  const capBrand = brand.charAt(0).toUpperCase() + brand.slice(1)
  return {
    entities: [
      { id: 'ent-1', name: capBrand, type: 'Organization', status: 'weak', authority: 45, connections: 12, recommendation: 'Add Wikipedia article and Wikidata entry to strengthen entity.', priority: 'critical' },
      { id: 'ent-2', name: `${capBrand} CEO`, type: 'Person', status: 'disconnected', authority: 30, connections: 5, recommendation: 'Create author pages and link CEO entity to organization.', priority: 'high' },
      { id: 'ent-3', name: `${capBrand} Platform`, type: 'Product', status: 'weak', authority: 40, connections: 8, recommendation: 'Add Product schema markup and G2 listing.', priority: 'high' },
      { id: 'ent-4', name: `${capBrand} API`, type: 'Service', status: 'missing', authority: 0, connections: 0, recommendation: 'Create API documentation page with proper schema markup.', priority: 'medium' },
      { id: 'ent-5', name: 'AI Visibility', type: 'Concept', status: 'strong', authority: 72, connections: 45, recommendation: 'Maintain thought leadership content on this topic.', priority: 'low' },
      { id: 'ent-6', name: 'SEO Software', type: 'Concept', status: 'disconnected', authority: 55, connections: 3, recommendation: 'Create content connecting your brand to SEO software category.', priority: 'high' },
      { id: 'ent-7', name: `${capBrand} Reviews`, type: 'Concept', status: 'missing', authority: 0, connections: 0, recommendation: 'Get listed on G2, Capterra, and Product Hunt.', priority: 'critical' },
      { id: 'ent-8', name: `${capBrand} Blog`, type: 'Service', status: 'weak', authority: 35, connections: 6, recommendation: 'Publish more consistently and add author bios with schema.', priority: 'medium' },
    ],
    overallEntityHealth: 38,
    strongCount: 1,
    weakCount: 4,
    disconnectedCount: 2,
    missingCount: 2,
  }
}
