'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Gift,
  Zap,
  Star,
  Rocket,
  Crown,
  ArrowRight,
  Link2,
  Share2,
  BarChart3,
  DollarSign,
  Users,
  Sparkles,
} from 'lucide-react'

interface AffiliateLandingSectionProps {
  onBecomeReseller?: () => void
}

// ─── Tier Data ───────────────────────────────────────────────────────────────
const tiers = [
  {
    level: 1,
    name: 'Starter',
    icon: Gift,
    minReferrals: 1,
    maxReferrals: 9,
    commission: 10,
    color: {
      text: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      iconBg: 'bg-slate-500/20',
      glow: '',
      badge: '',
    },
  },
  {
    level: 2,
    name: 'Growth',
    icon: Zap,
    minReferrals: 10,
    maxReferrals: 49,
    commission: 20,
    color: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/20',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
      badge: '',
    },
  },
  {
    level: 3,
    name: 'Pro',
    icon: Star,
    minReferrals: 50,
    maxReferrals: 99,
    commission: 30,
    color: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      iconBg: 'bg-cyan-500/20',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.1)]',
      badge: '',
    },
  },
  {
    level: 4,
    name: 'Elite',
    icon: Rocket,
    minReferrals: 100,
    maxReferrals: 249,
    commission: 40,
    color: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/20',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.12)]',
      badge: '',
    },
  },
  {
    level: 5,
    name: 'VIP Super-Affiliate',
    icon: Crown,
    minReferrals: 250,
    maxReferrals: null,
    commission: 50,
    color: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]',
      badge: 'VIP',
    },
  },
]

// ─── How It Works Steps ──────────────────────────────────────────────────────
const howItWorksSteps = [
  {
    number: 1,
    icon: Link2,
    title: 'Get Your Unique Link',
    description: 'Take your unique referral link from the dashboard — ready to share instantly.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
  },
  {
    number: 2,
    icon: Share2,
    title: 'Share Everywhere',
    description: 'Share it on your blog, YouTube, LinkedIn, or with agency clients.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
  },
  {
    number: 3,
    icon: BarChart3,
    title: 'Track & Earn',
    description: 'Track clicks and collect payouts every month via Stripe or PayPal.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
  },
]

// ─── Commission Calculator Logic ─────────────────────────────────────────────
const PRO_PLAN_PRICE = 79

