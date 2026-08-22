'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Globe, AlertTriangle, TrendingUp, Eye, MousePointerClick,
  Search, ShieldAlert, Info, BarChart3,
  ArrowUpRight, ArrowDownRight, Target, ChevronRight,
  Sparkles, Crown, Activity, Zap,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────

interface WeakPoint {
  type: 'low_ctr' | 'declining_position' | 'high_impression_low_click' | 'content_gap' | 'poor_performance'
  severity: 'critical' | 'warning' | 'info'
  query?: string
  page?: string
  message: string
  metric: string
  value: number
  benchmark: number
}

interface ClientData {
  summary: {
    totalImpressions: number
    totalClicks: number
    avgCtr: number
    avgPosition: number
  } | null
  topQueries: Array<{
    query: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }>
  topPages: Array<{
    url: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }>
  performanceOverTime: Array<{
    date: string
    impressions: number
    clicks: number
  }>
}

interface ClientSite {
  id: string
  label: string
  siteUrl: string
  domain: string
}

interface ClientResult extends ClientSite {
  data: ClientData | null
  weakPoints: WeakPoint[]
  weakPointSummary?: {
    critical: number
    warning: number
    info: number
    total: number
  }
  dataSource: string
}

interface ClientsResponse {
  connected: boolean
  clients: ClientResult[]
  generatedAt?: string
}

// ── Helpers ────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

// ── Client Card (clickable to full dashboard) ──────────────────

