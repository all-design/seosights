'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { LineChart, CheckCircle2, ArrowRight, Sparkles, Calendar } from 'lucide-react'

// ── Chart geometry ────────────────────────────────────────────────────────
const VIEW_W = 560
const VIEW_H = 280
const PAD_L = 44
const PAD_R = 24
const PAD_T = 28
const PAD_B = 36
const CHART_W = VIEW_W - PAD_L - PAD_R // 492
const CHART_H = VIEW_H - PAD_T - PAD_B // 216
const N_POINTS = 4

const xFor = (i: number) => PAD_L + (i * CHART_W) / (N_POINTS - 1)
const yFor = (v: number) => PAD_T + CHART_H - (v / 100) * CHART_H

// ── Projection model (fallback) ──────────────────────────────────────────────
const FALLBACK_TODAY_SCORE = 44
const GAIN_30 = 1.0625
const GAIN_60 = 2.1875
const GAIN_90 = 2.9375

const X_LABELS = ['Today', '30d', '60d', '90d'] as const

// ── Tasks ────────────────────────────────────────────────────────────────
const TASK_LABELS: string[] = [
  'Add FAQ schema to top 10 pages',
  'Optimize title tags for AI citation',
  'Publish llms.txt at site root',
  'Add author bios with E-E-A-T signals',
  'Expand thin content with expert quotes',
  'Submit sitemap to AI crawlers',
  'Build topical authority clusters',
  'Add comparison tables to product pages',
  'Implement JSON-LD Organization schema',
  'Create content hub for primary topic',
  'Refresh stale blog posts (2022+)',
  'Optimize for conversational queries',
  'Add internal links from high-authority pages',
  'Claim & verify Google Business Profile',
  'Earn 5 high-DR backlinks this quarter',
  'Add structured data for reviews',
  'Publish pillar page for main keyword',
  'Improve Core Web Vitals (<2.5s LCP)',
  'Build branded entity in Wikidata',
  'Generate AI-answerable content briefs',
]

const DEFAULT_CHECKED = 16

