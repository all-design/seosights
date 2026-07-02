'use client'

import {
  Brain, TrendingUp, Shield, CalendarClock, Package, Target, Search,
  Activity, CheckCircle2, Clock, ArrowRight, Zap,
  BarChart3, Eye, Factory, Landmark, Code2, GitMerge, Rocket,
  RotateCcw, GraduationCap, Bug, Lock, Gauge,
  Database, Route, DollarSign,
} from 'lucide-react'

interface SystemStatus {
  name: string
  status: 'running' | 'healthy' | 'collecting' | 'idle' | 'warning' | 'monitoring' | 'learning' | 'recording' | 'routing'
  health: number
  icon: React.ElementType
  description: string
  lastAction: string
  color: string
  href: string
}

const systems: SystemStatus[] = [
  { name: 'Observatory', status: 'collecting', health: 88, icon: Search, description: 'AI model research & monitoring', lastAction: 'Crawled 4 models — 15m ago', color: 'amber', href: '/control/observatory' },
  { name: 'Product Engine', status: 'running', health: 91, icon: Package, description: 'Product analysis & recommendations', lastAction: 'Review generated — 2h ago', color: 'rose', href: '/control/product' },
  { name: 'Architecture Engine', status: 'running', health: 87, icon: Landmark, description: 'Staff Engineer — where code goes', lastAction: 'Blocked feature creep — 1h ago', color: 'cyan', href: '/control/architecture' },
  { name: 'Engineering Engine', status: 'running', health: 94, icon: Code2, description: 'Writes code on branches only', lastAction: 'PR #47 created — 30m ago', color: 'violet', href: '/control/engineering' },
  { name: 'QA Engine', status: 'running', health: 95, icon: Shield, description: 'Quality & stability checks', lastAction: 'All checks passed — 8m ago', color: 'blue', href: '/control/qa' },
  { name: 'Review Engine', status: 'healthy', health: 91, icon: Eye, description: 'Design system & philosophy checks', lastAction: 'Brand review passed — 20m ago', color: 'amber', href: '/control/review' },
  { name: 'Security Engine', status: 'monitoring', health: 96, icon: Lock, description: 'Vulnerability & dependency scanning', lastAction: '0 vulnerabilities — 12m ago', color: 'red', href: '/control/security' },
  { name: 'Performance Engine', status: 'monitoring', health: 94, icon: Gauge, description: 'Core Web Vitals & budgets', lastAction: 'LCP 1.2s — all good — 5m ago', color: 'orange', href: '/control/performance' },
  { name: 'Merge Engine', status: 'healthy', health: 100, icon: GitMerge, description: 'PR creation & gate enforcement', lastAction: 'PR #46 approved — 2h ago', color: 'emerald', href: '/control/merge' },
  { name: 'Deploy Engine', status: 'idle', health: 98, icon: Rocket, description: 'Production deployment', lastAction: 'v2.4.12 deployed — 6h ago', color: 'cyan', href: '/control/deploy' },
  { name: 'Replay Engine', status: 'monitoring', health: 92, icon: RotateCcw, description: 'Post-deploy metric tracking', lastAction: 'Conversion 82→84% ↑ — 1h ago', color: 'amber', href: '/control/replay' },
  { name: 'Learning Engine', status: 'learning', health: 81, icon: GraduationCap, description: 'Pattern learning & confidence', lastAction: 'New pattern: FAQ → +15% citations — 3h ago', color: 'emerald', href: '/control/learning' },
  { name: 'Engineering Memory', status: 'recording', health: 87, icon: Database, description: 'Change tracking & pattern memory', lastAction: 'Hero.tsx pattern detected — 91% confidence', color: 'indigo', href: '/control/engineering-memory' },
  { name: 'AI Router', status: 'routing', health: 99, icon: Route, description: 'Free AI Mesh™ — model routing', lastAction: '431 calls routed — 86% cached — $0.00', color: 'emerald', href: '/control/ai-router' },
  { name: 'AI Cost Dashboard', status: 'monitoring', health: 100, icon: DollarSign, description: 'LLM cost tracking — 100% free', lastAction: 'Today: 431 calls, $0.00 cost', color: 'emerald', href: '/control/ai-cost' },
]

const pipelineStages = [
  { name: 'Observatory', icon: Search, color: 'amber', desc: 'Gather intelligence' },
  { name: 'Product Engine', icon: Package, color: 'rose', desc: 'Decide what to build' },
  { name: 'Architecture', icon: Landmark, color: 'cyan', desc: 'Plan where it goes' },
  { name: 'Engineering', icon: Code2, color: 'violet', desc: 'Write code on branch' },
  { name: 'QA', icon: Shield, color: 'blue', desc: 'Run all tests' },
  { name: 'Review', icon: Eye, color: 'amber', desc: 'Design & philosophy' },
  { name: 'Security', icon: Lock, color: 'red', desc: 'Vulnerability scan' },
  { name: 'Performance', icon: Gauge, color: 'orange', desc: 'Budget check' },
  { name: 'Human', icon: Target, color: 'emerald', desc: '🧑 Approval gate' },
  { name: 'Deploy', icon: Rocket, color: 'cyan', desc: 'Ship to production' },
  { name: 'Replay', icon: RotateCcw, color: 'amber', desc: 'Measure impact' },
  { name: 'Learning', icon: GraduationCap, color: 'emerald', desc: 'Get smarter' },
]

