'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Clock,
  Cpu,
  Globe,
  Zap,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface PulseData {
  lastCrawlAt: string | null
  modelsUpdated: number
  newCitationShifts: number
  industriesAffected: number
  totalArchivedResponses: number
  recentSignals: Array<{
    id: string
    headline: string
    aiModel: string
    changeType: string
    significance: number
    timeAgo: string
  }>
  activeModels: Array<{
    modelId: string
    displayName: string
    lastCrawledAt: string | null
    totalResponses: number
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
}

function getModelColor(modelId: string): string {
  const key = modelId.toLowerCase()
  for (const [name, color] of Object.entries(MODEL_COLORS)) {
    if (key.includes(name)) return color
  }
  return '#94a3b8' // slate-400 default
}

function getModelDisplayName(modelId: string): string {
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

function formatLastCrawled(lastCrawledAt: string | null): string {
  if (!lastCrawledAt) return 'Never'
  const diff = Date.now() - new Date(lastCrawledAt).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getSignificanceBadge(significance: number) {
  if (significance >= 80) return { label: 'Critical', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
  if (significance >= 60) return { label: 'High', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  if (significance >= 40) return { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
  return { label: 'Low', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
}

// ── Preview / Fallback Data ──────────────────────────────────

const PREVIEW_DATA: PulseData = {
  lastCrawlAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  modelsUpdated: 6,
  newCitationShifts: 27,
  industriesAffected: 9,
  totalArchivedResponses: 12450,
  recentSignals: [
    { id: 'sig-1', headline: '🚨 Claude Stopped Citing Reddit for Health Queries', aiModel: 'claude', changeType: 'citation_shift', significance: 85, timeAgo: '2m ago' },
    { id: 'sig-2', headline: 'ChatGPT Increased GitHub Citations by 27%', aiModel: 'chatgpt', changeType: 'citation_shift', significance: 72, timeAgo: '8m ago' },
    { id: 'sig-3', headline: 'Gemini Now References LinkedIn Profiles in Professional Queries', aiModel: 'gemini', changeType: 'source_shift', significance: 65, timeAgo: '15m ago' },
    { id: 'sig-4', headline: 'Perplexity Citation Volume Dropped 14% This Week', aiModel: 'perplexity', changeType: 'ranking_change', significance: 58, timeAgo: '23m ago' },
    { id: 'sig-5', headline: 'Grok Added Real-Time X/Twitter Source Attribution', aiModel: 'grok', changeType: 'new_capability', significance: 80, timeAgo: '31m ago' },
    { id: 'sig-6', headline: 'DeepSeek Increased Wikipedia References by 19%', aiModel: 'deepseek', changeType: 'citation_shift', significance: 52, timeAgo: '45m ago' },
    { id: 'sig-7', headline: 'ChatGPT Switched to PubMed for Medical Queries', aiModel: 'chatgpt', changeType: 'source_shift', significance: 78, timeAgo: '1h ago' },
    { id: 'sig-8', headline: 'Claude Citation Diversity Score Rose to 0.84', aiModel: 'claude', changeType: 'ranking_change', significance: 45, timeAgo: '1h ago' },
    { id: 'sig-9', headline: '🚨 Grok Factual Accuracy Score Dropped Below 60', aiModel: 'grok', changeType: 'ranking_change', significance: 82, timeAgo: '2h ago' },
    { id: 'sig-10', headline: 'Gemini Added YouTube Transcripts as Citation Source', aiModel: 'gemini', changeType: 'new_capability', significance: 68, timeAgo: '2h ago' },
  ],
  activeModels: [
    { modelId: 'chatgpt', displayName: 'ChatGPT', lastCrawledAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), totalResponses: 2840 },
    { modelId: 'claude', displayName: 'Claude', lastCrawledAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(), totalResponses: 2310 },
    { modelId: 'gemini', displayName: 'Gemini', lastCrawledAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(), totalResponses: 1960 },
    { modelId: 'perplexity', displayName: 'Perplexity', lastCrawledAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(), totalResponses: 2120 },
    { modelId: 'grok', displayName: 'Grok', lastCrawledAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), totalResponses: 1780 },
    { modelId: 'deepseek', displayName: 'DeepSeek', lastCrawledAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(), totalResponses: 1440 },
  ],
}

function getChangeTypeIcon(changeType: string) {
  switch (changeType) {
    case 'citation_shift':
      return <Zap className="h-3.5 w-3.5" />
    case 'source_shift':
      return <Globe className="h-3.5 w-3.5" />
    case 'ranking_change':
      return <TrendingUp className="h-3.5 w-3.5" />
    case 'new_capability':
      return <Cpu className="h-3.5 w-3.5" />
    default:
      return <Activity className="h-3.5 w-3.5" />
  }
}

// ── Loading Skeleton ─────────────────────────────────────────

function PulseSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-80 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-96 bg-slate-800" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-28 bg-slate-800 mb-3" />
              <Skeleton className="h-10 w-20 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active models skeleton */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 bg-slate-800 mb-4" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-28 bg-slate-800 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signal feed skeleton */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-36 bg-slate-800 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-slate-800 mb-2 rounded" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryPulse() {
  const [data, setData] = useState<PulseData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch('/api/observatory/pulse')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setIsPreview(false)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      // If we already have data, keep it. If not, use preview.
      if (!data) {
        setData(PREVIEW_DATA)
        setIsPreview(true)
      }
      setError(null) // Don't show error, use preview
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [data])

  // Fetch on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <PulseSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <Radio className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No data yet</p>
        <p className="text-slate-500 text-xs mt-1">Pulse data will appear once models are being tracked</p>
      </div>
    )
  }

  const citationShiftsPositive = data.newCitationShifts > 0

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
            AI Search Observatory
          </motion.h2>
          <motion.span
            className="inline-flex items-center gap-1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            {!isPreview ? (
              <>
                <motion.span
                  className="relative flex h-3 w-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </motion.span>
                <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">Live</span>
              </>
            ) : (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
                Preview — Connect for live data
              </Badge>
            )}
          </motion.span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {lastRefresh.toLocaleTimeString()}
          </span>
          <motion.button
            onClick={fetchData}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
            whileTap={{ rotate: 180 }}
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={{ duration: 0.5 }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
      </div>

      <motion.p
        className="text-slate-400 text-sm sm:text-base max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Independent research center that daily analyzes the behavior of leading AI models
      </motion.p>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Models Updated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Models Updated</span>
                <motion.span
                  className="relative flex h-2.5 w-2.5"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </motion.span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{data.modelsUpdated}</span>
                <span className="text-slate-500 text-sm">/ {data.activeModels.length} tracked</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Citation Shifts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 hover:border-amber-500/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">New Citation Shifts</span>
                {citationShiftsPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-amber-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{data.newCitationShifts}</span>
                <span className="text-slate-500 text-sm">in 24h</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Industries Affected */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Industries Affected</span>
                <Globe className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{data.industriesAffected}</span>
                <span className="text-slate-500 text-sm">sectors</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Active Models Bar ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-300">Active Models</h3>
            </div>
            {data.activeModels.length === 0 ? (
              <p className="text-slate-500 text-sm">No active models yet</p>
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {data.activeModels.map((model, idx) => (
                  <motion.div
                    key={model.modelId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.05 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getModelColor(model.modelId) }}
                    />
                    <span className="text-sm font-medium text-slate-200">
                      {model.displayName || getModelDisplayName(model.modelId)}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {formatLastCrawled(model.lastCrawledAt)}
                    </span>
                    <span className="text-xs text-slate-600 hidden md:inline">
                      ({model.totalResponses} responses)
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Live Signal Feed ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-300">Live Signal Feed</h3>
              {data.recentSignals.length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  {data.recentSignals.length} signals
                </Badge>
              )}
            </div>

            {data.recentSignals.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No signals detected yet</p>
                <p className="text-slate-600 text-xs mt-1">Signals will appear as AI models are crawled and changes detected</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-1.5">
                  <AnimatePresence mode="popLayout">
                    {data.recentSignals.map((signal, idx) => {
                      const isBreaking = signal.headline.startsWith('\uD83D\uDEA8')
                      const sigBadge = getSignificanceBadge(signal.significance)
                      const modelColor = getModelColor(signal.aiModel)

                      return (
                        <motion.div
                          key={signal.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.03, duration: 0.3 }}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            isBreaking
                              ? 'bg-red-500/5 border border-red-500/20 hover:bg-red-500/10'
                              : 'bg-slate-800/30 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Icon */}
                          <div className="shrink-0 mt-0.5">
                            {isBreaking ? (
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                            ) : (
                              getChangeTypeIcon(signal.changeType)
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded"
                                  style={{
                                    color: modelColor,
                                    backgroundColor: `${modelColor}20`,
                                  }}
                                >
                                  {getModelDisplayName(signal.aiModel)}
                                </span>
                                <span className="text-sm text-slate-300 truncate">
                                  {isBreaking ? signal.headline.replace('\uD83D\uDEA8 ', '') : signal.headline}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-slate-500">{signal.timeAgo}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-5 ${sigBadge.className}`}
                              >
                                {sigBadge.label}
                              </Badge>
                              {isBreaking && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-400 border-red-500/30">
                                  Breaking
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Footer metadata ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {data.totalArchivedResponses > 0 && (
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {data.totalArchivedResponses.toLocaleString()} archived responses
          </span>
        )}
        {data.lastCrawlAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last crawl: {new Date(data.lastCrawlAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}
