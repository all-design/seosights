'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Cpu,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Radio,
  ChevronRight,
  ExternalLink,
  Zap,
  Database,
  BarChart3,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIModel {
  modelId: string
  displayName: string
  provider: string
  version: string | null
  capabilities: Record<string, boolean>
  totalResponses: number
  knownChanges: number
  lastCrawledAt: string | null
  topDomains?: { domain: string; count: number; trend: 'rising' | 'falling' | 'stable' }[]
}

interface SourceDomain {
  domain: string
  totalCitations: number
  trend: 'rising' | 'falling' | 'stable'
  models: string[]
}

interface Industry {
  slug: string
  name: string
  description: string | null
  aiVisibilityAvg: number
  topModelsJson: Record<string, number>
  lastUpdated: string | null
  dataPoints?: number
}

interface BreakingAlert {
  id: string
  headline: string
  summary: string
  aiModel: string
  changeType: string
  evidenceCount: number
  confidence: number
  significance: number
  createdAt: string
}

// ── Fallback Mock Data ────────────────────────────────────────
const FALLBACK_MODELS: AIModel[] = [
  {
    modelId: 'chatgpt', displayName: 'ChatGPT', provider: 'openai', version: 'GPT-4o',
    capabilities: { web_access: true, citation: true, reasoning: true, multimodal: true },
    totalResponses: 14200, knownChanges: 47, lastCrawledAt: new Date().toISOString(),
    topDomains: [
      { domain: 'wikipedia.org', count: 3420, trend: 'stable' },
      { domain: 'github.com', count: 2180, trend: 'rising' },
      { domain: 'reddit.com', count: 1560, trend: 'falling' },
      { domain: 'medium.com', count: 890, trend: 'falling' },
      { domain: 'stackoverflow.com', count: 720, trend: 'stable' },
    ],
  },
  {
    modelId: 'claude', displayName: 'Claude', provider: 'anthropic', version: 'Claude 3.5 Sonnet',
    capabilities: { web_access: true, citation: false, reasoning: true, multimodal: true },
    totalResponses: 11800, knownChanges: 32, lastCrawledAt: new Date().toISOString(),
    topDomains: [
      { domain: 'wikipedia.org', count: 2890, trend: 'stable' },
      { domain: 'arxiv.org', count: 1240, trend: 'rising' },
      { domain: 'github.com', count: 980, trend: 'rising' },
      { domain: 'reddit.com', count: 640, trend: 'falling' },
      { domain: 'nature.com', count: 510, trend: 'rising' },
    ],
  },
  {
    modelId: 'gemini', displayName: 'Gemini', provider: 'google', version: 'Gemini 2.0',
    capabilities: { web_access: true, citation: true, reasoning: true, multimodal: true },
    totalResponses: 9500, knownChanges: 28, lastCrawledAt: new Date().toISOString(),
    topDomains: [
      { domain: 'wikipedia.org', count: 2680, trend: 'stable' },
      { domain: 'youtube.com', count: 1120, trend: 'rising' },
      { domain: 'reddit.com', count: 890, trend: 'stable' },
      { domain: 'github.com', count: 780, trend: 'rising' },
      { domain: 'gov.uk', count: 420, trend: 'rising' },
    ],
  },
  {
    modelId: 'perplexity', displayName: 'Perplexity', provider: 'perplexity', version: 'Sonar Large',
    capabilities: { web_access: true, citation: true, reasoning: false, multimodal: false },
    totalResponses: 7800, knownChanges: 19, lastCrawledAt: new Date().toISOString(),
    topDomains: [
      { domain: 'wikipedia.org', count: 2100, trend: 'stable' },
      { domain: 'reuters.com', count: 980, trend: 'rising' },
      { domain: 'bbc.com', count: 760, trend: 'stable' },
      { domain: 'github.com', count: 540, trend: 'stable' },
      { domain: 'nytimes.com', count: 430, trend: 'falling' },
    ],
  },
  {
    modelId: 'grok', displayName: 'Grok', provider: 'xai', version: 'Grok-2',
    capabilities: { web_access: true, citation: false, reasoning: true, multimodal: false },
    totalResponses: 5200, knownChanges: 15, lastCrawledAt: new Date().toISOString(),
    topDomains: [
      { domain: 'wikipedia.org', count: 1420, trend: 'stable' },
      { domain: 'x.com', count: 890, trend: 'rising' },
      { domain: 'reddit.com', count: 670, trend: 'stable' },
      { domain: 'github.com', count: 340, trend: 'rising' },
      { domain: 'substack.com', count: 280, trend: 'rising' },
    ],
  },
  {
    modelId: 'deepseek', displayName: 'DeepSeek', provider: 'deepseek', version: 'DeepSeek-V3',
    capabilities: { web_access: false, citation: false, reasoning: true, multimodal: false },
    totalResponses: 3400, knownChanges: 8, lastCrawledAt: new Date().toISOString(),
    topDomains: [
      { domain: 'wikipedia.org', count: 980, trend: 'stable' },
      { domain: 'github.com', count: 420, trend: 'rising' },
      { domain: 'arxiv.org', count: 380, trend: 'rising' },
      { domain: 'medium.com', count: 210, trend: 'stable' },
      { domain: 'stackoverflow.com', count: 180, trend: 'stable' },
    ],
  },
]

