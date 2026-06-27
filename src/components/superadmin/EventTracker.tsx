'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Activity,
  Filter,
  Clock,
  User,
  Globe,
  Zap,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface EventItem {
  id: string
  event: string
  userId: string | null
  domain: string | null
  timestamp: string
  metadata?: Record<string, unknown>
}

interface EventCount {
  event: string
  count: number
}

interface EventsData {
  recent: EventItem[]
  countsByType: EventCount[]
}

// ─── Event Type Filters ─────────────────────────────────────────────────

const EVENT_TYPES = [
  'Started Audit',
  'Completed Audit',
  'Viewed Replay',
  'Opened Diff',
  'Connected WordPress',
  'Executed Fix',
  'Opened Digest',
  'Clicked Upgrade',
] as const

type EventType = (typeof EVENT_TYPES)[number]

// ─── Utility: trackEvent ────────────────────────────────────────────────

export async function trackEvent(
  event: string,
  userId?: string,
  domain?: string,
  metadata?: Record<string, unknown>
) {
  await fetch('/api/superadmin/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, userId, domain, metadata }),
  })
}

// ─── Helpers ────────────────────────────────────────────────────────────

function eventTypeColor(event: string): string {
  if (event.includes('Audit')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (event.includes('Replay')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (event.includes('Diff')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  if (event.includes('WordPress') || event.includes('Connect'))
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (event.includes('Fix') || event.includes('Execute'))
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  if (event.includes('Digest')) return 'bg-pink-500/10 text-pink-400 border-pink-500/20'
  if (event.includes('Upgrade')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  return 'bg-muted text-muted-foreground border-white/10'
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Component ──────────────────────────────────────────────────────────

export default function EventTracker() {
  const [data, setData] = useState<EventsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set())

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeFilters.size > 0) {
        params.set('types', Array.from(activeFilters).join(','))
      }
      const res = await fetch(`/api/superadmin/events?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [activeFilters])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const toggleFilter = (type: EventType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-6 text-center">
          <p className="text-red-400 text-sm">Error loading events: {error}</p>
        </Card>
      </div>
    )
  }

  const filteredEvents =
    data?.recent.filter(
      (e) => activeFilters.size === 0 || activeFilters.has(e.event as EventType)
    ) || []

  return (
    <div className="space-y-6">
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-emerald-400" />
              Event Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={activeFilters.has(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter(type)}
                  className={
                    activeFilters.has(type)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs'
                      : 'border-white/10 text-muted-foreground hover:text-foreground text-xs'
                  }
                >
                  {type}
                </Button>
              ))}
              {activeFilters.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilters(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Live Event Feed ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Live Event Feed
                {filteredEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredEvents.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No events found. Try adjusting your filters.
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-1">
                    <AnimatePresence>
                      {filteredEvents.map((evt, idx) => (
                        <motion.div
                          key={evt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${eventTypeColor(evt.event)}`}
                          >
                            {evt.event}
                          </Badge>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {evt.userId || 'Anonymous'}
                            </span>
                            {evt.domain && (
                              <>
                                <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {evt.domain}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(evt.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Event Counts by Type ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                Counts by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {loading ? (
                <Skeleton className="h-64 rounded-lg" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.countsByType || []} layout="vertical" barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        type="number"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="event"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        width={110}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15,15,15,0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="rgba(16,185,129,0.6)"
                        radius={[0, 4, 4, 0]}
                        name="Count"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
