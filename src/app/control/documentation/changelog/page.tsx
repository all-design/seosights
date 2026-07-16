'use client'

import { useEffect, useState } from 'react'
import {
  FileClock, RefreshCw, Plus, Wrench, AlertTriangle,
  ArrowRight, Clock, GitBranch, Filter, CheckCircle2,
  XCircle, Database, Code, Zap, Tag, Eye, Shield,
  Layers, Flame, Rocket,
} from 'lucide-react'

// ─── Types (matching FactoryChangelog Prisma model) ─────────

interface ChangelogEntry {
  id: string
  version: string
  title: string
  description: string | null
  type: string  // feature | fix | improvement | breaking | security
  engine: string | null
  prUrl: string | null
  deployedAt: string | null
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────

type ChangeType = 'feature' | 'fix' | 'improvement' | 'breaking' | 'security'
type FilterType = 'all' | ChangeType

function typeConfig(type: string) {
  switch (type) {
    case 'feature': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: Plus, label: 'Feature' }
    case 'fix': return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Wrench, label: 'Fix' }
    case 'improvement': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: Zap, label: 'Improvement' }
    case 'breaking': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: AlertTriangle, label: 'Breaking' }
    case 'security': return { color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20', icon: Shield, label: 'Security' }
    default: return { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/20', icon: Code, label: type }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Main Component ──────────────────────────────────────

export default function ChangelogEnginePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

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

  // Changelog entries from API
  const changelog: ChangelogEntry[] = data?.factory?.recentChangelogs ?? data?.factory?.changelogs ?? []

  // Derive stats from real data
  const totalEntries = changelog.length
  const features = changelog.filter(e => e.type === 'feature').length
  const fixes = changelog.filter(e => e.type === 'fix').length
  const breaking = changelog.filter(e => e.type === 'breaking').length

  // Group by version
  const byVersion: Record<string, ChangelogEntry[]> = {}
  for (const entry of changelog) {
    const ver = entry.version || 'unversioned'
    if (!byVersion[ver]) byVersion[ver] = []
    byVersion[ver].push(entry)
  }
  const versionEntries = Object.entries(byVersion)
  const latestVersion = versionEntries.length > 0 ? versionEntries[0][0] : '—'
  const firstVersion = versionEntries.length > 0 ? versionEntries[versionEntries.length - 1][0] : '—'

  // Filter
  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'feature', label: 'Features' },
    { key: 'fix', label: 'Fixes' },
    { key: 'improvement', label: 'Improvements' },
    { key: 'breaking', label: 'Breaking' },
    { key: 'security', label: 'Security' },
  ]

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <FileClock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Changelog Engine™</h1>
            <p className="text-slate-400 text-sm">Every deploy writes history</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Auto-tracking</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-900 border border-amber-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <GitBranch className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{totalEntries}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Entries Tracked</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Tag className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{Object.keys(byVersion).length}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Versions</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{features}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Features</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{breaking}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Breaking Changes</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Filter Bar
          ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-slate-400 mr-1">Filter:</span>
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setActiveFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === opt.key
                ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Version Groups / Entry List
          ═══════════════════════════════════════════════════════ */}
      {changelog.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <FileClock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No changelog entries yet</p>
          <p className="text-[11px] text-slate-500 mt-1">Changelog entries will appear after deployments. The factory pipeline automatically records each change.</p>
        </div>
      ) : versionEntries.length > 0 ? (
        <div className="space-y-4 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
          {versionEntries.map(([version, entries]) => {
            const filteredEntries = activeFilter === 'all'
              ? entries
              : entries.filter(e => e.type === activeFilter)

            if (filteredEntries.length === 0) return null

            const versionHasBreaking = entries.some(e => e.type === 'breaking')
            const versionHasSecurity = entries.some(e => e.type === 'security')
            const latestDeploy = entries.find(e => e.deployedAt)?.deployedAt ?? entries[0]?.createdAt

            return (
              <div
                key={version}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200"
              >
                {/* Version header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-white">{version}</span>
                      {latestDeploy && (
                        <span className="ml-2 text-xs text-slate-500">
                          {new Date(latestDeploy).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {versionHasBreaking && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-red-500/15 text-red-400 border-red-500/20">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Breaking
                      </span>
                    )}
                    {versionHasSecurity && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-purple-500/15 text-purple-400 border-purple-500/20">
                        <Shield className="w-2.5 h-2.5" />
                        Security
                      </span>
                    )}
                    {!versionHasBreaking && !versionHasSecurity && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Safe Update
                      </span>
                    )}
                  </div>
                </div>

                {/* Entry list */}
                <div className="space-y-2">
                  {filteredEntries.map((entry) => {
                    const config = typeConfig(entry.type)
                    const TypeIcon = config.icon
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                          <TypeIcon className={`w-3 h-3 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-200">{entry.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.color} border ${config.border}`}>
                              {config.label}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{entry.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                            {entry.engine && (
                              <span className="capitalize">{entry.engine}</span>
                            )}
                            {entry.deployedAt && (
                              <span>Deployed {timeAgo(entry.deployedAt)}</span>
                            )}
                            {entry.prUrl && (
                              <a href={entry.prUrl} className="text-cyan-500 hover:text-cyan-400" target="_blank" rel="noreferrer">
                                PR →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════════
          5. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Latest version: <span className="text-slate-300">{latestVersion}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Total entries: <span className="text-slate-300">{totalEntries}</span></span>
        <span className="text-slate-700">|</span>
        <span>Versions: <span className="text-slate-300">{Object.keys(byVersion).length}</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-amber-400" />
          <span>Source: <span className="text-amber-400">Factory Changelog Engine</span></span>
        </div>
      </div>
    </div>
  )
}
