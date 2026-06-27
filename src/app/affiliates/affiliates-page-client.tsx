'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Cookie,
  Calendar,
  CreditCard,
  Shield,
  TrendingUp,
  Users,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Zap,
} from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import AffiliateLandingSection from '@/components/landing/AffiliateLandingSection'
import AffiliatePortal from '@/components/dashboard/AffiliatePortal'

// ─── Quick Stats Bar ─────────────────────────────────────────────────────────
const quickStats = [
  { icon: DollarSign, label: 'Max Commission', value: '50%', color: 'text-amber-400' },
  { icon: Cookie, label: 'Cookie Window', value: '60 days', color: 'text-cyan-400' },
  { icon: Calendar, label: 'Payout Frequency', value: 'Monthly', color: 'text-emerald-400' },
  { icon: CreditCard, label: 'Payout Methods', value: 'Stripe/PayPal', color: 'text-purple-400' },
]

// ─── Benefits Grid ───────────────────────────────────────────────────────────
const benefits = [
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description:
      'Earn commission every month for as long as your referral stays subscribed. Build true passive income.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Shield,
    title: '60-Day Cookie',
    description:
      'Industry-leading cookie window. Even if a referral signs up 2 months later, you still get credited.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: Users,
    title: '5-Tier Scale',
    description:
      'Start at 10% and scale up to 50% recurring as you refer more users. Automatic tier upgrades.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: Zap,
    title: 'Real-Time Dashboard',
    description:
      'Track clicks, signups, conversions, MRR, and pending payouts in real-time. Full transparency.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
]

// ─── FAQ Items ───────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How do I get paid?',
    a: 'Payouts are sent monthly via Stripe or PayPal once your balance reaches $50. Commission is calculated on the 1st of each month for the previous month\'s active subscriptions.',
  },
  {
    q: 'Is the commission really recurring?',
    a: 'Yes. You earn your tier\'s commission rate every month for as long as the referred customer remains an active paying subscriber. If they upgrade, your commission grows too.',
  },
  {
    q: 'What counts as a successful referral?',
    a: 'A referral is counted when someone clicks your unique affiliate link and becomes a paying seosights subscriber within the 60-day cookie window.',
  },
  {
    q: 'Are there any fees or minimums to join?',
    a: 'No. The affiliate program is 100% free to join with no monthly fees. The only minimum is a $50 balance threshold before payouts are issued.',
  },
  {
    q: 'Can agencies join the affiliate program?',
    a: 'Absolutely. Agencies are some of our best affiliates — they refer multiple clients and climb the tier ladder quickly. We also offer a separate Agency/Reseller program for managed onboarding.',
  },
  {
    q: 'Do you provide marketing assets?',
    a: 'Yes. Affiliates get access to banner ads, email templates, social media copy, demo videos, and a branded swipe file inside the dashboard.',
  },
]

// ─── FAQ Item Component ──────────────────────────────────────────────────────
function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  )
}

// ─── Main Client Page ────────────────────────────────────────────────────────
export default function AffiliatesPageClient() {
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false)
  const webhookUserId = 'demo-affiliate-page'

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar onStartFree={() => setIsAffiliateOpen(true)} />

      {/* ════ HERO STRIP ════ */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-background to-background" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-10 right-1/4 w-[400px] h-[300px] bg-amber-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-purple-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to seosights
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Affiliate Program
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-tight">
              Turn Your Audience Into{' '}
              <span className="bg-gradient-to-r from-purple-400 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                Recurring Income
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Promote the Operating System for AI Search. Earn up to{' '}
              <span className="font-bold text-amber-400">50% recurring commission</span> with a
              60-day cookie window.
            </p>
          </motion.div>

          {/* Quick Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.label}
                  className="border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        {stat.label}
                      </p>
                      <p className="text-sm sm:text-base font-bold truncate">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ════ BENEFITS ════ */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Why Affiliates Love Us</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              The best terms in the SEO/AI tooling space — period.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card
                    className={`border ${b.border} ${b.bg} backdrop-blur-sm h-full hover:scale-[1.02] transition-transform duration-300`}
                  >
                    <CardContent className="pt-6 pb-6 px-5">
                      <div
                        className={`w-11 h-11 rounded-xl ${b.bg} flex items-center justify-center mb-4`}
                      >
                        <Icon className={`w-5 h-5 ${b.color}`} />
                      </div>
                      <h3 className="font-bold text-base mb-2">{b.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {b.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════ FULL AFFILIATE LANDING SECTION (tiers, calculator, how it works) ════ */}
      <AffiliateLandingSection onBecomeReseller={() => setIsAffiliateOpen(true)} />

      {/* ════ FAQ ════ */}
      <section className="py-20 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-3 py-1 text-xs border-purple-500/40 text-purple-400 bg-purple-500/10 mb-4"
            >
              <HelpCircle className="w-3 h-3" />
              Frequently Asked
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Affiliate Program FAQ</h2>
            <p className="text-muted-foreground text-base">
              Everything you need to know before you start earning.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <FAQItem q={faq.q} a={faq.a} defaultOpen={i === 0} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="py-16 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-amber-500/10 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-amber-500/5" />
              <CardContent className="relative py-10 px-6 sm:px-10 text-center">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <CheckCircle2 className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Ready to Build Your Passive Income?
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-6">
                  Join 500+ agencies and creators already earning with seosights. No fees, no
                  minimums — just share and earn.
                </p>
                <Button
                  size="lg"
                  onClick={() => setIsAffiliateOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
                >
                  Become a Reseller (Start Free)
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Instant approval · 60-day cookie · Monthly payouts
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Affiliate Portal Dialog */}
      <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
          <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
