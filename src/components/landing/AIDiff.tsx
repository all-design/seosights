'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRight,
  ArrowUpDown,
  ChevronRight,
  Clock,
  GitCompareArrows,
  Plus,
  Minus,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIDiffProps {
  onStartFree?: () => void
}

type DiffType = 'gained' | 'lost' | 'changed'

interface DiffEntry {
  id: string
  engine: string
  type: DiffType
  metric: string
  before: string
  after: string
  detail: string
}

// ── API Response Types ────────────────────────────────────────
interface PeriodScore {
  score: {
    overall: number
    trust: number
    freshness: number
    authority: number
  }
  perEngine: Record<string, number>
}

interface DiffChanges {
  gained: string[]
  lost: string[]
  positionChanges: Array<{ engine: string; before: number; after: number; delta: number }>
  scoreDelta: number
}

interface DiffResponse {
  before: PeriodScore
  after: PeriodScore
  changes: DiffChanges
  summary: string
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

interface ResolvedData {
  beforeScore: number
  afterScore: number
  scoreDelta: number
  entries: DiffEntry[]
  summary: string
  meta: DiffResponse['_meta']
}

// ── Time Range Options ────────────────────────────────────────
interface TimeRange {
  label: string
  value: string
  days: number
}

const TIME_RANGES: TimeRange[] = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '14 Days', value: '14d', days: 14 },
  { label: '30 Days', value: '30d', days: 30 },
]

// ── Fallback Mock Data ────────────────────────────────────────
function buildFallbackData(): ResolvedData {
  return {
    beforeScore: 58,
    afterScore: 65,
    scoreDelta: 7,
    summary: 'AI Visibility improved by 7 points. Key gains on ChatGPT and Perplexity, with a minor loss on Gemini.',
    meta: { status: 'simulation', source: 'fallback' },
    entries: [
      { id: '1', engine: 'ChatGPT', type: 'gained', metric: 'Citations', before: '18', after: '21', detail: '+3 new citations on FAQ and pricing pages' },
      { id: '2', engine: 'Claude', type: 'changed', metric: 'Position', before: '#4', after: '#3', detail: 'Moved up one position for key query' },
      { id: '3', engine: 'Gemini', type: 'gained', metric: 'Pages Indexed', before: '6', after: '8', detail: '+2 pages discovered by Gemini crawler' },
      { id: '4', engine: 'Copilot', type: 'lost', metric: 'Mentions', before: '5', after: '3', detail: 'Lost 2 mentions in comparison queries' },
      { id: '5', engine: 'Perplexity', type: 'changed', metric: 'Position', before: '#8', after: '#6', detail: 'Improved 2 positions for brand queries' },
    ],
  }
}

// ── Map API response to UI data ───────────────────────────────
function mapApiResponse(api: DiffResponse): ResolvedData {
  const entries: DiffEntry[] = []
  let idCounter = 0

  // Gained entries
  for (const g of api.changes.gained) {
    const engine = g.split(':')[0]?.trim() || 'Unknown'
    const detail = g.split(':').slice(1).join(':').trim() || g
    entries.push({
      id: `g-${idCounter++}`,
      engine: capitalizeEngine(engine),
      type: 'gained',
      metric: 'Citations',
      before: '-',
      after: '+1',
      detail,
    })
  }

  // Lost entries
  for (const l of api.changes.lost) {
    const engine = l.split(':')[0]?.trim() || 'Unknown'
    const detail = l.split(':').slice(1).join(':').trim() || l
    entries.push({
      id: `l-${idCounter++}`,
      engine: capitalizeEngine(engine),
      type: 'lost',
      metric: 'Mentions',
      before: '+1',
      after: '-',
      detail,
    })
  }

  // Position changes
  for (const pc of api.changes.positionChanges) {
    if (pc.delta === 0) continue
    entries.push({
      id: `pc-${idCounter++}`,
      engine: capitalizeEngine(pc.engine),
      type: 'changed',
      metric: 'Position',
      before: `#${pc.before}`,
      after: `#${pc.after}`,
      detail: `${pc.delta > 0 ? 'Improved' : 'Dropped'} ${Math.abs(pc.delta)} position${Math.abs(pc.delta) !== 1 ? 's' : ''} on ${capitalizeEngine(pc.engine)}`,
    })
  }

  return {
    beforeScore: api.before.score.overall,
    afterScore: api.after.score.overall,
    scoreDelta: api.changes.scoreDelta,
    summary: api.summary,
    meta: api._meta,
    entries,
  }
}

