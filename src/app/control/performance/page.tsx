'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import {
  Gauge, Activity, Clock, Cpu, HardDrive, Zap,
  CheckCircle2, AlertTriangle, AlertCircle, TrendingUp,
  TrendingDown, ArrowRight, RefreshCw, Package,
  Code2, BarChart3, Image, FileCode, Timer,
  Server, MemoryStick, Wifi, ArrowUpRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type VitalStatus = 'good' | 'needs-improvement' | 'poor'

interface CoreVital {
  name: string
  abbr: string
  value: string
  numericValue: number
  status: VitalStatus
  description: string
  ranges: { good: number; needsImprovement: number; poor: number }
}

interface BundleItem {
  name: string
  size: number
  icon: React.ElementType
  color: string
}

interface BudgetItem {
  name: string
  current: number
  budget: number
  unit: string
  icon: React.ElementType
}

interface SlowEndpoint {
  route: string
  currentMs: number
  targetMs: number
  status: 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

interface Optimization {
  id: string
  description: string
  impact: string
  ago: string
}

// ─── Mock Data ───────────────────────────────────────────

const overallScore = 94

const coreVitals: CoreVital[] = [
  {
    name: 'Largest Contentful Paint',
    abbr: 'LCP',
    value: '1.2s',
    numericValue: 1.2,
    status: 'good',
    description: 'Time to render the largest content element',
    ranges: { good: 2.5, needsImprovement: 4.0, poor: 4.0 },
  },
  {
    name: 'First Input Delay',
    abbr: 'FID',
    value: '45ms',
    numericValue: 45,
    status: 'good',
    description: 'Time from first interaction to browser response',
    ranges: { good: 100, needsImprovement: 300, poor: 300 },
  },
  {
    name: 'Cumulative Layout Shift',
    abbr: 'CLS',
    value: '0.04',
    numericValue: 0.04,
    status: 'good',
    description: 'Visual stability score — lower is better',
    ranges: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  },
  {
    name: 'Interaction to Next Paint',
    abbr: 'INP',
    value: '120ms',
    numericValue: 120,
    status: 'needs-improvement',
    description: 'Latency of all click/tap/key interactions',
    ranges: { good: 200, needsImprovement: 500, poor: 500 },
  },
]

const bundleItems: BundleItem[] = [
  { name: 'Framework (Next.js)', size: 312, icon: Code2, color: 'bg-orange-500' },
  { name: 'Components', size: 189, icon: Package, color: 'bg-amber-500' },
  { name: 'Charts / Libs', size: 156, icon: BarChart3, color: 'bg-yellow-500' },
  { name: 'Icons', size: 94, icon: Image, color: 'bg-emerald-500' },
  { name: 'Other', size: 96, icon: FileCode, color: 'bg-slate-500' },
]

const totalBundle = bundleItems.reduce((sum, b) => sum + b.size, 0)
const bundleBudget = 1024 // 1MB in KB

const budgetItems: BudgetItem[] = [
  { name: 'Page Load', current: 1.8, budget: 3.0, unit: 's', icon: Timer },
  { name: 'Time to Interactive', current: 2.1, budget: 5.0, unit: 's', icon: Zap },
  { name: 'Bundle Size', current: 847, budget: 1024, unit: 'KB', icon: Package },
  { name: 'Memory Peak', current: 62, budget: 100, unit: 'MB', icon: Cpu },
  { name: 'API Response p95', current: 230, budget: 500, unit: 'ms', icon: Server },
]

const slowEndpoints: SlowEndpoint[] = [
  { route: '/api/observatory/graph', currentMs: 890, targetMs: 500, status: 'warning', trend: 'up' },
  { route: '/api/engagement/dashboard', currentMs: 650, targetMs: 300, status: 'critical', trend: 'up' },
  { route: '/api/content-engine/articles', currentMs: 420, targetMs: 300, status: 'warning', trend: 'down' },
]

const recentOptimizations: Optimization[] = [
  { id: 'opt-1', description: 'Lazy-loaded ObservatoryCharts — saved 94KB initial bundle', impact: '-94KB', ago: '2d ago' },
  { id: 'opt-2', description: 'Added pagination to /api/engagement/dashboard — 40% faster', impact: '-40%', ago: '4d ago' },
  { id: 'opt-3', description: 'Image optimization for hero section — LCP improved 0.3s', impact: '-0.3s', ago: '1w ago' },
]

// ─── Helpers ─────────────────────────────────────────────

function vitalStatusColor(status: VitalStatus): string {
  switch (status) {
    case 'good': return 'text-emerald-400'
    case 'needs-improvement': return 'text-amber-400'
    case 'poor': return 'text-red-400'
  }
}

function vitalStatusLabel(status: VitalStatus): string {
  switch (status) {
    case 'good': return 'Good'
    case 'needs-improvement': return 'Needs Improvement'
    case 'poor': return 'Poor'
  }
}

function vitalBarColor(status: VitalStatus): string {
  switch (status) {
    case 'good': return 'bg-emerald-500'
    case 'needs-improvement': return 'bg-amber-500'
    case 'poor': return 'bg-red-500'
  }
}

function vitalRangeBg(status: VitalStatus, zone: 'good' | 'needsImprovement' | 'poor'): string {
  switch (zone) {
    case 'good': return 'bg-emerald-500/20'
    case 'needsImprovement': return status === 'poor' ? 'bg-red-500/20' : 'bg-amber-500/20'
    case 'poor': return 'bg-red-500/20'
  }
}

function endpointStatusConfig(status: 'warning' | 'critical') {
  switch (status) {
    case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Over Target' }
    case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Critical' }
  }
}

function trendConfig(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up': return { icon: TrendingUp, color: 'text-red-400', label: 'Slowing' }
    case 'down': return { icon: TrendingDown, color: 'text-emerald-400', label: 'Improving' }
    case 'stable': return { icon: ArrowRight, color: 'text-slate-400', label: 'Stable' }
  }
}

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

