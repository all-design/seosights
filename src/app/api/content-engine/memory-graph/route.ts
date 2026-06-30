/**
 * AI Memory Graph™ — Decision→Outcome Flow Visualization
 *
 * GET /api/content-engine/memory-graph → Returns decision→outcome graph
 *
 * Builds graph from GrowthMemory data — groups actions chronologically
 * and connects them with edges showing causal flow.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Types ─────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string
  type: 'action' | 'outcome'
  label: string
  actionType?: string
  delta?: number
  timestamp: string
}

interface GraphEdge {
  source: string
  target: string
  type: 'resulted_in' | 'informed'
}

interface Pattern {
  sequence: string[]
  avgOutcome: number
  frequency: number
  confidence: number
}

// ── GET: Memory Graph ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const days = parseInt(searchParams.get('days') || '90', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch GrowthMemory entries ordered chronologically
    const memories = await db.growthMemory.findMany({
      where: { domain, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    // Fetch PredictionLog entries for richer graph data
    const predictions = await db.predictionLog.findMany({
      where: { domain, createdAt: { gte: since }, actualImpact: { not: null } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // ── Build nodes and edges from GrowthMemory ───────────────────────────
    let actionIndex = 1
    let outcomeIndex = 1

    for (const memory of memories) {
      const actionId = `action-${actionIndex}`
      const outcomeId = `outcome-${outcomeIndex}`

      // Action node
      nodes.push({
        id: actionId,
        type: 'action',
        label: formatActionLabel(memory.actionType, memory.actionDetail),
        actionType: memory.actionType,
        timestamp: memory.createdAt.toISOString().split('T')[0],
      })

      // Outcome node (only if there's a measurable result)
      const totalDelta = memory.visibilityDelta + memory.citationDelta
      if (totalDelta !== 0 || memory.organicDelta !== 0 || memory.revenueDelta !== 0) {
        const primaryDelta = memory.visibilityDelta !== 0
          ? memory.visibilityDelta
          : memory.citationDelta !== 0
            ? memory.citationDelta
            : memory.organicDelta

        nodes.push({
          id: outcomeId,
          type: 'outcome',
          label: `${primaryDelta >= 0 ? '+' : ''}${primaryDelta} Visibility`,
          delta: primaryDelta,
          timestamp: memory.measuredAt
            ? memory.measuredAt.toISOString().split('T')[0]
            : memory.createdAt.toISOString().split('T')[0],
        })

        // Edge: action → outcome
        edges.push({
          source: actionId,
          target: outcomeId,
          type: 'resulted_in',
        })

        outcomeIndex++
      }

      // Connect previous outcome to this action (informed relationship)
      if (outcomeIndex > 1 && totalDelta !== 0) {
        const prevOutcomeId = `outcome-${outcomeIndex - 1}`
        edges.push({
          source: prevOutcomeId,
          target: actionId,
          type: 'informed',
        })
      }

      actionIndex++
    }

    // ── Build nodes and edges from PredictionLog (confidence layer) ───────
    let predictionIndex = 1
    for (const pred of predictions) {
      const predActionId = `pred-action-${predictionIndex}`
      const predOutcomeId = `pred-outcome-${predictionIndex}`

      nodes.push({
        id: predActionId,
        type: 'action',
        label: `Predicted: ${formatActionLabel(pred.actionType, pred.recommendation ?? '')}`,
        actionType: pred.actionType,
        timestamp: pred.createdAt.toISOString().split('T')[0],
      })

      if (pred.actualImpact !== null) {
        nodes.push({
          id: predOutcomeId,
          type: 'outcome',
          label: `${pred.actualImpact >= 0 ? '+' : ''}${pred.actualImpact} (predicted ${pred.predictedImpact})`,
          delta: pred.actualImpact,
          timestamp: pred.measuredAt
            ? pred.measuredAt.toISOString().split('T')[0]
            : pred.createdAt.toISOString().split('T')[0],
        })

        edges.push({
          source: predActionId,
          target: predOutcomeId,
          type: 'resulted_in',
        })
      }

      predictionIndex++
    }

    // ── Detect patterns ───────────────────────────────────────────────────
    const patterns = detectPatterns(memories)

    return NextResponse.json({
      nodes,
      edges,
      patterns,
      meta: {
        totalMemories: memories.length,
        totalPredictions: predictions.length,
        totalNodes: nodes.length,
        totalEdges: edges.length,
        dateRange: {
          from: since.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
        },
      },
    })
  } catch (error) {
    console.error('[Memory Graph] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memory graph' },
      { status: 500 }
    )
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatActionLabel(actionType: string, detail: string): string {
  const labelMap: Record<string, string> = {
    'created_faq': 'Created FAQ',
    'published_article': 'Published Article',
    'created_schema': 'Created Schema',
    'added_author': 'Added Author',
    'added_internal_link': 'Added Internal Link',
    'fixed_robots': 'Fixed Robots',
    'updated_llms_txt': 'Updated llms.txt',
    'created_entity': 'Created Entity',
    'added_citation_source': 'Added Citation Source',
  }

  const baseLabel = labelMap[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // If detail is short, append it
  if (detail && detail.length < 50) {
    return `${baseLabel}: ${detail}`
  }

  return baseLabel
}

function detectPatterns(
  memories: Array<{ actionType: string; visibilityDelta: number; createdAt: Date }>
): Pattern[] {
  if (memories.length < 3) return []

  // Group by chronological order and look for sequential patterns
  const sequences: Record<string, { outcomes: number[]; count: number }> = {}

  // Look at pairs of consecutive actions
  for (let i = 0; i < memories.length - 1; i++) {
    const curr = memories[i]
    const next = memories[i + 1]

    // Pair pattern: actionType A → actionType B
    const pairKey = `${curr.actionType}→${next.actionType}`
    if (!sequences[pairKey]) {
      sequences[pairKey] = { outcomes: [], count: 0 }
    }
    sequences[pairKey].count++
    sequences[pairKey].outcomes.push(next.visibilityDelta)
  }

  // Also look at triplets
  for (let i = 0; i < memories.length - 2; i++) {
    const a = memories[i]
    const b = memories[i + 1]
    const c = memories[i + 2]

    const tripleKey = `${a.actionType}→${b.actionType}→${c.actionType}`
    if (!sequences[tripleKey]) {
      sequences[tripleKey] = { outcomes: [], count: 0 }
    }
    sequences[tripleKey].count++
    sequences[tripleKey].outcomes.push(c.visibilityDelta)
  }

  // Filter to patterns that appear at least 3 times
  const patterns: Pattern[] = []

  for (const [key, data] of Object.entries(sequences)) {
    if (data.count < 3) continue

    const avgOutcome = data.outcomes.reduce((s, v) => s + v, 0) / data.outcomes.length
    // Confidence based on consistency and frequency
    const consistency = 1 - (standardDeviation(data.outcomes) / (Math.abs(avgOutcome) + 1))
    const frequencyConfidence = Math.min(data.count / 10, 1)
    const confidence = Math.round((Math.max(0, consistency) * 0.6 + frequencyConfidence * 0.4) * 100)

    patterns.push({
      sequence: key.split('→'),
      avgOutcome: Math.round(avgOutcome * 10) / 10,
      frequency: data.count,
      confidence,
    })
  }

  // Sort by confidence descending, take top 10
  return patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const squareDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(squareDiffs.reduce((s, v) => s + v, 0) / values.length)
}
