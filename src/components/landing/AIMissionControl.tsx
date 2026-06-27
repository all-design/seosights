'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  ArrowRight,
  ChevronRight,
  Clock,
  Eye,
  Crosshair,
  Search,
  Radio,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIMissionControlProps {
  onStartFree?: () => void
}

// ── Mock Data ─────────────────────────────────────────────────
const SCORE_DATA = {
  score: 71,
  max: 100,
  yesterday: 68,
  delta: 3,
  verdict: 'Competitive' as const,
}

type Verdict = 'Critical' | 'Developing' | 'Competitive' | 'Dominant'

const ENGINE_DATA = [
  { engine: 'ChatGPT', indexed: true, citations: 24, color: 'emerald' as const },
  { engine: 'Claude', indexed: true, citations: 18, color: 'amber' as const },
  { engine: 'Gemini', indexed: true, citations: 12, color: 'purple' as const },
  { engine: 'Perplexity', indexed: false, citations: 0, color: 'cyan' as const },
  { engine: 'Copilot', indexed: true, citations: 8, color: 'blue' as const },
]

const ACTIVITY_FEED = [
  { id: '1', time: '2m ago', text: 'ChatGPT cited your FAQ page', type: 'citation' as const },
  { id: '2', time: '18m ago', text: 'Score increased +3 points', type: 'score' as const },
  { id: '3', time: '1h ago', text: 'GPTBot crawled /pricing', type: 'crawl' as const },
]

const QUICK_ACTIONS = [
  { label: 'Run Scan', icon: Search, variant: 'default' as const },
  { label: 'View Opportunities', icon: Crosshair, variant: 'outline' as const },
  { label: 'Check Competitors', icon: Shield, variant: 'outline' as const },
]

// ── Helpers ───────────────────────────────────────────────────
const verdictConfig: Record<Verdict, { bg: string; text: string; icon: typeof Zap }> = {
  Critical: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: AlertCircle },
  Developing: { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400', icon: Clock },
  Competitive: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', icon: TrendingUp },
  Dominant: { bg: 'bg-emerald-400/20 border-emerald-400/30', text: 'text-emerald-300', icon: Zap },
}

function getEngineColor(color: string) {
  const map: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
  }
  return map[color] || 'text-white/60'
}

function getEngineDot(color: string, indexed: boolean) {
  if (!indexed) return 'bg-white/20'
  const map: Record<string, string> = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
    blue: 'bg-blue-400',
  }
  return map[color] || 'bg-white/40'
}

function getFeedIcon(type: string) {
  switch (type) {
    case 'citation': return <Eye className="h-3.5 w-3.5 text-emerald-400" />
    case 'score': return <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
    case 'crawl': return <Activity className="h-3.5 w-3.5 text-purple-400" />
    default: return <Radio className="h-3.5 w-3.5 text-white/50" />
  }
}

// ── Gauge Component ───────────────────────────────────────────
function ScoreGauge({ score, isInView }: { score: number; isInView: boolean }) {
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress

  const color = score < 40 ? '#ef4444' : score <= 70 ? '#f59e0b' : '#10b981'

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        {/* Background track */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: dashOffset } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold font-mono tracking-tight"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/40 font-mono">/100</span>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function AIMissionControl({ onStartFree }: AIMissionControlProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const indexedCount = ENGINE_DATA.filter(e => e.indexed).length
  const vc = verdictConfig[SCORE_DATA.verdict]
  const VerdictIcon = vc.icon

  return (
    <section ref={ref} className="relative w-full py-16 md:py-24 overflow-hidden bg-[#0a0a0f]">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-emerald-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            LIVE DASHBOARD
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            AI Mission{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Control
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            Your unified command center. See your AI Visibility Score, engine status, and activity — all in one glance.
          </p>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* ─── Left Column: Score Gauge ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="h-full border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                    AI Visibility Score
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    +{SCORE_DATA.delta}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-2">
                <ScoreGauge score={SCORE_DATA.score} isInView={isInView} />

                {/* Verdict badge */}
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${vc.bg} ${vc.text}`}>
                  <VerdictIcon className="h-3.5 w-3.5" />
                  {SCORE_DATA.verdict}
                </span>

                <div className="text-center">
                  <span className="text-xs text-white/40">Yesterday: {SCORE_DATA.yesterday}</span>
                </div>

                {/* Progress bar as secondary indicator */}
                <div className="w-full">
                  <Progress
                    value={SCORE_DATA.score}
                    className="h-2 rounded-full bg-white/10 [&>div]:bg-emerald-400"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Right Column: Engine Status + Feed + Actions ─── */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            {/* Engine Status Row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                      <Activity className="h-4 w-4 text-white/40" />
                      Engine Status
                    </span>
                    <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] px-2">
                      {indexedCount}/5 Indexed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {ENGINE_DATA.map((eng, i) => (
                      <motion.div
                        key={eng.engine}
                        initial={{ opacity: 0, y: 12 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.35 + i * 0.07 }}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getEngineDot(eng.color, eng.indexed)} ${eng.indexed ? 'animate-pulse' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-medium truncate ${getEngineColor(eng.color)}`}>
                              {eng.engine}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {eng.indexed ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">Indexed</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 text-white/30" />
                                <span className="text-[10px] text-white/30">Not Indexed</span>
                              </>
                            )}
                          </div>
                        </div>
                        {eng.citations > 0 && (
                          <span className="text-[10px] font-mono text-white/40 shrink-0">
                            {eng.citations} cit.
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.label}
                        variant={action.variant}
                        size="sm"
                        onClick={onStartFree}
                        className={
                          action.variant === 'default'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-semibold'
                            : 'border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                        }
                      >
                        <action.icon className="h-4 w-4 mr-1.5" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                    <Radio className="h-4 w-4 text-white/40" />
                    Real-time Activity
                    <span className="relative ml-1 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {ACTIVITY_FEED.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                      >
                        <div className="shrink-0">{getFeedIcon(item.type)}</div>
                        <p className="flex-1 text-sm text-white/80 truncate">{item.text}</p>
                        <span className="shrink-0 text-[10px] font-mono text-white/30">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-base"
          >
            Open Mission Control
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/30">
            <ArrowRight className="h-3 w-3" />
            No credit card required
          </div>
        </motion.div>
      </div>
    </section>
  )
}
