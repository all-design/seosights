'use client'

import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

interface AIWorkingBannerProps {
  activity: {
    opportunitiesFound: number
    pagesImproved: number
    competitorsDropped: number
    signalsDetected: number
    learningConfidenceDelta: number
    decisionsWaiting: number
  } | null
}

export default function AIWorkingBanner({ activity }: AIWorkingBannerProps) {
  const items = [
    { label: 'new opportunities found', value: activity?.opportunitiesFound ?? 0 },
    { label: 'pages improved', value: activity?.pagesImproved ?? 0 },
    { label: 'competitor dropped', value: activity?.competitorsDropped ?? 0 },
    { label: 'Observatory signals detected', value: activity?.signalsDetected ?? 0 },
    { label: 'Learning confidence', value: activity?.learningConfidenceDelta ?? 0, suffix: '%' },
  ].filter((item) => item.value > 0)

  const decisions = activity?.decisionsWaiting ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative group"
    >
      {/* Pulsing emerald border glow */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-emerald-500/20 opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -inset-px rounded-xl animate-pulse bg-emerald-500/5" />

      <div className="relative bg-slate-900/80 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Last 24 hours
        </h3>

        <ul className="space-y-3">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-3 text-sm"
            >
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-slate-300">
                <span className="text-slate-100 font-semibold">{item.value}</span>{' '}
                {item.label}
                {item.suffix && (
                  <span className="text-emerald-400 font-semibold">+{item.value}{item.suffix}</span>
                )}
              </span>
            </motion.li>
          ))}
        </ul>

        {decisions > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-slate-200 font-medium">
              You have{' '}
              <span className="text-emerald-400 font-bold">{decisions} decisions</span> waiting.
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
