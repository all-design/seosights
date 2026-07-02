'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Star,
  AlertTriangle,
  Trophy,
  RotateCcw,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
interface PerEngine {
  chatgpt: number
  claude: number
  gemini: number
  perplexity: number
  grok: number
}

interface ReplayFrame {
  day: number
  date: string
  score: number
  delta: number
  perEngine: PerEngine
  change: string
  isHighlight: boolean
  highlightLabel?: string
}

interface VisibilityReplayData {
  frames: ReplayFrame[]
  domain: string
  period: string
  currentScore: number
  startScore: number
  highlights: number
}

interface AIVisibilityReplayDashboardProps {
  domain: string
  userId?: string
}

// ── Fallback mock data ──────────────────────────────────────────────────
const FALLBACK_DATA: VisibilityReplayData = {
  domain: 'example.com',
  period: 'Last 30 days',
  currentScore: 67,
  startScore: 42,
  highlights: 5,
  frames: [
    { day: 0, date: 'Feb 1', score: 42, delta: 0, perEngine: { chatgpt: 38, claude: 44, gemini: 35, perplexity: 50, grok: 40 }, change: 'Baseline measurement captured', isHighlight: true, highlightLabel: 'Starting Point' },
    { day: 3, date: 'Feb 4', score: 44, delta: 2, perEngine: { chatgpt: 40, claude: 46, gemini: 37, perplexity: 51, grok: 42 }, change: 'FAQ schema added to top pages', isHighlight: false },
    { day: 5, date: 'Feb 6', score: 47, delta: 3, perEngine: { chatgpt: 44, claude: 48, gemini: 40, perplexity: 53, grok: 44 }, change: 'First ChatGPT citation detected', isHighlight: true, highlightLabel: 'First AI Citation' },
    { day: 8, date: 'Feb 9', score: 45, delta: -2, perEngine: { chatgpt: 42, claude: 46, gemini: 38, perplexity: 52, grok: 42 }, change: 'Competitor added structured data, lost citation', isHighlight: true, highlightLabel: 'Score Dip' },
    { day: 12, date: 'Feb 13', score: 50, delta: 5, perEngine: { chatgpt: 48, claude: 52, gemini: 44, perplexity: 55, grok: 48 }, change: 'Content cluster published around primary topic', isHighlight: true, highlightLabel: 'Content Cluster' },
    { day: 16, date: 'Feb 17', score: 53, delta: 3, perEngine: { chatgpt: 52, claude: 54, gemini: 48, perplexity: 56, grok: 50 }, change: 'llms.txt deployed to site root', isHighlight: false },
    { day: 19, date: 'Feb 20', score: 55, delta: 2, perEngine: { chatgpt: 54, claude: 56, gemini: 50, perplexity: 57, grok: 52 }, change: 'Author bio pages enhanced with E-E-A-T signals', isHighlight: false },
    { day: 22, date: 'Feb 23', score: 58, delta: 3, perEngine: { chatgpt: 58, claude: 58, gemini: 52, perplexity: 60, grok: 54 }, change: 'G2 reviews pushed past 50 threshold', isHighlight: true, highlightLabel: 'Review Milestone' },
    { day: 25, date: 'Feb 26', score: 62, delta: 4, perEngine: { chatgpt: 62, claude: 62, gemini: 56, perplexity: 64, grok: 58 }, change: 'Backlink from authority domain acquired', isHighlight: true, highlightLabel: 'Backlink Boost' },
    { day: 28, date: 'Mar 1', score: 65, delta: 3, perEngine: { chatgpt: 65, claude: 64, gemini: 60, perplexity: 66, grok: 62 }, change: 'Wikipedia draft submitted for review', isHighlight: false },
    { day: 30, date: 'Mar 3', score: 67, delta: 2, perEngine: { chatgpt: 68, claude: 66, gemini: 62, perplexity: 68, grok: 64 }, change: 'Current score — ongoing optimization', isHighlight: true, highlightLabel: 'Current Score' },
  ],
}

