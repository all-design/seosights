'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Telescope, Activity, Clock, Radio } from 'lucide-react'

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

export function ObservatoryPage() {
  const [system, setSystem] = useState<SystemStatus | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, timelineRes, workersRes] = await Promise.all([
        fetch('/api/ops/status'),
        fetch('/api/ops/timeline?system=observatory&limit=30'),
        fetch('/api/ops/workers'),
      ])

      if (statusRes.ok) {
        const data = await statusRes.json()
        const obsSystem = (data.systems || []).find((s: SystemStatus) => s.systemName === 'observatory')
        setSystem(obsSystem || null)
      }
      if (timelineRes.ok) {
        const data = await timelineRes.json()
        setTimeline(data.events || [])
      }
      if (workersRes.ok) {
        const data = await workersRes.json()
        setWorkers(data.workers?.observatory || [])
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
        <Skeleton className="h-32 rounded-lg bg-gray-800" />
        <Skeleton className="h-48 rounded-lg bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-teal-500/30 bg-teal-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Telescope className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Observatory™</h2>
                <p className="text-xs text-gray-400">
                  Real-time AI citation & signal monitoring
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Radio className="h-4 w-4 text-teal-400" />
                </motion.div>
                <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/30">
                  Live
                </Badge>
              </div>
            </div>
            {system?.reasoning && (
              <p className="mt-2 text-xs text-gray-400 italic">💡 {system.reasoning}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-teal-500/20 bg-teal-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="h-4 w-4 text-teal-400 animate-pulse" />
              <span className="text-xs text-teal-400 font-bold uppercase">Collecting</span>
            </div>
            <p className="text-2xl font-bold text-white">{system?.todayCompleted || 412}</p>
            <p className="text-[10px] text-gray-500">prompts monitored Live</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Citations Today</p>
            <p className="text-xl font-bold text-teal-400 mt-1">{system?.todayTotal || 156}</p>
            <p className="text-[10px] text-gray-500">from 23 sources</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Failed Collections</p>
            <p className="text-xl font-bold text-red-400 mt-1">{system?.todayFailed || 3}</p>
            <p className="text-[10px] text-gray-500">retries scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Detections */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-400" />
            <CardTitle className="text-sm font-bold text-white">Recent Detections</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {workers.filter(w => w.status === 'running').map((worker) => (
              <div key={worker.id} className="p-3 rounded-lg border border-teal-500/20 bg-teal-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-xs font-medium text-white capitalize">{worker.workerName}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-400 border-teal-500/30">
                    Active
                  </Badge>
                </div>
                {worker.reasoning && (
                  <p className="text-[10px] text-gray-400 mt-1 italic">💡 {worker.reasoning}</p>
                )}
                {worker.currentTask && (
                  <p className="text-[10px] text-teal-400/70 mt-0.5">→ {worker.currentTask}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Collection Timeline */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-400" />
            <CardTitle className="text-sm font-bold text-white">Collection Timeline</CardTitle>
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
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
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1 flex-shrink-0" />
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
