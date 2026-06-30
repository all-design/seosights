'use client'

import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Database,
  Clock,
  Zap,
  ArrowDown,
  Landmark,
  Code2,
  Shield,
  Eye,
  PenTool,
  Search,
  Cpu,
  Lightbulb,
  PiggyBank,
  Activity,
  CircleDollarSign,
  Target,
  Calendar,
  RefreshCw,
} from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────

const todaysCost = {
  llmCalls: 431,
  cached: 372,
  saved: 86,
  free: 100,
  estimatedCost: '$0.00',
}

interface EngineCost {
  engine: string
  icon: React.ElementType
  calls: number
  cost: string
  model: string
  cacheHitRate: number
  color: string
}

const engineCosts: EngineCost[] = [
  { engine: 'Product Engine', icon: Landmark, calls: 12, cost: '$0.00', model: 'Gemini Flash (free)', cacheHitRate: 78, color: 'cyan' },
  { engine: 'Architecture Engine', icon: Cpu, calls: 8, cost: '$0.00', model: 'GLM 5.2 (free tier)', cacheHitRate: 82, color: 'emerald' },
  { engine: 'Engineering Engine', icon: Code2, calls: 45, cost: '$0.00', model: 'GLM 5.2 (free tier)', cacheHitRate: 91, color: 'emerald' },
  { engine: 'QA Engine', icon: Shield, calls: 3, cost: '$0.00', model: '95% deterministic', cacheHitRate: 95, color: 'amber' },
  { engine: 'Review Engine', icon: Eye, calls: 14, cost: '$0.00', model: 'Cross review (free)', cacheHitRate: 72, color: 'cyan' },
  { engine: 'Documentation', icon: PenTool, calls: 6, cost: '$0.00', model: 'Gemini Flash (free)', cacheHitRate: 68, color: 'cyan' },
  { engine: 'Observatory', icon: Search, calls: 2, cost: '$0.00', model: 'Narrative only', cacheHitRate: 88, color: 'amber' },
]

const monthlyTrend = [
  { month: 'Oct', cost: 0 },
  { month: 'Nov', cost: 0 },
  { month: 'Dec', cost: 0 },
  { month: 'Jan', cost: 0 },
  { month: 'Feb', cost: 0 },
  { month: 'Mar', cost: 0 },
]

const cacheEfficiency = {
  totalHashes: 1847,
  uniqueTasks: 412,
  reuseRate: 78,
  avgCacheTTL: '24h',
}

interface OptimizationOpportunity {
  engine: string
  suggestion: string
  reduction: string
  icon: React.ElementType
  color: string
}

const optimizationOpportunities: OptimizationOpportunity[] = [
  {
    engine: 'Product Engine',
    suggestion: 'Reduce from daily to on-change scheduling',
    reduction: '-60% calls',
    icon: Landmark,
    color: 'cyan',
  },
  {
    engine: 'Engineering Memory',
    suggestion: 'Pre-check patterns before LLM call',
    reduction: '-30% calls',
    icon: Database,
    color: 'emerald',
  },
  {
    engine: 'QA Reports',
    suggestion: 'Template-based instead of LLM-generated',
    reduction: '-90% calls',
    icon: Shield,
    color: 'amber',
  },
]

const footerData = {
  runningCost: '$0.00',
  projectedMonthly: '$0.00',
  freeTierHeadroom: '67% remaining',
  daysUntilReset: 12,
}

// ── Component ───────────────────────────────────────────────

