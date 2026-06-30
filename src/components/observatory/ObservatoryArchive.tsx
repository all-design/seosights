'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Filter,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Search,
  Link2,
  Loader2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface Citation {
  citedUrl: string
  citedDomain: string
  citedTitle: string | null
  citedSnippet: string | null
  citationOrder: number
}

interface ArchiveResponse {
  id: string
  aiModel: string
  promptCategory: string
  promptText: string
  responseText: string
  citationsJson: string | null
  sentimentScore: number | null
  confidenceScore: number | null
  createdAt: string
  citations: Citation[]
}

interface ArchiveData {
  responses: ArchiveResponse[]
  total: number
  hasMore: boolean
  availableModels: string[]
  availableCategories: string[]
  dateRange: { earliest: string | null; latest: string | null }
}

// ── Constants ────────────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  chatgpt: '#10b981',
  claude: '#f59e0b',
  gemini: '#3b82f6',
  perplexity: '#8b5cf6',
  grok: '#ef4444',
  deepseek: '#06b6d4',
}

const CATEGORY_LABELS: Record<string, string> = {
  brand_query: 'Brand Query',
  industry_query: 'Industry Query',
  competitive_query: 'Competitive Query',
  factual_query: 'Factual Query',
  recommendation: 'Recommendation',
}

function getModelColor(modelId: string): string {
  const key = modelId.toLowerCase()
  for (const [name, color] of Object.entries(MODEL_COLORS)) {
    if (key.includes(name)) return color
  }
  return '#94a3b8'
}

function getModelDisplayName(modelId: string): string {
  const map: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    perplexity: 'Perplexity',
    grok: 'Grok',
    deepseek: 'DeepSeek',
  }
  const key = modelId.toLowerCase()
  for (const [name, label] of Object.entries(map)) {
    if (key.includes(name)) return label
  }
  return modelId.charAt(0).toUpperCase() + modelId.slice(1)
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1)
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    brand_query: '#10b981',
    industry_query: '#3b82f6',
    competitive_query: '#ef4444',
    factual_query: '#f59e0b',
    recommendation: '#8b5cf6',
  }
  return colors[category.toLowerCase()] || '#94a3b8'
}

