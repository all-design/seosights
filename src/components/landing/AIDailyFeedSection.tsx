'use client'

import { useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, ArrowRight, Rss } from 'lucide-react'

// ── Sample Feed Data ────────────────────────────────────────
interface FeedItem {
  id: string
  emoji: string
  title: string
  description: string
  delta: number
  engine: string
  timeAgo: string
  severity: 'positive' | 'warning' | 'critical' | 'info'
}

const SAMPLE_FEED: FeedItem[] = [
  {
    id: '1',
    emoji: '🏆',
    title: 'Citation gained on ChatGPT',
    description: 'Your site was recommended for "best project management tools" — you moved from #5 to #2.',
    delta: 8,
    engine: 'chatgpt',
    timeAgo: '2h ago',
    severity: 'positive',
  },
  {
    id: '2',
    emoji: '⚠️',
    title: 'Citation lost on Perplexity',
    description: 'Competitor outranked you for "CRM software comparison" — your position dropped from #3 to #7.',
    delta: -5,
    engine: 'perplexity',
    timeAgo: '4h ago',
    severity: 'warning',
  },
  {
    id: '3',
    emoji: '🔍',
    title: 'Competitor alert: Notion added Wikipedia article',
    description: 'Notion created a Wikipedia page — this typically increases AI citation volume by 30-40%.',
    delta: 0,
    engine: 'claude',
    timeAgo: '6h ago',
    severity: 'critical',
  },
  {
    id: '4',
    emoji: '✨',
    title: 'New entity detected: Your brand in Wikidata',
    description: 'Your company was added as a Wikidata entity with 5 statements — a strong AI authority signal.',
    delta: 12,
    engine: 'gemini',
    timeAgo: '9h ago',
    severity: 'positive',
  },
  {
    id: '5',
    emoji: '📈',
    title: 'Score milestone: 70+ AI Visibility reached!',
    description: 'You crossed the 70-point threshold — only 18% of SaaS companies achieve this score.',
    delta: 3,
    engine: 'chatgpt',
    timeAgo: '12h ago',
    severity: 'positive',
  },
]

const SEVERITY_STYLES: Record<string, { bg: string; border: string }> = {
  positive: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
  warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
  critical: { bg: 'bg-red-500/5', border: 'border-red-500/20' },
  info: { bg: 'bg-slate-500/5', border: 'border-slate-500/20' },
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: 'text-emerald-400',
  claude: 'text-amber-400',
  gemini: 'text-purple-400',
  perplexity: 'text-cyan-400',
  copilot: 'text-rose-400',
}

// ── Component ───────────────────────────────────────────────
export default function AIDailyFeedSection({ onStartFree }: { onStartFree: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="ai-feed" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/10 to-background" />
      <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-[400px] h-[300px] rounded-full bg-emerald-600/6 blur-[100px] pointer-events-none" />

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
            <Rss className="w-3 h-3 mr-1" />
            Live Feed
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Your AI Visibility{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              Feed
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The reason you&apos;ll open seosights every morning
          </p>
        </motion.div>

        {/* Feed preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-emerald-500/20 bg-black/30 backdrop-blur-sm overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Visibility Feed</h3>
                  <p className="text-[11px] text-muted-foreground">Updated 2 min ago</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                Live
              </Badge>
            </div>

            {/* Feed items */}
            <div className="p-3 sm:p-4 space-y-2 max-h-[520px] overflow-y-auto">
              <AnimatePresence>
                {SAMPLE_FEED.map((item, i) => {
                  const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                      className={`rounded-lg border p-3 ${style.bg} ${style.border} hover:bg-white/[0.02] transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5 shrink-0">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-medium text-sm text-foreground">{item.title}</span>
                            {item.delta !== 0 && (
                              <span
                                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                  item.delta > 0
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {item.delta > 0 ? '+' : ''}
                                {item.delta}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`text-xs font-medium ${ENGINE_COLORS[item.engine] || 'text-muted-foreground'}`}
                            >
                              {item.engine.charAt(0).toUpperCase() + item.engine.slice(1)}
                            </span>
                            <span className="text-xs text-muted-foreground/60">•</span>
                            <span className="text-xs text-muted-foreground/60">{item.timeAgo}</span>
                          </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0 animate-pulse" />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Card footer */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">5 of 24 updates today</span>
              <span className="text-xs text-emerald-400 font-medium">View all →</span>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Real-time alerts for citations gained, citations lost, competitor moves, and milestones
          </p>
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 px-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            See your feed <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
