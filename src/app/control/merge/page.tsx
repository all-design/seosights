'use client'

import {
  GitMerge,
  ExternalLink,
  Shield,
  Eye,
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  FileCode,
  Plus,
  Minus,
  User,
  AlertTriangle,
  Lock,
  Info,
  ArrowRight,
  Calendar,
} from 'lucide-react'

// ─── Gate Status Data ────────────────────────────────────────────────
const gates = [
  {
    name: 'QA Gate',
    icon: Shield,
    status: 'PASS' as const,
    detail: 'All 47 tests passing',
    color: 'emerald',
  },
  {
    name: 'Review Gate',
    icon: Eye,
    status: 'PASS' as const,
    detail: 'Design system + philosophy approved',
    color: 'emerald',
  },
  {
    name: 'Architecture Gate',
    icon: Landmark,
    status: 'PASS' as const,
    detail: 'No feature creep, proper file placement',
    color: 'emerald',
  },
]

// ─── Open PRs Data ───────────────────────────────────────────────────
const openPRs = [
  {
    number: 47,
    title: 'Add AI Advisor to homepage',
    branch: 'feature/ai-advisor',
    filesChanged: 12,
    additions: 847,
    deletions: 23,
    status: 'Ready' as const,
    statusColor: 'emerald',
    qaGate: 'PASS',
    reviewGate: 'PASS',
    archGate: 'PASS',
    reviewer: 'sarah@seosights.io',
    age: '4h ago',
  },
  {
    number: 46,
    title: 'Fix pricing accessibility',
    branch: 'fix/pricing-a11y',
    filesChanged: 5,
    additions: 132,
    deletions: 48,
    status: 'Approved' as const,
    statusColor: 'cyan',
    qaGate: 'PASS',
    reviewGate: 'PASS',
    archGate: 'PASS',
    reviewer: 'mike@seosights.io',
    age: '6h ago',
  },
  {
    number: 45,
    title: 'Refactor observatory queries',
    branch: 'refactor/observatory-queries',
    filesChanged: 8,
    additions: 294,
    deletions: 387,
    status: 'In Review' as const,
    statusColor: 'amber',
    qaGate: 'PASS',
    reviewGate: 'PENDING',
    archGate: 'PASS',
    reviewer: 'dave@seosights.io',
    age: '1d ago',
  },
  {
    number: 44,
    title: 'Update engagement streaks',
    branch: 'feature/engagement-streaks',
    filesChanged: 9,
    additions: 421,
    deletions: 56,
    status: 'Revisions' as const,
    statusColor: 'red',
    qaGate: 'PASS',
    reviewGate: 'FAIL',
    archGate: 'PASS',
    reviewer: 'sarah@seosights.io',
    age: '2d ago',
  },
]

// ─── Recent Merges Data ──────────────────────────────────────────────
const recentMerges = [
  {
    number: 43,
    title: 'Add schema markup to blog posts',
    mergedBy: 'mike@seosights.io',
    mergedAt: '3h ago',
    result: 'success' as const,
    additions: 89,
    deletions: 12,
  },
  {
    number: 42,
    title: 'Optimize Lighthouse performance',
    mergedBy: 'sarah@seosights.io',
    mergedAt: '8h ago',
    result: 'success' as const,
    additions: 156,
    deletions: 203,
  },
  {
    number: 41,
    title: 'Fix mobile nav overflow',
    mergedBy: 'dave@seosights.io',
    mergedAt: '1d ago',
    result: 'success' as const,
    additions: 34,
    deletions: 18,
  },
  {
    number: 40,
    title: 'Add competitor analysis tooltips',
    mergedBy: 'mike@seosights.io',
    mergedAt: '2d ago',
    result: 'success' as const,
    additions: 67,
    deletions: 5,
  },
]

// ─── Footer Stats ────────────────────────────────────────────────────
const footerStats = [
  { label: 'Open PRs', value: '4', icon: GitBranch, color: 'emerald' },
  { label: 'Avg Merge Time', value: '18h', icon: Clock, color: 'cyan' },
  { label: 'Merge Success Rate', value: '94%', icon: CheckCircle2, color: 'emerald' },
  { label: 'Rejected This Month', value: '2', icon: XCircle, color: 'red' },
]