function capitalizeEngine(engine: string): string {
  const map: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    copilot: 'Copilot',
  }
  return map[engine.toLowerCase()] || engine.charAt(0).toUpperCase() + engine.slice(1)
}

// ── Helpers ───────────────────────────────────────────────────
function diffTypeConfig(type: DiffType) {
  switch (type) {
    case 'gained':
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: <Plus className="h-3.5 w-3.5" />,
        label: 'Gained',
        highlight: 'bg-emerald-500/5',
      }
    case 'lost':
      return {
        bg: 'bg-red-500/10 border-red-500/20',
        text: 'text-red-400',
        badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <Minus className="h-3.5 w-3.5" />,
        label: 'Lost',
        highlight: 'bg-red-500/5',
      }
    case 'changed':
      return {
        bg: 'bg-amber-500/10 border-amber-500/20',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: <ArrowUpDown className="h-3.5 w-3.5" />,
        label: 'Changed',
        highlight: 'bg-amber-500/5',
      }
  }
}

function getEngineColor(engine: string) {
  const map: Record<string, string> = {
    ChatGPT: 'text-emerald-400',
    Claude: 'text-amber-400',
    Gemini: 'text-purple-400',
    Perplexity: 'text-cyan-400',
    Copilot: 'text-blue-400',
  }
  return map[engine] || 'text-white/60'
}

function metaStatusConfig(status: DiffResponse['_meta']['status']) {
  switch (status) {
    case 'live':
      return {
        icon: <Wifi className="h-3 w-3" />,
        label: 'Live',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      }
    case 'estimated':
      return {
        icon: <Activity className="h-3 w-3" />,
        label: 'Estimated',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      }
    case 'simulation':
      return {
        icon: <WifiOff className="h-3 w-3" />,
        label: 'Simulation',
        className: 'bg-white/10 text-white/40 border-white/20',
      }
  }
}

