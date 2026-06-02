'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Link2,
  Shield,
  Brain,
  Bot,
  TrendingUp,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  Search,
  MapPin,
  Eye,
  MessageSquare,
  Settings,
  Gift,
  Sparkles,
} from 'lucide-react'

const offerings = [
  {
    icon: Link2,
    title: 'AI SEO Backlinks',
    description: 'The lever that ranks you on Google AND gets you cited by ChatGPT, Claude, and Perplexity.',
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    icon: Shield,
    title: 'SEO · AEO · GEO Analysis',
    description: 'Three-pillar approach: traditional rankings, featured snippets, and AI citation optimization.',
    borderColor: 'border-l-cyan-500',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
  },
  {
    icon: Brain,
    title: 'E-E-A-T Scoring',
    description: "Google's Experience, Expertise, Authoritativeness, Trustworthiness framework with Who/How/Why test.",
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  {
    icon: Bot,
    title: 'AI Crawler Optimization',
    description: 'GPTBot, ClaudeBot, PerplexityBot access management. Ensure AI can read and cite your content.',
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Brand Mention Signals',
    description: 'Brand mentions correlate 3x more with AI visibility than backlinks. We track and build them.',
    borderColor: 'border-l-rose-500',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
  },
  {
    icon: MessageSquare,
    title: 'Content Quality & Humanization',
    description: 'AI pattern detection, filler analysis, and humanization guidance aligned with Google QRG.',
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/20',
  },
  {
    icon: MapPin,
    title: 'Local SEO Intelligence',
    description: 'Google Business Profile, NAP consistency, review velocity, and market-specific optimization.',
    borderColor: 'border-l-teal-500',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/20',
  },
  {
    icon: Eye,
    title: 'Search Experience Optimization',
    description: 'SERP backward analysis, page-type matching, and persona scoring for intent alignment.',
    borderColor: 'border-l-indigo-500',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/20',
  },
  {
    icon: Settings,
    title: 'Free Agent OS Setup',
    description: 'Hermes, OpenClaw, or Claude. Pick one or run all three. Configured for your niche.',
    borderColor: 'border-l-sky-500',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/20',
  },
  {
    icon: Gift,
    title: 'Up to 4 Months Free',
    description: 'Buy 3 get 1, buy 6 get 2, buy 9 get 3, buy 12 get 4. 33% more authority for same investment.',
    borderColor: 'border-l-orange-500',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/20',
  },
  {
    icon: FileText,
    title: 'The 150K AI SEO Strategy',
    description: 'The exact playbook behind 0 to 150K organic visitors and a $30K/month SaaS build.',
    borderColor: 'border-l-lime-500',
    iconColor: 'text-lime-400',
    iconBg: 'bg-lime-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Rank-Or-Free Guarantee',
    description: 'Rank #1 on Google AND get cited by AI, or we work for free until you do.',
    borderColor: 'border-l-pink-500',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/20',
  },
]

export default function CompleteSolutionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const scrollToCTA = () => {
    const el = document.getElementById('cta')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 relative" ref={ref} id="complete-solution">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/5 via-background to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            The{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
              Complete Solution
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to rank on Google, win featured snippets, and get cited by AI — in one system.
          </p>
        </motion.div>

        {/* Offering Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {offerings.map((offering, i) => (
            <motion.div
              key={offering.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * i }}
            >
              <Card
                className={`bg-white/5 backdrop-blur-sm border-white/10 border-l-4 ${offering.borderColor} hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 h-full group`}
              >
                <CardContent className="p-5">
                  <div
                    className={`w-10 h-10 rounded-xl ${offering.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <offering.icon className={`w-5 h-5 ${offering.iconColor}`} />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    {offering.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {offering.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            onClick={scrollToCTA}
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
