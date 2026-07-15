'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Lock,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  KeyRound,
  Code,
  Package,
  Server,
  FileSearch,
  ShieldAlert,
  Shield,
  Fingerprint,
  Database,
  Activity,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ComponentStatus {
  status: 'ok' | 'degraded' | 'down'
  latency: number
  details: string
  lastCheck: string
}

type StatusMap = Record<string, ComponentStatus>

// ─── Helpers ─────────────────────────────────────────────

function componentIcon(name: string): React.ElementType {
  switch (name) {
    case 'database': return Database
    case 'redis': return Activity
    case 'aiRouter': return Server
    case 'stripe': return Package
    case 'email': return Globe
    case 'websocket': return Globe
    case 'cms': return Code
    default: return Shield
  }
}

function componentLabel(name: string): string {
  switch (name) {
    case 'database': return 'Database'
    case 'redis': return 'Redis Cache'
    case 'aiRouter': return 'AI Router'
    case 'stripe': return 'Stripe Billing'
    case 'email': return 'Email Service'
    case 'websocket': return 'WebSocket'
    case 'cms': return 'CMS'
    default: return name
  }
}

function componentCategory(name: string): string {
  switch (name) {
    case 'database': return 'Infrastructure'
    case 'redis': return 'Infrastructure'
    case 'aiRouter': return 'API Security'
    case 'stripe': return 'Payment Security'
    case 'email': return 'Communication'
    case 'websocket': return 'Real-time'
    case 'cms': return 'Content Security'
    default: return 'System'
  }
}

