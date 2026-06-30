'use client'

import { useSyncExternalStore } from 'react'
import {
  ClipboardList, Clock, Puzzle, FileText, FlaskConical, BookOpen,
  GitPullRequest, Target, Zap, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, Calendar, Activity, ChevronRight, Sparkles, ShieldCheck,
  History,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface BudgetConstraint {
  id: string
  icon: 'clock' | 'puzzle' | 'file' | 'flask' | 'book' | 'pr'
  label: string
  value: string
  description: string
}

interface PipelineStep {
  id: string
  time: string
  label: string
  status: 'done' | 'in-progress' | 'pending'
}

type CandidateStatus = 'approved' | 'pending' | 'blocked'

interface Candidate {
  id: string
  title: string
  impact: number
  confidence: number
  estimatedHours: number
  status: CandidateStatus
  blockReason?: string
}

type MissionOutcome = 'completed' | 'partial' | 'blocked'

interface MissionHistoryItem {
  id: string
  dayLabel: string
  goal: string
  outcome: MissionOutcome
  hoursUsed: string
  kpiImproved: string
}

interface BudgetTracker {
  id: string
  label: string
  used: number
  total: number
  unit: string
}

// ─── Mock Data ───────────────────────────────────────────

const budgetConstraints: BudgetConstraint[] = [
  {
    id: 'bc-1',
    icon: 'clock',
    label: 'Maximum Engineering Budget',
    value: '4 hours',
    description: 'Total time the Engineering Engine may spend today',
  },
  {
    id: 'bc-2',
    icon: 'puzzle',
    label: 'Maximum New Components',
    value: '2',
    description: 'No more than 2 new component files created',
  },
  {
    id: 'bc-3',
    icon: 'file',
    label: 'Maximum New Pages',
    value: '5',
    description: 'No more than 5 new routes added',
  },
  {
    id: 'bc-4',
    icon: 'flask',
    label: 'Must Run: Full QA',
    value: 'Required',
    description: 'Full QA Engine validation before merge',
  },
  {
    id: 'bc-5',
    icon: 'book',
    label: 'Must Update: Documentation',
    value: 'Required',
    description: 'Documentation Engine must rebuild docs',
  },
  {
    id: 'bc-6',
    icon: 'pr',
    label: 'Must Prepare: PR',
    value: 'Wait for approval',
    description: 'Prepare PR but do NOT auto-merge — wait for human approval',
  },
]

const missionRules: string[] = [
  'Implement only if confidence >0.8',
  'Find the highest-impact improvement',
  'No new features unless Priority 1-4 are exhausted',
  'Must improve at least one measurable KPI',
  'Must pass all Quality Gates',
]

const pipelineSteps: PipelineStep[] = [
  { id: 'ps-1', time: '06:00', label: 'Mission Generated', status: 'done' },
  { id: 'ps-2', time: '06:00', label: 'Observatory scan for opportunities', status: 'done' },
  { id: 'ps-3', time: '07:00', label: 'Governor validates candidates', status: 'done' },
  { id: 'ps-4', time: '08:00', label: 'Implementation begins', status: 'in-progress' },
  { id: 'ps-5', time: '12:00', label: 'QA validation', status: 'pending' },
  { id: 'ps-6', time: '13:00', label: 'Documentation update', status: 'pending' },
  { id: 'ps-7', time: '14:00', label: 'PR prepared', status: 'pending' },
  { id: 'ps-8', time: '14:30', label: 'Human approval gate', status: 'pending' },
]

const candidates: Candidate[] = [
  {
    id: 'cand-1',
    title: 'Fix documentation drift on Button component',
    impact: 8.2,
    confidence: 0.92,
    estimatedHours: 1.5,
    status: 'approved',
  },
  {
    id: 'cand-2',
    title: 'Add missing API docs for /api/advisor',
    impact: 7.5,
    confidence: 0.88,
    estimatedHours: 1,
    status: 'approved',
  },
  {
    id: 'cand-3',
    title: 'Optimize bundle size (remove unused exports)',
    impact: 6.8,
    confidence: 0.85,
    estimatedHours: 2,
    status: 'pending',
  },
  {
    id: 'cand-4',
    title: 'Add smoke test for auth flow',
    impact: 6.2,
    confidence: 0.79,
    estimatedHours: 1,
    status: 'blocked',
    blockReason: 'confidence <0.8',
  },
  {
    id: 'cand-5',
    title: 'Refactor Growth Engine cache',
    impact: 5.5,
    confidence: 0.71,
    estimatedHours: 3,
    status: 'blocked',
    blockReason: 'confidence <0.8',
  },
]

const missionHistory: MissionHistoryItem[] = [
  {
    id: 'mh-1',
    dayLabel: 'Yesterday',
    goal: 'Improve Observatory coverage',
    outcome: 'completed',
    hoursUsed: '3.5h',
    kpiImproved: 'Coverage +2%',
  },
  {
    id: 'mh-2',
    dayLabel: '2 days ago',
    goal: 'Reduce tech debt',
    outcome: 'completed',
    hoursUsed: '4h',
    kpiImproved: 'Removed 12 dead exports',
  },
  {
    id: 'mh-3',
    dayLabel: '3 days ago',
    goal: 'Increase documentation',
    outcome: 'partial',
    hoursUsed: '2h/4h',
    kpiImproved: 'Docs +3%',
  },
  {
    id: 'mh-4',
    dayLabel: '4 days ago',
    goal: 'Optimize QA pipeline',
    outcome: 'completed',
    hoursUsed: '3h',
    kpiImproved: 'QA time -18%',
  },
  {
    id: 'mh-5',
    dayLabel: '5 days ago',
    goal: 'Improve AI Router caching',
    outcome: 'completed',
    hoursUsed: '4h',
    kpiImproved: 'Cache hit +12%',
  },
]

const budgetTrackers: BudgetTracker[] = [
  { id: 'bt-1', label: 'Hours Used', used: 2.5, total: 4, unit: 'h' },
  { id: 'bt-2', label: 'Components Created', used: 1, total: 2, unit: '' },
  { id: 'bt-3', label: 'Pages Created', used: 2, total: 5, unit: '' },
]

// ─── Helpers ─────────────────────────────────────────────

function budgetIconConfig(icon: BudgetConstraint['icon']) {
  switch (icon) {
    case 'clock': return { icon: Clock, color: 'text-emerald-400' }
    case 'puzzle': return { icon: Puzzle, color: 'text-emerald-400' }
    case 'file': return { icon: FileText, color: 'text-emerald-400' }
    case 'flask': return { icon: FlaskConical, color: 'text-amber-400' }
    case 'book': return { icon: BookOpen, color: 'text-amber-400' }
    case 'pr': return { icon: GitPullRequest, color: 'text-cyan-400' }
  }
}

function candidateStatusConfig(status: CandidateStatus) {
  switch (status) {
    case 'approved':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Approved' }
    case 'pending':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Pending' }
    case 'blocked':
      return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Blocked' }
  }
}

function outcomeConfig(outcome: MissionOutcome) {
  switch (outcome) {
    case 'completed':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Completed' }
    case 'partial':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Partial' }
    case 'blocked':
      return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Blocked' }
  }
}

function pipelineStatusConfig(status: PipelineStep['status']) {
  switch (status) {
    case 'done':
      return { color: 'text-emerald-400', dot: 'bg-emerald-400', ring: 'border-emerald-500/40 bg-emerald-500/10' }
    case 'in-progress':
      return { color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', ring: 'border-cyan-500/40 bg-cyan-500/10' }
    case 'pending':
      return { color: 'text-slate-500', dot: 'bg-slate-600', ring: 'border-slate-700 bg-slate-800/30' }
  }
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
  const ratio = used / total
  if (ratio >= 0.9) return 'from-red-500/60 to-red-500'
  if (ratio >= 0.7) return 'from-amber-500/60 to-amber-500'
  return 'from-emerald-500/60 to-emerald-500'
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function DailyMissionPage() {
  const mounted = useHydrated()

  if (!mounted) return null

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const approvedCount = candidates.filter(c => c.status === 'approved').length
  const pendingCount = candidates.filter(c => c.status === 'pending').length
  const blockedCount = candidates.filter(c => c.status === 'blocked').length

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
            Generated at 06:00
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Active</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Today's Mission Card — Hero
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6 relative overflow-hidden">
        {/* Decorative glow */}
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
                Active
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
            <div className="text-sm font-semibold text-white">Increase activation</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Strategy</div>
            <div className="text-sm font-semibold text-white">Find the highest-impact improvement</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confidence Threshold</div>
            <div className="text-sm font-semibold text-emerald-400">&gt; 0.8</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Budget Constraints
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Budget Constraints
          <span className="ml-auto text-[10px] text-slate-500">6 hard limits</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetConstraints.map((constraint) => {
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
            {missionRules.map((rule, idx) => (
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
          5. Mission Pipeline
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Mission Pipeline
          <span className="ml-auto text-[10px] text-slate-500">Today&apos;s steps</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-2">
            {pipelineSteps.map((step, idx) => {
              const config = pipelineStatusConfig(step.status)
              const isLast = idx === pipelineSteps.length - 1
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Time */}
                  <div className="w-12 flex-shrink-0 text-right">
                    <span className="text-[11px] font-mono text-slate-400">{step.time}</span>
                  </div>

                  {/* Timeline node */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${config.ring}`}>
                      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                    </div>
                    {/* Vertical connector */}
                    {!isLast && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-800" />
                    )}
                  </div>

                  {/* Label */}
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Candidate Improvements
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

        {/* Candidate list */}
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
                    {/* Title + status badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-white">{candidate.title}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${config.bg} ${config.color} ${config.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Impact</div>
                        <div className={`text-sm font-bold ${impactColor(candidate.impact)}`}>{candidate.impact.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Confidence</div>
                        <div className={`text-sm font-bold ${confidenceColor(candidate.confidence)}`}>{candidate.confidence.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Hours</div>
                        <div className="text-sm font-bold text-slate-300">{candidate.estimatedHours}h</div>
                      </div>
                    </div>

                    {/* Block reason (if applicable) */}
                    {candidate.blockReason && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>Blocked: {candidate.blockReason}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                </div>
              </div>
            )
          })}
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {budgetTrackers.map((tracker) => {
            const ratio = tracker.used / tracker.total
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
                {/* Progress bar */}
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
                    {(tracker.total - tracker.used).toFixed(tracker.unit ? 1 : 0)}{tracker.unit} left
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Mission History
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          Mission History
          <span className="ml-auto text-[10px] text-slate-500">Past 7 days</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/50 sticky top-0">
                <tr>
                  <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Day</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Goal</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Outcome</th>
                  <th className="text-right font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">Hours</th>
                  <th className="text-left font-medium text-slate-400 px-4 py-2.5 uppercase tracking-wider text-[10px]">KPI Improved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {missionHistory.map((item) => {
                  const config = outcomeConfig(item.outcome)
                  const OutcomeIcon = config.icon
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{item.dayLabel}</td>
                      <td className="px-4 py-3 text-slate-200">{item.goal}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                          <OutcomeIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{item.hoursUsed}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="text-slate-300">{item.kpiImproved}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
