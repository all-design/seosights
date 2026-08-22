'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Globe, Eye, MousePointerClick, TrendingUp, Target,
  ShieldAlert, AlertTriangle, Info, CheckCircle2, Sparkles, Zap,
  Search, FileText, BarChart3, Crown, ArrowRight,
  Gauge, Lightbulb, Rocket, Building2, Mail, ArrowUpRight,
  ArrowDownRight, Minus, Calendar, Download, Bell, Star, Tag,
} from 'lucide-react'

// ── Types (mirror the API response) ──────────────────────────────

interface ClientSite {
  id: string
  label: string
  siteUrl: string
  domain: string
  industry: string
  plan: string
}

interface Summary {
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  avgPosition: number
}

interface QueryRow {
  query: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface PageRow {
  url: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface PerformancePoint {
  date: string
  impressions: number
  clicks: number
}

interface Opportunity {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  query?: string
  page?: string
  metric: string
  value: number
  benchmark: number
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  estimatedUplift: string
  recommendedAction: string
}

interface HealthFactor {
  label: string
  score: number
  weight: number
  detail: string
}

interface Recommendation {
  id: string
  priority: 'P0' | 'P1' | 'P2'
  category: string
  title: string
  description: string
  impact: string
  timeframe: string
}

interface PlanTier {
  id: string
  name: string
  price: number
  period: string
  tagline: string
  highlighted: boolean
  features: string[]
  cta: string
}

interface ClientDetailResponse {
  client: ClientSite
  connected: boolean
  dataSource: string
  summary: Summary | null
  summary7d: Summary | null
  summary90d: Summary | null
  deltas?: {
    impressionsPct: number
    clicksPct: number
  } | null
  topQueries: QueryRow[]
  topPages: PageRow[]
  performanceOverTime: PerformancePoint[]
  opportunities: Opportunity[]
  opportunitySummary?: {
    critical: number
    warning: number
    info: number
    total: number
    highImpact: number
  }
  healthScore: { score: number; factors: HealthFactor[] }
  recommendations: Recommendation[]
  plans: PlanTier[]
  generatedAt?: string
}

// ── Helpers ──────────────────────────────────────────────────────

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: ShieldAlert, label: 'Critical', glow: 'shadow-red-500/10' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, label: 'Warning', glow: 'shadow-amber-500/10' },
  info: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Info, label: 'Opportunity', glow: 'shadow-cyan-500/10' },
}

const impactConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'High Impact' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Medium Impact' },
  low: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Low Impact' },
}

const effortConfig = {
  low: { color: 'text-emerald-400', label: 'Quick Win' },
  medium: { color: 'text-amber-400', label: 'Moderate Effort' },
  high: { color: 'text-orange-400', label: 'Strategic Effort' },
}

const priorityConfig = {
  P0: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Urgent' },
  P1: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'High Priority' },
  P2: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Opportunity' },
}

const categoryIcons: Record<string, typeof Search> = {
  content: FileText,
  technical: Zap,
  ctr: Target,
  keywords: Search,
  structure: Building2,
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function getDeltaTrend(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 2) return 'up'
  if (delta < -2) return 'down'
  return 'flat'
}

// ── Health Score Ring ─────────────────────────────────────────────

