'use client'

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
} from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────

const memoryScore = 87

const memoryStats = [
  { label: 'Changes Tracked', value: '1,247', icon: Activity, color: 'text-indigo-400' },
  { label: 'Patterns Discovered', value: '23', icon: Brain, color: 'text-purple-400' },
  { label: 'Prediction Accuracy', value: '84%', icon: Target, color: 'text-violet-400' },
  { label: 'Rollback Patterns', value: '7', icon: RotateCcw, color: 'text-fuchsia-400' },
]

type RiskLevel = 'high' | 'medium' | 'low'

interface Pattern {
  description: string
  confidence: number
  occurrences: number
  lastSeen: string
  risk: RiskLevel
}

const knownPatterns: Pattern[] = [
  {
    description: 'Hero.tsx changes → CTA conversion drops 3-5% within 24h',
    confidence: 91,
    occurrences: 8,
    lastSeen: '2 days ago',
    risk: 'high',
  },
  {
    description: 'AI Router modifications → Mission Control must be re-tested',
    confidence: 96,
    occurrences: 5,
    lastSeen: '5 days ago',
    risk: 'high',
  },
  {
    description: 'New floating widgets → increase bundle by 80-120KB',
    confidence: 88,
    occurrences: 4,
    lastSeen: '1 week ago',
    risk: 'medium',
  },
  {
    description: 'Pricing page edits → no measurable impact on conversion',
    confidence: 72,
    occurrences: 6,
    lastSeen: '3 days ago',
    risk: 'low',
  },
  {
    description: 'FAQ schema additions → AI citation rate +12-18%',
    confidence: 94,
    occurrences: 11,
    lastSeen: '1 day ago',
    risk: 'low',
  },
  {
    description: 'Observatory API changes → replay engine must recalibrate',
    confidence: 85,
    occurrences: 3,
    lastSeen: '4 days ago',
    risk: 'medium',
  },
  {
    description: 'Engagement system updates → streak calculation fragile',
    confidence: 82,
    occurrences: 4,
    lastSeen: '6 days ago',
    risk: 'medium',
  },
  {
    description: 'Database schema changes → always run migration dry-run first',
    confidence: 98,
    occurrences: 9,
    lastSeen: '12 hours ago',
    risk: 'high',
  },
]

const riskConfig: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'High' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Medium' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Low' },
}

interface ChangeChain {
  name: string
  files: string[]
  tests: { passed: number; total: number }
  outcome: string
  outcomeType: 'positive' | 'negative' | 'neutral'
  rolledBack: boolean
  performance: string
  perfType: 'positive' | 'negative' | 'neutral'
  confidenceDirection: 'up' | 'down'
}

const changeChains: ChangeChain[] = [
  {
    name: 'AI Advisor Widget',
    files: ['Hero.tsx', 'FloatingAdvisor.tsx'],
    tests: { passed: 12, total: 12 },
    outcome: 'Conversion +2%',
    outcomeType: 'positive',
    rolledBack: false,
    performance: 'LCP +0.1s',
    perfType: 'neutral',
    confidenceDirection: 'up',
  },
  {
    name: 'Pricing Accessibility Fix',
    files: ['pricing-page-client.tsx'],
    tests: { passed: 8, total: 8 },
    outcome: 'A11y 72→94',
    outcomeType: 'positive',
    rolledBack: false,
    performance: 'No perf impact',
    perfType: 'neutral',
    confidenceDirection: 'up',
  },
  {
    name: 'Chat Widget (PR #41)',
    files: ['ChatWidget.tsx'],
    tests: { passed: 6, total: 10 },
    outcome: 'Bounce +12%',
    outcomeType: 'negative',
    rolledBack: true,
    performance: 'CLS +0.3',
    perfType: 'negative',
    confidenceDirection: 'down',
  },
  {
    name: 'FAQ Schema v3',
    files: ['faq-schema.ts', 'api/citations/route.ts'],
    tests: { passed: 15, total: 15 },
    outcome: 'AI Citation +15%',
    outcomeType: 'positive',
    rolledBack: false,
    performance: 'No perf impact',
    perfType: 'neutral',
    confidenceDirection: 'up',
  },
]

interface Prediction {
  trigger: string
  prediction: string
  confidence: number
  recommendation: string
  recType: 'warning' | 'action' | 'info'
}

const predictions: Prediction[] = [
  {
    trigger: "You're about to modify Hero.tsx",
    prediction: '91% chance CTA drops',
    confidence: 91,
    recommendation: 'A/B test first',
    recType: 'warning',
  },
  {
    trigger: "You're adding a new floating component",
    prediction: '88% chance bundle exceeds 100KB budget',
    confidence: 88,
    recommendation: 'Lazy load',
    recType: 'action',
  },
  {
    trigger: "You're editing the engagement system",
    prediction: '82% chance streak calc breaks',
    confidence: 82,
    recommendation: 'Add streak-specific unit tests',
    recType: 'warning',
  },
  {
    trigger: "You're changing DB schema",
    prediction: '98% chance migration needed',
    confidence: 98,
    recommendation: 'Run dry-run first',
    recType: 'action',
  },
]

