'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Search,
  ListOrdered,
  Sparkles,
  Eye,
  Send,
  Brain,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Globe,
  FileText,
  BarChart3,
  Bot,
  AlertCircle,
  CircleDot,
  Loader2,
  RefreshCw,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface GrowthData {
  snapshot: {
    id: string
    date: string
    dailyBudget: number
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
  }
  opportunityStatusCounts: Array<{ status: string; count: number }>
  opportunityPriorityCounts: Array<{ priority: string; count: number }>
  assetsByType: Array<{ type: string; count: number }>
  assetsByReviewStatus: Array<{ reviewStatus: string; count: number }>
  assetsByExecutionStatus: Array<{ executionStatus: string; count: number }>
  recentDecisions: Array<{
    id: string
    decisionType: string
    reasoning: string
    createdAt: string
    [key: string]: unknown
  }>
  northStar: {
    platformValue: number
    totalAssets: number
    avgQuality: number
    totalTraffic24h: number
    totalImpressions24h: number
    totalClicks24h: number
    totalCitations7d: number
    totalConversions7d: number
    totalAiVisibilityDelta: number
  }
  snapshotTrend: Array<{
    id: string
    date: string
    assetsPublished: number
    aiVisibilityGain: number
    avgQualityScore: number
    [key: string]: unknown
  }>
}

// ─── Pipeline Stages (static) ────────────────────────────────────
const pipelineStages = [
  { id: 'discovery', name: 'Discovery', icon: Search, description: 'Scanning for opportunities' },
  { id: 'queue', name: 'Queue', icon: ListOrdered, description: 'Awaiting generation' },
  { id: 'generation', name: 'Generation', icon: Sparkles, description: 'AI content creation' },
  { id: 'review', name: 'Review', icon: Eye, description: 'Quality verification' },
  { id: 'publishing', name: 'Publishing', icon: Send, description: 'Deploying to site' },
  { id: 'learning', name: 'Learning', icon: Brain, description: 'Performance analysis' },
]

// ─── Helpers ─────────────────────────────────────────────────────
function impactBadge(impact: string) {
  switch (impact) {
    case 'Critical':
    case 'critical':
      return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    case 'High':
    case 'high':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    case 'Medium':
    case 'medium':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
  }
}

function priorityConfig(priority: string) {
  switch (priority) {
    case 'P1':
    case 'critical':
      return { color: 'text-red-400', bg: 'bg-red-500/10' }
    case 'P2':
    case 'high':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10' }
    case 'P3':
    case 'medium':
      return { color: 'text-slate-400', bg: 'bg-slate-500/10' }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10' }
  }
}

function getStageCount(data: GrowthData | null, stageId: string): number {
  if (!data) return 0
  switch (stageId) {
    case 'discovery':
      return data.opportunityStatusCounts.find(s => s.status === 'discovered')?.count || 0
    case 'queue':
      return data.opportunityStatusCounts.find(s => s.status === 'queued')?.count || 0
    case 'generation':
      return data.assetsByExecutionStatus.find(s => s.executionStatus === 'generating')?.count || 0
    case 'review':
      return data.assetsByReviewStatus.find(s => s.reviewStatus === 'pending')?.count || 0
    case 'publishing':
      return data.assetsByExecutionStatus.find(s => s.executionStatus === 'publishing')?.count || 0
    case 'learning':
      return data.assetsByExecutionStatus.find(s => s.executionStatus === 'learning')?.count || 0
    default:
      return 0
  }
}

function isStageActive(data: GrowthData | null, stageId: string): boolean {
  return getStageCount(data, stageId) > 0
}

// ─── Component ───────────────────────────────────────────────────

