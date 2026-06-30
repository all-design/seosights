'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Clock, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CoachData {
  id: string
  greeting: string
  message: string
  recommendedAction: string
  actionType: string
  estimatedMinutes: number
  estimatedImpact: string
}

export default function AICoach() {
  const [coach, setCoach] = useState<CoachData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/coach')
      .then((r) => r.json())
      .then((data) => setCoach(data.coach ?? null))
      .catch(() => setCoach(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-20 bg-slate-800 rounded-lg mb-3" />
        <div className="h-10 bg-slate-800 rounded w-1/3" />
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No coach recommendation available.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          AI Coach™
        </span>
      </div>

      <h2 className="text-2xl font-bold text-slate-100 mt-3">{coach.greeting}</h2>
      <p className="text-slate-300 text-sm mt-1">{coach.message}</p>

      {/* Recommended action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
      >
        <p className="text-slate-100 font-medium">{coach.recommendedAction}</p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{coach.estimatedMinutes} minutes</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{coach.estimatedImpact}</span>
          </div>
        </div>
      </motion.div>

      <Button className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11">
        Let&apos;s do it
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
