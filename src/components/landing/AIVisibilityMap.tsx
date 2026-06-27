'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  TrendingUp,
  EyeOff,
  Eye,
  ArrowUpRight,
} from 'lucide-react'

// ─── Engine data ─────────────────────────────────────────────────────────
// Engine dot colors are small/colored only — bars use score-based states.
type EngineKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot'

interface EngineRow {
  key: EngineKey
  name: string
  score: number
  dotColor: string
  dotGlow: string
  insight: string
}

const ENGINES: EngineRow[] = [
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    score: 82,
    dotColor: '#10b981',
    dotGlow: 'rgba(16,185,129,0.55)',
    insight: "Cited in 8 of 10 startup-CRM prompts.",
  },
  {
    key: 'claude',
    name: 'Claude',
    score: 61,
    dotColor: '#f59e0b',
    dotGlow: 'rgba(245,158,11,0.55)',
    insight: "Claude relies on Wikipedia — you don't have an article.",
  },
  {
    key: 'gemini',
    name: 'Gemini',
    score: 91,
    dotColor: '#8b5cf6',
    dotGlow: 'rgba(139,92,246,0.6)',
    insight: "Strong entity match in Google's Knowledge Graph.",
  },
  {
    key: 'perplexity',
    name: 'Perplexity',
    score: 53,
    dotColor: '#06b6d4',
    dotGlow: 'rgba(6,182,212,0.55)',
    insight: 'Sparse mentions across crawled sources.',
  },
  {
    key: 'copilot',
    name: 'Copilot',
    score: 74,
    dotColor: '#3b82f6',
    dotGlow: 'rgba(59,130,246,0.55)',
    insight: 'Recently surfaced via Bing entity card.',
  },
]

const OVERALL = Math.round(
  ENGINES.reduce((sum, e) => sum + e.score, 0) / ENGINES.length
) // → 72

// ─── Score → bar state ───────────────────────────────────────────────────
interface BarState {
  bg: string
  text: string
  label: 'Dominant' | 'Competitive' | 'Invisible'
  Icon: typeof Activity
}

function barState(score: number): BarState {
  if (score >= 70) {
    return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Dominant', Icon: Activity }
  }
  if (score >= 40) {
    return { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Competitive', Icon: TrendingUp }
  }
  return { bg: 'bg-rose-500', text: 'text-rose-400', label: 'Invisible', Icon: EyeOff }
}

// ─── Component ───────────────────────────────────────────────────────────
export default function AIVisibilityMap({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="visibility-map">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />

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
            <Eye className="w-3.5 h-3.5" />
            Your Visibility At A Glance
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Five AI engines.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              Five different verdicts.
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            You might dominate Gemini and be invisible to Claude. The Visibility
            Map shows your standing across every engine in one glance — so you
            know exactly where to focus.
          </p>
        </motion.div>

        {/* The Map */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8 shadow-[0_0_40px_rgba(168,85,247,0.08)]">
            <div className="space-y-6">
              {ENGINES.map((eng, i) => {
                const state = barState(eng.score)
                const StatusIcon = state.Icon
                return (
                  <div key={eng.key} className="group">
                    {/* Top row: name + dot | track */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5 w-28 sm:w-32 shrink-0">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: eng.dotColor,
                            boxShadow: `0 0 8px ${eng.dotGlow}`,
                          }}
                        />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {eng.name}
                        </span>
                      </div>

                      <div className="relative flex-1 h-9 rounded-md bg-white/5 overflow-hidden">
                        <motion.div
                          className={`absolute inset-y-0 left-0 ${state.bg} flex items-center justify-end pr-2`}
                          initial={{ width: 0 }}
                          animate={
                            isInView ? { width: `${eng.score}%` } : { width: 0 }
                          }
                          transition={{
                            duration: 1.1,
                            delay: 0.3 + i * 0.12,
                            ease: 'easeOut',
                          }}
                        >
                          <span className="font-mono text-base sm:text-lg font-bold text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] whitespace-nowrap">
                            {eng.score}
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Status row */}
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="w-28 sm:w-32 shrink-0" />
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${state.text} shrink-0`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {state.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          — {eng.insight}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Aggregate callout */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Overall AI Visibility Score
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-bold text-purple-400 font-mono tabular-nums leading-none">
                      {OVERALL}
                    </span>
                    <span className="text-xl text-muted-foreground font-mono">
                      / 100
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold font-mono">
                  <ArrowUpRight className="w-4 h-4" />
                  ↑ 4 since last week
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-8">
            <Button
              size="lg"
              className="bg-purple-500 hover:bg-purple-400 text-black font-semibold text-base px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
              onClick={onStartFree}
            >
              <Activity className="mr-2 w-4 h-4" />
              Map your visibility →
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
