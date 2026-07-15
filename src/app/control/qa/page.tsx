'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Shield, Monitor, Code, MousePointer, Type, Gauge,
  Search, Eye, Lock, RotateCcw, CheckCircle2,
  AlertTriangle, AlertCircle, Info, Clock, Activity,
  RefreshCw, ChevronRight, Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type QaStatus = 'passing' | 'warning' | 'failing'

interface QAData {
  hasData: boolean
  message?: string
  run?: {
    id: string
    productScore: number
    uxScore: number
    engineeringScore: number
    securityScore: number
    performanceScore: number
    seoScore: number
    accessibilityScore: number
    conversionScore: number
    customerDelight: number
    technicalDebt: number
    criticalCount: number
    majorCount: number
    mediumCount: number
    minorCount: number
    completedAt: string
    status: string
    [key: string]: unknown
  }
  issueCounts?: {
    critical: number
    major: number
    medium: number
    minor: number
    total: number
  }
  issueStatusCounts?: Array<{ status: string; count: number }>
  issueCategoryCounts?: Array<{ category: string; count: number }>
  recentIssues?: Array<{
    id: string
    title: string
    severity: string
    category: string
    status: string
    description: string | null
    createdAt: string
    [key: string]: unknown
  }>
  scoreTrend?: Array<{
    date: string
    productScore: number
    totalIssues: number
    [key: string]: unknown
  }>
  healthScore?: number
  scoreDelta?: number
  openCriticalMajor?: number
}

// ─── Dimension mapping ───────────────────────────────────

const DIMENSION_CONFIG = [
  { key: 'productScore', name: 'Product', icon: Shield, description: 'Overall product health' },
  { key: 'uxScore', name: 'UX', icon: MousePointer, description: 'User experience & flows' },
  { key: 'engineeringScore', name: 'Engineering', icon: Code, description: 'Code quality & stability' },
  { key: 'securityScore', name: 'Security', icon: Lock, description: 'Headers, CORS & vulnerabilities' },
  { key: 'performanceScore', name: 'Performance', icon: Gauge, description: 'Load times & optimization' },
  { key: 'seoScore', name: 'SEO', icon: Search, description: 'Meta tags, schema & crawlability' },
  { key: 'accessibilityScore', name: 'Accessibility', icon: Eye, description: 'WCAG compliance & screen readers' },
  { key: 'conversionScore', name: 'Conversion', icon: Type, description: 'Funnel & call-to-action quality' },
  { key: 'customerDelight', name: 'Delight', icon: Activity, description: 'User satisfaction & engagement' },
]

// ─── Helpers ─────────────────────────────────────────────

function getScoreForDimension(run: QAData['run'], key: string): number {
  if (!run) return 0
  return (run[key as keyof typeof run] as number) ?? 0
}

function scoreToStatus(score: number): QaStatus {
  if (score >= 90) return 'passing'
  if (score >= 75) return 'warning'
  return 'failing'
}

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

