'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Monitor,
  Globe,
  Brain,
  Database,
  CreditCard,
  Mail,
  Zap,
  Puzzle,
  Search,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Clock,
  Shield,
  Activity,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface QATestResult {
  testName: string
  description: string
  status: string
  latencyMs?: number
  errorMessage?: string | null
  confidence?: number
  fallbackUsed?: boolean
  expectedResult?: string | null
  actualResult?: string | null
}

interface QACategory {
  passed: number
  failed: number
  warnings: number
  degraded: number
  critical: number
  total: number
  tests: QATestResult[]
}

interface QARun {
  id: string
  trigger: string
  totalTests: number
  passed: number
  failed: number
  warnings: number
  degraded: number
  critical: number
  passRate: number
  durationMs: number
  status: string
  startedAt: string
  completedAt?: string | null
}

interface QAStatusResponse {
  run: QARun | null
  categories: Record<string, QACategory> | null
  recentRuns?: Array<{
    id: string
    passRate: number
    totalTests: number
    passed: number
    failed: number
    warnings: number
    trigger: string
    startedAt: string
  }>
  seedData?: {
    run: QARun
    categories: Record<string, QACategory>
    recentRuns: Array<{
      id: string
      passRate: number
      totalTests: number
      passed: number
      failed: number
      warnings: number
      trigger: string
      startedAt: string
    }>
  }
}

// ─── Category Config ────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  ui: { name: 'UI', icon: <Monitor className="w-4 h-4" />, color: 'text-blue-400' },
  api: { name: 'API', icon: <Globe className="w-4 h-4" />, color: 'text-emerald-400' },
  ai: { name: 'AI', icon: <Brain className="w-4 h-4" />, color: 'text-purple-400' },
  database: { name: 'Database', icon: <Database className="w-4 h-4" />, color: 'text-amber-400' },
  stripe: { name: 'Stripe', icon: <CreditCard className="w-4 h-4" />, color: 'text-indigo-400' },
  email: { name: 'Email', icon: <Mail className="w-4 h-4" />, color: 'text-pink-400' },
  auto_execute: { name: 'Auto Execute', icon: <Zap className="w-4 h-4" />, color: 'text-yellow-400' },
  chrome_extension: { name: 'Chrome Extension', icon: <Puzzle className="w-4 h-4" />, color: 'text-cyan-400' },
  seo: { name: 'SEO', icon: <Search className="w-4 h-4" />, color: 'text-orange-400' },
}

const STATUS_COLORS: Record<string, string> = {
  passed: 'text-emerald-400',
  failed: 'text-red-400',
  warning: 'text-amber-400',
  degraded: 'text-orange-400',
  critical: 'text-red-500',
  skipped: 'text-gray-400',
}

const STATUS_BG: Record<string, string> = {
  passed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  failed: 'bg-red-400/10 text-red-400 border-red-400/20',
  warning: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  degraded: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  skipped: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
}

// ─── Circular Progress Ring ─────────────────────────────────────────────

