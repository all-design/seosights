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
  Lightbulb,
  PiggyBank,
  Activity,
  CircleDollarSign,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Hash,
  Bot,
  FileText,
  Users,
  Inbox,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface ByModelEntry {
  model: string
  cost: number
  promptTokens: number
  completionTokens: number
  requests: number
}

interface ByAgentEntry {
  agent: string
  cost: number
  promptTokens: number
  completionTokens: number
  requests: number
}

interface RecentUsageEntry {
  id: string
  agentName: string
  modelUsed: string
  promptTokens: number
  completionTokens: number
  costUsd: number
  createdAt: string
}

interface AICostData {
  totalRecords: number
  monthlySpend: number
  monthlyTokens: { prompt: number; completion: number; total: number }
  monthlyRequests: number
  dailyAvgSpend: number
  byModel: ByModelEntry[]
  byAgent: ByAgentEntry[]
  recentUsage: RecentUsageEntry[]
}

// ── Helpers ──────────────────────────────────────────────────

function formatCost(cost: number): string {
  if (cost === 0) return '$0.00'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  if (cost < 1) return `$${cost.toFixed(3)}`
  return `$${cost.toFixed(2)}`
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return tokens.toString()
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function getModelIcon(model: string) {
  const lower = model.toLowerCase()
  if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3') || lower.includes('o4')) return Bot
  if (lower.includes('claude')) return Cpu
  if (lower.includes('gemini')) return Zap
  if (lower.includes('deepseek')) return Hash
  if (lower.includes('glm') || lower.includes('qwen')) return Database
  if (lower.includes('llama') || lower.includes('mistral')) return FileText
  return Cpu
}

function getAgentIcon(agent: string) {
  const lower = agent.toLowerCase()
  if (lower.includes('director') || lower.includes('master')) return Users
  if (lower.includes('analyst') || lower.includes('competitor')) return BarChart3
  if (lower.includes('engineer') || lower.includes('coding')) return Cpu
  if (lower.includes('qa') || lower.includes('test') || lower.includes('review')) return CheckCircle2
  if (lower.includes('doc')) return FileText
  if (lower.includes('product')) return Lightbulb
  if (lower.includes('observ')) return Activity
  return Bot
}

// Derive optimization suggestions from cost data
function deriveOptimizations(aiCost: AICostData) {
  const suggestions: Array<{
    title: string
    suggestion: string
    reduction: string
    icon: React.ElementType
    color: 'cyan' | 'emerald' | 'amber'
  }> = []

  const byModel = aiCost.byModel ?? []
  const byAgent = aiCost.byAgent ?? []

  // Check for expensive models
  const expensiveModels = byModel.filter(m => m.cost > 0 && m.requests > 0).sort((a, b) => b.cost - a.cost)
  if (expensiveModels.length > 0) {
    const top = expensiveModels[0]
    const avgCostPerReq = top.cost / top.requests
    suggestions.push({
      title: top.model,
      suggestion: `Highest spend model — ${formatNumber(top.requests)} requests at ${formatCost(avgCostPerReq)}/req avg. Consider caching or using a cheaper model for simple tasks.`,
      reduction: `${formatCost(top.cost)}/mo`,
      icon: getModelIcon(top.model),
      color: 'amber',
    })
  }

  // Check for agents with high token usage that could be optimized
  const highTokenAgents = byAgent
    .filter(a => a.requests > 0)
    .sort((a, b) => (b.promptTokens + b.completionTokens) - (a.promptTokens + a.completionTokens))
  if (highTokenAgents.length > 0) {
    const top = highTokenAgents[0]
    const totalTokens = top.promptTokens + top.completionTokens
    suggestions.push({
      title: top.agent,
      suggestion: `Heaviest token consumer — ${formatTokens(totalTokens)} tokens. Reduce prompt size or implement response streaming to cut costs.`,
      reduction: `${formatTokens(totalTokens)} tokens`,
      icon: getAgentIcon(top.agent),
      color: 'cyan',
    })
  }

  // Check for agents with high per-request cost
  const highCostPerReq = byAgent
    .filter(a => a.requests > 5 && a.cost > 0)
    .map(a => ({ ...a, costPerReq: a.cost / a.requests }))
    .sort((a, b) => b.costPerReq - a.costPerReq)
  if (highCostPerReq.length > 0) {
    const top = highCostPerReq[0]
    suggestions.push({
      title: top.agent,
      suggestion: `Highest cost/request ratio at ${formatCost(top.costPerReq)}/req. Consider batching requests or using prompt templates.`,
      reduction: `-${Math.round(top.costPerReq * 0.3 * 100) / 100 < 0.01 ? '<$0.01' : formatCost(top.costPerReq * 0.3)}/req`,
      icon: getAgentIcon(top.agent),
      color: 'emerald',
    })
  }

  // If no data at all, show a zero-cost tip
  if (suggestions.length === 0) {
    if (aiCost.monthlySpend === 0 && aiCost.totalRecords === 0) {
      suggestions.push({
        title: 'No Usage Data',
        suggestion: 'No token usage recorded yet. Start making AI calls to see cost optimization suggestions here.',
        reduction: '—',
        icon: Inbox,
        color: 'cyan',
      })
    } else {
      suggestions.push({
        title: 'Zero Cost',
        suggestion: 'All AI calls are currently on free tier models. No optimization needed — keep it up!',
        reduction: '$0.00',
        icon: PiggyBank,
        color: 'emerald',
      })
    }
  }

  return suggestions.slice(0, 3)
}

// ── Component ────────────────────────────────────────────────

export default function AICostDashboardPage() {
  const [aiCost, setAiCost] = useState<AICostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch AI cost data')
        const json = await res.json()
        // Extract aiCost from unified API response
        const cost = json.aiCost ?? {
          totalRecords: 0,
          monthlySpend: 0,
          monthlyTokens: { prompt: 0, completion: 0, total: 0 },
          monthlyRequests: 0,
          dailyAvgSpend: 0,
          byModel: [],
          byAgent: [],
          recentUsage: [],
        }
        setAiCost(cost)
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

  if (!aiCost) return null

  // Derived values
  const byModel = aiCost.byModel ?? []
  const byAgent = aiCost.byAgent ?? []
  const totalModels = byModel.length
  const totalAgents = byAgent.length
  const paidModels = byModel.filter(m => m.cost > 0)
  const freeModels = byModel.filter(m => m.cost === 0)
  const isAllFree = aiCost.monthlySpend === 0
  const optimizations = deriveOptimizations(aiCost)

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

      {/* ── Section 2: Monthly Cost Overview ──────────────── */}
      <section>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/5 border border-emerald-500/20 p-6 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-5">
            <CircleDollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Monthly Cost Overview</h2>
            <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
              {isAllFree ? '$0.00 total' : `${formatCost(aiCost.monthlySpend)} this month`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Monthly Spend */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-4 sm:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Monthly Spend</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{formatCost(aiCost.monthlySpend)}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">this month</p>
            </div>

            {/* Total Tokens */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Tokens</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{formatTokens(aiCost.monthlyTokens.total)}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {formatTokens(aiCost.monthlyTokens.prompt)} in / {formatTokens(aiCost.monthlyTokens.completion)} out
              </p>
            </div>

            {/* Monthly Requests */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Requests</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{formatNumber(aiCost.monthlyRequests)}</p>
              <p className="text-[10px] text-slate-500 mt-1">this month</p>
            </div>

            {/* Daily Avg Spend */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Daily Avg</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{formatCost(aiCost.dailyAvgSpend)}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">avg spend/day</p>
            </div>

            {/* Total Records */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Logs</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{formatNumber(aiCost.totalRecords)}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">all-time records</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Cost Breakdown by Model ─────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Cost Breakdown by Model</h2>
          <span className="text-xs text-slate-500 ml-1">— Real usage data this month</span>
        </div>
        {byModel.length === 0 ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No model usage data</p>
            <p className="text-xs text-slate-600 mt-1">AI calls will appear here once token usage is logged</p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Model</div>
              <div className="col-span-2">Requests</div>
              <div className="col-span-2">Cost</div>
              <div className="col-span-3">Tokens (in / out)</div>
              <div className="col-span-2">Status</div>
            </div>
            {byModel.map((m, i) => {
              const Icon = getModelIcon(m.model)
              return (
                <div
                  key={m.model}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center ${
                    i < byModel.length - 1 ? 'border-b border-slate-800/60' : ''
                  } hover:bg-slate-800/30 transition-colors`}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-white font-medium truncate">{m.model}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-white font-mono">{formatNumber(m.requests)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-emerald-400 font-mono font-bold">{formatCost(m.cost)}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs text-cyan-400/80 font-mono">
                      {formatTokens(m.promptTokens)} / {formatTokens(m.completionTokens)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      m.cost === 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {m.cost === 0 ? 'Free' : 'Paid'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Section 4: Cost Breakdown by Agent ─────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Cost Breakdown by Agent</h2>
          <span className="text-xs text-slate-500 ml-1">— Which agents spend the most</span>
        </div>
        {byAgent.length === 0 ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No agent usage data</p>
            <p className="text-xs text-slate-600 mt-1">Agent cost breakdown will appear here once usage is logged</p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Agent</div>
              <div className="col-span-2">Requests</div>
              <div className="col-span-2">Cost</div>
              <div className="col-span-3">Tokens (in / out)</div>
              <div className="col-span-2">Cost/Req</div>
            </div>
            {byAgent.map((a, i) => {
              const Icon = getAgentIcon(a.agent)
              const costPerReq = a.requests > 0 ? a.cost / a.requests : 0
              return (
                <div
                  key={a.agent}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center ${
                    i < byAgent.length - 1 ? 'border-b border-slate-800/60' : ''
                  } hover:bg-slate-800/30 transition-colors`}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-white font-medium truncate">{a.agent}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-white font-mono">{formatNumber(a.requests)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-emerald-400 font-mono font-bold">{formatCost(a.cost)}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs text-cyan-400/80 font-mono">
                      {formatTokens(a.promptTokens)} / {formatTokens(a.completionTokens)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-slate-300 font-mono">{formatCost(costPerReq)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Section 5: Monthly Trend ──────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Monthly Summary</h2>
          <span className="text-xs text-slate-500 ml-1">— Current month at a glance</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-bold text-emerald-400 font-mono">{formatCost(aiCost.monthlySpend)}</span>
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-semibold">Spent this month</span>
              <span className="text-[10px] text-slate-500">
                {isAllFree
                  ? aiCost.totalRecords === 0 ? 'No usage recorded yet' : 'All usage on free tier'
                  : `${paidModels.length} paid model(s), ${freeModels.length} free model(s)`}
              </span>
            </div>
            {isAllFree && aiCost.totalRecords > 0 && (
              <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Free
              </span>
            )}
          </div>

          {/* Token breakdown bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Prompt tokens: {formatTokens(aiCost.monthlyTokens.prompt)}</span>
              <span>Completion tokens: {formatTokens(aiCost.monthlyTokens.completion)}</span>
            </div>
            <div className="h-4 rounded-full bg-slate-800 overflow-hidden flex">
              {aiCost.monthlyTokens.total > 0 ? (
                <>
                  <div
                    className="h-full bg-cyan-500/60 transition-all duration-500"
                    style={{ width: `${(aiCost.monthlyTokens.prompt / aiCost.monthlyTokens.total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500/60 transition-all duration-500"
                    style={{ width: `${(aiCost.monthlyTokens.completion / aiCost.monthlyTokens.total) * 100}%` }}
                  />
                </>
              ) : (
                <div className="h-full w-full bg-slate-700/30" />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/60" />
                <span className="text-[10px] text-slate-500">Prompt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                <span className="text-[10px] text-slate-500">Completion</span>
              </div>
            </div>
          </div>

          {/* Trend summary */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">Daily avg:</span>
              <span className="text-xs text-emerald-400 font-semibold">{formatCost(aiCost.dailyAvgSpend)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Requests:</span>
              <span className="text-xs text-white font-mono">{formatNumber(aiCost.monthlyRequests)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Models:</span>
              <span className="text-xs text-white font-mono">{totalModels} active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Agents:</span>
              <span className="text-xs text-white font-mono">{totalAgents} active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Recent Usage ───────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Recent Usage</h2>
          <span className="text-xs text-slate-500 ml-1">— Latest AI calls</span>
        </div>
        {!aiCost.recentUsage || aiCost.recentUsage.length === 0 ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No recent usage</p>
            <p className="text-xs text-slate-600 mt-1">Recent AI calls will appear here as they are logged</p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden max-h-96 overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <div className="col-span-2">Agent</div>
              <div className="col-span-2">Model</div>
              <div className="col-span-2">Tokens</div>
              <div className="col-span-2">Cost</div>
              <div className="col-span-4">Time</div>
            </div>
            {aiCost.recentUsage.map((r, i) => (
              <div
                key={r.id ?? i}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors`}
              >
                <div className="col-span-2 text-sm text-white font-medium truncate">{r.agentName}</div>
                <div className="col-span-2 text-xs text-cyan-400/80 font-mono truncate">{r.modelUsed}</div>
                <div className="col-span-2 text-xs text-slate-300 font-mono">
                  {formatTokens(r.promptTokens + r.completionTokens)}
                </div>
                <div className="col-span-2 text-sm text-emerald-400 font-mono font-bold">{formatCost(r.costUsd)}</div>
                <div className="col-span-4 text-xs text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 7: Optimization Opportunities ──────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Optimization Opportunities</h2>
          <span className="text-xs text-slate-500 ml-1">— Derived from cost data</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {optimizations.map((opt, i) => {
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
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{opt.title}</span>
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

      {/* ── Section 8: Footer ──────────────────────────────── */}
      <footer className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Running cost: <span className="text-emerald-400 font-mono font-bold">{formatCost(aiCost.monthlySpend)}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Daily avg: <span className="text-emerald-400 font-mono font-bold">{formatCost(aiCost.dailyAvgSpend)}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Models: <span className="text-white font-mono">{totalModels}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
            <span>Agents: <span className="text-cyan-400 font-mono">{totalAgents}</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
