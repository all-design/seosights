'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  FileSearch,
  Link,
  Wrench,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface FunnelStep {
  key: string
  label: string
  count: number
  conversionFromPrevious: number | null
  dropOff: number | null
  isCritical: boolean
}

interface ActivationData {
  funnel: FunnelStep[]
  overallActivationRate: number
  totalRegistered: number
  totalCompleted: number
  conversionChart: { step: string; rate: number }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────

const stepIcons: Record<string, React.ReactNode> = {
  audit: <FileSearch className="h-5 w-5" />,
  connectGsc: <Link className="h-5 w-5" />,
  executeFix: <Wrench className="h-5 w-5" />,
  returnTomorrow: <RotateCcw className="h-5 w-5" />,
}

const stepColors: Record<string, string> = {
  audit: '#10b981',
  connectGsc: '#3b82f6',
  executeFix: '#f59e0b',
  returnTomorrow: '#8b5cf6',
}

// ─── Component ──────────────────────────────────────────────────────────

export default function ActivationDashboard() {
  const [data, setData] = useState<ActivationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivation() {
      try {
        setLoading(true)
        const res = await fetch('/api/superadmin/activation')
        if (!res.ok) throw new Error('Failed to fetch activation data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchActivation()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-6 text-center">
          <p className="text-red-400 text-sm">Error loading activation data: {error}</p>
        </Card>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const funnelMax = Math.max(...data.funnel.map((s) => s.count))

  return (
    <div className="space-y-6">
      {/* ── Overall Activation Rate ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-emerald-500/20 bg-gradient-to-r from-card/80 to-emerald-950/20 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Activation Rate</p>
              <p className="text-3xl font-bold text-emerald-400">
                {data.overallActivationRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.totalCompleted.toLocaleString()} of {data.totalRegistered.toLocaleString()} registered users
              </p>
            </div>
            <div className="text-right">
              <Badge className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-sm px-3 py-1">
                Activation
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Critical Drop-off Warning ──────────────────────────────── */}
      {data.funnel
        .filter((s) => s.isCritical)
        .map((step) => (
          <motion.div
            key={`warning-${step.key}`}
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
                    This is your next sprint.
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    <span className="text-red-400 font-medium">{step.dropOff?.toFixed(0)}% drop-off</span> at &quot;{step.label}&quot; —
                    80%+ of users are lost here. Fix this first.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

      {/* ── Visual Funnel ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Activation Funnel</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {data.funnel.map((step, idx) => {
                const widthPercent = funnelMax > 0 ? (step.count / funnelMax) * 100 : 0
                return (
                  <div key={step.key}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-40 shrink-0">
                        <div
                          className={`p-2 rounded-lg ${
                            step.isCritical
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {stepIcons[step.key]}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {step.label}
                        </span>
                      </div>
                      <div className="flex-1 relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ delay: 0.5 + idx * 0.12, duration: 0.6, ease: 'easeOut' }}
                          className={`h-10 rounded-lg flex items-center px-4 ${
                            step.isCritical
                              ? 'bg-gradient-to-r from-red-500/30 to-red-600/10'
                              : 'bg-gradient-to-r from-emerald-500/30 to-emerald-600/10'
                          }`}
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {step.count.toLocaleString()}
                          </span>
                        </motion.div>
                      </div>
                      <div className="w-24 text-right shrink-0">
                        {step.conversionFromPrevious !== null && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              step.isCritical
                                ? 'border-red-500/30 text-red-400'
                                : 'border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {step.conversionFromPrevious.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    {idx < data.funnel.length - 1 && (
                      <div className="flex items-center justify-center my-1">
                        <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        {step.dropOff !== null && (
                          <span
                            className={`text-xs ml-2 ${
                              step.isCritical ? 'text-red-400' : 'text-muted-foreground'
                            }`}
                          >
                            {step.dropOff.toFixed(0)}% drop-off
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Conversion Rate Bar Chart ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversion Rates per Step</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.conversionChart} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="step"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(v: number) => `${v}%`}
                    domain={[0, 100]}
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
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} name="Conversion Rate">
                    {data.conversionChart.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={stepColors[data.funnel[index]?.key || 'audit'] || '#10b981'}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
