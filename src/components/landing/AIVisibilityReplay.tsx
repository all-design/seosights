'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

// ── Chart layout constants ───────────────────────────────────────────────
const VIEW_W = 700
const VIEW_H = 260
const PAD_L = 45
const PAD_R = 25
const PAD_T = 25
const PAD_B = 35
const CHART_W = VIEW_W - PAD_L - PAD_R
const CHART_H = VIEW_H - PAD_T - PAD_B

const yFor = (v: number) => PAD_T + CHART_H - ((v - 30) / 50) * CHART_H // range 30-80
const xFor = (i: number, total: number) => PAD_L + (i / (total - 1)) * CHART_W

// ── Mock data: 12 frames, score 42→67 over 30 days ─────────────────────
interface ReplayFrame {
  day: number
  date: string
  score: number
  delta: number
  engines: {
    chatgpt: number
    claude: number
    perplexity: number
    gemini: number
  }
  highlight: boolean
  event?: string
}

const frames: ReplayFrame[] = [
  { day: 0, date: 'Jan 1', score: 42, delta: 0, engines: { chatgpt: 38, claude: 40, perplexity: 45, gemini: 44 }, highlight: false },
  { day: 3, date: 'Jan 4', score: 43, delta: 1, engines: { chatgpt: 39, claude: 41, perplexity: 46, gemini: 45 }, highlight: false },
  { day: 5, date: 'Jan 6', score: 41, delta: -2, engines: { chatgpt: 37, claude: 39, perplexity: 44, gemini: 43 }, highlight: true, event: 'Algorithm shift' },
  { day: 8, date: 'Jan 9', score: 44, delta: 3, engines: { chatgpt: 40, claude: 42, perplexity: 47, gemini: 46 }, highlight: false },
  { day: 10, date: 'Jan 11', score: 48, delta: 4, engines: { chatgpt: 44, claude: 46, perplexity: 51, gemini: 50 }, highlight: true, event: 'llms.txt deployed' },
  { day: 13, date: 'Jan 14', score: 50, delta: 2, engines: { chatgpt: 46, claude: 48, perplexity: 54, gemini: 52 }, highlight: false },
  { day: 15, date: 'Jan 16', score: 53, delta: 3, engines: { chatgpt: 49, claude: 51, perplexity: 57, gemini: 55 }, highlight: true, event: 'FAQ schema added' },
  { day: 18, date: 'Jan 19', score: 55, delta: 2, engines: { chatgpt: 51, claude: 53, perplexity: 59, gemini: 57 }, highlight: false },
  { day: 21, date: 'Jan 22', score: 58, delta: 3, engines: { chatgpt: 54, claude: 56, perplexity: 62, gemini: 60 }, highlight: false },
  { day: 24, date: 'Jan 25', score: 62, delta: 4, engines: { chatgpt: 58, claude: 60, perplexity: 66, gemini: 64 }, highlight: true, event: 'Entity map updated' },
  { day: 27, date: 'Jan 28', score: 65, delta: 3, engines: { chatgpt: 61, claude: 63, perplexity: 69, gemini: 67 }, highlight: false },
  { day: 30, date: 'Jan 31', score: 67, delta: 2, engines: { chatgpt: 63, claude: 65, perplexity: 71, gemini: 69 }, highlight: true, event: 'Current' },
]

const engineColors: Record<string, { color: string; glow: string; label: string }> = {
  chatgpt: { color: '#10b981', glow: 'rgba(16,185,129,0.5)', label: 'ChatGPT' },
  claude: { color: '#a855f7', glow: 'rgba(168,85,247,0.5)', label: 'Claude' },
  perplexity: { color: '#06b6d4', glow: 'rgba(6,182,212,0.5)', label: 'Perplexity' },
  gemini: { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', label: 'Gemini' },
}

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  return d
}

interface AIVisibilityReplayProps {
  onStartFree?: () => void
}

