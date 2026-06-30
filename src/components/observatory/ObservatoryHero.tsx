'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  TrendingUp,
  Gauge,
  Sparkles,
  ArrowRight,
  Satellite,
} from 'lucide-react'

export default function ObservatoryHero() {
  const pillars = [
    {
      icon: Eye,
      label: 'Understand',
      description: 'See how AI models recommend your business — every citation, every shift, every competitor.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      icon: Gauge,
      label: 'Measure',
      description: 'Track your AI visibility with real-time data, industry benchmarks, and Observatory Index™ scores.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
    },
    {
      icon: TrendingUp,
      label: 'Improve',
      description: 'Get actionable recommendations to increase how often AI models recommend your business.',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-20 pb-16 sm:pt-28 sm:pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="outline"
            className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-3 py-1"
          >
            <Satellite className="w-3 h-3 mr-1.5" />
            AI Search Observatory™
          </Badge>
        </motion.div>

        {/* One-liner pitch */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
            Understand. Measure. Improve.
          </h1>
        </motion.div>

        <motion.p
          className="text-center text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-3 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          How AI models recommend your business.
        </motion.p>

        <motion.p
          className="text-center text-sm text-slate-500 max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          The independent research center that daily analyzes the behavior of leading AI models.
          Real data. Real methodology. Real findings.
        </motion.p>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.label}
              className={`relative group rounded-xl border ${pillar.border} ${pillar.bg} p-6 sm:p-8 hover:scale-[1.02] transition-transform cursor-default`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${pillar.bg}`}>
                  <pillar.icon className={`w-5 h-5 ${pillar.color}`} />
                </div>
                <h3 className={`text-xl font-bold ${pillar.color}`}>
                  {pillar.label}
                </h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Row */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 gap-2"
            onClick={() => {
              const el = document.getElementById('observatory-pulse')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Sparkles className="w-4 h-4" />
            Explore Live Data
            <ArrowRight className="w-4 h-4" />
          </Button>
          <span className="text-slate-600 text-sm">or scroll down for research →</span>
        </motion.div>
      </div>
    </section>
  )
}
