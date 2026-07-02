'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Target,
  TrendingUp,
  Zap,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  BarChart3,
  Eye,
  Briefcase,
  Gauge,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────

type OpportunityType = 'Blog' | 'Tool' | 'Industry' | 'VS' | 'Benchmark' | 'Research' | 'Guide' | 'FAQ'
type SourceType = 'Observatory' | 'GSC' | 'Trends' | 'AI Models' | 'Competitor' | 'Internal'
type Priority = 'P1' | 'P2' | 'P3' | 'P4'
type Status = 'Discovered' | 'Scored' | 'Queued' | 'Approved' | 'Scheduled' | 'In Progress'

interface Opportunity {
  id: string
  title: string
  description: string
  type: OpportunityType
  source: SourceType
  seoScore: number
  aiVisibilityScore: number
  businessScore: number
  contentQualityScore: number
  competitorGapScore: number
  freshnessScore: number
  entityCoverageScore: number
  growthScore: number
  priority: Priority
  status: Status
  eta: string
  keywords: string[]
  entities: string[]
  relatedAssets: string[]
  confidence: number
}

// ── Mock Data ────────────────────────────────────────────────────────

const mockOpportunities: Opportunity[] = [
  {
    id: 'opp-001',
    title: 'AI SEO Tools Comparison 2025',
    description: 'Comprehensive comparison of AI-powered SEO tools with pricing, features, and ROI analysis',
    type: 'VS',
    source: 'AI Models',
    seoScore: 92,
    aiVisibilityScore: 88,
    businessScore: 85,
    contentQualityScore: 78,
    competitorGapScore: 91,
    freshnessScore: 95,
    entityCoverageScore: 82,
    growthScore: 89,
    priority: 'P1',
    status: 'Scored',
    eta: '2h 15m',
    keywords: ['ai seo tools', 'seo ai comparison', 'best ai seo 2025'],
    entities: ['AI SEO', 'Search Optimization', 'Content Analysis'],
    relatedAssets: ['/blog/ai-seo-guide', '/tools/seo-analyzer'],
    confidence: 94,
  },
  {
    id: 'opp-002',
    title: 'E-Commerce SEO Benchmark Report',
    description: 'Industry benchmarks for e-commerce SEO performance across 500+ online stores',
    type: 'Benchmark',
    source: 'Observatory',
    seoScore: 87,
    aiVisibilityScore: 79,
    businessScore: 91,
    contentQualityScore: 85,
    competitorGapScore: 76,
    freshnessScore: 88,
    entityCoverageScore: 80,
    growthScore: 85,
    priority: 'P1',
    status: 'Queued',
    eta: '4h 30m',
    keywords: ['ecommerce seo benchmarks', 'online store seo stats'],
    entities: ['E-Commerce', 'SEO Metrics', 'Benchmark Analysis'],
    relatedAssets: ['/benchmarks/seo-performance'],
    confidence: 89,
  },
  {
    id: 'opp-003',
    title: 'SaaS Industry SEO Landscape',
    description: 'Deep-dive into SaaS industry SEO patterns, keyword clusters, and AI citation trends',
    type: 'Industry',
    source: 'Trends',
    seoScore: 81,
    aiVisibilityScore: 92,
    businessScore: 78,
    contentQualityScore: 72,
    competitorGapScore: 85,
    freshnessScore: 90,
    entityCoverageScore: 88,
    growthScore: 84,
    priority: 'P1',
    status: 'Discovered',
    eta: '6h 45m',
    keywords: ['saas seo', 'b2b saas search optimization'],
    entities: ['SaaS', 'B2B Marketing', 'Search Engine Optimization'],
    relatedAssets: ['/industries/saas'],
    confidence: 86,
  },
  {
    id: 'opp-004',
    title: 'Featured Snippets Optimization Guide',
    description: 'Step-by-step guide to winning featured snippets in AI-driven search results',
    type: 'Guide',
    source: 'GSC',
    seoScore: 76,
    aiVisibilityScore: 94,
    businessScore: 70,
    contentQualityScore: 88,
    competitorGapScore: 72,
    freshnessScore: 83,
    entityCoverageScore: 79,
    growthScore: 80,
    priority: 'P2',
    status: 'Scored',
    eta: '8h 20m',
    keywords: ['featured snippets', 'position zero', 'snippet optimization'],
    entities: ['Featured Snippets', 'SERP Features', 'Rich Results'],
    relatedAssets: ['/blog/serp-features-guide'],
    confidence: 82,
  },
  {
    id: 'opp-005',
    title: 'AI Citation Tracker Tool',
    description: 'Free tool to track when and how AI models cite your content in their responses',
    type: 'Tool',
    source: 'AI Models',
    seoScore: 90,
    aiVisibilityScore: 96,
    businessScore: 82,
    contentQualityScore: 74,
    competitorGapScore: 93,
    freshnessScore: 97,
    entityCoverageScore: 90,
    growthScore: 90,
    priority: 'P1',
    status: 'Approved',
    eta: '1h 10m',
    keywords: ['ai citation tracker', 'llm citation monitor'],
    entities: ['AI Citations', 'LLM Monitoring', 'Content Attribution'],
    relatedAssets: ['/free-ai-seo-tools/citation-checker'],
    confidence: 97,
  },
  {
    id: 'opp-006',
    title: 'Healthcare SEO Research 2025',
    description: 'Research report on SEO trends and AI visibility in the healthcare vertical',
    type: 'Research',
    source: 'Observatory',
    seoScore: 73,
    aiVisibilityScore: 68,
    businessScore: 65,
    contentQualityScore: 80,
    competitorGapScore: 60,
    freshnessScore: 75,
    entityCoverageScore: 70,
    growthScore: 70,
    priority: 'P3',
    status: 'Discovered',
    eta: '12h 00m',
    keywords: ['healthcare seo', 'medical seo research'],
    entities: ['Healthcare', 'Medical SEO', 'YMYL Content'],
    relatedAssets: ['/industries/healthcare'],
    confidence: 72,
  },
  {
    id: 'opp-007',
    title: 'Local SEO vs National SEO',
    description: 'Comparison guide for businesses deciding between local and national SEO strategies',
    type: 'VS',
    source: 'Competitor',
    seoScore: 82,
    aiVisibilityScore: 75,
    businessScore: 88,
    contentQualityScore: 79,
    competitorGapScore: 70,
    freshnessScore: 65,
    entityCoverageScore: 74,
    growthScore: 77,
    priority: 'P2',
    status: 'Scored',
    eta: '5h 50m',
    keywords: ['local vs national seo', 'seo strategy comparison'],
    entities: ['Local SEO', 'National SEO', 'Google Business Profile'],
    relatedAssets: ['/blog/local-seo-guide'],
    confidence: 78,
  },
  {
    id: 'opp-008',
    title: 'Content Freshness Scoring Methodology',
    description: 'Blog post explaining how content freshness scoring works in AI search era',
    type: 'Blog',
    source: 'Internal',
    seoScore: 68,
    aiVisibilityScore: 85,
    businessScore: 60,
    contentQualityScore: 90,
    competitorGapScore: 65,
    freshnessScore: 92,
    entityCoverageScore: 78,
    growthScore: 77,
    priority: 'P2',
    status: 'Queued',
    eta: '9h 30m',
    keywords: ['content freshness score', 'freshness algorithm'],
    entities: ['Content Freshness', 'Query Deserves Freshness', 'Content Signals'],
    relatedAssets: ['/blog/content-quality-metrics'],
    confidence: 80,
  },
  {
    id: 'opp-009',
    title: 'FAQ Schema Generator',
    description: 'Free tool to generate FAQ schema markup optimized for AI-powered search results',
    type: 'Tool',
    source: 'GSC',
    seoScore: 88,
    aiVisibilityScore: 91,
    businessScore: 76,
    contentQualityScore: 70,
    competitorGapScore: 82,
    freshnessScore: 80,
    entityCoverageScore: 86,
    growthScore: 83,
    priority: 'P2',
    status: 'Scheduled',
    eta: '3h 45m',
    keywords: ['faq schema generator', 'schema markup tool'],
    entities: ['Schema Markup', 'FAQ Schema', 'Structured Data'],
    relatedAssets: ['/free-ai-seo-tools/schema-generator'],
    confidence: 88,
  },
  {
    id: 'opp-010',
    title: 'Real Estate SEO Industry Guide',
    description: 'Complete SEO playbook for real estate businesses with AI visibility strategies',
    type: 'Industry',
    source: 'Trends',
    seoScore: 71,
    aiVisibilityScore: 66,
    businessScore: 80,
    contentQualityScore: 75,
    competitorGapScore: 58,
    freshnessScore: 62,
    entityCoverageScore: 68,
    growthScore: 69,
    priority: 'P3',
    status: 'Discovered',
    eta: '14h 20m',
    keywords: ['real estate seo', 'property seo guide'],
    entities: ['Real Estate', 'Property Listings', 'Local Search'],
    relatedAssets: ['/industries/real-estate'],
    confidence: 68,
  },
  {
    id: 'opp-011',
    title: 'AI Overview Optimization FAQ',
    description: 'FAQ page answering common questions about optimizing for Google AI Overviews',
    type: 'FAQ',
    source: 'AI Models',
    seoScore: 79,
    aiVisibilityScore: 93,
    businessScore: 72,
    contentQualityScore: 82,
    competitorGapScore: 78,
    freshnessScore: 91,
    entityCoverageScore: 85,
    growthScore: 84,
    priority: 'P2',
    status: 'In Progress',
    eta: '1h 30m',
    keywords: ['ai overview optimization', 'google sge faq'],
    entities: ['AI Overview', 'SGE', 'Google Search Generative Experience'],
    relatedAssets: ['/blog/ai-overview-guide'],
    confidence: 90,
  },
  {
    id: 'opp-012',
    title: 'Technical SEO Benchmark Study',
    description: 'Benchmark study of technical SEO metrics across 10,000+ websites',
    type: 'Benchmark',
    source: 'Observatory',
    seoScore: 85,
    aiVisibilityScore: 72,
    businessScore: 78,
    contentQualityScore: 88,
    competitorGapScore: 80,
    freshnessScore: 70,
    entityCoverageScore: 76,
    growthScore: 79,
    priority: 'P2',
    status: 'Scored',
    eta: '7h 15m',
    keywords: ['technical seo benchmarks', 'site speed stats'],
    entities: ['Technical SEO', 'Core Web Vitals', 'Site Performance'],
    relatedAssets: ['/benchmarks/technical-seo'],
    confidence: 81,
  },
  {
    id: 'opp-013',
    title: 'SEO ROI Calculator Tool',
    description: 'Interactive calculator to estimate SEO return on investment based on industry data',
    type: 'Tool',
    source: 'Internal',
    seoScore: 83,
    aiVisibilityScore: 77,
    businessScore: 95,
    contentQualityScore: 68,
    competitorGapScore: 74,
    freshnessScore: 60,
    entityCoverageScore: 72,
    growthScore: 80,
    priority: 'P2',
    status: 'Queued',
    eta: '10h 00m',
    keywords: ['seo roi calculator', 'seo investment return'],
    entities: ['SEO ROI', 'Marketing ROI', 'Investment Analysis'],
    relatedAssets: ['/free-ai-seo-tools/roi-calculator'],
    confidence: 75,
  },
  {
    id: 'opp-014',
    title: 'Finance Industry SEO Trends',
    description: 'Analysis of SEO and AI visibility trends in the financial services sector',
    type: 'Industry',
    source: 'Trends',
    seoScore: 69,
    aiVisibilityScore: 74,
    businessScore: 85,
    contentQualityScore: 71,
    competitorGapScore: 62,
    freshnessScore: 78,
    entityCoverageScore: 66,
    growthScore: 72,
    priority: 'P3',
    status: 'Discovered',
    eta: '16h 30m',
    keywords: ['finance seo', 'fintech seo trends'],
    entities: ['Financial Services', 'Fintech', 'YMYL Content'],
    relatedAssets: ['/industries/finance'],
    confidence: 70,
  },
  {
    id: 'opp-015',
    title: 'E-E-A-T Optimization Research',
    description: 'Research on how E-E-A-T signals affect AI visibility and traditional rankings',
    type: 'Research',
    source: 'AI Models',
    seoScore: 78,
    aiVisibilityScore: 89,
    businessScore: 68,
    contentQualityScore: 92,
    competitorGapScore: 71,
    freshnessScore: 86,
    entityCoverageScore: 83,
    growthScore: 81,
    priority: 'P2',
    status: 'Scored',
    eta: '6h 00m',
    keywords: ['eeat seo', 'experience expertise authority trust'],
    entities: ['E-E-A-T', 'Content Quality', 'Author Authority'],
    relatedAssets: ['/blog/eeat-guide'],
    confidence: 85,
  },
  {
    id: 'opp-016',
    title: 'Blog Post Topic Cluster Strategy',
    description: 'Internal research on optimal topic cluster architecture for AI-first content',
    type: 'Blog',
    source: 'Internal',
    seoScore: 65,
    aiVisibilityScore: 70,
    businessScore: 58,
    contentQualityScore: 75,
    competitorGapScore: 55,
    freshnessScore: 68,
    entityCoverageScore: 62,
    growthScore: 64,
    priority: 'P4',
    status: 'Discovered',
    eta: '22h 00m',
    keywords: ['topic clusters', 'content cluster strategy'],
    entities: ['Topic Clusters', 'Pillar Pages', 'Content Architecture'],
    relatedAssets: ['/blog/content-strategy'],
    confidence: 60,
  },
  {
    id: 'opp-017',
    title: 'ChatGPT vs Perplexity SEO Impact',
    description: 'Comparative analysis of how ChatGPT and Perplexity handle SEO content differently',
    type: 'VS',
    source: 'AI Models',
    seoScore: 84,
    aiVisibilityScore: 95,
    businessScore: 73,
    contentQualityScore: 80,
    competitorGapScore: 88,
    freshnessScore: 96,
    entityCoverageScore: 91,
    growthScore: 88,
    priority: 'P1',
    status: 'Queued',
    eta: '3h 20m',
    keywords: ['chatgpt seo', 'perplexity seo impact'],
    entities: ['ChatGPT', 'Perplexity AI', 'AI Search Engines'],
    relatedAssets: ['/blog/ai-search-comparison'],
    confidence: 93,
  },
  {
    id: 'opp-018',
    title: 'SEO Audit Frequency Benchmark',
    description: 'Data on how often top-performing sites run SEO audits and the impact on rankings',
    type: 'Benchmark',
    source: 'Observatory',
    seoScore: 74,
    aiVisibilityScore: 65,
    businessScore: 72,
    contentQualityScore: 78,
    competitorGapScore: 68,
    freshnessScore: 55,
    entityCoverageScore: 70,
    growthScore: 69,
    priority: 'P3',
    status: 'Discovered',
    eta: '18h 45m',
    keywords: ['seo audit frequency', 'how often seo audit'],
    entities: ['SEO Audit', 'Site Auditing', 'Technical Analysis'],
    relatedAssets: ['/benchmarks/audit-frequency'],
    confidence: 65,
  },
]

