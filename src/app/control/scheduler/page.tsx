'use client'

import { useEffect, useState } from 'react'
import {
  CalendarClock, CheckCircle2, Clock, Play,
  Shield, TrendingUp, Target, Zap, Brain, Timer,
  Settings2, ArrowRight, RefreshCw, Circle, XCircle,
} from 'lucide-react'

// ── Mock Data ────────────────────────────────────────────────────────────────

interface ScheduleItem {
  time: string
  hour: number
  minute: number
  system: string
  icon: React.ElementType
  description: string
  status: 'completed' | 'running' | 'pending'
}

const todaySchedule: ScheduleItem[] = [
  { time: '06:00', hour: 6, minute: 0, system: 'QA Engine', icon: Shield, description: 'Full platform quality scan — 47 checks', status: 'completed' },
  { time: '07:00', hour: 7, minute: 0, system: 'Growth Engine', icon: TrendingUp, description: 'Content generation & publishing batch', status: 'completed' },
  { time: '08:00', hour: 8, minute: 0, system: 'Client Zero', icon: Target, description: 'AI Visibility measurement & validation', status: 'running' },
  { time: '09:00', hour: 9, minute: 0, system: 'Publish', icon: Zap, description: 'Approved content push to production', status: 'pending' },
  { time: '23:00', hour: 23, minute: 0, system: 'Learning', icon: Brain, description: 'Model retraining & knowledge updates', status: 'pending' },
]

interface UpcomingMission {
  id: string
  system: string
  icon: React.ElementType
  description: string
  scheduledAt: Date
  priority: 'high' | 'medium' | 'low'
}

const now = new Date()
const upcomingMissions: UpcomingMission[] = [
  {
    id: 'up-1',
    system: 'Publish',
    icon: Zap,
    description: 'Push 3 approved articles to production',
    scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
    priority: 'high',
  },
  {
    id: 'up-2',
    system: 'Observatory',
    icon: Clock,
    description: 'Crawl ChatGPT, Claude, Gemini, Perplexity',
    scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0),
    priority: 'medium',
  },
  {
    id: 'up-3',
    system: 'Growth Engine',
    icon: TrendingUp,
    description: 'Generate FAQ schema for 6 pages',
    scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0),
    priority: 'medium',
  },
  {
    id: 'up-4',
    system: 'QA Engine',
    icon: Shield,
    description: 'Mid-day stability & accessibility check',
    scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0),
    priority: 'low',
  },
  {
    id: 'up-5',
    system: 'Learning',
    icon: Brain,
    description: 'Model retraining & knowledge base updates',
    scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0),
    priority: 'high',
  },
]

interface RunHistory {
  id: string
  system: string
  icon: React.ElementType
  startTime: string
  endTime: string
  duration: string
  result: 'success' | 'failed'
}

const runHistory: RunHistory[] = [
  { id: 'rh-1', system: 'Growth Engine', icon: TrendingUp, startTime: '07:00', endTime: '07:42', duration: '42m', result: 'success' },
  { id: 'rh-2', system: 'QA Engine', icon: Shield, startTime: '06:00', endTime: '06:18', duration: '18m', result: 'success' },
  { id: 'rh-3', system: 'Client Zero', icon: Target, startTime: '08:00', endTime: '—', duration: 'running', result: 'success' },
  { id: 'rh-4', system: 'Growth Engine', icon: TrendingUp, startTime: '19:00', endTime: '19:55', duration: '55m', result: 'success' },
  { id: 'rh-5', system: 'Learning', icon: Brain, startTime: '23:00', endTime: '23:47', duration: '47m', result: 'success' },
  { id: 'rh-6', system: 'QA Engine', icon: Shield, startTime: '06:00', endTime: '06:22', duration: '22m', result: 'failed' },
  { id: 'rh-7', system: 'Publish', icon: Zap, startTime: '09:00', endTime: '09:08', duration: '8m', result: 'success' },
  { id: 'rh-8', system: 'Observatory', icon: Clock, startTime: '10:30', endTime: '11:15', duration: '45m', result: 'success' },
  { id: 'rh-9', system: 'Growth Engine', icon: TrendingUp, startTime: '07:00', endTime: '07:38', duration: '38m', result: 'success' },
  { id: 'rh-10', system: 'QA Engine', icon: Shield, startTime: '06:00', endTime: '06:19', duration: '19m', result: 'success' },
]

interface CronConfig {
  system: string
  icon: React.ElementType
  schedule: string
  humanReadable: string
  timezone: string
}

