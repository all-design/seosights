'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
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

type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
type ScanStatus = 'clean' | 'warning' | 'vulnerable'

interface VulnerabilityItem {
  id: string
  package: string
  severity: VulnSeverity
  description: string
  status: 'fixed' | 'open' | 'accepted'
}

interface ApiRouteCheck {
  id: string
  route: string
  method: string
  auth: boolean
  rateLimited: boolean
  corsOk: boolean
}

interface CodeScanResult {
  id: string
  category: string
  check: string
  result: 'pass' | 'warning'
  details: string
  filesScanned: number
}

interface DependencyEntry {
  id: string
  name: string
  version: string
  latestVersion: string
  status: 'up-to-date' | 'outdated-minor' | 'outdated-major' | 'vulnerable'
  license: string
  lastAudit: string
}

// ─── Mock Data ───────────────────────────────────────────

const vulnerabilities: VulnerabilityItem[] = [
  {
    id: 'vul-1',
    package: 'nth-check',
    severity: 'high',
    description: 'Inefficient regular expression complexity — ReDoS vulnerability (CVE-2021-3807)',
    status: 'fixed',
  },
  {
    id: 'vul-2',
    package: 'decode-uri-component',
    severity: 'medium',
    description: 'Potential decode inconsistency in edge cases — no active exploit known',
    status: 'accepted',
  },
]

const apiRouteChecks: ApiRouteCheck[] = [
  { id: 'api-1', route: '/api/auth/login', method: 'POST', auth: false, rateLimited: true, corsOk: true },
  { id: 'api-2', route: '/api/auth/me', method: 'GET', auth: true, rateLimited: false, corsOk: true },
  { id: 'api-3', route: '/api/analyze', method: 'POST', auth: true, rateLimited: true, corsOk: true },
  { id: 'api-4', route: '/api/admin/users', method: 'GET', auth: true, rateLimited: true, corsOk: true },
  { id: 'api-5', route: '/api/webhooks/stripe', method: 'POST', auth: false, rateLimited: true, corsOk: true },
  { id: 'api-6', route: '/api/observatory/crawl', method: 'POST', auth: true, rateLimited: true, corsOk: false },
  { id: 'api-7', route: '/api/content-engine/execute', method: 'POST', auth: true, rateLimited: true, corsOk: true },
  { id: 'api-8', route: '/api/billing/checkout', method: 'POST', auth: true, rateLimited: true, corsOk: true },
]

const codeScans: CodeScanResult[] = [
  { id: 'cs-1', category: 'SQL Injection', check: 'Parameterized queries', result: 'pass', details: 'All database queries use Prisma ORM parameterized queries — no raw SQL injection vectors', filesScanned: 147 },
  { id: 'cs-2', category: 'XSS', check: 'Output encoding', result: 'pass', details: 'React auto-escapes JSX. No dangerouslySetInnerHTML found. DOMPurify applied where needed.', filesScanned: 147 },
  { id: 'cs-3', category: 'CSRF', check: 'Token validation', result: 'pass', details: 'All state-changing endpoints validate CSRF tokens. SameSite cookies enforced.', filesScanned: 42 },
  { id: 'cs-4', category: 'Secrets', check: 'Hardcoded credentials', result: 'warning', details: '1 potential hardcoded API key in .env.example — non-functional template but flagged for review', filesScanned: 147 },
  { id: 'cs-5', category: 'Auth', check: 'Session management', result: 'pass', details: 'JWT tokens have proper expiry. Refresh token rotation implemented. HttpOnly cookies enforced.', filesScanned: 23 },
]

const dependencyAudit: DependencyEntry[] = [
  { id: 'dep-1', name: 'next', version: '16.0.0', latestVersion: '16.0.0', status: 'up-to-date', license: 'MIT', lastAudit: '12m ago' },
  { id: 'dep-2', name: 'react', version: '19.0.0', latestVersion: '19.0.0', status: 'up-to-date', license: 'MIT', lastAudit: '12m ago' },
  { id: 'dep-3', name: 'prisma', version: '6.4.0', latestVersion: '6.4.1', status: 'outdated-minor', license: 'Apache-2.0', lastAudit: '12m ago' },
  { id: 'dep-4', name: '@prisma/client', version: '6.4.0', latestVersion: '6.4.1', status: 'outdated-minor', license: 'Apache-2.0', lastAudit: '12m ago' },
  { id: 'dep-5', name: 'lucide-react', version: '0.469.0', latestVersion: '0.469.0', status: 'up-to-date', license: 'ISC', lastAudit: '12m ago' },
  { id: 'dep-6', name: 'zod', version: '3.24.1', latestVersion: '3.24.2', status: 'outdated-minor', license: 'MIT', lastAudit: '12m ago' },
  { id: 'dep-7', name: 'stripe', version: '17.3.0', latestVersion: '17.5.0', status: 'outdated-minor', license: 'MIT', lastAudit: '12m ago' },
  { id: 'dep-8', name: 'next-auth', version: '4.24.11', latestVersion: '4.24.11', status: 'up-to-date', license: 'ISC', lastAudit: '12m ago' },
  { id: 'dep-9', name: '@tremor/react', version: '3.16.0', latestVersion: '3.18.0', status: 'outdated-minor', license: 'Apache-2.0', lastAudit: '12m ago' },
  { id: 'dep-10', name: 'tailwindcss', version: '4.0.0', latestVersion: '4.0.0', status: 'up-to-date', license: 'MIT', lastAudit: '12m ago' },
]