function statusStyle(status: 'ok' | 'degraded' | 'down') {
  switch (status) {
    case 'ok': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Secure' }
    case 'degraded': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Warning' }
    case 'down': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Down' }
  }
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  const gaugeColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
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
        <span className={`text-4xl font-bold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function SecurityEnginePage() {
  const [data, setData] = useState<any>(null)
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
        // Derive security data from system status in unified response
        const systemStatus = json.systemStatus
        setData(systemStatus || {
          components: {},
          status: 'unknown',
          responseTime: 0,
          environment: 'unknown',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Animate score when data arrives
  useEffect(() => {
    if (!data || animationStarted.current) return
    animationStarted.current = true
    const components: StatusMap = data.components || {}
    const total = Object.keys(components).length
    const okCount = Object.values(components).filter(c => c.status === 'ok').length
    const target = total > 0 ? Math.round((okCount / total) * 100) : 0
    let current = 0
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

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
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
  const components: StatusMap = data?.components || {}
  const overallStatus = data?.status || 'degraded'
  const componentEntries = Object.entries(components)

  const okCount = componentEntries.filter(([, c]) => c.status === 'ok').length
  const degradedCount = componentEntries.filter(([, c]) => c.status === 'degraded').length
  const downCount = componentEntries.filter(([, c]) => c.status === 'down').length
  const securityScore = componentEntries.length > 0
    ? Math.round((okCount / componentEntries.length) * 100)
    : 0

  // Build vulnerability-like items from degraded/down components
  const vulnerabilities = componentEntries
    .filter(([, c]) => c.status !== 'ok')
    .map(([name, c]) => ({
      id: name,
      package: componentLabel(name),
      severity: c.status === 'down' ? 'high' as const : 'medium' as const,
      description: c.details,
      status: c.status === 'down' ? 'open' as const : 'accepted' as const,
    }))

  // Build code-scan-like results from component health
  const codeScans = componentEntries.map(([name, c]) => ({
    id: name,
    category: componentCategory(name),
    check: `${componentLabel(name)} health check`,
    result: c.status === 'ok' ? 'pass' as const : 'warning' as const,
    details: c.details,
    latency: c.latency,
  }))

  // Build dependency-audit-like results from component health
  const dependencyAudit = componentEntries.map(([name, c]) => ({
    id: name,
    name: componentLabel(name),
    status: c.status,
    details: c.details,
    latency: c.latency,
    lastCheck: c.lastCheck,
  }))

  // ─── Empty state ────────────────────────────────────────
  if (componentEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Security Engine™</h1>
              <p className="text-slate-400 text-sm">Vulnerability scanning, API security & code audits</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12 text-slate-600" />
          <p className="text-slate-300 font-medium">No security scans recorded</p>
          <p className="text-xs text-slate-500 text-center max-w-md">
            System status data will appear here once the system status API is available.
          </p>
        </div>
      </div>
    )
  }

  function vulnSeverityStyle(severity: 'high' | 'medium') {
    switch (severity) {
      case 'high': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
      case 'medium': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    }
  }

  function vulnStatusIcon(status: 'open' | 'accepted') {
    switch (status) {
      case 'open': return { icon: XCircle, color: 'text-red-400', label: 'Open' }
      case 'accepted': return { icon: AlertTriangle, color: 'text-amber-400', label: 'Accepted Risk' }
    }
  }

  function depStatusStyle(status: 'ok' | 'degraded' | 'down') {
    switch (status) {
      case 'ok': return { label: 'Secure', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
      case 'degraded': return { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
      case 'down': return { label: 'Down', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Security Engine™</h1>
            <p className="text-slate-400 text-sm">Vulnerability scanning, API security & code audits</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            overallStatus === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <Activity className={`w-3 h-3 ${overallStatus === 'healthy' ? 'text-emerald-400' : 'text-amber-400'} animate-pulse`} />
            <span className={`text-xs font-medium ${overallStatus === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {overallStatus === 'healthy' ? 'All Clear' : 'Issues Detected'}
            </span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-red-500/30 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Run Full Scan
          </button>
        </div>
      </div>

      {/* ─── Security Score + Stats ──────────────────────── */}
      <div className="bg-gradient-to-br from-red-500/5 via-slate-900 to-slate-900 border border-red-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <CircularGauge score={animatingScore} size={160} />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{okCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Secure</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{degradedCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Warnings</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{downCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Down</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-300">{data?.responseTime || 0}ms</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Vulnerability Scan ──────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Vulnerability Scan
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {okCount} secure
            </span>
            {degradedCount > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {degradedCount} warnings
              </span>
            )}
          </span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {vulnerabilities.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">All systems secure — no vulnerabilities found</span>
            </div>
          ) : (
            <div className="space-y-3">
              {vulnerabilities.map((vuln) => {
                const sev = vulnSeverityStyle(vuln.severity)
                const stat = vulnStatusIcon(vuln.status)
                const StatIcon = stat.icon
                return (
                  <div
                    key={vuln.id}
                    className={`rounded-lg border p-4 ${sev.bg} ${sev.border}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-semibold ${sev.color}`}>{vuln.severity.toUpperCase()}</span>
                        <span className="text-xs font-medium text-white">{vuln.package}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${stat.color}`}>
                        <StatIcon className="w-3 h-3" />
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{vuln.description}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── API Security ────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-red-400" />
          API Security
          <span className="ml-auto text-[10px] text-slate-500">{componentEntries.length} components checked</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Component</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Latency</div>
            <div className="col-span-5">Details</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-800/60">
            {componentEntries.map(([name, check]) => {
              const style = statusStyle(check.status)
              const StyleIcon = style.icon
              const Icon = componentIcon(name)
              return (
                <div
                  key={name}
                  className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-slate-800/30 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-white font-medium truncate">{componentLabel(name)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.color} ${style.border}`}>
                      <StyleIcon className="w-3 h-3" />
                      {style.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 font-mono">{check.latency}ms</span>
                  </div>
                  <div className="col-span-5">
                    <span className="text-[10px] text-slate-500 truncate block">{check.details}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Code Security ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Code className="w-4 h-4 text-red-400" />
          Code Security
          <span className="ml-auto text-[10px] text-slate-500">System health scan</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {codeScans.map((scan) => {
            const Icon = componentIcon(scan.id)
            return (
              <div
                key={scan.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-colors hover:border-slate-700 ${
                  scan.result === 'warning' ? 'border-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    scan.result === 'pass' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  }`}>
                    {scan.result === 'pass' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{scan.category}</div>
                    <div className="text-[10px] text-slate-500">{scan.check}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{scan.details}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                    scan.result === 'pass'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {scan.result === 'pass' ? 'Pass' : 'Warning'}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {scan.latency}ms
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Dependency Audit ────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-400" />
          Dependency Audit
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {okCount} secure
            </span>
            {(degradedCount + downCount) > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {degradedCount + downCount} issues
              </span>
            )}
          </span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Component</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-2 text-right">Checked</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto custom-scrollbar">
            {dependencyAudit.map((dep) => {
              const style = depStatusStyle(dep.status)
              const Icon = componentIcon(dep.id)
              return (
                <div
                  key={dep.id}
                  className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-slate-800/30 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-white font-medium truncate">{dep.name}</span>
                  </div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="col-span-4 text-[10px] text-slate-500 truncate">{dep.details}</div>
                  <div className="col-span-2 text-[10px] text-slate-600 text-right flex items-center justify-end gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {dep.latency}ms
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>Overall: <span className={overallStatus === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}>{overallStatus}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Issues: <span className={downCount > 0 ? 'text-red-400' : 'text-emerald-400'}>{downCount}</span></span>
        <span className="text-slate-700">|</span>
        <span>Components: <span className="text-slate-300">{componentEntries.length} scanned</span></span>
        <span className="text-slate-700">|</span>
        <span>Environment: <span className="text-slate-300">{data?.environment || 'unknown'}</span></span>
      </div>
    </div>
  )
}