function severityConfig(severity: string) {
  switch (severity) {
    case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: AlertCircle, label: 'Critical' }
    case 'major': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Major' }
    case 'medium': return { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20', icon: Info, label: 'Medium' }
    case 'minor': return { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/20', icon: Info, label: 'Minor' }
    default: return { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/20', icon: Info, label: severity }
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
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function QAEnginePage() {
  const [data, setData] = useState<QAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        // Derive QA data from unified response
        const qaRun = json.latestQA || json.productQA || null
        const derived: QAData = qaRun
          ? {
              hasData: true,
              run: qaRun,
              issueCounts: {
                critical: qaRun.criticalCount ?? 0,
                major: qaRun.majorCount ?? 0,
                medium: qaRun.mediumCount ?? 0,
                minor: qaRun.minorCount ?? 0,
                total: (qaRun.criticalCount ?? 0) + (qaRun.majorCount ?? 0) + (qaRun.mediumCount ?? 0) + (qaRun.minorCount ?? 0),
              },
              issueCategoryCounts: [],
              recentIssues: [],
              healthScore: qaRun.productScore ?? 0,
              scoreDelta: qaRun.scoreDelta ?? 0,
              openCriticalMajor: (qaRun.criticalCount ?? 0) + (qaRun.majorCount ?? 0),
            }
          : { hasData: false, message: 'No completed QA runs found. Run the QA Engine to generate quality scores and issue reports.' }
        setData(derived)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Animate score when data loads
  useEffect(() => {
    if (!data?.hasData || !data.healthScore || animationStarted.current) return
    animationStarted.current = true
    let current = 0
    const target = data.healthScore
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
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QA Engine</h1>
              <p className="text-slate-400 text-sm">Quality analysis</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
          <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Engine</h1>
            <p className="text-slate-400 text-sm">Quality analysis</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">Failed to load QA data</p>
          <p className="text-slate-500 text-xs mt-1">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); setData(null); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No QA data yet
  if (!data?.hasData) {
    return (
      <div className="space-y-6">
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
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No QA Data Yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {data?.message || 'No completed QA runs found. Run the QA Engine to generate quality scores and issue reports.'}
          </p>
        </div>
      </div>
    )
  }

  const dimensions = DIMENSION_CONFIG.map(dim => {
    const score = getScoreForDimension(data.run, dim.key)
    return {
      ...dim,
      score,
      status: scoreToStatus(score),
      lastChecked: new Date(data.run!.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  })

  const overallScore = data.healthScore ?? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
  const displayScore = animatingScore || overallScore
  const passingCount = dimensions.filter(d => d.status === 'passing').length
  const warningCount = dimensions.filter(d => d.status === 'warning').length
  const failingCount = dimensions.filter(d => d.status === 'failing').length
  const criticalIssues = data.issueCounts?.critical ?? 0
  const majorIssues = data.issueCounts?.major ?? 0

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
            <p className="text-slate-400 text-sm">Quality across {dimensions.length} dimensions</p>
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
          <div className="flex-shrink-0">
            <CircularGauge score={displayScore} size={180} />
          </div>
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
              <div className="text-2xl font-bold text-white">{dimensions.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Dimensions</div>
            </div>
          </div>
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
                <span className="text-amber-400 font-semibold">{majorIssues}</span>
                <span className="text-slate-500">major</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Dimension Cards ───────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Quality Dimensions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map((dim) => {
            const Icon = dim.icon
            return (
              <div
                key={dim.name}
                className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-600 transition-all duration-200 group cursor-default ${
                  dim.status === 'warning' ? 'border-amber-500/20' : dim.status === 'failing' ? 'border-red-500/20' : 'border-slate-800'
                }`}
              >
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
                  <div className={`text-2xl font-bold ${scoreColor(dim.score)}`}>{dim.score}</div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${barColor(dim.status)} transition-all duration-700 ease-out`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
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

      {/* ─── Bottom Row: Issue Categories + Recent Issues ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issue Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-400" />
            Issues by Category
          </h2>
          {data.issueCategoryCounts && data.issueCategoryCounts.length > 0 ? (
            <div className="space-y-3">
              {data.issueCategoryCounts.map((cat) => (
                <div key={cat.category} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white capitalize">{cat.category}</div>
                  </div>
                  <div className="text-sm font-bold text-slate-200">{cat.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No issues by category</p>
            </div>
          )}

          {/* Severity breakdown */}
          {data.issueCounts && (
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{data.issueCounts.critical}</div>
                <div className="text-[10px] text-slate-500 uppercase">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{data.issueCounts.major}</div>
                <div className="text-[10px] text-slate-500 uppercase">Major</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{data.issueCounts.medium}</div>
                <div className="text-[10px] text-slate-500 uppercase">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-400">{data.issueCounts.minor}</div>
                <div className="text-[10px] text-slate-500 uppercase">Minor</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Recent Issues
            <span className="ml-auto text-[10px] text-slate-400">{data.recentIssues?.length ?? 0} found</span>
          </h2>
          {data.recentIssues && data.recentIssues.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {data.recentIssues.map((issue) => {
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
                        {issue.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">{issue.description}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-medium ${sev.color}`}>{sev.label}</span>
                          <span className="text-[10px] text-slate-500 capitalize">{issue.category}</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-600">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(issue.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No issues found — all clear!</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Quick Actions Footer ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Next full scan: <span className="text-slate-300">06:00 UTC</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Last run: <span className="text-slate-300">{data.run?.completedAt ? new Date(data.run.completedAt).toLocaleString() : 'N/A'}</span></span>
        <span className="text-slate-700">|</span>
        <span>Total issues: <span className="text-slate-300">{data.issueCounts?.total ?? 0}</span></span>
        <span className="text-slate-700">|</span>
        <span>Pass rate: <span className="text-emerald-400">{data.run?.productScore ?? 0}%</span></span>
      </div>
    </div>
  )
}
