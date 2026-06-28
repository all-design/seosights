'use client'

import { useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Circle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ArrowRight,
  Mic,
  Clock,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

// ── Mock data: "Acme Dental" brand, 2/5→4/5 mentions ────────────────────
interface EngineMention {
  engine: string
  color: string
  glow: string
  previous: 'mentioned' | 'not-mentioned' | 'position-changed'
  current: 'mentioned' | 'not-mentioned' | 'position-changed'
  previousPosition?: number
  currentPosition?: number
  change: 'gained' | 'lost' | 'position' | 'unchanged'
  snippet?: string
}

const engineMentions: EngineMention[] = [
  {
    engine: 'ChatGPT',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.5)',
    previous: 'not-mentioned',
    current: 'mentioned',
    change: 'gained',
    snippet: '"For dental implants, Acme Dental offers competitive pricing..."',
  },
  {
    engine: 'Claude',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.5)',
    previous: 'not-mentioned',
    current: 'mentioned',
    change: 'gained',
    snippet: '"I recommend Acme Dental for their implant expertise..."',
  },
  {
    engine: 'Perplexity',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.5)',
    previous: 'mentioned',
    current: 'mentioned',
    change: 'position',
    previousPosition: 5,
    currentPosition: 2,
    snippet: '"Top dental providers: 1) BrightSmile 2) Acme Dental 3)..."',
  },
  {
    engine: 'Gemini',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.5)',
    previous: 'mentioned',
    current: 'not-mentioned',
    change: 'lost',
    snippet: '',
  },
  {
    engine: 'Copilot',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.5)',
    previous: 'not-mentioned',
    current: 'not-mentioned',
    change: 'unchanged',
  },
]

interface PastRecording {
  id: string
  date: string
  mentions: number
  totalEngines: number
  delta: number
}

const pastRecordings: PastRecording[] = [
  { id: 'rec-1', date: 'Feb 24', mentions: 4, totalEngines: 5, delta: 2 },
  { id: 'rec-2', date: 'Feb 17', mentions: 2, totalEngines: 5, delta: 0 },
  { id: 'rec-3', date: 'Feb 10', mentions: 2, totalEngines: 5, delta: -1 },
  { id: 'rec-4', date: 'Feb 3', mentions: 3, totalEngines: 5, delta: 1 },
  { id: 'rec-5', date: 'Jan 27', mentions: 2, totalEngines: 5, delta: 0 },
]

function ChangeIcon({ change }: { change: EngineMention['change'] }) {
  switch (change) {
    case 'gained':
      return <ArrowUpRight className="w-4 h-4 text-emerald-400" />
    case 'lost':
      return <ArrowDownRight className="w-4 h-4 text-rose-400" />
    case 'position':
      return <Minus className="w-4 h-4 text-amber-400" />
    default:
      return <Circle className="w-4 h-4 text-muted-foreground/30" />
  }
}

function StatusBadge({ status }: { status: EngineMention['current'] }) {
  if (status === 'mentioned') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Mentioned
      </Badge>
    )
  }
  if (status === 'position-changed') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
        <AlertCircle className="w-3 h-3 mr-0.5" /> Position Shift
      </Badge>
    )
  }
  return (
    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
      <XCircle className="w-3 h-3 mr-0.5" /> Not Mentioned
    </Badge>
  )
}

interface AIRecommendationRecorderProps {
  onStartFree?: () => void
}

