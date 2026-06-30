'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle,
  RefreshCw,
  Thermometer,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface WeatherData {
  today: {
    overall: { stabilityIndex: number; trend: string; volatility: number }
    models: Array<{
      aiModel: string
      stabilityIndex: number
      volatility: number
      trend: string
      changesCount: number
    }>
  }
  history: Array<{
    date: string
    overall: { stabilityIndex: number; trend: string }
    models: Record<string, { stabilityIndex: number; trend: string }>
  }>
}

// ── Model Color Map ──────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  chatgpt: '#10b981',
  claude: '#f59e0b',
  gemini: '#3b82f6',
  perplexity: '#8b5cf6',
  grok: '#ef4444',
  deepseek: '#06b6d4',
  overall: '#94a3b8',
}

function getModelColor(modelId: string | null | undefined): string {
  if (!modelId) return '#94a3b8'
  const key = modelId.toLowerCase()
  for (const [name, color] of Object.entries(MODEL_COLORS)) {
    if (key.includes(name)) return color
  }
  return '#94a3b8'
}

function getModelDisplayName(modelId: string | null | undefined): string {
  if (!modelId) return 'Unknown'
  const map: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    grok: 'Grok',
    deepseek: 'DeepSeek',
  }
  const key = modelId.toLowerCase()
  for (const [name, label] of Object.entries(map)) {
    if (key.includes(name)) return label
  }
  return modelId.charAt(0).toUpperCase() + modelId.slice(1)
}

// ── Weather Category ─────────────────────────────────────────

type WeatherCategory = 'sunny' | 'partly_cloudy' | 'cloudy' | 'stormy'

function getWeatherCategory(stabilityIndex: number): WeatherCategory {
  if (stabilityIndex >= 80) return 'sunny'
  if (stabilityIndex >= 60) return 'partly_cloudy'
  if (stabilityIndex >= 40) return 'cloudy'
  return 'stormy'
}


function getWeatherLabel(category: WeatherCategory): string {
  switch (category) {
    case 'sunny':
      return 'Sunny — Stable'
    case 'partly_cloudy':
      return 'Partly Cloudy — Low Volatility'
    case 'cloudy':
      return 'Cloudy — Moderate Volatility'
    case 'stormy':
      return 'Stormy — High Volatility'
  }
}

function getWeatherColor(category: WeatherCategory): string {
  switch (category) {
    case 'sunny':
      return '#10b981' // emerald
    case 'partly_cloudy':
      return '#f59e0b' // amber
    case 'cloudy':
      return '#f97316' // orange
    case 'stormy':
      return '#ef4444' // red
  }
}

function getStabilityBgClass(stabilityIndex: number): string {
  const category = getWeatherCategory(stabilityIndex)
  switch (category) {
    case 'sunny':
      return 'border-emerald-500/30 hover:border-emerald-500/50'
    case 'partly_cloudy':
      return 'border-amber-500/30 hover:border-amber-500/50'
    case 'cloudy':
      return 'border-orange-500/30 hover:border-orange-500/50'
    case 'stormy':
      return 'border-red-500/30 hover:border-red-500/50'
  }
}

function getStabilityGlowClass(stabilityIndex: number): string {
  const category = getWeatherCategory(stabilityIndex)
  switch (category) {
    case 'sunny':
      return 'shadow-emerald-500/10 shadow-lg'
    case 'partly_cloudy':
      return 'shadow-amber-500/10 shadow-lg'
    case 'cloudy':
      return 'shadow-orange-500/10 shadow-lg'
    case 'stormy':
      return 'shadow-red-500/10 shadow-lg'
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'improving':
    case 'stable_up':
      return <ArrowUpRight className="h-4 w-4 text-emerald-400" />
    case 'declining':
    case 'high_volatility':
      return <ArrowDownRight className="h-4 w-4 text-red-400" />
    case 'recovering':
      return <TrendingUp className="h-4 w-4 text-amber-400" />
    default:
      return <Minus className="h-4 w-4 text-slate-400" />
  }
}

