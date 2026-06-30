'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  Network, RefreshCw, Clock, Search, ChevronRight,
  ArrowRight, Box, Database, Globe, Cpu, FileCode,
  CheckCircle2, AlertCircle, Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type NodeType = 'system' | 'api' | 'component' | 'database' | 'page'
type RelationType = 'uses' | 'depends on' | 'updates' | 'generates' | 'validates' | 'deploys'

interface GraphNode {
  id: string
  name: string
  type: NodeType
  connections: number
  docStatus: 'documented' | 'partial' | 'undocumented'
  lastUpdated: string
}

interface GraphEdge {
  from: string
  to: string
  relation: RelationType
}

// ─── Mock Data ───────────────────────────────────────────

const graphNodes: GraphNode[] = [
  { id: 'n1', name: 'Mission Control', type: 'system', connections: 8, docStatus: 'documented', lastUpdated: '2m ago' },
  { id: 'n2', name: 'Opportunity Queue', type: 'system', connections: 5, docStatus: 'documented', lastUpdated: '5m ago' },
  { id: 'n3', name: 'Growth Engine', type: 'system', connections: 12, docStatus: 'documented', lastUpdated: '1m ago' },
  { id: 'n4', name: 'Replay Engine', type: 'system', connections: 6, docStatus: 'documented', lastUpdated: '8m ago' },
  { id: 'n5', name: 'Growth Memory', type: 'database', connections: 4, docStatus: 'documented', lastUpdated: '3m ago' },
  { id: 'n6', name: '/api/observatory', type: 'api', connections: 7, docStatus: 'documented', lastUpdated: '12m ago' },
  { id: 'n7', name: '/api/advisor', type: 'api', connections: 5, docStatus: 'partial', lastUpdated: '25m ago' },
  { id: 'n8', name: 'MissionCard', type: 'component', connections: 3, docStatus: 'documented', lastUpdated: '15m ago' },
  { id: 'n9', name: 'ObservatoryPage', type: 'page', connections: 4, docStatus: 'documented', lastUpdated: '20m ago' },
  { id: 'n10', name: 'AdvisorSession', type: 'database', connections: 3, docStatus: 'partial', lastUpdated: '30m ago' },
  { id: 'n11', name: 'Security Engine', type: 'system', connections: 9, docStatus: 'documented', lastUpdated: '6m ago' },
  { id: 'n12', name: '/api/scan', type: 'api', connections: 4, docStatus: 'undocumented', lastUpdated: '2h ago' },
]

const graphEdges: GraphEdge[] = [
  { from: 'n1', to: 'n2', relation: 'uses' },
  { from: 'n2', to: 'n3', relation: 'uses' },
  { from: 'n3', to: 'n4', relation: 'uses' },
  { from: 'n4', to: 'n5', relation: 'updates' },
  { from: 'n3', to: 'n5', relation: 'generates' },
  { from: 'n1', to: 'n6', relation: 'uses' },
  { from: 'n1', to: 'n7', relation: 'depends on' },
  { from: 'n6', to: 'n9', relation: 'generates' },
  { from: 'n7', to: 'n10', relation: 'updates' },
  { from: 'n3', to: 'n8', relation: 'generates' },
  { from: 'n11', to: 'n12', relation: 'validates' },
  { from: 'n11', to: 'n6', relation: 'deploys' },
  { from: 'n3', to: 'n6', relation: 'depends on' },
  { from: 'n9', to: 'n8', relation: 'uses' },
  { from: 'n2', to: 'n7', relation: 'generates' },
  { from: 'n4', to: 'n3', relation: 'updates' },
]

const chainExamples = [
  {
    label: 'Content Pipeline',
    nodes: ['Mission Control', 'Opportunity Queue', 'Growth Engine', 'Replay Engine', 'Growth Memory'],
    relations: ['uses', 'uses', 'uses', 'updates'],
  },
  {
    label: 'Security Validation',
    nodes: ['Security Engine', '/api/scan', '/api/observatory'],
    relations: ['validates', 'deploys'],
  },
  {
    label: 'Advisor Flow',
    nodes: ['Mission Control', '/api/advisor', 'AdvisorSession'],
    relations: ['depends on', 'updates'],
  },
]

