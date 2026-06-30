'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Calendar,
  Database,
  TrendingUp,
  Code2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface ChartItem {
  chartType: string
  chartKey: string
  title: string
  description: string | null
  dataJson: any
  dateRange: string | null
  dataPoints: number
  embedCount: number
  lastUpdated: string
}

interface ChartData {
  charts: ChartItem[]
}

// ── Color Palette (no indigo) ────────────────────────────────

const CHART_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue (for Gemini etc.)
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

// ── Preview / Fallback Data ──────────────────────────────────

function makeChartDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

// Generate 12 monthly data points
function generateMonthlyData(startVal: number, trend: number): Array<{ date: string; value: number }> {
  const points: Array<{ date: string; value: number }> = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const noise = (Math.random() - 0.5) * startVal * 0.15
    const val = startVal + trend * (12 - i) + noise
    points.push({ date: d.toISOString().slice(0, 10), value: Math.round(Math.max(0, val)) })
  }
  return points
}

const PREVIEW_DATA: ChartData = {
  charts: [
    {
      chartType: 'line',
      chartKey: 'source_trend_github_365d',
      title: 'GitHub Citation Trend (365d)',
      description: 'How often leading AI models cite GitHub repositories over the past year',
      dataJson: generateMonthlyData(120, 8),
      dateRange: '365d',
      dataPoints: 365,
      embedCount: 14,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      chartType: 'line',
      chartKey: 'source_trend_wikipedia_365d',
      title: 'Wikipedia Citation Trend (365d)',
      description: 'Wikipedia reference frequency across AI models over the past year',
      dataJson: generateMonthlyData(280, -5),
      dateRange: '365d',
      dataPoints: 365,
      embedCount: 9,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      chartType: 'area',
      chartKey: 'source_trend_reddit_decline',
      title: 'Reddit Citation Decline',
      description: 'Declining trend of Reddit citations across ChatGPT and Claude since Q4 2024',
      dataJson: generateMonthlyData(95, -7),
      dateRange: '180d',
      dataPoints: 180,
      embedCount: 22,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      chartType: 'line',
      chartKey: 'model_citations_comparison',
      title: 'Model Citation Volume Comparison',
      description: 'Total citation output per model, indexed to baseline, showing divergence patterns',
      dataJson: generateMonthlyData(100, 3),
      dateRange: '90d',
      dataPoints: 90,
      embedCount: 7,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      chartType: 'area',
      chartKey: 'industry_health_scores',
      title: 'Industry AI Visibility Health Scores',
      description: 'Average AI Search Index scores across 12 industries over the past 6 months',
      dataJson: generateMonthlyData(68, 1.5),
      dateRange: '180d',
      dataPoints: 180,
      embedCount: 31,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      chartType: 'line',
      chartKey: 'citation_distribution_domains',
      title: 'Citation Distribution by Domain Authority',
      description: 'Distribution of AI citations segmented by domain authority tiers (High/Medium/Low)',
      dataJson: generateMonthlyData(55, 2),
      dateRange: '90d',
      dataPoints: 90,
      embedCount: 5,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ],
}

// ── Custom Tooltip ───────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-white">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Chart Renderer ───────────────────────────────────────────

function ChartRenderer({ chart }: { chart: ChartItem }) {
  const data = chart.dataJson

  // Handle various data shapes
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-slate-500 text-xs">No data points</p>
      </div>
    )
  }

  // If dataJson is an array of objects (standard chart format)
  if (Array.isArray(data)) {
    const keys = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== 'date' && k !== 'label' && k !== 'name' && k !== 'x') : []

    if (chart.chartType === 'area') {
      return (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={data[0]?.date !== undefined ? 'date' : data[0]?.label !== undefined ? 'label' : data[0]?.name !== undefined ? 'name' : 'x'}
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {keys.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // Default: line chart
    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey={data[0]?.date !== undefined ? 'date' : data[0]?.label !== undefined ? 'label' : data[0]?.name !== undefined ? 'name' : 'x'}
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {keys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                activeDot={{ r: 5, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // If dataJson is a single object with series arrays
  if (typeof data === 'object' && !Array.isArray(data)) {
    const seriesKeys = Object.keys(data).filter((k) => Array.isArray(data[k]))

    if (seriesKeys.length > 0) {
      // Build chart data from the first series (use its length as reference)
      const firstSeries = data[seriesKeys[0]]
      const chartData = firstSeries.map((_: unknown, idx: number) => {
        const entry: Record<string, unknown> = { index: idx + 1 }
        seriesKeys.forEach((key) => {
          if (data[key] && data[key][idx] !== undefined) {
            entry[key] = data[key][idx]
          }
        })
        return entry
      })

      return (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="index" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
              <Tooltip content={<CustomTooltip />} />
              {seriesKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }
  }

  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-slate-500 text-xs">Chart format not supported</p>
    </div>
  )
}

// ── Loading Skeleton ─────────────────────────────────────────

function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-80 bg-slate-800" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-5 w-48 bg-slate-800 mb-2" />
              <Skeleton className="h-4 w-32 bg-slate-800 mb-4" />
              <Skeleton className="h-48 w-full bg-slate-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryCharts() {
  const [data, setData] = useState<ChartData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/observatory/charts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setIsPreview(false)
      setError(null)
    } catch (err) {
      // If we already have data, keep it. If not, use preview.
      if (!data) {
        setData(PREVIEW_DATA)
        setIsPreview(true)
      }
      setError(null) // Don't show error, use preview
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copyEmbedCode = async (chartKey: string) => {
    const embedCode = `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/observatory/charts/embed/${chartKey}" width="800" height="400" frameborder="0" title="${chartKey}"></iframe>`
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopiedKey(chartKey)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = embedCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedKey(chartKey)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const shareChart = (chartKey: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/observatory/charts/embed/${chartKey}`
    if (navigator.share) {
      navigator.share({ title: 'AI Search Observatory Chart', url })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <ChartsSkeleton />
      </div>
    )
  }

  if (!data || data.charts.length === 0) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <BarChart3 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No charts available yet</p>
        <p className="text-slate-500 text-xs mt-1">Charts will appear as data is collected and analyzed</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BarChart3 className="h-7 w-7 text-emerald-400" />
            Public Charts
          </motion.h2>
          {isPreview && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
              Preview — Connect for live data
            </Badge>
          )}
        </div>

        <motion.button
          onClick={fetchData}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors text-xs self-start sm:self-auto"
          whileTap={{ rotate: 180 }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </motion.button>
      </div>

      <motion.p
        className="text-slate-400 text-sm sm:text-base max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Embeddable, citable, linkable. Real data, no fluff.
      </motion.p>

      {/* ── Chart Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.charts.map((chart, idx) => (
          <motion.div
            key={chart.chartKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors h-full flex flex-col">
              <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                {/* Title & badges */}
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                    {chart.title}
                  </h3>
                  {chart.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{chart.description}</p>
                  )}
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {chart.dateRange && (
                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 bg-slate-800/50 gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {chart.dateRange}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 bg-slate-800/50 gap-1">
                    <Database className="h-2.5 w-2.5" />
                    {chart.dataPoints.toLocaleString()} points
                  </Badge>
                  {chart.embedCount > 0 && (
                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 bg-slate-800/50 gap-1">
                      <Code2 className="h-2.5 w-2.5" />
                      {chart.embedCount} embed{chart.embedCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Chart preview */}
                <div className="flex-1 mb-4">
                  <ChartRenderer chart={chart} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                    onClick={() => copyEmbedCode(chart.chartKey)}
                  >
                    {copiedKey === chart.chartKey ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Embed
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                    onClick={() => shareChart(chart.chartKey)}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    Share
                  </Button>
                  <span className="ml-auto text-[10px] text-slate-600">
                    Updated {new Date(chart.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
