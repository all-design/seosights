'use client'

import { ScrollText, AlertCircle, Info, CheckCircle2, XCircle, Filter } from 'lucide-react'

type LogLevel = 'error' | 'warn' | 'info' | 'success'

interface LogEntry {
  timestamp: string
  level: LogLevel
  system: string
  message: string
}

const logs: LogEntry[] = [
  { timestamp: '19:45:22', level: 'success', system: 'Growth Engine', message: 'Published article "AI Visibility for SaaS" — 3 citations gained' },
  { timestamp: '19:42:15', level: 'success', system: 'QA Engine', message: 'All 47 checks passed for /pricing page' },
  { timestamp: '19:38:01', level: 'info', system: 'Observatory', message: 'Crawled ChatGPT responses — 12 new entries' },
  { timestamp: '19:35:44', level: 'success', system: 'Client Zero', message: 'AI Visibility Score updated: 73 → 78 (+5)' },
  { timestamp: '19:30:22', level: 'warn', system: 'QA Engine', message: '2 accessibility warnings on /pricing (color contrast)' },
  { timestamp: '19:25:18', level: 'info', system: 'Product Engine', message: 'Executive Product Review generated for today' },
  { timestamp: '19:20:05', level: 'success', system: 'Growth Engine', message: 'FAQ schema auto-generated for 4 pages' },
  { timestamp: '19:15:33', level: 'error', system: 'Observatory', message: 'Copilot crawl timeout — retrying in 5m' },
  { timestamp: '19:10:12', level: 'info', system: 'Scheduler', message: 'Next mission: Client Zero at 08:00' },
  { timestamp: '19:05:00', level: 'success', system: 'QA Engine', message: 'API response time check: all endpoints < 200ms' },
  { timestamp: '19:00:45', level: 'warn', system: 'Growth Engine', message: 'Content queue has 3 items waiting for review' },
  { timestamp: '18:55:30', level: 'info', system: 'Engagement', message: 'Daily brief generated for 5 users' },
  { timestamp: '18:50:15', level: 'success', system: 'Client Zero', message: 'Replay completed for seosights.com — visibility +2' },
  { timestamp: '18:45:00', level: 'error', system: 'Observatory', message: 'Rate limited by Perplexity API — backing off' },
  { timestamp: '18:40:22', level: 'info', system: 'Product Engine', message: 'Feature usage analysis complete — 3 dead features detected' },
]

const levelConfig = {
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warn: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-slate-400" />
          System Logs
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time log stream from all autonomous systems</p>
      </div>

      {/* Log Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {(['all', 'error', 'warn', 'info', 'success'] as const).map((level) => (
          <span
            key={level}
            className={`text-xs px-3 py-1 rounded-full cursor-pointer transition-colors ${
              level === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        ))}
      </div>

      {/* Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-4 text-[10px] text-slate-500 uppercase">
          <span className="w-16">Time</span>
          <span className="w-16">Level</span>
          <span className="w-28">System</span>
          <span className="flex-1">Message</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {logs.map((log, i) => {
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
      </div>
    </div>
  )
}
