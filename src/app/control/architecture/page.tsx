'use client'

import { useEffect, useState } from 'react'
import {
  Landmark, RefreshCw, ShieldCheck, Lightbulb, Ban, Recycle,
  FileCode, Database, Route, Puzzle, Trash2, ArrowRight,
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, Zap,
  Clock, Scan, Layers, GitBranch, Box, Network,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type DecisionType = 'reuse' | 'new' | 'schema' | 'cleanup' | 'modify'

interface ArchitectureDecision {
  id: string
  title: string
  type: DecisionType
  path: string
  confidence: number
  reasoning: string
  timestamp: string
}

type CreepStatus = 'blocked' | 'diverted' | 'approved'

interface FeatureCreepAlert {
  id: string
  originalSuggestion: string
  architectureResponse: string
  recommendedAlternative: string
  status: CreepStatus
}

type DependencyHealth = 'healthy' | 'coupled' | 'circular'

interface DependencyRelation {
  from: string
  to: string
  health: DependencyHealth
  description: string
}

// ─── Helpers ─────────────────────────────────────────────

function decisionTypeConfig(type: DecisionType) {
  switch (type) {
    case 'reuse': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: Recycle, label: 'Reuse' }
    case 'new': return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Puzzle, label: 'New Component' }
    case 'schema': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: Database, label: 'Schema Change' }
    case 'modify': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: FileCode, label: 'Modify Existing' }
    case 'cleanup': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: Trash2, label: 'Cleanup' }
  }
}

function creepStatusConfig(status: CreepStatus) {
  switch (status) {
    case 'blocked': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Blocked' }
    case 'diverted': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Diverted' }
    case 'approved': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Approved' }
  }
}

function dependencyHealthConfig(health: DependencyHealth) {
  switch (health) {
    case 'healthy': return { color: 'text-emerald-400', dot: 'bg-emerald-400', line: 'text-emerald-500' }
    case 'coupled': return { color: 'text-amber-400', dot: 'bg-amber-400', line: 'text-amber-500' }
    case 'circular': return { color: 'text-red-400', dot: 'bg-red-400', line: 'text-red-500' }
  }
}

