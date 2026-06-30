'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network, ZoomIn, MousePointerClick } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface GraphNode {
  id: string
  type: string
  label: string
  weight: number
  x?: number
  y?: number
}

interface GraphEdge {
  source: string
  target: string
  relation: string
  weight: number
  aiModel?: string
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  meta: { totalNodes: number; totalEdges: number; period: string }
}

// ── Node type colors ──────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  ai_model: '#10b981',
  source: '#f59e0b',
  industry: '#06b6d4',
  entity: '#a855f7',
}

const TYPE_LABELS: Record<string, string> = {
  ai_model: 'AI Model',
  source: 'Source',
  industry: 'Industry',
  entity: 'Entity',
}

// ── Filters ──────────────────────────────────────────────────

const AI_FILTERS = ['All', 'ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Grok']

// ── Preview Data ──────────────────────────────────────────────

const PREVIEW_DATA: GraphData = {
  nodes: [
    { id: 'chatgpt', type: 'ai_model', label: 'ChatGPT', weight: 95 },
    { id: 'claude', type: 'ai_model', label: 'Claude', weight: 88 },
    { id: 'gemini', type: 'ai_model', label: 'Gemini', weight: 82 },
    { id: 'perplexity', type: 'ai_model', label: 'Perplexity', weight: 76 },
    { id: 'grok', type: 'ai_model', label: 'Grok', weight: 70 },
    { id: 'wikipedia', type: 'source', label: 'Wikipedia', weight: 90 },
    { id: 'github', type: 'source', label: 'GitHub', weight: 75 },
    { id: 'reddit', type: 'source', label: 'Reddit', weight: 68 },
    { id: 'linkedin', type: 'source', label: 'LinkedIn', weight: 60 },
    { id: 'x-twitter', type: 'source', label: 'X/Twitter', weight: 55 },
    { id: 'health', type: 'industry', label: 'Health', weight: 80 },
    { id: 'professional', type: 'industry', label: 'Professional', weight: 62 },
    { id: 'discussion', type: 'industry', label: 'Discussion', weight: 58 },
    { id: 'news', type: 'industry', label: 'News', weight: 54 },
    { id: 'cdc', type: 'entity', label: 'CDC', weight: 72 },
    { id: 'mayo-clinic', type: 'entity', label: 'Mayo Clinic', weight: 65 },
    { id: 'vercel', type: 'entity', label: 'Vercel', weight: 50 },
    { id: 'forbes', type: 'entity', label: 'Forbes', weight: 48 },
    { id: 'stackoverflow', type: 'entity', label: 'Stack Overflow', weight: 52 },
    { id: 'reuters', type: 'entity', label: 'Reuters', weight: 46 },
    { id: 'react', type: 'source', label: 'React', weight: 55 },
  ],
  edges: [
    { source: 'chatgpt', target: 'wikipedia', relation: 'cites', weight: 90, aiModel: 'chatgpt' },
    { source: 'wikipedia', target: 'health', relation: 'category', weight: 80 },
    { source: 'health', target: 'cdc', relation: 'references', weight: 72 },
    { source: 'cdc', target: 'mayo-clinic', relation: 'cited_by', weight: 65 },
    { source: 'claude', target: 'github', relation: 'cites', weight: 75, aiModel: 'claude' },
    { source: 'github', target: 'react', relation: 'hosts', weight: 55 },
    { source: 'react', target: 'vercel', relation: 'maintained_by', weight: 50 },
    { source: 'gemini', target: 'linkedin', relation: 'cites', weight: 60, aiModel: 'gemini' },
    { source: 'linkedin', target: 'professional', relation: 'category', weight: 62 },
    { source: 'professional', target: 'forbes', relation: 'references', weight: 48 },
    { source: 'perplexity', target: 'reddit', relation: 'cites', weight: 68, aiModel: 'perplexity' },
    { source: 'reddit', target: 'discussion', relation: 'category', weight: 58 },
    { source: 'discussion', target: 'stackoverflow', relation: 'references', weight: 52 },
    { source: 'grok', target: 'x-twitter', relation: 'cites', weight: 55, aiModel: 'grok' },
    { source: 'x-twitter', target: 'news', relation: 'category', weight: 54 },
    { source: 'news', target: 'reuters', relation: 'references', weight: 46 },
  ],
  meta: { totalNodes: 21, totalEdges: 16, period: 'all' },
}

// ── Layout helper (simple radial) ────────────────────────────

function layoutNodes(nodes: GraphNode[], width: number, height: number): GraphNode[] {
  const byType: Record<string, GraphNode[]> = {}
  for (const n of nodes) {
    const t = n.type || 'source'
    if (!byType[t]) byType[t] = []
    byType[t].push(n)
  }

  const typeOrder = ['ai_model', 'source', 'industry', 'entity']
  const cx = width / 2
  const cy = height / 2
  const rings = [0, 0.3, 0.55, 0.78]
  const maxR = Math.min(width, height) / 2 - 40
  let idx = 0

  for (const t of typeOrder) {
    const group = byType[t] || []
    const r = maxR * rings[idx]
    group.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
      n.x = cx + r * Math.cos(angle)
      n.y = cy + r * Math.sin(angle)
    })
    idx++
  }
  return nodes
}

// ── Loading skeleton ─────────────────────────────────────────

function GraphSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 bg-slate-800" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 bg-slate-800 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full bg-slate-800 rounded-xl" />
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryGraph() {
  const [data, setData] = useState<GraphData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoverNode, setHoverNode] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const params = filter !== 'All' ? `?aiModel=${filter.toLowerCase()}` : ''
      const res = await fetch(`/api/observatory/graph${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setIsPreview(false)
    } catch {
      if (!data) {
        setData(PREVIEW_DATA)
        setIsPreview(true)
      }
    } finally {
      setLoading(false)
    }
  }, [filter, data])

  useEffect(() => { fetchData() }, [fetchData])

  const viewBox = { w: 800, h: 500 }

  const positioned = useMemo(() => {
    if (!data) return []
    return layoutNodes([...data.nodes.map(n => ({ ...n }))], viewBox.w, viewBox.h)
  }, [data])

  const filteredEdges = useMemo(() => {
    if (!data) return []
    if (filter === 'All') return data.edges
    return data.edges.filter(e => e.aiModel === filter.toLowerCase())
  }, [data, filter])

  const activeNodeIds = useMemo(() => {
    const focus = selectedNode || hoverNode
    if (!focus || !data) return null
    const connected = new Set<string>()
    connected.add(focus)
    for (const e of data.edges) {
      if (e.source === focus) connected.add(e.target)
      if (e.target === focus) connected.add(e.source)
    }
    return connected
  }, [selectedNode, hoverNode, data])

  if (loading) {
    return <div className="bg-slate-950 rounded-2xl p-6 sm:p-8"><GraphSkeleton /></div>
  }

  if (!data) return null

  const nodeMap = new Map(positioned.map(n => [n.id, n]))

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Network className="h-6 w-6 text-emerald-400" />
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            AI Search Graph™
          </motion.h2>
          {isPreview ? (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
              Preview
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
              Global Citation Network
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>{data.meta.totalNodes} nodes · {data.meta.totalEdges} edges</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2">
        {AI_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedNode(null) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* SVG Graph */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <CardContent className="p-2 sm:p-4">
          <svg
            viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
            className="w-full h-auto"
            style={{ minHeight: 320 }}
          >
            <defs>
              {Object.entries(TYPE_COLORS).map(([t, c]) => (
                <filter key={t} id={`glow-${t}`}>
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#475569" />
              </marker>
            </defs>

            {/* Edges */}
            {filteredEdges.map((e, i) => {
              const src = nodeMap.get(e.source)
              const tgt = nodeMap.get(e.target)
              if (!src || !tgt || src.x == null || tgt.x == null) return null
              const dimmed = activeNodeIds && (!activeNodeIds.has(e.source) || !activeNodeIds.has(e.target))
              const highlighted = activeNodeIds && activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
              const midX = (src.x + tgt.x) / 2
              const midY = (src.y + tgt.y) / 2 - 10
              return (
                <motion.path
                  key={`e-${i}`}
                  d={`M${src.x},${src.y} Q${midX},${midY} ${tgt.x},${tgt.y}`}
                  fill="none"
                  stroke={highlighted ? '#6ee7b7' : '#334155'}
                  strokeWidth={highlighted ? 2 : 1}
                  strokeDasharray={highlighted ? '6 3' : '3 4'}
                  markerEnd={highlighted ? 'url(#arrowhead)' : undefined}
                  opacity={dimmed ? 0.15 : 0.7}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.04 }}
                />
              )
            })}

            {/* Nodes */}
            {positioned.map((n, i) => {
              if (n.x == null || n.y == null) return null
              const color = TYPE_COLORS[n.type] || '#94a3b8'
              const r = Math.max(8, Math.min(22, 8 + n.weight / 10))
              const dimmed = activeNodeIds && !activeNodeIds.has(n.id)
              const isActive = selectedNode === n.id
              const isHovered = hoverNode === n.id
              return (
                <g
                  key={n.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(selectedNode === n.id ? null : n.id)}
                  onMouseEnter={() => setHoverNode(n.id)}
                  onMouseLeave={() => setHoverNode(null)}
                >
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={color}
                    fillOpacity={dimmed ? 0.15 : isActive || isHovered ? 0.35 : 0.2}
                    stroke={color}
                    strokeWidth={isActive || isHovered ? 2.5 : 1.5}
                    strokeOpacity={dimmed ? 0.2 : 0.9}
                    filter={isActive || isHovered ? `url(#glow-${n.type})` : undefined}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 200 }}
                  />
                  <text
                    x={n.x}
                    y={n.y + r + 14}
                    textAnchor="middle"
                    fill={dimmed ? '#475569' : '#e2e8f0'}
                    fontSize="10"
                    fontWeight={isActive || isHovered ? '700' : '500'}
                    className="select-none"
                  >
                    {n.label}
                  </text>
                  {/* Tooltip on hover */}
                  {(isHovered || isActive) && (
                    <g>
                      <rect
                        x={n.x - 60}
                        y={n.y - r - 38}
                        width={120}
                        height={28}
                        rx={6}
                        fill="#0f172a"
                        stroke={color}
                        strokeWidth={1}
                        opacity={0.95}
                      />
                      <text
                        x={n.x}
                        y={n.y - r - 20}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="9"
                      >
                        {TYPE_LABELS[n.type] || n.type} · Weight {n.weight}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-800">
            {Object.entries(TYPE_COLORS).map(([t, c]) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-xs text-slate-400">{TYPE_LABELS[t]}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
              <MousePointerClick className="h-3 w-3" />
              Click node to highlight
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
