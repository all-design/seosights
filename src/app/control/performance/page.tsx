'use client'

import { useEffect, useState } from 'react'
import {
  Gauge, Activity, Clock, Cpu, HardDrive, Zap,
  CheckCircle2, AlertTriangle, AlertCircle, TrendingUp,
  TrendingDown, ArrowRight, RefreshCw, Package,
  Code2, BarChart3, Image, FileCode, Timer,
  Server, MemoryStick, Wifi, ArrowUpRight, Database,
} from 'lucide-react'

// ─── Circular Gauge Component ────────────────────────────

function CircularGauge({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  const gaugeColor = score >= 90 ? '#f97316' : score >= 75 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${score >= 90 ? 'text-orange-400' : score >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
          {score}
        </span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────

function vitalStatusColor(status: string): string {
  switch (status) {
    case 'good': return 'text-emerald-400'
    case 'needs-improvement': return 'text-amber-400'
    case 'poor': return 'text-red-400'
    default: return 'text-slate-400'
  }
}

function vitalStatusLabel(status: string): string {
  switch (status) {
    case 'good': return 'Good'
    case 'needs-improvement': return 'Needs Improvement'
    case 'poor': return 'Poor'
    default: return 'Unknown'
  }
}

function vitalBarColor(status: string): string {
  switch (status) {
    case 'good': return 'bg-emerald-500'
    case 'needs-improvement': return 'bg-amber-500'
    case 'poor': return 'bg-red-500'
    default: return 'bg-slate-500'
  }
}

function vitalRangeBg(status: string, zone: 'good' | 'needsImprovement' | 'poor'): string {
  switch (zone) {
    case 'good': return 'bg-emerald-500/20'
    case 'needsImprovement': return status === 'poor' ? 'bg-red-500/20' : 'bg-amber-500/20'
    case 'poor': return 'bg-red-500/20'
  }
}

function scoreToVitalStatus(score: number): 'good' | 'needs-improvement' | 'poor' {
  if (score >= 90) return 'good'
  if (score >= 50) return 'needs-improvement'
  return 'poor'
}

// ─── Vital Range Bar ─────────────────────────────────────

function VitalRangeBar({ vital }: { vital: { name: string; abbr: string; value: string; numericValue: number; status: string; description: string; ranges: { good: number; needsImprovement: number; poor: number } } }) {
  const maxVal = vital.ranges.poor * 1.5 || vital.ranges.needsImprovement * 1.5
  const goodEnd = vital.ranges.good
  const niEnd = vital.ranges.needsImprovement

  const goodPct = (goodEnd / maxVal) * 100
  const niPct = ((niEnd - goodEnd) / maxVal) * 100
  const poorPct = 100 - goodPct - niPct

  const markerPct = Math.min((vital.numericValue / maxVal) * 100, 100)

  return (
    <div className="mt-3">
      <div className="flex h-2.5 rounded-full overflow-hidden">
        <div className={`${vitalRangeBg(vital.status, 'good')} flex-shrink-0`} style={{ width: `${goodPct}%` }} />
        <div className={`${vitalRangeBg(vital.status, 'needsImprovement')} flex-shrink-0`} style={{ width: `${niPct}%` }} />
        <div className={`${vitalRangeBg(vital.status, 'poor')} flex-shrink-0`} style={{ width: `${poorPct}%` }} />
      </div>
      <div className="relative h-0" style={{ marginLeft: `${markerPct}%` }}>
        <div className={`absolute -top-3.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${vitalBarColor(vital.status)} border-2 border-slate-900`} />
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-slate-600">
        <span>0</span>
        <span className="text-emerald-600">Good ≤{vital.ranges.good}{vital.abbr === 'CLS' ? '' : vital.abbr === 'FID' || vital.abbr === 'INP' ? 'ms' : 's'}</span>
        <span className="text-amber-600">NI ≤{vital.ranges.needsImprovement}{vital.abbr === 'CLS' ? '' : vital.abbr === 'FID' || vital.abbr === 'INP' ? 'ms' : 's'}</span>
        <span>Poor</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function PerformanceEnginePage() {
  const [systemData, setSystemData] = useState<any>(null)
  const [perfData, setPerfData] = useState<any>(null)
  const [qaData, setQaData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auditing, setAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<any>(null)
  const [auditError, setAuditError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        if (json.systemStatus) setSystemData(json.systemStatus)
        if (json.performance) setPerfData(json.performance)
        const qaRun = json.productQA || json.factory?.latestQA
        if (qaRun) {
          setQaData({
            hasData: true,
            run: qaRun,
            healthScore: qaRun.productScore ?? 0,
            issueCounts: {
              critical: qaRun.criticalCount ?? 0,
              major: qaRun.majorCount ?? 0,
              medium: qaRun.mediumCount ?? 0,
              minor: qaRun.minorCount ?? 0,
              total: (qaRun.criticalCount ?? 0) + (qaRun.majorCount ?? 0) + (qaRun.mediumCount ?? 0) + (qaRun.minorCount ?? 0),
            },
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

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
      </div>
    )
  }

  // ─── Error ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  // ─── Derived data ───────────────────────────────────────
  const components = systemData?.components || {}
  const hasQA = qaData?.hasData === true
  const qaRun = qaData?.run || null
  const healthScore = qaData?.healthScore || 0

  // Performance scores from json.performance.scores
  const perfScores = perfData?.scores || null
  const webVitals = perfData?.webVitals || null
  const lastRun = perfData?.lastRun || null

  // Overall score from performance scores
  const overallScore = perfScores
    ? Math.round(((perfScores.performance ?? 0) + (perfScores.seo ?? 0) + (perfScores.accessibility ?? 0) + (perfScores.ux ?? 0)) / 4)
    : hasQA
      ? (qaRun.performanceScore || 0)
      : (
        Object.values(components).length > 0
          ? Math.round(Object.values(components).filter((c: any) => c.status === 'ok').length / Object.values(components).length * 100)
          : 0
      )

  // Build core vitals from json.performance.scores (prefer real data) then QA run
  const coreVitals = perfScores ? [
    {
      name: 'Performance Score',
      abbr: 'PERF',
      value: `${perfScores.performance ?? 0}`,
      numericValue: perfScores.performance ?? 0,
      status: scoreToVitalStatus(perfScores.performance ?? 0),
      description: 'Overall performance rating',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
    {
      name: 'SEO Score',
      abbr: 'SEO',
      value: `${perfScores.seo ?? 0}`,
      numericValue: perfScores.seo ?? 0,
      status: scoreToVitalStatus(perfScores.seo ?? 0),
      description: 'Search engine optimization score',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
    {
      name: 'Accessibility Score',
      abbr: 'A11Y',
      value: `${perfScores.accessibility ?? 0}`,
      numericValue: perfScores.accessibility ?? 0,
      status: scoreToVitalStatus(perfScores.accessibility ?? 0),
      description: 'Web accessibility compliance score',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
    {
      name: 'UX Score',
      abbr: 'UX',
      value: `${perfScores.ux ?? 0}`,
      numericValue: perfScores.ux ?? 0,
      status: scoreToVitalStatus(perfScores.ux ?? 0),
      description: 'User experience quality score',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
  ] : hasQA ? [
    {
      name: 'Performance Score',
      abbr: 'PERF',
      value: `${qaRun.performanceScore || 0}`,
      numericValue: qaRun.performanceScore || 0,
      status: scoreToVitalStatus(qaRun.performanceScore || 0),
      description: 'Overall performance rating from QA analysis',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
    {
      name: 'SEO Score',
      abbr: 'SEO',
      value: `${qaRun.seoScore || 0}`,
      numericValue: qaRun.seoScore || 0,
      status: scoreToVitalStatus(qaRun.seoScore || 0),
      description: 'Search engine optimization score',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
    {
      name: 'Accessibility Score',
      abbr: 'A11Y',
      value: `${qaRun.accessibilityScore || 0}`,
      numericValue: qaRun.accessibilityScore || 0,
      status: scoreToVitalStatus(qaRun.accessibilityScore || 0),
      description: 'Web accessibility compliance score',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
    {
      name: 'UX Score',
      abbr: 'UX',
      value: `${qaRun.uxScore || 0}`,
      numericValue: qaRun.uxScore || 0,
      status: scoreToVitalStatus(qaRun.uxScore || 0),
      description: 'User experience quality score',
      ranges: { good: 90, needsImprovement: 50, poor: 50 },
    },
  ] : []

  // Build budget items from system components
  const budgetItems = Object.entries(components).map(([name, c]: [string, any]) => ({
    name: name === 'aiRouter' ? 'AI Router' : name === 'database' ? 'Database' : name.charAt(0).toUpperCase() + name.slice(1),
    current: c.latency ?? 0,
    budget: 500,
    unit: 'ms',
    icon: name === 'database' ? Database : name === 'aiRouter' ? Server : name === 'redis' ? Activity : Clock,
  }))

  // Build slow endpoints from degraded components
  const slowEndpoints = Object.entries(components)
    .filter(([, c]: [string, any]) => (c.latency ?? 0) > 300 || c.status === 'degraded' || c.status === 'down')
    .map(([name, c]: [string, any]) => ({
      route: `/api/${name === 'aiRouter' ? 'ai-router' : name}`,
      currentMs: c.latency ?? 0,
      targetMs: 300,
      status: (c.latency ?? 0) > 500 || c.status === 'down' ? 'critical' as const : 'warning' as const,
      trend: 'stable' as const,
    }))

  // Build optimizations from performance lastRun or webVitals
  const recentOptimizations: Array<{ id: string; description: string; impact: string; ago: string }> = []
  if (lastRun) {
    const runDate = lastRun.completedAt || lastRun.createdAt || lastRun.timestamp
    recentOptimizations.push({
      id: 'perf-lastrun',
      description: `Last performance audit completed with overall score ${overallScore}`,
      impact: overallScore >= 80 ? 'Healthy' : overallScore >= 50 ? 'Needs Improvement' : 'Poor',
      ago: runDate ? new Date(runDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent',
    })
  }
  if (webVitals && typeof webVitals === 'object') {
    const vitalsEntries = Object.entries(webVitals)
    if (vitalsEntries.length > 0) {
      recentOptimizations.push({
        id: 'perf-webvitals',
        description: `Web Vitals data available: ${vitalsEntries.map(([k]) => k.toUpperCase()).join(', ')}`,
        impact: 'Measured',
        ago: 'Latest',
      })
    }
  }

  // ─── Empty state ────────────────────────────────────────
  const hasNoData = !hasQA && !perfScores && Object.keys(components).length === 0

  const handleAudit = async () => {
    setAuditing(true)
    setAuditError(null)
    try {
      const res = await fetch('/api/control/performance/audit', { method: 'POST' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || errData.details || `Audit failed (${res.status})`)
      }
      const data = await res.json()
      if (data.success && data.audit) {
        setAuditResult(data.audit)
        // Refresh the main data to pick up new scores
        const controlRes = await fetch('/api/control/data')
        if (controlRes.ok) {
          const json = await controlRes.json()
          if (json.systemStatus) setSystemData(json.systemStatus)
          if (json.performance) setPerfData(json.performance)
          const qaRun = json.productQA || json.factory?.latestQA
          if (qaRun) {
            setQaData({
              hasData: true,
              run: qaRun,
              healthScore: qaRun.productScore ?? 0,
              issueCounts: {
                critical: qaRun.criticalCount ?? 0,
                major: qaRun.majorCount ?? 0,
                medium: qaRun.mediumCount ?? 0,
                minor: qaRun.minorCount ?? 0,
                total: (qaRun.criticalCount ?? 0) + (qaRun.majorCount ?? 0) + (qaRun.mediumCount ?? 0) + (qaRun.minorCount ?? 0),
              },
            })
          }
        }
      }
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Audit failed')
    } finally {
      setAuditing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── 1. Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Engine™</h1>
            <p className="text-slate-400 text-sm">Measuring & enforcing performance budgets</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            overallScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${overallScore >= 80 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            <span className={`text-xs font-medium ${overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>Monitoring</span>
          </div>
          <button
            onClick={handleAudit}
            disabled={auditing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/25 text-orange-400 hover:bg-orange-500/25 hover:border-orange-500/40 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {auditing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {auditing ? 'Running Lighthouse...' : 'Run Audit'}
          </button>
        </div>
      </div>

      {hasNoData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center gap-4">
          <Gauge className="w-12 h-12 text-slate-600" />
          <p className="text-slate-300 font-medium">No performance data available</p>
          <p className="text-xs text-slate-500 text-center max-w-md">
            Performance data will appear once QA runs have been completed and system status is available.
          </p>
        </div>
      ) : (
        <>
          {/* ─── 2. Performance Score Banner ─────────────────────── */}
          <div className="bg-gradient-to-br from-orange-500/5 via-slate-900 to-slate-900 border border-orange-500/15 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <CircularGauge score={overallScore} size={180} />
                <div className="text-center mt-2">
                  <span className="text-xs text-slate-500">Overall Score</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Health Score</span>
                  </div>
                  <div className="text-lg font-bold text-white">{healthScore}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Package className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">QA Score</span>
                  </div>
                  <div className="text-lg font-bold text-white">{hasQA ? qaRun.productScore || 0 : '—'}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Latency</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {budgetItems.length > 0
                      ? `${Math.round(budgetItems.reduce((s, b) => s + b.current, 0) / budgetItems.length)}ms`
                      : '—'}
                  </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Components</span>
                  </div>
                  <div className="text-lg font-bold text-white">{Object.keys(components).length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. Core Web Vitals / QA Scores ──────────────────── */}
          {coreVitals.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                QA Performance Scores
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {coreVitals.map((vital) => (
                  <div
                    key={vital.abbr}
                    className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-600 transition-colors ${
                      vital.status === 'needs-improvement' ? 'border-amber-500/20' : vital.status === 'poor' ? 'border-red-500/20' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">{vital.abbr}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{vital.name}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        vital.status === 'good'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                          : vital.status === 'needs-improvement'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/15 text-red-400 border-red-500/20'
                      }`}>
                        {vital.status === 'good' && <CheckCircle2 className="w-3 h-3" />}
                        {vital.status === 'needs-improvement' && <AlertTriangle className="w-3 h-3" />}
                        {vital.status === 'poor' && <AlertCircle className="w-3 h-3" />}
                        {vitalStatusLabel(vital.status)}
                      </span>
                    </div>
                    <div className={`text-3xl font-bold ${vitalStatusColor(vital.status)} mb-1`}>
                      {vital.value}
                    </div>
                    <p className="text-[10px] text-slate-600 mb-2">{vital.description}</p>
                    <VitalRangeBar vital={vital} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 4. Performance Budget (from system latency) ──────── */}
          {budgetItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-orange-400" />
                Performance Budget
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="space-y-5">
                  {budgetItems.map((item) => {
                    const pct = (item.current / item.budget) * 100
                    const withinBudget = pct <= 100
                    const Icon = item.icon
                    return (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <span className="text-xs font-medium text-white">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white font-mono">{item.current}{item.unit}</span>
                            <span className="text-[10px] text-slate-500">/ {item.budget}{item.unit}</span>
                            {withinBudget ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              pct < 70 ? 'bg-emerald-500' : pct < 90 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-slate-600">{Math.round(pct)}% of budget</span>
                          <span className={`text-[10px] font-medium ${withinBudget ? 'text-emerald-400' : 'text-red-400'}`}>
                            {withinBudget ? 'Within Budget' : 'Over Budget'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── 5. Slow Endpoints ───────────────────────────────── */}
          {slowEndpoints.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-orange-400" />
                Slow Endpoints
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="space-y-3">
                  {slowEndpoints.map((ep) => {
                    const statusCfg = ep.status === 'critical'
                      ? { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Critical' }
                      : { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Over Target' }
                    const overBudget = ep.currentMs - ep.targetMs
                    return (
                      <div
                        key={ep.route}
                        className={`rounded-lg border p-4 ${statusCfg.bg} ${statusCfg.border} transition-colors hover:brightness-110`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-xs font-mono text-white truncate">{ep.route}</code>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">
                                Current: <span className={`${statusCfg.color} font-semibold`}>{ep.currentMs}ms</span>
                              </span>
                              <span className="text-xs text-slate-500">
                                Target: {ep.targetMs}ms
                              </span>
                              <span className={`text-xs ${statusCfg.color} font-medium`}>
                                +{overBudget}ms over
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                              {ep.status === 'critical' ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── 6. Web Vitals ──────────────────────────────────── */}
          {webVitals && typeof webVitals === 'object' && Object.keys(webVitals).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                Web Vitals
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(webVitals).map(([key, val]: [string, any]) => {
                    const numVal = typeof val === 'number' ? val : val?.value ?? 0
                    const status = scoreToVitalStatus(numVal)
                    return (
                      <div key={key} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">{key}</div>
                        <div className={`text-xl font-bold ${
                          status === 'good' ? 'text-emerald-400' : status === 'needs-improvement' ? 'text-amber-400' : 'text-red-400'
                        }`}>{typeof val === 'number' ? val : val?.display ?? numVal}</div>
                        <div className="text-[10px] text-slate-500 uppercase mt-1">
                          {status === 'good' ? 'Good' : status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── 7. Audit Results (Real Lighthouse Data) ───────── */}
          {auditResult && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-orange-400" />
                Real Audit Results
                {auditResult.lighthouse && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Lighthouse
                  </span>
                )}
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                {/* Lighthouse Scores */}
                {auditResult.lighthouse && (
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Lighthouse Scores</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: 'Performance', value: auditResult.lighthouse.performance },
                        { label: 'Accessibility', value: auditResult.lighthouse.accessibility },
                        { label: 'Best Practices', value: auditResult.lighthouse.bestPractices },
                        { label: 'SEO', value: auditResult.lighthouse.seo },
                        { label: 'FCP', value: `${auditResult.lighthouse.fcp}s`, raw: auditResult.lighthouse.fcp, isTime: true },
                      ].map(item => {
                        const numVal = item.isTime ? (item.raw! <= 1.8 ? 95 : item.raw! <= 3 ? 60 : 30) : (item.value as number)
                        const status = numVal >= 90 ? 'good' : numVal >= 50 ? 'needs-improvement' : 'poor'
                        return (
                          <div key={item.label} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-[10px] text-slate-500 uppercase">{item.label}</div>
                            <div className={`text-lg font-bold mt-1 ${status === 'good' ? 'text-emerald-400' : status === 'needs-improvement' ? 'text-amber-400' : 'text-red-400'}`}>
                              {item.value}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Core Web Vitals from Audit */}
                {auditResult.coreVitals && (
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Core Web Vitals (Measured)</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'LCP', value: auditResult.coreVitals.lcp, unit: 's', good: 2.5, ni: 4 },
                        { label: 'FCP', value: auditResult.coreVitals.fcp, unit: 's', good: 1.8, ni: 3 },
                        { label: 'CLS', value: auditResult.coreVitals.cls, unit: '', good: 0.1, ni: 0.25 },
                        { label: 'TTFB', value: auditResult.coreVitals.ttfb, unit: 'ms', good: 800, ni: 1800 },
                      ].filter(v => v.value !== null).map(vital => {
                        const val = vital.value!
                        const status = val <= vital.good ? 'good' : val <= vital.ni ? 'needs-improvement' : 'poor'
                        return (
                          <div key={vital.label} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-[10px] text-slate-500 uppercase">{vital.label}</div>
                            <div className={`text-lg font-bold mt-1 ${status === 'good' ? 'text-emerald-400' : status === 'needs-improvement' ? 'text-amber-400' : 'text-red-400'}`}>
                              {typeof val === 'number' ? (vital.unit === 'ms' ? `${Math.round(val)}${vital.unit}` : `${val.toFixed(vital.unit === 's' ? 1 : 3)}${vital.unit}`) : '—'}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {status === 'good' ? 'Good' : status === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Resource Sizes */}
                {auditResult.lighthouse && (
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Resource Sizes</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: 'JavaScript', value: auditResult.lighthouse.jsSize, unit: 'KB' },
                        { label: 'CSS', value: auditResult.lighthouse.cssSize, unit: 'KB' },
                        { label: 'Images', value: auditResult.lighthouse.imageSize, unit: 'KB' },
                        { label: 'Fonts', value: auditResult.lighthouse.fontSize, unit: 'KB' },
                        { label: 'Total', value: auditResult.lighthouse.totalSize, unit: 'KB' },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                          <div className="text-[10px] text-slate-500 uppercase">{item.label}</div>
                          <div className="text-lg font-bold text-white mt-1">{item.value}<span className="text-xs text-slate-500 ml-0.5">{item.unit}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Endpoint Timings */}
                {auditResult.endpointTimings && auditResult.endpointTimings.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">API Endpoint Latency (Measured)</div>
                    <div className="space-y-2">
                      {auditResult.endpointTimings.map((ep: any) => (
                        <div key={ep.route} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30">
                          <code className="text-xs font-mono text-slate-300">{ep.route}</code>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold ${ep.ttfb > 500 ? 'text-red-400' : ep.ttfb > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {ep.ttfb}ms
                            </span>
                            <span className="text-[10px] text-slate-500">TTFB</span>
                            {ep.error && <span className="text-[10px] text-red-400">{ep.error}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Issues */}
                {auditResult.issues && auditResult.issues.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Issues Found ({auditResult.issues.length})</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {auditResult.issues.map((issue: any, idx: number) => {
                        const sevColor = issue.severity === 'critical' ? 'text-red-400' : issue.severity === 'major' ? 'text-orange-400' : issue.severity === 'medium' ? 'text-amber-400' : 'text-slate-400'
                        return (
                          <div key={idx} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                            <div className="flex items-start gap-2">
                              <span className={`text-[10px] font-medium uppercase ${sevColor} flex-shrink-0 mt-0.5`}>{issue.severity}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-200 leading-relaxed">{issue.title}</p>
                                {issue.fixSuggestion && <p className="text-[10px] text-slate-500 mt-1">{issue.fixSuggestion}</p>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-2 border-t border-slate-800">
                  <span>Audit completed: {new Date(auditResult.timestamp).toLocaleString()}</span>
                  <span>Duration: {(auditResult.durationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Error */}
          {auditError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-medium">Audit Error</p>
                <p className="text-xs text-red-400/80 mt-1">{auditError}</p>
                <p className="text-[10px] text-slate-500 mt-2">Lighthouse requires Chrome. If Chrome is not available, the audit falls back to API timing measurements only.</p>
              </div>
            </div>
          )}

          {/* ─── Performance Issues from DB ──────────────────────── */}
          {perfData?.issues && perfData.issues.length > 0 && !auditResult && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Performance Issues ({perfData.issues.length})
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {perfData.issues.map((issue: any) => {
                    const sevColor = issue.severity === 'critical' ? 'text-red-400' : issue.severity === 'major' ? 'text-orange-400' : issue.severity === 'medium' ? 'text-amber-400' : 'text-slate-400'
                    const sevBg = issue.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' : issue.severity === 'major' ? 'bg-orange-500/10 border-orange-500/20' : issue.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/30 border-slate-700/30'
                    return (
                      <div key={issue.id} className={`p-3 rounded-lg border ${sevBg}`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-[10px] font-medium uppercase ${sevColor} flex-shrink-0 mt-0.5`}>{issue.severity}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 leading-relaxed">{issue.title}</p>
                            {issue.fixSuggestion && <p className="text-[10px] text-slate-500 mt-1">💡 {issue.fixSuggestion}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── 7b. Recent Optimizations ─────────────────────────── */}
          {recentOptimizations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                Recent Optimizations
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="space-y-3">
                  {recentOptimizations.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{opt.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                            <ArrowUpRight className="w-3 h-3" />
                            {opt.impact}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {opt.ago}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── 8. Footer ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-2">
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-orange-400" />
          <span>Health score: <span className="text-slate-300">{healthScore}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-orange-400" />
          <span>Components: <span className="text-slate-300">{Object.keys(components).length}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Status: <span className={systemData?.overallStatus === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}>{systemData?.overallStatus || 'unknown'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last run: <span className="text-slate-300">{lastRun?.completedAt || lastRun?.createdAt || lastRun?.timestamp ? new Date(lastRun.completedAt || lastRun.createdAt || lastRun.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'unknown'}</span></span>
        </div>
      </div>
    </div>
  )
}
