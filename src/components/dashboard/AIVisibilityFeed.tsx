'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Search, Trophy, MessageSquare, Flame } from 'lucide-react'

interface FeedItem {
  id: string
  domain: string
  itemType: string
  title: string
  description: string
  engine: string | null
  delta: number
  severity: string
  iconEmoji: string
  isRead: boolean
  createdAt: string
}

interface FeedResponse {
  items: FeedItem[]
  _meta: { status: string; model: string; provider: string; latencyMs: number }
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  positive: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  critical: { bg: 'bg-red-500/5', border: 'border-red-500/20', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: 'text-emerald-400',
  claude: 'text-amber-400',
  gemini: 'text-blue-400',
  perplexity: 'text-cyan-400',
  copilot: 'text-purple-400',
}

export default function AIVisibilityFeed({ domain }: { domain: string }) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<string>('simulation')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ai/feed?domain=${encodeURIComponent(domain)}&limit=20`)
        const data: FeedResponse = await res.json()
        setItems(data.items || [])
        setDataSource(data._meta?.status || 'simulation')
      } catch {
        // Use empty feed on error
      } finally {
        setLoading(false)
      }
    }
    if (domain) load()
  }, [domain])

  const formatTimeAgo = (dateStr: string) => {
    const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">AI Visibility Feed</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">AI Visibility Feed</CardTitle>
        </div>
        <Badge variant="outline" className={dataSource === 'live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
          {dataSource === 'live' ? '● Live' : dataSource === 'estimated' ? '◐ Estimated' : '○ Simulation'}
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px] pr-3">
          <AnimatePresence>
            <div className="space-y-2">
              {items.map((item, i) => {
                const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-lg border p-3 ${style.bg} ${style.border} ${!item.isRead ? 'ring-1 ring-emerald-500/20' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{item.iconEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-foreground truncate">{item.title}</span>
                          {item.delta !== 0 && (
                            <span className={`text-xs font-bold ${item.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.delta > 0 ? '+' : ''}{item.delta}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.engine && (
                            <span className={`text-xs font-medium ${ENGINE_COLORS[item.engine] || 'text-muted-foreground'}`}>
                              {item.engine.charAt(0).toUpperCase() + item.engine.slice(1)}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground/60">•</span>
                          <span className="text-xs text-muted-foreground/60">{formatTimeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                      {!item.isRead && <div className="h-2 w-2 rounded-full bg-emerald-400 mt-2 shrink-0" />}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
