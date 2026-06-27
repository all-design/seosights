'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Check,
  ChevronRight,
  Star,
  Search,
  Shield,
  Bot,
  BarChart3,
  Globe,
  Brain,
  Download,
  Mail,
  Palette,
  Building2,
  Code,
  Users,
  Link2,
  UserCheck,
  MessageSquare,
  Crown,
  Rocket,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  subtitle: string
  price: string
  period: string
  freeTrial: string | null
  description: string
  features: { icon: LucideIcon; title: string; description: string }[]
  cta: string
  ctaHref: string
  highlighted: boolean
  borderColor: string
  iconColor: string
  iconBg: string
  glowColor: string
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'For website owners & bloggers',
    price: '$9.90',
    period: '/month',
    freeTrial: '6 months at 50% off, then $19/mo',
    promoNote: 'Launch Special: 50% off first 6 months',
    originalPrice: '$19',
    description:
      'For website owners, bloggers, and small businesses who want insight into their AI and SEO visibility.',
    features: [
      { icon: Search, title: 'AEO/GEO Position Tracking', description: 'Track up to 50 key queries/prompts on ChatGPT, Claude, and Perplexity.' },
      { icon: Shield, title: 'Basic E-E-A-T Audit', description: 'Quick check of fundamental trust signals on your website.' },
      { icon: Bot, title: 'AI Crawler Status', description: 'Insight into whether AI bots (like GPTBot) successfully crawl your content.' },
      { icon: BarChart3, title: 'Classic SEO Check', description: 'Analysis of meta tags, titles, and basic on-page structure.' },
      { icon: Globe, title: '1 Domain (Project)', description: 'Full analysis capacity for one domain.' },
    ],
    cta: 'Start Free Trial',
    ctaHref: '/#cta',
    highlighted: false,
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For growing teams & freelancers',
    price: '$79',
    period: '/month',
    freeTrial: '14-day free trial',
    description:
      'For SEO freelancers and growing marketing teams who need the full Three Sights engine. Most popular.',
    features: [
      { icon: Check, title: 'Everything in Starter, plus:', description: '' },
      { icon: Brain, title: 'Entity & Brand Mentions', description: 'Advanced analytics tracking how often AI models mention your brand or entity.' },
      { icon: Bot, title: 'Full AI Crawler Radar', description: 'Real-time monitoring of GPTBot, ClaudeBot, PerplexityBot, and 14+ AI crawlers.' },
      { icon: Download, title: 'llms.txt Generator + Schema Tools', description: 'One-click generate llms.txt, FAQ schema, and structured data.' },
      { icon: BarChart3, title: '5 Domains / Projects', description: 'Track up to 5 domains simultaneously.' },
      { icon: Mail, title: 'AI Visibility Alerts', description: 'Email alerts when AI citations drop or crawlers get blocked.' },
    ],
    cta: 'Start Pro Trial',
    ctaHref: '/#cta',
    highlighted: true,
    borderColor: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    glowColor: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
  {
    id: 'agency',
    name: 'Agency',
    subtitle: 'White-label for agencies',
    price: '$199',
    period: '/month',
    freeTrial: '14-day free trial',
    description:
      'For SEO agencies generating reports for clients. Full white-label.',
    features: [
      { icon: Check, title: 'Everything in Pro, plus:', description: '' },
      { icon: Palette, title: 'White-Label Reports', description: 'Generate complete SEO/AEO/GEO audits with your logo and agency branding.' },
      { icon: Building2, title: '20 Domains / Clients', description: 'Track up to 20 domains/clients simultaneously.' },
      { icon: Download, title: 'Unlimited PDF & CSV Export', description: 'Unlimited report exports for fast client delivery.' },
      { icon: Mail, title: 'B2B Outreach Integration', description: 'Quick-scan potential client websites for cold email campaign creation.' },
      { icon: Code, title: 'Custom Agent Prompts', description: 'Tailor AI agents with custom prompts for your niche.' },
    ],
    cta: 'Start Agency Trial',
    ctaHref: '/#cta',
    highlighted: false,
    borderColor: 'border-purple-500/40',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Done-for-you & custom',
    price: 'Custom',
    period: '',
    freeTrial: null,
    description:
      'Complete dominance in your niche. Our team + 8 AI agents handle everything while you focus on your business.',
    features: [
      { icon: Check, title: 'Everything in Agency, plus:', description: '' },
      { icon: Users, title: 'Dedicated Account Manager', description: 'Regular strategic consultations and transparent campaign progress reporting.' },
      { icon: Rocket, title: 'Priority Queue & SLA', description: 'Your analyses run first. Dedicated support with SLA.' },
      { icon: Link2, title: 'Unlimited Domains', description: 'No cap on domains or clients.' },
      { icon: UserCheck, title: 'Custom Domain White-Label', description: 'Fully branded portal on your own domain.' },
      { icon: MessageSquare, title: 'Content Humanization', description: 'Content tailored for AI engines while maintaining natural tone.' },
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:hello@seosights.com',
    highlighted: false,
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  },
]

