'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, ArrowRight, Signal, Calendar, Users } from 'lucide-react'

// ── AI Engine Data ────────────────────────────────────────────────────────
interface AIEngine {
  name: string
  tagline: string
  score: number
  color: string
  dotColor: string
  glowColor: string
  borderColor: string
}

const engines: AIEngine[] = [
  {
    name: 'ChatGPT',
    tagline: 'Most citations tracked',
    score: 78,
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    glowColor: 'shadow-emerald-500/25',
    borderColor: 'hover:border-emerald-500/40',
  },
  {
    name: 'Claude',
    tagline: 'Highest trust signals',
    score: 65,
    color: 'text-amber-400',
    dotColor: 'bg-amber-400',
    glowColor: 'shadow-amber-500/25',
    borderColor: 'hover:border-amber-500/40',
  },
  {
    name: 'Gemini',
    tagline: 'Fastest growing',
    score: 71,
    color: 'text-violet-400',
    dotColor: 'bg-violet-400',
    glowColor: 'shadow-violet-500/25',
    borderColor: 'hover:border-violet-500/40',
  },
  {
    name: 'Perplexity',
    tagline: 'Real-time references',
    score: 82,
    color: 'text-cyan-400',
    dotColor: 'bg-cyan-400',
    glowColor: 'shadow-cyan-500/25',
    borderColor: 'hover:border-cyan-500/40',
  },
  {
    name: 'Copilot',
    tagline: 'Enterprise reach',
    score: 59,
    color: 'text-blue-400',
    dotColor: 'bg-blue-400',
    glowColor: 'shadow-blue-500/25',
    borderColor: 'hover:border-blue-500/40',
  },
]

// ── Stat Highlights ───────────────────────────────────────────────────────
const stats = [
  { label: '40+ signals tracked', icon: Signal },
  { label: 'Daily score updates', icon: Calendar },
  { label: 'Competitor benchmarks', icon: Users },
]

// ── Progress bar color per engine ─────────────────────────────────────────
function getBarGradient(name: string): string {
  switch (name) {
    case 'ChatGPT':
      return 'from-emerald-500 to-emerald-400'
    case 'Claude':
      return 'from-amber-500 to-amber-400'
    case 'Gemini':
      return 'from-violet-500 to-violet-400'
    case 'Perplexity':
      return 'from-cyan-500 to-cyan-400'
    case 'Copilot':
      return 'from-blue-500 to-blue-400'
    default:
      return 'from-purple-500 to-fuchsia-400'
  }
}

// ── Main Section ──────────────────────────────────────────────────────────
export default function MeasureSection({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="measure"
      ref={ref}
      className="py-24 relative bg-background overflow-hidden"
    >
      {/* Subtle radial accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.05),transparent_60%)] pointer-events-none" />

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
            className="mb-5 border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Measure
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-foreground tracking-tight leading-[1.05]">
            One score.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Five AI engines.
            </span>{' '}
            Zero blind spots.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Monitor your AI Visibility across ChatGPT, Claude, Gemini, Perplexity and Copilot. Daily updates. Citation tracking. Competitor comparison.
          </p>
        </motion.div>

        {/* AI Engine Cards — horizontal scroll on mobile, 5-col on desktop */}
        <motion.div
          className="mb-16"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
          }}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {engines.map((engine) => (
              <motion.div
                key={engine.name}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.04, y: -4 }}
                className={`min-w-[220px] lg:min-w-0 rounded-2xl border border-white/10 bg-card p-5 transition-all duration-300 cursor-default ${engine.borderColor} hover:shadow-lg ${engine.glowColor}`}
              >
                {/* Engine header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className={`inline-block w-3 h-3 rounded-full ${engine.dotColor}`} />
                  <span className="text-sm font-bold text-foreground">{engine.name}</span>
                </div>

                {/* Tagline */}
                <p className="text-xs text-muted-foreground mb-4">{engine.tagline}</p>

                {/* Score */}
                <div className="flex items-end justify-between mb-3">
                  <span className={`text-3xl font-bold tabular-nums ${engine.color}`}>
                    {engine.score}
                  </span>
                  <span className="text-xs text-muted-foreground pb-1">/ 100</span>
                </div>

                {/* Mini progress bar */}
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(engine.name)}`}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${engine.score}%` } : {}}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stat Highlights */}
        <motion.div
          className="max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-card p-4 text-center"
              >
                <stat.icon className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0 shadow-[0_0_30px_rgba(34,197,94,0.35)]"
          >
            Start measuring your AI Visibility
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
