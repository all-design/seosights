'use client'

import { useEffect, useState } from 'react'
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
  CheckCircle2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ScanStats {
  totalComponents: number
  totalAPIRoutes: number
  totalPrismaModels: number
  totalPages: number
  totalHooks: number
  totalLibs: number
  lintErrors: number
  lintWarnings: number
  typescriptErrors: number
}

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

// ─── SVG circular gauge component ───────────────────────

function DebtGauge({ score }: { score: number }) {
  const radius = 80
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const centerX = 100
  const centerY = 100

  const getColor = () => {
    if (score <= 30) return '#10b981'
    if (score <= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
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

// ─── Main Component ──────────────────────────────────────

export default function TechDebtEnginePage() {
  const [scanData, setScanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch codebase scan for rich snapshot data (auto-triggers scan if none exists)
        const [scanRes, controlRes] = await Promise.all([
          fetch('/api/factory/scan'),
          fetch('/api/control/data'),
        ])
        if (!scanRes.ok) throw new Error('Failed to fetch scan data')

        const scanJson = await scanRes.json()
        const controlJson = controlRes.ok ? await controlRes.json() : {}
        const td = controlJson.techDebt || {}

        // /api/factory/scan returns: stats{}, components[], apiRoutes[], prismaModels[], pages[], timestamp
        const scanStats = scanJson.stats || {}
        const snapshot = scanJson

        setScanData({
          stats: {
            totalComponents: scanStats.totalComponents ?? 0,
            totalAPIRoutes: scanStats.totalAPIRoutes ?? 0,
            totalPrismaModels: scanStats.totalPrismaModels ?? 0,
            totalPages: scanStats.totalPages ?? 0,
            totalHooks: scanStats.totalHooks ?? 0,
            totalLibs: scanStats.totalLibs ?? 0,
            lintErrors: scanStats.lintErrors ?? td.lintErrors ?? 0,
            lintWarnings: scanStats.lintWarnings ?? td.lintWarnings ?? 0,
            typescriptErrors: scanStats.typescriptErrors ?? td.typescriptErrors ?? 0,
          },
          techDebt: td,
          snapshot,
          components: scanJson.components || [],
          apiRoutes: scanJson.apiRoutes || [],
          prismaModels: scanJson.prismaModels || [],
          pages: scanJson.pages || [],
          timestamp: scanJson.timestamp || td.snapshotDate,
          system: {},
          counts: {},
        })
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
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-20" />)}
        </div>
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
  const stats: ScanStats | null = scanData?.stats || null
  const components: any[] = scanData?.components || []
  const apiRoutes: any[] = scanData?.apiRoutes || []
  const prismaModels: any[] = scanData?.prismaModels || []
  const pages: any[] = scanData?.pages || []
  const scanTimestamp = scanData?.timestamp

  // Use real debt score from API if available, otherwise calculate from scan stats
  const lintErrors = stats?.lintErrors || 0
  const lintWarnings = stats?.lintWarnings || 0
  const tsErrors = stats?.typescriptErrors || 0
  const apiRouteCount = scanData?.techDebt?.apiRoutes ?? 0
  const prismaModelCount = scanData?.techDebt?.prismaModels ?? 0
  const snapshot = scanData?.snapshot ?? null
  const debtScore = scanData?.techDebt?.technicalDebtScore ?? Math.min(100, Math.max(0, lintErrors * 10 + lintWarnings * 2 + tsErrors * 8))

  // Build findings from techDebt data
  const findings: Finding[] = []
  if (lintErrors > 0) {
    findings.push({
      title: `${lintErrors} lint error${lintErrors !== 1 ? 's' : ''} detected`,
      severity: lintErrors > 5 ? 'critical' : 'high',
      filePath: 'Project-wide',
      description: `ESLint found ${lintErrors} error-level issues that should be fixed before deployment.`,
      suggestedAction: 'Run `bun run lint` and fix the reported errors',
    })
  }
  if (lintWarnings > 0) {
    findings.push({
      title: `${lintWarnings} lint warning${lintWarnings !== 1 ? 's' : ''} detected`,
      severity: lintWarnings > 10 ? 'medium' : 'low',
      filePath: 'Project-wide',
      description: `ESLint found ${lintWarnings} warning-level issues that could indicate code quality problems.`,
      suggestedAction: 'Review and address lint warnings to improve code quality',
    })
  }
  if (tsErrors > 0) {
    findings.push({
      title: `${tsErrors} TypeScript error${tsErrors !== 1 ? 's' : ''} detected`,
      severity: 'critical',
      filePath: 'Project-wide',
      description: `TypeScript compiler found ${tsErrors} type errors that should be resolved.`,
      suggestedAction: 'Fix TypeScript type errors to ensure type safety',
    })
  }

  // Check for duplicate code from snapshot
  if (snapshot && snapshot.duplicates > 0) {
    findings.push({
      title: `${snapshot.duplicates} duplicate code region${snapshot.duplicates !== 1 ? 's' : ''} detected`,
      severity: snapshot.duplicates > 10 ? 'high' : 'medium',
      filePath: 'Project-wide',
      description: `Codebase scan found ${snapshot.duplicates} duplicate code regions that increase maintenance burden.`,
      suggestedAction: 'Refactor duplicated code into shared utilities or components',
    })
  }

  // Check for dead code from snapshot
  if (snapshot && snapshot.deadCode > 0) {
    findings.push({
      title: `${snapshot.deadCode} dead code region${snapshot.deadCode !== 1 ? 's' : ''} detected`,
      severity: snapshot.deadCode > 10 ? 'medium' : 'low',
      filePath: 'Project-wide',
      description: `Codebase scan found ${snapshot.deadCode} regions of potentially dead or unreachable code.`,
      suggestedAction: 'Remove unused code to reduce bundle size and improve maintainability',
    })
  }

  // Check for potentially large API surface
  if (apiRouteCount > 50) {
    findings.push({
      title: `Large API surface: ${apiRouteCount} routes`,
      severity: 'medium',
      filePath: 'src/app/api/',
      description: `The codebase has ${apiRouteCount} API routes. Consider auditing for unused or redundant endpoints.`,
      suggestedAction: 'Audit API routes for unused endpoints and consolidate where possible',
    })
  }

  // Check for large schema
  if (prismaModelCount > 30) {
    findings.push({
      title: `Large schema: ${prismaModelCount} Prisma models`,
      severity: 'low',
      filePath: 'prisma/schema.prisma',
      description: `The database schema has ${prismaModelCount} models. Some may be unused or could be consolidated.`,
      suggestedAction: 'Review Prisma schema for unused models and potential consolidation',
    })
  }

  const debtStats = [
    { label: 'Lint Errors', value: lintErrors, icon: FileCode2, color: lintErrors > 0 ? 'text-red-400' : 'text-emerald-400' },
    { label: 'Lint Warnings', value: lintWarnings, icon: AlertTriangle, color: lintWarnings > 10 ? 'text-amber-400' : 'text-slate-400' },
    { label: 'TS Errors', value: tsErrors, icon: Database, color: tsErrors > 0 ? 'text-red-400' : 'text-emerald-400' },
    { label: 'API Routes', value: apiRouteCount, icon: ArrowRight, color: 'text-slate-400' },
    { label: 'Components', value: stats?.totalComponents ?? 0, icon: FileCode2, color: 'text-slate-400' },
  ]

  // Auto-fixable items
  const autoFixQueue = findings
    .filter(f => f.severity === 'low' || f.severity === 'medium')
    .slice(0, 3)
    .map(f => ({
      title: f.title,
      reason: `Safe — automated cleanup`,
      action: 'Auto-fix',
      risk: 'low' as const,
    }))

  // ─── Empty state ────────────────────────────────────────
  if (!stats) {
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
        </div>
        {/* Empty state */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center gap-4">
          <Scan className="w-12 h-12 text-slate-600" />
          <p className="text-slate-300 font-medium">No scan data available</p>
          <p className="text-xs text-slate-500 text-center max-w-md">
            Run a codebase scan to generate tech debt findings. The scanner will analyze components, API routes, and schema for issues.
          </p>
        </div>
      </div>
    )
  }

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
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            debtScore <= 30 ? 'bg-emerald-500/10 border-emerald-500/20' :
            debtScore <= 50 ? 'bg-amber-500/10 border-amber-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              debtScore <= 30 ? 'bg-emerald-400' :
              debtScore <= 50 ? 'bg-amber-400' :
              'bg-red-400'
            }`} />
            <span className={`text-xs font-medium ${
              debtScore <= 30 ? 'text-emerald-400' :
              debtScore <= 50 ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {debtScore <= 30 ? 'Healthy' : debtScore <= 50 ? 'Needs Attention' : 'High Debt'}
            </span>
          </div>
          {scanTimestamp && (
            <span className="text-[10px] text-slate-500">Last scan: {new Date(scanTimestamp).toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Debt Score */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Scan className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Debt Score</h2>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingDown className="w-3.5 h-3.5" />
            {debtScore <= 30 ? 'Low' : debtScore <= 50 ? 'Moderate' : 'High'}
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
        {findings.length === 0 ? (
          <div className="p-6 flex items-center gap-3 justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-slate-300">No findings — codebase looks clean!</span>
          </div>
        ) : (
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
        )}
      </div>

      {/* Codebase Breakdown */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Database className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Codebase Breakdown</h2>
          <span className="ml-auto text-xs text-slate-500">Latest snapshot</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
              <div className="text-xl font-bold text-white">{stats.totalComponents}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Components</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
              <div className="text-xl font-bold text-white">{stats.totalAPIRoutes}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">API Routes</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
              <div className="text-xl font-bold text-white">{stats.totalPrismaModels}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">DB Models</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
              <div className="text-xl font-bold text-white">{stats.totalPages}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pages</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
              <div className="text-xl font-bold text-white">{snapshot?.totalFiles ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Total Files</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
              <div className="text-xl font-bold text-white">{snapshot?.totalLines?.toLocaleString() ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Total Lines</div>
            </div>
          </div>
          {snapshot && (snapshot.duplicates > 0 || snapshot.deadCode > 0) && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
                <div className="text-xl font-bold text-white">{snapshot.duplicates}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Duplicates</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
                <div className="text-xl font-bold text-white">{snapshot.deadCode}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Dead Code</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 text-center">
                <div className="text-xl font-bold text-white">{snapshot.avgFileSize}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Avg File Size (loc)</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-fix Queue */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Wrench className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Auto-fix Queue</h2>
          <span className="ml-auto text-xs text-slate-500">{autoFixQueue.length} items safe to auto-fix</span>
        </div>
        {autoFixQueue.length === 0 ? (
          <div className="p-6 flex items-center gap-3 justify-center">
            <Wrench className="w-5 h-5 text-slate-600" />
            <span className="text-sm text-slate-500">No auto-fixable items available</span>
          </div>
        ) : (
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
        )}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total debt items', value: String(findings.length), icon: Bug },
          { label: 'Auto-fixable', value: String(autoFixQueue.length), icon: Wrench },
          { label: 'Components', value: String(stats.totalComponents), icon: FileCode2 },
          { label: 'Scan timestamp', value: scanTimestamp ? new Date(scanTimestamp).toLocaleDateString() : 'N/A', icon: Calendar },
        ].map((stat) => {
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
