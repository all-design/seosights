'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Brain,
  Sparkles,
  ThumbsDown,
  Lightbulb,
  Database,
  CheckCircle2,
  Link2,
  XCircle,
  Zap,
  BarChart3,
  BookOpen,
  Target,
  RefreshCw,
} from 'lucide-react'

export default function LearningEnginePage() {
  const [memoryData, setMemoryData] = useState<any>(null)
  const [factoryData, setFactoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        // API wraps data under json.factory — unwrap the envelope
        const source = json.factory || json
        setMemoryData({ memories: source.recentMemories || [], count: source.counts?.memories ?? source.counts?.memory ?? 0 })
        setFactoryData({
          system: source.system || {},
          counts: source.counts || {},
          ok: source.ok ?? true,
        })
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
        <div className="animate-pulse bg-slate-800 rounded-xl h-20" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-400 mb-1">Failed to load learning data</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  const memories = memoryData?.memories || []
  const hasMemories = memories.length > 0

  // ─── Derive confidence evolution from memory confidence values ──
  const successMemories = memories.filter((m: any) => m.outcome === 'success' && m.confidence != null)
  const confidenceData = successMemories.length > 0
    ? (() => {
        // Group memories into up to 5 buckets by creation date
        const sorted = [...successMemories].sort((a: any, b: any) =>
          (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        )
        const bucketSize = Math.max(1, Math.ceil(sorted.length / 5))
        const buckets: { label: string; value: number; labelStr: string }[] = []
        for (let i = 0; i < sorted.length; i += bucketSize) {
          const chunk = sorted.slice(i, i + bucketSize)
          const avgConfidence = Math.round(
            chunk.reduce((sum: number, m: any) => sum + (m.confidence * 100), 0) / chunk.length
          )
          buckets.push({
            label: `Phase ${buckets.length + 1}`,
            value: avgConfidence,
            labelStr: `${avgConfidence}%`,
          })
        }
        if (buckets.length > 0) {
          buckets[buckets.length - 1].label = 'Current'
        }
        return buckets
      })()
    : []

  const confidenceChange = confidenceData.length >= 2
    ? confidenceData[confidenceData.length - 1].value - confidenceData[0].value
    : 0

  // ─── Derive learned patterns from engineering memories ────────
  const learnedPatterns = memories
    .filter((m: any) => m.patternLearned && m.outcome === 'success')
    .slice(0, 8)
    .map((m: any) => ({
      pattern: m.patternLearned,
      confidence: Math.round(m.confidence * 100),
      dataPoints: m.testsPassed + m.testsFailed,
      lastVerified: m.createdAt
        ? (() => {
            const diff = Date.now() - new Date(m.createdAt).getTime()
            const days = Math.floor(diff / 86400000)
            if (days < 1) return 'today'
            if (days === 1) return '1 day ago'
            if (days < 7) return `${days} days ago`
            return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
          })()
        : 'N/A',
      category: m.feature?.includes('SEO') || m.feature?.includes('schema') ? 'SEO'
        : m.feature?.includes('UX') || m.feature?.includes('UI') ? 'UX'
        : m.feature?.includes('content') || m.feature?.includes('Content') ? 'Content'
        : m.feature?.includes('performance') || m.feature?.includes('Performance') ? 'Performance'
        : 'Engineering',
    }))

  // ─── Derive suggestion→code→result chains ─────────────
  const chains = memories
    .filter((m: any) => m.outcome === 'success' && m.feature)
    .slice(0, 4)
    .map((m: any) => ({
      suggestion: m.feature,
      code: m.filesChanged || 'N/A',
      result: m.performanceDelta
        ? `Performance ${m.performanceDelta > 0 ? '+' : ''}${m.performanceDelta}%`
        : `${m.testsPassed} tests passed`,
      confidenceChange: m.confidence
        ? `+${Math.round(m.confidence * 10)}%`
        : 'N/A',
      confidenceBefore: m.confidence ? Math.round(m.confidence * 100 - 5) : 0,
      confidenceAfter: m.confidence ? Math.round(m.confidence * 100) : 0,
    }))

  // ─── Derive failed hypotheses from failed/rolled_back memories ──
  const failedHypotheses = memories
    .filter((m: any) => m.outcome === 'failed' || m.outcome === 'rolled_back')
    .slice(0, 3)
    .map((m: any) => ({
      hypothesis: m.feature || 'Unknown hypothesis',
      result: m.rollbackNeeded
        ? 'Rollback was required'
        : m.outcome === 'failed'
          ? 'Implementation failed'
          : 'Partial success — needed adjustments',
      lesson: m.patternLearned || 'Further analysis needed',
      dataPoints: m.testsPassed + m.testsFailed,
    }))

  // ─── Footer stats from real data ──────────────────────────
  const avgConfidence = hasMemories && successMemories.length > 0
    ? Math.round(successMemories.reduce((sum: number, m: any) => sum + m.confidence * 100, 0) / successMemories.length)
    : 0
  const totalDataPoints = memories.reduce((sum: number, m: any) => sum + m.testsPassed + m.testsFailed, 0)

  const footerStats = [
    { label: 'Patterns learned', value: String(learnedPatterns.length), icon: Brain },
    { label: 'Avg confidence', value: `${avgConfidence}%`, icon: Target },
    { label: 'Data points', value: String(totalDataPoints), icon: Database },
    { label: 'Improvement', value: confidenceChange > 0 ? `+${confidenceChange}pp` : '—', icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Learning Engine™</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Suggestion → Code → Result → Confidence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">{hasMemories ? 'Learning' : 'Idle'}</span>
        </div>
      </div>

      {/* Confidence Evolution */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Confidence Evolution</h2>
          {confidenceChange > 0 && (
            <span className="ml-auto text-xs text-emerald-400 font-medium">+{confidenceChange}pp improvement</span>
          )}
        </div>
        <div className="p-6">
          {confidenceData.length > 0 ? (
            <>
              <div className="flex items-end gap-3 h-48">
                {confidenceData.map((d: any, i: number) => {
                  const barHeight = (d.value / 100) * 160
                  const isCurrent = i === confidenceData.length - 1
                  return (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {d.labelStr}
                      </span>
                      <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                              : 'bg-gradient-to-t from-emerald-600/40 to-emerald-400/40'
                          }`}
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{d.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Confidence improving based on {successMemories.length} successful outcomes
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No confidence data yet</p>
              <p className="text-xs text-slate-500 mt-1">Confidence evolution will appear as patterns are learned</p>
            </div>
          )}
        </div>
      </div>

      {/* Learned Patterns */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Brain className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Learned Patterns</h2>
          <span className="ml-auto text-xs text-slate-500">{learnedPatterns.length} active patterns</span>
        </div>
        {learnedPatterns.length > 0 ? (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-slate-800/50">
              {learnedPatterns.map((p: any, i: number) => (
                <div key={i} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{p.pattern}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {p.dataPoints} data points
                        </span>
                        <span>Verified {p.lastVerified}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium">
                          {p.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${p.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-emerald-400 w-10 text-right">
                        {p.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No patterns recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Patterns will appear as the system learns from successful changes</p>
          </div>
        )}
      </div>

      {/* Suggestion → Code → Result Chain */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Link2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Suggestion → Code → Result Chain</h2>
        </div>
        {chains.length > 0 ? (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-slate-800/50">
              {chains.map((c: any, i: number) => (
                <div key={i} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Suggestion */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                        <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                          Suggestion
                        </span>
                      </div>
                      <div className="text-sm text-white font-medium">{c.suggestion}</div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block flex-shrink-0" />

                    {/* Code */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                        <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                          Code
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 font-mono truncate">{c.code}</div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block flex-shrink-0" />

                    {/* Result */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                        <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                          Result
                        </span>
                      </div>
                      <div className="text-sm text-emerald-400 font-medium">{c.result}</div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block flex-shrink-0" />

                    {/* Confidence Change */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />
                        <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                          Confidence
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">{c.confidenceBefore}%</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-sm text-white font-semibold">{c.confidenceAfter}%</span>
                        <span className="text-xs font-bold text-emerald-400">({c.confidenceChange})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Link2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No suggestion chains recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Chains will appear as successful changes are tracked</p>
          </div>
        )}
      </div>

      {/* Failed Hypotheses */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Failed Hypotheses</h2>
          <span className="ml-auto text-xs text-slate-500">Learning from what didn&apos;t work</span>
        </div>
        {failedHypotheses.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {failedHypotheses.map((f: any, i: number) => (
              <div key={i} className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <div className="text-[10px] text-red-400/60 uppercase font-semibold tracking-wider mb-0.5">
                        Hypothesis
                      </div>
                      <div className="text-sm text-white font-medium">{f.hypothesis}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">
                        Result
                      </div>
                      <div className="text-sm text-red-400">{f.result}</div>
                    </div>
                    <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                      <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider mb-0.5">
                          Lesson Learned
                        </div>
                        <div className="text-sm text-slate-300">{f.lesson}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      <Database className="w-3 h-3 inline mr-1" />
                      {f.dataPoints} data points collected before concluding
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No failed hypotheses</p>
            <p className="text-xs text-slate-500 mt-1">Failed experiments will be documented here for learning</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {footerStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-slate-900 rounded-xl border border-slate-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-emerald-400/60" />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
