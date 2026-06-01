'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Link2,
  TrendingUp,
  Newspaper,
  Search,
  BarChart3,
} from 'lucide-react'

const bullets = [
  {
    icon: Link2,
    text: 'Ahrefs found backlinks are the #1 predictor of ChatGPT citations',
  },
  {
    icon: TrendingUp,
    text: 'Strong link profiles get cited 8X more across AI',
  },
  {
    icon: Newspaper,
    text: 'Earned media drives 325% more AI citations than your own content',
  },
  {
    icon: Search,
    text: "AI Overviews pull from Google's top 10 around 86% of the time. Perplexity around 91%",
  },
  {
    icon: BarChart3,
    text: 'Forbes confirmed LLM traffic converts 9X better than Google',
  },
]

export default function BacklinksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative overflow-hidden" ref={ref} id="backlinks">
      {/* Background with backlinks image */}
      <div className="absolute inset-0 opacity-[0.06]">
        <img
          src="/backlinks.png"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/90" />

      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/6 rounded-full blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-muted-foreground">
            But the Content Engine Isn&apos;t What Makes You Money
          </h2>
          <div className="mt-6">
            <span className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Backlinks Do.
            </span>
          </div>
          <p className="text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            Here&apos;s why backlinks are the revenue lever:
          </p>
        </motion.div>

        {/* Bullet Points */}
        <div className="space-y-6 max-w-3xl mx-auto">
          {bullets.map((bullet, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <bullet.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-foreground/90 leading-relaxed text-lg">
                {bullet.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing Line */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.0 }}
        >
          <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl leading-relaxed text-foreground/90">
              The Agent OS creates the assets. Our backlink strategy makes AI
              cite them. Your traffic and leads skyrocket. And you know{' '}
              <span className="text-amber-400 font-bold">THAT</span> is where
              the money is.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