function getTrendLabel(trend: string): string {
  const labels: Record<string, string> = {
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

// ── Preview / Fallback Data ──────────────────────────────────

function makeDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const PREVIEW_DATA: WeatherData = {
  today: {
    overall: { stabilityIndex: 82, trend: 'stable', volatility: 18 },
    models: [
      { aiModel: 'chatgpt', stabilityIndex: 72, volatility: 28, trend: 'declining', changesCount: 7 },
      { aiModel: 'claude', stabilityIndex: 85, volatility: 15, trend: 'stable', changesCount: 2 },
      { aiModel: 'gemini', stabilityIndex: 68, volatility: 32, trend: 'high_volatility', changesCount: 9 },
      { aiModel: 'perplexity', stabilityIndex: 61, volatility: 39, trend: 'declining', changesCount: 5 },
      { aiModel: 'grok', stabilityIndex: 45, volatility: 55, trend: 'high_volatility', changesCount: 12 },
      { aiModel: 'deepseek', stabilityIndex: 52, volatility: 48, trend: 'recovering', changesCount: 4 },
    ],
  },
  history: [
    { date: makeDaysAgo(6), overall: { stabilityIndex: 78, trend: 'stable' }, models: { chatgpt: { stabilityIndex: 70, trend: 'stable' }, claude: { stabilityIndex: 83, trend: 'stable' }, gemini: { stabilityIndex: 65, trend: 'declining' }, perplexity: { stabilityIndex: 59, trend: 'declining' }, grok: { stabilityIndex: 42, trend: 'high_volatility' }, deepseek: { stabilityIndex: 48, trend: 'declining' } } },
    { date: makeDaysAgo(5), overall: { stabilityIndex: 80, trend: 'stable' }, models: { chatgpt: { stabilityIndex: 73, trend: 'stable' }, claude: { stabilityIndex: 84, trend: 'stable' }, gemini: { stabilityIndex: 67, trend: 'stable' }, perplexity: { stabilityIndex: 60, trend: 'stable' }, grok: { stabilityIndex: 44, trend: 'high_volatility' }, deepseek: { stabilityIndex: 50, trend: 'stable' } } },
    { date: makeDaysAgo(4), overall: { stabilityIndex: 79, trend: 'declining' }, models: { chatgpt: { stabilityIndex: 71, trend: 'declining' }, claude: { stabilityIndex: 86, trend: 'improving' }, gemini: { stabilityIndex: 66, trend: 'declining' }, perplexity: { stabilityIndex: 58, trend: 'declining' }, grok: { stabilityIndex: 40, trend: 'high_volatility' }, deepseek: { stabilityIndex: 49, trend: 'declining' } } },
    { date: makeDaysAgo(3), overall: { stabilityIndex: 81, trend: 'improving' }, models: { chatgpt: { stabilityIndex: 74, trend: 'improving' }, claude: { stabilityIndex: 87, trend: 'stable' }, gemini: { stabilityIndex: 69, trend: 'improving' }, perplexity: { stabilityIndex: 62, trend: 'stable' }, grok: { stabilityIndex: 46, trend: 'recovering' }, deepseek: { stabilityIndex: 51, trend: 'stable' } } },
    { date: makeDaysAgo(2), overall: { stabilityIndex: 83, trend: 'stable' }, models: { chatgpt: { stabilityIndex: 75, trend: 'stable' }, claude: { stabilityIndex: 85, trend: 'stable' }, gemini: { stabilityIndex: 70, trend: 'stable' }, perplexity: { stabilityIndex: 63, trend: 'stable' }, grok: { stabilityIndex: 47, trend: 'stable' }, deepseek: { stabilityIndex: 53, trend: 'stable' } } },
    { date: makeDaysAgo(1), overall: { stabilityIndex: 81, trend: 'stable' }, models: { chatgpt: { stabilityIndex: 73, trend: 'declining' }, claude: { stabilityIndex: 86, trend: 'stable' }, gemini: { stabilityIndex: 67, trend: 'declining' }, perplexity: { stabilityIndex: 60, trend: 'declining' }, grok: { stabilityIndex: 44, trend: 'high_volatility' }, deepseek: { stabilityIndex: 50, trend: 'recovering' } } },
    { date: makeDaysAgo(0), overall: { stabilityIndex: 82, trend: 'stable' }, models: { chatgpt: { stabilityIndex: 72, trend: 'declining' }, claude: { stabilityIndex: 85, trend: 'stable' }, gemini: { stabilityIndex: 68, trend: 'high_volatility' }, perplexity: { stabilityIndex: 61, trend: 'declining' }, grok: { stabilityIndex: 45, trend: 'high_volatility' }, deepseek: { stabilityIndex: 52, trend: 'recovering' } } },
  ],
}

// ── Circular Gauge ───────────────────────────────────────────

function WeatherIconFromCategory({ category, color, className = 'h-8 w-8' }: { category: WeatherCategory; color: string; className?: string }) {
  switch (category) {
    case 'sunny':
      return <Sun className={className} style={{ color }} />
    case 'partly_cloudy':
      return <Cloud className={className} style={{ color }} />
    case 'cloudy':
      return <CloudRain className={className} style={{ color }} />
    case 'stormy':
      return <CloudLightning className={className} style={{ color }} />
  }
}

function StabilityGauge({ value, size = 200 }: { value: number; size?: number }) {
  const category = getWeatherCategory(value)
  const color = getWeatherColor(category)
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-800"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="mb-1"
        >
          <WeatherIconFromCategory category={category} color={color} />
        </motion.div>
        <motion.span
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-xs text-slate-400 mt-0.5">Stability Index</span>
      </div>
    </div>
  )
}

// ── Loading Skeleton ─────────────────────────────────────────

function WeatherSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-64 bg-slate-800" />
      </div>

      {/* Gauge skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-52 w-52 rounded-full bg-slate-800" />
      </div>

      {/* Model cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 bg-slate-800 mb-3" />
              <Skeleton className="h-8 w-16 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-48 bg-slate-800 mb-4" />
          <Skeleton className="h-64 w-full bg-slate-800 rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Chart Tooltip ────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryWeather() {
  const [data, setData] = useState<WeatherData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModelLines, setShowModelLines] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/observatory/weather?days=7')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setIsPreview(false)
      setError(null)

      // Extract available model keys from history
      if (json.history && json.history.length > 0) {
        const models = new Set<string>()
        json.history.forEach((day: WeatherData['history'][0]) => {
          Object.keys(day.models).forEach((m) => models.add(m))
        })
        setAvailableModels([...models].sort())
      }
    } catch (err) {
      // If we already have data, keep it. If not, use preview.
      if (!data) {
        setData(PREVIEW_DATA)
        setIsPreview(true)

        // Extract available model keys from preview history
        const models = new Set<string>()
        PREVIEW_DATA.history.forEach((day) => {
          Object.keys(day.models).forEach((m) => models.add(m))
        })
        setAvailableModels([...models].sort())
      }
      setError(null) // Don't show error, use preview
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <WeatherSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <Thermometer className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No data yet</p>
        <p className="text-slate-500 text-xs mt-1">Weather data will appear once daily stability is calculated</p>
      </div>
    )
  }

  const { today, history } = data
  const overallCategory = getWeatherCategory(today.overall.stabilityIndex)
  const overallColor = getWeatherColor(overallCategory)
  const overallLabel = getWeatherLabel(overallCategory)

  // Build chart data
  const chartData = [...history]
    .reverse()
    .map((day) => {
      const entry: Record<string, unknown> = {
        date: day.date,
        Overall: day.overall.stabilityIndex,
      }
      if (showModelLines) {
        Object.entries(day.models).forEach(([model, data]) => {
          entry[getModelDisplayName(model)] = data.stabilityIndex
        })
      }
      return entry
    })

  // Build chart lines
  const chartLines = [
    <Line
      key="overall"
      type="monotone"
      dataKey="Overall"
      stroke={overallColor}
      strokeWidth={3}
      dot={{ r: 4, fill: overallColor }}
      activeDot={{ r: 6, fill: overallColor }}
    />,
  ]

  if (showModelLines) {
    availableModels.forEach((model) => {
      const color = getModelColor(model)
      chartLines.push(
        <Line
          key={model}
          type="monotone"
          dataKey={getModelDisplayName(model)}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 2, fill: color }}
          activeDot={{ r: 4, fill: color }}
        />
      )
    })
  }

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            AI Search Weather
          </motion.h2>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            <WeatherIconFromCategory category={overallCategory} color={overallColor} className="h-7 w-7" />
          </motion.div>
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

      {/* ── Overall Stability Gauge ─────────────────────────────── */}
      <motion.div
        className="flex flex-col items-center gap-3 py-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <StabilityGauge value={today.overall.stabilityIndex} size={200} />
        <div className="text-center">
          <motion.p
            className="text-lg font-semibold"
            style={{ color: overallColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {overallLabel}
          </motion.p>
          <div className="flex items-center gap-2 mt-1 justify-center">
            {getTrendIcon(today.overall.trend)}
            <span className="text-sm text-slate-400">
              Trend: {getTrendLabel(today.overall.trend)}
            </span>
            <span className="text-xs text-slate-500">
              • Volatility: {today.overall.volatility}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Model Weather Cards ─────────────────────────────────── */}
      {today.models.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            Model Weather Forecast
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {today.models.map((model, idx) => {
                const modelCategory = getWeatherCategory(model.stabilityIndex)
                const modelColor = getWeatherColor(modelCategory)

                return (
                  <motion.div
                    key={model.aiModel}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.08 }}
                  >
                    <Card className={`bg-slate-900/50 transition-all ${getStabilityBgClass(model.stabilityIndex)} ${getStabilityGlowClass(model.stabilityIndex)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: getModelColor(model.aiModel) }}
                            />
                            <span className="text-sm font-semibold text-slate-200">
                              {getModelDisplayName(model.aiModel)}
                            </span>
                          </div>
                          <WeatherIconFromCategory category={modelCategory} color={modelColor} className="h-5 w-5" />
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-white">
                            {Math.round(model.stabilityIndex)}
                          </span>
                          <span className="text-xs text-slate-500">/ 100</span>
                          <span className="ml-auto">{getTrendIcon(model.trend)}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            Volatility: {model.volatility}%
                          </span>
                          {model.changesCount > 0 && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                model.changesCount > 5
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : model.changesCount > 2
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                              }`}
                            >
                              {model.changesCount} changes
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── 7-Day Trend Chart ───────────────────────────────────── */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  7-Day Stability Trend
                </h3>

                {availableModels.length > 0 && (
                  <button
                    onClick={() => setShowModelLines(!showModelLines)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      showModelLines
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {showModelLines ? 'Hide' : 'Show'} Model Lines
                  </button>
                )}
              </div>

              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val: string) => {
                        const d = new Date(val)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#475569"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={{ stroke: '#334155' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {chartLines}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              {showModelLines && availableModels.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 rounded" style={{ backgroundColor: overallColor }} />
                    <span className="text-xs text-slate-400">Overall</span>
                  </div>
                  {availableModels.map((model) => (
                    <div key={model} className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-0.5 rounded border-t border-dashed"
                        style={{ borderColor: getModelColor(model) }}
                      />
                      <span className="text-xs text-slate-400">
                        {getModelDisplayName(model)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Empty history message ───────────────────────────────── */}
      {history.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6 text-center">
              <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No historical data yet</p>
              <p className="text-slate-600 text-xs mt-1">Trend chart will appear after a few days of data collection</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
