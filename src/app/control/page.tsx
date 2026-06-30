'use client'

import {
  Brain, TrendingUp, Shield, CalendarClock, Package, Target, Search,
  Activity, CheckCircle2, AlertTriangle, Clock, ArrowUpRight, Zap,
  BarChart3, Eye,
} from 'lucide-react'

interface SystemStatus {
  name: string
  status: 'running' | 'healthy' | 'collecting' | 'idle' | 'warning'
  health: number
  icon: React.ElementType
  description: string
  lastAction: string
  color: string
}

const systems: SystemStatus[] = [
  { name: 'Growth Engine', status: 'running', health: 98, icon: TrendingUp, description: 'Content generation & publishing', lastAction: 'Published 3 articles — 2m ago', color: 'emerald' },
  { name: 'QA Engine', status: 'running', health: 95, icon: Shield, description: 'Quality & stability checks', lastAction: 'All checks passed — 8m ago', color: 'blue' },
  { name: 'Client Zero', status: 'running', health: 92, icon: Target, description: 'First-user validation', lastAction: 'New visibility score: 73 → 78 — 1h ago', color: 'purple' },
  { name: 'Observatory', status: 'collecting', health: 88, icon: Search, description: 'AI model research & monitoring', lastAction: 'Crawled 4 models — 15m ago', color: 'amber' },
  { name: 'Scheduler', status: 'healthy', health: 100, icon: CalendarClock, description: 'Mission orchestration', lastAction: 'Next: Growth Engine at 07:00', color: 'cyan' },
  { name: 'Product Engine', status: 'idle', health: 85, icon: Package, description: 'Product analysis & recommendations', lastAction: 'Review generated — 6h ago', color: 'rose' },
]

const scheduleItems = [
  { time: '06:00', system: 'QA', icon: Shield, status: 'completed', description: 'Full platform scan' },
  { time: '07:00', system: 'Growth', icon: TrendingUp, status: 'running', description: 'Content generation batch' },
  { time: '08:00', system: 'Client Zero', icon: Target, status: 'pending', description: 'Visibility measurement' },
  { time: '09:00', system: 'Publish', icon: Zap, status: 'pending', description: 'Approved content publishing' },
  { time: '23:00', system: 'Learning', icon: Brain, status: 'pending', description: 'Model retraining & updates' },
]

const recentEvents = [
  { time: '2m ago', text: 'Growth Engine published 3 articles for seosights.com', type: 'success' },
  { time: '8m ago', text: 'QA Engine: All 47 checks passed', type: 'success' },
  { time: '15m ago', text: 'Observatory crawled ChatGPT, Claude, Gemini, Perplexity', type: 'info' },
  { time: '1h ago', text: 'Client Zero AI Visibility: 73 → 78 (+5)', type: 'success' },
  { time: '2h ago', text: 'Product Engine: Onboarding funnel analysis complete', type: 'info' },
  { time: '3h ago', text: 'Growth Engine: FAQ schema auto-generated for 4 pages', type: 'success' },
  { time: '4h ago', text: 'QA Engine: 2 accessibility warnings detected on /pricing', type: 'warning' },
  { time: '6h ago', text: 'Product Engine: Executive Product Review generated', type: 'info' },
]

export default function ControlOverview() {
  const overallHealth = Math.round(systems.reduce((sum, s) => sum + s.health, 0) / systems.length)

  const statusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-400'
      case 'healthy': return 'text-emerald-400'
      case 'collecting': return 'text-amber-400'
      case 'idle': return 'text-slate-400'
      case 'warning': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const healthColor = (health: number) => {
    if (health >= 90) return 'text-emerald-400'
    if (health >= 70) return 'text-amber-400'
    return 'text-red-400'
  }

  const healthBarColor = (health: number) => {
    if (health >= 90) return 'bg-emerald-500'
    if (health >= 70) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AI Operations Center™</h1>
        <p className="text-slate-400 text-sm mt-1">All autonomous systems. One view.</p>
      </div>

      {/* Overall Health Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Platform Health</div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-emerald-400">{overallHealth}%</span>
              <span className="text-sm text-emerald-400/60">All systems operational</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{systems.filter(s => s.status === 'running').length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{systems.filter(s => s.status === 'collecting').length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Collecting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{systems.filter(s => s.status === 'idle').length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Idle</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems.map((system) => {
          const Icon = system.icon
          return (
            <div
              key={system.name}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${system.color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${system.color}-400`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{system.name}</div>
                    <div className={`text-xs capitalize ${statusColor(system.status)}`}>
                      {system.status}
                    </div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${healthColor(system.health)}`}>
                  {system.health}%
                </div>
              </div>
              {/* Health bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${healthBarColor(system.health)} transition-all duration-1000`}
                  style={{ width: `${system.health}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">{system.description}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {system.lastAction}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom row: Schedule + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-cyan-400" />
            Today&apos;s Schedule
          </h2>
          <div className="space-y-3">
            {scheduleItems.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-xs font-mono text-slate-500 w-12 flex-shrink-0">{item.time}</div>
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${item.status === 'completed' ? 'bg-emerald-500/10' : ''}
                    ${item.status === 'running' ? 'bg-cyan-500/10 animate-pulse' : ''}
                    ${item.status === 'pending' ? 'bg-slate-800' : ''}
                  `}>
                    <Icon className={`w-4 h-4 ${
                      item.status === 'completed' ? 'text-emerald-400' :
                      item.status === 'running' ? 'text-cyan-400' :
                      'text-slate-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">{item.system}</span>
                      {item.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {item.status === 'running' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Events
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {recentEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`
                  w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                  ${event.type === 'success' ? 'bg-emerald-400' : ''}
                  ${event.type === 'info' ? 'bg-blue-400' : ''}
                  ${event.type === 'warning' ? 'bg-amber-400' : ''}
                `} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300">{event.text}</div>
                  <div className="text-[10px] text-slate-600">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Five Autonomous Systems Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Five Autonomous Systems — The Complete Loop
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { name: 'Observatory', desc: 'Gather & understand external changes', icon: Search, color: 'amber' },
            { name: 'Growth Engine', desc: 'Improve platform & content', icon: TrendingUp, color: 'emerald' },
            { name: 'QA Engine', desc: 'Verify quality & stability', icon: Shield, color: 'blue' },
            { name: 'Client Zero', desc: 'Validate on real example', icon: Target, color: 'purple' },
            { name: 'Product Engine', desc: 'Evaluate product direction', icon: Package, color: 'rose' },
          ].map((sys, i) => {
            const Icon = sys.icon
            return (
              <div key={sys.name} className="relative">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                  <div className={`w-8 h-8 rounded-lg bg-${sys.color}-500/10 flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 text-${sys.color}-400`} />
                  </div>
                  <div className="text-xs font-semibold text-white">{sys.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{sys.desc}</div>
                </div>
                {i < 4 && (
                  <ArrowUpRight className="w-4 h-4 text-slate-600 absolute -right-2.5 top-1/2 -translate-y-1/2 hidden sm:block rotate-45" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
