'use client'

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
} from 'lucide-react'

const currentReplay = {
  pr: '#46',
  deployTime: '2h 23m ago',
  metrics: [
    { label: 'Conversion', before: '82%', after: '84%', change: '+2%', direction: 'up' as const, status: 'good' as const },
    { label: 'AI Visibility Score', before: '73', after: '78', change: '+5', direction: 'up' as const, status: 'good' as const },
    { label: 'CTR', before: '3.2%', after: '3.1%', change: '-0.1%', direction: 'down' as const, status: 'warning' as const },
    { label: 'Bounce Rate', before: '38%', after: '36%', change: '-2%', direction: 'down' as const, status: 'good' as const },
    { label: 'Page Load', before: '1.8s', after: '1.9s', change: '+0.1s', direction: 'up' as const, status: 'warning' as const },
    { label: 'Error Rate', before: '0.02%', after: '0.01%', change: '-0.01%', direction: 'down' as const, status: 'good' as const },
  ],
  overallStatus: 'stable' as const,
}

const rollbackHistory = [
  {
    pr: '#41',
    description: 'Chat widget redesign',
    trigger: 'Bounce rate +12%',
    triggerMetric: 'Bounce Rate',
    rollbackTime: '23min',
    rootCause: 'Widget blocked mobile viewport — CSS overflow not handled for <768px screens',
    timestamp: '4 days ago',
    severity: 'high' as const,
  },
  {
    pr: '#29',
    description: 'Hero animation overhaul',
    trigger: 'Page Load +3.2s',
    triggerMetric: 'Page Load',
    rollbackTime: '41min',
    rootCause: 'Uncompressed Lottie animation file (4.2MB) loaded synchronously above fold',
    timestamp: '2 weeks ago',
    severity: 'critical' as const,
  },
]

const thresholds = [
  { metric: 'Conversion', condition: '< -5% change', action: 'rollback', icon: TrendingDown },
  { metric: 'Error Rate', condition: '> 1%', action: 'rollback', icon: AlertCircle },
  { metric: 'Page Load', condition: '> +2s', action: 'rollback', icon: Timer },
  { metric: 'Bounce Rate', condition: '> +8%', action: 'rollback', icon: TrendingUp },
]

const footerStats = [
  { label: 'Replays this week', value: '12', icon: RotateCcw },
  { label: 'Avg observation', value: '4h 12m', icon: Clock },
  { label: 'Rollback rate', value: '8.3%', icon: Shield },
  { label: 'Mean time to detect', value: '18min', icon: Eye },
]

export default function ReplayEnginePage() {
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

      {/* Current Replay */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Current Replay — PR {currentReplay.pr}</h2>
          </div>
          <span className="text-xs text-slate-500">Deployed {currentReplay.deployTime}</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentReplay.metrics.map((metric) => (
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
                  <span
                    className={`text-[10px] ${
                      metric.status === 'good' ? 'text-emerald-400/60' : 'text-amber-400/60'
                    }`}
                  >
                    {metric.status === 'good'
                      ? metric.direction === 'down'
                        ? '(good)'
                        : '↑'
                      : '↓'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Verdict */}
          <div className="mt-6 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-400">
                ✅ NO ROLLBACK NEEDED
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                All metrics stable or improving within acceptable thresholds
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rollback History */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Shield className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Rollback History</h2>
          <span className="ml-auto text-xs text-slate-500">Rare but critical</span>
        </div>
        <div className="divide-y divide-slate-800">
          {rollbackHistory.map((rb) => (
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
                      PR {rb.pr}: {rb.description}
                    </span>
                    <span className="text-xs text-slate-500">{rb.timestamp}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Trigger: </span>
                      <span className="text-amber-400 font-medium">{rb.trigger}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Rollback in </span>
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
      </div>

      {/* Metric Thresholds */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Rollback Thresholds</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {thresholds.map((t) => {
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
                  <span className="text-amber-400 font-medium">2h 23m</span> remaining
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  style={{ width: '41%' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-500">0h</span>
                <span className="text-[10px] text-amber-400 font-medium">1h 37m elapsed</span>
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