// Comparison table rows: feature across 4 plans
const comparisonRows: { category: string; feature: string; values: (string | boolean)[] }[] = [
  { category: 'Core', feature: 'Three Sights (SEO + AEO + GEO)', values: [true, true, true, true] },
  { category: 'Core', feature: '8 AI agents', values: [true, true, true, true] },
  { category: 'Core', feature: '14-day free trial', values: [true, true, true, false] },
  { category: 'Domains', feature: 'Domains / Projects', values: ['1', '5', '20', 'Unlimited'] },
  { category: 'Tracking', feature: 'Prompt tracking', values: ['50 prompts', '250 prompts', '1,000 prompts', 'Unlimited'] },
  { category: 'Tracking', feature: 'Competitor tracking', values: ['1 competitor', '5 competitors', '10 competitors', 'Unlimited'] },
  { category: 'Tracking', feature: 'AI Visibility Score', values: [true, true, true, true] },
  { category: 'Tracking', feature: 'Historical trending', values: [false, true, true, true] },
  { category: 'Alerts', feature: 'AI citation drop alerts', values: [false, true, true, true] },
  { category: 'Alerts', feature: 'Crawler blocked alerts', values: [false, true, true, true] },
  { category: 'Tools', feature: 'llms.txt Generator', values: [true, true, true, true] },
  { category: 'Tools', feature: 'Schema Generator', values: [true, true, true, true] },
  { category: 'Tools', feature: 'Advanced AI Tools (6 tools)', values: [false, true, true, true] },
  { category: 'Reports', feature: 'PDF export', values: [false, '10/mo', 'Unlimited', 'Unlimited'] },
  { category: 'Reports', feature: 'CSV export', values: [false, '10/mo', 'Unlimited', 'Unlimited'] },
  { category: 'Reports', feature: 'White-label reports', values: [false, false, true, true] },
  { category: 'Reports', feature: 'Custom domain white-label', values: [false, false, false, true] },
  { category: 'AI Crawlers', feature: 'GPTBot monitoring', values: [true, true, true, true] },
  { category: 'AI Crawlers', feature: 'Full AI Crawler Radar (17+ bots)', values: [false, true, true, true] },
  { category: 'Support', feature: 'Email support', values: [true, true, true, true] },
  { category: 'Support', feature: 'Priority queue & SLA', values: [false, false, false, true] },
  { category: 'Support', feature: 'Dedicated account manager', values: [false, false, false, true] },
]

const pricingFaq = [
  {
    q: 'Is there really a 14-day free trial with no credit card?',
    a: 'Yes. Every plan except Enterprise starts with a 14-day free trial. You do not need to enter a credit card to start. At the end of the trial, your account simply stops running new analyses — your historical data stays accessible.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes, anytime. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle. No contracts, no cancellation fees.',
  },
  {
    q: 'What counts as a "Domain" or "Project"?',
    a: 'A Project is one website you are analyzing. You can run unlimited analyses on each Project. The plan limits how many Projects you can have active at once. Most users need 1 Project per website they own or manage.',
  },
  {
    q: 'What is the difference between Pro and Agency?',
    a: 'Pro is for individuals and small teams managing their own sites. Agency adds white-label reporting (your logo, your brand), more domains (20 vs 5), unlimited PDF/CSV exports, and B2B outreach tools for scanning prospective client sites.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If you cancel within 7 days of your first paid subscription, we refund 100% — no questions asked. After 7 days, you can cancel anytime and your subscription runs until the end of the current billing cycle.',
  },
  {
    q: 'What is included in Enterprise?',
    a: 'Everything in Agency plus unlimited domains, a dedicated account manager, priority analysis queue with SLA, custom-domain white-label portal, content humanization, and done-for-you execution by our team. Pricing is custom and based on scope.',
  },
  {
    q: 'Can I get a custom plan between Pro and Agency?',
    a: 'For most cases, no — the four tiers cover the common configurations. If you have a specific need (10 domains but no white-label, for example), reach out and we will see what we can do.',
  },
  {
    q: 'Do you have an affiliate program?',
    a: 'Yes — 50% recurring commissions on a 5-tier ladder. See our Affiliates page for the full program details and commission calculator.',
  },
]

