import { NextRequest, NextResponse } from 'next/server'
import { routeLLM, type DataStatus } from '@/lib/ai-router'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Authority = 'strong' | 'broken' | 'missing'
type NodeType = 'brand' | 'entity' | 'reviews' | 'forums' | 'news' | 'knowledge' | 'engine'

/** Influence graph node with authority status and fix action. */
interface InfluenceNode {
  id: string; label: string; type: NodeType; authority: Authority; description: string; fixAction: string
}

/** Directed edge between two nodes. */
interface InfluenceEdge { from: string; to: string; strength: 'strong' | 'broken' }

interface InfluenceGraphResponse { nodes: InfluenceNode[]; edges: InfluenceEdge[] }
interface InfluenceRequest { brand: string; url?: string }

/** Strip markdown fences and trailing commas for robust JSON parsing. */
function sanitizeJSON(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  s = s.replace(/,\s*([}\]])/g, '$1')
  return s
}

/** Realistic fallback graph when LLM is unavailable. */
function fallbackGraph(brand: string): InfluenceGraphResponse {
  const nodes: InfluenceNode[] = [
    { id: 'brand', label: brand, type: 'brand', authority: 'strong', description: `The core ${brand} entity`, fixAction: 'Ensure consistent brand name across all platforms' },
    { id: 'product', label: `${brand} Product`, type: 'entity', authority: 'strong', description: 'Main product/service entity', fixAction: 'Add Product schema markup on homepage' },
    { id: 'founder', label: 'Founder', type: 'entity', authority: 'broken', description: 'Founder/executive entity — no Knowledge Panel', fixAction: 'Create/maintain Wikipedia & Wikidata entries for founder' },
    { id: 'g2', label: 'G2 Reviews', type: 'reviews', authority: 'broken', description: 'No G2 profile found', fixAction: 'Claim G2 profile and collect 10+ reviews' },
    { id: 'trustpilot', label: 'Trustpilot', type: 'reviews', authority: 'missing', description: 'No Trustpilot presence', fixAction: 'Create Trustpilot business profile' },
    { id: 'reddit', label: 'Reddit Mentions', type: 'forums', authority: 'broken', description: 'Sparse organic mentions on Reddit', fixAction: 'Engage authentically in relevant subreddits' },
    { id: 'quora', label: 'Quora Answers', type: 'forums', authority: 'missing', description: 'No Quora presence', fixAction: 'Answer industry questions referencing brand expertise' },
    { id: 'techcrunch', label: 'TechCrunch Coverage', type: 'news', authority: 'missing', description: 'No major tech press coverage', fixAction: 'Pitch stories to relevant tech publications' },
    { id: 'wikipedia', label: 'Wikipedia Entry', type: 'knowledge', authority: 'missing', description: 'No Wikipedia article', fixAction: 'Build notability through press coverage then create article' },
    { id: 'wikidata', label: 'Wikidata Entity', type: 'knowledge', authority: 'missing', description: 'No Wikidata item', fixAction: 'Create Wikidata item with structured brand data' },
    { id: 'chatgpt-engine', label: 'ChatGPT', type: 'engine', authority: 'broken', description: 'ChatGPT partially recognizes brand', fixAction: 'Strengthen knowledge graph signals' },
    { id: 'perplexity-engine', label: 'Perplexity', type: 'engine', authority: 'broken', description: 'Perplexity has limited brand data', fixAction: 'Improve crawlability and llms.txt' },
  ]
  const edges: InfluenceEdge[] = [
    { from: 'brand', to: 'product', strength: 'strong' },
    { from: 'brand', to: 'founder', strength: 'broken' },
    { from: 'product', to: 'g2', strength: 'broken' },
    { from: 'product', to: 'trustpilot', strength: 'broken' },
    { from: 'brand', to: 'reddit', strength: 'broken' },
    { from: 'brand', to: 'quora', strength: 'broken' },
    { from: 'brand', to: 'techcrunch', strength: 'broken' },
    { from: 'brand', to: 'wikipedia', strength: 'broken' },
    { from: 'brand', to: 'wikidata', strength: 'broken' },
    { from: 'wikipedia', to: 'chatgpt-engine', strength: 'broken' },
    { from: 'wikidata', to: 'chatgpt-engine', strength: 'broken' },
    { from: 'g2', to: 'perplexity-engine', strength: 'broken' },
    { from: 'reddit', to: 'perplexity-engine', strength: 'broken' },
    { from: 'techcrunch', to: 'chatgpt-engine', strength: 'broken' },
  ]
  return { nodes, edges }
}

