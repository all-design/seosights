'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Loader2 } from 'lucide-react'

interface CountdownItem {
  id: string
  label: string
  countdownType: string
  targetTime: string
  remainingMs: number
  remainingHuman: string
  remainingHours: number
  remainingMinutes: number
  remainingSeconds: number
}

export default function WaitingMechanic() {
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  // Fetch countdowns
  useEffect(() => {
    fetch('/api/engagement/countdowns')
      .then((r) => r.json())
      .then((data) => setCountdowns(data.countdowns ?? []))
      .catch(() => setCountdowns([]))
      .finally(() => setLoading(false))
  }, [])

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getRemaining = (cd: CountdownItem) => {
    const target = new Date(cd.targetTime).getTime()
    const diff = Math.max(0, target - now)
    if (diff <= 0) return { display: 'Now', hours: 0, minutes: 0, urgent: false }
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const urgent = diff < 20 * 60000 // Less than 20 minutes
    let display = ''
    if (hours > 0) display = `${hours}h`
    if (minutes > 0) display += (display ? ' ' : '') + `${minutes}m`
    if (!display) display = '<1m'
    return { display, hours, minutes, urgent }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (countdowns.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No active countdowns.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          Waiting Mechanic™
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {countdowns.map((cd, i) => {
          const remaining = getRemaining(cd)
          const isCrawl = cd.countdownType === 'next_crawl'

          return (
            <motion.div
              key={cd.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative p-4 rounded-lg border ${
                remaining.urgent
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-slate-800/30 border-slate-700/50'
              }`}
            >
              {/* Pulse for urgent items */}
              {remaining.urgent && (
                <div className="absolute inset-0 rounded-lg animate-pulse bg-emerald-500/5" />
              )}

              <div className="relative">
                <p className="text-xs text-slate-500 mb-1">{cd.label}</p>
                <p
                  className={`text-2xl font-bold ${
                    remaining.urgent ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {remaining.display}
                </p>
                {isCrawl && remaining.urgent && (
                  <div className="flex items-center gap-1 mt-1">
                    <Loader2 className="h-3 w-3 text-emerald-400 animate-spin" />
                    <span className="text-[10px] text-emerald-400">Imminent</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
