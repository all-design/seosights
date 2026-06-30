'use client'

import { useSyncExternalStore } from 'react'
import {
  TrendingUp,
  Search,
  ListOrdered,
  Sparkles,
  Eye,
  Send,
  Brain,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Globe,
  FileText,
  BarChart3,
  ChevronRight,
  Bot,
  AlertCircle,
  CircleDot,
  Loader2,
} from 'lucide-react'

// ─── Pipeline Stages ───────────────────────────────────────────────
const pipelineStages = [
  { id: 'discovery', name: 'Discovery', icon: Search, count: 14, status: 'active' as const, description: 'Scanning for opportunities' },
  { id: 'queue', name: 'Queue', icon: ListOrdered, count: 8, status: 'active' as const, description: 'Awaiting generation' },
  { id: 'generation', name: 'Generation', icon: Sparkles, count: 3, status: 'active' as const, description: 'AI content creation' },
  { id: 'review', name: 'Review', icon: Eye, count: 2, status: 'idle' as const, description: 'Quality verification' },
  { id: 'publishing', name: 'Publishing', icon: Send, count: 1, status: 'active' as const, description: 'Deploying to site' },
  { id: 'learning', name: 'Learning', icon: Brain, count: 5, status: 'idle' as const, description: 'Performance analysis' },
]

// ─── Active Missions ───────────────────────────────────────────────
const activeMissions = [
  {
    id: 'm1',
    title: 'Generate FAQ schema for /pricing',
    targetAI: 'ChatGPT',
    status: 'generating' as const,
    impact: 'High',
    impactScore: 8.4,
    progress: 65,
    startedAt: '12 min ago',
  },
  {
    id: 'm2',
    title: 'Create comparison page: SeoSights vs Clearscope',
    targetAI: 'Claude',
    status: 'reviewing' as const,
    impact: 'High',
    impactScore: 9.1,
    progress: 90,
    startedAt: '28 min ago',
  },
  {
    id: 'm3',
    title: 'Optimize /features for AI citation density',
    targetAI: 'Gemini',
    status: 'generating' as const,
    impact: 'Medium',
    impactScore: 6.7,
    progress: 40,
    startedAt: '5 min ago',
  },
  {
    id: 'm4',
    title: 'Publish authoritative guide: "What is AI Visibility?"',
    targetAI: 'Perplexity',
    status: 'publishing' as const,
    impact: 'Critical',
    impactScore: 9.6,
    progress: 95,
    startedAt: '1h ago',
  },
  {
    id: 'm5',
    title: 'Add structured data to /blog posts',
    targetAI: 'ChatGPT',
    status: 'generating' as const,
    impact: 'Medium',
    impactScore: 7.2,
    progress: 30,
    startedAt: '8 min ago',
  },
  {
    id: 'm6',
    title: 'Create entity hub for "AI SEO" topic cluster',
    targetAI: 'Claude',
    status: 'generating' as const,
    impact: 'High',
    impactScore: 8.9,
    progress: 55,
    startedAt: '18 min ago',
  },
]

// ─── Content Queue ─────────────────────────────────────────────────
const contentQueue = [
  {
    id: 'q1',
    title: 'How-to guide: Improving AI recommendation scores',
    type: 'Guide',
    targetAI: 'ChatGPT',
    priority: 'P1',
    estimatedImpact: '+12% visibility',
    queuedAt: '3 min ago',
  },
  {
    id: 'q2',
    title: 'FAQ page for /integrations',
    type: 'FAQ Schema',
    targetAI: 'Claude',
    priority: 'P1',
    estimatedImpact: '+8% citation rate',
    queuedAt: '7 min ago',
  },
  {
    id: 'q3',
    title: 'Case study: SaaS company AI visibility turnaround',
    type: 'Case Study',
    targetAI: 'Gemini',
    priority: 'P2',
    estimatedImpact: '+6% authority',
    queuedAt: '15 min ago',
  },
  {
    id: 'q4',
    title: 'Glossary page: AI Visibility terminology',
    type: 'Reference',
    targetAI: 'Perplexity',
    priority: 'P2',
    estimatedImpact: '+5% coverage',
    queuedAt: '22 min ago',
  },
  {
    id: 'q5',
    title: 'Comparison: SeoSights vs Surfer SEO',
    type: 'Comparison',
    targetAI: 'ChatGPT',
    priority: 'P3',
    estimatedImpact: '+4% conversion',
    queuedAt: '35 min ago',
  },
  {
    id: 'q6',
    title: 'Benchmark report: AI model accuracy 2025',
    type: 'Report',
    targetAI: 'Claude',
    priority: 'P3',
    estimatedImpact: '+3% backlinks',
    queuedAt: '1h ago',
  },
]