function getSentimentIndicator(score: number | null): { icon: React.ReactNode; label: string; color: string } {
  if (score === null || score === undefined) return { icon: <Minus className="h-3.5 w-3.5" />, label: 'N/A', color: '#64748b' }
  if (score >= 0.3) return { icon: <ThumbsUp className="h-3.5 w-3.5" />, label: 'Positive', color: '#10b981' }
  if (score <= -0.3) return { icon: <ThumbsDown className="h-3.5 w-3.5" />, label: 'Negative', color: '#ef4444' }
  return { icon: <Minus className="h-3.5 w-3.5" />, label: 'Neutral', color: '#f59e0b' }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getAvailableMonths(dateRange: { earliest: string | null; latest: string | null }): string[] {
  const months: string[] = ['all']
  if (!dateRange.earliest || !dateRange.latest) return months
  const start = new Date(dateRange.earliest)
  const end = new Date(dateRange.latest)
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= end) {
    months.push(current.toISOString().slice(0, 7)) // "YYYY-MM"
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'all') return 'All Time'
  const [year, month] = monthKey.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ── Preview / Fallback Data ──────────────────────────────────

const PREVIEW_DATA: ArchiveData = {
  responses: [
    {
      id: 'prev-1',
      aiModel: 'chatgpt',
      promptCategory: 'brand_query',
      promptText: 'What are the best project management tools for small teams?',
      responseText: 'When it comes to project management tools for small teams, several options stand out. Asana offers an intuitive interface with task dependencies and timeline views. Trello uses a Kanban-style board that many teams find easy to adopt. Monday.com provides customizable workflows that scale with your team.',
      citationsJson: null,
      sentimentScore: 0.45,
      confidenceScore: 0.82,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      citations: [
        { citedUrl: 'https://asana.com/features', citedDomain: 'asana.com', citedTitle: 'Asana Features Overview', citedSnippet: 'Manage tasks, projects, and workflows across teams', citationOrder: 1 },
        { citedUrl: 'https://trello.com/guide', citedDomain: 'trello.com', citedTitle: 'Trello Getting Started Guide', citedSnippet: 'Organize anything together with Trello boards', citationOrder: 2 },
      ],
    },
    {
      id: 'prev-2',
      aiModel: 'claude',
      promptCategory: 'industry_query',
      promptText: 'How does healthcare SEO differ from other industries?',
      responseText: 'Healthcare SEO requires unique considerations compared to other industries. Google\'s YMYL (Your Money or Your Life) guidelines apply stricter quality standards to health-related content. Medical content must demonstrate E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) more rigorously than other niches.',
      citationsJson: null,
      sentimentScore: 0.12,
      confidenceScore: 0.91,
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      citations: [
        { citedUrl: 'https://developers.google.com/search/quality-guidelines', citedDomain: 'developers.google.com', citedTitle: 'Google Search Quality Guidelines', citedSnippet: 'Quality rating guidelines for YMYL content', citationOrder: 1 },
        { citedUrl: 'https://www.nih.gov/health-information', citedDomain: 'nih.gov', citedTitle: 'NIH Health Information Portal', citedSnippet: 'Trusted health information from the National Institutes of Health', citationOrder: 2 },
        { citedUrl: 'https://searchengineland.com/healthcare-seo-guide', citedDomain: 'searchengineland.com', citedTitle: 'Complete Healthcare SEO Guide 2025', citedSnippet: 'How to navigate YMYL requirements for medical websites', citationOrder: 3 },
      ],
    },
    {
      id: 'prev-3',
      aiModel: 'gemini',
      promptCategory: 'recommendation',
      promptText: 'Best CRM software for real estate agents',
      responseText: 'For real estate agents, the top CRM options include Follow Up Boss, which specializes in real estate lead management and automated follow-ups. kvCORE offers an integrated platform with IDX websites and lead cultivation. LionDesk provides affordable CRM with transaction management features.',
      citationsJson: null,
      sentimentScore: 0.35,
      confidenceScore: 0.76,
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      citations: [
        { citedUrl: 'https://www.followupboss.com/features', citedDomain: 'followupboss.com', citedTitle: 'Follow Up Boss Features', citedSnippet: 'Real estate CRM with smart lead distribution', citationOrder: 1 },
        { citedUrl: 'https://kvcore.com/platform', citedDomain: 'kvcore.com', citedTitle: 'kvCORE Platform Overview', citedSnippet: 'The #1 real estate platform for teams and brokerages', citationOrder: 2 },
      ],
    },
    {
      id: 'prev-4',
      aiModel: 'perplexity',
      promptCategory: 'competitive_query',
      promptText: 'HubSpot vs Salesforce for mid-market companies',
      responseText: 'HubSpot and Salesforce serve different segments well. HubSpot excels in ease of use and marketing automation, making it ideal for mid-market companies without dedicated IT teams. Salesforce offers deeper customization and enterprise features but requires more setup and admin resources. For companies between 50-500 employees, HubSpot often provides better ROI.',
      citationsJson: null,
      sentimentScore: -0.1,
      confidenceScore: 0.84,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      citations: [
        { citedUrl: 'https://www.hubspot.com/products/crm', citedDomain: 'hubspot.com', citedTitle: 'HubSpot CRM Platform', citedSnippet: 'Free CRM with marketing, sales, and service hubs', citationOrder: 1 },
        { citedUrl: 'https://www.salesforce.com/products/', citedDomain: 'salesforce.com', citedTitle: 'Salesforce Product Suite', citedSnippet: 'Enterprise CRM with AI-powered tools', citationOrder: 2 },
        { citedUrl: 'https://www.g2.com/compare/hubspot-vs-salesforce', citedDomain: 'g2.com', citedTitle: 'HubSpot vs Salesforce Comparison', citedSnippet: 'Real user reviews and feature comparison', citationOrder: 3 },
      ],
    },
    {
      id: 'prev-5',
      aiModel: 'grok',
      promptCategory: 'factual_query',
      promptText: 'What is the current average cost of dental implants in the US?',
      responseText: 'The average cost of dental implants in the US ranges from $3,000 to $6,000 per implant as of 2025. This includes the implant post, abutment, and crown. Additional procedures like bone grafting can add $500-$3,000 to the total cost. Prices vary significantly by region and provider.',
      citationsJson: null,
      sentimentScore: 0.0,
      confidenceScore: 0.68,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      citations: [
        { citedUrl: 'https://www.ada.org/resources/research/science-and-research-institute', citedDomain: 'ada.org', citedTitle: 'ADA Science & Research Institute', citedSnippet: 'Dental research and cost data from the American Dental Association', citationOrder: 1 },
      ],
    },
    {
      id: 'prev-6',
      aiModel: 'deepseek',
      promptCategory: 'industry_query',
      promptText: 'How is AI changing the legal industry in 2025?',
      responseText: 'AI is transforming the legal industry through contract analysis automation, legal research acceleration, and predictive analytics for case outcomes. Major firms are adopting AI tools for due diligence, e-discovery, and document review. However, concerns about accuracy and hallucinations remain significant barriers to full adoption in court-facing applications.',
      citationsJson: null,
      sentimentScore: 0.2,
      confidenceScore: 0.79,
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      citations: [
        { citedUrl: 'https://www.law.com/tech/ai-legal-industry-2025', citedDomain: 'law.com', citedTitle: 'AI in Legal: 2025 Market Report', citedSnippet: 'Comprehensive analysis of AI adoption in law firms', citationOrder: 1 },
        { citedUrl: 'https://www.americanbar.org/groups/technology', citedDomain: 'americanbar.org', citedTitle: 'ABA Technology Resource Center', citedSnippet: 'Guidelines for ethical AI use in legal practice', citationOrder: 2 },
      ],
    },
  ],
  total: 12450,
  hasMore: true,
  availableModels: ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek'],
  availableCategories: ['brand_query', 'industry_query', 'competitive_query', 'factual_query', 'recommendation'],
  dateRange: {
    earliest: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    latest: new Date().toISOString(),
  },
}

// ── Loading Skeleton ─────────────────────────────────────────

function ArchiveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 bg-slate-800" />
      </div>
      <Skeleton className="h-5 w-96 bg-slate-800" />

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-36 bg-slate-800 rounded-lg" />
        ))}
      </div>

      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-20 bg-slate-800 rounded" />
              <Skeleton className="h-6 w-28 bg-slate-800 rounded" />
            </div>
            <Skeleton className="h-4 w-full bg-slate-800 mb-2" />
            <Skeleton className="h-4 w-3/4 bg-slate-800 mb-2" />
            <Skeleton className="h-4 w-5/6 bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Citation Section ─────────────────────────────────────────

