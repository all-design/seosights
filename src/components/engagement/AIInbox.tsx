'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Link2,
  Shield,
  Lightbulb,
  Brain,
  Lock,
  Flame,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InboxItem {
  id: string
  itemType: string
  headline: string
  body: string
  isUnread: boolean
  isActionable: boolean
  actionLabel: string | null
  priority: number
  createdAt: string
}

const typeIcons: Record<string, React.ElementType> = {
  citation_change: Link2,
  competitor_drop: Shield,
  opportunity: Lightbulb,
  prediction_result: Brain,
  vault_unlock: Lock,
  streak_warning: Flame,
}

const typeColors: Record<string, string> = {
  citation_change: 'text-sky-400',
  competitor_drop: 'text-red-400',
  opportunity: 'text-emerald-400',
  prediction_result: 'text-purple-400',
  vault_unlock: 'text-amber-400',
  streak_warning: 'text-orange-400',
}

type FilterType = 'all' | 'unread' | 'actionable'

export default function AIInbox() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    let cancelled = false
    fetch('/api/engagement/inbox')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/engagement/inbox/${id}/read`, { method: 'POST' })
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isUnread: false } : item
        )
      )
    } catch {
      // Silently fail
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return item.isUnread
    if (filter === 'actionable') return item.isActionable
    return true
  })

  const unreadCount = items.filter((i) => i.isUnread).length

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const hours = Math.floor(diffMs / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-emerald-500" />
          <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
            AI Inbox™
          </span>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
            Unread {unreadCount}
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-0.5 bg-slate-800/50 rounded-lg w-fit">
        {(['all', 'unread', 'actionable'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
              filter === f
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
        {filteredItems.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No items match this filter.</p>
        ) : (
          filteredItems.map((item, i) => {
            const Icon = typeIcons[item.itemType] || Mail
            const color = typeColors[item.itemType] || 'text-slate-400'

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => item.isUnread && handleMarkRead(item.id)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  item.isUnread
                    ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                    : 'bg-slate-800/20 border-slate-800/50'
                }`}
              >
                {/* Unread dot */}
                {item.isUnread && (
                  <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0" />
                )}

                {/* Icon */}
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      item.isUnread ? 'text-slate-100 font-medium' : 'text-slate-400'
                    } truncate`}
                  >
                    {item.headline}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{formatTime(item.createdAt)}</p>
                </div>

                {/* Action button */}
                {item.isActionable && item.actionLabel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-7 shrink-0"
                  >
                    {item.actionLabel}
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
