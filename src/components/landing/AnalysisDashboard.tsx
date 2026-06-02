'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, SEOAnalysis } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Shield,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  FileText,
  Target,
  Wrench,
  Database,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Bot,
  Globe,
  Eye,
  MapPin,
  Award,
  Scale,
  Link2,
  ShieldAlert,
  UserCheck,
  ShoppingBag,
  Download,
  Loader2,
  Bell,
  Clock,
  Activity,
  Rocket,
  Swords,
  Milestone,
  Info,
} from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ── Pillar Badge ──────────────────────────────────────────────
function PillarBadge({ pillar }: { pillar: string }) {
  const styles: Record<string, string> = {
    seo: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    aeo: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
    geo: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    all: 'border-white/20 text-foreground bg-white/5',
  }
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[pillar] || styles.all}`}>
      {pillar}
    </Badge>
  )
}

// ── Schema Status Badge ──────────────────────────────────────
function SchemaStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    restricted: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    deprecated: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
  }
  return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[status] || styles.deprecated}`}>{status}</Badge>
}

// ── Score Ring ────────────────────────────────────────────────
function ScoreRing({ score, label, color, size = 96 }: { score: number; label: string; color: string; size?: number }) {
  const r = (size / 2) - 8
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth="6" fill="none" className="text-white/5" />
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${size < 80 ? 'text-base' : 'text-xl'}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  )
}

// ── Severity Badge ────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
    warning: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    info: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
  }
  return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[severity] || styles.info}`}>{severity}</Badge>
}

// ── Risk Badge ────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    low: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    medium: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    high: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
  }
  return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[level] || styles.medium}`}>{level} risk</Badge>
}

// ── Impact Badge ──────────────────────────────────────────────
function ImpactBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
    medium: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    low: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
  }
  return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[level] || styles.low}`}>{level}</Badge>
}

// ── Effort Badge ──────────────────────────────────────────────
function EffortBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
    medium: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    low: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
  }
  return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[level] || styles.medium}`}>{level}</Badge>
}

// ── Separator ─────────────────────────────────────────────────
function Separator() {
  return <div className="w-px h-5 bg-white/20 mx-1.5 hidden sm:block" aria-hidden="true" />
}

