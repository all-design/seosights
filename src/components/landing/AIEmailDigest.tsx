'use client'

import { useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Moon,
  Sun,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  XCircle,
  Mail,
  Bell,
} from 'lucide-react'

// ── Mock email data ──────────────────────────────────────────────────────
const engineBreakdown = [
  { engine: 'ChatGPT', previous: 58, current: 63, delta: 5, color: '#10b981' },
  { engine: 'Claude', previous: 54, current: 59, delta: 5, color: '#a855f7' },
  { engine: 'Perplexity', previous: 68, current: 72, delta: 4, color: '#06b6d4' },
  { engine: 'Gemini', previous: 61, current: 62, delta: 1, color: '#f59e0b' },
  { engine: 'Copilot', previous: 55, current: 55, delta: 0, color: '#6366f1' },
]

const citationChanges = [
  { type: 'gained', engine: 'ChatGPT', query: '"best dental implants NYC"', position: 2 },
  { type: 'gained', engine: 'Claude', query: '"affordable cosmetic dentistry"', position: 1 },
  { type: 'lost', engine: 'Gemini', query: '"teeth whitening near me"', position: null },
]

type Frequency = 'daily' | 'weekly' | 'monthly'

interface AIEmailDigestProps {
  onStartFree?: () => void
}

export default function AIEmailDigest({ onStartFree }: AIEmailDigestProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [frequency, setFrequency] = useState<Frequency>('daily')

  const totalPrevious = 62
  const totalCurrent = 67
  const totalDelta = totalCurrent - totalPrevious
  const gainedCitations = citationChanges.filter((c) => c.type === 'gained').length
  const lostCitations = citationChanges.filter((c) => c.type === 'lost').length

  return (
    <section className="py-24 relative" ref={ref} id="ai-email-digest">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/8 to-background" />

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
            <Moon className="w-3.5 h-3.5" />
            What Changed Overnight?
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Wake Up to{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AI Visibility Insights
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every morning, get a briefing on what changed while you slept. Score moves, citation wins, and losses — delivered to your inbox.
          </p>
        </motion.div>

        {/* Main layout: Email mockup + frequency toggle */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Email mockup in laptop frame */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* Laptop frame */}
            <div className="relative">
              {/* Laptop top bezel */}
              <div className="bg-white/10 rounded-t-xl border border-white/10 border-b-0 px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <div className="flex-1 mx-4">
                    <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-muted-foreground text-center font-mono">
                      mail.seosights.com/inbox
                    </div>
                  </div>
                </div>
              </div>

              {/* Email content */}
              <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 rounded-t-none">
                <CardContent className="p-4 sm:p-6">
                  {/* Email header */}
                  <div className="border-b border-white/10 pb-4 mb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <Moon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Seosights Night Watch</div>
                        <div className="text-xs text-muted-foreground">noreply@seosights.com</div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mt-2">
                      🌙 What Changed Overnight — Feb 25, 2025
                    </h3>
                  </div>

                  {/* Score change hero */}
                  <div className="text-center py-6 mb-6 rounded-xl bg-gradient-to-r from-emerald-500/5 via-purple-500/5 to-cyan-500/5 border border-white/5">
                    <div className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">AI Visibility Score</div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl font-bold text-muted-foreground/50">{totalPrevious}</span>
                      <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                      <span className="text-5xl font-bold text-foreground">{totalCurrent}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm font-bold px-3 py-1 ml-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{totalDelta}
                      </Badge>
                    </div>
                  </div>

                  {/* Citations summary */}
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{gainedCitations}</span>
                      <span className="text-sm text-muted-foreground">gained</span>
                    </div>
                    <div className="w-px h-5 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-400 font-bold">{lostCitations}</span>
                      <span className="text-sm text-muted-foreground">lost</span>
                    </div>
                  </div>

                  {/* Engine breakdown */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Engine Breakdown
                    </h4>
                    <div className="space-y-2.5">
                      {engineBreakdown.map((engine, i) => (
                        <motion.div
                          key={engine.engine}
                          initial={{ opacity: 0, x: -10 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: engine.color, boxShadow: `0 0 6px ${engine.color}40` }}
                          />
                          <span className="text-sm font-medium w-20">{engine.engine}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: engine.color }}
                              initial={{ width: 0 }}
                              animate={isInView ? { width: `${engine.current}%` } : {}}
                              transition={{ duration: 0.8, delay: 0.6 + i * 0.08 }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8 text-right">{engine.previous}</span>
                          {engine.delta > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                          ) : engine.delta < 0 ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-muted-foreground/30" />
                          )}
                          <span className="text-sm font-bold w-8 text-right" style={{ color: engine.color }}>
                            {engine.current}
                          </span>
                          <span
                            className={`text-xs font-mono font-bold w-10 text-right ${
                              engine.delta > 0 ? 'text-emerald-400' : engine.delta < 0 ? 'text-rose-400' : 'text-muted-foreground/30'
                            }`}
                          >
                            {engine.delta > 0 ? '+' : ''}{engine.delta}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Citation details */}
                  <div className="border-t border-white/10 pt-5">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Citation Changes
                    </h4>
                    <div className="space-y-2">
                      {citationChanges.map((change, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                            change.type === 'gained'
                              ? 'bg-emerald-500/5 border border-emerald-500/15'
                              : 'bg-rose-500/5 border border-rose-500/15'
                          }`}
                        >
                          {change.type === 'gained' ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{change.query}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{change.engine}</span>
                          </div>
                          {change.position && (
                            <Badge
                              className={`text-[10px] ${
                                change.type === 'gained'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              #{change.position}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Laptop bottom bezel */}
              <div className="bg-white/5 rounded-b-xl border border-white/10 border-t-0 h-4 flex items-center justify-center">
                <div className="w-16 h-1 rounded-full bg-white/10" />
              </div>
            </div>
          </motion.div>

          {/* Right panel: frequency toggle + info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-4"
          >
            {/* Frequency toggle */}
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Delivery Frequency
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as Frequency[]).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                        frequency === freq
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                          : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-foreground'
                      }`}
                    >
                      {freq === 'daily' && <Sun className="w-3.5 h-3.5 mx-auto mb-1" />}
                      {freq === 'weekly' && <Calendar className="w-3.5 h-3.5 mx-auto mb-1" />}
                      {freq === 'monthly' && <Mail className="w-3.5 h-3.5 mx-auto mb-1" />}
                      {freq}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {frequency === 'daily' && 'Every morning at 7:00 AM your time'}
                  {frequency === 'weekly' && 'Monday morning digest'}
                  {frequency === 'monthly' && 'First Monday of each month'}
                </p>
              </CardContent>
            </Card>

            {/* What you get */}
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  What You Get
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Score Changes</div>
                      <div className="text-xs text-muted-foreground">Track daily score movement</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Citation Alerts</div>
                      <div className="text-xs text-muted-foreground">Know when AI engines cite you</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Loss Detection</div>
                      <div className="text-xs text-muted-foreground">Catch dropped mentions fast</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Engine Breakdown</div>
                      <div className="text-xs text-muted-foreground">Per-engine delta analysis</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sample notification */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-xl border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">Morning Briefing Preview</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &quot;Your AI visibility rose to <span className="text-emerald-400 font-bold">67</span> (+5). You gained citations on{' '}
                  <span className="text-emerald-400">ChatGPT</span> and <span className="text-emerald-400">Claude</span>.{' '}
                  <span className="text-rose-400">Gemini</span> dropped a citation on &quot;teeth whitening near me&quot;.&quot;
                </p>
              </CardContent>
            </Card>
          </motion.div>
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
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all duration-300"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            Get Your Morning Briefing
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
