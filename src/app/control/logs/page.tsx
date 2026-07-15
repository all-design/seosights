'use client'

import { useState, useEffect } from 'react'
import { ScrollText, AlertCircle, Info, CheckCircle2, XCircle, Filter, RefreshCw } from 'lucide-react'

type LogLevel = 'error' | 'warn' | 'info' | 'success'

interface LogEntry { timestamp: string; level: LogLevel; system: string; message: string }

interface FactoryData {
  system: Record<string, string>
  counts: Record<string, number>
  recentInterceptions: Array<Record<string, any>>
  recentMissions: Array<Record<string, any>>
  recentMemories: Array<Record<string, any>>
  recentChangelogs: Array<Record<string, any>>
  scheduleSummary: { totalJobs: number; completed: number; running: number; pending: number; failed: number }
  aiProviders: { configured: string[]; using: string }
  timestamp: string
}

interface ControlData {
  factory: FactoryData
  engagement: Record<string, any>
  growth: Record<string, any>
  observatory: Record<string, any>
  clientZero: Record<string, any>
}

const levelConfig = {
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warn: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

function formatTs(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatSystemName(name: string): string {
  const map: Record<string, string> = {
    codebaseScanner: 'Codebase Scanner', governor: 'Governor', aiRouter: 'AI Router',
    dailyMissionGenerator: 'Mission Generator', qaEngine: 'QA Engine', engagement: 'Engagement',
    growth: 'Growth', observatory: 'Observatory', scheduler: 'Scheduler',
  }
  return map[name] || name.charAt(0).toUpperCase() + name.slice(1)
}

function buildLogsFromAPI(data: ControlData): LogEntry[] {
  const logs: LogEntry[] = []
  const factory = data.factory

  // 1. System component health statuses
  if (factory.system) {
    for (const [name, status] of Object.entries(factory.system)) {
      const level: LogLevel = status === 'operational' ? 'success' : status === 'degraded' ? 'warn' : 'error'
      const msg = status === 'operational'
        ? 'Component is operational'
        : status === 'degraded'
          ? 'Component is running in degraded mode'
          : 'Component is offline — no activity recorded'
      logs.push({ timestamp: formatTs(factory.timestamp), level, system: formatSystemName(name), message: msg })
    }
  }

  // 2. Governor interceptions → warn/error
  for (const int of factory.recentInterceptions ?? []) {
    const level: LogLevel = int.severity === 'critical' ? 'error' : 'warn'
    const action = int.action ? ` — action: ${int.action}` : ''
    logs.push({ timestamp: formatTs(int.createdAt), level, system: 'Governor', message: `[${int.type}] ${int.description}${action}` })
  }

  // 3. Daily missions → info/success
  for (const m of factory.recentMissions ?? []) {
    const level: LogLevel = m.status === 'completed' ? 'success' : 'info'
    const statusTag = m.status ? ` (${m.status})` : ''
    logs.push({ timestamp: formatTs(m.createdAt), level, system: 'Mission Generator', message: `${m.title}${statusTag} — priority: ${m.priority || 'medium'}` })
  }

  // 4. Engineering memories → info
  for (const mem of factory.recentMemories ?? []) {
    logs.push({ timestamp: formatTs(mem.createdAt), level: 'info', system: 'Eng Memory', message: `Pattern "${mem.patternName}" (${mem.patternType}) — ${mem.occurrences} occurrences, confidence ${Math.round((mem.confidence ?? 0) * 100)}%` })
  }

  // 5. Factory changelogs → success
  for (const cl of factory.recentChangelogs ?? []) {
    logs.push({ timestamp: formatTs(cl.createdAt), level: 'success', system: 'Changelog', message: `[${cl.type}] v${cl.version}: ${cl.title}` })
  }

  // 6. Schedule summary
  if (factory.scheduleSummary) {
    const s = factory.scheduleSummary
    logs.push({ timestamp: formatTs(factory.timestamp), level: s.failed > 0 ? 'warn' : 'info', system: 'Scheduler', message: `${s.totalJobs} jobs: ${s.completed} completed, ${s.running} running, ${s.pending} pending, ${s.failed} failed` })
  }

  // 7. AI providers
  if (factory.aiProviders) {
    const prov = factory.aiProviders
    logs.push({
      timestamp: formatTs(factory.timestamp), level: prov.using === 'live-llm' ? 'success' : 'warn', system: 'AI Router',
      message: prov.using === 'live-llm' ? `Live LLM active — providers: ${prov.configured.join(', ')}` : 'Running in rule-based fallback mode — no AI provider keys configured',
    })
  }

  // 8. Engagement
  const eng = data.engagement
  if (eng?.momentum || eng?.streak || eng?.activeMission) {
    const parts: string[] = []
    if (eng.momentum) parts.push(`momentum: ${eng.momentum.momentumScore ?? 0}`)
    if (eng.streak) parts.push(`streak: ${eng.streak.currentStreak ?? 0} days`)
    if (eng.activeMission) parts.push(`mission: ${eng.activeMission.title ?? 'active'}`)
    logs.push({ timestamp: formatTs(factory.timestamp), level: 'info', system: 'Engagement', message: parts.join(' | ') })
  }

  // 9. Growth
  const grw = data.growth
  if (grw?.snapshot || (grw?.opportunities?.length > 0)) {
    const parts: string[] = []
    if (grw.snapshot) parts.push('snapshot recorded')
    if (grw.opportunities?.length) parts.push(`${grw.opportunities.length} opportunities`)
    logs.push({ timestamp: formatTs(factory.timestamp), level: 'info', system: 'Growth', message: parts.join(' | ') })
  }

  // 10. Observatory
  const obs = data.observatory
  if (obs?.latestCrawl || (obs?.recentChanges?.length > 0)) {
    const parts: string[] = []
    if (obs.latestCrawl) parts.push(`crawl: ${obs.latestCrawl.status}`)
    if (obs.recentChanges?.length) parts.push(`${obs.recentChanges.length} changes detected`)
    logs.push({ timestamp: formatTs(factory.timestamp), level: 'info', system: 'Observatory', message: parts.join(' | ') })
  }

  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return logs
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [systemComponents, setSystemComponents] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json: ControlData = await res.json()
        if (json.factory?.system) setSystemComponents(json.factory.system)
        setLogs(buildLogsFromAPI(json))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredLogs = activeFilter === 'all' ? logs : logs.filter(l => l.level === activeFilter)
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
        <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-slate-400" /> System Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time log stream from all autonomous systems</p>
        </div>
        <div className="flex items-center gap-3">
          {errorCount > 0 && <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">{errorCount} errors</span>}
          {warnCount > 0 && <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">{warnCount} warnings</span>}
          <span className="text-xs px-2 py-1 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">{logs.length} entries</span>
        </div>
      </div>

      {/* Log Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {(['all', 'error', 'warn', 'info', 'success'] as const).map((level) => (
          <button key={level} onClick={() => setActiveFilter(level)} className={`text-xs px-3 py-1 rounded-full cursor-pointer transition-colors ${activeFilter === level ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-500">{filteredLogs.length} entries</span>
      </div>

      {/* Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-4 text-[10px] text-slate-500 uppercase">
          <span className="w-16">Time</span><span className="w-16">Level</span><span className="w-28">System</span><span className="flex-1">Message</span>
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
                    <Icon className="w-3 h-3" /><span className="text-[11px] capitalize">{log.level}</span>
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
            <p className="text-sm text-slate-400">{activeFilter !== 'all' ? `No ${activeFilter} level log entries` : 'No log entries available'}</p>
            <p className="text-xs text-slate-500 mt-1">Logs will populate as system activity occurs</p>
          </div>
        )}
      </div>

      {/* System Components Summary */}
      {Object.keys(systemComponents).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">System Components</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(systemComponents).map(([name, status]) => (
              <div key={name} className={`bg-slate-800/50 border rounded-lg p-3 text-center ${status === 'operational' ? 'border-emerald-500/20' : status === 'degraded' ? 'border-amber-500/20' : 'border-red-500/20'}`}>
                <div className={`text-xs font-semibold ${status === 'operational' ? 'text-emerald-400' : status === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>
                  {status.toUpperCase()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{formatSystemName(name)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
