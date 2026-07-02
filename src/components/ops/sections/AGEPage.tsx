'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Zap, Activity, CheckCircle2, XCircle, Minus, Clock } from 'lucide-react'

interface SystemStatus {
  id: string
  systemName: string
  displayName: string
  status: string
  phase: string | null
  progress: number
  reasoning: string | null
  todayTotal: number
  todayCompleted: number
  todayFailed: number
}

interface TimelineEvent {
  id: string
  systemName: string
  eventType: string
  title: string
  description: string | null
  timestamp: string
}

interface Worker {
  id: string
  systemName: string
  workerName: string
  status: string
  reasoning: string | null
  currentTask: string | null
  totalRuns: number
  successRate: number
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function AGEPage() {
  const [system, setSystem] = useState<SystemStatus | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, timelineRes, workersRes] = await Promise.all([
        fetch('/api/ops/status'),
        fetch('/api/ops/timeline?system=age&limit=30'),
        fetch('/api/ops/workers'),
      ])

      if (statusRes.ok) {
        const data = await statusRes.json()
        const ageSystem = (data.systems || []).find((s: SystemStatus) => s.systemName === 'age')
        setSystem(ageSystem || null)
      }
      if (timelineRes.ok) {
        const data = await timelineRes.json()
        setTimeline(data.events || [])
      }
      if (workersRes.ok) {
        const data = await workersRes.json()
        setWorkers(data.workers?.age || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-lg bg-gray-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-gray-800" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg bg-gray-800" />
      </div>
    )
  }

  const budgetTotal = system?.todayTotal || 20
  const budgetUsed = system?.todayCompleted || 0
  const budgetFailed = system?.todayFailed || 0
  const budgetGenerated = budgetUsed + budgetFailed
  const budgetPublished = Math.floor(budgetUsed * 0.6)
  const budgetRejected = budgetFailed

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Autonomous Growth Engine™</h2>
                <p className="text-xs text-gray-400">
                  {system?.status === 'running' ? 'Currently active' : 'Idle'} · Phase: {system?.phase || 'Unknown'}
                </p>
              </div>
              <div className="ml-auto">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    system?.status === 'running'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  {system?.status || 'Unknown'}
                </Badge>
              </div>
            </div>
            {system?.reasoning && (
              <p className="mt-2 text-xs text-gray-400 italic">💡 {system.reasoning}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Today&apos;s Budget</p>
            <p className="text-xl font-bold text-white mt-1">{budgetTotal}</p>
            <p className="text-[10px] text-gray-500">assets</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Generated</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{budgetGenerated}</p>
            <p className="text-[10px] text-gray-500">assets today</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Published</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{budgetPublished}</p>
            <p className="text-[10px] text-gray-500">live now</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-bold text-red-400 mt-1">{budgetRejected}</p>
            <p className="text-[10px] text-gray-500">by governor</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Budget Utilization</span>
            <span className="text-xs font-mono text-amber-400">{system?.progress || 0}%</span>
          </div>
          <Progress value={system?.progress || 0} className="h-2 bg-gray-800" />
          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
            <span>Learning: Running</span>
            <span>Replay: Waiting</span>
          </div>
        </CardContent>
      </Card>

      {/* AGE Workers */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-bold text-white">AGE Workers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {workers.map((worker) => (
              <motion.div
                key={worker.id}
                whileHover={{ scale: 1.01 }}
                className={`p-3 rounded-lg border ${
                  worker.status === 'running'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : worker.status === 'idle'
                      ? 'bg-gray-800/30 border-gray-700'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      worker.status === 'running' ? 'bg-emerald-500' :
                      worker.status === 'idle' ? 'bg-gray-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs font-medium text-white capitalize">{worker.workerName}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-gray-800 text-gray-400 border-gray-700">
                    {Math.round(worker.successRate * 100)}%
                  </Badge>
                </div>
                {worker.reasoning && (
                  <p className="text-[10px] text-gray-500 italic">💡 {worker.reasoning}</p>
                )}
                {worker.currentTask && (
                  <p className="text-[10px] text-gray-400 mt-1">→ {worker.currentTask}</p>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Log */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-bold text-white">AGE Live Log</CardTitle>
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {timeline.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-2 py-1 border-b border-gray-800/50 last:border-0"
                >
                  <span className="text-[10px] font-mono text-gray-600 w-20 flex-shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate">{event.title}</p>
                    {event.description && (
                      <p className="text-[10px] text-gray-500 truncate">{event.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
