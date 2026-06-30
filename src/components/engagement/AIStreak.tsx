'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, AlertTriangle } from 'lucide-react'

export default function AIStreak() {
  const [streak, setStreak] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/streak')
      .then((r) => r.json())
      .then((data) => setStreak(data.streak ?? null))
      .catch(() => setStreak(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-20 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-6 bg-slate-800 rounded w-2/3" />
      </div>
    )
  }

  if (!streak) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Flame className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No streak data yet.</p>
      </div>
    )
  }

  const current = (streak.currentStreak as number) || 0
  const best = (streak.bestStreak as number) || 0
  const endsToday = streak.endsToday as boolean

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          AI Streak™
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-baseline gap-2">
        <span className="text-7xl font-bold text-emerald-400 leading-none">{current}</span>
        <span className="text-slate-500 text-lg">days</span>
      </div>

      <p className="text-slate-300 mt-2 text-sm">
        You have improved your AI Visibility
      </p>
      <p className="text-slate-400 text-sm">days in a row.</p>

      {/* Warning if streak ends today */}
      {endsToday && (
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-4 flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        >
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-amber-400 text-sm font-medium">Your streak ends today.</span>
        </motion.div>
      )}

      {/* Best streak */}
      <p className="text-slate-600 text-xs mt-4">
        Best: <span className="text-slate-400">{best} days</span>
      </p>

      {/* Day dots */}
      <div className="flex gap-1.5 mt-4 flex-wrap">
        {Array.from({ length: Math.min(current, 30) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="h-3 w-3 rounded-full bg-emerald-500/80"
          />
        ))}
        {Array.from({ length: Math.max(0, 30 - current) }).map((_, i) => (
          <div key={`empty-${i}`} className="h-3 w-3 rounded-full bg-slate-800" />
        ))}
      </div>
    </div>
  )
}
