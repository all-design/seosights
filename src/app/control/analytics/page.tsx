'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, TrendingUp, Eye, DollarSign,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Activity,
  Package, Target, Zap, Clock, Shield, Database,
  Users, FileCode2, Cpu, Globe, CheckCircle2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────

interface SystemComponent {
  status: string
  latency: number
  details: string
}

interface SystemStatus {
  components: Record<string, SystemComponent>
  overallStatus: string
  lastChecked: string
}

interface ControlData {
  factory: {
    counts: {
      factoryTasks: number
      interceptions: number
      missions: number
      qaRuns: number
      snapshots: number
      memories: number
      changelogs: number
    }
    aiProviders: {
      configured: string[]
      available: string[]
      using: string
    }
    scheduleSummary: {
      totalJobs: number
      completed: number
      running: number
      pending: number
      failed: number
    }
    timestamp: string
  }
  growth: {
    snapshot: any | null
    opportunities: any[]
  }
  systemStatus: SystemStatus
  aiCost: {
    totalRecords: number
    monthlySpend: number
    monthlyTokens: { prompt: number; completion: number; total: number }
    monthlyRequests: number
    byModel: any[]
    byAgent: any[]
  }
  entityCounts: {
    users: number
    projects: number
    analyses: number
  }
  techDebt: {
    apiRoutes: number
    prismaModels: number
    lintErrors: number
    typescriptErrors: number
    technicalDebtScore: number
  }
  performance: {
    scores: {
      performance: number
      seo: number
      accessibility: number
    }
    lastRun: { completedAt: string; durationMs: number } | null
  }
  security: {
    securityScore: number
    vulnerabilities: { critical: number; high: number; medium: number; low: number; total: number }
  }
}

