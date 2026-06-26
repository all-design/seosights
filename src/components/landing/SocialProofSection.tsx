'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star } from 'lucide-react'

interface Stat {
  value: string
  label: string
}

const stats: Stat[] = [
  { value: '1,200+', label: 'Active Marketers' },
  { value: '500+', label: 'Agencies' },
  { value: '34', label: 'Countries' },
  { value: '50M', label: 'URLs Analyzed' },
  { value: '17+', label: 'AI Engines Tracked' },
]

const publications = [
  'TechCrunch',
  'Product Hunt',
  'Indie Hackers',
  'Hacker News',
  'SEO Roundtable',
]

export default function SocialProofSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-10 sm:py-12 relative" ref={ref}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stars + tagline */}
        <motion.div
          className="flex flex-col items-center gap-2 mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Loved by marketers worldwide
          </p>
        </motion.div>

        {/* Big stats row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-4 mb-10"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent mb-1 leading-none">
                {stat.value}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* As seen on */}
        <motion.div
          className="flex flex-col items-center gap-4 pt-8 border-t border-white/5"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50">
            As seen on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10">
            {publications.map((pub) => (
              <span
                key={pub}
                className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                {pub}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
