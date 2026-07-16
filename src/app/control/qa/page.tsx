'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield, Database, Brain, Scan, Target, Clock, Activity,
  RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Info,
  Zap, Server, Eye, Telescope, TrendingUp, Users, Cpu,
  ChevronDown, ChevronUp, Play, Loader2, XCircle, CheckCircle,
  BarChart3,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type TestStatus = 'pass' | 'fail' | 'warn'

interface BaseTestResult {
  status: TestStatus
  message: string
  durationMs: number
  details: unknown
}

interface AIProviderTestResult extends BaseTestResult {
  provider: string
  details: {
    model: string
    success: boolean
    latencyMs: number
    responseSnippet: string
    error: string | null
  }
}

interface RouterTestResult extends BaseTestResult {
  details: {
    model: string
    provider: string
    status: string
    latencyMs: number
    content: string
    fallbackChain: string[]
  }
}

interface ScannerTestResult extends BaseTestResult {
  details: {
    totalComponents: number
    totalAPIRoutes: number
    totalPrismaModels: number
    totalPages: number
    totalHooks: number
    totalLibs: number
    latencyMs: number
  }
}

interface GovernorTestResult extends BaseTestResult {
  details: {
    approved: boolean
    confidence: number
    impactScore: number
    ruleApplied: string | null
    rejectionReason: string | null
    latencyMs: number
  }
}

interface MissionTestResult extends BaseTestResult {
  details: {
    missionId: string | null
    candidatesEvaluated: number
    candidatesApproved: number
    candidatesRejected: number
    latencyMs: number
  }
}

interface CronJobTestResult extends BaseTestResult {
  cronName: string
  details: {
    hasRecentData: boolean
    recordCount: number
    lastRun: string | null
  }
}

interface FactoryTestResult extends BaseTestResult {
  details: {
    recentTasks: number
    recentInterceptions: number
    recentQARuns: number
    taskStatuses: Record<string, number>
    pipelineHealthy: boolean
  }
}

interface ContentEngineTestResult extends BaseTestResult {
  details: {
    briefCount: number
    articleCount: number
    reviewCount: number
    recentActivity: boolean
  }
}

interface ObservatoryTestResult extends BaseTestResult {
  details: {
    crawlCount: number
    responseCount: number
    changeCount: number
    reportCount: number
    recentCrawl: boolean
  }
}

interface GrowthEngineTestResult extends BaseTestResult {
  details: {
    memoryCount: number
    evidenceCount: number
    sprintCount: number
    recentActivity: boolean
  }
}

interface EngagementTestResult extends BaseTestResult {
  details: {
    missionCount: number
    briefCount: number
    streakCount: number
    recentActivity: boolean
  }
}

interface DatabaseTestResult extends BaseTestResult {
  details: {
    latencyMs: number
    counts: Record<string, number>
    errors: string[]
  }
}

interface QALoopResult {
  timestamp: string
  overallStatus: 'operational' | 'degraded' | 'critical'
  overallScore: number
  totalTests: number
  passedTests: number
  failedTests: number
  warningTests: number
  durationMs: number
  tests: {
    database: DatabaseTestResult
    aiProviders: AIProviderTestResult[]
    aiRouter: RouterTestResult
    codebaseScanner: ScannerTestResult
    aiGovernor: GovernorTestResult
    dailyMission: MissionTestResult
    cronJobs: CronJobTestResult[]
    factoryPipeline: FactoryTestResult
    contentEngine: ContentEngineTestResult
    observatory: ObservatoryTestResult
    growthEngine: GrowthEngineTestResult
    engagement: EngagementTestResult
  }
  summary: {
    critical: string[]
    warnings: string[]
    info: string[]
  }
}

// ─── Helpers ─────────────────────────────────────────────

function statusIcon(status: TestStatus) {
  switch (status) {
    case 'pass': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    case 'fail': return <XCircle className="w-4 h-4 text-red-400" />
    case 'warn': return <AlertTriangle className="w-4 h-4 text-amber-400" />
  }
}

function statusBg(status: TestStatus): string {
  switch (status) {
    case 'pass': return 'bg-emerald-500/10 border-emerald-500/20'
    case 'fail': return 'bg-red-500/10 border-red-500/20'
    case 'warn': return 'bg-amber-500/10 border-amber-500/20'
  }
}

