'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Users, Activity, CheckCircle2, Minus, XCircle, AlertTriangle } from 'lucide-react'

interface Worker {
  id: string
  systemName: string
  workerName: string
  status: string
  reasoning: string | null
  currentTask: string | null
  startedAt: string | null
  totalRuns: number
  successRate: number
}

const SYSTEM_LABELS: Record<string, string> = {
  age: 'AGE',
  client_zero: 'Client Zero',
  qa_engine: 'QA Engine',
  observatory: 'Observatory',
  mission_control: 'Mission Control',
}

const SYSTEM_COLORS: Record<string, string> = {
  age: 'text-amber-400',
  client_zero: 'text-sky-400',
  qa_engine: 'text-purple-400',
  observatory: 'text-teal-400',
  mission_control: 'text-emerald-400',
}

const SYSTEM_BG: Record<string, string> = {
  age: 'bg-amber-500/10 border-amber-500/20',
  client_zero: 'bg-sky-500/10 border-sky-500/20',
  qa_engine: 'bg-purple-500/10 border-purple-500/20',
  observatory: 'bg-teal-500/10 border-teal-500/20',
  mission_control: 'bg-emerald-500/10 border-emerald-500/20',
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'running': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    case 'idle': return <Minus className="h-3.5 w-3.5 text-gray-400" />
    case 'stopped': return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
    case 'error': return <XCircle className="h-3.5 w-3.5 text-red-400" />
    default: return <Minus className="h-3.5 w-3.5 text-gray-500" />
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'running': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'idle': return 'bg-gray-800 text-gray-400 border-gray-700'
    case 'stopped': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
    case 'error': return 'bg-red-500/10 text-red-400 border-red-500/30'
    default: return 'bg-gray-800 text-gray-400 border-gray-700'
  }
}

export function WorkersPage() {
  const [workersBySystem, setWorkersBySystem] = useState<Record<string, Worker[]>>({})
  const [totalWorkers, setTotalWorkers] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/workers')
      if (res.ok) {
        const data = await res.json()
        setWorkersBySystem(data.workers || {})
        setTotalWorkers(data.totalWorkers || 0)
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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg bg-gray-800" />
        ))}
      </div>
    )
  }

  // Aggregate stats
  const allWorkers = Object.values(workersBySystem).flat()
  const running = allWorkers.filter(w => w.status === 'running').length
  const idle = allWorkers.filter(w => w.status === 'idle').length
  const stopped = allWorkers.filter(w => w.status === 'stopped').length
  const errors = allWorkers.filter(w => w.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Active Workers™</h2>
                <p className="text-xs text-gray-400">
                  {totalWorkers} workers across {Object.keys(workersBySystem).length} systems
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-emerald-400">● {running} Running</span>
                <span className="text-gray-500">● {idle} Idle</span>
                <span className="text-yellow-400">● {stopped} Stopped</span>
                {errors > 0 && <span className="text-red-400">● {errors} Error</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workers by System */}
      {Object.entries(workersBySystem).map(([systemName, workers]) => (
        <Card key={systemName} className={`border ${SYSTEM_BG[systemName] || 'border-gray-800 bg-transparent'}`}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${SYSTEM_COLORS[systemName] || 'text-gray-400'}`} />
              <CardTitle className="text-sm font-bold text-white">
                {SYSTEM_LABELS[systemName] || systemName}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-gray-800 text-gray-400 border-gray-700">
                {workers.length} workers
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {workers.map((worker) => (
                <motion.div
                  key={worker.id}
                  whileHover={{ scale: 1.005 }}
                  className="p-3 rounded-lg border border-gray-700/50 bg-gray-900/30"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(worker.status)}
                      <span className="text-xs font-medium text-white capitalize">
                        {worker.workerName.replace(/_/g, ' ')}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${getStatusBadgeColor(worker.status)}`}
                      >
                        {worker.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-gray-500">{worker.totalRuns} runs</span>
                      <span className={`font-mono ${
                        worker.successRate >= 0.9 ? 'text-emerald-400' :
                        worker.successRate >= 0.8 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(worker.successRate * 100)}%
                      </span>
                    </div>
                  </div>
                  {worker.reasoning && (
                    <p className="text-[10px] text-gray-500 italic">💡 {worker.reasoning}</p>
                  )}
                  {worker.currentTask && (
                    <p className="text-[10px] text-gray-400 mt-0.5">→ {worker.currentTask}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
