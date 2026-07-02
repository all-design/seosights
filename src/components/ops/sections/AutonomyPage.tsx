'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Gauge, CheckCircle2, AlertTriangle, Minus } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface AutonomyMetric {
  id: string
  systemName: string
  date: string
  planned: number
  completed: number
  failed: number
  rate: number
}

interface AutonomyData {
  today: {
    metrics: AutonomyMetric[]
    totalPlanned: number
    totalCompleted: number
    totalFailed: number
    overallRate: number
    autonomyPercentage: number
  }
  trend: Array<{
    date: string
    planned: number
    completed: number
    failed: number
    rate: number
  }>
  dailyReport: {
    id: string
    date: string
    totalJobs: number
    completedJobs: number
    failedJobs: number
    skippedJobs: number
    summary: string | null
  } | null
}

const SYSTEM_LABELS: Record<string, string> = {
  client_zero: 'Client Zero',
  age: 'AGE',
  qa_engine: 'QA Engine',
  observatory: 'Observatory',
  mission_control: 'AI Router',
}

const SYSTEM_COLORS: Record<string, string> = {
  client_zero: '#38bdf8',
  age: '#fbbf24',
  qa_engine: '#a78bfa',
  observatory: '#2dd4bf',
  mission_control: '#34d399',
}

function getAutonomyClassification(pct: number) {
  if (pct > 95) return { label: 'Fully Autonomous', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
  if (pct >= 80) return { label: 'High Autonomy', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' }
  if (pct >= 60) return { label: 'Semi-Autonomous', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' }
  return { label: 'Requires Attention', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' }
}

function formatNumber(n: number) {
  return n.toLocaleString()
}

export function AutonomyPage() {
  const [data, setData] = useState<AutonomyData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/autonomy')
      if (res.ok) {
        const json = await res.json()
        setData(json)
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
        <Skeleton className="h-32 rounded-lg bg-gray-800" />
        <Skeleton className="h-48 rounded-lg bg-gray-800" />
        <Skeleton className="h-64 rounded-lg bg-gray-800" />
      </div>
    )
  }

  const pct = data?.today?.autonomyPercentage || 0
  const classification = getAutonomyClassification(pct)

  return (
    <div className="space-y-4">
      {/* Big Number Header */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={`border ${classification.bg}`}>
          <CardContent className="pt-6 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gauge className="h-6 w-6 text-emerald-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                Platform Autonomy™
              </span>
            </div>
            <motion.p
              className="text-6xl font-bold text-white mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {pct}%
            </motion.p>
            <Badge
              variant="outline"
              className={`text-xs font-bold ${classification.color} border-current/30`}
            >
              {classification.label}
            </Badge>

            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
              <span>Planned: <span className="text-white font-medium">{formatNumber(data?.today?.totalPlanned || 0)}</span></span>
              <span>Completed: <span className="text-emerald-400 font-medium">{formatNumber(data?.today?.totalCompleted || 0)}</span></span>
              <span>Failed: <span className="text-red-400 font-medium">{formatNumber(data?.today?.totalFailed || 0)}</span></span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formula */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-gray-400 mb-2">Autonomy Formula</p>
          <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700 font-mono text-xs text-gray-300">
            Autonomy = Completed / Planned × 100
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            Measures how much of the planned work the platform completes autonomously without human intervention.
            Includes all 5 engines: Client Zero, AGE, QA Engine, Observatory, and AI Router.
          </p>
        </CardContent>
      </Card>

      {/* Per-System Breakdown */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-bold text-white">Per-System Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 font-medium pb-2 pr-4">Engine</th>
                  <th className="text-right text-gray-500 font-medium pb-2 pr-4">Planned</th>
                  <th className="text-right text-gray-500 font-medium pb-2 pr-4">Completed</th>
                  <th className="text-right text-gray-500 font-medium pb-2 pr-4">Failed</th>
                  <th className="text-right text-gray-500 font-medium pb-2 pr-4">Rate</th>
                  <th className="text-center text-gray-500 font-medium pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.today?.metrics.map((metric) => {
                  const rate = metric.planned > 0 ? Math.round((metric.completed / metric.planned) * 100) : 0
                  const isGood = rate >= 90
                  const isWarning = rate >= 70 && rate < 90

                  return (
                    <tr key={metric.id} className="border-b border-gray-800/50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: SYSTEM_COLORS[metric.systemName] || '#6b7280' }}
                          />
                          <span className="text-white font-medium">
                            {SYSTEM_LABELS[metric.systemName] || metric.systemName}
                          </span>
                        </div>
                      </td>
                      <td className="text-right text-gray-400 py-2 pr-4 font-mono">{formatNumber(metric.planned)}</td>
                      <td className="text-right text-emerald-400 py-2 pr-4 font-mono">{formatNumber(metric.completed)}</td>
                      <td className="text-right text-red-400 py-2 pr-4 font-mono">{formatNumber(metric.failed)}</td>
                      <td className="text-right py-2 pr-4 font-mono">
                        <span className={isGood ? 'text-emerald-400' : isWarning ? 'text-yellow-400' : 'text-red-400'}>
                          {rate}%
                        </span>
                      </td>
                      <td className="text-center py-2">
                        {isGood ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                        ) : (
                          <Minus className="h-4 w-4 text-red-400 inline" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Trend Chart */}
      <Card className="border-gray-800 bg-transparent">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-bold text-white">7-Day Autonomy Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend || []}>
                <defs>
                  <linearGradient id="autonomyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val)
                    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  labelFormatter={(label: string) => {
                    const d = new Date(label)
                    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
                  }}
                  formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Autonomy Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#autonomyGradient)"
                />
                {/* Threshold line at 80% */}
                <Line
                  type="monotone"
                  dataKey={() => 0.8}
                  stroke="#fbbf24"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="High Autonomy Threshold"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-4 bg-emerald-500 rounded" />
              <span>Autonomy Rate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-4 bg-yellow-500 rounded" style={{ borderTop: '1px dashed #fbbf24' }} />
              <span>80% Threshold</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification Legend */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-gray-400 mb-3">Autonomy Classification</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { pct: '>95%', label: 'Fully Autonomous', color: 'text-emerald-400', dot: 'bg-emerald-500' },
              { pct: '80-95%', label: 'High Autonomy', color: 'text-sky-400', dot: 'bg-sky-500' },
              { pct: '60-80%', label: 'Semi-Autonomous', color: 'text-yellow-400', dot: 'bg-yellow-500' },
              { pct: '<60%', label: 'Requires Attention', color: 'text-red-400', dot: 'bg-red-500' },
            ].map((cls) => (
              <div key={cls.label} className="flex items-center gap-2 p-2 rounded bg-gray-900/50 border border-gray-800">
                <div className={`h-2 w-2 rounded-full ${cls.dot}`} />
                <div>
                  <span className={`text-xs font-medium ${cls.color}`}>{cls.pct}</span>
                  <p className="text-[10px] text-gray-500">{cls.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
