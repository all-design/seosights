'use client'

import { useEffect, useState } from 'react'
import {
  Route,
  Zap,
  Globe,
  Bot,
  Server,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Database,
  Code2,
  Shield,
  Eye,
  PenTool,
  Search,
  Landmark,
  Cpu,
  FileText,
  Activity,
  Hash,
  Clock,
  TrendingUp,
  Layers,
  GitBranch,
  Terminal,
  Gauge,
  AlertTriangle,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface ModelInfo {
  key: string
  id: string
  free: boolean
  contextWindow: number
  speed: 'ultra' | 'fast' | 'medium' | 'slow'
  quality: 'basic' | 'good' | 'excellent' | 'state_of_art'
  costPer1kInput?: number
  costPer1kOutput?: number
}

interface ProviderStatus {
  id: string
  configured: boolean
  hasEnvVar: string | null
  models: ModelInfo[]
}

interface ProviderHealthItem {
  providerId: string
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailure: string | null
  cooldownUntil: string | null
}

interface AIRouterData {
  providers: ProviderStatus[]
  tierConstraints: Record<string, { allowedProviders: string[]; maxCostPerCall: number; preferFree: boolean }>
  providerHealth: ProviderHealthItem[]
  summary: {
    configuredCount: number
    totalProviders: number
    overallStatus: 'ok' | 'degraded' | 'down'
    message: string
  }
}

// ── Static data (architecture, not mock data) ────────────────

interface RoutingPrinciple {
  title: string
  description: string
  icon: React.ElementType
  color: string
}

const routingPrinciples: RoutingPrinciple[] = [
  {
    title: 'LLM Only When Reasoning Is Needed',
    description: 'Deterministic tools first — ESLint, Vitest, Playwright, TypeScript. LLMs only for tasks requiring judgment, synthesis, or generation.',
    icon: Terminal,
    color: 'emerald',
  },
  {
    title: 'Always Use Cheapest Model That Can Handle the Task',
    description: 'Route to the lowest-cost provider that meets quality requirements. Free tier models handle 95%+ of our workload.',
    icon: TrendingUp,
    color: 'cyan',
  },
  {
    title: 'Cache Results — Reuse If Same Task Hash Already Solved',
    description: 'Every task generates a hash. If we already solved an identical task, return the cached result.',
    icon: Database,
    color: 'amber',
  },
]

interface DeterministicTask {
  task: string
  tool: string
  reason: string
  icon: React.ElementType
}

const deterministicTasks: DeterministicTask[] = [
  { task: 'Dead code detection', tool: 'ts-prune', reason: 'Static analysis — no judgment needed', icon: FileText },
  { task: 'Duplicate dependencies', tool: 'pnpm audit', reason: 'Package registry lookup — deterministic', icon: Layers },
  { task: 'Unused imports', tool: 'ESLint', reason: 'AST-based detection — rule engine', icon: Code2 },
  { task: 'Accessibility', tool: 'axe-core', reason: 'WCAG rule engine — no subjectivity', icon: Shield },
  { task: 'Code formatting', tool: 'Prettier', reason: 'Style rules — zero judgment needed', icon: FileText },
  { task: 'Type checking', tool: 'TypeScript', reason: 'Type system — mathematical verification', icon: Terminal },
  { task: 'Unit tests', tool: 'Vitest', reason: 'Binary pass/fail — assertion engine', icon: CheckCircle2 },
  { task: 'E2E tests', tool: 'Playwright', reason: 'Browser automation — deterministic flows', icon: Globe },
  { task: 'Performance', tool: 'Lighthouse', reason: 'Metric thresholds — no interpretation', icon: Gauge },
]

// Engine → Model Mapping (static architecture reference)
interface EngineMapping {
  engine: string
  icon: React.ElementType
  primaryModel: string
  fallbackModel: string
  llmUsage: number
  description: string
}

const engineMappings: EngineMapping[] = [
  { engine: 'Product Engine', icon: Landmark, primaryModel: 'Gemini Flash', fallbackModel: 'GLM 5.1', llmUsage: 85, description: 'Reasoning for product decisions' },
  { engine: 'Architecture Engine', icon: Cpu, primaryModel: 'GLM 5.1', fallbackModel: 'Qwen Coder', llmUsage: 70, description: 'Code structure & planning' },
  { engine: 'Engineering Engine', icon: Code2, primaryModel: 'GLM 5.1', fallbackModel: 'Gemini Flash', llmUsage: 95, description: '95% of cases — great for code' },
  { engine: 'QA Engine', icon: Shield, primaryModel: 'Deterministic', fallbackModel: 'LLM (reports only)', llmUsage: 5, description: 'Playwright, ESLint, Vitest' },
  { engine: 'Review Engine', icon: Eye, primaryModel: 'GLM 5.1 + Gemini Flash', fallbackModel: 'Groq', llmUsage: 60, description: 'Cross review with dual models' },
  { engine: 'Documentation Engine', icon: PenTool, primaryModel: 'Gemini Flash', fallbackModel: 'GLM 5.1', llmUsage: 75, description: 'Narrative generation' },
  { engine: 'Observatory', icon: Search, primaryModel: 'Deterministic', fallbackModel: 'LLM (narratives only)', llmUsage: 5, description: 'Crawlers + LLM for narratives' },
]

// ── Provider → icon / color map ──────────────────────────────

const providerMeta: Record<string, { icon: React.ElementType; color: string; description: string }> = {
  groq: { icon: Zap, color: 'amber', description: 'Instant inference — best for quick completions' },
  gemini: { icon: Globe, color: 'cyan', description: 'Reasoning & planning — free tier, generous limits' },
  openrouter: { icon: Bot, color: 'emerald', description: 'Free tier models — great for code generation' },
  openai: { icon: Bot, color: 'violet', description: 'Premium models — high quality reasoning' },
  zai: { icon: Bot, color: 'emerald', description: 'ZAI SDK models — GLM variants' },
  ollama: { icon: Server, color: 'rose', description: 'Local fallback — offline safe, no rate limits' },
}

// ── Helpers ──────────────────────────────────────────────────

function statusDot(status: 'online' | 'offline' | 'degraded') {
  if (status === 'online') return <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Online</span>
  if (status === 'degraded') return <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium"><Activity className="w-3.5 h-3.5" /> Degraded</span>
  return <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Offline</span>
}

function colorClasses(color: string) {
  const map: Record<string, { bg: string; border: string; text: string; glow: string; iconBg: string }> = {
    amber:   { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/5', iconBg: 'bg-amber-500/20' },
    cyan:    { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/5', iconBg: 'bg-cyan-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/5', iconBg: 'bg-emerald-500/20' },
    rose:    { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/5', iconBg: 'bg-rose-500/20' },
    violet:  { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/5', iconBg: 'bg-violet-500/20' },
  }
  return map[color] || map.emerald
}

function speedLabel(speed: string): string {
  switch (speed) {
    case 'ultra': return 'Ultra Fast (~200 tok/s)'
    case 'fast': return 'Fast (~120 tok/s)'
    case 'medium': return 'Medium (~40 tok/s)'
    case 'slow': return 'Slow (~15 tok/s)'
    default: return speed
  }
}

function providerOnlineStatus(p: ProviderStatus, health?: ProviderHealthItem): 'online' | 'offline' | 'degraded' {
  if (!p.configured) return 'offline'
  if (health && health.state === 'open') return 'degraded'
  return 'online'
}

// ── Component ────────────────────────────────────────────────

export default function AIRouterPage() {
  const [data, setData] = useState<AIRouterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch both control/data (for status) and ai-router/status (for model details)
        const [controlRes, routerRes] = await Promise.all([
          fetch('/api/control/data'),
          fetch('/api/ai-router/status'),
        ])
        if (!controlRes.ok) throw new Error('Failed to fetch control data')

        const json = await controlRes.json()
        // Extract AI router data from unified API response
        const aiProviders = json.factory?.aiProviders || json.aiProviders || { configured: [], available: [], using: 'rule-based-fallback' }

        // Try to get richer data from the dedicated AI router status API
        let routerData: { providers?: ProviderStatus[]; tierConstraints?: any; circuitBreaker?: any } = {}
        if (routerRes.ok) {
          routerData = await routerRes.json()
        }

        // Use dedicated API providers if available, otherwise derive from control data
        const providers: ProviderStatus[] = routerData.providers && routerData.providers.length > 0
          ? routerData.providers
          : aiProviders.configured.map((id: string) => ({
              id,
              configured: true,
              hasEnvVar: null,
              models: [],
            }))

        // Derive provider health from circuit breaker data
        const providerHealth: ProviderHealthItem[] = (routerData.circuitBreaker as any[])?.map((h: any) => ({
          providerId: h.provider || h.id,
          state: h.status === 'healthy' ? 'closed' as const : h.status === 'cooldown' ? 'open' as const : 'half-open' as const,
          failures: h.consecutiveFailures || 0,
          lastFailure: h.lastFailure?.toISOString?.() || h.lastFailure || null,
          cooldownUntil: h.cooldownUntil?.toISOString?.() || h.cooldownUntil || null,
        })) || []

        setData({
          providers,
          tierConstraints: routerData.tierConstraints || {},
          providerHealth,
          summary: {
            configuredCount: aiProviders.configured.length,
            totalProviders: 5,
            overallStatus: aiProviders.using === 'live-llm' ? 'ok' as const : 'degraded' as const,
            message: aiProviders.using === 'live-llm' ? 'AI providers operational' : 'Using rule-based fallback',
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse bg-slate-800 rounded-xl h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-56" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-48" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load AI Router status</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  const totalModels = data.providers.reduce((sum, p) => sum + p.models.length, 0)

  return (
    <div className="space-y-8">

      {/* ── Section 1: Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Route className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Router™</h1>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                data.summary.overallStatus === 'ok'
                  ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                  : data.summary.overallStatus === 'degraded'
                  ? 'bg-amber-500/15 border border-amber-500/25 text-amber-400'
                  : 'bg-red-500/15 border border-red-500/25 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  data.summary.overallStatus === 'ok' ? 'bg-emerald-400' : data.summary.overallStatus === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                {data.summary.overallStatus === 'ok' ? 'Routing' : data.summary.overallStatus === 'degraded' ? 'Degraded' : 'Down'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">Free AI Mesh™ — Intelligent model routing for zero-cost operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{data.summary.message}</span>
        </div>
      </div>

      {/* ── Section 2: Mesh Architecture ──────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Mesh Architecture</h2>
          <span className="text-xs text-slate-500 ml-1">— Free AI Mesh™ topology</span>
        </div>

        {/* Central Router Visual */}
        <div className="relative mb-6">
          <div className="flex items-center justify-center">
            <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2.5">
                <Route className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">AI Router™</span>
                <span className="text-[10px] text-slate-500">central dispatcher</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-1">
            <div className="w-px h-4 bg-slate-700" />
          </div>
          <div className="flex justify-center">
            <div className="h-px w-3/4 max-w-2xl bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>
          <div className="flex justify-center mt-1">
            <div className="w-px h-4 bg-slate-700" />
          </div>
        </div>

        {/* Provider Grid */}
        {data.providers.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No AI providers registered</p>
            <p className="text-xs text-slate-600 mt-1">Configure provider API keys to enable the AI Router</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.providers.map((provider) => {
              const meta = providerMeta[provider.id] || { icon: Bot, color: 'emerald', description: 'AI provider' }
              const c = colorClasses(meta.color)
              const Icon = meta.icon
              const healthItem = data.providerHealth.find(h => h.providerId === provider.id)
              const onlineStatus = providerOnlineStatus(provider, healthItem)

              return (
                <div
                  key={provider.id}
                  className={`rounded-xl ${c.bg} border ${c.border} p-4 shadow-lg ${c.glow} transition-all duration-150 hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${c.text}`} />
                      </div>
                      <span className="text-sm font-semibold text-white capitalize">{provider.id}</span>
                    </div>
                    {statusDot(onlineStatus)}
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{meta.description}</p>
                  {provider.models.length > 0 ? (
                    <div className="space-y-1.5">
                      {provider.models.map((model) => (
                        <div key={model.key} className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 min-w-0">
                            <GitBranch className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{model.id}</span>
                          </div>
                          {model.free && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">FREE</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No models registered</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Speed</span>
                    <span className={`text-xs font-medium ${c.text}`}>
                      {provider.models.length > 0 ? speedLabel(provider.models[0].speed) : 'N/A'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Models</span>
                    <span className="text-xs font-mono text-white">{provider.models.length}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Section 3: Engine → Model Mapping ──────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Engine → Model Mapping</h2>
          <span className="text-xs text-slate-500 ml-1">— Which engine uses which model</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Engine</div>
            <div className="col-span-3">Primary Model</div>
            <div className="col-span-3">Fallback Model</div>
            <div className="col-span-3">LLM Usage</div>
          </div>
          {engineMappings.map((mapping, i) => {
            const Icon = mapping.icon
            const barColor = mapping.llmUsage >= 80 ? 'bg-emerald-500' : mapping.llmUsage >= 40 ? 'bg-cyan-500' : 'bg-amber-500'
            const textColor = mapping.llmUsage >= 80 ? 'text-emerald-400' : mapping.llmUsage >= 40 ? 'text-cyan-400' : 'text-amber-400'
            return (
              <div
                key={mapping.engine}
                className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center ${
                  i < engineMappings.length - 1 ? 'border-b border-slate-800/60' : ''
                } hover:bg-slate-800/30 transition-colors`}
              >
                <div className="col-span-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-white font-medium">{mapping.engine}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{mapping.description}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className="text-sm text-cyan-400 font-mono">{mapping.primaryModel}</span>
                </div>
                <div className="col-span-3 flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-sm text-slate-400 font-mono">{mapping.fallbackModel}</span>
                </div>
                <div className="col-span-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all`}
                      style={{ width: `${mapping.llmUsage}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-semibold ${textColor} w-10 text-right`}>
                    {mapping.llmUsage}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 4: Routing Rules ───────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Routing Rules</h2>
          <span className="text-xs text-slate-500 ml-1">— The 3 key principles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routingPrinciples.map((principle, i) => {
            const c = colorClasses(principle.color)
            const Icon = principle.icon
            return (
              <div
                key={i}
                className={`rounded-xl ${c.bg} border ${c.border} p-5 shadow-lg ${c.glow}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${c.text}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rule #{i + 1}</span>
                </div>
                <h3 className={`text-sm font-bold ${c.text} mb-2`}>{principle.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{principle.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 5: Deterministic First ─────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Deterministic First</h2>
          <span className="text-xs text-slate-500 ml-1">— Tasks that DON&apos;T use LLM</span>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Task</div>
            <div className="col-span-3">Tool</div>
            <div className="col-span-5">Why No LLM Needed</div>
          </div>
          {deterministicTasks.map((task, i) => {
            const Icon = task.icon
            return (
              <div
                key={task.task}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                  i < deterministicTasks.length - 1 ? 'border-b border-slate-800/60' : ''
                } hover:bg-slate-800/30 transition-colors`}
              >
                <div className="col-span-1 text-xs text-slate-600 font-mono">{i + 1}</div>
                <div className="col-span-3 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-white">{task.task}</span>
                </div>
                <div className="col-span-3">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                    {task.tool}
                  </span>
                </div>
                <div className="col-span-5 text-xs text-slate-400">{task.reason}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 6: Cache Stats ─────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Cache Stats</h2>
          <span className="text-xs text-slate-500 ml-1">— Task hash cache performance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Models</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono">{totalModels}</p>
            <p className="text-xs text-slate-500 mt-1">Available across all providers</p>
          </div>

          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Configured</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 font-mono">{data.summary.configuredCount}</p>
            <p className="text-xs text-emerald-400/70 mt-1">of {data.summary.totalProviders} providers</p>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Unconfigured</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 font-mono">{data.summary.totalProviders - data.summary.configuredCount}</p>
            <p className="text-xs text-slate-500 mt-1">Missing API keys</p>
          </div>

          <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Free Models</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400 font-mono">{data.providers.reduce((sum, p) => sum + p.models.filter(m => m.free).length, 0)}</p>
            <p className="text-xs text-cyan-400/70 mt-1">Zero-cost models available</p>
          </div>
        </div>
      </section>

      {/* ── Section 7: Footer ──────────────────────────────── */}
      <footer className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-slate-500" />
            <span>Models available: <span className="text-white font-mono">{totalModels}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Providers: <span className="text-white font-mono">{data.summary.configuredCount}/{data.summary.totalProviders}</span> configured</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Status: <span className={data.summary.overallStatus === 'ok' ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>{data.summary.overallStatus}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="w-3.5 h-3.5 text-cyan-500" />
            <span>Free models: <span className="text-cyan-400 font-mono">{data.providers.reduce((sum, p) => sum + p.models.filter(m => m.free).length, 0)}</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
