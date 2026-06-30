'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Rocket,
  ArrowRight,
  Brain,
  Zap,
  LayoutDashboard,
  CheckCircle2,
  Play,
  TrendingUp,
} from 'lucide-react'

// ── Feature Block Data ────────────────────────────────────────────────────
interface FeatureBlock {
  icon: typeof Brain
  title: string
  description: string
  visual: 'mission' | 'auto-execute' | 'dashboard'
}

const features: FeatureBlock[] = [
  {
    icon: Brain,
    title: 'AI Growth Brain\u2122',
    description:
      "Every morning, you get a personalized mission: 'Add llms.txt to your docs', 'Create a comparison page for Perplexity', 'Update your Wikipedia entity'. One click. Done.",
    visual: 'mission',
  },
  {
    icon: Zap,
    title: 'Auto Execute',
    description:
      'AI agents implement recommendations directly. Generate llms.txt, create FAQ schema, update meta tags \u2014 all automatically. You approve. AI executes.',
    visual: 'auto-execute',
  },
  {
    icon: LayoutDashboard,
    title: 'Mission Control',
    description:
      'Your complete AI Visibility dashboard. Track scores, monitor citations, compare competitors, and see your 90-day forecast \u2014 all in one place.',
    visual: 'dashboard',
  },
]

// ── Mock Visual: Today's Mission ──────────────────────────────────────────
function MissionVisual({ isInView }: { isInView: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d12] p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-fuchsia-400" />
          <span className="text-sm font-semibold text-foreground">Today&apos;s Mission</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Priority: High
        </span>
      </div>

      {/* Mission item */}
      <motion.div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4"
        initial={{ opacity: 0, x: -16 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-fuchsia-300">1</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">
              Add llms.txt to your documentation
            </p>
            <p className="text-xs text-muted-foreground">
              Creates a machine-readable file so AI crawlers can index your content accurately.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Second mission item */}
      <motion.div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-5"
        initial={{ opacity: 0, x: -16 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-purple-300">2</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">
              Create comparison page for Perplexity
            </p>
            <p className="text-xs text-muted-foreground">
              AI engines reference comparison pages when recommending solutions.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Execute button mock */}
      <motion.button
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-semibold py-3 px-4"
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.0 }}
      >
        <Play className="w-4 h-4" />
        Execute Mission
      </motion.button>
    </div>
  )
}

// ── Mock Visual: Auto Execute ─────────────────────────────────────────────
function AutoExecuteVisual({ isInView }: { isInView: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d12] p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Auto Execute</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-400 font-medium bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Running
        </span>
      </div>

      {/* Running task */}
      <motion.div
        className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 mb-3"
        initial={{ opacity: 0, x: -16 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Generating llms.txt</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
            initial={{ width: 0 }}
            animate={isInView ? { width: '100%' } : {}}
            transition={{ duration: 2, delay: 0.6, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Pending task */}
      <motion.div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-3"
        initial={{ opacity: 0, x: -16 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Creating FAQ schema</span>
          <span className="text-[10px] text-muted-foreground">Queued</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-white/10 w-0" />
        </div>
      </motion.div>

      {/* Another pending task */}
      <motion.div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4"
        initial={{ opacity: 0, x: -16 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Updating meta tags</span>
          <span className="text-[10px] text-muted-foreground">Queued</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-white/10 w-0" />
        </div>
      </motion.div>

      {/* Approval bar */}
      <motion.div
        className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <span className="text-xs text-muted-foreground">1 of 3 tasks complete</span>
        <span className="text-xs text-muted-foreground">&#x2022;</span>
        <span className="text-xs text-amber-300 font-medium">Awaiting your approval</span>
      </motion.div>
    </div>
  )
}

// ── Mock Visual: Mission Control Dashboard ────────────────────────────────
function DashboardVisual({ isInView }: { isInView: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d12] p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-foreground">Mission Control</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Last 90 days</span>
      </div>

      {/* Score row */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Score</div>
          <div className="text-xl font-bold text-foreground">73</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Citations</div>
          <div className="text-xl font-bold text-foreground">142</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rank</div>
          <div className="text-xl font-bold text-emerald-400">#3</div>
        </div>
      </motion.div>

      {/* Mini chart area */}
      <motion.div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground">AI Visibility Trend</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">+12%</span>
          </div>
        </div>
        {/* Simple bar chart mock */}
        <div className="flex items-end gap-1.5 h-12">
          {[35, 42, 38, 50, 45, 55, 48, 60, 58, 68, 65, 73].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500/60 to-cyan-400/40"
              initial={{ height: 0 }}
              animate={isInView ? { height: `${h}%` } : {}}
              transition={{ duration: 0.6, delay: 1 + i * 0.05, ease: 'easeOut' }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground">90d ago</span>
          <span className="text-[9px] text-muted-foreground">Today</span>
        </div>
      </motion.div>

      {/* Competitor comparison mini */}
      <motion.div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <span className="text-xs font-medium text-foreground">Competitor Gap</span>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">You</span>
              <span className="text-foreground font-medium">73</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 w-[73%]" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Competitor</span>
              <span className="text-foreground font-medium">81</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500/60 to-rose-400/60 w-[81%]" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Visual renderer ───────────────────────────────────────────────────────
function FeatureVisual({ type, isInView }: { type: string; isInView: boolean }) {
  switch (type) {
    case 'mission':
      return <MissionVisual isInView={isInView} />
    case 'auto-execute':
      return <AutoExecuteVisual isInView={isInView} />
    case 'dashboard':
      return <DashboardVisual isInView={isInView} />
    default:
      return null
  }
}

// ── Main Section ──────────────────────────────────────────────────────────
export default function ImproveSection({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="improve"
      ref={ref}
      className="py-24 relative bg-background overflow-hidden"
    >
      {/* Subtle accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(234,179,8,0.05),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-20 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-5 border-amber-500/40 text-amber-300 bg-amber-500/10"
          >
            <Rocket className="w-3 h-3 mr-1" />
            Improve
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-foreground tracking-tight leading-[1.05]">
            AI Growth Brain\u2122 makes{' '}
            <span className="bg-gradient-to-r from-amber-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
              AI recommend you
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Daily missions. Auto-execution. Full control. Your AI Visibility Score goes up while you sleep.
          </p>
        </motion.div>

        {/* Feature blocks — alternating layout */}
        <div className="space-y-20 lg:space-y-28">
          {features.map((feature, i) => {
            const isReversed = i % 2 === 1
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.2 }}
                className={`flex flex-col ${
                  isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } gap-8 lg:gap-14 items-center`}
              >
                {/* Visual */}
                <div className="w-full lg:w-1/2">
                  <FeatureVisual type={feature.visual} isInView={isInView} />
                </div>

                {/* Text */}
                <div className="w-full lg:w-1/2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-fuchsia-600 hover:from-amber-500 hover:to-fuchsia-500 text-white border-0 shadow-[0_0_30px_rgba(234,179,8,0.35)]"
          >
            Get your first AI Visibility mission
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