// ─── Vital Range Bar ─────────────────────────────────────

function VitalRangeBar({ vital }: { vital: CoreVital }) {
  // Calculate position of the marker as a percentage of the total range
  // We use good/needsImprovement/poor ranges to determine the bar layout
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
      {/* Marker */}
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

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function PerformanceEnginePage() {
  const mounted = useHydrated()
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)
  const [auditing, setAuditing] = useState(false)

  useEffect(() => {
    if (animationStarted.current) return
    animationStarted.current = true
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

  const handleAudit = () => {
    setAuditing(true)
    setTimeout(() => setAuditing(false), 3000)
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Monitoring</span>
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
            {auditing ? 'Auditing...' : 'Run Audit'}
          </button>
        </div>
      </div>

      {/* ─── 2. Performance Score Banner ─────────────────────── */}
      <div className="bg-gradient-to-br from-orange-500/5 via-slate-900 to-slate-900 border border-orange-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular Gauge */}
          <div className="flex-shrink-0">
            <CircularGauge score={animatingScore} size={180} />
            <div className="text-center mt-2">
              <span className="text-xs text-slate-500">Overall Score</span>
            </div>
          </div>

          {/* Stat Boxes */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Core Web Vitals</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-bold text-emerald-400">Pass</span>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Package className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Bundle Size</span>
              </div>
              <div className="text-lg font-bold text-white">847<span className="text-xs text-slate-400 ml-0.5">KB</span></div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Load Time</span>
              </div>
              <div className="text-lg font-bold text-white">1.8<span className="text-xs text-slate-400 ml-0.5">s</span></div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Memory Usage</span>
              </div>
              <div className="text-lg font-bold text-white">62<span className="text-xs text-slate-400 ml-0.5">%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Core Web Vitals ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          Core Web Vitals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreVitals.map((vital) => (
            <div
              key={vital.abbr}
              className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-600 transition-colors ${
                vital.status === 'needs-improvement' ? 'border-amber-500/20' : 'border-slate-800'
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

      {/* ─── 4. Bundle Analysis ──────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            Bundle Analysis
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {totalBundle}KB / {bundleBudget}KB
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
              totalBundle / bundleBudget < 0.9
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {Math.round((totalBundle / bundleBudget) * 100)}% used
            </span>
          </div>
        </div>

        {/* Stacked bar */}
        <div className="flex h-4 rounded-full overflow-hidden mb-5">
          {bundleItems.map((item) => (
            <div
              key={item.name}
              className={`${item.color} transition-all duration-500`}
              style={{ width: `${(item.size / totalBundle) * 100}%` }}
              title={`${item.name}: ${item.size}KB`}
            />
          ))}
        </div>

        {/* Item rows */}
        <div className="space-y-3">
          {bundleItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800`}>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">{item.name}</span>
                    <span className="text-xs text-slate-400">{item.size}KB</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                      style={{ width: `${(item.size / totalBundle) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Bundle Size</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{totalBundle}KB</span>
            <span className="text-[10px] text-slate-500">of {bundleBudget}KB budget</span>
          </div>
        </div>
      </div>

      {/* ─── 5. Performance Budget ───────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-orange-400" />
          Performance Budget
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-5">
            {budgetItems.map((item) => {
              const Icon = item.icon
              const pct = (item.current / item.budget) * 100
              const withinBudget = pct <= 100
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
                      <span className="text-xs text-white font-mono">
                        {item.unit === 'KB' ? item.current : item.current}{item.unit}
                      </span>
                      <span className="text-[10px] text-slate-500">/ {item.unit === 'KB' ? item.budget : item.budget}{item.unit}</span>
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

      {/* ─── 6. Slow Endpoints ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-orange-400" />
          Slow Endpoints
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-3">
            {slowEndpoints.map((ep) => {
              const statusCfg = endpointStatusConfig(ep.status)
              const trendCfg = trendConfig(ep.trend)
              const TrendIcon = trendCfg.icon
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
                      <span className={`inline-flex items-center gap-1 text-[10px] ${trendCfg.color}`}>
                        <TrendIcon className="w-3 h-3" />
                        {trendCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── 7. Recent Optimizations ─────────────────────────── */}
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

      {/* ─── 8. Footer ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-2">
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-orange-400" />
          <span>Avg page load: <span className="text-slate-300">1.8s</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-orange-400" />
          <span>p95 API response: <span className="text-slate-300">230ms</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Uptime: <span className="text-emerald-400">99.97%</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last audit: <span className="text-slate-300">12m ago</span></span>
        </div>
      </div>
    </div>
  )
}
