'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckSquare, AlertTriangle, ArrowUp, Zap, ExternalLink } from 'lucide-react'

interface ActionItem {
  id: string
  actionType: string
  title: string
  description: string
  priority: string
  impact: string
  estimatedScoreGain: number
  status: string
  relatedUrl: string | null
}

interface ActionsResponse {
  actions: ActionItem[]
  _meta: { status: string }
}

const PRIORITY_STYLES: Record<string, { bg: string; icon: typeof AlertTriangle; color: string }> = {
  critical: { bg: 'bg-red-500/5 border-red-500/20', icon: AlertTriangle, color: 'text-red-400' },
  high: { bg: 'bg-amber-500/5 border-amber-500/20', icon: ArrowUp, color: 'text-amber-400' },
  medium: { bg: 'bg-blue-500/5 border-blue-500/20', icon: Zap, color: 'text-blue-400' },
  low: { bg: 'bg-muted/30 border-border/30', icon: CheckSquare, color: 'text-muted-foreground' },
}

const TYPE_ICONS: Record<string, string> = {
  fix_schema: '🔧', create_faq: '❓', add_author: '👤', create_llms_txt: '📄',
  reddit_answer: '💬', g2_review: '⭐', wikipedia: '📖', entity_fix: '🧩',
  content_update: '✏️', crawl_fix: '🤖',
}

export default function AIActionCenter({ domain }: { domain: string }) {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState('simulation')
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ai/action-center?domain=${encodeURIComponent(domain)}`)
        const data: ActionsResponse = await res.json()
        setActions(data.actions || [])
        setDataSource(data._meta?.status || 'simulation')
      } catch { /* empty */ } finally { setLoading(false) }
    }
    if (domain) load()
  }, [domain])

  const toggleAction = async (id: string) => {
    const isCompleted = completedIds.has(id)
    const newStatus = isCompleted ? 'pending' : 'completed'
    setCompletedIds(prev => {
      const next = new Set(prev)
      if (isCompleted) next.delete(id)
      else next.add(id)
      return next
    })
    try {
      await fetch('/api/ai/action-center', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: id, status: newStatus }),
      })
    } catch { /* silent */ }
  }

  const totalScoreGain = actions.reduce((sum, a) => sum + a.estimatedScoreGain, 0)
  const completedGain = actions.filter(a => completedIds.has(a.id)).reduce((sum, a) => sum + a.estimatedScoreGain, 0)
  const pendingActions = actions.filter(a => !completedIds.has(a.id))

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">Action Center</CardTitle></CardHeader>
        <CardContent><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded bg-muted/30 animate-pulse" />)}</div></CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Action Center</CardTitle>
          </div>
          <Badge variant="outline" className={dataSource === 'live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
            {dataSource === 'live' ? '● Live' : '○ Simulation'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="text-xs text-muted-foreground">
            <span className="font-bold text-emerald-400">{completedGain}</span> / {totalScoreGain} pts gained
          </div>
          <div className="h-1.5 flex-1 rounded-full bg-muted/50 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${totalScoreGain > 0 ? (completedGain / totalScoreGain) * 100 : 0}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{pendingActions.length} tasks left</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[450px]">
          <div className="space-y-2">
            {actions.map((action, i) => {
              const isCompleted = completedIds.has(action.id)
              const style = PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.medium
              const PriorityIcon = style.icon
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: isCompleted ? 0.5 : 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${isCompleted ? 'line-through' : ''}`}
                >
                  <div role="button" tabIndex={0} className="mt-0.5" onClick={() => toggleAction(action.id)} onKeyDown={e => e.key === 'Enter' && toggleAction(action.id)}>
                    <Checkbox checked={isCompleted} className="pointer-events-none" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{TYPE_ICONS[action.actionType] || '📋'}</span>
                      <span className={`text-sm font-medium ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>{action.title}</span>
                      <PriorityIcon className={`h-3 w-3 ${style.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        +{action.estimatedScoreGain} pts
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{action.priority}</Badge>
                      {action.relatedUrl && (
                        <a href={action.relatedUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5">
                          <ExternalLink className="h-2.5 w-2.5" /> Fix
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