export default function GrowthEnginePage() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch growth data')
        const json = await res.json()
        // Extract growth data from unified API response
        const growthData = json.growth || { snapshot: null, opportunities: [] }
        const snapshot = growthData.snapshot
        const opps = growthData.opportunities || []
        // Build compatible GrowthData from unified API data
        const derivedData: GrowthData | null = snapshot ? {
          snapshot: {
            id: snapshot.id,
            date: snapshot.date,
            dailyBudget: snapshot.dailyBudget ?? 0,
            assetsPublished: snapshot.assetsPublished ?? 0,
            assetsRejected: snapshot.assetsRejected ?? 0,
            assetsMerged: snapshot.assetsMerged ?? 0,
            avgQualityScore: snapshot.avgQualityScore ?? 0,
            avgConfidence: snapshot.avgConfidence ?? 0,
            aiVisibilityGain: snapshot.aiVisibilityGain ?? 0,
            citationGain: snapshot.citationGain ?? 0,
            entityGrowth: snapshot.entityGrowth ?? 0,
            organicGrowth: snapshot.organicGrowth ?? 0,
            knowledgeCoverage: snapshot.knowledgeCoverage ?? 0,
            platformValueAdded: snapshot.platformValueAdded ?? 0,
            predictionAccuracy: snapshot.predictionAccuracy ?? 0,
            successfulRate: snapshot.successfulRate ?? 0,
          },
          opportunityStatusCounts: [],
          opportunityPriorityCounts: [],
          assetsByType: [],
          assetsByReviewStatus: [],
          assetsByExecutionStatus: [],
          recentDecisions: [],
          northStar: {
            platformValue: 0, totalAssets: 0, avgQuality: 0,
            totalTraffic24h: 0, totalImpressions24h: 0, totalClicks24h: 0,
            totalCitations7d: 0, totalConversions7d: 0, totalAiVisibilityDelta: 0,
          },
          snapshotTrend: [],
        } : null
        setData(derivedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Growth Engine</h1>
              <p className="text-slate-400 text-sm">Autonomous Growth Engine™ pipeline</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
          <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Growth Engine</h1>
              <p className="text-slate-400 text-sm">Autonomous Growth Engine™ pipeline</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">Failed to load growth data</p>
          <p className="text-slate-500 text-xs mt-1">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); setData(null); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalInPipeline = pipelineStages.reduce((sum, s) => sum + getStageCount(data, s.id), 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Growth Engine</h1>
              <p className="text-slate-400 text-sm">Autonomous Growth Engine™ pipeline</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Running</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-300">{totalInPipeline} items in pipeline</span>
          </div>
        </div>
      </div>

      {/* ── Pipeline Visualization ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Autonomous Growth Pipeline™
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-stretch gap-0 overflow-x-auto">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon
            const count = getStageCount(data, stage.id)
            const isActive = isStageActive(data, stage.id)
            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-0">
                <div className={`
                  flex-1 min-w-0 rounded-xl p-4 border transition-all
                  ${isActive
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/50'
                  }
                `}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive ? 'bg-emerald-500/15' : 'bg-slate-700/50'}
                    `}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {stage.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className={`text-2xl font-bold ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-500">items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={`text-[10px] capitalize ${isActive ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                      {isActive ? 'active' : 'idle'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">{stage.description}</div>
                </div>

                {i < pipelineStages.length - 1 && (
                  <div className="flex items-center px-1 flex-shrink-0">
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-emerald-500/60' : 'text-slate-700'}`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical flow */}
        <div className="lg:hidden space-y-2">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon
            const count = getStageCount(data, stage.id)
            const isActive = isStageActive(data, stage.id)
            return (
              <div key={stage.id}>
                <div className={`
                  flex items-center gap-3 rounded-lg p-3 border transition-all
                  ${isActive
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/50'
                  }
                `}>
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isActive ? 'bg-emerald-500/15' : 'bg-slate-700/50'}
                  `}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {stage.name}
                    </div>
                    <div className="text-[10px] text-slate-600">{stage.description}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-lg font-bold ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {count}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  </div>
                </div>
                {i < pipelineStages.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-700 rotate-90" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Daily Snapshot Metrics ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Today&apos;s Snapshot
          <span className="ml-auto text-[10px] text-slate-500">
            {data?.snapshot?.date ? new Date(data.snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Published', value: data?.snapshot?.assetsPublished ?? 0, color: 'text-emerald-400' },
            { label: 'Merged', value: data?.snapshot?.assetsMerged ?? 0, color: 'text-cyan-400' },
            { label: 'Rejected', value: data?.snapshot?.assetsRejected ?? 0, color: 'text-red-400' },
            { label: 'Avg Quality', value: data?.snapshot?.avgQualityScore ? data.snapshot.avgQualityScore.toFixed(1) : '0', color: 'text-amber-400' },
            { label: 'AI Visibility Δ', value: data?.snapshot?.aiVisibilityGain ? `+${data.snapshot.aiVisibilityGain}%` : '0%', color: 'text-emerald-400' },
            { label: 'Citation Δ', value: data?.snapshot?.citationGain ? `+${data.snapshot.citationGain}%` : '0%', color: 'text-cyan-400' },
          ].map((m) => (
            <div key={m.label} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Row: Opportunity Queue + Recent Decisions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Opportunity Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-400" />
              Opportunity Queue
            </h2>
            <span className="text-xs text-slate-500">
              {data?.opportunityStatusCounts?.reduce((sum, s) => sum + s.count, 0) ?? 0} total
            </span>
          </div>
          {data?.opportunityStatusCounts && data.opportunityStatusCounts.length > 0 ? (
            <div className="space-y-2">
              {data.opportunityStatusCounts.map((item) => {
                const prioCfg = priorityConfig(item.status)
                return (
                  <div
                    key={item.status}
                    className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white capitalize">{item.status}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-slate-200">{item.count}</div>
                    </div>
                  </div>
                )
              })}
              {/* Priority breakdown */}
              {data.opportunityPriorityCounts && data.opportunityPriorityCounts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase mb-2">By Priority</div>
                  <div className="flex flex-wrap gap-2">
                    {data.opportunityPriorityCounts.map((p) => {
                      const cfg = priorityConfig(p.priority)
                      return (
                        <span key={p.priority} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                          {p.priority}: {p.count}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <ListOrdered className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No opportunities yet</p>
            </div>
          )}
        </div>

        {/* Recent Governor Decisions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Recent Governor Decisions
            </h2>
            <span className="text-xs text-slate-500">Last 10</span>
          </div>
          {data?.recentDecisions && data.recentDecisions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.recentDecisions.map((decision) => {
                const impCfg = impactBadge(decision.decisionType || '')
                return (
                  <div
                    key={decision.id}
                    className="flex items-start gap-3 p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-slate-600/40 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white capitalize truncate">
                        {decision.decisionType || 'Decision'}
                      </div>
                      {decision.reasoning && (
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{decision.reasoning}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${impCfg.bg} ${impCfg.color} border ${impCfg.border} px-2 py-0.5 rounded`}>
                          {decision.decisionType || '—'}
                        </span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {decision.createdAt ? new Date(decision.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No governor decisions yet</p>
            </div>
          )}

          {/* North Star Summary */}
          {data?.northStar && (
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{data.northStar.totalAssets}</div>
                <div className="text-[10px] text-slate-500 uppercase">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">{data.northStar.avgQuality.toFixed(1)}</div>
                <div className="text-[10px] text-slate-500 uppercase">Avg Quality</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{data.northStar.totalCitations7d}</div>
                <div className="text-[10px] text-slate-500 uppercase">Citations 7d</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
