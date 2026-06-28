'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  RefreshCw,
  Eye,
  TrendingUp,
  Swords,
  Sparkles,
  Lightbulb,
  Bell,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Activity,
  Shield,
  Zap,
  Globe,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────

interface MissionControlPanelProps {
  domain: string
  userId?: string
}

interface ScoreData {
  overall: number
  trust: number
  freshness: number
  authority: number
}

interface EngineStatus {
  name: string
  indexed: boolean
  citations: number
  lastCrawled: string | null
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  engine: string | null
  delta: number
  severity: string
  createdAt: string
}

interface MissionControlData {
  score: ScoreData
  engines: EngineStatus[]
  recentActivity: ActivityItem[]
  opportunities: number
  alerts: number
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'just now'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(dateStr).toLocaleDateString()
}

function getVerdict(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) return { label: 'Dominant', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' }
  if (score >= 60) return { label: 'Competitive', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' }
  if (score >= 40) return { label: 'Developing', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' }
  return { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#34d399'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

function getStatusBadgeProps(status: 'live' | 'estimated' | 'simulation') {
  switch (status) {
    case 'live':
      return { label: 'Live', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    case 'estimated':
      return { label: 'Estimated', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    case 'simulation':
      return { label: 'Simulation', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
  }
}

function getActivityIcon(type: string, severity: string) {
  const iconClass = 'w-4 h-4 shrink-0'

  switch (type) {
    case 'citation_gained':
      return <Eye className={`${iconClass} text-emerald-400`} />
    case 'citation_lost':
      return <Eye className={`${iconClass} text-red-400`} />
    case 'rank_change':
      return <TrendingUp className={`${iconClass} text-amber-400`} />
    case 'competitor_alert':
      return <Swords className={`${iconClass} text-red-400`} />
    case 'ai_discovery':
      return <Sparkles className={`${iconClass} text-purple-400`} />
    default:
      return <Activity className={`${iconClass} text-white/40`} />
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'positive':
      return 'text-emerald-400'
    case 'warning':
      return 'text-amber-400'
    case 'critical':
      return 'text-red-400'
    case 'info':
      return 'text-purple-400'
    default:
      return 'text-white/50'
  }
}

// ── SVG Circular Gauge ─────────────────────────────────────────────

function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress
  const color = getScoreColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Animated arc */}
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
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black leading-none"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-[11px] text-white/40 mt-1 font-medium">/ 100</span>
      </div>
    </div>
  )
}

// ── Sub-Score Bar ──────────────────────────────────────────────────

function SubScoreBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = getScoreColor(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-medium text-white/60">{label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
    </div>
  )
}

// ── Engine Card ────────────────────────────────────────────────────

function EngineCard({
  engine,
  isExpanded,
  onToggle,
}: {
  engine: EngineStatus
  isExpanded: boolean
  onToggle: () => void
}) {
  const dotColor = engine.indexed ? 'bg-emerald-400' : 'bg-white/20'
  const badgeClass = engine.indexed
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-white/[0.04] text-white/30 border-white/10'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors cursor-pointer ${
          isExpanded ? 'border-white/10' : ''
        }`}
        onClick={onToggle}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
              <span className="text-sm font-semibold text-white/80 truncate">{engine.name}</span>
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${badgeClass}`}>
              {engine.indexed ? 'Indexed' : 'Not Indexed'}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xl font-bold text-white/80">{engine.citations}</span>
            <span className="text-xs text-white/40">citations</span>
          </div>

          {/* Expand toggle indicator */}
          <div className="flex items-center justify-center mt-2">
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/20" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/20" />
            )}
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Status</span>
                    <span className={engine.indexed ? 'text-emerald-400' : 'text-white/30'}>
                      {engine.indexed ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Last Crawled</span>
                    <span className="text-white/60">
                      {engine.lastCrawled ? timeAgo(engine.lastCrawled) : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Citations</span>
                    <span className="text-white/60">{engine.citations}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-48 bg-white/[0.04] rounded-lg" />
          <div className="h-5 w-20 bg-white/[0.04] rounded-full" />
        </div>
        <div className="h-8 w-8 bg-white/[0.04] rounded-lg" />
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Score skeleton */}
        <div className="space-y-5">
          <div className="flex justify-center">
            <div className="h-40 w-40 bg-white/[0.04] rounded-full" />
          </div>
          <div className="h-6 w-24 bg-white/[0.04] rounded-full mx-auto" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-white/[0.04] rounded" />
                  <div className="h-3 w-8 bg-white/[0.04] rounded" />
                </div>
                <div className="h-1.5 w-full bg-white/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Engine grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Activity skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-32 bg-white/[0.04] rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-white/[0.04] rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="bg-white/[0.02] border-white/5">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/80">Failed to load mission data</p>
          <p className="text-xs text-white/40">{message}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────────

export default function MissionControlPanel({ domain, userId }: MissionControlPanelProps) {
  const [data, setData] = useState<MissionControlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, margin: '-50px' })

  // ── Data Fetching ─────────────────────────────────────────────

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({ domain })
      if (userId) params.set('userId', userId)

      const res = await fetch(`/api/ai/mission-control?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const json: MissionControlData = await res.json()
      setData(json)
      setLastRefresh(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [domain, userId])

  // ── Initial Fetch ─────────────────────────────────────────────

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Auto-refresh every 60 seconds ─────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchData])

  // ── Manual Refresh Handler ────────────────────────────────────

  const handleRefresh = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  // ── Toggle Engine Expansion ───────────────────────────────────

  const toggleEngine = useCallback((engineName: string) => {
    setExpandedEngine((prev) => (prev === engineName ? null : engineName))
  }, [])

  // ── Render ────────────────────────────────────────────────────

  const metaStatus = data?._meta.status ?? 'simulation'
  const statusBadge = getStatusBadgeProps(metaStatus)
  const verdict = data ? getVerdict(data.score.overall) : null

  return (
    <div ref={containerRef} className="space-y-5">
      {/* ── Header Row ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white/90 tracking-tight">
            AI Mission Control
          </h2>
          {data && (
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold uppercase tracking-wider ${statusBadge.className}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
              {statusBadge.label}
            </Badge>
          )}
          {lastRefresh && (
            <span className="text-[11px] text-white/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 w-8 p-0 text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </motion.div>

      {/* ── Loading State ──────────────────────────────────────── */}
      {loading && !data && <LoadingSkeleton />}

      {/* ── Error State ────────────────────────────────────────── */}
      {error && !data && <ErrorState message={error} onRetry={handleRefresh} />}

      {/* ── Data Loaded ────────────────────────────────────────── */}
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-5"
        >
          {/* ── Main Grid: Score + Engines ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            {/* ── Score Section ─────────────────────────────────── */}
            <Card className="bg-white/[0.02] border-white/5">
              <CardContent className="p-5 flex flex-col items-center gap-4">
                {/* Circular Gauge */}
                <ScoreGauge score={data.score.overall} />

                {/* Verdict Badge */}
                {verdict && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${verdict.bgColor} ${verdict.color}`}
                  >
                    {verdict.label}
                  </Badge>
                )}

                {/* Sub-scores */}
                <div className="w-full space-y-3 mt-1">
                  <SubScoreBar
                    label="Trust"
                    value={data.score.trust}
                    icon={<Shield className="w-3.5 h-3.5 text-white/40" />}
                  />
                  <SubScoreBar
                    label="Freshness"
                    value={data.score.freshness}
                    icon={<Zap className="w-3.5 h-3.5 text-white/40" />}
                  />
                  <SubScoreBar
                    label="Authority"
                    value={data.score.authority}
                    icon={<Globe className="w-3.5 h-3.5 text-white/40" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Engine Status Grid ────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.engines.map((engine, i) => (
                <motion.div
                  key={engine.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                >
                  <EngineCard
                    engine={engine}
                    isExpanded={expandedEngine === engine.name}
                    onToggle={() => toggleEngine(engine.name)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Activity Feed ───────────────────────────────────── */}
          <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/70">Recent Activity</h3>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">
                  {data.recentActivity.length} events
                </span>
              </div>

              {data.recentActivity.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/30">No recent activity</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {data.recentActivity.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="mt-0.5">{getActivityIcon(item.type, item.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/70 truncate group-hover:text-white/90 transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.engine && (
                            <span className="text-[10px] text-white/30 capitalize">{item.engine}</span>
                          )}
                          {item.delta !== 0 && (
                            <span className={`text-[10px] font-semibold ${getSeverityColor(item.severity)}`}>
                              {item.delta > 0 ? '+' : ''}{item.delta}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-white/25 shrink-0 mt-0.5">
                        {timeAgo(item.createdAt)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/5">
                <button className="text-xs text-white/30 hover:text-white/60 transition-colors">
                  View all activity →
                </button>
              </div>
            </CardContent>
          </Card>

          {/* ── Summary Stats Row ──────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/[0.02] border-white/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4.5 h-4.5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white/80">{data.opportunities}</p>
                  <p className="text-[11px] text-white/40 font-medium">Opportunities</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white/80">{data.alerts}</p>
                  <p className="text-[11px] text-white/40 font-medium">Active Alerts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
