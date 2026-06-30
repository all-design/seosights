'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  Table2, RefreshCw, Clock, Scan, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, GitBranch,
  Database, ArrowRight, Key, Link2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type ModelStatus = 'synced' | 'drift' | 'missing'
type MigrationStatus = 'applied' | 'pending' | 'failed'

interface FieldDetail {
  name: string
  type: string
  nullable: boolean
  unique: boolean
}

interface PrismaModel {
  id: string
  name: string
  fieldsCount: number
  relations: string[]
  indexes: number
  recordCount: number
  status: ModelStatus
  lastUpdated: string
  fields: FieldDetail[]
}

interface Migration {
  id: string
  version: string
  description: string
  timestamp: string
  status: MigrationStatus
}

// ─── Mock Data ───────────────────────────────────────────

const prismaModels: PrismaModel[] = [
  {
    id: 'pm-1',
    name: 'User',
    fieldsCount: 12,
    relations: ['Organization', 'AdvisorSession', 'AuditLog'],
    indexes: 3,
    recordCount: 8429,
    status: 'synced',
    lastUpdated: '1h ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'email', type: 'String', nullable: false, unique: true },
      { name: 'name', type: 'String', nullable: false, unique: false },
      { name: 'role', type: 'Enum', nullable: false, unique: false },
      { name: 'organizationId', type: 'String', nullable: true, unique: false },
      { name: 'settings', type: 'Json', nullable: true, unique: false },
      { name: 'createdAt', type: 'DateTime', nullable: false, unique: false },
      { name: 'updatedAt', type: 'DateTime', nullable: false, unique: false },
    ],
  },
  {
    id: 'pm-2',
    name: 'Organization',
    fieldsCount: 9,
    relations: ['User', 'Opportunity', 'Deployment'],
    indexes: 2,
    recordCount: 312,
    status: 'synced',
    lastUpdated: '2h ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'name', type: 'String', nullable: false, unique: true },
      { name: 'plan', type: 'Enum', nullable: false, unique: false },
      { name: 'apiKey', type: 'String', nullable: false, unique: true },
      { name: 'settings', type: 'Json', nullable: true, unique: false },
      { name: 'createdAt', type: 'DateTime', nullable: false, unique: false },
    ],
  },
  {
    id: 'pm-3',
    name: 'Opportunity',
    fieldsCount: 14,
    relations: ['Organization', 'Research', 'GrowthMemory'],
    indexes: 4,
    recordCount: 2891,
    status: 'synced',
    lastUpdated: '3h ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'domain', type: 'String', nullable: false, unique: false },
      { name: 'targetModel', type: 'String', nullable: false, unique: false },
      { name: 'impactScore', type: 'Float', nullable: false, unique: false },
      { name: 'priority', type: 'Enum', nullable: false, unique: false },
      { name: 'status', type: 'Enum', nullable: false, unique: false },
      { name: 'keywords', type: 'Json', nullable: true, unique: false },
      { name: 'organizationId', type: 'String', nullable: false, unique: false },
      { name: 'createdAt', type: 'DateTime', nullable: false, unique: false },
    ],
  },
  {
    id: 'pm-4',
    name: 'Research',
    fieldsCount: 16,
    relations: ['Opportunity', 'Organization'],
    indexes: 5,
    recordCount: 14523,
    status: 'drift',
    lastUpdated: '5d ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'domain', type: 'String', nullable: false, unique: false },
      { name: 'model', type: 'String', nullable: false, unique: false },
      { name: 'visibilityScore', type: 'Float', nullable: false, unique: false },
      { name: 'citationCount', type: 'Int', nullable: false, unique: false },
      { name: 'response', type: 'Json', nullable: true, unique: false },
      { name: 'scannedAt', type: 'DateTime', nullable: false, unique: false },
      { name: 'organizationId', type: 'String', nullable: false, unique: false },
    ],
  },
  {
    id: 'pm-5',
    name: 'GrowthMemory',
    fieldsCount: 10,
    relations: ['Opportunity', 'Organization'],
    indexes: 3,
    recordCount: 6721,
    status: 'synced',
    lastUpdated: '4h ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'action', type: 'String', nullable: false, unique: false },
      { name: 'result', type: 'Json', nullable: true, unique: false },
      { name: 'confidence', type: 'Float', nullable: false, unique: false },
      { name: 'opportunityId', type: 'String', nullable: true, unique: false },
      { name: 'organizationId', type: 'String', nullable: false, unique: false },
      { name: 'createdAt', type: 'DateTime', nullable: false, unique: false },
    ],
  },
  {
    id: 'pm-6',
    name: 'Deployment',
    fieldsCount: 11,
    relations: ['Organization', 'AuditLog'],
    indexes: 3,
    recordCount: 892,
    status: 'synced',
    lastUpdated: '6h ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'version', type: 'String', nullable: false, unique: false },
      { name: 'environment', type: 'Enum', nullable: false, unique: false },
      { name: 'status', type: 'Enum', nullable: false, unique: false },
      { name: 'commitSha', type: 'String', nullable: false, unique: true },
      { name: 'deployedAt', type: 'DateTime', nullable: false, unique: false },
      { name: 'rolledBackAt', type: 'DateTime', nullable: true, unique: false },
      { name: 'organizationId', type: 'String', nullable: false, unique: false },
    ],
  },
  {
    id: 'pm-7',
    name: 'AdvisorSession',
    fieldsCount: 13,
    relations: ['User', 'Organization'],
    indexes: 2,
    recordCount: 3107,
    status: 'synced',
    lastUpdated: '1h ago',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'userId', type: 'String', nullable: false, unique: false },
      { name: 'context', type: 'String', nullable: false, unique: false },
      { name: 'messages', type: 'Json', nullable: true, unique: false },
      { name: 'tokenCount', type: 'Int', nullable: false, unique: false },
      { name: 'status', type: 'Enum', nullable: false, unique: false },
      { name: 'startedAt', type: 'DateTime', nullable: false, unique: false },
      { name: 'endedAt', type: 'DateTime', nullable: true, unique: false },
    ],
  },
  {
    id: 'pm-8',
    name: 'AuditLog',
    fieldsCount: 8,
    relations: ['User', 'Deployment'],
    indexes: 4,
    recordCount: 48921,
    status: 'missing',
    lastUpdated: 'never',
    fields: [
      { name: 'id', type: 'String', nullable: false, unique: true },
      { name: 'action', type: 'String', nullable: false, unique: false },
      { name: 'entity', type: 'String', nullable: false, unique: false },
      { name: 'details', type: 'Json', nullable: true, unique: false },
      { name: 'userId', type: 'String', nullable: true, unique: false },
      { name: 'createdAt', type: 'DateTime', nullable: false, unique: false },
    ],
  },
]

