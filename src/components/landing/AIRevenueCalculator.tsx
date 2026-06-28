'use client'

import { motion, useInView, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Users, Eye, MousePointerClick, Wallet, ArrowRight, ArrowDown, Calculator, Target, TrendingUp } from 'lucide-react'

// ── Mock math constants (fallback) ────────────────────────────────────────
const FALLBACK_ACHIEVABLE_VIS = 41 // %, target benchmark
const FALLBACK_LEAD_CONVERSION = 0.0145 // 1.45%
const FALLBACK_LEAD_VALUE = 180 // $ per lead

// ── Count-up hook (starts on inView, re-animates on target change) ────────
function useCountUp(target: number, active: boolean, duration = 0.7) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!active) return
    const controls = animate(mv.get(), target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        mv.set(v)
        setDisplay(v)
      },
    })
    return () => controls.stop()
  }, [target, active, duration, mv])
  return display
}

const fmtInt = (n: number) => Math.round(n).toLocaleString()
const fmtUSD = (n: number) => `$${Math.round(n).toLocaleString()}`

// ── Funnel stage metadata ────────────────────────────────────────────────
interface Stage {
  key: string
  icon: typeof Users
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

export default function AIRevenueCalculator({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  // Inputs
  const [visitors, setVisitors] = useState(50000)
  const [currentVis, setCurrentVis] = useState(12)
  const [isLive, setIsLive] = useState(false)
  // API-driven values (null = use fallback math)
  const [apiVis, setApiVis] = useState<number | null>(null)
  const [apiConv, setApiConv] = useState<number | null>(null)
  const [apiLeadVal, setApiLeadVal] = useState<number | null>(null)

  // Debounced API fetch
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const fetchRevenue = useCallback((v: number, cv: number) => {
    fetch('/api/ai/revenue-calculator', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitors: v, currentVisibility: cv }),
    }).then(r => r.json()).then(data => {
      if (data?.achievableVisibility != null) {
        setApiVis(data.achievableVisibility)
        setApiConv(data.conversionRate ?? null)
        setApiLeadVal(data.avgLeadValue ?? null)
        setIsLive(true)
      }
    }).catch(() => {})
  }, [])

  // Initial fetch + debounced slider changes
  useEffect(() => { fetchRevenue(visitors, currentVis) }, [fetchRevenue]) // mount-only initial
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchRevenue(visitors, currentVis), 600)
    return () => clearTimeout(debounceRef.current)
  }, [visitors, currentVis, fetchRevenue])

  const ACHIEVABLE_VIS = apiVis ?? FALLBACK_ACHIEVABLE_VIS
  const LEAD_CONVERSION = apiConv ?? FALLBACK_LEAD_CONVERSION
  const LEAD_VALUE = apiLeadVal ?? FALLBACK_LEAD_VALUE

  // Computed funnel
  const calc = useMemo(() => {
    const extraImpressions = visitors * ((ACHIEVABLE_VIS - currentVis) / 100)
    const extraLeads = extraImpressions * LEAD_CONVERSION
    const extraRevenue = extraLeads * LEAD_VALUE
    const annualRevenue = extraRevenue * 12
    return { extraImpressions, extraLeads, extraRevenue, annualRevenue }
  }, [visitors, currentVis])

  // Animated revenue figures
  const animMonthly = useCountUp(calc.extraRevenue, isInView, 0.8)
  const animAnnual = useCountUp(calc.annualRevenue, isInView, 0.9)

  // Delta chip (AnimatePresence usage) — fires whenever revenue meaningfully changes
  const [delta, setDelta] = useState(0)
  const prevRevRef = useRef(0)
  useEffect(() => {
    if (!isInView) return
    const d = calc.extraRevenue - prevRevRef.current
    if (Math.abs(d) > 50) {
      setDelta(d)
      prevRevRef.current = calc.extraRevenue
      const t = setTimeout(() => setDelta(0), 1100)
      return () => clearTimeout(t)
    }
  }, [calc.extraRevenue, isInView])

  const stages: Stage[] = [
    {
      key: 'visitors',
      icon: Users,
      label: 'Monthly Visitors',
      value: fmtInt(visitors),
    },
    {
      key: 'visibility',
      icon: Eye,
      label: 'AI Visibility',
      value: `${currentVis}%`,
      sub: `→ ${ACHIEVABLE_VIS}%`,
    },
    {
      key: 'impressions',
      icon: Target,
      label: 'Extra AI Impressions',
      value: fmtInt(calc.extraImpressions),
      sub: 'monthly',
    },
    {
      key: 'leads',
      icon: MousePointerClick,
      label: 'Extra Leads',
      value: fmtInt(calc.extraLeads),
      sub: `${(LEAD_CONVERSION * 100).toFixed(2)}% conv.`,
    },
    {
      key: 'revenue',
      icon: Wallet,
      label: 'Extra Monthly Revenue',
      value: fmtUSD(animMonthly),
      sub: 'new revenue',
      highlight: true,
    },
  ]

  return (
    <section
      id="revenue-calculator"
      className="py-24 relative"
      ref={sectionRef}
    >
      {/* Background ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Calculator className="w-3.5 h-3.5" />
            The CEO Math{isLive ? <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Live AI</span> : <span className="ml-2 text-[10px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded-full">Demo</span>}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Turn{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent">
              AI visibility
            </span>{' '}
            into revenue.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            SEO tools report rankings. We report revenue you&apos;re leaving on
            the table when AI engines recommend your competitors instead.
          </p>
        </motion.div>

        {/* Calculator card */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="bg-white/[0.04] backdrop-blur-xl border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.12)]">
            <CardContent className="p-6 sm:p-10">
              {/* ── Inputs row ──────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
                {/* Step 1: Monthly visitors */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="text-purple-400 font-semibold">Step 1</span>
                    <span>·</span>
                    <span>Monthly website visitors</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
                    {fmtInt(visitors)}
                  </div>
                  <Slider
                    value={[visitors]}
                    onValueChange={(v) => setVisitors(v[0])}
                    min={1000}
                    max={500000}
                    step={1000}
                    className="[&_[data-slot=slider-track]]:bg-purple-500/20 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-500 [&_[data-slot=slider-range]]:to-fuchsia-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>1K</span>
                    <span>500K</span>
                  </div>
                </div>

                {/* Step 2: Current AI visibility */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="text-purple-400 font-semibold">Step 2</span>
                    <span>·</span>
                    <span>Current AI visibility</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
                    {currentVis}%
                  </div>
                  <Slider
                    value={[currentVis]}
                    onValueChange={(v) => setCurrentVis(v[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="[&_[data-slot=slider-track]]:bg-purple-500/20 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-500 [&_[data-slot=slider-range]]:to-fuchsia-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Step 3: Achievable (computed) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="text-purple-400 font-semibold">Step 3</span>
                    <span>·</span>
                    <span>Achievable AI visibility</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent tabular-nums">
                    {ACHIEVABLE_VIS}%
                  </div>
                  <div className="flex items-center gap-2 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3">
                    <Target className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-[11px] text-purple-300/80 leading-tight">
                      based on your industry benchmark
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>Target</span>
                    <span className="text-emerald-400">+{ACHIEVABLE_VIS - currentVis} pts</span>
                  </div>
                </div>
              </div>

              {/* ── Funnel visualization ────────────────────────────────── */}
              <div className="rounded-2xl bg-black/30 border border-white/5 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Revenue Funnel
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    drag sliders to recompute
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-stretch gap-2">
                  {stages.map((stage, i) => {
                    const Icon = stage.icon
                    return (
                      <div
                        key={stage.key}
                        className="contents"
                      >
                        <motion.div
                          className={`flex-1 min-w-0 rounded-xl border p-3 sm:p-4 transition-colors ${
                            stage.highlight
                              ? 'border-purple-400/60 bg-gradient-to-br from-purple-500/25 to-fuchsia-500/10 shadow-[0_0_30px_rgba(168,85,247,0.35)]'
                              : 'border-white/10 bg-white/[0.02]'
                          }`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={isInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                                stage.highlight
                                  ? 'bg-purple-500/30 text-purple-200'
                                  : 'bg-white/5 text-muted-foreground'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span
                              className={`text-[10px] uppercase tracking-wider leading-tight ${
                                stage.highlight
                                  ? 'text-purple-200 font-semibold'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                          <div
                            className={`text-xl sm:text-2xl font-bold tabular-nums break-words ${
                              stage.highlight
                                ? 'text-purple-100'
                                : 'text-foreground'
                            }`}
                          >
                            {stage.value}
                          </div>
                          {stage.sub && (
                            <div
                              className={`text-[10px] mt-1 ${
                                stage.highlight
                                  ? 'text-emerald-300/90 font-medium'
                                  : 'text-muted-foreground/70'
                              }`}
                            >
                              {stage.sub}
                            </div>
                          )}
                        </motion.div>

                        {/* Arrow between stages */}
                        {i < stages.length - 1 && (
                          <div className="flex items-center justify-center py-1 md:py-0">
                            <ArrowDown className="w-4 h-4 text-purple-400/60 rotate-90 md:rotate-0" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Delta chip (AnimatePresence) */}
                <div className="h-6 mt-2 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {delta !== 0 && (
                      <motion.span
                        key={Math.round(delta)}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25 }}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          delta > 0
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        <TrendingUp
                          className={`w-3 h-3 ${delta < 0 ? 'rotate-180' : ''}`}
                        />
                        {delta > 0 ? '+' : ''}
                        {fmtUSD(delta)}/mo
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Annual revenue ──────────────────────────────────────── */}
              <div className="mt-8 flex flex-col items-center text-center">
                <span className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Projected Annual Revenue Lift
                </span>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent tabular-nums">
                  {fmtUSD(animAnnual)}
                  <span className="text-2xl sm:text-3xl text-muted-foreground/80 font-medium">
                    /year
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-3 max-w-md">
                  Based on {fmtInt(calc.extraLeads)} extra leads/mo at{' '}
                  {fmtUSD(LEAD_VALUE)}/lead. Numbers are directional estimates.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            <span className="text-foreground font-medium">
              This is the conversation that gets you budget.
            </span>{' '}
            Show your CFO.
          </p>
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.35)] hover:shadow-[0_0_45px_rgba(168,85,247,0.55)] transition-all duration-300"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate your revenue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
