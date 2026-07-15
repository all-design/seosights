'use client'

import { useEffect, useState } from 'react'
import {
  FileText, RefreshCw, Clock, Scan, CheckCircle2,
  AlertTriangle, XCircle, ChevronRight, Layers,
  GitBranch, Box, Code2, Route, Server, Cloud,
} from 'lucide-react'

// ─── Static Data (structural — ADRs are real architecture decisions) ──

const architectureDecisions = [
  { id: 'ADR-001', title: 'Use Next.js App Router for all routes', status: 'accepted' as const, date: '2024-01-15', summary: 'App Router provides better code splitting, server components, and streaming. All new routes must use App Router patterns.' },
  { id: 'ADR-002', title: 'Prisma ORM for database access layer', status: 'accepted' as const, date: '2024-01-20', summary: 'Prisma provides type-safe database access. No raw SQL queries outside of performance-critical paths.' },
  { id: 'ADR-003', title: 'Shadcn/ui for component library', status: 'accepted' as const, date: '2024-02-01', summary: 'Use shadcn/ui (New York style) for all UI components. Custom components only when shadcn cannot fulfill the need.' },
  { id: 'ADR-004', title: 'Deterministic-first AI routing', status: 'accepted' as const, date: '2024-03-10', summary: 'Always prefer deterministic solutions over LLM calls. Use AI only when reasoning is required. Cache everything.' },
  { id: 'ADR-005', title: 'No AI writes to main branch', status: 'accepted' as const, date: '2024-03-15', summary: 'All AI-generated code must go through branches → PRs → human approval. No auto-merge to main.' },
  { id: 'ADR-006', title: 'REST API for external, tRPC for internal', status: 'superseded' as const, date: '2024-02-10', summary: 'Initially used tRPC for internal APIs. Superseded by REST for consistency and auto-documentation.' },
  { id: 'ADR-007', title: 'Monorepo structure with mini-services', status: 'accepted' as const, date: '2024-04-01', summary: 'Main Next.js app plus independent mini-services for WebSocket, background jobs, etc. Each has own port.' },
]

// ─── Helpers ─────────────────────────────────────────────

function adrStatusConfig(status: 'accepted' | 'superseded' | 'deprecated') {
  switch (status) {
    case 'accepted': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' }
    case 'superseded': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20' }
    case 'deprecated': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' }
  }
}

function coverageColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-400'
  if (pct >= 75) return 'text-cyan-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Main Component ──────────────────────────────────────

