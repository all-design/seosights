'use client'

import { useSyncExternalStore } from 'react'
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
} from 'lucide-react'

// ─── Hydration-safe mount check ───────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Types ────────────────────────────────────────────────

type PipelineStepId = 'branch' | 'code' | 'tests' | 'qa' | 'pr' | 'review'

interface PipelineStep {
  id: PipelineStepId
  name: string
  icon: React.ElementType
  count: number
  status: 'active' | 'idle'
}

interface ActiveBranch {
  id: string
  name: string
  status: 'writing' | 'qa' | 'awaiting-pr' | 'review' | 'started'
  statusLabel: string
  progress: number
  filesChanged: number
  author: string
  age: string
}

interface FeedEvent {
  id: string
  icon: React.ElementType
  message: string
  detail: string
  timeAgo: string
  accent: 'violet' | 'emerald' | 'amber' | 'slate'
}

interface QualityGate {
  label: string
  status: 'pass' | 'warn'
  detail: string
}

// ─── Mock Data ────────────────────────────────────────────

const pipelineSteps: PipelineStep[] = [
  { id: 'branch', name: 'Create Branch', icon: GitBranch, count: 2, status: 'active' },
  { id: 'code', name: 'Write Code', icon: FileCode2, count: 3, status: 'active' },
  { id: 'tests', name: 'Run Tests', icon: FlaskConical, count: 1, status: 'idle' },
  { id: 'qa', name: 'Run QA', icon: ShieldCheck, count: 1, status: 'active' },
  { id: 'pr', name: 'Generate PR', icon: GitPullRequest, count: 1, status: 'idle' },
  { id: 'review', name: 'Human Review', icon: UserCheck, count: 0, status: 'idle' },
]

const activeBranches: ActiveBranch[] = [
  { id: 'br-1', name: 'feature/ai-advisor-widget', status: 'writing', statusLabel: 'Writing Code', progress: 78, filesChanged: 14, author: 'AI', age: '2h 14m' },
  { id: 'br-2', name: 'feature/visibility-score-api', status: 'qa', statusLabel: 'In QA', progress: 92, filesChanged: 8, author: 'AI', age: '4h 31m' },
  { id: 'br-3', name: 'fix/pricing-accessibility', status: 'awaiting-pr', statusLabel: 'Awaiting PR', progress: 95, filesChanged: 3, author: 'AI', age: '1h 48m' },
  { id: 'br-4', name: 'refactor/observatory-queries', status: 'review', statusLabel: 'Code Review', progress: 60, filesChanged: 11, author: 'AI', age: '6h 09m' },
  { id: 'br-5', name: 'feature/engagement-streaks', status: 'started', statusLabel: 'Branch Created', progress: 5, filesChanged: 1, author: 'AI', age: '12m' },
]

const feedEvents: FeedEvent[] = [
  { id: 'fe-1', icon: FilePlus2, message: 'Created FloatingAdvisor.tsx', detail: '142 lines', timeAgo: '2m ago', accent: 'violet' },
  { id: 'fe-2', icon: FilePen, message: 'Modified Hero.tsx', detail: 'added advisor slot', timeAgo: '5m ago', accent: 'violet' },
  { id: 'fe-3', icon: FilePlus2, message: 'Created /api/advisor route.ts', detail: '67 lines', timeAgo: '8m ago', accent: 'violet' },
  { id: 'fe-4', icon: CheckCircle2, message: 'Tests passed: 12/12', detail: 'for ai-advisor-widget', timeAgo: '15m ago', accent: 'emerald' },
  { id: 'fe-5', icon: GitPullRequest, message: 'PR #47 opened', detail: 'Add AI Advisor to homepage', timeAgo: '1h ago', accent: 'violet' },
  { id: 'fe-6', icon: Trash2, message: 'Branch cleanup', detail: 'deleted 3 merged branches', timeAgo: '2h ago', accent: 'slate' },
]

