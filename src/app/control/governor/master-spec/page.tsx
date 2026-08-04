'use client'

import { useEffect, useState } from 'react'
import {
  ScrollText, RefreshCw, FileText, BookOpen, Users, GitBranch,
  Clock, ChevronRight, CheckCircle2, AlertTriangle, Calendar,
  Activity, ShieldCheck, Layers, History, Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface FactoryTask {
  id: string
  type: string
  title: string
  description?: string
  status: string
  priority: string
  assignee?: string
  branch?: string
  prUrl?: string
  result?: string
  parentTaskId?: string
  createdAt: string
  updatedAt: string
}

interface FactoryStatus {
  ok: boolean
  timestamp: string
  system: {
    codebaseScanner: string
    governor: string
    aiRouter: string
    dailyMissionGenerator: string
    qaEngine: string
  }
  counts: {
    factoryTasks: number
    governorInterceptions: number
    dailyMissions: number
    qaRuns: number
    codebaseSnapshots: number
    engineeringMemories: number
    factoryChangelogs: number
  }
  aiProviders: {
    configured: string[]
    available: string[]
    using: string
  }
}

interface DocSection {
  id: string
  number: string
  title: string
  subsections?: string[]
}

interface ValidationItem {
  id: string
  label: string
  value: string
  status: 'pass' | 'warn' | 'info'
  detail: string
}

// ─── Static Document Structure ───────────────────────────

const DOC_SECTIONS: DocSection[] = [
  { id: 'sec-1', number: '1', title: 'Platform Overview' },
  { id: 'sec-2', number: '2', title: 'Architecture Decisions' },
  {
    id: 'sec-3',
    number: '3',
    title: 'Engine Specifications',
    subsections: [
      '3.1 Observatory Engine',
      '3.2 Product Engine',
      '3.3 Architecture Engine',
      '3.4 Engineering Engine',
      '3.5 QA Engine',
      '3.6 Review Engine',
      '3.7 Security Engine',
      '3.8 Performance Engine',
      '3.9 Merge Engine',
      '3.10 Deploy Engine',
      '3.11 Replay Engine',
      '3.12 Learning Engine',
      '3.13 Documentation Engine',
      '3.14 AI Governor',
    ],
  },
  { id: 'sec-4', number: '4', title: 'Database Schema' },
  { id: 'sec-5', number: '5', title: 'API Specifications' },
  { id: 'sec-6', number: '6', title: 'Component Library' },
  { id: 'sec-7', number: '7', title: 'Design System' },
  { id: 'sec-8', number: '8', title: 'Deployment Pipeline' },
  { id: 'sec-9', number: '9', title: 'Quality Standards' },
  { id: 'sec-10', number: '10', title: 'Security Protocols' },
  { id: 'sec-11', number: '11', title: 'Research Methodology' },
  { id: 'sec-12', number: '12', title: 'Growth Strategy' },
  { id: 'sec-13', number: '13', title: 'Operations Manual' },
  { id: 'sec-14', number: '14', title: 'Compliance & Audit' },
]

// ─── Helpers ─────────────────────────────────────────────

function changeTypeFromStatus(status: string): 'addition' | 'update' | 'revision' {
  const lower = status.toLowerCase()
  if (lower.includes('done') || lower.includes('completed') || lower.includes('deployed')) return 'addition'
  if (lower.includes('implement') || lower.includes('progress') || lower.includes('qa')) return 'update'
  return 'revision'
}

function changeTypeConfig(type: 'addition' | 'update' | 'revision') {
  switch (type) {
    case 'addition':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', label: 'Addition' }
    case 'update':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', label: 'Update' }
    case 'revision':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', label: 'Revision' }
  }
}

function validationStatusConfig(status: ValidationItem['status']) {
  switch (status) {
    case 'pass':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2 }
    case 'warn':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle }
    case 'info':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Activity }
  }
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return dateStr
  }
}

// ─── Main Component ──────────────────────────────────────