// ─── Badge Component ─────────────────────────────────────────────────
function Badge({ text, color }: { text: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${colorMap[color] || colorMap.slate}`}>
      {text}
    </span>
  )
}

function GateBadge({ status }: { status: string }) {
  if (status === 'PASS') return <span className="text-emerald-400 text-xs font-semibold">✅ PASS</span>
  if (status === 'FAIL') return <span className="text-red-400 text-xs font-semibold">❌ FAIL</span>
  return <span className="text-amber-400 text-xs font-semibold">⏳ {status}</span>
}

// ─── Main Component ──────────────────────────────────────────────────
export default function MergeEnginePage() {
  return (
    <div className="space-y-6">
      {/* ═══ Section 1: Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <GitMerge className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Merge Engine™</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Monitoring</span>
            </div>
          </div>
        </div>
        <a
          href="https://github.com/seosights/platform"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on GitHub
        </a>
      </div>

      {/* ═══ Section 2: Gate Status ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Gate Status — All gates must pass before PR is created
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {gates.map((gate) => {
            const Icon = gate.icon
            return (
              <div
                key={gate.name}
                className="bg-slate-800/50 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{gate.name}</span>
                    <GateBadge status={gate.status} />
                  </div>
                  <p className="text-[11px] text-slate-400">{gate.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
        {/* Overall Status */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-emerald-400">✅ ALL GATES PASS</div>
            <div className="text-xs text-slate-400">PR can be created — all 3 gates have passed</div>
          </div>
        </div>
      </div>

      {/* ═══ Section 3: Open Pull Requests ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          Open Pull Requests
          <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{openPRs.length} open</span>
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {openPRs.map((pr) => (
            <div
              key={pr.number}
              className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/70 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-emerald-400 font-semibold">#{pr.number}</span>
                    <span className="text-sm font-medium text-white">{pr.title}</span>
                    <Badge text={pr.status} color={pr.statusColor} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {pr.branch}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode className="w-3 h-3" />
                      {pr.filesChanged} files
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <Plus className="w-3 h-3" />
                      {pr.additions}
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <Minus className="w-3 h-3" />
                      {pr.deletions}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
                  <User className="w-3 h-3" />
                  {pr.reviewer}
                  <span className="text-slate-600 mx-1">·</span>
                  <Clock className="w-3 h-3" />
                  {pr.age}
                </div>
              </div>
              {/* Gate Results Row */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-700/30">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Gates:</span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px]">
                    <GateBadge status={pr.qaGate} />
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px]">
                    <GateBadge status={pr.reviewGate} />
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px]">
                    <GateBadge status={pr.archGate} />
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 4: Merge Policy ═══ */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Merge Policy
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-slate-300"><span className="font-semibold text-red-400">Auto-merge: DISABLED</span> — All merges require human approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-sm text-slate-300"><span className="font-semibold text-amber-400">Branch protection:</span> <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-cyan-400">main</code> is protected</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-400">Minimum 1 approving review required. Stale reviews dismissed on push.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 5: Recent Merges ═══ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-emerald-400" />
          Recent Merges
        </h2>
        <div className="space-y-3">
          {recentMerges.map((merge) => (
            <div
              key={merge.number}
              className="flex items-center gap-4 bg-slate-800/30 border border-slate-700/30 rounded-lg px-4 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-emerald-400 font-semibold">#{merge.number}</span>
                  <span className="text-sm text-white truncate">{merge.title}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {merge.mergedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {merge.mergedAt}
                  </span>
                  <span className="text-emerald-500">+{merge.additions}</span>
                  <span className="text-red-400">-{merge.deletions}</span>
                </div>
              </div>
              <Badge text={merge.result === 'success' ? 'Merged' : 'Failed'} color={merge.result === 'success' ? 'emerald' : 'red'} />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section 6: Footer Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {footerStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center"
            >
              <Icon className={`w-4 h-4 text-${stat.color}-400 mx-auto mb-2`} />
              <div className={`text-xl font-bold text-${stat.color}-400`}>{stat.value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
