'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  GitCompareArrows,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  BarChart3,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface DiffPanelProps {
  domain: string
  userId?: string
}

interface ScoreBreakdown {
  overall: number
  trust: number
  freshness: number
  authority: number
}

interface PerEngine {
  chatgpt: number
  claude: number
  gemini: number
  perplexity: number
  copilot: number
}

interface PositionChange {
  engine: string
  before: number
  after: number
  delta: number
}

interface DiffChanges {
  gained: string[]
  lost: string[]
  positionChanges: PositionChange[]
  scoreDelta: number
}

interface DiffMeta {
  status: 'live' | 'estimated' | 'simulation'
  source: 'database' | 'mock' | 'partial'
}

interface DiffData {
  before: {
    score: ScoreBreakdown
    perEngine: PerEngine
  }
  after: {
    score: ScoreBreakdown
    perEngine: PerEngine
  }
  changes: DiffChanges
  summary: string
  _meta: DiffMeta
}

type DateRangePreset = '7d' | '30d' | '90d' | 'custom'

// ── Helpers ───────────────────────────────────────────────────
function getEngineColor(engine: string): string {
  const map: Record<string, string> = {
    chatgpt: 'text-emerald-400',
    claude: 'text-amber-400',
    gemini: 'text-purple-400',
    perplexity: 'text-cyan-400',
    copilot: 'text-rose-400',
  }
  return map[engine.toLowerCase()] || 'text-white/60'
}

function getEngineBarColor(engine: string): string {
  const map: Record<string, string> = {
    chatgpt: 'bg-emerald-500',
    claude: 'bg-amber-500',
    gemini: 'bg-purple-500',
    perplexity: 'bg-cyan-500',
    copilot: 'bg-rose-500',
  }
  return map[engine.toLowerCase()] || 'bg-white/30'
}

function getEngineLabel(engine: string): string {
  const map: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    copilot: 'Copilot',
  }
  return map[engine.toLowerCase()] || engine
}

function getEngineFromGainedLost(text: string): string {
  const engines = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot']
  for (const e of engines) {
    if (text.toLowerCase().includes(e.toLowerCase())) return e
  }
  return 'Unknown'
}