// ─── Helpers ─────────────────────────────────────────────

function nodeTypeConfig(type: NodeType) {
  switch (type) {
    case 'system': return { color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/20', dot: 'bg-teal-400', icon: Cpu, label: 'System' }
    case 'api': return { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20', dot: 'bg-orange-400', icon: Globe, label: 'API' }
    case 'component': return { color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/20', dot: 'bg-violet-400', icon: Box, label: 'Component' }
    case 'database': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', dot: 'bg-emerald-400', icon: Database, label: 'Database' }
    case 'page': return { color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/20', dot: 'bg-sky-400', icon: FileCode, label: 'Page' }
  }
}

function relationConfig(relation: RelationType) {
  switch (relation) {
    case 'uses': return { color: 'text-teal-400', line: 'bg-teal-500/40', label: 'uses' }
    case 'depends on': return { color: 'text-amber-400', line: 'bg-amber-500/40', label: 'depends on' }
    case 'updates': return { color: 'text-blue-400', line: 'bg-blue-500/40', label: 'updates' }
    case 'generates': return { color: 'text-violet-400', line: 'bg-violet-500/40', label: 'generates' }
    case 'validates': return { color: 'text-orange-400', line: 'bg-orange-500/40', label: 'validates' }
    case 'deploys': return { color: 'text-emerald-400', line: 'bg-emerald-500/40', label: 'deploys' }
  }
}

function docStatusConfig(status: GraphNode['docStatus']) {
  switch (status) {
    case 'documented': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Documented' }
    case 'partial': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertCircle, label: 'Partial' }
    case 'undocumented': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: AlertCircle, label: 'Undocumented' }
  }
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function KnowledgeGraphPage() {
  const mounted = useHydrated()
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!mounted) return null

  const filteredNodes = graphNodes.filter((node) => {
    const matchesType = filterType === 'all' || node.type === filterType
    const matchesSearch = searchQuery === '' || node.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const selectedNodeData = selectedNode ? graphNodes.find(n => n.id === selectedNode) : null
  const selectedNodeEdges = selectedNode
    ? graphEdges.filter(e => e.from === selectedNode || e.to === selectedNode)
    : []

  const nodeTypes: (NodeType | 'all')[] = ['all', 'system', 'api', 'component', 'database', 'page']
  const documentedCount = graphNodes.filter(n => n.docStatus === 'documented').length
  const docPercentage = Math.round((documentedCount / graphNodes.length) * 100)

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <Network className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Graph™</h1>
            <p className="text-slate-400 text-sm">Connects Everything</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-medium text-teal-400">Live mapping</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Rebuild Graph
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-teal-500/5 via-slate-900 to-slate-900 border border-teal-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Network className="w-4 h-4 text-teal-400" />
              <span className="text-2xl font-bold text-teal-400">147</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Nodes</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-teal-400" />
              <span className="text-2xl font-bold text-teal-400">312</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Connections</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{docPercentage}%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Documented</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span className="text-2xl font-bold text-teal-400">5</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Node Types</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Relationship Chains
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" />
          Relationship Chains
          <span className="ml-auto text-[10px] text-slate-400">Key connection paths</span>
        </h2>
        <div className="space-y-4">
          {chainExamples.map((chain) => (
            <div
              key={chain.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200"
            >
              <div className="text-[10px] text-teal-400 uppercase tracking-wider font-medium mb-3">{chain.label}</div>
              <div className="flex flex-wrap items-center gap-2">
                {chain.nodes.map((nodeName, idx) => {
                  const node = graphNodes.find(n => n.name === nodeName)
                  const typeConfig = node ? nodeTypeConfig(node.type) : null
                  const TypeIcon = typeConfig?.icon || Cpu
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${typeConfig?.bg || 'bg-slate-800'} ${typeConfig?.border || 'border-slate-700'}`}>
                        <TypeIcon className={`w-3 h-3 ${typeConfig?.color || 'text-slate-400'}`} />
                        <span className="text-xs font-medium text-slate-200">{nodeName}</span>
                      </div>
                      {idx < chain.relations.length && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="h-px w-3 bg-slate-700" />
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <div className="h-px w-3 bg-slate-700" />
                          <span className="text-[9px] text-slate-500 font-medium px-1">
                            {chain.relations[idx]}
                          </span>
                          <div className="h-px w-3 bg-slate-700" />
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <div className="h-px w-3 bg-slate-700" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Graph Nodes
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            Graph Nodes
            <span className="text-[10px] text-slate-400">{filteredNodes.length} shown</span>
          </h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/40 w-40"
              />
            </div>
            {/* Type filter */}
            <div className="flex items-center gap-1">
              {nodeTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    filterType === type
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNodes.map((node) => {
            const typeConfig = nodeTypeConfig(node.type)
            const docConfig = docStatusConfig(node.docStatus)
            const TypeIcon = typeConfig.icon
            const DocIcon = docConfig.icon
            const isSelected = selectedNode === node.id
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                className={`bg-slate-900 border rounded-xl p-4 transition-all duration-200 cursor-pointer hover:border-slate-700 ${
                  isSelected ? 'border-teal-500/40 bg-teal-500/5' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
                    <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">{node.name}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                        {typeConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-2">
                      <span>{node.connections} connections</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {node.lastUpdated}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[10px] ${docConfig.color}`}>
                        <DocIcon className="w-3 h-3" />
                        {docConfig.label}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isSelected ? 'rotate-90 text-teal-400' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded connections */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Connections</div>
                    <div className="space-y-2">
                      {graphEdges
                        .filter(e => e.from === node.id || e.to === node.id)
                        .map((edge, idx) => {
                          const isOutgoing = edge.from === node.id
                          const connectedId = isOutgoing ? edge.to : edge.from
                          const connectedNode = graphNodes.find(n => n.id === connectedId)
                          const relConfig = relationConfig(edge.relation)
                          if (!connectedNode) return null
                          const connectedTypeConfig = nodeTypeConfig(connectedNode.type)
                          const ConnectedIcon = connectedTypeConfig.icon
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded flex items-center justify-center ${connectedTypeConfig.bg}`}>
                                <ConnectedIcon className={`w-3 h-3 ${connectedTypeConfig.color}`} />
                              </div>
                              <span className="text-[11px] text-slate-300">{connectedNode.name}</span>
                              <div className="flex-1" />
                              <span className={`text-[9px] font-medium ${relConfig.color}`}>
                                {isOutgoing ? '→' : '←'} {relConfig.label}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Relationship Map (Visual)
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Network className="w-4 h-4 text-teal-400" />
          Relationship Map
          <span className="ml-auto text-[10px] text-slate-400">{graphEdges.length} edges</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-slate-400">System</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-slate-400">API</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-slate-400">Component</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Database</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-slate-400">Page</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-teal-400">uses</span>
              <span className="text-amber-400">depends on</span>
              <span className="text-blue-400">updates</span>
              <span className="text-violet-400">generates</span>
              <span className="text-orange-400">validates</span>
              <span className="text-emerald-400">deploys</span>
            </div>
          </div>

          {/* Edges */}
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {graphEdges.map((edge, idx) => {
              const fromNode = graphNodes.find(n => n.id === edge.from)
              const toNode = graphNodes.find(n => n.id === edge.to)
              const relConfig = relationConfig(edge.relation)
              const fromConfig = fromNode ? nodeTypeConfig(fromNode.type) : null
              const toConfig = toNode ? nodeTypeConfig(toNode.type) : null
              if (!fromNode || !toNode) return null
              return (
                <div key={idx} className="flex items-center gap-3 group">
                  {/* From node */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="text-xs font-mono text-slate-300 text-right truncate">{fromNode.name}</span>
                    <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${fromConfig?.dot}`} />
                  </div>
                  {/* Arrow */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className={`h-px w-4 ${relConfig.line}`} />
                    <ArrowRight className={`w-3 h-3 ${relConfig.color}`} />
                    <div className={`h-px w-4 ${relConfig.line}`} />
                    <span className={`text-[8px] font-medium ${relConfig.color} w-16 text-center`}>{relConfig.label}</span>
                    <div className={`h-px w-4 ${relConfig.line}`} />
                    <ArrowRight className={`w-3 h-3 ${relConfig.color}`} />
                    <div className={`h-px w-4 ${relConfig.line}`} />
                  </div>
                  {/* To node */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${toConfig?.dot}`} />
                    <span className="text-xs font-mono text-slate-300 truncate">{toNode.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Selected Node Detail (if any)
          ═══════════════════════════════════════════════════════ */}
      {selectedNodeData && (
        <div className="bg-slate-900 border border-teal-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {(() => {
                const tc = nodeTypeConfig(selectedNodeData.type)
                const TIcon = tc.icon
                return (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.bg}`}>
                      <TIcon className={`w-4 h-4 ${tc.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{selectedNodeData.name}</div>
                      <div className="text-[10px] text-slate-500">{tc.label} — {selectedNodeData.connections} connections</div>
                    </div>
                  </>
                )
              })()}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          {/* Incoming/Outgoing edges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-teal-400 uppercase tracking-wider font-medium mb-2">Outgoing</div>
              <div className="space-y-2">
                {selectedNodeEdges
                  .filter(e => e.from === selectedNode)
                  .map((edge, idx) => {
                    const targetNode = graphNodes.find(n => n.id === edge.to)
                    if (!targetNode) return null
                    const relConfig = relationConfig(edge.relation)
                    const targetConfig = nodeTypeConfig(targetNode.type)
                    return (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${targetConfig.dot}`} />
                        <span className="text-xs text-slate-300">{targetNode.name}</span>
                        <span className="ml-auto text-[9px] font-medium text-slate-500">{relConfig.label}</span>
                        <ArrowRight className={`w-3 h-3 ${relConfig.color}`} />
                      </div>
                    )
                  })}
                {selectedNodeEdges.filter(e => e.from === selectedNode).length === 0 && (
                  <div className="text-[11px] text-slate-600 px-3 py-2">No outgoing connections</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-teal-400 uppercase tracking-wider font-medium mb-2">Incoming</div>
              <div className="space-y-2">
                {selectedNodeEdges
                  .filter(e => e.to === selectedNode)
                  .map((edge, idx) => {
                    const sourceNode = graphNodes.find(n => n.id === edge.from)
                    if (!sourceNode) return null
                    const relConfig = relationConfig(edge.relation)
                    const sourceConfig = nodeTypeConfig(sourceNode.type)
                    return (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${sourceConfig.dot}`} />
                        <span className="text-xs text-slate-300">{sourceNode.name}</span>
                        <span className="ml-auto text-[9px] font-medium text-slate-500">{relConfig.label}</span>
                        <ArrowRight className={`w-3 h-3 ${relConfig.color}`} />
                      </div>
                    )
                  })}
                {selectedNodeEdges.filter(e => e.to === selectedNode).length === 0 && (
                  <div className="text-[11px] text-slate-600 px-3 py-2">No incoming connections</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          7. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>Last mapped: <span className="text-slate-300">1m ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Nodes: <span className="text-teal-400">147</span></span>
        <span className="text-slate-700">|</span>
        <span>Connections: <span className="text-teal-400">312</span></span>
        <span className="text-slate-700">|</span>
        <span>Documented: <span className="text-emerald-400">98%</span></span>
        <span className="text-slate-700">|</span>
        <span>Auto-rebuild: <span className="text-slate-300">On deploy</span></span>
      </div>

    </div>
  )
}
