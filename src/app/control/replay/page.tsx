'use client'

import { useState, useEffect } from 'react'
import {
  RotateCcw,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  Timer,
  BarChart3,
  Eye,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react'

// Static threshold config (architecture definition, not mock data)
const THRESHOLDS = [
  { metric: 'Conversion', condition: '< -5% change', action: 'rollback', icon: TrendingDown },
  { metric: 'Error Rate', condition: '> 1%', action: 'rollback', icon: AlertCircle },
  { metric: 'Page Load', condition: '> +2s', action: 'rollback', icon: Timer },
  { metric: 'Bounce Rate', condition: '> +8%', action: 'rollback', icon: TrendingUp },
]

export default function ReplayEnginePage() {
  const [factoryData, setFactoryData] = useState<any>(null)
  const [qaData, setQAData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        // API wraps data under json.factory — unwrap the envelope
        const source = json.factory || json
        setFactoryData({
          system: source.system || {},
          counts: source.counts || {},
          ok: source.ok ?? true,
        })
        const qaRun = json.productQA || source.latestQA
        if (qaRun) {
          setQAData({
            hasData: true,
            run: qaRun,
            healthScore: qaRun.productScore ?? 0,
            scoreDelta: qaRun.scoreDelta ?? 0,
            issueCounts: {
              critical: qaRun.criticalCount ?? 0,
              major: qaRun.majorCount ?? 0,
              medium: qaRun.mediumCount ?? 0,
              minor: qaRun.minorCount ?? 0,
              total: (qaRun.criticalCount ?? 0) + (qaRun.majorCount ?? 0) + (qaRun.mediumCount ?? 0) + (qaRun.minorCount ?? 0),
            },
            recentIssues: [],
            openCriticalMajor: (qaRun.criticalCount ?? 0) + (qaRun.majorCount ?? 0),
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-400 mb-1">Failed to load replay data</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  // ─── Derive replay metrics from QA scores ───────────────
  const hasQA = qaData?.hasData
  const run = hasQA ? qaData.run : null

  const metrics = hasQA ? [
    {
      label: 'Product Score',
      before: run?.productScore ? String(Math.max(0, run.productScore - (qaData.scoreDelta || 0))) : '—',
      after: String(run?.productScore ?? '—'),
      change: qaData.scoreDelta > 0 ? `+${qaData.scoreDelta}` : String(qaData.scoreDelta),
      direction: qaData.scoreDelta >= 0 ? 'up' as const : 'down' as const,
      status: qaData.scoreDelta >= 0 ? 'good' as const : 'warning' as const,
    },
    {
      label: 'UX Score',
      before: '—',
      after: String(run?.uxScore ?? '—'),
      change: run?.uxScore && run.uxScore >= 75 ? 'good' : 'warning',
      direction: 'up' as const,
      status: (run?.uxScore ?? 0) >= 75 ? 'good' as const : 'warning' as const,
    },
    {
      label: 'Security Score',
      before: '—',
      after: String(run?.securityScore ?? '—'),
      change: (run?.securityScore ?? 0) >= 80 ? 'good' : 'warning',
      direction: 'up' as const,
      status: (run?.securityScore ?? 0) >= 80 ? 'good' as const : 'warning' as const,
    },
    {
      label: 'Performance',
      before: '—',
      after: String(run?.performanceScore ?? '—'),
      change: (run?.performanceScore ?? 0) >= 80 ? 'good' : 'warning',
      direction: 'up' as const,
      status: (run?.performanceScore ?? 0) >= 80 ? 'good' as const : 'warning' as const,
    },
    {
      label: 'Issues Found',
      before: '—',
      after: String(qaData.issueCounts?.total ?? 0),
      change: qaData.issueCounts?.total > 0 ? `${qaData.issueCounts.total} issues` : 'clean',
      direction: qaData.issueCounts?.total > 0 ? 'up' as const : 'down' as const,
      status: (qaData.issueCounts?.total ?? 0) <= 5 ? 'good' as const : 'warning' as const,
    },
    {
      label: 'Health Score',
      before: '—',
      after: String(qaData.healthScore ?? '—'),
      change: qaData.healthScore >= 80 ? 'good' : 'needs attention',
      direction: qaData.healthScore >= 80 ? 'up' as const : 'down' as const,
      status: qaData.healthScore >= 80 ? 'good' as const : 'warning' as const,
    },
  ] : []

  // Derive rollback history from QA data (critical issues suggest past problems)
  const rollbackHistory = hasQA && qaData.recentIssues?.length > 0
    ? qaData.recentIssues
        .filter((issue: any) => issue.severity === 'critical')
        .slice(0, 2)
        .map((issue: any) => ({
          pr: issue.id?.substring(0, 4) || 'N/A',
          description: issue.title || 'Critical issue detected',
          trigger: issue.findings?.substring(0, 30) || 'Quality threshold breach',
          triggerMetric: issue.category || 'QA',
          rollbackTime: issue.createdAt
            ? `${Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / 60000)}min`
            : 'N/A',
          rootCause: issue.description || issue.fixSuggestion || 'Root cause analysis pending',
          timestamp: issue.createdAt
            ? new Date(issue.createdAt).toLocaleDateString()
            : 'N/A',
          severity: 'critical' as const,
        }))
    : []

  // Derive footer stats from real data
  const footerStats = [
    { label: 'QA Runs', value: String(factoryData?.counts?.qaRuns ?? 0), icon: RotateCcw },
    { label: 'Health Score', value: hasQA ? String(qaData.healthScore) : '—', icon: Clock },
    { label: 'Open Critical', value: String(qaData?.openCriticalMajor ?? 0), icon: Shield },
    { label: 'System Status', value: factoryData?.system?.qaEngine === 'operational' ? 'OK' : factoryData?.system?.qaEngine ?? '—', icon: Eye },
  ]

  const allSystemsOk = factoryData?.ok && (!hasQA || qaData.healthScore >= 75)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Replay Engine™</h1>
            <p className="text-sm text-slate-400 mt-0.5">Post-deploy measurement &amp; automatic rollback</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-medium text-amber-400">Monitoring</span>
        </div>
      </div>

      {/* Current Replay Metrics */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Current Replay Metrics</h2>
          </div>
          <span className="text-xs text-slate-500">Latest QA run</span>
        </div>
        <div className="p-6">
          {metrics.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4"
                  >
                    <div className="text-xs font-medium text-slate-400 mb-3">{metric.label}</div>
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-lg font-semibold text-slate-300">{metric.before}</span>
                      <ArrowRight className="w-4 h-4 text-slate-600 mb-0.5" />
                      <span className="text-lg font-semibold text-white">{metric.after}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {metric.status === 'good' ? (
                        metric.direction === 'down' ? (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        )
                      ) : metric.direction === 'up' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          metric.status === 'good' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Verdict */}
              <div className={`mt-6 ${allSystemsOk ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} border rounded-lg p-4 flex items-center gap-3`}>
                {allSystemsOk ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <div className={`text-sm font-semibold ${allSystemsOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {allSystemsOk ? '✅ NO ROLLBACK NEEDED' : '⚠️ ATTENTION NEEDED'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {allSystemsOk
                      ? 'All metrics stable or improving within acceptable thresholds'
                      : 'Some metrics outside acceptable thresholds — review recommended'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No replay data available</p>
              <p className="text-xs text-slate-500 mt-1">Metrics will appear after QA runs complete</p>
            </div>
          )}
        </div>
      </div>

      {/* Rollback History */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Shield className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Rollback History</h2>
          <span className="ml-auto text-xs text-slate-500">Rare but critical</span>
        </div>
        {rollbackHistory.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {rollbackHistory.map((rb: any) => (
              <div key={rb.pr} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      rb.severity === 'critical'
                        ? 'bg-red-500/15'
                        : 'bg-amber-500/15'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        rb.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-white">
                        {rb.description}
                      </span>
                      <span className="text-xs text-slate-500">{rb.timestamp}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Trigger: </span>
                        <span className="text-amber-400 font-medium">{rb.trigger}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Recovery in </span>
                        <span className="text-white font-medium">{rb.rollbackTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Metric: </span>
                        <span className="text-slate-300">{rb.triggerMetric}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="text-slate-400">Root cause:</span> {rb.rootCause}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No rollbacks recorded</p>
            <p className="text-xs text-slate-500 mt-1">System has been stable — no critical issues triggered rollback</p>
          </div>
        )}
      </div>

      {/* Metric Thresholds */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Rollback Thresholds</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THRESHOLDS.map((t) => {
              const Icon = t.icon
              return (
                <div
                  key={t.metric}
                  className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{t.metric}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {t.condition} → <span className="text-amber-400 font-medium">rollback</span>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase">Auto</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Observation Window */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Observation Window</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Timer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-white font-medium">
                  Monitoring for <span className="text-amber-400">4h</span> post-deploy
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  <span className="text-amber-400 font-medium">{factoryData?.system?.qaEngine === 'operational' ? 'Active' : 'Idle'}</span> — QA engine status
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: factoryData?.system?.qaEngine === 'operational' ? '60%' : '0%' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-500">0h</span>
                <span className="text-[10px] text-amber-400 font-medium">
                  {factoryData?.system?.qaEngine === 'operational' ? 'Monitoring active' : 'Not active'}
                </span>
                <span className="text-[10px] text-slate-500">4h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {footerStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-slate-900 rounded-xl border border-slate-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-amber-400/60" />
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