function HealthScoreRing({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Needs Work' : 'Critical'

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth="10"
        />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-white">{score}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  )
}

// ── KPI Card with delta ───────────────────────────────────────────

function KPICard({
  icon: Icon, label, value, delta, deltaLabel, color,
}: {
  icon: typeof Eye
  label: string
  value: string
  delta?: number
  deltaLabel?: string
  color: 'emerald' | 'cyan' | 'amber' | 'red'
}) {
  const colorMap = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  }
  const trend = delta !== undefined ? getDeltaTrend(delta) : null

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colorMap[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-mono ${
            trend === 'up' ? 'text-emerald-400' :
            trend === 'down' ? 'text-red-400' : 'text-slate-500'
          }`}>
            {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend === 'flat' && <Minus className="w-3 h-3" />}
            {delta !== undefined && `${delta > 0 ? '+' : ''}${delta}%`}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {deltaLabel && <div className="text-[10px] text-slate-600 mt-1">{deltaLabel}</div>}
    </div>
  )
}

// ── Performance Chart ─────────────────────────────────────────────

function PerformanceChart({ data }: { data: PerformancePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
        No performance data available
      </div>
    )
  }

  const maxImp = Math.max(...data.map(d => d.impressions), 1)
  const maxClicks = Math.max(...data.map(d => d.clicks), 1)
  const width = 100 // percentage based
  const barWidth = width / data.length

  return (
    <div>
      <div className="flex items-end gap-px h-44 relative">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="border-t border-slate-800/50 h-0" />
          ))}
        </div>
        {data.map((d, i) => {
          const hImp = (d.impressions / maxImp) * 100
          const hClicks = (d.clicks / maxClicks) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group relative"
              style={{ minWidth: '2px' }}
            >
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl whitespace-nowrap">
                  <div className="text-[10px] text-slate-400">{d.date}</div>
                  <div className="text-xs text-emerald-400 font-mono">{d.impressions.toLocaleString()} imp</div>
                  <div className="text-xs text-cyan-400 font-mono">{d.clicks.toLocaleString()} clicks</div>
                </div>
              </div>
              <div
                className="w-full rounded-t bg-gradient-to-t from-emerald-500/30 to-emerald-500/60 transition-all"
                style={{ height: `${Math.max(hImp, 1)}%` }}
              />
              <div
                className="w-full bg-cyan-400/80"
                style={{ height: `${Math.max(hClicks * 8, 1)}%`, marginTop: '1px' }}
              />
            </div>
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-600">
        <span>{data[0]?.date.slice(5) || ''}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5) || ''}</span>
        <span>{data[data.length - 1]?.date.slice(5) || ''}</span>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/60" />
          <span className="text-xs text-slate-400">Impressions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-400/80" />
          <span className="text-xs text-slate-400">Clicks</span>
        </div>
        <div className="ml-auto text-[10px] text-slate-600">
          Last {data.length} days · Google Search Console
        </div>
      </div>
    </div>
  )
}

// ── Page Component ────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params)
  const router = useRouter()
  const [data, setData] = useState<ClientDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'queries' | 'pages' | 'recommendations'>('opportunities')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/gsc/clients/${clientId}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Client not found')
          throw new Error('Failed to fetch client data')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [clientId])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded h-8 w-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-28" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">{error}</h2>
        <button
          onClick={() => router.push('/control/client-zero')}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </button>
      </div>
    )
  }

  if (!data) return null

  const { client, summary, summary90d, deltas, topQueries, topPages, performanceOverTime, opportunities, opportunitySummary, healthScore, recommendations, plans } = data

  const hasData = summary !== null
  const healthColor = healthScore.score >= 70 ? 'emerald' : healthScore.score >= 40 ? 'amber' : 'red'

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/control/client-zero"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            Last 28 days
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs transition-colors">
            <Bell className="w-3.5 h-3.5" />
            Set Alerts
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 lg:p-8">
        {/* Background glow */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          healthColor === 'emerald' ? 'bg-emerald-500' : healthColor === 'amber' ? 'bg-amber-500' : 'bg-red-500'
        }`} />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Site info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white truncate">{client.domain}</h1>
                  {hasData && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Data
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-400 mt-0.5">
                  {client.industry}
                </div>
              </div>
            </div>

            {/* Quick stats inline */}
            {hasData && summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase">Impressions</div>
                  <div className="text-lg font-bold text-white">{formatNumber(summary.totalImpressions)}</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase">Clicks</div>
                  <div className="text-lg font-bold text-white">{formatNumber(summary.totalClicks)}</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase">CTR</div>
                  <div className="text-lg font-bold text-white">{summary.avgCtr}%</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur rounded-lg p-3 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase">Avg Position</div>
                  <div className="text-lg font-bold text-white">#{summary.avgPosition.toFixed(1)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Health Score Ring */}
          {hasData && (
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <HealthScoreRing score={healthScore.score} />
              <div className="text-xs text-slate-500 uppercase tracking-wider">SEO Health Score</div>
            </div>
          )}
        </div>

        {/* No data banner */}
        {!hasData && (
          <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-white font-medium">No search data available yet</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  This site may be newly verified or has no recent search traffic. Data from Google Search Console appears here once the site starts receiving organic search impressions.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasData ? (
        <>
          {/* KPI Grid with deltas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={Eye}
              label="Impressions (28d)"
              value={formatNumber(summary!.totalImpressions)}
              delta={deltas?.impressionsPct}
              deltaLabel="vs previous period"
              color="emerald"
            />
            <KPICard
              icon={MousePointerClick}
              label="Clicks (28d)"
              value={formatNumber(summary!.totalClicks)}
              delta={deltas?.clicksPct}
              deltaLabel="vs previous period"
              color="cyan"
            />
            <KPICard
              icon={Target}
              label="Click-through Rate"
              value={`${summary!.avgCtr}%`}
              color={summary!.avgCtr >= 3 ? 'emerald' : summary!.avgCtr >= 1.5 ? 'amber' : 'red'}
              deltaLabel={summary!.avgCtr < 3 ? `Below 3% benchmark` : 'Above benchmark'}
            />
            <KPICard
              icon={TrendingUp}
              label="Average Position"
              value={`#${summary!.avgPosition.toFixed(1)}`}
              color={summary!.avgPosition <= 10 ? 'emerald' : summary!.avgPosition <= 20 ? 'amber' : 'red'}
              deltaLabel={summary!.avgPosition > 10 ? 'Goal: top 10' : 'Top 10 ranking'}
            />
          </div>

          {/* 90-day Performance Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Performance Trend
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Daily impressions and clicks over the last 90 days</p>
              </div>
              {summary90d && (
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">90-day Total</div>
                  <div className="text-sm font-bold text-white">
                    {formatNumber(summary90d.totalImpressions)} imp · {formatNumber(summary90d.totalClicks)} clicks
                  </div>
                </div>
              )}
            </div>
            <PerformanceChart data={performanceOverTime} />
          </div>

          {/* Health Score Breakdown */}
          {healthScore.factors.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Gauge className="w-4 h-4 text-emerald-400" />
                SEO Health Score Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthScore.factors.map((factor, i) => {
                  const color = factor.score >= 70 ? 'emerald' : factor.score >= 40 ? 'amber' : 'red'
                  const colorClass = color === 'emerald' ? 'text-emerald-400 bg-emerald-500' :
                                    color === 'amber' ? 'text-amber-400 bg-amber-500' : 'text-red-400 bg-red-500'
                  return (
                    <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs font-medium text-white">{factor.label}</div>
                          <div className="text-[10px] text-slate-500">{factor.detail}</div>
                        </div>
                        <div className={`text-lg font-bold ${colorClass.split(' ')[0]}`}>
                          {factor.score}
                          <span className="text-xs text-slate-600">/100</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClass.split(' ')[1]} rounded-full transition-all duration-700`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1">Weight: {factor.weight}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-800 overflow-x-auto">
              {[
                { id: 'opportunities', label: 'SEO Opportunities', icon: Lightbulb, count: opportunitySummary?.total },
                { id: 'queries', label: 'Top Queries', icon: Search, count: topQueries.length },
                { id: 'pages', label: 'Top Pages', icon: FileText, count: topPages.length },
                { id: 'recommendations', label: 'Action Plan', icon: Rocket, count: recommendations.length },
              ].map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      active
                        ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-5">
              {/* Opportunities Tab */}
              {activeTab === 'opportunities' && (
                <div className="space-y-3">
                  {opportunitySummary && opportunitySummary.total > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">{opportunitySummary.critical}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Critical</div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="text-2xl font-bold text-amber-400">{opportunitySummary.warning}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Warnings</div>
                      </div>
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div className="text-2xl font-bold text-cyan-400">{opportunitySummary.info}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Opportunities</div>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400">{opportunitySummary.highImpact}</div>
                        <div className="text-[10px] text-slate-500 uppercase">High Impact</div>
                      </div>
                    </div>
                  )}

                  {opportunities.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-white">No SEO issues detected</h3>
                      <p className="text-xs text-slate-500 mt-1">Your site is performing well across all metrics.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      {opportunities.map((opp) => {
                        const sc = severityConfig[opp.severity]
                        const SIcon = sc.icon
                        const imp = impactConfig[opp.impact]
                        const eff = effortConfig[opp.effort]
                        return (
                          <div
                            key={opp.id}
                            className={`p-4 rounded-lg border ${sc.bg} ${sc.border} hover:border-opacity-60 transition-colors`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                                <SIcon className={`w-4 h-4 ${sc.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="text-sm font-semibold text-white">{opp.title}</h4>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} flex-shrink-0`}>
                                    {sc.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-3">{opp.description}</p>

                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className={`text-[10px] px-2 py-0.5 rounded ${imp.bg} ${imp.color}`}>
                                    {imp.label}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded bg-slate-700/30 ${eff.color}`}>
                                    {eff.label}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                    {opp.estimatedUplift}
                                  </span>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                                  <div className="flex items-start gap-2">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Recommended Action</div>
                                      <div className="text-xs text-slate-300">{opp.recommendedAction}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 hidden sm:block">
                                <div className={`text-lg font-bold ${sc.color}`}>{opp.value.toFixed(1)}</div>
                                <div className="text-[10px] text-slate-600">goal: {opp.benchmark}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Top Queries Tab */}
              {activeTab === 'queries' && (
                <div>
                  {topQueries.length === 0 ? (
                    <div className="text-center py-12 text-sm text-slate-500">No query data available</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800">
                            <th className="text-left py-3 pr-3 font-medium text-xs uppercase tracking-wider">#</th>
                            <th className="text-left py-3 px-2 font-medium text-xs uppercase tracking-wider">Query</th>
                            <th className="text-right py-3 px-2 font-medium text-xs uppercase tracking-wider">Impressions</th>
                            <th className="text-right py-3 px-2 font-medium text-xs uppercase tracking-wider">Clicks</th>
                            <th className="text-right py-3 px-2 font-medium text-xs uppercase tracking-wider">CTR</th>
                            <th className="text-right py-3 px-2 font-medium text-xs uppercase tracking-wider">Position</th>
                            <th className="text-right py-3 pl-2 font-medium text-xs uppercase tracking-wider">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topQueries.slice(0, 25).map((q, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 pr-3 text-slate-600 text-xs">{i + 1}</td>
                              <td className="py-3 px-2 text-white font-medium">{q.query}</td>
                              <td className="text-right py-3 px-2 text-slate-300 font-mono text-xs">{q.impressions.toLocaleString()}</td>
                              <td className="text-right py-3 px-2 text-slate-300 font-mono text-xs">{q.clicks.toLocaleString()}</td>
                              <td className={`text-right py-3 px-2 font-mono text-xs ${
                                q.ctr >= 5 ? 'text-emerald-400' : q.ctr >= 2 ? 'text-amber-400' : 'text-red-400'
                              }`}>{q.ctr}%</td>
                              <td className={`text-right py-3 px-2 font-mono text-xs ${
                                q.position <= 5 ? 'text-emerald-400' : q.position <= 10 ? 'text-amber-400' : 'text-red-400'
                              }`}>#{q.position.toFixed(1)}</td>
                              <td className="text-right py-3 pl-2">
                                {q.position <= 5 ? (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 inline" />
                                ) : q.position > 10 ? (
                                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400 inline" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5 text-amber-400 inline" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Top Pages Tab */}
              {activeTab === 'pages' && (
                <div>
                  {topPages.length === 0 ? (
                    <div className="text-center py-12 text-sm text-slate-500">No page data available</div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      {topPages.slice(0, 25).map((p, i) => {
                        const path = p.url.replace(/^https?:\/\/[^/]+/, '') || '/'
                        const domain = p.url.replace(/^https?:\/\//, '').split('/')[0]
                        return (
                          <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-600 font-mono w-6 flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-white font-mono truncate">{path}</div>
                                <div className="text-[10px] text-slate-600">{domain}</div>
                              </div>
                              <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                                <div className="text-right">
                                  <div className="text-xs text-slate-300 font-mono">{p.impressions.toLocaleString()}</div>
                                  <div className="text-[9px] text-slate-600">impressions</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-300 font-mono">{p.clicks.toLocaleString()}</div>
                                  <div className="text-[9px] text-slate-600">clicks</div>
                                </div>
                                <div className={`text-right font-mono text-xs ${
                                  p.ctr >= 5 ? 'text-emerald-400' : p.ctr >= 2 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {p.ctr}%
                                  <div className="text-[9px] text-slate-600">CTR</div>
                                </div>
                                <div className={`text-right font-mono text-xs ${
                                  p.position <= 5 ? 'text-emerald-400' : p.position <= 10 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  #{p.position.toFixed(1)}
                                  <div className="text-[9px] text-slate-600">pos</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-3">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-12 text-sm text-slate-500">No recommendations available</div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-semibold text-white">Your AI-Powered Action Plan</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Based on {opportunities.length} detected opportunities across {topQueries.length} queries and {topPages.length} pages.
                              Follow this plan to maximize your SEO impact.
                            </p>
                          </div>
                        </div>
                      </div>
                      {recommendations.map((rec, i) => {
                        const pc = priorityConfig[rec.priority]
                        const CatIcon = categoryIcons[rec.category] || Lightbulb
                        return (
                          <div key={rec.id} className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-slate-600 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                                <CatIcon className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-mono">#{i + 1}</span>
                                    <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pc.bg} ${pc.color} ${pc.border}`}>
                                    {rec.priority} · {pc.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 mb-3">{rec.description}</p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                                  <span className="flex items-center gap-1 text-emerald-400">
                                    <TrendingUp className="w-3 h-3" />
                                    {rec.impact}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <Calendar className="w-3 h-3" />
                                    {rec.timeframe}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-500 capitalize">
                                    <Tag className="w-3 h-3" />
                                    {rec.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upgrade CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 lg:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Unlock Full Potential</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Ready to accelerate your SEO growth?</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
                You've seen the data. Now turn insights into action with a plan that fits your business goals.
                {opportunitySummary && opportunitySummary.total > 0 && (
                  <> Fix <span className="text-emerald-400 font-semibold">{opportunitySummary.total} opportunities</span> to unlock significant traffic growth.</>
                )}
              </p>
            </div>

            {/* Plan Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl p-5 border transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-br from-emerald-500/10 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{plan.tagline}</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-sm text-slate-500">/{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-5 min-h-[140px]">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                      plan.highlighted
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              Need a custom plan? <a href="mailto:sales@seosights.com" className="text-emerald-400 hover:underline ml-1">Contact our sales team</a>
            </div>
          </div>

          {/* Footer info */}
          {data.generatedAt && (
            <div className="text-center text-[10px] text-slate-600">
              Data sourced from Google Search Console · Last updated {new Date(data.generatedAt).toLocaleString()}
              <br />
              SeoSights™ · AI-Powered SEO Visibility Platform
            </div>
          )}
        </>
      ) : (
        // No data state — show upgrade CTA only
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Crown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Get Started</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Start growing with SeoSights</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Connect your Google Search Console and unlock weekly audits, AI-powered recommendations, and competitor tracking.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-sm font-medium transition-colors">
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
