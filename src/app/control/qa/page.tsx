'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import {
  Shield, Monitor, Code, MousePointer, Type, Gauge,
  Search, Eye, Lock, RotateCcw, CheckCircle2,
  AlertTriangle, AlertCircle, Info, Clock, Activity,
  Play, RefreshCw, ChevronRight, Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info'
type QaStatus = 'passing' | 'warning' | 'failing'

interface QaDimension {
  name: string
  icon: React.ElementType
  score: number
  status: QaStatus
  lastChecked: string
  description: string
}

interface ActiveCheck {
  id: string
  name: string
  dimension: string
  progress: number
  startedAgo: string
}

interface Issue {
  id: string
  title: string
  severity: Severity
  dimension: string
  detected: string
  description: string
}

// ─── Mock Data ───────────────────────────────────────────

const qaDimensions: QaDimension[] = [
  { name: 'UI', icon: Monitor, score: 94, status: 'passing', lastChecked: '2m ago', description: 'Visual consistency & component health' },
  { name: 'API', icon: Code, score: 97, status: 'passing', lastChecked: '5m ago', description: 'Endpoint correctness & response codes' },
  { name: 'UX', icon: MousePointer, score: 91, status: 'passing', lastChecked: '3m ago', description: 'User flow & interaction patterns' },
  { name: 'Copy', icon: Type, score: 88, status: 'passing', lastChecked: '12m ago', description: 'Content quality & brand voice' },
  { name: 'Performance', icon: Gauge, score: 78, status: 'warning', lastChecked: '1m ago', description: 'Load times & resource optimization' },
  { name: 'SEO', icon: Search, score: 93, status: 'passing', lastChecked: '8m ago', description: 'Meta tags, schema & crawlability' },
  { name: 'Accessibility', icon: Eye, score: 72, status: 'warning', lastChecked: '4m ago', description: 'WCAG compliance & screen readers' },
  { name: 'Security', icon: Lock, score: 96, status: 'passing', lastChecked: '15m ago', description: 'Headers, CORS & vulnerability scan' },
  { name: 'Regression', icon: RotateCcw, score: 99, status: 'passing', lastChecked: '6m ago', description: 'Previously fixed issues stay fixed' },
]

const activeChecks: ActiveCheck[] = [
  { id: 'ac-1', name: 'Lighthouse Performance Audit', dimension: 'Performance', progress: 67, startedAgo: '45s ago' },
  { id: 'ac-2', name: 'WCAG 2.1 AA Scan', dimension: 'Accessibility', progress: 34, startedAgo: '1m ago' },
  { id: 'ac-3', name: 'API Response Validation', dimension: 'API', progress: 89, startedAgo: '30s ago' },
  { id: 'ac-4', name: 'Visual Regression Diff', dimension: 'UI', progress: 12, startedAgo: '2m ago' },
]

const recentIssues: Issue[] = [
  { id: 'iss-1', title: 'LCP exceeds 4s on /pricing', severity: 'critical', dimension: 'Performance', detected: '1m ago', description: 'Largest Contentful Paint is 4.2s — threshold is 2.5s. Hero image unoptimized.' },
  { id: 'iss-2', title: 'Missing alt text on 3 images', severity: 'warning', dimension: 'Accessibility', detected: '4m ago', description: 'Images in Observatory section lack alt attributes. WCAG 1.1.1 violation.' },
  { id: 'iss-3', title: 'Color contrast ratio low on /os', severity: 'warning', dimension: 'Accessibility', detected: '4m ago', description: 'Slate-500 text on slate-900 background fails AA contrast ratio (3.8:1, needs 4.5:1).' },
  { id: 'iss-4', title: 'Unused CSS on homepage bundle', severity: 'info', dimension: 'Performance', detected: '10m ago', description: '142KB of unused CSS detected in main bundle. Consider tree-shaking.' },
  { id: 'iss-5', title: 'Missing aria-labels on nav buttons', severity: 'warning', dimension: 'Accessibility', detected: '4m ago', description: 'Mobile hamburger and sidebar toggle lack aria-label attributes.' },
  { id: 'iss-6', title: 'H1 duplicate on /engagement', severity: 'info', dimension: 'SEO', detected: '25m ago', description: 'Two H1 tags found. Consider using H2 for the secondary heading.' },
  { id: 'iss-7', title: 'CLS 0.18 on /observatory', severity: 'warning', dimension: 'Performance', detected: '30m ago', description: 'Cumulative Layout Shift above 0.1 threshold. Caused by late-loading fonts.' },
]

// ─── Helpers ─────────────────────────────────────────────

const overallScore = Math.round(
  qaDimensions.reduce((sum, d) => sum + d.score, 0) / qaDimensions.length
)

function statusColor(status: QaStatus): string {
  switch (status) {
    case 'passing': return 'text-emerald-400'
    case 'warning': return 'text-amber-400'
    case 'failing': return 'text-red-400'
  }
}

function statusBg(status: QaStatus): string {
  switch (status) {
    case 'passing': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    case 'warning': return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    case 'failing': return 'bg-red-500/15 text-red-400 border-red-500/20'
  }
}

