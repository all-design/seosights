'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Lock, Unlock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MysteryBoxData {
  id: string
  teaserText: string
  revealedText: string
  isRevealed: boolean
  category: string
  significance: number
}

export default function MysteryBox() {
  const [box, setBox] = useState<MysteryBoxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [localRevealed, setLocalRevealed] = useState(false)

  useEffect(() => {
    fetch('/api/engagement/dashboard')
      .then((r) => r.json())
      .then((data) => setBox(data.mysteryBox ?? null))
      .catch(() => setBox(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-40 bg-slate-800 rounded-lg" />
      </div>
    )
  }

  if (!box) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Gift className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No mystery box available.</p>
      </div>
    )
  }

  const significanceLabel =
    box.significance >= 0.8 ? 'High' : box.significance >= 0.5 ? 'Medium' : 'Low'
  const significanceColor =
    box.significance >= 0.8
      ? 'text-amber-400 bg-amber-400/10'
      : box.significance >= 0.5
        ? 'text-emerald-400 bg-emerald-400/10'
        : 'text-slate-400 bg-slate-400/10'

  const isRevealed = box.isRevealed || localRevealed

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Gift className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          Mystery Box™
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Lock className="h-7 w-7 text-slate-500" />
            </div>

            <p className="text-slate-300 text-sm mb-3">{box.teaserText}</p>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                {box.category}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${significanceColor}`}>
                {significanceLabel}
              </span>
            </div>

            <Button
              onClick={() => setLocalRevealed(true)}
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Peek Inside
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-center"
          >
            <motion.div
              initial={{ rotate: -15, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
            >
              <Unlock className="h-7 w-7 text-emerald-400" />
            </motion.div>

            <p className="text-emerald-400 font-bold text-lg">{box.revealedText}</p>
            <p className="text-slate-500 text-xs mt-2">The mystery has been revealed.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