export default function AICostDashboardPage() {
  return (
    <div className="space-y-8">

      {/* ── Section 1: Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Cost Dashboard™</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-time
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">Track every AI dollar — or the beautiful lack thereof</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Live cost tracking</span>
        </div>
      </div>

      {/* ── Section 2: Today's Cost Banner ────────────────── */}
      <section>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/5 border border-emerald-500/20 p-6 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2 mb-5">
            <CircleDollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Today&apos;s Cost</h2>
            <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">$0.00 total</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* LLM Calls */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">LLM Calls</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{todaysCost.llmCalls}</p>
              <p className="text-[10px] text-slate-500 mt-1">requests processed</p>
            </div>

            {/* Cached */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cached</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{todaysCost.cached}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">served from cache</p>
            </div>

            {/* Saved */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Saved</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{todaysCost.saved}%</p>
              <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${todaysCost.saved}%` }} />
              </div>
            </div>

            {/* Free */}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Free</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{todaysCost.free}%</p>
              <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${todaysCost.free}%` }} />
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-4 sm:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Est. Cost</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{todaysCost.estimatedCost}</p>
              <p className="text-[10px] text-emerald-400/60 mt-1">100% free tier</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Cost Breakdown by Engine ────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Cost Breakdown by Engine</h2>
          <span className="text-xs text-slate-500 ml-1">— Per-engine costs today</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Engine</div>
            <div className="col-span-2">Calls</div>
            <div className="col-span-2">Cost</div>
            <div className="col-span-3">Model Used</div>
            <div className="col-span-2">Cache Hit</div>
          </div>
          {/* Rows */}
          {engineCosts.map((ec, i) => {
            const Icon = ec.icon
            const hitColor = ec.cacheHitRate >= 90 ? 'text-emerald-400' : ec.cacheHitRate >= 75 ? 'text-cyan-400' : 'text-amber-400'
            const hitBar = ec.cacheHitRate >= 90 ? 'bg-emerald-500' : ec.cacheHitRate >= 75 ? 'bg-cyan-500' : 'bg-amber-500'
            return (
              <div
                key={ec.engine}
                className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center ${
                  i < engineCosts.length - 1 ? 'border-b border-slate-800/60' : ''
                } hover:bg-slate-800/30 transition-colors`}
              >
                <div className="col-span-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-white font-medium">{ec.engine}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-white font-mono">{ec.calls}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-emerald-400 font-mono font-bold">{ec.cost}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs text-cyan-400/80 font-mono">{ec.model}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${hitBar}`} style={{ width: `${ec.cacheHitRate}%` }} />
                  </div>
                  <span className={`text-xs font-mono ${hitColor}`}>{ec.cacheHitRate}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 4: Monthly Trend ──────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Monthly Trend</h2>
          <span className="text-xs text-slate-500 ml-1">— 6-month cost history</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-bold text-emerald-400 font-mono">$0.00</span>
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-semibold">Total spent — 6 months</span>
              <span className="text-[10px] text-slate-500">Consistently free across all engines</span>
            </div>
            <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Free
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-3 h-40 px-2">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-emerald-400/70 font-mono">$0.00</span>
                <div className="w-full rounded-t-md bg-emerald-500/15 border border-emerald-500/20" style={{ height: '8px' }}>
                  {/* Even at $0, show a minimal bar for visual consistency */}
                </div>
                <span className="text-xs text-slate-500 font-medium">{m.month}</span>
              </div>
            ))}
          </div>

          {/* Trend summary */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">Cost trend:</span>
              <span className="text-xs text-emerald-400 font-semibold">Flat $0.00 — all free tier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">Next reset in:</span>
              <span className="text-xs text-white font-mono">12 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Cache Efficiency ───────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Cache Efficiency</h2>
          <span className="text-xs text-slate-500 ml-1">— Task hash reuse performance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Hashes */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <HashIcon className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Hashes</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono">{cacheEfficiency.totalHashes.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Computed task signatures</p>
          </div>

          {/* Unique Tasks */}
          <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Unique Tasks</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400 font-mono">{cacheEfficiency.uniqueTasks}</p>
            <p className="text-xs text-slate-500 mt-1">Distinct operations</p>
          </div>

          {/* Reuse Rate */}
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Reuse Rate</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 font-mono">{cacheEfficiency.reuseRate}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${cacheEfficiency.reuseRate}%` }} />
            </div>
          </div>

          {/* Avg Cache TTL */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Avg Cache TTL</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 font-mono">{cacheEfficiency.avgCacheTTL}</p>
            <p className="text-xs text-slate-500 mt-1">Time-to-live per entry</p>
          </div>
        </div>
      </section>

      {/* ── Section 6: Optimization Opportunities ──────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Optimization Opportunities</h2>
          <span className="text-xs text-slate-500 ml-1">— Where we could save even more</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {optimizationOpportunities.map((opt, i) => {
            const Icon = opt.icon
            const c = opt.color === 'cyan'
              ? { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', iconBg: 'bg-cyan-500/20' }
              : opt.color === 'emerald'
              ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' }
              : { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/20' }

            return (
              <div
                key={i}
                className={`rounded-xl ${c.bg} border ${c.border} p-5 transition-all duration-150 hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{opt.engine}</span>
                </div>
                <p className="text-sm text-white mb-3">{opt.suggestion}</p>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-bold">{opt.reduction}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 7: Footer ──────────────────────────────── */}
      <footer className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Running cost: <span className="text-emerald-400 font-mono font-bold">{footerData.runningCost}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Projected monthly: <span className="text-emerald-400 font-mono font-bold">{footerData.projectedMonthly}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Free tier headroom: <span className="text-white font-mono">{footerData.freeTierHeadroom}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
            <span>Days until reset: <span className="text-cyan-400 font-mono">{footerData.daysUntilReset}</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Simple hash icon component (since Lucide doesn't have a "hash" with database context)
function HashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}
