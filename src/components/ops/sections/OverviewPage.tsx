'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import {
  Activity,
  Zap,
  ShieldCheck,
  Target,
  Telescope,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────── */

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
  lastHeartbeat: string | null
}

interface TimelineEvent {
  id: string
  systemName: string
  eventType: string
  title: string
  description: string | null
  timestamp: string
  iconName: string | null
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

interface HeartbeatData {
  overallStatus: string
  checks: Record<string, { ok: boolean; latency: number; status: string }>
}

/* ─── Helpers ───────────────────────────────────────────────────── */

const SYSTEM_ICONS: Record<string, React.ElementType> = {
  client_zero: Target,
  age: Zap,
  qa_engine: ShieldCheck,
  observatory: Telescope,
  mission_control: Activity,
}

const SYSTEM_COLORS: Record<string, string> = {
  client_zero: 'text-sky-400',
  age: 'text-amber-400',
  qa_engine: 'text-purple-400',
  observatory: 'text-teal-400',
  mission_control: 'text-emerald-400',
}

const SYSTEM_BG: Record<string, string> = {
  client_zero: 'bg-sky-500/10 border-sky-500/20',
  age: 'bg-amber-500/10 border-amber-500/20',
  qa_engine: 'bg-purple-500/10 border-purple-500/20',
  observatory: 'bg-teal-500/10 border-teal-500/20',
  mission_control: 'bg-emerald-500/10 border-emerald-500/20',
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'running':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    case 'waiting':
    case 'idle':
    case 'stopped':
      return <Minus className="h-3.5 w-3.5 text-yellow-400" />
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-red-400" />
    default:
      return <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'running': return 'bg-emerald-500'
    case 'waiting': case 'idle': case 'stopped': return 'bg-yellow-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'running': return 'Running'
    case 'waiting': return 'Waiting'
    case 'idle': return 'Idle'
    case 'stopped': return 'Stopped'
    case 'error': return 'Error'
    default: return status
  }
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/* ─── Sub-Components ────────────────────────────────────────────── */

function HeartbeatBanner({ heartbeat }: { heartbeat: HeartbeatData | null }) {
  const isHealthy = heartbeat?.overallStatus === 'healthy'
  const isDegraded = heartbeat?.overallStatus === 'degraded'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 flex items-center justify-between ${
        isHealthy
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isDegraded
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`h-3 w-3 rounded-full ${
            isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        <div>
          <span className="text-sm font-bold text-white">AI Heartbeat™</span>
          <span className={`ml-2 text-sm font-medium ${
            isHealthy ? 'text-emerald-400' : isDegraded ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {isHealthy ? 'All Systems Healthy' : isDegraded ? 'Degraded Performance' : 'Critical Alert'}
          </span>
        </div>
      </div>

      {/* Per-system mini indicators */}
      <div className="hidden sm:flex items-center gap-3">
        {heartbeat?.checks && Object.entries(heartbeat.checks).map(([key, check]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full ${
              check.status === 'healthy' ? 'bg-emerald-500' :
              check.status === 'idle' ? 'bg-gray-500' :
              check.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-[10px] text-gray-500 uppercase">{key}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function SystemStatusCard({ system }: { system: SystemStatus }) {
  const Icon = SYSTEM_ICONS[system.systemName] || Activity
  const colorClass = SYSTEM_COLORS[system.systemName] || 'text-gray-400'
  const bgClass = SYSTEM_BG[system.systemName] || 'bg-gray-500/10 border-gray-500/20'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border ${bgClass} bg-transparent`}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <CardTitle className="text-xs font-bold text-white">
                {system.displayName}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {getStatusIcon(system.status)}
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  system.status === 'running'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : system.status === 'waiting' || system.status === 'idle'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                {getStatusLabel(system.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {/* Phase */}
          {system.phase && (
            <div className="text-[10px] text-gray-500">
              Phase: <span className="text-gray-300 font-medium">{system.phase}</span>
            </div>
          )}

          {/* Progress bar */}
          {system.progress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500">Progress</span>
                <span className="text-[10px] text-gray-400 font-mono">{system.progress}%</span>
              </div>
              <Progress value={system.progress} className="h-1.5 bg-gray-800" />
            </div>
          )}

          {/* Reasoning */}
          {system.reasoning && (
            <div className="text-[10px] text-gray-400 italic leading-tight">
              💡 {system.reasoning}
            </div>
          )}

          {/* Metrics */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-emerald-400">✓ {system.todayCompleted}</span>
            <span className="text-gray-500">/ {system.todayTotal}</span>
            {system.todayFailed > 0 && (
              <span className="text-red-400">✗ {system.todayFailed}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function GlobalTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card className="border-gray-800 bg-transparent">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-bold text-white">Global Timeline™</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-gray-800 text-gray-400 border-gray-700">
            {events.length} events
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 py-1.5 border-b border-gray-800/50 last:border-0"
              >
                <span className="text-[10px] font-mono text-gray-600 w-12 flex-shrink-0 pt-0.5">
                  {formatTime(event.timestamp)}
                </span>
                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  event.systemName === 'age' ? 'bg-amber-500' :
                  event.systemName === 'client_zero' ? 'bg-sky-500' :
                  event.systemName === 'qa_engine' ? 'bg-purple-500' :
                  event.systemName === 'observatory' ? 'bg-teal-500' :
                  'bg-emerald-500'
                }`} />
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
  )
}

function ActiveWorkersBar({ workers }: { workers: Worker[] }) {
  const running = workers.filter(w => w.status === 'running')
  const idle = workers.filter(w => w.status === 'idle')
  const stopped = workers.filter(w => w.status === 'stopped')

  return (
    <Card className="border-gray-800 bg-transparent">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-bold text-white">Active Workers</CardTitle>
          <div className="flex items-center gap-2 ml-auto text-[10px]">
            <span className="text-emerald-400">● {running.length} Running</span>
            <span className="text-gray-500">● {idle.length} Idle</span>
            <span className="text-yellow-500">● {stopped.length} Stopped</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {workers.map((worker) => (
            <motion.div
              key={worker.id}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                worker.status === 'running'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : worker.status === 'idle'
                    ? 'bg-gray-800/50 border-gray-700 text-gray-500'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(worker.status)}`} />
              <span className="font-medium capitalize">{worker.workerName}</span>
              <span className="text-[10px] opacity-60">{worker.systemName.replace('_', ' ')}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Main Component ────────────────────────────────────────────── */

export function OverviewPage() {
  const [systems, setSystems] = useState<SystemStatus[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAllData = useCallback(async () => {
    try {
      const [statusRes, timelineRes, workersRes, hbRes] = await Promise.all([
        fetch('/api/ops/status'),
        fetch('/api/ops/timeline?limit=10'),
        fetch('/api/ops/workers'),
        fetch('/api/ops/heartbeat'),
      ])

      if (statusRes.ok) {
        const data = await statusRes.json()
        setSystems(data.systems || [])
      }
      if (timelineRes.ok) {
        const data = await timelineRes.json()
        setTimeline(data.events || [])
      }
      if (workersRes.ok) {
        const data = await workersRes.json()
        // Flatten all workers from grouped response
        const allWorkers: Worker[] = []
        if (data.workers) {
          Object.values(data.workers).forEach((group: unknown) => {
            if (Array.isArray(group)) {
              allWorkers.push(...(group as Worker[]))
            }
          })
        }
        setWorkers(allWorkers)
      }
      if (hbRes.ok) {
        const data = await hbRes.json()
        setHeartbeat(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg bg-gray-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg bg-gray-800" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg bg-gray-800" />
        <Skeleton className="h-24 rounded-lg bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Heartbeat Banner */}
      <HeartbeatBanner heartbeat={heartbeat} />

      {/* System Status Grid — show 4 main systems */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systems
          .filter(s => ['client_zero', 'age', 'qa_engine', 'observatory'].includes(s.systemName))
          .map((system) => (
            <SystemStatusCard key={system.id} system={system} />
          ))}
      </div>

      {/* Global Timeline */}
      <GlobalTimeline events={timeline} />

      {/* Active Workers Bar */}
      <ActiveWorkersBar workers={workers} />
    </div>
  )
}