const recTypeConfig: Record<string, { bg: string; text: string; border: string }> = {
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  action: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  info: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
}

type HeatLevel = 'hot' | 'warm' | 'cool'

interface FileHeat {
  name: string
  heat: HeatLevel
  totalChanges: number
  issuesCaused: number
}

const fileHeatmap: FileHeat[] = [
  { name: 'Hero.tsx', heat: 'hot', totalChanges: 8, issuesCaused: 5 },
  { name: 'AI Router', heat: 'hot', totalChanges: 5, issuesCaused: 4 },
  { name: 'Observatory API', heat: 'warm', totalChanges: 7, issuesCaused: 2 },
  { name: 'Pricing page', heat: 'cool', totalChanges: 6, issuesCaused: 0 },
  { name: 'FAQ Schema', heat: 'cool', totalChanges: 11, issuesCaused: 0 },
]

const heatConfig: Record<HeatLevel, { color: string; label: string; glow: string; bg: string }> = {
  hot: { color: 'text-red-400', label: 'Hot', glow: 'shadow-red-500/20', bg: 'bg-red-500/15' },
  warm: { color: 'text-amber-400', label: 'Warm', glow: 'shadow-amber-500/10', bg: 'bg-amber-500/10' },
  cool: { color: 'text-emerald-400', label: 'Cool', glow: '', bg: 'bg-emerald-500/10' },
}

// ── SVG Gauge ──────────────────────────────────────────────

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

// ── Chain Step ─────────────────────────────────────────────

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

// ── Main Page ──────────────────────────────────────────────

export default function EngineeringMemoryPage() {
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
          <span className="text-[10px] text-slate-500">6 months of data</span>
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
            {knownPatterns.length} patterns discovered
          </span>
        </div>
        <div className="max-h-[40rem] overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-800/50">
            {knownPatterns.map((p, i) => {
              const risk = riskConfig[p.risk]
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
                          <span>{p.lastSeen}</span>
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
          {changeChains.map((chain, i) => {
            const testsOk = chain.tests.passed === chain.tests.total
            return (
              <div
                key={i}
                className={`rounded-lg border p-4 ${
                  chain.rolledBack
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-slate-700/50 bg-slate-800/30'
                }`}
              >
                {/* Chain name */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-white">{chain.name}</span>
                  {chain.rolledBack && (
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
                      {chain.files.join(', ')}
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
                      {chain.tests.passed}/{chain.tests.total} tests
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Outcome */}
                  <ChainStep type={chain.outcomeType}>
                    {chain.outcomeType === 'positive' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : chain.outcomeType === 'negative' ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : null}
                    <span>{chain.outcome}</span>
                  </ChainStep>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Rollback */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border ${
                      chain.rolledBack
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {chain.rolledBack ? (
                      <RotateCcw className="w-3 h-3" />
                    ) : (
                      <Shield className="w-3 h-3" />
                    )}
                    <span>{chain.rolledBack ? 'Rolled Back' : 'No Rollback'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Performance */}
                  <ChainStep type={chain.perfType}>
                    <Zap className="w-3 h-3" />
                    <span>{chain.performance}</span>
                  </ChainStep>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  {/* Confidence */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border ${
                      chain.confidenceDirection === 'up'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {chain.confidenceDirection === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>Confidence {chain.confidenceDirection === 'up' ? '↑' : '↓'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. Prediction Engine ───────────────────────────── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Eye className="w-4 h-4 text-fuchsia-400" />
          <h2 className="text-sm font-semibold text-white">Prediction Engine</h2>
          <span className="ml-auto text-xs text-slate-500">
            Pre-change risk assessment
          </span>
        </div>
        <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-800/50">
            {predictions.map((pred, i) => {
              const rec = recTypeConfig[pred.recType]
              return (
                <div key={i} className="p-5 hover:bg-slate-800/20 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-1">
                        {pred.trigger}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Prediction */}
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-300">{pred.prediction}</span>
                        </div>
                        {/* Confidence pill */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Confidence
                          </span>
                          <span className="text-xs font-mono text-indigo-300">
                            {pred.confidence}%
                          </span>
                        </div>
                        {/* Recommendation badge */}
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${rec.bg} border ${rec.border}`}
                        >
                          <Lightbulb className={`w-3 h-3 ${rec.text}`} />
                          <span className={`text-xs font-medium ${rec.text}`}>
                            {pred.recommendation}
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
      </div>

      {/* ── 6. File Heatmap ────────────────────────────────── */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Flame className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-white">File Heatmap</h2>
          <span className="ml-auto text-xs text-slate-500">Fragility index</span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {fileHeatmap.map((file, i) => {
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
      </div>

      {/* ── 7. Footer ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Memory since', value: 'Aug 2024', icon: Clock },
          { label: 'Total patterns', value: '23', icon: Brain },
          { label: 'Avg prediction accuracy', value: '84%', icon: Target },
          { label: 'Data points', value: '14,892', icon: BarChart3 },
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
