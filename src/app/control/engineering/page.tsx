'use client'

import { useEffect, useState } from 'react'
import {
  Code2,
  GitBranch,
  FileCode2,
  FlaskConical,
  ShieldCheck,
  GitPullRequest,
  UserCheck,
  Plus,
  Clock,
  FilePen,
  FilePlus2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  GitCommitHorizontal,
  Activity,
  Cpu,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────

type PipelineStepId = 'branch' | 'code' | 'tests' | 'qa' | 'pr' | 'review'

interface PipelineStep {
  id: PipelineStepId
  name: string
  icon: React.ElementType
  count: number
  status: 'active' | 'idle'
}

interface ActivityItem {
  type: 'interception' | 'task' | 'qaRun' | 'mission'
  id: string
  engineName?: string
  outcome?: string
  title?: string
  status?: string
  errorCount?: number
  timestamp?: string
  createdAt: string
}

interface QualityGate {
  label: string
  status: 'pass' | 'warn'
  detail: string
}

// ─── Static pipeline definitions ──────────────────────────

const pipelineStepDefs: { id: PipelineStepId; name: string; icon: React.ElementType }[] = [
  { id: 'branch', name: 'Create Branch', icon: GitBranch },
  { id: 'code', name: 'Write Code', icon: FileCode2 },
  { id: 'tests', name: 'Run Tests', icon: FlaskConical },
  { id: 'qa', name: 'Run QA', icon: ShieldCheck },
  { id: 'pr', name: 'Generate PR', icon: GitPullRequest },
  { id: 'review', name: 'Human Review', icon: UserCheck },
]

// ─── Helpers ──────────────────────────────────────────────

function feedAccentForType(type: ActivityItem['type']): 'violet' | 'emerald' | 'amber' | 'slate' {
  switch (type) {
    case 'interception': return 'amber'
    case 'task': return 'violet'
    case 'qaRun': return 'emerald'
    case 'mission': return 'violet'
    default: return 'slate'
  }
}

function feedIconForType(type: ActivityItem['type']): React.ElementType {
  switch (type) {
    case 'interception': return AlertTriangle
    case 'task': return FilePlus2
    case 'qaRun': return CheckCircle2
    case 'mission': return FilePen
    default: return Activity
  }
}

function feedAccentColor(accent: 'violet' | 'emerald' | 'amber' | 'slate'): { icon: string; dot: string } {
  switch (accent) {
    case 'violet': return { icon: 'text-violet-400', dot: 'bg-violet-400' }
    case 'emerald': return { icon: 'text-emerald-400', dot: 'bg-emerald-400' }
    case 'amber': return { icon: 'text-amber-400', dot: 'bg-amber-400' }
    case 'slate': return { icon: 'text-slate-400', dot: 'bg-slate-400' }
    default: return { icon: 'text-slate-400', dot: 'bg-slate-400' }
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// ─── Main Component ───────────────────────────────────────

export default function EngineeringEnginePage() {
  const [factoryData, setFactoryData] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        if (!json || typeof json !== 'object') throw new Error('Invalid API response')
        // Unwrap the factory envelope — the API returns { factory: { system, counts, ... }, ... }
        const source = json.factory || json
        setFactoryData({
          system: source.system || {},
          counts: {
            factoryTasks: source.counts?.factoryTasks ?? source.counts?.factoryTask ?? 0,
            governorInterceptions: source.counts?.interceptions ?? source.counts?.interception ?? 0,
            qaRuns: source.counts?.qaRuns ?? source.counts?.qaRun ?? 0,
            engineeringMemories: source.counts?.memories ?? source.counts?.memory ?? 0,
          },
          recentActivity: Array.isArray(source.recentActivity) ? source.recentActivity : [],
          ok: source.ok ?? true,
        })
        setMemories(Array.isArray(source.recentMemories) ? source.recentMemories : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-12" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-40" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
          <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-24" />
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-slate-300 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    )
  }

  // ─── Derived data ─────────────────────────────────────────
  const system = factoryData?.system || {}
  const counts = factoryData?.counts || {}
  const recentActivity: ActivityItem[] = Array.isArray(factoryData?.recentActivity) ? factoryData.recentActivity : []

  // Build pipeline steps from system health
  const pipelineSteps: PipelineStep[] = pipelineStepDefs.map(def => {
    let isActive = false
    let count = 0
    switch (def.id) {
      case 'branch':
        isActive = system.codebaseScanner === 'operational'
        count = counts.factoryTasks || 0
        break
      case 'code':
        isActive = system.codebaseScanner === 'operational'
        count = Math.min(counts.factoryTasks || 0, 3)
        break
      case 'tests':
        isActive = system.qaEngine === 'operational'
        count = counts.qaRuns || 0
        break
      case 'qa':
        isActive = system.qaEngine === 'operational'
        count = counts.qaRuns || 0
        break
      case 'pr':
        isActive = system.governor === 'operational'
        count = counts.governorInterceptions || 0
        break
      case 'review':
        isActive = system.governor === 'operational'
        count = 0
        break
    }
    return { ...def, count, status: isActive ? 'active' : 'idle' }
  })

  // Build quality gates from system health
  const qualityGates: QualityGate[] = [
    { label: 'Codebase Scanner', status: system.codebaseScanner === 'operational' ? 'pass' : 'warn', detail: system.codebaseScanner === 'operational' ? 'Operational' : system.codebaseScanner || 'Offline' },
    { label: 'Governor', status: system.governor === 'operational' ? 'pass' : 'warn', detail: system.governor === 'operational' ? 'Operational' : system.governor || 'Offline' },
    { label: 'AI Router', status: system.aiRouter === 'operational' ? 'pass' : 'warn', detail: system.aiRouter === 'operational' ? 'Operational' : system.aiRouter || 'Degraded' },
    { label: 'QA Engine', status: system.qaEngine === 'operational' ? 'pass' : 'warn', detail: system.qaEngine === 'operational' ? 'Operational' : system.qaEngine || 'Offline' },
    { label: 'Mission Generator', status: system.dailyMissionGenerator === 'operational' ? 'pass' : 'warn', detail: system.dailyMissionGenerator === 'operational' ? 'Operational' : system.dailyMissionGenerator || 'Offline' },
    { label: 'Engineering Memory', status: (counts.engineeringMemories || 0) > 0 ? 'pass' : 'warn', detail: `${counts.engineeringMemories || 0} records` },
  ]

  const hasActiveSystem = Object.values(system).some((s: any) => s === 'operational')

  return (
    <div className="space-y-6">
      {/* ═══ 1. Header ══════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Engineering Engine&#8482;</h1>
            <p className="text-slate-400 text-sm">Autonomous code generation &amp; pipeline orchestration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            hasActiveSystem
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-slate-500/10 border-slate-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${hasActiveSystem ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className={`text-xs font-medium ${hasActiveSystem ? 'text-emerald-400' : 'text-slate-400'}`}>
              {hasActiveSystem ? 'Running' : 'Idle'}
            </span>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Create Branch
          </button>
        </div>
      </div>

      {/* Important Notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-xs font-semibold text-amber-300">Important:</span>
          <span className="text-xs text-amber-200/70 ml-1">This engine NEVER pushes to main. All changes require human approval.</span>
        </div>
      </div>

      {/* ═══ 2. Pipeline Visualization ══════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          Engineering Pipeline
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {/* Desktop: horizontal flow */}
          <div className="hidden md:flex items-center gap-0 overflow-x-auto">
            {pipelineSteps.map((step, i) => {
              const Icon = step.icon
              const isActive = step.status === 'active'
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      flex flex-col items-center gap-2 px-5 py-4 rounded-xl border-2 transition-all min-w-[130px]
                      ${isActive
                        ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'border-slate-800 bg-slate-800/30'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-500/15' : 'bg-slate-700/50'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-center">
                      <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {step.name}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className={`text-[10px] ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {step.count} item{step.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-slate-700/50 text-slate-500 border border-slate-700'
                    }`}>
                      {isActive ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </>
                      ) : (
                        'Idle'
                      )}
                    </div>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-slate-600 mx-1 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile: vertical flow */}
          <div className="md:hidden space-y-0">
            {pipelineSteps.map((step, i) => {
              const Icon = step.icon
              const isActive = step.status === 'active'
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 ${
                        isActive
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    {i < pipelineSteps.length - 1 && (
                      <div className="w-px h-6 bg-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {step.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-700/50 text-slate-500'
                      }`}>
                        {isActive ? 'Active' : 'Idle'}
                      </span>
                      <span className={`text-[10px] ${isActive ? 'text-emerald-400/70' : 'text-slate-600'}`}>
                        {step.count} item{step.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ 3. Engineering Memory Patterns ═════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          Engineering Memory
          <span className="ml-1 text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
            {memories.length} records
          </span>
        </h2>
        {memories.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center gap-3">
            <Cpu className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-500">No engineering memory records yet</p>
            <p className="text-xs text-slate-600">Memory patterns will appear as the engineering engine processes tasks</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
            {memories.slice(0, 9).map((mem: any) => (
              <div
                key={mem.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitCommitHorizontal className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span className="text-xs font-mono font-semibold text-white truncate">
                      {mem.feature || 'Unknown'}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ml-2 ${
                    mem.outcome === 'success' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                    mem.outcome === 'rolled_back' ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                    mem.outcome === 'partial' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                    'bg-slate-500/15 text-slate-400 border-slate-500/25'
                  }`}>
                    {mem.outcome === 'success' ? 'Success' : mem.outcome === 'rolled_back' ? 'Rolled Back' : mem.outcome === 'partial' ? 'Partial' : mem.outcome || 'Unknown'}
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500">Confidence</span>
                    <span className="text-[10px] font-mono text-slate-300">{Math.round((mem.confidence || 0) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        mem.confidence >= 0.8 ? 'bg-emerald-500' : mem.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                      } transition-all duration-700 ease-out`}
                      style={{ width: `${Math.round((mem.confidence || 0) * 100)}%` }}
                    />
                  </div>
                </div>
                {/* Meta row */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileCode2 className="w-3 h-3" />
                    {mem.testsPassed || 0}/{(mem.testsPassed || 0) + (mem.testsFailed || 0)} tests
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {timeAgo(mem.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 4. Code Activity Feed ══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            Code Activity Feed
            <span className="ml-auto text-[10px] text-slate-500">Live</span>
          </h2>
          {recentActivity.length === 0 ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Activity className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-500">No recent activity</span>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivity.map((event, i) => {
                const accent = feedAccentForType(event.type)
                const Icon = feedIconForType(event.type)
                const accentColors = feedAccentColor(accent)
                const message = event.type === 'task' ? event.title || 'Task created' :
                  event.type === 'mission' ? event.title || 'Mission updated' :
                  event.type === 'interception' ? `Governor: ${event.engineName || 'Unknown'}` :
                  `QA Run: ${event.errorCount || 0} errors`
                const detail = event.type === 'task' ? `Status: ${event.status || 'unknown'}` :
                  event.type === 'mission' ? event.status || '' :
                  event.type === 'interception' ? event.outcome || '' :
                  event.status || ''
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 py-3 group hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        accent === 'violet' ? 'bg-violet-500/10' :
                        accent === 'emerald' ? 'bg-emerald-500/10' :
                        accent === 'amber' ? 'bg-amber-500/10' :
                        'bg-slate-700/50'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${accentColors.icon}`} />
                      </div>
                      {i < recentActivity.length - 1 && (
                        <div className="w-px h-4 bg-slate-800 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">{message}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{detail}</span>
                        <span className="text-slate-700">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ═══ 5. Quality Gate Status ══════════════════════ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            Quality Gate Status
          </h2>
          <div className="space-y-3">
            {qualityGates.map((gate) => (
              <div
                key={gate.label}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  gate.status === 'pass'
                    ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30'
                    : 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {gate.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-white">{gate.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${gate.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {gate.status === 'pass' ? '✅' : '⚠️'}
                  </span>
                  <span className={`text-xs ${gate.status === 'pass' ? 'text-slate-300' : 'text-amber-300'}`}>
                    {gate.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall gate verdict */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Overall Verdict</span>
              {qualityGates.every(g => g.status === 'pass') ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">All Gates Passed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">Some Gates Warning</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 6. Stats Footer ════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-white">{counts.factoryTasks || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Factory Tasks</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <GitPullRequest className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-white">{counts.governorInterceptions || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Governor Reviews</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-white">{counts.qaRuns || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">QA Runs</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">100%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Human Approval Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
