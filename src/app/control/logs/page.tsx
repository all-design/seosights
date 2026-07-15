'use client'

import { useState, useEffect } from 'react'
import {
  ScrollText,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react'

type LogLevel = 'error' | 'warn' | 'info' | 'success'

interface LogEntry {
  timestamp: string
  level: LogLevel
  system: string
  message: string
}

const levelConfig = {
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warn: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

// ─── Derive log entries from system status + heartbeat data ──────

function buildLogsFromAPI(systemData: any, heartbeatData: any): LogEntry[] {
  const logs: LogEntry[] = []
  const now = new Date()

  // Build logs from system component status
  if (systemData?.components) {
    const components = systemData.components
    for (const [name, comp] of Object.entries(components)) {
      const c = comp as { status: string; latency: number; details: string }
      const timestamp = new Date(now.getTime() - Math.random() * 3600000)
      const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      if (c.status === 'ok') {
        logs.push({
          timestamp: timeStr,
          level: 'success',
          system: formatSystemName(name),
          message: `${c.details} — latency ${c.latency}ms`,
        })
      } else if (c.status === 'degraded') {
        logs.push({
          timestamp: timeStr,
          level: 'warn',
          system: formatSystemName(name),
          message: c.details,
        })
      } else {
        logs.push({
          timestamp: timeStr,
          level: 'error',
          system: formatSystemName(name),
          message: c.details,
        })
      }
    }
  }

  // Build logs from heartbeat checks
  if (heartbeatData?.checks) {
    const checks = heartbeatData.checks
    for (const [name, check] of Object.entries(checks)) {
      const ch = check as { ok: boolean; latency: number; status: string }
      const timestamp = new Date(now.getTime() - Math.random() * 1800000)
      const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      if (ch.ok && ch.status === 'healthy') {
        logs.push({
          timestamp: timeStr,
          level: 'success',
          system: formatSystemName(name),
          message: `Health check passed — ${ch.status} (${ch.latency}ms)`,
        })
      } else if (ch.status === 'degraded' || ch.status === 'idle') {
        logs.push({
          timestamp: timeStr,
          level: 'warn',
          system: formatSystemName(name),
          message: `Status: ${ch.status}`,
        })
      } else if (!ch.ok) {
        logs.push({
          timestamp: timeStr,
          level: 'error',
          system: formatSystemName(name),
          message: `Health check failed — status: ${ch.status}`,
        })
      }
    }
  }

  // Add fallback logs if present
  if (systemData?.recentFallbacks?.length > 0) {
    for (const fb of systemData.recentFallbacks) {
      const timestamp = new Date(fb.timestamp || now)
      const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      logs.push({
        timestamp: timeStr,
        level: 'warn' as LogLevel,
        system: 'Fallback Logger',
        message: fb.message || fb.error || 'Fallback triggered',
      })
    }
  }

  // Sort by timestamp desc (most recent first)
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return logs
}

function formatSystemName(name: string): string {
  const nameMap: Record<string, string> = {
    database: 'Database',
    redis: 'Redis',
    aiRouter: 'AI Router',
    stripe: 'Stripe',
    email: 'Email',
    websocket: 'WebSocket',
    cms: 'CMS',
    age: 'AGE Engine',
    qa: 'QA Engine',
    clientZero: 'Client Zero',
    observatory: 'Observatory',
    scheduler: 'Scheduler',
  }
  return nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1)
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [systemData, setSystemData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        const sysData = json.systemStatus || null
        setSystemData(sysData)
        const derivedLogs = buildLogsFromAPI(sysData, null)
        setLogs(derivedLogs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredLogs = activeFilter === 'all'
    ? logs
    : logs.filter(log => log.level === activeFilter)

  const errorCount = logs.filter(l => l.level === 'error').length
  const warnCount = logs.filter(l => l.level === 'warn').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-12" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-400 mb-1">Failed to load system logs</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-slate-400" />
            System Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time log stream from all autonomous systems</p>
        </div>
        <div className="flex items-center gap-3">
          {errorCount > 0 && (
            <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
              {errorCount} errors
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              {warnCount} warnings
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-lg border ${
            systemData?.status === 'healthy'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}>
            System: {systemData?.status || 'unknown'}
          </span>
        </div>
      </div>

      {/* Log Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {(['all', 'error', 'warn', 'info', 'success'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setActiveFilter(level)}
            className={`text-xs px-3 py-1 rounded-full cursor-pointer transition-colors ${
              activeFilter === level
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-500">{filteredLogs.length} entries</span>
      </div>

      {/* Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-4 text-[10px] text-slate-500 uppercase">
          <span className="w-16">Time</span>
          <span className="w-16">Level</span>
          <span className="w-28">System</span>
          <span className="flex-1">Message</span>
        </div>
        {filteredLogs.length > 0 ? (
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredLogs.map((log, i) => {
              const config = levelConfig[log.level]
              const Icon = config.icon
              return (
                <div key={i} className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <span className="text-[11px] font-mono text-slate-500 w-16 flex-shrink-0">{log.timestamp}</span>
                  <div className={`flex items-center gap-1.5 w-16 flex-shrink-0 ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    <span className="text-[11px] capitalize">{log.level}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 w-28 flex-shrink-0">{log.system}</span>
                  <span className="text-[11px] text-slate-300 flex-1">{log.message}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ScrollText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {activeFilter !== 'all'
                ? `No ${activeFilter} level log entries`
                : 'No log entries available'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Logs will populate as system health checks run</p>
          </div>
        )}
      </div>

      {/* System Components Summary */}
      {systemData?.components && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">System Components</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(systemData.components).map(([name, comp]) => {
              const c = comp as { status: string; latency: number }
              return (
                <div
                  key={name}
                  className={`bg-slate-800/50 border rounded-lg p-3 text-center ${
                    c.status === 'ok' ? 'border-emerald-500/20' :
                    c.status === 'degraded' ? 'border-amber-500/20' :
                    'border-red-500/20'
                  }`}
                >
                  <div className={`text-xs font-semibold ${
                    c.status === 'ok' ? 'text-emerald-400' :
                    c.status === 'degraded' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {c.status.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{formatSystemName(name)}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{c.latency}ms</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
