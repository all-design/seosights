'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSearch,
  RefreshCcw,
  Search,
  XCircle,
  Clock,
  MessageSquare,
  Bot,
  Sparkles,
  Globe,
  Cpu,
  AlertCircle,
  Activity,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIIndexStatusProps {
  onStartFree?: () => void
}

interface EngineCard {
  id: string
  engine: string
  indexed: boolean
  lastCrawled: string | null
  pagesIndexed: number
  totalPages: number
  citationsFound: number
  completeness: number
  icon: typeof Bot
  color: string
  accentBg: string
  accentBorder: string
  accentText: string
}

interface IndexStatusResponse {
  engines: Array<{
    name: string
    indexed: boolean
    pagesIndexed: number
    citations: number
    lastCrawled: string | null
    completeness: number
  }>
  summary: {
    indexed: number
    total: number
    percentage: number
  }
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Engine meta mapping ───────────────────────────────────────
const ENGINE_META: Record<string, { id: string; icon: typeof Bot; color: string; accentBg: string; accentBorder: string; accentText: string }> = {
  chatgpt: {
    id: 'chatgpt',
    icon: MessageSquare,
    color: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
    accentText: 'text-emerald-400',
  },
  claude: {
    id: 'claude',
    icon: Sparkles,
    color: 'amber',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
    accentText: 'text-amber-400',
  },
  gemini: {
    id: 'gemini',
    icon: Globe,
    color: 'purple',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/20',
    accentText: 'text-purple-400',
  },
  perplexity: {
    id: 'perplexity',
    icon: Search,
    color: 'cyan',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/20',
    accentText: 'text-cyan-400',
  },
  copilot: {
    id: 'copilot',
    icon: Cpu,
    color: 'blue',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/20',
    accentText: 'text-blue-400',
  },
}

// ── Fallback Mock Data ────────────────────────────────────────
const FALLBACK_ENGINES: EngineCard[] = [
  {
    id: 'chatgpt',
    engine: 'ChatGPT',
    indexed: true,
    lastCrawled: '2 hours ago',
    pagesIndexed: 24,
    totalPages: 32,
    citationsFound: 38,
    completeness: 75,
    icon: MessageSquare,
    color: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
    accentText: 'text-emerald-400',
  },
  {
    id: 'claude',
    engine: 'Claude',
    indexed: true,
    lastCrawled: '6 hours ago',
    pagesIndexed: 18,
    totalPages: 32,
    citationsFound: 22,
    completeness: 56,
    icon: Sparkles,
    color: 'amber',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
    accentText: 'text-amber-400',
  },
  {
    id: 'gemini',
    engine: 'Gemini',
    indexed: true,
    lastCrawled: '1 day ago',
    pagesIndexed: 12,
    totalPages: 32,
    citationsFound: 15,
    completeness: 38,
    icon: Globe,
    color: 'purple',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/20',
    accentText: 'text-purple-400',
  },
  {
    id: 'perplexity',
    engine: 'Perplexity',
    indexed: false,
    lastCrawled: null,
    pagesIndexed: 0,
    totalPages: 32,
    citationsFound: 0,
    completeness: 0,
    icon: Search,
    color: 'cyan',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/20',
    accentText: 'text-cyan-400',
  },
  {
    id: 'copilot',
    engine: 'Copilot',
    indexed: false,
    lastCrawled: null,
    pagesIndexed: 0,
    totalPages: 32,
    citationsFound: 0,
    completeness: 0,
    icon: Cpu,
    color: 'blue',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/20',
    accentText: 'text-blue-400',
  },
]

const FALLBACK_SUMMARY = { indexed: 3, total: 5, percentage: 60 }
const FALLBACK_META: IndexStatusResponse['_meta'] = { status: 'simulation', source: 'fallback' }

// ── Helper: map API response → EngineCard[] ──────────────────
function mapApiToEngineCards(data: IndexStatusResponse): EngineCard[] {
  const totalEngines = data.summary.total || data.engines.length
  return data.engines.map((eng) => {
    const key = eng.name.toLowerCase().replace(/[^a-z]/g, '')
    const meta = ENGINE_META[key] || {
      id: key,
      icon: Bot,
      color: 'slate',
      accentBg: 'bg-slate-500/10',
      accentBorder: 'border-slate-500/20',
      accentText: 'text-slate-400',
    }

    // Estimate totalPages from completeness if available
    const completeness = eng.completeness ?? 0
    const pagesIndexed = eng.pagesIndexed ?? 0
    const totalPages = completeness > 0 && pagesIndexed > 0
      ? Math.round((pagesIndexed / completeness) * 100)
      : 32

    return {
      id: meta.id,
      engine: eng.name,
      indexed: eng.indexed,
      lastCrawled: eng.lastCrawled,
      pagesIndexed,
      totalPages,
      citationsFound: eng.citations ?? 0,
      completeness,
      icon: meta.icon,
      color: meta.color,
      accentBg: meta.accentBg,
      accentBorder: meta.accentBorder,
      accentText: meta.accentText,
    }
  })
}

// ── Component ─────────────────────────────────────────────────
export default function AIIndexStatus({ onStartFree }: AIIndexStatusProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const [engines, setEngines] = useState<EngineCard[]>(FALLBACK_ENGINES)
  const [summary, setSummary] = useState(FALLBACK_SUMMARY)
  const [meta, setMeta] = useState(FALLBACK_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/index-status?domain=seosights.com')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data: IndexStatusResponse = await res.json()
      setEngines(mapApiToEngineCards(data))
      setSummary(data.summary)
      setMeta(data._meta)
    } catch (err) {
      console.error('Failed to fetch index status:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to mock data
      setEngines(FALLBACK_ENGINES)
      setSummary(FALLBACK_SUMMARY)
      setMeta(FALLBACK_META)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Derived values ─────────────────────────────────────────
  const indexedCount = summary.indexed
  const totalEngines = summary.total
  const totalPagesIndexed = engines.reduce((sum, e) => sum + e.pagesIndexed, 0)
  const totalCitations = engines.reduce((sum, e) => sum + e.citationsFound, 0)

  // ── Meta badge colour ──────────────────────────────────────
  const metaBadgeVariant = meta.status === 'live'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : meta.status === 'estimated'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-white/10 text-white/40 border-white/10'

  const metaLabel = meta.status === 'live'
    ? '● Live'
    : meta.status === 'estimated'
      ? '◎ Estimated'
      : '○ Simulated'

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

      {/* Gradient glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 bottom-1/4 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <Database className="h-3.5 w-3.5" />
            INDEX TRACKER
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            AI Index{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Status
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            Are you indexed by AI engines? See which engines have discovered your site, how many pages are indexed, and how many citations you&apos;ve earned.
          </p>
        </motion.div>

        {/* Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <CardContent className="p-4 sm:p-5">
              {loading ? (
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-5 w-8" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm text-white/50">Indexed:</span>
                    <span className="text-lg font-bold text-emerald-400">{indexedCount}/{totalEngines}</span>
                    <span className="text-xs text-white/30">engines</span>
                  </div>
                  <div className="w-px h-6 bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <FileSearch className="h-5 w-5 text-purple-400" />
                    <span className="text-sm text-white/50">Pages:</span>
                    <span className="text-lg font-bold text-purple-400">{totalPagesIndexed}</span>
                    <span className="text-xs text-white/30">indexed</span>
                  </div>
                  <div className="w-px h-6 bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-400" />
                    <span className="text-sm text-white/50">Citations:</span>
                    <span className="text-lg font-bold text-amber-400">{totalCitations}</span>
                    <span className="text-xs text-white/30">found</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Engine Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? // Skeleton cards while loading
              Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                >
                  <Card className="h-full border border-white/5 bg-white/[0.02] backdrop-blur-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-2.5 w-20" />
                          <Skeleton className="h-2.5 w-10" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-2.5 w-20" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-7 w-full rounded" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            : // Real engine cards
              engines.map((eng, i) => {
                const completeness = eng.completeness ?? (eng.totalPages > 0 ? Math.round((eng.pagesIndexed / eng.totalPages) * 100) : 0)
                const Icon = eng.icon

                return (
                  <motion.div
                    key={eng.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                  >
                    <Card className={`h-full border ${
                      eng.indexed
                        ? `${eng.accentBorder} bg-white/[0.03]`
                        : 'border-white/5 bg-white/[0.02]'
                    } backdrop-blur-xl transition-all hover:border-white/20`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${eng.accentBg} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${eng.accentText}`} />
                            </div>
                            <span className="text-sm font-semibold text-white/90">{eng.engine}</span>
                          </div>
                          {eng.indexed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-white/20" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                          {eng.indexed ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                Indexed ✅
                              </Badge>
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-white/20" />
                              <Badge className="bg-white/10 text-white/40 border-white/10 text-[10px] px-1.5 py-0">
                                Not Indexed ❌
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Last Crawled */}
                        <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                          <Clock className="h-3 w-3" />
                          {eng.lastCrawled ? (
                            <span>Crawled {eng.lastCrawled}</span>
                          ) : (
                            <span>Never crawled</span>
                          )}
                        </div>

                        {/* Completeness / Pages Indexed */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Pages Indexed</span>
                            <span className="text-[10px] font-mono text-white/50">{eng.pagesIndexed}/{eng.totalPages}</span>
                          </div>
                          <Progress
                            value={completeness}
                            className={`h-1.5 rounded-full bg-white/5 ${
                              eng.indexed
                                ? `[&>div]:bg-emerald-400`
                                : `[&>div]:bg-white/20`
                            }`}
                          />
                        </div>

                        {/* Citations */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">Citations Found</span>
                          <span className={`text-sm font-bold font-mono ${eng.indexed ? eng.accentText : 'text-white/20'}`}>
                            {eng.citationsFound}
                          </span>
                        </div>

                        {/* Re-index button */}
                        <Button
                          onClick={onStartFree}
                          variant="outline"
                          size="sm"
                          className={`w-full h-7 text-[10px] ${
                            eng.indexed
                              ? `${eng.accentBorder} ${eng.accentText} hover:${eng.accentBg}`
                              : 'border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5'
                          }`}
                        >
                          <RefreshCcw className="h-3 w-3 mr-1" />
                          {eng.indexed ? 'Request Re-index' : 'Request Indexing'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
        </div>

        {/* Summary message */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-6"
        >
          <Card className="border border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <FileSearch className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                    Indexing Incomplete
                    {!loading && (
                      <Badge className={`text-[9px] px-1.5 py-0 ${metaBadgeVariant}`}>
                        {metaLabel}
                      </Badge>
                    )}
                  </h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Only <span className="text-amber-400 font-bold">{indexedCount} of {totalEngines}</span> engines have indexed your site. Get indexed by the remaining {totalEngines - indexedCount} to boost your AI Visibility Score.
                  </p>
                </div>
              </div>
              <Button
                onClick={onStartFree}
                variant="outline"
                size="sm"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 shrink-0"
              >
                Get Indexed
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-base"
          >
            Check Your Index Status
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
