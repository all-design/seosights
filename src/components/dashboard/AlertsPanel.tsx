'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  Bell,
  CheckCheck,
  Eye,
  AlertTriangle,
  Info,
  ShieldAlert,
  TrendingDown,
  Bot,
  Globe,
  FileText,
  BarChart3,
  Loader2,
  RefreshCw,
  Radio,
} from 'lucide-react'

// ── Alert type config ──────────────────────────────────────
const ALERT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; borderColor: string; label: string }> = {
  citation_drop: { icon: TrendingDown, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', label: 'Citation Drop' },
  ai_overview_lost: { icon: Eye, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', label: 'AI Overview Lost' },
  bot_blocked: { icon: Bot, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', label: 'Bot Blocked' },
  score_change: { icon: BarChart3, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', label: 'Score Change' },
  llms_txt_removed: { icon: FileText, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', label: 'llms.txt Removed' },
}

const SEVERITY_CONFIG: Record<string, { emoji: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  critical: { emoji: '🔴', icon: ShieldAlert, color: 'text-rose-400', bgColor: 'bg-rose-500/5', borderColor: 'border-rose-500/30' },
  warning: { emoji: '🟡', icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/5', borderColor: 'border-amber-500/30' },
  info: { emoji: '🔵', icon: Info, color: 'text-cyan-400', bgColor: 'bg-cyan-500/5', borderColor: 'border-cyan-500/30' },
}

// ── Alert interface ──────────────────────────────────────────
interface VisibilityAlert {
  id: string
  userId: string
  domain: string
  alertType: string
  severity: string
  message: string
  data: string | null
  isRead: boolean
  createdAt: string
}

type FilterTab = 'all' | 'critical' | 'warning' | 'info'

// ── Relative time ───────────────────────────────────────────
function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// ── Props ───────────────────────────────────────────────────
interface AlertsPanelProps {
  isOpen: boolean
  onClose: () => void
  domain?: string
  userId?: string
}

export default function AlertsPanel({ isOpen, onClose, domain, userId }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<VisibilityAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [markingRead, setMarkingRead] = useState<string | null>(null)

  // ── Fetch alerts ────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (domain) params.set('domain', domain)
      if (userId) params.set('userId', userId)
      const response = await fetch(`/api/alerts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.warn('[AlertsPanel] Failed to fetch alerts:', err)
    } finally {
      setLoading(false)
    }
  }, [domain, userId])

  // Fetch on open + auto-refresh every 60s
  useEffect(() => {
    if (isOpen) {
      fetchAlerts()
      const interval = setInterval(fetchAlerts, 60000)
      return () => clearInterval(interval)
    }
  }, [isOpen, fetchAlerts])

  // ── Mark as read ────────────────────────────────────────
  const handleMarkAsRead = async (alertId: string) => {
    setMarkingRead(alertId)
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds: [alertId] }),
      })
      if (response.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('[AlertsPanel] Mark as read failed:', err)
    } finally {
      setMarkingRead(null)
    }
  }

  // ── Mark all as read ────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.isRead).map(a => a.id)
    if (unreadIds.length === 0) return
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds: unreadIds }),
      })
      if (response.ok) {
        setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('[AlertsPanel] Mark all as read failed:', err)
    }
  }

  // ── Check Visibility ────────────────────────────────────
  const handleCheckVisibility = async () => {
    if (!domain) return
    setChecking(true)
    try {
      const response = await fetch('/api/alerts/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, userId: userId || 'default-user' }),
      })
      if (response.ok) {
        const result = await response.json()
        // Refresh alerts after check
        await fetchAlerts()
      }
    } catch (err) {
      console.error('[AlertsPanel] Visibility check failed:', err)
    } finally {
      setChecking(false)
    }
  }

  // ── Filtered alerts ─────────────────────────────────────
  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter)

  const filterCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-in Panel */}
          <motion.div
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-card/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI Visibility Alerts</h3>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs h-8"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs + Check Button */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5 gap-0.5">
                {(['all', 'critical', 'warning', 'info'] as FilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                      filter === tab
                        ? tab === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : tab === 'warning'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : tab === 'info'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-white/10 text-foreground border border-white/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'critical' && <span className="text-[10px]">🔴</span>}
                    {tab === 'warning' && <span className="text-[10px]">🟡</span>}
                    {tab === 'info' && <span className="text-[10px]">🔵</span>}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span className="text-[10px] opacity-60">{filterCounts[tab]}</span>
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleCheckVisibility}
                disabled={checking || !domain}
                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs h-8 shrink-0"
              >
                {checking ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                <span className="hidden sm:inline">{checking ? 'Checking...' : 'Check'}</span>
              </Button>
            </div>

            {/* Alert List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {loading && alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">Loading alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Radio className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold mb-1">No {filter !== 'all' ? filter + ' ' : ''}alerts</p>
                  <p className="text-xs text-muted-foreground">
                    {filter !== 'all'
                      ? `No ${filter} severity alerts found.`
                      : 'Your site visibility is being monitored. New alerts will appear here.'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredAlerts.map((alert, index) => {
                    const typeConfig = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.score_change
                    const sevConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info
                    const TypeIcon = typeConfig.icon
                    const SevIcon = sevConfig.icon

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                      >
                        <Card className={`${sevConfig.bgColor} border ${sevConfig.borderColor} overflow-hidden transition-all hover:border-white/20 ${!alert.isRead ? 'ring-1 ring-white/5' : 'opacity-70'}`}>
                          <div className="p-3.5">
                            {/* Top row: Severity emoji + Type badge + Time */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm" title={alert.severity}>{sevConfig.emoji}</span>
                                <Badge variant="outline" className={`${typeConfig.color} ${typeConfig.borderColor} text-[10px] font-bold`}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {typeConfig.label}
                                </Badge>
                                {!alert.isRead && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{getRelativeTime(alert.createdAt)}</span>
                            </div>

                            {/* Domain */}
                            <div className="flex items-center gap-1 mb-1.5">
                              <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{alert.domain}</span>
                            </div>

                            {/* Message */}
                            <p className={`text-sm leading-relaxed mb-2.5 ${!alert.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {alert.message}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {!alert.isRead && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(alert.id)}
                                  disabled={markingRead === alert.id}
                                  className="h-7 text-xs text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 px-2"
                                >
                                  {markingRead === alert.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCheck className="w-3 h-3 mr-1" />
                                  )}
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-black/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Auto-refreshes every 60s</span>
                </div>
                {domain && (
                  <span className="text-[10px] text-muted-foreground">Monitoring: {domain}</span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
