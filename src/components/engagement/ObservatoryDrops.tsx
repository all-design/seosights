'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, ExternalLink } from 'lucide-react'

interface Drop {
  id: string
  headline: string
  body: string
  aiModel: string
  changeType: string
  significance: number
  createdAt: string
}

export default function ObservatoryDrops() {
  const [drops, setDrops] = useState<Drop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/drops')
      .then((r) => r.json())
      .then((data) => setDrops(data.drops ?? []))
      .catch(() => setDrops([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-slate-800 rounded-lg" />
          <div className="h-20 bg-slate-800 rounded-lg" />
        </div>
      </div>
    )
  }

  if (drops.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Zap className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No drops right now. Check back later.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="h-5 w-5 text-amber-400" />
        <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
          Observatory Drops™
        </span>
        <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full font-bold uppercase">
          Breaking
        </span>
      </div>

      <div className="space-y-3">
        {drops.map((drop, i) => {
          const isHigh = drop.significance >= 0.8

          return (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-lg border ${
                isHigh
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-amber-500/20 bg-amber-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isHigh
                          ? 'bg-red-400/10 text-red-400'
                          : 'bg-amber-400/10 text-amber-400'
                      }`}
                    >
                      {drop.aiModel}
                    </span>
                    <span className="text-[10px] text-slate-600 uppercase">
                      {drop.changeType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm font-medium">{drop.headline}</p>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{drop.body}</p>
                </div>
                <button className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