function confidenceColor(score: number): string {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 75) return 'text-cyan-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  const gaugeColor = score >= 90 ? '#34d399' : score >= 75 ? '#22d3ee' : score >= 60 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-cyan-400">{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function ArchitectureEnginePage() {
  const [factoryData, setFactoryData] = useState<any>(null)
  const [memData, setMemData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        setFactoryData({
          system: json.factory?.system || {},
          counts: json.factory?.counts || {},
          recentActivity: json.factory?.recentActivity || [],
          ok: json.ok ?? true,
        })
        setMemData({ memories: json.factory?.recentMemories || [], count: json.factory?.counts?.memories ?? 0 })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-56" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
      </div>
    )
  }

  // ─── Error ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  // ─── Derived data ───────────────────────────────────────
  const system = factoryData?.system || {}
  const counts = factoryData?.counts || {}
  const memories = memData?.memories || []

  // Calculate architecture score from system health
  const systemEntries = Object.entries(system) as [string, string][]
  const operationalCount = systemEntries.filter(([, s]) => s === 'operational').length
  const OVERALL_SCORE = systemEntries.length > 0
    ? Math.round((operationalCount / systemEntries.length) * 100)
    : 0

  // Build architecture decisions from engineering memories
  const architectureDecisions: ArchitectureDecision[] = memories.map((mem: any) => {
    // Determine type from memory data
    let type: DecisionType = 'modify'
    if (mem.patternLearned && mem.patternLearned.toLowerCase().includes('reuse')) type = 'reuse'
    else if (mem.patternLearned && mem.patternLearned.toLowerCase().includes('new')) type = 'new'
    else if (mem.outcome === 'rolled_back') type = 'cleanup'
    else if (mem.rollbackNeeded) type = 'cleanup'
    else if (mem.feature && mem.feature.toLowerCase().includes('schema')) type = 'schema'
    else if (mem.outcome === 'success') type = 'reuse'

    return {
      id: mem.id,
      title: mem.feature || 'Architecture decision',
      type,
      path: mem.filesChanged || '/unknown',
      confidence: Math.round((mem.confidence || 0) * 100),
      reasoning: mem.patternLearned || `Outcome: ${mem.outcome || 'unknown'}`,
      timestamp: mem.createdAt,
    }
  })

  // Build feature creep alerts from rolled-back/failed memories
  const featureCreepAlerts: FeatureCreepAlert[] = memories
    .filter((m: any) => m.rollbackNeeded || m.outcome === 'rolled_back' || m.outcome === 'failed')
    .map((m: any) => ({
      id: m.id,
      originalSuggestion: m.feature || 'Unknown suggestion',
      architectureResponse: m.rollbackNeeded
        ? 'This change required a rollback due to issues detected.'
        : m.patternLearned || 'The architecture engine identified issues with this approach.',
      recommendedAlternative: m.patternLearned || 'Consider a more incremental approach.',
      status: m.outcome === 'rolled_back' ? 'blocked' as const : 'diverted' as const,
    }))

  // Build dependency graph from system component relationships
  const systemComponents = Object.keys(system)
  const dependencyRelations: DependencyRelation[] = []
  // Create derived relationships from system components
  if (system.aiRouter) {
    dependencyRelations.push({ from: 'AI Router', to: 'Engineering Engine', health: system.aiRouter === 'operational' ? 'healthy' : 'coupled', description: 'Routes AI tasks to engineering pipeline' })
  }
  if (system.governor) {
    dependencyRelations.push({ from: 'Governor', to: 'Architecture Engine', health: system.governor === 'operational' ? 'healthy' : 'coupled', description: 'Intercepts proposals for architecture review' })
  }
  if (system.qaEngine) {
    dependencyRelations.push({ from: 'QA Engine', to: 'Engineering Engine', health: system.qaEngine === 'operational' ? 'healthy' : 'coupled', description: 'Validates engineering outputs' })
  }
  if (system.codebaseScanner) {
    dependencyRelations.push({ from: 'Codebase Scanner', to: 'Architecture Engine', health: system.codebaseScanner === 'operational' ? 'healthy' : 'coupled', description: 'Provides codebase structure data' })
  }
  if (system.dailyMissionGenerator) {
    dependencyRelations.push({ from: 'Mission Generator', to: 'Engineering Engine', health: system.dailyMissionGenerator === 'operational' ? 'healthy' : 'coupled', description: 'Generates daily task missions' })
  }
  if (system.aiRouter && system.governor) {
    dependencyRelations.push({ from: 'AI Router', to: 'Governor', health: 'healthy', description: 'Sends proposals through governor for approval' })
  }

  // Stats
  const soundDecisions = architectureDecisions.filter(d => d.type === 'reuse' || d.type === 'modify').length
  const refactorSuggestions = architectureDecisions.filter(d => d.type === 'schema').length
  const featureCreepBlocked = featureCreepAlerts.filter(a => a.status === 'blocked').length
  const reuseOpportunities = architectureDecisions.filter(d => d.type === 'reuse').length

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Architecture Engine™</h1>
            <p className="text-slate-400 text-sm">Staff Engineer — decides WHERE changes go</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            operationalCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${operationalCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className={`text-xs font-medium ${operationalCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {operationalCount > 0 ? 'Running' : 'Idle'}
            </span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Force Re-analyze
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Architecture Score Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-cyan-500/5 via-slate-900 to-slate-900 border border-cyan-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <CircularGauge score={OVERALL_SCORE} size={160} />
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Architecture Health</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{soundDecisions}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sound Decisions</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">{refactorSuggestions}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Refactor Suggestions</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Ban className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{featureCreepBlocked}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Feature Creep Blocked</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Recycle className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">{reuseOpportunities}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Reuse Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Recent Architecture Decisions
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Recent Architecture Decisions
          <span className="ml-auto text-[10px] text-slate-400">{architectureDecisions.length} this session</span>
        </h2>
        {architectureDecisions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center gap-3">
            <Layers className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-500">No architecture decisions recorded yet</p>
            <p className="text-xs text-slate-600">Decisions will appear as the engineering engine processes tasks</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {architectureDecisions.map((decision) => {
              const config = decisionTypeConfig(decision.type)
              const TypeIcon = config.icon
              return (
                <div
                  key={decision.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <TypeIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{decision.title}</span>
                        <span className={`text-sm font-bold flex-shrink-0 ${confidenceColor(decision.confidence)}`}>
                          {decision.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Route className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <code className="text-[11px] text-slate-400 font-mono truncate">{decision.path}</code>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{decision.reasoning}</p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                          {config.label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {timeAgo(decision.timestamp)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Architecture Reviewer™ — Feature Creep Prevention
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" />
            Architecture Reviewer™
          </h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Feature Creep Prevention</span>
        </div>

        {/* Summary banner */}
        <div className="bg-gradient-to-r from-red-500/5 via-slate-900 to-amber-500/5 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">Prevented <span className="text-white font-bold">{featureCreepBlocked}</span> unnecessary changes</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" />
                {featureCreepAlerts.filter(a => a.status === 'blocked').length} blocked
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                {featureCreepAlerts.filter(a => a.status === 'diverted').length} diverted
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {featureCreepAlerts.filter(a => a.status === 'approved').length} approved
              </span>
            </div>
          </div>
        </div>

        {featureCreepAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400/30" />
            <p className="text-sm text-slate-500">No feature creep alerts</p>
            <p className="text-xs text-slate-600">All proposed changes have been architecturally sound</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {featureCreepAlerts.map((alert) => {
              const config = creepStatusConfig(alert.status)
              const StatusIcon = config.icon
              return (
                <div
                  key={alert.id}
                  className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-700 transition-all duration-200 ${config.border}`}
                >
                  {/* Original suggestion */}
                  <div className="mb-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Product Engine Suggested</div>
                    <div className="text-xs text-slate-300">{alert.originalSuggestion}</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-slate-700" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* Architecture response */}
                  <div className="mb-3">
                    <div className="text-[10px] text-cyan-500 uppercase tracking-wider mb-1">Architecture Response</div>
                    <div className="text-xs text-slate-300">{alert.architectureResponse}</div>
                  </div>

                  {/* Recommended alternative */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 mb-3">
                    <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Recommended Alternative</div>
                    <div className="text-xs text-slate-300 font-medium">{alert.recommendedAlternative}</div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-end">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Dependency Graph
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          Dependency Graph
          <span className="ml-auto text-[10px] text-slate-500">Key architectural relationships</span>
        </h2>
        {dependencyRelations.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center gap-3">
            <Network className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-500">No dependency data available</p>
            <p className="text-xs text-slate-600">System component relationships will appear when the factory is running</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            {/* Legend */}
            <div className="flex items-center gap-5 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Healthy</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400">Coupled</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-slate-400">Circular</span>
              </div>
            </div>

            {/* Relations */}
            <div className="space-y-3">
              {dependencyRelations.map((rel, idx) => {
                const config = dependencyHealthConfig(rel.health)
                return (
                  <div key={idx} className="flex items-center gap-3 group">
                    {/* From module */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="text-xs font-mono text-slate-300 text-right truncate">{rel.from}</span>
                      <Box className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`h-px w-6 ${rel.health === 'healthy' ? 'bg-emerald-500/40' : rel.health === 'coupled' ? 'bg-amber-500/40' : 'bg-red-500/40'}`} />
                      <ArrowRight className={`w-3.5 h-3.5 ${config.line}`} />
                      <div className={`h-px w-6 ${rel.health === 'healthy' ? 'bg-emerald-500/40' : rel.health === 'coupled' ? 'bg-amber-500/40' : 'bg-red-500/40'}`} />
                    </div>

                    {/* To module */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Box className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-300 truncate">{rel.to}</span>
                    </div>

                    {/* Health dot + description */}
                    <div className="flex items-center gap-2 flex-shrink-0 w-56 hidden lg:flex">
                      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      <span className="text-[10px] text-slate-500 truncate">{rel.description}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Quick Actions Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>System components: <span className="text-slate-300">{systemEntries.length}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Operational: <span className="text-emerald-400">{operationalCount}</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-cyan-400" />
          <span>Memory records: <span className="text-slate-300">{memories.length}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Reuse rate: <span className="text-cyan-400">{architectureDecisions.length > 0 ? Math.round(reuseOpportunities / architectureDecisions.length * 100) : 0}%</span></span>
      </div>

    </div>
  )
}
