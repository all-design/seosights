'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, X, TrendingUp, TrendingDown, Minus, ChevronRight, ExternalLink, Gauge, Loader2, Clock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface StickyScoreWidgetProps {
  domain: string
  userId?: string
}

interface EngineStatus {
  name: string
  indexed: boolean
  citations: number
  lastCrawled: string | null
}

interface RecentActivityItem {
  id: string
  type: string
  title: string
  description: string
  engine: string | null
  delta: number
  severity: string
  createdAt: string
}

interface MissionControlResponse {
  score: {
    overall: number
    trust: number
    freshness: number
    authority: number
  }
  engines: EngineStatus[]
  recentActivity: RecentActivityItem[]
  opportunities: number
  alerts: number
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

type WidgetState = 'expanded' | 'minimized' | 'hidden'

// ── Constants ─────────────────────────────────────────────────

const STORAGE_KEY = 'sticky-score-widget-state'
const REFRESH_INTERVAL_MS = 60_000
const SPARKLINE_POINTS = 7

// ── MiniSparkline ─────────────────────────────────────────────

function MiniSparkline({ data, width = 120, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

  const lastIdx = data.length - 1
  const lastX = padding + (lastIdx / (data.length - 1)) * (width - padding * 2)
  const lastY = height - padding - ((data[lastIdx] - min) / range) * (height - padding * 2)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#sparkGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#10b981" />
    </svg>
  )
}

// ── Status Dot ────────────────────────────────────────────────

function StatusDot({ status }: { status: 'live' | 'estimated' | 'simulation' }) {
  const colorMap = {
    live: 'bg-emerald-400',
    estimated: 'bg-amber-400',
    simulation: 'bg-zinc-400',
  }
  const labelMap = {
    live: 'Live',
    estimated: 'Estimated',
    simulation: 'Simulation',
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`relative flex h-1.5 w-1.5`}>
        {status === 'live' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colorMap[status]}`} />
      </span>
      <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider">
        {labelMap[status]}
      </span>
    </span>
  )
}

// ── Engine Mini Bar ───────────────────────────────────────────

function EngineMiniScore({ name, indexed, citations }: { name: string; indexed: boolean; citations: number }) {
  const maxCitations = 30
  const pct = Math.min((citations / maxCitations) * 100, 100)

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] font-mono text-white/50 w-[62px] truncate">{name}</span>
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: indexed
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #52525b, #71717a)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-mono text-white/40 w-5 text-right">{citations}</span>
    </div>
  )
}

// ── StickyScoreWidget ─────────────────────────────────────────

export default function StickyScoreWidget({ domain, userId }: StickyScoreWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('expanded')
  const [data, setData] = useState<MissionControlResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sparklineData, setSparklineData] = useState<number[]>([])
  const [prevScore, setPrevScore] = useState<number | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load persisted widget state from localStorage ───────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'minimized' || stored === 'hidden' || stored === 'expanded') {
        setWidgetState(stored)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  // ── Persist widget state ────────────────────────────────────
  const updateWidgetState = useCallback((newState: WidgetState) => {
    setWidgetState(newState)
    try {
      localStorage.setItem(STORAGE_KEY, newState)
    } catch {
      // localStorage not available
    }
  }, [])

  // ── Fetch data from mission-control API ─────────────────────
  const fetchData = useCallback(async () => {
    if (!domain) return

    try {
      const params = new URLSearchParams({ domain })
      if (userId) params.set('userId', userId)

      const res = await fetch(`/api/ai/mission-control?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`)
      }

      const json: MissionControlResponse = await res.json()

      // Track score change for pulse animation
      if (data !== null && data.score.overall !== json.score.overall) {
        setPrevScore(data.score.overall)
        setPulseKey((k) => k + 1)
      }

      setData(json)
      setError(null)

      // Compute sparkline from recentActivity deltas
      setSparklineData((prev) => {
        const deltaBase = json.score.overall
        const activityDeltas = json.recentActivity
          .slice(0, SPARKLINE_POINTS - 1)
          .map((a) => a.delta)

        // Build sparkline by walking deltas backwards from the current score
        const points: number[] = [deltaBase]
        let cumulative = deltaBase
        for (let i = activityDeltas.length - 1; i >= 0; i--) {
          cumulative -= activityDeltas[i]
          points.unshift(Math.max(0, Math.min(100, cumulative)))
        }

        // If we don't have enough points from activity, fill from previous data
        if (points.length < SPARKLINE_POINTS) {
          const shortfall = SPARKLINE_POINTS - points.length
          const filler = prev.length > 0
            ? prev.slice(0, shortfall)
            : Array.from({ length: shortfall }, (_, i) =>
                Math.max(0, Math.min(100, deltaBase - (shortfall - i) * 2))
              )
          return [...filler, ...points].slice(-SPARKLINE_POINTS)
        }

        return points.slice(-SPARKLINE_POINTS)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [domain, userId])

  // ── Initial fetch + auto-refresh ────────────────────────────
  useEffect(() => {
    fetchData()

    refreshTimerRef.current = setInterval(() => {
      fetchData()
    }, REFRESH_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [fetchData])

  // ── Derived values ──────────────────────────────────────────
  const overallScore = data?.score.overall ?? 0
  const delta = prevScore !== null ? overallScore - prevScore : 0
  const metaStatus = data?._meta.status ?? 'simulation'

  const scoreColor = overallScore >= 70
    ? 'text-emerald-400'
    : overallScore >= 40
    ? 'text-amber-400'
    : 'text-rose-400'

  // ── Render ──────────────────────────────────────────────────
  if (widgetState === 'hidden') return null

  return (
    <AnimatePresence mode="wait">
      {widgetState === 'minimized' ? (
        // ── Minimized State ──────────────────────────────────
        <motion.button
          key="minimized"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={() => updateWidgetState('expanded')}
          className="absolute bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full border border-emerald-500/30 bg-[#0d1117]/95 backdrop-blur-xl shadow-xl shadow-black/40 cursor-pointer hover:border-emerald-500/50 transition-colors group"
          aria-label="Expand AI Visibility Score widget"
          title="Expand AI Visibility Score"
        >
          <motion.span
            key={pulseKey}
            className={`font-bold font-mono text-sm ${scoreColor}`}
            initial={pulseKey > 0 ? { scale: 1.3 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {overallScore}
          </motion.span>
          {/* Glow ring on hover */}
          <span className="absolute inset-0 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors" />
        </motion.button>
      ) : (
        // ── Expanded State ────────────────────────────────────
        <motion.div
          key="expanded"
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute bottom-4 right-4 z-50 w-60"
        >
          <div className="rounded-xl border border-emerald-500/30 bg-[#0d1117]/95 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
            {/* ── Header Row ────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
              <div className="flex items-center gap-1.5">
                <Pin className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  AI Visibility
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Minimize button */}
                <button
                  onClick={() => updateWidgetState('minimized')}
                  className="p-0.5 rounded hover:bg-white/5 transition-colors"
                  aria-label="Minimize widget"
                  title="Minimize"
                >
                  <Minus className="h-3 w-3 text-white/30 hover:text-white/50" />
                </button>
                {/* Close button */}
                <button
                  onClick={() => updateWidgetState('hidden')}
                  className="p-0.5 rounded hover:bg-white/5 transition-colors"
                  aria-label="Close widget"
                  title="Dismiss"
                >
                  <X className="h-3 w-3 text-white/30 hover:text-white/50" />
                </button>
              </div>
            </div>

            {/* ── Score Display ──────────────────────────────── */}
            <div className="px-3 pb-1">
              <div className="flex items-end gap-1.5">
                <motion.span
                  key={pulseKey}
                  className={`text-2xl font-bold font-mono ${scoreColor}`}
                  initial={pulseKey > 0 ? { scale: 1.15 } : { scale: 1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {loading && !data ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white/20" />
                  ) : (
                    overallScore
                  )}
                </motion.span>
                <span className="text-xs font-mono text-white/30 mb-1">/100</span>

                {/* Delta indicator */}
                {delta !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold mb-1.5 ${
                      delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {delta > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </motion.span>
                )}
              </div>
            </div>

            {/* ── Sparkline ──────────────────────────────────── */}
            <div className="px-3 py-1">
              {sparklineData.length >= 2 ? (
                <MiniSparkline data={sparklineData} width={200} height={28} />
              ) : (
                <div className="h-7 flex items-center">
                  <span className="text-[9px] text-white/20 font-mono">Collecting data…</span>
                </div>
              )}
            </div>

            {/* ── Data Status ────────────────────────────────── */}
            <div className="px-3 pb-2 pt-0.5 flex items-center justify-between">
              <StatusDot status={metaStatus} />
              {error && (
                <span className="text-[9px] text-rose-400/70 font-mono" title={error}>
                  err
                </span>
              )}
            </div>

            {/* ── Expandable Details Toggle ──────────────────── */}
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 border-t border-white/5 hover:bg-white/[0.02] transition-colors"
              aria-expanded={detailsOpen}
              aria-label="Toggle engine details"
            >
              <span className="text-[10px] font-medium text-white/30">
                Engine breakdown
              </span>
              <motion.div
                animate={{ rotate: detailsOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-3 w-3 text-white/20" />
              </motion.div>
            </button>

            {/* ── Expandable Details Panel ───────────────────── */}
            <AnimatePresence>
              {detailsOpen && data && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pt-2 pb-2 space-y-1 border-t border-white/5">
                    {/* Per-engine mini scores */}
                    {data.engines.map((engine) => (
                      <EngineMiniScore
                        key={engine.name}
                        name={engine.name}
                        indexed={engine.indexed}
                        citations={engine.citations}
                      />
                    ))}

                    {/* Last updated */}
                    {data.recentActivity.length > 0 && (
                      <div className="pt-1.5 border-t border-white/5 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-white/20" />
                          <span className="text-[9px] text-white/25 font-mono">
                            Last activity: {formatRelativeTime(data.recentActivity[0].createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick link to full Mission Control */}
                    <div className="pt-1.5 border-t border-white/5 mt-1.5">
                      <a
                        href="#mission-control"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
                      >
                        <Gauge className="h-2.5 w-2.5" />
                        Open Mission Control
                        <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Utility: Relative time formatting ─────────────────────────

function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const now = Date.now()
    const diffMs = now - date.getTime()

    if (diffMs < 0) return 'just now'

    const minutes = Math.floor(diffMs / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString()
  } catch {
    return 'unknown'
  }
}
