'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  Package, RefreshCw, ChevronDown, ChevronRight, Clock, Scan,
  CheckCircle2, AlertTriangle, XCircle, FileText, Layers,
  ArrowRight, Sparkles, Search,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type FeatureStatus = 'documented' | 'missing' | 'outdated'

interface FeatureDoc {
  id: string
  name: string
  userStory: string
  flow: string[]
  acceptanceCriteria: string[]
  screens: string[]
  kpis: string[]
  status: FeatureStatus
  lastUpdated: string
}

// ─── Mock Data ───────────────────────────────────────────

const featureDocs: FeatureDoc[] = [
  {
    id: 'fd-1',
    name: 'Opportunity Queue',
    userStory: 'As a growth manager, I want to see a prioritized queue of AI citation opportunities so I can focus on the highest-impact actions first.',
    flow: ['Navigate to /control/growth', 'View Discovery stage', 'Sort by impact score', 'Select opportunity → Generate content'],
    acceptanceCriteria: ['Queue loads within 2s', 'Opportunities sorted by composite impact score', 'Each item shows target AI, estimated impact, priority', 'One-click transition to content generation'],
    screens: ['/control/growth — Pipeline view', '/control/growth — Queue tab', '/control/growth — Opportunity detail modal'],
    kpis: ['Queue refresh rate', 'Time-to-action per opportunity', 'Opportunity-to-content conversion rate'],
    status: 'documented',
    lastUpdated: '2h ago',
  },
  {
    id: 'fd-2',
    name: 'Mission Control',
    userStory: 'As an operator, I want a single dashboard showing all active autonomous systems so I can monitor the health of the entire AI factory.',
    flow: ['Navigate to /control', 'View system health scores', 'Click system card for details', 'Acknowledge alerts'],
    acceptanceCriteria: ['All 15 systems visible', 'Health scores update every 5 min', 'Critical alerts surface immediately', 'One-click drill-down to any engine'],
    screens: ['/control — Overview dashboard', '/control — System detail panels'],
    kpis: ['Mean time to detect issues', 'System uptime %', 'Alert acknowledgement time'],
    status: 'documented',
    lastUpdated: '4h ago',
  },
  {
    id: 'fd-3',
    name: 'Growth Engine',
    userStory: 'As a content strategist, I want the Growth Engine to autonomously generate and publish AI-optimized content so we increase citation rates.',
    flow: ['Discovery scan runs', 'Opportunities queued', 'AI generates draft', 'QA + Review pipeline', 'Human approval', 'Publish + monitor'],
    acceptanceCriteria: ['6-stage pipeline visible', 'Auto-generates drafts for P1 opportunities', 'All content passes QA before publishing', 'Citation tracking post-publish'],
    screens: ['/control/growth — Pipeline', '/control/growth — Active missions', '/control/growth — Content queue', '/control/growth — Recent published'],
    kpis: ['Content generation velocity', 'QA pass rate', 'Citation acquisition rate', 'Visibility delta per publish'],
    status: 'documented',
    lastUpdated: '6h ago',
  },
  {
    id: 'fd-4',
    name: 'AI Router',
    userStory: 'As a platform engineer, I want AI requests routed to the most cost-effective model so we minimize spend while maintaining quality.',
    flow: ['Engine makes AI request', 'Router evaluates: deterministic? → cache? → free model? → paid model?', 'Request routed to optimal provider', 'Result cached for future use'],
    acceptanceCriteria: ['Deterministic tasks never hit LLM', 'Cache hit rate > 80%', 'Free models used when possible', 'Fallback chain handles provider outages'],
    screens: ['/control/ai-router — Mesh architecture', '/control/ai-router — Routing rules', '/control/ai-cost — Breakdown'],
    kpis: ['Cache hit rate', 'Cost per request', 'Free vs paid model ratio', 'Routing latency'],
    status: 'outdated',
    lastUpdated: '3d ago',
  },
  {
    id: 'fd-5',
    name: 'Documentation Engine',
    userStory: 'As a developer, I want auto-generated documentation for all product features, APIs, and database schemas so the docs are always current.',
    flow: ['Engine scans codebase', 'Extracts feature metadata', 'Generates docs from templates', 'Flags drift between code and docs', 'Auto-updates where safe'],
    acceptanceCriteria: ['All features have doc entries', 'API docs auto-generated from route handlers', 'DB docs generated from Prisma schema', 'Drift detection runs nightly'],
    screens: ['/control/documentation/product', '/control/documentation/technical', '/control/documentation/api', '/control/documentation/database'],
    kpis: ['Documentation coverage %', 'Drift detection accuracy', 'Auto-update success rate', 'Time since last manual update'],
    status: 'documented',
    lastUpdated: '1h ago',
  },
  {
    id: 'fd-6',
    name: 'Replay Engine',
    userStory: 'As a DevOps engineer, I want post-deploy metric monitoring with automatic rollback so bad deployments never reach users.',
    flow: ['Deploy completes', 'Replay monitors key metrics (latency, errors, conversions)', 'If metrics degrade beyond threshold → auto-rollback', 'If stable → promote to full rollout'],
    acceptanceCriteria: ['Metric monitoring starts within 30s of deploy', 'Rollback triggers within 2 min of degradation', 'Rollback is zero-downtime', 'Full audit trail of metric observations'],
    screens: ['/control/replay — Monitoring dashboard', '/control/replay — Rollback history', '/control/deploy — Deployment detail'],
    kpis: ['Mean time to detect regression', 'Rollback success rate', 'False positive rate', 'Deploy confidence score'],
    status: 'missing',
    lastUpdated: 'never',
  },
]

