'use client'

import { useEffect, useState } from 'react'
import {
  TestTube, RefreshCw, CheckCircle2, XCircle, MinusCircle,
  Clock, Shield, Zap, Eye, Lock, Accessibility, Flame,
  ChevronRight, Search, Filter, BarChart3, FileText,
  AlertTriangle, Activity, Target, Layers,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────

function passRateColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-400'
  if (rate >= 85) return 'text-cyan-400'
  if (rate >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function passRateBarColor(rate: number): string {
  if (rate >= 95) return 'bg-emerald-500'
  if (rate >= 85) return 'bg-cyan-500'
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

  // productQA is the raw QARun object from the API
  const run = data?.productQA ?? null
  const hasRun = run !== null

  // Derive dimension scores from run (QARun has 9+ score fields)
  const dimensions = hasRun ? [
    { name: 'Product', score: run.productScore ?? 0, icon: FileText },
    { name: 'UX', score: run.uxScore ?? 0, icon: Eye },
    { name: 'Engineering', score: run.engineeringScore ?? 0, icon: Zap },
    { name: 'Security', score: run.securityScore ?? 0, icon: Lock },
    { name: 'Performance', score: run.performanceScore ?? 0, icon: Flame },
    { name: 'SEO', score: run.seoScore ?? 0, icon: Search },
    { name: 'Accessibility', score: run.accessibilityScore ?? 0, icon: Accessibility },
    { name: 'Conversion', score: run.conversionScore ?? 0, icon: Shield },
    { name: 'Delight', score: run.customerDelight ?? 0, icon: TestTube },
  ] : []

  const avgScore = dimensions.length > 0
    ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
    : 0

  // Issue counts from the run
  const issueCounts = {
    critical: run?.criticalCount ?? 0,
    major: run?.majorCount ?? 0,
    medium: run?.mediumCount ?? 0,
    minor: run?.minorCount ?? 0,
    total: (run?.criticalCount ?? 0) + (run?.majorCount ?? 0) + (run?.mediumCount ?? 0) + (run?.minorCount ?? 0),
  }

  // Recent issues from security section if available
  const recentIssues = data?.security?.recentIssues ?? []

  // Health score = average of all dimension scores
  const healthScore = avgScore

  // Test coverage metrics
  const testMetrics = {
    pagesTested: run?.pagesTested ?? 0,
    clicksTested: run?.clicksTested ?? 0,
    apisTested: run?.apisTested ?? 0,
    formsTested: run?.formsTested ?? 0,
  }

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
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <TestTube className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Docs™</h1>
            <p className="text-slate-400 text-sm">Auto-generated test documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Auto-generated</span>
          </div>
        </div>
      </div>

      {!hasRun ? (
        /* No QA run data — show QA process overview */
        <>
          {/* Stats Banner with zeros */}
          <div className="bg-gradient-to-br from-emerald-500/5 via-slate-900 to-slate-900 border border-emerald-500/15 rounded-xl p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-400">—</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Health Score</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span className="text-2xl font-bold text-slate-400">—</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Pass Rate</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-2xl font-bold text-slate-400">—</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Critical Issues</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <MinusCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-2xl font-bold text-slate-400">—</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Issues</div>
              </div>
            </div>
          </div>

          {/* QA Process Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              QA Process Overview
            </h2>
            <div className="space-y-3 text-xs text-slate-400">
              <p>The QA Engine evaluates the platform across <span className="text-white font-medium">9 quality dimensions</span>, each scored 0–100:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                {[
                  { name: 'Product', icon: FileText, desc: 'Product completeness & market fit' },
                  { name: 'UX', icon: Eye, desc: 'User experience & usability' },
                  { name: 'Engineering', icon: Zap, desc: 'Code quality & architecture' },
                  { name: 'Security', icon: Lock, desc: 'Vulnerability assessment' },
                  { name: 'Performance', icon: Flame, desc: 'Speed & web vitals' },
                  { name: 'SEO', icon: Search, desc: 'Search engine optimization' },
                  { name: 'Accessibility', icon: Accessibility, desc: 'A11y compliance' },
                  { name: 'Conversion', icon: Shield, desc: 'Conversion rate optimization' },
                  { name: 'Delight', icon: TestTube, desc: 'Customer delight & satisfaction' },
                ].map((dim) => {
                  const DimIcon = dim.icon
                  return (
                    <div key={dim.name} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30">
                      <DimIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-slate-200 font-medium">{dim.name}</div>
                        <div className="text-slate-500 text-[10px]">{dim.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* How to run QA */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              How to Run QA Loops
            </h2>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">1.</span>
                <span>Navigate to the <span className="text-white">QA Engine</span> tab in the control panel</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">2.</span>
                <span>Click <span className="text-white">Run QA Loop</span> to start a comprehensive system test</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">3.</span>
                <span>The engine tests <span className="text-white">12 sections</span>: Database, AI Providers, AI Router, Codebase Scanner, AI Governor, Daily Mission, Cron Jobs, Factory Pipeline, Content Engine, Observatory, Growth Engine, Engagement</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">4.</span>
                <span>Results are scored with weighted metrics and persisted to the <span className="text-white">QARun</span> database</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">5.</span>
                <span>Overall status: <span className="text-emerald-400">operational</span> (≥80), <span className="text-amber-400">degraded</span> (≥50), <span className="text-red-400">critical</span> (&lt;50)</span>
              </div>
            </div>
          </div>

          {/* No data message */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <TestTube className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No QA run data available yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Run a QA loop from the QA Engine tab to generate documentation</p>
          </div>
        </>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════
              2. Stats Banner
              ═══════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-emerald-500/5 via-slate-900 to-slate-900 border border-emerald-500/15 rounded-xl p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-400">{healthScore}</span>
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
                  <span className="text-2xl font-bold text-red-400">{issueCounts.critical}</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Critical Issues</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <MinusCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-2xl font-bold text-amber-400">{issueCounts.total}</span>
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
              <Shield className="w-4 h-4 text-emerald-400" />
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
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <DimIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{dim.name}</div>
                        <div className="text-[10px] text-slate-500">Score</div>
                      </div>
                    </div>
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

          {/* Test Coverage */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Test Coverage
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{testMetrics.pagesTested}</div>
                <div className="text-[10px] text-slate-500 uppercase">Pages Tested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{testMetrics.clicksTested}</div>
                <div className="text-[10px] text-slate-500 uppercase">Clicks Tested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{testMetrics.apisTested}</div>
                <div className="text-[10px] text-slate-500 uppercase">APIs Tested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{testMetrics.formsTested}</div>
                <div className="text-[10px] text-slate-500 uppercase">Forms Tested</div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              4. Recent Issues
              ═══════════════════════════════════════════════════════ */}
          {recentIssues.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Recent Issues
                  <span className="text-[10px] text-slate-400">{recentIssues.length} shown</span>
                </h2>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-slate-500" />
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedType === type
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
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
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                    <div className="col-span-2">Severity</div>
                    <div className="col-span-3">Category</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Status</div>
                  </div>
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
                            issue.severity === 'medium' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' :
                            'bg-slate-500/15 text-slate-400 border-slate-500/20'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <div className="col-span-3 text-xs font-mono text-slate-400">{issue.category || '—'}</div>
                        <div className="col-span-5 text-xs text-slate-300 truncate">{issue.title || '—'}</div>
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
          )}

          {/* ═══════════════════════════════════════════════════════
              5. Footer
              ═══════════════════════════════════════════════════════ */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last run: <span className="text-slate-300">{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</span></span>
            </div>
            <span className="text-slate-700">|</span>
            <span>Status: <span className="text-emerald-400">{run.status}</span></span>
            <span className="text-slate-700">|</span>
            <span>Health: <span className="text-emerald-400">{healthScore}</span></span>
          </div>
        </>
      )}
    </div>
  )
}
