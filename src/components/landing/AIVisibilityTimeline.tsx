'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Sparkles, BarChart3, Link2, ArrowUpRight } from 'lucide-react'

// ── Chart layout constants ───────────────────────────────────────────────
const VIEW_W = 800
const VIEW_H = 320
const PAD_L = 50
const PAD_R = 30
const PAD_T = 30
const PAD_B = 40
const CHART_W = VIEW_W - PAD_L - PAD_R // 720
const CHART_H = VIEW_H - PAD_T - PAD_B // 250
const X_STEP = CHART_W / 7 // 8 weeks → 7 gaps
const N_WEEKS = 8

// y(0)   = PAD_T + CHART_H = 280
// y(100) = PAD_T          = 30
const yFor = (v: number) => PAD_T + CHART_H - (v / 100) * CHART_H
const xFor = (i: number) => PAD_L + i * X_STEP

// ── Series data (8 weeks each) ───────────────────────────────────────────
interface Series {
  key: string
  label: string
  color: string
  values: number[]
  glow: string
}

const series: Series[] = [
  {
    key: 'google',
    label: 'Google Visibility',
    color: '#10b981', // emerald
    glow: 'rgba(16,185,129,0.55)',
    values: [62, 64, 65, 67, 70, 72, 75, 78],
  },
  {
    key: 'ai',
    label: 'AI Visibility',
    color: '#a855f7', // purple
    glow: 'rgba(168,85,247,0.6)',
    values: [28, 32, 36, 42, 50, 58, 65, 71],
  },
  {
    key: 'entity',
    label: 'Entity Score',
    color: '#06b6d4', // cyan
    glow: 'rgba(6,182,212,0.55)',
    values: [40, 42, 45, 48, 52, 56, 61, 65],
  },
  {
    key: 'citations',
    label: 'Citation Count',
    color: '#f59e0b', // amber
    glow: 'rgba(245,158,11,0.55)',
    values: [12, 16, 20, 25, 30, 37, 43, 48],
  },
]

// ── Smooth cubic-bezier path generator ───────────────────────────────────
function smoothPath(values: number[]): string {
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

// ── Stat cards (the deltas) ──────────────────────────────────────────────
const statCards = [
  {
    label: 'AI Visibility',
    delta: '+143%',
    icon: Sparkles,
    color: 'text-purple-400',
    accent: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.18)]',
  },
  {
    label: 'Citations',
    delta: '+300%',
    icon: Link2,
    color: 'text-amber-400',
    accent: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.18)]',
  },
  {
    label: 'Entity Score',
    delta: '+25 pts',
    icon: BarChart3,
    color: 'text-cyan-400',
    accent: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.18)]',
  },
  {
    label: 'Google',
    delta: '+16 pts',
    icon: TrendingUp,
    color: 'text-emerald-400',
    accent: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.18)]',
  },
]

// ── Annotation target (Week 6, AI Visibility value = 58) ─────────────────
const ANN_WEEK_INDEX = 5 // Week 6 (0-indexed)
const ANN_X = xFor(ANN_WEEK_INDEX)
const ANN_Y = yFor(58)

