'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Palette,
  Type,
  Space,
  Sparkles,
  FileCode,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type ReviewResult = 'approved' | 'revision' | 'warning'
type CheckType = 'palette' | 'spacing' | 'typography' | 'copy' | 'animation'

interface DesignReview {
  id: string
  component: string
  checkType: CheckType
  result: ReviewResult
  note: string
  timestamp: string
}

interface RecentRevision {
  id: string
  component: string
  reason: string
  codeRef: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  requestedAgo: string
}

interface PhilosophyCheck {
  id: string
  principle: string
  question: string
  result: 'pass' | 'warning' | 'fail'
  note: string
}

interface ReviewData {
  reviewScore: number
  approved: number
  revisionsNeeded: number
  philosophyViolations: number
  brandScore: number
  designReviews: DesignReview[]
  recentRevisions: RecentRevision[]
  philosophyChecks: PhilosophyCheck[]
  summary: {
    totalReviews: number
    philosophyPassing: number
    philosophyTotal: number
    source: 'live' | 'seed'
  }
}

// ─── Helpers ─────────────────────────────────────────────

function checkTypeIcon(type: CheckType) {
  switch (type) {
    case 'palette': return Palette
    case 'spacing': return Space
    case 'typography': return Type
    case 'copy': return MessageSquare
    case 'animation': return Sparkles
  }
}

function checkTypeLabel(type: CheckType) {
  switch (type) {
    case 'palette': return 'Palette'
    case 'spacing': return 'Spacing'
    case 'typography': return 'Typography'
    case 'copy': return 'Copy'
    case 'animation': return 'Animation'
  }
}

function resultIcon(result: ReviewResult) {
  switch (result) {
    case 'approved': return CheckCircle2
    case 'revision': return XCircle
    case 'warning': return AlertTriangle
  }
}

function resultColor(result: ReviewResult) {
  switch (result) {
    case 'approved': return 'text-emerald-400'
    case 'revision': return 'text-red-400'
    case 'warning': return 'text-amber-400'
  }
}

