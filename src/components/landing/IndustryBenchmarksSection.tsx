'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BarChart3, ArrowRight, ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react'

// ── Benchmark Data ──────────────────────────────────────────
interface IndustryBenchmark {
  id: string
  industry: string
  label: string
  emoji: string
  avgScore: number
  change: number
  sampleSize: number
}

const BENCHMARKS: IndustryBenchmark[] = [
  { id: '1', industry: 'saas', label: 'SaaS', emoji: '💻', avgScore: 72, change: 3, sampleSize: 1240 },
  { id: '2', industry: 'finance', label: 'Finance', emoji: '💰', avgScore: 68, change: 5, sampleSize: 980 },
  { id: '3', industry: 'healthcare', label: 'Healthcare', emoji: '🏥', avgScore: 64, change: 2, sampleSize: 870 },
  { id: '4', industry: 'ecommerce', label: 'E-Commerce', emoji: '🛒', avgScore: 61, change: -1, sampleSize: 1520 },
  { id: '5', industry: 'marketing_agencies', label: 'Marketing', emoji: '📢', avgScore: 58, change: 4, sampleSize: 650 },
  { id: '6', industry: 'real_estate', label: 'Real Estate', emoji: '🏠', avgScore: 53, change: 1, sampleSize: 430 },
  { id: '7', industry: 'law_firms', label: 'Law Firms', emoji: '⚖️', avgScore: 47, change: 6, sampleSize: 390 },
  { id: '8', industry: 'restaurants', label: 'Restaurants', emoji: '🍽️', avgScore: 42, change: -2, sampleSize: 1100 },
  { id: '9', industry: 'hotels', label: 'Hotels', emoji: '🏨', avgScore: 39, change: 0, sampleSize: 520 },
  { id: '10', industry: 'dentists', label: 'Dentists', emoji: '🦷', avgScore: 31, change: -1, sampleSize: 340 },
]

function getBarColor(score: number): string {
  if (score >= 65) return 'from-emerald-500 to-emerald-400'
  if (score >= 50) return 'from-amber-500 to-amber-400'
  return 'from-red-500 to-red-400'
}

function getScoreIcon(score: number) {
  if (score >= 65) return { Icon: ArrowUp, color: 'text-emerald-400' }
  if (score >= 50) return { Icon: Minus, color: 'text-amber-400' }
  return { Icon: ArrowDown, color: 'text-red-400' }
}

// ── Component ───────────────────────────────────────────────
export default function IndustryBenchmarksSection({ onStartFree }: { onStartFree: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const maxScore = Math.max(...BENCHMARKS.map((b) => b.avgScore))

  return (
    <section id="benchmarks" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-5 border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Industry Data
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            How Do You{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              Compare?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Average AI Visibility Score by industry — see where you stand against your competitors
          </p>
        </motion.div>

        {/* Benchmark chart */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="border-emerald-500/20 bg-black/30 backdrop-blur-sm overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Industry Benchmarks</h3>
                  <p className="text-[11px] text-muted-foreground">Based on 8,040 analyzed domains</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                Updated daily
              </Badge>
            </div>

            {/* Ranked list */}
            <div className="p-4 sm:p-5 space-y-1.5 max-h-[540px] overflow-y-auto">
              {BENCHMARKS.map((bench, i) => {
                const { Icon: ScoreIcon, color: scoreColor } = getScoreIcon(bench.avgScore)
                const barPct = (bench.avgScore / maxScore) * 100
                return (
                  <motion.div
                    key={bench.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.25 + i * 0.06 }}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors ${
                      bench.industry === 'saas' ? 'bg-emerald-500/5 border border-emerald-500/20' : ''
                    }`}
                  >
                    {/* Rank */}
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                      {i + 1}
                    </span>

                    {/* Emoji + Label */}
                    <div className="w-28 sm:w-36 shrink-0 flex items-center gap-2">
                      <span className="text-base">{bench.emoji}</span>
                      <span
                        className={`text-sm font-medium truncate ${
                          bench.industry === 'saas' ? 'text-emerald-400' : 'text-foreground'
                        }`}
                      >
                        {bench.label}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(bench.avgScore)}`}
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${barPct}%` } : {}}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Score + verdict */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ScoreIcon className={`h-3 w-3 ${scoreColor}`} />
                      <span className="text-sm font-bold tabular-nums text-foreground w-7 text-right">
                        {bench.avgScore}
                      </span>
                    </div>

                    {/* Change indicator */}
                    <span
                      className={`text-[10px] font-medium w-10 text-right shrink-0 ${
                        bench.change > 0
                          ? 'text-emerald-400'
                          : bench.change < 0
                          ? 'text-red-400'
                          : 'text-muted-foreground/50'
                      }`}
                    >
                      {bench.change > 0 ? `+${bench.change}` : bench.change < 0 ? `${bench.change}` : '—'}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            {/* Card footer */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">
                <span className="text-emerald-400 font-medium">SaaS</span> highlighted as your industry
              </span>
              <span className="text-xs text-muted-foreground">
                Scores out of 100 • Higher is better
              </span>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Benchmarks updated daily from real AI citation data across 5 engines
          </p>
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 px-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            See where you stand <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
