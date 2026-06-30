'use client'

import {
  Package,
  Clock,
  Star,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Flame,
  Skull,
  Layers,
  Sparkles,
  Trash2,
  Minimize2,
  Target,
  ChevronRight,
  Moon,
  FileText,
  BarChart3,
  Zap,
} from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────

const productScore = 72

const keyFindings = [
  { text: 'Onboarding funnel has 34% drop-off at step 2 (Sign Up → First Scan)', severity: 'high' },
  { text: 'Dashboard engagement up 12% week-over-week — new quick actions helping', severity: 'positive' },
  { text: '"Custom Reports" feature has 0 active users in 45 days', severity: 'critical' },
  { text: 'Mobile conversion rate is 2.3x lower than desktop', severity: 'high' },
]

const recommendedPriorities = [
  { rank: 1, text: 'Fix onboarding step 2 drop-off — projected +22% activation', impact: 'high' },
  { rank: 2, text: 'Remove or sunset "Custom Reports" — zero usage, maintenance burden', impact: 'medium' },
  { rank: 3, text: 'Optimize mobile conversion — responsive overhaul for scan flow', impact: 'high' },
  { rank: 4, text: 'Simplify dashboard — 7 widgets competing for attention', impact: 'medium' },
  { rank: 5, text: 'Promote "Quick Actions" — highest engagement feature right now', impact: 'low' },
]

const funnelSteps = [
  { name: 'Landing', count: 12480, rate: 100, dropOff: 0 },
  { name: 'Sign Up', count: 8360, rate: 67, dropOff: 33 },
  { name: 'First Scan', count: 5510, rate: 44, dropOff: 34 },
  { name: 'Dashboard', count: 3720, rate: 30, dropOff: 33 },
  { name: 'Upgrade', count: 930, rate: 7.4, dropOff: 75 },
]

const features = [
  { name: 'Quick Actions', users: 2840, lastUsed: '2h ago', status: 'hot' as const },
  { name: 'AI Visibility Score', users: 2310, lastUsed: '15m ago', status: 'hot' as const },
  { name: 'Competitor Tracking', users: 1890, lastUsed: '1h ago', status: 'hot' as const },
  { name: 'Scan Dashboard', users: 1650, lastUsed: '30m ago', status: 'alive' as const },
  { name: 'Keyword Monitor', users: 1200, lastUsed: '3h ago', status: 'alive' as const },
  { name: 'Alert System', users: 980, lastUsed: '5h ago', status: 'alive' as const },
  { name: 'PDF Reports', users: 620, lastUsed: '2d ago', status: 'alive' as const },
  { name: 'Team Sharing', users: 340, lastUsed: '5d ago', status: 'lukewarm' as const },
  { name: 'API Access', users: 210, lastUsed: '8d ago', status: 'lukewarm' as const },
  { name: 'Bulk Operations', users: 180, lastUsed: '12d ago', status: 'lukewarm' as const },
  { name: 'Custom Reports', users: 0, lastUsed: '45d ago', status: 'dead' as const },
  { name: 'White Label', users: 3, lastUsed: '38d ago', status: 'dead' as const },
  { name: 'Webhook Builder', users: 0, lastUsed: '60d ago', status: 'dead' as const },
]

const complexityData = [
  { month: 'Oct', score: 42 },
  { month: 'Nov', score: 48 },
  { month: 'Dec', score: 53 },
  { month: 'Jan', score: 58 },
  { month: 'Feb', score: 65 },
  { month: 'Mar', score: 71 },
]

const recommendations = {
  remove: [
    'Custom Reports — 0 users in 45 days, costs ~4h/week maintenance',
    'White Label — 3 enterprise users, not worth the code surface area',
    'Webhook Builder — never adopted, replaced by Zapier integration',
  ],
  simplify: [
    'Dashboard: 7 widgets → 3 default + optional panel (reduce cognitive load)',
    'Onboarding: 5-step funnel → 3-step with progressive disclosure',
    'Settings: 12 tabs → 4 categories with nested sections',
  ],
  prioritize: [
    'Onboarding step 2 fix — single highest ROI opportunity',
    'Mobile responsive scan flow — 40% of traffic, 2.3x lower conversion',
    'Quick Actions expansion — users love it, build more',
    'Dashboard personalization — let users pin what matters',
  ],
}

// ── Component ──────────────────────────────────────────────