function formatDateISO(date: Date): string {
  return date.toISOString()
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDateRange(preset: DateRangePreset, customBefore?: string, customAfter?: string): { before: string; after: string } {
  const now = new Date()
  if (preset === 'custom' && customBefore && customAfter) {
    return {
      before: customBefore,
      after: customAfter,
    }
  }
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[preset] || 7
  const before = new Date(now)
  before.setDate(before.getDate() - days * 2)
  const after = new Date(now)
  after.setDate(after.getDate() - days)
  return {
    before: formatDateISO(before),
    after: formatDateISO(after),
  }
}

function getStatusBadgeConfig(status: string): { color: string; bgColor: string; label: string } {
  switch (status) {
    case 'live':
      return { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', label: 'Live' }
    case 'estimated':
      return { color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30', label: 'Estimated' }
    case 'simulation':
      return { color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30', label: 'Simulation' }
    default:
      return { color: 'text-white/50', bgColor: 'bg-white/10 border-white/20', label: status }
  }
}

// ── Animated Counter ──────────────────────────────────────────
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = prevRef.current
    const end = value
    prevRef.current = value
    if (start === end) return

    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <>{display}</>
}

// ── Loading Skeleton ──────────────────────────────────────────
function DiffSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-24 bg-white/5 rounded-lg" />
          <div className="h-5 w-16 bg-white/5 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-white/5 rounded-lg" />
          <div className="h-8 w-20 bg-white/5 rounded-lg" />
          <div className="h-8 w-20 bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* Score summary skeleton */}
      <div className="h-28 bg-white/[0.02] rounded-xl border border-white/5" />

      {/* Diff grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="h-5 w-24 bg-white/5 rounded" />
          <div className="h-48 bg-white/[0.02] rounded-xl border border-white/5" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-24 bg-white/5 rounded" />
          <div className="h-48 bg-white/[0.02] rounded-xl border border-white/5" />
        </div>
      </div>

      {/* Changes skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-28 bg-white/5 rounded" />
        <div className="h-16 bg-white/[0.02] rounded-lg border border-white/5" />
        <div className="h-16 bg-white/[0.02] rounded-lg border border-white/5" />
      </div>
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <TriangleAlert className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-sm font-semibold text-white/80 mb-1">Failed to load diff data</p>
      <p className="text-xs text-white/50 mb-4 max-w-xs">{message}</p>
      <Button
        size="sm"
        onClick={onRetry}
        className="bg-white/10 hover:bg-white/15 text-white/80 border border-white/10"
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        Retry
      </Button>
    </div>
  )
}

// ── Score Sub-Bar ─────────────────────────────────────────────
function ScoreSubBar({ label, value, maxValue = 100, color }: { label: string; value: number; maxValue?: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs font-mono font-bold text-white/70">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(value / maxValue) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ── Position Change Bar ───────────────────────────────────────
function PositionChangeBar({ change }: { change: PositionChange }) {
  const maxVal = Math.max(change.before, change.after, 1)
  const isPositive = change.delta > 0
  const isNegative = change.delta < 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${getEngineColor(change.engine)}`}>
          {getEngineLabel(change.engine)}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-white/40">{change.before}</span>
          <ArrowRight className="h-3 w-3 text-white/30" />
          <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-white/60'}`}>
            {change.after}
          </span>
          <Badge
            className={`text-[10px] font-bold px-1.5 py-0 border ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : isNegative
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-white/10 text-white/50 border-white/20'
            }`}
          >
            {isPositive && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
            {isNegative && <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
            {change.delta > 0 ? '+' : ''}{change.delta}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden relative">
          <motion.div
            className={`h-full rounded-full ${getEngineBarColor(change.engine)} opacity-30`}
            initial={{ width: 0 }}
            animate={{ width: `${(change.before / maxVal) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] text-white/30">→</span>
        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden relative">
          <motion.div
            className={`h-full rounded-full ${getEngineBarColor(change.engine)}`}
            initial={{ width: 0 }}
            animate={{ width: `${(change.after / maxVal) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function DiffPanel({ domain, userId }: DiffPanelProps) {
  const [data, setData] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preset, setPreset] = useState<DateRangePreset>('7d')
  const [customBefore, setCustomBefore] = useState('')
  const [customAfter, setCustomAfter] = useState('')
  const [expandedGained, setExpandedGained] = useState<Set<number>>(new Set())
  const [expandedLost, setExpandedLost] = useState<Set<number>>(new Set())
  const [fetchKey, setFetchKey] = useState(0)

  // ── Fetch diff data ─────────────────────────────────────
  const fetchDiff = useCallback(async () => {
    if (!domain) return
    setLoading(true)
    setError(null)

    try {
      const { before, after } = getDateRange(preset, customBefore, customAfter)
      const params = new URLSearchParams({
        domain,
        before,
        after,
      })
      if (userId) params.set('userId', userId)

      const response = await fetch(`/api/ai/diff?${params.toString()}`)

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `HTTP ${response.status}: Failed to fetch diff data`)
      }

      const result: DiffData = await response.json()
      setData(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [domain, userId, preset, customBefore, customAfter])

  // Fetch on mount + when dependencies change
  useEffect(() => {
    fetchDiff()
  }, [fetchDiff, fetchKey])

  // ── Date range change ───────────────────────────────────
  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset)
    setExpandedGained(new Set())
    setExpandedLost(new Set())
  }

  const handleCustomFetch = () => {
    if (customBefore && customAfter) {
      setPreset('custom')
      setFetchKey((k) => k + 1)
    }
  }

  const handleRetry = () => {
    setFetchKey((k) => k + 1)
  }

  // ── Toggle expand/collapse ──────────────────────────────
  const toggleGained = (idx: number) => {
    setExpandedGained((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleLost = (idx: number) => {
    setExpandedLost((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  // ── Derived values ──────────────────────────────────────
  const dateRange = getDateRange(preset, customBefore, customAfter)
  const beforeLabel = formatDateDisplay(dateRange.before)
  const afterLabel = formatDateDisplay(dateRange.after)

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h3 className="text-lg font-bold text-white/90">AI Diff</h3>
            </div>
            {data?._meta && (
              <Badge
                className={`text-[10px] font-semibold border ${getStatusBadgeConfig(data._meta.status).bgColor} ${getStatusBadgeConfig(data._meta.status).color}`}
              >
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                {getStatusBadgeConfig(data._meta.status).label}
              </Badge>
            )}
          </div>

          {/* Date range display */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar className="w-3.5 h-3.5" />
            <span>{beforeLabel}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{afterLabel}</span>
          </div>
        </div>

        {/* ── Date Range Picker ───────────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: '7d', label: 'Last 7 days' },
              { key: '30d', label: 'Last 30 days' },
              { key: '90d', label: 'Last 90 days' },
            ] as { key: DateRangePreset; label: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => handlePresetChange(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                  preset === opt.key
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                    : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white/70 hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => handlePresetChange('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                preset === 'custom'
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              Custom
            </button>
          </div>

          <AnimatePresence>
            {preset === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-end gap-3 overflow-hidden"
              >
                <div className="space-y-1">
                  <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Before date</label>
                  <Input
                    type="date"
                    value={customBefore}
                    onChange={(e) => setCustomBefore(e.target.value)}
                    className="h-8 text-xs bg-white/[0.03] border-white/10 text-white/80 w-40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">After date</label>
                  <Input
                    type="date"
                    value={customAfter}
                    onChange={(e) => setCustomAfter(e.target.value)}
                    className="h-8 text-xs bg-white/[0.03] border-white/10 text-white/80 w-40"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleCustomFetch}
                  disabled={!customBefore || !customAfter}
                  className="h-8 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-xs disabled:opacity-40"
                >
                  Apply
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Loading / Error / Content ───────────────────── */}
        {loading ? (
          <DiffSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : data ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={preset + fetchKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* ── Score Summary Bar ─────────────────────── */}
              <div className="rounded-xl border border-white/5 bg-[#0d1117] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  {/* Before score */}
                  <div className="text-center">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Before</span>
                    <div className="text-3xl sm:text-4xl font-bold font-mono text-white/60 mt-0.5">
                      <AnimatedNumber value={data.before.score.overall} />
                    </div>
                  </div>

                  {/* Arrow + Delta */}
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="h-5 w-5 text-white/20" />
                    <span className={`inline-flex items-center gap-1 text-sm font-bold font-mono ${
                      data.changes.scoreDelta > 0
                        ? 'text-emerald-400'
                        : data.changes.scoreDelta < 0
                          ? 'text-red-400'
                          : 'text-white/50'
                    }`}>
                      {data.changes.scoreDelta > 0 && <TrendingUp className="h-3.5 w-3.5" />}
                      {data.changes.scoreDelta < 0 && <TrendingDown className="h-3.5 w-3.5" />}
                      {data.changes.scoreDelta > 0 ? '+' : ''}{data.changes.scoreDelta} pts
                    </span>
                  </div>

                  {/* After score */}
                  <div className="text-center">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">After</span>
                    <div className={`text-3xl sm:text-4xl font-bold font-mono mt-0.5 ${
                      data.changes.scoreDelta > 0
                        ? 'text-emerald-400'
                        : data.changes.scoreDelta < 0
                          ? 'text-red-400'
                          : 'text-white/70'
                    }`}>
                      <AnimatedNumber value={data.after.score.overall} />
                    </div>
                  </div>
                </div>

                {/* Score sub-breakdown */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                  <ScoreSubBar label="Trust" value={data.after.score.trust} color="bg-emerald-500" />
                  <ScoreSubBar label="Freshness" value={data.after.score.freshness} color="bg-cyan-500" />
                  <ScoreSubBar label="Authority" value={data.after.score.authority} color="bg-purple-500" />
                  <ScoreSubBar label="Overall" value={data.after.score.overall} color="bg-amber-500" />
                </div>
              </div>

              {/* ── Diff Grid (Before / After) ────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* Before Column */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Before Scan</span>
                    <span className="text-[10px] text-white/25">{beforeLabel}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#0d1117] p-3.5 space-y-2.5">
                    {Object.entries(data.before.perEngine).map(([engine, score]) => (
                      <div
                        key={`before-${engine}`}
                        className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getEngineColor(engine)}`}>
                            {getEngineLabel(engine)}
                          </span>
                          <span className="text-lg font-bold font-mono text-white/50">{score}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${getEngineBarColor(engine)} opacity-40`}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After Column */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <RotateCcw className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">After Scan</span>
                    <span className="text-[10px] text-white/25">{afterLabel}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#0d1117] p-3.5 space-y-2.5">
                    {Object.entries(data.after.perEngine).map(([engine, score], i) => {
                      const beforeScore = data.before.perEngine[engine as keyof PerEngine] ?? score
                      const delta = score - beforeScore
                      const isPositive = delta > 0
                      const isNegative = delta < 0

                      return (
                        <motion.div
                          key={`after-${engine}`}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                          className={`rounded-lg border px-3 py-2.5 ${
                            isPositive
                              ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                              : isNegative
                                ? 'border-red-500/20 bg-red-500/[0.05]'
                                : 'border-white/5 bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${getEngineColor(engine)}`}>
                                {getEngineLabel(engine)}
                              </span>
                              {delta !== 0 && (
                                <Badge
                                  className={`text-[10px] font-bold px-1.5 py-0 border ${
                                    isPositive
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}
                                >
                                  {isPositive && <Plus className="w-2.5 h-2.5 mr-0.5" />}
                                  {isNegative && <Minus className="w-2.5 h-2.5 mr-0.5" />}
                                  {delta > 0 ? '+' : ''}{delta}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-mono text-white/30 line-through decoration-white/20">{beforeScore}</span>
                              <ArrowRight className="h-3 w-3 text-white/20" />
                              <span className={`text-lg font-bold font-mono ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-white/60'}`}>
                                {score}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${getEngineBarColor(engine)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 + i * 0.05 }}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── Change Entries ─────────────────────────── */}
              <Tabs defaultValue="gained" className="w-full">
                <TabsList className="bg-white/[0.03] border border-white/10 h-9 p-0.5">
                  <TabsTrigger
                    value="gained"
                    className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-white/50 text-xs h-8 px-3"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Gained ({data.changes.gained.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="lost"
                    className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-white/50 text-xs h-8 px-3"
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    Lost ({data.changes.lost.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="positions"
                    className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-white/50 text-xs h-8 px-3"
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Positions ({data.changes.positionChanges.length})
                  </TabsTrigger>
                </TabsList>

                {/* Gained Tab */}
                <TabsContent value="gained" className="mt-3">
                  {data.changes.gained.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-white/30">No gains detected in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                      {data.changes.gained.map((item, idx) => {
                        const engineName = getEngineFromGainedLost(item)
                        const isExpanded = expandedGained.has(idx)

                        return (
                          <Collapsible
                            key={`gained-${idx}`}
                            open={isExpanded}
                            onOpenChange={() => toggleGained(idx)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-3.5 py-2.5 cursor-pointer hover:bg-emerald-500/[0.08] transition-colors group">
                                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${getEngineColor(engineName)}`}>
                                      {engineName}
                                    </span>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0 border font-bold">
                                      Gained
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-white/60 truncate mt-0.5">{item}</p>
                                </div>
                                <div className="shrink-0 text-white/20 group-hover:text-white/40 transition-colors">
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-9 mt-1 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] px-3.5 py-2.5">
                                <p className="text-xs text-white/50 leading-relaxed">{item}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Zap className="w-3 h-3 text-emerald-400/60" />
                                  <span className="text-[10px] text-emerald-400/60 font-medium">New citation detected</span>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Lost Tab */}
                <TabsContent value="lost" className="mt-3">
                  {data.changes.lost.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-white/30">No losses detected in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                      {data.changes.lost.map((item, idx) => {
                        const engineName = getEngineFromGainedLost(item)
                        const isExpanded = expandedLost.has(idx)

                        return (
                          <Collapsible
                            key={`lost-${idx}`}
                            open={isExpanded}
                            onOpenChange={() => toggleLost(idx)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3.5 py-2.5 cursor-pointer hover:bg-red-500/[0.08] transition-colors group">
                                <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center shrink-0">
                                  <Minus className="w-3.5 h-3.5 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${getEngineColor(engineName)}`}>
                                      {engineName}
                                    </span>
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] px-1.5 py-0 border font-bold">
                                      Lost
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-white/60 truncate mt-0.5">{item}</p>
                                </div>
                                <div className="shrink-0 text-white/20 group-hover:text-white/40 transition-colors">
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-9 mt-1 rounded-lg border border-red-500/10 bg-red-500/[0.03] px-3.5 py-2.5">
                                <p className="text-xs text-white/50 leading-relaxed">{item}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <TriangleAlert className="w-3 h-3 text-red-400/60" />
                                  <span className="text-[10px] text-red-400/60 font-medium">Action recommended to recover visibility</span>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Positions Tab */}
                <TabsContent value="positions" className="mt-3">
                  {data.changes.positionChanges.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-white/30">No position changes detected in this period</p>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-xl border border-white/5 bg-[#0d1117] p-4">
                      {data.changes.positionChanges.map((change, idx) => (
                        <motion.div
                          key={`pos-${change.engine}-${idx}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <PositionChangeBar change={change} />
                          {idx < data.changes.positionChanges.length - 1 && (
                            <div className="border-b border-white/5 mt-4" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* ── Summary ────────────────────────────────── */}
              <div className="rounded-xl border border-white/5 bg-[#0d1117] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <GitCompareArrows className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-[11px] text-white/30 uppercase tracking-wider font-semibold">Summary</span>
                    <p className="text-sm text-white/70 leading-relaxed mt-1">{data.summary}</p>
                  </div>
                </div>
              </div>

              {/* ── Stats Row ──────────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-3 text-center">
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    <AnimatedNumber value={data.changes.gained.length} duration={500} />
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">Gained</div>
                </div>
                <div className="rounded-lg border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-center">
                  <div className="text-2xl font-bold font-mono text-red-400">
                    <AnimatedNumber value={data.changes.lost.length} duration={500} />
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">Lost</div>
                </div>
                <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3 text-center">
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    <AnimatedNumber value={data.changes.positionChanges.length} duration={500} />
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">Changed</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </CardContent>
    </Card>
  )
}
