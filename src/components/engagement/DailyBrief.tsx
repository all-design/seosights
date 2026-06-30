'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, ArrowRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DailyBrief() {
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/brief')
      .then((r) => r.json())
      .then((data) => {
        setBrief(data.brief ?? null)
      })
      .catch(() => setBrief(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-6 bg-slate-800 rounded w-2/3" />
          <div className="h-6 bg-slate-800 rounded w-1/2" />
          <div className="h-6 bg-slate-800 rounded w-3/5" />
        </div>
      </div>
    )
  }

  if (!brief) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Sun className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No brief available yet.</p>
      </div>
    )
  }

  const greeting = (brief.greeting as string) || 'Good morning.'
  const h1 = brief.headline1 as string
  const h2 = brief.headline2 as string
  const h3 = brief.headline3 as string
  const minutes = brief.estimatedMinutes as number
  const delta = brief.aiVisibilityDelta as number

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sun className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          Daily AI Brief™
        </span>
      </div>

      <h2 className="text-2xl font-bold text-slate-100 mt-3">{greeting}</h2>

      {/* Headlines */}
      <div className="mt-5 space-y-3">
        {[h1, h2, h3].filter(Boolean).map((headline, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              {i + 1}
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">{headline}</p>
          </motion.div>
        ))}
      </div>

      {/* Estimated time & delta */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          Estimated time: <span className="text-slate-300 font-medium">{minutes} minutes</span>
        </p>
        {delta > 0 && (
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">+{delta} overnight</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <Button className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11">
        Start Mission
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
