'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'

interface TrustStat {
  label: string
  value: number
  suffix: string
  format: 'number' | 'compact' | 'comma'
}

const trustStats: TrustStat[] = [
  { label: 'AI models tracked', value: 7, suffix: '', format: 'number' },
  { label: 'Prompts analyzed', value: 4200000, suffix: '', format: 'compact' },
  { label: 'Historical responses', value: 19000000, suffix: '', format: 'compact' },
  { label: 'Websites analyzed', value: 18421, suffix: '', format: 'comma' },
  { label: 'Citations tracked', value: 9400000, suffix: '', format: 'compact' },
]

function formatStat(value: number, format: TrustStat['format']): string {
  switch (format) {
    case 'compact':
      return new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' }).format(value)
    case 'comma':
      return new Intl.NumberFormat('en').format(value)
    case 'number':
    default:
      return value.toString()
  }
}

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

function StatCard({ stat, index, isInView }: { stat: TrustStat; index: number; isInView: boolean }) {
  const countedValue = useCountUp(stat.value, 2000, isInView)
  const displayValue = formatStat(countedValue, stat.format)

  return (
    <motion.div
      className="relative group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04]"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="text-5xl sm:text-6xl font-bold text-emerald-400 mb-2 tabular-nums tracking-tight leading-none">
          {displayValue}
          {stat.suffix}
        </div>
        <p className="text-sm text-zinc-400 uppercase tracking-wider">
          {stat.label}
        </p>
      </div>
    </motion.div>
  )
}

export default function TrustSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      {/* Dark background with subtle gradient */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06)_0%,transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          className="text-center mb-14 sm:mb-18"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Why should you trust Seosights?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Massive scale. Real data. Every number is backed by actual platform activity.
          </p>
        </motion.div>

        {/* Stats grid — 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {trustStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              stat={stat}
              index={i}
              isInView={isInView}
            />
          ))}
          {/* Center the last item when it's odd */}
          {trustStats.length % 2 !== 0 && (
            <div className="hidden sm:block" />
          )}
        </div>
      </div>
    </section>
  )
}