const migrationHistory: Migration[] = [
  { id: 'mig-1', version: '20240315000001', description: 'Add AdvisorSession model for persistent conversation storage', timestamp: '2024-03-15 14:23:00', status: 'applied' },
  { id: 'mig-2', version: '20240310000001', description: 'Add tokenCount field to AdvisorSession, index on userId', timestamp: '2024-03-10 09:15:00', status: 'applied' },
  { id: 'mig-3', version: '20240305000001', description: 'Add GrowthMemory model for AI learning pattern storage', timestamp: '2024-03-05 16:42:00', status: 'applied' },
  { id: 'mig-4', version: '20240228000001', description: 'Add visibilityScore and citationCount to Research model', timestamp: '2024-02-28 11:30:00', status: 'applied' },
  { id: 'mig-5', version: '20240220000001', description: 'Add Deployment model with rollback tracking', timestamp: '2024-02-20 08:15:00', status: 'applied' },
  { id: 'mig-6', version: '20240215000001', description: 'Add impactScore and priority fields to Opportunity', timestamp: '2024-02-15 13:55:00', status: 'applied' },
  { id: 'mig-7', version: '20240210000001', description: 'Add AuditLog model for compliance tracking', timestamp: '2024-02-10 10:00:00', status: 'pending' },
  { id: 'mig-8', version: '20240205000001', description: 'Add enum types for status fields across all models', timestamp: '2024-02-05 15:30:00', status: 'applied' },
  { id: 'mig-9', version: '20240130000001', description: 'Initial schema: User, Organization, Opportunity, Research', timestamp: '2024-01-30 09:00:00', status: 'applied' },
]

// ─── Helpers ─────────────────────────────────────────────

function modelStatusConfig(status: ModelStatus) {
  switch (status) {
    case 'synced': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Synced' }
    case 'drift': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Drift' }
    case 'missing': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Missing' }
  }
}

