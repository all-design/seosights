'use client'

import { useEffect, useState } from 'react'
import {
  Shield, CalendarClock, Package, Target, Search,
  Activity, CheckCircle2, Clock, ArrowRight, Zap,
  Eye, Factory, Landmark, Code2, GitMerge, Rocket,
  RotateCcw, GraduationCap, Lock, Gauge,
  Database, Route, DollarSign, AlertTriangle,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface SystemHealth {
  codebaseScanner: 'operational' | 'degraded' | 'offline'
  governor: 'operational' | 'degraded' | 'offline'
  aiRouter: 'operational' | 'degraded' | 'offline'
  dailyMissionGenerator: 'operational' | 'degraded' | 'offline'
  qaEngine: 'operational' | 'degraded' | 'offline'
}

interface Counts {
  factoryTasks: number
  interceptions: number
  missions: number
  qaRuns: number
  snapshots: number
  memories: number
  changelogs: number
}

interface ScheduleSummary {
  totalJobs: number
  completed: number
  running: number
  pending: number
  failed: number
}

interface LatestQA {
  id: string
  createdAt: string
  [key: string]: unknown
}

interface TodayMission {
  id: string
  goal: string
  status: string
  candidatesApproved: number
  candidatesEvaluated: number
}

interface ActivityItem {
  type: 'interception' | 'task' | 'qaRun'
  id: string
  engine?: string
  action?: string | null
  title?: string
  status?: string
  errorCount?: number
  createdAt: string
}

interface AIProviders {
  configured: string[]
  available: string[]
  using: 'rule-based-fallback' | 'live-llm'
}

interface ControlData {
  ok: boolean
  timestamp: string
  system: SystemHealth
  counts: Counts
  todayMission: TodayMission | null
  recentActivity: ActivityItem[]
  aiProviders: AIProviders
  scheduleSummary: ScheduleSummary | null
  latestQA: LatestQA | null
  recentMemories: { createdAt: string; [key: string]: unknown }[]
  // Other sections exist but this page only uses the above
  [key: string]: unknown
}

// ── Static data (architecture, not mock data) ────────────────

const pipelineStages = [
  { name: 'Observatory', icon: Search, color: 'amber', desc: 'Gather intelligence' },
  { name: 'Product Engine', icon: Package, color: 'rose', desc: 'Decide what to build' },
  { name: 'Architecture', icon: Landmark, color: 'cyan', desc: 'Plan where it goes' },
  { name: 'Engineering', icon: Code2, color: 'violet', desc: 'Write code on branch' },
  { name: 'QA', icon: Shield, color: 'blue', desc: 'Run all tests' },
  { name: 'Review', icon: Eye, color: 'amber', desc: 'Design & philosophy' },
  { name: 'Security', icon: Lock, color: 'red', desc: 'Vulnerability scan' },
  { name: 'Performance', icon: Gauge, color: 'orange', desc: 'Budget check' },
  { name: 'Human', icon: Target, color: 'emerald', desc: '🧑 Approval gate' },
  { name: 'Deploy', icon: Rocket, color: 'cyan', desc: 'Ship to production' },
  { name: 'Replay', icon: RotateCcw, color: 'amber', desc: 'Measure impact' },
  { name: 'Learning', icon: GraduationCap, color: 'emerald', desc: 'Get smarter' },
]

const factoryPrinciples = [
  { principle: 'No AI writes to main', detail: 'All code goes through branches → PRs → human approval', icon: GitMerge },
  { principle: 'Multiple quality gates', detail: 'QA + Review + Security + Performance must ALL pass', icon: CheckCircle2 },
  { principle: 'Architecture prevents feature creep', detail: 'Reuse existing components before creating new ones', icon: Landmark },
  { principle: 'Review checks philosophy, not syntax', detail: 'Does this look like SeoSights? Is our voice right?', icon: Eye },
  { principle: 'Measure after every deploy', detail: 'If metrics get worse → automatic rollback', icon: RotateCcw },
  { principle: 'Learn from every suggestion', detail: 'Suggestion → Code → Result → Confidence builds over time', icon: GraduationCap },
]

// ── System card definitions (mapping API statuses to UI) ─────

interface SystemCardDef {
  name: string
  icon: React.ElementType
  description: string
  color: string
  href: string
  statusKey?: keyof SystemHealth
  actionLabel?: string
}

const systemCardDefs: SystemCardDef[] = [
  { name: 'Observatory', icon: Search, description: 'AI model research & monitoring', color: 'amber', href: '/control/observatory', statusKey: 'codebaseScanner', actionLabel: 'Scanning codebase' },
  { name: 'Product Engine', icon: Package, description: 'Product analysis & recommendations', color: 'rose', href: '/control/product', actionLabel: 'Analyzing product' },
  { name: 'Architecture Engine', icon: Landmark, description: 'Staff Engineer — where code goes', color: 'cyan', href: '/control/architecture', actionLabel: 'Planning architecture' },
  { name: 'Engineering Engine', icon: Code2, description: 'Writes code on branches only', color: 'violet', href: '/control/engineering', actionLabel: 'Writing code' },
  { name: 'QA Engine', icon: Shield, description: 'Quality & stability checks', color: 'blue', href: '/control/qa', statusKey: 'qaEngine', actionLabel: 'Running checks' },
  { name: 'Review Engine', icon: Eye, description: 'Design system & philosophy checks', color: 'amber', href: '/control/review', actionLabel: 'Reviewing' },
  { name: 'Security Engine', icon: Lock, description: 'Vulnerability & dependency scanning', color: 'red', href: '/control/security', actionLabel: 'Scanning' },
  { name: 'Performance Engine', icon: Gauge, description: 'Core Web Vitals & budgets', color: 'orange', href: '/control/performance', actionLabel: 'Monitoring' },
  { name: 'Merge Engine', icon: GitMerge, description: 'PR creation & gate enforcement', color: 'emerald', href: '/control/merge', actionLabel: 'Processing PRs' },
  { name: 'Deploy Engine', icon: Rocket, description: 'Production deployment', color: 'cyan', href: '/control/deploy', actionLabel: 'Standing by' },
  { name: 'Replay Engine', icon: RotateCcw, description: 'Post-deploy metric tracking', color: 'amber', href: '/control/replay', actionLabel: 'Tracking metrics' },
  { name: 'Learning Engine', icon: GraduationCap, description: 'Pattern learning & confidence', color: 'emerald', href: '/control/learning', actionLabel: 'Learning patterns' },
  { name: 'Engineering Memory', icon: Database, description: 'Change tracking & pattern memory', color: 'indigo', href: '/control/engineering-memory', actionLabel: 'Recording patterns' },
  { name: 'AI Router', icon: Route, description: 'Free AI Mesh™ — model routing', color: 'emerald', href: '/control/ai-router', statusKey: 'aiRouter', actionLabel: 'Routing requests' },
  { name: 'AI Cost Dashboard', icon: DollarSign, description: 'LLM cost tracking — 100% free', color: 'emerald', href: '/control/ai-cost', actionLabel: 'Tracking costs' },
]

// ── Helpers ──────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'running': return 'text-emerald-400'
    case 'healthy': return 'text-emerald-400'
    case 'collecting': return 'text-amber-400'
    case 'monitoring': return 'text-cyan-400'
    case 'learning': return 'text-emerald-400'
    case 'recording': return 'text-indigo-400'
    case 'routing': return 'text-emerald-400'
    case 'operational': return 'text-emerald-400'
    case 'idle': return 'text-slate-400'
    case 'warning': return 'text-red-400'
    case 'degraded': return 'text-amber-400'
    case 'offline': return 'text-red-400'
    default: return 'text-slate-400'
  }
}

