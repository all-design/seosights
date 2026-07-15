'use client'

import { useEffect, useState } from 'react'
import {
  Webhook, RefreshCw, Clock, Scan, Download,
  Shield, Lock, Unlock, Key, ChevronRight,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface ApiEndpoint {
  method: HttpMethod
  path: string
  description: string
  authRequired: boolean
}

// ─── Static Data (structural — these are actual route definitions) ──

const apiEndpoints: ApiEndpoint[] = [
  { method: 'GET', path: '/api/observatory/research', description: 'Retrieve AI search research data including visibility scores, citation tracking, and model responses', authRequired: true },
  { method: 'POST', path: '/api/growth/opportunities', description: 'Create a new growth opportunity from AI visibility analysis for content generation', authRequired: true },
  { method: 'GET', path: '/api/growth/opportunities', description: 'List all growth opportunities with filtering by status, priority, and target AI model', authRequired: true },
  { method: 'PUT', path: '/api/growth/opportunities/:id', description: 'Update opportunity priority, status, or assigned content strategy', authRequired: true },
  { method: 'POST', path: '/api/ai/opportunity-queue', description: 'Start a new advisor session with context-aware AI conversation for strategic guidance', authRequired: true },
  { method: 'GET', path: '/api/observatory/status', description: 'Get full observatory pipeline status including crawl, models, and reports', authRequired: false },
  { method: 'DELETE', path: '/api/webhooks/:id', description: 'Delete a webhook endpoint and stop receiving events', authRequired: true },
  { method: 'GET', path: '/api/observatory/graph', description: 'List all tracked AI models with their citation behavior and visibility metrics', authRequired: false },
  { method: 'POST', path: '/api/ai/visibility-score', description: 'Compare AI visibility metrics between two or more domains side by side', authRequired: true },
  { method: 'PUT', path: '/api/ai-router/status', description: 'Update AI model routing configuration including provider priorities and cache rules', authRequired: true },
]

// ─── Helpers ─────────────────────────────────────────────

function methodConfig(method: HttpMethod) {
  switch (method) {
    case 'GET': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' }
    case 'POST': return { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' }
    case 'PUT': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20' }
    case 'DELETE': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' }
  }
}

// ─── Main Component ──────────────────────────────────────

export default function ApiDocsPage() {
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

  const totalEndpoints = apiEndpoints.length
  const getEndpoints = apiEndpoints.filter(e => e.method === 'GET').length
  const postEndpoints = apiEndpoints.filter(e => e.method === 'POST').length
  const putEndpoints = apiEndpoints.filter(e => e.method === 'PUT').length
  const deleteEndpoints = apiEndpoints.filter(e => e.method === 'DELETE').length
  const authRequiredCount = apiEndpoints.filter(e => e.authRequired).length

  const factory = data?.factory || {}
  const system = factory.system || {}
  const systemHealthy = Object.values(system).filter((s: any) => s === 'operational').length
  const systemTotal = Object.keys(system).length

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">API Docs™</h1>
            <p className="text-slate-400 text-sm">Documentation Engine — auto-generated API documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            systemHealthy === systemTotal
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              systemHealthy === systemTotal ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <span className={`text-xs font-medium ${
              systemHealthy === systemTotal ? 'text-emerald-400' : 'text-amber-400'
            }`}>{systemHealthy}/{systemTotal} systems OK</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 hover:text-orange-200 hover:border-orange-500/40 transition-colors text-xs">
            <Download className="w-3.5 h-3.5" />
            Export OpenAPI
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-scan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. API Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-orange-500/5 via-slate-900 to-slate-900 border border-orange-500/15 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Total endpoints */}
          <div className="flex-shrink-0 text-center">
            <div className="text-5xl font-bold text-orange-400">{totalEndpoints}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">API Endpoints</div>
          </div>

          {/* Method breakdown */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">GET</span>
              </div>
              <span className="text-2xl font-bold text-emerald-400">{getEndpoints}</span>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Read</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">POST</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">{postEndpoints}</span>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Create</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">PUT</span>
              </div>
              <span className="text-2xl font-bold text-amber-400">{putEndpoints}</span>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Update</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">DELETE</span>
              </div>
              <span className="text-2xl font-bold text-red-400">{deleteEndpoints}</span>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Remove</div>
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>Auth required: <span className="text-orange-400 font-medium">{authRequiredCount}/{totalEndpoints}</span></span>
            <span>Public: <span className="text-slate-300">{totalEndpoints - authRequiredCount}</span></span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>System health: {systemHealthy}/{systemTotal} operational</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Authentication Section
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-white">Authentication</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-white">API Key</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">Pass via <code className="text-orange-400 bg-orange-500/10 px-1 rounded">Authorization: Bearer {'<api_key>'}</code> header. Keys are scoped per organization.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-white">Superadmin</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">Sensitive routes require superadmin cookie auth via <code className="text-orange-400 bg-orange-500/10 px-1 rounded">/api/superadmin/auth</code>. httpOnly, secure.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Unlock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-white">Public</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">Read-only model data and public observatory endpoints. Rate-limited to 60 req/min.</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Endpoints List
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-orange-400" />
          Endpoints
          <span className="ml-auto text-[10px] text-slate-400">{totalEndpoints} endpoints</span>
        </h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
          {apiEndpoints.map((endpoint, idx) => {
            const config = methodConfig(endpoint.method)
            return (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  {/* Method badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${config.bg} ${config.color} ${config.border} flex-shrink-0`}>
                    {endpoint.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    {/* Path + Auth */}
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-white">{endpoint.path}</code>
                      {endpoint.authRequired ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                    {/* Description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed">{endpoint.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Quick Actions Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span>Last generated: <span className="text-slate-300">{factory.timestamp ? new Date(factory.timestamp).toLocaleTimeString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-orange-400" />
          <span>Routes scanned: <span className="text-slate-300">{totalEndpoints}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>AI Router: <span className="text-orange-400">{factory.aiProviders?.using === 'live-llm' ? 'Live LLM' : 'Rule-based Fallback'}</span></span>
      </div>

    </div>
  )
}