export default function AIRecommendationRecorder({ onStartFree }: AIRecommendationRecorderProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null)

  const gained = engineMentions.filter((e) => e.change === 'gained').length
  const lost = engineMentions.filter((e) => e.change === 'lost').length
  const currentMentions = engineMentions.filter((e) => e.current === 'mentioned').length

  return (
    <section className="py-24 relative" ref={ref} id="ai-recommendation-recorder">
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
            <Mic className="w-3.5 h-3.5" />
            AI Recommendation Recorder™
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Records What{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 bg-clip-text text-transparent">
              AI Engines Recommend
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Track every AI mention. See exactly when you gain or lose recommendations — and what changed between recordings.
          </p>
        </motion.div>

        {/* REC indicator bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between mb-6 px-4 py-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-sm font-bold text-rose-400 font-mono">REC</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Monitoring: <span className="text-foreground font-semibold">Acme Dental</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">{gained}</span>
              <span className="text-muted-foreground">gained</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 font-bold">{lost}</span>
              <span className="text-muted-foreground">lost</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold">{currentMentions}/5</span>
              <span className="text-muted-foreground ml-1">mentions</span>
            </div>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Engine cards */}
          <div className="space-y-3">
            {engineMentions.map((engine, i) => (
              <motion.div
                key={engine.engine}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              >
                <Card
                  className={`bg-white/[0.03] backdrop-blur-xl border-white/10 cursor-pointer transition-all duration-300 hover:border-white/20 ${
                    selectedEngine === engine.engine ? 'ring-1 ring-white/20' : ''
                  } ${
                    engine.change === 'gained'
                      ? 'border-l-4 border-l-emerald-500'
                      : engine.change === 'lost'
                        ? 'border-l-4 border-l-rose-500'
                        : engine.change === 'position'
                          ? 'border-l-4 border-l-amber-500'
                          : ''
                  }`}
                  onClick={() => setSelectedEngine(selectedEngine === engine.engine ? null : engine.engine)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: engine.color, boxShadow: `0 0 10px ${engine.glow}` }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{engine.engine}</span>
                            <ChangeIcon change={engine.change} />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={engine.previous} />
                            <span className="text-muted-foreground text-xs">→</span>
                            <StatusBadge status={engine.current} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {engine.change === 'position' && engine.previousPosition && engine.currentPosition && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground text-sm line-through">#{engine.previousPosition}</span>
                            <ArrowRight className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400 font-bold text-sm">#{engine.currentPosition}</span>
                          </div>
                        )}
                        {engine.change === 'gained' && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> New Mention
                          </Badge>
                        )}
                        {engine.change === 'lost' && (
                          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                            <ArrowDownRight className="w-3 h-3 mr-0.5" /> Dropped
                          </Badge>
                        )}
                        {engine.change === 'unchanged' && (
                          <Badge className="bg-white/5 text-muted-foreground border-white/10">No Change</Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded diff view */}
                    {selectedEngine === engine.engine && engine.snippet && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">AI Response Snippet</div>
                        <div
                          className={`p-3 rounded-lg text-sm ${
                            engine.change === 'gained'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                              : engine.change === 'lost'
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200 line-through opacity-60'
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                          }`}
                        >
                          {engine.snippet}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Timeline of past recordings */}
          <div>
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Recording History
                  </h4>
                </div>

                <div className="space-y-0">
                  {pastRecordings.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                      className="relative flex items-start gap-3 pb-4"
                    >
                      {/* Timeline line */}
                      {i < pastRecordings.length - 1 && (
                        <div className="absolute left-[7px] top-5 w-px h-full bg-white/10" />
                      )}
                      {/* Dot */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border-2 ${
                          i === 0
                            ? 'bg-purple-500 border-purple-400'
                            : 'bg-white/10 border-white/20'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{rec.date}</span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              rec.delta > 0
                                ? 'text-emerald-400'
                                : rec.delta < 0
                                  ? 'text-rose-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {rec.delta > 0 ? '+' : ''}{rec.delta}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {rec.mentions}/{rec.totalEngines} mentions
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Trend arrow */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">30-day trend</span>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">2/5 → 4/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick summary card */}
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 mt-4">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  What Changed
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-400 font-medium">ChatGPT</span>
                    <span className="text-muted-foreground">now recommends you</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-400 font-medium">Claude</span>
                    <span className="text-muted-foreground">now recommends you</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-400 font-medium">Perplexity</span>
                    <span className="text-muted-foreground">moved #5 → #2</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-rose-400 font-medium">Gemini</span>
                    <span className="text-muted-foreground">dropped your mention</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all duration-300"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            Start Recording
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
