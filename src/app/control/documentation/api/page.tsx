'use client'

import { useSyncExternalStore } from 'react'
import {
  Webhook, RefreshCw, Clock, Scan, Download,
  Shield, Lock, Unlock, Key, ChevronRight,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface ApiEndpoint {
  id: string
  method: HttpMethod
  path: string
  description: string
  requestSchema: string
  responseSchema: string
  errors: string[]
  authRequired: boolean
  lastUpdated: string
}

// ─── Mock Data ───────────────────────────────────────────

const apiEndpoints: ApiEndpoint[] = [
  {
    id: 'ep-1',
    method: 'GET',
    path: '/api/observatory/research',
    description: 'Retrieve AI search research data including visibility scores, citation tracking, and model responses',
    requestSchema: '{ query: { domain?: string, model?: string, dateRange?: string } }',
    responseSchema: '{ research: ResearchResult[], pagination: PaginationMeta }',
    errors: ['400 — Invalid query parameters', '429 — Rate limit exceeded', '500 — Research service unavailable'],
    authRequired: true,
    lastUpdated: '2h ago',
  },
  {
    id: 'ep-2',
    method: 'POST',
    path: '/api/growth/opportunities',
    description: 'Create a new growth opportunity from AI visibility analysis for content generation',
    requestSchema: '{ body: { domain: string, targetModel: string, keywords: string[] } }',
    responseSchema: '{ opportunity: Opportunity, estimatedImpact: number }',
    errors: ['400 — Missing required fields', '409 — Opportunity already exists', '422 — Invalid target model'],
    authRequired: true,
    lastUpdated: '3h ago',
  },
  {
    id: 'ep-3',
    method: 'GET',
    path: '/api/growth/opportunities',
    description: 'List all growth opportunities with filtering by status, priority, and target AI model',
    requestSchema: '{ query: { status?: string, priority?: string, targetModel?: string, page?: number } }',
    responseSchema: '{ opportunities: Opportunity[], total: number, pagination: PaginationMeta }',
    errors: ['400 — Invalid filter parameters', '429 — Rate limit exceeded'],
    authRequired: true,
    lastUpdated: '3h ago',
  },
  {
    id: 'ep-4',
    method: 'PUT',
    path: '/api/growth/opportunities/:id',
    description: 'Update opportunity priority, status, or assigned content strategy',
    requestSchema: '{ params: { id: string }, body: { priority?: string, status?: string, strategy?: string } }',
    responseSchema: '{ opportunity: Opportunity, updated: boolean }',
    errors: ['400 — Invalid update payload', '404 — Opportunity not found', '409 — Conflicting status transition'],
    authRequired: true,
    lastUpdated: '5h ago',
  },
  {
    id: 'ep-5',
    method: 'POST',
    path: '/api/advisor/session',
    description: 'Start a new advisor session with context-aware AI conversation for strategic guidance',
    requestSchema: '{ body: { context: string, domain: string, topic: string } }',
    responseSchema: '{ sessionId: string, initialResponse: AdvisorMessage }',
    errors: ['400 — Missing context or domain', '429 — Session limit reached', '503 — Advisor service busy'],
    authRequired: true,
    lastUpdated: '1h ago',
  },
  {
    id: 'ep-6',
    method: 'GET',
    path: '/api/observatory/scan',
    description: 'Trigger an AI visibility scan for a given domain across configured AI models',
    requestSchema: `{ query: { domain: string, models?: string[], depth?: 'quick' | 'full' } }`,
    responseSchema: `{ scanId: string, status: 'queued' | 'running', estimatedTime: number }`,
    errors: ['400 — Domain required', '429 — Scan limit per hour exceeded', '409 — Scan already running for domain'],
    authRequired: true,
    lastUpdated: '4h ago',
  },
  {
    id: 'ep-7',
    method: 'DELETE',
    path: '/api/advisor/session/:id',
    description: 'End an advisor session and archive conversation history for future reference',
    requestSchema: '{ params: { id: string } }',
    responseSchema: '{ archived: boolean, sessionId: string, messageCount: number }',
    errors: ['404 — Session not found', '409 — Session already ended'],
    authRequired: true,
    lastUpdated: '6h ago',
  },
  {
    id: 'ep-8',
    method: 'GET',
    path: '/api/observatory/models',
    description: 'List all tracked AI models with their citation behavior and visibility metrics',
    requestSchema: '{ query: { category?: string, active?: boolean } }',
    responseSchema: '{ models: AIModel[], lastCrawl: string }',
    errors: ['429 — Rate limit exceeded'],
    authRequired: false,
    lastUpdated: '12h ago',
  },
  {
    id: 'ep-9',
    method: 'POST',
    path: '/api/observatory/research/compare',
    description: 'Compare AI visibility metrics between two or more domains side by side',
    requestSchema: '{ body: { domains: string[], metrics: string[], dateRange: string } }',
    responseSchema: '{ comparisons: DomainComparison[], summary: ComparisonSummary }',
    errors: ['400 — At least 2 domains required', '422 — Invalid metric names', '429 — Rate limit exceeded'],
    authRequired: true,
    lastUpdated: '1d ago',
  },
  {
    id: 'ep-10',
    method: 'PUT',
    path: '/api/ai-router/config',
    description: 'Update AI model routing configuration including provider priorities and cache rules',
    requestSchema: '{ body: { rules: RoutingRule[], cacheTTL: number, fallbackChain: string[] } }',
    responseSchema: '{ config: RouterConfig, applied: boolean }',
    errors: ['400 — Invalid routing rule format', '403 — Superadmin required', '422 — Unknown provider in fallback chain'],
    authRequired: true,
    lastUpdated: '2d ago',
  },
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

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function ApiDocsPage() {
  const mounted = useHydrated()

  if (!mounted) return null

  const totalEndpoints = apiEndpoints.length
  const getEndpoints = apiEndpoints.filter(e => e.method === 'GET').length
  const postEndpoints = apiEndpoints.filter(e => e.method === 'POST').length
  const putEndpoints = apiEndpoints.filter(e => e.method === 'PUT').length
  const deleteEndpoints = apiEndpoints.filter(e => e.method === 'DELETE').length
  const authRequiredCount = apiEndpoints.filter(e => e.authRequired).length

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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Auto-generated</span>
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
            <span>All endpoints documented from route handlers</span>
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
          {apiEndpoints.map((endpoint) => {
            const config = methodConfig(endpoint.method)
            return (
              <div
                key={endpoint.id}
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
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{endpoint.description}</p>

                    {/* Schema details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
                        <div className="text-[9px] text-emerald-500 uppercase tracking-wider mb-1">Request Schema</div>
                        <code className="text-[10px] text-slate-300 font-mono leading-relaxed break-all">{endpoint.requestSchema}</code>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
                        <div className="text-[9px] text-blue-500 uppercase tracking-wider mb-1">Response Schema</div>
                        <code className="text-[10px] text-slate-300 font-mono leading-relaxed break-all">{endpoint.responseSchema}</code>
                      </div>
                    </div>

                    {/* Errors */}
                    <div className="mb-2">
                      <div className="text-[9px] text-red-500 uppercase tracking-wider mb-1">Error Codes</div>
                      <div className="flex flex-wrap gap-1.5">
                        {endpoint.errors.map((error, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] text-red-300 font-mono">{error}</span>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                      <span className="flex items-center gap-1 text-[10px]">
                        {endpoint.authRequired ? (
                          <><Lock className="w-3 h-3 text-amber-400" /><span className="text-amber-400">Auth Required</span></>
                        ) : (
                          <><Unlock className="w-3 h-3 text-slate-500" /><span className="text-slate-500">Public</span></>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {endpoint.lastUpdated}
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
          5. Quick Actions Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span>Last generated: <span className="text-slate-300">6 min ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-orange-400" />
          <span>Routes scanned: <span className="text-slate-300">{totalEndpoints}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Coverage: <span className="text-orange-400">100%</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Schema drift: <span className="text-slate-300">0 endpoints</span></span>
        </div>
      </div>

    </div>
  )
}
