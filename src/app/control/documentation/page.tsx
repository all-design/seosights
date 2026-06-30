'use client'

import { useSyncExternalStore } from 'react'
import {
  BookOpen, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2,
  ChevronRight, Clock, Scan, Layers, GitBranch, Box, Network,
  ArrowRight, Zap, FileText, Code2, Database, Webhook, TestTube,
  Palette, Eye, Package, Globe, Sparkles, History, Activity,
  Bot, Branches, CalendarClock, Search, XCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type PipelineStepStatus = 'complete' | 'running' | 'pending'

interface PipelineStep {
  label: string
  status: PipelineStepStatus
  icon: React.ElementType
}

type FeedEventStatus = 'complete' | 'running' | 'pending'

interface FeedEvent {
  id: string
  action: string
  detail: string
  timestamp: string
  status: FeedEventStatus
}

interface DocCategory {
  id: string
  label: string
  icon: React.ElementType
  description: string
  docs: number
  coverage: number
  href: string
}

interface ChangelogRelease {
  version: string
  date: string
  summary: string
  type: 'major' | 'minor' | 'patch'
}

// ─── Mock Data ───────────────────────────────────────────

const KNOWLEDGE_SCORE = 97

const pipelineSteps: PipelineStep[] = [
  { label: 'Scan Code', status: 'complete', icon: Scan },
  { label: 'Extract Metadata', status: 'complete', icon: Search },
  { label: 'Generate Specs', status: 'complete', icon: FileText },
  { label: 'Generate Diagrams', status: 'complete', icon: Network },
  { label: 'Generate Docs', status: 'running', icon: BookOpen },
  { label: 'Version', status: 'pending', icon: GitBranch },
  { label: 'Publish', status: 'pending', icon: Globe },
]

const feedEvents: FeedEvent[] = [
  {
    id: 'fe-1',
    action: 'Detected New Component',
    detail: 'FloatingAdvisor.tsx — scanning for documentation gaps',
    timestamp: '2m ago',
    status: 'complete',
  },
  {
    id: 'fe-2',
    action: 'Generated Documentation',
    detail: 'API route /api/advisor → OpenAPI spec updated',
    timestamp: '5m ago',
    status: 'complete',
  },
  {
    id: 'fe-3',
    action: 'Diagram Updated',
    detail: 'Architecture diagram reflects new AdvisorSession model',
    timestamp: '8m ago',
    status: 'complete',
  },
  {
    id: 'fe-4',
    action: 'API Updated',
    detail: '/api/advisor docs regenerated — 3 new endpoints',
    timestamp: '12m ago',
    status: 'complete',
  },
  {
    id: 'fe-5',
    action: 'Knowledge Graph Updated',
    detail: 'FloatingAdvisor ↔ AdvisorSession relationship mapped',
    timestamp: '15m ago',
    status: 'running',
  },
]

const schedulerJobs = [
  { time: '02:00', label: 'Code Scan', icon: Scan, status: 'Scheduled' },
  { time: '03:00', label: 'Generate Docs', icon: BookOpen, status: 'Scheduled' },
  { time: '04:00', label: 'Generate Diagrams', icon: Network, status: 'Scheduled' },
  { time: '05:00', label: 'QA Validation', icon: CheckCircle2, status: 'Scheduled' },
  { time: '06:00', label: 'Publish Docs', icon: Globe, status: 'Scheduled' },
]

const docCategories: DocCategory[] = [
  { id: 'dc-1', label: 'Product Docs™', icon: Package, description: 'Feature specs, user stories, and product requirements', docs: 42, coverage: 98, href: '/control/documentation/product' },
  { id: 'dc-2', label: 'Technical Docs™', icon: FileText, description: 'Architecture, systems design, and technical decisions', docs: 67, coverage: 96, href: '/control/documentation/technical' },
  { id: 'dc-3', label: 'API Docs™', icon: Webhook, description: 'OpenAPI specs, endpoints, and integration guides', docs: 184, coverage: 99, href: '/control/documentation/api' },
  { id: 'dc-4', label: 'Database Docs™', icon: Database, description: 'Schema, migrations, and Prisma model references', docs: 87, coverage: 95, href: '/control/documentation/database' },
  { id: 'dc-5', label: 'QA Docs™', icon: TestTube, description: 'Test plans, coverage reports, and QA procedures', docs: 34, coverage: 91, href: '/control/documentation/qa' },
  { id: 'dc-6', label: 'Architecture Docs', icon: Network, description: 'Component maps, dependency graphs, and module docs', docs: 28, coverage: 94, href: '/control/documentation/technical' },
  { id: 'dc-7', label: 'Operations Docs', icon: Activity, description: 'Deployment, monitoring, and incident response', docs: 19, coverage: 88, href: '/control/documentation/technical' },
  { id: 'dc-8', label: 'Design System Docs', icon: Palette, description: 'Component library, tokens, and design guidelines', docs: 56, coverage: 97, href: '/control/documentation/design-system' },
  { id: 'dc-9', label: 'Observatory Docs', icon: Eye, description: 'Dashboard specs, metrics definitions, and alerts', docs: 15, coverage: 92, href: '/control/documentation/product' },
  { id: 'dc-10', label: 'Client Zero Docs', icon: Globe, description: 'Client onboarding, configuration, and API keys', docs: 11, coverage: 85, href: '/control/documentation/product' },
]

const keyFeatures = [
  {
    id: 'kf-1',
    label: 'AI Drift Detector™',
    description: 'Detects code/docs mismatch in real-time',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
  },
  {
    id: 'kf-2',
    label: 'Living Documentation™',
    description: 'Versioned history with full changelog',
    icon: History,
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/20',
  },
  {
    id: 'kf-3',
    label: 'AI Documentation Reviewer™',
    description: 'Checks accuracy and completeness',
    icon: Bot,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
  },
  {
    id: 'kf-4',
    label: 'Knowledge Graph™',
    description: 'Connects everything into a living map',
    icon: Network,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
  },
]

const changelogReleases: ChangelogRelease[] = [
  { version: '3.2.0', date: 'Today', summary: 'Added Knowledge Graph auto-linking, AI Drift Detector v2, and 12 new doc templates', type: 'minor' },
  { version: '3.1.4', date: '2 days ago', summary: 'Fixed diagram generation for circular dependencies, improved API spec accuracy', type: 'patch' },
  { version: '3.1.0', date: '1 week ago', summary: 'Living Documentation versioning, Design System doc category, auto-publish pipeline', type: 'minor' },
]

// ─── Helpers ─────────────────────────────────────────────

function pipelineStatusConfig(status: PipelineStepStatus) {
  switch (status) {
    case 'complete': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', dot: 'bg-emerald-400' }
    case 'running': return { color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/20', dot: 'bg-teal-400 animate-pulse' }
    case 'pending': return { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-700', dot: 'bg-slate-600' }
  }
}

function feedStatusConfig(status: FeedEventStatus) {
  switch (status) {
    case 'complete': return { color: 'text-emerald-400', icon: CheckCircle2 }
    case 'running': return { color: 'text-teal-400', icon: Activity }
    case 'pending': return { color: 'text-slate-500', icon: Clock }
  }
}

function coverageColor(pct: number): string {
  if (pct >= 95) return 'text-emerald-400'
  if (pct >= 85) return 'text-teal-400'
  if (pct >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function releaseTypeConfig(type: 'major' | 'minor' | 'patch') {
  switch (type) {
    case 'major': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', label: 'Major' }
    case 'minor': return { color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/20', label: 'Minor' }
    case 'patch': return { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-700', label: 'Patch' }
  }
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  const gaugeColor = score >= 90 ? '#2dd4bf' : score >= 75 ? '#22d3ee' : score >= 60 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
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
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-teal-400">{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function DocumentationEnginePage() {
  const mounted = useHydrated()

  if (!mounted) return null

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Documentation Engine™</h1>
            <p className="text-slate-400 text-sm">Knowledge Operating System™</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Running</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Force Re-scan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Knowledge Score Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-teal-500/5 via-slate-900 to-slate-900 border border-teal-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular Gauge */}
          <div className="flex-shrink-0">
            <CircularGauge score={KNOWLEDGE_SCORE} size={160} />
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Knowledge Score™</span>
            </div>
          </div>

          {/* Stat Boxes */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="text-2xl font-bold text-teal-400">97%</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Coverage</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">12</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Outdated Docs</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-bold text-red-400">3</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Missing Docs</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Box className="w-4 h-4 text-teal-400" />
                <span className="text-2xl font-bold text-teal-400">412</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Components</div>
            </div>
          </div>
        </div>

        {/* Secondary stats row */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Webhook className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">API Endpoints:</span>
            <span className="text-white font-medium">184</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Prisma Models:</span>
            <span className="text-white font-medium">87</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Pages:</span>
            <span className="text-white font-medium">138</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Generated Today:</span>
            <span className="text-white font-medium">22</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Documentation Health™
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Documentation Health™
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Healthy
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">98%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">2</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Drift</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">1</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Missing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">4</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Outdated</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] text-amber-500 uppercase tracking-wider mb-0.5">Recommendation</div>
              <div className="text-xs text-slate-300">Update Button component docs — 3 new props undocumented</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Documentation Pipeline Visualization
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" />
          Documentation Pipeline
          <span className="ml-auto text-[10px] text-slate-500">7 stages</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
            {pipelineSteps.map((step, idx) => {
              const config = pipelineStatusConfig(step.status)
              const StepIcon = step.icon
              return (
                <div key={step.label} className="flex items-center gap-3 sm:gap-0">
                  {/* Step node */}
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <StepIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${config.color}`}>{step.label}</div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        <span className="text-[10px] text-slate-500 capitalize">{step.status}</span>
                      </div>
                    </div>
                  </div>
                  {/* Connector arrow */}
                  {idx < pipelineSteps.length - 1 && (
                    <>
                      <div className="hidden sm:block flex-1 h-px bg-slate-700 mx-3 min-w-[24px]" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block flex-shrink-0" />
                      <div className="hidden sm:block flex-1 h-px bg-slate-700 mx-3 min-w-[24px]" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. The Principle — Callout
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-teal-500/5 via-slate-900 to-teal-500/5 border border-teal-500/15 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-white">The Principle</h2>
        </div>

        {/* The right way */}
        <div className="bg-slate-800/50 border border-teal-500/20 rounded-lg p-3 mb-3">
          <div className="text-[10px] text-teal-500 uppercase tracking-wider mb-1.5">Documentation-First Pipeline</div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20">Specification</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20">Code</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20">Verification</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20">Documentation</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20">Knowledge</span>
          </div>
        </div>

        {/* The wrong way (crossed out) */}
        <div className="bg-slate-800/30 border border-red-500/15 rounded-lg p-3 mb-3 opacity-60">
          <div className="text-[10px] text-red-500 uppercase tracking-wider mb-1.5 line-through">Not This</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400/70 font-medium border border-red-500/15 line-through">Code</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-500/40" />
            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400/70 font-medium border border-red-500/15 line-through">Documentation</span>
          </div>
        </div>

        {/* Full Factory Pipeline */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
          <span className="text-emerald-400 font-medium">Product Engine</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-cyan-400 font-medium">Architecture Engine</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-blue-400 font-medium">Engineering Engine</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-purple-400 font-medium">QA Engine</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-teal-400 font-medium">Documentation Engine</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-teal-300 font-medium">Knowledge Base</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-amber-400 font-medium">Learning</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Live Feed
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          Live Feed
          <span className="ml-auto text-[10px] text-slate-500">{feedEvents.length} events</span>
        </h2>
        <div className="space-y-2">
          {feedEvents.map((event) => {
            const config = feedStatusConfig(event.status)
            const StatusIcon = config.icon
            return (
              <div
                key={event.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-start gap-3 hover:border-slate-700 transition-all duration-200"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${event.status === 'running' ? 'bg-teal-500/15' : 'bg-slate-800'}`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white">{event.action}</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {event.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{event.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          7. Daily Scheduler
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-teal-400" />
          Daily Scheduler
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-3">
            {schedulerJobs.map((job, idx) => {
              const JobIcon = job.icon
              return (
                <div key={job.time} className="flex items-center gap-4">
                  <div className="w-14 text-right">
                    <span className="text-sm font-mono font-bold text-teal-400">{job.time}</span>
                  </div>
                  <div className="flex items-center justify-center w-px h-8 bg-slate-700 relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500/30 border border-teal-500/50 absolute" />
                  </div>
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <JobIcon className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">{job.label}</span>
                    <span className="ml-auto text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{job.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Documentation Categories Grid
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          Documentation Categories
          <span className="ml-auto text-[10px] text-slate-500">{docCategories.length} categories</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {docCategories.map((cat) => {
            const CatIcon = cat.icon
            return (
              <a
                key={cat.id}
                href={cat.href}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-teal-500/30 transition-all duration-200 group block"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <CatIcon className="w-4 h-4 text-teal-400" />
                  </div>
                  <span className="text-xs font-medium text-white group-hover:text-teal-400 transition-colors truncate">{cat.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-3 line-clamp-2">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{cat.docs} docs</span>
                  <span className={`text-[10px] font-medium ${coverageColor(cat.coverage)}`}>{cat.coverage}%</span>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          9. Key Features
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          Key Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyFeatures.map((feature) => {
            const FeatureIcon = feature.icon
            return (
              <div
                key={feature.id}
                className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-700 transition-all duration-200 ${feature.border}`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.bg}`}>
                    <FeatureIcon className={`w-4 h-4 ${feature.color}`} />
                  </div>
                  <span className="text-xs font-medium text-white">{feature.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          10. Changelog Engine™ Preview
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-teal-400" />
            Changelog Engine™
          </h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Latest releases</span>
          <a href="/control/documentation/changelog" className="ml-auto text-[10px] text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-3">
          {changelogReleases.map((release) => {
            const config = releaseTypeConfig(release.type)
            return (
              <div
                key={release.version}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-white font-mono">v{release.version}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{release.date}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{release.summary}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Footer Stats
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>Next scan: <span className="text-slate-300">in 47 min</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Last publish: <span className="text-slate-300">1h ago</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-teal-400" />
          <span>Docs generated: <span className="text-slate-300">1,247</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Accuracy: <span className="text-teal-400">99.2%</span></span>
      </div>

    </div>
  )
}
