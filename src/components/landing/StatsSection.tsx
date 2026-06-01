'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface StatItem {
  value: string
  numericValue: number
  suffix: string
  label: string
  source: string
}

const stats: StatItem[] = [
  {
    value: '8X',
    numericValue: 8,
    suffix: 'X',
    label: 'More AI citations with strong link profiles',
    source: 'Ahrefs',
  },
  {
    value: '325%',
    numericValue: 325,
    suffix: '%',
    label: 'More AI citations from earned media vs own content',
    source: '',
  },
  {
    value: '86%',
    numericValue: 86,
    suffix: '%',
    label: "AI Overviews pull from Google's top 10",
    source: '',
  },
  {
    value: '91%',
    numericValue: 91,
    suffix: '%',
    label: 'Perplexity citations come from top results',
    source: '',
  },
  {
    value: '9X',
    numericValue: 9,
    suffix: 'X',
    label: 'LLM traffic converts better than Google',
    source: 'Forbes',
  },
]

function AnimatedCounter({
  value,
  suffix,
  inView,
}: {
  value: number
  suffix: string
  inView: boolean
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

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
                    <AnimatedCounter
                      value={stat.numericValue}
                      suffix={stat.suffix}
                      inView={isInView}
                    />
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