function CitationSection({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!citations || citations.length === 0) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
      >
        <Link2 className="h-3 w-3" />
        <span>{citations.length} citation{citations.length !== 1 ? 's' : ''}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 pl-1 border-l-2 border-slate-700/50">
              {citations.map((citation, idx) => (
                <div key={idx} className="ml-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono w-5">#{citation.citationOrder}</span>
                    <span className="text-emerald-400 font-medium">{citation.citedDomain}</span>
                    <a
                      href={citation.citedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {citation.citedTitle && (
                    <p className="text-slate-400 ml-7 truncate">{citation.citedTitle}</p>
                  )}
                  {citation.citedSnippet && (
                    <p className="text-slate-500 ml-7 line-clamp-2 mt-0.5 italic">
                      &ldquo;{citation.citedSnippet}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Response Card ────────────────────────────────────────────

function ResponseCard({ response, index }: { response: ArchiveResponse; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const modelColor = getModelColor(response.aiModel)
  const categoryColor = getCategoryColor(response.promptCategory)
  const sentiment = getSentimentIndicator(response.sentimentScore)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
        <CardContent className="p-4 sm:p-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className="text-xs font-semibold border-0"
              style={{
                color: modelColor,
                backgroundColor: `${modelColor}20`,
              }}
            >
              {getModelDisplayName(response.aiModel)}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs border-0"
              style={{
                color: categoryColor,
                backgroundColor: `${categoryColor}20`,
              }}
            >
              {getCategoryLabel(response.promptCategory)}
            </Badge>

            {/* Sentiment */}
            <Badge
              variant="outline"
              className="text-xs border-0 gap-1"
              style={{
                color: sentiment.color,
                backgroundColor: `${sentiment.color}20`,
              }}
            >
              {sentiment.icon}
              {sentiment.label}
            </Badge>

            {/* Confidence */}
            {response.confidenceScore !== null && response.confidenceScore !== undefined && (
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 bg-slate-800/50">
                {Math.round(response.confidenceScore * 100)}% conf.
              </Badge>
            )}

            {/* Date */}
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(response.createdAt)} {formatTime(response.createdAt)}
            </span>
          </div>

          {/* Prompt text */}
          <div className="mb-2">
            <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Prompt
            </p>
            <p className="text-sm text-slate-300 line-clamp-2">{response.promptText}</p>
          </div>

          {/* Response text */}
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Response</p>
            <div className={`text-sm text-slate-400 ${expanded ? '' : 'line-clamp-3'}`}>
              {response.responseText}
            </div>
            {response.responseText.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-1 transition-colors"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Show more <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>

          {/* Citations */}
          <CitationSection citations={response.citations} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryArchive() {
  const [data, setData] = useState<ArchiveData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [modelFilter, setModelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [offset, setOffset] = useState(0)

  const LIMIT = 10

  const fetchData = useCallback(async (fetchOffset: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: fetchOffset.toString(),
      })
      if (modelFilter !== 'all') params.set('model', modelFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (dateFilter !== 'all') params.set('date', dateFilter)

      const res = await fetch(`/api/observatory/archive?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      if (append) {
        setData((prev) =>
          prev
            ? {
                ...json,
                responses: [...prev.responses, ...json.responses],
              }
            : json
        )
      } else {
        setData(json)
      }
      setIsPreview(false)
      setError(null)
    } catch (err) {
      // If we already have data, keep it. If not, use preview.
      if (!data && !append) {
        setData(PREVIEW_DATA)
        setIsPreview(true)
      }
      setError(null) // Don't show error, use preview
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [modelFilter, categoryFilter, dateFilter])

  // Fetch on mount and when filters change
  useEffect(() => {
    setOffset(0)
    fetchData(0, false)
  }, [modelFilter, categoryFilter, dateFilter, fetchData])

  // Fetch more when offset changes
  useEffect(() => {
    if (offset > 0) {
      fetchData(offset, true)
    }
  }, [offset, fetchData])

  const handleLoadMore = () => {
    setOffset((prev) => prev + LIMIT)
  }

  const availableMonths = data ? getAvailableMonths(data.dateRange) : ['all']

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <ArchiveSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-center">
        <Database className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No data yet</p>
        <p className="text-slate-500 text-xs mt-1">Archive data will appear once AI responses are collected</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Database className="h-7 w-7 text-emerald-400" />
            AI Search Archive
          </motion.h2>
          <motion.span
            className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            ™
          </motion.span>
          {isPreview && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
              Preview — Connect for live data
            </Badge>
          )}
        </div>

        <motion.button
          onClick={() => fetchData(false)}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors text-xs self-start sm:self-auto"
          whileTap={{ rotate: 180 }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </motion.button>
      </div>

      <motion.p
        className="text-slate-400 text-sm sm:text-base max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Every AI response. Forever. Searchable by model, date, and category.
      </motion.p>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>

        {/* Model selector */}
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs bg-slate-900/80 border-slate-700 text-slate-300">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all" className="text-xs text-slate-300">All Models</SelectItem>
            {data.availableModels.map((model) => (
              <SelectItem key={model} value={model} className="text-xs text-slate-300">
                {getModelDisplayName(model)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category selector */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px] h-9 text-xs bg-slate-900/80 border-slate-700 text-slate-300">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all" className="text-xs text-slate-300">All Categories</SelectItem>
            {data.availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs text-slate-300">
                {getCategoryLabel(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date picker (month) */}
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[170px] h-9 text-xs bg-slate-900/80 border-slate-700 text-slate-300">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month} className="text-xs text-slate-300">
                {formatMonthLabel(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Total count */}
        <span className="text-xs text-slate-500 ml-auto">
          <Search className="h-3 w-3 inline mr-1" />
          {data.total.toLocaleString()} result{data.total !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* ── Results List ───────────────────────────────────────── */}
      {data.responses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-8 text-center">
              <Database className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No responses found</p>
              <p className="text-slate-600 text-xs mt-1">Try adjusting your filters or check back later</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {data.responses.map((response, idx) => (
              <ResponseCard key={response.id} response={response} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Load More ──────────────────────────────────────────── */}
      {data.hasMore && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More
                <span className="text-xs text-slate-500 ml-2">
                  ({data.responses.length} of {data.total.toLocaleString()})
                </span>
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
