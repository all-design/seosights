'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Check,
  ArrowRight,
  Bot,
  Shield,
  Search,
  BarChart3,
  Globe,
  FileText,
  Building2,
  Users,
  Palette,
  Download,
  Mail,
  Brain,
  Zap,
  Star,
  Phone,
  Link2,
  Code,
  UserCheck,
  MessageSquare,
  Settings,
} from 'lucide-react'

interface PricingSectionProps {
  onStartFree?: () => void
}

const plans = [
  {
    name: 'Starter',
    subtitle: 'For website owners & bloggers',
    price: '$5',
    period: '/month',
    freeTrial: '1 month free trial',
    description: 'Ideal for website owners, bloggers, and small businesses who want insight into their AI and SEO visibility.',
    features: [
      {
        icon: Search,
        title: 'AEO/GEO Position Tracking',
        description: 'Track up to 50 key queries/prompts on ChatGPT, Claude, and Perplexity search engines.',
      },
      {
        icon: Shield,
        title: 'Basic E-E-A-T Audit',
        description: 'Quick check of fundamental trust signals on your website.',
      },
      {
        icon: Bot,
        title: 'AI Crawler Status',
        description: 'Insight into whether AI bots (like GPTBot) successfully crawl your content.',
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
    description: 'For SEO agencies and marketing teams generating reports for their clients.',
    features: [
      {
        icon: Check,
        title: 'Everything in Starter, plus:',
        description: '',
      },
      {
        icon: Palette,
        title: 'White-Label Reports',
        description: 'Generate complete SEO/AEO/GEO audits with your logo and agency branding.',
      },
      {
        icon: Building2,
        title: '20 Domains / Clients',
        description: 'Track up to 20 domains/clients simultaneously.',
      },
      {
        icon: Brain,
        title: 'Entity & Brand Mentions',
        description: 'Advanced analytics tracking how often AI models mention your brand or entity.',
      },
      {
        icon: Download,
        title: 'Unlimited PDF & CSV Export',
        description: 'Unlimited report exports for fast client delivery.',
      },
      {
        icon: Mail,
        title: 'B2B Outreach Integration',
        description: 'Quick-scan potential client websites for cold email campaign creation.',
      },
    ],
    cta: 'Start Pro Agency',
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
    price: 'Contact',
    period: '',
    freeTrial: null,
    description: 'For clients who want complete dominance in their niche through advanced SEO and GEO execution.',
    features: [
      {
        icon: Users,
        title: 'Complete Project Takeover',
        description: 'Our team of engineers and strategists handles complete optimization for you.',
      },
      {
        icon: Code,
        title: 'Technical & On-Page Perfection',
        description: 'Deep site architecture fixes and rigorous Core Web Vitals optimization.',
      },
      {
        icon: Link2,
        title: 'Advanced Authority Building',
        description: 'Automated link-building outreach and strong brand signals that AI engines favor.',
      },
      {
        icon: Zap,
        title: 'Strategic Interlinking',
        description: 'Advanced architectures (e.g., "triangle" domain strategy) for search dominance.',
      },
      {
        icon: MessageSquare,
        title: 'Content Humanization',
        description: 'Content tailored for AI engines (AEO) while maintaining natural tone that converts.',
      },
      {
        icon: UserCheck,
        title: 'Dedicated Account Manager',
        description: 'Regular strategic consultations and transparent campaign progress reporting.',
      },
    ],
    cta: 'Contact Us',
    ctaAction: 'contact' as const,
    highlighted: false,
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    glowColor: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  },
]

export default function PricingSection({ onStartFree }: PricingSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const handleCTA = (action: 'free' | 'pro' | 'contact') => {
    if (action === 'contact') {
      const el = document.getElementById('cta')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      onStartFree?.()
    }
  }

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
            Simple, Transparent Pricing
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              Plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, scale as you grow. From solo bloggers to full-service agencies.
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
              className={`relative ${plan.highlighted ? 'md:-mt-4 md:mb-[-16px]' : ''}`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-amber-500 text-black font-bold px-4 py-1 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card
                className={`bg-white/5 backdrop-blur-sm border-2 ${plan.borderColor} ${plan.glowColor} transition-all duration-300 h-full flex flex-col ${
                  plan.highlighted ? 'shadow-[0_0_40px_rgba(245,158,11,0.1)] border-amber-500/50' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${plan.iconBg} flex items-center justify-center`}>
                      {plan.name === 'Starter' && <Zap className={`w-4 h-4 ${plan.iconColor}`} />}
                      {plan.name === 'Pro Agency' && <Building2 className={`w-4 h-4 ${plan.iconColor}`} />}
                      {plan.name === 'Managed' && <Settings className={`w-4 h-4 ${plan.iconColor}`} />}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                  {plan.freeTrial && (
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-1.5 w-fit border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs mt-2"
                    >
                      <Check className="w-3 h-3" />
                      {plan.freeTrial}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-md ${plan.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <feature.icon className={`w-3.5 h-3.5 ${plan.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/90">{feature.title}</p>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className={`w-full mt-6 font-semibold text-base py-5 transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]'
                        : plan.name === 'Managed'
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)]'
                    }`}
                    onClick={() => handleCTA(plan.ctaAction)}
                  >
                    {plan.cta}
                    {plan.ctaAction !== 'contact' && <ArrowRight className="ml-2 w-4 h-4" />}
                    {plan.ctaAction === 'contact' && <Phone className="ml-2 w-4 h-4" />}
                  </Button>
                </CardContent>
              </Card>
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
            All plans include full SEO · AEO · GEO analysis. No credit card required for free trial.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
