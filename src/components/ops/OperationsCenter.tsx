'use client'

/**
 * Operations Center — Internal Developer Dashboard
 *
 * NOT for users. For developers.
 *
 * Shows:
 * - System component health (DB, Redis, AI Router, Stripe, Email, WebSocket, CMS)
 * - Fallback statistics and recent fallbacks
 * - Error count, fallback rate, avg response time
 * - Slow queries, LLM failure rate
 *
 * Keyboard shortcut: Ctrl+Shift+O
 * Also accessible from Superadmin panel.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Database,
  Cpu,
  CreditCard,
  Mail,
  Wifi,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingDown,
  Shield,
} from 'lucide-react'

interface ComponentStatus {
  status: 'ok' | 'degraded' | 'down'
  latency: number
  details: string
  lastCheck: string
}

interface FallbackEntry {
  id: string
  timestamp: string
  api: string
  reason: string
  category: string
  confidence: number
  correlationId?: string
}

interface SystemStatus {
  status: string
  timestamp: string
  responseTime: number
  components: Record<string, ComponentStatus>
  fallbackStats: {
    total: number
    last24h: number
    last1h: number
    byCategory: Record<string, number>
    byApi: Record<string, number>
    fallbackRate: number
  }
  recentFallbacks: FallbackEntry[]
  environment: string
  version: string
}

interface OperationsCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function OperationsCenter({ isOpen, onClose }: OperationsCenterProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedFallbacks, setExpandedFallbacks] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/system/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) fetchStatus()
  }, [isOpen, fetchStatus])

  useEffect(() => {
    if (!autoRefresh || !isOpen) return
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, isOpen, fetchStatus])

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'ok': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'down': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getComponentIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      database: <Database className="h-4 w-4" />,
      redis: <Zap className="h-4 w-4" />,
      aiRouter: <Cpu className="h-4 w-4" />,
      stripe: <CreditCard className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      websocket: <Wifi className="h-4 w-4" />,
      cms: <Globe className="h-4 w-4" />,
    }
    return icons[key] || <Activity className="h-4 w-4" />
  }

  const getComponentLabel = (key: string) => {
    const labels: Record<string, string> = {
      database: 'Database',
      redis: 'Redis',
      aiRouter: 'AI Router',
      stripe: 'Stripe',
      email: 'Email (Resend)',
      websocket: 'WebSocket',
      cms: 'CMS',
    }
    return labels[key] || key
  }

  const getCategoryBadgeColor = (cat: string) => {
    const colors: Record<string, string> = {
      db_missing_table: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      db_connection: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      db_query: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      ai_provider: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      redis: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      stripe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      external_api: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    }
    return colors[cat] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Operations Center</h2>
              <p className="text-sm text-muted-foreground">Internal developer dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-emerald-500 text-emerald-600' : ''}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto
            </Button>
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}

        {status && (
          <>
            {/* Overall Status Banner */}
            <div className={`p-4 mb-4 rounded-lg border ${
              status.status === 'healthy'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status.status === 'healthy'
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <AlertTriangle className="h-5 w-5 text-amber-600" />
                  }
                  <span className="font-semibold text-foreground">
                    System Status: {status.status === 'healthy' ? 'All Systems Operational' : 'Degraded Performance'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Response: {status.responseTime}ms · {status.environment} · v{status.version}
                </span>
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <MetricCard
                label="Errors (24h)"
                value={String(status.fallbackStats.last24h)}
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                trend={status.fallbackStats.last24h > 10 ? 'warning' : 'ok'}
              />
              <MetricCard
                label="Fallbacks (1h)"
                value={String(status.fallbackStats.last1h)}
                icon={<TrendingDown className="h-4 w-4 text-amber-500" />}
                trend={status.fallbackStats.last1h > 5 ? 'warning' : 'ok'}
              />
              <MetricCard
                label="Fallback Rate"
                value={`${status.fallbackStats.fallbackRate}%`}
                icon={<Activity className="h-4 w-4 text-blue-500" />}
                trend={status.fallbackStats.fallbackRate > 2 ? 'warning' : 'ok'}
              />
              <MetricCard
                label="Total Fallbacks"
                value={String(status.fallbackStats.total)}
                icon={<Shield className="h-4 w-4 text-purple-500" />}
                trend="ok"
              />
            </div>

            {/* Fallback Rate Progress */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Fallback Rate Threshold</span>
                <span className={`text-sm font-bold ${
                  status.fallbackStats.fallbackRate > 2 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {status.fallbackStats.fallbackRate}% / 2% alert threshold
                </span>
              </div>
              <Progress
                value={Math.min(status.fallbackStats.fallbackRate * 10, 100)}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {status.fallbackStats.fallbackRate > 2
                  ? '⚠️ Fallback rate exceeds 2% — investigate immediately'
                  : '✅ Fallback rate is within acceptable range'}
              </p>
            </div>

            {/* Component Health Grid */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Component Health
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(status.components).map(([key, comp]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      comp.status === 'ok'
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                        : comp.status === 'degraded'
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                          : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(comp.status)}
                      {getComponentIcon(key)}
                      <span className="text-sm font-medium text-foreground">{getComponentLabel(key)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{comp.details}</div>
                      <div className="text-xs text-muted-foreground">{comp.latency}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fallback Breakdown by API */}
            {Object.keys(status.fallbackStats.byApi).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Fallbacks by API</h3>
                <div className="space-y-1">
                  {Object.entries(status.fallbackStats.byApi)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([api, count]) => (
                      <div key={api} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30">
                        <code className="text-xs text-foreground">{api}</code>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Fallbacks */}
            {status.recentFallbacks.length > 0 && (
              <div className="mb-4">
                <button
                  className="w-full text-left text-sm font-semibold text-foreground mb-2 flex items-center gap-1 hover:underline"
                  onClick={() => setExpandedFallbacks(!expandedFallbacks)}
                >
                  {expandedFallbacks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Recent Fallbacks ({status.recentFallbacks.length})
                </button>
                {expandedFallbacks && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {status.recentFallbacks.map((fb) => (
                      <div key={fb.id} className="p-2 rounded border bg-muted/20 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-foreground">{fb.api}</code>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryBadgeColor(fb.category)}`}>
                              {fb.category}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {new Date(fb.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-mono text-[10px] break-all">
                          {fb.reason.substring(0, 150)}
                        </p>
                        {fb.correlationId && (
                          <p className="text-muted-foreground text-[10px] mt-1">
                            x-request-id: <code className="font-mono">{fb.correlationId}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fallbacks by Category */}
            {Object.keys(status.fallbackStats.byCategory).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">By Category</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(status.fallbackStats.byCategory).map(([cat, count]) => (
                    <Badge key={cat} className={`text-xs ${getCategoryBadgeColor(cat)}`}>
                      {cat}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!status && !error && loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MetricCard({ label, value, icon, trend }: {
  label: string
  value: string
  icon: React.ReactNode
  trend: 'ok' | 'warning'
}) {
  return (
    <div className={`p-3 rounded-lg border ${
      trend === 'warning'
        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
        : 'bg-muted/30 border-border'
    }`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  )
}
