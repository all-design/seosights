'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2,
  ChevronRight, Clock, Scan, Layers, GitBranch, Box, Network,
  ArrowRight, Zap, FileText, Code2, Database, Webhook, TestTube,
  Palette, Eye, Package, Globe, Sparkles, History, Activity,
  Bot, CalendarClock, Search, XCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface DocCategory {
  id: string
  label: string
  icon: React.ElementType
  description: string
  href: string
}

// ─── Static Data ─────────────────────────────────────────

const docCategories: DocCategory[] = [
  { id: 'api', label: 'API Docs', icon: Webhook, description: 'Auto-generated API documentation from route handlers', href: '/control/documentation/api' },
  { id: 'design-system', label: 'Design System', icon: Palette, description: 'Component docs & design tokens', href: '/control/documentation/design-system' },
  { id: 'database', label: 'Database Schema', icon: Database, description: 'Prisma models & migration status', href: '/control/documentation/database' },
  { id: 'changelog', label: 'Changelog', icon: History, description: 'Release history & breaking changes', href: '/control/documentation/changelog' },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network, description: 'System dependency & relationship map', href: '/control/documentation/knowledge-graph' },
  { id: 'product', label: 'Product Docs', icon: Package, description: 'Feature documentation & acceptance criteria', href: '/control/documentation/product' },
  { id: 'qa', label: 'QA Docs', icon: TestTube, description: 'Test documentation & coverage maps', href: '/control/documentation/qa' },
  { id: 'downloads', label: 'Downloads', icon: Globe, description: 'Export docs in any format', href: '/control/documentation/downloads' },
  { id: 'technical', label: 'Technical Docs', icon: FileText, description: 'Architecture records & component docs', href: '/control/documentation/technical' },
  { id: 'copilot', label: 'AI Copilot', icon: Bot, description: 'Ask anything about the codebase', href: '/control/documentation/copilot' },
]

// ─── Main Component ──────────────────────────────────────

export default function DocumentationHubPage() {
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
  const changelog = factory.recentChangelogs || []
  const counts = factory.counts || {}
  const system = factory.system || {}
  const aiProviders = factory.aiProviders || { configured: [], available: [], using: 'rule-based-fallback' }

  const totalDocs = Object.values(counts).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0)
  const knowledgeScore = totalDocs > 0 ? Math.min(99, Math.round(70 + (totalDocs / 500) * 29)) : 0
  const systemHealthy = Object.values(system).filter((s: any) => s === 'operational').length
  const systemTotal = Object.keys(system).length

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Documentation Hub™</h1>
            <p className="text-slate-400 text-sm">Auto-generated, always current</p>
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
          2. Knowledge Score Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-500/5 via-slate-900 to-slate-900 border border-emerald-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="flex-shrink-0">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={58} fill="none" stroke="#1e293b" strokeWidth={8} />
                <circle cx={70} cy={70} r={58} fill="none" stroke="#34d399" strokeWidth={8} strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - knowledgeScore / 100)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">{knowledgeScore}</span>
                <span className="text-[10px] text-slate-500">Knowledge</span>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{docCategories.length}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Doc Categories</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{changelog.length}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Changelog Entries</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{systemHealthy}/{systemTotal}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Systems Healthy</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">{aiProviders.configured?.length || 0}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Providers</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Doc Category Cards
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Documentation Sections
          <span className="ml-auto text-[10px] text-slate-400">{docCategories.length} sections</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {docCategories.map((cat) => {
            const CatIcon = cat.icon
            return (
              <a
                key={cat.id}
                href={cat.href}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 group block"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <CatIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-white">{cat.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{cat.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] text-emerald-400 group-hover:text-emerald-300">
                  <span>Open</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Recent Changelog
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          Recent Changelog
          <a href="/control/documentation/changelog" className="ml-auto text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </a>
        </h2>
        {changelog.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No changelog entries yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Changelog entries will appear after deployments</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {changelog.slice(0, 5).map((entry: any) => (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{entry.version}</span>
                      {entry.breaking?.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border bg-red-500/15 text-red-400 border-red-500/20">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Breaking
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {entry.added?.length || 0} added · {entry.fixed?.length || 0} fixed
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {entry.releaseDate ? new Date(entry.releaseDate).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. System Health
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          System Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(system).map(([key, status]) => {
            const isOk = status === 'operational'
            const isDegraded = status === 'degraded'
            return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {isOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                   isDegraded ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> :
                   <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span className={`text-xs font-medium ${isOk ? 'text-emerald-400' : isDegraded ? 'text-amber-400' : 'text-red-400'}`}>
                    {String(status)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Last scan: <span className="text-slate-300">{data?.factory?.timestamp ? new Date(data.factory.timestamp).toLocaleTimeString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-emerald-400" />
          <span>Changelog entries: <span className="text-slate-300">{changelog.length}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Knowledge Score: <span className="text-emerald-400">{knowledgeScore}</span></span>
        <span className="text-slate-700">|</span>
        <span>AI Mode: <span className="text-cyan-400">{aiProviders.using === 'live-llm' ? 'Live LLM' : 'Rule-based'}</span></span>
      </div>

    </div>
  )
}
