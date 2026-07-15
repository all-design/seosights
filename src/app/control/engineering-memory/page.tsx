'use client'

import { useEffect, useState } from 'react'
import {
  Database,
  Activity,
  TrendingUp,
  TrendingDown,
  Brain,
  Shield,
  AlertTriangle,
  ChevronRight,
  FileCode2,
  GitBranch,
  RotateCcw,
  Zap,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  BarChart3,
  Target,
  Layers,
  Flame,
  Lightbulb,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

interface MemoryRecord {
  id: string
  taskId?: string
  missionId?: string
  feature: string
  filesChanged: string
  testsAdded: number
  testsPassed: number
  testsFailed: number
  outcome: string
  rollbackNeeded: boolean
  performanceDelta: number | null
  confidence: number
  patternLearned: string | null
  appliedAgain: number
  createdAt: string
}

// ── SVG Gauge ──────────────────────────────────────────

function MemoryGauge({ score }: { score: number }) {
  const radius = 76
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#memoryGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  )
}

// ── Chain Step ─────────────────────────────────────────

function ChainStep({
  children,
  type,
}: {
  children: React.ReactNode
  type: 'positive' | 'negative' | 'neutral'
}) {
  const colorMap = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-slate-400',
  }
  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${colorMap[type]}`}>
      {children}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────

function outcomeType(outcome: string): 'positive' | 'negative' | 'neutral' {
  if (outcome === 'success') return 'positive'
  if (outcome === 'failed' || outcome === 'rolled_back') return 'negative'
  return 'neutral'
}

function perfType(delta: number | null): 'positive' | 'negative' | 'neutral' {
  if (delta === null || delta === 0) return 'neutral'
  return delta > 0 ? 'positive' : 'negative'
}

function perfLabel(delta: number | null): string {
  if (delta === null) return 'No perf data'
  if (delta === 0) return 'No perf impact'
  return `${delta > 0 ? '+' : ''}${delta}%`
}

function outcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'success': return 'Success'
    case 'partial': return 'Partial'
    case 'failed': return 'Failed'
    case 'rolled_back': return 'Rolled Back'
    default: return outcome
  }
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

// ── Main Page ──────────────────────────────────────────

export default function EngineeringMemoryPage() {
  const [data, setData] = useState<{ memories: MemoryRecord[]; count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        const memories = json.recentMemories || []
        setData({
          memories,
          count: json.counts?.memory ?? memories.length,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-56" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-20" />)}
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────
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

  const memories = data?.memories || []
  const totalCount = data?.count || 0

  // ── Derived stats ──────────────────────────────────────
  const avgConfidence = memories.length > 0
    ? Math.round(memories.reduce((sum, m) => sum + (m.confidence || 0), 0) / memories.length * 100)
    : 0
  const successCount = memories.filter(m => m.outcome === 'success').length
  const rollbackCount = memories.filter(m => m.rollbackNeeded).length
  const patternsWithLearnings = memories.filter(m => m.patternLearned && m.patternLearned.trim().length > 0).length
  const memoryScore = memories.length > 0
    ? Math.min(100, Math.round((avgConfidence * 0.4 + (successCount / memories.length) * 40 + (patternsWithLearnings / memories.length) * 20)))
    : 0

  const memoryStats = [
    { label: 'Changes Tracked', value: String(totalCount), icon: Activity, color: 'text-indigo-400' },
    { label: 'Patterns Discovered', value: String(patternsWithLearnings), icon: Brain, color: 'text-purple-400' },
    { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: Target, color: 'text-violet-400' },
    { label: 'Rollback Patterns', value: String(rollbackCount), icon: RotateCcw, color: 'text-fuchsia-400' },
  ]

  // ── Unique patterns from patternLearned ────────────────
  const uniquePatterns = memories
    .filter(m => m.patternLearned && m.patternLearned.trim().length > 0)
    .reduce((acc: any[], m) => {
      const existing = acc.find(p => p.description === m.patternLearned)
      if (existing) {
        existing.occurrences += 1
        existing.lastSeen = m.createdAt
        existing.maxConfidence = Math.max(existing.maxConfidence, m.confidence)
      } else {
        acc.push({
          description: m.patternLearned,
          confidence: Math.round(m.confidence * 100),
          maxConfidence: m.confidence,
          occurrences: 1 + m.appliedAgain,
          lastSeen: m.createdAt,
          risk: m.rollbackNeeded ? 'high' : m.outcome === 'failed' ? 'medium' : 'low' as const,
        })
      }
      return acc
    }, [])

  type RiskLevel = 'high' | 'medium' | 'low'
  const riskConfig: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
    high: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'High' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Medium' },
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Low' },
  }

  // ── Empty state ────────────────────────────────────────
  if (memories.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Database className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Engineering Memory&trade;
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Recording every change, learning patterns over time
              </p>
            </div>
          </div>
        </div>
        {/* Empty state */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 text-slate-600" />
          <p className="text-slate-300 font-medium">No patterns recorded yet</p>
          <p className="text-xs text-slate-500 text-center max-w-md">
            Engineering memory patterns will appear as the engineering engine processes tasks and records outcomes.
            Each task that completes will contribute to the pattern knowledge base.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Database className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Engineering Memory&trade;
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Recording every change, learning patterns over time
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Recording</span>
          </div>
          <span className="text-[10px] text-slate-500">{totalCount} records</span>
        </div>
      </div>

      {/* ── 2. Memory Score Banner ─────────────────────────── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Memory Score</h2>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            Enriching
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <MemoryGauge score={memoryScore} />
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {memoryStats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center"
                    >
                      <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                Memory richness improves with every tracked change
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Known Patterns ──────────────────────────────── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Brain className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Known Patterns</h2>
          <span className="ml-auto text-xs text-slate-500">
            {uniquePatterns.length} patterns discovered
          </span>
        </div>
        {uniquePatterns.length === 0 ? (
          <div className="p-6 flex items-center gap-3 justify-center">
            <Lightbulb className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-500">No patterns learned yet — will appear as more tasks complete</span>
          </div>
        ) : (
          <div className="max-h-[40rem] overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-slate-800/50">
              {uniquePatterns.map((p: any, i: number) => {
                const risk = riskConfig[p.risk as RiskLevel] || riskConfig.low
                return (
                  <div key={i} className="p-5 hover:bg-slate-800/20 transition-colors">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-white">{p.description}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Confidence bar */}
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider w-16 flex-shrink-0">
                              Confidence
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
                                style={{ width: `${p.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-indigo-300 w-8 text-right">
                              {p.confidence}%
                            </span>
                          </div>
                          {/* Occurrences */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>{p.occurrences}×</span>
                          </div>
                          {/* Last seen */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{timeAgo(p.lastSeen)}</span>
                          </div>
                          {/* Risk badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${risk.bg} ${risk.text} border ${risk.border}`}
                          >
                            {risk.label} Risk
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Change Chain ────────────────────────────────── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Change Chain</h2>
          <span className="ml-auto text-xs text-slate-500">
            Every change is tracked end-to-end
          </span>
        </div>
        <div className="p-5 space-y-5 max-h-[40rem] overflow-y-auto custom-scrollbar">
          {memories.slice(0, 10).map((mem, i) => {
            const testsOk = mem.testsPassed >= mem.testsFailed
            const totalTests = mem.testsPassed + mem.testsFailed
            return (
              <div
                key={mem.id}
                className={`rounded-lg border p-4 ${
                  mem.rollbackNeeded
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-slate-700/50 bg-slate-800/30'
                }`}
              >
                {/* Chain name */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-white">{mem.feature || 'Unnamed Feature'}</span>
                  {mem.rollbackNeeded && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/25">
                      Rolled Back
                    </span>
                  )}
                </div>
                {/* Horizontal flow */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Files */}
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 border border-slate-700/50">
                    <FileCode2 className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300 font-mono truncate max-w-[180px]">
                      {mem.filesChanged || 'N/A'}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Tests */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border ${
                      testsOk
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    {testsOk ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span className={testsOk ? 'text-emerald-400' : 'text-red-400'}>
                      {mem.testsPassed}/{totalTests || 1} tests
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Outcome */}
                  <ChainStep type={outcomeType(mem.outcome)}>
                    {outcomeType(mem.outcome) === 'positive' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : outcomeType(mem.outcome) === 'negative' ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : null}
                    <span>{outcomeLabel(mem.outcome)}</span>
                  </ChainStep>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Rollback */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border ${
                      mem.rollbackNeeded
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {mem.rollbackNeeded ? (
                      <RotateCcw className="w-3 h-3" />
                    ) : (
                      <Shield className="w-3 h-3" />
                    )}
                    <span>{mem.rollbackNeeded ? 'Rolled Back' : 'No Rollback'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Performance */}
                  <ChainStep type={perfType(mem.performanceDelta)}>
                    <Zap className="w-3 h-3" />
                    <span>{perfLabel(mem.performanceDelta)}</span>
                  </ChainStep>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Confidence */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border ${
                      mem.confidence >= 0.8
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : mem.confidence >= 0.5
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {mem.confidence >= 0.5 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>Confidence {Math.round(mem.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. Prediction Engine (derived from patterns) ──── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Eye className="w-4 h-4 text-fuchsia-400" />
          <h2 className="text-sm font-semibold text-white">Prediction Engine</h2>
          <span className="ml-auto text-xs text-slate-500">
            Pre-change risk assessment
          </span>
        </div>
        {uniquePatterns.length === 0 ? (
          <div className="p-6 flex items-center gap-3 justify-center">
            <Eye className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-500">No predictions yet — will be generated from learned patterns</span>
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-slate-800/50">
              {uniquePatterns.map((p: any, i: number) => {
                const recType = p.risk === 'high' ? 'warning' : p.risk === 'medium' ? 'action' : 'info'
                const recTypeConfig: Record<string, { bg: string; text: string; border: string }> = {
                  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                  action: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
                  info: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
                }
                const rec = recTypeConfig[recType]
                const recommendation = p.risk === 'high' ? 'Review before proceeding' : p.risk === 'medium' ? 'Test thoroughly' : 'Safe to proceed'
                return (
                  <div key={i} className="p-5 hover:bg-slate-800/20 transition-colors">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-fuchsia-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white mb-1">
                          Pattern: {p.description}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Prediction */}
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-300">{p.confidence}% confidence, {p.occurrences} occurrences</span>
                          </div>
                          {/* Confidence pill */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              Risk
                            </span>
                            <span className={`text-xs font-mono ${riskConfig[p.risk as RiskLevel]?.text || 'text-slate-400'}`}>
                              {p.risk}
                            </span>
                          </div>
                          {/* Recommendation badge */}
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${rec.bg} border ${rec.border}`}
                          >
                            <Lightbulb className={`w-3 h-3 ${rec.text}`} />
                            <span className={`text-xs font-medium ${rec.text}`}>
                              {recommendation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 6. File Heatmap (derived from filesChanged) ──── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Flame className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-white">File Heatmap</h2>
          <span className="ml-auto text-xs text-slate-500">Fragility index</span>
        </div>
        {(() => {
          // Derive file heatmap from filesChanged
          const fileMap = new Map<string, { changes: number; issues: number }>()
          memories.forEach(m => {
            if (!m.filesChanged) return
            const files = m.filesChanged.split(',').map(f => f.trim()).filter(Boolean)
            files.forEach(f => {
              const existing = fileMap.get(f) || { changes: 0, issues: 0 }
              existing.changes += 1
              if (m.rollbackNeeded || m.outcome === 'failed') existing.issues += 1
              fileMap.set(f, existing)
            })
          })
          const fileHeatmap = Array.from(fileMap.entries())
            .map(([name, data]) => ({
              name,
              totalChanges: data.changes,
              issuesCaused: data.issues,
              heat: data.issues >= 3 ? 'hot' as const : data.issues >= 1 ? 'warm' as const : 'cool' as const,
            }))
            .sort((a, b) => b.totalChanges - a.totalChanges)

          if (fileHeatmap.length === 0) {
            return (
              <div className="p-6 flex items-center gap-3 justify-center">
                <Flame className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-500">No file data available yet</span>
              </div>
            )
          }

          const heatConfig: Record<string, { color: string; label: string; bg: string }> = {
            hot: { color: 'text-red-400', label: 'Hot', bg: 'bg-red-500/15' },
            warm: { color: 'text-amber-400', label: 'Warm', bg: 'bg-amber-500/10' },
            cool: { color: 'text-emerald-400', label: 'Cool', bg: 'bg-emerald-500/10' },
          }

          return (
            <div className="divide-y divide-slate-800/50">
              {fileHeatmap.slice(0, 10).map((file, i) => {
                const heat = heatConfig[file.heat]
                const issueRate =
                  file.totalChanges > 0
                    ? Math.round((file.issuesCaused / file.totalChanges) * 100)
                    : 0
                return (
                  <div
                    key={i}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg ${heat.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <Flame className={`w-4 h-4 ${heat.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-white">
                            {file.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${heat.bg} ${heat.color}`}
                          >
                            {heat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{file.totalChanges} changes</span>
                          <span className="text-slate-700">·</span>
                          <span>
                            {file.issuesCaused} caused issues ({issueRate}% rate)
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="sm:w-40 w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              file.heat === 'hot'
                                ? 'bg-gradient-to-r from-red-600 to-red-400'
                                : file.heat === 'warm'
                                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                            }`}
                            style={{ width: `${Math.max(issueRate, 8)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400 w-8 text-right">
                          {issueRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* ── 7. Footer ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total records', value: String(totalCount), icon: BarChart3 },
          { label: 'Total patterns', value: String(patternsWithLearnings), icon: Brain },
          { label: 'Avg confidence', value: `${avgConfidence}%`, icon: Target },
          { label: 'Data points', value: String(memories.reduce((sum, m) => sum + m.testsPassed + m.testsFailed, 0)), icon: Activity },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-slate-900 rounded-xl border border-slate-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-indigo-400/60" />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
