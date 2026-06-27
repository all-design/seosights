'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Swords,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Star,
  Newspaper,
  FileCode2,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────
type ReasonIcon = 'reddit' | 'wikipedia' | 'reviews' | 'news' | 'schema'

interface EngineRow {
  engine: string
  you: number
  competitor: number
  topReason: string
}

interface Reason {
  id: string
  icon: ReasonIcon
  label: string
  detail: string
  youValue: number
  compValue: number
  // 0–100 gap severity (0 = neutral / tied)
  severity: number
}

interface Competitor {
  id: string
  name: string
  emoji: string
  rows: EngineRow[]
  reasons: Reason[]
}

const ICONS: Record<ReasonIcon, typeof MessageSquare> = {
  reddit: MessageSquare,
  wikipedia: BookOpen,
  reviews: Star,
  news: Newspaper,
  schema: FileCode2,
}

const ENGINE_COLORS: Record<string, string> = {
  ChatGPT: 'text-emerald-300',
  Claude: 'text-amber-300',
  Gemini: 'text-purple-300',
  Perplexity: 'text-cyan-300',
}

// ── Mock competitor data ────────────────────────────────────
const COMPETITORS: Competitor[] = [
  {
    id: 'notion', name: 'Notion', emoji: '📝',
    rows: [
      { engine: 'ChatGPT',    you: 31, competitor: 142, topReason: 'Competitor has 8× more G2 reviews and a Wikipedia article' },
      { engine: 'Claude',     you: 4,  competitor: 88,  topReason: 'No Wikipedia article — Claude weights knowledge bases heaviest' },
      { engine: 'Gemini',     you: 18, competitor: 95,  topReason: 'Competitor has 5× TechCrunch coverage and a Wikidata entity' },
      { engine: 'Perplexity', you: 22, competitor: 110, topReason: 'Competitor appears in 12 Reddit threads vs. your 1' },
    ],
    reasons: [
      { id: 'reddit',     icon: 'reddit',     label: 'Reddit presence',         detail: 'Competitor in 12 threads, you in 1',            youValue: 1, compValue: 12,  severity: 92 },
      { id: 'wikipedia',  icon: 'wikipedia',  label: 'Wikipedia article',       detail: "They have one, you don't",                       youValue: 0, compValue: 1,   severity: 98 },
      { id: 'reviews',    icon: 'reviews',    label: 'Review volume (G2)',      detail: '312 reviews vs. 8',                              youValue: 8, compValue: 312, severity: 88 },
      { id: 'news',       icon: 'news',       label: 'News coverage',           detail: 'Forbes + TechCrunch vs. none',                   youValue: 0, compValue: 7,   severity: 85 },
      { id: 'schema',     icon: 'schema',     label: 'Schema & llms.txt',       detail: 'Both have, neutral',                             youValue: 1, compValue: 1,   severity: 0 },
    ],
  },
  {
    id: 'monday', name: 'Monday.com', emoji: '📊',
    rows: [
      { engine: 'ChatGPT',    you: 31, competitor: 168, topReason: 'Competitor has 12× more G2 reviews + Forbes Council contributor' },
      { engine: 'Claude',     you: 4,  competitor: 102, topReason: 'Wikipedia article + 3 Reddit AMAs drive Claude citations' },
      { engine: 'Gemini',     you: 18, competitor: 78,  topReason: 'Competitor Wikidata has 14 statements vs. your 0' },
      { engine: 'Perplexity', you: 22, competitor: 144, topReason: '20+ Reddit threads and a Trustpilot 4.6 rating' },
    ],
    reasons: [
      { id: 'reddit',     icon: 'reddit',     label: 'Reddit presence',         detail: 'Competitor in 20 threads, you in 1',            youValue: 1, compValue: 20,  severity: 95 },
      { id: 'wikipedia',  icon: 'wikipedia',  label: 'Wikipedia article',       detail: "They have one, you don't",                       youValue: 0, compValue: 1,   severity: 98 },
      { id: 'reviews',    icon: 'reviews',    label: 'Review volume (G2)',      detail: '480 reviews vs. 8',                              youValue: 8, compValue: 480, severity: 92 },
      { id: 'news',       icon: 'news',       label: 'News coverage',           detail: 'Forbes + 4 TechCrunch articles vs. none',       youValue: 0, compValue: 9,   severity: 90 },
      { id: 'schema',     icon: 'schema',     label: 'Schema & llms.txt',       detail: 'Both have, neutral',                             youValue: 1, compValue: 1,   severity: 0 },
    ],
  },
  {
    id: 'clickup', name: 'ClickUp', emoji: '⚡',
    rows: [
      { engine: 'ChatGPT',    you: 31, competitor: 121, topReason: 'Competitor has 6× more G2 reviews and an active Wikipedia page' },
      { engine: 'Claude',     you: 4,  competitor: 64,  topReason: 'Wikipedia + 5 Quora answers cited by Claude' },
      { engine: 'Gemini',     you: 18, competitor: 72,  topReason: 'Competitor has Google Business Profile + Wikidata' },
      { engine: 'Perplexity', you: 22, competitor: 88,  topReason: '8 Reddit threads + 3 industry blog features' },
    ],
    reasons: [
      { id: 'reddit',     icon: 'reddit',     label: 'Reddit presence',         detail: 'Competitor in 8 threads, you in 1',             youValue: 1, compValue: 8,   severity: 80 },
      { id: 'wikipedia',  icon: 'wikipedia',  label: 'Wikipedia article',       detail: "They have one, you don't",                       youValue: 0, compValue: 1,   severity: 98 },
      { id: 'reviews',    icon: 'reviews',    label: 'Review volume (G2)',      detail: '244 reviews vs. 8',                              youValue: 8, compValue: 244, severity: 86 },
      { id: 'news',       icon: 'news',       label: 'News coverage',           detail: 'TechCrunch + 2 industry blogs vs. none',        youValue: 0, compValue: 5,   severity: 75 },
      { id: 'schema',     icon: 'schema',     label: 'Schema & llms.txt',       detail: 'Both have, neutral',                             youValue: 1, compValue: 1,   severity: 0 },
    ],
  },
]