// ── Path generators ───────────────────────────────────────────────────────
function smoothLine(values: number[]): string {
  const points = values.map((v, i) => [xFor(i), yFor(v)] as const)
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

function areaPath(values: number[]): string {
  const line = smoothLine(values)
  const lastX = xFor(values.length - 1)
  const firstX = xFor(0)
  const baseY = PAD_T + CHART_H
  return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
}

export default function AIVisibilityForecast({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  // Task completion state — default first DEFAULT_CHECKED done
  const [done, setDone] = useState<boolean[]>(() =>
    TASK_LABELS.map((_, i) => i < DEFAULT_CHECKED)
  )
  const [isLive, setIsLive] = useState(false)
  const [apiTasks, setApiTasks] = useState<string[] | null>(null)
  const [apiProjection, setApiProjection] = useState<number[] | null>(null)

  // Fetch API data on mount
  useEffect(() => {
    fetch('/api/ai/forecast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'Acme Inc', currentScore: 44 }),
    }).then(r => r.json()).then(data => {
      if (data?.projections) {
        setApiProjection(data.projections.map((p: { score: number }) => Math.min(99, Math.max(1, p.score ?? 44))))
        setIsLive(true)
      }
      if (Array.isArray(data?.tasks)) {
        setApiTasks(data.tasks.map((t: { label: string }) => t.label))
      }
    }).catch(() => {})
  }, [])

  const taskLabels = apiTasks ?? TASK_LABELS

  const TODAY_SCORE = apiProjection?.[0] ?? FALLBACK_TODAY_SCORE

  const completedCount = useMemo(
    () => done.filter(Boolean).length,
    [done]
  )

  const trajectory = useMemo(() => {
    if (apiProjection && apiProjection.length >= 4) return apiProjection as readonly [number, number, number, number]
    const s30 = Math.min(100, Math.round(TODAY_SCORE + completedCount * GAIN_30))
    const s60 = Math.min(100, Math.round(TODAY_SCORE + completedCount * GAIN_60))
    const s90 = Math.min(100, Math.round(TODAY_SCORE + completedCount * GAIN_90))
    return [TODAY_SCORE, s30, s60, s90] as const
  }, [completedCount, TODAY_SCORE, apiProjection])

  const finalScore = trajectory[3]
  const progressPct = (completedCount / taskLabels.length) * 100

  const toggleTask = (i: number) =>
    setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  // Y gridlines
  const gridlines = [0, 25, 50, 75, 100]

  return (
    <section id="forecast" className="py-24 relative" ref={sectionRef}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px] pointer-events-none" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Calendar className="w-3.5 h-3.5" />
            Your 90-Day Trajectory{isLive && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Live AI</span>}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            See your{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent">
              AI Visibility Score
            </span>{' '}
            90 days from now.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Complete the recommended tasks and watch your score climb. We
            project the outcome before you lift a finger.
          </p>
        </motion.div>

        {/* Forecast card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="bg-white/[0.04] backdrop-blur-xl border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.10)] max-w-5xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── LEFT: task list ─────────────────────────────────── */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      Tasks Remaining
                    </h3>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {completedCount}/{taskLabels.length} done
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 max-h-[340px] overflow-y-auto custom-scroll">
                    <ul className="space-y-1">
                      {taskLabels.map((label, i) => {
                        const isDone = done[i]
                        return (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.3, delay: 0.2 + i * 0.015 }}
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleTask(i)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(i) } }}
                              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors group cursor-pointer ${
                                isDone ? 'bg-purple-500/10 hover:bg-purple-500/15' : 'hover:bg-white/5'
                              }`}
                            >
                              <Checkbox
                                checked={isDone}
                                tabIndex={-1}
                                aria-hidden="true"
                                className="border-purple-500/40 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 pointer-events-none"
                              />
                              <span
                                className={`text-sm leading-snug ${
                                  isDone
                                    ? 'text-purple-200/90 line-through decoration-purple-400/50'
                                    : 'text-muted-foreground group-hover:text-foreground'
                                }`
                              }
                              >
                                {label}
                              </span>
                            </div>
                          </motion.li>
                        )
                      })}
                    </ul>
                  </div>

                  <p className="text-[11px] text-muted-foreground/70 mt-3 flex items-start gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                    Each completed task accelerates your 90-day projection.
                    Toggle tasks to watch the forecast shift.
                  </p>
                </div>

                {/* ── RIGHT: projection chart ────────────────────────── */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-purple-400" />
                      Score Projection
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      AI Visibility · 0–100
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <svg
                      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                      className="w-full h-auto"
                      role="img"
                      aria-label={`AI Visibility Score projection: Today ${TODAY_SCORE}, 30 days ${trajectory[1]}, 60 days ${trajectory[2]}, 90 days ${trajectory[3]}`}
                    >
                      <defs>
                        <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Gridlines + Y labels */}
                      {gridlines.map((g) => {
                        const y = yFor(g)
                        return (
                          <g key={`grid-${g}`}>
                            <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray={g === 0 ? '0' : '3 5'} />
                            <text x={PAD_L - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 10 }}>
                              {g}
                            </text>
                          </g>
                        )
                      })}

                      {/* X-axis labels */}
                      {X_LABELS.map((lbl, i) => (
                        <text key={`xl-${i}`} x={xFor(i)} y={VIEW_H - PAD_B + 22} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
                          {lbl}
                        </text>
                      ))}

                      {/* Area under line */}
                      <motion.path
                        key={`area-${finalScore}`}
                        d={areaPath([...trajectory])}
                        fill="url(#forecastGradient)"
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                      />

                      {/* Line */}
                      <motion.path
                        d={smoothLine([...trajectory])}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          filter: 'drop-shadow(0 0 5px rgba(168,85,247,0.6))',
                        }}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                          isInView
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                        }
                        transition={{
                          pathLength: { duration: 1.4, ease: 'easeInOut' },
                          opacity: { duration: 0.3 },
                        }}
                      />

                      {/* Dots + value labels */}
                      {trajectory.map((val, i) => {
                        const cx = xFor(i)
                        const cy = yFor(val)
                        return (
                          <motion.g
                            key={`pt-${i}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={
                              isInView
                                ? { opacity: 1, scale: 1 }
                                : { opacity: 0, scale: 0 }
                            }
                            transition={{
                              duration: 0.35,
                              delay: 0.5 + i * 0.35,
                            }}
                            style={{ transformOrigin: `${cx}px ${cy}px` }}
                          >
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#a855f7"
                              stroke="#0a0a0a"
                              strokeWidth={2}
                            />
                            {/* Value label badge */}
                            <g>
                              <rect
                                x={cx - 18}
                                y={cy - 28}
                                width={36}
                                height={18}
                                rx={4}
                                fill="rgba(168,85,247,0.18)"
                                stroke="#a855f7"
                                strokeWidth={0.8}
                              />
                              <text
                                x={cx}
                                y={cy - 15}
                                textAnchor="middle"
                                fill="#e9d5ff"
                                style={{ fontSize: 11, fontWeight: 700 }}
                              >
                                {val}
                              </text>
                            </g>
                          </motion.g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* Summary line */}
                  <div className="mt-4 rounded-lg bg-purple-500/10 border border-purple-500/20 px-4 py-3">
                    <p className="text-sm text-purple-100/90 leading-relaxed">
                      If you complete{' '}
                      <span className="font-bold text-purple-200 tabular-nums">
                        {completedCount} of {taskLabels.length}
                      </span>{' '}
                      tasks, your AI Visibility Score reaches{' '}
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={finalScore}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="inline-flex items-baseline font-bold text-purple-200 tabular-nums"
                        >
                          {finalScore}
                        </motion.span>
                      </AnimatePresence>{' '}
                      in 90 days.
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>Task Progress</span>
                        <span className="tabular-nums">
                          {Math.round(progressPct)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                          initial={{ width: 0 }}
                          animate={
                            isInView ? { width: `${progressPct}%` } : { width: 0 }
                          }
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.35)] hover:shadow-[0_0_45px_rgba(168,85,247,0.55)] transition-all duration-300"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Forecast your trajectory
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
