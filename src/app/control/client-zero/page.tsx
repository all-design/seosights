'use client'

import { Target, TrendingUp, Eye, BarChart3, Clock, CheckCircle2 } from 'lucide-react'

const metrics = [
  { label: 'AI Visibility Score', value: '78', delta: '+5', icon: Eye },
  { label: 'Total Citations', value: '142', delta: '+12', icon: BarChart3 },
  { label: 'Rank (SaaS)', value: '#3', delta: '+2', icon: Target },
  { label: 'ROI Score', value: '94%', delta: '+8%', icon: TrendingUp },
]

const missions = [
  { title: 'Publish FAQ page for AI Visibility', status: 'completed', impact: '+4 AI Visibility' },
  { title: 'Add llms.txt to documentation', status: 'completed', impact: '+3 AI Visibility' },
  { title: 'Update Wikipedia entity for SeoSights', status: 'in_progress', impact: '+6 AI Visibility' },
  { title: 'Create comparison page for Perplexity', status: 'pending', impact: '+2 AI Visibility' },
  { title: 'Fix robots.txt blocking AI crawlers', status: 'pending', impact: '+5 AI Visibility' },
]

const contentEngine = [
  { title: 'AI Visibility for SaaS: Complete Guide', status: 'published', citations: 8, date: '2 days ago' },
  { title: 'How ChatGPT Recommends Businesses', status: 'published', citations: 12, date: '5 days ago' },
  { title: 'llms.txt: The New Standard for AI', status: 'review', citations: 0, date: 'Today' },
]

export default function ClientZeroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-400" />
          Client Zero
        </h1>
        <p className="text-slate-400 text-sm mt-1">SeoSights is its own first user — validate everything here</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] text-slate-500 uppercase">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{m.value}</span>
                <span className="text-xs text-emerald-400">{m.delta}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Missions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Active Missions</h2>
        <div className="space-y-3">
          {missions.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
              {m.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {m.status === 'in_progress' && <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin flex-shrink-0" />}
              {m.status === 'pending' && <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300">{m.title}</div>
                <div className="text-[10px] text-slate-500 capitalize">{m.status.replace('_', ' ')}</div>
              </div>
              <span className="text-[10px] text-emerald-400/60 flex-shrink-0">{m.impact}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Content Engine</h2>
        <div className="space-y-2">
          {contentEngine.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300">{c.title}</div>
                <div className="text-[10px] text-slate-500">{c.date}</div>
              </div>
              {c.citations > 0 && <span className="text-[10px] text-purple-400">{c.citations} citations</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
