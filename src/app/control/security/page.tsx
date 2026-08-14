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
  Bug,
  Info,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ComponentStatus {
  status: string
  latency: number
  details: string
}

type StatusMap = Record<string, ComponentStatus>

interface SecurityVulnerabilities {
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

interface RecentIssue {
  id: string
  title: string
  severity: string
  page: string | null
  status: string
  createdAt: string
}

interface RecentFallback {
  id: string
  engine: string
  action: string
  createdAt: string
  [key: string]: unknown
}

interface SecurityData {
  vulnerabilities: SecurityVulnerabilities
  securityScore: number | null
  codeScanStatus: string
  codeScanDate: string | null
  dependencyAuditStatus: string
  lastFullScan: string | null
  recentIssues: RecentIssue[]
}

interface SystemStatusData {
  components: StatusMap
  overallStatus: string
  recentFallbacks: RecentFallback[]
  lastChecked: string
}

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
    case 'qaEngine': return Bug
    case 'governor': return ShieldAlert
    case 'observatory': return FileSearch
    case 'scheduler': return Clock
    case 'clientZero': return Fingerprint
    case 'factory': return Package
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
    case 'qaEngine': return 'QA Engine'
    case 'governor': return 'Governor'
    case 'observatory': return 'Observatory'
    case 'scheduler': return 'Scheduler'
    case 'clientZero': return 'Client Zero'
    case 'factory': return 'Factory'
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
    case 'qaEngine': return 'Quality Assurance'
    case 'governor': return 'Access Control'
    case 'observatory': return 'Monitoring'
    case 'scheduler': return 'Task Management'
    case 'clientZero': return 'Analytics'
    case 'factory': return 'Build Pipeline'
    default: return 'System'
  }
}

function statusStyle(status: string) {
  switch (status) {
    case 'operational':
    case 'ok':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Secure' }
    case 'degraded':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Warning' }
    case 'offline':
    case 'down':
      return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Down' }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Info, label: status }
  }
}

function severityStyle(severity: string) {
  switch (severity) {
    case 'critical':
      return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle }
    case 'major':
    case 'high':
      return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle }
    case 'medium':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle }
    case 'minor':
    case 'low':
      return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Info }
  }
}

