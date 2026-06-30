'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Hash,
  Tag,
  Layers,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface EvidenceDomain {
  domain: string
  growth: number
  usedBy: string[]
  totalCitations: number
  citationTrend: Array<{ period: string; count: number }>
  avgPosition: number
  categories: string[]
  trend: 'up' | 'down' | 'stable'
}

// ── Model Color Map (same as Pulse) ─────────────────────────

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
  return '#94a3b8'
}

function getModelDisplayName(modelId: string): string {
  const map: Record<string, string> = {
    chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini',
    perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
  }
  const key = modelId.toLowerCase()
  for (const [name, label] of Object.entries(map)) {
    if (key.includes(name)) return label
  }
  return modelId.charAt(0).toUpperCase() + modelId.slice(1)
}

// ── Preview / Fallback Data ──────────────────────────────────

const PREVIEW_DOMAINS: EvidenceDomain[] = [
  { domain: 'github.com', growth: 27, usedBy: ['claude', 'gemini', 'chatgpt'], totalCitations: 4820, avgPosition: 2.3, categories: ['developer', 'technical'], trend: 'up', citationTrend: [{ period: '2025-Q1', count: 820 }, { period: '2025-Q2', count: 910 }, { period: '2025-Q3', count: 1050 }, { period: '2025-Q4', count: 1120 }, { period: '2026-Q1', count: 1340 }, { period: '2026-Q2', count: 1480 }] },
  { domain: 'wikipedia.org', growth: -5, usedBy: ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'], totalCitations: 12400, avgPosition: 1.8, categories: ['reference', 'encyclopedia'], trend: 'down', citationTrend: [{ period: '2025-Q1', count: 2200 }, { period: '2025-Q2', count: 2150 }, { period: '2025-Q3', count: 2100 }, { period: '2025-Q4', count: 2050 }, { period: '2026-Q1', count: 1980 }, { period: '2026-Q2', count: 1920 }] },
  { domain: 'reddit.com', growth: -14, usedBy: ['chatgpt', 'perplexity'], totalCitations: 3210, avgPosition: 4.1, categories: ['community', 'discussion'], trend: 'down', citationTrend: [{ period: '2025-Q1', count: 620 }, { period: '2025-Q2', count: 580 }, { period: '2025-Q3', count: 560 }, { period: '2025-Q4', count: 530 }, { period: '2026-Q1', count: 490 }, { period: '2026-Q2', count: 430 }] },
  { domain: 'linkedin.com', growth: 18, usedBy: ['gemini', 'claude'], totalCitations: 2180, avgPosition: 3.5, categories: ['professional', 'career'], trend: 'up', citationTrend: [{ period: '2025-Q1', count: 280 }, { period: '2025-Q2', count: 310 }, { period: '2025-Q3', count: 360 }, { period: '2025-Q4', count: 390 }, { period: '2026-Q1', count: 410 }, { period: '2026-Q2', count: 430 }] },
  { domain: 'mayoclinic.org', growth: 8, usedBy: ['chatgpt', 'claude', 'gemini'], totalCitations: 1940, avgPosition: 1.9, categories: ['health', 'medical'], trend: 'up', citationTrend: [{ period: '2025-Q1', count: 290 }, { period: '2025-Q2', count: 300 }, { period: '2025-Q3', count: 310 }, { period: '2025-Q4', count: 320 }, { period: '2026-Q1', count: 340 }, { period: '2026-Q2', count: 380 }] },
  { domain: 'cdc.gov', growth: 3, usedBy: ['chatgpt', 'claude'], totalCitations: 1520, avgPosition: 2.1, categories: ['health', 'government'], trend: 'stable', citationTrend: [{ period: '2025-Q1', count: 245 }, { period: '2025-Q2', count: 250 }, { period: '2025-Q3', count: 252 }, { period: '2025-Q4', count: 255 }, { period: '2026-Q1', count: 258 }, { period: '2026-Q2', count: 260 }] },
  { domain: 'stackoverflow.com', growth: -22, usedBy: ['chatgpt', 'claude'], totalCitations: 2860, avgPosition: 3.8, categories: ['developer', 'technical'], trend: 'down', citationTrend: [{ period: '2025-Q1', count: 580 }, { period: '2025-Q2', count: 530 }, { period: '2025-Q3', count: 490 }, { period: '2025-Q4', count: 450 }, { period: '2026-Q1', count: 420 }, { period: '2026-Q2', count: 390 }] },
  { domain: 'forbes.com', growth: 12, usedBy: ['gemini', 'perplexity'], totalCitations: 1780, avgPosition: 3.2, categories: ['business', 'news'], trend: 'up', citationTrend: [{ period: '2025-Q1', count: 260 }, { period: '2025-Q2', count: 275 }, { period: '2025-Q3', count: 290 }, { period: '2025-Q4', count: 300 }, { period: '2026-Q1', count: 320 }, { period: '2026-Q2', count: 335 }] },
]

// ── Loading Skeleton ─────────────────────────────────────────

function EvidenceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-80 bg-slate-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-24 bg-slate-800 mb-3" />
              <Skeleton className="h-8 w-16 bg-slate-800 mb-2" />
              <Skeleton className="h-3 w-20 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Mini Bar Chart ───────────────────────────────────────────

function MiniBarChart({ data, color }: { data: Array<{ period: string; count: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((d, i) => (
        <motion.div
          key={d.period}
          className="flex-1 rounded-t"
          style={{ backgroundColor: color, minHeight: 2 }}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max((d.count / max) * 100, 5)}%` }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        />
      ))}
    </div>
  )
}

// ── Domain Card ──────────────────────────────────────────────

function DomainCard({ domain, index, onExpand, isExpanded }: { domain: EvidenceDomain; index: number; onExpand: () => void; isExpanded: boolean }) {
  const isUp = domain.growth >= 0
  const growthColor = isUp ? '#10b981' : '#ef4444'
  const chartColor = domain.trend === 'up' ? '#10b981' : domain.trend === 'down' ? '#ef4444' : '#f59e0b'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.6), duration: 0.3 }}
      layout
    >
      <Card
        className={`bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer ${
          isExpanded ? 'ring-1 ring-emerald-500/30' : ''
        }`}
        onClick={onExpand}
      >
        <CardContent className="p-4">
          {/* Domain name + expand toggle */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-bold text-white truncate">{domain.domain}</h4>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </motion.div>
          </div>

          {/* Growth */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold" style={{ color: growthColor }}>
              {isUp ? '+' : ''}{domain.growth}%
            </span>
            {isUp ? (
              <ArrowUpRight className="h-4 w-4" style={{ color: growthColor }} />
            ) : (
              <ArrowDownRight className="h-4 w-4" style={{ color: growthColor }} />
            )}
          </div>

          {/* AI Model badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {domain.usedBy.map((model) => (
              <span
                key={model}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ color: getModelColor(model), backgroundColor: `${getModelColor(model)}20` }}
              >
                {getModelDisplayName(model)}
              </span>
            ))}
          </div>

          {/* Citation count + mini chart */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {domain.totalCitations.toLocaleString()} citations
            </span>
            <div className="w-20">
              <MiniBarChart data={domain.citationTrend} color={chartColor} />
            </div>
          </div>

          {/* Expanded Detail */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  {/* Citation trend detail */}
                  <div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-2">
                      <BarChart3 className="h-3 w-3" /> Citation Trend (6 periods)
                    </p>
                    <div className="h-14">
                      <MiniBarChart data={domain.citationTrend} color={chartColor} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] text-slate-600">{domain.citationTrend[0]?.period}</span>
                      <span className="text-[9px] text-slate-600">{domain.citationTrend[domain.citationTrend.length - 1]?.period}</span>
                    </div>
                  </div>

                  {/* Avg Position */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Avg Position
                    </span>
                    <span className="text-sm font-semibold text-slate-200">{domain.avgPosition}</span>
                  </div>

                  {/* Categories */}
                  <div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mb-1.5">
                      <Tag className="h-3 w-3" /> Categories
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {domain.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-slate-800/60 text-slate-400 border-slate-700">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Full model breakdown */}
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1.5">Model Breakdown</p>
                    <div className="flex flex-wrap gap-2">
                      {domain.usedBy.map((model) => (
                        <div key={model} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getModelColor(model) }} />
                          <span className="text-xs text-slate-300">{getModelDisplayName(model)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryEvidenceExplorer() {
  const [domains, setDomains] = useState<EvidenceDomain[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)

  const fetchData = useCallback(async (domain?: string) => {
    if (domain) {
      // Fetch detailed evidence for a specific domain
      try {
        const res = await fetch(`/api/observatory/evidence?domain=${encodeURIComponent(domain)}`)
        if (!res.ok) return
        const json = await res.json()
        if (json.error) return
        setDomains((prev) =>
          prev.map((d) => (d.domain === domain ? { ...d, ...json, trend: json.growth > 0 ? 'up' : json.growth < 0 ? 'down' : 'stable' } : d))
        )
      } catch { /* keep existing data */ }
      return
    }

    // Initial load: try all preview domains
    try {
      const results = await Promise.allSettled(
        PREVIEW_DOMAINS.map(async (pd) => {
          const res = await fetch(`/api/observatory/evidence?domain=${encodeURIComponent(pd.domain)}`)
          if (!res.ok) throw new Error('Not found')
          return res.json()
        })
      )
      const successful = results
        .filter((r): r is PromiseFulfilledResult<EvidenceDomain> => r.status === 'fulfilled')
        .map((r) => ({ ...r.value, trend: r.value.growth > 0 ? 'up' : r.value.growth < 0 ? 'down' : 'stable' as const }))

      if (successful.length > 0) {
        setDomains(successful)
        setIsPreview(false)
      } else {
        throw new Error('No data')
      }
    } catch {
      setDomains(PREVIEW_DOMAINS)
      setIsPreview(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExpand = (domain: string) => {
    setExpandedDomain((prev) => (prev === domain ? null : domain))
    fetchData(domain)
  }

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <EvidenceSkeleton />
      </div>
    )
  }

  if (domains.length === 0) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <Search className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No evidence data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Search className="h-7 w-7 text-emerald-400" />
            Evidence Explorer
          </motion.h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">™</span>
          {isPreview && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
              Preview
            </Badge>
          )}
        </div>
        <motion.button
          onClick={() => fetchData()}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors text-xs"
          whileTap={{ rotate: 180 }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </motion.button>
      </div>

      <motion.p className="text-slate-400 text-sm sm:text-base max-w-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        Click a source domain, see its AI visibility stats. Who cites it, how much, and which way the trend goes.
      </motion.p>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {domains.map((domain, idx) => (
            <DomainCard
              key={domain.domain}
              domain={domain}
              index={idx}
              onExpand={() => handleExpand(domain.domain)}
              isExpanded={expandedDomain === domain.domain}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3" /> Click a card to expand details</span>
        <span>{domains.length} source domains tracked</span>
      </div>
    </div>
  )
}
