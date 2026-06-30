import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const revalidate = 300 // 5 minutes cache

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '300',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS })
}

/**
 * GET /api/public/graph
 * Public AI Search Graph™ — same as /api/observatory/graph but ALWAYS
 * filters out isSimulated data, regardless of environment.
 *
 * Query params:
 *   aiModel    - Filter by AI model (e.g., "chatgpt")
 *   period     - Filter by period (e.g., "2026-07")
 *   sourceNode - Filter by source node label (e.g., "Wikipedia")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const aiModel = searchParams.get('aiModel') || undefined
    const period = searchParams.get('period') || undefined
    const sourceNode = searchParams.get('sourceNode') || undefined

    // Build where clause — ALWAYS filter out simulated data for public API
    const where: Record<string, unknown> = {
      isSimulated: false,
    }
    if (aiModel) where.aiModel = aiModel
    if (period) where.period = period
    if (sourceNode) where.sourceNode = sourceNode

    // Fetch all matching edges
    const edges = await db.aISearchGraphEdge.findMany({
      where,
      orderBy: { weight: 'desc' },
      take: 500,
    })

    // Build unique nodes from source + target nodes
    const nodeMap = new Map<string, { id: string; type: string; label: string; weight: number }>()

    for (const edge of edges) {
      // Source node
      if (!nodeMap.has(edge.sourceNode)) {
        nodeMap.set(edge.sourceNode, {
          id: edge.sourceNode,
          type: edge.sourceType,
          label: edge.sourceNode,
          weight: 0,
        })
      }
      const src = nodeMap.get(edge.sourceNode)!
      src.weight += edge.weight

      // Target node
      if (!nodeMap.has(edge.targetNode)) {
        nodeMap.set(edge.targetNode, {
          id: edge.targetNode,
          type: edge.targetType,
          label: edge.targetNode,
          weight: 0,
        })
      }
      const tgt = nodeMap.get(edge.targetNode)!
      tgt.weight += edge.weight
    }

    const nodes = Array.from(nodeMap.values()).sort((a, b) => b.weight - a.weight)

    const formattedEdges = edges.map((e) => ({
      source: e.sourceNode,
      target: e.targetNode,
      relation: e.relation,
      weight: e.weight,
      ...(e.aiModel ? { aiModel: e.aiModel } : {}),
    }))

    return NextResponse.json(
      {
        nodes,
        edges: formattedEdges,
        meta: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          period: period || 'all',
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/graph] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch graph data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