export default function ProductEnginePage() {

  const maxComplexity = Math.max(...complexityData.map(d => d.score))

  const statusIcon = (status: string) => {
    switch (status) {
      case 'hot': return <Flame className="w-4 h-4 text-rose-400" />
      case 'alive': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case 'lukewarm': return <AlertTriangle className="w-4 h-4 text-amber-400" />
      case 'dead': return <Skull className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-rose-500/15 text-rose-400 border-rose-500/20'
      case 'alive': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
      case 'lukewarm': return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      case 'dead': return 'bg-red-500/15 text-red-400 border-red-500/20'
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/20'
    }
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-amber-400'
      case 'positive': return 'text-emerald-400'
      default: return 'text-slate-400'
    }
  }

  const severityDot = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-400'
      case 'high': return 'bg-amber-400'
      case 'positive': return 'bg-emerald-400'
      default: return 'bg-slate-400'
    }
  }

  const impactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-rose-500/15 text-rose-400'
      case 'medium': return 'bg-amber-500/15 text-amber-400'
      case 'low': return 'bg-slate-500/15 text-slate-400'
      default: return 'bg-slate-500/15 text-slate-400'
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  const scoreRing = (score: number) => {
    if (score >= 80) return 'stroke-emerald-400'
    if (score >= 60) return 'stroke-amber-400'
    return 'stroke-red-400'
  }

  const scoreGlow = (score: number) => {
    if (score >= 80) return 'shadow-emerald-400/20'
    if (score >= 60) return 'shadow-amber-400/20'
    return 'shadow-red-400/20'
  }

  // Funnel bar colors — gradient from green to red
  const funnelColor = (rate: number) => {
    if (rate >= 60) return 'bg-emerald-500'
    if (rate >= 30) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Product Engine
              <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Idle — runs nightly
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Autonomous Product Lead — nightly review &amp; morning reports</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last run: 03:00 AM
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Next review: 03:00 AM
          </div>
        </div>
      </div>

      {/* ── Executive Product Review ────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <Star className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Executive Product Review</h2>
          <span className="text-[10px] text-slate-500 ml-auto">March 5, 2026 — Morning Report</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" className="stroke-slate-800" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    className={scoreRing(productScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(productScore / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${scoreColor(productScore)}`}>{productScore}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Product Score</span>
                </div>
              </div>
              <div className={`mt-3 text-xs font-medium px-3 py-1 rounded-full ${productScore >= 80 ? 'bg-emerald-500/15 text-emerald-400' : productScore >= 60 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                {productScore >= 80 ? 'Healthy' : productScore >= 60 ? 'Needs Attention' : 'Critical'}
              </div>
            </div>

            {/* Key Findings */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Findings</h3>
              <div className="space-y-3">
                {keyFindings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot(finding.severity)}`} />
                    <span className={`text-sm leading-relaxed ${severityColor(finding.severity)}`}>
                      {finding.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Priorities */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommended Priorities</h3>
              <div className="space-y-2.5">
                {recommendedPriorities.map((p) => (
                  <div key={p.rank} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center flex-shrink-0">
                      {p.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 leading-snug">{p.text}</p>
                      <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${impactColor(p.impact)}`}>
                        {p.impact} impact
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Onboarding Funnel ──────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Onboarding Funnel</h2>
          <span className="text-[10px] text-rose-400/60 ml-auto">Overall conversion: 7.4%</span>
        </div>

        <div className="p-5">
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={step.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{step.name}</span>
                    {i > 0 && (
                      <span className="text-[10px] text-red-400/70 flex items-center gap-0.5">
                        <ArrowDown className="w-3 h-3" />
                        -{step.dropOff}% drop-off
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{step.count.toLocaleString()} users</span>
                    <span className={`text-sm font-bold min-w-[3rem] text-right ${
                      step.rate >= 60 ? 'text-emerald-400' : step.rate >= 30 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {step.rate}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-8 bg-slate-800 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg ${funnelColor(step.rate)} transition-all duration-700 relative`}
                    style={{ width: `${step.rate}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                  </div>
                  {step.rate < 50 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      {step.rate}%
                    </span>
                  )}
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-4 h-4 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Funnel summary */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-rose-400">75%</div>
              <div className="text-[10px] text-slate-500 uppercase">Drop at Upgrade</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">34%</div>
              <div className="text-[10px] text-slate-500 uppercase">Biggest Step Drop</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">7.4%</div>
              <div className="text-[10px] text-slate-500 uppercase">End-to-End Conv.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Usage ──────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Feature Usage</h2>
          <span className="text-[10px] text-slate-500 ml-auto">13 features tracked</span>
        </div>

        <div className="p-5">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: 'Hot', icon: Flame, color: 'text-rose-400 bg-rose-500/15 border-rose-500/20' },
              { label: 'Alive', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
              { label: 'Lukewarm', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' },
              { label: 'Dead', icon: Skull, color: 'text-red-400 bg-red-500/15 border-red-500/20' },
            ].map(({ label, icon: Icon, color }) => (
              <div key={label} className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${color}`}>
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {features.map((feature) => (
              <div
                key={feature.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  feature.status === 'dead'
                    ? 'bg-red-500/5 border-red-500/15'
                    : feature.status === 'hot'
                    ? 'bg-rose-500/5 border-rose-500/10'
                    : 'bg-slate-800/30 border-slate-800'
                }`}
              >
                {statusIcon(feature.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{feature.name}</div>
                  <div className="text-[11px] text-slate-500">Last used: {feature.lastUsed}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-bold ${
                    feature.status === 'hot' ? 'text-rose-400' :
                    feature.status === 'alive' ? 'text-emerald-400' :
                    feature.status === 'lukewarm' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {feature.users.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-600">users</div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge(feature.status)}`}>
                  {feature.status}
                </span>
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-xs text-rose-400">
              <Flame className="w-3.5 h-3.5" />
              {features.filter(f => f.status === 'hot').length} hot
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {features.filter(f => f.status === 'alive').length} alive
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {features.filter(f => f.status === 'lukewarm').length} lukewarm
            </div>
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <Skull className="w-3.5 h-3.5" />
              {features.filter(f => f.status === 'dead').length} dead — candidates for removal
            </div>
          </div>
        </div>
      </div>

      {/* ── Complexity Score ───────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">Complexity Score</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Is the product getting too complex?</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">Trending Up</span>
          </div>
        </div>

        <div className="p-5">
          {/* Current score callout */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl font-bold text-amber-400">71</div>
            <div>
              <div className="text-sm text-slate-300 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                +6 from last month
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Above healthy threshold (50). Consider simplification.
              </div>
            </div>
          </div>

          {/* Trend visualization */}
          <div className="flex items-end gap-2 h-40">
            {complexityData.map((d, i) => {
              const height = (d.score / maxComplexity) * 100
              const isLatest = i === complexityData.length - 1
              const isHigh = d.score >= 65
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-xs font-bold text-slate-400">{d.score}</div>
                  <div className="w-full relative" style={{ height: '120px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                        isLatest
                          ? isHigh ? 'bg-rose-500/60 border border-rose-400/30' : 'bg-amber-500/60 border border-amber-400/30'
                          : isHigh ? 'bg-rose-500/25' : 'bg-amber-500/20'
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      {isLatest && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-400 shadow-lg shadow-rose-400/50" />
                      )}
                    </div>
                  </div>
                  <div className={`text-[10px] font-medium ${isLatest ? 'text-rose-400' : 'text-slate-500'}`}>
                    {d.month}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Threshold line legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-emerald-500 rounded" />
              Healthy (≤50)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-amber-500 rounded" />
              Caution (51-65)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-rose-500 rounded" />
              Over-complex (&gt;65)
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommendations ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">AI Recommendations</h2>
          <span className="text-[10px] text-slate-500 ml-auto">Generated by Product Engine</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* What to Remove */}
            <div className="bg-slate-800/50 border border-red-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">What to Remove</h3>
                  <p className="text-[10px] text-slate-500">Dead weight slowing you down</p>
                </div>
              </div>
              <div className="space-y-3">
                {recommendations.remove.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Simplify */}
            <div className="bg-slate-800/50 border border-amber-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Minimize2 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">What to Simplify</h3>
                  <p className="text-[10px] text-slate-500">Reduce complexity, increase clarity</p>
                </div>
              </div>
              <div className="space-y-3">
                {recommendations.simplify.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Prioritize Next */}
            <div className="bg-slate-800/50 border border-rose-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <Target className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">What to Prioritize Next</h3>
                  <p className="text-[10px] text-slate-500">Highest ROI opportunities</p>
                </div>
              </div>
              <div className="space-y-3">
                {recommendations.prioritize.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-rose-500/15 text-[10px] font-bold text-rose-400 flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Note ────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 py-4">
        <Package className="w-3.5 h-3.5 text-rose-400/40" />
        Product Engine runs nightly at 03:00 AM — next review in ~18 hours
      </div>
    </div>
  )
}