// ── Component ───────────────────────────────────────────────
export default function AICompetitorWarRoom({ onStartFree }: { onStartFree: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeId, setActiveId] = useState<string>('notion')
  const active = COMPETITORS.find((c) => c.id === activeId)!

  return (
    <section id="war-room" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute -top-32 right-1/4 w-[500px] h-[300px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 mb-4">
            <Swords className="w-3 h-3 mr-1" /> Competitive Intelligence
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Head-to-head. Engine by engine.{' '}
            <span className="text-purple-400">Reason by reason.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The War Room doesn&apos;t just show that a competitor beats you — it shows exactly why,
            across every AI engine, with the specific sources driving their advantage.
          </p>
        </motion.div>

        {/* Competitor selector chips */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {COMPETITORS.map((c) => {
            const isActive = c.id === activeId
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)]'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{c.emoji}</span>
                {c.name}
              </button>
            )
          })}
        </motion.div>

        {/* Comparison matrix */}
        <motion.div
          className="rounded-2xl border border-purple-500/20 bg-black/30 backdrop-blur-sm p-4 sm:p-6 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-bold">
              Mention matrix: <span className="text-purple-300">You</span> vs. {active.name}
            </h3>
            <Badge variant="outline" className="border-white/10 text-muted-foreground">
              Last 30 days
            </Badge>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="text-left font-medium py-3 px-3">AI Engine</th>
                  <th className="text-right font-medium py-3 px-3">You</th>
                  <th className="text-right font-medium py-3 px-3">{active.name}</th>
                  <th className="text-right font-medium py-3 px-3">Gap</th>
                  <th className="text-left font-medium py-3 px-3">Top reason</th>
                </tr>
              </thead>
              <tbody>
                {active.rows.map((row, i) => {
                  const gap = row.you - row.competitor
                  const positive = gap > 0
                  const neutral = gap === 0
                  return (
                    <motion.tr
                      key={`${active.id}-${row.engine}`}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                    >
                      <td className="py-4 px-3 font-semibold">
                        <span className={ENGINE_COLORS[row.engine]}>{row.engine}</span>
                      </td>
                      <td className="py-4 px-3 text-right text-muted-foreground tabular-nums">{row.you}</td>
                      <td className="py-4 px-3 text-right font-semibold tabular-nums">{row.competitor}</td>
                      <td className="py-4 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border ${
                            neutral
                              ? 'bg-white/10 text-white border-white/20'
                              : positive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {neutral ? (
                            <Minus className="w-3 h-3" />
                          ) : positive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {gap > 0 ? '+' : ''}
                          {gap}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-xs text-muted-foreground italic">{row.topReason}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Reasons breakdown */}
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-bold">Why {active.name} wins</h3>
          <Badge variant="outline" className="border-purple-500/30 text-purple-300">
            {active.reasons.filter((r) => r.severity > 0).length} fixable gaps
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {active.reasons.map((r, i) => {
              const Icon = ICONS[r.icon]
              const neutral = r.severity === 0
              return (
                <motion.div
                  key={`${active.id}-${r.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <Card
                    className={`bg-white/[0.02] border ${
                      neutral ? 'border-white/10' : 'border-rose-500/20'
                    } hover:border-purple-500/40 transition-colors`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${
                            neutral
                              ? 'bg-white/5 text-muted-foreground'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm">{r.label}</h4>
                            <span
                              className={`text-xs font-bold ${
                                neutral ? 'text-muted-foreground' : 'text-rose-300'
                              }`}
                            >
                              {neutral ? 'NEUTRAL' : `-${r.severity}%`}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
                        </div>
                      </div>

                      {/* Gap bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                          <span>You: {r.youValue}</span>
                          <span>{active.name}: {r.compValue}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className={neutral ? 'bg-white/30' : 'bg-rose-500'}
                            initial={{ width: 0 }}
                            animate={isInView ? { width: `${neutral ? 50 : r.severity}%` } : {}}
                            transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {neutral ? (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> No action needed
                        </span>
                      ) : (
                        <button
                          onClick={onStartFree}
                          className="text-xs font-semibold text-purple-300 hover:text-purple-200 inline-flex items-center gap-1 transition-colors"
                        >
                          Close this gap <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {/* Footer CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg h-12 px-8"
          >
            Enter the war room <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