const recentEvents = [
  { time: '2m ago', text: 'Engineering Engine: Created branch feature/ai-advisor-widget', type: 'success' },
  { time: '8m ago', text: 'QA Engine: All 47 checks passed for PR #47', type: 'success' },
  { time: '15m ago', text: 'Architecture Engine: Blocked new dashboard — expand Mission Control instead', type: 'info' },
  { time: '20m ago', text: 'Review Engine: Brand philosophy check passed for FloatingAdvisor', type: 'success' },
  { time: '1h ago', text: 'Security Engine: 0 vulnerabilities found in dependency scan', type: 'success' },
  { time: '1h ago', text: 'Replay Engine: Conversion 82% → 84% after PR #46 deploy', type: 'success' },
  { time: '2h ago', text: 'Product Engine: Suggested AI Advisor on Hero section', type: 'info' },
  { time: '2h ago', text: 'Merge Engine: PR #46 approved by admin@seosights.io', type: 'success' },
  { time: '3h ago', text: 'Performance Engine: Bundle 847KB / 1MB budget (84%)', type: 'info' },
  { time: '4h ago', text: 'Learning Engine: FAQ schema → +15% AI citation rate (94% confidence)', type: 'success' },
  { time: '6h ago', text: 'Deploy Engine: v2.4.12 deployed to production', type: 'success' },
  { time: '8h ago', text: 'Tech Debt Engine: Found 3 duplicated components — added to backlog', type: 'warning' },
  { time: '10h ago', text: 'Engineering Memory: Hero.tsx change pattern detected — CTA drops 91% confidence', type: 'info' },
  { time: '12h ago', text: 'AI Router: 86% cache hit rate today — 372 of 431 calls cached', type: 'success' },
]

export default function ControlOverview() {
  const overallHealth = Math.round(systems.reduce((sum, s) => sum + s.health, 0) / systems.length)

  const statusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-400'
      case 'healthy': return 'text-emerald-400'
      case 'collecting': return 'text-amber-400'
      case 'monitoring': return 'text-cyan-400'
      case 'learning': return 'text-emerald-400'
      case 'recording': return 'text-indigo-400'
      case 'routing': return 'text-emerald-400'
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
        <h1 className="text-2xl font-bold text-white">AI Software Factory™</h1>
        <p className="text-slate-400 text-sm mt-1">Autonomous development pipeline. Human-approved deploys.</p>
      </div>

      {/* Overall Health Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Platform Health</div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-emerald-400">{overallHealth}%</span>
              <span className="text-sm text-emerald-400/60">All 15 systems operational</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{systems.filter(s => s.status === 'running').length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{systems.filter(s => s.status === 'monitoring').length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Monitoring</div>
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

      {/* The Complete Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Factory className="w-4 h-4 text-emerald-400" />
          AI Software Factory™ — The Complete Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon
            return (
              <div key={stage.name} className="relative">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center hover:border-slate-600 transition-colors">
                  <div className={`w-7 h-7 rounded-lg bg-${stage.color}-500/10 flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon className={`w-3.5 h-3.5 text-${stage.color}-400`} />
                  </div>
                  <div className="text-[11px] font-semibold text-white">{stage.name}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{stage.desc}</div>
                </div>
                {i < pipelineStages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 absolute -right-1.5 top-1/2 -translate-y-1/2 hidden lg:block" />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <Target className="w-3 h-3 text-emerald-400" />
          <span>Human Approval is the only gate that can push to production</span>
        </div>
      </div>

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems.map((system) => {
          const Icon = system.icon
          return (
            <a
              key={system.name}
              href={system.href}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors block"
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
            </a>
          )
        })}
      </div>

      {/* Bottom row: Schedule + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Factory Principles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Factory Principles
          </h2>
          <div className="space-y-3">
            {[
              { principle: 'No AI writes to main', detail: 'All code goes through branches → PRs → human approval', icon: GitMerge },
              { principle: 'Multiple quality gates', detail: 'QA + Review + Security + Performance must ALL pass', icon: CheckCircle2 },
              { principle: 'Architecture prevents feature creep', detail: 'Reuse existing components before creating new ones', icon: Landmark },
              { principle: 'Review checks philosophy, not syntax', detail: 'Does this look like SeoSights? Is our voice right?', icon: Eye },
              { principle: 'Measure after every deploy', detail: 'If metrics get worse → automatic rollback', icon: RotateCcw },
              { principle: 'Learn from every suggestion', detail: 'Suggestion → Code → Result → Confidence builds over time', icon: GraduationCap },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{item.principle}</div>
                    <div className="text-[11px] text-slate-500">{item.detail}</div>
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
                  ${event.type === 'info' ? 'bg-cyan-400' : ''}
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
    </div>
  )
}
