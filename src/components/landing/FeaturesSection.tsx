'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Bot,
  Brain,
  Eye,
  Shield,
  Link2,
  BarChart3,
  Globe,
  FileText,
  TrendingUp,
  Code,
  MessageSquare,
  MapPin,
  Zap,
  Users,
  Sparkles,
} from 'lucide-react'

const featureCategories = [
  {
    category: 'SEO',
    label: 'Search Engine Optimization',
    color: 'emerald',
    icon: Search,
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    features: [
      { title: 'Technical SEO Audit', description: 'Meta tags, headings, site structure, Core Web Vitals analysis' },
      { title: 'Crawlability Analysis', description: 'robots.txt, XML sitemaps, crawl budget optimization' },
      { title: 'Indexation Monitor', description: 'Indexed pages tracking, orphan page detection, coverage issues' },
      { title: 'Keyword Gap Analysis', description: 'Find keyword opportunities competitors rank for but you don\'t' },
      { title: 'On-Page Optimization', description: 'Title tags, meta descriptions, heading hierarchy, content structure' },
    ],
  },
  {
    category: 'AEO',
    label: 'Answer Engine Optimization',
    color: 'cyan',
    icon: Bot,
    borderColor: 'border-l-cyan-500',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    features: [
      { title: 'FAQ & Schema Detection', description: 'Identify missing FAQ schema and structured data opportunities' },
      { title: 'Answer Block Optimization', description: 'Create 40-60 word answers targeting featured snippets' },
      { title: 'Voice Search Readiness', description: 'Conversational query optimization for voice assistants' },
      { title: 'People Also Ask Targeting', description: 'PAA box optimization and answer formatting' },
      { title: 'Structured Data Recommendations', description: 'Schema.org markup for enhanced SERP presence' },
    ],
  },
  {
    category: 'GEO',
    label: 'Generative Engine Optimization',
    color: 'amber',
    icon: Brain,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    features: [
      { title: 'AI Crawler Access', description: 'GPTBot, ClaudeBot, PerplexityBot crawl verification & optimization' },
      { title: 'AI Citation Tracking', description: 'Monitor how often ChatGPT, Claude, Perplexity cite your content' },
      { title: 'Brand Mention Signals', description: 'Track brand mentions across Wikipedia, Reddit, YouTube, LinkedIn' },
      { title: 'llms.txt Implementation', description: 'AI-readable content index for LLM discovery' },
      { title: 'Entity Recognition Score', description: 'Knowledge graph presence and entity authority measurement' },
    ],
  },
]

const additionalFeatures = [
  {
    icon: Shield,
    title: 'E-E-A-T Scoring',
    description: 'Experience, Expertise, Authoritativeness, Trustworthiness framework with Who/How/Why test.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  {
    icon: BarChart3,
    title: 'Content Quality & Humanization',
    description: 'AI pattern detection, filler analysis, and humanization guidance aligned with Google QRG.',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
  {
    icon: Link2,
    title: 'Parasite SEO Risk Analysis',
    description: 'Detect if your site is at risk of being outranked by parasite SEO on your own pages.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20',
  },
  {
    icon: MapPin,
    title: 'Local SEO Intelligence',
    description: 'Google Business Profile, NAP consistency, review velocity, and market-specific optimization.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/20',
  },
  {
    icon: FileText,
    title: 'White-Label PDF Reports',
    description: 'Generate branded SEO/AEO/GEO audits for your clients with your logo and colors.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Algorithm Update Tracker',
    description: 'Real-time Google algorithm update monitoring with impact analysis on your rankings.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
]

export default function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="features">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/5 to-background" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-cyan-500/50 text-cyan-400 bg-cyan-500/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Comprehensive Feature Set
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Three Pillars.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
              One Platform.
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to dominate search, get cited by AI, and build lasting authority.
          </p>
        </motion.div>

        {/* Three Pillar Feature Sections */}
        <div className="space-y-12 mb-16">
          {featureCategories.map((cat, ci) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * ci }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center`}>
                  <cat.icon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{cat.category}</h3>
                  <p className="text-sm text-muted-foreground">{cat.label}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {cat.features.map((feature, fi) => (
                  <motion.div
                    key={fi}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 * fi + 0.15 * ci }}
                  >
                    <Card className={`bg-white/5 backdrop-blur-sm border-white/10 border-l-4 ${cat.borderColor} hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 h-full`}>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-bold text-foreground/90 mb-1.5">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-foreground/80" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Plus More</h3>
              <p className="text-sm text-muted-foreground">Advanced capabilities built into every plan</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.7 + 0.05 * i }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 h-full group">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground/90 mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
