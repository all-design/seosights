'use client'

import { useSyncExternalStore } from 'react'
import {
  ScrollText, RefreshCw, FileText, BookOpen, Users, GitBranch,
  Clock, ChevronRight, CheckCircle2, AlertTriangle, Calendar,
  Activity, ShieldCheck, Layers, History, Zap,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface DocSection {
  id: string
  number: string
  title: string
  pageRange: string
  pageCount: number
  subsections?: string[]
}

interface ChangeRecord {
  id: string
  version: string
  timestamp: string
  description: string
  type: 'addition' | 'update' | 'revision'
}

interface Contributor {
  id: string
  name: string
  role: string
  commits: number
}

interface ValidationItem {
  id: string
  label: string
  value: string
  status: 'pass' | 'warn' | 'info'
  detail: string
}

// ─── Mock Data ───────────────────────────────────────────

const docSections: DocSection[] = [
  {
    id: 'sec-1',
    number: '1',
    title: 'Platform Overview',
    pageRange: 'pp. 1-12',
    pageCount: 12,
  },
  {
    id: 'sec-2',
    number: '2',
    title: 'Architecture Decisions',
    pageRange: 'pp. 13-34',
    pageCount: 22,
  },
  {
    id: 'sec-3',
    number: '3',
    title: 'Engine Specifications',
    pageRange: 'pp. 35-89',
    pageCount: 55,
    subsections: [
      '3.1 Observatory Engine',
      '3.2 Product Engine',
      '3.3 Architecture Engine',
      '3.4 Engineering Engine',
      '3.5 QA Engine',
      '3.6 Review Engine',
      '3.7 Security Engine',
      '3.8 Performance Engine',
      '3.9 Merge Engine',
      '3.10 Deploy Engine',
      '3.11 Replay Engine',
      '3.12 Learning Engine',
      '3.13 Documentation Engine',
      '3.14 AI Governor',
    ],
  },
  {
    id: 'sec-4',
    number: '4',
    title: 'Database Schema',
    pageRange: 'pp. 90-112',
    pageCount: 23,
  },
  {
    id: 'sec-5',
    number: '5',
    title: 'API Specifications',
    pageRange: 'pp. 113-156',
    pageCount: 44,
  },
  {
    id: 'sec-6',
    number: '6',
    title: 'Component Library',
    pageRange: 'pp. 157-198',
    pageCount: 42,
  },
  {
    id: 'sec-7',
    number: '7',
    title: 'Design System',
    pageRange: 'pp. 199-224',
    pageCount: 26,
  },
  {
    id: 'sec-8',
    number: '8',
    title: 'Deployment Pipeline',
    pageRange: 'pp. 225-240',
    pageCount: 16,
  },
  {
    id: 'sec-9',
    number: '9',
    title: 'Quality Standards',
    pageRange: 'pp. 241-258',
    pageCount: 18,
  },
  {
    id: 'sec-10',
    number: '10',
    title: 'Security Protocols',
    pageRange: 'pp. 259-272',
    pageCount: 14,
  },
  {
    id: 'sec-11',
    number: '11',
    title: 'Research Methodology',
    pageRange: 'pp. 273-289',
    pageCount: 17,
  },
  {
    id: 'sec-12',
    number: '12',
    title: 'Growth Strategy',
    pageRange: 'pp. 290-310',
    pageCount: 21,
  },
  {
    id: 'sec-13',
    number: '13',
    title: 'Operations Manual',
    pageRange: 'pp. 311-330',
    pageCount: 20,
  },
  {
    id: 'sec-14',
    number: '14',
    title: 'Compliance & Audit',
    pageRange: 'pp. 331-347',
    pageCount: 17,
  },
]

const changeHistory: ChangeRecord[] = [
  {
    id: 'ch-1',
    version: 'v2.14.3',
    timestamp: '2h ago',
    description: 'Added AI Governor specification section',
    type: 'addition',
  },
  {
    id: 'ch-2',
    version: 'v2.14.2',
    timestamp: '1 day ago',
    description: 'Updated QA Engine quality gates',
    type: 'update',
  },
  {
    id: 'ch-3',
    version: 'v2.14.1',
    timestamp: '3 days ago',
    description: 'Added Documentation Engine specs',
    type: 'addition',
  },
  {
    id: 'ch-4',
    version: 'v2.14.0',
    timestamp: '5 days ago',
    description: 'Major revision — AI Software Factory pipeline',
    type: 'revision',
  },
  {
    id: 'ch-5',
    version: 'v2.13.8',
    timestamp: '1 week ago',
    description: 'Updated database schema documentation',
    type: 'update',
  },
]

const contributors: Contributor[] = [
  { id: 'c-1', name: 'AI Governor', role: 'Final authority', commits: 89 },
  { id: 'c-2', name: 'Architecture Engine', role: 'Structural integrity', commits: 142 },
  { id: 'c-3', name: 'Documentation Engine', role: 'Auto-extraction', commits: 268 },
  { id: 'c-4', name: 'Human Review', role: 'Validation', commits: 47 },
]

const validationStatus: ValidationItem[] = [
  {
    id: 'v-1',
    label: 'Constitution Compliance',
    value: '100%',
    status: 'pass',
    detail: 'All sections compliant with Level 1 rules',
  },
  {
    id: 'v-2',
    label: 'Code-Documentation Drift',
    value: '2 instances',
    status: 'warn',
    detail: 'Minor drift on Button.tsx and /api/advisor route',
  },
  {
    id: 'v-3',
    label: 'Last Full Validation',
    value: '2 hours ago',
    status: 'info',
    detail: 'Scheduled validation completed at 06:00',
  },
  {
    id: 'v-4',
    label: 'Next Scheduled Validation',
    value: '06:00 tomorrow',
    status: 'info',
    detail: 'Daily cron triggers full re-scan',
  },
]

// ─── Helpers ─────────────────────────────────────────────

const TOTAL_PAGES = 347
const SECTION_COUNT = 28
const VERSION = '2.14.3'

function changeTypeConfig(type: ChangeRecord['type']) {
  switch (type) {
    case 'addition':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', label: 'Addition' }
    case 'update':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', label: 'Update' }
    case 'revision':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', label: 'Revision' }
  }
}

function validationStatusConfig(status: ValidationItem['status']) {
  switch (status) {
    case 'pass':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2 }
    case 'warn':
      return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle }
    case 'info':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', icon: Activity }
  }
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function MasterSpecificationPage() {
  const mounted = useHydrated()

  if (!mounted) return null

  const maxSectionPages = Math.max(...docSections.map(s => s.pageCount))

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Master Specification</h1>
            <p className="text-slate-400 text-sm">Level 2 — Living Document</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-400">Living</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Last Updated: 2 hours ago
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Overview Stats
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Pages</span>
          </div>
          <div className="text-2xl font-bold text-white">{TOTAL_PAGES}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Sections</span>
          </div>
          <div className="text-2xl font-bold text-white">{SECTION_COUNT}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Last Updated</span>
          </div>
          <div className="text-2xl font-bold text-white">2h<span className="text-sm font-normal text-slate-500 ml-1">ago</span></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Contributors</span>
          </div>
          <div className="text-2xl font-bold text-white">4</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Version</span>
          </div>
          <div className="text-2xl font-bold text-white">{VERSION}</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Document Structure — Table of Contents
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Document Structure
          <span className="ml-auto text-[10px] text-slate-500">Table of Contents</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {docSections.map((section) => (
              <div
                key={section.id}
                className="group cursor-pointer hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Section number */}
                  <div className="w-8 h-8 rounded-md bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-cyan-400">{section.number}</span>
                  </div>

                  {/* Title + page range */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                        {section.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">{section.pageRange}</span>
                    </div>
                    {/* Page count bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500/40 to-cyan-500/80 rounded-full transition-all duration-500"
                          style={{ width: `${(section.pageCount / maxSectionPages) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 flex-shrink-0 w-16 text-right">
                        {section.pageCount} {section.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                </div>

                {/* Subsections (only for Section 3 — Engine Specs) */}
                {section.subsections && (
                  <div className="ml-11 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-1 pr-3">
                    {section.subsections.map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <div className="w-1 h-1 rounded-full bg-cyan-500/60 flex-shrink-0" />
                        <span className="font-mono truncate">{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Change History
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          Change History
          <span className="ml-auto text-[10px] text-slate-500">Last 5 updates</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          {/* Vertical timeline */}
          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800" />

            {changeHistory.map((record) => {
              const config = changeTypeConfig(record.type)
              return (
                <div key={record.id} className="relative flex items-start gap-3 pl-0">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${config.bg} ${config.border}`}>
                    <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold text-white">{record.version}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                        <Clock className="w-3 h-3" />
                        {record.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{record.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Living Document Notice
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-cyan-500/5 via-slate-900 to-slate-900 border border-cyan-500/15 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">Living Document Notice</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-cyan-500/15 text-cyan-400 border-cyan-500/20">
                <RefreshCw className="w-2.5 h-2.5" />
                Auto-Evolving
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This specification evolves with the platform. Every deploy may update it.
              The <span className="text-cyan-400 font-medium">Constitution (Level 1)</span> governs what changes are allowed here.
              Lower-level documents (Daily Mission, Engine Docs) must remain consistent with this specification.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Validation Status
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Validation Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {validationStatus.map((item) => {
            const config = validationStatusConfig(item.status)
            const StatusIcon = config.icon
            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-4 ${config.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`text-lg font-bold ${config.color} mb-1`}>{item.value}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          7. Contributors
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Contributors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contributors.map((contributor) => (
            <div
              key={contributor.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-cyan-400">
                    {contributor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">{contributor.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{contributor.role}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 uppercase tracking-wider">Commits</span>
                <span className="text-cyan-400 font-bold">{contributor.commits}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Created: <span className="text-slate-300">Jan 2024</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Format: <span className="text-slate-300">Markdown + AST</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Auto-rebuilt: <span className="text-cyan-400">on every deploy</span></span>
        <span className="text-slate-700">|</span>
        <span>Authority: <span className="text-cyan-400">Level 1 Constitution</span></span>
      </div>

    </div>
  )
}