function philosophyResultStyle(result: 'pass' | 'warning' | 'fail') {
  switch (result) {
    case 'pass': return { color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/10 border-emerald-500/15' }
    case 'warning': return { color: 'text-amber-400', icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/15' }
    case 'fail': return { color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/10 border-red-500/15' }
  }
}

function priorityStyle(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'low': return 'bg-slate-700/50 text-slate-400 border-slate-600/50'
  }
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2
  const gaugeColor = score >= 90 ? '#fbbf24' : score >= 75 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-amber-400">{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function ReviewEnginePage() {
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/review')
        if (!res.ok) throw new Error('Failed to fetch review data')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Animate score when data loads
  useEffect(() => {
    if (!data || animationStarted.current) return
    const target = data.reviewScore
    animationStarted.current = true
    let current = 0
    const step = Math.ceil(target / 40)
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      setAnimatingScore(current)
    }, 25)
    return () => clearInterval(timer)
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-400 mb-1">Failed to load review data</h2>
        <p className="text-sm text-slate-400 mb-4">{error || 'No data available'}</p>
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

  const {
    reviewScore,
    approved,
    revisionsNeeded,
    philosophyViolations,
    brandScore,
    designReviews,
    recentRevisions,
    philosophyChecks,
    summary,
  } = data

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Eye className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Review Engine™</h1>
            <p className="text-slate-400 text-sm">Design system, brand voice & philosophy compliance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-400">Active</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/30 transition-colors text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Force Review
          </button>
        </div>
      </div>

      {/* ─── Review Score + Stats ────────────────────────── */}
      <div className="bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-900 border border-amber-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <CircularGauge score={animatingScore} size={160} />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{approved}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Approved</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{revisionsNeeded}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Revisions Needed</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{philosophyViolations}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Violations Blocked</div>
              <div className="text-[9px] text-slate-600 mt-0.5">Governor rejections</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{brandScore}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Brand Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Design System Compliance ────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-400" />
          Design System Compliance
          <span className="ml-auto text-[10px] text-slate-500">{designReviews.length} recent reviews</span>
        </h2>
        {designReviews.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Component</div>
              <div className="col-span-2">Check Type</div>
              <div className="col-span-1">Result</div>
              <div className="col-span-4">Reviewer Note</div>
              <div className="col-span-1 text-right">Time</div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-800/60">
              {designReviews.map((review) => {
                const TypeIcon = checkTypeIcon(review.checkType)
                const ResultIcon = resultIcon(review.result)
                return (
                  <div
                    key={review.id}
                    className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm hover:bg-slate-800/30 transition-colors ${
                      review.result === 'revision' ? 'bg-red-500/[0.03]' : ''
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2.5">
                      <FileCode className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-white font-medium truncate">{review.component}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                        <TypeIcon className="w-3 h-3" />
                        {checkTypeLabel(review.checkType)}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <ResultIcon className={`w-4 h-4 ${resultColor(review.result)}`} />
                    </div>
                    <div className="col-span-4 text-xs text-slate-400 truncate">{review.note}</div>
                    <div className="col-span-1 text-[10px] text-slate-600 text-right flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {review.timestamp}
                    </div>
                  </div>
                )
              })}
            </div>
            {summary.source === 'seed' && (
              <div className="px-5 py-2.5 border-t border-slate-800 bg-emerald-500/5">
                <p className="text-[10px] text-emerald-400">Cold-start: seeded design review data from platform knowledge</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Palette className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No review data available yet</p>
            <p className="text-xs text-slate-500 mt-1">Design reviews will appear after QA runs complete</p>
          </div>
        )}
      </div>

      {/* ─── Philosophy Checks ───────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Philosophy Checks
          <span className="ml-auto text-[10px] text-slate-500">Product values alignment</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {philosophyChecks.map((check) => {
            const style = philosophyResultStyle(check.result)
            const Icon = style.icon
            return (
              <div
                key={check.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-colors hover:border-slate-700 ${
                  check.result === 'warning' ? 'border-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 ${style.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-1">{check.question}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {check.result === 'pass' && (
                        <span className="text-emerald-400/80">✓ {check.note}</span>
                      )}
                      {check.result === 'warning' && (
                        <span className="text-amber-400/80">⚠ {check.note}</span>
                      )}
                      {check.result === 'fail' && (
                        <span className="text-red-400/80">✗ {check.note}</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${style.bg} ${style.color}`}>
                        <Lightbulb className="w-2.5 h-2.5" />
                        {check.principle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Recent Revisions Requested ──────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-amber-400" />
          Recent Revisions Requested
          <span className="ml-auto text-[10px] text-slate-500">Sent back to Engineering</span>
        </h2>
        {recentRevisions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {recentRevisions.map((rev) => (
              <div
                key={rev.id}
                className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-700 transition-colors ${
                  rev.priority === 'high' ? 'border-red-500/15' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{rev.component}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${priorityStyle(rev.priority)}`}>
                      {rev.priority}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-slate-600 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {rev.requestedAgo}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">{rev.reason}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <code className="text-[10px] text-amber-400/70 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 font-mono truncate">
                    {rev.codeRef}
                  </code>
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <Lightbulb className="w-3 h-3 text-amber-500/60 mt-0.5 flex-shrink-0" />
                    <span>{rev.suggestion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No revisions requested</p>
            <p className="text-xs text-slate-500 mt-1">All recent changes passed review</p>
          </div>
        )}
      </div>

      {/* ─── Footer ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Reviews today: <span className="text-slate-300">{summary.totalReviews}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Philosophy alignment: <span className={philosophyChecks.every(c => c.result === 'pass') ? 'text-emerald-400' : 'text-amber-400'}>
          {summary.philosophyPassing}/{summary.philosophyTotal} passing
        </span></span>
        {summary.source === 'seed' && (
          <>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400/60">Data: seeded</span>
          </>
        )}
      </div>
    </div>
  )
}