// ─── Helpers ─────────────────────────────────────────────

const SECURITY_SCORE = 96
const STATS = {
  vulnerabilities: 0,
  warnings: 2,
  dependenciesScanned: 847,
  lastScan: '12m ago',
}

function severityStyle(severity: VulnSeverity) {
  switch (severity) {
    case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    case 'high': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
    case 'medium': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    case 'low': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    case 'info': return { color: 'text-slate-400', bg: 'bg-slate-700/30', border: 'border-slate-600/50' }
  }
}

function depStatusStyle(status: DependencyEntry['status']) {
  switch (status) {
    case 'up-to-date': return { label: 'Current', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    case 'outdated-minor': return { label: 'Minor Update', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    case 'outdated-major': return { label: 'Major Update', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }
    case 'vulnerable': return { label: 'Vulnerable', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  }
}

function statusIcon(status: 'fixed' | 'open' | 'accepted') {
  switch (status) {
    case 'fixed': return { icon: CheckCircle2, color: 'text-emerald-400', label: 'Fixed' }
    case 'open': return { icon: XCircle, color: 'text-red-400', label: 'Open' }
    case 'accepted': return { icon: AlertTriangle, color: 'text-amber-400', label: 'Accepted Risk' }
  }
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2
  const gaugeColor = score >= 95 ? '#f87171' : score >= 80 ? '#f87171' : '#ef4444'

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
        <span className="text-4xl font-bold text-red-400">{score}</span>
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

export default function SecurityEnginePage() {
  const mounted = useHydrated()
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  useEffect(() => {
    if (animationStarted.current) return
    animationStarted.current = true
    let current = 0
    const target = SECURITY_SCORE
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

  const upToDateCount = dependencyAudit.filter(d => d.status === 'up-to-date').length
  const outdatedCount = dependencyAudit.filter(d => d.status !== 'up-to-date').length

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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <Activity className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-xs font-medium text-red-400">Scanning</span>
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
              <div className="text-2xl font-bold text-emerald-400">{STATS.vulnerabilities}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Vulnerabilities</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{STATS.warnings}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Warnings</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{STATS.dependenciesScanned}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Dependencies Scanned</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-300">{STATS.lastScan}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Last Scan</div>
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
              {STATS.vulnerabilities} critical
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {STATS.warnings} warnings
            </span>
          </span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {vulnerabilities.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">No critical or high vulnerabilities found — all clear</span>
            </div>
          ) : (
            <div className="space-y-3">
              {vulnerabilities.map((vuln) => {
                const sev = severityStyle(vuln.severity)
                const stat = statusIcon(vuln.status)
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
          <span className="ml-auto text-[10px] text-slate-500">{apiRouteChecks.length} routes checked</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Route</div>
            <div className="col-span-1">Method</div>
            <div className="col-span-2">Auth</div>
            <div className="col-span-2">Rate Limited</div>
            <div className="col-span-3">CORS</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-800/60">
            {apiRouteChecks.map((check) => (
              <div
                key={check.id}
                className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-slate-800/30 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span className="text-xs text-white font-mono truncate">{check.route}</span>
                </div>
                <div className="col-span-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    check.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                    check.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {check.method}
                  </span>
                </div>
                <div className="col-span-2">
                  {check.auth ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      <KeyRound className="w-3 h-3" />
                      Protected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  {check.rateLimited ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="col-span-3">
                  {check.corsOk ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      CORS configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      CORS review needed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Code Security ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Code className="w-4 h-4 text-red-400" />
          Code Security
          <span className="ml-auto text-[10px] text-slate-500">Static analysis scan</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {codeScans.map((scan) => (
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
                  {scan.filesScanned} files
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Dependency Audit ────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-400" />
          Dependency Audit
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {upToDateCount} current
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {outdatedCount} outdated
            </span>
          </span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Package</div>
            <div className="col-span-2">Version</div>
            <div className="col-span-2">Latest</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">License</div>
            <div className="col-span-2 text-right">Audited</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto custom-scrollbar">
            {dependencyAudit.map((dep) => {
              const style = depStatusStyle(dep.status)
              return (
                <div
                  key={dep.id}
                  className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm hover:bg-slate-800/30 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-white font-medium truncate">{dep.name}</span>
                  </div>
                  <div className="col-span-2 text-xs text-slate-400 font-mono">{dep.version}</div>
                  <div className="col-span-2 text-xs text-slate-400 font-mono">{dep.latestVersion}</div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="col-span-1 text-[10px] text-slate-500">{dep.license}</div>
                  <div className="col-span-2 text-[10px] text-slate-600 text-right flex items-center justify-end gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {dep.lastAudit}
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
          <span>Next scan: <span className="text-slate-300">06:00 UTC</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Critical issues: <span className="text-emerald-400">0</span></span>
        <span className="text-slate-700">|</span>
        <span>Compliance: <span className="text-emerald-400">SOC 2 Type II ✓</span></span>
        <span className="text-slate-700">|</span>
        <span>Dependencies: <span className="text-slate-300">847 scanned</span></span>
      </div>
    </div>
  )
}
