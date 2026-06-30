'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  FileClock, RefreshCw, Plus, Wrench, AlertTriangle,
  ArrowRight, Clock, GitBranch, Filter, CheckCircle2,
  XCircle, Database, Code, Zap, Tag, ChevronDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type ChangeCategory = 'added' | 'fixed' | 'breaking' | 'migration'

interface ChangeEntry {
  text: string
}

interface Release {
  id: string
  version: string
  date: string
  added: ChangeEntry[]
  fixed: ChangeEntry[]
  breaking: ChangeEntry[]
  migration: ChangeEntry[]
}

type FilterType = 'all' | 'added' | 'fixed' | 'breaking'

// ─── Mock Data ───────────────────────────────────────────

const releases: Release[] = [
  {
    id: 'rel-1',
    version: 'v0.9.12',
    date: 'Today',
    added: [
      { text: 'Documentation Engine — Copilot, Changelog, Downloads' },
      { text: 'AI Copilot™ — Query codebase with natural language' },
    ],
    fixed: [
      { text: 'QA pipeline timeout on large test suites' },
      { text: 'Changelog entries missing commit references' },
    ],
    breaking: [],
    migration: [],
  },
  {
    id: 'rel-2',
    version: 'v0.9.11',
    date: '2 days ago',
    added: [
      { text: 'Engineering Memory™ — Persistent context across sessions' },
      { text: 'Knowledge Score™ — Quantified learning tracking' },
    ],
    fixed: [
      { text: 'AI Router fallback logic selecting wrong model' },
      { text: 'Memory leak in Growth Engine event listener' },
    ],
    breaking: [],
    migration: [
      { text: 'Run `bun run db:push` to add EngineeringMemory table' },
    ],
  },
  {
    id: 'rel-3',
    version: 'v0.9.10',
    date: '5 days ago',
    added: [
      { text: 'AI Cost Dashboard — Real-time spending tracking' },
      { text: 'Task hash caching — 40% faster repeated builds' },
    ],
    fixed: [
      { text: 'Memory leak in Growth Engine session handler' },
      { text: 'Deploy rollback failing on partial deploys' },
    ],
    breaking: [
      { text: 'API response format changed for /api/growth — `metrics` field now nested under `data`' },
    ],
    migration: [
      { text: 'Required — Update all Growth API consumers to use `data.metrics`' },
      { text: 'Run `bun run db:push` for schema migration' },
    ],
  },
  {
    id: 'rel-4',
    version: 'v0.9.9',
    date: '1 week ago',
    added: [
      { text: 'Free AI Mesh™ — Multi-provider AI routing at zero cost' },
      { text: 'Groq integration — Ultra-fast inference for simple tasks' },
    ],
    fixed: [
      { text: 'Security scan false positives on SVG components' },
      { text: 'Scheduler missing cron jobs after server restart' },
    ],
    breaking: [],
    migration: [],
  },
]

// ─── Helpers ─────────────────────────────────────────────

function categoryConfig(category: ChangeCategory) {
  switch (category) {
    case 'added': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: Plus, label: 'Added' }
    case 'fixed': return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Wrench, label: 'Fixed' }
    case 'breaking': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: AlertTriangle, label: 'Breaking' }
    case 'migration': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: Database, label: 'Migration' }
  }
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function ChangelogEnginePage() {
  const mounted = useHydrated()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  if (!mounted) return null

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'added', label: 'Added' },
    { key: 'fixed', label: 'Fixed' },
    { key: 'breaking', label: 'Breaking' },
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
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Commits
          </button>
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
              <span className="text-2xl font-bold text-amber-400">47</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Releases Tracked</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Tag className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">v0.1.0</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">First Release</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">128</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Features Added</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-2xl font-bold text-red-400">3</span>
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === opt.key
                ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-500">Auto-generated from: Deploy Engine + Git commits</span>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Release List
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-4 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
        {releases.map((release) => {
          const categories: { key: ChangeCategory; entries: ChangeEntry[] }[] = [
            { key: 'added', entries: release.added },
            { key: 'fixed', entries: release.fixed },
            { key: 'breaking', entries: release.breaking },
            { key: 'migration', entries: release.migration },
          ]

          const filteredCategories = activeFilter === 'all'
            ? categories
            : categories.filter(c => c.key === activeFilter)

          // Skip releases with no matching entries
          const hasEntries = filteredCategories.some(c => c.entries.length > 0)
          if (!hasEntries && activeFilter !== 'all') return null

          return (
            <div
              key={release.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200"
            >
              {/* Release header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white">{release.version}</span>
                    <span className="ml-2 text-xs text-slate-500">{release.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {release.breaking.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-red-500/15 text-red-400 border-red-500/20">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Breaking
                    </span>
                  )}
                  {release.migration.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-amber-500/15 text-amber-400 border-amber-500/20">
                      <Database className="w-2.5 h-2.5" />
                      Migration
                    </span>
                  )}
                  {release.breaking.length === 0 && release.migration.length === 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Safe Update
                    </span>
                  )}
                </div>
              </div>

              {/* Change sections */}
              <div className="space-y-4">
                {filteredCategories.map(({ key, entries }) => {
                  if (entries.length === 0) return null
                  const config = categoryConfig(key)
                  const CatIcon = config.icon
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-2">
                        <CatIcon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-slate-500">({entries.length})</span>
                      </div>
                      <ul className="space-y-1.5 ml-5.5">
                        {entries.map((entry, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                              key === 'added' ? 'bg-emerald-400' :
                              key === 'fixed' ? 'bg-cyan-400' :
                              key === 'breaking' ? 'bg-red-400' : 'bg-amber-400'
                            }`} />
                            <span className="text-sm text-slate-300">{entry.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Last release: <span className="text-slate-300">Today (v0.9.12)</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Total releases: <span className="text-slate-300">47</span></span>
        <span className="text-slate-700">|</span>
        <span>First release: <span className="text-slate-300">v0.1.0</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-amber-400" />
          <span>Source: <span className="text-amber-400">Deploy Engine + Git commits</span></span>
        </div>
      </div>

    </div>
  )
}
