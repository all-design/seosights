'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { CalendarClock, CheckCircle2, Clock, AlertTriangle, Minus, XCircle, ArrowRight } from 'lucide-react'

interface ScheduleJob {
  id: string
  name: string
  systemName: string
  scheduledTime: string
  dependsOn: string
  condition: string | null
  status: string
  reasoning: string | null
  startedAt: string | null
  completedAt: string | null
  duration: number | null
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  running: Clock,
  pending: Minus,
  failed: XCircle,
  skipped: AlertTriangle,
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400',
  running: 'text-sky-400',
  pending: 'text-gray-500',
  failed: 'text-red-400',
  skipped: 'text-yellow-400',
}

const STATUS_BG: Record<string, string> = {
  completed: 'bg-emerald-500/5 border-emerald-500/20',
  running: 'bg-sky-500/5 border-sky-500/20',
  pending: 'bg-gray-800/30 border-gray-700',
  failed: 'bg-red-500/5 border-red-500/20',
  skipped: 'bg-yellow-500/5 border-yellow-500/20',
}

const SYSTEM_LABELS: Record<string, string> = {
  age: 'AGE',
  client_zero: 'Client Zero',
  qa_engine: 'QA Engine',
  observatory: 'Observatory',
  mission_control: 'Mission Control',
}

function formatDuration(ms: number | null) {
  if (!ms) return '—'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

export function SchedulePage() {
  const [jobs, setJobs] = useState<ScheduleJob[]>([])
  const [stats, setStats] = useState({ totalJobs: 0, completed: 0, running: 0, pending: 0, failed: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/schedule')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
        setStats({
          totalJobs: data.totalJobs || 0,
          completed: data.completed || 0,
          running: data.running || 0,
          pending: data.pending || 0,
          failed: data.failed || 0,
        })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-lg bg-gray-800" />
        <Skeleton className="h-96 rounded-lg bg-gray-800" />
      </div>
    )
  }

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CalendarClock className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Mission Control Schedule</h2>
                <p className="text-xs text-gray-400">
                  Daily schedule · {stats.totalJobs} jobs · Now {currentTimeStr}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-emerald-400">✓ {stats.completed} completed</span>
              <span className="text-xs text-sky-400">⟳ {stats.running} running</span>
              <span className="text-xs text-gray-500">○ {stats.pending} pending</span>
              {stats.failed > 0 && <span className="text-xs text-red-400">✗ {stats.failed} failed</span>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-bold text-white">Today&apos;s Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ScrollArea className="h-[600px]">
            <div className="relative">
              {/* Time markers */}
              <div className="absolute left-14 top-0 bottom-0 w-px bg-gray-800" />

              <div className="space-y-3">
                {jobs.map((job, i) => {
                  const StatusIcon = STATUS_ICONS[job.status] || Minus
                  const isPast = job.scheduledTime < currentTimeStr
                  const isCurrent = job.status === 'running'

                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative flex items-start gap-4"
                    >
                      {/* Time */}
                      <div className="w-12 text-right flex-shrink-0 pt-2">
                        <span className={`text-xs font-mono ${
                          isCurrent ? 'text-sky-400 font-bold' : isPast ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          {job.scheduledTime}
                        </span>
                      </div>

                      {/* Timeline dot */}
                      <div className="flex flex-col items-center flex-shrink-0 pt-2">
                        <div className={`h-3 w-3 rounded-full border-2 ${
                          job.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                          job.status === 'running' ? 'bg-sky-500 border-sky-500 animate-pulse' :
                          job.status === 'failed' ? 'bg-red-500 border-red-500' :
                          'bg-transparent border-gray-600'
                        }`} />
                        {i < jobs.length - 1 && (
                          <div className={`w-px h-full min-h-[20px] ${
                            job.status === 'completed' ? 'bg-emerald-500/30' : 'bg-gray-800'
                          }`} />
                        )}
                      </div>

                      {/* Job Card */}
                      <div className={`flex-1 p-3 rounded-lg border ${STATUS_BG[job.status] || 'border-gray-700'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-3.5 w-3.5 ${STATUS_COLORS[job.status] || 'text-gray-400'}`} />
                            <span className="text-xs font-medium text-white">{job.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-gray-800 text-gray-400 border-gray-700"
                            >
                              {SYSTEM_LABELS[job.systemName] || job.systemName}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${STATUS_COLORS[job.status] || 'text-gray-400'} bg-gray-800 border-gray-700`}
                            >
                              {job.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Dependency chain */}
                        {job.dependsOn && job.dependsOn !== '[]' && (() => {
                          try {
                            const deps = JSON.parse(job.dependsOn)
                            if (Array.isArray(deps) && deps.length > 0) {
                              return (
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                  <ArrowRight className="h-2.5 w-2.5" />
                                  <span>Depends on: {deps.join(', ')}</span>
                                </div>
                              )
                            }
                          } catch { /* ignore */ }
                          return null
                        })()}

                        {/* Reasoning */}
                        {job.reasoning && (
                          <p className="text-[10px] text-gray-500 italic mt-1">💡 {job.reasoning}</p>
                        )}

                        {/* Duration */}
                        {job.duration && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Duration: {formatDuration(job.duration)}
                          </p>
                        )}

                        {/* Condition */}
                        {job.condition && (
                          <p className="text-[10px] text-yellow-400/70 mt-0.5">
                            Condition: {job.condition}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
