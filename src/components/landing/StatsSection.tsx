'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface StatItem {
  value: string
  label: string
  source: string
}

const stats: StatItem[] = [
  {
    value: '3X',
    label: 'More AI Citations',
    source: 'Studies show optimized sites get 3× more AI citations',
  },
  {
    value: '500K+',
    label: 'Pages Analyzed',
    source: 'Platform-wide stat',
  },
  {
    value: '86%',
    label: 'AI Overview Pull Rate',
    source: "Google AI Overviews pull from web results 86% of the time",
  },
  {
    value: '17+',
    label: 'AI engines tracked across all Sights',
    source: '',
  },
  {
    value: '9X',
    label: 'LLM traffic converts better than Google',
    source: 'Forbes',
  },
]

export default function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-20 relative" ref={ref}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 h-full">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {stat.label}
                  </p>
                  {stat.source && (
                    <p className="text-xs text-emerald-500/60 mt-2">
                      Source: {stat.source}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