export default function AIVisibilityReplay({ onStartFree }: AIVisibilityReplayProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalFrames = frames.length

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const startPlayback = useCallback(() => {
    if (currentFrame >= totalFrames - 1) {
      setCurrentFrame(0)
    }
    setIsPlaying(true)
  }, [currentFrame, totalFrames])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= totalFrames - 1) {
            stopPlayback()
            return prev
          }
          return prev + 1
        })
      }, 600)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, totalFrames, stopPlayback])

  // Auto-play when scrolled into view
  useEffect(() => {
    if (isInView && !isPlaying && currentFrame === 0) {
      const timer = setTimeout(() => {
        startPlayback()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isInView, isPlaying, currentFrame, startPlayback])

  const handleStepBack = () => {
    stopPlayback()
    setCurrentFrame((prev) => Math.max(0, prev - 1))
  }

  const handleStepForward = () => {
    stopPlayback()
    setCurrentFrame((prev) => Math.min(totalFrames - 1, prev + 1))
  }

  const handleRestart = () => {
    stopPlayback()
    setCurrentFrame(0)
    setTimeout(() => startPlayback(), 100)
  }

  const handleSkipEnd = () => {
    stopPlayback()
    setCurrentFrame(totalFrames - 1)
  }

  const frame = frames[currentFrame]
  const progress = currentFrame / (totalFrames - 1)

  // Build main score path up to current frame
  const mainPoints: [number, number][] = frames
    .slice(0, currentFrame + 1)
    .map((f, i) => [xFor(i, totalFrames), yFor(f.score)])

  // Full path for ghost line
  const fullPoints: [number, number][] = frames.map((f, i) => [xFor(i, totalFrames), yFor(f.score)])

  // Scrubber position
  const scrubberX = xFor(currentFrame, totalFrames)
  const scrubberY = yFor(frame.score)

  return (
    <section className="py-24 relative" ref={ref} id="ai-visibility-replay">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-6"
          >
            <Rewind className="w-3.5 h-3.5" />
            AI Visibility Replay™
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Replay Your{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Score Journey
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch exactly how your AI visibility changed over time. See which actions moved the needle — and by how much.
          </p>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-emerald-500/30 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                {/* Timeline panel */}
                <div>
                  {/* VCR Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md border border-white/10">
                        <span className="text-xs font-mono text-muted-foreground">REC</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">
                        Day {frame.day} / 30 — {frame.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <motion.span
                        key={frame.score}
                        initial={{ scale: 1.2, color: frame.delta >= 0 ? '#10b981' : '#ef4444' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        transition={{ duration: 0.4 }}
                        className="text-2xl font-bold font-mono"
                      >
                        {frame.score}
                      </motion.span>
                      {frame.delta !== 0 && (
                        <Badge
                          className={`text-xs font-mono px-1.5 ${
                            frame.delta > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {frame.delta > 0 ? '+' : ''}{frame.delta}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* SVG Timeline */}
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                      className="w-full h-auto min-w-[500px]"
                      role="img"
                      aria-label="AI Visibility Replay timeline showing score changes over 30 days"
                    >
                      {/* Gridlines */}
                      {[35, 45, 55, 65, 75].map((g) => (
                        <g key={`grid-${g}`}>
                          <line
                            x1={PAD_L}
                            x2={VIEW_W - PAD_R}
                            y1={yFor(g)}
                            y2={yFor(g)}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                          />
                          <text
                            x={PAD_L - 8}
                            y={yFor(g) + 4}
                            textAnchor="end"
                            className="fill-muted-foreground"
                            style={{ fontSize: 10 }}
                          >
                            {g}
                          </text>
                        </g>
                      ))}

                      {/* Ghost full path */}
                      <path
                        d={smoothPath(fullPoints)}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />

                      {/* Active played path */}
                      {mainPoints.length >= 2 && (
                        <motion.path
                          d={smoothPath(mainPoints)}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }}
                        />
                      )}

                      {/* Played dots with deltas */}
                      {frames.slice(0, currentFrame + 1).map((f, i) => (
                        <g key={`dot-${i}`}>
                          {f.highlight && (
                            <circle
                              cx={xFor(i, totalFrames)}
                              cy={yFor(f.score)}
                              r={8}
                              fill="rgba(16,185,129,0.15)"
                              stroke="#10b981"
                              strokeWidth={1}
                            />
                          )}
                          <circle
                            cx={xFor(i, totalFrames)}
                            cy={yFor(f.score)}
                            r={3.5}
                            fill={f.highlight ? '#10b981' : 'rgba(16,185,129,0.6)'}
                            stroke="#0a0a0a"
                            strokeWidth={1}
                          />
                          {/* Delta label */}
                          {f.delta !== 0 && i > 0 && (
                            <text
                              x={xFor(i, totalFrames)}
                              y={yFor(f.score) - 12}
                              textAnchor="middle"
                              fill={f.delta > 0 ? '#10b981' : '#ef4444'}
                              style={{ fontSize: 10, fontWeight: 700 }}
                            >
                              {f.delta > 0 ? '+' : ''}{f.delta}
                            </text>
                          )}
                          {/* Event label */}
                          {f.highlight && f.event && i <= currentFrame && (
                            <g>
                              <rect
                                x={xFor(i, totalFrames) - 42}
                                y={yFor(f.score) + 10}
                                width={84}
                                height={18}
                                rx={4}
                                fill="rgba(16,185,129,0.15)"
                                stroke="rgba(16,185,129,0.3)"
                                strokeWidth={0.5}
                              />
                              <text
                                x={xFor(i, totalFrames)}
                                y={yFor(f.score) + 23}
                                textAnchor="middle"
                                fill="#6ee7b7"
                                style={{ fontSize: 8, fontWeight: 600 }}
                              >
                                {f.event}
                              </text>
                            </g>
                          )}
                        </g>
                      ))}

                      {/* Scrubber head */}
                      <motion.g
                        animate={{ x: scrubberX, y: scrubberY }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <circle cx={0} cy={0} r={6} fill="#10b981" stroke="#0a0a0a" strokeWidth={2} />
                        <circle cx={0} cy={0} r={12} fill="rgba(16,185,129,0.2)" />
                      </motion.g>

                      {/* Vertical scrubber line */}
                      <motion.line
                        x1={scrubberX}
                        x2={scrubberX}
                        y1={PAD_T}
                        y2={VIEW_H - PAD_B}
                        stroke="rgba(16,185,129,0.3)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        animate={{ x1: scrubberX, x2: scrubberX }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />

                      {/* X-axis labels */}
                      {frames.map((f, i) => (
                        <text
                          key={`x-${i}`}
                          x={xFor(i, totalFrames)}
                          y={VIEW_H - PAD_B + 20}
                          textAnchor="middle"
                          className="fill-muted-foreground"
                          style={{ fontSize: i % 2 === 0 ? 9 : 8 }}
                        >
                          {i % 2 === 0 ? f.date : ''}
                        </text>
                      ))}
                    </svg>
                  </div>

                  {/* VCR Controls */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRestart}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStepBack}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      <Rewind className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={isPlaying ? stopPlayback : startPlayback}
                      className="h-10 w-10 rounded-full border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStepForward}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      <FastForward className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSkipEnd}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 px-2">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Side panel — per-engine breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Engine Breakdown
                  </h4>
                  {Object.entries(engineColors).map(([key, meta]) => {
                    const engineScore = frame.engines[key as keyof typeof frame.engines]
                    const firstScore = frames[0].engines[key as keyof typeof frame.engines]
                    const delta = engineScore - firstScore
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      >
                        <Card className="bg-white/[0.03] border-white/10">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.glow}` }}
                                />
                                <span className="text-sm font-medium">{meta.label}</span>
                              </div>
                              <span className="text-lg font-bold font-mono" style={{ color: meta.color }}>
                                {engineScore}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: meta.color }}
                                animate={{ width: `${engineScore}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-xs text-muted-foreground">Started: {firstScore}</span>
                              <span className={`text-xs font-mono font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {delta >= 0 ? '+' : ''}{delta}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}

                  {/* Summary stat */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-muted-foreground">Total gain:</span>
                      <span className="font-bold text-emerald-400">+25 points in 30 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            Start Your Replay
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
