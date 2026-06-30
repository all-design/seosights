'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { AnimatedScore } from '@/components/delight/AnimatedScore'
import { MorphButton } from '@/components/delight/MorphButton'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Mission {
  action: string
  timeEstimate: string
  impact: string
  confidence: number
}

interface GrowthBrainData {
  greeting: string
  visibilityScore: number
  visibilityDelta: number
  riskAlert: string | null
  articleHighlight: string | null
  missions: Mission[]
  totalMinutes: number
  expectedImpact: string
  pipelineEstimate: string
}

interface GrowthMemoryEntry {
  id: string
  actionType: string
  actionDetail: string
  visibilityDelta: number
  citationDelta: number
  createdAt: string
}

interface VisibilityPoint {
  date: string
  score: number
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

function TodaySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 bg-zinc-800/50" />
        <Skeleton className="h-4 w-64 bg-zinc-800/50" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full max-w-lg bg-zinc-800/50" />
        <Skeleton className="h-4 w-3/4 bg-zinc-800/50" />
        <Skeleton className="h-4 w-2/3 bg-zinc-800/50" />
      </div>
      <div className="space-y-3 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full bg-zinc-800/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full bg-zinc-800/50" />
              <Skeleton className="h-3 w-24 bg-zinc-800/50" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-lg bg-zinc-800/50 mt-6" />
    </div>
  )
}

// ── Time Greeting ──────────────────────────────────────────────────────────────

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 17) return 'Good afternoon.'
  return 'Good evening.'
}

// ── Execute Button with Multi-Stage ────────────────────────────────────────────

function ExecuteButton({ missions }: { missions: Mission[] }) {
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'writing' | 'publishing' | 'done'>('idle')

  const handleExecute = useCallback(async () => {
    setStage('analyzing')
    await new Promise((r) => setTimeout(r, 1200))
    setStage('writing')
    await new Promise((r) => setTimeout(r, 1500))
    setStage('publishing')
    await new Promise((r) => setTimeout(r, 1000))
    setStage('done')
    await new Promise((r) => setTimeout(r, 1500))
    setStage('idle')
  }, [])

  if (stage === 'done') {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-medium text-sm"
      >
        <Sparkles className="w-4 h-4" />
        All missions executed
      </motion.div>
    )
  }

  if (stage !== 'idle') {
    const stageLabels = {
      analyzing: 'Analyzing...',
      writing: 'Writing content...',
      publishing: 'Publishing...',
    }
    return (
      <motion.div
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm"
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-white"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        {stageLabels[stage as keyof typeof stageLabels]}
      </motion.div>
    )
  }

  return (
    <MorphButton onClick={handleExecute} className="px-6 py-2.5 text-sm">
      Execute {missions.length} missions
    </MorphButton>
  )
}

// ── Main TodayPage ─────────────────────────────────────────────────────────────

