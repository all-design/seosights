'use client'

import { useSyncExternalStore } from 'react'
import {
  Landmark, RefreshCw, ShieldCheck, Lightbulb, Ban, Recycle,
  FileCode, Database, Route, Puzzle, Trash2, ArrowRight,
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, Zap,
  Clock, Scan, Layers, GitBranch, Box, Network,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type DecisionType = 'reuse' | 'new' | 'schema' | 'cleanup' | 'modify'

interface ArchitectureDecision {
  id: string
  title: string
  type: DecisionType
  path: string
  confidence: number
  reasoning: string
  timestamp: string
}

type CreepStatus = 'blocked' | 'diverted' | 'approved'

interface FeatureCreepAlert {
  id: string
  originalSuggestion: string
  architectureResponse: string
  recommendedAlternative: string
  status: CreepStatus
}

type DependencyHealth = 'healthy' | 'coupled' | 'circular'

interface DependencyRelation {
  from: string
  to: string
  health: DependencyHealth
  description: string
}

// ─── Mock Data ───────────────────────────────────────────

const architectureDecisions: ArchitectureDecision[] = [
  {
    id: 'ad-1',
    title: 'Reuse Mission Control → Expand for new dashboard',
    type: 'reuse',
    path: '/components/control/MissionControl.tsx',
    confidence: 94,
    reasoning: 'MissionControl already has 78% overlap with proposed DashboardV2. Expanding the existing component avoids duplication and keeps the bundle lean.',
    timestamp: '12m ago',
  },
  {
    id: 'ad-2',
    title: 'New API route needed: /api/advisor',
    type: 'new',
    path: '/app/api/advisor/route.ts',
    confidence: 88,
    reasoning: 'No existing endpoint handles advisor session management. Requires dedicated route with auth middleware and rate limiting.',
    timestamp: '28m ago',
  },
  {
    id: 'ad-3',
    title: 'New Prisma table: AdvisorSession',
    type: 'schema',
    path: 'prisma/schema.prisma → model AdvisorSession',
    confidence: 91,
    reasoning: 'Advisor conversations need persistent storage. No existing table covers session-state with message history and token tracking.',
    timestamp: '45m ago',
  },
  {
    id: 'ad-4',
    title: 'Component: Hero.tsx — modify existing',
    type: 'modify',
    path: '/components/home/Hero.tsx',
    confidence: 82,
    reasoning: 'Adding floating advisor CTA to existing hero. The Hero component already supports slot-based children — just needs a new slot render.',
    timestamp: '1h ago',
  },
  {
    id: 'ad-5',
    title: 'Component: FloatingAdvisor.tsx — new',
    type: 'new',
    path: '/components/home/FloatingAdvisor.tsx',
    confidence: 76,
    reasoning: 'Novel UI pattern — floating contextual advisor widget. No existing component covers this interaction model. Must be new.',
    timestamp: '1h ago',
  },
  {
    id: 'ad-6',
    title: 'Dead route: /api/legacy/scan — remove',
    type: 'cleanup',
    path: '/app/api/legacy/scan/route.ts',
    confidence: 97,
    reasoning: 'Zero traffic in 30 days. Referenced by no active component. Migration to /api/observatory/scan completed 3 sprints ago.',
    timestamp: '2h ago',
  },
]

const featureCreepAlerts: FeatureCreepAlert[] = [
  {
    id: 'fc-1',
    originalSuggestion: 'Create new DashboardV2 component from scratch',
    architectureResponse: 'MissionControl already covers 78% of the proposed functionality. Expanding it is more maintainable.',
    recommendedAlternative: 'Extend MissionControl with new dashboard panel slots',
    status: 'blocked',
  },
  {
    id: 'fc-2',
    originalSuggestion: 'Build standalone AnalyticsWidget library (5 components)',
    architectureResponse: '3 of 5 widgets duplicate existing chart components in the Observatory module.',
    recommendedAlternative: 'Extract shared chart components to /components/shared/charts/',
    status: 'diverted',
  },
  {
    id: 'fc-3',
    originalSuggestion: 'New database table for user preferences per page',
    architectureResponse: 'Existing UserSettings table with JSON column can store per-page preferences without schema changes.',
    recommendedAlternative: 'Use JSON field in UserSettings.preferences',
    status: 'blocked',
  },
  {
    id: 'fc-4',
    originalSuggestion: 'Create separate API route for each advisor action (6 routes)',
    architectureResponse: 'Single /api/advisor route with action parameter is cleaner and follows existing patterns.',
    recommendedAlternative: 'Consolidate to /api/advisor?action=<type>',
    status: 'diverted',
  },
]

const dependencyRelations: DependencyRelation[] = [
  { from: 'MissionControl', to: 'Observatory', health: 'healthy', description: 'Reads observatory data for dashboard panels' },
  { from: 'Hero', to: 'FloatingAdvisor', health: 'healthy', description: 'Renders advisor slot in hero section' },
  { from: 'AdvisorSession', to: 'UserSettings', health: 'coupled', description: 'Direct DB join on userId — consider decoupling via service layer' },
  { from: 'AnalyticsWidget', to: 'Observatory', health: 'coupled', description: 'Shares chart config — should extract to shared module' },
  { from: 'LegacyScan', to: 'Observatory', health: 'circular', description: 'Circular import: Observatory imports types from LegacyScan which imports Observatory utils' },
  { from: 'ProductEngine', to: 'ArchitectureEngine', health: 'healthy', description: 'Sends proposals for architecture review before implementation' },
]

// ─── Helpers ─────────────────────────────────────────────

const OVERALL_SCORE = 87

function decisionTypeConfig(type: DecisionType) {
  switch (type) {
    case 'reuse': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: Recycle, label: 'Reuse' }
    case 'new': return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Puzzle, label: 'New Component' }
    case 'schema': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: Database, label: 'Schema Change' }
    case 'modify': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: FileCode, label: 'Modify Existing' }
    case 'cleanup': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: Trash2, label: 'Cleanup' }
  }
}

