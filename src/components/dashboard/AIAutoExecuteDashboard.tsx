'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Globe,
  FileCode2,
  PenLine,
  ShieldCheck,
  Workflow,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Server,
  Unplug,
  Link2,
  History,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
type ExecutionStatus = 'pending' | 'approved' | 'executing' | 'done' | 'failed'
type Platform = 'WordPress' | 'Webflow' | 'API'

interface ActionItem {
  id: string
  action: string
  target: string
  platform: Platform
  status: ExecutionStatus
  icon: string
  approvedAt?: string
  executedAt?: string
  executionTime?: number
  canRollback: boolean
}

interface ConnectionStatus {
  platform: Platform
  connected: boolean
  lastSync?: string
  url?: string
}

interface ExecutionHistoryEntry {
  id: string
  action: string
  platform: Platform
  status: 'done' | 'failed'
  executedAt: string
  executionTime: number
  rolledBack: boolean
}

interface AutoExecuteData {
  actions: ActionItem[]
  connections: ConnectionStatus[]
  history: ExecutionHistoryEntry[]
  stats: {
    actionsThisMonth: number
    avgTimeSeconds: number
    successRate: number
  }
}

interface AIAutoExecuteDashboardProps {
  domain: string
  userId?: string
}

// ── Action icon mapping ─────────────────────────────────────────────────
const ACTION_ICONS: Record<string, typeof FileCode2> = {
  schema: FileCode2,
  meta: PenLine,
  llmsTxt: Globe,
  content: PenLine,
  redirect: ShieldCheck,
  default: Zap,
}

// ── Platform colors ─────────────────────────────────────────────────────
const PLATFORM_STYLES: Record<Platform, { bg: string; text: string; border: string }> = {
  WordPress: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/20' },
  Webflow: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/20' },
  API: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/20' },
}

// ── Fallback mock data ──────────────────────────────────────────────────
const FALLBACK_DATA: AutoExecuteData = {
  stats: { actionsThisMonth: 127, avgTimeSeconds: 2.3, successRate: 99.2 },
  connections: [
    { platform: 'WordPress', connected: true, lastSync: '2 min ago', url: 'myblog.com' },
    { platform: 'Webflow', connected: false },
    { platform: 'API', connected: true, lastSync: '5 min ago' },
  ],
  actions: [
    { id: '1', action: 'Add FAQ schema to /pricing', target: '/pricing', platform: 'WordPress', status: 'approved', icon: 'schema', canRollback: false },
    { id: '2', action: 'Update meta description on /about', target: '/about', platform: 'WordPress', status: 'approved', icon: 'meta', canRollback: false },
    { id: '3', action: 'Create llms.txt at site root', target: '/', platform: 'WordPress', status: 'executing', icon: 'llmsTxt', canRollback: false },
    { id: '4', action: 'Fix broken redirect on /blog/old-post', target: '/blog/old-post', platform: 'Webflow', status: 'pending', icon: 'redirect', canRollback: true },
    { id: '5', action: 'Add author bio schema to team page', target: '/team', platform: 'WordPress', status: 'pending', icon: 'schema', canRollback: true },
    { id: '6', action: 'Publish optimized content brief', target: '/services/seo', platform: 'WordPress', status: 'pending', icon: 'content', canRollback: true },
  ],
  history: [
    { id: 'h1', action: 'Add Organization schema to homepage', platform: 'WordPress', status: 'done', executedAt: '2 hours ago', executionTime: 1.8, rolledBack: false },
    { id: 'h2', action: 'Update meta tags on /contact', platform: 'WordPress', status: 'done', executedAt: '5 hours ago', executionTime: 2.1, rolledBack: false },
    { id: 'h3', action: 'Deploy robots.txt update', platform: 'API', status: 'failed', executedAt: '1 day ago', executionTime: 0, rolledBack: false },
    { id: 'h4', action: 'Add structured data to /faq', platform: 'WordPress', status: 'done', executedAt: '2 days ago', executionTime: 1.5, rolledBack: true },
  ],
}

