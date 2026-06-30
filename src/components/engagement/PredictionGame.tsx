'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Play, CheckCircle2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Prediction {
  id: string
  actionType: string
  prediction: string
  predictedImpact: number
  actualImpact: number | null
  confidence: number
  confidenceAfter: number | null
  status: string
  daysToMeasure: number | null
  executedAt: string | null
}

export default function PredictionGame() {
  const [pending, setPending] = useState<Prediction[]>([])
  const [measured, setMeasured] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [executingId, setExecutingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/engagement/predictions')
      .then((r) => r.json())
      .then((data) => {
        setPending(data.pending ?? [])
        setMeasured(data.recentlyMeasured ?? [])
      })
      .catch(() => {
        setPending([])
        setMeasured([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExecute = async (id: string) => {
    setExecutingId(id)
    try {
      const res = await fetch(`/api/engagement/predictions/${id}/execute`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.prediction) {
        setPending((prev) => prev.filter((p) => p.id !== id))
        setMeasured((prev) => [data.prediction, ...prev])
      }
    } catch {
      // Silently fail
    } finally {
      setExecutingId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-4">
          <div className="h-24 bg-slate-800 rounded-lg" />
          <div className="h-24 bg-slate-800 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Brain className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          AI Predictions
        </span>
      </div>

      {/* Pending predictions */}
      {pending.map((pred, i) => (
        <motion.div
          key={pred.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="mb-4 p-4 rounded-lg border border-slate-700/50 bg-slate-800/30"
        >
          <p className="text-slate-200 text-sm font-medium mb-2">{pred.prediction}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">
                AI confidence:{' '}
                <span className="text-slate-300 font-semibold">{pred.confidence}%</span>
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => handleExecute(pred.id)}
              disabled={!!executingId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
            >
              {executingId === pred.id ? (
                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </motion.div>
      ))}

      {/* Measuring predictions */}
      {measured
        .filter((p) => p.status === 'measuring' || p.status === 'executed')
        .map((pred) => {
          const daysElapsed = pred.executedAt
            ? Math.floor(
                (Date.now() - new Date(pred.executedAt).getTime()) / 86400000
              ) + 1
            : 1
          const totalDays = pred.daysToMeasure || 3
          const progress = Math.min((daysElapsed / totalDays) * 100, 100)

          return (
            <div
              key={pred.id}
              className="mb-4 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5"
            >
              <p className="text-slate-200 text-sm font-medium mb-2">{pred.prediction}</p>
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                <span className="font-medium">Measuring...</span>
                <span className="text-amber-400/70">(Day {daysElapsed} of {totalDays})</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-slate-800" />
            </div>
          )
        })}

      {/* Past results */}
      {measured
        .filter((p) => p.status === 'correct' || p.status === 'incorrect')
        .map((pred) => (
          <div
            key={pred.id}
            className="mb-3 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-200 text-sm font-medium">{pred.prediction}</p>
                <p className="text-emerald-400 text-xs mt-1">
                  Prediction: <span className="font-bold">Correct</span>. Actual: +{pred.actualImpact}
                </p>
                {pred.confidenceAfter && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    Confidence updated: {pred.confidence}% →{' '}
                    <span className="text-emerald-400">{pred.confidenceAfter}%</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

      {pending.length === 0 && measured.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">No predictions yet.</p>
      )}
    </div>
  )
}
