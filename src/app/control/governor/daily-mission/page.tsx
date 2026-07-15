'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardList, Clock, Puzzle, FileText, FlaskConical, BookOpen,
  GitPullRequest, Target, Zap, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, Calendar, Activity, ChevronRight, Sparkles, ShieldCheck,
  History,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface DailyMissionData {
  id: string
  date: string
  title: string
  description?: string
  priority: string
  status: string
  source?: string
  budgetTokens: number
  budgetMinutes: number
  result?: string
  completedAt?: string
  createdAt: string
  tasks?: FactoryTaskInMission[]
}

interface FactoryTaskInMission {
  id: string
  type: string
  title: string
  description?: string
  status: string
  priority: string
  assignee?: string
  confidence?: number
  impactScore?: number
  estimatedHours?: number
  createdAt: string
}

interface ScheduleJob {
  id: string
  name: string
  systemName: string
  scheduledTime: string
  dependsOn?: string
  condition?: string
  status: string
  reasoning?: string
  scheduledDate: string
  startedAt?: string
  completedAt?: string
  duration?: number
  result?: string
}

interface ScheduleData {
  jobs: ScheduleJob[]
  date: string
  totalJobs: number
  completed: number
  running: number
  pending: number
  failed: number
}

// ─── Static Architecture Data ────────────────────────────

const BUDGET_CONSTRAINTS = [
  { id: 'bc-1', icon: 'clock' as const, label: 'Maximum Engineering Budget', value: '4 hours', description: 'Total time the Engineering Engine may spend today' },
  { id: 'bc-2', icon: 'puzzle' as const, label: 'Maximum New Components', value: '2', description: 'No more than 2 new component files created' },
  { id: 'bc-3', icon: 'file' as const, label: 'Maximum New Pages', value: '5', description: 'No more than 5 new routes added' },
  { id: 'bc-4', icon: 'flask' as const, label: 'Must Run: Full QA', value: 'Required', description: 'Full QA Engine validation before merge' },
  { id: 'bc-5', icon: 'book' as const, label: 'Must Update: Documentation', value: 'Required', description: 'Documentation Engine must rebuild docs' },
  { id: 'bc-6', icon: 'pr' as const, label: 'Must Prepare: PR', value: 'Wait for approval', description: 'Prepare PR but do NOT auto-merge — wait for human approval' },
]

const MISSION_RULES = [
  'Implement only if confidence >0.8',
  'Find the highest-impact improvement',
  'No new features unless Priority 1-4 are exhausted',
  'Must improve at least one measurable KPI',
  'Must pass all Quality Gates',
]

// ─── Helpers ─────────────────────────────────────────────

function budgetIconConfig(icon: 'clock' | 'puzzle' | 'file' | 'flask' | 'book' | 'pr') {
  switch (icon) {
    case 'clock': return { icon: Clock, color: 'text-emerald-400' }
    case 'puzzle': return { icon: Puzzle, color: 'text-emerald-400' }
    case 'file': return { icon: FileText, color: 'text-emerald-400' }
    case 'flask': return { icon: FlaskConical, color: 'text-amber-400' }
    case 'book': return { icon: BookOpen, color: 'text-amber-400' }
    case 'pr': return { icon: GitPullRequest, color: 'text-cyan-400' }
  }
}

function candidateStatusConfig(status: string) {
  const lower = status.toLowerCase()
  if (lower.includes('approved') || lower.includes('done') || lower.includes('completed') || lower.includes('deployed'))
    return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Approved' }
  if (lower.includes('blocked') || lower.includes('rejected') || lower.includes('failed'))
    return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Blocked' }
  if (lower.includes('progress') || lower.includes('running') || lower.includes('implement'))
    return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Activity, label: 'In Progress' }
  return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Pending' }
}

function scheduleStatusConfig(status: string) {
  const lower = status.toLowerCase()
  if (lower.includes('completed') || lower.includes('done'))
    return { color: 'text-emerald-400', dot: 'bg-emerald-400', ring: 'border-emerald-500/40 bg-emerald-500/10' }
  if (lower.includes('running') || lower.includes('progress'))
    return { color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', ring: 'border-cyan-500/40 bg-cyan-500/10' }
  if (lower.includes('failed'))
    return { color: 'text-red-400', dot: 'bg-red-400', ring: 'border-red-500/40 bg-red-500/10' }
  return { color: 'text-slate-500', dot: 'bg-slate-600', ring: 'border-slate-700 bg-slate-800/30' }
}

function impactColor(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 7) return 'text-cyan-400'
  if (score >= 6) return 'text-amber-400'
  return 'text-red-400'
}