function ClientCard({ client }: { client: ClientResult }) {
  const { data, weakPointSummary, dataSource, label, domain, id } = client
  const hasData = data !== null && dataSource === 'google_search_console'
  const summary = data?.summary

  // Health score based on weak points (mirrors detail page logic)
  const healthScore = hasData && weakPointSummary
    ? Math.max(0, 100 - (weakPointSummary.critical * 20 + weakPointSummary.warning * 8 + weakPointSummary.info * 3))
    : null

  const healthColor = healthScore !== null
    ? healthScore >= 70 ? 'emerald' : healthScore >= 40 ? 'amber' : 'red'
    : null

  const healthBg = healthColor === 'emerald' ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30' :
                   healthColor === 'amber' ? 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30' :
                   healthColor === 'red' ? 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/30' : ''

  return (
    <Link
      href={`/control/client-zero/${id}`}
      className="block group"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200 group-hover:border-emerald-500/40 group-hover:shadow-lg group-hover:shadow-emerald-500/5">
        {/* Top accent bar — appears on hover */}
        <div className="h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500 group-hover:via-emerald-400 group-hover:to-cyan-400 transition-all duration-300" />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                hasData ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800 border border-slate-700'
              }`}>
                <Globe className={`w-5 h-5 ${hasData ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{label}</span>
                  {hasData && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  )}
                  {!hasData && dataSource === 'no_data' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500">
                      No Data
                    </span>
                  )}
                  {!hasData && dataSource === 'error' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                      Error
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{domain}</div>
              </div>
            </div>

            {/* Health Score Badge */}
            {healthScore !== null && healthColor && (
              <div className={`text-right flex-shrink-0`}>
                <div className={`text-2xl font-bold ${
                  healthColor === 'emerald' ? 'text-emerald-400' :
                  healthColor === 'amber' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {healthScore}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Health</div>
              </div>
            )}
          </div>

          {/* Stats grid */}
          {hasData && summary ? (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-1 mb-0.5">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] text-slate-500 uppercase">Imp</span>
                </div>
                <div className="text-sm font-bold text-white">{formatNumber(summary.totalImpressions)}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-1 mb-0.5">
                  <MousePointerClick className="w-3 h-3 text-cyan-400" />
                  <span className="text-[9px] text-slate-500 uppercase">Clicks</span>
                </div>
                <div className="text-sm font-bold text-white">{formatNumber(summary.totalClicks)}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-1 mb-0.5">
                  <Target className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] text-slate-500 uppercase">CTR</span>
                </div>
                <div className={`text-sm font-bold ${
                  summary.avgCtr >= 3 ? 'text-emerald-400' : summary.avgCtr >= 1.5 ? 'text-amber-400' : 'text-red-400'
                }`}>{summary.avgCtr}%</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-1 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                  <span className="text-[9px] text-slate-500 uppercase">Pos</span>
                </div>
                <div className={`text-sm font-bold ${
                  summary.avgPosition <= 10 ? 'text-emerald-400' : summary.avgPosition <= 20 ? 'text-amber-400' : 'text-red-400'
                }`}>#{summary.avgPosition.toFixed(1)}</div>
              </div>
            </div>
          ) : (
            <div className="h-[72px] flex items-center justify-center bg-slate-800/20 rounded-lg mb-4">
              <span className="text-xs text-slate-600">Awaiting search data</span>
            </div>
          )}

          {/* Weak points summary */}
          {hasData && weakPointSummary && weakPointSummary.total > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[10px] text-slate-500 uppercase">Opportunities:</span>
              {weakPointSummary.critical > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  {weakPointSummary.critical} critical
                </span>
              )}
              {weakPointSummary.warning > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {weakPointSummary.warning} warnings
                </span>
              )}
              {weakPointSummary.info > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {weakPointSummary.info} opportunities
                </span>
              )}
            </div>
          )}

          {/* Mini sparkline (last 14 days) */}
          {hasData && data && data.performanceOverTime.length > 0 && (
            <div className="mb-4">
              <div className="flex items-end gap-px h-10">
                {data.performanceOverTime.slice(-14).map((d, i) => {
                  const maxImp = Math.max(...data.performanceOverTime.slice(-14).map(x => x.impressions), 1)
                  const h = (d.impressions / maxImp) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/20 to-emerald-500/50 group-hover:from-emerald-500/40 group-hover:to-emerald-500/70 transition-colors"
                      style={{ height: `${Math.max(h, 5)}%` }}
                    />
                  )
                })}
              </div>
              <div className="text-[9px] text-slate-600 mt-1">14-day impression trend</div>
            </div>
          )}

          {/* CTA footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              {hasData ? 'View full dashboard' : 'View details'}
            </span>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:gap-2 transition-all">
              Open
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main Component ─────────────────────────────────────────────

export default function GSCClientsDashboard() {
  const [data, setData] = useState<ClientsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/gsc/clients')
        if (!res.ok) throw new Error('Failed to fetch client data')
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
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-800 rounded h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const clients = data?.clients || []
  const totalWeakPoints = clients.reduce((sum, c) => sum + (c.weakPointSummary?.total || 0), 0)
  const criticalCount = clients.reduce((sum, c) => sum + (c.weakPointSummary?.critical || 0), 0)
  const clientsWithData = clients.filter(c => c.dataSource === 'google_search_console')
  const totalImpressions = clientsWithData.reduce((s, c) => s + (c.data?.summary?.totalImpressions || 0), 0)
  const totalClicks = clientsWithData.reduce((s, c) => s + (c.data?.summary?.totalClicks || 0), 0)
  const avgHealthScore = clientsWithData.length > 0
    ? Math.round(clientsWithData.reduce((s, c) => {
        const wp = c.weakPointSummary
        if (!wp) return s
        return s + Math.max(0, 100 - (wp.critical * 20 + wp.warning * 8 + wp.info * 3))
      }, 0) / clientsWithData.length)
    : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Client Portfolio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real Google Search Console data · Click any client to open full dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {clientsWithData.length} active
          </span>
        </div>
      </div>

      {/* Portfolio Overview Stats */}
      {clientsWithData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500 uppercase">Active Clients</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">{clientsWithData.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-slate-500 uppercase">Total Impressions</span>
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(totalImpressions)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <MousePointerClick className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] text-slate-500 uppercase">Total Clicks</span>
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(totalClicks)}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-500 uppercase">Avg Health / Issues</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-400">{avgHealthScore}</span>
              <span className="text-xs text-slate-500">· {totalWeakPoints} issues ({criticalCount} crit)</span>
            </div>
          </div>
        </div>
      )}

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>

      {/* Sales Pitch Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">Want a dashboard like this for your site?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SeoSights connects to your Google Search Console and delivers AI-powered SEO insights, weekly audits, and competitor tracking.
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            View Plans
          </Link>
        </div>
      </div>

      {/* Timestamp */}
      {data?.generatedAt && (
        <div className="text-[10px] text-slate-600 text-right">
          Data from Google Search Console · Generated {new Date(data.generatedAt).toLocaleString()}
        </div>
      )}
    </div>
  )
}