export default function PricingPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <>
      {/* Pricing cards */}
      <section className="py-12" id="plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                id={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card
                  className={`relative bg-white/5 backdrop-blur-sm border ${plan.borderColor} ${plan.glowColor} transition-all duration-300 h-full ${
                    plan.highlighted ? 'ring-2 ring-amber-500/40' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Most popular
                      </Badge>
                    </div>
                  )}
                  {'promoNote' in plan && (plan as Record<string, unknown>).promoNote && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white border-0 px-3 py-1 flex items-center gap-1 uppercase text-[10px] tracking-wider font-bold">
                        <Sparkles className="w-3 h-3" />
                        Launch Special — 50% Off
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className={`text-xl font-bold ${plan.iconColor}`}>{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.period && (
                          <span className="text-sm text-muted-foreground">{plan.period}</span>
                        )}
                        {'originalPrice' in plan && (plan as Record<string, unknown>).originalPrice && (
                          <span className="text-sm text-muted-foreground/50 line-through ml-1">{(plan as Record<string, unknown>).originalPrice as string}{plan.period}</span>
                        )}
                      </div>
                      {plan.freeTrial && (
                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {plan.freeTrial}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {plan.description}
                    </p>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2">
                          <f.icon className={`w-4 h-4 ${plan.iconColor} shrink-0 mt-0.5`} />
                          <div>
                            <p className="text-xs font-medium text-foreground">{f.title}</p>
                            {f.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.ctaHref}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg font-semibold text-sm transition-all duration-300 ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                          : plan.id === 'enterprise'
                            ? 'border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10'
                            : `border ${plan.borderColor} ${plan.iconColor} hover:bg-white/5`
                      }`}
                    >
                      {plan.cta}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include full SEO · AEO · GEO analysis. No credit card required for trial. No
            contracts — cancel anytime.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-12" id="compare">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Compare all features</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Every plan includes the full Three Sights engine. Higher tiers add scale, white-label,
            and dedicated support.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-semibold sticky left-0 bg-white/5 backdrop-blur-sm">
                    Feature
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      className={`text-center p-4 font-semibold ${p.highlighted ? 'bg-amber-500/10' : ''}`}
                    >
                      <span className={p.iconColor}>{p.name}</span>
                      <div className="text-xs font-normal text-muted-foreground mt-0.5">
                        {p.price}{p.period}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`border-b border-white/5 ${ri === 0 || comparisonRows[ri - 1].category !== row.category ? 'border-t border-white/10' : ''}`}
                  >
                    <td className="p-4 sticky left-0 bg-white/5 backdrop-blur-sm">
                      <span className="text-xs text-muted-foreground/60 uppercase tracking-wider mr-2">
                        {row.category}
                      </span>
                      <span className="text-foreground">{row.feature}</span>
                    </td>
                    {row.values.map((v, vi) => (
                      <td
                        key={vi}
                        className={`text-center p-4 ${plans[vi].highlighted ? 'bg-amber-500/5' : ''}`}
                      >
                        {typeof v === 'boolean' ? (
                          v ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        ) : (
                          <span className="text-foreground font-medium">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            Pricing FAQ
          </h2>
          <div className="space-y-3">
            {pricingFaq.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm sm:text-base">{item.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate cross-sell */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Earn 50% recurring commissions</h3>
                <p className="text-sm text-muted-foreground">
                  Refer seosights to your audience and earn on every recurring payment — for life.
                </p>
              </div>
            </div>
            <Link
              href="/affiliates"
              className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              See the affiliate program
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
