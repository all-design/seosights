'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  ArrowRight,
  MessageSquareQuote,
  Network,
  FileCode2,
  Share2,
} from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────
const DEMO_SCORE = 73
const DEMO_BRAND = 'Your Brand'

interface ScoreFactor {
  label: string
  description: string
  value: number
  icon: typeof MessageSquareQuote
}

const factors: ScoreFactor[] = [
  {
    label: 'Citation Frequency',
    description: 'How often AI models mention you',
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

// ── Score Gauge (270° arc SVG, simplified — no tick marks) ─────────────
function ScoreGauge({ score, brand, inView }: { score: number; brand: string; inView: boolean }) {
  const size = 320
  const cx = size / 2
  const cy = size / 2
  const r = 130
  const startAngle = 135 // bottom-left
  const sweep = 270 // clockwise → ends at 45° (bottom-right)

  const startRad = (startAngle * Math.PI) / 180
  const endRad = ((startAngle + sweep) * Math.PI) / 180
  const sx = cx + r * Math.cos(startRad)
  const sy = cy + r * Math.sin(startRad)
  const ex = cx + r * Math.cos(endRad)
  const ey = cy + r * Math.sin(endRad)

  const arcPath = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
  const fillFraction = score / 100

  return (
    <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] mx-auto">
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500/30 via-fuchsia-500/25 to-purple-500/15 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox={`0 0 ${size} ${size}`} className="relative w-full h-full">
        <defs>
          <linearGradient id="understandScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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

        {/* Animated fill arc */}
        <motion.path
          d={arcPath}
          pathLength={1}
          fill="none"
          stroke="url(#understandScoreGradient)"
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
          className="text-5xl sm:text-6xl font-bold tabular-nums bg-gradient-to-br from-purple-200 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent leading-none"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-foreground">{brand}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Section ─────────────────────────────────────────────────────────
export default function UnderstandSection({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // API-driven state (initialised to demo so component renders immediately)
  const [score, setScore] = useState(DEMO_SCORE)
  const [factorValues, setFactorValues] = useState<number[]>(DEMO_FACTORS)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!isInView) return
    let cancelled = false
    fetch('/api/ai/visibility-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', brand: 'Your Brand' }),
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
        // Keep demo data — always works
      })
    return () => {
      cancelled = true
    }
  }, [isInView])

  return (
    <section
      id="understand"
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
            <Eye className="w-3 h-3 mr-1" />
            Understand
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-foreground tracking-tight leading-[1.05]">
            Know exactly how{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              AI sees your brand
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Your AI Visibility Score measures whether ChatGPT, Claude, Gemini &amp; Perplexity recommend you. Updated daily. 40+ signals. One number.
          </p>
        </motion.div>

        {/* Central gauge */}
        <motion.div
          className="relative mb-16"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <ScoreGauge score={score} brand={isLive ? 'Your Brand' : DEMO_BRAND} inView={isInView} />
        </motion.div>

        {/* Score factor cards — 2x2 grid */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
          }}
        >
          <div className="grid sm:grid-cols-2 gap-5">
            {factors.map((f, i) => (
              <motion.div
                key={f.label}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Will AI recommend you?{' '}
              <span className="text-foreground font-medium">Find out in 20 seconds.</span>
            </p>
            <Button
              onClick={onStartFree}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white border-0 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              Check your AI Visibility
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
