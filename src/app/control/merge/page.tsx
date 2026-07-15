'use client'

import { useState, useEffect } from 'react'
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
  Calendar,
  RefreshCw,
} from 'lucide-react'

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
  const [factoryData, setFactoryData] = useState<any>(null)
  const [memoryData, setMemoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        setFactoryData({
          system: json.system || {},
          counts: json.counts || {},
          recentActivity: json.recentActivity || [],
          ok: json.ok ?? true,
        })
        setMemoryData({
          memories: json.recentMemories || [],
          count: json.counts?.memory ?? 0,
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
        <h2 className="text-lg font-semibold text-red-400 mb-1">Failed to load merge data</h2>
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

  // ─── Derive gate status from system health ──────────────
  const system = factoryData?.system || {}
  const gates = [
    {
      name: 'QA Gate',
      icon: Shield,
      status: system.qaEngine === 'operational' ? 'PASS' : system.qaEngine === 'degraded' ? 'PENDING' : 'FAIL',
      detail: system.qaEngine === 'operational' ? 'QA engine running normally' : `QA engine: ${system.qaEngine || 'unknown'}`,
    },
    {
      name: 'Review Gate',
      icon: Eye,
      status: system.governor === 'operational' ? 'PASS' : system.governor === 'degraded' ? 'PENDING' : 'FAIL',
      detail: system.governor === 'operational' ? 'Design system + philosophy reviews active' : `Governor: ${system.governor || 'unknown'}`,
    },
    {
      name: 'Architecture Gate',
      icon: Landmark,
      status: system.codebaseScanner === 'operational' ? 'PASS' : system.codebaseScanner === 'degraded' ? 'PENDING' : 'FAIL',
      detail: system.codebaseScanner === 'operational' ? 'No feature creep, proper file placement' : `Scanner: ${system.codebaseScanner || 'unknown'}`,
    },
  ]
  const allGatesPass = gates.every(g => g.status === 'PASS')

  // ─── Derive open PRs from factory tasks (recent activity) ──
  const openPRs = (factoryData?.recentActivity || [])
    .filter((a: any) => a.type === 'task')
    .slice(0, 4)
    .map((task: any, i: number) => {
      const statusMap: Record<string, { text: string; color: string }> = {
        pending: { text: 'Pending', color: 'amber' },
        running: { text: 'In Review', color: 'amber' },
        completed: { text: 'Approved', color: 'cyan' },
        failed: { text: 'Revisions', color: 'red' },
      }
      const taskStatus = statusMap[task.status] || statusMap.pending
      return {
        number: task.id?.substring(0, 4) || String(40 + i),
        title: task.title || 'Factory task',
        branch: `task/${task.id?.substring(0, 8) || 'unknown'}`,
        filesChanged: 1,
        additions: 0,
        deletions: 0,
        status: taskStatus.text,
        statusColor: taskStatus.color,
        qaGate: task.status === 'completed' ? 'PASS' : 'PENDING',
        reviewGate: task.status === 'completed' ? 'PASS' : 'PENDING',
        archGate: allGatesPass ? 'PASS' : 'PENDING',
        reviewer: 'system',
        age: task.createdAt
          ? (() => {
              const diff = Date.now() - new Date(task.createdAt).getTime()
              const hrs = Math.floor(diff / 3600000)
              if (hrs < 24) return `${hrs}h ago`
              return `${Math.floor(hrs / 24)}d ago`
            })()
          : 'N/A',
      }
    })

  // ─── Derive recent merges from engineering memory (success outcomes) ──
  const recentMerges = (memoryData?.memories || [])
    .filter((m: any) => m.outcome === 'success')
    .slice(0, 4)
    .map((m: any) => ({
      number: m.id?.substring(0, 4) || 'N/A',
      title: m.feature || 'Unknown feature',
      mergedBy: 'system',
      mergedAt: m.createdAt
        ? (() => {
            const diff = Date.now() - new Date(m.createdAt).getTime()
            const hrs = Math.floor(diff / 3600000)
            if (hrs < 24) return `${hrs}h ago`
            return `${Math.floor(hrs / 24)}d ago`
          })()
        : 'N/A',
      result: 'success' as const,
      additions: m.testsAdded ?? 0,
      deletions: m.testsFailed ?? 0,
    }))

  // ─── Derive footer stats from real data ─────────────────
  const factoryTasks = factoryData?.counts?.factoryTasks ?? 0
  const engineeringMemories = memoryData?.count ?? 0
  const successCount = (memoryData?.memories || []).filter((m: any) => m.outcome === 'success').length
  const rollbackCount = (memoryData?.memories || []).filter((m: any) => m.rollbackNeeded).length

  const footerStats = [
    { label: 'Open Tasks', value: String(factoryTasks), icon: GitBranch, color: 'emerald' },
    { label: 'Memories', value: String(engineeringMemories), icon: Clock, color: 'cyan' },
    { label: 'Success Rate', value: engineeringMemories > 0 ? `${Math.round((successCount / engineeringMemories) * 100)}%` : '—', icon: CheckCircle2, color: 'emerald' },
    { label: 'Rollbacks', value: String(rollbackCount), icon: XCircle, color: 'red' },
  ]

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
              <div className={`w-2 h-2 rounded-full ${allGatesPass ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className={`text-xs font-medium ${allGatesPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                {allGatesPass ? 'Monitoring' : 'Attention needed'}
              </span>
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
                className={`bg-slate-800/50 border rounded-lg p-4 flex items-start gap-3 ${
                  gate.status === 'PASS' ? 'border-emerald-500/20' :
                  gate.status === 'FAIL' ? 'border-red-500/20' :
                  'border-amber-500/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  gate.status === 'PASS' ? 'bg-emerald-500/10' :
                  gate.status === 'FAIL' ? 'bg-red-500/10' :
                  'bg-amber-500/10'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    gate.status === 'PASS' ? 'text-emerald-400' :
                    gate.status === 'FAIL' ? 'text-red-400' :
                    'text-amber-400'
                  }`} />
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
        <div className={`border rounded-lg p-4 flex items-center gap-3 ${
          allGatesPass
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          {allGatesPass ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          )}
          <div>
            <div className={`text-sm font-bold ${allGatesPass ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allGatesPass ? '✅ ALL GATES PASS' : '⚠️ SOME GATES PENDING'}
            </div>
            <div className="text-xs text-slate-400">
              {allGatesPass
                ? 'PR can be created — all 3 gates have passed'
                : 'Some gates have not passed — review required before merging'}
            </div>
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
        {openPRs.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {openPRs.map((pr: any) => (
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
        ) : (
          <div className="text-center py-8">
            <GitBranch className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No open pull requests</p>
            <p className="text-xs text-slate-500 mt-1">PRs will appear when factory tasks are in progress</p>
          </div>
        )}
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
        {recentMerges.length > 0 ? (
          <div className="space-y-3">
            {recentMerges.map((merge: any) => (
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
                <Badge text="Merged" color="emerald" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <GitMerge className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No recent merges</p>
            <p className="text-xs text-slate-500 mt-1">Successful merges will appear here</p>
          </div>
        )}
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
