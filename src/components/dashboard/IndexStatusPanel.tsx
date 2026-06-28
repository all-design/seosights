'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw,
  CheckCircle2,
  FileSearch,
  MessageSquare,
  Sparkles,
  Globe,
  Search,
  Cpu,
  AlertTriangle,
  Loader2,
  Zap,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface EngineData {
  name: string
  indexed: boolean
  pagesIndexed: number
  citations: number
  lastCrawled: string | null
  completeness: number
}

interface SummaryData {
  indexed: number
  total: number
  percentage: number
}

interface MetaData {
  status: 'live' | 'estimated' | 'simulation'
  source: 'database' | 'mock' | 'partial'
}

interface IndexStatusResponse {
  engines: EngineData[]
  summary: SummaryData
  _meta: MetaData
}

interface IndexStatusPanelProps {
  domain: string
  userId?: string
}

// ── Engine Config ──────────────────────────────────────────────
const ENGINE_CONFIG: Record<
  string,
  { icon: typeof MessageSquare; color: string; bg: string; border: string; glow: string; track: string }
> = {
  ChatGPT: {
    icon: MessageSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
    track: 'bg-emerald-500/20',
  },
  Claude: {
    icon: Sparkles,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/10',
    track: 'bg-amber-500/20',
  },
  Gemini: {
    icon: Globe,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/10',
    track: 'bg-purple-500/20',
  },
  Perplexity: {
    icon: Search,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/10',
    track: 'bg-cyan-500/20',
  },
  Copilot: {
    icon: Cpu,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    glow: 'shadow-sky-500/10',
    track: 'bg-sky-500/20',
  },
}

const DEFAULT_CONFIG = {
  icon: MessageSquare,
  color: 'text-white/60',
  bg: 'bg-white/5',
  border: 'border-white/10',
  glow: '',
  track: 'bg-white/10',
}

// ── Time Formatting ────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Animated Progress Bar ──────────────────────────────────────
function AnimatedProgress({
  value,
  colorClass,
  trackClass,
}: {
  value: number
  colorClass: string
  trackClass: string
}) {
  return (
    <div className={`relative h-1.5 w-full overflow-hidden rounded-full ${trackClass}`}>
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </div>
  )
}