// ─── Recent Published ──────────────────────────────────────────────
const recentPublished = [
  {
    id: 'p1',
    title: 'Complete Guide to AI Visibility Optimization',
    url: '/guides/ai-visibility-optimization',
    publishedAt: '2h ago',
    targetAI: 'ChatGPT',
    citations: 4,
    visibilityDelta: '+14%',
    status: 'cited' as const,
  },
  {
    id: 'p2',
    title: 'How AI Search Engines Rank Businesses in 2025',
    url: '/blog/ai-search-ranking-2025',
    publishedAt: '5h ago',
    targetAI: 'Claude',
    citations: 2,
    visibilityDelta: '+9%',
    status: 'cited' as const,
  },
  {
    id: 'p3',
    title: 'FAQ: AI Visibility Monitoring & Measurement',
    url: '/faq/ai-visibility-monitoring',
    publishedAt: '8h ago',
    targetAI: 'Gemini',
    citations: 1,
    visibilityDelta: '+6%',
    status: 'cited' as const,
  },
  {
    id: 'p4',
    title: 'SeoSights vs Traditional SEO Tools Comparison',
    url: '/compare/traditional-seo-tools',
    publishedAt: '12h ago',
    targetAI: 'Perplexity',
    citations: 0,
    visibilityDelta: '+3%',
    status: 'pending' as const,
  },
  {
    id: 'p5',
    title: 'Understanding GEO: Generative Engine Optimization',
    url: '/guides/generengine-optimization',
    publishedAt: '1d ago',
    targetAI: 'ChatGPT',
    citations: 7,
    visibilityDelta: '+18%',
    status: 'cited' as const,
  },
]

// ─── Helpers ───────────────────────────────────────────────────────
function missionStatusConfig(status: string) {
  switch (status) {
    case 'generating':
      return { label: 'Generating', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Sparkles }
    case 'reviewing':
      return { label: 'Reviewing', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Eye }
    case 'publishing':
      return { label: 'Publishing', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Send }
    default:
      return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: CircleDot }
  }
}

function impactBadge(impact: string, score: number) {
  switch (impact) {
    case 'Critical':
      return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    case 'High':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    case 'Medium':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
  }
}

function aiBadge(ai: string) {
  switch (ai) {
    case 'ChatGPT':
      return { color: 'text-emerald-300', bg: 'bg-emerald-500/15' }
    case 'Claude':
      return { color: 'text-amber-300', bg: 'bg-amber-500/15' }
    case 'Gemini':
      return { color: 'text-blue-300', bg: 'bg-blue-500/15' }
    case 'Perplexity':
      return { color: 'text-purple-300', bg: 'bg-purple-500/15' }
    default:
      return { color: 'text-slate-300', bg: 'bg-slate-500/15' }
  }
}

function priorityConfig(priority: string) {
  switch (priority) {
    case 'P1':
      return { color: 'text-red-400', bg: 'bg-red-500/10' }
    case 'P2':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10' }
    case 'P3':
      return { color: 'text-slate-400', bg: 'bg-slate-500/10' }
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/10' }
  }
}

// ─── Component ─────────────────────────────────────────────────────
const emptySubscribe = () => () => {}