export default function AIVisibilityTimeline() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Y-axis gridlines at 0, 25, 50, 75, 100
  const gridlines = [0, 25, 50, 75, 100]

  return (
    <section className="py-24 relative" ref={ref} id="ai-visibility-timeline">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            AI Visibility Timeline
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Watch Your{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              AI Visibility
            </span>{' '}
            Climb Week Over Week
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track Google rankings, AI citations, entity authority, and mention
            growth — all in one timeline.
          </p>
        </motion.div>

        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/30 transition-all duration-300">
            <CardContent className="p-6 sm:p-8">
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
                {series.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: `0 0 8px ${s.glow}`,
                      }}
                    />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* SVG Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className="w-full h-auto min-w-[640px]"
                  role="img"
                  aria-label="AI Visibility Timeline chart showing Google Visibility, AI Visibility, Entity Score, and Citation Count over 8 weeks"
                >
                  {/* Gridlines */}
                  {gridlines.map((g) => {
                    const y = yFor(g)
                    return (
                      <g key={`grid-${g}`}>
                        <line
                          x1={PAD_L}
                          x2={VIEW_W - PAD_R}
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth={1}
                          strokeDasharray={g === 0 ? '0' : '4 4'}
                        />
                        <text
                          x={PAD_L - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-muted-foreground"
                          style={{ fontSize: 11 }}
                        >
                          {g}
                        </text>
                      </g>
                    )
                  })}

                  {/* X-axis labels (W1..W8) */}
                  {Array.from({ length: N_WEEKS }).map((_, i) => (
                    <text
                      key={`wk-${i}`}
                      x={xFor(i)}
                      y={VIEW_H - PAD_B + 22}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      style={{ fontSize: 11 }}
                    >
                      W{i + 1}
                    </text>
                  ))}

                  {/* Annotation arrow + badge (Week 6, AI Visibility) */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={
                      isInView
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.85 }
                    }
                    transition={{ duration: 0.5, delay: 2.4 }}
                    style={{ transformOrigin: `${ANN_X}px ${ANN_Y - 40}px` }}
                  >
                    {/* Vertical guide line */}
                    <line
                      x1={ANN_X}
                      x2={ANN_X}
                      y1={ANN_Y - 8}
                      y2={ANN_Y - 36}
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                    {/* Arrow head */}
                    <polygon
                      points={`${ANN_X - 4},${ANN_Y - 10} ${ANN_X + 4},${ANN_Y - 10} ${ANN_X},${ANN_Y - 3}`}
                      fill="#a855f7"
                    />
                    {/* Highlight dot on the line */}
                    <circle
                      cx={ANN_X}
                      cy={ANN_Y}
                      r={5}
                      fill="#a855f7"
                      stroke="#0a0a0a"
                      strokeWidth={2}
                    />
                    {/* Badge background */}
                    <rect
                      x={ANN_X - 70}
                      y={ANN_Y - 78}
                      width={140}
                      height={32}
                      rx={8}
                      fill="rgba(168,85,247,0.15)"
                      stroke="#a855f7"
                      strokeWidth={1}
                    />
                    {/* Badge text */}
                    <text
                      x={ANN_X}
                      y={ANN_Y - 57}
                      textAnchor="middle"
                      fill="#d8b4fe"
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >
                      +143% AI citations
                    </text>
                  </motion.g>

                  {/* The four animated polylines */}
                  {series.map((s, idx) => (
                    <motion.path
                      key={s.key}
                      d={smoothPath(s.values)}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: `drop-shadow(0 0 4px ${s.glow})`,
                      }}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        isInView
                          ? { pathLength: 1, opacity: 1 }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        pathLength: {
                          duration: 1.5,
                          delay: 0.5 + idx * 0.25,
                          ease: 'easeInOut',
                        },
                        opacity: {
                          duration: 0.4,
                          delay: 0.5 + idx * 0.25,
                        },
                      }}
                    />
                  ))}

                  {/* End-point dots (rendered last so they sit on top) */}
                  {series.map((s, idx) => {
                    const lastVal = s.values[s.values.length - 1]
                    const cx = xFor(N_WEEKS - 1)
                    const cy = yFor(lastVal)
                    return (
                      <motion.circle
                        key={`dot-${s.key}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={s.color}
                        stroke="#0a0a0a"
                        strokeWidth={1.5}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={
                          isInView
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0 }
                        }
                        transition={{
                          duration: 0.4,
                          delay: 0.5 + idx * 0.25 + 1.5,
                        }}
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      />
                    )
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat cards row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 1.2 } },
          }}
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.45 }}
            >
              <Card
                className={`bg-white/5 backdrop-blur-sm border-white/10 border-l-4 ${stat.accent} hover:${stat.glow} transition-all duration-300`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <ArrowUpRight className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1`}
                  >
                    {stat.delta}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
