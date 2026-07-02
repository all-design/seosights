'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Target, Activity, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react'

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

export function ClientZeroPage() {
  const [system, setSystem] = useState<SystemStatus | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, timelineRes, workersRes] = await Promise.all([
        fetch('/api/ops/status'),
        fetch('/api/ops/timeline?system=client_zero&limit=30'),
        fetch('/api/ops/workers'),
      ])

      if (statusRes.ok) {
        const data = await statusRes.json()
        const czSystem = (data.systems || []).find((s: SystemStatus) => s.systemName === 'client_zero')
        setSystem(czSystem || null)
      }
      if (timelineRes.ok) {
        const data = await timelineRes.json()
        setTimeline(data.events || [])
      }
      if (workersRes.ok) {
        const data = await workersRes.json()
        setWorkers(data.workers?.client_zero || [])
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
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-gray-800" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg bg-gray-800" />
      </div>
    )
  }

  const missionsTotal = system?.todayTotal || 3
  const missionsCompleted = system?.todayCompleted || 2
  const missionsPending = missionsTotal - missionsCompleted

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-sky-500/30 bg-sky-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/20">
                <Target className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Client Zero™</h2>
                <p className="text-xs text-gray-400">
                  Autonomous content execution engine
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Mission: Running
                </Badge>
              </div>
            </div>
            {system?.reasoning && (
              <p className="mt-2 text-xs text-gray-400 italic">💡 {system.reasoning}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Mission Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Today&apos;s Missions</p>
            <p className="text-xl font-bold text-white mt-1">{missionsTotal}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{missionsCompleted}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{missionsPending}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expected Gain</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              <p className="text-xl font-bold text-emerald-400">+5</p>
            </div>
            <p className="text-[10px] text-gray-500">AI Visibility points</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Mission Progress</span>
            <span className="text-xs font-mono text-sky-400">{system?.progress || 0}%</span>
          </div>
          <Progress value={system?.progress || 0} className="h-2 bg-gray-800" />
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
            <span>Published today: FAQ</span>
            <span>Replay: Scheduled</span>
            <span>Learning: Tomorrow</span>
          </div>
        </CardContent>
      </Card>

      {/* Client Zero Workers */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <CardTitle className="text-sm font-bold text-white">Mission Workers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className={`p-3 rounded-lg border ${
                  worker.status === 'running'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-gray-800/30 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      worker.status === 'running' ? 'bg-emerald-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-xs font-medium text-white capitalize">
                      {worker.workerName.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-gray-800 text-gray-400 border-gray-700">
                    {worker.status}
                  </Badge>
                </div>
                {worker.reasoning && (
                  <p className="text-[10px] text-gray-500 italic">💡 {worker.reasoning}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Mission Timeline */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400" />
            <CardTitle className="text-sm font-bold text-white">Live Mission Timeline</CardTitle>
            <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-2 py-1 border-b border-gray-800/50 last:border-0">
                  <span className="text-[10px] font-mono text-gray-600 w-20 flex-shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate">{event.title}</p>
                    {event.description && (
                      <p className="text-[10px] text-gray-500 truncate">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