// ── Skeleton Card ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="border-white/5 bg-white/[0.02]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function IndexStatusPanel({ domain, userId }: IndexStatusPanelProps) {
  const [data, setData] = useState<IndexStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // ── Fetch Data ───────────────────────────────────────────────
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const params = new URLSearchParams({ domain })
        if (userId) params.set('userId', userId)

        const res = await fetch(`/api/ai/index-status?${params.toString()}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch index status (${res.status})`)
        }

        const json: IndexStatusResponse = await res.json()
        setData(json)

        if (isRefresh) {
          toast.success('Index status refreshed')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(message)
        if (isRefresh) {
          toast.error('Failed to refresh index status')
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [domain, userId]
  )

  // ── Initial Fetch & Auto-Refresh ─────────────────────────────
  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 120_000)

    return () => clearInterval(interval)
  }, [fetchData])

  // ── Derived State ────────────────────────────────────────────
  const totalPages = data?.engines.reduce((sum, e) => sum + e.pagesIndexed, 0) ?? 0
  const totalCitations = data?.engines.reduce((sum, e) => sum + e.citations, 0) ?? 0
  const missingEngines = data?.engines.filter((e) => !e.indexed) ?? []
  const metaStatus = data?._meta?.status
  const metaSource = data?._meta?.source

  // ── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
        {/* Summary bar skeleton */}
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
        {/* Engine cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──────────────────────────────────────────────
  if (error && !data) {
    return (
      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white/80 font-medium">Failed to load index status</p>
            <p className="text-white/50 text-sm">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white/90">AI Index Status</h2>
          {data?.summary && (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
            >
              <CheckCircle2 className="size-3" />
              {data.summary.indexed}/{data.summary.total} Indexed
            </Badge>
          )}
          {metaStatus && (
            <Badge
              variant="outline"
              className={`text-[10px] border-white/10 ${
                metaStatus === 'live'
                  ? 'text-emerald-400/70'
                  : metaStatus === 'estimated'
                    ? 'text-amber-400/70'
                    : 'text-white/40'
              }`}
            >
              {metaStatus === 'live' ? '●' : metaStatus === 'estimated' ? '◐' : '○'}{' '}
              {metaSource === 'database' ? 'DB' : metaSource === 'partial' ? 'Partial' : 'Est.'}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="text-white/50 hover:text-white/80 hover:bg-white/5"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* ── Error Banner (when data exists but refresh failed) ─── */}
      <AnimatePresence>
        {error && data && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle className="size-3.5" />
                  <span>Last refresh failed. Showing cached data.</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchData(true)}
                  className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 h-7 text-xs"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary Bar ────────────────────────────────────────── */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold text-white/90">
                  {data?.summary?.indexed ?? 0}
                  <span className="text-sm text-white/40 font-normal">/{data?.summary?.total ?? 0}</span>
                </p>
                <p className="text-xs text-white/50 truncate">Engines Indexed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <FileSearch className="size-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold text-white/90">{totalPages}</p>
                <p className="text-xs text-white/50 truncate">Pages Indexed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="size-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-semibold text-white/90">{totalCitations}</p>
                <p className="text-xs text-white/50 truncate">Citations Found</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Engine Cards Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {data?.engines.map((engine, index) => {
            const config = ENGINE_CONFIG[engine.name] ?? DEFAULT_CONFIG
            const Icon = config.icon

            return (
              <motion.div
                key={engine.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                layout
              >
                <Card
                  className={`border bg-white/[0.02] transition-all duration-200 hover:bg-white/[0.04] ${config.border} hover:shadow-lg hover:${config.glow} group cursor-default`}
                >
                  <CardContent className="p-4 space-y-3.5">
                    {/* Engine header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <Icon className={`size-4 ${config.color}`} />
                        </div>
                        <span className="font-medium text-sm text-white/80">{engine.name}</span>
                      </div>
                      {engine.indexed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15 text-[10px] px-1.5 py-0 h-5">
                          <span className="relative flex size-1.5 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full size-1.5 bg-emerald-400" />
                          </span>
                          Indexed
                        </Badge>
                      ) : (
                        <Badge className="bg-white/5 text-white/40 border-white/10 hover:bg-white/10 text-[10px] px-1.5 py-0 h-5">
                          <Circle className="size-1.5 fill-white/30 text-white/30 mr-1" />
                          Not Indexed
                        </Badge>
                      )}
                    </div>

                    {/* Last crawled */}
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <span>Last crawled:</span>
                      <span className="text-white/50">{timeAgo(engine.lastCrawled)}</span>
                    </div>

                    {/* Pages indexed progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50">Pages indexed</span>
                        <span className="text-xs font-medium text-white/70">{engine.pagesIndexed}</span>
                      </div>
                      <AnimatedProgress
                        value={engine.completeness}
                        colorClass={config.color.replace('text-', 'bg-')}
                        trackClass={config.track}
                      />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">
                        <span className="text-white/60 font-medium">{engine.citations}</span> citations
                      </span>
                      <span className={`${config.color} font-medium`}>{engine.completeness}%</span>
                    </div>

                    {/* Action button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full h-8 text-xs border-white/10 ${config.color} hover:${config.color} hover:${config.bg} hover:${config.border} transition-colors`}
                      onClick={() => {
                        if (engine.indexed) {
                          toast.info(`Re-index requested for ${engine.name}`, {
                            description: 'Your request has been submitted. This may take a few hours.',
                          })
                        } else {
                          toast.info(`Indexing requested for ${engine.name}`, {
                            description: 'Your request has been submitted. This may take 24-48 hours.',
                          })
                        }
                      }}
                    >
                      {engine.indexed ? (
                        <>
                          <RefreshCw className="size-3" />
                          Request Re-index
                        </>
                      ) : (
                        <>
                          <Zap className="size-3" />
                          Request Indexing
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* ── Alert Card ─────────────────────────────────────────── */}
      <AnimatePresence>
        {missingEngines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-300">Indexing Incomplete</p>
                    <p className="text-xs text-amber-400/60 mt-0.5">
                      {missingEngines.length} {missingEngines.length === 1 ? 'engine' : 'engines'} not indexing your
                      site:{' '}
                      {missingEngines.map((e) => e.name).join(', ')}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25 hover:text-amber-200 shadow-none"
                  onClick={() => {
                    toast.info('Get Indexed request submitted', {
                      description: `Requesting indexing for: ${missingEngines.map((e) => e.name).join(', ')}`,
                    })
                  }}
                >
                  <Zap className="size-3.5" />
                  Get Indexed
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