function barColor(status: QaStatus): string {
  switch (status) {
    case 'passing': return 'bg-emerald-500'
    case 'warning': return 'bg-amber-500'
    case 'failing': return 'bg-red-500'
  }
}

function severityConfig(severity: Severity) {
  switch (severity) {
    case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: AlertCircle, label: 'Critical' }
    case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Warning' }
    case 'info': return { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20', icon: Info, label: 'Info' }
  }
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 75) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Circular Gauge Component ────────────────────────────

function CircularGauge({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  const gaugeColor = score >= 90 ? '#34d399' : score >= 75 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
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
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function QAEnginePage() {
  const mounted = useHydrated()
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  useEffect(() => {
    if (animationStarted.current) return
    animationStarted.current = true
    // Animate the score counter
    let current = 0
    const target = overallScore
    const step = Math.ceil(target / 40)
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      setAnimatingScore(current)
    }, 25)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  const passingCount = qaDimensions.filter(d => d.status === 'passing').length
  const warningCount = qaDimensions.filter(d => d.status === 'warning').length
  const failingCount = qaDimensions.filter(d => d.status === 'failing').length
  const criticalIssues = recentIssues.filter(i => i.severity === 'critical').length
  const warningIssues = recentIssues.filter(i => i.severity === 'warning').length

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Engine</h1>
            <p className="text-slate-400 text-sm">Quality across 9 dimensions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Running</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run All
          </button>
        </div>
      </div>

      {/* ─── Overall Score + Stats Banner ─────────────────── */}
      <div className="bg-gradient-to-br from-blue-500/5 via-slate-900 to-slate-900 border border-blue-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular Gauge */}
          <div className="flex-shrink-0">
            <CircularGauge score={animatingScore} size={180} />
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{passingCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Passing</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Warning</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{failingCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Failing</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{qaDimensions.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Dimensions</div>
            </div>
          </div>

          {/* Issue summary */}
          <div className="flex-shrink-0 space-y-2 text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Open Issues</div>
            <div className="flex items-center justify-end gap-3">
              <span className="flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-semibold">{criticalIssues}</span>
                <span className="text-slate-500">critical</span>
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-semibold">{warningIssues}</span>
                <span className="text-slate-500">warnings</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 9 Dimension Cards (3x3 Grid) ───────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Quality Dimensions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qaDimensions.map((dim) => {
            const Icon = dim.icon
            return (
              <div
                key={dim.name}
                className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-600 transition-all duration-200 group cursor-default ${
                  dim.status === 'warning' ? 'border-amber-500/20' : 'border-slate-800'
                }`}
              >
                {/* Top row: icon + name + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      dim.status === 'passing' ? 'bg-blue-500/10' :
                      dim.status === 'warning' ? 'bg-amber-500/10' :
                      'bg-red-500/10'
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${
                        dim.status === 'passing' ? 'text-blue-400' :
                        dim.status === 'warning' ? 'text-amber-400' :
                        'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{dim.name}</div>
                      <div className="text-[11px] text-slate-500">{dim.description}</div>
                    </div>
                  </div>
                  {/* Score */}
                  <div className={`text-2xl font-bold ${scoreColor(dim.score)}`}>
                    {dim.score}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${barColor(dim.status)} transition-all duration-700 ease-out`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>

                {/* Bottom row: status badge + last checked */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${statusBg(dim.status)}`}>
                    {dim.status === 'passing' && <CheckCircle2 className="w-3 h-3" />}
                    {dim.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                    {dim.status === 'failing' && <AlertCircle className="w-3 h-3" />}
                    {dim.status.charAt(0).toUpperCase() + dim.status.slice(1)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {dim.lastChecked}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Bottom Row: Active Checks + Recent Issues ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Active Checks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-400" />
            Active Checks
            <span className="ml-auto text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {activeChecks.length} running
            </span>
          </h2>
          <div className="space-y-4">
            {activeChecks.map((check) => (
              <div key={check.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-xs font-medium text-white">{check.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{check.progress}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${check.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{check.dimension}</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock className="w-3 h-3" />
                    {check.startedAgo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Recent Issues
            <span className="ml-auto text-[10px] text-slate-400">{recentIssues.length} found</span>
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {recentIssues.map((issue) => {
              const sev = severityConfig(issue.severity)
              const SevIcon = sev.icon
              return (
                <div
                  key={issue.id}
                  className={`rounded-lg border p-3 ${sev.bg} ${sev.border} transition-colors hover:brightness-110`}
                >
                  <div className="flex items-start gap-2.5">
                    <SevIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sev.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-white truncate">{issue.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">{issue.description}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-medium ${sev.color}`}>
                          {sev.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {issue.dimension}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <Clock className="w-2.5 h-2.5" />
                          {issue.detected}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Quick Actions Footer ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Next full scan: <span className="text-slate-300">06:00 UTC</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Last full scan: <span className="text-slate-300">5h 42m ago</span></span>
        <span className="text-slate-700">|</span>
        <span>Total checks today: <span className="text-slate-300">847</span></span>
        <span className="text-slate-700">|</span>
        <span>Pass rate: <span className="text-emerald-400">98.2%</span></span>
      </div>
    </div>
  )
}
