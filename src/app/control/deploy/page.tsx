'use client'

import {
  Rocket,
  Hammer,
  TestTube2,
  Monitor,
  Flame,
  Globe,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Shield,
  Activity,
  Server,
  ExternalLink,
  Zap,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

// ─── Pipeline Steps Data ─────────────────────────────────────────────
const pipelineSteps = [
  {
    name: 'Build',
    icon: Hammer,
    status: 'completed' as const,
    duration: '1m 23s',
    detail: 'Compiled successfully',
  },
  {
    name: 'Test',
    icon: TestTube2,
    status: 'completed' as const,
    duration: '3m 47s',
    detail: '47/47 tests passed',
  },
  {
    name: 'Preview Deploy',
    icon: Monitor,
    status: 'completed' as const,
    detail: 'preview-v2.4.13.seosights.vercel.app',
    duration: '2m 05s',
  },
  {
    name: 'Smoke Test',
    icon: Flame,
    status: 'running' as const,
    detail: 'Checking critical paths...',
    duration: '~1m left',
  },
  {
    name: 'Production Deploy',
    icon: Globe,
    status: 'pending' as const,
    detail: 'Awaiting human approval',
    duration: '—',
  },
]

// ─── Pending Deployments Data ────────────────────────────────────────
const pendingDeployments = [
  {
    prNumber: 46,
    title: 'Fix pricing accessibility',
    approvedBy: 'mike@seosights.io',
    approvedAt: '2h ago',
    stagingStatus: 'Ready',
    stagingColor: 'cyan',
  },
  {
    prNumber: 43,
    title: 'Add schema markup to blog posts',
    approvedBy: 'sarah@seosights.io',
    approvedAt: '5h ago',
    stagingStatus: 'Deployed to Preview',
    stagingColor: 'emerald',
  },
]

// ─── Deploy History Data ─────────────────────────────────────────────
const deployHistory = [
  {
    version: 'v2.4.12',
    prNumber: 42,
    title: 'Optimize Lighthouse performance',
    result: 'success' as const,
    duration: '6m 14s',
    triggeredBy: 'admin@seosights.io',
    deployedAt: '6h ago',
  },
  {
    version: 'v2.4.11',
    prNumber: 41,
    title: 'Fix mobile nav overflow',
    result: 'success' as const,
    duration: '5m 52s',
    triggeredBy: 'dave@seosights.io',
    deployedAt: '1d ago',
  },
  {
    version: 'v2.4.10',
    prNumber: 39,
    title: 'Update Tailwind config',
    result: 'success' as const,
    duration: '7m 08s',
    triggeredBy: 'admin@seosights.io',
    deployedAt: '2d ago',
  },
  {
    version: 'v2.4.9',
    prNumber: 38,
    title: 'Add observatory dashboard',
    result: 'success' as const,
    duration: '8m 31s',
    triggeredBy: 'sarah@seosights.io',
    deployedAt: '3d ago',
  },
  {
    version: 'v2.4.8',
    prNumber: 37,
    title: 'Fix SSR hydration mismatch',
    result: 'failed' as const,
    duration: '2m 15s',
    triggeredBy: 'admin@seosights.io',
    deployedAt: '4d ago',
  },
]

// ─── Rollback Data ───────────────────────────────────────────────────
const rollbackInfo = {
  currentVersion: 'v2.4.12',
  previousVersion: 'v2.4.11',
  lastRollbackAge: 'Never',
  rollbackAvailable: true,
}

// ─── Footer Stats ────────────────────────────────────────────────────
const footerStats = [
  { label: 'Deploys This Week', value: '8', icon: Rocket, color: 'cyan' },
  { label: 'Avg Deploy Time', value: '6m 22s', icon: Clock, color: 'cyan' },
  { label: 'Rollback Rate', value: '3%', icon: RotateCcw, color: 'amber' },
  { label: 'Uptime', value: '99.97%', icon: Activity, color: 'emerald' },
]

// ─── Badge Component ─────────────────────────────────────────────────
function Badge({ text, color }: { text: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${colorMap[color] || colorMap.slate}`}>
      {text}
    </span>
  )
}

// ─── Pipeline Step Status Visual ─────────────────────────────────────
function PipelineStepStatus({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      </div>
    )
  }
  if (status === 'running') {
    return (
      <div className="w-7 h-7 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center animate-pulse">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-slate-600" />
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export default function DeployEnginePage() {
  return (
    <div className="space-y-6">
      {/* ═══ Section 1: Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Deploy Engine™</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-amber-400 font-medium">Idle — awaiting approval</span>
            </div>
          </div>
        </div>
        <a
          href="https://vercel.com/seosights"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Vercel Dashboard
        </a>
      </div>

      {/* ═══ Section 2: Deployment Pipeline ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Deployment Pipeline — PR #46
        </h2>
        <div className="flex items-center justify-between gap-0 overflow-x-auto pb-2">
          {pipelineSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.name} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center min-w-[80px]">
                  <PipelineStepStatus status={step.status} />
                  <div className="mt-2 flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${
                      step.status === 'completed' ? 'text-emerald-400' :
                      step.status === 'running' ? 'text-cyan-400' :
                      'text-slate-500'
                    }`} />
                    <span className={`text-xs font-semibold ${
                      step.status === 'completed' ? 'text-emerald-400' :
                      step.status === 'running' ? 'text-cyan-400' :
                      'text-slate-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${
                    step.status === 'running' ? 'text-cyan-400/70' :
                    step.status === 'completed' ? 'text-slate-400' :
                    'text-slate-600'
                  }`}>
                    {step.duration}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5 text-center max-w-[120px] truncate">
                    {step.detail}
                  </div>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                    step.status === 'completed' ? 'bg-emerald-500/60' :
                    'bg-slate-700'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ Section 3: Pending Deployments ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Pending Deployments
          <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{pendingDeployments.length} pending</span>
        </h2>
        <div className="space-y-3">
          {pendingDeployments.map((dep) => (
            <div
              key={dep.prNumber}
              className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/70 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-cyan-400 font-semibold">PR #{dep.prNumber}</span>
                    <span className="text-sm font-medium text-white">{dep.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Approved by {dep.approvedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dep.approvedAt}
                    </span>
                    <Badge text={dep.stagingStatus} color={dep.stagingColor} />
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-500/25 transition-colors">
                  <Rocket className="w-4 h-4" />
                  Deploy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 4: Current Production ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Current Production — seosights.com
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Version</div>
            <div className="text-sm font-bold text-cyan-400 font-mono">v2.4.12</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last Deploy</div>
            <div className="text-sm font-bold text-white">6h ago</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Deploy By</div>
            <div className="text-sm font-bold text-white truncate">admin@seosights.io</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Vercel</div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Healthy</span>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Uptime</div>
            <div className="text-sm font-bold text-emerald-400">99.97%</div>
          </div>
        </div>
      </div>

      {/* ═══ Section 5: Deploy History ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Deploy History
        </h2>
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {deployHistory.map((deploy) => (
            <div
              key={deploy.version}
              className="flex items-center gap-4 bg-slate-800/30 border border-slate-700/30 rounded-lg px-4 py-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                deploy.result === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {deploy.result === 'success'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <XCircle className="w-4 h-4 text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{deploy.version}</span>
                  <span className="text-sm text-white truncate">PR #{deploy.prNumber}: {deploy.title}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {deploy.triggeredBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {deploy.duration}
                  </span>
                  <span>{deploy.deployedAt}</span>
                </div>
              </div>
              <Badge
                text={deploy.result === 'success' ? 'Success' : 'Failed'}
                color={deploy.result === 'success' ? 'emerald' : 'red'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 6: Rollback Status ═══ */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                Rollback Status
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Current: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-cyan-400">{rollbackInfo.currentVersion}</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Rollback target: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-amber-400">{rollbackInfo.previousVersion}</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400">Last rollback: {rollbackInfo.lastRollbackAge}</span>
                </div>
              </div>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-semibold hover:bg-amber-500/25 transition-colors flex-shrink-0">
            <RotateCcw className="w-4 h-4" />
            Rollback to {rollbackInfo.previousVersion}
          </button>
        </div>
      </div>

      {/* ═══ Section 7: Footer Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {footerStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center"
            >
              <Icon className={`w-4 h-4 text-${stat.color}-400 mx-auto mb-2`} />
              <div className={`text-xl font-bold text-${stat.color}-400`}>{stat.value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