// ── Main Component ───────────────────────────────────────────────────────
export default function AIAutoExecuteDashboard({ domain, userId }: AIAutoExecuteDashboardProps) {
  const [data, setData] = useState<AutoExecuteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executing, setExecuting] = useState<Set<string>>(new Set())
  const [rollingBack, setRollingBack] = useState<Set<string>>(new Set())

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/ai/auto-execute?domain=${encodeURIComponent(domain)}${userId ? `&userId=${userId}` : ''}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch {
        setData(FALLBACK_DATA)
      } finally {
        setLoading(false)
      }
    }
    if (domain) loadData()
  }, [domain, userId])

  const handleExecute = async (actionId: string) => {
    setExecuting(prev => new Set(prev).add(actionId))
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 2000))
    setExecuting(prev => {
      const next = new Set(prev)
      next.delete(actionId)
      return next
    })
    // Update local state
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        actions: prev.actions.map(a => a.id === actionId ? { ...a, status: 'done' as ExecutionStatus, executionTime: 2.1 } : a),
      }
    })
  }

  const handleRollback = async (actionId: string) => {
    setRollingBack(prev => new Set(prev).add(actionId))
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRollingBack(prev => {
      const next = new Set(prev)
      next.delete(actionId)
      return next
    })
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        history: prev.history.map(h => h.id === actionId ? { ...h, rolledBack: true } : h),
      }
    })
  }

  const actions = data?.actions ?? FALLBACK_DATA.actions
  const connections = data?.connections ?? FALLBACK_DATA.connections
  const history = data?.history ?? FALLBACK_DATA.history
  const stats = data?.stats ?? FALLBACK_DATA.stats

  const approvedActions = actions.filter(a => a.status === 'approved' || a.status === 'executing')
  const pendingActions = actions.filter(a => a.status === 'pending')

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">Auto Execute™</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">Auto Execute™</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load auto-execute data</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">Auto Execute™</CardTitle>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          {stats.actionsThisMonth} actions this month
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Executed</span>
            </div>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">{stats.actionsThisMonth}</span>
          </div>
          <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.04] p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Time</span>
            </div>
            <span className="text-xl font-bold text-purple-400 tabular-nums">{stats.avgTimeSeconds}s</span>
          </div>
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Success</span>
            </div>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">{stats.successRate}%</span>
          </div>
        </div>

        {/* ── CMS Connections ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">CMS Connections</span>
          </div>
          <div className="space-y-2">
            {connections.map((conn, i) => {
              const style = PLATFORM_STYLES[conn.platform]
              return (
                <motion.div
                  key={conn.platform}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${conn.connected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-2.5">
                    {conn.connected ? (
                      <Link2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Unplug className="w-4 h-4 text-muted-foreground/50" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-foreground">{conn.platform}</span>
                      {conn.connected && conn.url && (
                        <span className="text-xs text-muted-foreground ml-2">{conn.url}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conn.connected ? (
                      <>
                        {conn.lastSync && (
                          <span className="text-[10px] text-muted-foreground">Synced {conn.lastSync}</span>
                        )}
                        <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} text-[10px]`}>
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          Connected
                        </Badge>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Link2 className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Approved Actions Queue ─────────────────────────────────── */}
        {approvedActions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Workflow className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Ready to Execute</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                {approvedActions.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {approvedActions.map((item, i) => {
                const Icon = ACTION_ICONS[item.icon] ?? ACTION_ICONS.default
                const pStyle = PLATFORM_STYLES[item.platform]
                const isExecuting = item.status === 'executing' || executing.has(item.id)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5"
                  >
                    <div className="w-8 h-8 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`${pStyle.bg} ${pStyle.text} ${pStyle.border} text-[10px] px-1.5 py-0`}>
                          {item.platform}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{item.target}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isExecuting ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                          <span className="text-xs text-purple-400">Executing...</span>
                        </div>
                      ) : item.status === 'done' ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-emerald-400">Done</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleExecute(item.id)}
                          className="h-7 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Execute
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Pending Actions ────────────────────────────────────────── */}
        {pendingActions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Pending Approval</span>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                {pendingActions.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {pendingActions.map((item, i) => {
                const Icon = ACTION_ICONS[item.icon] ?? ACTION_ICONS.default
                const pStyle = PLATFORM_STYLES[item.platform]
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`${pStyle.bg} ${pStyle.text} ${pStyle.border} text-[10px] px-1.5 py-0`}>
                          {item.platform}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{item.target}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                      onClick={() => {
                        setData(prev => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            actions: prev.actions.map(a => a.id === item.id ? { ...a, status: 'approved' as ExecutionStatus } : a),
                          }
                        })
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Execution History ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Execution History</span>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5">
              <AnimatePresence>
                {history.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      entry.status === 'done'
                        ? entry.rolledBack
                          ? 'border-amber-500/15 bg-amber-500/5'
                          : 'border-white/[0.06] bg-white/[0.02]'
                        : 'border-red-500/15 bg-red-500/5'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      entry.status === 'done'
                        ? entry.rolledBack
                          ? 'bg-amber-500/15'
                          : 'bg-emerald-500/15'
                        : 'bg-red-500/15'
                    }`}>
                      {entry.status === 'done' ? (
                        entry.rolledBack ? (
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{entry.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{entry.platform}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{entry.executedAt}</span>
                        {entry.executionTime > 0 && (
                          <>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">{entry.executionTime}s</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {entry.rolledBack && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                          Rolled Back
                        </Badge>
                      )}
                      {entry.status === 'done' && !entry.rolledBack && entry.executionTime > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-amber-400 hover:text-amber-300 px-2"
                          disabled={rollingBack.has(entry.id)}
                          onClick={() => handleRollback(entry.id)}
                        >
                          {rollingBack.has(entry.id) ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3 mr-1" />
                          )}
                          Rollback
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
