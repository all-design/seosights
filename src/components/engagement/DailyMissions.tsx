'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Target, Check, ChevronDown, Star } from 'lucide-react'

interface MissionStep {
  id: string
  stepOrder: number
  title: string
  rewardText: string
  rewardValue: number
  isCompleted: boolean
}

interface Mission {
  id: string
  title: string
  difficulty: string
  difficultyStars: number
  rewardVisibility: number
  totalSteps: number
  completedSteps: number
  status: string
  steps: MissionStep[]
}

export default function DailyMissions() {
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [completingStep, setCompletingStep] = useState<string | null>(null)

  const fetchMission = useCallback(() => {
    fetch('/api/engagement/missions')
      .then((r) => r.json())
      .then((data) => {
        setMission(data.todayMission ?? null)
      })
      .catch(() => setMission(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchMission()
  }, [fetchMission])

  const handleCompleteStep = async (stepId: string) => {
    if (!mission || completingStep) return
    setCompletingStep(stepId)

    try {
      const res = await fetch(`/api/engagement/missions/${mission.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      })
      const data = await res.json()
      if (data.mission) {
        setMission(data.mission)
      }
    } catch {
      // Silently fail
    } finally {
      setCompletingStep(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-800 rounded" />
          <div className="h-10 bg-slate-800 rounded" />
          <div className="h-10 bg-slate-800 rounded" />
        </div>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Target className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No mission available today.</p>
      </div>
    )
  }

  const allCompleted = mission.status === 'completed'
  const filledStars = mission.difficultyStars

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-100">{mission.title}</h2>
        </div>
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
          +{mission.rewardVisibility} AI Visibility
        </span>
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-2 mt-2 mb-5">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < filledStars
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500">{mission.difficulty}</span>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {mission.steps.map((step, i) => {
          const isLast = i === mission.steps.length - 1
          return (
            <div key={step.id}>
              <motion.button
                onClick={() => !step.isCompleted && handleCompleteStep(step.id)}
                disabled={step.isCompleted || !!completingStep}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  step.isCompleted
                    ? 'bg-emerald-500/5 border border-emerald-500/20'
                    : 'bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 cursor-pointer'
                }`}
                whileTap={!step.isCompleted ? { scale: 0.98 } : undefined}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    step.isCompleted
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-600'
                  }`}
                >
                  {step.isCompleted ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : (
                    completingStep === step.id && (
                      <div className="h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    )
                  )}
                </div>
                <span
                  className={`flex-1 text-left text-sm ${
                    step.isCompleted
                      ? 'text-slate-500 line-through'
                      : 'text-slate-200'
                  }`}
                >
                  {step.title}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    step.isCompleted ? 'text-emerald-500/50' : 'text-emerald-400'
                  }`}
                >
                  {step.rewardText}
                </span>
              </motion.button>

              {/* Arrow connector */}
              {!isLast && (
                <div className="flex justify-center py-1">
                  <ChevronDown className="h-4 w-4 text-slate-700" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mission complete */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center"
        >
          <p className="text-emerald-400 font-bold text-lg">Mission Complete</p>
          <p className="text-emerald-400/80 text-sm mt-1">
            +{mission.rewardVisibility} AI Visibility
          </p>
          <p className="text-slate-500 text-xs mt-2">See what changed tomorrow.</p>
        </motion.div>
      )}
    </div>
  )
}