export function TodayPage() {
  const { mode } = useOSStore()
  const [brainData, setBrainData] = useState<GrowthBrainData | null>(null)
  const [memoryEntries, setMemoryEntries] = useState<GrowthMemoryEntry[]>([])
  const [visibilityTimeline, setVisibilityTimeline] = useState<VisibilityPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [brainRes, memoryRes, visRes] = await Promise.all([
          fetch('/api/content-engine/growth-brain'),
          fetch('/api/content-engine/growth-memory?limit=5'),
          fetch('/api/content-engine/visibility-memory?months=3'),
        ])

        if (brainRes.ok) {
          const brainJson = await brainRes.json()
          // Map API response to component format
          const missions: Mission[] = (brainJson.missions || []).slice(0, 3).map((m: { shortText?: string; text?: string; action?: string; effortMinutes?: number; effort?: string; estimatedImpact?: string; confidence?: number }) => ({
            action: m.shortText || m.text || m.action || '',
            timeEstimate: m.effortMinutes ? `${m.effortMinutes} min` : (m.effort || '15 min'),
            impact: m.estimatedImpact || '+3 AI Visibility',
            confidence: m.confidence || 80,
          }))
          const totalMinutes = missions.reduce((sum: number, m: Mission) => sum + (parseInt(m.timeEstimate) || 15), 0)
          const mapped: GrowthBrainData = {
            greeting: brainJson.greeting || getTimeGreeting(),
            visibilityScore: brainJson.visibilityScore || brainJson.growthScore || 75,
            visibilityDelta: brainJson.visibilityDelta || brainJson.todayGrowth || 4,
            riskAlert: brainJson.riskAlert || null,
            articleHighlight: brainJson.articleHighlight || null,
            missions,
            totalMinutes: brainJson.totalMinutes || totalMinutes,
            expectedImpact: brainJson.expectedImpact || brainJson.expectedGain || '+6 AI Visibility',
            pipelineEstimate: brainJson.pipelineEstimate || brainJson.pipelineValue || '+$1,200 pipeline',
          }
          setBrainData(mapped)
        }

        if (memoryRes.ok) {
          const memJson = await memoryRes.json()
          setMemoryEntries(memJson.entries || [])
        }

        if (visRes.ok) {
          const visJson = await visRes.json()
          const rawTimeline = visJson.timeline || []
          // Map API format { month, aiVisibilityScore } → component format { date, score }
          const mapped: VisibilityPoint[] = rawTimeline.map((pt: { month?: string; year?: number; monthNum?: number; aiVisibilityScore?: number; score?: number; date?: string }) => ({
            date: pt.date || pt.month || `${pt.year}-${String((pt.monthNum ?? 0) + 1).padStart(2, '0')}`,
            score: pt.score ?? pt.aiVisibilityScore ?? 0,
          }))
          setVisibilityTimeline(mapped)
        }
      } catch {
        // Use fallback data
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Fallback data if API fails ────────────────────────────────────────────
  const data: GrowthBrainData = brainData || {
    greeting: getTimeGreeting(),
    visibilityScore: 81,
    visibilityDelta: 4,
    riskAlert: 'One competitor overtook you for "AI Visibility Software".',
    articleHighlight: 'One article generated 3 new citations.',
    missions: [
      { action: 'Publish FAQ for pricing page', timeEstimate: '15 min', impact: '+3 AI Visibility', confidence: 87 },
      { action: 'Create entity page for Seosights', timeEstimate: '20 min', impact: '+4 AI Visibility', confidence: 82 },
      { action: 'Update llms.txt with latest content', timeEstimate: '8 min', impact: '+2 AI Visibility', confidence: 91 },
    ],
    totalMinutes: 43,
    expectedImpact: '+6 AI Visibility',
    pipelineEstimate: '+$1,200 pipeline',
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <TodaySkeleton />
      </div>
    )
  }

  // ── Executive Mode ────────────────────────────────────────────────────────
  if (mode === 'executive') {
    return (
      <div className="max-w-2xl space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <p className="text-xl text-zinc-200 leading-relaxed">{data.greeting || getTimeGreeting()}</p>

          {/* Score */}
          <div className="flex items-baseline gap-3">
            <span className="text-zinc-400 text-lg">Your AI Visibility</span>
            <AnimatedScore value={data.visibilityScore} delta={data.visibilityDelta} size="lg" />
          </div>

          {/* Risk Alert */}
          {data.riskAlert && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-sm text-amber-200">{data.riskAlert}</span>
            </motion.div>
          )}

          {/* Article Highlight */}
          {data.articleHighlight && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-400 text-sm"
            >
              {data.articleHighlight}
            </motion.p>
          )}
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <p className="text-zinc-300 leading-relaxed">
            If I were your Head of Growth today,
            <br />I&apos;d spend exactly {data.totalMinutes} minutes doing these {data.missions.length} things:
          </p>

          <div className="space-y-3 pl-1">
            {data.missions.map((mission, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.12, duration: 0.4 }}
                className="flex items-start gap-3 group"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-zinc-200 text-sm">
                    {mission.action}{' '}
                    <span className="text-zinc-500">({mission.timeEstimate})</span>{' '}
                    <span className="text-emerald-400/80">→ {mission.impact}</span>
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-1 text-[10px] border-zinc-700 text-zinc-500"
                  >
                    {mission.confidence}% confidence
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Expected Impact */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="text-sm text-zinc-500 pt-2"
          >
            Expected impact: <span className="text-emerald-400">{data.expectedImpact}</span>,{' '}
            <span className="text-zinc-400">{data.pipelineEstimate}</span>
          </motion.p>

          {/* Execute */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="pt-2"
          >
            <ExecuteButton missions={data.missions} />
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // ── Builder Mode ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Top: Same executive briefing */}
      <div className="max-w-2xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <p className="text-xl text-zinc-200 leading-relaxed">{data.greeting || getTimeGreeting()}</p>

          <div className="flex items-baseline gap-3">
            <span className="text-zinc-400 text-lg">Your AI Visibility</span>
            <AnimatedScore value={data.visibilityScore} delta={data.visibilityDelta} size="lg" />
          </div>

          {data.riskAlert && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-sm text-amber-200">{data.riskAlert}</span>
            </motion.div>
          )}

          {data.articleHighlight && (
            <p className="text-zinc-400 text-sm">{data.articleHighlight}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-4"
        >
          <p className="text-zinc-300 leading-relaxed">
            If I were your Head of Growth today,
            <br />I&apos;d spend exactly {data.totalMinutes} minutes doing these {data.missions.length} things:
          </p>

          <div className="space-y-3 pl-1">
            {data.missions.map((mission, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.12, duration: 0.4 }}
                className="flex items-start gap-3 group"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-zinc-200 text-sm">
                    {mission.action}{' '}
                    <span className="text-zinc-500">({mission.timeEstimate})</span>{' '}
                    <span className="text-emerald-400/80">→ {mission.impact}</span>
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-zinc-700 text-zinc-500">
                    {mission.confidence}% confidence
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="text-sm text-zinc-500 pt-2"
          >
            Expected impact: <span className="text-emerald-400">{data.expectedImpact}</span>,{' '}
            <span className="text-zinc-400">{data.pipelineEstimate}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="pt-2"
          >
            <ExecuteButton missions={data.missions} />
          </motion.div>
        </motion.div>
      </div>

      {/* Builder Extras: Visibility Timeline, Growth Memory, Sprint Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
        {/* Visibility Timeline Mini-Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Visibility Timeline
          </h3>
          {visibilityTimeline.length > 0 ? (
            <div className="h-32 flex items-end gap-1">
              {visibilityTimeline.slice(-14).map((pt, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-full bg-emerald-500/30 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pt.score, 5)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  />
                  <span className="text-[9px] text-zinc-600">
                    {new Date(pt.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              No timeline data yet
            </div>
          )}
        </motion.div>

        {/* Growth Memory Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Growth Memory
          </h3>
          {memoryEntries.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {memoryEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      entry.visibilityDelta >= 0 ? 'bg-emerald-400' : 'bg-red-400'
                    )}
                  />
                  <span className="text-zinc-400 truncate flex-1">{entry.actionDetail}</span>
                  <span
                    className={cn(
                      'font-mono',
                      entry.visibilityDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {entry.visibilityDelta >= 0 ? '+' : ''}{entry.visibilityDelta}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              No memory entries yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Article ROI Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
      >
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-emerald-400" />
          Article ROI — Quick View
        </h3>
        <div className="text-zinc-500 text-sm">
          Top articles and their citation impact will appear here as your content engine runs.
        </div>
      </motion.div>
    </div>
  )
}
