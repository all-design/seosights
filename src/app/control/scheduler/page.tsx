'use client'

import { useEffect, useState } from 'react'
import {
  CalendarClock, CheckCircle2, Clock, Play,
  Shield, TrendingUp, Target, Zap, Brain, Timer,
  Settings2, ArrowRight, RefreshCw, Circle, XCircle,
  AlertCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────

interface ScheduleJob {
  id: string
  name: string
  systemName: string
  scheduledTime: string
  dependsOn: string
  condition: string | null
  status: string
  reasoning: string | null
  scheduledDate: string
  startedAt: string | null
  completedAt: string | null
  duration: number | null
  result: string | null
}

interface ScheduleData {
  jobs: ScheduleJob[]
  date: string
  totalJobs: number
  completed: number
  running: number
  pending: number
  failed: number
  generated?: boolean
  timestamp: string
}

// ─── Icon component ────────────────────────────────────────────────
// Static component to avoid "creating components during render" lint error

// ─── Countdown Hook ──────────────────────────────────────────────

function useCountdown(targetTime: string) {
  const targetDate = new Date()
  const [hours, minutes] = targetTime.split(':').map(Number)
  targetDate.setHours(hours, minutes, 0, 0)

  // Initialize diff to 0 to avoid hydration mismatch (Date.now() differs server vs client).
  // The actual value is computed in useEffect (client-only) on mount.
  const [diff, setDiff] = useState(0)
  const [isPast, setIsPast] = useState(true)

  useEffect(() => {
    const now = Date.now()
    const past = targetDate.getTime() < now
    setIsPast(past)
    if (!past) {
      setDiff(targetDate.getTime() - now)
      const timer = setInterval(() => {
        setDiff(targetDate.getTime() - Date.now())
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [targetDate])

  if (diff <= 0 || isPast) return { text: '00:00:00', overdue: true }

  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  return {
    text: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    overdue: false,
  }
}

// ─── Countdown Component ─────────────────────────────────────────

function SystemIcon({ systemName, className }: { systemName: string; className?: string }) {
  const cls = className || 'w-5 h-5 text-cyan-400'
  switch (systemName) {
    case 'qa_engine': return <Shield className={cls} />
    case 'age': return <TrendingUp className={cls} />
    case 'client_zero': return <Target className={cls} />
    case 'observatory': return <Clock className={cls} />
    case 'mission_control': return <Zap className={cls} />
    default: return <Brain className={cls} />
  }
}

function MissionCountdown({ job }: { job: ScheduleJob }) {
  const countdown = useCountdown(job.scheduledTime)

  const priorityBg: Record<string, string> = {
    qa_engine: 'bg-blue-500/10',
    age: 'bg-emerald-500/10',
    client_zero: 'bg-amber-500/10',
    observatory: 'bg-cyan-500/10',
    mission_control: 'bg-rose-500/10',
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${priorityBg[job.systemName] || 'bg-slate-800'}`}>
        <SystemIcon systemName={job.systemName} className="w-5 h-5 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{job.name}</span>
          {job.condition && (
            <span className="text-[10px] uppercase font-semibold text-amber-400">
              {job.condition}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 truncate">{job.reasoning || 'Scheduled task'}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="font-mono text-sm text-cyan-400">{countdown.text}</div>
        <div className="text-[10px] text-slate-600">{job.scheduledTime}</div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────

export default function MissionSchedulerPage() {
  const [data, setData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch schedule data')
        const json = await res.json()
        const jobs = json.scheduleJobs || []
        const scheduleSummary = json.scheduleSummary || {
          totalJobs: jobs.length,
          completed: jobs.filter((j: ScheduleJob) => j.status === 'completed').length,
          running: jobs.filter((j: ScheduleJob) => j.status === 'running').length,
          pending: jobs.filter((j: ScheduleJob) => j.status === 'pending').length,
          failed: jobs.filter((j: ScheduleJob) => j.status === 'failed').length,
        }
        setData({
          jobs,
          date: new Date().toISOString().split('T')[0],
          totalJobs: scheduleSummary.totalJobs,
          completed: scheduleSummary.completed,
          running: scheduleSummary.running,
          pending: scheduleSummary.pending,
          failed: scheduleSummary.failed,
          generated: jobs.length > 0,
          timestamp: json.timestamp || new Date().toISOString(),
        })
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CalendarClock className="w-7 h-7 text-cyan-400" />
              Mission Scheduler
            </h1>
            <p className="text-slate-400 text-sm mt-1">Orchestrating autonomous system runs</p>
          </div>
        </div>
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CalendarClock className="w-7 h-7 text-cyan-400" />
              Mission Scheduler
            </h1>
            <p className="text-slate-400 text-sm mt-1">Orchestrating autonomous system runs</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">Failed to load schedule data</p>
          <p className="text-slate-500 text-xs mt-1">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); setData(null); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const completedJobs = data.jobs.filter(j => j.status === 'completed')
  const runningJobs = data.jobs.filter(j => j.status === 'running')
  const pendingJobs = data.jobs.filter(j => j.status === 'pending')
  const failedJobs = data.jobs.filter(j => j.status === 'failed')

  // Upcoming: pending jobs sorted by time
  const upcomingJobs = pendingJobs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CalendarClock className="w-7 h-7 text-cyan-400" />
            Mission Scheduler
          </h1>
          <p className="text-slate-400 text-sm mt-1">Orchestrating autonomous system runs across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Healthy</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">Auto-sync</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{data.completed}</div>
          <div className="text-[10px] text-slate-500 uppercase mt-1">Completed</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{data.running}</div>
          <div className="text-[10px] text-slate-500 uppercase mt-1">Running</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{data.pending}</div>
          <div className="text-[10px] text-slate-500 uppercase mt-1">Pending</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{data.failed}</div>
          <div className="text-[10px] text-slate-500 uppercase mt-1">Failed</div>
        </div>
      </div>

      {/* Timeline + Upcoming Missions row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Today's Timeline */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            Today&apos;s Timeline
            <span className="ml-auto text-[10px] text-slate-500 font-normal uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </h2>

          {data.jobs.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[23px] top-2 bottom-2 w-px bg-slate-800" />

              <div className="space-y-0">
                {data.jobs.map((job, i) => {
                  const isLast = i === data.jobs.length - 1
                  const isRunning = job.status === 'running'
                  const isCompleted = job.status === 'completed'
                  const isFailed = job.status === 'failed'
                  const isPending = job.status === 'pending'

                  return (
                    <div key={job.id} className="relative flex items-start gap-4 pb-6">
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`
                          w-11 h-11 rounded-xl flex items-center justify-center border-2
                          ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/40' :
                            isRunning ? 'bg-cyan-500/10 border-cyan-500/40' :
                            isFailed ? 'bg-red-500/10 border-red-500/40' :
                            'bg-slate-800 border-slate-700'
                          }
                          ${isRunning ? 'animate-pulse' : ''}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : isRunning ? (
                            <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                          ) : isFailed ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        {!isLast && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-11 w-1 h-full">
                            <div className={`w-0.5 h-full mx-auto ${isCompleted ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
                          </div>
                        )}
                      </div>

                      <div className={`flex-1 pt-1.5 min-w-0 ${isPending ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xs text-slate-500">{job.scheduledTime}</span>
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                            isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                            isRunning ? 'bg-cyan-500/10 text-cyan-400' :
                            isFailed ? 'bg-red-500/10 text-red-400' :
                            'bg-slate-800 text-slate-500'
                          }`}>
                            <SystemIcon systemName={job.systemName} className="w-3 h-3" />
                            {job.name}
                          </div>
                          {isRunning && (
                            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold animate-pulse">
                              Running
                            </span>
                          )}
                        </div>
                        {job.reasoning && (
                          <div className="text-xs text-slate-400">{job.reasoning}</div>
                        )}
                        {isRunning && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-400 rounded-full animate-pulse" style={{ width: '63%' }} />
                            </div>
                            <span className="text-[10px] text-cyan-400 font-mono">63%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarClock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No scheduled jobs for today</p>
            </div>
          )}
        </div>

        {/* Upcoming Missions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            Upcoming Missions
          </h2>
          {upcomingJobs.length > 0 ? (
            <div className="space-y-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
              {upcomingJobs.map((job) => (
                <MissionCountdown key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">
                {runningJobs.length > 0 ? 'All jobs running or completed' : 'No pending missions'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Run History + Configuration row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* System Run History */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            System Run History
            <span className="ml-auto text-[10px] text-slate-500 font-normal">{completedJobs.length + failedJobs.length} runs</span>
          </h2>

          {completedJobs.length + failedJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold pb-2 border-b border-slate-800 mb-2">
                <div className="col-span-3">System</div>
                <div className="col-span-2">Start</div>
                <div className="col-span-2">End</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-3">Result</div>
              </div>

              <div className="space-y-0 max-h-96 overflow-y-auto custom-scrollbar">
                {[...completedJobs, ...failedJobs].map((job) => {
                  const durationSec = job.duration ? (job.duration / 1000).toFixed(0) + 's' : '—'
                  const startTime = job.startedAt ? new Date(job.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : job.scheduledTime
                  const endTime = job.completedAt ? new Date(job.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'
                  const isSuccess = job.status === 'completed'

                  return (
                    <div
                      key={job.id}
                      className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors rounded px-1"
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <SystemIcon systemName={job.systemName} className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="text-xs text-white truncate">{job.name}</span>
                      </div>
                      <div className="col-span-2 text-xs font-mono text-slate-400">{startTime}</div>
                      <div className="col-span-2 text-xs font-mono text-slate-400">{endTime}</div>
                      <div className="col-span-2 text-xs font-mono text-slate-300">{durationSec}</div>
                      <div className="col-span-3 flex items-center gap-1.5">
                        {isSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs text-emerald-400">Success</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-xs text-red-400">Failed</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No completed runs yet</p>
            </div>
          )}
        </div>

        {/* Schedule Configuration */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            Schedule Overview
          </h2>

          {data.jobs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {data.jobs.map((job) => {
                return (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <SystemIcon systemName={job.systemName} className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="text-xs font-medium text-white">{job.name}</span>
                    </div>
                    <div className="ml-9 space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-mono bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                          {job.scheduledTime}
                        </code>
                      </div>
                      {job.condition && (
                        <div className="text-[11px] text-amber-400">Condition: {job.condition}</div>
                      )}
                      {job.dependsOn && job.dependsOn !== '[]' && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          Depends on: {job.dependsOn}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No schedule configured</p>
            </div>
          )}

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-cyan-400">{data.totalJobs}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Jobs</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-emerald-400">
                {data.totalJobs > 0 ? Math.round((data.completed / data.totalJobs) * 100) : 0}%
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Completion</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
