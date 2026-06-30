'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
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

interface PhilosophyCheck {
  id: string
  principle: string
  question: string
  result: 'pass' | 'warning' | 'fail'
  note: string
}

interface RevisionItem {
  id: string
  component: string
  reason: string
  codeRef: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  requestedAgo: string
}

// ─── Mock Data ───────────────────────────────────────────

const designReviews: DesignReview[] = [
  {
    id: 'dr-1',
    component: 'FloatingAdvisor.tsx',
    checkType: 'palette',
    result: 'approved',
    note: 'Uses correct emerald palette',
    timestamp: '2m ago',
  },
  {
    id: 'dr-2',
    component: 'Hero modifications',
    checkType: 'spacing',
    result: 'approved',
    note: 'Border radius matches design tokens',
    timestamp: '8m ago',
  },
  {
    id: 'dr-3',
    component: 'New dashboard panel',
    checkType: 'palette',
    result: 'revision',
    note: 'Uses slate-900 instead of slate-800 — off spec',
    timestamp: '14m ago',
  },
  {
    id: 'dr-4',
    component: 'Copy update',
    checkType: 'copy',
    result: 'approved',
    note: 'Headline follows brand voice guide',
    timestamp: '22m ago',
  },
  {
    id: 'dr-5',
    component: 'CTA button animation',
    checkType: 'animation',
    result: 'approved',
    note: 'Hover transition matches motion spec (200ms ease-out)',
    timestamp: '35m ago',
  },
  {
    id: 'dr-6',
    component: 'Pricing card layout',
    checkType: 'typography',
    result: 'approved',
    note: 'Font weights follow type scale — semibold headings, regular body',
    timestamp: '41m ago',
  },
]

const philosophyChecks: PhilosophyCheck[] = [
  {
    id: 'pc-1',
    principle: 'Measure don\'t guess',
    question: 'Does this respect "Measure don\'t guess"?',
    result: 'pass',
    note: 'All decisions backed by analytics data',
  },
  {
    id: 'pc-2',
    principle: 'Customer-first',
    question: 'Is this "Customer-first"?',
    result: 'pass',
    note: 'Feature directly addresses user pain point',
  },
  {
    id: 'pc-3',
    principle: 'Simplicity over complexity',
    question: 'Does this add complexity without value?',
    result: 'warning',
    note: 'Minor concern — new component could extend existing PatternCard instead',
  },
  {
    id: 'pc-4',
    principle: 'Empowering tone',
    question: 'Is the copy empowering or fear-based?',
    result: 'pass',
    note: 'Empowering — "Take control" language, not "Don\'t miss out"',
  },
  {
    id: 'pc-5',
    principle: 'Transparency',
    question: 'Is pricing/messaging transparent?',
    result: 'pass',
    note: 'Clear pricing, no hidden fees language',
  },
]

const recentRevisions: RevisionItem[] = [
  {
    id: 'rev-1',
    component: 'New dashboard panel',
    reason: 'Design token violation — slate-900 used instead of slate-900/50 with slate-800 border',
    codeRef: 'src/components/dashboard/NewPanel.tsx:L42-L58',
    suggestion: 'Replace bg-slate-900 with bg-slate-900/50 border border-slate-800 to match design system',
    priority: 'high',
    requestedAgo: '14m ago',
  },
  {
    id: 'rev-2',
    component: 'Feature comparison table',
    reason: 'Copy doesn\'t follow brand voice — uses "We" instead of user-centric language',
    codeRef: 'src/components/landing/CompareSection.tsx:L87-L103',
    suggestion: 'Reframe copy from "We provide" to "You get" — customer-first principle',
    priority: 'medium',
    requestedAgo: '28m ago',
  },
  {
    id: 'rev-3',
    component: 'Onboarding stepper',
    reason: 'Unnecessary new component — existing StepIndicator can be extended',
    codeRef: 'src/components/onboarding/Stepper.tsx:L1-L120',
    suggestion: 'Extend StepIndicator with variant prop instead of creating parallel component',
    priority: 'low',
    requestedAgo: '1h ago',
  },
  {
    id: 'rev-4',
    component: 'Alert banner',
    reason: 'Fear-based copy — "Your rankings are dropping!" triggers anxiety',
    codeRef: 'src/components/dashboard/AlertBanner.tsx:L23-L31',
    suggestion: 'Reframe to "New optimization opportunity found" — empowering, not alarming',
    priority: 'high',
    requestedAgo: '1h 15m ago',
  },
]

// ─── Helpers ─────────────────────────────────────────────

const REVIEW_SCORE = 91
const STATS = {
  approved: 28,
  revisionsNeeded: 5,
  philosophyViolations: 1,
  brandScore: 94,
}

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

function resultBg(result: ReviewResult) {
  switch (result) {
    case 'approved': return 'bg-emerald-500/10 border-emerald-500/20'
    case 'revision': return 'bg-red-500/10 border-red-500/20'
    case 'warning': return 'bg-amber-500/10 border-amber-500/20'
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

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function ReviewEnginePage() {
  const mounted = useHydrated()
  const [animatingScore, setAnimatingScore] = useState(0)
  const animationStarted = useRef(false)

  useEffect(() => {
    if (animationStarted.current) return
    animationStarted.current = true
    let current = 0
    const target = REVIEW_SCORE
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
  }, [])

  if (!mounted) return null

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
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/30 transition-colors text-xs">
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
              <div className="text-2xl font-bold text-emerald-400">{STATS.approved}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Approved</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{STATS.revisionsNeeded}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Revisions Needed</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{STATS.philosophyViolations}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Philosophy Violations</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{STATS.brandScore}%</div>
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
        </div>
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
      </div>

      {/* ─── Footer ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Reviews today: <span className="text-slate-300">34</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Avg review time: <span className="text-slate-300">1.8s</span></span>
        <span className="text-slate-700">|</span>
        <span>Philosophy alignment: <span className="text-emerald-400">97%</span></span>
      </div>
    </div>
  )
}