function creepStatusConfig(status: CreepStatus) {
  switch (status) {
    case 'blocked': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Blocked' }
    case 'diverted': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Diverted' }
    case 'approved': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Approved' }
  }
}

function dependencyHealthConfig(health: DependencyHealth) {
  switch (health) {
    case 'healthy': return { color: 'text-emerald-400', dot: 'bg-emerald-400', line: 'text-emerald-500' }
    case 'coupled': return { color: 'text-amber-400', dot: 'bg-amber-400', line: 'text-amber-500' }
    case 'circular': return { color: 'text-red-400', dot: 'bg-red-400', line: 'text-red-500' }
  }
}

function confidenceColor(score: number): string {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 75) return 'text-cyan-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Circular Gauge ──────────────────────────────────────

function CircularGauge({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  const gaugeColor = score >= 90 ? '#34d399' : score >= 75 ? '#22d3ee' : score >= 60 ? '#fbbf24' : '#f87171'

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
        <span className="text-4xl font-bold text-cyan-400">{score}</span>
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

export default function ArchitectureEnginePage() {
  const mounted = useHydrated()

  if (!mounted) return null

  const soundDecisions = architectureDecisions.filter(d => d.type === 'reuse' || d.type === 'modify').length + 30
  const refactorSuggestions = architectureDecisions.filter(d => d.type === 'schema').length + 3
  const featureCreepBlocked = featureCreepAlerts.filter(a => a.status === 'blocked').length
  const reuseOpportunities = architectureDecisions.filter(d => d.type === 'reuse').length + 6

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Architecture Engine™</h1>
            <p className="text-slate-400 text-sm">Staff Engineer — decides WHERE changes go</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Running</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Force Re-analyze
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Architecture Score Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-cyan-500/5 via-slate-900 to-slate-900 border border-cyan-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular Gauge */}
          <div className="flex-shrink-0">
            <CircularGauge score={OVERALL_SCORE} size={160} />
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Architecture Health</span>
            </div>
          </div>

          {/* 4 Stat Boxes */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{soundDecisions}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sound Decisions</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">{refactorSuggestions}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Refactor Suggestions</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Ban className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{featureCreepBlocked}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Feature Creep Blocked</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Recycle className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">{reuseOpportunities}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Reuse Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Recent Architecture Decisions
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Recent Architecture Decisions
          <span className="ml-auto text-[10px] text-slate-400">{architectureDecisions.length} this session</span>
        </h2>
        <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
          {architectureDecisions.map((decision) => {
            const config = decisionTypeConfig(decision.type)
            const TypeIcon = config.icon
            return (
              <div
                key={decision.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <TypeIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{decision.title}</span>
                      <span className={`text-sm font-bold flex-shrink-0 ${confidenceColor(decision.confidence)}`}>
                        {decision.confidence}%
                      </span>
                    </div>
                    {/* Path */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Route className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <code className="text-[11px] text-slate-400 font-mono truncate">{decision.path}</code>
                    </div>
                    {/* Reasoning */}
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{decision.reasoning}</p>
                    {/* Bottom row: badge + timestamp */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {decision.timestamp}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Architecture Reviewer™ — Feature Creep Prevention
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-400" />
            Architecture Reviewer™
          </h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Feature Creep Prevention</span>
        </div>

        {/* Summary banner */}
        <div className="bg-gradient-to-r from-red-500/5 via-slate-900 to-amber-500/5 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-300">Prevented <span className="text-white font-bold">{featureCreepBlocked}</span> unnecessary new components this week</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" />
                {featureCreepAlerts.filter(a => a.status === 'blocked').length} blocked
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                {featureCreepAlerts.filter(a => a.status === 'diverted').length} diverted
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {featureCreepAlerts.filter(a => a.status === 'approved').length} approved
              </span>
            </div>
          </div>
        </div>

        {/* Feature Creep Alert cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {featureCreepAlerts.map((alert) => {
            const config = creepStatusConfig(alert.status)
            const StatusIcon = config.icon
            return (
              <div
                key={alert.id}
                className={`bg-slate-900 border rounded-xl p-4 hover:border-slate-700 transition-all duration-200 ${config.border}`}
              >
                {/* Original suggestion */}
                <div className="mb-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Product Engine Suggested</div>
                  <div className="text-xs text-slate-300">{alert.originalSuggestion}</div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-slate-700" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Architecture response */}
                <div className="mb-3">
                  <div className="text-[10px] text-cyan-500 uppercase tracking-wider mb-1">Architecture Response</div>
                  <div className="text-xs text-slate-300">{alert.architectureResponse}</div>
                </div>

                {/* Recommended alternative */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 mb-3">
                  <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1">Recommended Alternative</div>
                  <div className="text-xs text-slate-300 font-medium">{alert.recommendedAlternative}</div>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-end">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Dependency Graph
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          Dependency Graph
          <span className="ml-auto text-[10px] text-slate-500">Key architectural relationships</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {/* Legend */}
          <div className="flex items-center gap-5 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Healthy</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">Coupled</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-slate-400">Circular</span>
            </div>
          </div>

          {/* Relations */}
          <div className="space-y-3">
            {dependencyRelations.map((rel, idx) => {
              const config = dependencyHealthConfig(rel.health)
              return (
                <div key={idx} className="flex items-center gap-3 group">
                  {/* From module */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="text-xs font-mono text-slate-300 text-right truncate">{rel.from}</span>
                    <Box className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className={`h-px w-6 ${rel.health === 'healthy' ? 'bg-emerald-500/40' : rel.health === 'coupled' ? 'bg-amber-500/40' : 'bg-red-500/40'}`} />
                    <ArrowRight className={`w-3.5 h-3.5 ${config.line}`} />
                    <div className={`h-px w-6 ${rel.health === 'healthy' ? 'bg-emerald-500/40' : rel.health === 'coupled' ? 'bg-amber-500/40' : 'bg-red-500/40'}`} />
                  </div>

                  {/* To module */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Box className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-slate-300 truncate">{rel.to}</span>
                  </div>

                  {/* Health dot + description */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-56 hidden lg:flex">
                    <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    <span className="text-[10px] text-slate-500 truncate">{rel.description}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Quick Actions Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next review: <span className="text-slate-300">in 23 min</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Last review: <span className="text-slate-300">37m ago</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-cyan-400" />
          <span>Modules scanned: <span className="text-slate-300">142</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Reuse rate: <span className="text-cyan-400">73%</span></span>
      </div>

    </div>
  )
}
