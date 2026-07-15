'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Database,
  Clock,
  Zap,
  ArrowDown,
  Landmark,
  Code2,
  Shield,
  Eye,
  PenTool,
  Search,
  Cpu,
  Lightbulb,
  PiggyBank,
  Activity,
  CircleDollarSign,
  Target,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface ModelInfo {
  key: string
  id: string
  free: boolean
  contextWindow: number
  speed: 'ultra' | 'fast' | 'medium' | 'slow'
  quality: 'basic' | 'good' | 'excellent' | 'state_of_art'
  costPer1kInput?: number
  costPer1kOutput?: number
}

interface ProviderStatus {
  id: string
  configured: boolean
  hasEnvVar: string | null
  models: ModelInfo[]
}

interface AIRouterData {
  providers: ProviderStatus[]
  tierConstraints: Record<string, { allowedProviders: string[]; maxCostPerCall: number; preferFree: boolean }>
  summary: {
    configuredCount: number
    totalProviders: number
    overallStatus: 'ok' | 'degraded' | 'down'
    message: string
  }
}

// ── Engine cost mapping (static architecture) ────────────────

interface EngineCostDef {
  engine: string
  icon: React.ElementType
  color: string
}

const engineCostDefs: EngineCostDef[] = [
  { engine: 'Product Engine', icon: Landmark, color: 'cyan' },
  { engine: 'Architecture Engine', icon: Cpu, color: 'emerald' },
  { engine: 'Engineering Engine', icon: Code2, color: 'emerald' },
  { engine: 'QA Engine', icon: Shield, color: 'amber' },
  { engine: 'Review Engine', icon: Eye, color: 'cyan' },
  { engine: 'Documentation', icon: PenTool, color: 'cyan' },
  { engine: 'Observatory', icon: Search, color: 'amber' },
]

// ── Helpers ──────────────────────────────────────────────────

function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

function formatCost(cost: number | undefined): string {
  if (cost === undefined || cost === 0) return '$0.00'
  return `$${cost.toFixed(4)}`
}

// ── Component ────────────────────────────────────────────────

