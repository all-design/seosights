'use client'

import { useEffect, useState } from 'react'
import {
  TestTube, RefreshCw, CheckCircle2, XCircle, MinusCircle,
  Clock, Shield, Zap, Eye, Lock, Accessibility, Flame,
  ChevronRight, Search, Filter, BarChart3, FileText,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────

function passRateColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-400'
  if (rate >= 85) return 'text-blue-400'
  if (rate >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function passRateBarColor(rate: number): string {
  if (rate >= 95) return 'bg-emerald-500'
  if (rate >= 85) return 'bg-blue-500'
  if (rate >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── Main Component ──────────────────────────────────────

export default function QADocsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')

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

  const productQA = data?.productQA || null
  const hasData = productQA?.hasData || false

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <TestTube className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">QA Docs™</h1>
              <p className="text-slate-400 text-sm">Auto-generated test documentation</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <TestTube className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No QA data available yet</p>
          <p className="text-[11px] text-slate-500 mt-1">QA documentation will appear after test runs are completed</p>
        </div>
      </div>
    )
  }

  const run = productQA?.run || {}
  const issueCounts = productQA?.issueCounts || {}
  const recentIssues = productQA?.recentIssues || []
  const healthScore = productQA?.healthScore || 0
  const scoreDelta = productQA?.scoreDelta || 0
  const issueCategoryCounts = productQA?.issueCategoryCounts || []

  // Derive dimension scores from run
  const dimensions = [
    { name: 'Product', score: run.productScore || 0, icon: FileText },
    { name: 'UX', score: run.uxScore || 0, icon: Eye },
    { name: 'Engineering', score: run.engineeringScore || 0, icon: Zap },
    { name: 'Security', score: run.securityScore || 0, icon: Lock },
    { name: 'Performance', score: run.performanceScore || 0, icon: Flame },
    { name: 'SEO', score: run.seoScore || 0, icon: Search },
    { name: 'Accessibility', score: run.accessibilityScore || 0, icon: Accessibility },
    { name: 'Conversion', score: run.conversionScore || 0, icon: Shield },
    { name: 'Delight', score: run.customerDelight || 0, icon: TestTube },
  ]

  const totalIssues = issueCounts.total || 0
  const avgScore = dimensions.length > 0 ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length) : 0

  const filteredIssues = selectedType === 'all'
    ? recentIssues
    : recentIssues.filter((i: any) => i.severity === selectedType)

  const types: string[] = ['all', ...Array.from(new Set<string>(recentIssues.map((i: any) => String(i.severity || 'unknown'))))]

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <TestTube className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Docs™</h1>
            <p className="text-slate-400 text-sm">Auto-generated test documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-400">Auto-generated</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-blue-500/5 via-slate-900 to-slate-900 border border-blue-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{healthScore}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Health Score</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{avgScore}%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Pass Rate</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{issueCounts.critical || 0}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Critical Issues</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MinusCircle className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{totalIssues}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Issues</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Dimension Scores
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          QA Dimensions
          <span className="ml-auto text-[10px] text-slate-400">{dimensions.length} dimensions</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map((dim) => {
            const DimIcon = dim.icon
            return (
              <div
                key={dim.name}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <DimIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{dim.name}</div>
                    <div className="text-[10px] text-slate-500">Score</div>
                  </div>
                </div>
                {/* Pass rate bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Score</span>
                    <span className={`text-xs font-bold ${passRateColor(dim.score)}`}>{dim.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${passRateBarColor(dim.score)}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Recent Issues
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Recent Issues
            <span className="text-[10px] text-slate-400">{recentIssues.length} shown</span>
          </h2>
          {/* Severity filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-500" />
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No issues found</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Severity</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-slate-800/50 max-h-64 overflow-y-auto custom-scrollbar">
              {filteredIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      issue.severity === 'critical' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                      issue.severity === 'major' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                      issue.severity === 'medium' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                      'bg-slate-500/15 text-slate-400 border-slate-500/20'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="col-span-3 text-xs font-mono text-slate-400">{issue.category || '—'}</div>
                  <div className="col-span-5 text-xs text-slate-300 truncate">{issue.findings ? JSON.stringify(issue.findings).slice(0, 80) : '—'}</div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{issue.status}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Issue Category Map
          ═══════════════════════════════════════════════════════ */}
      {issueCategoryCounts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            Issue Categories
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {issueCategoryCounts.map((cat: any) => (
                <div
                  key={cat.category}
                  className="relative p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs font-medium text-slate-200 capitalize">{cat.category}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {cat.count} issues
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          6. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Last run: <span className="text-slate-300">{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Score delta: <span className={scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>{scoreDelta >= 0 ? '+' : ''}{scoreDelta}</span></span>
        <span className="text-slate-700">|</span>
        <span>Health: <span className="text-blue-400">{healthScore}</span></span>
      </div>

    </div>
  )
}
