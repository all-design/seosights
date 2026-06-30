'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface SeasonData {
  id: string
  seasonName: string
  challenge: string
  currentPercentile: number
  targetPercentile: number
  currentVisibility: number
  targetVisibility: number
  participants: number
  startDate: string
  endDate: string
  status: string
}

export default function AISeason() {
  const [season, setSeason] = useState<SeasonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/season')
      .then((r) => r.json())
      .then((data) => setSeason(data.season ?? null))
      .catch(() => setSeason(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-800 rounded w-2/3 mb-3" />
        <div className="h-4 bg-slate-800 rounded w-full mb-2" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
      </div>
    )
  }

  if (!season) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No active season.</p>
      </div>
    )
  }

  const progress =
    ((season.currentVisibility - 0) / (season.targetVisibility - 0)) * 100
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(season.endDate).getTime() - Date.now()) / 86400000
    )
  )

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calendar className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          AI Season™
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-100">{season.seasonName}</h2>
      <p className="text-slate-300 text-sm mt-1">{season.challenge}</p>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs text-slate-400">
            {season.currentPercentile}th → {season.targetPercentile}th percentile
          </span>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-2.5 bg-slate-800" />
      </div>

      {/* Visibility target */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-100">
            {season.currentVisibility}
          </span>
          <span className="text-slate-500">→</span>
          <span className="text-lg text-emerald-400 font-semibold">
            {season.targetVisibility}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs">AI Visibility</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase">Participants</span>
          </div>
          <span className="text-lg font-bold text-slate-200">{season.participants}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase">Remaining</span>
          </div>
          <span className="text-lg font-bold text-slate-200">{daysRemaining} days</span>
        </div>
      </div>
    </div>
  )
}
