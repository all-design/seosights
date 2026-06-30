'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  Download, RefreshCw, FileText, FileCode, File, Globe,
  BookOpen, Layers, Box, ArrowRight, Clock, Zap,
  CheckCircle2, Image, GitBranch, Database, BarChart3,
  Network, Workflow, Activity, MousePointer, GitFork,
  Package, Monitor, Camera,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ExportFormat {
  id: string
  name: string
  description: string
  icon: React.ElementType
  sizeEstimate: string
  lastGenerated: string | null
  category: 'document' | 'api' | 'data' | 'diagram'
}

// ─── Mock Data ───────────────────────────────────────────

const exportFormats: ExportFormat[] = [
  { id: 'fmt-1', name: 'DOCX', description: 'Microsoft Word format for offline editing and sharing', icon: FileText, sizeEstimate: '~2.4 MB', lastGenerated: '2h ago', category: 'document' },
  { id: 'fmt-2', name: 'PDF', description: 'Portable Document for printing and archiving', icon: File, sizeEstimate: '~1.8 MB', lastGenerated: '2h ago', category: 'document' },
  { id: 'fmt-3', name: 'Markdown', description: 'GitHub/GitLab compatible markdown files', icon: FileCode, sizeEstimate: '~340 KB', lastGenerated: '1h ago', category: 'document' },
  { id: 'fmt-4', name: 'HTML', description: 'Static site with search and navigation', icon: Globe, sizeEstimate: '~4.2 MB', lastGenerated: '3h ago', category: 'document' },
  { id: 'fmt-5', name: 'Notion', description: 'Import-ready for Notion workspaces', icon: BookOpen, sizeEstimate: '~1.1 MB', lastGenerated: null, category: 'document' },
  { id: 'fmt-6', name: 'Confluence', description: 'Import-ready for Atlassian Confluence', icon: Layers, sizeEstimate: '~1.3 MB', lastGenerated: null, category: 'document' },
  { id: 'fmt-7', name: 'GitBook', description: 'Import-ready for GitBook documentation', icon: GitBranch, sizeEstimate: '~980 KB', lastGenerated: null, category: 'document' },
  { id: 'fmt-8', name: 'OpenAPI 3.0', description: 'Machine-readable API specification', icon: Box, sizeEstimate: '~120 KB', lastGenerated: '45m ago', category: 'api' },
  { id: 'fmt-9', name: 'Swagger', description: 'Interactive API documentation UI', icon: Monitor, sizeEstimate: '~180 KB', lastGenerated: '45m ago', category: 'api' },
  { id: 'fmt-10', name: 'JSON', description: 'Structured data for programmatic access', icon: Database, sizeEstimate: '~520 KB', lastGenerated: '30m ago', category: 'data' },
  { id: 'fmt-11', name: 'YAML', description: 'Configuration-friendly structured data', icon: FileCode, sizeEstimate: '~390 KB', lastGenerated: '30m ago', category: 'data' },
  { id: 'fmt-12', name: 'Diagrams', description: 'C4, ERD, Sequence, Flow, Architecture, State Machine, User Journey, Decision Tree', icon: Network, sizeEstimate: '~3.6 MB', lastGenerated: '1h ago', category: 'diagram' },
]

// ─── Helpers ─────────────────────────────────────────────

function categoryLabel(cat: ExportFormat['category']) {
  switch (cat) {
    case 'document': return 'Documents'
    case 'api': return 'API Specs'
    case 'data': return 'Data Formats'
    case 'diagram': return 'Diagrams'
  }
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function DocumentationDownloadsPage() {
  const mounted = useHydrated()
  const [generating, setGenerating] = useState<Set<string>>(new Set())

  if (!mounted) return null

  const categories: ExportFormat['category'][] = ['document', 'api', 'data', 'diagram']

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
              <span className="text-2xl font-bold text-slate-400">12</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Export Formats</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">8</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Previously Generated</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Camera className="w-4 h-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">412</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Screenshots</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-400">~16 MB</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Export Size</div>
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
                return (
                  <div
                    key={format.id}
                    className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-700 transition-all duration-200 group ${
                      cat === 'diagram' ? 'border-slate-800' : 'border-slate-800'
                    }`}
                  >
                    {/* Icon + Name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-500/15 flex items-center justify-center flex-shrink-0">
                        <FIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{format.name}</span>
                          {format.lastGenerated && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{format.sizeEstimate}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{format.description}</p>

                    {/* Last generated + Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      {format.lastGenerated ? (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-2.5 h-2.5" />
                          {format.lastGenerated}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">Never generated</span>
                      )}
                      <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/15 border border-slate-500/20 text-[10px] font-medium text-slate-300 hover:bg-slate-500/25 hover:text-white transition-colors">
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
          4. Screenshot Exports
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Component Screenshots</h2>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/15 border border-slate-500/20 text-xs font-medium text-slate-300 hover:bg-slate-500/25 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export All Screenshots
          </button>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">412</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Screenshots Captured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">38</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">24</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">~86 MB</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Size</div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock className="w-3 h-3 text-slate-400" />
          Last capture: <span className="text-slate-300">12m ago</span>
          <span className="text-slate-700 ml-2">|</span>
          <span className="ml-2">Auto-capture on every deploy</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last bulk export: <span className="text-slate-300">2h ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Formats available: <span className="text-slate-300">12</span></span>
        <span className="text-slate-700">|</span>
        <span>Diagrams: <span className="text-slate-300">8 types</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <span>Screenshots: <span className="text-slate-300">412 captured</span></span>
        </div>
      </div>

    </div>
  )
}