function confidenceColor(score: number): string {
  if (score >= 0.9) return 'text-emerald-400'
  if (score >= 0.8) return 'text-cyan-400'
  return 'text-red-400'
}

function budgetBarColor(used: number, total: number): string {
  const ratio = total > 0 ? used / total : 0
  if (ratio >= 0.9) return 'from-red-500/60 to-red-500'
  if (ratio >= 0.7) return 'from-amber-500/60 to-amber-500'
  return 'from-emerald-500/60 to-emerald-500'
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return dateStr
  }
}

// ─── Main Component ──────────────────────────────────────

export default function DailyMissionPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white mb-2">Failed to load Daily Mission data</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-sm"
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    )
  }

  // Extract data from unified API response
  const factory = data?.factory || {}
  const mission: DailyMissionData | null = factory.todayMission || null
  const scheduleSummary = factory.scheduleSummary || { totalJobs: 0, completed: 0, running: 0, pending: 0, failed: 0 }
  const schedule: ScheduleData | null = {
    jobs: factory.scheduleJobs || [],
    date: new Date().toISOString().split('T')[0],
    ...scheduleSummary,
  }

  // Derive pipeline steps from schedule jobs
  const pipelineSteps = schedule?.jobs?.slice(0, 8).map((job, idx) => ({
    id: job.id,
    time: job.scheduledTime,
    label: job.name,
    status: job.status.toLowerCase().includes('completed') || job.status.toLowerCase().includes('done')
      ? 'done' as const
      : job.status.toLowerCase().includes('running') || job.status.toLowerCase().includes('progress')
        ? 'in-progress' as const
        : 'pending' as const,
  })) ?? []

  // Mission tasks as candidates
  const candidates = mission?.tasks ?? []

  // Budget trackers from mission
  const budgetTrackers = [
    { id: 'bt-1', label: 'Minutes Used', used: mission ? Math.min(mission.budgetMinutes, 240) : 0, total: 240, unit: 'min' },
    { id: 'bt-2', label: 'Tokens Used', used: mission?.budgetTokens ?? 0, total: Math.max(mission?.budgetTokens ?? 0, 1000), unit: '' },
  ]

  const approvedCount = candidates.filter(c => {
    const s = c.status.toLowerCase()
    return s.includes('approved') || s.includes('done') || s.includes('completed')
  }).length
  const pendingCount = candidates.filter(c => {
    const s = c.status.toLowerCase()
    return s.includes('pending') || s.includes('progress') || s.includes('implement')
  }).length
  const blockedCount = candidates.filter(c => {
    const s = c.status.toLowerCase()
    return s.includes('blocked') || s.includes('rejected') || s.includes('failed')
  }).length

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Mission</h1>
            <p className="text-slate-400 text-sm">Level 3 — Today&apos;s Directive</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            {mission ? `Generated ${timeAgo(mission.createdAt)}` : 'Not generated yet'}
          </div>
          {mission && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">{mission.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Today's Mission Card — Hero
          ═══════════════════════════════════════════════════════ */}
      {mission ? (
        <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Today&apos;s Mission</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  {mission.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {todayDate}
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Goal</div>
              <div className="text-sm font-semibold text-white">{mission.title}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Priority</div>
              <div className="text-sm font-semibold text-emerald-400">{mission.priority}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Source</div>
              <div className="text-sm font-semibold text-white">{mission.source || 'Governor'}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-400">{mission.status}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-500/5 border border-slate-800 rounded-xl p-8 text-center">
          <ClipboardList className="w-10 h-10 text-emerald-400/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No mission for today</h3>
          <p className="text-sm text-slate-400">A daily mission will be generated by the scheduler each morning at 06:00.</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          3. Budget Constraints
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Budget Constraints
          <span className="ml-auto text-[10px] text-slate-500">{BUDGET_CONSTRAINTS.length} hard limits</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUDGET_CONSTRAINTS.map((constraint) => {
            const iconCfg = budgetIconConfig(constraint.icon)
            const Icon = iconCfg.icon
            return (
              <div
                key={constraint.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-4 h-4 ${iconCfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{constraint.label}</div>
                    <div className="text-sm font-bold text-white mb-1">{constraint.value}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{constraint.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Mission Rules
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Mission Rules
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MISSION_RULES.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400">{idx + 1}</span>
                </div>
                <p className="text-xs text-slate-300 pt-0.5 leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Mission Pipeline (from schedule)
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Mission Pipeline
          <span className="ml-auto text-[10px] text-slate-500">Today&apos;s steps</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {pipelineSteps.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No pipeline steps available</p>
              <p className="text-[11px] text-slate-500 mt-1">Steps will appear when the daily schedule is generated</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pipelineSteps.map((step, idx) => {
                const config = scheduleStatusConfig(step.status === 'done' ? 'completed' : step.status === 'in-progress' ? 'running' : 'pending')
                const isLast = idx === pipelineSteps.length - 1
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-12 flex-shrink-0 text-right">
                      <span className="text-[11px] font-mono text-slate-400">{step.time}</span>
                    </div>
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${config.ring}`}>
                        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                      </div>
                      {!isLast && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-800" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className={`text-sm ${step.status === 'pending' ? 'text-slate-400' : 'text-white font-medium'}`}>
                        {step.label}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider ${config.color}`}>
                        {step.status === 'done' ? 'Done' : step.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Candidate Improvements (from mission tasks)
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Candidate Improvements
          </h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Identified opportunities</span>
        </div>

        {/* Summary banner */}
        <div className="bg-gradient-to-r from-emerald-500/5 via-slate-900 to-amber-500/5 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">
                <span className="text-white font-bold">{approvedCount}</span> approved ·
                <span className="text-amber-400 font-bold ml-1">{pendingCount}</span> pending ·
                <span className="text-red-400 font-bold ml-1">{blockedCount}</span> blocked
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Threshold: confidence &gt;0.8
              </span>
            </div>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Target className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No candidate improvements identified</p>
            <p className="text-[11px] text-slate-500 mt-1">Candidates will appear when the mission evaluates opportunities</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {candidates.map((candidate) => {
              const config = candidateStatusConfig(candidate.status)
              const StatusIcon = config.icon
              return (
                <div
                  key={candidate.id}
                  className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-700 transition-all duration-200 ${config.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{candidate.title}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${config.bg} ${config.color} ${config.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Type</div>
                          <div className="text-sm font-bold text-slate-300">{candidate.type}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Priority</div>
                          <div className="text-sm font-bold text-slate-300">{candidate.priority}</div>
                        </div>
                        {candidate.estimatedHours != null && (
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Hours</div>
                            <div className="text-sm font-bold text-slate-300">{candidate.estimatedHours}h</div>
                          </div>
                        )}
                      </div>

                      {candidate.confidence != null && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">Confidence:</span>
                          <span className={`text-[11px] font-bold ${confidenceColor(candidate.confidence)}`}>
                            {candidate.confidence.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          7. Budget Tracker
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Budget Tracker
          <span className="ml-auto text-[10px] text-slate-500">Current day</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgetTrackers.map((tracker) => {
            const ratio = tracker.total > 0 ? tracker.used / tracker.total : 0
            const percent = Math.min(ratio * 100, 100)
            return (
              <div
                key={tracker.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{tracker.label}</span>
                  <span className="text-xs text-slate-400">
                    <span className="text-white font-bold">{tracker.used}{tracker.unit}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    {tracker.total}{tracker.unit}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${budgetBarColor(tracker.used, tracker.total)} transition-all duration-700`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-500">
                    {percent.toFixed(0)}% used
                  </span>
                  <span className={`text-[10px] font-medium ${ratio >= 0.9 ? 'text-red-400' : ratio >= 0.7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {tracker.total > 0 ? (tracker.total - tracker.used) : 0}{tracker.unit} left
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Schedule Overview (from ops/schedule)
          ═══════════════════════════════════════════════════════ */}
      {schedule && schedule.jobs && schedule.jobs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Today&apos;s Schedule
            <span className="ml-auto text-[10px] text-slate-500">
              {schedule.completed}/{schedule.totalJobs} completed
            </span>
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="bg-slate-800/50 sticky top-0">
                  <tr>
                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Time</th>
                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Job</th>
                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {schedule.jobs.map((job) => {
                    const config = scheduleStatusConfig(job.status)
                    return (
                      <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono">{job.scheduledTime}</td>
                        <td className="px-4 py-3 text-slate-200">{job.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.color} bg-slate-800 border-slate-700`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{job.reasoning || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          9. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Generated by: <span className="text-slate-300">Mission Scheduler</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cron: <span className="text-emerald-400">06:00 daily</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Authority: <span className="text-emerald-400">Level 2 Master Spec</span></span>
        <span className="text-slate-700">|</span>
        <span>Auto-resolve: <span className="text-emerald-400">23:59</span></span>
      </div>

    </div>
  )
}
