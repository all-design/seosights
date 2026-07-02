'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  Server,
  Cpu,
  Wifi,
  Database,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Loader2,
  Shield,
  Radio,
  ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

interface HealthMetric {
  label: string
  value: string | number
  unit?: string
  trend: 'up' | 'down' | 'stable'
  trendValue?: number
  status: 'healthy' | 'warning' | 'critical'
  sparkline?: number[]
}

interface AIProvider {
  name: string
  provider: string
  model: string
  status: 'online' | 'offline' | 'degraded'
  latency: number
  costPer1k: number
  configured: boolean
  active: boolean
}

interface ServiceHealth {
  name: string
  port?: number
  status: 'running' | 'down' | 'degraded'
  responseTime: number
  details: string
}

interface OperationLog {
  id: string
  timestamp: string
  operation: string
  status: 'success' | 'warning' | 'error' | 'info'
  duration: string
  details?: string
}

interface OperationsData {
  healthMetrics: HealthMetric[]
  aiProviders: AIProvider[]
  fallbackChain: string[]
  activeProvider: string
  services: ServiceHealth[]
  recentOperations: OperationLog[]
  summary: {
    uptime: string
    avgLatency: number
    runningWorkers: number
    totalWorkers: number
    activeProviders: number
    errorRate: string
    totalFallbacks: number
    totalUsers: number
    totalAnalyses: number
  }
  timestamp: string
}

// ─── Mini Sparkline Component ─────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 24

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Trend Icon ────────────────────────────────────────────────────────────