function scanStatusLabel(status: string) {
  switch (status) {
    case 'completed': return { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    case 'partial': return { label: 'Partial', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    case 'pending': return { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' }
    case 'running': return { label: 'Running', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' }
    case 'passed': return { label: 'Passed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    case 'not_run': return { label: 'Not Run', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' }
    default: return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' }
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
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
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null)
  const [security, setSecurity] = useState<SecurityData | null>(null)
  const [dataSource, setDataSource] = useState<string>('live')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/security')
        if (!res.ok) throw new Error('Failed to fetch security data')
        const json = await res.json()

        // Extract both systemStatus and security from the dedicated security API
        if (json.systemStatus) {
          setSystemStatus(json.systemStatus)
        }
        if (json.security) {
          setSecurity(json.security)
        }
        if (json.source) {
          setDataSource(json.source)
        }
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
    if (animationStarted.current) return
    const target = security?.securityScore ?? 0
    if (target === 0 && !security) return
    animationStarted.current = true
    let current = 0
    const step = Math.ceil(target / 40) || 1
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      setAnimatingScore(current)
    }, 25)
    return () => clearInterval(timer)
  }, [security])

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
  const components: StatusMap = systemStatus?.components || {}
  const overallStatus = systemStatus?.overallStatus || 'degraded'
  const componentEntries = Object.entries(components)

  const vulns = security?.vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  const securityScore = security?.securityScore ?? 0
  const codeScanStatus = security?.codeScanStatus || 'pending'
  const codeScanDate = security?.codeScanDate ?? null
  const dependencyAuditStatus = security?.dependencyAuditStatus || 'not_run'
  const recentIssues = security?.recentIssues || []
  const recentFallbacks = systemStatus?.recentFallbacks || []

  // Component health counts
  const okCount = componentEntries.filter(([, c]) => c.status === 'operational' || c.status === 'ok').length
  const degradedCount = componentEntries.filter(([, c]) => c.status === 'degraded').length
  const downCount = componentEntries.filter(([, c]) => c.status === 'offline' || c.status === 'down').length

  // ─── Empty state ────────────────────────────────────────
  if (componentEntries.length === 0 && !security) {
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
          <p className="text-slate-300 font-medium">No security data available</p>
          <p className="text-xs text-slate-500 text-center max-w-md">
            Security scan results and system status data will appear here once the security engine has completed its first scan.
          </p>
        </div>
      </div>
    )
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
            overallStatus === 'operational' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <Activity className={`w-3 h-3 ${overallStatus === 'operational' ? 'text-emerald-400' : 'text-amber-400'} animate-pulse`} />
            <span className={`text-xs font-medium ${overallStatus === 'operational' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {overallStatus === 'operational' ? 'All Clear' : 'Issues Detected'}
            </span>
          </div>
          {(dataSource === 'seed' || dataSource === 'cold_start') && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400">
                Cold-start: seeded data
              </span>
            </div>
          )}
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
              <div className="text-2xl font-bold text-red-400">{vulns.critical}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Critical</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{vulns.high}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">High</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{vulns.medium}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Medium</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{vulns.low}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Vulnerability Scan (real issues from DB) ────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Vulnerability Scan
          <span className="ml-auto flex items-center gap-2">
            {vulns.total === 0 ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                0 issues
              </span>
            ) : (
              <>
                {vulns.critical > 0 && (
                  <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    {vulns.critical} critical
                  </span>
                )}
                {vulns.high > 0 && (
                  <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {vulns.high} high
                  </span>
                )}
                {vulns.medium > 0 && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {vulns.medium} medium
                  </span>
                )}
                {vulns.low > 0 && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {vulns.low} low
                  </span>
                )}
              </>
            )}
          </span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {recentIssues.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">
                {vulns.total === 0
                  ? 'All systems secure — no vulnerabilities found'
                  : `${vulns.total} open vulnerabilities but no recent issues to display`}
              </span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {recentIssues.map((issue) => {
                const sev = severityStyle(issue.severity)
                const SevIcon = sev.icon
                const isClosed = issue.status === 'closed' || issue.status === 'resolved'
                return (
                  <div
                    key={issue.id}
                    className={`rounded-lg border p-4 ${sev.bg} ${sev.border}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <SevIcon className={`w-3.5 h-3.5 flex-shrink-0 ${sev.color}`} />
                        <span className={`text-xs font-semibold ${sev.color}`}>{issue.severity.toUpperCase()}</span>
                        <span className="text-xs font-medium text-white">{issue.title}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium flex-shrink-0 ml-2 ${
                        isClosed ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isClosed ? (
                          <><CheckCircle2 className="w-3 h-3" /> Resolved</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Open</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {issue.page && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {issue.page}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(issue.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Code Security ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Code className="w-4 h-4 text-red-400" />
          Code Security
          <span className="ml-auto flex items-center gap-2">
            {(() => {
              const sl = scanStatusLabel(codeScanStatus)
              return (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${sl.bg} ${sl.color}`}>
                  {sl.label}
                </span>
              )
            })()}
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Code scan card */}
          <div className={`bg-slate-900 border rounded-xl p-4 transition-colors hover:border-slate-700 ${
            codeScanStatus === 'completed' ? 'border-emerald-500/20' : codeScanStatus === 'partial' ? 'border-amber-500/20' : 'border-slate-800'
          }`}>
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                codeScanStatus === 'completed' ? 'bg-emerald-500/10' : codeScanStatus === 'partial' ? 'bg-amber-500/10' : 'bg-slate-500/10'
              }`}>
                {codeScanStatus === 'completed' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : codeScanStatus === 'partial' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">Code Scan</div>
                <div className="text-[10px] text-slate-500">Static analysis & vulnerability detection</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              {codeScanStatus === 'completed'
                ? 'Full code security scan completed successfully.'
                : codeScanStatus === 'partial'
                ? 'Partial scan completed — some checks skipped.'
                : 'No code security scan has been run yet.'}
            </p>
            <div className="flex items-center justify-between">
              {(() => {
                const sl = scanStatusLabel(codeScanStatus)
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${sl.bg} ${sl.color}`}>
                    {sl.label}
                  </span>
                )
              })()}
              <span className="text-[10px] text-slate-600">
                {formatTimeAgo(codeScanDate)}
              </span>
            </div>
          </div>

          {/* Dependency audit card */}
          <div className={`bg-slate-900 border rounded-xl p-4 transition-colors hover:border-slate-700 ${
            dependencyAuditStatus === 'passed' ? 'border-emerald-500/20' : dependencyAuditStatus === 'not_run' ? 'border-slate-800' : 'border-amber-500/20'
          }`}>
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                dependencyAuditStatus === 'passed' ? 'bg-emerald-500/10' : dependencyAuditStatus === 'not_run' ? 'bg-slate-500/10' : 'bg-amber-500/10'
              }`}>
                {dependencyAuditStatus === 'passed' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : dependencyAuditStatus === 'not_run' ? (
                  <Package className="w-4 h-4 text-slate-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">Dependency Audit</div>
                <div className="text-[10px] text-slate-500">Third-party package security check</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              {dependencyAuditStatus === 'passed'
                ? 'All dependencies passed security audit.'
                : dependencyAuditStatus === 'not_run'
                ? 'Dependency audit has not been run yet.'
                : `Dependency audit status: ${dependencyAuditStatus}`}
            </p>
            <div className="flex items-center justify-between">
              {(() => {
                const sl = scanStatusLabel(dependencyAuditStatus)
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${sl.bg} ${sl.color}`}>
                    {sl.label}
                  </span>
                )
              })()}
              <span className="text-[10px] text-slate-600">
                {formatTimeAgo(security?.lastFullScan ?? null)}
              </span>
            </div>
          </div>

          {/* Security score card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-colors hover:border-slate-700">
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                securityScore >= 80 ? 'bg-emerald-500/10' : securityScore >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'
              }`}>
                <Shield className={`w-4 h-4 ${
                  securityScore >= 80 ? 'text-emerald-400' : securityScore >= 60 ? 'text-amber-400' : 'text-red-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">Security Score</div>
                <div className="text-[10px] text-slate-500">Overall security posture rating</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              {securityScore >= 80
                ? 'Security posture is strong. Keep it up!'
                : securityScore >= 60
                ? 'Some issues need attention to improve security.'
                : securityScore > 0
                ? 'Critical issues detected. Immediate action recommended.'
                : 'No security score available yet.'}
            </p>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                securityScore >= 80
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : securityScore >= 60
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : securityScore > 0
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {securityScore > 0 ? `${securityScore}/100` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-600">
                {vulns.total} issues
              </span>
            </div>
          </div>
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
          {componentEntries.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-slate-500">
              No system components found
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* ─── Dependency Audit ────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-400" />
          Dependency Audit
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {okCount} operational
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
            <div className="col-span-2 text-right">Category</div>
          </div>
          {/* Rows */}
          {componentEntries.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-slate-500">
              No dependency audit data available
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto custom-scrollbar">
              {componentEntries.map(([name, c]) => {
                const style = statusStyle(c.status)
                const Icon = componentIcon(name)
                const category = componentCategory(name)
                return (
                  <div
                    key={name}
                    className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-white font-medium truncate">{componentLabel(name)}</span>
                    </div>
                    <div className="col-span-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.color} ${style.border}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="col-span-4 text-[10px] text-slate-500 truncate">{c.details}</div>
                    <div className="col-span-2 text-[10px] text-slate-600 text-right">{category}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Fallbacks / Blocked Actions ──────────── */}
      {recentFallbacks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-red-400" />
            Recent Blocked Actions
            <span className="ml-auto text-[10px] text-slate-500">{recentFallbacks.length} recent</span>
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Engine</div>
              <div className="col-span-3">Action</div>
              <div className="col-span-6 text-right">Time</div>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto custom-scrollbar">
              {recentFallbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-slate-800/30 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-white font-medium truncate">{fb.engine}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                      {fb.action}
                    </span>
                  </div>
                  <div className="col-span-6 text-[10px] text-slate-500 text-right flex items-center justify-end gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeAgo(fb.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>Overall: <span className={overallStatus === 'operational' ? 'text-emerald-400' : 'text-amber-400'}>{overallStatus}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Score: <span className={securityScore >= 80 ? 'text-emerald-400' : securityScore >= 60 ? 'text-amber-400' : securityScore > 0 ? 'text-red-400' : 'text-slate-400'}>{securityScore > 0 ? securityScore : 'N/A'}</span></span>
        <span className="text-slate-700">|</span>
        <span>Vulnerabilities: <span className={vulns.total > 0 ? 'text-red-400' : 'text-emerald-400'}>{vulns.total}</span></span>
        <span className="text-slate-700">|</span>
        <span>Components: <span className="text-slate-300">{componentEntries.length} scanned</span></span>
        <span className="text-slate-700">|</span>
        <span>Code Scan: <span className={codeScanStatus === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>{codeScanStatus}</span></span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          Data: <span className={dataSource === 'live' ? 'text-emerald-400' : 'text-amber-400'}>{dataSource}</span>
        </span>
      </div>
    </div>
  )
}
