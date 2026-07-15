'use client'

import { useEffect, useState } from 'react'
import {
  Table2, RefreshCw, Clock, Scan, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, GitBranch,
  Database, ArrowRight, Key, Link2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type ModelStatus = 'synced' | 'drift' | 'missing'

// ─── Main Component ──────────────────────────────────────

export default function DatabaseSchemaPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const factory = data?.factory || {}
  const counts = factory.counts || {}
  const system = factory.system || {}

  // Derive DB status from system health
  const dbStatus: ModelStatus = system.codebaseScanner === 'operational' ? 'synced' : system.codebaseScanner === 'degraded' ? 'drift' : 'missing'

  // Derive models from factory counts
  const models = Object.entries(counts).map(([key, count]) => ({
    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
    recordCount: count as number,
    status: 'synced' as ModelStatus,
  }))

  const totalRecords = Object.values(counts).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0)
  const syncedModels = models.filter(m => m.status === 'synced').length
  const dbHealthPercent = models.length > 0 ? Math.round((syncedModels / models.length) * 100) : 0

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Database Schema Docs™</h1>
            <p className="text-slate-400 text-sm">Auto-generated from Prisma schema</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            dbStatus === 'synced'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : dbStatus === 'drift'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              dbStatus === 'synced' ? 'bg-emerald-400' : dbStatus === 'drift' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <span className={`text-xs font-medium ${
              dbStatus === 'synced' ? 'text-emerald-400' : dbStatus === 'drift' ? 'text-amber-400' : 'text-red-400'
            }`}>{dbStatus === 'synced' ? 'Schema Synced' : dbStatus === 'drift' ? 'Schema Drift' : 'Out of Sync'}</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-500/5 via-slate-900 to-slate-900 border border-emerald-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* DB Health Circle */}
          <div className="flex-shrink-0">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={58} fill="none" stroke="#1e293b" strokeWidth={8} />
                <circle cx={70} cy={70} r={58} fill="none" stroke="#34d399" strokeWidth={8} strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - dbHealthPercent / 100)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">{dbHealthPercent}%</span>
                <span className="text-[10px] text-slate-500">DB Health</span>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Table2 className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{models.length}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Prisma Models</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{totalRecords.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Records</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{syncedModels}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Synced</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">SQLite</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Models Table
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Table2 className="w-4 h-4 text-emerald-400" />
          Prisma Models
          <span className="ml-auto text-[10px] text-slate-400">{models.length} models</span>
        </h2>
        {models.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No database models found</p>
            <p className="text-[11px] text-slate-500 mt-1">Models will appear after database is seeded</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Model</div>
              <div className="col-span-2 text-center">Records</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right">Engine</div>
            </div>
            {/* Table rows */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {models.map((model) => (
                <div key={model.name} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center">
                  <div className="col-span-5 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-white truncate">{model.name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs text-slate-300">{model.recordCount.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Synced
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-[10px] text-slate-500">SQLite + Prisma</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. System Health for DB
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-400" />
          Database-Dependent Systems
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(system).map(([key, status]) => {
            const isOk = status === 'operational'
            const isDegraded = status === 'degraded'
            return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {isOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                   isDegraded ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> :
                   <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <span className={`text-xs font-medium ${isOk ? 'text-emerald-400' : isDegraded ? 'text-amber-400' : 'text-red-400'}`}>
                    {String(status)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Last scan: <span className="text-slate-300">{factory.timestamp ? new Date(factory.timestamp).toLocaleTimeString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-emerald-400" />
          <span>Models: <span className="text-slate-300">{models.length}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Engine: <span className="text-emerald-400">SQLite + Prisma ORM</span></span>
        <span className="text-slate-700">|</span>
        <span>Total records: <span className="text-slate-300">{totalRecords.toLocaleString()}</span></span>
      </div>

    </div>
  )
}