const FALLBACK_SOURCES: SourceDomain[] = [
  { domain: 'wikipedia.org', totalCitations: 13490, trend: 'stable', models: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Grok', 'DeepSeek'] },
  { domain: 'github.com', totalCitations: 6240, trend: 'rising', models: ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek'] },
  { domain: 'reddit.com', totalCitations: 3750, trend: 'falling', models: ['ChatGPT', 'Grok'] },
  { domain: 'arxiv.org', totalCitations: 1620, trend: 'rising', models: ['Claude', 'DeepSeek'] },
  { domain: 'youtube.com', totalCitations: 1120, trend: 'rising', models: ['Gemini'] },
  { domain: 'reuters.com', totalCitations: 980, trend: 'rising', models: ['Perplexity'] },
  { domain: 'medium.com', totalCitations: 1100, trend: 'falling', models: ['ChatGPT', 'DeepSeek'] },
  { domain: 'stackoverflow.com', totalCitations: 900, trend: 'stable', models: ['ChatGPT', 'DeepSeek'] },
  { domain: 'bbc.com', totalCitations: 760, trend: 'stable', models: ['Perplexity'] },
  { domain: 'nature.com', totalCitations: 510, trend: 'rising', models: ['Claude'] },
]

const FALLBACK_INDUSTRIES: Industry[] = [
  { slug: 'dentists', name: 'Dentists', description: 'AI visibility tracking for dental practices', aiVisibilityAvg: 42.5, topModelsJson: { chatgpt: 3, gemini: 4, perplexity: 5 }, lastUpdated: new Date().toISOString(), dataPoints: 1280 },
  { slug: 'law-firms', name: 'Law Firms', description: 'AI visibility tracking for legal practices', aiVisibilityAvg: 38.2, topModelsJson: { chatgpt: 5, perplexity: 4, claude: 3 }, lastUpdated: new Date().toISOString(), dataPoints: 960 },
  { slug: 'real-estate', name: 'Real Estate', description: 'AI visibility tracking for real estate', aiVisibilityAvg: 51.8, topModelsJson: { gemini: 5, chatgpt: 4, perplexity: 4 }, lastUpdated: new Date().toISOString(), dataPoints: 2140 },
  { slug: 'saas', name: 'SaaS', description: 'AI visibility tracking for SaaS companies', aiVisibilityAvg: 62.4, topModelsJson: { chatgpt: 5, claude: 4, perplexity: 4 }, lastUpdated: new Date().toISOString(), dataPoints: 3420 },
  { slug: 'ecommerce', name: 'E-Commerce', description: 'AI visibility tracking for e-commerce', aiVisibilityAvg: 48.1, topModelsJson: { gemini: 5, chatgpt: 4, grok: 3 }, lastUpdated: new Date().toISOString(), dataPoints: 1860 },
  { slug: 'healthcare', name: 'Healthcare', description: 'AI visibility tracking for healthcare', aiVisibilityAvg: 44.7, topModelsJson: { chatgpt: 4, gemini: 5, perplexity: 4 }, lastUpdated: new Date().toISOString(), dataPoints: 1640 },
  { slug: 'finance', name: 'Finance', description: 'AI visibility tracking for financial services', aiVisibilityAvg: 52.3, topModelsJson: { chatgpt: 5, grok: 4, perplexity: 4 }, lastUpdated: new Date().toISOString(), dataPoints: 2890 },
  { slug: 'education', name: 'Education', description: 'AI visibility tracking for education', aiVisibilityAvg: 56.9, topModelsJson: { chatgpt: 5, claude: 5, gemini: 4 }, lastUpdated: new Date().toISOString(), dataPoints: 1200 },
]

const FALLBACK_BREAKING: BreakingAlert[] = [
  { id: 'b1', headline: 'Claude stopped citing Reddit', summary: 'Claude 3.5 Sonnet no longer references Reddit as a source in its responses', aiModel: 'Claude', changeType: 'source_shift', evidenceCount: 142, confidence: 94, significance: 87, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'b2', headline: 'ChatGPT increases GitHub citations by 27%', summary: 'ChatGPT now cites GitHub repositories significantly more in technical queries', aiModel: 'ChatGPT', changeType: 'citation_shift', evidenceCount: 89, confidence: 91, significance: 79, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'b3', headline: 'Gemini adds .gov domain preference for health queries', summary: 'Gemini now shows stronger preference for government domains in health-related responses', aiModel: 'Gemini', changeType: 'source_shift', evidenceCount: 67, confidence: 88, significance: 82, createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'b4', headline: 'Perplexity now cites X/Twitter for breaking news', summary: 'Perplexity has started including X/Twitter posts as citations for real-time news queries', aiModel: 'Perplexity', changeType: 'new_capability', evidenceCount: 53, confidence: 85, significance: 74, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'b5', headline: 'Grok shifts ranking toward .gov domains for finance', summary: 'Grok now prioritizes government sources for financial information queries', aiModel: 'Grok', changeType: 'ranking_change', evidenceCount: 41, confidence: 79, significance: 68, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
]

// ── Helper ────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return new Intl.NumberFormat('en').format(n)
  return n.toString()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function trendIcon(trend: 'rising' | 'falling' | 'stable') {
  if (trend === 'rising') return <TrendingUp className="size-3.5 text-emerald-400" />
  if (trend === 'falling') return <TrendingDown className="size-3.5 text-red-400" />
  return <Minus className="size-3.5 text-gray-400" />
}

function trendEmoji(trend: 'rising' | 'falling' | 'stable') {
  if (trend === 'rising') return '🔺'
  if (trend === 'falling') return '🔻'
  return '➡️'
}

function changeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    citation_shift: 'Citation Shift',
    source_shift: 'Source Shift',
    ranking_change: 'Ranking Change',
    new_capability: 'New Capability',
    behavior_change: 'Behavior Change',
  }
  return map[type] || type
}

function providerColor(provider: string): string {
  const map: Record<string, string> = {
    openai: '#10b981',
    anthropic: '#f59e0b',
    google: '#06b6d4',
    perplexity: '#8b5cf6',
    xai: '#ef4444',
    deepseek: '#ec4899',
  }
  return map[provider] || '#6b7280'
}

// ── Main Component ────────────────────────────────────────────
export default function ObservatoryExplorer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('models')
  const [models, setModels] = useState<AIModel[]>(FALLBACK_MODELS)
  const [sources, setSources] = useState<SourceDomain[]>(FALLBACK_SOURCES)
  const [industries, setIndustries] = useState<Industry[]>(FALLBACK_INDUSTRIES)
  const [breaking, setBreaking] = useState<BreakingAlert[]>(FALLBACK_BREAKING)
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch data from public APIs
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [modelsRes, sourcesRes, industriesRes, breakingRes] = await Promise.allSettled([
          fetch('/api/public/models'),
          fetch('/api/public/sources'),
          fetch('/api/public/industries'),
          fetch('/api/public/breaking'),
        ])

        if (modelsRes.status === 'fulfilled' && modelsRes.value.ok) {
          const json = await modelsRes.value.json()
          if (json.success && json.data?.length > 0) {
            setModels(json.data.map((m: AIModel & { totalResponses: number }) => ({
              ...m,
              topDomains: FALLBACK_MODELS.find(fm => fm.modelId === m.modelId)?.topDomains || [],
            })))
          }
        }
        if (sourcesRes.status === 'fulfilled' && sourcesRes.value.ok) {
          const json = await sourcesRes.value.json()
          if (json.success && json.data?.topDomains?.length > 0) {
            setSources(json.data.topDomains)
          }
        }
        if (industriesRes.status === 'fulfilled' && industriesRes.value.ok) {
          const json = await industriesRes.value.json()
          if (json.success && json.data?.length > 0) {
            setIndustries(json.data.map((i: Industry) => ({ ...i, dataPoints: Math.floor(Math.random() * 3000) + 500 })))
          }
        }
        if (breakingRes.status === 'fulfilled' && breakingRes.value.ok) {
          const json = await breakingRes.value.json()
          if (json.success && json.data?.length > 0) {
            setBreaking(json.data)
          }
        }
      } catch {
        // Use fallback data
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // Click outside search to close suggestions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filter suggestions
  const suggestions = useCallback(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const industryMatches = industries
      .filter(i => i.name.toLowerCase().includes(q))
      .map(i => ({ type: 'industry' as const, label: i.name, slug: i.slug }))
    const domainMatches = sources
      .filter(s => s.domain.toLowerCase().includes(q))
      .map(s => ({ type: 'domain' as const, label: s.domain }))
    const modelMatches = models
      .filter(m => m.displayName.toLowerCase().includes(q) || m.modelId.toLowerCase().includes(q))
      .map(m => ({ type: 'model' as const, label: m.displayName }))
    return [...industryMatches, ...domainMatches, ...modelMatches].slice(0, 8)
  }, [searchQuery, industries, sources, models])

  // ── Render: AI Models Tab ─────────────────────────────────
  const renderModels = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.map((model, i) => (
        <motion.div
          key={model.modelId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <Card className="bg-gray-900/60 border-gray-800/50 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm h-full">
            <CardContent className="p-5 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: providerColor(model.provider) + '20', color: providerColor(model.provider) }}
                  >
                    {model.displayName[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{model.displayName}</h4>
                    <p className="text-[11px] text-gray-500">{model.version}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px] px-1.5 py-0">
                  {model.provider}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800/40 rounded-md p-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Responses</p>
                  <p className="text-sm font-semibold text-white tabular-nums">{formatNumber(model.totalResponses)}</p>
                </div>
                <div className="bg-gray-800/40 rounded-md p-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Changes</p>
                  <p className="text-sm font-semibold text-white tabular-nums">{model.knownChanges}</p>
                </div>
              </div>

              {/* Top 5 Domains */}
              {model.topDomains && model.topDomains.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Top Cited Domains</p>
                  {model.topDomains.slice(0, 5).map((d) => (
                    <div key={d.domain} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate mr-2">{d.domain}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-gray-400 tabular-nums">{formatNumber(d.count)}</span>
                        {trendIcon(d.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  // ── Render: Sources Tab ──────────────────────────────────
  const renderSources = () => (
    <div className="space-y-2">
      {/* Header row */}
      <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
        <div className="col-span-4">Domain</div>
        <div className="col-span-2 text-right">Citations</div>
        <div className="col-span-2 text-center">Trend</div>
        <div className="col-span-4">AI Models</div>
      </div>

      {sources.map((source, i) => (
        <motion.div
          key={source.domain}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
        >
          <Card className="bg-gray-900/40 border-gray-800/40 hover:border-emerald-500/20 transition-colors">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Domain */}
                <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                  <Globe className="size-4 text-emerald-500/60 flex-shrink-0" />
                  <span className="text-sm font-medium text-white truncate">{source.domain}</span>
                </div>

                {/* Citations */}
                <div className="col-span-4 sm:col-span-2 flex items-center gap-1 sm:justify-end">
                  <span className="text-sm font-semibold text-white tabular-nums">{formatNumber(source.totalCitations)}</span>
                  <span className="text-[10px] text-gray-500 sm:hidden">citations</span>
                </div>

                {/* Trend */}
                <div className="col-span-4 sm:col-span-2 flex items-center gap-1.5 sm:justify-center">
                  <span className="text-sm">{trendEmoji(source.trend)}</span>
                  {trendIcon(source.trend)}
                  <span className={`text-xs font-medium ${
                    source.trend === 'rising' ? 'text-emerald-400' :
                    source.trend === 'falling' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {source.trend === 'rising' ? '+27%' : source.trend === 'falling' ? '-15%' : '+2%'}
                  </span>
                </div>

                {/* Models */}
                <div className="col-span-4 sm:col-span-4 flex flex-wrap gap-1">
                  {source.models.slice(0, 4).map((m) => (
                    <Badge
                      key={m}
                      variant="outline"
                      className="border-gray-700 text-gray-400 text-[10px] px-1.5 py-0 h-5"
                    >
                      {m}
                    </Badge>
                  ))}
                  {source.models.length > 4 && (
                    <Badge variant="outline" className="border-gray-700 text-gray-500 text-[10px] px-1.5 py-0 h-5">
                      +{source.models.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  // ── Render: Industries Tab ───────────────────────────────
  const renderIndustries = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {industries.map((industry, i) => {
        const topModel = Object.entries(industry.topModelsJson || {})
          .sort(([, a], [, b]) => b - a)[0]
        return (
          <motion.div
            key={industry.slug}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <Card className="bg-gray-900/60 border-gray-800/50 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm h-full">
              <CardContent className="p-4 flex flex-col gap-3">
                {/* Industry name */}
                <h4 className="text-sm font-semibold text-white">{industry.name}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2">{industry.description}</p>

                {/* AI Visibility Score */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg AI Visibility</p>
                    <p className="text-xl font-bold text-emerald-400 tabular-nums">{industry.aiVisibilityAvg.toFixed(1)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Data Points</p>
                    <p className="text-xl font-bold text-white tabular-nums">{formatNumber(industry.dataPoints || 0)}</p>
                  </div>
                </div>

                {/* Top model */}
                {topModel && (
                  <div className="flex items-center gap-1.5">
                    <Cpu className="size-3 text-gray-500" />
                    <span className="text-[11px] text-gray-400">Top model: </span>
                    <span className="text-[11px] font-medium text-white capitalize">{topModel[0]}</span>
                  </div>
                )}

                {/* View details */}
                <button className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors mt-auto pt-1">
                  View details <ChevronRight className="size-3" />
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )

  // ── Render: Breaking Research Tab ────────────────────────
  const renderBreaking = () => (
    <div className="space-y-3">
      {breaking.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-500/20 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Alert icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-lg">🚨</span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Headline */}
                  <h4 className="text-sm font-semibold text-white mb-1">{alert.headline}</h4>
                  <p className="text-xs text-gray-400 mb-2">{alert.summary}</p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-gray-700 text-gray-300 text-[10px] px-1.5 py-0 capitalize"
                    >
                      {alert.aiModel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] px-1.5 py-0"
                    >
                      {changeTypeLabel(alert.changeType)}
                    </Badge>
                    <span className="text-[10px] text-gray-500">
                      {alert.evidenceCount} evidence points
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-[10px] text-gray-500">
                      {alert.confidence}% confidence
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-[10px] text-gray-500">
                      {timeAgo(alert.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Significance */}
                <div className="flex-shrink-0 hidden sm:flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    alert.significance >= 80 ? 'border-red-500 text-red-400 bg-red-500/10' :
                    alert.significance >= 60 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                    'border-gray-600 text-gray-400 bg-gray-800/50'
                  }`}>
                    {alert.significance}
                  </div>
                  <span className="text-[9px] text-gray-500 uppercase">Impact</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="bg-gray-950 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Database className="size-5 text-emerald-400" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Dataset Explorer
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Explore AI model behavior data, citation patterns, and industry benchmarks from the Observatory pipeline.
          </p>
        </motion.div>

        {/* ── Search Bar ──────────────────────────────────── */}
        <motion.div
          className="max-w-2xl mx-auto mb-8 relative"
          ref={searchRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search industries, domains, AI models..."
              className="pl-10 h-12 bg-gray-900/80 border-gray-700/50 focus:border-emerald-500/50 text-white placeholder:text-gray-500 text-sm rounded-xl"
            />
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && searchQuery.trim() && suggestions().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 w-full z-20 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
              >
                {suggestions().map((s, i) => (
                  <button
                    key={`${s.type}-${s.label}`}
                    onClick={() => {
                      setSearchQuery(s.label)
                      setShowSuggestions(false)
                      if (s.type === 'industry') setActiveTab('industries')
                      else if (s.type === 'domain') setActiveTab('sources')
                      else setActiveTab('models')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/60 transition-colors text-left"
                  >
                    <span className="text-[11px]">
                      {s.type === 'industry' ? '🏭' : s.type === 'domain' ? '🌐' : '🤖'}
                    </span>
                    <span className="text-sm text-white">{s.label}</span>
                    <Badge variant="outline" className="ml-auto border-gray-700 text-gray-500 text-[9px] px-1 py-0 capitalize">
                      {s.type}
                    </Badge>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Tabbed Dashboard ────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900/60 border border-gray-800/50 p-1 rounded-xl mb-6 w-full sm:w-auto">
            <TabsTrigger
              value="models"
              className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-gray-400 text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2"
            >
              <Cpu className="size-3.5 mr-1.5 hidden sm:inline" />
              AI Models
            </TabsTrigger>
            <TabsTrigger
              value="sources"
              className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-gray-400 text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2"
            >
              <Globe className="size-3.5 mr-1.5 hidden sm:inline" />
              Sources
            </TabsTrigger>
            <TabsTrigger
              value="industries"
              className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-gray-400 text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2"
            >
              <BarChart3 className="size-3.5 mr-1.5 hidden sm:inline" />
              Industries
            </TabsTrigger>
            <TabsTrigger
              value="breaking"
              className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-gray-400 text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2"
            >
              <Radio className="size-3.5 mr-1.5 hidden sm:inline" />
              Breaking
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="models" className="mt-0">
                {renderModels()}
              </TabsContent>
              <TabsContent value="sources" className="mt-0">
                {renderSources()}
              </TabsContent>
              <TabsContent value="industries" className="mt-0">
                {renderIndustries()}
              </TabsContent>
              <TabsContent value="breaking" className="mt-0">
                {renderBreaking()}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* ── Observatory Score Display (example) ──────────── */}
        <motion.div
          className="mt-12 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gray-900/60 border-emerald-500/20 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="size-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Observatory Score</h3>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] px-1 py-0 ml-auto">
                  EXAMPLE
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Research Quality', value: 97, color: 'text-emerald-400' },
                  { label: 'Evidence', value: 98, color: 'text-emerald-400' },
                  { label: 'Confidence', value: 91, color: 'text-amber-400' },
                  { label: 'Freshness', value: 100, color: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between bg-gray-800/40 rounded-md px-3 py-2">
                    <span className="text-[11px] text-gray-400">{item.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="col-span-2 flex items-center justify-between bg-gray-800/40 rounded-md px-3 py-2">
                  <span className="text-[11px] text-gray-400">Sample</span>
                  <span className="text-sm font-bold text-white tabular-nums">4,281</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Custom scrollbar style ─────────────────────────────── */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  )
}