function overallStatusConfig(status: string) {
  switch (status) {
    case 'operational': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25', label: 'OPERATIONAL', dot: 'bg-emerald-400' }
    case 'degraded': return { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25', label: 'DEGRADED', dot: 'bg-amber-400' }
    default: return { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/25', label: 'CRITICAL', dot: 'bg-red-400' }
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2
  const gaugeColor = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'

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
        <span className={`text-3xl font-bold ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
          {score}
        </span>
        <span className="text-[10px] text-slate-500">/ 100</span>
      </div>
    </div>
  )
}

// ─── Test Section Card ───────────────────────────────────

function TestSection({
  icon: Icon,
  title,
  status,
  message,
  durationMs,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType
  title: string
  status: TestStatus
  message: string
  durationMs: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-colors ${statusBg(status)}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors"
      >
        <Icon className={`w-4.5 h-4.5 ${status === 'pass' ? 'text-emerald-400' : status === 'fail' ? 'text-red-400' : 'text-amber-400'}`} />
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{message}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">{formatDuration(durationMs)}</span>
          {statusIcon(status)}
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-800/50 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Detail Row ──────────────────────────────────────────

function DetailRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/30">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs text-slate-200 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function QAEnginePage() {
  const [result, setResult] = useState<QALoopResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  // Load the latest QA loop result on mount
  const loadLatestResult = useCallback(async () => {
    try {
      const res = await fetch('/api/qa-loop/status', {
        headers: { Authorization: 'Bearer seosights-superadmin-2024' },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.hasRun && data.results) {
          setResult(data.results)
        }
      }
    } catch {
      // Ignore — just means no previous run
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLatestResult()
  }, [loadLatestResult])

  // Animate score
  useEffect(() => {
    if (!result || animationStarted.current) return
    animationStarted.current = true
    let current = 0
    const target = result.overallScore
    const step = Math.ceil(target / 30)
    const timer = setInterval(() => {
      current += step
      if (current >= target) { current = target; clearInterval(timer) }
      setAnimatingScore(current)
    }, 25)
    return () => clearInterval(timer)
  }, [result])

  // Run the full QA loop
  const runQALoop = async () => {
    setLoading(true)
    setError(null)
    animationStarted.current = false
    try {
      const res = await fetch('/api/qa-loop/run', {
        method: 'POST',
        headers: { Authorization: 'Bearer seosights-superadmin-2024' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data: QALoopResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Initial Loading ─────────────────────────────────
  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Loop</h1>
            <p className="text-slate-400 text-sm">Full system verification</p>
          </div>
        </div>
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  const osConfig = result ? overallStatusConfig(result.overallStatus) : null
  const displayScore = result ? (animatingScore || result.overallScore) : 0

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Loop</h1>
            <p className="text-slate-400 text-sm">Full system verification — 12 engines, real data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {osConfig && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${osConfig.bg}`}>
              <div className={`w-2 h-2 rounded-full ${osConfig.dot} animate-pulse`} />
              <span className={`text-xs font-bold ${osConfig.color}`}>{osConfig.label}</span>
            </div>
          )}
          <button
            onClick={runQALoop}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Running QA...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run Full QA Loop
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Error Banner ────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">QA Loop Failed</p>
            <p className="text-red-300/70 text-xs mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── No Results Yet ─────────────────────────────── */}
      {!result && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No QA Loop Run Yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Run the full QA loop to test every engine in the system — AI providers, database, 
            autonomous pipelines, cron jobs, and all 12 sub-systems.
          </p>
          <button
            onClick={runQALoop}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Full System QA
          </button>
        </div>
      )}

      {/* ─── Loading State ───────────────────────────────── */}
      {loading && !result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold text-slate-300 mb-2">Running Full System QA...</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Testing 12 engines with real API calls. This may take up to 2 minutes.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" />Database</span>
            <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" />AI Providers</span>
            <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />Governor</span>
            <span className="flex items-center gap-1.5"><Scan className="w-3.5 h-3.5" />Scanner</span>
          </div>
        </div>
      )}

      {/* ─── Results ─────────────────────────────────────── */}
      {result && (
        <>
          {/* Overall Score Banner */}
          <div className="bg-gradient-to-br from-blue-500/5 via-slate-900 to-slate-900 border border-blue-500/15 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <CircularGauge score={displayScore} size={160} />
              </div>
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{result.passedTests}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Passed</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">{result.warningTests}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Warnings</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{result.failedTests}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Failed</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{result.totalTests}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total Tests</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Duration: {formatDuration(result.durationMs)}</span>
                  <span className="text-slate-700">|</span>
                  <span>Completed: {new Date(result.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Alerts */}
          {(result.summary.critical.length > 0 || result.summary.warnings.length > 0) && (
            <div className="space-y-2">
              {result.summary.critical.map((msg, i) => (
                <div key={`c${i}`} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300">{msg}</span>
                </div>
              ))}
              {result.summary.warnings.map((msg, i) => (
                <div key={`w${i}`} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-300">{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info Messages */}
          {result.summary.info.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> System Info
              </h3>
              <div className="space-y-1">
                {result.summary.info.map((msg, i) => (
                  <p key={i} className="text-xs text-slate-500">• {msg}</p>
                ))}
              </div>
            </div>
          )}

          {/* ─── Test Sections ─────────────────────────────── */}

          {/* 1. Database */}
          <TestSection icon={Database} title="Database Connectivity" status={result.tests.database.status} message={result.tests.database.message} durationMs={result.tests.database.durationMs} defaultOpen={result.tests.database.status !== 'pass'}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(result.tests.database.details.counts).map(([table, count]) => (
                <DetailRow key={table} label={table} value={count as number} mono />
              ))}
            </div>
            {result.tests.database.details.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-red-400 font-medium mb-1">Errors:</p>
                {result.tests.database.details.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-300/70 font-mono">{err}</p>
                ))}
              </div>
            )}
          </TestSection>

          {/* 2. AI Providers */}
          <TestSection icon={Brain} title="AI Providers" status={result.tests.aiProviders.some(p => p.status === 'fail') ? 'fail' : result.tests.aiProviders.some(p => p.status === 'warn') ? 'warn' : 'pass'} message={`${result.tests.aiProviders.filter(p => p.status === 'pass').length}/${result.tests.aiProviders.length} providers operational`} durationMs={result.tests.aiProviders.reduce((s, p) => s + p.durationMs, 0)} defaultOpen={true}>
            <div className="space-y-2">
              {result.tests.aiProviders.map((provider) => (
                <div key={provider.provider} className={`rounded-lg border p-3 ${statusBg(provider.status)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {statusIcon(provider.status)}
                    <span className="text-xs font-semibold text-white capitalize">{provider.provider}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">{provider.details.model}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailRow label="Latency" value={formatDuration(provider.details.latencyMs)} />
                    <DetailRow label="Success" value={provider.details.success ? 'Yes' : 'No'} />
                  </div>
                  {provider.details.responseSnippet && (
                    <div className="mt-2 p-2 rounded bg-slate-800/50">
                      <p className="text-[10px] text-slate-400 font-mono">Response: &quot;{provider.details.responseSnippet}&quot;</p>
                    </div>
                  )}
                  {provider.details.error && (
                    <p className="text-[10px] text-red-400 mt-1">Error: {provider.details.error}</p>
                  )}
                </div>
              ))}
            </div>
          </TestSection>

          {/* 3. AI Router */}
          <TestSection icon={Cpu} title="AI Router" status={result.tests.aiRouter.status} message={result.tests.aiRouter.message} durationMs={result.tests.aiRouter.durationMs}>
            <div className="grid grid-cols-2 gap-2">
              <DetailRow label="Model" value={result.tests.aiRouter.details.model} />
              <DetailRow label="Provider" value={result.tests.aiRouter.details.provider} />
              <DetailRow label="Status" value={result.tests.aiRouter.details.status} />
              <DetailRow label="Latency" value={formatDuration(result.tests.aiRouter.details.latencyMs)} />
            </div>
            {result.tests.aiRouter.details.fallbackChain.length > 0 && (
              <div className="mt-2 p-2 rounded bg-slate-800/50">
                <p className="text-[10px] text-slate-500 mb-1">Fallback Chain:</p>
                <p className="text-[10px] text-slate-400 font-mono">{result.tests.aiRouter.details.fallbackChain.join(' → ')}</p>
              </div>
            )}
            {result.tests.aiRouter.details.content && (
              <div className="mt-2 p-2 rounded bg-slate-800/50">
                <p className="text-[10px] text-slate-400 font-mono">Response: &quot;{result.tests.aiRouter.details.content.slice(0, 150)}&quot;</p>
              </div>
            )}
          </TestSection>

          {/* 4. Codebase Scanner */}
          <TestSection icon={Scan} title="Codebase Scanner" status={result.tests.codebaseScanner.status} message={result.tests.codebaseScanner.message} durationMs={result.tests.codebaseScanner.durationMs}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DetailRow label="Components" value={result.tests.codebaseScanner.details.totalComponents} mono />
              <DetailRow label="API Routes" value={result.tests.codebaseScanner.details.totalAPIRoutes} mono />
              <DetailRow label="Prisma Models" value={result.tests.codebaseScanner.details.totalPrismaModels} mono />
              <DetailRow label="Pages" value={result.tests.codebaseScanner.details.totalPages} mono />
              <DetailRow label="Hooks" value={result.tests.codebaseScanner.details.totalHooks} mono />
              <DetailRow label="Libs" value={result.tests.codebaseScanner.details.totalLibs} mono />
            </div>
          </TestSection>

          {/* 5. AI Governor */}
          <TestSection icon={Target} title="AI Governor" status={result.tests.aiGovernor.status} message={result.tests.aiGovernor.message} durationMs={result.tests.aiGovernor.durationMs}>
            <div className="grid grid-cols-2 gap-2">
              <DetailRow label="Decision" value={result.tests.aiGovernor.details.approved ? 'APPROVED' : 'REJECTED'} />
              <DetailRow label="Confidence" value={result.tests.aiGovernor.details.confidence.toFixed(2)} />
              <DetailRow label="Impact Score" value={`${result.tests.aiGovernor.details.impactScore}/10`} />
              <DetailRow label="Latency" value={formatDuration(result.tests.aiGovernor.details.latencyMs)} />
            </div>
            {result.tests.aiGovernor.details.ruleApplied && (
              <div className="mt-2 p-2 rounded bg-slate-800/50">
                <p className="text-[10px] text-slate-400">Rule Applied: <span className="text-amber-400 font-mono">{result.tests.aiGovernor.details.ruleApplied}</span></p>
              </div>
            )}
            {result.tests.aiGovernor.details.rejectionReason && (
              <div className="mt-2 p-2 rounded bg-slate-800/50">
                <p className="text-[10px] text-slate-400">Rejection Reason: <span className="text-red-300">{result.tests.aiGovernor.details.rejectionReason}</span></p>
              </div>
            )}
          </TestSection>

          {/* 6. Daily Mission Generator */}
          <TestSection icon={Zap} title="Daily Mission Generator" status={result.tests.dailyMission.status} message={result.tests.dailyMission.message} durationMs={result.tests.dailyMission.durationMs}>
            <div className="grid grid-cols-2 gap-2">
              <DetailRow label="Mission ID" value={result.tests.dailyMission.details.missionId ? result.tests.dailyMission.details.missionId.slice(0, 12) + '...' : 'None'} mono />
              <DetailRow label="Candidates Evaluated" value={result.tests.dailyMission.details.candidatesEvaluated} mono />
              <DetailRow label="Candidates Approved" value={result.tests.dailyMission.details.candidatesApproved} mono />
              <DetailRow label="Candidates Rejected" value={result.tests.dailyMission.details.candidatesRejected} mono />
            </div>
            <div className="mt-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] text-emerald-400">This test verified the full autonomous pipeline: Scan → Candidates → Governor → Persist</p>
            </div>
          </TestSection>

          {/* 7. Cron Jobs */}
          <TestSection icon={Clock} title="Cron Jobs" status={result.tests.cronJobs.some(c => c.status === 'fail') ? 'fail' : result.tests.cronJobs.some(c => c.status === 'warn') ? 'warn' : 'pass'} message={`${result.tests.cronJobs.filter(c => c.status === 'pass').length}/${result.tests.cronJobs.length} cron jobs with recent data`} durationMs={result.tests.cronJobs.reduce((s, c) => s + c.durationMs, 0)}>
            <div className="space-y-2">
              {result.tests.cronJobs.map((cron) => (
                <div key={cron.cronName} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                  {statusIcon(cron.status)}
                  <span className="text-xs font-medium text-white flex-1">{cron.cronName}</span>
                  <span className="text-[10px] text-slate-500">{cron.details.recordCount} records</span>
                  <span className="text-[10px] text-slate-600">{cron.details.lastRun ? new Date(cron.details.lastRun).toLocaleDateString() : 'Never'}</span>
                </div>
              ))}
            </div>
          </TestSection>

          {/* 8. Factory Pipeline */}
          <TestSection icon={Server} title="Factory Pipeline" status={result.tests.factoryPipeline.status} message={result.tests.factoryPipeline.message} durationMs={result.tests.factoryPipeline.durationMs}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DetailRow label="Recent Tasks (24h)" value={result.tests.factoryPipeline.details.recentTasks} mono />
              <DetailRow label="Recent Interceptions" value={result.tests.factoryPipeline.details.recentInterceptions} mono />
              <DetailRow label="Recent QA Runs" value={result.tests.factoryPipeline.details.recentQARuns} mono />
            </div>
            {Object.keys(result.tests.factoryPipeline.details.taskStatuses).length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-slate-500">Task Status Breakdown:</p>
                {Object.entries(result.tests.factoryPipeline.details.taskStatuses).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 capitalize">{status}:</span>
                    <span className="text-[10px] text-white font-mono">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </TestSection>

          {/* 9-12. Engines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Content Engine */}
            <TestSection icon={BarChart3} title="Content Engine" status={result.tests.contentEngine.status} message={result.tests.contentEngine.message} durationMs={result.tests.contentEngine.durationMs}>
              <div className="grid grid-cols-3 gap-2">
                <DetailRow label="Briefs" value={result.tests.contentEngine.details.briefCount} mono />
                <DetailRow label="Articles" value={result.tests.contentEngine.details.articleCount} mono />
                <DetailRow label="Reviews" value={result.tests.contentEngine.details.reviewCount} mono />
              </div>
              {result.tests.contentEngine.details.recentActivity && (
                <div className="mt-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] text-emerald-400">Recent activity detected — engine is operational</p>
                </div>
              )}
            </TestSection>

            {/* Observatory */}
            <TestSection icon={Telescope} title="Observatory" status={result.tests.observatory.status} message={result.tests.observatory.message} durationMs={result.tests.observatory.durationMs}>
              <div className="grid grid-cols-2 gap-2">
                <DetailRow label="Crawls" value={result.tests.observatory.details.crawlCount} mono />
                <DetailRow label="Responses" value={result.tests.observatory.details.responseCount} mono />
                <DetailRow label="Changes" value={result.tests.observatory.details.changeCount} mono />
                <DetailRow label="Reports" value={result.tests.observatory.details.reportCount} mono />
              </div>
            </TestSection>

            {/* Growth Engine */}
            <TestSection icon={TrendingUp} title="Growth Engine" status={result.tests.growthEngine.status} message={result.tests.growthEngine.message} durationMs={result.tests.growthEngine.durationMs}>
              <div className="grid grid-cols-3 gap-2">
                <DetailRow label="Memories" value={result.tests.growthEngine.details.memoryCount} mono />
                <DetailRow label="Evidence" value={result.tests.growthEngine.details.evidenceCount} mono />
                <DetailRow label="Sprints" value={result.tests.growthEngine.details.sprintCount} mono />
              </div>
            </TestSection>

            {/* Engagement */}
            <TestSection icon={Users} title="Engagement" status={result.tests.engagement.status} message={result.tests.engagement.message} durationMs={result.tests.engagement.durationMs}>
              <div className="grid grid-cols-3 gap-2">
                <DetailRow label="Missions" value={result.tests.engagement.details.missionCount} mono />
                <DetailRow label="Briefs" value={result.tests.engagement.details.briefCount} mono />
                <DetailRow label="Streaks" value={result.tests.engagement.details.streakCount} mono />
              </div>
            </TestSection>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Score: <span className={`font-semibold ${result.overallScore >= 80 ? 'text-emerald-400' : result.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{result.overallScore}/100</span></span>
            </div>
            <span className="text-slate-700">|</span>
            <span>Status: <span className={`font-semibold ${result.overallStatus === 'operational' ? 'text-emerald-400' : result.overallStatus === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>{result.overallStatus.toUpperCase()}</span></span>
            <span className="text-slate-700">|</span>
            <span>Duration: <span className="text-slate-300">{formatDuration(result.durationMs)}</span></span>
            <span className="text-slate-700">|</span>
            <span>Timestamp: <span className="text-slate-300">{new Date(result.timestamp).toLocaleString()}</span></span>
          </div>
        </>
      )}
    </div>
  )
}
