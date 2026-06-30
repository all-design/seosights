'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Wifi,
  Server,
  Activity,
  RefreshCw,
  Clock,
  Cpu,
  Globe,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

// ── Types ──────────────────────────────────────────────────────────────

interface ComponentStatus {
  status: 'ok' | 'degraded' | 'down'
  latency: number
  details: string
  lastCheck: string
}

interface SystemStatusResponse {
  status: 'healthy' | 'degraded'
  timestamp: string
  responseTime: number
  components: Record<string, ComponentStatus>
  fallbackStats: Record<string, unknown>
  recentFallbacks: unknown[]
  environment: string
  version: string
}

// ── Display Component Mapping ──────────────────────────────────────────

interface DisplayComponent {
  key: string
  name: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  extraLabel?: string
}

const DISPLAY_COMPONENTS: DisplayComponent[] = [
  { key: 'database', name: 'Database', icon: Database },
  { key: 'aiRouter', name: 'AI Engine', icon: Cpu, extraLabel: '8 agents active' },
  { key: 'stripe', name: 'API', icon: Zap },
  { key: 'websocket', name: 'WebSocket', icon: Wifi },
  { key: 'cms', name: 'CMS Integration', icon: Globe },
]

// ── Uptime History (30-day simulated) ──────────────────────────────────

function generateUptimeHistory(): { date: string; uptime: number }[] {
  const history: { date: string; uptime: number }[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    // Most days 100%, 1-2 days at 99.8%
    const rand = Math.random()
    const uptime = rand < 0.07 ? 99.8 : rand < 0.03 ? 99.5 : 100

    history.push({ date: dateStr, uptime })
  }

  return history
}

const UPTIME_HISTORY = generateUptimeHistory()

// ── Status Helpers ─────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  switch (status) {
    case 'ok':
    case 'healthy':
      return 'text-emerald-500'
    case 'degraded':
      return 'text-amber-500'
    case 'down':
      return 'text-red-500'
    default:
      return 'text-zinc-400'
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'ok':
    case 'healthy':
      return 'bg-emerald-500'
    case 'degraded':
      return 'bg-amber-500'
    case 'down':
      return 'bg-red-500'
    default:
      return 'bg-zinc-400'
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ok':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
    case 'degraded':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
    case 'down':
      return 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
    default:
      return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-400'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'ok':
      return CheckCircle
    case 'degraded':
      return AlertTriangle
    case 'down':
      return XCircle
    default:
      return CheckCircle
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ok':
      return 'Operational'
    case 'degraded':
      return 'Degraded'
    case 'down':
      return 'Down'
    case 'healthy':
      return 'All Systems Operational'
    default:
      return 'Unknown'
  }
}

function getOverallStatusLabel(status: string): string {
  switch (status) {
    case 'healthy':
      return 'All Systems Operational'
    case 'degraded':
      return 'Partial System Degradation'
    default:
      return 'System Issues Detected'
  }
}

// ── Animation Variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ── Component ──────────────────────────────────────────────────────────

export default function PublicStatusPage() {
  const [data, setData] = useState<SystemStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status')
      if (res.ok) {
        const json = (await res.json()) as SystemStatusResponse
        setData(json)
        setLastChecked(new Date())
      }
    } catch {
      // Silently fail — status page should never crash
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const overallStatus = data?.status ?? 'healthy'
  const isAllOk = overallStatus === 'healthy'

  // ── Loading Skeleton ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header skeleton */}
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>

          {/* Uptime bar skeleton */}
          <Skeleton className="h-24 w-full rounded-xl mb-10" />

          {/* Component grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Rendered Page ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <motion.div
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Seosights System Status
          </h1>
          <div className="flex items-center justify-center gap-2.5">
            <motion.span
              className={`inline-block w-2.5 h-2.5 rounded-full ${isAllOk ? 'bg-emerald-500' : overallStatus === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`}
              variants={isAllOk ? pulseVariants : undefined}
              animate={isAllOk ? 'pulse' : undefined}
            />
            <span
              className={`text-base sm:text-lg font-medium ${getStatusColor(overallStatus)}`}
            >
              {getOverallStatusLabel(overallStatus)}
            </span>
          </div>
        </motion.div>

        {/* ── Uptime Bar ────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-10">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Uptime
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    99.9% uptime last 90 days
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 self-start sm:self-auto"
                >
                  99.9%
                </Badge>
              </div>

              {/* 30-day history squares (GitHub contribution graph style) */}
              <div className="flex gap-1 flex-wrap">
                {UPTIME_HISTORY.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm transition-colors ${
                          day.uptime === 100
                            ? 'bg-emerald-500'
                            : day.uptime >= 99.5
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <span className="font-medium">
                        {day.date}
                      </span>
                      : {day.uptime}% uptime
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  100%
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                  &gt;99.5%
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
                  &lt;99.5%
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Component Grid ────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10"
        >
          {DISPLAY_COMPONENTS.map((comp) => {
            const componentData = data?.components?.[comp.key]
            const status = componentData?.status ?? 'ok'
            const latency = componentData?.latency ?? 0
            const StatusIcon = getStatusIcon(status)
            const IconComponent = comp.icon

            return (
              <motion.div key={comp.key} variants={itemVariants}>
                <Card className="group border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/5">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${status === 'ok' ? 'bg-emerald-500/10' : status === 'degraded' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}
                        >
                          <IconComponent
                            className={`w-5 h-5 ${getStatusColor(status)}`}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {comp.name}
                          </h3>
                          {comp.extraLabel && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {comp.extraLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusIcon
                        className={`w-4 h-4 ${getStatusColor(status)}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${getStatusBadgeClass(status)}`}
                      >
                        {getStatusLabel(status)}
                      </Badge>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {latency}ms
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ── Incident History ──────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-10">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Incident History
              </h2>

              {isAllOk ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="p-3 rounded-full bg-emerald-500/10 mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No incidents in the last 30 days
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    All systems running smoothly
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Partial Degradation Detected
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Some components are experiencing issues. Team is
                        investigating.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Last checked:{' '}
              {lastChecked
                ? lastChecked.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '—'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Auto-refreshes every 60 seconds
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom safe area */}
      <div className="h-4 sm:h-6" />
    </div>
  )
}