function CircularScore({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 95 ? '#10b981' : score >= 80 ? '#f59e0b' : score >= 60 ? '#f97316' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

// ─── Category Card ──────────────────────────────────────────────────────

function CategoryCard({
  categoryId,
  category,
  isExpanded,
  onToggle,
}: {
  categoryId: string
  category: QACategory
  isExpanded: boolean
  onToggle: () => void
}) {
  const config = CATEGORY_CONFIG[categoryId] || { name: categoryId, icon: <Activity className="w-4 h-4" />, color: 'text-gray-400' }
  const passRate = category.total > 0 ? (category.passed / category.total) * 100 : 0
  const overallStatus = category.failed > 0 ? 'FAIL' : category.warnings > 0 || category.degraded > 0 ? 'WARNING' : 'PASS'

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <Card
        className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={config.color}>{config.icon}</span>
              <span className="font-medium text-foreground text-sm">{config.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  overallStatus === 'PASS'
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                    : overallStatus === 'WARNING'
                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    : 'bg-red-400/10 text-red-400 border-red-400/20'
                }`}
              >
                {overallStatus}
              </Badge>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-bold text-foreground">
              {category.passed}/{category.total}
            </span>
            <span className="text-xs text-muted-foreground">passed</span>
          </div>

          <Progress
            value={passRate}
            className="h-1.5 bg-white/5"
          />

          {category.failed > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-[11px] text-red-400">{category.failed} failed</span>
            </div>
          )}
          {category.warnings > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] text-amber-400">{category.warnings} warning{category.warnings > 1 ? 's' : ''}</span>
            </div>
          )}
          {category.degraded > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <span className="text-[11px] text-orange-400">{category.degraded} degraded</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isExpanded && category.tests && category.tests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/40 backdrop-blur-sm border-white/5 mt-1">
              <CardContent className="p-3">
                <ScrollArea className="max-h-64">
                  <div className="space-y-1.5 pr-3">
                    {category.tests.map((test, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {test.status === 'passed' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : test.status === 'failed' ? (
                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-foreground truncate">{test.description}</p>
                            {test.errorMessage && (
                              <p className="text-[10px] text-red-400/80 truncate mt-0.5">{test.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {test.latencyMs !== undefined && test.latencyMs > 0 && (
                            <span className="text-[10px] text-muted-foreground">{test.latencyMs}ms</span>
                          )}
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${STATUS_BG[test.status] || 'bg-gray-400/10 text-gray-400'}`}>
                            {test.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function QAOrchestrator() {
  const [data, setData] = useState<QAStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/qa/status')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('[QAOrchestrator] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const runSuite = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/superadmin/qa/run', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        await fetchStatus()
      }
    } catch (err) {
      console.error('[QAOrchestrator] Run error:', err)
    } finally {
      setRunning(false)
    }
  }

  // Extract data from either direct response or seed data
  const run = data?.run || data?.seedData?.run || null
  const categories = data?.categories || data?.seedData?.categories || null
  const recentRuns = data?.recentRuns || data?.seedData?.recentRuns || []

  // Compute hero stats
  const totalPassed = run?.passed ?? 0
  const totalTests = run?.totalTests ?? 0
  const passRate = run?.passRate ?? 0
  const totalWarnings = run?.warnings ?? 0
  const totalDegraded = run?.degraded ?? 0
  const totalCritical = run?.critical ?? 0

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading QA status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Custom scrollbar styling */}
      <style jsx global>{`
        .qa-scroll::-webkit-scrollbar { width: 6px; }
        .qa-scroll::-webkit-scrollbar-track { background: transparent; }
        .qa-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .qa-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      {/* ── Hero: Daily QA Score ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Score Ring */}
              <CircularScore score={passRate} />

              {/* Score Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-foreground">Daily QA Score</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalPassed} of {totalTests} tests passing
                </p>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                  {totalWarnings > 0 && (
                    <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {totalWarnings} warning{totalWarnings > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {totalDegraded > 0 && (
                    <Badge variant="outline" className="bg-orange-400/10 text-orange-400 border-orange-400/20">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {totalDegraded} degraded
                    </Badge>
                  )}
                  {totalCritical > 0 ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      <XCircle className="w-3 h-3 mr-1" />
                      {totalCritical} critical
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      0 critical
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Button
                    onClick={runSuite}
                    disabled={running}
                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-400/20"
                    size="sm"
                  >
                    {running ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Running Suite...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Run Full Suite
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchStatus}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Refresh
                  </Button>
                </div>

                {/* Last Run Timestamp */}
                {run?.startedAt && (
                  <div className="flex items-center gap-1.5 mt-3 justify-center md:justify-start">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      Last run: {formatDate(run.startedAt)}
                      {run.durationMs > 0 && ` (${(run.durationMs / 1000).toFixed(1)}s)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Recent Run Trend */}
              {recentRuns.length > 1 && (
                <div className="hidden lg:block w-48">
                  <p className="text-xs text-muted-foreground mb-2 text-center">7-Day Trend</p>
                  <div className="space-y-1.5">
                    {recentRuns.slice(0, 7).map((r, idx) => (
                      <div key={r.id || idx} className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(r.startedAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <div
                            className="h-1.5 rounded-full bg-emerald-400/60"
                            style={{ width: `${(r.passRate / 100) * 60}px` }}
                          />
                          <span className="text-[10px] text-foreground font-medium">{r.passRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Category Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {categories && Object.entries(categories).map(([categoryId, category]) => (
          <motion.div
            key={categoryId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Object.keys(categories).indexOf(categoryId) * 0.05 }}
          >
            <CategoryCard
              categoryId={categoryId}
              category={category}
              isExpanded={expandedCategory === categoryId}
              onToggle={() => setExpandedCategory(expandedCategory === categoryId ? null : categoryId)}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Continuous Product Validation Banner ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-emerald-500/5 via-card/80 to-emerald-500/5 backdrop-blur-sm border-emerald-400/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/10">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Continuous Product Validation</h4>
                  <p className="text-xs text-muted-foreground">Every deploy runs {totalTests}+ tests automatically</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Latest result:</span>
                {passRate >= 95 ? (
                  <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    PASS {passRate.toFixed(1)}%
                  </Badge>
                ) : passRate >= 80 ? (
                  <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    WARNING {passRate.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge className="bg-red-400/10 text-red-400 border-red-400/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    FAIL {passRate.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Show broken test if FAIL */}
            {passRate < 95 && categories && (() => {
              const brokenTests: Array<{ category: string; test: QATestResult }> = []
              Object.entries(categories).forEach(([catId, cat]) => {
                cat.tests?.forEach(test => {
                  if (test.status === 'failed' || test.status === 'critical') {
                    brokenTests.push({ category: catId, test })
                  }
                })
              })
              if (brokenTests.length > 0) {
                return (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {brokenTests.slice(0, 3).map((bt, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-red-400/5 text-red-400 border-red-400/20">
                          <XCircle className="w-2.5 h-2.5 mr-1" />
                          {CATEGORY_CONFIG[bt.category]?.name}: {bt.test.testName.split(':').pop()}
                        </Badge>
                      ))}
                      {brokenTests.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{brokenTests.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
