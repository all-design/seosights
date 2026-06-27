'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Gauge,
  ArrowRight,
  MessageSquareQuote,
  Network,
  FileCode2,
  Share2,
} from 'lucide-react'

// ── Mock data ────────────────────────────────────────────────────────────
const DEMO_SCORE = 73
const DEMO_BRAND = 'Acme Inc.'

interface MetricComparison {
  name: string
  measures: string
  era: 'yesterday' | 'today'
}

const comparisons: MetricComparison[] = [
  { name: 'Domain Authority (Moz)', measures: 'backlinks', era: 'yesterday' },
  { name: 'Domain Rating (Ahrefs)', measures: 'backlinks', era: 'yesterday' },
  { name: 'AI Visibility Score', measures: 'AI citations', era: 'today' },
]

interface ScoreFactor {
  label: string
  description: string
  value: number
  icon: typeof MessageSquareQuote
}

const factors: ScoreFactor[] = [
  {
    label: 'Citation Frequency',
    description: 'ChatGPT / Claude / Gemini mentions',
    value: 68,
    icon: MessageSquareQuote,
  },
  {
    label: 'Entity Authority',
    description: 'Wikipedia, Wikidata, Knowledge Graph',
    value: 81,
    icon: Network,
  },
  {
    label: 'Content Accessibility',
    description: 'llms.txt, schema, crawler access',
    value: 92,
    icon: FileCode2,
  },
  {
    label: 'Source Diversity',
    description: 'Reddit, G2, news, docs',
    value: 54,
    icon: Share2,
  },
]

const DEMO_FACTORS = factors.map((f) => f.value)

// ── Circular score gauge (hand-coded SVG, 270° arc) ──────────────────────
function ScoreGauge({ score, inView }: { score: number; inView: boolean }) {
  const size = 320
  const cx = size / 2
  const cy = size / 2
  const r = 130
  const startAngle = 135 // SVG degrees (y-down): bottom-left
  const sweep = 270 // clockwise → ends at 45° (bottom-right)

  const startRad = (startAngle * Math.PI) / 180
  const endRad = ((startAngle + sweep) * Math.PI) / 180
  const sx = cx + r * Math.cos(startRad)
  const sy = cy + r * Math.sin(startRad)
  const ex = cx + r * Math.cos(endRad)
  const ey = cy + r * Math.sin(endRad)

  const arcPath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
  const fillFraction = score / 100

  // 11 tick marks across the 270° arc (0, 10, 20, …, 100)
  const ticks = Array.from({ length: 11 }).map((_, i) => {
    const angle = (startAngle + (sweep / 10) * i) * (Math.PI / 180)
    const r1 = r - 22
    const r2 = r - 32
    return {
      x1: cx + r1 * Math.cos(angle),
      y1: cy + r1 * Math.sin(angle),
      x2: cx + r2 * Math.cos(angle),
      y2: cy + r2 * Math.sin(angle),
      major: i % 5 === 0,
    }
  })

  return (
    <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] mx-auto">
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500/30 via-fuchsia-500/25 to-purple-500/15 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox={`0 0 ${size} ${size}`} className="relative w-full h-full">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="55%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={14}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1.toFixed(2)}
            y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)}
            y2={t.y2.toFixed(2)}
            stroke={t.major ? 'rgba(217,70,239,0.45)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={t.major ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Animated fill arc */}
        <motion.path
          d={arcPath}
          pathLength={1}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray="1 1"
          initial={{ strokeDashoffset: 1 }}
          animate={inView ? { strokeDashoffset: 1 - fillFraction } : { strokeDashoffset: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: 'drop-shadow(0 0 12px rgba(192,38,211,0.55))' }}
        />
      </svg>

      {/* Center number + label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
          AI Visibility Score
        </span>
        <motion.span
          className="text-6xl sm:text-7xl font-bold tabular-nums bg-gradient-to-br from-purple-200 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent leading-none"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-foreground">{DEMO_BRAND}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main section ─────────────────────────────────────────────────────────
export default function AIVisibilityScoreSection({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // API-driven state (initialised to mock so component renders immediately)
  const [score, setScore] = useState(DEMO_SCORE)
  const [factorValues, setFactorValues] = useState<number[]>(DEMO_FACTORS)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!isInView) return
    let cancelled = false
    fetch('/api/ai/visibility-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://acme.com', brand: 'Acme Inc' }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (typeof data.overallScore === 'number') {
          setScore(data.overallScore)
          const dims = data.dimensions ?? {}
          setFactorValues([
            dims.citationFrequency ?? DEMO_FACTORS[0],
            dims.entityAuthority ?? DEMO_FACTORS[1],
            dims.contentAccessibility ?? DEMO_FACTORS[2],
            dims.sourceDiversity ?? DEMO_FACTORS[3],
          ])
          setIsLive(true)
        }
      })
      .catch(() => {
        // Keep mock data — demo always works
      })
    return () => { cancelled = true }
  }, [isInView])

  return (
    <section
      id="ai-visibility-score"
      ref={ref}
      className="py-24 relative bg-background overflow-hidden"
    >
      {/* Radial purple glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-5 border-purple-500/40 text-purple-300 bg-purple-500/10"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            The New Standard
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-foreground tracking-tight leading-[1.05]">
            One number tells you if AI will{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              recommend your business
            </span>
            .
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Domain Rating measures links. AI Visibility Score measures whether ChatGPT, Claude, Gemini & Perplexity actually cite you. 0–100. Updated daily. The metric your competitors will quote in boardrooms.
          </p>
        </motion.div>

        {/* Central gauge */}
        <motion.div
          className="relative mb-20"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <ScoreGauge score={score} inView={isInView} />
        </motion.div>

        {/* Comparison row */}
        <motion.div
          className="grid md:grid-cols-3 gap-4 mb-16 max-w-5xl mx-auto"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
          }}
        >
          {comparisons.map((c) => {
            const highlighted = c.era === 'today'
            return (
              <motion.div
                key={c.name}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                className={
                  highlighted
                    ? 'relative rounded-2xl border-2 border-purple-500/60 bg-card p-6 shadow-[0_0_40px_rgba(168,85,247,0.22)]'
                    : 'rounded-2xl border border-white/10 bg-card p-6'
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <Gauge
                    className={`w-5 h-5 ${
                      highlighted ? 'text-purple-400' : 'text-muted-foreground/50'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      highlighted
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-white/5 text-muted-foreground border-white/10'
                    }`}
                  >
                    {highlighted ? "Today's metric" : "Yesterday's metric"}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1.5 text-foreground leading-tight">
                  {c.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Measures{' '}
                  <span
                    className={
                      highlighted
                        ? 'text-purple-300 font-medium'
                        : 'text-foreground/70'
                    }
                  >
                    {c.measures}
                  </span>
                </p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Score breakdown */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-purple-300" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                What feeds the score
              </h3>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              4 of 40+ signals
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {factors.map((f, i) => (
              <div
                key={f.label}
                className="rounded-xl border border-white/10 bg-card p-5 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-purple-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {f.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {f.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {factorValues[i]}
                      <span className="text-xs text-muted-foreground ml-0.5">/100</span>
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${factorValues[i]}%` } : {}}
                    transition={{ duration: 1.2, delay: 0.8 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer line */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Tracked across{' '}
              <span className="text-foreground font-medium">5 AI engines</span>.{' '}
              <span className="text-foreground font-medium">40+ signals</span>. Updated
              every <span className="text-foreground font-medium">24 hours</span>.
            </p>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
              {isLive ? 'Live AI analysis' : 'Demo data'}
            </span>
          </div>
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          >
            Start tracking your score
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
