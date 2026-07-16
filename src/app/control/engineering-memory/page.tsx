'use client'

import { useEffect, useState } from 'react'
import {
  Database, Brain, AlertTriangle, ChevronRight,
  FileCode2, Eye, CheckCircle2, XCircle,
  Clock, BarChart3, Target, Layers, Flame,
  Lightbulb, Sparkles, RefreshCw, Shield, Zap,
  TrendingUp, Activity,
} from 'lucide-react'

// ── Types (matching EngineeringMemory Prisma model) ──────────

interface EngineeringMemoryRecord {
  id: string
  patternType: string
  patternName: string
  description: string | null
  filePath: string | null
  occurrences: number
  confidence: number
  lastSeenAt: string
  metadata: string | null
  createdAt: string
  updatedAt: string
}

interface MemoryPageData {
  memories: EngineeringMemoryRecord[]
  totalCount: number
}

// ── Helpers ──────────────────────────────────────────────────

function patternTypeColor(type: string): { color: string; bg: string; icon: typeof Brain } {
  switch (type) {
    case 'component':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: Layers }
    case 'api_route':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', icon: Zap }
    case 'pattern':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Lightbulb }
    case 'anti_pattern':
      return { color: 'text-red-400', bg: 'bg-red-500/15', icon: AlertTriangle }
    case 'rollback':
      return { color: 'text-purple-400', bg: 'bg-purple-500/15', icon: RefreshCw }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/15', icon: FileCode2 }
  }
}

function confidenceColor(conf: number): string {
  if (conf >= 80) return 'text-emerald-400'
  if (conf >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function confidenceBarColor(conf: number): string {
  if (conf >= 80) return 'bg-emerald-500'
  if (conf >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Main Page ────────────────────────────────────────────────

export default function EngineeringMemoryPage() {
  const [data, setData] = useState<MemoryPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        // Correct data path: json.factory.recentMemories
        const memories = json.factory?.recentMemories ?? json.recentMemories ?? []
        const totalCount = json.factory?.counts?.memories ?? json.counts?.memories ?? memories.length
        setData({ memories, totalCount })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-20" />)}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const { memories, totalCount } = data

  // ── Derive stats ─────────────────────────────────────────
  const avgConfidence = memories.length > 0
    ? Math.round(memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length)
    : 0
  const totalOccurrences = memories.reduce((sum, m) => sum + m.occurrences, 0)
  const uniqueTypes = new Set(memories.map(m => m.patternType)).size
  const antiPatternCount = memories.filter(m => m.patternType === 'anti_pattern').length

  // Group by pattern type
  const byType: Record<string, EngineeringMemoryRecord[]> = {}
  for (const m of memories) {
    const key = m.patternType || 'unknown'
    if (!byType[key]) byType[key] = []
    byType[key].push(m)
  }

  const typeEntries = Object.entries(byType).sort((a, b) => b[1].length - a[1].length)

  // Filter memories
  const filteredMemories = filterType === 'all'
    ? memories
    : memories.filter(m => m.patternType === filterType)

  // Stat cards
  const statCards = [
    { label: 'Total Memories', value: totalCount, icon: Database, color: 'emerald' },
    { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: Target, color: 'cyan' },
    { label: 'Total Occurrences', value: totalOccurrences, icon: Activity, color: 'amber' },
    { label: 'Anti-Patterns', value: antiPatternCount, icon: AlertTriangle, color: 'red' },
  ]

  // Filter options
  const filterOptions = ['all', ...Array.from(new Set(memories.map(m => m.patternType)))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain className="w-6 h-6 text-emerald-400" />
          Engineering Memory
        </h1>
        <p className="text-slate-400 text-sm mt-1">Patterns, decisions, and learnings from the codebase</p>
      </div>

      {/* Confidence Gauge */}
      {memories.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Average Confidence</div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-emerald-400">{avgConfidence}%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase">Total Records</div>
              <div className="text-2xl font-bold text-amber-400">{totalCount}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${avgConfidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${card.color}-400`} />
                <span className="text-[10px] text-slate-500 uppercase">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
            </div>
          )
        })}
      </div>

      {/* Pattern Type Breakdown */}
      {typeEntries.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Pattern Types
            <span className="ml-auto text-[10px] text-slate-400">{uniqueTypes} types</span>
          </h2>
          <div className="space-y-2">
            {typeEntries.map(([type, records]) => {
              const config = patternTypeColor(type)
              const TypeIcon = config.icon
              const maxOcc = Math.max(...typeEntries.map(([, r]) => r.length), 1)
              const pct = (records.length / maxOcc) * 100
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <TypeIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className="text-xs text-slate-300 capitalize">{type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                    <div
                      className={`h-full rounded flex items-center px-2 ${config.bg}`}
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{records.length}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter + Memory List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            Recent Memories
            <span className="text-[10px] text-slate-400">{filteredMemories.length} shown</span>
          </h2>
          <div className="flex items-center gap-1.5">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterType(opt)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filterType === opt
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {opt === 'all' ? 'All' : opt.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredMemories.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No engineering memories yet</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Memory records will appear as the factory pipeline processes tasks and scans the codebase.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Pattern Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Occur.</div>
              <div className="col-span-2">Confidence</div>
              <div className="col-span-1">Last Seen</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto custom-scrollbar">
              {filteredMemories.map((memory) => {
                const config = patternTypeColor(memory.patternType)
                const TypeIcon = config.icon
                return (
                  <div
                    key={memory.id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} border-current/20`}>
                        <TypeIcon className="w-2.5 h-2.5" />
                        {memory.patternType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs font-medium text-slate-200 truncate">
                      {memory.patternName}
                    </div>
                    <div className="col-span-3 text-xs text-slate-400 truncate">
                      {memory.description || '—'}
                    </div>
                    <div className="col-span-1 text-xs text-slate-300 text-center">
                      {memory.occurrences}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${confidenceBarColor(memory.confidence)}`}
                            style={{ width: `${memory.confidence}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${confidenceColor(memory.confidence)}`}>
                          {Math.round(memory.confidence)}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 text-[10px] text-slate-500">
                      {timeAgo(memory.lastSeenAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* File Path Reference */}
      {memories.some(m => m.filePath) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            Affected Files
          </h2>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {memories
              .filter(m => m.filePath)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    m.patternType === 'anti_pattern' ? 'bg-red-400' :
                    m.patternType === 'rollback' ? 'bg-purple-400' : 'bg-emerald-400'
                  }`} />
                  <span className="font-mono text-slate-400">{m.filePath}</span>
                  <span className="text-slate-600 ml-auto">{m.patternName}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Showing latest {memories.length} of {totalCount} records</span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Source: <span className="text-emerald-400">Engineering Memory Engine</span></span>
      </div>
    </div>
  )
}
