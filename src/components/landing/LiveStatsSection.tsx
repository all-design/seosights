'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

interface LiveStat {
  label: string
  value: number
  suffix: string
}

const liveStats: LiveStat[] = [
  { label: 'Currently analyzing', value: 243, suffix: ' websites' },
  { label: "Today's new citations", value: 1482, suffix: '' },
  { label: 'Models updated', value: 5, suffix: '' },
]

// easeOutExpo easing function
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function useCountUp(target: number, duration: number, shouldStart: boolean) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    let startTime: number | null = null
    let rafId: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)

      setCurrent(Math.floor(easedProgress * target))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setCurrent(target)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration, shouldStart])

  return current
}

function LiveStatCard({ stat, index, isInView }: { stat: LiveStat; index: number; isInView: boolean }) {
  const countedValue = useCountUp(stat.value, 2000, isInView)
  const formattedValue = new Intl.NumberFormat('en').format(countedValue)

  return (
    <motion.div
      className="relative group rounded-xl border border-emerald-500/10 bg-white/[0.5] dark:bg-white/[0.03] p-6 sm:p-8 transition-all duration-300 hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/[0.04]"
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.14, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Breathing / pulsing number */}
      <motion.div
        className="text-4xl sm:text-5xl font-bold text-emerald-500 mb-2 tabular-nums tracking-tight leading-none"
        animate={isInView ? { opacity: [1, 0.7, 1] } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2.5,
        }}
      >
        {formattedValue}
        {stat.suffix}
      </motion.div>
      <p className="text-sm text-muted-foreground uppercase tracking-wider">
        {stat.label}
      </p>
    </motion.div>
  )
}

export default function LiveStatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-16 sm:py-24 overflow-hidden">
      {/* Light background to differentiate from TrustSection */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.04)_0%,transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading with LIVE badge */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Pulsing green dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest"
            >
              Live
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Live on Seosights right now
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {liveStats.map((stat, i) => (
            <LiveStatCard
              key={stat.label}
              stat={stat}
              index={i}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
