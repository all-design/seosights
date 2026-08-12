'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Eye,
  Database,
  FileText,
  BarChart3,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle2,
  Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface ObservatoryData {
  overview: {
    totalCrawls: number
    totalResponses: number
    totalChanges: number
    totalSignals: number
    totalReports: number
    totalPublications: number
    totalLearnings: number
    totalIndustries: number
    signalRate: string
  }
  latestCrawl: {
    id: string
    type: string
    status: string
    modelsQueried: number
    promptsTotal: number
    promptsCompleted: number
    durationMs: number | null
    responseCount: number
    changeCount: number
    startedAt: string
    completedAt: string | null
  } | null
  latestChanges: Array<{
    id: string
    aiModel: string
    changeType: string
    category: string
    significanceScore: number
    isSignal: boolean
    signalReason: string | null
    createdAt: string
  }>
  recentReports: Array<{
    id: string
    slug: string
    title: string
    type: string
    status: string
    editorialScore: number | null
    wordCount: number | null
    createdAt: string
    publishedAt: string | null
  }>
  modelRegistry: Array<{
    id: string
    modelId: string
    displayName: string
    provider: string
    version: string | null
    totalResponses: number
    knownChanges: number
    lastCrawledAt: string | null
    isActive: boolean
  }>
  pipeline: {
    reportByStatus: Array<{ status: string; count: number }>
    changesByType: Array<{ changeType: string; count: number }>
    responsesByModel: Array<{ aiModel: string; count: number }>
  }
  queue: {
    unprocessedChanges: number
    proposedReports: number
  }
}

export default function ObservatoryControlPage() {
  const [data, setData] = useState<ObservatoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Use dedicated Observatory status API (not the sparse /api/control/data)
        // This returns full pipeline data: counts, model registry, reports, queue, etc.
        const res = await fetch('/api/observatory/status')
        if (!res.ok) throw new Error('Failed to fetch observatory status')
        const json = await res.json()
        if (json.error) throw new Error(json.error)

        // The API returns the exact ObservatoryData shape — use it directly
        const obsData: ObservatoryData = {
          overview: json.overview ?? {
            totalCrawls: 0, totalResponses: 0, totalChanges: 0,
            totalSignals: 0, totalReports: 0, totalPublications: 0,
            totalLearnings: 0, totalIndustries: 0, signalRate: '0%',
          },
          latestCrawl: json.latestCrawl ?? null,
          latestChanges: json.latestChanges ?? [],
          recentReports: json.recentReports ?? [],
          modelRegistry: json.modelRegistry ?? [],
          pipeline: json.pipeline ?? { reportByStatus: [], changesByType: [], responsesByModel: [] },
          queue: json.queue ?? { unprocessedChanges: 0, proposedReports: 0 },
        }
        setData(obsData)
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
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Search className="w-6 h-6 text-amber-400" />
            Observatory — Control View
          </h1>
          <p className="text-slate-400 text-sm mt-1">Internal research center — this is the control panel view.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-24" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Search className="w-6 h-6 text-amber-400" />
            Observatory — Control View
          </h1>
          <p className="text-slate-400 text-sm mt-1">Internal research center — this is the control panel view.</p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">Failed to load observatory data</p>
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

  const stats = [
    { label: 'Models Monitored', value: String(data.modelRegistry.length), icon: Eye },
    { label: 'Responses Archived', value: data.overview.totalResponses.toLocaleString(), icon: Database },
    { label: 'Reports Published', value: String(data.overview.totalReports), icon: FileText },
    { label: 'Signals Detected', value: String(data.overview.totalSignals), icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Search className="w-6 h-6 text-amber-400" />
          Observatory — Control View
        </h1>
        <p className="text-slate-400 text-sm mt-1">Internal research center — this is the control panel view. Public view at /observatory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-slate-500 uppercase">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          )
        })}
      </div>

      {/* Latest Crawl */}
      {data.latestCrawl && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Latest Crawl
            <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
              data.latestCrawl.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400'
                : data.latestCrawl.status === 'running'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'bg-slate-800 text-slate-500'
            }`}>
              {data.latestCrawl.status}
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{data.latestCrawl.modelsQueried}</div>
              <div className="text-[10px] text-slate-500 uppercase">Models</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">{data.latestCrawl.promptsCompleted}/{data.latestCrawl.promptsTotal}</div>
              <div className="text-[10px] text-slate-500 uppercase">Prompts</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{data.latestCrawl.responseCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Responses</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-rose-400">{data.latestCrawl.changeCount}</div>
              <div className="text-[10px] text-slate-500 uppercase">Changes</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">
                {data.latestCrawl.durationMs ? `${(data.latestCrawl.durationMs / 1000).toFixed(1)}s` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">Duration</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">{data.overview.signalRate}</div>
              <div className="text-[10px] text-slate-500 uppercase">Signal Rate</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600">
            <Clock className="w-3 h-3" />
            Started: {new Date(data.latestCrawl.startedAt).toLocaleString()}
            {data.latestCrawl.completedAt && (
              <> · Completed: {new Date(data.latestCrawl.completedAt).toLocaleString()}</>
            )}
          </div>
        </div>
      )}

      {/* Model Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400" />
          Model Crawl Status
        </h2>
        {data.modelRegistry.length > 0 ? (
          <div className="space-y-2">
            {data.modelRegistry.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30">
                <div className={`w-2 h-2 rounded-full ${m.isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-sm text-white w-32 truncate">{m.displayName}</span>
                <span className="text-xs text-slate-500 w-20 truncate">{m.provider}</span>
                <span className={`text-xs ${m.isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {m.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-slate-500 ml-auto">
                  {m.lastCrawledAt ? `${Math.round((Date.now() - new Date(m.lastCrawledAt).getTime()) / 60000)}m ago` : 'Never'}
                </span>
                <span className="text-xs text-slate-500">{m.totalResponses} responses</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Eye className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-xs">No models registered yet</p>
          </div>
        )}
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Processing Queue
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{data.queue.unprocessedChanges}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">Unprocessed Changes</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.queue.proposedReports}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">Proposed Reports</div>
            </div>
          </div>
        </div>

        {/* Recent Changes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Latest Changes
            <span className="ml-auto text-[10px] text-slate-500">{data.latestChanges.length} recent</span>
          </h2>
          {data.latestChanges.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {data.latestChanges.map((change) => (
                <div key={change.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${change.isSignal ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 capitalize truncate">{change.changeType} — {change.category}</div>
                    <div className="text-[10px] text-slate-500">{change.aiModel} · Score: {change.significanceScore.toFixed(1)}</div>
                  </div>
                  <span className="text-[10px] text-slate-600 flex-shrink-0">
                    {new Date(change.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No changes detected yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          Recent Reports
          <span className="ml-auto text-[10px] text-slate-500">{data.overview.totalReports} total</span>
        </h2>
        {data.recentReports.length > 0 ? (
          <div className="space-y-2">
            {data.recentReports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 truncate">{r.title || r.slug}</div>
                  <div className="text-[10px] text-slate-500">
                    {r.type} · {r.status}
                    {r.editorialScore !== null && ` · Score: ${r.editorialScore}`}
                    · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                {r.status === 'published' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-xs">No reports yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
