'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Target,
  MousePointerClick,
  ArrowRight,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── Mock Data ──────────────────────────────────────────────────────────

const funnelSteps = [
  { label: 'Visit', count: 10000, pct: 100 },
  { label: 'Sign Up Page', count: 4500, pct: 45 },
  { label: 'Start Signup', count: 2800, pct: 28 },
  { label: 'Complete Signup', count: 1800, pct: 18 },
  { label: 'First Action', count: 900, pct: 9 },
  { label: 'Upgrade', count: 270, pct: 2.7 },
]

const ctaAnalysis = [
  { text: 'Get Started Free', location: 'Hero', visibility: 95, clicks: 2840, conversion: 18 },
  { text: 'Start Free Trial', location: 'Pricing', visibility: 88, clicks: 1200, conversion: 24 },
  { text: 'Learn More', location: 'Features', visibility: 72, clicks: 890, conversion: 5 },
  { text: 'See Pricing', location: 'Nav', visibility: 90, clicks: 1560, conversion: 12 },
  { text: 'Book a Demo', location: 'Enterprise', visibility: 65, clicks: 340, conversion: 32 },
  { text: 'Subscribe', location: 'Footer', visibility: 30, clicks: 45, conversion: 2 },
]

const dropOffPoints = [
  { step: 'Homepage → Signup', pct: 55, reason: 'Value proposition unclear' },
  { step: 'Signup Form Step 3', pct: 36, reason: 'Asking for company details too early' },
  { step: 'Signup → First Action', pct: 50, reason: 'No guided onboarding after signup' },
  { step: 'First Action → Upgrade', pct: 70, reason: 'Value not demonstrated in free tier' },
  { step: 'Pricing Page Exit', pct: 42, reason: 'Too many tiers, comparison is confusing' },
]

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Main Growth Reviewer Page ──────────────────────────────────────────

export function GrowthReviewerPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Score ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Growth Review Score</p>
                <span className="text-5xl font-bold text-emerald-400 tracking-tighter">81</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Conversion Funnel (Horizontal) ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Conversion Funnel</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-[200px]">
              {funnelSteps.map((step, idx) => {
                const heightPct = (step.pct / 100) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-medium">{step.pct}%</span>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        background: `linear-gradient(to top, rgba(16,185,129,${0.2 + idx * 0.05}), rgba(16,185,129,${0.4 + idx * 0.08}))`,
                      }}
                    />
                    <span className="text-[10px] text-zinc-500 text-center leading-tight">{step.label}</span>
                    <span className="text-[9px] text-zinc-600 font-mono">{step.count.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── CTA Analysis ───────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">CTA Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-4">CTA Text</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-4">Location</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-4">Visibility</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-4">Clicks</th>
                    <th className="text-left text-zinc-500 font-medium pb-2">Conv. %</th>
                  </tr>
                </thead>
                <tbody>
                  {ctaAnalysis.map((cta, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-4 text-emerald-400 font-mono font-medium">{cta.text}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{cta.location}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${cta.visibility}%`, backgroundColor: cta.visibility > 80 ? '#34d399' : cta.visibility > 60 ? '#fbbf24' : '#f87171' }} />
                          </div>
                          <span className="text-zinc-500 font-mono w-8">{cta.visibility}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-300 font-mono">{cta.clicks.toLocaleString()}</td>
                      <td className="py-2.5">
                        <span className={cta.conversion > 20 ? 'text-emerald-400' : cta.conversion > 10 ? 'text-amber-400' : 'text-red-400'}>
                          {cta.conversion}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Onboarding Score + Drop-off Points Row ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Onboarding Score */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 font-medium">Onboarding Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-4xl font-bold text-amber-400 tracking-tight">72</span>
                <span className="text-xs text-zinc-500 mb-1">/ 100</span>
              </div>
              <Progress value={72} className="h-2 bg-zinc-800 [&>div]:bg-amber-500" />
              <p className="text-[10px] text-zinc-600 mt-2">Below average — onboarding needs improvement</p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-zinc-400">7 steps is too many</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-zinc-400">No progress indicator</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-zinc-400">No skip option</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Drop-off Points */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Drop-off Points</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600">Where users are leaving the funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dropOffPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 text-right">
                      <span className="text-lg font-bold text-red-400">{point.pct}%</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-zinc-300">{point.step}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400/50 rounded-full" style={{ width: `${point.pct}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">{point.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