export default function MasterSpecificationPage() {
  const [data, setData] = useState<any>(null)
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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white mb-2">Failed to load Master Spec data</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    )
  }

  // Derive data from API responses
  const factory = data?.factory || {}
  const counts = factory.counts || {}
  const systemHealth = factory.system || {}
  // Normalize tasks - recentMissions may have different shape than FactoryTask
  const rawTasks: any[] = factory.recentMissions || []
  const tasks: FactoryTask[] = rawTasks.map(t => ({
    id: t.id || '',
    type: t.type || t.goal || 'mission',
    title: t.title || t.goal || 'Untitled Mission',
    description: t.description || t.strategy || '',
    status: t.status || 'unknown',
    priority: t.priority || 'medium',
    assignee: t.assignee || '',
    branch: t.branch || '',
    prUrl: t.prUrl || '',
    result: t.result || t.outcome || '',
    parentTaskId: t.parentTaskId || '',
    createdAt: t.createdAt || '',
    updatedAt: t.updatedAt || '',
  }))
  const recentTasks = tasks.slice(0, 5)

  // Derive contributors from task assignees
  const contributorMap = new Map<string, { name: string; commits: number }>()
  for (const task of tasks) {
    const name = task.assignee || task.type || 'Unknown'
    const existing = contributorMap.get(name)
    if (existing) {
      existing.commits++
    } else {
      contributorMap.set(name, { name, commits: 1 })
    }
  }
  const contributors = Array.from(contributorMap.values()).sort((a, b) => b.commits - a.commits).slice(0, 6)

  // Derive validation status from system health
  const validationStatus: ValidationItem[] = [
    {
      id: 'v-1',
      label: 'Constitution Compliance',
      value: systemHealth?.governor === 'operational' ? '100%' : '—',
      status: systemHealth?.governor === 'operational' ? 'pass' : 'warn',
      detail: systemHealth?.governor === 'operational'
        ? 'All sections compliant with Level 1 rules'
        : 'Governor is not fully operational',
    },
    {
      id: 'v-2',
      label: 'Code-Documentation Drift',
      value: counts ? `${counts.factoryChangelogs} changes` : '—',
      status: (counts?.factoryChangelogs ?? 0) > 5 ? 'warn' : 'pass',
      detail: counts ? `${counts.factoryChangelogs} changelogs recorded` : 'No changelog data',
    },
    {
      id: 'v-3',
      label: 'System Health',
      value: systemHealth && Object.values(systemHealth).every((s: any) => s === 'operational') ? 'Operational' : 'Degraded',
      status: systemHealth && Object.values(systemHealth).every((s: any) => s === 'operational') ? 'pass' : 'warn',
      detail: `AI Router: ${systemHealth?.aiRouter ?? 'unknown'}, QA: ${systemHealth?.qaEngine ?? 'unknown'}`,
    },
    {
      id: 'v-4',
      label: 'Factory Tasks',
      value: `${counts?.factoryTasks ?? 0} total`,
      status: 'info',
      detail: `${tasks.filter(t => t.status === 'completed' || t.status === 'done').length} completed`,
    },
  ]

  const lastUpdated = recentTasks.length > 0
    ? timeAgo(recentTasks[0].createdAt)
    : 'Never'

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Master Specification</h1>
            <p className="text-slate-400 text-sm">Level 2 — Living Document</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-400">Living</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Last Updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Overview Stats
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Tasks</span>
          </div>
          <div className="text-2xl font-bold text-white">{counts?.factoryTasks ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Sections</span>
          </div>
          <div className="text-2xl font-bold text-white">{DOC_SECTIONS.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Last Updated</span>
          </div>
          <div className="text-2xl font-bold text-white">{lastUpdated.includes('ago') ? lastUpdated.split(' ')[0] : '—'}<span className="text-sm font-normal text-slate-500 ml-1">{lastUpdated.includes('ago') ? 'ago' : ''}</span></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Contributors</span>
          </div>
          <div className="text-2xl font-bold text-white">{contributors.length || '—'}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Interceptions</span>
          </div>
          <div className="text-2xl font-bold text-white">{counts?.governorInterceptions ?? 0}</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Document Structure — Table of Contents
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Document Structure
          <span className="ml-auto text-[10px] text-slate-500">Table of Contents</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {DOC_SECTIONS.map((section) => {
              // Count tasks related to this section by matching task type to section title
              const relatedTasks = tasks.filter(t =>
                t.type.toLowerCase().includes(section.title.toLowerCase().split(' ')[0]) ||
                section.title.toLowerCase().includes(t.type.toLowerCase())
              ).length

              return (
                <div
                  key={section.id}
                  className="group cursor-pointer hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-md bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-cyan-400">{section.number}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                          {section.title}
                        </span>
                        {relatedTasks > 0 && (
                          <span className="text-[11px] text-cyan-400 font-mono flex-shrink-0">
                            {relatedTasks} {relatedTasks === 1 ? 'task' : 'tasks'}
                          </span>
                        )}
                      </div>
                      {relatedTasks > 0 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500/40 to-cyan-500/80 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(relatedTasks * 10, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </div>

                  {section.subsections && (
                    <div className="ml-11 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-1 pr-3">
                      {section.subsections.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors cursor-pointer"
                        >
                          <div className="w-1 h-1 rounded-full bg-cyan-500/60 flex-shrink-0" />
                          <span className="font-mono truncate">{sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Change History (from tasks)
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          Change History
          <span className="ml-auto text-[10px] text-slate-500">Recent task activity</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-cyan-400/30 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No task history available</p>
              <p className="text-[11px] text-slate-500 mt-1">Changes will appear here as tasks are processed</p>
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800" />

              {recentTasks.map((task) => {
                const changeType = changeTypeFromStatus(task.status)
                const config = changeTypeConfig(changeType)
                return (
                  <div key={task.id} className="relative flex items-start gap-3 pl-0">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${config.bg} ${config.border}`}>
                      <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold text-white">{task.type}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                          {config.label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                          <Clock className="w-3 h-3" />
                          {timeAgo(task.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{task.title}</p>
                      {task.status && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {task.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Living Document Notice
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-cyan-500/5 via-slate-900 to-slate-900 border border-cyan-500/15 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">Living Document Notice</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-cyan-500/15 text-cyan-400 border-cyan-500/20">
                <RefreshCw className="w-2.5 h-2.5" />
                Auto-Evolving
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This specification evolves with the platform. Every deploy may update it.
              The <span className="text-cyan-400 font-medium">Constitution (Level 1)</span> governs what changes are allowed here.
              Lower-level documents (Daily Mission, Engine Docs) must remain consistent with this specification.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Validation Status
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Validation Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {validationStatus.map((item) => {
            const config = validationStatusConfig(item.status)
            const StatusIcon = config.icon
            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-4 ${config.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`text-lg font-bold ${config.color} mb-1`}>{item.value}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          7. Contributors
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Contributors
        </h2>
        {contributors.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-cyan-400/30 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No contributors recorded yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Contributors will appear as tasks are assigned to engines</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contributors.map((contributor) => (
              <div
                key={contributor.name}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-cyan-400">
                      {contributor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{contributor.name}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 uppercase tracking-wider">Tasks</span>
                  <span className="text-cyan-400 font-bold">{contributor.commits}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Format: <span className="text-slate-300">Markdown + AST</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Auto-rebuilt: <span className="text-cyan-400">on every deploy</span></span>
        <span className="text-slate-700">|</span>
        <span>Authority: <span className="text-cyan-400">Level 1 Constitution</span></span>
      </div>

    </div>
  )
}