const VALID_TYPES = new Set(['brand','entity','reviews','forums','news','knowledge','engine'])
const VALID_AUTH = new Set(['strong','broken','missing'])
const VALID_STR = new Set(['strong','broken'])

/**
 * POST /api/ai/influence-graph
 *
 * LLM-powered entity/authority graph analysis. Maps the chain of
 * authority that makes AI engines recommend a brand — covering
 * sub-entities, review sources, forums, news, and knowledge bases.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as InfluenceRequest
    const { brand, url } = body

    if (!brand || typeof brand !== 'string' || brand.trim().length < 1) {
      return NextResponse.json({ error: 'brand is required' }, { status: 400 })
    }

    const prompt = `You are an entity and authority graph analyst. Map the chain of authority that makes AI engines recommend a brand.

Brand: ${brand}
${url ? `Website: ${url}` : ''}

Map the influence graph:
1. Brand entity and its sub-entities (products, founder, locations, awards)
2. Review sources (G2, Trustpilot, Capterra)
3. Forum presence (Reddit, Quora)
4. News coverage (TechCrunch, Forbes, industry blogs)
5. Knowledge bases (Wikipedia, Wikidata)
6. Which AI engines would be influenced by each node

For each node, indicate if the authority link is "strong" or "broken" (missing).

Return JSON:
{
  "nodes": [
    { "id": string, "label": string, "type": "brand|entity|reviews|forums|news|knowledge|engine", "authority": "strong"|"broken"|"missing", "description": string, "fixAction": string }
  ],
  "edges": [
    { "from": string, "to": string, "strength": "strong"|"broken" }
  ]
}

Return ONLY the JSON object — no markdown, no commentary.`

    let graph: InfluenceGraphResponse & { _meta: { status: DataStatus; model: string; provider: string; latencyMs: number } }
    try {
      const routerResult = await routeLLM(
        [
          { role: 'system', content: 'You are a precise JSON-returning entity graph analyst. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        { taskType: 'entity_extraction', temperature: 0.5, allowSimulation: true },
      )
      const raw = routerResult.content
      const dataStatus: DataStatus = routerResult.status

      if (!raw) throw new Error('Empty LLM response')

      const parsed = JSON.parse(sanitizeJSON(raw)) as InfluenceGraphResponse
      graph = {
        nodes: Array.isArray(parsed.nodes)
          ? parsed.nodes.map((n: Partial<InfluenceNode>) => ({
              id: String(n.id || 'unknown'), label: String(n.label || 'Unknown'),
              type: (VALID_TYPES.has(n.type as string) ? n.type : 'entity') as NodeType,
              authority: (VALID_AUTH.has(n.authority as string) ? n.authority : 'missing') as Authority,
              description: String(n.description || ''), fixAction: String(n.fixAction || ''),
            }))
          : fallbackGraph(brand).nodes,
        edges: Array.isArray(parsed.edges)
          ? parsed.edges.map((e: Partial<InfluenceEdge>) => ({
              from: String(e.from || ''), to: String(e.to || ''),
              strength: (VALID_STR.has(e.strength as string) ? e.strength : 'broken') as 'strong' | 'broken',
            }))
          : fallbackGraph(brand).edges,
        _meta: {
          status: dataStatus,
          model: routerResult.model,
          provider: routerResult.provider,
          latencyMs: routerResult.latencyMs,
        },
      }
    } catch (llmErr) {
      console.error('[influence-graph] LLM failed, returning simulation:', llmErr instanceof Error ? llmErr.message : 'Unknown')
      const fallback = fallbackGraph(brand)
      graph = {
        ...fallback,
        _meta: { status: 'simulation' as DataStatus, model: 'simulation', provider: 'simulation', latencyMs: 0 },
      }
    }

    return NextResponse.json(graph)
  } catch (error) {
    console.error('[influence-graph] Unhandled error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Influence graph analysis failed' }, { status: 500 })
  }
}