function healthColor(health: number) {
  if (health >= 90) return 'text-emerald-400'
  if (health >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function healthBarColor(health: number) {
  if (health >= 90) return 'bg-emerald-500'
  if (health >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

function apiStatusToHealth(status: string): number {
  switch (status) {
    case 'operational': return 95
    case 'degraded': return 60
    case 'offline': return 10
    default: return 50
  }
}

function apiStatusToDisplay(status: string): string {
  switch (status) {
    case 'operational': return 'running'
    case 'degraded': return 'degraded'
    case 'offline': return 'offline'
    default: return status
  }
}

// ── Derive real status from actual DB data ───────────────────

interface DerivedStatus {
  status: string
  health: number
  lastAction: string
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3600000
}

function countToStatus(count: number, activeLabel: string, idleLabel: string): DerivedStatus {
  if (count > 10) return { status: 'running', health: 97, lastAction: activeLabel }
  if (count > 0) return { status: 'running', health: 90, lastAction: activeLabel }
  return { status: 'offline', health: 30, lastAction: idleLabel }
}

function deriveStatus(
  cardName: string,
  counts: Counts,
  scheduleSummary: ScheduleSummary | null,
  aiProviders: AIProviders,
  latestQA: LatestQA | null,
  recentMemories: { createdAt: string }[],
): DerivedStatus {
  switch (cardName) {
    case 'Product Engine':
      return countToStatus(counts.missions, 'Analyzing product', 'No product data')

    case 'Architecture Engine':
      return countToStatus(counts.snapshots, 'Planning architecture', 'No snapshots recorded')

    case 'Engineering Engine':
      return countToStatus(counts.factoryTasks, 'Writing code', 'No tasks recorded')

    case 'Review Engine': {
      if (latestQA) {
        const h = hoursSince(latestQA.createdAt)
        if (h < 24) return { status: 'running', health: 92, lastAction: 'Reviewing recent changes' }
        if (h < 168) return { status: 'idle', health: 60, lastAction: 'Last review was days ago' }
        return { status: 'idle', health: 50, lastAction: 'No recent reviews' }
      }
      return countToStatus(counts.qaRuns, 'Reviewing', 'No review data')
    }

    case 'Security Engine':
      return countToStatus(counts.interceptions, 'Scanning for vulnerabilities', 'No interception data')

    case 'Performance Engine': {
      if (latestQA) {
        const h = hoursSince(latestQA.createdAt)
        if (h < 24) return { status: 'monitoring', health: 93, lastAction: 'Monitoring performance' }
        if (h < 168) return { status: 'idle', health: 55, lastAction: 'Last check was days ago' }
        return { status: 'idle', health: 45, lastAction: 'No recent performance data' }
      }
      return countToStatus(counts.qaRuns, 'Monitoring', 'No performance data')
    }

    case 'Merge Engine':
      return countToStatus(counts.factoryTasks, 'Processing PRs', 'No merge activity')

    case 'Deploy Engine': {
      if (!scheduleSummary || scheduleSummary.totalJobs === 0) {
        return { status: 'offline', health: 30, lastAction: 'No deployment data' }
      }
      if (scheduleSummary.running > 0) return { status: 'running', health: 95, lastAction: 'Deploying' }
      if (scheduleSummary.failed > 0) return { status: 'warning', health: 55, lastAction: `${scheduleSummary.failed} failed deployment(s)` }
      if (scheduleSummary.completed > 0) return { status: 'idle', health: 70, lastAction: 'Standing by' }
      if (scheduleSummary.pending > 0) return { status: 'idle', health: 60, lastAction: 'Pending deployments' }
      return { status: 'offline', health: 30, lastAction: 'No deployment data' }
    }

    case 'Replay Engine':
      return countToStatus(counts.qaRuns, 'Tracking metrics', 'No replay data')

    case 'Learning Engine': {
      if (recentMemories.length > 0) {
        const h = hoursSince(recentMemories[0].createdAt)
        if (h < 24) return { status: 'running', health: 95, lastAction: 'Learning patterns' }
        if (h < 168) return { status: 'idle', health: 60, lastAction: 'Last learning was days ago' }
        return { status: 'idle', health: 50, lastAction: 'No recent learning' }
      }
      return countToStatus(counts.memories, 'Learning patterns', 'No learning data')
    }

    case 'Engineering Memory': {
      if (recentMemories.length > 0) {
        const h = hoursSince(recentMemories[0].createdAt)
        if (h < 24) return { status: 'running', health: 95, lastAction: 'Recording patterns' }
        if (h < 168) return { status: 'idle', health: 60, lastAction: 'Last record was days ago' }
        return { status: 'idle', health: 50, lastAction: 'No recent records' }
      }
      const total = counts.memories + counts.changelogs
      return countToStatus(total, 'Recording patterns', 'No memory data')
    }

    case 'AI Cost Dashboard':
      if (aiProviders.configured.length > 0) return { status: 'monitoring', health: 95, lastAction: 'Tracking costs' }
      return { status: 'offline', health: 30, lastAction: 'No AI providers configured' }

    default:
      return { status: 'idle', health: 50, lastAction: 'No data available' }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Component ────────────────────────────────────────────────

export default function ControlOverview() {
  const [data, setData] = useState<ControlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        // API wraps data in `factory` — normalize so the rest of the page
        // can access data.system, data.counts, etc. directly
        const normalized: ControlData = json.factory
          ? { ...json.factory, ok: true }
          : { ...json, ok: json.ok ?? true }
        setData(normalized)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="animate-pulse bg-slate-800 rounded h-8 w-64" />
          <div className="animate-pulse bg-slate-800 rounded h-4 w-96 mt-2" />
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
          <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load factory status</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  // Map counts to display-friendly names
  const counts = {
    factoryTasks: data.counts?.factoryTasks ?? 0,
    governorInterceptions: data.counts?.interceptions ?? 0,
    dailyMissions: data.counts?.missions ?? 0,
    qaRuns: data.counts?.qaRuns ?? 0,
    codebaseSnapshots: data.counts?.snapshots ?? 0,
    engineeringMemories: data.counts?.memories ?? 0,
    factoryChangelogs: data.counts?.changelogs ?? 0,
  }

  const todayMission = data.todayMission ? {
    id: data.todayMission.id,
    goal: data.todayMission.goal,
    status: data.todayMission.status,
    candidatesApproved: data.todayMission.candidatesApproved,
    candidatesEvaluated: data.todayMission.candidatesEvaluated,
  } : null

  // Derive system cards with real data
  const apiCounts = data.counts ?? { factoryTasks: 0, interceptions: 0, missions: 0, qaRuns: 0, snapshots: 0, memories: 0, changelogs: 0 }
  const scheduleSummary = (data.scheduleSummary ?? null) as ScheduleSummary | null
  const latestQA = (data.latestQA ?? null) as LatestQA | null
  const recentMemories = (data.recentMemories ?? []) as { createdAt: string }[]

  const systemCards = systemCardDefs.map((def) => {
    let status: string
    let health: number
    let lastAction: string

    if (def.statusKey && data.system?.[def.statusKey]) {
      const apiStatus = data.system[def.statusKey]
      status = apiStatusToDisplay(apiStatus)
      health = apiStatusToHealth(apiStatus)
      lastAction = apiStatus === 'operational' ? `${def.name} is operational` : apiStatus === 'degraded' ? `${def.name} is degraded` : `${def.name} is offline`
    } else {
      // Derive real status from actual DB data instead of hardcoded values
      const derived = deriveStatus(def.name, apiCounts, scheduleSummary, data.aiProviders, latestQA, recentMemories)
      status = derived.status
      health = derived.health
      lastAction = derived.lastAction
    }

    return { ...def, status, health, lastAction }
  })

  const overallHealth = Math.round(systemCards.reduce((sum, s) => sum + s.health, 0) / systemCards.length)
  const runningCount = systemCards.filter(s => ['running', 'healthy', 'operational'].includes(s.status)).length
  const monitoringCount = systemCards.filter(s => s.status === 'monitoring').length
  const degradedCount = systemCards.filter(s => ['collecting', 'degraded', 'warning'].includes(s.status)).length
  const offlineCount = systemCards.filter(s => s.status === 'offline').length
  const idleCount = systemCards.filter(s => s.status === 'idle').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AI Software Factory™</h1>
        <p className="text-slate-400 text-sm mt-1">Autonomous development pipeline. Human-approved deploys.</p>
      </div>

      {/* Overall Health Banner */}
      <div className={`bg-gradient-to-r ${overallHealth >= 90 ? 'from-emerald-500/10 border-emerald-500/20' : overallHealth >= 70 ? 'from-amber-500/10 border-amber-500/20' : 'from-red-500/10 border-red-500/20'} via-slate-900 to-slate-900 border rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Platform Health</div>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold ${overallHealth >= 90 ? 'text-emerald-400' : overallHealth >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{overallHealth}%</span>
              <span className={`text-sm ${overallHealth >= 90 ? 'text-emerald-400/60' : overallHealth >= 70 ? 'text-amber-400/60' : 'text-red-400/60'}`}>{systemCards.length} systems tracked</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{runningCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{monitoringCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{degradedCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{idleCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Idle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{offlineCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Offline</div>
            </div>
          </div>
        </div>
        {/* Counts row */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div>
            <div className="text-lg font-bold text-white">{counts.factoryTasks}</div>
            <div className="text-[10px] text-slate-500 uppercase">Tasks</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{counts.governorInterceptions}</div>
            <div className="text-[10px] text-slate-500 uppercase">Interceptions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{counts.dailyMissions}</div>
            <div className="text-[10px] text-slate-500 uppercase">Missions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{counts.qaRuns}</div>
            <div className="text-[10px] text-slate-500 uppercase">QA Runs</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{counts.codebaseSnapshots}</div>
            <div className="text-[10px] text-slate-500 uppercase">Snapshots</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{counts.engineeringMemories}</div>
            <div className="text-[10px] text-slate-500 uppercase">Memories</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{counts.factoryChangelogs}</div>
            <div className="text-[10px] text-slate-500 uppercase">Changelogs</div>
          </div>
        </div>
      </div>

      {/* The Complete Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Factory className="w-4 h-4 text-emerald-400" />
          AI Software Factory™ — The Complete Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon
            return (
              <div key={stage.name} className="relative">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center hover:border-slate-600 transition-colors">
                  <div className={`w-7 h-7 rounded-lg bg-${stage.color}-500/10 flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon className={`w-3.5 h-3.5 text-${stage.color}-400`} />
                  </div>
                  <div className="text-[11px] font-semibold text-white">{stage.name}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{stage.desc}</div>
                </div>
                {i < pipelineStages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 absolute -right-1.5 top-1/2 -translate-y-1/2 hidden lg:block" />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <Target className="w-3 h-3 text-emerald-400" />
          <span>Human Approval is the only gate that can push to production</span>
        </div>
      </div>

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemCards.map((system) => {
          const Icon = system.icon
          return (
            <a
              key={system.name}
              href={system.href}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${system.color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${system.color}-400`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{system.name}</div>
                    <div className={`text-xs capitalize ${statusColor(system.status)}`}>
                      {system.status}
                    </div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${healthColor(system.health)}`}>
                  {system.health}%
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${healthBarColor(system.health)} transition-all duration-1000`}
                  style={{ width: `${system.health}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">{system.description}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {system.lastAction}
              </div>
            </a>
          )
        })}
      </div>

      {/* Today's Mission */}
      {todayMission && (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-emerald-400" />
            Today&apos;s Mission
          </h2>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{todayMission.goal}</div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  todayMission.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  todayMission.status === 'active' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {todayMission.status}
                </span>
                <span className="text-[10px] text-slate-500">
                  {todayMission.candidatesEvaluated} evaluated · {todayMission.candidatesApproved} approved
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom row: Schedule + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Factory Principles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Factory Principles
          </h2>
          <div className="space-y-3">
            {factoryPrinciples.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{item.principle}</div>
                    <div className="text-[11px] text-slate-500">{item.detail}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Activity
          </h2>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent activity</p>
              <p className="text-xs text-slate-600 mt-1">Activity will appear here as the factory runs</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {data.recentActivity.map((event, i) => {
                let eventText = ''
                let eventType: 'success' | 'info' | 'warning' = 'info'

                if (event.type === 'interception') {
                  eventText = `Governor: ${event.engine || 'Unknown'} — ${event.action || 'intercepted'}`
                  eventType = event.action === 'blocked' ? 'warning' : 'success'
                } else if (event.type === 'task') {
                  eventText = `Factory Task: ${event.title || event.id} — ${event.status || 'unknown'}`
                  eventType = event.status === 'completed' ? 'success' : 'info'
                } else if (event.type === 'qaRun') {
                  const errors = event.errorCount || 0
                  eventText = `QA Run: ${errors === 0 ? 'All checks passed' : `${errors} issue(s) found`}`
                  eventType = errors === 0 ? 'success' : 'warning'
                }

                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`
                      w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                      ${eventType === 'success' ? 'bg-emerald-400' : ''}
                      ${eventType === 'info' ? 'bg-cyan-400' : ''}
                      ${eventType === 'warning' ? 'bg-amber-400' : ''}
                    `} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300">{eventText}</div>
                      <div className="text-[10px] text-slate-600">{timeAgo(event.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Providers Footer */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Providers: <span className="text-white font-mono">{data.aiProviders.configured.length}</span> configured</span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="w-3.5 h-3.5 text-cyan-500" />
            <span>Mode: <span className={data.aiProviders.using === 'live-llm' ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>{data.aiProviders.using === 'live-llm' ? 'Live LLM' : 'Rule-based fallback'}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last updated: <span className="text-white font-mono">{timeAgo(data.timestamp)}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
