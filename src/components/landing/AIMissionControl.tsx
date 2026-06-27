'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  ArrowRight,
  ChevronRight,
  Clock,
  Eye,
  Crosshair,
  Search,
  Radio,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  Bell,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIMissionControlProps {
  onStartFree?: () => void
}

interface MissionControlResponse {
  score: {
    overall: number
    trust: number
    freshness: number
    authority: number
  }
  engines: Array<{
    name: string
    indexed: boolean
    citations: number
    lastCrawled: string | null
  }>
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    engine: string | null
    delta: number
    severity: string
    createdAt: string
  }>
  opportunities: number
  alerts: number
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

type Verdict = 'Critical' | 'Developing' | 'Competitive' | 'Dominant'

// ── Fallback Mock Data ────────────────────────────────────────
const FALLBACK_DATA: MissionControlResponse = {
  score: { overall: 71, trust: 68, freshness: 74, authority: 70 },
  engines: [
    { name: 'ChatGPT', indexed: true, citations: 24, lastCrawled: '2025-01-14T10:30:00Z' },
    { name: 'Claude', indexed: true, citations: 18, lastCrawled: '2025-01-14T09:15:00Z' },
    { name: 'Gemini', indexed: true, citations: 12, lastCrawled: '2025-01-13T22:00:00Z' },
    { name: 'Perplexity', indexed: false, citations: 0, lastCrawled: null },
    { name: 'Copilot', indexed: true, citations: 8, lastCrawled: '2025-01-14T07:45:00Z' },
  ],
  recentActivity: [
    { id: '1', type: 'citation', title: 'ChatGPT cited your FAQ page', description: 'Your FAQ was referenced in a ChatGPT response', engine: 'ChatGPT', delta: 0, severity: 'info', createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: '2', type: 'score', title: 'Score increased +3 points', description: 'Overall visibility score improved', engine: null, delta: 3, severity: 'positive', createdAt: new Date(Date.now() - 1080000).toISOString() },
    { id: '3', type: 'crawl', title: 'GPTBot crawled /pricing', description: 'GPTBot visited your pricing page', engine: 'ChatGPT', delta: 0, severity: 'info', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  opportunities: 5,
  alerts: 1,
  _meta: { status: 'simulation', source: 'fallback' },
}

const QUICK_ACTIONS = [
  { label: 'Run Scan', icon: Search, variant: 'default' as const },
  { label: 'View Opportunities', icon: Crosshair, variant: 'outline' as const },
  { label: 'Check Competitors', icon: Shield, variant: 'outline' as const },
]

// ── Helpers ───────────────────────────────────────────────────
function getVerdict(score: number): Verdict {
  if (score < 30) return 'Critical'
  if (score < 55) return 'Developing'
  if (score < 80) return 'Competitive'
  return 'Dominant'
}

const verdictConfig: Record<Verdict, { bg: string; text: string; icon: typeof Zap }> = {
  Critical: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: AlertCircle },
  Developing: { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400', icon: Clock },
  Competitive: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', icon: TrendingUp },
  Dominant: { bg: 'bg-emerald-400/20 border-emerald-400/30', text: 'text-emerald-300', icon: Zap },
}

function getEngineColorClass(name: string): { text: string; dot: string } {
  const map: Record<string, { text: string; dot: string }> = {
    'ChatGPT': { text: 'text-emerald-400', dot: 'bg-emerald-400' },
    'Claude': { text: 'text-amber-400', dot: 'bg-amber-400' },
    'Gemini': { text: 'text-purple-400', dot: 'bg-purple-400' },
    'Perplexity': { text: 'text-cyan-400', dot: 'bg-cyan-400' },
    'Copilot': { text: 'text-blue-400', dot: 'bg-blue-400' },
  }
  return map[name] || { text: 'text-white/60', dot: 'bg-white/40' }
}

function getFeedIcon(type: string) {
  switch (type) {
    case 'citation': return <Eye className="h-3.5 w-3.5 text-emerald-400" />
    case 'score': return <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
    case 'crawl': return <Activity className="h-3.5 w-3.5 text-purple-400" />
    case 'alert': return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
    default: return <Radio className="h-3.5 w-3.5 text-white/50" />
  }
}

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'positive': return 'text-emerald-400'
    case 'negative': return 'text-red-400'
    case 'warning': return 'text-amber-400'
    default: return 'text-white/50'
  }
}