const qualityGates: QualityGate[] = [
  { label: 'Lint', status: 'pass', detail: '0 errors' },
  { label: 'Type Check', status: 'pass', detail: 'Clean' },
  { label: 'Unit Tests', status: 'pass', detail: '47/47 passing' },
  { label: 'Build', status: 'pass', detail: 'Successful' },
  { label: 'Bundle Size', status: 'warn', detail: '+12KB (within budget)' },
  { label: 'Security Scan', status: 'pass', detail: 'No vulnerabilities' },
]

// ─── Helpers ──────────────────────────────────────────────

function branchStatusColor(status: ActiveBranch['status']): string {
  switch (status) {
    case 'writing': return 'bg-violet-500/15 text-violet-400 border-violet-500/25'
    case 'qa': return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    case 'awaiting-pr': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
    case 'review': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
    case 'started': return 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  }
}

function branchProgressBarColor(status: ActiveBranch['status']): string {
  switch (status) {
    case 'writing': return 'bg-violet-500'
    case 'qa': return 'bg-amber-500'
    case 'awaiting-pr': return 'bg-emerald-500'
    case 'review': return 'bg-cyan-500'
    case 'started': return 'bg-slate-500'
  }
}

function feedAccentColor(accent: FeedEvent['accent']): { icon: string; dot: string } {
  switch (accent) {
    case 'violet': return { icon: 'text-violet-400', dot: 'bg-violet-400' }
    case 'emerald': return { icon: 'text-emerald-400', dot: 'bg-emerald-400' }
    case 'amber': return { icon: 'text-amber-400', dot: 'bg-amber-400' }
    case 'slate': return { icon: 'text-slate-400', dot: 'bg-slate-400' }
  }
}

// ─── Main Component ───────────────────────────────────────

export default function EngineeringEnginePage() {
  const mounted = useHydrated()

  if (!mounted) return null

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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Running</span>
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
                  {/* Connector line */}
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
                  {/* Content */}
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

      {/* ═══ 3. Active Branches ═════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          Active Branches
          <span className="ml-1 text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
            {activeBranches.length} in progress
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
            >
              {/* Branch name */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <GitCommitHorizontal className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span className="text-xs font-mono font-semibold text-white truncate">
                    {branch.name}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ml-2 ${branchStatusColor(branch.status)}`}>
                  {branch.statusLabel}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-500">Progress</span>
                  <span className="text-[10px] font-mono text-slate-300">{branch.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${branchProgressBarColor(branch.status)} transition-all duration-700 ease-out`}
                    style={{ width: `${branch.progress}%` }}
                  />
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <FileCode2 className="w-3 h-3" />
                  {branch.filesChanged} file{branch.filesChanged !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {branch.author}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Clock className="w-3 h-3" />
                  {branch.age}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 4. Code Activity Feed ══════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            Code Activity Feed
            <span className="ml-auto text-[10px] text-slate-500">Live</span>
          </h2>
          <div className="space-y-0">
            {feedEvents.map((event, i) => {
              const Icon = event.icon
              const accent = feedAccentColor(event.accent)
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-3 group hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      event.accent === 'violet' ? 'bg-violet-500/10' :
                      event.accent === 'emerald' ? 'bg-emerald-500/10' :
                      event.accent === 'amber' ? 'bg-amber-500/10' :
                      'bg-slate-700/50'
                    }`}>
                      <Icon className={`w-3.5 h-3.5 ${accent.icon}`} />
                    </div>
                    {i < feedEvents.length - 1 && (
                      <div className="w-px h-4 bg-slate-800 mt-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white truncate">{event.message}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{event.detail}</span>
                      <span className="text-slate-700">·</span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Clock className="w-2.5 h-2.5" />
                        {event.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">All Gates Passed</span>
              </div>
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
              <span className="text-2xl font-bold text-white">23</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Branches This Week</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <GitPullRequest className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-white">18</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">PRs Generated</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-2xl font-bold text-white">342</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Lines / PR</div>
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
