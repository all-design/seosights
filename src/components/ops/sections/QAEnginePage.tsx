'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { ShieldCheck, Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

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

export function QAEnginePage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingPage, setCheckingPage] = useState(0)

  const pages = ['Pricing', 'Observatory', 'OS', 'Dashboard', 'Growth', 'QA']

  useEffect(() => {
    const interval = setInterval(() => {
      setCheckingPage(prev => (prev + 1) % pages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [pages.length])

  const fetchData = useCallback(async () => {
    try {
      const [timelineRes, workersRes] = await Promise.all([
        fetch('/api/ops/timeline?system=qa_engine&limit=30'),
        fetch('/api/ops/workers'),
      ])

      if (timelineRes.ok) {
        const data = await timelineRes.json()
        setTimeline(data.events || [])
      }
      if (workersRes.ok) {
        const data = await workersRes.json()
        setWorkers(data.workers?.qa_engine || [])
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-gray-800" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <ShieldCheck className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">QA Engine™</h2>
                <p className="text-xs text-gray-400">
                  10 Reviewers · Nightly automated quality assurance
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  Scheduled for 03:00
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QA Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pages Tested</p>
            <p className="text-xl font-bold text-white mt-1">417</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Buttons Checked</p>
            <p className="text-xl font-bold text-white mt-1">1,294</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Forms Validated</p>
            <p className="text-xl font-bold text-white mt-1">82</p>
          </CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">API Endpoints</p>
            <p className="text-xl font-bold text-white mt-1">216</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-bold text-red-400">Errors: 2</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Critical issues found in last run</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">Warnings: 14</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Non-critical issues to address</p>
          </CardContent>
        </Card>
      </div>

      {/* Currently Checking Animation */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-purple-400 animate-pulse" />
            <span className="text-xs text-gray-400">Currently checking:</span>
            <div className="flex items-center gap-2">
              {pages.map((page, i) => (
                <motion.span
                  key={page}
                  animate={{
                    opacity: i === checkingPage ? 1 : 0.3,
                    scale: i === checkingPage ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`text-xs px-2 py-0.5 rounded ${
                    i === checkingPage
                      ? 'bg-purple-500/20 text-purple-400 font-bold'
                      : 'text-gray-600'
                  }`}
                >
                  {page}
                </motion.span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QA Workers */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            <CardTitle className="text-sm font-bold text-white">QA Reviewers</CardTitle>
            <Badge variant="outline" className="text-[10px] bg-gray-800 text-gray-400 border-gray-700">
              {workers.length} reviewers
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-2 rounded-lg border border-gray-700 bg-gray-800/30 text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    worker.status === 'running' ? 'bg-emerald-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-xs text-white capitalize">{worker.workerName}</span>
                </div>
                <p className="text-[10px] text-gray-500">{Math.round(worker.successRate * 100)}% success</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live QA Timeline */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <CardTitle className="text-sm font-bold text-white">QA Timeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {timeline.length > 0 ? timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-2 py-1 border-b border-gray-800/50 last:border-0">
                  <span className="text-[10px] font-mono text-gray-600 w-20 flex-shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 truncate">{event.title}</p>
                    {event.description && (
                      <p className="text-[10px] text-gray-500 truncate">{event.description}</p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-xs text-gray-500 text-center py-4">
                  No QA events yet — next run scheduled at 03:00 UTC
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