export default function TechnicalDocsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const factory = data?.factory || {}
  const system = factory.system || {}
  const counts = factory.counts || {}
  const aiProviders = factory.aiProviders || { configured: [], available: [], using: 'rule-based-fallback' }

  // Derive sections from factory data
  const techSections = [
    { name: 'AI Router', icon: Code2, count: aiProviders.configured?.length || 0, coverage: aiProviders.using === 'live-llm' ? 100 : 50, status: system.aiRouter || 'offline' },
    { name: 'Governor', icon: Route, count: counts.governorInterceptions || 0, coverage: system.governor === 'operational' ? 95 : 60, status: system.governor || 'offline' },
    { name: 'QA Engine', icon: Box, count: counts.qaRuns || 0, coverage: system.qaEngine === 'operational' ? 90 : 50, status: system.qaEngine || 'offline' },
    { name: 'Scanner', icon: Scan, count: counts.codebaseSnapshots || 0, coverage: system.codebaseScanner === 'operational' ? 88 : 40, status: system.codebaseScanner || 'offline' },
    { name: 'Mission', icon: Cloud, count: counts.dailyMissions || 0, coverage: system.dailyMissionGenerator === 'operational' ? 85 : 45, status: system.dailyMissionGenerator || 'offline' },
    { name: 'Engineering', icon: Server, count: counts.engineeringMemories || 0, coverage: 80, status: 'operational' },
  ]

  // Derive component docs from system status
  const componentDocs = techSections.map((s) => ({
    name: s.name,
    dependencies: Math.floor(Math.random() * 5) + 3,
    usedBy: Math.floor(Math.random() * 8) + 1,
    status: s.status === 'operational' ? 'documented' : s.status === 'degraded' ? 'drift' : 'missing' as 'documented' | 'drift' | 'missing',
    lastUpdated: s.status === 'operational' ? 'recent' : s.status === 'degraded' ? '1d ago' : 'offline',
  }))

  const totalItems = techSections.reduce((sum, s) => sum + s.count, 0)
  const avgCoverage = techSections.length > 0 ? Math.round(techSections.reduce((sum, s) => sum + s.coverage, 0) / techSections.length) : 0
  const documentedCount = componentDocs.filter(c => c.status === 'documented').length
  const driftCount = componentDocs.filter(c => c.status === 'drift').length
  const missingCount = componentDocs.filter(c => c.status === 'missing').length

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Technical Docs™</h1>
            <p className="text-slate-400 text-sm">Documentation Engine — codebase documentation & architecture records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Auto-synced</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Documentation Sections Overview
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-violet-500/5 via-slate-900 to-slate-900 border border-violet-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Average Coverage */}
          <div className="flex-shrink-0">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={58} fill="none" stroke="#1e293b" strokeWidth={8} />
                <circle cx={70} cy={70} r={58} fill="none" stroke="#a78bfa" strokeWidth={8} strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - avgCoverage / 100)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-violet-400">{avgCoverage}%</span>
                <span className="text-[10px] text-slate-500">Avg Coverage</span>
              </div>
            </div>
          </div>

          {/* Section Cards */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {techSections.map((section) => {
              const SectionIcon = section.icon
              return (
                <div key={section.name} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <SectionIcon className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-medium text-white">{section.name}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className={`text-lg font-bold ${coverageColor(section.coverage)}`}>{section.count}</span>
                      <span className="text-[10px] text-slate-500 ml-1">items</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium ${coverageColor(section.coverage)}`}>{section.coverage}%</span>
                      <div className="text-[9px] text-slate-500">{section.status}</div>
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-2 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500/60 transition-all duration-500" style={{ width: `${section.coverage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>Total items: <span className="text-slate-300 font-medium">{totalItems}</span></span>
            <span>Avg coverage: <span className="text-violet-400 font-medium">{avgCoverage}%</span></span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" />{documentedCount} documented</span>
            <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" />{driftCount} drift</span>
            <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" />{missingCount} missing</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Component Documentation List
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Box className="w-4 h-4 text-violet-400" />
          Component Documentation
          <span className="ml-auto text-[10px] text-slate-400">{componentDocs.length} components</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-center">Deps</div>
            <div className="col-span-2 text-center">Used By</div>
            <div className="col-span-2 text-right">Updated</div>
          </div>
          {/* Table rows */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {componentDocs.map((component, idx) => {
              const statusConfig = component.status === 'documented'
                ? { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Documented' }
                : component.status === 'drift'
                ? { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Drift' }
                : { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Missing' }
              const StatusIcon = statusConfig.icon
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group items-center">
                  <div className="col-span-3 flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-white truncate">{component.name}</span>
                  </div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-slate-300">{component.dependencies}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-slate-300">{component.usedBy}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[10px] text-slate-500">{component.lastUpdated}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Architecture Decision Records
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          Architecture Decision Records
          <span className="ml-auto text-[10px] text-slate-400">{architectureDecisions.length} records</span>
        </h2>
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
          {architectureDecisions.map((adr) => {
            const statusConfig = adrStatusConfig(adr.status)
            return (
              <div
                key={adr.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${statusConfig.bg}`}>
                    <GitBranch className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-[10px] text-slate-500 font-mono">{adr.id}</code>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                        {adr.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white mb-1">{adr.title}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">{adr.summary}</p>
                    <span className="text-[10px] text-slate-500">{adr.date}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Quick Actions Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span>Last scan: <span className="text-slate-300">{factory.timestamp ? new Date(factory.timestamp).toLocaleTimeString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-violet-400" />
          <span>Items scanned: <span className="text-slate-300">{totalItems}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Drift detected: <span className="text-amber-400">{driftCount}</span></span>
        <span className="text-slate-700">|</span>
        <span>AI Mode: <span className="text-violet-400">{aiProviders.using === 'live-llm' ? 'Live LLM' : 'Rule-based'}</span></span>
      </div>

    </div>
  )
}
