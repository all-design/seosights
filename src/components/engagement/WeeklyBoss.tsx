'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, FileText } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface WeeklyMissionData {
  id: string
  title: string
  targetValue: number
  currentValue: number
  unit: string
  status: string
  rewardType: string
  weekEnd: string
}

export default function WeeklyBoss() {
  const [mission, setMission] = useState<WeeklyMissionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/dashboard')
      .then((r) => r.json())
      .then((data) => setMission(data.weeklyMission ?? null))
      .catch(() => setMission(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-800 rounded w-full mb-2" />
        <div className="h-4 bg-slate-800 rounded w-1/4" />
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Trophy className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No weekly mission this week.</p>
      </div>
    )
  }

  const progress = Math.min(
    (mission.currentValue / mission.targetValue) * 100,
    100
  )
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(mission.weekEnd).getTime() - Date.now()) / 86400000
    )
  )

  // Circular progress
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          Weekly Mission
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-800"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className="text-emerald-500"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-100">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1">
          <h3 className="text-slate-100 font-semibold text-sm mb-2">
            {mission.title}
          </h3>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-slate-100">{mission.currentValue}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 text-sm">{mission.targetValue} AI Visibility</span>
          </div>

          <Progress value={progress} className="h-2 bg-slate-800 mb-3" />

          {/* Reward */}
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">
              Reward: <span className="text-emerald-400 capitalize">{mission.rewardType.replace(/_/g, ' ')}</span>
            </span>
          </div>

          {/* Days remaining */}
          <p className="text-slate-600 text-xs">
            <span className="text-slate-400">{daysRemaining} days</span> remaining this week
          </p>
        </div>
      </div>
    </div>
  )
}
