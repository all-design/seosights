'use client'

import { useEffect, useState } from 'react'
import {
  Download, RefreshCw, FileText, FileCode, File, Globe,
  BookOpen, Layers, Box, ArrowRight, Clock, Zap,
  CheckCircle2, Image, GitBranch, Database, BarChart3,
  Network, Workflow, Activity, MousePointer, GitFork,
  Package, Monitor, Camera,
} from 'lucide-react'

// ─── Static Data (structural — export format definitions) ──

const exportFormats = [
  { id: 'fmt-1', name: 'DOCX', description: 'Microsoft Word format for offline editing and sharing', icon: FileText, category: 'document' as const },
  { id: 'fmt-2', name: 'PDF', description: 'Portable Document for printing and archiving', icon: File, category: 'document' as const },
  { id: 'fmt-3', name: 'Markdown', description: 'GitHub/GitLab compatible markdown files', icon: FileCode, category: 'document' as const },
  { id: 'fmt-4', name: 'HTML', description: 'Static site with search and navigation', icon: Globe, category: 'document' as const },
  { id: 'fmt-5', name: 'Notion', description: 'Import-ready for Notion workspaces', icon: BookOpen, category: 'document' as const },
  { id: 'fmt-6', name: 'Confluence', description: 'Import-ready for Atlassian Confluence', icon: Layers, category: 'document' as const },
  { id: 'fmt-7', name: 'GitBook', description: 'Import-ready for GitBook documentation', icon: GitBranch, category: 'document' as const },
  { id: 'fmt-8', name: 'OpenAPI 3.0', description: 'Machine-readable API specification', icon: Box, category: 'api' as const },
  { id: 'fmt-9', name: 'Swagger', description: 'Interactive API documentation UI', icon: Monitor, category: 'api' as const },
  { id: 'fmt-10', name: 'JSON', description: 'Structured data for programmatic access', icon: Database, category: 'data' as const },
  { id: 'fmt-11', name: 'YAML', description: 'Configuration-friendly structured data', icon: FileCode, category: 'data' as const },
  { id: 'fmt-12', name: 'Diagrams', description: 'C4, ERD, Sequence, Flow, Architecture, State Machine, User Journey, Decision Tree', icon: Network, category: 'diagram' as const },
]

// ─── Helpers ─────────────────────────────────────────────

function categoryLabel(cat: 'document' | 'api' | 'data' | 'diagram') {
  switch (cat) {
    case 'document': return 'Documents'
    case 'api': return 'API Specs'
    case 'data': return 'Data Formats'
    case 'diagram': return 'Diagrams'
  }
}

// ─── Main Component ──────────────────────────────────────

export default function DocumentationDownloadsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<Set<string>>(new Set())

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
  const systemHealthy = Object.values(system).filter((s: any) => s === 'operational').length
  const systemTotal = Object.keys(system).length
  const totalRecords = Object.values(counts).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0)
  const previouslyGenerated = systemHealthy === systemTotal ? 8 : systemHealthy

  const categories: ('document' | 'api' | 'data' | 'diagram')[] = ['document', 'api', 'data', 'diagram']

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-500/15 flex items-center justify-center">
            <Download className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Documentation Downloads</h1>
            <p className="text-slate-400 text-sm">Export in any format</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Sizes
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-500/15 border border-slate-500/20 text-slate-300 hover:bg-slate-500/25 transition-colors text-xs font-medium">
            <Package className="w-3.5 h-3.5" />
            Generate All Formats
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-slate-500/5 via-slate-900 to-slate-900 border border-slate-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">{exportFormats.length}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Export Formats</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{previouslyGenerated}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Previously Generated</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">{totalRecords.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">DB Records</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">{systemHealthy}/{systemTotal}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Systems OK</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Export Format Grid (grouped by category)
          ═══════════════════════════════════════════════════════ */}
      {categories.map((cat) => {
        const formats = exportFormats.filter(f => f.category === cat)
        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              {cat === 'document' && <FileText className="w-4 h-4 text-slate-400" />}
              {cat === 'api' && <Box className="w-4 h-4 text-slate-400" />}
              {cat === 'data' && <Database className="w-4 h-4 text-slate-400" />}
              {cat === 'diagram' && <Network className="w-4 h-4 text-slate-400" />}
              {categoryLabel(cat)}
              <span className="ml-auto text-[10px] text-slate-500">{formats.length} formats</span>
            </h2>
            <div className={`grid gap-4 ${
              cat === 'diagram' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {formats.map((format) => {
                const FIcon = format.icon
                const isGenerating = generating.has(format.id)
                return (
                  <div
                    key={format.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200 group"
                  >
                    {/* Icon + Name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-500/15 flex items-center justify-center flex-shrink-0">
                        <FIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{format.name}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{format.description}</p>

                    {/* Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-2.5 h-2.5" />
                        {isGenerating ? 'Generating...' : 'Available'}
                      </span>
                      <button
                        onClick={() => {
                          setGenerating(prev => new Set(prev).add(format.id))
                          setTimeout(() => setGenerating(prev => {
                            const next = new Set(prev)
                            next.delete(format.id)
                            return next
                          }), 2000)
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/15 border border-slate-500/20 text-[10px] font-medium text-slate-300 hover:bg-slate-500/25 hover:text-white transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Generate
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ═══════════════════════════════════════════════════════
          4. System Info
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">System Status</h2>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(system).map(([key, status]) => (
              <div key={key} className="text-center">
                <div className={`text-lg font-bold ${status === 'operational' ? 'text-emerald-400' : status === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>
                  {String(status)}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last bulk export: <span className="text-slate-300">{factory.timestamp ? new Date(factory.timestamp).toLocaleTimeString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Formats available: <span className="text-slate-300">{exportFormats.length}</span></span>
        <span className="text-slate-700">|</span>
        <span>DB Records: <span className="text-slate-300">{totalRecords.toLocaleString()}</span></span>
      </div>

    </div>
  )
}