// ── Skeleton Loader ───────────────────────────────────────────
function DiffSkeleton() {
  return (
    <div className="space-y-6">
      {/* Score skeleton */}
      <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-2 bg-white/10" />
              <Skeleton className="h-10 w-16 mx-auto bg-white/10" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-6 w-6 bg-white/10" />
              <Skeleton className="h-4 w-16 bg-white/10" />
            </div>
            <div className="text-center">
              <Skeleton className="h-3 w-12 mx-auto mb-2 bg-white/10" />
              <Skeleton className="h-10 w-16 mx-auto bg-white/10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {[1, 2].map((col) => (
          <div key={col}>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-4 bg-white/10" />
              <Skeleton className="h-3 w-20 bg-white/10" />
            </div>
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16 bg-white/10" />
                      <Skeleton className="h-3 w-12 bg-white/10" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Skeleton className="h-6 w-8 bg-white/10" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <Skeleton className="h-7 w-8 mx-auto bg-white/10" />
            <Skeleton className="h-3 w-12 mx-auto mt-1 bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function AIDiff({ onStartFree }: AIDiffProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const [selectedRange, setSelectedRange] = useState<string>('30d')
  const [data, setData] = useState<ResolvedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch diff data ────────────────────────────────────────
  const fetchDiff = useCallback(async (days: number) => {
    setLoading(true)
    setError(null)

    const now = new Date()
    const before = new Date(now.getTime() - days * 24 * 3600000)

    try {
      const params = new URLSearchParams({
        domain: 'seosights.com',
        before: before.toISOString(),
        after: now.toISOString(),
      })

      const res = await fetch(`/api/ai/diff?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`)
      }

      const json: DiffResponse = await res.json()
      const mapped = mapApiResponse(json)

      // If no entries were derived from the API, use fallback
      if (mapped.entries.length === 0) {
        const fallback = buildFallbackData()
        setData(fallback)
      } else {
        setData(mapped)
      }
    } catch (err) {
      console.warn('[AIDiff] Fetch failed, using fallback data:', err instanceof Error ? err.message : 'Unknown error')
      setError(err instanceof Error ? err.message : 'Failed to load diff data')
      setData(buildFallbackData())
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and when range changes
  useEffect(() => {
    const range = TIME_RANGES.find((r) => r.value === selectedRange)
    const days = range?.days ?? 30
    fetchDiff(days)
  }, [selectedRange, fetchDiff])

  const scoreDelta = data ? data.afterScore - data.beforeScore : 0

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
      <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <GitCompareArrows className="h-3.5 w-3.5" />
            SCAN COMPARISON
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            AI{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Diff
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            See exactly what changed between scans. New citations, lost mentions, position shifts — every change, color-coded.
          </p>
        </motion.div>

        {/* Timeline Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 flex flex-wrap items-center justify-center gap-2"
        >
          <Calendar className="h-4 w-4 text-white/40 mr-1" />
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRange(r.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                selectedRange === r.value
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <DiffSkeleton />
        ) : data ? (
          <>
            {/* Score Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
                    {/* Before */}
                    <div className="text-center">
                      <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Before</span>
                      <div className="text-4xl font-bold font-mono text-white/70 mt-1">{data.beforeScore}</div>
                    </div>

                    {/* Arrow + Delta */}
                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight className="h-6 w-6 text-white/30" />
                      <span className={`inline-flex items-center gap-1 text-sm font-bold font-mono ${
                        scoreDelta > 0 ? 'text-emerald-400' : scoreDelta < 0 ? 'text-red-400' : 'text-white/50'
                      }`}>
                        {scoreDelta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : scoreDelta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                        {scoreDelta > 0 ? '+' : ''}{scoreDelta} pts
                      </span>
                    </div>

                    {/* After */}
                    <div className="text-center">
                      <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">After</span>
                      <div className={`text-4xl font-bold font-mono mt-1 ${
                        scoreDelta > 0 ? 'text-emerald-400' : scoreDelta < 0 ? 'text-red-400' : 'text-white/70'
                      }`}>{data.afterScore}</div>
                    </div>
                  </div>

                  {/* Summary text + Meta badge */}
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <p className="text-xs text-white/40 text-center max-w-md">{data.summary}</p>
                    <Badge className={`${metaStatusConfig(data.meta.status).className} text-[10px] px-2 py-0.5 border flex items-center gap-1`}>
                      {metaStatusConfig(data.meta.status).icon}
                      {metaStatusConfig(data.meta.status).label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Diff Entries — Side by Side */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRange}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Before Column */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-white/40" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Before Scan</span>
                    </div>
                    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                      <CardContent className="p-4 space-y-3">
                        {data.entries.map((entry) => {
                          const cfg = diffTypeConfig(entry.type)
                          return (
                            <div
                              key={`before-${entry.id}`}
                              className={`rounded-lg border border-white/5 ${entry.type === 'lost' ? cfg.highlight : 'bg-white/[0.02]'} px-3 py-2.5`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${getEngineColor(entry.engine)}`}>{entry.engine}</span>
                                <span className="text-xs text-white/40">{entry.metric}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg font-bold font-mono text-white/60">{entry.before}</span>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {/* After Column */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <RotateCcw className="h-4 w-4 text-white/40" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">After Scan</span>
                    </div>
                    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                      <CardContent className="p-4 space-y-3">
                        {data.entries.map((entry, i) => {
                          const cfg = diffTypeConfig(entry.type)
                          return (
                            <motion.div
                              key={`after-${entry.id}`}
                              initial={{ opacity: 0, x: 8 }}
                              animate={isInView ? { opacity: 1, x: 0 } : {}}
                              transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                              className={`rounded-lg border ${cfg.bg} ${cfg.highlight} px-3 py-2.5`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${getEngineColor(entry.engine)}`}>{entry.engine}</span>
                                  <Badge className={`${cfg.badgeBg} text-[10px] px-1.5 py-0 border`}>
                                    {cfg.icon}
                                    <span className="ml-0.5">{cfg.label}</span>
                                  </Badge>
                                </div>
                                <span className="text-xs text-white/40">{entry.metric}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg font-bold font-mono text-white/60 line-through decoration-white/20">{entry.before}</span>
                                <ArrowRight className="h-3 w-3 text-white/30" />
                                <span className={`text-lg font-bold font-mono ${cfg.text}`}>{entry.after}</span>
                              </div>
                              <p className="text-[11px] text-white/40 mt-1">{entry.detail}</p>
                            </motion.div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[
                { label: 'Gained', count: data.entries.filter(e => e.type === 'gained').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { label: 'Lost', count: data.entries.filter(e => e.type === 'lost').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                { label: 'Changed', count: data.entries.filter(e => e.type === 'changed').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-lg border ${stat.bg} px-4 py-3 text-center`}
                >
                  <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.count}</div>
                  <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Alert for lost items */}
            {data.entries.some(e => e.type === 'lost') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.65 }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300">
                  You lost visibility in {data.entries.filter(e => e.type === 'lost').length} area{data.entries.filter(e => e.type === 'lost').length > 1 ? 's' : ''}. Take action to recover.
                </span>
              </motion.div>
            )}
          </>
        ) : null}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-base"
          >
            View Your Diff
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
