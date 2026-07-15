'use client'

import { useEffect, useState } from 'react'
import {
  Network, RefreshCw, Clock, Search, ChevronRight,
  ArrowRight, Box, Database, Globe, Cpu, FileCode,
  CheckCircle2, AlertCircle, Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type NodeType = 'system' | 'api' | 'component' | 'database' | 'page'

// ─── Main Component ──────────────────────────────────────

export default function KnowledgeGraphPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {}
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
  }

  const observatory = data?.observatory || {}
  const latestCrawl = observatory.latestCrawl || null
  const recentChanges = observatory.recentChanges || []
  const overview = latestCrawl?.overview || {}
  const modelRegistry = latestCrawl?.modelRegistry || []
  const pipeline = latestCrawl?.pipeline || {}
  const queue = latestCrawl?.queue || {}

  // Derive graph nodes from real data
  const graphNodes: { name: string; type: NodeType; count: number; status: 'active' | 'idle' }[] = []

  // Add system nodes from overview counts
  if (overview.totalCrawls > 0) graphNodes.push({ name: 'Crawl Engine', type: 'system', count: overview.totalCrawls, status: latestCrawl?.status === 'completed' ? 'active' : 'idle' })
  if (overview.totalResponses > 0) graphNodes.push({ name: 'Response Store', type: 'database', count: overview.totalResponses, status: 'active' })
  if (overview.totalChanges > 0) graphNodes.push({ name: 'Change Detector', type: 'system', count: overview.totalChanges, status: 'active' })
  if (overview.totalSignals > 0) graphNodes.push({ name: 'Signal Analyzer', type: 'system', count: overview.totalSignals, status: 'active' })
  if (overview.totalReports > 0) graphNodes.push({ name: 'Report Generator', type: 'system', count: overview.totalReports, status: 'active' })
  if (overview.totalPublications > 0) graphNodes.push({ name: 'Publisher', type: 'system', count: overview.totalPublications, status: 'active' })

  // Add API nodes
  graphNodes.push({ name: '/api/observatory', type: 'api', count: overview.totalCrawls + overview.totalResponses, status: 'active' })

  // Add model nodes
  for (const model of modelRegistry.slice(0, 8)) {
    graphNodes.push({ name: model.displayName, type: 'component', count: model.totalResponses, status: model.isActive ? 'active' : 'idle' })
  }

  const totalNodes = graphNodes.length
  const activeNodes = graphNodes.filter(n => n.status === 'active').length
  const totalConnections = graphNodes.reduce((sum, n) => sum + n.count, 0)

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Network className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Graph™</h1>
            <p className="text-slate-400 text-sm">System dependency & relationship map</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-violet-500/5 via-slate-900 to-slate-900 border border-violet-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Network className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-violet-400">{totalNodes}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Nodes</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{activeNodes}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-violet-400">{totalConnections.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Connections</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Database className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-violet-400">{modelRegistry.length}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Models</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Graph Nodes
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Network className="w-4 h-4 text-violet-400" />
          Graph Nodes
          <span className="ml-auto text-[10px] text-slate-400">{totalNodes} nodes</span>
        </h2>
        {graphNodes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Network className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No graph data available</p>
            <p className="text-[11px] text-slate-500 mt-1">Graph nodes will appear after observatory scans</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {graphNodes.map((node) => {
              const typeIcon = node.type === 'system' ? Globe :
                              node.type === 'api' ? FileCode :
                              node.type === 'database' ? Database :
                              node.type === 'component' ? Cpu : Box
              const TypeIcon = typeIcon
              return (
                <div
                  key={node.name}
                  className={`relative p-3 rounded-lg border transition-all duration-200 ${
                    node.status === 'active'
                      ? 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40'
                      : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-violet-400' : 'bg-slate-600'}`} />
                    <TypeIcon className="w-3 h-3 text-violet-400" />
                    <span className={`text-xs font-medium ${node.status === 'active' ? 'text-slate-200' : 'text-slate-500'}`}>
                      {node.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {node.count.toLocaleString()} events
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${
                      node.type === 'system' ? 'bg-violet-500/10 text-violet-400' :
                      node.type === 'api' ? 'bg-emerald-500/10 text-emerald-400' :
                      node.type === 'database' ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>{node.type}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Pipeline Status
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          Pipeline Status
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(pipeline.reportByStatus || []).map((item: any) => (
              <div key={item.status} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                <span className="text-lg font-bold text-violet-400">{item.count}</span>
                <div className="text-[10px] text-slate-500 capitalize">{item.status}</div>
              </div>
            ))}
            {(pipeline.changesByType || []).map((item: any) => (
              <div key={item.changeType} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                <span className="text-lg font-bold text-violet-400">{item.count}</span>
                <div className="text-[10px] text-slate-500 capitalize">{item.changeType}</div>
              </div>
            ))}
          </div>
          {(pipeline.reportByStatus || []).length === 0 && (pipeline.changesByType || []).length === 0 && (
            <p className="text-center text-sm text-slate-500 py-4">No pipeline data available yet</p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Queue
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-amber-400">{queue.unprocessedChanges || 0}</span>
            <div className="text-[10px] text-slate-500">Unprocessed Changes</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-cyan-400">{queue.proposedReports || 0}</span>
            <div className="text-[10px] text-slate-500">Proposed Reports</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span>Signal rate: <span className="text-violet-400">{overview.signalRate || '0%'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Nodes: <span className="text-slate-300">{totalNodes}</span></span>
        <span className="text-slate-700">|</span>
        <span>Models tracked: <span className="text-slate-300">{modelRegistry.length}</span></span>
        <span className="text-slate-700">|</span>
        <span>Latest crawl: <span className="text-violet-400">{latestCrawl ? new Date(latestCrawl.startedAt).toLocaleString() : '—'}</span></span>
      </div>

    </div>
  )
}
