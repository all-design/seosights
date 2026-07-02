'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Clock, Filter } from 'lucide-react'

interface TimelineEvent {
  id: string
  systemName: string
  eventType: string
  title: string
  description: string | null
  timestamp: string
  iconName: string | null
}

const SYSTEM_COLORS: Record<string, string> = {
  age: 'bg-amber-500',
  client_zero: 'bg-sky-500',
  qa_engine: 'bg-purple-500',
  observatory: 'bg-teal-500',
  mission_control: 'bg-emerald-500',
}

const SYSTEM_LABELS: Record<string, string> = {
  age: 'AGE',
  client_zero: 'Client Zero',
  qa_engine: 'QA Engine',
  observatory: 'Observatory',
  mission_control: 'Mission Control',
}

const SYSTEM_TEXT_COLORS: Record<string, string> = {
  age: 'text-amber-400',
  client_zero: 'text-sky-400',
  qa_engine: 'text-purple-400',
  observatory: 'text-teal-400',
  mission_control: 'text-emerald-400',
}

const SYSTEM_BORDER_COLORS: Record<string, string> = {
  age: 'border-amber-500/30',
  client_zero: 'border-sky-500/30',
  qa_engine: 'border-purple-500/30',
  observatory: 'border-teal-500/30',
  mission_control: 'border-emerald-500/30',
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [availableSystems, setAvailableSystems] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const url = activeFilter
        ? `/api/ops/timeline?system=${activeFilter}&limit=100`
        : '/api/ops/timeline?limit=100'

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        if (data.availableSystems) {
          setAvailableSystems(data.availableSystems)
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-lg bg-gray-800" />
        <Skeleton className="h-96 rounded-lg bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Clock className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Global Timeline™</h2>
                <p className="text-xs text-gray-400">
                  {events.length} events · All systems · Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Bar */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <Button
              variant={activeFilter === null ? 'default' : 'outline'}
              size="sm"
              className={`text-xs h-7 ${
                activeFilter === null
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
              onClick={() => setActiveFilter(null)}
            >
              All Systems
            </Button>
            {availableSystems.map((sys) => (
              <Button
                key={sys}
                variant={activeFilter === sys ? 'default' : 'outline'}
                size="sm"
                className={`text-xs h-7 ${
                  activeFilter === sys
                    ? `${SYSTEM_TEXT_COLORS[sys] || 'text-emerald-400'} bg-gray-800 ${SYSTEM_BORDER_COLORS[sys] || 'border-emerald-500/30'}`
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
                onClick={() => setActiveFilter(sys)}
              >
                {SYSTEM_LABELS[sys] || sys}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="border-gray-800 bg-transparent">
        <CardContent className="pt-4 pb-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-0.5">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="flex items-start gap-3 py-2 border-b border-gray-800/30 last:border-0 hover:bg-gray-800/20 px-2 rounded"
                >
                  {/* Timestamp */}
                  <div className="flex-shrink-0 w-20">
                    <span className="text-[10px] font-mono text-gray-500">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>

                  {/* System dot */}
                  <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${SYSTEM_COLORS[event.systemName] || 'bg-gray-500'}`} />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-200 truncate">{event.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 flex-shrink-0 ${
                          SYSTEM_TEXT_COLORS[event.systemName] || 'text-gray-400'
                        } bg-gray-800 border-gray-700`}
                      >
                        {SYSTEM_LABELS[event.systemName] || event.systemName}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{event.description}</p>
                    )}
                  </div>

                  {/* Event type */}
                  <Badge variant="outline" className="text-[9px] bg-gray-800/50 text-gray-500 border-gray-700 flex-shrink-0">
                    {event.eventType}
                  </Badge>
                </motion.div>
              ))}

              {events.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No events found for this filter
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
