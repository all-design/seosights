'use client'

import { useEffect, useState } from 'react'
import {
  Package, RefreshCw, ChevronDown, ChevronRight, Clock, Scan,
  CheckCircle2, AlertTriangle, XCircle, FileText, Layers,
  ArrowRight, Sparkles, Search,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type FeatureStatus = 'documented' | 'missing' | 'outdated'

// ─── Helpers ─────────────────────────────────────────────

function statusConfig(status: FeatureStatus) {
  switch (status) {
    case 'documented': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Documented' }
    case 'outdated': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Outdated' }
    case 'missing': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Missing' }
  }
}

// ─── Main Component ──────────────────────────────────────

export default function ProductDocsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {}
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
  }

  const productQA = data?.productQA || null
  const qa = productQA?.qa || {}
  const featureAdoption = productQA?.featureAdoption || []
  const featureValidation = productQA?.featureValidation || []
  const recentDecisions = productQA?.recentDecisions || []
  const topInsights = productQA?.topInsights || []
  const summary = productQA?.summary || {}

  // Derive feature doc status from feature adoption data
  const featureDocs = featureAdoption.map((f: any) => ({
    id: f.featureKey,
    name: f.featureName,
    status: f.status === 'adopted' ? 'documented' : f.status === 'at_risk' ? 'outdated' : 'missing' as FeatureStatus,
    adoptionRate: f.adoptionRate,
    trend: f.trend,
    activeUsersToday: f.activeUsersToday,
  }))

  const documented = featureDocs.filter((f: any) => f.status === 'documented').length
  const outdated = featureDocs.filter((f: any) => f.status === 'outdated').length
  const missing = featureDocs.filter((f: any) => f.status === 'missing').length
  const coveragePercent = featureDocs.length > 0 ? Math.round((documented / featureDocs.length) * 100) : 0

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
                <span className="text-2xl font-bold text-sky-400">{featureDocs.length}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Features Total</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{documented}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Documented</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">{outdated}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Outdated</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{missing}</span>
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
        {featureDocs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No feature documentation available</p>
            <p className="text-[11px] text-slate-500 mt-1">Feature docs will appear after product data is synced</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featureDocs.map((feature: any) => {
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
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Adoption: {feature.adoptionRate}% · {feature.activeUsersToday} active today
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-medium ${feature.trend === 'up' ? 'text-emerald-400' : feature.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                        {feature.trend === 'up' ? '↑' : feature.trend === 'down' ? '↓' : '→'} {feature.trend}
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
                        {/* Validation data */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                          <div className="text-[10px] text-sky-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Validation
                          </div>
                          {(() => {
                            const validation = featureValidation.find((v: any) => v.featureKey === feature.id)
                            if (!validation) return <p className="text-xs text-slate-500">No validation data</p>
                            return (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Used count</span>
                                  <span className="text-white">{validation.usedCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Conversion lift</span>
                                  <span className="text-white">{validation.convLift}%</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Decision</span>
                                  <span className={`font-medium ${validation.decision === 'KEEP' ? 'text-emerald-400' : validation.decision === 'KILL' ? 'text-red-400' : 'text-amber-400'}`}>
                                    {validation.decision}
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                        </div>

                        {/* Adoption data */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                          <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Adoption
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Rate</span>
                              <span className="text-white">{feature.adoptionRate}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Active today</span>
                              <span className="text-white">{feature.activeUsersToday}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Trend</span>
                              <span className={`font-medium ${feature.trend === 'up' ? 'text-emerald-400' : feature.trend === 'down' ? 'text-red-400' : 'text-slate-300'}`}>
                                {feature.trend}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. AI Insights
          ═══════════════════════════════════════════════════════ */}
      {topInsights.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            AI Insights
          </h2>
          <div className="space-y-2">
            {topInsights.map((insight: any) => (
              <div key={insight.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    insight.priority === 'high' ? 'bg-red-500/15 text-red-400' :
                    insight.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-slate-500/15 text-slate-400'
                  }`}>{insight.priority}</span>
                  <span className="text-xs font-medium text-white">{insight.title}</span>
                </div>
                <p className="text-[11px] text-slate-400">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          5. QA Score
          ═══════════════════════════════════════════════════════ */}
      {qa.score !== undefined && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">QA Status</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-emerald-400">{qa.score}%</span>
              <div className="text-[10px] text-slate-500">Pass Rate</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-sky-400">{qa.totalTests}</span>
              <div className="text-[10px] text-slate-500">Total Tests</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-amber-400">{qa.warnings}</span>
              <div className="text-[10px] text-slate-500">Warnings</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-red-400">{qa.critical}</span>
              <div className="text-[10px] text-slate-500">Critical</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          6. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Last QA run: <span className="text-slate-300">{qa.lastRun ? new Date(qa.lastRun).toLocaleString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-sky-400" />
          <span>Features scanned: <span className="text-slate-300">{featureDocs.length}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Coverage: <span className="text-sky-400">{coveragePercent}%</span></span>
        <span className="text-slate-700">|</span>
        <span>Decisions: <span className="text-slate-300">{recentDecisions.length}</span></span>
      </div>

    </div>
  )
}