// ── Helper Functions ─────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-amber-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-amber-500'
  if (score >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

function getTypeBadgeColor(type: OpportunityType): string {
  const colors: Record<OpportunityType, string> = {
    Blog: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    Tool: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    Industry: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    VS: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    Benchmark: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    Research: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    Guide: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    FAQ: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  }
  return colors[type]
}

function getSourceBadgeColor(source: SourceType): string {
  const colors: Record<SourceType, string> = {
    Observatory: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    GSC: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    Trends: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    'AI Models': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    Competitor: 'bg-red-500/15 text-red-400 border-red-500/25',
    Internal: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  }
  return colors[source]
}

function getPriorityBadgeColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    P1: 'bg-red-500/15 text-red-400 border-red-500/25',
    P2: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    P3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    P4: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  }
  return colors[priority]
}

function getStatusBadgeColor(status: Status): string {
  const colors: Record<Status, string> = {
    Discovered: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
    Scored: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    Queued: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    Approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    Scheduled: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  }
  return colors[status]
}

type SortKey = 'growthScore' | 'seoScore' | 'aiVisibilityScore' | 'businessScore' | 'priority' | 'type' | 'source' | 'status'
type SortDir = 'asc' | 'desc'

const priorityOrder: Record<Priority, number> = { P1: 1, P2: 2, P3: 3, P4: 4 }

