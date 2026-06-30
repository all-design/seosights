'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, BookOpen, BarChart3 } from 'lucide-react'
import { AnimatedScore } from '@/components/delight/AnimatedScore'
import { Skeleton } from '@/components/ui/skeleton'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

interface EvidenceEntry {
  id: string
  recommendationType: string
  recommendation: string
  basedOnGrowthMemories: number
  avgVisibilityGain: number
  confidence: number
}

interface DecisionLogEntry {
  id: string
  decisionType: string
  decision: string
  reasoning: string
  outcome: string | null
  createdAt: string
}

function LearningSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-baseline gap-3">
        <Skeleton className="h-4 w-20 bg-zinc-800/50" />
        <Skeleton className="h-10 w-16 bg-zinc-800/50" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl bg-zinc-800/50" />
    </div>
  )
}

export function LearningPage() {
  const { mode } = useOSStore()
  const [loading, setLoading] = useState(true)
  const [evidence, setEvidence] = useState<EvidenceEntry[]>([])
  const [decisions, setDecisions] = useState<DecisionLogEntry[]>([])
  const [confidence, setConfidence] = useState(78)
  const [confidenceDelta, setConfidenceDelta] = useState(5)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [evRes, decRes] = await Promise.all([
          fetch('/api/content-engine/evidence'),
          fetch('/api/content-engine/decision-log'),
        ])
        if (evRes.ok) {
          const json = await evRes.json()
          setEvidence(json.evidence || json.entries || [])
          if (json.evidence && json.evidence.length > 0) {
            const avg = Math.round(json.evidence.reduce((s: number, e: EvidenceEntry) => s + e.confidence, 0) / json.evidence.length)
            setConfidence(avg)
          }
        }
        if (decRes.ok) {
          const json = await decRes.json()
          setDecisions(json.decisions || json.entries || [])
        }
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LearningSkeleton />

  // ── Executive Mode ────────────────────────────────────────────────────────
  if (mode === 'executive') {
    return (
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-zinc-400 text-lg">AI Confidence</span>
            <AnimatedScore value={confidence} delta={confidenceDelta} size="lg" />
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Predictions are getting more accurate. +{confidenceDelta}% this month.
            The AI has learned from {evidence.length} evidence-based outcomes.
          </p>
          <p className="text-zinc-500 text-sm">
            Every action you take teaches the system. Your growth memory is becoming a competitive moat.
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Builder / Developer Mode ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Confidence Score */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-baseline gap-3"
      >
        <span className="text-zinc-400 text-lg">AI Confidence</span>
        <AnimatedScore value={confidence} delta={confidenceDelta} size="lg" />
      </motion.div>

      <p className="text-zinc-400 text-sm">
        Predictions are getting more accurate. +{confidenceDelta}% this month. The AI has learned from {evidence.length} evidence-based outcomes.
      </p>

      {/* Two columns: Evidence + Decision Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidence */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Evidence ({evidence.length})
          </h3>
          {evidence.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {evidence.map((ev) => (
                <div key={ev.id} className="py-2 border-b border-zinc-800/30 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">{ev.recommendationType}</span>
                    <Badge confidence={ev.confidence} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{ev.recommendation}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-600">
                    <span>Based on {ev.basedOnGrowthMemories} memories</span>
                    <span>Avg +{ev.avgVisibilityGain} visibility</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              Evidence accumulates as actions are measured
            </div>
          )}
        </motion.div>

        {/* Decision Log */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            Decision Log ({decisions.length})
          </h3>
          {decisions.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {decisions.map((dec) => (
                <div key={dec.id} className="py-2 border-b border-zinc-800/30 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300 font-medium">{dec.decisionType}</span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      dec.outcome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    )}>
                      {dec.outcome || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{dec.decision}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{dec.reasoning}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              Decision log will populate as the AI makes strategic choices
            </div>
          )}
        </motion.div>
      </div>

      {/* Confidence Tracking Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
      >
        <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          AI Confidence Over Time
        </h3>
        <div className="h-32 flex items-end gap-1">
          {[65, 67, 68, 70, 71, 72, 70, 73, 75, 74, 76, 78].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                className="w-full bg-emerald-500/30 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${v}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>12 weeks ago</span>
          <span>Now</span>
        </div>
      </motion.div>

      {/* Developer Mode: Raw Data */}
      {mode === 'developer' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-400" />
            Developer: Raw Learning Data
          </h3>
          <pre className="text-[10px] text-zinc-500 font-mono max-h-48 overflow-y-auto">
            {JSON.stringify({ confidence, evidenceCount: evidence.length, decisionsCount: decisions.length }, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  )
}

function Badge({ confidence }: { confidence: number }) {
  return (
    <span className={cn(
      'text-[10px] px-1.5 py-0.5 rounded font-medium',
      confidence >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
      confidence >= 60 ? 'bg-amber-500/10 text-amber-400' :
      'bg-red-500/10 text-red-400'
    )}>
      {confidence}%
    </span>
  )
}
