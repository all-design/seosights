'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Link2,
  Settings,
  Gift,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'

const offerings = [
  {
    icon: Link2,
    title: 'AI SEO Backlinks',
    description:
      'The lever that ranks you on Google AND gets you cited by ChatGPT, Claude, and Perplexity.',
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    icon: Settings,
    title: 'Free Agent OS Setup',
    description:
      'Hermes, OpenClaw, or Claude. Pick one or run all three. Configured for your niche. Running by next week.',
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/20',
  },
  {
    icon: Gift,
    title: 'Up to 4 Months Free',
    description:
      'Buy 3 get 1, buy 6 get 2, buy 9 get 3, buy 12 get 4. 33% more authority for the same investment.',
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
  {
    icon: FileText,
    title: 'The 150K AI SEO Strategy',
    description:
      'The exact playbook behind 0 to 150K organic visitors and a $30K/month SaaS build.',
    borderColor: 'border-l-cyan-500',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Rank-Or-Free Guarantee',
    description:
      'Rank #1 on Google AND get cited by AI, or we work for free until you do.',
    borderColor: 'border-l-rose-500',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
  },
  {
    icon: ClipboardCheck,
    title: 'Citation Gap Audit + 3 Fixes + Roadmap',
    description:
      'Which competitors AI cites instead of you. Specific moves to close the gap. Keywords and pages worth building first.',
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
]

export default function JuneStackSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const scrollToCTA = () => {
    const el = document.getElementById('cta')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 relative" ref={ref} id="june-stack">
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
            The Full{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              June Stack
            </span>
          </h2>
        </motion.div>

        {/* Offering Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering, i) => (
            <motion.div
              key={offering.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <Card
                className={`bg-white/5 backdrop-blur-sm border-white/10 border-l-4 ${offering.borderColor} hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 h-full group`}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${offering.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <offering.icon className={`w-6 h-6 ${offering.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {offering.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
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
            Book a Call
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