export default function GrowthEnginePage() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) return null

  const totalInPipeline = pipelineStages.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Growth Engine</h1>
              <p className="text-slate-400 text-sm">Autonomous Growth Engine™ pipeline</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Running</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-300">{totalInPipeline} items in pipeline</span>
          </div>
        </div>
      </div>

      {/* ── Pipeline Visualization ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Autonomous Growth Pipeline™
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-stretch gap-0 overflow-x-auto">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon
            const isActive = stage.status === 'active'
            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-0">
                {/* Stage card */}
                <div className={`
                  flex-1 min-w-0 rounded-xl p-4 border transition-all
                  ${isActive
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/50'
                  }
                `}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive ? 'bg-emerald-500/15' : 'bg-slate-700/50'}
                    `}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {stage.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className={`text-2xl font-bold ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {stage.count}
                    </span>
                    <span className="text-[10px] text-slate-500">items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={`text-[10px] capitalize ${isActive ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                      {stage.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">{stage.description}</div>
                </div>

                {/* Arrow connector */}
                {i < pipelineStages.length - 1 && (
                  <div className="flex items-center px-1 flex-shrink-0">
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-emerald-500/60' : 'text-slate-700'}`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical flow */}
        <div className="lg:hidden space-y-2">
          {pipelineStages.map((stage, i) => {
            const Icon = stage.icon
            const isActive = stage.status === 'active'
            return (
              <div key={stage.id}>
                <div className={`
                  flex items-center gap-3 rounded-lg p-3 border transition-all
                  ${isActive
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/50'
                  }
                `}>
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isActive ? 'bg-emerald-500/15' : 'bg-slate-700/50'}
                  `}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {stage.name}
                    </div>
                    <div className="text-[10px] text-slate-600">{stage.description}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-lg font-bold ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {stage.count}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  </div>
                </div>
                {i < pipelineStages.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-700 rotate-90" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Active Missions ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Active Missions
          </h2>
          <span className="text-xs text-slate-500">{activeMissions.length} in progress</span>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {activeMissions.map((mission) => {
            const statusCfg = missionStatusConfig(mission.status)
            const impactCfg = impactBadge(mission.impact, mission.impactScore)
            const aiCfg = aiBadge(mission.targetAI)
            const StatusIcon = statusCfg.icon
            return (
              <div
                key={mission.id}
                className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium text-white truncate">{mission.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${aiCfg.bg} ${aiCfg.color}`}>
                        <Bot className="w-3 h-3" />
                        {mission.targetAI}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${impactCfg.bg} ${impactCfg.color} border ${impactCfg.border}`}>
                        {mission.impact} · {mission.impactScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Started {mission.startedAt}</div>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        mission.progress >= 80 ? 'bg-emerald-500' :
                        mission.progress >= 50 ? 'bg-emerald-500/70' :
                        'bg-amber-500/70'
                      }`}
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-500 flex-shrink-0">{mission.progress}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom Row: Content Queue + Recent Published ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Content Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-400" />
              Content Queue
            </h2>
            <span className="text-xs text-slate-500">{contentQueue.length} waiting</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {contentQueue.map((item) => {
              const aiCfg = aiBadge(item.targetAI)
              const prioCfg = priorityConfig(item.priority)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-slate-600/40 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold ${prioCfg.bg} ${prioCfg.color}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] ${aiCfg.color}`}>
                        <Bot className="w-2.5 h-2.5" />
                        {item.targetAI}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[10px] font-medium text-emerald-400/80">{item.estimatedImpact}</div>
                    <div className="text-[10px] text-slate-600 flex items-center gap-1 justify-end">
                      <Clock className="w-2.5 h-2.5" />
                      {item.queuedAt}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Published */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Recent Published
            </h2>
            <span className="text-xs text-slate-500">Last 5 items</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {recentPublished.map((item) => {
              const aiCfg = aiBadge(item.targetAI)
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-slate-600/40 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.status === 'cited' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] ${aiCfg.color}`}>
                        <Bot className="w-2.5 h-2.5" />
                        {item.targetAI}
                      </span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-emerald-400 font-medium">{item.visibilityDelta} visibility</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className={`text-[10px] font-medium ${item.citations > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {item.citations} citation{item.citations !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600">
                      <FileText className="w-2.5 h-2.5" />
                      {item.url}
                      <span className="ml-auto">{item.publishedAt}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Published Summary */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">
                {recentPublished.reduce((s, i) => s + i.citations, 0)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">Citations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">5</div>
              <div className="text-[10px] text-slate-500 uppercase">Published</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">+50%</div>
              <div className="text-[10px] text-slate-500 uppercase">Avg Impact</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
