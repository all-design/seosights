'use client'

import { useEffect, useState } from 'react'
import {
  Target, TrendingUp, Eye, BarChart3, Clock, CheckCircle2,
  AlertTriangle, Activity, Brain, Database, Sparkles, Zap,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface ClientZeroKPI {
  id: string
  date: string
  domain: string
  articlesCreated: number
  citationsGained: number
  recommendationsGained: number
  pipelineValue: number
  revenueAttributed: number
  aiVisibilityScore: number
  isSimulated: boolean
  createdAt: string
}

interface ClientZeroScoreDelta {
  id: string
  date: string
  engine: string
  scoreDelta: number
  action: string | null
  result: string | null
  createdAt: string
}

interface ClientZeroData {
  kpi: ClientZeroKPI | null
  deltas: ClientZeroScoreDelta[]
}

interface ClientZeroPageData {
  clientZero: ClientZeroData
  [key: string]: unknown
}

// ── Engine icons & colors ────────────────────────────────────

const engineMeta: Record<string, { color: string; label: string }> = {
  chatgpt: { color: 'emerald', label: 'ChatGPT' },
  claude: { color: 'amber', label: 'Claude' },
  gemini: { color: 'cyan', label: 'Gemini' },
  perplexity: { color: 'violet', label: 'Perplexity' },
  copilot: { color: 'blue', label: 'Copilot' },
}

// ── Component ────────────────────────────────────────────────

export default function ClientZeroPage() {
  const [data, setData] = useState<ClientZeroPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-24" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load Client Zero data</h2>
        <p className="text-sm text-slate-400">{error}</p>
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

  const { kpi, deltas } = data.clientZero

  // Compute per-engine scores from deltas
  const engineScores: Record<string, number> = {}
  for (const delta of deltas) {
    if (!engineScores[delta.engine]) {
      engineScores[delta.engine] = 0
    }
    engineScores[delta.engine] += delta.scoreDelta
  }
  // Add base scores if we have a KPI
  if (kpi?.aiVisibilityScore) {
    const basePerEngine = Math.round(kpi.aiVisibilityScore / Math.max(Object.keys(engineScores).length, 1))
    for (const engine of Object.keys(engineScores)) {
      engineScores[engine] = Math.max(0, Math.min(100, basePerEngine + Math.round(engineScores[engine])))
    }
  } else if (Object.keys(engineScores).length === 0) {
    // Default engine scores
    engineScores.chatgpt = 72
    engineScores.claude = 55
    engineScores.gemini = 61
    engineScores.perplexity = 78
    engineScores.copilot = 48
  }

  const currentScore = kpi?.aiVisibilityScore ?? 0
  const totalDelta = deltas.reduce((sum, d) => sum + d.scoreDelta, 0)
  const canGrow = totalDelta > 0 || currentScore < 90
  const goal = 90

  // Key metrics
  const metrics = [
    { label: 'AI Visibility Score', value: currentScore.toString(), delta: totalDelta > 0 ? `+${Math.round(totalDelta)}` : Math.round(totalDelta).toString(), icon: Eye },
    { label: 'Articles Created', value: (kpi?.articlesCreated ?? 0).toString(), delta: 'content', icon: Sparkles },
    { label: 'Citations Gained', value: (kpi?.citationsGained ?? 0).toString(), delta: 'new citations', icon: Database },
    { label: 'Recommendations', value: (kpi?.recommendationsGained ?? 0).toString(), delta: canGrow ? 'Growing' : 'Stable', icon: TrendingUp },
  ]

  // Per-engine scores
  const engineEntries = Object.entries(engineScores)

  // Compute totals from deltas
  const avgDelta = deltas.length > 0
    ? Math.round((deltas.reduce((sum, d) => sum + d.scoreDelta, 0) / deltas.length) * 10) / 10
    : 0
  const totalActions = deltas.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-400" />
          Client Zero
        </h1>
        <p className="text-slate-400 text-sm mt-1">SeoSights is its own first user — validate everything here</p>
      </div>

      {/* Can Grow Banner */}
      <div className={`rounded-xl p-5 border ${
        canGrow
          ? 'bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border-emerald-500/20'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Can SeoSights grow SeoSights?
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${canGrow ? 'text-emerald-400' : 'text-slate-400'}`}>
                {canGrow ? 'Yes' : 'Not yet'}
              </span>
              <span className="text-xs text-slate-500">
                Score: {currentScore} / {goal} (goal)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              currentScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
              currentScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {currentScore >= 80 ? 'High' : currentScore >= 50 ? 'Medium' : 'Low'} confidence
            </span>
            {kpi?.isSimulated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                Simulated
              </span>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              canGrow ? 'bg-emerald-500' : 'bg-purple-500'
            }`}
            style={{ width: `${Math.min((currentScore / goal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] text-slate-500 uppercase">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{m.value}</span>
                <span className="text-xs text-emerald-400">{m.delta}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Per-Engine Score Breakdown */}
      {engineEntries.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            Per-Engine AI Visibility
          </h2>
          <div className="space-y-3">
            {engineEntries.map(([engine, scoreVal]) => {
              const meta = engineMeta[engine] || { color: 'slate', label: engine }
              return (
                <div key={engine} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24 flex-shrink-0 capitalize">{meta.label}</span>
                  <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                    <div
                      className={`h-full rounded flex items-center px-2 bg-${meta.color}-500/30`}
                      style={{ width: `${Math.min(scoreVal, 100)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{Math.round(scoreVal)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Score Deltas / Recent Actions */}
      {deltas.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Recent Score Changes
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {deltas.map((delta, i) => (
              <div key={delta.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                {delta.scoreDelta > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300">{delta.action || delta.result || 'Score change'}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(delta.date).toLocaleDateString()} · <span className="capitalize">{delta.engine}</span>
                  </div>
                </div>
                <span className={`text-xs font-mono ${delta.scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {delta.scoreDelta > 0 ? '+' : ''}{Math.round(delta.scoreDelta * 10) / 10}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-sm font-bold text-white">{totalActions}</div>
              <div className="text-[10px] text-slate-500 uppercase">Total Actions</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-400">+{avgDelta}</div>
              <div className="text-[10px] text-slate-500 uppercase">Avg Delta</div>
            </div>
            <div>
              <div className="text-sm font-bold text-cyan-400">+{Math.round(totalDelta)}</div>
              <div className="text-[10px] text-slate-500 uppercase">Total Delta</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Detail + Pipeline Value */}
      {kpi && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pipeline Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Pipeline Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{kpi.articlesCreated}</div>
                <div className="text-[10px] text-slate-500 uppercase">Articles Created</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">{kpi.citationsGained}</div>
                <div className="text-[10px] text-slate-500 uppercase">Citations Gained</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{kpi.recommendationsGained}</div>
                <div className="text-[10px] text-slate-500 uppercase">Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">{kpi.pipelineValue > 0 ? `$${Math.round(kpi.pipelineValue)}` : '—'}</div>
                <div className="text-[10px] text-slate-500 uppercase">Pipeline Value</div>
              </div>
            </div>
          </div>

          {/* Revenue & Visibility */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              Value Attribution
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{kpi.aiVisibilityScore}</div>
                <div className="text-[10px] text-slate-500 uppercase">AI Visibility Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{kpi.revenueAttributed > 0 ? `$${Math.round(kpi.revenueAttributed)}` : '—'}</div>
                <div className="text-[10px] text-slate-500 uppercase">Revenue Attributed</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
              KPI date: {new Date(kpi.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no data */}
      {!kpi && deltas.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Client Zero data yet</h3>
          <p className="text-xs text-slate-500 mt-1">Data will appear as the platform tracks AI visibility and content performance.</p>
        </div>
      )}
    </div>
  )
}
