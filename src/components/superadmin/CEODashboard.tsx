'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Eye,
  FileSearch,
  UserPlus,
  CheckCircle,
  Zap,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDown,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface FunnelStep {
  key: string
  label: string
  value: number
  yesterday: number
  trend: number
  conversionFromPrevious: number | null
}

interface DailyMetric {
  date: string
  visitors: number
  registrations: number
  completedAudits: number
  paidUsers: number
}

interface CEOMetricsData {
  funnel: FunnelStep[]
  mrr: { value: number; yesterday: number; trend: number }
  dailyTrend: DailyMetric[]
}

// ─── Helpers ────────────────────────────────────────────────────────────

const stepIcons: Record<string, React.ReactNode> = {
  visitors: <Eye className="h-4 w-4" />,
  freeAudits: <FileSearch className="h-4 w-4" />,
  registrations: <UserPlus className="h-4 w-4" />,
  completedAudits: <CheckCircle className="h-4 w-4" />,
  activatedUsers: <Zap className="h-4 w-4" />,
  paidUsers: <CreditCard className="h-4 w-4" />,
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return n.toLocaleString('en-US')
  return n.toString()
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

// ─── Component ──────────────────────────────────────────────────────────

export default function CEODashboard() {
  const [data, setData] = useState<CEOMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        const res = await fetch('/api/superadmin/ceo-metrics')
        if (!res.ok) throw new Error('Failed to fetch CEO metrics')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-6 text-center">
          <p className="text-red-400 text-sm">Error loading CEO metrics: {error}</p>
        </Card>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const funnelMax = Math.max(...data.funnel.map((s) => s.value))

  return (
    <div className="space-y-6">
      {/* ── Funnel Metric Cards ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3"
      >
        {data.funnel.map((step, idx) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
          >
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  {stepIcons[step.key]}
                  <span className="truncate">{step.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {formatNumber(step.value)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {step.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      step.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {step.trend >= 0 ? '+' : ''}
                    {step.trend.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs yday</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── MRR Card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="border-emerald-500/20 bg-gradient-to-r from-card/80 to-emerald-950/20 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(data.mrr.value)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                {data.mrr.trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    data.mrr.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {data.mrr.trend >= 0 ? '+' : ''}
                  {data.mrr.trend.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Yesterday: {formatCurrency(data.mrr.yesterday)}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Funnel Visualization ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-emerald-400" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-2">
              {data.funnel.map((step, idx) => {
                const widthPercent = funnelMax > 0 ? (step.value / funnelMax) * 100 : 0
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 text-right truncate">
                      {step.label}
                    </span>
                    <div className="flex-1 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ delay: 0.8 + idx * 0.1, duration: 0.6, ease: 'easeOut' }}
                        className="h-8 rounded-md bg-gradient-to-r from-emerald-500/40 to-emerald-600/20 flex items-center px-3"
                      >
                        <span className="text-xs font-semibold text-emerald-300">
                          {formatNumber(step.value)}
                        </span>
                      </motion.div>
                    </div>
                    {step.conversionFromPrevious !== null && (
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500/30 text-emerald-400"
                      >
                        {step.conversionFromPrevious.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 7-Day Trend Chart ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">7-Day Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyTrend} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="visitors" fill="rgba(16,185,129,0.3)" name="Visitors" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="registrations" fill="rgba(16,185,129,0.5)" name="Registrations" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paidUsers" fill="rgba(16,185,129,0.8)" name="Paid Users" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
