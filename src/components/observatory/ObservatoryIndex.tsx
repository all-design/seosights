'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  Activity,
  BarChart3,
  ArrowUpDown,
  Database,
  Signal,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface Industry {
  slug: string
  name: string
  indexScore: number
  previousScore: number
  trend: string
  dataPoints: number
  signalsCount: number
  lastUpdated: string | null
}

interface IndexData {
  industries: Industry[]
  overallIndex: number
  trend: string
}

type SortField = 'score' | 'trend' | 'name'
type SortDirection = 'asc' | 'desc'

// ── Helpers ──────────────────────────────────────────────────

function getTrendIcon(trend: string, size: 'sm' | 'lg' = 'sm') {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  switch (trend) {
    case 'rising':
    case 'improving':
    case 'stable_up':
      return <ArrowUpRight className={`${sizeClass} text-emerald-400`} />
    case 'falling':
    case 'declining':
    case 'high_volatility':
      return <ArrowDownRight className={`${sizeClass} text-red-400`} />
    case 'stable':
    case 'recovering':
      return <Minus className={`${sizeClass} text-amber-400`} />
    default:
      return <Minus className={`${sizeClass} text-slate-400`} />
  }
}

function getTrendLabel(trend: string): string {
  const labels: Record<string, string> = {
    rising: 'Rising',
    falling: 'Falling',
    stable: 'Stable',
    improving: 'Improving',
    declining: 'Declining',
    low_volatility: 'Low Volatility',
    high_volatility: 'High Volatility',
    recovering: 'Recovering',
    stable_up: 'Trending Up',
  }
  return labels[trend] || trend
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'rising':
    case 'improving':
    case 'stable_up':
      return '#10b981'
    case 'falling':
    case 'declining':
    case 'high_volatility':
      return '#ef4444'
    case 'stable':
    case 'recovering':
      return '#f59e0b'
    default:
      return '#94a3b8'
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function getScoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (score >= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (score >= 40) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

// Generate mock sparkline data based on score and trend
function generateSparkline(score: number, trend: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  const trendFactor = trend === 'rising' || trend === 'improving' || trend === 'stable_up' ? 1 : trend === 'falling' || trend === 'declining' ? -1 : 0
  const baseScore = score - trendFactor * 5

  for (let i = 0; i < 10; i++) {
    const noise = (Math.random() - 0.5) * 8
    const progress = i / 9
    const y = baseScore + trendFactor * 10 * progress + noise
    points.push({ x: i, y: Math.max(0, Math.min(100, y)) })
  }
  return points
}

// ── Preview / Fallback Data ──────────────────────────────────

const PREVIEW_DATA: IndexData = {
  overallIndex: 74,
  trend: 'stable',
  industries: [
    { slug: 'healthcare', name: 'Healthcare', indexScore: 74, previousScore: 71, trend: 'rising', dataPoints: 1840, signalsCount: 12, lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { slug: 'finance', name: 'Finance', indexScore: 83, previousScore: 82, trend: 'stable', dataPoints: 2100, signalsCount: 8, lastUpdated: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
    { slug: 'law', name: 'Law', indexScore: 69, previousScore: 72, trend: 'declining', dataPoints: 1560, signalsCount: 15, lastUpdated: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
    { slug: 'saas', name: 'SaaS', indexScore: 81, previousScore: 78, trend: 'rising', dataPoints: 1920, signalsCount: 6, lastUpdated: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
    { slug: 'education', name: 'Education', indexScore: 62, previousScore: 65, trend: 'declining', dataPoints: 1340, signalsCount: 11, lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { slug: 'e-commerce', name: 'E-Commerce', indexScore: 70, previousScore: 70, trend: 'stable', dataPoints: 1680, signalsCount: 9, lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { slug: 'real-estate', name: 'Real Estate', indexScore: 58, previousScore: 60, trend: 'declining', dataPoints: 980, signalsCount: 7, lastUpdated: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
    { slug: 'insurance', name: 'Insurance', indexScore: 71, previousScore: 68, trend: 'rising', dataPoints: 1420, signalsCount: 10, lastUpdated: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
    { slug: 'travel', name: 'Travel', indexScore: 55, previousScore: 57, trend: 'declining', dataPoints: 890, signalsCount: 14, lastUpdated: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
    { slug: 'construction', name: 'Construction', indexScore: 48, previousScore: 50, trend: 'declining', dataPoints: 620, signalsCount: 5, lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { slug: 'restaurants', name: 'Restaurants', indexScore: 52, previousScore: 49, trend: 'rising', dataPoints: 760, signalsCount: 8, lastUpdated: new Date(Date.now() - 1000 * 60 * 38).toISOString() },
    { slug: 'dentists', name: 'Dentists', indexScore: 66, previousScore: 64, trend: 'rising', dataPoints: 1100, signalsCount: 6, lastUpdated: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  ],
}

// ── Custom Tooltip for sparklines ────────────────────────────

function SparklineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 shadow-xl">
      <span className="text-xs text-white font-semibold">{Math.round(payload[0].value)}</span>
    </div>
  )
}

// ── Loading Skeleton ─────────────────────────────────────────

function IndexSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-80 bg-slate-800" />

      {/* Overall index skeleton */}
      <div className="flex justify-center">
        <Card className="bg-slate-900/50 border-slate-800 w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Skeleton className="h-16 w-16 rounded-full bg-slate-800 mx-auto mb-3" />
            <Skeleton className="h-8 w-24 bg-slate-800 mx-auto mb-2" />
          </CardContent>
        </Card>
      </div>

      {/* Sort bar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 bg-slate-800 rounded-lg" />
        <Skeleton className="h-9 w-28 bg-slate-800 rounded-lg" />
        <Skeleton className="h-9 w-28 bg-slate-800 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 bg-slate-800 mb-3" />
              <Skeleton className="h-10 w-16 bg-slate-800 mb-2" />
              <Skeleton className="h-3 w-20 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Industry Card ────────────────────────────────────────────

function IndustryCard({ industry, index }: { industry: Industry; index: number }) {
  const scoreColor = getScoreColor(industry.indexScore)
  const delta = industry.indexScore - industry.previousScore
  const sparklineData = useMemo(() => generateSparkline(industry.indexScore, industry.trend), [industry.indexScore, industry.trend])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.8), duration: 0.3 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors h-full">
        <CardContent className="p-4 sm:p-6">
          {/* Header: name + trend icon */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200 truncate pr-2">{industry.name}</h4>
            {getTrendIcon(industry.trend)}
          </div>

          {/* Score + delta */}
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-3xl font-bold"
              style={{ color: scoreColor }}
            >
              {Math.round(industry.indexScore)}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>

          {/* Previous score + delta */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500">
              Prev: {Math.round(industry.previousScore)}
            </span>
            {delta !== 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-5 border-0 ${
                  delta > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {delta > 0 ? '+' : ''}{Math.round(delta)}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 border-0`}
              style={{
                color: getTrendColor(industry.trend),
                backgroundColor: `${getTrendColor(industry.trend)}20`,
              }}
            >
              {getTrendLabel(industry.trend)}
            </Badge>
          </div>

          {/* Mini sparkline */}
          <div className="h-12 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <XAxis dataKey="x" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip content={<SparklineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke={scoreColor}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: scoreColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Footer stats */}
          <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Database className="h-2.5 w-2.5" />
              {industry.dataPoints.toLocaleString()} points
            </span>
            <span className="flex items-center gap-1">
              <Signal className="h-2.5 w-2.5" />
              {industry.signalsCount} signal{industry.signalsCount !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryIndex() {
  const [data, setData] = useState<IndexData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/observatory/index')
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  const sortedIndustries = useMemo(() => {
    if (!data) return []
    const sorted = [...data.industries].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'score':
          comparison = a.indexScore - b.indexScore
          break
        case 'trend': {
          const trendOrder: Record<string, number> = { rising: 3, improving: 3, stable_up: 3, recovering: 2, stable: 1, falling: 0, declining: 0, high_volatility: 0 }
          comparison = (trendOrder[a.trend] ?? 1) - (trendOrder[b.trend] ?? 1)
          break
        }
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [data, sortField, sortDirection])

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <IndexSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <Activity className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No data yet</p>
        <p className="text-slate-500 text-xs mt-1">Index data will appear once industry scores are calculated</p>
      </div>
    )
  }

  const overallColor = getScoreColor(data.overallIndex)

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
            <TrendingUp className="h-7 w-7 text-emerald-400" />
            Observatory Index
          </motion.h2>
          <motion.span
            className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            ™
          </motion.span>
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
        Which industries are winning in AI search? Real scores, real trends.
      </motion.p>

      {/* ── Overall Index Hero ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden relative">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="absolute inset-0 opacity-5" style={{
              background: `radial-gradient(ellipse at center, ${overallColor} 0%, transparent 70%)`
            }} />
            <div className="relative">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Overall AI Search Index</p>
              <div className="flex items-center justify-center gap-3">
                <motion.span
                  className="text-6xl sm:text-7xl font-bold"
                  style={{ color: overallColor }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 150 }}
                >
                  {Math.round(data.overallIndex)}
                </motion.span>
                <div className="flex flex-col items-start gap-1">
                  {getTrendIcon(data.trend, 'lg')}
                  <span className="text-xs text-slate-400">{getTrendLabel(data.trend)}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {data.industries.length} industries tracked
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Sort Controls ───────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          Sort by
        </span>
        {([
          { field: 'score' as SortField, label: 'Score' },
          { field: 'trend' as SortField, label: 'Trend' },
          { field: 'name' as SortField, label: 'Name' },
        ]).map(({ field, label }) => (
          <Button
            key={field}
            variant="outline"
            size="sm"
            className={`text-xs h-8 ${
              sortField === field
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
            }`}
            onClick={() => handleSort(field)}
          >
            {label}
            {sortField === field && (
              <span className="ml-1 text-[10px]">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Button>
        ))}
      </motion.div>

      {/* ── Industry Grid ───────────────────────────────────────── */}
      {sortedIndustries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-8 text-center">
              <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No industries tracked yet</p>
              <p className="text-slate-600 text-xs mt-1">Industry scores will appear as data is collected</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {sortedIndustries.map((industry, idx) => (
              <IndustryCard key={industry.slug} industry={industry} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
