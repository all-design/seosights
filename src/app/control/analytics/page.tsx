'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, TrendingUp, Eye, DollarSign,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Activity,
  Package, Target, Zap, Clock,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface GrowthDailySnapshot {
  id: string
  date: string
  assetsPublished: number
  assetsRejected: number
  assetsMerged: number
  avgQualityScore: number
  avgConfidence: number
  aiVisibilityGain: number
  citationGain: number
  entityGrowth: number
  organicGrowth: number
  knowledgeCoverage: number
  platformValueAdded: number
  predictionAccuracy: number
  successfulRate: number
  byTypeBreakdown: string
  createdAt: string
}

interface GrowthOpportunity {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  estimatedImpact: number
  confidence: number
  source: string | null
  createdAt: string
}

interface GrowthData {
  snapshot: GrowthDailySnapshot | null
  opportunities: GrowthOpportunity[]
}

interface AnalyticsPageData {
  growth: GrowthData
  // Other sections available but not used by this page
  [key: string]: unknown
}

// ── Component ────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-24" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load analytics</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const { snapshot, opportunities } = data.growth

  // KPIs derived from growth snapshot
  const kpis = [
    {
      label: 'Assets Published',
      value: snapshot?.assetsPublished?.toString() ?? '0',
      delta: 'published',
      trend: (snapshot?.assetsPublished ?? 0) > 0 ? 'up' as const : 'down' as const,
      icon: Package,
    },
    {
      label: 'AI Visibility Gain',
      value: snapshot?.aiVisibilityGain != null ? `${Math.round(snapshot.aiVisibilityGain)}` : '0',
      delta: 'points gained',
      trend: (snapshot?.aiVisibilityGain ?? 0) > 0 ? 'up' as const : 'down' as const,
      icon: TrendingUp,
    },
    {
      label: 'Citation Gain',
      value: snapshot?.citationGain != null ? `${Math.round(snapshot.citationGain)}` : '0',
      delta: 'new citations',
      trend: (snapshot?.citationGain ?? 0) > 0 ? 'up' as const : 'down' as const,
      icon: Eye,
    },
    {
      label: 'Success Rate',
      value: snapshot?.successfulRate != null ? `${Math.round(snapshot.successfulRate)}%` : '0%',
      delta: 'asset success',
      trend: (snapshot?.successfulRate ?? 0) >= 50 ? 'up' as const : 'down' as const,
      icon: BarChart3,
    },
  ]

  // Growth metrics from snapshot
  const growthMetrics = snapshot
    ? [
        { label: 'Avg Quality Score', value: Math.round(snapshot.avgQualityScore), color: 'emerald' },
        { label: 'Avg Confidence', value: Math.round(snapshot.avgConfidence), color: 'cyan' },
        { label: 'Entity Growth', value: Math.round(snapshot.entityGrowth), color: 'amber' },
        { label: 'Organic Growth', value: Math.round(snapshot.organicGrowth), color: 'purple' },
        { label: 'Knowledge Coverage', value: Math.round(snapshot.knowledgeCoverage), color: 'blue' },
        { label: 'Platform Value', value: Math.round(snapshot.platformValueAdded), color: 'emerald' },
        { label: 'Prediction Accuracy', value: Math.round(snapshot.predictionAccuracy), color: 'cyan' },
      ]
    : []

  const maxMetricValue = Math.max(...growthMetrics.map(m => m.value), 1)

  // Parse by-type breakdown
  let typeBreakdown: Record<string, number> = {}
  if (snapshot?.byTypeBreakdown) {
    try {
      typeBreakdown = JSON.parse(snapshot.byTypeBreakdown)
    } catch {
      typeBreakdown = {}
    }
  }

  const typeEntries = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])

  // Check if there's any data
  const hasData = snapshot !== null || opportunities.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide growth metrics and insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] text-slate-500 uppercase">{k.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{k.value}</span>
                <span className={`text-xs flex items-center gap-0.5 ${k.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {k.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.delta}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No analytics data yet</h3>
          <p className="text-xs text-slate-500 mt-1">Growth metrics will appear here as the platform generates assets and tracks AI visibility.</p>
        </div>
      ) : (
        <>
          {/* Growth Metrics Bar Chart */}
          {growthMetrics.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Growth Metrics</h2>
              <div className="space-y-2">
                {growthMetrics.map((m) => {
                  const pct = maxMetricValue > 0 ? (m.value / maxMetricValue) * 100 : 0
                  return (
                    <div key={m.label} className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 w-36 flex-shrink-0 truncate">{m.label}</span>
                      <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                        <div
                          className={`h-full rounded flex items-center px-2 bg-${m.color}-500/40`}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">{m.value}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Asset Breakdown by Type */}
          {typeEntries.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Asset Breakdown by Type</h2>
              <div className="space-y-2">
                {typeEntries.map(([type, count]) => {
                  const maxCount = typeEntries[0]?.[1] || 1
                  const pct = (count / maxCount) * 100
                  return (
                    <div key={type} className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 w-32 flex-shrink-0 truncate font-mono capitalize">{type}</span>
                      <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-500/40 rounded flex items-center px-2"
                          style={{ width: `${pct}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">{count}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Growth Opportunities
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      opp.status === 'discovered' ? 'bg-amber-400' :
                      opp.status === 'in_progress' ? 'bg-cyan-400' :
                      opp.status === 'completed' ? 'bg-emerald-400' :
                      'bg-slate-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-300">{opp.title}</div>
                      {opp.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{opp.description}</div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 capitalize">{opp.type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                          opp.priority === 'high' || opp.priority === 'critical' ? 'bg-amber-500/20 text-amber-400' :
                          opp.priority === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {opp.priority}
                        </span>
                        {opp.estimatedImpact > 0 && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                            <Zap className="w-3 h-3" />
                            +{Math.round(opp.estimatedImpact)} impact
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600 flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(opp.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snapshot Detail Card */}
          {snapshot && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Latest Snapshot Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{snapshot.assetsPublished}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{snapshot.assetsRejected}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Rejected</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">{snapshot.assetsMerged}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Merged</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">{Math.round(snapshot.avgQualityScore)}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">Avg Quality</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                Snapshot date: {new Date(snapshot.date).toLocaleDateString()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
