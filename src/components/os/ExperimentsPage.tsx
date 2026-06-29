'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, Play, Pause, CheckCircle2, BarChart3, Beaker } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

interface Experiment {
  id: string
  name: string
  type: string
  status: 'active' | 'completed' | 'paused' | 'draft'
  hypothesis: string
  progress: number
  results?: string
  createdAt: string
}

interface Sprint {
  id: string
  name: string
  status: string
  progressPercentage: number
  totalActions: number
  executedActions: number
}

function ExperimentsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 space-y-2">
            <Skeleton className="h-3 w-20 bg-zinc-800/50" />
            <Skeleton className="h-8 w-12 bg-zinc-800/50" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl bg-zinc-800/50" />
    </div>
  )
}

export function ExperimentsPage() {
  const { mode } = useOSStore()
  const [loading, setLoading] = useState(true)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [experiments] = useState<Experiment[]>([
    {
      id: 'exp-1',
      name: 'FAQ Schema Impact Test',
      type: 'a_b_test',
      status: 'active',
      hypothesis: 'Adding FAQ schema to pricing pages increases AI citation rate by 20%',
      progress: 65,
      results: 'Citation rate +18% so far',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'exp-2',
      name: 'Entity Page Format',
      type: 'a_b_test',
      status: 'active',
      hypothesis: 'Structured entity pages outperform blog-style pages for AI recommendations',
      progress: 40,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'exp-3',
      name: 'llms.txt Full vs Minimal',
      type: 'a_b_test',
      status: 'completed',
      hypothesis: 'Comprehensive llms.txt increases Perplexity citations',
      progress: 100,
      results: 'Perplexity citations +35% — Winner: Full format',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/content-engine/sprints')
        if (res.ok) {
          const json = await res.json()
          setSprints(json.sprints || [])
        }
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <ExperimentsSkeleton />

  const activeExperiments = experiments.filter(e => e.status === 'active').length
  const activeSprints = sprints.filter(s => s.status === 'active')
  const latestSprintProgress = activeSprints.length > 0 ? activeSprints[0].progressPercentage : 0

  // ── Executive Mode ────────────────────────────────────────────────────────
  if (mode === 'executive') {
    return (
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-zinc-200 text-lg">
            {activeExperiments} active experiment{activeExperiments !== 1 ? 's' : ''}.
            {activeSprints.length > 0 && ` Sprint ${activeSprints.length}: ${latestSprintProgress}% complete.`}
          </p>
          <p className="text-zinc-500 text-sm">
            The AI runs experiments automatically. Each test teaches the system what works best for your brand.
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Builder / Developer Mode ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Experiments', value: activeExperiments, icon: Beaker, color: 'text-emerald-400' },
          { label: 'Completed', value: experiments.filter(e => e.status === 'completed').length, icon: CheckCircle2, color: 'text-zinc-400' },
          { label: 'Active Sprints', value: activeSprints.length, icon: Play, color: 'text-amber-400' },
          { label: 'Sprint Progress', value: `${latestSprintProgress}%`, icon: BarChart3, color: 'text-emerald-400' },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={cn('w-3.5 h-3.5', kpi.color)} />
              <span className="text-xs text-zinc-500">{kpi.label}</span>
            </div>
            <span className="text-2xl font-bold text-zinc-100 tabular-nums">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Two columns: A/B Tests + Sprints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A/B Tests */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            A/B Tests
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {experiments.map((exp) => (
              <div key={exp.id} className="py-3 border-b border-zinc-800/30 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">{exp.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      exp.status === 'active' ? 'border-emerald-700 text-emerald-400' :
                      exp.status === 'completed' ? 'border-zinc-600 text-zinc-400' :
                      'border-amber-700 text-amber-400'
                    )}
                  >
                    {exp.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-zinc-500 mb-2">{exp.hypothesis}</p>
                {exp.status === 'active' && (
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${exp.progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                )}
                {exp.results && (
                  <p className="text-[10px] text-emerald-400 mt-1">{exp.results}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Autonomous Sprints */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            Autonomous Sprints
          </h3>
          {activeSprints.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {activeSprints.map((sprint) => (
                <div key={sprint.id} className="py-3 border-b border-zinc-800/30 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-300">{sprint.name}</span>
                    <span className="text-[10px] text-zinc-500">
                      {sprint.executedActions}/{sprint.totalActions} actions
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${sprint.progressPercentage}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
                      <Pause className="w-3 h-3 inline mr-1" />
                      Pause
                    </button>
                    <span className="text-[10px] text-zinc-600">{sprint.progressPercentage}% complete</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Default sprint visualization */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">Sprint 25 — Entity Build-Out</span>
                  <span className="text-[10px] text-zinc-500">43% complete</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '43%' }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <div className="py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">Sprint 24 — Citation Sprint</span>
                  <span className="text-[10px] text-emerald-400">Completed ✓</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/50 rounded-full w-full" />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Lab Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
      >
        <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <Beaker className="w-4 h-4 text-amber-400" />
          Lab — Propose New Experiment
        </h3>
        <p className="text-zinc-500 text-xs mb-3">
          The AI can design and run experiments to test different content strategies. Each experiment teaches the system what works best.
        </p>
        <button className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
          Generate Experiment
        </button>
      </motion.div>

      {/* Developer Mode */}
      {mode === 'developer' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Developer: Experiment Configuration</h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Auto-assign</div>
              <div className="text-zinc-200">enabled</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Min sample size</div>
              <div className="text-zinc-200">3 memories</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Confidence threshold</div>
              <div className="text-zinc-200">75%</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Sprint auto-advance</div>
              <div className="text-zinc-200">true</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