// ── Sort Icon Component ──────────────────────────────────────────────

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return null
  return sortDir === 'asc' ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  )
}

// ── Score Bar Component ──────────────────────────────────────────────

function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getScoreBg(score))}
        />
      </div>
      <span className={cn('text-xs font-medium tabular-nums w-6 text-right', getScoreColor(score))}>
        {score}
      </span>
    </div>
  )
}

// ── Score Breakdown Modal ────────────────────────────────────────────

function ScoreBreakdownModal({
  opportunity,
  open,
  onClose,
}: {
  opportunity: Opportunity | null
  open: boolean
  onClose: () => void
}) {
  if (!opportunity) return null

  const scores = [
    { label: 'SEO Score', value: opportunity.seoScore, icon: Search },
    { label: 'AI Visibility', value: opportunity.aiVisibilityScore, icon: Eye },
    { label: 'Business Impact', value: opportunity.businessScore, icon: Briefcase },
    { label: 'Content Quality', value: opportunity.contentQualityScore, icon: BarChart3 },
    { label: 'Competitor Gap', value: opportunity.competitorGapScore, icon: Target },
    { label: 'Freshness', value: opportunity.freshnessScore, icon: Clock },
    { label: 'Entity Coverage', value: opportunity.entityCoverageScore, icon: Gauge },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800/60 text-zinc-100 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-100 pr-8">
            {opportunity.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            {opportunity.description}
          </DialogDescription>
        </DialogHeader>

        {/* Score Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
          {scores.map((score) => {
            const Icon = score.icon
            return (
              <div
                key={score.label}
                className="bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-3 flex flex-col items-center gap-2"
              >
                <Icon className={cn('w-4 h-4', getScoreColor(score.value))} />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider text-center">{score.label}</span>
                <span className={cn('text-xl font-bold tabular-nums', getScoreColor(score.value))}>
                  {score.value}
                </span>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score.value}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    className={cn('h-full rounded-full', getScoreBg(score.value))}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Growth Score Composite */}
        <div className="mt-4 bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-300">Composite Growth Score</span>
            <span className={cn('text-2xl font-bold tabular-nums', getScoreColor(opportunity.growthScore))}>
              {opportunity.growthScore}
            </span>
          </div>
          <Progress
            value={opportunity.growthScore}
            className="h-2 bg-zinc-800 [&>div]:bg-emerald-500"
          />
        </div>

        {/* Confidence */}
        <div className="mt-3 bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-300">Confidence</span>
            <span className={cn('text-lg font-semibold tabular-nums', getScoreColor(opportunity.confidence))}>
              {opportunity.confidence}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${opportunity.confidence}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className={cn('h-full rounded-full', getScoreBg(opportunity.confidence))}
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="mt-3">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Target Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.keywords.map((kw) => (
              <Badge
                key={kw}
                variant="outline"
                className="bg-zinc-900/60 border-zinc-700/50 text-zinc-400 text-[11px]"
              >
                {kw}
              </Badge>
            ))}
          </div>
        </div>

        {/* Entities */}
        <div className="mt-3">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Entities</h4>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.entities.map((ent) => (
              <Badge
                key={ent}
                variant="outline"
                className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[11px]"
              >
                {ent}
              </Badge>
            ))}
          </div>
        </div>

        {/* Related Assets */}
        <div className="mt-3">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Related Assets</h4>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.relatedAssets.map((asset) => (
              <span
                key={asset}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-700/40 text-zinc-500 text-[11px]"
              >
                {asset}
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Filter Pill ──────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border whitespace-nowrap',
        active
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700/50'
      )}
    >
      {label}
    </button>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function OpportunitiesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'All'>('All')
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All')
  const [sortKey, setSortKey] = useState<SortKey>('growthScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const types: (OpportunityType | 'All')[] = ['All', 'Blog', 'Tool', 'Industry', 'VS', 'Benchmark', 'Research', 'Guide', 'FAQ']
  const sources: (SourceType | 'All')[] = ['All', 'Observatory', 'GSC', 'Trends', 'AI Models', 'Competitor', 'Internal']
  const priorities: (Priority | 'All')[] = ['All', 'P1', 'P2', 'P3', 'P4']
  const statuses: (Status | 'All')[] = ['All', 'Discovered', 'Scored', 'Queued', 'Approved', 'Scheduled', 'In Progress']

  const filteredData = useMemo(() => {
    let data = [...mockOpportunities]

    if (search) {
      const q = search.toLowerCase()
      data = data.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.keywords.some((k) => k.toLowerCase().includes(q))
      )
    }
    if (typeFilter !== 'All') data = data.filter((o) => o.type === typeFilter)
    if (sourceFilter !== 'All') data = data.filter((o) => o.source === sourceFilter)
    if (priorityFilter !== 'All') data = data.filter((o) => o.priority === priorityFilter)
    if (statusFilter !== 'All') data = data.filter((o) => o.status === statusFilter)

    data.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'growthScore':
          cmp = a.growthScore - b.growthScore
          break
        case 'seoScore':
          cmp = a.seoScore - b.seoScore
          break
        case 'aiVisibilityScore':
          cmp = a.aiVisibilityScore - b.aiVisibilityScore
          break
        case 'businessScore':
          cmp = a.businessScore - b.businessScore
          break
        case 'priority':
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'type':
          cmp = a.type.localeCompare(b.type)
          break
        case 'source':
          cmp = a.source.localeCompare(b.source)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return data
  }, [search, typeFilter, sourceFilter, priorityFilter, statusFilter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }



  // Summary stats
  const totalOpportunities = mockOpportunities.length
  const avgGrowthScore = Math.round(
    mockOpportunities.reduce((s, o) => s + o.growthScore, 0) / mockOpportunities.length
  )
  const p1Count = mockOpportunities.filter((o) => o.priority === 'P1').length
  const newToday = mockOpportunities.filter((o) => o.status === 'Discovered').length

  const summaryStats = [
    { label: 'Total Opportunities', value: `1,247`, icon: Target, color: 'text-emerald-400' },
    { label: 'Avg Growth Score', value: `${avgGrowthScore}`, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'P1 Items', value: `${p1Count}`, icon: Zap, color: 'text-red-400' },
    { label: 'New Today', value: `${newToday}`, icon: Clock, color: 'text-cyan-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* ── Summary Stats Bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-4 py-3 flex items-center gap-3"
            >
              <div className={cn('p-1.5 rounded-md bg-zinc-800/60', stat.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className={cn('text-lg font-bold tabular-nums', stat.color)}>{stat.value}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities, keywords..."
            className="pl-9 h-9 bg-zinc-900/60 border-zinc-800/50 text-zinc-300 placeholder:text-zinc-600 text-sm focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1">
            {types.map((t) => (
              <FilterPill
                key={t}
                label={t}
                active={typeFilter === t}
                onClick={() => setTypeFilter(t)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Source Filter */}
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1">
            {sources.map((s) => (
              <FilterPill
                key={s}
                label={s}
                active={sourceFilter === s}
                onClick={() => setSourceFilter(s)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Priority & Status */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider mr-1">Priority</span>
            {priorities.map((p) => (
              <FilterPill
                key={p}
                label={p}
                active={priorityFilter === p}
                onClick={() => setPriorityFilter(p)}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider mr-1">Status</span>
            {statuses.map((s) => (
              <FilterPill
                key={s}
                label={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Results Count ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          Showing {filteredData.length} of {totalOpportunities} opportunities
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/40 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium min-w-[220px]">
                Opportunity
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('type')}
              >
                <span className="inline-flex items-center gap-1">Type <SortIcon column="type" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('source')}
              >
                <span className="inline-flex items-center gap-1">Source <SortIcon column="source" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('seoScore')}
              >
                <span className="inline-flex items-center gap-1">SEO <SortIcon column="seoScore" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('aiVisibilityScore')}
              >
                <span className="inline-flex items-center gap-1">AI Vis <SortIcon column="aiVisibilityScore" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('businessScore')}
              >
                <span className="inline-flex items-center gap-1">Biz <SortIcon column="businessScore" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('growthScore')}
              >
                <span className="inline-flex items-center gap-1">Growth <SortIcon column="growthScore" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('priority')}
              >
                <span className="inline-flex items-center gap-1">Pri <SortIcon column="priority" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead
                className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium cursor-pointer select-none hover:text-zinc-300"
                onClick={() => handleSort('status')}
              >
                <span className="inline-flex items-center gap-1">Status <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className="text-zinc-500 text-[11px] uppercase tracking-wider font-medium">
                ETA
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredData.map((opp, i) => (
                <motion.tr
                  key={opp.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, delay: i * 0.02 }}
                  onClick={() => {
                    setSelectedOpp(opp)
                    setModalOpen(true)
                  }}
                  className="border-zinc-800/30 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                >
                  <TableCell className="max-w-[260px]">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                        {opp.title}
                      </div>
                      <div className="text-[11px] text-zinc-600 truncate">
                        {opp.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] px-2', getTypeBadgeColor(opp.type))}>
                      {opp.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] px-2', getSourceBadgeColor(opp.source))}>
                      {opp.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={opp.seoScore} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={opp.aiVisibilityScore} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar score={opp.businessScore} />
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-sm font-bold tabular-nums', getScoreColor(opp.growthScore))}>
                      {opp.growthScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] px-2', getPriorityBadgeColor(opp.priority))}>
                      {opp.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px] px-2', getStatusBadgeColor(opp.status))}>
                      {opp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-zinc-500 tabular-nums">{opp.eta}</span>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {filteredData.length === 0 && (
          <div className="py-12 text-center">
            <Target className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No opportunities match your filters</p>
            <p className="text-xs text-zinc-600 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* ── Score Breakdown Modal ──────────────────────────────────── */}
      <ScoreBreakdownModal
        opportunity={selectedOpp}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </motion.div>
  )
}