// ── Engine colors ────────────────────────────────────────────────────────
const ENGINE_CONFIG: { key: keyof PerEngine; label: string; color: string; bgColor: string }[] = [
  { key: 'chatgpt', label: 'ChatGPT', color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  { key: 'claude', label: 'Claude', color: 'text-amber-400', bgColor: 'bg-amber-500' },
  { key: 'gemini', label: 'Gemini', color: 'text-cyan-400', bgColor: 'bg-cyan-500' },
  { key: 'perplexity', label: 'Perplexity', color: 'text-purple-400', bgColor: 'bg-purple-500' },
  { key: 'grok', label: 'Grok', color: 'text-rose-400', bgColor: 'bg-rose-500' },
]

// ── Delta icon helper ────────────────────────────────────────────────────
function DeltaIndicator({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold"><TrendingUp className="w-3 h-3" />+{value}</span>
  if (value < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold"><TrendingDown className="w-3 h-3" />{value}</span>
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="w-3 h-3" />0</span>
}

// ── Main Component ───────────────────────────────────────────────────────
export default function AIVisibilityReplayDashboard({ domain, userId }: AIVisibilityReplayDashboardProps) {
  const [data, setData] = useState<VisibilityReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/ai/visibility-replay?domain=${encodeURIComponent(domain)}${userId ? `&userId=${userId}` : ''}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        // Use fallback data on error
        setData({ ...FALLBACK_DATA, domain })
      } finally {
        setLoading(false)
      }
    }
    if (domain) loadData()
  }, [domain, userId])

  const frames = data?.frames ?? FALLBACK_DATA.frames
  const frame = frames[currentFrame] ?? frames[0]

  // Playback logic
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1400)
    return () => clearInterval(interval)
  }, [isPlaying, frames.length])

  const handlePlay = useCallback(() => {
    if (currentFrame >= frames.length - 1) setCurrentFrame(0)
    setIsPlaying(true)
  }, [currentFrame, frames.length])

  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleReset = useCallback(() => { setIsPlaying(false); setCurrentFrame(0) }, [])
  const handleSkipStart = useCallback(() => setCurrentFrame(0), [])
  const handleSkipEnd = useCallback(() => { setIsPlaying(false); setCurrentFrame(frames.length - 1) }, [frames.length])
  const handleStepBack = useCallback(() => setCurrentFrame(prev => Math.max(0, prev - 1)), [])
  const handleStepForward = useCallback(() => setCurrentFrame(prev => Math.min(frames.length - 1, prev + 1)), [frames.length])

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false)
    setCurrentFrame(Number(e.target.value))
  }, [])

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">AI Visibility Replay™</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-48 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-10 rounded-lg bg-muted/30 animate-pulse" />
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">AI Visibility Replay™</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load replay data</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Score progress calculation ────────────────────────────────────────
  const scoreMin = Math.min(...frames.map(f => f.score)) - 5
  const scoreMax = Math.max(...frames.map(f => f.score)) + 5
  const scoreRange = scoreMax - scoreMin
  const chartH = 160
  const chartW = 100
  const padX = 5
  const padY = 10

  function scoreToY(s: number) {
    return padY + ((scoreMax - s) / scoreRange) * (chartH - padY * 2)
  }
  function frameToX(i: number) {
    return padX + (i / (frames.length - 1)) * (chartW - padX * 2)
  }

  // Build polyline points
  const linePoints = frames.map((f, i) => `${frameToX(i)},${scoreToY(f.score)}`).join(' ')
  const playedPoints = frames.slice(0, currentFrame + 1).map((f, i) => `${frameToX(i)},${scoreToY(f.score)}`).join(' ')
  const areaPoints = playedPoints
    ? `${frameToX(0)},${chartH - padY} ${playedPoints} ${frameToX(currentFrame)},${chartH - padY}`
    : ''

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">AI Visibility Replay™</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {data?.period ?? 'Last 30 days'}
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            {data?.domain ?? domain}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── SVG Timeline Chart ────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-40 sm:h-48"
            preserveAspectRatio="none"
          >
            {/* Ghost track (full line) */}
            <polyline
              points={linePoints}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            {/* Area fill under played line */}
            {areaPoints && (
              <polygon
                points={areaPoints}
                fill="url(#replayAreaGrad)"
                opacity="0.4"
              />
            )}
            {/* Played line */}
            <polyline
              points={playedPoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Highlight markers */}
            {frames.map((f, i) => {
              if (!f.isHighlight) return null
              const reached = i <= currentFrame
              return (
                <g key={i}>
                  {reached && (
                    <circle
                      cx={frameToX(i)}
                      cy={scoreToY(f.score)}
                      r="2.5"
                      fill="#a855f7"
                      opacity="0.6"
                    >
                      <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={frameToX(i)}
                    cy={scoreToY(f.score)}
                    r="1.2"
                    fill={reached ? '#a855f7' : 'rgba(168,85,247,0.3)'}
                  />
                </g>
              )
            })}
            {/* Current playhead dot */}
            <circle
              cx={frameToX(currentFrame)}
              cy={scoreToY(frame.score)}
              r="2.5"
              fill="#10b981"
              stroke="#10b981"
              strokeWidth="1"
              opacity="0.8"
            />
            <circle
              cx={frameToX(currentFrame)}
              cy={scoreToY(frame.score)}
              r="5"
              fill="none"
              stroke="#10b981"
              strokeWidth="0.5"
              opacity="0.3"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="replayAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Timeline scrubber */}
          <div className="mt-3 relative">
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentFrame}
              onChange={handleScrub}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-emerald-500"
              aria-label="Timeline scrubber"
            />
            {/* Highlight dots on scrubber */}
            <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none">
              {frames.map((f, i) => {
                if (!f.isHighlight) return null
                const pct = (i / (frames.length - 1)) * 100
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500 -ml-1"
                    style={{ left: `${pct}%` }}
                    title={f.highlightLabel}
                  />
                )
              })}
            </div>
          </div>

          {/* VCR Controls */}
          <div className="flex items-center justify-center gap-1 mt-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleSkipStart} aria-label="Skip to start">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleStepBack} aria-label="Step back">
              <Rewind className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300"
              onClick={isPlaying ? handlePause : handlePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleStepForward} aria-label="Step forward">
              <FastForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleSkipEnd} aria-label="Skip to end">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleReset} aria-label="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Current Frame Info ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score overview */}
          <motion.div
            key={`score-${currentFrame}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Score</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={frame.score}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-3xl font-bold text-foreground"
                >
                  {frame.score}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <DeltaIndicator value={frame.delta} />
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                animate={{ width: `${frame.score}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">Day {frame.day} • {frame.date}</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                +{data?.currentScore ?? 67 - (data?.startScore ?? 42)} total
              </Badge>
            </div>
          </motion.div>

          {/* Per-engine breakdown */}
          <motion.div
            key={`engines-${currentFrame}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-xl border border-white/[0.06] bg-black/20 p-4 md:col-span-2"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Per-Engine Scores</span>
            </div>
            <div className="space-y-2.5">
              {ENGINE_CONFIG.map(engine => {
                const score = frame.perEngine[engine.key]
                const prevScore = currentFrame > 0 ? frames[currentFrame - 1].perEngine[engine.key] : score
                const delta = score - prevScore
                return (
                  <div key={engine.key} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-20 shrink-0 ${engine.color}`}>{engine.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${engine.bgColor}`}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-16 justify-end">
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={`${engine.key}-${score}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm font-bold tabular-nums text-foreground"
                        >
                          {score}
                        </motion.span>
                      </AnimatePresence>
                      {delta !== 0 && (
                        <span className={`text-[10px] font-semibold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ── What Changed ──────────────────────────────────────────── */}
        <motion.div
          key={`change-${currentFrame}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
        >
          <div className="flex items-start gap-3">
            {frame.isHighlight && (
              <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-muted-foreground">What changed</span>
                {frame.isHighlight && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] px-1.5 py-0">
                    {frame.highlightLabel}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground">{frame.change}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Highlight Moments ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Highlight Moments</span>
          </div>
          <ScrollArea className="max-h-40">
            <div className="flex flex-wrap gap-2">
              {frames.filter(f => f.isHighlight).map((f, idx) => {
                const frameIdx = frames.indexOf(f)
                const isActive = frameIdx === currentFrame
                const isPast = frameIdx < currentFrame
                return (
                  <motion.button
                    key={idx}
                    onClick={() => { setIsPlaying(false); setCurrentFrame(frameIdx) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                        : isPast
                        ? 'border-purple-500/20 bg-purple-500/5 text-purple-300'
                        : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {f.highlightLabel}
                    <span className="text-[10px] text-muted-foreground">Day {f.day}</span>
                  </motion.button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