// ── Component ────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<ControlData | null>(null)
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-24" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load analytics</h2>
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

  const factory = data.factory ?? { counts: { factoryTasks: 0, interceptions: 0, missions: 0, qaRuns: 0, snapshots: 0, memories: 0, changelogs: 0 }, aiProviders: { configured: [], available: [], using: 'fallback' }, scheduleSummary: { totalJobs: 0, completed: 0, running: 0, pending: 0, failed: 0 }, timestamp: '' }
  const growth = data.growth ?? { snapshot: null, opportunities: [] }
  const systemStatus = data.systemStatus ?? { components: {}, overallStatus: 'unknown', lastChecked: '' }
  const aiCost = data.aiCost ?? { totalRecords: 0, monthlySpend: 0, monthlyTokens: { prompt: 0, completion: 0, total: 0 }, monthlyRequests: 0, byModel: [], byAgent: [] }
  const entityCounts = data.entityCounts ?? { users: 0, projects: 0, analyses: 0 }
  const techDebt = data.techDebt ?? { apiRoutes: 0, prismaModels: 0, lintErrors: 0, typescriptErrors: 0, technicalDebtScore: 0 }
  const performance = data.performance ?? { scores: { performance: 0, seo: 0, accessibility: 0 }, lastRun: null }
  const security = data.security ?? { securityScore: 0, vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, total: 0 } }
  const { snapshot, opportunities } = growth

  // ── System Health KPIs ─────────────────────────────────
  const operationalCount = Object.values(systemStatus.components).filter(c => c.status === 'operational').length
  const totalComponents = Object.keys(systemStatus.components).length
  const healthPct = totalComponents > 0 ? Math.round((operationalCount / totalComponents) * 100) : 0

  const kpis = [
    { label: 'System Health', value: `${healthPct}%`, trend: healthPct >= 80 ? 'up' as const : 'down' as const, delta: `${operationalCount}/${totalComponents} operational`, icon: Shield },
    { label: 'AI Requests', value: aiCost.monthlyRequests > 0 ? aiCost.monthlyRequests.toLocaleString() : '0', trend: aiCost.monthlyRequests > 0 ? 'up' as const : 'down' as const, delta: 'this month', icon: Cpu },
    { label: 'Monthly Spend', value: aiCost.monthlySpend > 0 ? `$${aiCost.monthlySpend.toFixed(2)}` : '$0', trend: aiCost.monthlySpend > 0 ? 'up' as const : 'down' as const, delta: 'AI costs', icon: DollarSign },
    { label: 'Security Score', value: security.securityScore > 0 ? security.securityScore.toString() : '—', trend: security.securityScore >= 80 ? 'up' as const : 'down' as const, delta: 'vulnerability scan', icon: Shield },
    { label: 'Users', value: entityCounts.users.toLocaleString(), trend: entityCounts.users > 0 ? 'up' as const : 'down' as const, delta: 'registered', icon: Users },
    { label: 'Projects', value: entityCounts.projects.toLocaleString(), trend: entityCounts.projects > 0 ? 'up' as const : 'down' as const, delta: 'active', icon: Package },
    { label: 'Analyses', value: entityCounts.analyses.toLocaleString(), trend: entityCounts.analyses > 0 ? 'up' as const : 'down' as const, delta: 'completed', icon: Eye },
    { label: 'AI Providers', value: factory.aiProviders.configured.length.toString(), trend: factory.aiProviders.using === 'live-llm' ? 'up' as const : 'down' as const, delta: factory.aiProviders.using, icon: Globe },
  ]

  // ── Component Status ───────────────────────────────────
  const componentEntries = Object.entries(systemStatus.components)

  // ── Growth KPIs (if available) ─────────────────────────
  const growthMetrics = snapshot ? [
    { label: 'Assets Published', value: snapshot.assetsPublished ?? 0, color: 'emerald' },
    { label: 'AI Visibility Gain', value: Math.round(snapshot.aiVisibilityGain ?? 0), color: 'cyan' },
    { label: 'Citation Gain', value: Math.round(snapshot.citationGain ?? 0), color: 'amber' },
    { label: 'Success Rate', value: Math.round(snapshot.successfulRate ?? 0), color: 'emerald' },
    { label: 'Avg Quality', value: Math.round(snapshot.avgQualityScore ?? 0), color: 'cyan' },
    { label: 'Knowledge Coverage', value: Math.round(snapshot.knowledgeCoverage ?? 0), color: 'amber' },
  ] : []

  const maxGrowthMetric = Math.max(...growthMetrics.map(m => m.value), 1)

  // ── AI Cost by Model ───────────────────────────────────
  const byModel = aiCost.byModel ?? []

  // ── Uptime calculation ─────────────────────────────────
  const uptimeSeconds = factory.timestamp
    ? Math.round((Date.now() - new Date(factory.timestamp).getTime()) / 1000)
    : 0
  const uptimeStr = uptimeSeconds < 60 ? `${uptimeSeconds}s`
    : uptimeSeconds < 3600 ? `${Math.floor(uptimeSeconds / 60)}m`
    : uptimeSeconds < 86400 ? `${Math.floor(uptimeSeconds / 3600)}h`
    : `${Math.floor(uptimeSeconds / 86400)}d`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide metrics, system health, and insights</p>
      </div>

      {/* System Health Banner */}
      <div className={`rounded-xl p-5 border ${
        healthPct >= 80
          ? 'bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border-emerald-500/20'
          : healthPct >= 50
            ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/20'
            : 'bg-gradient-to-r from-red-500/10 via-slate-900 to-slate-900 border-red-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">System Status</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                healthPct >= 80 ? 'text-emerald-400' : healthPct >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {systemStatus.overallStatus === 'operational' ? 'Operational' : 'Degraded'}
              </span>
              <span className="text-xs text-slate-500">{healthPct}% healthy</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">Last Checked</div>
            <div className="text-sm text-slate-300">{systemStatus.lastChecked ? new Date(systemStatus.lastChecked).toLocaleTimeString() : '—'}</div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase">{k.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{k.value}</span>
                <span className={`text-xs flex items-center gap-0.5 ${k.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {k.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.delta}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Component Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Component Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {componentEntries.map(([name, comp]) => (
            <div key={name} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${
                  comp.status === 'operational' ? 'bg-emerald-400' :
                  comp.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                <span className="text-xs font-medium text-white capitalize">{name}</span>
              </div>
              <div className="text-[10px] text-slate-500">{comp.details}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Factory Counts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Database Records
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Factory Tasks', value: factory.counts.factoryTasks },
            { label: 'Interceptions', value: factory.counts.interceptions },
            { label: 'Missions', value: factory.counts.missions },
            { label: 'QA Runs', value: factory.counts.qaRuns },
            { label: 'Snapshots', value: factory.counts.snapshots },
            { label: 'Memories', value: factory.counts.memories },
            { label: 'Changelogs', value: factory.counts.changelogs },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-white">{item.value}</div>
              <div className="text-[10px] text-slate-500 uppercase">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Cost Breakdown */}
      {byModel.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            AI Cost by Model
          </h2>
          <div className="space-y-2">
            {byModel.map((m: any) => {
              const maxCost = byModel[0]?.cost ?? 1
              const pct = (m.cost / maxCost) * 100
              return (
                <div key={m.model} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-40 flex-shrink-0 truncate font-mono">{m.model}</span>
                  <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/40 rounded flex items-center px-2"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">${m.cost?.toFixed(4)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 w-16 text-right">{m.requests} reqs</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Growth Metrics (if available) */}
      {growthMetrics.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Growth Metrics
          </h2>
          <div className="space-y-2">
            {growthMetrics.map((m) => {
              const pct = maxGrowthMetric > 0 ? (m.value / maxGrowthMetric) * 100 : 0
              return (
                <div key={m.label} className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 w-36 flex-shrink-0 truncate">{m.label}</span>
                  <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                    <div
                      className={`h-full rounded flex items-center px-2 bg-${m.color}-500/40`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{m.value}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tech Debt Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-emerald-400" />
          Codebase & Tech Debt
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="text-center p-3 rounded-lg bg-slate-800/30">
            <div className="text-lg font-bold text-white">{techDebt.apiRoutes}</div>
            <div className="text-[10px] text-slate-500 uppercase">API Routes</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/30">
            <div className="text-lg font-bold text-cyan-400">{techDebt.prismaModels}</div>
            <div className="text-[10px] text-slate-500 uppercase">Prisma Models</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/30">
            <div className="text-lg font-bold text-amber-400">{techDebt.lintErrors}</div>
            <div className="text-[10px] text-slate-500 uppercase">Lint Errors</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/30">
            <div className="text-lg font-bold text-red-400">{techDebt.typescriptErrors}</div>
            <div className="text-[10px] text-slate-500 uppercase">TS Errors</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-800/30">
            <div className="text-lg font-bold text-emerald-400">{techDebt.technicalDebtScore}</div>
            <div className="text-[10px] text-slate-500 uppercase">Debt Score</div>
          </div>
        </div>
      </div>

      {/* Schedule Summary */}
      {factory.scheduleSummary.totalJobs > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Cron Schedule
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-white">{factory.scheduleSummary.totalJobs}</div>
              <div className="text-[10px] text-slate-500 uppercase">Total Jobs</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-emerald-400">{factory.scheduleSummary.completed}</div>
              <div className="text-[10px] text-slate-500 uppercase">Completed</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-cyan-400">{factory.scheduleSummary.running}</div>
              <div className="text-[10px] text-slate-500 uppercase">Running</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-amber-400">{factory.scheduleSummary.pending}</div>
              <div className="text-[10px] text-slate-500 uppercase">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Data as of: <span className="text-slate-300">{factory.timestamp ? new Date(factory.timestamp).toLocaleString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>AI Mode: <span className="text-emerald-400">{factory.aiProviders.using}</span></span>
        <span className="text-slate-700">|</span>
        <span>Providers: <span className="text-slate-300">{factory.aiProviders.configured.join(', ') || 'none'}</span></span>
      </div>
    </div>
  )
}
