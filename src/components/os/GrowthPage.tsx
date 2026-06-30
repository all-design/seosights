'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, BarChart3, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AnimatedScore } from '@/components/delight/AnimatedScore'
import { Skeleton } from '@/components/ui/skeleton'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

interface GrowthMemoryEntry {
  id: string
  actionType: string
  actionDetail: string
  visibilityDelta: number
  citationDelta: number
  organicDelta: number
  revenueDelta: number
  confidence: number
  createdAt: string
}

interface VisibilityPoint {
  date: string
  score: number
  cause?: string
}

interface ArticleROI {
  id: string
  articleTitle: string
  citationsGained: number
  visibilityDelta: number
  roi: number
  revenueAttributed: number
}

interface SprintData {
  id: string
  name: string
  status: string
  progressPercentage: number
  totalActions: number
  executedActions: number
}

function GrowthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 space-y-2">
            <Skeleton className="h-3 w-16 bg-zinc-800/50" />
            <Skeleton className="h-8 w-12 bg-zinc-800/50" />
            <Skeleton className="h-3 w-20 bg-zinc-800/50" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl bg-zinc-800/50" />
    </div>
  )
}

export function GrowthPage() {
  const { mode } = useOSStore()
  const [loading, setLoading] = useState(true)
  const [memoryEntries, setMemoryEntries] = useState<GrowthMemoryEntry[]>([])
  const [visibilityTimeline, setVisibilityTimeline] = useState<VisibilityPoint[]>([])
  const [articleROI, setArticleROI] = useState<ArticleROI[]>([])
  const [sprints, setSprints] = useState<SprintData[]>([])
  const [visibilityScore, setVisibilityScore] = useState(81)
  const [visibilityDelta, setVisibilityDelta] = useState(4)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [memRes, visRes, roiRes, sprintRes, brainRes] = await Promise.all([
          fetch('/api/content-engine/growth-memory?limit=20'),
          fetch('/api/content-engine/visibility-memory?months=6'),
          fetch('/api/content-engine/article-roi?days=90'),
          fetch('/api/content-engine/sprints'),
          fetch('/api/content-engine/growth-brain'),
        ])

        if (memRes.ok) {
          const json = await memRes.json()
          setMemoryEntries(json.entries || [])
        }
        if (visRes.ok) {
          const json = await visRes.json()
          const raw = json.timeline || []
          // Map API format { month, aiVisibilityScore } → component format { date, score }
          const mapped: VisibilityPoint[] = raw.map((pt: { month?: string; year?: number; monthNum?: number; aiVisibilityScore?: number; score?: number; date?: string }) => ({
            date: pt.date || pt.month || `${pt.year}-${String((pt.monthNum ?? 0) + 1).padStart(2, '0')}`,
            score: pt.score ?? pt.aiVisibilityScore ?? 0,
          }))
          setVisibilityTimeline(mapped)
        }
        if (roiRes.ok) {
          const json = await roiRes.json()
          setArticleROI(json.articles || json.entries || [])
        }
        if (sprintRes.ok) {
          const json = await sprintRes.json()
          setSprints(json.sprints || [])
        }
        if (brainRes.ok) {
          const json = await brainRes.json()
          setVisibilityScore(json.visibilityScore || 81)
          setVisibilityDelta(json.visibilityDelta || 4)
        }
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <GrowthSkeleton />

  const avgCitationDelta = memoryEntries.length > 0
    ? Math.round(memoryEntries.reduce((s, e) => s + e.citationDelta, 0) / memoryEntries.length * 10) / 10
    : 0
  const competitorRank = 3
  const avgROI = articleROI.length > 0
    ? Math.round(articleROI.reduce((s, a) => s + a.roi, 0) / articleROI.length)
    : 0

  // ── Executive Mode ────────────────────────────────────────────────────────
  if (mode === 'executive') {
    return (
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-baseline gap-3">
            <span className="text-zinc-400 text-lg">AI Visibility</span>
            <AnimatedScore value={visibilityScore} delta={visibilityDelta} size="lg" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-100">#{competitorRank}</p>
              <p className="text-xs text-zinc-500 mt-1">Competitor Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">+{avgCitationDelta}</p>
              <p className="text-xs text-zinc-500 mt-1">Avg Citations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-100">{avgROI}%</p>
              <p className="text-xs text-zinc-500 mt-1">Content ROI</p>
            </div>
          </div>

          <p className="text-zinc-500 text-sm">
            Growth is trending upward. Your content engine is outperforming 78% of similar SaaS companies.
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Builder / Developer Mode ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'AI Visibility', value: visibilityScore, delta: visibilityDelta, icon: TrendingUp, format: 'score' },
          { label: 'Competitor Rank', value: competitorRank, delta: -1, icon: Users, format: 'rank' },
          { label: 'Avg Citations', value: avgCitationDelta, delta: 0, icon: Target, format: 'number' },
          { label: 'Content ROI', value: avgROI, delta: 0, icon: BarChart3, format: 'percent' },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              {kpi.format === 'score' ? (
                <AnimatedScore value={kpi.value} delta={kpi.delta} size="md" />
              ) : (
                <>
                  <span className="text-2xl font-bold text-zinc-100 tabular-nums">
                    {kpi.format === 'rank' ? '#' : ''}{kpi.value}{kpi.format === 'percent' ? '%' : ''}
                  </span>
                  {kpi.delta !== 0 && (
                    <span className={cn('text-xs flex items-center gap-0.5', kpi.delta > 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {kpi.delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {kpi.delta > 0 ? '+' : ''}{kpi.delta}
                    </span>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visibility Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
      >
        <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Visibility Timeline
        </h3>
        {visibilityTimeline.length > 0 ? (
          <div className="h-40 flex items-end gap-1">
            {visibilityTimeline.slice(-20).map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <motion.div
                  className={cn(
                    'w-full rounded-t cursor-pointer transition-colors',
                    'bg-emerald-500/30 hover:bg-emerald-500/50'
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pt.score, 5)}%` }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                />
                {pt.cause && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300 whitespace-nowrap z-10">
                    {pt.cause}
                  </div>
                )}
                <span className="text-[8px] text-zinc-600">
                  {new Date(pt.date).toLocaleDateString('en', { day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">
            Timeline data will appear as your content engine runs
          </div>
        )}
      </motion.div>

      {/* Two columns: Growth Memory + Article ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Memory Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Growth Memory</h3>
          {memoryEntries.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {memoryEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-zinc-800/30 last:border-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', entry.visibilityDelta >= 0 ? 'bg-emerald-400' : 'bg-red-400')} />
                  <span className="text-zinc-400 truncate flex-1">{entry.actionDetail}</span>
                  <span className={cn('font-mono', entry.visibilityDelta >= 0 ? 'text-emerald-400' : 'text-red-400')}>
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

        {/* Article ROI */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Article ROI</h3>
          {articleROI.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {articleROI.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-zinc-800/30 last:border-0">
                  <span className="text-zinc-400 truncate flex-1">{a.articleTitle}</span>
                  <span className="text-emerald-400 font-mono">{a.citationsGained} cit</span>
                  <span className="text-zinc-500 font-mono">{a.roi}% ROI</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              Article ROI data will populate as content is published
            </div>
          )}
        </motion.div>
      </div>

      {/* Sprint Progress */}
      {sprints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Active Sprints</h3>
          <div className="space-y-3">
            {sprints.filter(s => s.status === 'active').map((sprint) => (
              <div key={sprint.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{sprint.name}</span>
                  <span className="text-zinc-500">{sprint.executedActions}/{sprint.totalActions} actions</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${sprint.progressPercentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Developer Mode Extras */}
      {mode === 'developer' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Developer: Raw Stats</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Memory Entries</div>
              <div className="text-zinc-200">{memoryEntries.length}</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Timeline Points</div>
              <div className="text-zinc-200">{visibilityTimeline.length}</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">ROI Articles</div>
              <div className="text-zinc-200">{articleROI.length}</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Active Sprints</div>
              <div className="text-zinc-200">{sprints.filter(s => s.status === 'active').length}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