const cronConfigs: CronConfig[] = [
  { system: 'QA Engine', icon: Shield, schedule: '0 6 * * *', humanReadable: 'Every day at 06:00', timezone: 'UTC' },
  { system: 'Growth Engine', icon: TrendingUp, schedule: '0 7 * * *', humanReadable: 'Every day at 07:00', timezone: 'UTC' },
  { system: 'Client Zero', icon: Target, schedule: '0 8 * * *', humanReadable: 'Every day at 08:00', timezone: 'UTC' },
  { system: 'Publish', icon: Zap, schedule: '0 9 * * *', humanReadable: 'Every day at 09:00', timezone: 'UTC' },
  { system: 'Observatory', icon: Clock, schedule: '30 10 * * *', humanReadable: 'Every day at 10:30', timezone: 'UTC' },
  { system: 'Learning', icon: Brain, schedule: '0 23 * * *', humanReadable: 'Every day at 23:00', timezone: 'UTC' },
  { system: 'QA Mid-day', icon: Shield, schedule: '0 14 * * 1-5', humanReadable: 'Weekdays at 14:00', timezone: 'UTC' },
]

// ── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(targetDate: Date) {
  const [diff, setDiff] = useState(targetDate.getTime() - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setDiff(targetDate.getTime() - Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, text: '00:00:00', overdue: true }

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  return {
    hours,
    minutes,
    seconds,
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    overdue: false,
  }
}

// ── Countdown Component ──────────────────────────────────────────────────────

function MissionCountdown({ mission }: { mission: UpcomingMission }) {
  const countdown = useCountdown(mission.scheduledAt)
  const Icon = mission.icon

  const priorityColor = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-slate-400',
  }

  const priorityBg = {
    high: 'bg-red-500/10',
    medium: 'bg-amber-500/10',
    low: 'bg-slate-800',
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${priorityBg[mission.priority]}`}>
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{mission.system}</span>
          <span className={`text-[10px] uppercase font-semibold ${priorityColor[mission.priority]}`}>
            {mission.priority}
          </span>
        </div>
        <div className="text-xs text-slate-500 truncate">{mission.description}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="font-mono text-sm text-cyan-400">{countdown.text}</div>
        <div className="text-[10px] text-slate-600">
          {mission.scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function MissionSchedulerPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) return null

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

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-slate-800" />

            <div className="space-y-0">
              {todaySchedule.map((item, i) => {
                const Icon = item.icon
                const isLast = i === todaySchedule.length - 1

                return (
                  <div key={item.time} className="relative flex items-start gap-4 pb-6">
                    {/* Timeline node */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`
                        w-11 h-11 rounded-xl flex items-center justify-center border-2
                        ${item.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : item.status === 'running'
                            ? 'bg-cyan-500/10 border-cyan-500/40'
                            : 'bg-slate-800 border-slate-700'
                        }
                        ${item.status === 'running' ? 'animate-pulse' : ''}
                      `}>
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : item.status === 'running' ? (
                          <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      {/* Connector dot */}
                      {!isLast && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-11 w-1 h-full">
                          <div className={`w-0.5 h-full mx-auto ${
                            item.status === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-800'
                          }`} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`
                      flex-1 pt-1.5 min-w-0
                      ${item.status === 'pending' ? 'opacity-50' : ''}
                    `}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs text-slate-500">{item.time}</span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.status === 'running'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-slate-800 text-slate-500'
                        }`}>
                          <Icon className="w-3 h-3" />
                          {item.system}
                        </div>
                        {item.status === 'running' && (
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold animate-pulse">
                            Running
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                      {item.status === 'running' && (
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
        </div>

        {/* Upcoming Missions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            Upcoming Missions
          </h2>
          <div className="space-y-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
            {upcomingMissions.map((mission) => (
              <MissionCountdown key={mission.id} mission={mission} />
            ))}
          </div>
        </div>
      </div>

      {/* Run History + Configuration row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* System Run History */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            System Run History
            <span className="ml-auto text-[10px] text-slate-500 font-normal">Last 10 runs</span>
          </h2>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold pb-2 border-b border-slate-800 mb-2">
            <div className="col-span-3">System</div>
            <div className="col-span-2">Start</div>
            <div className="col-span-2">End</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-3">Result</div>
          </div>

          <div className="space-y-0 max-h-96 overflow-y-auto custom-scrollbar">
            {runHistory.map((run) => {
              const Icon = run.icon
              return (
                <div
                  key={run.id}
                  className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors rounded px-1"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-white truncate">{run.system}</span>
                  </div>
                  <div className="col-span-2 text-xs font-mono text-slate-400">{run.startTime}</div>
                  <div className="col-span-2 text-xs font-mono text-slate-400">{run.endTime}</div>
                  <div className="col-span-2 text-xs font-mono text-slate-300">{run.duration}</div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    {run.result === 'success' ? (
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
        </div>

        {/* Scheduler Configuration */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            Scheduler Configuration
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {cronConfigs.map((config) => {
              const Icon = config.icon
              return (
                <div
                  key={config.system}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-xs font-medium text-white">{config.system}</span>
                  </div>
                  <div className="ml-9 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                        {config.schedule}
                      </code>
                    </div>
                    <div className="text-[11px] text-slate-400">{config.humanReadable}</div>
                    <div className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {config.timezone}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-cyan-400">7</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active Jobs</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-800/30">
              <div className="text-lg font-bold text-emerald-400">100%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">On-time Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
