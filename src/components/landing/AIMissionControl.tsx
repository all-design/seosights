'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  Shield,
  Eye,
  Ban,
  HelpCircle,
  Plus,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
interface AIMissionControlProps {
  onStartFree?: () => void
}

// ── Mock Data ────────────────────────────────────────────────────────────
// In production, these connect to:
//   /api/ai/visibility-score  → score, delta, verdict
//   /api/ai/feed              → live feed items
//   /api/ai/benchmarks        → competitor race data
//   /api/ai/action-center     → today's tasks

const SCORE_DATA = {
  score: 71,
  yesterday: 68,
  delta: 3,
  verdict: 'Competitive' as const,
}

type Verdict = 'Critical' | 'Developing' | 'Competitive' | 'Dominant'

const AI_INDEX_DATA = [
  { engine: 'ChatGPT', status: 'Indexed' as const, citations: 24 },
  { engine: 'Claude', status: 'Seen' as const, citations: 17 },
  { engine: 'Gemini', status: 'Blocked' as const, citations: 12 },
  { engine: 'Perplexity', status: 'Unknown' as const, citations: 0 },
  { engine: 'Copilot', status: 'Indexed' as const, citations: 8 },
]

type IndexStatus = 'Indexed' | 'Seen' | 'Blocked' | 'Unknown'

const AI_DIFF_DATA = [
  { engine: 'Claude', change: '+2 citations', direction: 'up' as const, isNew: false },
  { engine: 'ChatGPT', change: '-1 mention', direction: 'down' as const, isNew: false },
  { engine: 'Gemini', change: 'Started citing FAQ', direction: 'up' as const, isNew: true },
  { engine: 'Perplexity', change: 'Stopped using Reddit', direction: 'down' as const, isNew: false },
]

const COMPETITOR_DATA = {
  you: { name: 'You', score: 74 },
  competitors: [{ name: 'Competitor A', score: 78 }],
  gap: 4,
}

const TASKS_DATA = [
  { id: '1', label: 'Add JSON-LD schema', points: 5, done: false },
  { id: '2', label: 'Create llms.txt', points: 3, done: false },
  { id: '3', label: 'Claim G2 profile', points: 2, done: true },
]

const FEED_DATA = [
  { time: '2m ago', text: 'Competitor added Wikipedia page', icon: 'competitor' as const },
  { time: '15m ago', text: 'New entity in Wikidata', icon: 'entity' as const },
  { time: '1h ago', text: 'Score milestone: 70+', icon: 'milestone' as const },
  { time: '3h ago', text: 'GPTBot crawled /pricing', icon: 'crawl' as const },
  { time: '6h ago', text: 'Claude cited your FAQ', icon: 'citation' as const },
]

// ── Helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number) {
  if (score < 40) return 'text-red-400'
  if (score <= 70) return 'text-amber-400'
  return 'text-emerald-400'
}

function getScoreBarColor(score: number) {
  if (score < 40) return '[&>div]:bg-red-500'
  if (score <= 70) return '[&>div]:bg-amber-400'
  return '[&>div]:bg-emerald-400'
}

function getVerdictBadge(verdict: Verdict) {
  const map: Record<Verdict, { bg: string; text: string }> = {
    Critical: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' },
    Developing: { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400' },
    Competitive: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
    Dominant: { bg: 'bg-emerald-400/20 border-emerald-400/30', text: 'text-emerald-300' },
  }
  const s = map[verdict]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {verdict === 'Critical' && <Shield className="h-3 w-3" />}
      {verdict === 'Competitive' && <TrendingUp className="h-3 w-3" />}
      {verdict === 'Dominant' && <Zap className="h-3 w-3" />}
      {verdict === 'Developing' && <Activity className="h-3 w-3" />}
      {verdict}
    </span>
  )
}

function getStatusDot(status: IndexStatus) {
  const map: Record<IndexStatus, { color: string; icon: React.ReactNode }> = {
    Indexed: { color: 'bg-emerald-400', icon: <Eye className="h-3 w-3 text-emerald-400" /> },
    Seen: { color: 'bg-amber-400', icon: <Eye className="h-3 w-3 text-amber-400" /> },
    Blocked: { color: 'bg-red-400', icon: <Ban className="h-3 w-3 text-red-400" /> },
    Unknown: { color: 'bg-gray-400', icon: <HelpCircle className="h-3 w-3 text-gray-400" /> },
  }
  const s = map[status]
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${s.color} ${status === 'Indexed' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-white/70">{status}</span>
      {s.icon}
    </span>
  )
}

function getFeedIcon(type: string) {
  switch (type) {
    case 'competitor': return <Shield className="h-3.5 w-3.5 text-amber-400" />
    case 'entity': return <Plus className="h-3.5 w-3.5 text-blue-400" />
    case 'milestone': return <Zap className="h-3.5 w-3.5 text-emerald-400" />
    case 'crawl': return <Activity className="h-3.5 w-3.5 text-purple-400" />
    case 'citation': return <Eye className="h-3.5 w-3.5 text-cyan-400" />
    default: return <Radio className="h-3.5 w-3.5 text-white/50" />
  }
}

