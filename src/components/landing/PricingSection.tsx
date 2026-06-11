'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import PricingCard from '@/components/billing/PricingCard'
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
  Settings,
} from 'lucide-react'

interface PricingSectionProps {
  onStartFree?: () => void
  userId?: string
}

const plans = [
  {
    name: 'Starter',
    subtitle: 'For website owners & bloggers',
    price: '$5',
    period: '/month',
    freeTrial: '1 month free trial',
    description:
      'Ideal for website owners, bloggers, and small businesses who want insight into their AI and SEO visibility.',
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
    name: 'Pro Agency',
    subtitle: 'White-Label for agencies',
    price: '$79',
    period: '/month',
    freeTrial: null,
    description:
      'For SEO agencies and marketing teams generating reports for their clients. Save $5,000/month vs hiring.',
    features: [
      {
        icon: Check,
        title: 'Everything in Starter, plus:',
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
        icon: Brain,
        title: 'Entity & Brand Mentions',
        description:
          'Advanced analytics tracking how often AI models mention your brand or entity.',
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
    ],
    cta: 'Start Pro Agency',
    planKey: 'pro' as const,
    ctaAction: 'pro' as const,
    highlighted: true,
    borderColor: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    glowColor: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
  {
    name: 'Managed',
    subtitle: 'Done-For-You service',
    price: '$299',
    period: '/month',
    freeTrial: null,
    description:
      'Complete dominance in your niche. Our team + 8 AI agents handle everything while you focus on your business.',
    features: [
      {
        icon: Check,
        title: 'Everything in Pro, plus:',
        description: '',
      },
      {
        icon: Users,
        title: 'Dedicated Account Manager',
        description:
          'Regular strategic consultations and transparent campaign progress reporting.',
      },
      {
        icon: Code,
        title: 'Custom Agent Prompts',
        description:
          'Tailor AI agents with custom prompts for your specific niche and strategy.',
      },
      {
        icon: Link2,
        title: 'Priority Queue',
        description:
          'Your analyses run first, ahead of all other users in the queue.',
      },
      {
        icon: UserCheck,
        title: 'White-Label Reports',
        description:
          'Fully branded reports with your logo, colors, and custom domain for client delivery.',
      },
      {
        icon: MessageSquare,
        title: 'Content Humanization',
        description:
          'Content tailored for AI engines (AEO) while maintaining natural tone that converts.',
      },
    ],
    cta: 'Subscribe Now',
    planKey: 'managed' as const,
    ctaAction: 'managed' as const,
    highlighted: false,
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  },
]

export default function PricingSection({ onStartFree, userId }: PricingSectionProps) {
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
            One Tool. Three Sights. Zero Agency Fees.
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Save <span className="text-amber-400">$5,000/month</span> vs
            Agencies. See All Three Sights.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No contracts. Cancel anytime. Start free, scale as you grow — from
            solo founders to full-service agencies. All Three Sights included.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
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
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-muted-foreground text-sm">
            All plans include full SEO · AEO · GEO analysis. No credit card
            required for free trial. No contracts — cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
