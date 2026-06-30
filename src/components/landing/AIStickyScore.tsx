'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Pin,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIStickyScoreProps {
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

// ── Fallback Data ─────────────────────────────────────────────
const FALLBACK_SCORE = { current: 71, delta: 3 }
const FALLBACK_SPARKLINE = [62, 64, 63, 66, 65, 68, 67, 69, 71]

// ── Mini Sparkline ────────────────────────────────────────────
function MiniSparkline({ data, width = 80, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (data.length === 0) return null

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

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="stickySparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#stickySparkGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
        r="2.5"
        fill="#10b981"
      />
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function AIStickyScore({ onStartFree }: AIStickyScoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // API state
  const [data, setData] = useState<MissionControlResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derived display values with fallback
  const displayScore = data?.score.overall ?? FALLBACK_SCORE.current
  const displayDelta = data
    ? data.recentActivity.reduce((sum, a) => sum + a.delta, 0)
    : FALLBACK_SCORE.delta
  const displaySparkline = data
    ? (() => {
        const activities = [...data.recentActivity].reverse()
        if (activities.length === 0) return FALLBACK_SPARKLINE
        let running = data.score.overall - activities.reduce((s, a) => s + a.delta, 0)
        return activities.map(a => {
          running += a.delta
          return Math.max(0, Math.min(100, running))
        })
      })()
    : FALLBACK_SPARKLINE

  // Fetch function
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/mission-control?domain=seosights.com')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const json: MissionControlResponse = await res.json()
      setData(json)
    } catch {
      // Keep existing data as fallback
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Show widget after a delay (don't bombard user immediately)
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (isDismissed || !isVisible) return null

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Collapsed state — mini floating card */}
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-[#0d1117]/95 backdrop-blur-xl shadow-xl shadow-black/40 px-4 py-3 cursor-pointer hover:border-emerald-500/50 transition-all duration-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Expand AI Visibility Score"
          >
            {/* Close button */}
            <div
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); setIsDismissed(true) }}
            >
              <X className="w-3 h-3 text-zinc-400" />
            </div>

            {/* Pin icon */}
            <Pin className="w-3.5 h-3.5 text-emerald-400" />

            {/* Score */}
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <>
                <span className="text-xl font-bold font-mono text-emerald-400">{displayScore}</span>
                <span className="text-xs font-mono text-white/30">/100</span>
              </>
            )}

            {/* Delta */}
            {!isLoading && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold ${displayDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {displayDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {displayDelta >= 0 ? '+' : ''}{displayDelta}
              </span>
            )}

            {/* Expand hint */}
            <ChevronUp className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
          </motion.button>
        ) : (
          /* Expanded state — full widget */
          <motion.div
            key="expanded"
            className="rounded-2xl border border-emerald-500/30 bg-[#0d1117]/95 backdrop-blur-xl shadow-2xl shadow-black/50 w-72 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">AI Visibility</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                  aria-label="Minimize"
                >
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </button>
                <button
                  onClick={() => { setIsExpanded(false); setIsDismissed(true) }}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-white/30" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Score display */}
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold font-mono text-emerald-400">{displayScore}</span>
                    <span className="text-sm font-mono text-white/30 mb-1.5">/100</span>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold mb-2 ${displayDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {displayDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {displayDelta >= 0 ? '+' : ''}{displayDelta}
                    </span>
                  </div>

                  {/* Sparkline */}
                  <MiniSparkline data={displaySparkline} width={240} height={40} />

                  {/* Sub-scores */}
                  {data && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Trust', value: data.score.trust, color: 'bg-emerald-500' },
                        { label: 'Fresh', value: data.score.freshness, color: 'bg-cyan-500' },
                        { label: 'Auth', value: data.score.authority, color: 'bg-amber-500' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <div className="text-[10px] text-white/40 mb-1">{s.label}</div>
                          <div className="text-sm font-bold font-mono text-white/70">{s.value}</div>
                          <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30">
                    <span className={`w-1.5 h-1.5 rounded-full ${data?._meta.status === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                    {data?._meta.status === 'live' ? 'Live data' : 'Demo data'}
                  </div>
                </>
              )}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
              <Button
                onClick={onStartFree}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-2.5 rounded-lg"
              >
                Track Your Score Live
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