function TrendIcon({ trend, positive }: { trend: 'up' | 'down' | 'stable'; positive?: boolean }) {
  if (trend === 'up') {
    return <ArrowUpRight className={`h-3.5 w-3.5 ${positive === false ? 'text-red-400' : 'text-emerald-400'}`} />
  }
  if (trend === 'down') {
    return <ArrowDownRight className={`h-3.5 w-3.5 ${positive === false ? 'text-emerald-400' : 'text-red-400'}`} />
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

// ─── Status Dot ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'running' | 'down' | 'degraded' | 'online' | 'offline' }) {
  const colorMap: Record<string, string> = {
    running: 'bg-emerald-500',
    online: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    offline: 'bg-red-500',
    down: 'bg-red-500',
  }
  const glowMap: Record<string, string> = {
    running: 'shadow-emerald-500/50',
    online: 'shadow-emerald-500/50',
    degraded: 'shadow-amber-500/50',
    offline: 'shadow-red-500/50',
    down: 'shadow-red-500/50',
  }
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colorMap[status] || 'bg-gray-500'} shadow-[0_0_6px] ${glowMap[status] || ''}`}
    />
  )
}

// ─── Provider Status Colors ────────────────────────────────────────────────

function providerBorderColor(status: string): string {
  if (status === 'online') return 'border-emerald-500/40'
  if (status === 'degraded') return 'border-amber-500/40'
  return 'border-red-500/40'
}

function providerGlow(status: string, active: boolean): string {
  if (!active) return ''
  if (status === 'online') return 'ring-1 ring-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.15)]'
  if (status === 'degraded') return 'ring-1 ring-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
  return ''
}

// ─── Operation status helpers ──────────────────────────────────────────────

function opStatusIcon(status: OperationLog['status']) {
  switch (status) {
    case 'success': return <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
    case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
    case 'error': return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
    default: return <Activity className="h-3.5 w-3.5 text-blue-400 shrink-0" />
  }
}

function opStatusBg(status: OperationLog['status']): string {
  switch (status) {
    case 'success': return 'bg-emerald-500/5 hover:bg-emerald-500/10'
    case 'warning': return 'bg-amber-500/5 hover:bg-amber-500/10'
    case 'error': return 'bg-red-500/5 hover:bg-red-500/10'
    default: return 'bg-blue-500/5 hover:bg-blue-500/10'
  }
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Fallback Chain Arrow ──────────────────────────────────────────────────

function FallbackChain({ chain, active }: { chain: string[]; active: string }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chain.map((item, idx) => (
        <div key={item} className="flex items-center gap-1">
          <span
            className={`text-xs px-2 py-1 rounded-md transition-all ${
              item === active
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold ring-1 ring-emerald-500/30'
                : idx < chain.indexOf(active)
                  ? 'bg-emerald-500/5 text-emerald-500/60 line-through'
                  : 'bg-white/5 text-muted-foreground'
            }`}
          >
            {item}
          </span>
          {idx < chain.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Animation Variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Health cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-white/10 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-24 bg-white/5" />
              <Skeleton className="h-8 w-32 bg-white/5" />
              <Skeleton className="h-4 w-20 bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* AI Router skeleton */}
      <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40 bg-white/5" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg bg-white/5" />
            ))}
          </div>
          <Skeleton className="h-8 w-full bg-white/5" />
        </CardContent>
      </Card>
      {/* Service Health skeleton */}
      <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32 bg-white/5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg bg-white/5" />
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Operations Log skeleton */}
      <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-36 bg-white/5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg bg-white/5" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function OperationsTab() {
  const [data, setData] = useState<OperationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ action: string; result: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/superadmin/operations')
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Quick Actions ──────────────────────────────────────────────────────

  const runHealthCheck = async () => {
    setActionLoading('health')
    setActionResult(null)
    try {
      const start = Date.now()
      const res = await fetch('/api/superadmin/check')
      const latency = Date.now() - start
      const json = await res.json()
      setActionResult({
        action: 'Health Check',
        result: json.authorized
          ? `Authorized ✓ — ${latency}ms`
          : `Unauthorized — ${latency}ms`,
      })
    } catch (err) {
      setActionResult({ action: 'Health Check', result: `Failed: ${err instanceof Error ? err.message : 'Unknown'}` })
    } finally {
      setActionLoading(null)
    }
  }

  const runQASuite = async () => {
    setActionLoading('qa')
    setActionResult(null)
    try {
      const res = await fetch('/api/superadmin/qa/run', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setActionResult({
          action: 'QA Suite',
          result: `${json.totalTests} tests: ${json.passed} passed, ${json.failed} failed (${json.passRate}% pass rate)`,
        })
      } else {
        setActionResult({ action: 'QA Suite', result: `Failed: ${json.error || 'Unknown'}` })
      }
    } catch (err) {
      setActionResult({ action: 'QA Suite', result: `Failed: ${err instanceof Error ? err.message : 'Unknown'}` })
    } finally {
      setActionLoading(null)
    }
  }

  const clearCache = () => {
    setActionLoading('cache')
    setActionResult({ action: 'Clear Cache', result: 'Cache cleared (placeholder action)' })
    setTimeout(() => setActionLoading(null), 1000)
  }

  const restartWorkers = () => {
    setActionLoading('restart')
    setActionResult({ action: 'Restart Workers', result: 'Workers restarted (placeholder action)' })
    setTimeout(() => setActionLoading(null), 1500)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-8 text-center max-w-md">
          <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">Error loading operations data: {error}</p>
          <Button onClick={fetchData} variant="outline" size="sm" className="border-white/10">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </Card>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Operations</h2>
            <p className="text-sm text-muted-foreground">System health, API status, worker status, and AI Router</p>
          </div>
        </motion.div>
        <LoadingSkeleton />
      </div>
    )
  }

  const { healthMetrics, aiProviders, fallbackChain, activeProvider, services, recentOperations } = data

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Operations</h2>
            <p className="text-sm text-muted-foreground">System health, API status, worker status, and AI Router</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="border-white/10 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </motion.div>

      {/* ── Section 1: System Health Overview ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric) => {
          const statusColor = metric.status === 'healthy'
            ? 'text-emerald-400'
            : metric.status === 'warning'
              ? 'text-amber-400'
              : 'text-red-400'
          const statusBorder = metric.status === 'healthy'
            ? 'border-emerald-500/20 hover:border-emerald-500/30'
            : metric.status === 'warning'
              ? 'border-amber-500/20 hover:border-amber-500/30'
              : 'border-red-500/20 hover:border-red-500/30'
          const sparkColor = metric.status === 'healthy'
            ? '#10b981'
            : metric.status === 'warning'
              ? '#f59e0b'
              : '#ef4444'

          const isPositiveDown = metric.label === 'Error Rate' || metric.label === 'API Latency'

          return (
            <motion.div key={metric.label} variants={itemVariants}>
              <Card className={`border-white/10 bg-card/80 backdrop-blur-sm transition-colors ${statusBorder}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {metric.label}
                    </span>
                    <TrendIcon trend={metric.trend} positive={!isPositiveDown} />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className={`text-2xl font-bold ${statusColor}`}>
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-xs text-muted-foreground">{metric.unit}</span>
                    )}
                  </div>
                  {metric.sparkline && (
                    <MiniSparkline data={metric.sparkline} color={sparkColor} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Section 2: AI Router Status ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-400" />
              AI Router Status
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 ml-2">
                {activeProvider} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Provider Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {aiProviders.map((provider) => (
                <div
                  key={provider.provider}
                  className={`relative rounded-lg border p-3 transition-all ${providerBorderColor(provider.status)} bg-card/50 ${providerGlow(provider.status, provider.active)}`}
                >
                  {provider.active && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  )}
                  <div className="flex items-center gap-1.5 mb-2">
                    <StatusDot status={provider.status} />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {provider.name}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate" title={provider.model}>
                      {provider.model}
                    </p>
                    {provider.configured ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {provider.latency}ms
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${provider.costPer1k.toFixed(5)}/1k
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-red-400/70">Not configured</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        provider.status === 'online'
                          ? 'border-emerald-500/30 text-emerald-400'
                          : provider.status === 'degraded'
                            ? 'border-amber-500/30 text-amber-400'
                            : 'border-red-500/30 text-red-400'
                      }`}
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Fallback Chain Visualization */}
            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                Fallback Chain
              </p>
              <FallbackChain chain={fallbackChain} active={activeProvider} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 3: Service Health Grid ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              Service Health
              <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground ml-2">
                {services.filter(s => s.status === 'running').length}/{services.length} healthy
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    service.status === 'running'
                      ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30'
                      : service.status === 'degraded'
                        ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30'
                        : 'bg-red-500/5 border-red-500/20 hover:border-red-500/30'
                  }`}
                >
                  <StatusDot status={service.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {service.name}
                      </span>
                      {service.port && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          :{service.port}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{service.details}</p>
                  </div>
                  {service.responseTime > 0 && (
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {service.responseTime}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 4: Recent Operations Log ────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-400" />
              Recent Operations
              {recentOperations.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {recentOperations.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {recentOperations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent operations recorded
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  <AnimatePresence>
                    {recentOperations.map((op) => (
                      <motion.div
                        key={op.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${opStatusBg(op.status)}`}
                      >
                        {opStatusIcon(op.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground truncate">{op.operation}</span>
                            {op.details && (
                              <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                                — {op.details}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground font-mono">
                            {op.duration}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(op.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 5: Quick Actions Bar ────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Zap className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-foreground">Quick Actions</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runHealthCheck}
                  disabled={actionLoading === 'health'}
                  className="border-white/10 text-muted-foreground hover:text-foreground hover:border-emerald-500/30"
                >
                  {actionLoading === 'health' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  Run Health Check
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runQASuite}
                  disabled={actionLoading === 'qa'}
                  className="border-white/10 text-muted-foreground hover:text-foreground hover:border-emerald-500/30"
                >
                  {actionLoading === 'qa' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run QA Suite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCache}
                  disabled={actionLoading === 'cache'}
                  className="border-white/10 text-muted-foreground hover:text-foreground hover:border-amber-500/30"
                >
                  {actionLoading === 'cache' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Clear Cache
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restartWorkers}
                  disabled={actionLoading === 'restart'}
                  className="border-white/10 text-muted-foreground hover:text-foreground hover:border-amber-500/30"
                >
                  {actionLoading === 'restart' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Server className="h-4 w-4 mr-2" />
                  )}
                  Restart Workers
                </Button>
              </div>
            </div>

            {/* Action result toast-like display */}
            <AnimatePresence>
              {actionResult && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-foreground">
                      <span className="font-medium text-emerald-400">{actionResult.action}:</span>{' '}
                      {actionResult.result}
                    </span>
                    <button
                      onClick={() => setActionResult(null)}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
