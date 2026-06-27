'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import PricingCard from '@/components/billing/PricingCard'
import type { RegistrationTier } from '@/components/auth/RegistrationDialog'
import {
  Check,
  Bot,
  Shield,
  Search,
  BarChart3,
  Globe,
  Building2,
  Users,
  Palette,
  Download,
  Mail,
  Brain,
  Zap,
  Star,
  Link2,
  Code,
  UserCheck,
  MessageSquare,
  Crown,
  Rocket,
} from 'lucide-react'

interface PricingSectionProps {
  onStartFree?: () => void
  onAgencyRegister?: () => void
  onTierSelect?: (tier: RegistrationTier) => void
  userId?: string
}

const plans = [
  {
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
      {
        icon: Search,
        title: 'AEO/GEO Position Tracking',
        description:
          'Track up to 50 key queries/prompts on ChatGPT, Claude, and Perplexity search engines.',
      },
      {
        icon: Shield,
        title: 'Basic E-E-A-T Audit',
        description:
          'Quick check of fundamental trust signals on your website.',
      },
      {
        icon: Bot,
        title: 'AI Crawler Status',
        description:
          'Insight into whether AI bots (like GPTBot) successfully crawl your content.',
      },
      {
        icon: BarChart3,
        title: 'Classic SEO Check',
        description: 'Analysis of meta tags, titles, and basic on-page structure.',
      },
      {
        icon: Globe,
        title: '1 Domain (Project)',
        description: 'Full analysis capacity for one domain.',
      },
    ],
    cta: 'Start Free Trial',
    planKey: 'starter' as const,
    ctaAction: 'free' as const,
    highlighted: false,
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  },
  {
    name: 'Pro',
    subtitle: 'For growing teams & freelancers',
    price: '$79',
    period: '/month',
    freeTrial: '14-day free trial',
    description:
      'For SEO freelancers and growing marketing teams who need the full AI Visibility engine. Most popular.',
    features: [
      {
        icon: Check,
        title: 'Everything in Starter, plus:',
        description: '',
      },
      {
        icon: Brain,
        title: 'Entity & Brand Mentions',
        description:
          'Advanced analytics tracking how often AI models mention your brand or entity.',
      },
      {
        icon: Bot,
        title: 'Full AI Crawler Radar',
        description:
          'Real-time monitoring of GPTBot, ClaudeBot, PerplexityBot, and 14+ AI crawlers.',
      },
      {
        icon: Download,
        title: 'llms.txt Generator + Schema Tools',
        description: 'One-click generate llms.txt, FAQ schema, and structured data.',
      },
      {
        icon: BarChart3,
        title: '5 Domains / Projects',
        description: 'Track up to 5 domains simultaneously.',
      },
      {
        icon: Mail,
        title: 'AI Visibility Alerts',
        description: 'Email alerts when AI citations drop or crawlers get blocked.',
      },
    ],
    cta: 'Start Pro Trial',
    planKey: 'pro' as const,
    ctaAction: 'pro' as const,
    highlighted: true,
    borderColor: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    glowColor: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
  {
    name: 'Agency',
    subtitle: 'White-label for agencies',
    price: '$199',
    period: '/month',
    freeTrial: '14-day free trial',
    description:
      'For SEO agencies generating reports for clients. Full white-label.',
    features: [
      {
        icon: Check,
        title: 'Everything in Pro, plus:',
        description: '',
      },
      {
        icon: Palette,
        title: 'White-Label Reports',
        description:
          'Generate complete SEO/AEO/GEO audits with your logo and agency branding.',
      },
      {
        icon: Building2,
        title: '20 Domains / Clients',
        description: 'Track up to 20 domains/clients simultaneously.',
      },
      {
        icon: Download,
        title: 'Unlimited PDF & CSV Export',
        description: 'Unlimited report exports for fast client delivery.',
      },
      {
        icon: Mail,
        title: 'B2B Outreach Integration',
        description:
          'Quick-scan potential client websites for cold email campaign creation.',
      },
      {
        icon: Code,
        title: 'Custom Agent Prompts',
        description: 'Tailor AI agents with custom prompts for your niche.',
      },
    ],
    cta: 'Start Agency Trial',
    planKey: 'managed' as const,
    ctaAction: 'managed' as const,
    highlighted: false,
    borderColor: 'border-purple-500/40',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
  },
  {
    name: 'Enterprise',
    subtitle: 'Done-for-you & custom',
    price: 'Custom',
    period: '',
    freeTrial: null,
    description:
      'Complete dominance in your niche. Our team + AI agents handle everything while you focus on your business. Tailored to your needs.',
    features: [
      {
        icon: Check,
        title: 'Everything in Agency, plus:',
        description: '',
      },
      {
        icon: Users,
        title: 'Dedicated Account Manager',
        description:
          'Regular strategic consultations and transparent campaign progress reporting.',
      },
      {
        icon: Rocket,
        title: 'Priority Queue & SLA',
        description: 'Your analyses run first. Dedicated support with SLA.',
      },
      {
        icon: Link2,
        title: 'Unlimited Domains',
        description: 'No cap on domains or clients.',
      },
      {
        icon: UserCheck,
        title: 'Custom Domain White-Label',
        description: 'Fully branded portal on your own domain.',
      },
      {
        icon: MessageSquare,
        title: 'Content Humanization',
        description: 'Content tailored for AI engines while maintaining natural tone.',
      },
    ],
    cta: 'Contact Sales',
    planKey: 'managed' as const,
    ctaAction: 'contact' as const,
    highlighted: false,
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  },
]

export default function PricingSection({ onStartFree, onAgencyRegister, onTierSelect, userId }: PricingSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="pricing">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-6"
          >
            <Star className="w-3.5 h-3.5" />
            One Metric. Five AI Engines. Zero Agency Fees.
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Pricing that scales{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              with your ambition
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            14-day free trial. No credit card required. No contracts — cancel
            anytime. Every plan tracks your AI Visibility Score across ChatGPT, Claude, Gemini & Perplexity.
          </p>
        </motion.div>

        {/* Pricing Cards — 4 tiers */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.12 * i }}
            >
              <PricingCard
                name={plan.name}
                subtitle={plan.subtitle}
                price={plan.price}
                period={plan.period}
                freeTrial={plan.freeTrial}
                description={plan.description}
                features={plan.features}
                cta={plan.cta}
                planKey={plan.planKey}
                ctaAction={plan.ctaAction}
                highlighted={plan.highlighted}
                borderColor={plan.borderColor}
                iconColor={plan.iconColor}
                iconBg={plan.iconBg}
                glowColor={plan.glowColor}
                userId={userId}
                onStartFree={onStartFree}
                onTierSelect={onTierSelect}
                promoNote={'promoNote' in plan ? (plan as Record<string, unknown>).promoNote as string : undefined}
                originalPrice={'originalPrice' in plan ? (plan as Record<string, unknown>).originalPrice as string : undefined}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          className="text-center mt-12 space-y-2"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-muted-foreground text-sm">
            All plans include AI Visibility Score tracking, citation monitoring, and llms.txt generation. No credit card
            required for trial. No contracts — cancel anytime.
          </p>
          <p className="text-muted-foreground/60 text-xs flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-400" /> 14-day free trial</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> No credit card</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="inline-flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" /> Cancel anytime</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