function getCommissionTier(userCount: number) {
  if (userCount >= 250) return tiers[4]
  if (userCount >= 100) return tiers[3]
  if (userCount >= 50) return tiers[2]
  if (userCount >= 10) return tiers[1]
  return tiers[0]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Animated Number Component ───────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.3 }}
      className="inline-block"
    >
      {formatCurrency(value)}
    </motion.span>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AffiliateLandingSection({
  onBecomeReseller,
}: AffiliateLandingSectionProps) {
  const [sliderValue, setSliderValue] = useState([25])
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const userCount = sliderValue[0]
  const tier = getCommissionTier(userCount)
  const monthlyRevenue = userCount * PRO_PLAN_PRICE
  const monthlyCommission = monthlyRevenue * (tier.commission / 100)
  const annualCommission = monthlyCommission * 12

  return (
    <section
      id="affiliate"
      className="py-24 relative overflow-hidden"
      ref={ref}
    >
      {/* Background accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Affiliate Program — Up to 50% Commission
          </Badge>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-tight">
            Earn Up to{' '}
            <span className="bg-gradient-to-r from-purple-400 via-amber-400 to-amber-300 bg-clip-text text-transparent">
              50% Recurring Commission
            </span>
            <br />
            with seosights
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Promote the world&apos;s first unified SEO/AEO/GEO engine and build a
            massive passive income stream.
          </p>

          <Button
            size="lg"
            onClick={onBecomeReseller}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
          >
            Become a Reseller (Start Free)
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. TIER CARDS (Commission Scale)
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              5-Tier Commission Scale
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg">
              The more you refer, the more you earn — up to 50% recurring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3">
            {tiers.map((t, i) => {
              const Icon = t.icon
              const isVIP = t.level === 5

              return (
                <motion.div
                  key={t.level}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                >
                  <Card
                    className={`relative overflow-hidden border ${t.color.border} ${t.color.bg} backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] ${
                      isVIP
                        ? 'ring-2 ring-amber-500/40 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent'
                        : ''
                    } ${t.color.glow}`}
                  >
                    {/* VIP Badge */}
                    {isVIP && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-xs px-2.5 py-0.5 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                          <Crown className="w-3 h-3 mr-1" />
                          VIP
                        </Badge>
                      </div>
                    )}

                    <CardContent className="flex flex-col items-center text-center pt-6 pb-6 px-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl ${t.color.iconBg} flex items-center justify-center mb-3`}
                      >
                        <Icon className={`w-6 h-6 ${t.color.text}`} />
                      </div>

                      {/* Level + Name */}
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Level {t.level}
                      </p>
                      <h4 className={`font-bold text-sm mb-2 ${t.color.text}`}>
                        {t.name}
                      </h4>

                      {/* Referral Range */}
                      <p className="text-xs text-muted-foreground mb-3">
                        {t.maxReferrals
                          ? `${t.minReferrals}–${t.maxReferrals} active`
                          : `${t.minReferrals}+ active`}
                      </p>

                      {/* Commission Percentage */}
                      <div className="mb-1">
                        <span
                          className={`text-4xl font-black ${
                            isVIP
                              ? 'bg-gradient-to-b from-amber-300 to-amber-500 bg-clip-text text-transparent'
                              : t.color.text
                          }`}
                        >
                          {t.commission}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        recurring commission
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            3. INTERACTIVE COMMISSION CALCULATOR
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-indigo-500/5 backdrop-blur-sm">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

            <CardContent className="relative pt-8 pb-8 px-6 sm:px-10">
              <div className="text-center mb-8">
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-2 px-3 py-1 text-xs border-purple-500/40 text-purple-400 bg-purple-500/10 mb-4"
                >
                  <Sparkles className="w-3 h-3" />
                  Commission Calculator
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                  See How Much You Could Earn
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Drag the slider to estimate your monthly passive income
                </p>
              </div>

              {/* Slider */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Referred Pro Users
                  </span>
                  <span className="text-sm font-bold text-purple-400">
                    {userCount} user{userCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  min={1}
                  max={500}
                  step={1}
                  className="w-full [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-purple-500/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-500 [&_[data-slot=slider-range]]:to-amber-400 [&_[data-slot=slider-thumb]]:w-5 [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-thumb]]:shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground/60">1</span>
                  <span className="text-xs text-muted-foreground/60">500</span>
                </div>
              </div>

              {/* Results */}
              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* Monthly Revenue */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Monthly Revenue
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      <AnimatedNumber value={monthlyRevenue} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {userCount} × ${PRO_PLAN_PRICE}
                    </p>
                  </div>

                  {/* Commission Rate */}
                  <div
                    className={`border rounded-xl p-4 text-center ${tier.color.bg} ${tier.color.border}`}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Your Tier
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <tier.icon className={`w-5 h-5 ${tier.color.text}`} />
                      <span
                        className={`text-lg font-bold ${tier.color.text}`}
                      >
                        {tier.commission}%
                      </span>
                    </div>
                    <p className={`text-xs ${tier.color.text} opacity-70`}>
                      {tier.name}
                    </p>
                  </div>

                  {/* Monthly Commission */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-amber-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Your Passive Income
                    </p>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                      <AnimatedNumber value={monthlyCommission} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">/ month</p>
                  </div>
                </div>

                {/* Annual Projection */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={annualCommission}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      That&apos;s{' '}
                      <span className="font-bold text-foreground">
                        <AnimatedNumber value={annualCommission} />
                      </span>{' '}
                      per year in recurring commission
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      At {userCount} referred Pro users × ${PRO_PLAN_PRICE}/mo ×{' '}
                      {tier.commission}% = {formatCurrency(monthlyCommission)}
                      /mo
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            4. HOW IT WORKS (3 Steps)
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              How It Works
            </h3>
            <p className="text-muted-foreground text-base sm:text-lg">
              Three simple steps to start earning recurring commission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {howItWorksSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
                >
                  <div
                    className={`relative bg-white/5 backdrop-blur-sm border ${step.border} rounded-2xl p-6 text-center transition-all duration-300 hover:bg-white/8`}
                  >
                    {/* Numbered circle */}
                    <div className="flex items-center justify-center mb-4">
                      <div
                        className={`relative w-14 h-14 rounded-full ${step.bg} flex items-center justify-center`}
                      >
                        <span
                          className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border ${step.border} flex items-center justify-center text-xs font-bold ${step.color}`}
                        >
                          {step.number}
                        </span>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                    </div>

                    <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            CTA — Ready to Start?
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-amber-500/10 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-amber-500/5" />
            <CardContent className="relative py-10 px-6 sm:px-10">
              <div className="flex flex-col items-center gap-2 mb-2">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to Start Earning?
              </h3>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-6">
                Join the seosights affiliate program today. No fees, no
                minimums — just share and earn.
              </p>
              <Button
                size="lg"
                onClick={onBecomeReseller}
                className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-300"
              >
                Become a Reseller (Start Free)
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
