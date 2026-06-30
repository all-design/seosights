'use client'

import {
  Bug,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Wrench,
  TrendingDown,
  ChevronRight,
  FileCode2,
  Trash2,
  RefreshCw,
  Database,
  Zap,
  Scan,
  ArrowRight,
  Calendar,
} from 'lucide-react'

const debtScore = 34
const debtTrend = [
  { month: 'Jan', score: 62 },
  { month: 'Feb', score: 55 },
  { month: 'Mar', score: 48 },
  { month: 'Apr', score: 42 },
  { month: 'May', score: 38 },
  { month: 'Jun', score: 34 },
]

const debtStats = [
  { label: 'Duplicated Components', value: 3, icon: FileCode2, color: 'text-amber-400' },
  { label: 'Dead APIs', value: 5, icon: Trash2, color: 'text-red-400' },
  { label: 'Unused Models', value: 2, icon: Database, color: 'text-amber-400' },
  { label: 'Circular Imports', value: 1, icon: RefreshCw, color: 'text-amber-400' },
  { label: 'Bundle Offenses', value: 2, icon: Zap, color: 'text-slate-400' },
]

type Severity = 'critical' | 'high' | 'medium' | 'low'

interface Finding {
  title: string
  severity: Severity
  filePath: string
  description: string
  suggestedAction: string
}

const severityConfig: Record<Severity, { bg: string; text: string; border: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: AlertTriangle, label: 'Critical' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: AlertCircle, label: 'High' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Info, label: 'Medium' },
  low: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: Info, label: 'Low' },
}

const findings: Finding[] = [
  {
    title: 'Duplicate logic: visibility score calculation in 3 places',
    severity: 'critical',
    filePath: 'lib/visibility.ts, lib/score.ts, components/ScoreCard.tsx',
    description: 'Same 40-line calculation duplicated across three files with minor variations',
    suggestedAction: 'Extract to shared utility lib/visibility/calculate-score.ts',
  },
  {
    title: 'Dead API: /api/legacy/scan — no callers found',
    severity: 'high',
    filePath: 'src/app/api/legacy/scan/route.ts',
    description: 'Route has zero inbound requests in 30 days. Was replaced by /api/observatory/detect',
    suggestedAction: 'Remove route and associated handler files',
  },
  {
    title: 'Unused Prisma model: LegacyScan — 0 queries in 30 days',
    severity: 'high',
    filePath: 'prisma/schema.prisma → model LegacyScan',
    description: 'Model exists but no code references it. Migration from old scan system',
    suggestedAction: 'Delete model, run prisma migrate',
  },
  {
    title: 'Circular import: observatory → engine → observatory',
    severity: 'medium',
    filePath: 'lib/observatory/index.ts ↔ lib/engine/index.ts',
    description: 'Circular dependency causes intermittent build warnings and slower dev server',
    suggestedAction: 'Extract shared types to lib/observatory/types.ts',
  },
  {
    title: 'Large component: SeoSightsPage.tsx — 1,847 lines',
    severity: 'medium',
    filePath: 'src/app/SeoSightsPage.tsx',
    description: 'Monolithic component should be split into smaller, focused components',
    suggestedAction: 'Split into 4-5 sub-components by section',
  },
  {
    title: 'Duplicate component: ScoreCard vs VisibilityScoreCard',
    severity: 'low',
    filePath: 'components/ScoreCard.tsx, components/VisibilityScoreCard.tsx',
    description: 'Two components with 78% similar code, different prop interfaces',
    suggestedAction: 'Merge into single ScoreCard with variant prop',
  },
]

const autoFixQueue = [
  {
    title: 'Remove /api/legacy/scan',
    reason: 'Safe — no callers in 30 days',
    action: 'Delete route',
    risk: 'low' as const,
  },
  {
    title: 'Delete LegacyScan model',
    reason: 'Safe — 0 usage queries',
    action: 'Remove from schema + migrate',
    risk: 'low' as const,
  },
]

const footerStats = [
  { label: 'Total debt items', value: '13', icon: Bug },
  { label: 'Auto-fixable', value: '2', icon: Wrench },
  { label: 'Last scan', value: '6h ago', icon: Clock },
  { label: 'Next scan', value: 'Tonight 02:00', icon: Calendar },
]

// SVG circular gauge component
function DebtGauge({ score }: { score: number }) {
  const radius = 80
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const centerX = 100
  const centerY = 100

  // Color based on score (lower is better)
  const getColor = () => {
    if (score <= 30) return '#10b981' // emerald
    if (score <= 50) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        {/* Background track */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  )
}

export default function TechDebtEnginePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Bug className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Technical Debt Engine™</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Nightly scans for code health &amp; maintainability
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-medium text-slate-400">Idle — runs nightly</span>
          </div>
          <span className="text-[10px] text-slate-500">Last scan: 6 hours ago at 02:00</span>
        </div>
      </div>

      {/* Debt Score */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Scan className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Debt Score</h2>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingDown className="w-3.5 h-3.5" />
            Improving
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Gauge */}
            <DebtGauge score={debtScore} />

            {/* Stats */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {debtStats.map((stat) => {
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
                <AlertCircle className="w-3.5 h-3.5" />
                Lower score = healthier codebase. Target: &lt;25
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Findings */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Critical Findings</h2>
          <span className="ml-auto text-xs text-slate-500">{findings.length} items found</span>
        </div>
        <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-800/50">
            {findings.map((f, i) => {
              const config = severityConfig[f.severity]
              const SevIcon = config.icon
              return (
                <div key={i} className="p-5 hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <SevIcon className={`w-4 h-4 ${config.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-white">{f.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${config.bg} ${config.text} border ${config.border}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-2">{f.filePath}</div>
                      <div className="text-xs text-slate-400 mb-2">{f.description}</div>
                      <div className="flex items-start gap-1.5 bg-slate-800/40 rounded p-2">
                        <Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-400">{f.suggestedAction}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Debt Trend */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Debt Trend</h2>
          <span className="ml-auto text-xs text-emerald-400 font-medium">-45% over 6 months</span>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-4 h-40">
            {debtTrend.map((d, i) => {
              const barHeight = (d.score / 80) * 140
              const isLatest = i === debtTrend.length - 1
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isLatest ? 'text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {d.score}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isLatest
                          ? 'bg-gradient-to-t from-red-600 to-red-400'
                          : d.score > 50
                          ? 'bg-gradient-to-t from-red-600/30 to-red-400/30'
                          : 'bg-gradient-to-t from-amber-600/30 to-amber-400/30'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.month}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            Score decreased from 62 → 34 — consistent improvement from nightly cleanups
          </div>
        </div>
      </div>

      {/* Auto-fix Queue */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Wrench className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Auto-fix Queue</h2>
          <span className="ml-auto text-xs text-slate-500">{autoFixQueue.length} items safe to auto-fix</span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {autoFixQueue.map((item, i) => (
            <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{item.reason}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                    Low risk
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-500">{item.action}</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                  <Wrench className="w-3 h-3" />
                  Auto-fix
                </button>
              </div>
            </div>
          ))}
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
                <Icon className="w-4 h-4 text-red-400/60" />
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
