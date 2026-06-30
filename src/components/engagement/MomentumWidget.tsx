'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

interface MomentumWidgetProps {
  momentum: {
    momentumScore: number
    previousScore: number
    daysActive: number
    bestStreak: number
  } | null
}

export default function MomentumWidget({ momentum }: MomentumWidgetProps) {
  const score = momentum?.momentumScore ?? 0
  const previousScore = momentum?.previousScore ?? 0
  const daysActive = momentum?.daysActive ?? 0
  const delta = score - previousScore
  const isHigh = score >= 70

  return (
    <div className="relative">
      {/* Green glow effect for high momentum */}
      {isHigh && (
        <div className="absolute inset-0 rounded-xl bg-emerald-500/5 blur-xl" />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative bg-slate-900/50 border rounded-xl p-8 ${
          isHigh ? 'border-emerald-500/30' : 'border-slate-800'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
                Momentum
              </span>
            </div>

            {/* THE HERO NUMBER */}
            <div className="flex items-baseline gap-2">
              <span className="text-8xl font-bold text-slate-100 leading-none tracking-tight">
                {score}
              </span>
              <span className="text-3xl font-semibold text-slate-400">%</span>
            </div>

            <p className="text-slate-400 mt-3 text-sm">
              You have built momentum for{' '}
              <span className="text-slate-200 font-medium">{daysActive} days</span>.
            </p>

            {/* Delta */}
            {delta !== 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`text-sm font-semibold ${
                    delta > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {delta > 0 ? '+' : ''}
                  {delta}
                </span>
                <span className="text-slate-500 text-sm">from yesterday</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className={`h-full rounded-full ${
                isHigh ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-600">0%</span>
            <span className="text-[10px] text-slate-600">100%</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