// ── Animation Variants ───────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const panelVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ── Component ────────────────────────────────────────────────────────────
export default function AIMissionControl({ onStartFree }: AIMissionControlProps) {
  const completedPoints = TASKS_DATA.filter((t) => t.done).reduce((s, t) => s + t.points, 0)
  const totalPotentialPoints = TASKS_DATA.reduce((s, t) => s + t.points, 0)
  const remainingGain = totalPotentialPoints - completedPoints

  return (
    <section className="relative w-full bg-[#0a0a0f] py-16 md:py-24 overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            LIVE DASHBOARD
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI Mission Control
          </h2>
          <p className="mt-2 text-sm text-white/50 max-w-xl mx-auto">
            Your unified command center — score, alerts, feed, metrics, and actions. All in one view.
          </p>
        </motion.div>

        {/* Panels */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="flex flex-col gap-4"
        >
          {/* ─── Panel 1: AI Visibility Score (Sticky) ─── */}
          <motion.div variants={panelVariants}>
            <Card className="border border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-20 shadow-lg shadow-black/30">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: label + score */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                        AI Visibility Score
                      </span>
                      {SCORE_DATA.delta > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono font-semibold text-emerald-400">
                          <ArrowUpRight className="h-3.5 w-3.5" />+{SCORE_DATA.delta}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-xs font-mono font-semibold text-red-400">
                          <ArrowDownRight className="h-3.5 w-3.5" />{SCORE_DATA.delta}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-5xl font-bold font-mono tracking-tight ${getScoreColor(SCORE_DATA.score)}`}>
                        {SCORE_DATA.score}
                      </span>
                      <span className="text-sm text-white/30 font-mono">/100</span>
                    </div>
                    <span className="text-xs text-white/40">
                      Yesterday: {SCORE_DATA.yesterday}
                    </span>
                  </div>

                  {/* Right: progress bar + verdict */}
                  <div className="flex flex-col items-end gap-2 sm:w-64 w-full">
                    <div className="w-full">
                      <Progress
                        value={SCORE_DATA.score}
                        className={`h-3 rounded-full bg-white/10 ${getScoreBarColor(SCORE_DATA.score)}`}
                      />
                    </div>
                    {getVerdictBadge(SCORE_DATA.verdict)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Panel 2: AI Index Status ─── */}
          <motion.div variants={panelVariants}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
                  <Activity className="h-4 w-4 text-white/40" />
                  AI Index Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {AI_INDEX_DATA.map((item) => (
                    <div
                      key={item.engine}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white/90">{item.engine}</span>
                        {getStatusDot(item.status)}
                      </div>
                      <span className="font-mono text-xs text-white/50">
                        {item.citations} citation{item.citations !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Panel 3: AI Diff (Yesterday vs Today) ─── */}
          <motion.div variants={panelVariants}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
                  <Clock className="h-4 w-4 text-white/40" />
                  What Changed Overnight
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {AI_DIFF_DATA.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white/90">{item.engine}</span>
                        {item.direction === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <span
                          className={`text-xs font-mono ${
                            item.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {item.change}
                        </span>
                      </div>
                      {item.isNew && (
                        <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] px-1.5 py-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Panel 4: Competitor Race ─── */}
          <motion.div variants={panelVariants}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
                  <Shield className="h-4 w-4 text-white/40" />
                  Competitor Race
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Competitor A bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">
                        {COMPETITOR_DATA.competitors[0].name}
                      </span>
                      <span className="font-mono text-xs text-white/50">
                        {COMPETITOR_DATA.competitors[0].score}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${COMPETITOR_DATA.competitors[0].score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full bg-red-400/80"
                      />
                    </div>
                  </div>

                  {/* You bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-400">You</span>
                      <span className="font-mono text-xs text-white/50">
                        {COMPETITOR_DATA.you.score}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${COMPETITOR_DATA.you.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full bg-emerald-400/80"
                      />
                    </div>
                  </div>

                  {/* Gap indicator */}
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
                    <span className="text-xs font-medium text-amber-400">Gap:</span>
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {COMPETITOR_DATA.gap} points
                    </span>
                    <span className="text-xs text-white/40">behind leader</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Panel 5: Today's Tasks ─── */}
          <motion.div variants={panelVariants}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
                  <Zap className="h-4 w-4 text-white/40" />
                  Today&apos;s Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {TASKS_DATA.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
                        task.done
                          ? 'border-white/5 bg-white/[0.02] opacity-60'
                          : 'border-emerald-500/10 bg-emerald-500/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={task.done} disabled className="pointer-events-none" />
                        <span
                          className={`text-sm ${
                            task.done ? 'text-white/40 line-through' : 'text-white/90'
                          }`}
                        >
                          {task.label}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-xs ${
                          task.done ? 'text-white/30' : 'text-emerald-400'
                        }`}
                      >
                        +{task.points} pts
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-white/40">Estimated gain</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    +{remainingGain} pts
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Panel 6: Live Feed ─── */}
          <motion.div variants={panelVariants}>
            <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
                  <Radio className="h-4 w-4 text-white/40" />
                  Live Feed
                  <span className="relative ml-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                  {FEED_DATA.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5"
                    >
                      <div className="mt-0.5 shrink-0">{getFeedIcon(item.icon)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{item.text}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-mono text-white/30 whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <p className="mb-4 text-sm text-white/40">
            This is a live demo. Your real data connects in seconds.
          </p>
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Start Free — See Your Score
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/30">
            <ExternalLink className="h-3 w-3" />
            No credit card required
          </div>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </section>
  )
}