// ── Collapsible Section ───────────────────────────────────────
function Collapsible({ title, icon: Icon, children, defaultOpen = false, badge, accentColor = 'emerald' }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; accentColor?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  }
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${colorMap[accentColor] || colorMap.emerald}`} />
          <span className="font-semibold text-sm">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  )
}

// ── Sparkline ─────────────────────────────────────────────────
function Sparkline({ data, color = '#10b981', width = 120, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
    </svg>
  )
}

// ── Strategy Action Item ──────────────────────────────────────
interface StrategyAction {
  name: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  timeline: string
  steps: string[]
}

function StrategyActionCard({ action, index }: { action: StrategyAction; index: number }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-emerald-400">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-2">{action.name}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <ImpactBadge level={action.impact} />
            <EffortBadge level={action.effort} />
            <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />{action.timeline}
            </Badge>
          </div>
          <div className="space-y-1">
            {action.steps.map((step, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{step}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DERIVED DATA HELPERS
// ══════════════════════════════════════════════════════════════

function deriveQuickWins(data: SEOAnalysis) {
  const wins: { title: string; time: string; description: string }[] = []
  // From critical/warning technical SEO issues
  const criticalIssues = data.audit?.technicalSEO?.issues?.filter(i => i.severity === 'critical') || []
  const warningIssues = data.audit?.technicalSEO?.issues?.filter(i => i.severity === 'warning') || []

  criticalIssues.slice(0, 2).forEach(issue => {
    wins.push({
      title: issue.issue,
      time: criticalIssues.indexOf(issue) === 0 ? '5 min' : '15 min',
      description: issue.fix,
    })
  })
  warningIssues.slice(0, 2).forEach(issue => {
    wins.push({
      title: issue.issue,
      time: '15 min',
      description: issue.fix,
    })
  })

  // Quick AI crawler fixes
  if (data.aiCrawler && !data.aiCrawler.llmsTxtPresence) {
    wins.push({ title: 'Create llms.txt file', time: '10 min', description: 'Add a llms.txt file to your root directory to help AI crawlers understand your site' })
  }
  // Quick AEO fix
  if (data.audit?.aeoReadiness && !data.audit.aeoReadiness.hasFAQ) {
    wins.push({ title: 'Add FAQ page with schema', time: '30 min', description: 'Create a FAQ page with FAQPage structured data markup for answer engine visibility' })
  }
  // Quick GEO fix
  if (data.audit?.geoVisibility && !data.audit.geoVisibility.knowledgeGraphPresence) {
    wins.push({ title: 'Add Organization schema markup', time: '10 min', description: 'Implement Organization schema to establish knowledge graph presence' })
  }

  return wins.slice(0, 4)
}

function deriveSEOStrategy(data: SEOAnalysis): StrategyAction[] {
  const actions: StrategyAction[] = []
  // From technical SEO issues
  const issues = data.audit?.technicalSEO?.issues || []
  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const warningIssues = issues.filter(i => i.severity === 'warning')

  if (criticalIssues.length > 0) {
    actions.push({
      name: `Fix ${criticalIssues.length} critical technical SEO issue${criticalIssues.length > 1 ? 's' : ''}`,
      impact: 'high',
      effort: 'low',
      timeline: '1-2 days',
      steps: [
        criticalIssues[0]?.issue ? `Resolve: ${criticalIssues[0].issue}` : 'Address all critical issues immediately',
        criticalIssues[0]?.fix || 'Follow the recommended fix for each issue',
        'Re-run crawl after fixes to verify resolution',
      ],
    })
  }

  if (warningIssues.length > 0) {
    actions.push({
      name: `Resolve ${warningIssues.length} warning-level SEO issue${warningIssues.length > 1 ? 's' : ''}`,
      impact: 'medium',
      effort: 'low',
      timeline: '1 week',
      steps: [
        warningIssues[0]?.issue ? `Start with: ${warningIssues[0].issue}` : 'Prioritize by page impact',
        'Test fixes on staging before deploying',
        'Monitor Core Web Vitals after each fix',
      ],
    })
  }

  // From schema recommendations
  const activeSchemas = data.structure?.schemaRecommendations?.filter(s => s.status === 'active' && s.pillar === 'seo') || []
  if (activeSchemas.length > 0) {
    actions.push({
      name: `Implement ${activeSchemas.length} missing SEO schema type${activeSchemas.length > 1 ? 's' : ''}`,
      impact: 'high',
      effort: 'medium',
      timeline: '1-2 weeks',
      steps: activeSchemas.slice(0, 2).map(s => `Add ${s.schemaType}: ${s.implementation}`),
    })
  }

  // From keyword gaps
  const seoGaps = data.structure?.keywordGaps?.filter(k => k.type === 'seo') || []
  if (seoGaps.length > 0) {
    actions.push({
      name: `Target ${seoGaps.length} SEO keyword gap${seoGaps.length > 1 ? 's' : ''}`,
      impact: 'high',
      effort: 'high',
      timeline: '2-4 weeks',
      steps: [
        `Create content targeting: ${seoGaps.slice(0, 3).map(k => k.keyword).join(', ')}`,
        'Optimize existing pages for these keywords first',
        'Build internal links from pillar pages to new content',
      ],
    })
  }

  // From page speed
  const poorVitals = data.audit?.pageSpeed?.coreVitals?.filter(v => v.status === 'poor') || []
  if (poorVitals.length > 0) {
    actions.push({
      name: `Improve ${poorVitals.map(v => v.metric).join(' & ')} scores`,
      impact: 'high',
      effort: 'medium',
      timeline: '2-3 weeks',
      steps: [
        `Optimize ${poorVitals[0]?.metric}: currently ${poorVitals[0]?.value}`,
        'Compress images, defer non-critical JS, optimize fonts',
        'Use PageSpeed Insights to track improvements',
      ],
    })
  }

  // From on-page optimizations
  const onPageOpts = data.creative?.onPageOptimizations || []
  if (onPageOpts.length > 0) {
    actions.push({
      name: `Update title tags & meta descriptions for ${onPageOpts.length} page${onPageOpts.length > 1 ? 's' : ''}`,
      impact: 'medium',
      effort: 'low',
      timeline: '1 week',
      steps: [
        `Priority: ${onPageOpts[0]?.page} — change to "${onPageOpts[0]?.suggestedTitle}"`,
        'Update meta descriptions to include target keywords',
        'A/B test new titles for CTR improvement',
      ],
    })
  }

  // From crawlability
  const crawlIssues = data.audit?.crawlability?.issues || []
  if (crawlIssues.length > 0) {
    actions.push({
      name: `Fix ${crawlIssues.length} crawlability issue${crawlIssues.length > 1 ? 's' : ''}`,
      impact: 'medium',
      effort: 'medium',
      timeline: '1-2 weeks',
      steps: [
        crawlIssues[0]?.issue || 'Address crawl errors and blocked resources',
        'Submit updated sitemap to Google Search Console',
        'Monitor crawl stats for improvement',
      ],
    })
  }

  return actions.slice(0, 7)
}

function deriveAEOStrategy(data: SEOAnalysis): StrategyAction[] {
  const actions: StrategyAction[] = []

  // FAQ schema
  if (data.audit?.aeoReadiness && !data.audit.aeoReadiness.hasFAQ) {
    actions.push({
      name: 'Add FAQPage schema to FAQ pages',
      impact: 'high',
      effort: 'low',
      timeline: '1-2 days',
      steps: [
        'Create FAQPage structured data for all Q&A pages',
        'Use JSON-LD format in the page <head>',
        'Validate with Google Rich Results Test',
      ],
    })
  }

  // Answer blocks
  const answerBlocks = data.creative?.answerBlocks || []
  if (answerBlocks.length > 0) {
    actions.push({
      name: `Create ${answerBlocks.length} People Also Ask answer blocks`,
      impact: 'high',
      effort: 'medium',
      timeline: '1-2 weeks',
      steps: [
        `Priority question: "${answerBlocks[0]?.question || 'N/A'}"`,
        'Format answers in 40-60 words for snippet eligibility',
        'Use H2/H3 headers matching the question text exactly',
      ],
    })
  }

  // Schema for AEO
  const aeoSchemas = data.structure?.schemaRecommendations?.filter(s => s.pillar === 'aeo') || []
  if (aeoSchemas.length > 0) {
    actions.push({
      name: `Implement ${aeoSchemas.length} AEO-focused schema type${aeoSchemas.length > 1 ? 's' : ''}`,
      impact: 'high',
      effort: 'medium',
      timeline: '1-2 weeks',
      steps: aeoSchemas.slice(0, 2).map(s => `Add ${s.schemaType}: ${s.implementation}`),
    })
  }

  // Voice search optimization
  if (data.audit?.aeoReadiness?.answerFormatScore < 60) {
    actions.push({
      name: 'Optimize content for voice search queries',
      impact: 'medium',
      effort: 'medium',
      timeline: '2-3 weeks',
      steps: [
        'Rewrite key pages with conversational, natural language',
        'Add "how to" and "what is" sections with direct answers',
        'Ensure mobile page speed meets "good" threshold',
      ],
    })
  }

  // Structured data
  if (data.audit?.aeoReadiness && !data.audit.aeoReadiness.hasStructuredData) {
    actions.push({
      name: 'Add structured data markup to all key pages',
      impact: 'high',
      effort: 'medium',
      timeline: '2 weeks',
      steps: [
        'Implement Article, BreadcrumbList, and Organization schema',
        'Use Google Structured Data Markup Helper for validation',
        'Monitor Search Console for rich result enhancements',
      ],
    })
  }

  // Answer format
  const aeoIssues = data.audit?.aeoReadiness?.issues || []
  if (aeoIssues.length > 0) {
    actions.push({
      name: 'Fix answer format and readability issues',
      impact: 'medium',
      effort: 'low',
      timeline: '1 week',
      steps: [
        aeoIssues[0] || 'Ensure content answers questions directly in the first paragraph',
        'Use bullet points and numbered lists for step-by-step answers',
        'Add "Summary" or "Key Takeaway" sections',
      ],
    })
  }

  return actions.slice(0, 6)
}

function deriveGEOStrategy(data: SEOAnalysis): StrategyAction[] {
  const actions: StrategyAction[] = []

  // llms.txt
  if (data.aiCrawler && !data.aiCrawler.llmsTxtPresence) {
    actions.push({
      name: 'Create llms.txt file for AI crawler discovery',
      impact: 'high',
      effort: 'low',
      timeline: '1 day',
      steps: [
        'Create /llms.txt with site summary, key pages, and content descriptions',
        'Include markdown-formatted overview of your products/services',
        'Link to your most important and authoritative pages',
      ],
    })
  }

  // AI crawler access
  const blockedBots = data.aiCrawler?.aiCrawlerAccess?.filter(b => !b.allowed) || []
  if (blockedBots.length > 0) {
    actions.push({
      name: `Allow ${blockedBots.map(b => b.bot).join(', ')} in robots.txt`,
      impact: 'high',
      effort: 'low',
      timeline: '5 min',
      steps: blockedBots.slice(0, 2).map(b => `Remove Disallow rule for ${b.bot} — ${b.recommendation}`),
    })
  }

  // Knowledge graph
  if (data.audit?.geoVisibility && !data.audit.geoVisibility.knowledgeGraphPresence) {
    actions.push({
      name: 'Add Organization schema for knowledge graph',
      impact: 'high',
      effort: 'medium',
      timeline: '1 week',
      steps: [
        'Implement Organization schema with name, url, logo, sameAs links',
        'Add sameAs links to all social media profiles',
        'Submit to Google Knowledge Graph through Search Console',
      ],
    })
  }

  // Entity recognition
  if (data.audit?.geoVisibility && data.audit.geoVisibility.entityRecognition < 50) {
    actions.push({
      name: 'Improve entity recognition with semantic markup',
      impact: 'medium',
      effort: 'medium',
      timeline: '2-3 weeks',
      steps: [
        'Add defined term and entity references throughout content',
        'Use SameAs and additionalType properties in schema',
        'Create an "About" page with detailed entity information',
      ],
    })
  }

  // GEO schemas
  const geoSchemas = data.structure?.schemaRecommendations?.filter(s => s.pillar === 'geo') || []
  if (geoSchemas.length > 0) {
    actions.push({
      name: `Implement ${geoSchemas.length} GEO-focused schema type${geoSchemas.length > 1 ? 's' : ''}`,
      impact: 'medium',
      effort: 'medium',
      timeline: '2 weeks',
      steps: geoSchemas.slice(0, 2).map(s => `Add ${s.schemaType}: ${s.implementation}`),
    })
  }

  // Brand mentions
  if (data.brandMentions && data.brandMentions.brandMentionScore < 60) {
    actions.push({
      name: 'Build AI citation signals through brand mentions',
      impact: 'high',
      effort: 'high',
      timeline: '1-3 months',
      steps: [
        'Get mentioned on authoritative sites in your niche',
        'Create original research or data that AI engines cite',
        'Engage on platforms where AI models source information',
      ],
    })
  }

  // Citability
  if (data.geoCitability && data.geoCitability.overallScore < 50) {
    actions.push({
      name: 'Improve content citability score for AI engines',
      impact: 'medium',
      effort: 'medium',
      timeline: '2-4 weeks',
      steps: [
        'Add clear, quotable statements with specific data points',
        'Include unique insights not found on competitor sites',
        'Structure content with clear headers and definitive answers',
      ],
    })
  }

  return actions.slice(0, 6)
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export default function AnalysisDashboard({ onStartFree }: { onStartFree?: () => void }) {
  const { analysis, reset } = useAppStore()
  const data = analysis as SEOAnalysis | null
  const [exporting, setExporting] = useState(false)
  const [playbookTab, setPlaybookTab] = useState<'seo' | 'aeo' | 'geo'>('seo')
  const [expandedUpdate, setExpandedUpdate] = useState<number | null>(null)

  const quickWins = useMemo(() => data ? deriveQuickWins(data) : [], [data])
  const seoStrategy = useMemo(() => data ? deriveSEOStrategy(data) : [], [data])
  const aeoStrategy = useMemo(() => data ? deriveAEOStrategy(data) : [], [data])
  const geoStrategy = useMemo(() => data ? deriveGEOStrategy(data) : [], [data])

  if (!data) return null

  const scoreColor = (s: number) => (s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444')

  // Derive estimated traffic data
  const seoScore = data.overallScores.seo
  const aeoScore = data.overallScores.aeo
  const geoScore = data.overallScores.geo
  const trafficData = [
    { label: 'Organic Search', value: Math.round(seoScore * 0.55 + 15), color: '#10b981' },
    { label: 'Direct', value: Math.round(100 - seoScore * 0.4), color: '#8b5cf6' },
    { label: 'Referral', value: Math.round(seoScore * 0.15 + 5), color: '#f59e0b' },
    { label: 'AI Referral', value: Math.round(geoScore * 0.3), color: '#06b6d4' },
  ]
  const maxTraffic = Math.max(...trafficData.map(d => d.value))

  // Derive 6-month sparkline data
  const sparkData = [
    seoScore * 0.7,
    seoScore * 0.75,
    seoScore * 0.82,
    seoScore * 0.88,
    seoScore * 0.94,
    seoScore,
  ]

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(data.siteName || 'site').replace(/[^a-zA-Z0-9]/g, '-')}-SEO-AEO-GEO-Report.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  // Algorithm update insights generator
  const getUpdateInsight = (update: { name: string; impact: string; affectedPillar: string; description: string }) => {
    const pillarLabel = update.affectedPillar === 'seo' ? 'organic search rankings' :
                        update.affectedPillar === 'aeo' ? 'answer engine visibility' :
                        update.affectedPillar === 'geo' ? 'AI citation likelihood' : 'all three pillars'
    if (update.impact === 'high') {
      return `This update may significantly impact your ${pillarLabel}. Review the affected pages immediately and align with the new quality standards.`
    }
    if (update.impact === 'medium') {
      return `Monitor your ${pillarLabel} closely over the next 2-4 weeks. Focus on content quality improvements to maintain stability.`
    }
    return `Minimal immediate impact expected on ${pillarLabel}, but ensure your content follows best practices to stay ahead of future updates.`
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Agent <span className="text-emerald-400">OS</span>
            </span>
            <Separator />
            <span className="text-sm text-muted-foreground hidden sm:block">{data.siteName || data.url}</span>
            {data.market && data.market !== 'Global' && (
              <>
                <Separator />
                <span className="text-xs text-amber-400 hidden sm:flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {data.market}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">

          {/* ── Executive Summary ─────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      SEO · AEO · GEO: <span className="text-emerald-400">{data.siteName}</span>
                    </h1>
                    {data.market && data.market !== 'Global' && (
                      <p className="text-amber-400 text-sm mb-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Target Market: {data.market}
                      </p>
                    )}
                    <p className="text-muted-foreground leading-relaxed text-lg">{data.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Quick Wins ─────────────────────────────────── */}
          {quickWins.length > 0 && (
            <motion.div variants={item}>
              <Card className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-emerald-300">Quick Wins — Do These Today</h2>
                      <p className="text-sm text-emerald-400/70">High-impact actions you can complete in minutes</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {quickWins.map((win, i) => (
                      <div key={i} className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">{win.time}</Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{win.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{win.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Three Pillar Scores ───────────────────────── */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Three-Pillar Performance
            </h2>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <ScoreRing score={data.overallScores.seo} label="SEO" color={scoreColor(data.overallScores.seo)} />
                  <ScoreRing score={data.overallScores.aeo} label="AEO" color={scoreColor(data.overallScores.aeo)} />
                  <ScoreRing score={data.overallScores.geo} label="GEO" color={scoreColor(data.overallScores.geo)} />
                  <ScoreRing score={data.overallScores.combined} label="Combined" color={scoreColor(data.overallScores.combined)} />
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> SEO — Search Engine Optimization
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" /> AEO — Answer Engine Optimization
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-amber-500" /> GEO — Generative Engine Optimization
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Traffic Performance ────────────────────────── */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Traffic Performance
            </h2>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Traffic Distribution */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">Estimated Traffic Distribution</p>
                    <div className="space-y-3">
                      {trafficData.map((td, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{td.label}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden relative">
                            <div className="h-full rounded-full transition-all duration-700 flex items-center" style={{ width: `${(td.value / maxTraffic) * 100}%`, backgroundColor: td.color }}>
                              <span className="text-[10px] font-bold text-white ml-2 whitespace-nowrap">{td.value}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Traffic Trend */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">6-Month SEO Score Trend</p>
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-xs text-muted-foreground">6 months ago</span>
                        <span className="text-xs text-muted-foreground">Now</span>
                      </div>
                      <Sparkline data={sparkData} color="#10b981" width={260} height={48} />
                      <div className="flex items-center gap-2 mt-3">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-semibold">+{Math.round(seoScore - seoScore * 0.7)} points</span>
                        <span className="text-xs text-muted-foreground">estimated improvement</span>
                      </div>
                    </div>
                    {data.trafficInsights && (data.trafficInsights.winners?.length > 0 || data.trafficInsights.losers?.length > 0) && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10 text-center">
                          <p className="text-xs text-muted-foreground">Winners</p>
                          <p className="text-lg font-bold text-emerald-400">{data.trafficInsights.winners?.length || 0}</p>
                        </div>
                        <div className="bg-rose-500/5 rounded-lg p-2 border border-rose-500/10 text-center">
                          <p className="text-xs text-muted-foreground">Losers</p>
                          <p className="text-lg font-bold text-rose-400">{data.trafficInsights.losers?.length || 0}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Executive Actions ──────────────────────────── */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Top 5 Actions to Take Now
            </h2>
            <div className="grid gap-3">
              {data.executiveActions?.map((action, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Strategy Playbook ──────────────────────────── */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Swords className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Your Strategy Playbook</h2>
                <p className="text-sm text-muted-foreground">Concrete, prioritized actions with implementation steps</p>
              </div>
            </div>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-0">
                {/* Tab Buttons */}
                <div className="flex border-b border-white/10">
                  {[
                    { key: 'seo' as const, label: 'SEO Strategy', icon: Search, color: 'emerald', count: seoStrategy.length },
                    { key: 'aeo' as const, label: 'AEO Strategy', icon: MessageSquare, color: 'cyan', count: aeoStrategy.length },
                    { key: 'geo' as const, label: 'GEO Strategy', icon: Brain, color: 'amber', count: geoStrategy.length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPlaybookTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all border-b-2 ${
                        playbookTab === tab.key
                          ? `${tab.color === 'emerald' ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5' : tab.color === 'cyan' ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5' : 'text-amber-400 border-amber-400 bg-amber-500/5'}`
                          : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-white/[0.02]'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      <Badge variant="outline" className={`text-[10px] ${playbookTab === tab.key ? (tab.color === 'emerald' ? 'border-emerald-500/30 text-emerald-400' : tab.color === 'cyan' ? 'border-cyan-500/30 text-cyan-400' : 'border-amber-500/30 text-amber-400') : 'border-white/20 text-muted-foreground'}`}>
                        {tab.count}
                      </Badge>
                    </button>
                  ))}
                </div>
                {/* Tab Content */}
                <div className="p-5">
                  <div className="grid gap-3">
                    {(playbookTab === 'seo' ? seoStrategy : playbookTab === 'aeo' ? aeoStrategy : geoStrategy).map((action, i) => (
                      <StrategyActionCard key={`${playbookTab}-${i}`} action={action} index={i} />
                    ))}
                    {(playbookTab === 'seo' ? seoStrategy : playbookTab === 'aeo' ? aeoStrategy : geoStrategy).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No specific {playbookTab.toUpperCase()} strategy actions derived. Your {playbookTab.toUpperCase()} score looks good!
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 1: AUDIT
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 1: Audit</h2>
                <p className="text-sm text-muted-foreground">Technical SEO · AEO Readiness · GEO Visibility</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Technical SEO */}
              <Collapsible title="Technical SEO Issues" icon={Wrench} badge={<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.audit.technicalSEO.score}/100</Badge>} defaultOpen accentColor="emerald">
                <div className="space-y-3">
                  {data.audit.technicalSEO.issues?.map((issue, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityBadge severity={issue.severity} />
                        <span className="text-sm font-medium">{issue.issue}</span>
                      </div>
                      <p className="text-xs text-emerald-400 ml-2">→ {issue.fix}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Crawlability */}
              <Collapsible title="Crawlability" icon={Database} badge={<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.audit.crawlability.score}/100</Badge>} accentColor="emerald">
                <div className="space-y-2">
                  {data.audit.crawlability.issues?.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm">{issue.issue}</p>
                        <p className="text-xs text-muted-foreground">Impact: {issue.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Page Speed */}
              <Collapsible title="Core Web Vitals" icon={Zap} badge={<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.audit.pageSpeed.score}/100</Badge>} accentColor="emerald">
                <div className="grid sm:grid-cols-3 gap-3">
                  {data.audit.pageSpeed.coreVitals?.map((vital, i) => (
                    <div key={i} className={`rounded-xl p-4 text-center border ${vital.status === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' : vital.status === 'poor' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                      <p className="text-xs text-muted-foreground mb-1">{vital.metric}</p>
                      <p className="text-xl font-bold">{vital.value}</p>
                      <Badge variant="outline" className={`text-[10px] mt-2 ${vital.status === 'good' ? 'border-emerald-500/30 text-emerald-400' : vital.status === 'poor' ? 'border-rose-500/30 text-rose-400' : 'border-amber-500/30 text-amber-400'}`}>{vital.status}</Badge>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* AEO Readiness */}
              <Collapsible title="AEO Readiness" icon={MessageSquare} badge={<PillarBadge pillar="aeo" />} accentColor="cyan">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-lg p-3 text-center border ${data.audit.aeoReadiness.hasFAQ ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">FAQ Page</p>
                      <p className="text-lg font-bold">{data.audit.aeoReadiness.hasFAQ ? '✓' : '✗'}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center border ${data.audit.aeoReadiness.hasSchema ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">Schema Markup</p>
                      <p className="text-lg font-bold">{data.audit.aeoReadiness.hasSchema ? '✓' : '✗'}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center border ${data.audit.aeoReadiness.hasStructuredData ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">Structured Data</p>
                      <p className="text-lg font-bold">{data.audit.aeoReadiness.hasStructuredData ? '✓' : '✗'}</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Answer Format Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${data.audit.aeoReadiness.answerFormatScore}%` }} />
                      </div>
                      <span className="text-sm font-mono text-cyan-400">{data.audit.aeoReadiness.answerFormatScore}</span>
                    </div>
                  </div>
                  {data.audit.aeoReadiness.issues?.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{issue}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* GEO Visibility */}
              <Collapsible title="GEO Visibility" icon={Brain} badge={<PillarBadge pillar="geo" />} accentColor="amber">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI Engines That May Cite You</p>
                    <div className="flex flex-wrap gap-2">
                      {data.audit.geoVisibility.citedByAI?.map((ai, i) => (
                        <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5">{ai}</Badge>
                      ))}
                      {(!data.audit.geoVisibility.citedByAI || data.audit.geoVisibility.citedByAI.length === 0) && (
                        <span className="text-sm text-muted-foreground">None detected</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <p className="text-xs text-muted-foreground">Entity Recognition</p>
                      <p className="text-xl font-bold text-amber-400">{data.audit.geoVisibility.entityRecognition}/100</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${data.audit.geoVisibility.knowledgeGraphPresence ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">Knowledge Graph</p>
                      <p className="text-xl font-bold">{data.audit.geoVisibility.knowledgeGraphPresence ? '✓ Present' : '✗ Missing'}</p>
                    </div>
                  </div>
                  {data.audit.geoVisibility.issues?.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{issue}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              BONUS: E-E-A-T ANALYSIS
              ══════════════════════════════════════════════════ */}
          {data.eeat && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">E-E-A-T Analysis</h2>
                  <p className="text-sm text-muted-foreground">Experience · Expertise · Authoritativeness · Trustworthiness</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{data.eeat.overallScore}/100</Badge>
              </div>
              <div className="space-y-3">
                {/* Who / How / Why Test */}
                <Collapsible title="Who / How / Why Test" icon={UserCheck} accentColor="amber">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                      <p className="text-[10px] text-emerald-400 font-bold mb-1">WHO created it?</p>
                      <p className="text-xs text-muted-foreground">{data.eeat.whoHowWhyTest?.who || 'N/A'}</p>
                    </div>
                    <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                      <p className="text-[10px] text-cyan-400 font-bold mb-1">HOW was it created?</p>
                      <p className="text-xs text-muted-foreground">{data.eeat.whoHowWhyTest?.how || 'N/A'}</p>
                    </div>
                    <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                      <p className="text-[10px] text-amber-400 font-bold mb-1">WHY does it exist?</p>
                      <p className="text-xs text-muted-foreground">{data.eeat.whoHowWhyTest?.why || 'N/A'}</p>
                    </div>
                  </div>
                </Collapsible>

                {/* E-E-A-T Scores */}
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Experience', score: data.eeat.experience.score, findings: data.eeat.experience.findings, color: 'emerald' },
                    { label: 'Expertise', score: data.eeat.expertise.score, findings: data.eeat.expertise.findings, color: 'cyan' },
                    { label: 'Authoritativeness', score: data.eeat.authoritativeness.score, findings: data.eeat.authoritativeness.findings, color: 'amber' },
                    { label: 'Trustworthiness', score: data.eeat.trustworthiness.score, findings: data.eeat.trustworthiness.findings, color: 'rose' },
                  ].map((dim) => (
                    <div key={dim.label} className={`bg-white/[0.02] rounded-xl p-4 border border-white/5`}>
                      <ScoreRing score={dim.score} label={dim.label} color={scoreColor(dim.score)} size={72} />
                      <div className="mt-3 space-y-1">
                        {dim.findings?.slice(0, 2).map((f, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground leading-snug">• {f}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: GEO CITABILITY SCORING
              ══════════════════════════════════════════════════ */}
          {data.geoCitability && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">GEO Citability Scoring</h2>
                  <p className="text-sm text-muted-foreground">How likely AI is to cite your content (5 weighted dimensions)</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">{data.geoCitability.overallScore}/100</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Citability Score', data: data.geoCitability.citabilityScore, color: 'emerald' },
                  { label: 'Structural Readability', data: data.geoCitability.structuralReadability, color: 'cyan' },
                  { label: 'Multi-Modal Content', data: data.geoCitability.multiModalContent, color: 'amber' },
                  { label: 'Authority & Brand Signals', data: data.geoCitability.authorityBrandSignals, color: 'purple' },
                  { label: 'Technical Accessibility', data: data.geoCitability.technicalAccessibility, color: 'rose' },
                ].map((dim) => (
                  <div key={dim.label} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{dim.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">{dim.data?.weight}% weight</Badge>
                        <span className="text-sm font-mono text-emerald-400">{dim.data?.score}/100</span>
                      </div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${dim.data?.score || 0}%` }} />
                    </div>
                    <div className="space-y-1">
                      {dim.data?.findings?.map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground leading-snug">• {f}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: AI CRAWLER & BOT ANALYSIS
              ══════════════════════════════════════════════════ */}
          {data.aiCrawler && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Crawler & Bot Analysis</h2>
                  <p className="text-sm text-muted-foreground">Ensure AI engines can read and cite your content</p>
                </div>
              </div>
              <div className="space-y-3">
                {/* AI Crawler Access Table */}
                <Collapsible title="AI Crawler Access" icon={Bot} defaultOpen accentColor="cyan">
                  <div className="space-y-2">
                    {data.aiCrawler.aiCrawlerAccess?.map((bot, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg p-3 border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${bot.allowed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="text-sm font-medium">{bot.bot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${bot.allowed ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                            {bot.allowed ? 'Allowed' : 'Blocked'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground max-w-[200px] truncate">{bot.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapsible>

                {/* robots.txt & Technical */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className={`rounded-xl p-4 border ${data.aiCrawler.llmsTxtPresence ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <p className="text-xs text-muted-foreground">llms.txt</p>
                    <p className="text-lg font-bold">{data.aiCrawler.llmsTxtPresence ? '✓ Present' : '✗ Missing'}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground">JS Dependency</p>
                    <p className="text-lg font-bold capitalize">{data.aiCrawler.jsRenderingDependency}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground">SSR vs CSR</p>
                    <p className="text-sm font-bold">{data.aiCrawler.ssrVsCsr || 'Unknown'}</p>
                  </div>
                </div>

                {data.aiCrawler.robotsTxtAnalysis?.length > 0 && (
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">robots.txt Analysis</p>
                    {data.aiCrawler.robotsTxtAnalysis.map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">• {f}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: BRAND MENTION SIGNALS
              ══════════════════════════════════════════════════ */}
          {data.brandMentions && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Brand Mention Signals</h2>
                  <p className="text-sm text-muted-foreground">Brand mentions correlate 3x more with AI visibility than backlinks</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400">{data.brandMentions.brandMentionScore}/100</Badge>
              </div>
              <div className="space-y-3">
                {/* Platform Presence */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.brandMentions.platformPresence?.map((p, i) => (
                    <div key={i} className={`rounded-xl p-4 border ${p.strength === 'strong' ? 'bg-emerald-500/5 border-emerald-500/20' : p.strength === 'moderate' ? 'bg-amber-500/5 border-amber-500/20' : p.strength === 'weak' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-sm font-medium mb-1">{p.platform}</p>
                      <Badge variant="outline" className={`text-[10px] ${p.detected ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                        {p.detected ? 'Detected' : 'Not Found'}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1 capitalize">Strength: {p.strength}</p>
                    </div>
                  ))}
                </div>

                {/* Citation Sources */}
                {data.brandMentions.citationSources?.length > 0 && (
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-3">AI Citation Source Breakdown</p>
                    <div className="space-y-2">
                      {data.brandMentions.citationSources.map((cs, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-24">{cs.engine}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${cs.percentage}%` }} />
                          </div>
                          <span className="text-xs font-mono text-amber-400 w-16 text-right">{cs.topSource} ({cs.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.brandMentions.backlinkCorrelation && (
                  <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                    <p className="text-xs text-emerald-400 font-bold mb-1">Backlink vs Brand Mention Insight</p>
                    <p className="text-sm text-muted-foreground">{data.brandMentions.backlinkCorrelation}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: CONTENT QUALITY & HUMANIZATION
              ══════════════════════════════════════════════════ */}
          {data.contentQuality && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Content Quality & Humanization</h2>
                  <p className="text-sm text-muted-foreground">AI pattern detection and humanization aligned with Google QRG</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">{data.contentQuality.overallScore}/100</Badge>
              </div>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 text-center">
                    <p className="text-xs text-muted-foreground">Content Depth</p>
                    <p className="text-2xl font-bold text-emerald-400">{data.contentQuality.contentDepth}/100</p>
                  </div>
                  <div className={`rounded-xl p-4 border text-center ${data.contentQuality.aiPatternRisk === 'low' ? 'bg-emerald-500/5 border-emerald-500/20' : data.contentQuality.aiPatternRisk === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <p className="text-xs text-muted-foreground">AI Pattern Risk</p>
                    <p className="text-2xl font-bold capitalize">{data.contentQuality.aiPatternRisk}</p>
                  </div>
                  <ScoreRing score={data.contentQuality.overallScore} label="Quality Score" color={scoreColor(data.contentQuality.overallScore)} size={80} />
                </div>

                {data.contentQuality.humanizationTips?.length > 0 && (
                  <Collapsible title="Humanization Tips" icon={Lightbulb} accentColor="green">
                    <div className="space-y-2">
                      {data.contentQuality.humanizationTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </Collapsible>
                )}

                {data.contentQuality.fillerDetected?.length > 0 && (
                  <Collapsible title="Filler Detected" icon={AlertTriangle} accentColor="amber">
                    <div className="space-y-1">
                      {data.contentQuality.fillerDetected.map((f, i) => (
                        <p key={i} className="text-sm text-amber-400/70">• {f}</p>
                      ))}
                    </div>
                  </Collapsible>
                )}

                {data.contentQuality.originalityIndicators?.length > 0 && (
                  <Collapsible title="Originality Indicators" icon={Sparkles} accentColor="emerald">
                    <div className="space-y-1">
                      {data.contentQuality.originalityIndicators.map((ind, i) => (
                        <p key={i} className="text-sm text-muted-foreground">✓ {ind}</p>
                      ))}
                    </div>
                  </Collapsible>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: PARASITE SEO RISK
              ══════════════════════════════════════════════════ */}
          {data.parasiteRisk && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Parasite SEO Risk</h2>
                  <p className="text-sm text-muted-foreground">Google Nov 2024 site reputation abuse policy check</p>
                </div>
                <RiskBadge level={data.parasiteRisk.riskLevel} />
              </div>
              <div className={`rounded-xl p-6 border ${data.parasiteRisk.riskLevel === 'low' ? 'bg-emerald-500/5 border-emerald-500/20' : data.parasiteRisk.riskLevel === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                {data.parasiteRisk.findings?.map((f, i) => (
                  <p key={i} className="text-sm text-muted-foreground mb-1">• {f}</p>
                ))}
                {data.parasiteRisk.recommendations?.map((r, i) => (
                  <p key={i} className="text-sm text-emerald-400 mt-2">→ {r}</p>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: LOCAL SEO
              ══════════════════════════════════════════════════ */}
          {data.localSEO && data.localSEO.applicable && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Local SEO Intelligence</h2>
                  <p className="text-sm text-muted-foreground">GBP · NAP · Reviews for {data.market || 'your market'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <ScoreRing score={data.localSEO.gbpSignals.score} label="Google Business Profile" color={scoreColor(data.localSEO.gbpSignals.score)} size={72} />
                    <div className="mt-2 space-y-1">
                      {data.localSEO.gbpSignals.findings?.map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">• {f}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <ScoreRing score={data.localSEO.napConsistency.score} label="NAP Consistency" color={scoreColor(data.localSEO.napConsistency.score)} size={72} />
                    <div className="mt-2 space-y-1">
                      {data.localSEO.napConsistency.findings?.map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">• {f}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <ScoreRing score={data.localSEO.reviewSignals.score} label="Review Signals" color={scoreColor(data.localSEO.reviewSignals.score)} size={72} />
                    <div className="mt-2 space-y-1">
                      {data.localSEO.reviewSignals.findings?.map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">• {f}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-400">Business Type: {data.localSEO.businessType}</Badge>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: ALGORITHM UPDATES TRACKER (ENHANCED)
              ══════════════════════════════════════════════════ */}
          {data.algorithmUpdates && data.algorithmUpdates.recentUpdates?.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Algorithm Updates Tracker</h2>
                  <p className="text-sm text-muted-foreground">Recent Google algorithm changes that may affect your site</p>
                </div>
              </div>
              <div className="space-y-3">
                {data.algorithmUpdates.recentUpdates.map((update, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                    <button
                      onClick={() => setExpandedUpdate(expandedUpdate === i ? null : i)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Severity Indicator */}
                        <div className={`w-1.5 h-8 rounded-full shrink-0 ${update.impact === 'high' ? 'bg-rose-500' : update.impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{update.name}</span>
                            <Badge variant="outline" className={`text-[10px] ${update.impact === 'high' ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : update.impact === 'medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>
                              {update.impact} impact
                            </Badge>
                            <PillarBadge pillar={update.affectedPillar} />
                          </div>
                          <span className="text-xs text-muted-foreground">{update.date}</span>
                        </div>
                      </div>
                      {expandedUpdate === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {expandedUpdate === i && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
                        <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                          <div className="flex items-center gap-2 mb-1">
                            <Info className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400">What This Means For You</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{getUpdateInsight(update)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: 12-MONTH ROADMAP (ENHANCED)
              ══════════════════════════════════════════════════ */}
          {data.roadmap && data.roadmap.quarters?.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Milestone className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">12-Month Roadmap</h2>
                  <p className="text-sm text-muted-foreground">Quarterly milestones with target scores and deliverables</p>
                </div>
              </div>
              {/* Timeline Visualization */}
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-cyan-500/50 to-amber-500/50 hidden sm:block" />
                <div className="space-y-6">
                  {data.roadmap.quarters.map((q, i) => {
                    const quarterColors = [
                      { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                      { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/20' },
                      { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/20' },
                      { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/20' },
                    ]
                    const qc = quarterColors[i % 4]
                    // Derive deliverables from weekly actions that fall in this quarter
                    const quarterWeeks = data.measure.weeklyActions?.slice(i * 4, (i + 1) * 4) || []
                    const deliverables = quarterWeeks.flatMap(w => w.tasks?.filter(t => t.priority === 'high').map(t => t.task) || []).slice(0, 3)

                    return (
                      <div key={i} className="relative sm:pl-14">
                        {/* Timeline Dot */}
                        <div className={`absolute left-3 top-3 w-5 h-5 rounded-full ${qc.bg} border-2 ${qc.border} hidden sm:flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${qc.text}`} style={{ backgroundColor: i === 0 ? '#10b981' : i === 1 ? '#06b6d4' : i === 2 ? '#f59e0b' : '#8b5cf6' }} />
                        </div>
                        <div className={`bg-white/[0.02] rounded-xl p-5 border border-white/5`}>
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${qc.bg}`}>
                              <span className={`text-xs font-bold ${qc.text}`}>Q{i + 1}</span>
                            </div>
                            <span className="text-sm font-semibold">{q.label}</span>
                          </div>
                          {/* Goal Cards */}
                          <div className="grid sm:grid-cols-3 gap-3 mb-4">
                            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                              <p className="text-[10px] text-emerald-400 font-bold mb-1">SEO Goal</p>
                              <p className="text-xs text-muted-foreground">{q.seoGoal}</p>
                            </div>
                            <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                              <p className="text-[10px] text-cyan-400 font-bold mb-1">AEO Goal</p>
                              <p className="text-xs text-muted-foreground">{q.aeoGoal}</p>
                            </div>
                            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                              <p className="text-[10px] text-amber-400 font-bold mb-1">GEO Goal</p>
                              <p className="text-xs text-muted-foreground">{q.geoGoal}</p>
                            </div>
                          </div>
                          {/* Target Score Progress Bars */}
                          <div className="space-y-2 mb-4">
                            {[
                              { label: 'SEO Target', score: q.targetScores.seo, current: i === 0 ? data.overallScores.seo : data.overallScores.seo + Math.round((q.targetScores.seo - data.overallScores.seo) * (i / (data.roadmap.quarters.length || 1))), color: 'bg-emerald-500' },
                              { label: 'AEO Target', score: q.targetScores.aeo, current: i === 0 ? data.overallScores.aeo : data.overallScores.aeo + Math.round((q.targetScores.aeo - data.overallScores.aeo) * (i / (data.roadmap.quarters.length || 1))), color: 'bg-cyan-500' },
                              { label: 'GEO Target', score: q.targetScores.geo, current: i === 0 ? data.overallScores.geo : data.overallScores.geo + Math.round((q.targetScores.geo - data.overallScores.geo) * (i / (data.roadmap.quarters.length || 1))), color: 'bg-amber-500' },
                            ].map((target, j) => (
                              <div key={j} className="flex items-center gap-3">
                                <span className="text-[10px] text-muted-foreground w-20 shrink-0">{target.label}</span>
                                <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden relative">
                                  <div className={`h-full ${target.color} rounded-full transition-all`} style={{ width: `${target.score}%` }} />
                                </div>
                                <span className="text-xs font-mono w-8 text-right shrink-0" style={{ color: target.score >= 70 ? '#10b981' : target.score >= 40 ? '#f59e0b' : '#ef4444' }}>{target.score}</span>
                              </div>
                            ))}
                          </div>
                          {/* Deliverables */}
                          {deliverables.length > 0 && (
                            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                              <p className="text-[10px] text-muted-foreground font-bold mb-1.5">KEY DELIVERABLES</p>
                              <div className="space-y-1">
                                {deliverables.map((d, j) => (
                                  <p key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{d}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: TRAFFIC INSIGHTS
              ══════════════════════════════════════════════════ */}
          {data.trafficInsights && (data.trafficInsights.winners?.length > 0 || data.trafficInsights.losers?.length > 0) && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Traffic Insights</h2>
                  <p className="text-sm text-muted-foreground">Winners & losers analysis across your pages</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Winners */}
                {data.trafficInsights.winners?.length > 0 && (
                  <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Winners</span>
                    </div>
                    <div className="space-y-2">
                      {data.trafficInsights.winners.map((w, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg p-3 border border-white/5">
                          <div className="flex items-center gap-2">
                            <PillarBadge pillar={w.pillar} />
                            <span className="text-sm text-muted-foreground truncate max-w-[140px]">{w.page}</span>
                          </div>
                          <span className="text-sm font-mono text-emerald-400">{w.change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Losers */}
                {data.trafficInsights.losers?.length > 0 && (
                  <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-semibold text-rose-400">Losers</span>
                    </div>
                    <div className="space-y-2">
                      {data.trafficInsights.losers.map((l, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg p-3 border border-white/5">
                          <div className="flex items-center gap-2">
                            <PillarBadge pillar={l.pillar} />
                            <span className="text-sm text-muted-foreground truncate max-w-[140px]">{l.page}</span>
                          </div>
                          <span className="text-sm font-mono text-rose-400">{l.change}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: SXO
              ══════════════════════════════════════════════════ */}
          {data.sxo && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Search Experience Optimization</h2>
                  <p className="text-sm text-muted-foreground">SERP backward analysis & page-type matching</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Page Type Match</p>
                    <p className="text-sm font-medium">{data.sxo.pageTypeMatch}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">SERP Intent</p>
                    <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-400 capitalize">{data.sxo.serpIntentMatch}</Badge>
                  </div>
                </div>

                {data.sxo.userPersonaScores?.length > 0 && (
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-3">Persona Scores</p>
                    <div className="space-y-2">
                      {data.sxo.userPersonaScores.map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm w-32">{p.persona}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-indigo-400">{p.score}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.sxo.recommendations?.length > 0 && (
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">SXO Recommendations</p>
                    {data.sxo.recommendations.map((r, i) => (
                      <p key={i} className="text-sm text-muted-foreground mb-1">• {r}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              BONUS: COMPETITOR INTELLIGENCE (NEW)
              ══════════════════════════════════════════════════ */}
          {data.measure?.competitorBenchmarks && data.measure.competitorBenchmarks.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Competitor Intelligence</h2>
                  <p className="text-sm text-muted-foreground">How you compare and where you can win</p>
                </div>
              </div>
              <div className="space-y-4">
                {/* Visual Score Comparison */}
                {data.measure.competitorBenchmarks.map((comp, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{comp.competitor}</p>
                        <p className="text-xs text-muted-foreground truncate">{comp.url}</p>
                      </div>
                    </div>
                    {/* Score Bars: You vs Them */}
                    <div className="space-y-3">
                      {[
                        { label: 'SEO', you: data.overallScores.seo, them: comp.seoScore, colorYou: 'bg-emerald-500', colorThem: 'bg-emerald-500/30' },
                        { label: 'AEO', you: data.overallScores.aeo, them: comp.aeoScore, colorYou: 'bg-cyan-500', colorThem: 'bg-cyan-500/30' },
                        { label: 'GEO', you: data.overallScores.geo, them: comp.geoScore, colorYou: 'bg-amber-500', colorThem: 'bg-amber-500/30' },
                      ].map((metric, j) => {
                        const gap = metric.you - metric.them
                        return (
                          <div key={j}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground font-medium">{metric.label}</span>
                              <span className={`text-[10px] font-bold ${gap > 0 ? 'text-emerald-400' : gap < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                                {gap > 0 ? `+${gap}` : gap < 0 ? `${gap}` : '0'} vs competitor
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10 shrink-0">You</span>
                                <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                                  <div className={`h-full ${metric.colorYou} rounded-full`} style={{ width: `${metric.you}%` }} />
                                </div>
                                <span className="text-xs font-mono w-8 text-right shrink-0">{metric.you}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10 shrink-0">Them</span>
                                <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                                  <div className={`h-full ${metric.colorThem} rounded-full`} style={{ width: `${metric.them}%` }} />
                                </div>
                                <span className="text-xs font-mono w-8 text-right shrink-0 text-muted-foreground">{metric.them}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* AI Citation Info */}
                    {comp.citedBy?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-amber-400 font-bold mb-1.5">Cited By AI Engines</p>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.citedBy.map((ai, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{ai}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Citation Gap */}
                {(() => {
                  const yourCitedBy = data.audit?.geoVisibility?.citedByAI || []
                  const competitorCitedBy = data.measure.competitorBenchmarks
                    .flatMap(c => c.citedBy || [])
                    .filter((v, i, a) => a.indexOf(v) === i)
                  const gapEngines = competitorCitedBy.filter(e => !yourCitedBy.includes(e))

                  if (gapEngines.length > 0) {
                    return (
                      <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-bold text-amber-400">AI Citation Gap</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Competitors are cited by AI engines that don&apos;t cite you:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {gapEngines.map((engine, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-rose-500/30 text-rose-400 bg-rose-500/5">{engine}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-emerald-400">→ Focus your GEO strategy on improving citability for these engines. Create authoritative, well-structured content with clear data points and unique insights.</p>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Competitor Recommendations */}
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">How to Close the Gap</p>
                  <div className="space-y-1.5">
                    {data.overallScores.seo < (data.measure.competitorBenchmarks[0]?.seoScore || 0) && (
                      <p className="text-xs text-emerald-400 flex items-start gap-1.5">
                        <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>Focus on technical SEO fixes and content depth to match competitor SEO scores</span>
                      </p>
                    )}
                    {data.overallScores.aeo < (data.measure.competitorBenchmarks[0]?.aeoScore || 0) && (
                      <p className="text-xs text-cyan-400 flex items-start gap-1.5">
                        <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>Add structured data and FAQ content to improve answer engine visibility</span>
                      </p>
                    )}
                    {data.overallScores.geo < (data.measure.competitorBenchmarks[0]?.geoScore || 0) && (
                      <p className="text-xs text-amber-400 flex items-start gap-1.5">
                        <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>Enhance knowledge graph presence and brand authority signals for AI citation</span>
                      </p>
                    )}
                    {data.overallScores.seo >= (data.measure.competitorBenchmarks[0]?.seoScore || 0) &&
                     data.overallScores.aeo >= (data.measure.competitorBenchmarks[0]?.aeoScore || 0) &&
                     data.overallScores.geo >= (data.measure.competitorBenchmarks[0]?.geoScore || 0) && (
                      <p className="text-xs text-emerald-400 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>You&apos;re outperforming competitors across all pillars — maintain your advantage!</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              PHASE 2: STRUCTURE
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 2: Structure</h2>
                <p className="text-sm text-muted-foreground">Topic Clusters · Keyword Gaps · Schema · Architecture</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Topic Clusters */}
              <Collapsible title="Topic Clusters" icon={Target} defaultOpen accentColor="cyan">
                <div className="space-y-4">
                  {data.structure.topicClusters?.map((cluster, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-emerald-400">{cluster.cluster}</span>
                        <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">Pillar: {cluster.pillarKeyword}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {cluster.supportingKeywords?.map((kw, j) => (
                          <Badge key={j} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{kw}</Badge>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <p className="text-[10px] text-emerald-400 font-bold mb-1">SEO</p>
                          <p className="text-xs text-muted-foreground">{cluster.seoOpportunity}</p>
                        </div>
                        <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                          <p className="text-[10px] text-cyan-400 font-bold mb-1">AEO</p>
                          <p className="text-xs text-muted-foreground">{cluster.aeoOpportunity}</p>
                        </div>
                        <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                          <p className="text-[10px] text-amber-400 font-bold mb-1">GEO</p>
                          <p className="text-xs text-muted-foreground">{cluster.geoOpportunity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Keyword Gaps */}
              <Collapsible title="Keyword Gaps" icon={Search} accentColor="cyan">
                <div className="space-y-2">
                  {data.structure.keywordGaps?.map((kw, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <PillarBadge pillar={kw.type} />
                        <span className="text-sm font-medium">{kw.keyword}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">{kw.volume} vol</Badge>
                        <Badge variant="outline" className={`text-[10px] ${kw.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-400' : kw.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-400' : 'border-rose-500/30 text-rose-400'}`}>{kw.difficulty}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Schema Recommendations */}
              <Collapsible title="Schema Recommendations" icon={Database} accentColor="cyan">
                <div className="space-y-2">
                  {data.structure.schemaRecommendations?.map((schema, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <PillarBadge pillar={schema.pillar} />
                        <span className="text-sm font-bold">{schema.schemaType}</span>
                        <SchemaStatusBadge status={schema.status || 'active'} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{schema.purpose}</p>
                      <p className="text-xs text-emerald-400">→ {schema.implementation}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 3: CREATIVE
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 3: Creative</h2>
                <p className="text-sm text-muted-foreground">Content Briefs · On-Page Optimization · Answer Blocks</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Content Briefs */}
              <Collapsible title="Content Briefs" icon={FileText} defaultOpen accentColor="amber">
                <div className="space-y-3">
                  {data.creative.contentBriefs?.map((brief, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-amber-400">{i + 1}</span>
                        </div>
                        <span className="text-sm font-semibold">{brief.title}</span>
                        <PillarBadge pillar={brief.pillar} />
                        <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{brief.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{brief.brief}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span>🎯 {brief.targetKeyword}</span>
                        <span>📊 {brief.estimatedImpact}</span>
                        <span>📝 {brief.wordCount}</span>
                      </div>
                      {brief.structure?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {brief.structure.map((heading, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{heading}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Answer Blocks */}
              <Collapsible title="Answer Blocks for AI Citation" icon={MessageSquare} badge={<PillarBadge pillar="geo" />} accentColor="amber">
                <div className="space-y-3">
                  {data.creative.answerBlocks?.map((block, i) => (
                    <div key={i} className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{block.format}</Badge>
                        <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">→ {block.targetEngine}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">Q: {block.question}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">A: {block.suggestedAnswer}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* On-Page Optimizations */}
              <Collapsible title="On-Page Optimizations" icon={Wrench} accentColor="amber">
                <div className="space-y-3">
                  {data.creative.onPageOptimizations?.map((opt, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <p className="text-sm font-semibold mb-2">{opt.page}</p>
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-muted-foreground">Current: <span className="text-rose-400">{opt.currentTitle}</span></p>
                        <p className="text-xs text-muted-foreground">Suggested: <span className="text-emerald-400">{opt.suggestedTitle}</span></p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{opt.suggestedDescription}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-cyan-400 font-bold mb-1">AEO Tweaks</p>
                          {opt.aeoTweaks?.map((tweak, j) => (
                            <p key={j} className="text-xs text-muted-foreground">• {tweak}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-400 font-bold mb-1">GEO Tweaks</p>
                          {opt.geoTweaks?.map((tweak, j) => (
                            <p key={j} className="text-xs text-muted-foreground">• {tweak}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 4: MEASURE
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 4: Measure</h2>
                <p className="text-sm text-muted-foreground">KPIs · Competitor Benchmarks · Weekly Actions</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* KPI Tracking */}
              <Collapsible title="KPI Tracking" icon={Target} defaultOpen accentColor="rose">
                <div className="grid sm:grid-cols-3 gap-4">
                  {(['seo', 'aeo', 'geo'] as const).map((pillar) => (
                    <div key={pillar}>
                      <div className="flex items-center gap-2 mb-3">
                        <PillarBadge pillar={pillar} />
                        <span className="text-sm font-semibold capitalize">{pillar} KPIs</span>
                      </div>
                      <div className="space-y-2">
                        {data.measure.kpiTracking?.[pillar]?.map((kpi, i) => (
                          <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            <p className="text-xs font-medium mb-1">{kpi.metric}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>Now: <span className="text-rose-400">{kpi.current}</span></span>
                              <ArrowRight className="w-3 h-3" />
                              <span>Target: <span className="text-emerald-400">{kpi.target}</span></span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.timeline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Competitor Benchmarks (original, kept for Phase 4 context) */}
              <Collapsible title="Competitor Benchmarks" icon={Users} accentColor="rose">
                <div className="space-y-3">
                  {data.measure.competitorBenchmarks?.map((comp, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{comp.competitor}</p>
                          <p className="text-xs text-muted-foreground">{comp.url}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
                          <p className="text-xs text-muted-foreground">SEO</p>
                          <p className="text-lg font-bold text-emerald-400">{comp.seoScore}</p>
                        </div>
                        <div className="text-center bg-cyan-500/5 rounded-lg p-2 border border-cyan-500/10">
                          <p className="text-xs text-muted-foreground">AEO</p>
                          <p className="text-lg font-bold text-cyan-400">{comp.aeoScore}</p>
                        </div>
                        <div className="text-center bg-amber-500/5 rounded-lg p-2 border border-amber-500/10">
                          <p className="text-xs text-muted-foreground">GEO</p>
                          <p className="text-lg font-bold text-amber-400">{comp.geoScore}</p>
                        </div>
                      </div>
                      {comp.citedBy?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {comp.citedBy.map((ai, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{ai}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Weekly Actions */}
              <Collapsible title="4-Week Action Plan" icon={Calendar} defaultOpen accentColor="rose">
                <div className="space-y-4">
                  {data.measure.weeklyActions?.map((week, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-emerald-500/20' : i === 1 ? 'bg-cyan-500/20' : i === 2 ? 'bg-amber-500/20' : 'bg-rose-500/20'}`}>
                          <span className={`text-xs font-bold ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-cyan-400' : i === 2 ? 'text-amber-400' : 'text-rose-400'}`}>{i + 1}</span>
                        </div>
                        <span className="text-sm font-bold">{week.week}</span>
                      </div>
                      <div className="ml-9 space-y-1.5">
                        {week.tasks?.map((task, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${task.priority === 'high' ? 'text-emerald-400' : task.priority === 'medium' ? 'text-amber-400' : 'text-muted-foreground/50'}`} />
                            <PillarBadge pillar={task.pillar} />
                            <span className="text-xs text-muted-foreground">{task.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ── Bottom CTA ────────────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Execute This Strategy?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Get the Agent OS installed free — Hermes, OpenClaw, or Claude — and start building the backlinks that make AI cite you across SEO, AEO, and GEO.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={onStartFree}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
                  >
                    Get Free Agent OS Setup
                  </button>
                  <button
                    onClick={reset}
                    className="border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300"
                  >
                    Analyze Another Site
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
