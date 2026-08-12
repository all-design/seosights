'use client'

import { useEffect, useState } from 'react'
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
  AlertCircle,
  RefreshCw,
  Shield,
  Eye,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────

interface QAData {
  score: number
  warnings: number
  degraded: number
  critical: number
  passRate: number
  totalTests: number
  passed: number
  lastRun: string | null
}

interface FeatureAdoption {
  featureKey: string
  featureName: string
  activeUsersToday: number
  activeUsers7dAvg: number
  adoptionRate: number
  retention7d: number
  status: 'adopted' | 'at_risk' | 'low_adoption'
  trend: 'up' | 'stable' | 'down'
}

interface FeatureValidation {
  featureKey: string
  featureName: string
  usedCount: number
  avgSessionMin: number
  avgSessionSec: number
  convLift: number
  decision: 'KEEP' | 'REVIEW' | 'KILL'
}

interface RecentDecision {
  id: string
  changeTitle: string
  changeType: string
  aiScoreDelta: number
  createdAt: string
}

interface TopInsight {
  id: string
  title: string
  insightType: string
  priority: string
  description: string
  confidence: number
  status: string
}

interface ProductData {
  qa: QAData
  featureAdoption: FeatureAdoption[]
  featureValidation: FeatureValidation[]
  recentDecisions: RecentDecision[]
  topInsights: TopInsight[]
  summary: {
    adoptedCount: number
    atRiskCount: number
    lowAdoptionCount: number
    keepCount: number
    reviewCount: number
    killCount: number
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function statusIcon(status: string) {
  switch (status) {
    case 'adopted': return <Flame className="w-4 h-4 text-rose-400" />
    case 'at_risk': return <AlertTriangle className="w-4 h-4 text-amber-400" />
    case 'low_adoption': return <Skull className="w-4 h-4 text-red-400" />
    default: return null
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'adopted': return 'bg-rose-500/15 text-rose-400 border-rose-500/20'
    case 'at_risk': return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    case 'low_adoption': return 'bg-red-500/15 text-red-400 border-red-500/20'
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/20'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'adopted': return 'Hot'
    case 'at_risk': return 'At Risk'
    case 'low_adoption': return 'Dead'
    default: return status
  }
}

function decisionConfig(decision: string) {
  switch (decision) {
    case 'KEEP': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle2 }
    case 'REVIEW': return { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Eye }
    case 'KILL': return { color: 'text-red-400', bg: 'bg-red-500/15', icon: XCircle }
    default: return { color: 'text-slate-400', bg: 'bg-slate-500/15', icon: AlertCircle }
  }
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function scoreRing(score: number) {
  if (score >= 80) return 'stroke-emerald-400'
  if (score >= 60) return 'stroke-amber-400'
  return 'stroke-red-400'
}

function trendIcon(trend: string) {
  switch (trend) {
    case 'up': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
    case 'down': return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
    default: return <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
  }
}

// ─── Component ──────────────────────────────────────────────────

export default function ProductEnginePage() {
  const [data, setData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch from the dedicated product engine API which provides
        // feature adoption, validation, decisions, and AI insights
        const res = await fetch('/api/superadmin/product')
        if (!res.ok) throw new Error('Failed to fetch product data')
        const json = await res.json()

        const derived: ProductData = {
          qa: {
            score: json.qa?.score ?? 0,
            warnings: json.qa?.warnings ?? 0,
            degraded: json.qa?.degraded ?? 0,
            critical: json.qa?.critical ?? 0,
            passRate: json.qa?.passRate ?? 0,
            totalTests: json.qa?.totalTests ?? 0,
            passed: json.qa?.passed ?? 0,
            lastRun: json.qa?.lastRun ?? null,
          },
          featureAdoption: json.featureAdoption ?? [],
          featureValidation: json.featureValidation ?? [],
          recentDecisions: json.recentDecisions ?? [],
          topInsights: json.topInsights ?? [],
          summary: {
            adoptedCount: json.summary?.adoptedCount ?? 0,
            atRiskCount: json.summary?.atRiskCount ?? 0,
            lowAdoptionCount: json.summary?.lowAdoptionCount ?? 0,
            keepCount: json.summary?.keepCount ?? 0,
            reviewCount: json.summary?.reviewCount ?? 0,
            killCount: json.summary?.killCount ?? 0,
          },
        }
        setData(derived)
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Product Engine</h1>
              <p className="text-sm text-slate-400 mt-0.5">Autonomous Product Lead</p>
            </div>
          </div>
        </div>
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Product Engine</h1>
            <p className="text-sm text-slate-400 mt-0.5">Autonomous Product Lead</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">Failed to load product data</p>
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

  if (!data) return null

  const qaScore = data.qa.score

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
          {data.qa.lastRun && (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Last run: {new Date(data.qa.lastRun).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <span className="text-slate-700">|</span>
            </>
          )}
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
          <span className="text-[10px] text-slate-500 ml-auto">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QA Score */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" className="stroke-slate-800" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    className={scoreRing(qaScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(qaScore / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${scoreColor(qaScore)}`}>{qaScore}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">QA Score</span>
                </div>
              </div>
              <div className={`mt-3 text-xs font-medium px-3 py-1 rounded-full ${qaScore >= 80 ? 'bg-emerald-500/15 text-emerald-400' : qaScore >= 60 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                {qaScore >= 80 ? 'Healthy' : qaScore >= 60 ? 'Needs Attention' : 'Critical'}
              </div>
            </div>

            {/* QA Metrics */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">QA Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Pass Rate</span>
                  <span className={`text-sm font-bold ${scoreColor(data.qa.passRate)}`}>{data.qa.passRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Tests</span>
                  <span className="text-sm font-bold text-white">{data.qa.passed}/{data.qa.totalTests}</span>
                </div>
                {data.qa.critical > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-400" />
                    <span className="text-sm text-red-400">{data.qa.critical} critical issue{data.qa.critical !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {data.qa.warnings > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-amber-400" />
                    <span className="text-sm text-amber-400">{data.qa.warnings} warning{data.qa.warnings !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {data.qa.degraded > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-orange-400" />
                    <span className="text-sm text-orange-400">{data.qa.degraded} degraded</span>
                  </div>
                )}
                {data.qa.critical === 0 && data.qa.warnings === 0 && (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <span className="text-sm text-emerald-400">All tests passing</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Insights */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Insights</h3>
              {data.topInsights && data.topInsights.length > 0 ? (
                <div className="space-y-2.5">
                  {data.topInsights.map((insight) => (
                    <div key={insight.id} className="flex items-start gap-2.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                        insight.priority === 'high' ? 'bg-red-500/15 text-red-400' :
                        insight.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {insight.priority === 'high' ? '!' : insight.priority === 'medium' ? '?' : 'i'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 leading-snug">{insight.title}</p>
                        {insight.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{insight.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Sparkles className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">No AI insights yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Adoption ──────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Feature Adoption</h2>
          <span className="text-[10px] text-slate-500 ml-auto">{data.featureAdoption.length} features tracked</span>
        </div>

        <div className="p-5">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: 'Adopted', icon: Flame, color: 'text-rose-400 bg-rose-500/15 border-rose-500/20' },
              { label: 'At Risk', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' },
              { label: 'Low Adoption', icon: Skull, color: 'text-red-400 bg-red-500/15 border-red-500/20' },
            ].map(({ label, icon: Icon, color }) => (
              <div key={label} className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${color}`}>
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>

          {/* Feature list */}
          {data.featureAdoption.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.featureAdoption.map((feature) => (
                <div
                  key={feature.featureKey}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                    feature.status === 'low_adoption'
                      ? 'bg-red-500/5 border-red-500/15'
                      : feature.status === 'adopted'
                      ? 'bg-rose-500/5 border-rose-500/10'
                      : 'bg-slate-800/30 border-slate-800'
                  }`}
                >
                  {statusIcon(feature.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{feature.featureName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500">{feature.activeUsersToday} users today</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[11px] text-slate-500">7d avg: {feature.activeUsers7dAvg}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${
                      feature.status === 'adopted' ? 'text-rose-400' :
                      feature.status === 'at_risk' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {feature.adoptionRate}%
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {trendIcon(feature.trend)}
                      <span className="text-[10px] text-slate-600">adoption</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge(feature.status)}`}>
                    {statusLabel(feature.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No feature adoption data yet</p>
            </div>
          )}

          {/* Summary bar */}
          {data.summary && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <Flame className="w-3.5 h-3.5" />
                {data.summary.adoptedCount} adopted
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                {data.summary.atRiskCount} at risk
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <Skull className="w-3.5 h-3.5" />
                {data.summary.lowAdoptionCount} low — candidates for removal
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Feature Validation ─────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Feature Validation</h2>
          <span className="text-[10px] text-slate-500 ml-auto">Keep / Review / Kill decisions</span>
        </div>

        <div className="p-5">
          {data.featureValidation.length > 0 ? (
            <div className="space-y-2">
              {data.featureValidation.map((feature) => {
                const decCfg = decisionConfig(feature.decision)
                const DecIcon = decCfg.icon
                return (
                  <div
                    key={feature.featureKey}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                      feature.decision === 'KILL'
                        ? 'bg-red-500/5 border-red-500/15'
                        : feature.decision === 'KEEP'
                        ? 'bg-emerald-500/5 border-emerald-500/10'
                        : 'bg-amber-500/5 border-amber-500/10'
                    }`}
                  >
                    <DecIcon className={`w-4 h-4 flex-shrink-0 ${decCfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{feature.featureName}</div>
                      <div className="text-[11px] text-slate-500">
                        {feature.usedCount} uses · {feature.avgSessionMin}m {feature.avgSessionSec}s avg · +{feature.convLift}% conv lift
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${decCfg.bg} ${decCfg.color}`}>
                      {feature.decision}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No feature validation data yet</p>
            </div>
          )}

          {/* Validation summary */}
          {data.summary && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {data.summary.keepCount} keep
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Eye className="w-3.5 h-3.5" />
                {data.summary.reviewCount} review
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                {data.summary.killCount} kill
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Decisions ───────────────────────────────── */}
      {data.recentDecisions && data.recentDecisions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">Recent Product Decisions</h2>
            <span className="text-[10px] text-slate-500 ml-auto">{data.recentDecisions.length} recent</span>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {data.recentDecisions.map((decision) => (
                <div key={decision.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    decision.aiScoreDelta >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'
                  }`}>
                    {decision.aiScoreDelta >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{decision.changeTitle}</div>
                    <div className="text-[11px] text-slate-500">{decision.changeType} · {new Date(decision.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div className={`text-sm font-bold ${decision.aiScoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {decision.aiScoreDelta >= 0 ? '+' : ''}{decision.aiScoreDelta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Note ────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 py-4">
        <Package className="w-3.5 h-3.5 text-rose-400/40" />
        Product Engine runs nightly at 03:00 AM
      </div>
    </div>
  )
}
