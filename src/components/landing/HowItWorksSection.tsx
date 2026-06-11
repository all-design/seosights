'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Globe, Search, Bot, BarChart3, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Enter Your URL',
    description: 'Paste your website URL and select your target market. We handle the rest.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  },
  {
    number: '02',
    icon: Search,
    title: '8 Agents Analyze',
    description: '8 specialized AI agents work in parallel: Crawler, Schema Architect, Content Analyst, E-E-A-T Auditor, GEO Specialist, Link Architect, Local Scout, and SXO Strategist.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
  },
  {
    number: '03',
    icon: Bot,
    title: 'Auto-Execute Strategy',
    description: 'Get a complete SEO/AEO/GEO audit with auto-generated strategy, code snippets, content briefs, and weekly action plans ready to execute.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Track & Dominate',
    description: 'Monitor your progress with weekly action plans, algorithm update tracking, and roadmap milestones.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/30',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
  },
]

export default function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-950/5 to-background" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How It{' '}
            <span className="text-emerald-400">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From URL to complete strategy in under 2 minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 via-amber-500/30 to-rose-500/30 -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 * i }}
              >
                <div className={`relative bg-white/5 backdrop-blur-sm border ${step.border} rounded-2xl p-6 ${step.glow} transition-all duration-300 hover:bg-white/8`}>
                  {/* Step number */}
                  <span className={`text-5xl font-black ${step.color} opacity-20 absolute top-2 right-4`}>
                    {step.number}
                  </span>

                  <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mb-4`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>

                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow between steps (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