// ── Gauge Component ───────────────────────────────────────────
function ScoreGauge({ score, isInView }: { score: number; isInView: boolean }) {
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress

  const color = score < 40 ? '#ef4444' : score <= 70 ? '#f59e0b' : '#10b981'

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        {/* Background track */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: dashOffset } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold font-mono tracking-tight"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/40 font-mono">/100</span>
      </div>
    </div>
  )
}

// ── Skeleton Loader Components ────────────────────────────────
function ScoreGaugeSkeleton() {
  return (
    <div className="relative w-44 h-44 mx-auto">
      <div className="w-full h-full rounded-full bg-white/5 animate-pulse flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-10 w-12 mx-auto bg-white/10" />
          <Skeleton className="h-3 w-8 mx-auto mt-1 bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function EngineStatusSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
          <Skeleton className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-16 bg-white/10" />
            <Skeleton className="h-2.5 w-12 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
          <Skeleton className="h-3.5 w-3.5 rounded bg-white/10" />
          <Skeleton className="flex-1 h-3.5 bg-white/10" />
          <Skeleton className="h-2.5 w-10 bg-white/10" />
        </div>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function AIMissionControl({ onStartFree }: AIMissionControlProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const [data, setData] = useState<MissionControlResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true)
    try {
      const res = await fetch('/api/ai/mission-control?domain=seosights.com')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const json: MissionControlResponse = await res.json()
      setData(json)
      setError(null)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to fetch mission control data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch')
      // Fallback to hardcoded data if no data yet
      if (!data) {
        setData(FALLBACK_DATA)
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [data])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Derived values
  const displayData = data || FALLBACK_DATA
  const overallScore = displayData.score.overall
  const verdict = getVerdict(overallScore)
  const vc = verdictConfig[verdict]
  const VerdictIcon = vc.icon
  const indexedCount = displayData.engines.filter(e => e.indexed).length
  const totalCitations = displayData.engines.reduce((sum, e) => sum + e.citations, 0)

  return (
    <section ref={ref} className="relative w-full py-16 md:py-24 overflow-hidden bg-[#0a0a0f]">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-emerald-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {displayData._meta.status === 'live' ? 'LIVE DASHBOARD' : displayData._meta.status === 'estimated' ? 'ESTIMATED DASHBOARD' : 'SIMULATED DASHBOARD'}
            {error && (
              <span className="text-amber-400/70 ml-1" title={`API error: ${error}. Using fallback data.`}>(offline)</span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            AI Mission{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Control
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            Your unified command center. See your AI Visibility Score, engine status, and activity — all in one glance.
          </p>
          {/* Last refreshed indicator */}
          {lastRefreshed && !isLoading && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-white/25">
              <button
                onClick={() => fetchData(true)}
                className="inline-flex items-center gap-1 hover:text-white/40 transition-colors"
                aria-label="Refresh data"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Updated {timeAgo(lastRefreshed.toISOString())}
              </button>
            </div>
          )}
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* ─── Left Column: Score Gauge ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="h-full border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                    AI Visibility Score
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-12 bg-white/10" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      {displayData.score.overall}/100
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-2">
                {isLoading ? (
                  <ScoreGaugeSkeleton />
                ) : (
                  <ScoreGauge score={displayData.score.overall} isInView={isInView} />
                )}

                {/* Verdict badge */}
                {isLoading ? (
                  <Skeleton className="h-7 w-28 rounded-md bg-white/10" />
                ) : (
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${vc.bg} ${vc.text}`}>
                    <VerdictIcon className="h-3.5 w-3.5" />
                    {verdict}
                  </span>
                )}

                {/* Sub-scores */}
                {!isLoading && (
                  <div className="w-full grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
                      <div className="text-sm font-mono font-semibold text-purple-400">{displayData.score.trust}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">Trust</div>
                    </div>
                    <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
                      <div className="text-sm font-mono font-semibold text-amber-400">{displayData.score.freshness}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">Fresh</div>
                    </div>
                    <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
                      <div className="text-sm font-mono font-semibold text-cyan-400">{displayData.score.authority}</div>
                      <div className="text-[9px] uppercase tracking-wider text-white/30">Auth</div>
                    </div>
                  </div>
                )}

                {/* Progress bar as secondary indicator */}
                <div className="w-full">
                  {isLoading ? (
                    <Skeleton className="h-2 w-full rounded-full bg-white/10" />
                  ) : (
                    <Progress
                      value={displayData.score.overall}
                      className="h-2 rounded-full bg-white/10 [&>div]:bg-emerald-400"
                    />
                  )}
                </div>

                {/* Summary stats row */}
                {!isLoading && (
                  <div className="w-full flex items-center justify-between text-[10px] text-white/30 border-t border-white/5 pt-3">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3 w-3 text-emerald-400/60" />
                      {displayData.opportunities} opportunities
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bell className="h-3 w-3 text-amber-400/60" />
                      {displayData.alerts} alert{displayData.alerts !== 1 ? 's' : ''}
                    </span>
                    <span className="font-mono">
                      {totalCitations} citations
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Right Column: Engine Status + Feed + Actions ─── */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            {/* Engine Status Row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                      <Activity className="h-4 w-4 text-white/40" />
                      Engine Status
                    </span>
                    <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] px-2">
                      {isLoading ? '...' : `${indexedCount}/${displayData.engines.length} Indexed`}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <EngineStatusSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {displayData.engines.map((eng, i) => {
                        const colors = getEngineColorClass(eng.name)
                        return (
                          <motion.div
                            key={eng.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.35 + i * 0.07 }}
                            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${eng.indexed ? colors.dot : 'bg-white/20'} ${eng.indexed ? 'animate-pulse' : ''}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium truncate ${eng.indexed ? colors.text : 'text-white/30'}`}>
                                  {eng.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {eng.indexed ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[10px] text-emerald-400">Indexed</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 text-white/30" />
                                    <span className="text-[10px] text-white/30">Not Indexed</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {eng.citations > 0 && (
                              <span className="text-[10px] font-mono text-white/40 shrink-0">
                                {eng.citations} cit.
                              </span>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.label}
                        variant={action.variant}
                        size="sm"
                        onClick={onStartFree}
                        className={
                          action.variant === 'default'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-semibold'
                            : 'border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                        }
                      >
                        <action.icon className="h-4 w-4 mr-1.5" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                    <Radio className="h-4 w-4 text-white/40" />
                    Real-time Activity
                    <span className="relative ml-1 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    {/* Status badge */}
                    {!isLoading && (
                      <Badge
                        className={`ml-auto text-[9px] px-1.5 py-0 border ${
                          displayData._meta.status === 'live'
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                            : displayData._meta.status === 'estimated'
                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                            : 'bg-white/10 border-white/10 text-white/40'
                        }`}
                      >
                        {displayData._meta.status}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <ActivityFeedSkeleton />
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                      {displayData.recentActivity.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                        >
                          <div className="shrink-0">{getFeedIcon(item.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 truncate">{item.title}</p>
                            {item.description && item.description !== item.title && (
                              <p className="text-[10px] text-white/30 truncate">{item.description}</p>
                            )}
                          </div>
                          {item.delta !== 0 && (
                            <span className={`shrink-0 text-[10px] font-mono font-semibold ${item.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.delta > 0 ? '+' : ''}{item.delta}
                            </span>
                          )}
                          <span className="shrink-0 text-[10px] font-mono text-white/30">{timeAgo(item.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-base"
          >
            Open Mission Control
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/30">
            <ArrowRight className="h-3 w-3" />
            No credit card required
          </div>
        </motion.div>
      </div>
    </section>
  )
}
