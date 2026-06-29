'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, Clock, CheckCircle2, AlertCircle, PenLine } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  title: string
  status: string
  format: string
  pillar: string
  createdAt: string
  publishedAt: string | null
}

interface CalendarEntry {
  id: string
  date: string
  theme: string
  status: string
  pillar: string
  notes: string | null
}

function ContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 space-y-2">
            <Skeleton className="h-3 w-16 bg-zinc-800/50" />
            <Skeleton className="h-8 w-8 bg-zinc-800/50" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl bg-zinc-800/50" />
    </div>
  )
}

export function ContentPage() {
  const { mode } = useOSStore()
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [calendar, setCalendar] = useState<CalendarEntry[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [artRes, calRes] = await Promise.all([
          fetch('/api/content-engine/articles?limit=20'),
          fetch('/api/content-engine/editorial-calendar'),
        ])
        if (artRes.ok) {
          const json = await artRes.json()
          setArticles(json.articles || [])
        }
        if (calRes.ok) {
          const json = await calRes.json()
          setCalendar(json.entries || json.calendar || [])
        }
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <ContentSkeleton />

  const inQueue = articles.filter(a => a.status === 'draft' || a.status === 'in_progress').length
  const pendingReview = articles.filter(a => a.status === 'pending_review').length
  const nextPublish = calendar.find(c => c.status === 'scheduled')

  // ── Executive Mode ────────────────────────────────────────────────────────
  if (mode === 'executive') {
    return (
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-zinc-200 text-lg leading-relaxed">
            {inQueue} article{inQueue !== 1 ? 's' : ''} in queue.{' '}
            {pendingReview > 0 && `${pendingReview} pending review. `}
            {nextPublish
              ? `Calendar: next publish ${new Date(nextPublish.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}.`
              : 'No scheduled publications yet.'}
          </p>
          <p className="text-zinc-500 text-sm">
            Your content engine is running. New articles are drafted and queued for review automatically.
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Builder / Developer Mode ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Queue', value: inQueue, icon: Clock, color: 'text-amber-400' },
          { label: 'Pending Review', value: pendingReview, icon: AlertCircle, color: 'text-amber-400' },
          { label: 'Published', value: articles.filter(a => a.status === 'published').length, icon: CheckCircle2, color: 'text-emerald-400' },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={cn('w-3.5 h-3.5', kpi.color)} />
              <span className="text-xs text-zinc-500">{kpi.label}</span>
            </div>
            <span className="text-2xl font-bold text-zinc-100 tabular-nums">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Two columns: Calendar + Article Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editorial Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Editorial Calendar
          </h3>
          {calendar.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {calendar.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 text-xs py-2 border-b border-zinc-800/30 last:border-0">
                  <span className="text-zinc-500 w-16 shrink-0">
                    {new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-zinc-300 flex-1 truncate">{entry.theme}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      entry.status === 'published' ? 'border-emerald-700 text-emerald-400' :
                      entry.status === 'scheduled' ? 'border-amber-700 text-amber-400' :
                      'border-zinc-700 text-zinc-500'
                    )}
                  >
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              Calendar entries will appear when content is scheduled
            </div>
          )}
        </motion.div>

        {/* Article Queue */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-400" />
            Article Queue
          </h3>
          {articles.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {articles.map((article) => (
                <div key={article.id} className="flex items-center gap-3 text-xs py-2 border-b border-zinc-800/30 last:border-0">
                  <FileText className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span className="text-zinc-300 flex-1 truncate">{article.title}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      article.status === 'published' ? 'border-emerald-700 text-emerald-400' :
                      article.status === 'pending_review' ? 'border-amber-700 text-amber-400' :
                      'border-zinc-700 text-zinc-500'
                    )}
                  >
                    {article.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
              Articles will appear as your content engine generates them
            </div>
          )}
        </motion.div>
      </div>

      {/* Developer Mode: Programmatic Content */}
      {mode === 'developer' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Developer: Content Engine Status</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Total Articles</div>
              <div className="text-zinc-200">{articles.length}</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">Calendar Entries</div>
              <div className="text-zinc-200">{calendar.length}</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">By Format</div>
              <div className="text-zinc-200">{[...new Set(articles.map(a => a.format))].length} types</div>
            </div>
            <div className="p-2 rounded bg-zinc-800/50">
              <div className="text-zinc-500">By Pillar</div>
              <div className="text-zinc-200">{[...new Set(articles.map(a => a.pillar))].length} pillars</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