// ─── Helpers ─────────────────────────────────────────────

function statusConfig(status: FeatureStatus) {
  switch (status) {
    case 'documented': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Documented' }
    case 'outdated': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Outdated' }
    case 'missing': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Missing' }
  }
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function ProductDocsPage() {
  const mounted = useHydrated()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!mounted) return null

  const documented = featureDocs.filter(f => f.status === 'documented').length
  const outdated = featureDocs.filter(f => f.status === 'outdated').length
  const missing = featureDocs.filter(f => f.status === 'missing').length
  const coveragePercent = Math.round((documented / featureDocs.length) * 100)

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Product Docs™</h1>
            <p className="text-slate-400 text-sm">Documentation Engine — auto-generated feature documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Auto-synced</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Coverage Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-sky-500/5 via-slate-900 to-slate-900 border border-sky-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Coverage Circle */}
          <div className="flex-shrink-0">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={58} fill="none" stroke="#1e293b" strokeWidth={8} />
                <circle cx={70} cy={70} r={58} fill="none" stroke="#38bdf8" strokeWidth={8} strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - coveragePercent / 100)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-sky-400">{coveragePercent}%</span>
                <span className="text-[10px] text-slate-500">Coverage</span>
              </div>
            </div>
          </div>

          {/* Stat Boxes */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-sky-400" />
                <span className="text-2xl font-bold text-sky-400">{documented + outdated + missing}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Features Total</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">24</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Documented</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">6</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Outdated</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-bold text-red-400">2</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Missing</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Features Documentation Table
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Feature Documentation
          <span className="ml-auto text-[10px] text-slate-400">{featureDocs.length} features tracked</span>
        </h2>
        <div className="space-y-3">
          {featureDocs.map((feature) => {
            const config = statusConfig(feature.status)
            const StatusIcon = config.icon
            const isExpanded = expandedId === feature.id
            return (
              <div
                key={feature.id}
                className="bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-200"
              >
                {/* Feature header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{feature.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{feature.userStory}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {feature.lastUpdated}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* User Story */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                        <div className="text-[10px] text-sky-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          User Story
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{feature.userStory}</p>
                      </div>

                      {/* Flow */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                        <div className="text-[10px] text-sky-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          Flow
                        </div>
                        <div className="space-y-1">
                          {feature.flow.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px]">
                              <span className="w-4 h-4 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{idx + 1}</span>
                              <span className="text-slate-300">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Acceptance Criteria */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                        <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Acceptance Criteria
                        </div>
                        <div className="space-y-1">
                          {feature.acceptanceCriteria.map((ac, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-300">{ac}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Screens */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                        <div className="text-[10px] text-violet-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Search className="w-3 h-3" />
                          Screens
                        </div>
                        <div className="space-y-1">
                          {feature.screens.map((screen, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 font-mono">{screen}</div>
                          ))}
                        </div>
                      </div>

                      {/* KPIs */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 md:col-span-2">
                        <div className="text-[10px] text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          KPIs
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {feature.kpis.map((kpi, idx) => (
                            <span key={idx} className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">{kpi}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Quick Actions Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Last scan: <span className="text-slate-300">14 min ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Next scan: <span className="text-slate-300">in 46 min</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-sky-400" />
          <span>Features scanned: <span className="text-slate-300">32</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Coverage: <span className="text-sky-400">{coveragePercent}%</span></span>
      </div>

    </div>
  )
}
