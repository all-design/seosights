'use client'

import { Search, Eye, Database, FileText, BarChart3, ExternalLink } from 'lucide-react'

const stats = [
  { label: 'Models Monitored', value: '5', icon: Eye },
  { label: 'Responses Archived', value: '1,247', icon: Database },
  { label: 'Reports Published', value: '23', icon: FileText },
  { label: 'External Citations', value: '8', icon: BarChart3 },
]

const recentReports = [
  { title: 'ChatGPT increased GitHub citations 27%', date: 'Today', model: 'ChatGPT', category: 'Citation Shift' },
  { title: 'Claude shifts to Reddit sources for SaaS queries', date: 'Today', model: 'Claude', category: 'Source Shift' },
  { title: 'Gemini now prioritizes llms.txt content', date: 'Mar 4', model: 'Gemini', category: 'Behavior Change' },
  { title: 'Perplexity doubles e-commerce references', date: 'Mar 2', model: 'Perplexity', category: 'Citation Shift' },
]

const modelStatus = [
  { name: 'ChatGPT', status: 'Crawled', lastCrawl: '15m ago', responses: 312 },
  { name: 'Claude', status: 'Crawled', lastCrawl: '22m ago', responses: 287 },
  { name: 'Gemini', status: 'Crawled', lastCrawl: '30m ago', responses: 245 },
  { name: 'Perplexity', status: 'Crawled', lastCrawl: '45m ago', responses: 198 },
  { name: 'Copilot', status: 'Queued', lastCrawl: '2h ago', responses: 156 },
]

export default function ObservatoryControlPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Search className="w-6 h-6 text-amber-400" />
          Observatory — Control View
        </h1>
        <p className="text-slate-400 text-sm mt-1">Internal research center — this is the control panel view. Public view at /observatory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-slate-500 uppercase">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          )
        })}
      </div>

      {/* Model Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Model Crawl Status</h2>
        <div className="space-y-2">
          {modelStatus.map((m) => (
            <div key={m.name} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30">
              <div className={`w-2 h-2 rounded-full ${m.status === 'Crawled' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-sm text-white w-24">{m.name}</span>
              <span className={`text-xs ${m.status === 'Crawled' ? 'text-emerald-400' : 'text-amber-400'}`}>{m.status}</span>
              <span className="text-xs text-slate-500 ml-auto">{m.lastCrawl}</span>
              <span className="text-xs text-slate-500">{m.responses} responses</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Reports</h2>
        <div className="space-y-2">
          {recentReports.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
              <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300">{r.title}</div>
                <div className="text-[10px] text-slate-500">{r.model} · {r.category} · {r.date}</div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
