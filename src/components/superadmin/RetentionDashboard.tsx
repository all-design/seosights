'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AlertTriangle, Clock, Calendar, TrendingUp } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface RetentionMetric {
  label: string
  value: number
  status: 'green' | 'yellow' | 'red'
}

interface CohortRow {
  week: string
  users: number
  d1: number
  d7: number
  d30: number
}

interface TrendPoint {
  date: string
  d1: number
  d7: number
  d30: number
}

interface RetentionData {
  metrics: RetentionMetric[]
  cohorts: CohortRow[]
  trend: TrendPoint[]
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getRetentionStatus(value: number, threshold: 'd1' | 'd7' | 'd30'): 'green' | 'yellow' | 'red' {
  if (threshold === 'd1') {
    if (value >= 40) return 'green'
    if (value >= 20) return 'yellow'
    return 'red'
  }
  if (threshold === 'd7') {
    if (value >= 25) return 'green'
    if (value >= 12) return 'yellow'
    return 'red'
  }
  // d30
  if (value >= 10) return 'green'
  if (value >= 5) return 'yellow'
  return 'red'
}

function statusColor(status: 'green' | 'yellow' | 'red') {
  switch (status) {
    case 'green':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
    case 'yellow':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/5'
    case 'red':
      return 'text-red-400 border-red-500/30 bg-red-500/5'
  }
}

function statusGlow(status: 'green' | 'yellow' | 'red') {
  switch (status) {
    case 'green':
      return 'shadow-emerald-500/20'
    case 'yellow':
      return 'shadow-amber-500/20'
    case 'red':
      return 'shadow-red-500/20'
  }
}

function cellColor(value: number): string {
  if (value >= 40) return 'bg-emerald-500/20 text-emerald-400'
  if (value >= 25) return 'bg-emerald-500/10 text-emerald-300'
  if (value >= 15) return 'bg-amber-500/10 text-amber-400'
  if (value >= 5) return 'bg-red-500/10 text-red-400'
  return 'bg-red-500/20 text-red-500'
}

// ─── Component ──────────────────────────────────────────────────────────

export default function RetentionDashboard() {
  const [data, setData] = useState<RetentionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRetention() {
      try {
        setLoading(true)
        const res = await fetch('/api/superadmin/retention')
        if (!res.ok) throw new Error('Failed to fetch retention data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchRetention()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-6 text-center">
          <p className="text-red-400 text-sm">Error loading retention data: {error}</p>
        </Card>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const d1Metric = data.metrics.find((m) => m.label === 'D1')

  return (
    <div className="space-y-6">
      {/* ── Warning Banner ─────────────────────────────────────────── */}
      {d1Metric && d1Metric.status !== 'green' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-red-500/40 bg-gradient-to-r from-red-950/30 to-card/80 backdrop-blur-sm shadow-lg shadow-red-500/10">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-bold text-lg">
                  If this isn&apos;t green... nothing else matters.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  D1 retention is at {d1Metric.value.toFixed(1)}% — focus on getting users to
                  return on Day 1 before optimizing anything else.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Three Metric Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <Card
              className={`border-white/10 bg-card/80 backdrop-blur-sm shadow-lg ${statusGlow(metric.status)} hover:border-white/20 transition-colors`}
            >
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {metric.label === 'D1' && <Clock className="h-4 w-4 text-muted-foreground" />}
                  {metric.label === 'D7' && <Calendar className="h-4 w-4 text-muted-foreground" />}
                  {metric.label === 'D30' && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground font-medium">{metric.label} Retention</span>
                </div>
                <p className="text-4xl font-bold text-foreground mb-2">
                  {metric.value.toFixed(1)}%
                </p>
                <Badge className={`${statusColor(metric.status)} text-xs`}>
                  {metric.status === 'green' ? 'Healthy' : metric.status === 'yellow' ? 'Needs Attention' : 'Critical'}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Retention Trend Line Chart ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Retention Trends</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="d1" stroke="#10b981" strokeWidth={2} dot={false} name="D1" />
                  <Line type="monotone" dataKey="d7" stroke="#f59e0b" strokeWidth={2} dot={false} name="D7" />
                  <Line type="monotone" dataKey="d30" stroke="#ef4444" strokeWidth={2} dot={false} name="D30" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cohort Table ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cohort Retention Table</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Week</TableHead>
                  <TableHead className="text-muted-foreground text-right">Users</TableHead>
                  <TableHead className="text-muted-foreground text-right">D1</TableHead>
                  <TableHead className="text-muted-foreground text-right">D7</TableHead>
                  <TableHead className="text-muted-foreground text-right">D30</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cohorts.map((row) => (
                  <TableRow key={row.week} className="border-white/5">
                    <TableCell className="font-medium text-foreground">{row.week}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.users.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor(row.d1)}`}>
                        {row.d1.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor(row.d7)}`}>
                        {row.d7.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cellColor(row.d30)}`}>
                        {row.d30.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
