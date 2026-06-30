'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, ArrowRight, Clock, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

interface MemoryEntry {
  id: string
  actionType: string
  actionDetail: string
  visibilityDelta: number
  citationDelta: number
  revenueDelta: number
  confidence: number
  createdAt: string
  measuredAt: string | null
}

function MemorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-6 w-40 bg-zinc-800/50" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-24 h-4 bg-zinc-800/50" />
          <Skeleton className="flex-1 h-16 bg-zinc-800/50 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function MemoryPage() {
  const { mode } = useOSStore()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<MemoryEntry[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/content-engine/growth-memory?limit=20&days=30')
        if (res.ok) {
          const json = await res.json()
          setEntries(json.entries || [])
        }
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <MemorySkeleton />

  // Fallback data
  const displayEntries: MemoryEntry[] = entries.length > 0 ? entries : [
    { id: '1', actionType: 'published_article', actionDetail: 'Published "AI Visibility Score Explained"', visibilityDelta: 3, citationDelta: 2, revenueDelta: 0, confidence: 85, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), measuredAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '2', actionType: 'created_faq', actionDetail: 'Added FAQ schema to pricing page', visibilityDelta: 2, citationDelta: 1, revenueDelta: 200, confidence: 78, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), measuredAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: '3', actionType: 'updated_llms_txt', actionDetail: 'Updated llms.txt with new product features', visibilityDelta: 1, citationDelta: 0, revenueDelta: 0, confidence: 91, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), measuredAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: '4', actionType: 'added_internal_link', actionDetail: 'Cross-linked blog posts for entity SEO', visibilityDelta: 1, citationDelta: 1, revenueDelta: 0, confidence: 72, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), measuredAt: new Date(Date.now() - 86400000 * 6).toISOString() },
    { id: '5', actionType: 'created_entity', actionDetail: 'Created entity page for founding team', visibilityDelta: 4, citationDelta: 3, revenueDelta: 500, confidence: 88, createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), measuredAt: new Date(Date.now() - 86400000 * 9).toISOString() },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Database className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-zinc-100">AI Memory Graph</h2>
        <span className="text-xs text-zinc-500">({displayEntries.length} entries)</span>
      </motion.div>

      <p className="text-zinc-400 text-sm max-w-2xl">
        Every action you take creates a memory. The AI uses these memories to predict what works, avoid what doesn&apos;t, and get smarter over time.
      </p>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[47px] top-0 bottom-0 w-px bg-zinc-800" />

        <div className="space-y-4">
          {displayEntries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              className="relative flex items-start gap-4"
            >
              {/* Timeline node */}
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10',
                entry.visibilityDelta > 0 ? 'border-emerald-500 bg-emerald-500/15' : 'border-zinc-600 bg-zinc-800'
              )}>
                {entry.visibilityDelta > 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Clock className="w-3 h-3 text-zinc-500" />
                )}
              </div>

              {/* Content card */}
              <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 group hover:border-zinc-700/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">{entry.actionType.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(entry.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-2">{entry.actionDetail}</p>

                {/* Outcome → Impact flow */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">Action</span>
                  <ArrowRight className="w-3 h-3 text-zinc-700" />
                  <div className="flex items-center gap-3">
                    {entry.visibilityDelta !== 0 && (
                      <span className={cn('font-mono', entry.visibilityDelta > 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {entry.visibilityDelta > 0 ? '+' : ''}{entry.visibilityDelta} visibility
                      </span>
                    )}
                    {entry.citationDelta !== 0 && (
                      <span className={cn('font-mono', entry.citationDelta > 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {entry.citationDelta > 0 ? '+' : ''}{entry.citationDelta} citations
                      </span>
                    )}
                    {entry.revenueDelta !== 0 && (
                      <span className="text-zinc-400 font-mono">
                        ${entry.revenueDelta > 0 ? '+' : ''}{entry.revenueDelta} revenue
                      </span>
                    )}
                  </div>
                </div>

                {/* Developer Mode: Confidence */}
                {mode === 'developer' && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/30 text-[10px] text-zinc-600 font-mono">
                    confidence: {entry.confidence}% · id: {entry.id}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Developer Mode: Raw Memory Data & API Status */}
      {mode === 'developer' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
          >
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Developer: Memory Graph API</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2 rounded bg-zinc-800/50">
                <div className="text-zinc-500">Total Entries</div>
                <div className="text-zinc-200">{displayEntries.length}</div>
              </div>
              <div className="p-2 rounded bg-zinc-800/50">
                <div className="text-zinc-500">Data Source</div>
                <div className={cn('font-medium', entries.length > 0 ? 'text-emerald-400' : 'text-amber-400')}>
                  {entries.length > 0 ? 'LIVE' : 'FALLBACK'}
                </div>
              </div>
              <div className="p-2 rounded bg-zinc-800/50">
                <div className="text-zinc-500">Avg Confidence</div>
                <div className="text-zinc-200">
                  {displayEntries.length > 0
                    ? Math.round(displayEntries.reduce((s, e) => s + e.confidence, 0) / displayEntries.length)
                    : 0}%
                </div>
              </div>
              <div className="p-2 rounded bg-zinc-800/50">
                <div className="text-zinc-500">Visibility Impact</div>
                <div className="text-emerald-400">
                  +{displayEntries.reduce((s, e) => s + Math.max(0, e.visibilityDelta), 0)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
          >
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Developer: Raw Memory Payload</h3>
            <pre className="text-[10px] text-zinc-500 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
              {JSON.stringify(entries.length > 0 ? entries : displayEntries, null, 2)}
            </pre>
          </motion.div>
        </>
      )}
    </div>
  )
}
