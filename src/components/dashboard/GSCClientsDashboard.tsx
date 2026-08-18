'use client'

import { useEffect, useState } from 'react'
import {
  Globe, AlertTriangle, TrendingUp, TrendingDown, Eye, MousePointerClick,
  Search, ShieldAlert, Info, ChevronDown, ChevronUp, BarChart3,
  ArrowUpRight, ArrowDownRight, Target, Zap, FileText,
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

// ── Severity helpers ───────────────────────────────────────────

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert, label: 'Critical' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Warning' },
  info: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Info, label: 'Opportunity' },
}

const weakTypeLabels: Record<string, string> = {
  low_ctr: 'Low CTR',
  declining_position: 'Declining Position',
  high_impression_low_click: 'Title/Description Issue',
  content_gap: 'Content Gap',
  poor_performance: 'Performance Issue',
}

// ── KPI Card ───────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, color, sub }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'emerald' | 'amber' | 'red' | 'cyan'
  sub?: string
}) {
  const colorMap = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400',
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${colorMap[color]}`} />
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      {sub && <div className="text-[10px] text-amber-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Client Card ────────────────────────────────────────────────

function ClientCard({ client, isExpanded, onToggle }: {
  client: ClientResult
  isExpanded: boolean
  onToggle: () => void
}) {
  const { data, weakPoints, weakPointSummary, dataSource, label, domain, siteUrl } = client
  const hasData = data !== null && dataSource === 'google_search_console'
  const summary = data?.summary

  // Health score based on weak points
  const healthScore = hasData && weakPointSummary
    ? Math.max(0, 100 - (weakPointSummary.critical * 20 + weakPointSummary.warning * 8 + weakPointSummary.info * 3))
    : null

  const healthColor = healthScore !== null
    ? healthScore >= 70 ? 'emerald' : healthScore >= 40 ? 'amber' : 'red'
    : null

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            hasData ? 'bg-emerald-500/10' : 'bg-slate-800'
          }`}>
            <Globe className={`w-5 h-5 ${hasData ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-xs text-slate-500">{domain}</span>
              {hasData && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
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
            {summary && (
              <div className="text-xs text-slate-400 mt-0.5">
                {summary.totalImpressions.toLocaleString()} impressions · {summary.totalClicks.toLocaleString()} clicks · CTR {summary.avgCtr}% · Avg pos #{summary.avgPosition.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Score Badge */}
          {healthScore !== null && healthColor && (
            <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              healthColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              healthColor === 'amber' ? 'bg-amber-500/10 text-amber-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {healthScore}/100
            </div>
          )}

          {/* Weak Points Summary Pills */}
          {weakPointSummary && weakPointSummary.total > 0 && (
            <div className="flex items-center gap-1.5">
              {weakPointSummary.critical > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                  {weakPointSummary.critical} critical
                </span>
              )}
              {weakPointSummary.warning > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                  {weakPointSummary.warning}
                </span>
              )}
              {weakPointSummary.info > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                  {weakPointSummary.info}
                </span>
              )}
            </div>
          )}

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-800 p-5 space-y-5">
          {!hasData ? (
            <div className="text-center py-8">
              <Globe className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No search data available</h3>
              <p className="text-xs text-slate-500 mt-1">
                {dataSource === 'no_data'
                  ? 'This site may be newly verified or has no recent search traffic.'
                  : dataSource === 'error'
                  ? 'Failed to fetch data from Google Search Console.'
                  : 'GSC API is not configured.'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KPICard
                    icon={Eye}
                    label="Impressions"
                    value={summary.totalImpressions.toLocaleString()}
                    color="emerald"
                  />
                  <KPICard
                    icon={MousePointerClick}
                    label="Clicks"
                    value={summary.totalClicks.toLocaleString()}
                    color="cyan"
                  />
                  <KPICard
                    icon={TrendingUp}
                    label="CTR"
                    value={`${summary.avgCtr}%`}
                    color={summary.avgCtr >= 3 ? 'emerald' : summary.avgCtr >= 1.5 ? 'amber' : 'red'}
                    sub={summary.avgCtr < 3 ? 'Below 3% benchmark' : undefined}
                  />
                  <KPICard
                    icon={Target}
                    label="Avg Position"
                    value={`#${summary.avgPosition.toFixed(1)}`}
                    color={summary.avgPosition <= 10 ? 'emerald' : summary.avgPosition <= 20 ? 'amber' : 'red'}
                    sub={summary.avgPosition > 10 ? 'Goal: top 10' : undefined}
                  />
                </div>
              )}

              {/* Performance Chart */}
              {data.performanceOverTime.length > 0 && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    14-Day Performance
                  </h3>
                  <div className="flex items-end gap-1 h-16">
                    {data.performanceOverTime.map((d, i) => {
                      const maxImp = Math.max(...data.performanceOverTime.map(x => x.impressions))
                      const h = maxImp > 0 ? (d.impressions / maxImp) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className="w-full rounded-t bg-emerald-500/40 transition-all"
                            style={{ height: `${Math.max(h, 2)}%`, minHeight: '2px' }}
                          />
                          {i % 3 === 0 && (
                            <span className="text-[8px] text-slate-600">
                              {d.date.slice(8)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Weak Points */}
              {weakPoints.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    SEO Weak Points
                    <span className="text-slate-500 font-normal">({weakPoints.length} found)</span>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {weakPoints.slice(0, 12).map((wp, i) => {
                      const sc = severityConfig[wp.severity]
                      const WpIcon = sc.icon
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${sc.bg} ${sc.border} flex items-start gap-3`}
                        >
                          <WpIcon className={`w-4 h-4 ${sc.color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>
                                {weakTypeLabels[wp.type] || wp.type}
                              </span>
                              <span className={`text-[10px] ${sc.color}`}>
                                {sc.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{wp.message}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-xs font-mono ${sc.color}`}>{wp.value.toFixed(1)}</div>
                            <div className="text-[9px] text-slate-500">goal: {wp.benchmark}</div>
                          </div>
                        </div>
                      )
                    })}
                    {weakPoints.length > 12 && (
                      <p className="text-xs text-slate-500 text-center py-2">
                        +{weakPoints.length - 12} more issues
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Top Queries */}
              {data.topQueries.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    Top Search Queries
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="text-left py-2 pr-3 font-medium">Query</th>
                          <th className="text-right py-2 px-2 font-medium">Impressions</th>
                          <th className="text-right py-2 px-2 font-medium">Clicks</th>
                          <th className="text-right py-2 px-2 font-medium">CTR</th>
                          <th className="text-right py-2 px-2 font-medium">Position</th>
                          <th className="text-right py-2 pl-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topQueries.slice(0, 10).map((q, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                            <td className="py-2 pr-3 text-slate-300 font-medium">{q.query}</td>
                            <td className="text-right py-2 px-2 text-slate-400">{q.impressions.toLocaleString()}</td>
                            <td className="text-right py-2 px-2 text-slate-400">{q.clicks.toLocaleString()}</td>
                            <td className={`text-right py-2 px-2 font-mono ${
                              q.ctr >= 5 ? 'text-emerald-400' : q.ctr >= 2 ? 'text-amber-400' : 'text-red-400'
                            }`}>{q.ctr}%</td>
                            <td className={`text-right py-2 px-2 font-mono ${
                              q.position <= 5 ? 'text-emerald-400' : q.position <= 10 ? 'text-amber-400' : 'text-red-400'
                            }`}>#{q.position.toFixed(1)}</td>
                            <td className="text-right py-2 pl-2">
                              {q.position <= 5 ? (
                                <ArrowUpRight className="w-3 h-3 text-emerald-400 inline" />
                              ) : q.position > 10 ? (
                                <ArrowDownRight className="w-3 h-3 text-red-400 inline" />
                              ) : (
                                <TrendingUp className="w-3 h-3 text-amber-400 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Pages */}
              {data.topPages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Top Pages
                  </h3>
                  <div className="space-y-1.5">
                    {data.topPages.slice(0, 5).map((p, i) => {
                      const path = p.url.replace(siteUrl, '').replace('https://' + domain, '') || '/'
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                          <span className="text-xs text-slate-300 flex-1 truncate font-mono">{path}</span>
                          <span className="text-xs text-slate-400">{p.impressions.toLocaleString()} imp</span>
                          <span className={`text-xs font-mono ${
                            p.ctr >= 5 ? 'text-emerald-400' : p.ctr >= 2 ? 'text-amber-400' : 'text-red-400'
                          }`}>{p.ctr}%</span>
                          <span className={`text-xs font-mono ${
                            p.position <= 5 ? 'text-emerald-400' : p.position <= 10 ? 'text-amber-400' : 'text-red-400'
                          }`}>#{p.position.toFixed(1)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────

export default function GSCClientsDashboard() {
  const [data, setData] = useState<ClientsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>('client-one')

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
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-32" />
        ))}
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          Client Sites — SEO Analysis
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Real Google Search Console data with weak point detection
        </p>
      </div>

      {/* Overview Stats */}
      {clientsWithData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 uppercase mb-1">Active Clients</div>
            <div className="text-xl font-bold text-emerald-400">{clientsWithData.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 uppercase mb-1">Total Impressions</div>
            <div className="text-xl font-bold text-white">
              {clientsWithData.reduce((s, c) => s + (c.data?.summary?.totalImpressions || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 uppercase mb-1">Total Clicks</div>
            <div className="text-xl font-bold text-cyan-400">
              {clientsWithData.reduce((s, c) => s + (c.data?.summary?.totalClicks || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 uppercase mb-1">Issues Found</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-400">{totalWeakPoints}</span>
              {criticalCount > 0 && (
                <span className="text-xs text-red-400">({criticalCount} critical)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Cards */}
      <div className="space-y-3">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            isExpanded={expandedClient === client.id}
            onToggle={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
          />
        ))}
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