function migrationStatusConfig(status: MigrationStatus) {
  switch (status) {
    case 'applied': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' }
    case 'pending': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20' }
    case 'failed': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' }
  }
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function DatabaseDocsPage() {
  const mounted = useHydrated()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!mounted) return null

  const totalModels = prismaModels.length
  const totalFields = prismaModels.reduce((sum, m) => sum + m.fieldsCount, 0)
  const totalRelations = prismaModels.reduce((sum, m) => sum + m.relations.length, 0)
  const totalRecords = prismaModels.reduce((sum, m) => sum + m.recordCount, 0)
  const syncedModels = prismaModels.filter(m => m.status === 'synced').length
  const driftModels = prismaModels.filter(m => m.status === 'drift').length
  const missingModels = prismaModels.filter(m => m.status === 'missing').length

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Table2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Database Docs™</h1>
            <p className="text-slate-400 text-sm">Documentation Engine — auto-generated from Prisma schema</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Schema-synced</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Database Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-500/5 via-slate-900 to-slate-900 border border-emerald-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Schema health */}
          <div className="flex-shrink-0 text-center">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={58} fill="none" stroke="#1e293b" strokeWidth={8} />
                <circle cx={70} cy={70} r={58} fill="none" stroke="#34d399" strokeWidth={8} strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - syncedModels / totalModels)} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">{syncedModels}/{totalModels}</span>
                <span className="text-[10px] text-slate-500">Synced</span>
              </div>
            </div>
          </div>

          {/* Stat Boxes */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Table2 className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">{totalModels}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Models</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">{totalFields}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Fields</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Link2 className="w-4 h-4 text-violet-400" />
                <span className="text-2xl font-bold text-violet-400">{totalRelations}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Relations</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">{(totalRecords / 1000).toFixed(1)}k</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Records</div>
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" />{syncedModels} synced</span>
            <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" />{driftModels} drift</span>
            <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" />{missingModels} missing</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Auto-generated from Prisma schema</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. ERD Section
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          Entity Relationship Diagram
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-center gap-6 py-8 text-slate-500">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                <GitBranch className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-xs text-slate-400">Auto-generated ERD</div>
              <div className="text-[10px] text-slate-500 mt-1">Visualized from Prisma schema relations</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600" />
            <div className="text-center">
              <div className="space-y-1.5">
                {prismaModels.map((model) => (
                  <div key={model.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <Table2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px] font-mono text-slate-300">{model.name}</span>
                    <span className="text-[9px] text-slate-500">{model.relations.length} relations</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mt-2">
            <span>8 models</span>
            <span className="text-slate-700">|</span>
            <span>24 relations</span>
            <span className="text-slate-700">|</span>
            <span>93 fields</span>
            <span className="text-slate-700">|</span>
            <span>26 indexes</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Prisma Models List
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Prisma Models
          <span className="ml-auto text-[10px] text-slate-400">{totalModels} models</span>
        </h2>
        <div className="space-y-3">
          {prismaModels.map((model) => {
            const config = modelStatusConfig(model.status)
            const StatusIcon = config.icon
            const isExpanded = expandedId === model.id
            return (
              <div
                key={model.id}
                className="bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-200"
              >
                {/* Model header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : model.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Table2 className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-white">{model.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                      <span>{model.fieldsCount} fields</span>
                      <span>{model.relations.length} relations</span>
                      <span>{model.indexes} indexes</span>
                      <span>{model.recordCount.toLocaleString()} records</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {model.lastUpdated}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-800">
                    {/* Fields table */}
                    <div className="mt-4 mb-4">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Key className="w-3 h-3" />
                        Fields
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-800 text-[9px] text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                          <div className="col-span-4">Name</div>
                          <div className="col-span-3">Type</div>
                          <div className="col-span-2 text-center">Nullable</div>
                          <div className="col-span-2 text-center">Unique</div>
                          <div className="col-span-1" />
                        </div>
                        {model.fields.map((field) => (
                          <div key={field.name} className="grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-slate-700/30 items-center">
                            <div className="col-span-4 text-[11px] font-mono text-slate-300">{field.name}</div>
                            <div className="col-span-3">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono">{field.type}</span>
                            </div>
                            <div className="col-span-2 text-center">
                              {field.nullable ? (
                                <span className="text-[10px] text-amber-400">yes</span>
                              ) : (
                                <span className="text-[10px] text-slate-600">no</span>
                              )}
                            </div>
                            <div className="col-span-2 text-center">
                              {field.unique ? (
                                <Key className="w-3 h-3 text-amber-400 mx-auto" />
                              ) : (
                                <span className="text-[10px] text-slate-600">—</span>
                              )}
                            </div>
                            <div className="col-span-1" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relations */}
                    <div>
                      <div className="text-[10px] text-violet-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        Relations
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {model.relations.map((relation) => (
                          <span key={relation} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-300">
                            <Link2 className="w-3 h-3" />
                            {relation}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Migration History
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          Migration History
          <span className="ml-auto text-[10px] text-slate-400">{migrationHistory.length} migrations</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Version</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {migrationHistory.map((migration) => {
              const statusConfig = migrationStatusConfig(migration.status)
              return (
                <div key={migration.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center">
                  <div className="col-span-3">
                    <code className="text-[10px] text-slate-400 font-mono">{migration.version}</code>
                  </div>
                  <div className="col-span-5 text-[11px] text-slate-300 truncate">{migration.description}</div>
                  <div className="col-span-2 text-[10px] text-slate-500">{migration.timestamp.split(' ')[0]}</div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                      {migration.status}
                    </span>
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
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Last sync: <span className="text-slate-300">5 min ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Schema version: <span className="text-slate-300">20240315000001</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-emerald-400" />
          <span>Models: <span className="text-slate-300">{totalModels}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Drift: <span className="text-amber-400">{driftModels}</span></span>
        <span className="text-slate-700">|</span>
        <span>Pending migrations: <span className="text-amber-400">1</span></span>
      </div>

    </div>
  )
}
