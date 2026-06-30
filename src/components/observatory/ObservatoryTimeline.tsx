'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Clock,
  RefreshCw,
  Activity,
  Zap,
  Globe,
  TrendingUp,
  Cpu,
  Calendar,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface TimelineEvent {
  id: string
  date: string
  event: string
  aiModel: string
  category: string
  significance: number
  description?: string
  evidenceUrl?: string
}

interface TimelineData {
  events: TimelineEvent[]
  meta: { total: number; year: string }
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
    chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini',
    perplexity: 'Perplexity', grok: 'Grok', deepseek: 'DeepSeek',
  }
  const key = modelId.toLowerCase()
  for (const [name, label] of Object.entries(map)) {
    if (key.includes(name)) return label
  }
  return modelId.charAt(0).toUpperCase() + modelId.slice(1)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'citation_shift': return <Zap className="h-3.5 w-3.5" />
    case 'source_shift': return <Globe className="h-3.5 w-3.5" />
    case 'ranking_change': return <TrendingUp className="h-3.5 w-3.5" />
    case 'new_capability': return <Cpu className="h-3.5 w-3.5" />
    default: return <Activity className="h-3.5 w-3.5" />
  }
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    citation_shift: 'Citation Shift', source_shift: 'Source Shift',
    ranking_change: 'Ranking Change', new_capability: 'New Capability',
  }
  return labels[cat] || cat
}

// ── Preview / Fallback Data ──────────────────────────────────

const PREVIEW_DATA: TimelineData = {
  events: [
    { id: 't1', date: '2025-01-15', event: 'Claude stopped using Reddit for health queries', aiModel: 'claude', category: 'citation_shift', significance: 85, description: 'Claude shifted away from Reddit citations in health-related queries, favoring medical journals and institutional sources.' },
    { id: 't2', date: '2025-02-20', event: 'Gemini started citing Google Docs as primary source', aiModel: 'gemini', category: 'source_shift', significance: 72, description: 'Gemini began referencing Google Docs content in professional query responses.' },
    { id: 't3', date: '2025-03-10', event: 'ChatGPT switched to PubMed for medical queries', aiModel: 'chatgpt', category: 'source_shift', significance: 90, description: 'Major shift: ChatGPT now prioritizes PubMed over general web results for health and medical questions.' },
    { id: 't4', date: '2025-04-05', event: 'Perplexity added real-time Reddit thread citations', aiModel: 'perplexity', category: 'new_capability', significance: 65 },
    { id: 't5', date: '2025-05-18', event: 'Grok started citing X/Twitter posts directly', aiModel: 'grok', category: 'source_shift', significance: 78, description: 'Grok integrated X/Twitter as a primary citation source for current events and breaking news.' },
    { id: 't6', date: '2025-07-02', event: 'DeepSeek increased Wikipedia references by 19%', aiModel: 'deepseek', category: 'citation_shift', significance: 52 },
    { id: 't7', date: '2025-09-14', event: 'Claude citation diversity score reached 0.84', aiModel: 'claude', category: 'ranking_change', significance: 45 },
    { id: 't8', date: '2026-01-08', event: 'Gemini added YouTube transcripts as citation source', aiModel: 'gemini', category: 'new_capability', significance: 68, description: 'Gemini now indexes and cites YouTube video transcripts for tutorial and how-to queries.' },
    { id: 't9', date: '2026-02-22', event: 'ChatGPT reduced Stack Overflow citations by 22%', aiModel: 'chatgpt', category: 'citation_shift', significance: 75, description: 'Continuing trend: ChatGPT further decreased reliance on Stack Overflow, citing its own training synthesis instead.' },
    { id: 't10', date: '2026-03-15', event: 'All major models dropped citation of unverified health blogs', aiModel: 'all', category: 'source_shift', significance: 92, description: 'A watershed moment: every tracked AI model stopped citing unverified health blogs in favor of institutional sources.' },
  ],
  meta: { total: 10, year: 'all' },
}

const CATEGORIES = ['all', 'citation_shift', 'source_shift', 'ranking_change', 'new_capability']

// ── Loading Skeleton ─────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-96 bg-slate-800" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-28 bg-slate-800 rounded-full" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-24 bg-slate-800 shrink-0 mt-4" />
          <Card className="bg-slate-900/50 border-slate-800 flex-1">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 bg-slate-800 mb-2" />
              <Skeleton className="h-3 w-1/2 bg-slate-800" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// ── Significance Bar ─────────────────────────────────────────

function SignificanceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#ef4444' : value >= 60 ? '#f59e0b' : value >= 40 ? '#10b981' : '#64748b'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.3, duration: 0.6 }}
        />
      </div>
      <span className="text-[10px] text-slate-500">{value}</span>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryTimeline() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/observatory/timeline')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setIsPreview(false)
    } catch {
      if (!data) {
        setData(PREVIEW_DATA)
        setIsPreview(true)
      }
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <TimelineSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No timeline events yet</p>
      </div>
    )
  }

  const filtered = activeCategory === 'all'
    ? data.events
    : data.events.filter((e) => e.category === activeCategory)

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
            <Calendar className="h-7 w-7 text-emerald-400" />
            AI Search Timeline
          </motion.h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">™</span>
          {isPreview && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
              Preview
            </Badge>
          )}
        </div>
        <motion.button
          onClick={fetchData}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors text-xs"
          whileTap={{ rotate: 180 }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </motion.button>
      </div>

      <motion.p className="text-slate-400 text-sm sm:text-base max-w-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        Internet-wide AI search history. Not for a company. For the internet.
      </motion.p>

      {/* Category Filter Pills */}
      <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {cat === 'all' ? 'All Events' : getCategoryLabel(cat)}
          </button>
        ))}
      </motion.div>

      {/* Vertical Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-8 w-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No events for this category</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px] pr-2">
          <div className="relative pl-2">
            {/* Vertical line */}
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-slate-800" />

            <AnimatePresence mode="popLayout">
              {filtered.map((event, idx) => {
                const modelColor = getModelColor(event.aiModel)
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: Math.min(idx * 0.06, 0.6), duration: 0.3 }}
                    className="flex gap-4 sm:gap-6 mb-6 last:mb-0"
                  >
                    {/* Date + dot */}
                    <div className="shrink-0 w-[52px] sm:w-[64px] text-right pt-4">
                      <p className="text-xs font-semibold text-slate-300">{formatDate(event.date).split(',')[0]}</p>
                      <p className="text-[10px] text-slate-500">{new Date(event.date).getFullYear()}</p>
                    </div>

                    {/* Dot on line */}
                    <div className="relative shrink-0 flex items-start pt-4">
                      <div
                        className="w-3 h-3 rounded-full border-2 border-slate-950 z-10"
                        style={{ backgroundColor: modelColor }}
                      />
                    </div>

                    {/* Event Card */}
                    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors flex-1 min-w-0">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ color: modelColor, backgroundColor: `${modelColor}20` }}
                          >
                            {getModelDisplayName(event.aiModel)}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-slate-800/60 text-slate-400 border-slate-700 gap-1">
                            {getCategoryIcon(event.category)}
                            {getCategoryLabel(event.category)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-200 mb-2">{event.event}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <SignificanceBar value={event.significance} />
                          {event.description && (
                            <p className="text-xs text-slate-500 leading-relaxed mt-1 w-full">{event.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {data.meta.total} events</span>
      </div>
    </div>
  )
}
