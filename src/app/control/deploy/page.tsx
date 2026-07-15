'use client'

import { useState, useEffect } from 'react'
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
  RotateCcw,
  Shield,
  Activity,
  Server,
  ExternalLink,
  Zap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

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

// ─── Pipeline stage definitions (static architecture) ──────────────
const PIPELINE_STAGES = [
  { name: 'Build', icon: Hammer },
  { name: 'Test', icon: TestTube2 },
  { name: 'Preview', icon: Monitor },
  { name: 'Smoke Test', icon: Flame },
  { name: 'Production', icon: Globe },
]

// ─── Main Component ──────────────────────────────────────────────────
export default function DeployEnginePage() {
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [factoryData, setFactoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [scheduleRes, factoryRes] = await Promise.all([
          fetch('/api/ops/schedule'),
          fetch('/api/factory/status'),
        ])
        if (!scheduleRes.ok) throw new Error('Failed to fetch deployment schedule')
        const schedule = await scheduleRes.json()
        setScheduleData(schedule)

        if (factoryRes.ok) {
          const factory = await factoryRes.json()
          setFactoryData(factory)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-400 mb-1">Failed to load deployment data</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  // ─── Derive pipeline steps from schedule ─────────────────
  const jobs = scheduleData?.jobs || []
  const completedJobs = jobs.filter((j: any) => j.status === 'completed')
  const runningJobs = jobs.filter((j: any) => j.status === 'running')
  const pendingJobs = jobs.filter((j: any) => j.status === 'pending')
  const failedJobs = jobs.filter((j: any) => j.status === 'failed')

  // Map schedule progress to pipeline stages
  const completedCount = completedJobs.length
  const totalJobs = jobs.length
  const pipelineSteps = PIPELINE_STAGES.map((stage, i) => {
    const threshold = ((i + 1) / PIPELINE_STAGES.length) * totalJobs
    const isRunning = completedCount >= threshold - 1 && completedCount < threshold && runningJobs.length > 0
    const isCompleted = completedCount >= threshold
    return {
      ...stage,
      status: isCompleted ? 'completed' as const : isRunning ? 'running' as const : 'pending' as const,
      duration: isCompleted ? 'Done' : isRunning ? 'In progress' : '—',
      detail: isCompleted ? 'Stage complete' : isRunning ? 'Processing...' : 'Waiting',
    }
  })

  // ─── Derive pending deployments from schedule running/pending jobs ──
  const pendingDeployments = [...runningJobs, ...pendingJobs].slice(0, 4).map((job: any) => ({
    id: job.id,
    name: job.name || 'Unknown job',
    systemName: job.systemName || 'unknown',
    scheduledTime: job.scheduledTime || '—',
    status: job.status,
    reasoning: job.reasoning || null,
  }))

  // ─── Derive deploy history from completed/failed schedule jobs ──
  const deployHistory = [...completedJobs, ...failedJobs].slice(0, 5).map((job: any, i: number) => ({
    id: job.id,
    name: job.name || 'Unknown deployment',
    systemName: job.systemName || 'unknown',
    result: (job.status === 'completed' ? 'success' : 'failed') as 'success' | 'failed',
    duration: job.duration ? `${Math.round(job.duration / 1000)}s` : 'N/A',
    scheduledTime: job.scheduledTime || '—',
    completedAt: job.completedAt
      ? (() => {
          const diff = Date.now() - new Date(job.completedAt).getTime()
          const hrs = Math.floor(diff / 3600000)
          if (hrs < 24) return `${hrs}h ago`
          return `${Math.floor(hrs / 24)}d ago`
        })()
      : 'N/A',
  }))

  // ─── Derive rollback info from factory data ──────────────
  const rollbackAvailable = factoryData?.system?.qaEngine === 'operational'

  // ─── Derive footer stats from real data ──────────────────
  const successRate = totalJobs > 0
    ? `${Math.round((completedJobs.length / totalJobs) * 100)}%`
    : '—'
  const avgDuration = completedJobs.length > 0
    ? (() => {
        const total = completedJobs.reduce((sum: number, j: any) => sum + (j.duration || 0), 0)
        const avgMs = total / completedJobs.length
        const mins = Math.floor(avgMs / 60000)
        const secs = Math.floor((avgMs % 60000) / 1000)
        return `${mins}m ${secs}s`
      })()
    : '—'

  const footerStats = [
    { label: 'Jobs Today', value: String(totalJobs), icon: Rocket, color: 'cyan' },
    { label: 'Avg Duration', value: avgDuration, icon: Clock, color: 'cyan' },
    { label: 'Failed', value: String(failedJobs.length), icon: RotateCcw, color: 'amber' },
    { label: 'Success Rate', value: successRate, icon: Activity, color: 'emerald' },
  ]

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
              <div className={`w-2 h-2 rounded-full ${runningJobs.length > 0 ? 'bg-cyan-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={`text-xs font-medium ${runningJobs.length > 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {runningJobs.length > 0 ? 'Deploying' : 'Idle — awaiting approval'}
              </span>
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
          Deployment Pipeline
          <span className="ml-auto text-[10px] text-slate-500">{completedCount}/{totalJobs} jobs complete</span>
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
        {pendingDeployments.length > 0 ? (
          <div className="space-y-3">
            {pendingDeployments.map((dep) => (
              <div
                key={dep.id}
                className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-cyan-400 font-semibold">{dep.systemName}</span>
                      <span className="text-sm font-medium text-white">{dep.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Scheduled: {dep.scheduledTime}
                      </span>
                      <Badge
                        text={dep.status === 'running' ? 'Running' : 'Pending'}
                        color={dep.status === 'running' ? 'cyan' : 'amber'}
                      />
                    </div>
                    {dep.reasoning && (
                      <div className="text-[11px] text-slate-400 mt-1">{dep.reasoning}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No pending deployments</p>
            <p className="text-xs text-slate-500 mt-1">All scheduled jobs have been completed</p>
          </div>
        )}
      </div>

      {/* ═══ Section 4: Current Production ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Current Production — seosights.com
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">System</div>
            <div className={`text-sm font-bold ${factoryData?.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
              {factoryData?.ok ? 'Healthy' : 'Degraded'}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">QA Engine</div>
            <div className={`text-sm font-bold ${
              factoryData?.system?.qaEngine === 'operational' ? 'text-emerald-400' :
              factoryData?.system?.qaEngine === 'degraded' ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {factoryData?.system?.qaEngine || 'Unknown'}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">AI Router</div>
            <div className={`text-sm font-bold ${
              factoryData?.system?.aiRouter === 'operational' ? 'text-emerald-400' :
              factoryData?.system?.aiRouter === 'degraded' ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {factoryData?.system?.aiRouter || 'Unknown'}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tasks</div>
            <div className="text-sm font-bold text-white">{factoryData?.counts?.factoryTasks ?? 0}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">AI Mode</div>
            <div className="text-sm font-bold text-cyan-400">
              {factoryData?.aiProviders?.using === 'live-llm' ? 'Live LLM' : 'Fallback'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 5: Deploy History ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Deploy History
        </h2>
        {deployHistory.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {deployHistory.map((deploy) => (
              <div
                key={deploy.id}
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
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{deploy.systemName}</span>
                    <span className="text-sm text-white truncate">{deploy.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {deploy.duration}
                    </span>
                    <span>{deploy.completedAt}</span>
                  </div>
                </div>
                <Badge
                  text={deploy.result === 'success' ? 'Success' : 'Failed'}
                  color={deploy.result === 'success' ? 'emerald' : 'red'}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No deployment history</p>
            <p className="text-xs text-slate-500 mt-1">Completed deployments will appear here</p>
          </div>
        )}
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
                  <span className="text-sm text-slate-300">System: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-cyan-400">{factoryData?.ok ? 'healthy' : 'degraded'}</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">Rollback: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-amber-400">{rollbackAvailable ? 'available' : 'N/A'}</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400">Failed jobs: {failedJobs.length}</span>
                </div>
              </div>
            </div>
          </div>
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