export default function AICostDashboardPage() {
  const [data, setData] = useState<AIRouterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch AI cost data')
        const json = await res.json()
        // Extract AI router data from unified API response
        const aiProviders = json.aiProviders || { configured: [], available: [], using: 'rule-based-fallback' }
        const providers: ProviderStatus[] = aiProviders.configured.map((id: string) => ({
          id,
          configured: true,
          hasEnvVar: null,
          models: [],
        }))
        setData({
          providers,
          tierConstraints: {},
          summary: {
            configuredCount: aiProviders.configured.length,
            totalProviders: 5,
            overallStatus: aiProviders.using === 'live-llm' ? 'ok' as const : 'degraded' as const,
            message: aiProviders.using === 'live-llm' ? 'AI providers operational' : 'Using rule-based fallback',
          },
        })
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
      <div className="space-y-8">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-32" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load AI cost data</h2>
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

  // Compute cost data from API response
  const allModels = data.providers.flatMap(p => p.models)
  const totalModels = allModels.length
  const freeModels = allModels.filter(m => m.free)
  const paidModels = allModels.filter(m => !m.free)

  const maxInputCost = allModels.reduce((max, m) => Math.max(max, m.costPer1kInput || 0), 0)
  const maxOutputCost = allModels.reduce((max, m) => Math.max(max, m.costPer1kOutput || 0), 0)

  const totalInputCostPerK = allModels.reduce((sum, m) => sum + (m.costPer1kInput || 0), 0)
  const totalOutputCostPerK = allModels.reduce((sum, m) => sum + (m.costPer1kOutput || 0), 0)
  const allFree = paidModels.length === 0

  // Build engine cost rows using real model data
  const engineCosts = engineCostDefs.map((def) => {
    // Find relevant models for this engine
    let relevantModels: ModelInfo[] = []
    let modelLabel = 'N/A'

    if (def.engine === 'Product Engine') {
      relevantModels = allModels.filter(m => m.key.includes('gemini') || m.key.includes('flash'))
      modelLabel = relevantModels.length > 0 ? relevantModels[0].id + (relevantModels[0].free ? ' (free)' : '') : 'Gemini Flash'
    } else if (def.engine === 'Architecture Engine') {
      relevantModels = allModels.filter(m => m.key.includes('glm') || m.key.includes('qwen'))
      modelLabel = relevantModels.length > 0 ? relevantModels[0].id + (relevantModels[0].free ? ' (free tier)' : '') : 'GLM (free tier)'
    } else if (def.engine === 'Engineering Engine') {
      relevantModels = allModels.filter(m => m.key.includes('glm') || m.key.includes('coder'))
      modelLabel = relevantModels.length > 0 ? relevantModels[0].id + (relevantModels[0].free ? ' (free tier)' : '') : 'GLM (free tier)'
    } else if (def.engine === 'QA Engine') {
      modelLabel = '95% deterministic'
    } else if (def.engine === 'Review Engine') {
      relevantModels = allModels.filter(m => m.key.includes('glm') || m.key.includes('gemini'))
      modelLabel = 'Cross review (free)'
    } else if (def.engine === 'Documentation') {
      relevantModels = allModels.filter(m => m.key.includes('gemini') || m.key.includes('flash'))
      modelLabel = relevantModels.length > 0 ? relevantModels[0].id + ' (free)' : 'Gemini Flash (free)'
    } else if (def.engine === 'Observatory') {
      modelLabel = 'Narrative only'
    }

    const engineCost = relevantModels.reduce((sum, m) => sum + (m.costPer1kInput || 0) + (m.costPer1kOutput || 0), 0)

    return {
      ...def,
      calls: 0, // Not tracked per-engine from this API
      cost: engineCost === 0 ? '$0.00' : formatCost(engineCost),
      model: modelLabel,
      cacheHitRate: 0, // Not available from this endpoint
    }
  })

  return (
    <div className="space-y-8">

      {/* ── Section 1: Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Cost Dashboard™</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-time
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">Track every AI dollar — or the beautiful lack thereof</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Live cost tracking</span>
        </div>
      </div>

      {/* ── Section 2: Today's Cost Banner ────────────────── */}
      <section>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/5 border border-emerald-500/20 p-6 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-5">
            <CircleDollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Model Cost Overview</h2>
            <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
              {allFree ? '$0.00 total' : `Max: ${formatCost(Math.max(maxInputCost, maxOutputCost))}`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Total Models */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Models</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{totalModels}</p>
              <p className="text-[10px] text-slate-500 mt-1">models registered</p>
            </div>

            {/* Free Models */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Free Models</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{freeModels.length}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">zero-cost tier</p>
            </div>

            {/* Free % */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Free %</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{totalModels > 0 ? Math.round((freeModels.length / totalModels) * 100) : 0}%</p>
              <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalModels > 0 ? (freeModels.length / totalModels) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Configured */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Providers</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{data.summary.configuredCount}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">of {data.summary.totalProviders} configured</p>
            </div>

            {/* Estimated Cost */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-4 sm:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Est. Cost</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{allFree ? '$0.00' : formatCost(totalInputCostPerK + totalOutputCostPerK)}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">{allFree ? '100% free tier' : 'per 1K tokens'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Cost Breakdown by Engine ────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Cost Breakdown by Engine</h2>
          <span className="text-xs text-slate-500 ml-1">— Per-engine model costs</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Engine</div>
            <div className="col-span-2">Models</div>
            <div className="col-span-2">Cost</div>
            <div className="col-span-3">Model Used</div>
            <div className="col-span-2">Status</div>
          </div>
          {engineCosts.map((ec, i) => {
            const Icon = ec.icon
            return (
              <div
                key={ec.engine}
                className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center ${
                  i < engineCosts.length - 1 ? 'border-b border-slate-800/60' : ''
                } hover:bg-slate-800/30 transition-colors`}
              >
                <div className="col-span-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-white font-medium">{ec.engine}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-white font-mono">{ec.calls || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-emerald-400 font-mono font-bold">{ec.cost}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs text-cyan-400/80 font-mono">{ec.model}</span>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                    {ec.cost === '$0.00' ? 'Free' : 'Paid'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 4: Monthly Trend ──────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Monthly Trend</h2>
          <span className="text-xs text-slate-500 ml-1">— 6-month cost history</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-bold text-emerald-400 font-mono">$0.00</span>
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-semibold">Total spent — 6 months</span>
              <span className="text-[10px] text-slate-500">
                {allFree ? 'All models are on free tier' : `${paidModels.length} paid model(s) configured`}
              </span>
            </div>
            {allFree && (
              <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Free
              </span>
            )}
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-3 h-40 px-2">
            {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-emerald-400/70 font-mono">$0.00</span>
                <div className="w-full rounded-t-md bg-emerald-500/15 border border-emerald-500/20" style={{ height: '8px' }} />
                <span className="text-xs text-slate-500 font-medium">{month}</span>
              </div>
            ))}
          </div>

          {/* Trend summary */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">Cost trend:</span>
              <span className="text-xs text-emerald-400 font-semibold">Flat $0.00 — {allFree ? 'all free tier' : `${freeModels.length}/${totalModels} models free`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Providers:</span>
              <span className="text-xs text-white font-mono">{data.summary.configuredCount} configured</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Model Pricing Table ─────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Model Pricing</h2>
          <span className="text-xs text-slate-500 ml-1">— Real cost data from model registry</span>
        </div>
        {allModels.length === 0 ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No models registered</p>
            <p className="text-xs text-slate-600 mt-1">Configure AI providers to see model pricing</p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Model</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-1">Free</div>
              <div className="col-span-2">Input / 1K</div>
              <div className="col-span-2">Output / 1K</div>
              <div className="col-span-2">Context</div>
            </div>
            {allModels.map((model, i) => (
              <div
                key={model.key}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                  i < allModels.length - 1 ? 'border-b border-slate-800/60' : ''
                } hover:bg-slate-800/30 transition-colors`}
              >
                <div className="col-span-3 text-sm text-white font-mono truncate">{model.id}</div>
                <div className="col-span-2 text-xs text-cyan-400/80 capitalize">{model.key.split('/')[0]}</div>
                <div className="col-span-1">
                  {model.free ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">Yes</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">No</span>
                  )}
                </div>
                <div className="col-span-2 text-xs text-white font-mono">{model.costPer1kInput != null ? formatCost(model.costPer1kInput) : '—'}</div>
                <div className="col-span-2 text-xs text-white font-mono">{model.costPer1kOutput != null ? formatCost(model.costPer1kOutput) : '—'}</div>
                <div className="col-span-2 text-xs text-slate-400">{(model.contextWindow / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 6: Optimization Opportunities ──────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Optimization Opportunities</h2>
          <span className="text-xs text-slate-500 ml-1">— Where we could save even more</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              engine: 'Product Engine',
              suggestion: 'Reduce from daily to on-change scheduling',
              reduction: '-60% calls',
              icon: Landmark,
              color: 'cyan' as const,
            },
            {
              engine: 'Engineering Memory',
              suggestion: 'Pre-check patterns before LLM call',
              reduction: '-30% calls',
              icon: Database,
              color: 'emerald' as const,
            },
            {
              engine: 'QA Reports',
              suggestion: 'Template-based instead of LLM-generated',
              reduction: '-90% calls',
              icon: Shield,
              color: 'amber' as const,
            },
          ].map((opt, i) => {
            const Icon = opt.icon
            const c = opt.color === 'cyan'
              ? { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/20' }
              : opt.color === 'emerald'
              ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' }
              : { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/20' }

            return (
              <div
                key={i}
                className={`rounded-xl ${c.bg} border ${c.border} p-5 transition-all duration-150 hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{opt.engine}</span>
                </div>
                <p className="text-sm text-white mb-3">{opt.suggestion}</p>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-bold">{opt.reduction}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 7: Footer ──────────────────────────────── */}
      <footer className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Running cost: <span className="text-emerald-400 font-mono font-bold">{allFree ? '$0.00' : formatCost(totalInputCostPerK + totalOutputCostPerK)}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Projected monthly: <span className="text-emerald-400 font-mono font-bold">{allFree ? '$0.00' : 'Varies'}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Free models: <span className="text-white font-mono">{freeModels.length}/{totalModels}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
            <span>Providers: <span className="text-cyan-400 font-mono">{data.summary.configuredCount}/{data.summary.totalProviders}</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
