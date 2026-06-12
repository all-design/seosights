'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, SEOAnalysis, Approval } from '@/lib/store'
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
  Copy,
  Code2,
  Grid3X3,
  Check,
  User,
  ShieldCheck,
  PenTool,
  Webhook,
} from 'lucide-react'
import PendingApprovalsPanel from '@/components/dashboard/PendingApprovalsPanel'
import GSCPanel from '@/components/dashboard/GSCPanel'
import AlertsPanel from '@/components/dashboard/AlertsPanel'

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

// ── Safe Array Helper ─────────────────────────────────────────
function safeArr(val: unknown): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') return [val]
  return []
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
export default function AnalysisDashboard({ onStartFree, onOpenWebhooks, onOpenAffiliate }: { onStartFree?: () => void; onOpenWebhooks?: () => void; onOpenAffiliate?: () => void }) {
  const { analysis, reset, mode, setMode, pendingApprovals, currentAnalysisId, setPendingApprovals, setCurrentAnalysisId } = useAppStore()
  const data = analysis as SEOAnalysis | null
  const [exporting, setExporting] = useState(false)
  const [playbookTab, setPlaybookTab] = useState<'seo' | 'aeo' | 'geo' | 'gsc'>('seo')
  const [expandedUpdate, setExpandedUpdate] = useState<number | null>(null)
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null)
  const [copiedWin, setCopiedWin] = useState<number | null>(null)
  const [showAutoExecute, setShowAutoExecute] = useState(false)
  const [showWeeklyReview, setShowWeeklyReview] = useState(false)
  const [executionPhase, setExecutionPhase] = useState(0)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [generatingLlmsTxt, setGeneratingLlmsTxt] = useState(false)
  const [llmsTxtContent, setLlmsTxtContent] = useState<string | null>(null)
  const [llmsFullTxtContent, setLlmsFullTxtContent] = useState<string | null>(null)
  const [showApprovalsPanel, setShowApprovalsPanel] = useState(false)
  const [showAlertsPanel, setShowAlertsPanel] = useState(false)
  const [alertUnreadCount, setAlertUnreadCount] = useState(0)

  // Extract analysisId from the _meta field if present
  useEffect(() => {
    if (data && typeof data === 'object' && '_meta' in data) {
      const meta = (data as Record<string, unknown>)._meta as { analysisId?: string; mode?: string }
      if (meta?.analysisId) {
        setCurrentAnalysisId(meta.analysisId)
      }
      if (meta?.mode === 'co-pilot') {
        setMode('co-pilot')
      }
    }
  }, [data, setCurrentAnalysisId, setMode])

  // Fetch pending approvals when in co-pilot mode
  useEffect(() => {
    if (mode === 'co-pilot' && currentAnalysisId) {
      const fetchApprovals = async () => {
        try {
          const response = await fetch(`/api/approvals?analysisId=${currentAnalysisId}&status=pending`)
          if (response.ok) {
            const result = await response.json()
            if (result.approvals && Array.isArray(result.approvals)) {
              setPendingApprovals(result.approvals.map((a: Record<string, unknown>) => ({
                id: a.id as string,
                analysisId: a.analysisId as string,
                agentId: a.agentId as string,
                agentName: a.agentName as string,
                actionType: a.actionType as Approval['actionType'],
                actionDescription: a.actionDescription as string,
                actionData: a.actionData as string,
                status: a.status as Approval['status'],
                createdAt: a.createdAt as string,
              })))
            }
          }
        } catch { /* ignore */ }
      }
      fetchApprovals()
      // Poll every 5 seconds for new approvals
      const interval = setInterval(fetchApprovals, 5000)
      return () => clearInterval(interval)
    }
  }, [mode, currentAnalysisId, setPendingApprovals])

  const pendingCount = pendingApprovals.filter(a => a.status === 'pending').length

  // Derive the domain from the URL
  const alertDomain = data?.url ? (() => { try { return new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`).hostname } catch { return data.url.replace(/^[\/]+/, '').split('/')[0] } })() : ''

  // Fetch unread alert count for the current domain
  useEffect(() => {
    if (!alertDomain) return
    const fetchAlertCount = async () => {
      try {
        const response = await fetch(`/api/alerts?domain=${encodeURIComponent(alertDomain)}&isRead=false`)
        if (response.ok) {
          const result = await response.json()
          setAlertUnreadCount(result.unreadCount || 0)
        }
      } catch { /* ignore */ }
    }
    fetchAlertCount()
    const interval = setInterval(fetchAlertCount, 30000)
    return () => clearInterval(interval)
  }, [alertDomain])

  // Auto-execute animation effect
  useEffect(() => {
    if (!isExecuting) return
    const interval = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev >= 100) {
          if (executionPhase >= 3) {
            setIsExecuting(false)
            return 100
          }
          setExecutionPhase(p => p + 1)
          return 0
        }
        return prev + 2
      })
    }, 60)
    return () => clearInterval(interval)
  }, [isExecuting, executionPhase])

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
      // Try the white-label Puppeteer PDF first (if we have an analysisId saved in DB)
      if (currentAnalysisId) {
        try {
          const wlResponse = await fetch(`/api/analysis/${currentAnalysisId}/download-pdf?userId=default`)
          if (wlResponse.ok) {
            const blob = await wlResponse.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${(data.siteName || 'site').replace(/[^a-zA-Z0-9]/g, '-')}-SEO-AEO-GEO-Report.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            return
          }
        } catch {
          // Fall through to jsPDF export
        }
      }

      // Fallback: jsPDF-based export (works client-side, no DB needed)
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
              seosights
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
            {/* Mode Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
              <button
                onClick={() => setMode('auto-pilot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  mode === 'auto-pilot'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Auto-Pilot</span>
              </button>
              <button
                onClick={() => setMode('co-pilot')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 relative ${
                  mode === 'co-pilot'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Co-Pilot</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Visibility Alerts Bell */}
            <button
              onClick={() => setShowAlertsPanel(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {alertUnreadCount > 0 && (
                <>
                  <span className="text-xs font-semibold text-cyan-400">{alertUnreadCount}</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                </>
              )}
            </button>

            {/* Pending Approvals Bell */}
            {mode === 'co-pilot' && pendingCount > 0 && (
              <button
                onClick={() => setShowApprovalsPanel(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">{pendingCount}</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </button>
            )}

            {/* Agent Execution Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-400">8 Agents Active</span>
            </div>
            {/* Webhook Settings Button */}
            {onOpenWebhooks && (
              <button
                onClick={onOpenWebhooks}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                title="Webhook Integrations (Ctrl+Shift+W)"
              >
                <Webhook className="w-4 h-4" />
                <span className="hidden sm:inline">Webhooks</span>
              </button>
            )}
            {/* Affiliate Portal Button */}
            {onOpenAffiliate && (
              <button
                onClick={onOpenAffiliate}
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20"
                title="Affiliate Portal — Earn up to 50% commission (Ctrl+Shift+F)"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Affiliate</span>
              </button>
            )}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate premium branded PDF report with agency logo and colors"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Generating...' : 'Premium PDF'}
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
                      <div
                        key={i}
                        className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 cursor-pointer hover:border-emerald-400/40 transition-all group"
                        onClick={() => {
                          navigator.clipboard.writeText(win.description)
                          setCopiedWin(i)
                          setTimeout(() => setCopiedWin(null), 2000)
                        }}
                        title="Click to copy fix description"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">{win.time}</Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{win.title}</p>
                              {copiedWin === i ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-emerald-400/0 group-hover:text-emerald-400/60 shrink-0 transition-colors" />
                              )}
                            </div>
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

          {/* ── AI Agent Team Panel ──────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-cyan-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your AI SEO Team — <span className="text-emerald-400">8 Agents Active</span></h2>
                    <p className="text-sm text-muted-foreground">Specialized agents working 24/7 on your SEO, AEO &amp; GEO strategy</p>
                  </div>
                </div>

                {/* Agent Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { emoji: '🎯', name: 'Master Director', color: 'emerald' },
                    { emoji: '🔑', name: 'Keyword Researcher', color: 'cyan' },
                    { emoji: '⚔️', name: 'Competitor Analyst', color: 'amber' },
                    { emoji: '📄', name: 'Content Architect', color: 'purple' },
                    { emoji: '🔍', name: 'On-Page Auditor', color: 'emerald' },
                    { emoji: '🔗', name: 'Link Strategist', color: 'cyan' },
                    { emoji: '🏗️', name: 'Tech & Schema', color: 'amber' },
                    { emoji: '📣', name: 'Backlink Prospector', color: 'purple' },
                  ].map((agent, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                        agent.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                        agent.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' :
                        agent.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                        'bg-purple-500/10 border-purple-500/30 text-purple-300'
                      }`}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span>{agent.emoji}</span>
                      <span>{agent.name}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { setShowAutoExecute(!showAutoExecute); setShowWeeklyReview(false) }}
                    className="flex items-center justify-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  >
                    <Zap className="w-4 h-4" />
                    Auto-Execute Strategy
                  </button>
                  <button
                    onClick={() => { setShowWeeklyReview(!showWeeklyReview); setShowAutoExecute(false) }}
                    className="flex items-center justify-center gap-2 text-sm text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Weekly Review
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Auto-Execute Strategy ──────────────────────────── */}
          {showAutoExecute && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Collapsible
                title="Auto-Execute Strategy"
                icon={Swords}
                defaultOpen
                badge={<Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">90-Day Plan</Badge>}
                accentColor="emerald"
              >
                <div className="space-y-6">
                  {/* Phase Timeline */}
                  {[
                    {
                      phase: 1,
                      title: 'Setup',
                      period: 'Week 1',
                      color: 'emerald',
                      tasks: [
                        { agent: '🎯 Master Director', task: 'Define 90-day plan with KPIs and milestones' },
                        { agent: '🔑 Keyword Researcher', task: 'Build target keyword list from gap analysis' },
                        { agent: '⚔️ Competitor Analyst', task: 'Map competitive battlefield and opportunities' },
                        { agent: '📄 Content Architect', task: 'Brief first content batch based on keyword gaps' },
                      ],
                      progress: isExecuting && executionPhase >= 1 ? Math.min(executionProgress, 100) : 0,
                    },
                    {
                      phase: 2,
                      title: 'Build',
                      period: 'Weeks 2-8',
                      color: 'cyan',
                      tasks: [
                        { agent: '🔍 On-Page Auditor', task: 'Review all pages against SEO/AEO/GEO benchmarks' },
                        { agent: '🔗 Link Strategist', task: 'Update internal linking plan & anchor strategy' },
                        { agent: '🏗️ Tech & Schema', task: 'Run monthly schema audit & implementation' },
                        { agent: '📣 Backlink Prospector', task: 'Run weekly outreach to high-priority targets' },
                      ],
                      progress: isExecuting && executionPhase >= 2 ? Math.min(executionProgress, 100) : 0,
                    },
                    {
                      phase: 3,
                      title: 'Review Loop',
                      period: 'Every Monday',
                      color: 'amber',
                      tasks: [
                        { agent: '🎯 Master Director', task: 'Score progress against 90-day KPIs' },
                        { agent: '🎯 Master Director', task: 'Flag issues requiring human decision' },
                        { agent: '🎯 Master Director', task: 'Decide next actions & reprioritize backlog' },
                      ],
                      progress: isExecuting && executionPhase >= 3 ? Math.min(executionProgress, 100) : 0,
                    },
                  ].map((phase) => (
                    <div key={phase.phase} className="relative">
                      {/* Phase Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                          phase.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                          phase.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {phase.phase}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{phase.title}</span>
                            <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">{phase.period}</Badge>
                          </div>
                          {/* Progress Bar */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  phase.color === 'emerald' ? 'bg-emerald-500' :
                                  phase.color === 'cyan' ? 'bg-cyan-500' :
                                  'bg-amber-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${isExecuting && executionPhase >= phase.phase ? executionProgress : 0}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">
                              {isExecuting && executionPhase >= phase.phase ? `${Math.round(executionProgress)}%` : '0%'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Phase Tasks */}
                      <div className="ml-11 space-y-2">
                        {phase.tasks.map((t, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-start gap-2 bg-white/[0.02] rounded-lg p-2.5 border border-white/5"
                          >
                            <span className="text-xs shrink-0">{t.agent}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground">{t.task}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Current Week Tasks from Analysis Data */}
                  {data.measure?.weeklyActions && data.measure.weeklyActions.length > 0 && (
                    <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">This Week&apos;s Tasks (from analysis)</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(16,185,129,0.3) transparent' }}>
                        {data.measure.weeklyActions.slice(0, 2).flatMap((week) =>
                          week.tasks?.map((task, i) => (
                            <div key={`${week.week}-${i}`} className="flex items-start gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                task.priority === 'high' ? 'bg-rose-400' :
                                task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                              }`} />
                              <span className="text-xs text-muted-foreground">{task.task}</span>
                              <PillarBadge pillar={task.pillar} />
                            </div>
                          )) || []
                        )}
                      </div>
                    </div>
                  )}

                  {/* Start Execution Button */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        if (isExecuting) return
                        setIsExecuting(true)
                        setExecutionPhase(1)
                        setExecutionProgress(0)
                      }}
                      disabled={isExecuting}
                      className={`flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 ${
                        isExecuting
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Executing Phase {executionPhase}...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          Start Execution
                        </>
                      )}
                    </button>
                    {isExecuting && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-emerald-400/70"
                      >
                        Simulating 90-day auto-execution plan...
                      </motion.span>
                    )}
                  </div>
                </div>
              </Collapsible>
            </motion.div>
          )}

          {/* ── Weekly Review ──────────────────────────────────── */}
          {showWeeklyReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Collapsible
                title="Weekly Review"
                icon={CalendarDays}
                defaultOpen
                badge={<Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] font-bold">Progress Scorecard</Badge>}
                accentColor="cyan"
              >
                <div className="space-y-5">
                  {/* Progress Scorecard */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/15 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold mb-1">SEO TARGET</p>
                      <p className="text-xl font-bold text-emerald-400">{Math.min(data.overallScores.seo + 15, 100)}</p>
                      <p className="text-[10px] text-muted-foreground">by Day 90</p>
                    </div>
                    <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/15 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold mb-1">AEO TARGET</p>
                      <p className="text-xl font-bold text-cyan-400">{Math.min(data.overallScores.aeo + 20, 100)}</p>
                      <p className="text-[10px] text-muted-foreground">by Day 90</p>
                    </div>
                    <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/15 text-center">
                      <p className="text-[10px] text-muted-foreground font-bold mb-1">GEO TARGET</p>
                      <p className="text-xl font-bold text-amber-400">{Math.min(data.overallScores.geo + 25, 100)}</p>
                      <p className="text-[10px] text-muted-foreground">by Day 90</p>
                    </div>
                  </div>

                  {/* Top Wins This Week */}
                  {quickWins.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold">Top Wins This Week</span>
                      </div>
                      <div className="space-y-1.5">
                        {quickWins.map((win, i) => (
                          <div key={i} className="flex items-start gap-2 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-xs font-medium">{win.title}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">({win.time})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority Actions Next Week */}
                  {data.measure?.weeklyActions && data.measure.weeklyActions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold">Priority Actions Next Week</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6,182,212,0.3) transparent' }}>
                        {data.measure.weeklyActions.slice(0, 2).flatMap((week) =>
                          week.tasks?.filter(t => t.priority === 'high').map((task, i) => (
                            <div key={`next-${i}`} className="flex items-start gap-2 bg-cyan-500/5 rounded-lg p-2 border border-cyan-500/10">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                              <span className="text-xs text-muted-foreground">{task.task}</span>
                              <PillarBadge pillar={task.pillar} />
                            </div>
                          )) || []
                        )}
                        {data.measure.weeklyActions.slice(0, 2).flatMap((week) =>
                          week.tasks?.filter(t => t.priority !== 'high').map((task, i) => (
                            <div key={`next-med-${i}`} className="flex items-start gap-2 bg-white/[0.02] rounded-lg p-2 border border-white/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                              <span className="text-xs text-muted-foreground">{task.task}</span>
                              <PillarBadge pillar={task.pillar} />
                            </div>
                          )) || []
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Flags */}
                  {(() => {
                    const criticalIssues = data.audit?.technicalSEO?.issues?.filter(i => i.severity === 'critical') || []
                    const riskFlags = [
                      ...criticalIssues.slice(0, 2).map(i => ({ text: i.issue, level: 'high' as const })),
                      ...(data.parasiteRisk?.riskLevel === 'high' ? [{ text: 'High parasite SEO risk detected', level: 'high' as const }] : []),
                      ...(data.contentQuality?.aiPatternRisk === 'high' ? [{ text: 'Content flagged as AI-generated pattern', level: 'high' as const }] : []),
                    ]
                    if (riskFlags.length === 0) return null
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span className="text-sm font-semibold">Risk Flags</span>
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold">{riskFlags.length}</Badge>
                        </div>
                        <div className="space-y-1.5">
                          {riskFlags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2 bg-rose-500/5 rounded-lg p-2 border border-rose-500/10">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                              <span className="text-xs text-muted-foreground">{flag.text}</span>
                              <RiskBadge level={flag.level} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Decision Questions */}
                  <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/15">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-300">Master Director Decision Questions</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        'Are the quick wins implemented? If not, what\'s blocking?',
                        'Which content briefs should be prioritized for next week?',
                        'Are there any algorithm updates requiring strategy pivot?',
                        'Is the backlink outreach on track with response rates?',
                      ].map((question, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs text-amber-400 font-bold shrink-0">Q{i + 1}:</span>
                          <span className="text-xs text-muted-foreground">{question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Collapsible>
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
                    { key: 'gsc' as const, label: 'GSC', icon: Globe, color: 'cyan', count: 0 },
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
                      {tab.key !== 'gsc' && (
                        <Badge variant="outline" className={`text-[10px] ${playbookTab === tab.key ? (tab.color === 'emerald' ? 'border-emerald-500/30 text-emerald-400' : tab.color === 'cyan' ? 'border-cyan-500/30 text-cyan-400' : 'border-amber-500/30 text-amber-400') : 'border-white/20 text-muted-foreground'}`}>
                          {tab.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
                {/* Tab Content */}
                <div className="p-5">
                  {playbookTab === 'gsc' ? (
                    <GSCPanel domain={data.url ? new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`).hostname : undefined} />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PILLAR CORRELATION MATRIX
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pillar Correlation Matrix</h2>
                <p className="text-sm text-muted-foreground">How SEO, AEO, and GEO scores influence each other</p>
              </div>
            </div>
            {(() => {
              const s = seoScore / 100
              const a = aeoScore / 100
              const g = geoScore / 100
              const correlations = [
                { row: 'SEO', col: 'SEO', val: 1, derived: 1 },
                { row: 'SEO', col: 'AEO', val: Math.round((s * 0.4 + a * 0.6) * 100) / 100, derived: s * a > 0.5 ? 'strong' : s * a > 0.25 ? 'moderate' : 'weak' },
                { row: 'SEO', col: 'GEO', val: Math.round((s * 0.3 + g * 0.7) * 100) / 100, derived: s * g > 0.5 ? 'strong' : s * g > 0.25 ? 'moderate' : 'weak' },
                { row: 'AEO', col: 'SEO', val: Math.round((a * 0.4 + s * 0.6) * 100) / 100, derived: a * s > 0.5 ? 'strong' : a * s > 0.25 ? 'moderate' : 'weak' },
                { row: 'AEO', col: 'AEO', val: 1, derived: 'self' },
                { row: 'AEO', col: 'GEO', val: Math.round((a * 0.5 + g * 0.5) * 100) / 100, derived: a * g > 0.5 ? 'strong' : a * g > 0.25 ? 'moderate' : 'weak' },
                { row: 'GEO', col: 'SEO', val: Math.round((g * 0.3 + s * 0.7) * 100) / 100, derived: g * s > 0.5 ? 'strong' : g * s > 0.25 ? 'moderate' : 'weak' },
                { row: 'GEO', col: 'AEO', val: Math.round((g * 0.5 + a * 0.5) * 100) / 100, derived: g * a > 0.5 ? 'strong' : g * a > 0.25 ? 'moderate' : 'weak' },
                { row: 'GEO', col: 'GEO', val: 1, derived: 'self' },
              ]
              const cellColor = (d: string) => {
                if (d === 'self') return 'bg-emerald-500/30 border-emerald-500/40'
                if (d === 'strong') return 'bg-emerald-500/20 border-emerald-500/30'
                if (d === 'moderate') return 'bg-amber-500/15 border-amber-500/25'
                return 'bg-rose-500/10 border-rose-500/20'
              }
              const cellText = (d: string) => {
                if (d === 'self') return 'text-emerald-400'
                if (d === 'strong') return 'text-emerald-400'
                if (d === 'moderate') return 'text-amber-400'
                return 'text-rose-400'
              }
              return (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="p-2 text-xs text-muted-foreground font-medium" />
                            <th className="p-2 text-xs text-emerald-400 font-bold text-center">SEO</th>
                            <th className="p-2 text-xs text-cyan-400 font-bold text-center">AEO</th>
                            <th className="p-2 text-xs text-amber-400 font-bold text-center">GEO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['SEO', 'AEO', 'GEO'].map((row) => (
                            <tr key={row}>
                              <td className={`p-2 text-xs font-bold ${row === 'SEO' ? 'text-emerald-400' : row === 'AEO' ? 'text-cyan-400' : 'text-amber-400'}`}>{row}</td>
                              {['SEO', 'AEO', 'GEO'].map((col) => {
                                const cell = correlations.find(c => c.row === row && c.col === col)!
                                return (
                                  <td key={col} className="p-2 text-center">
                                    <div className={`rounded-lg p-2.5 border ${cellColor(cell.derived)}`}>
                                      <p className={`text-sm font-bold ${cellText(cell.derived)}`}>
                                        {cell.derived === 'self' ? '—' : `${Math.round(cell.val * 100)}%`}
                                      </p>
                                      <p className={`text-[9px] ${cellText(cell.derived)} opacity-70`}>
                                        {cell.derived === 'self' ? 'Self' : cell.derived}
                                      </p>
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-3 h-3 rounded bg-emerald-500/30" /> Strong correlation
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-3 h-3 rounded bg-amber-500/20" /> Moderate correlation
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-3 h-3 rounded bg-rose-500/15" /> Weak correlation
                      </div>
                    </div>
                    {seoScore > 60 && aeoScore < 40 && (
                      <div className="mt-3 bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                        <p className="text-xs text-cyan-400"><strong>Insight:</strong> Strong SEO but weak AEO suggests content isn&apos;t structured for answer engines. Adding FAQ schema and direct-answer paragraphs would boost AEO significantly.</p>
                      </div>
                    )}
                    {seoScore > 60 && geoScore < 40 && (
                      <div className="mt-3 bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                        <p className="text-xs text-amber-400"><strong>Insight:</strong> Good SEO but low GEO indicates AI engines can&apos;t cite you. Focus on llms.txt, entity markup, and quotable content to close the gap.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}
          </motion.div>

          {/* ══════════════════════════════════════════════════
              ALGORITHM UPDATES TRACKER (ENHANCED)
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
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px] font-bold">{data.algorithmUpdates.recentUpdates.length} updates</Badge>
              </div>
              <div className="space-y-3">
                {data.algorithmUpdates.recentUpdates.map((update, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                    <button
                      onClick={() => setExpandedUpdate(expandedUpdate === i ? null : i)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Impact severity bar */}
                        <div className={`w-1.5 h-10 rounded-full shrink-0 ${update.impact === 'high' ? 'bg-rose-500' : update.impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{update.name}</span>
                            <ImpactBadge level={update.impact} />
                            <PillarBadge pillar={update.affectedPillar} />
                          </div>
                          <span className="text-xs text-muted-foreground">{update.date}</span>
                        </div>
                      </div>
                      {expandedUpdate === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {expandedUpdate === i && (
                      <div className="px-5 pb-5 border-t border-white/5 pt-4">
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
              DEEP STRATEGY / TECHNICAL IMPLEMENTATION
              ══════════════════════════════════════════════════ */}
          {data.deepStrategy && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Deep Strategy & Technical Implementation</h2>
                  <p className="text-sm text-muted-foreground">Copy-paste code snippets, backlink targets, and AI citation strategies</p>
                </div>
              </div>
              <div className="space-y-6">
                {/* Technical Implementations with Code Snippets */}
                {data.deepStrategy.technicalImplementations && data.deepStrategy.technicalImplementations.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold">Technical Implementations</span>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.deepStrategy.technicalImplementations.length}</Badge>
                      </div>
                      <button
                        onClick={() => {
                          const allCode = data.deepStrategy!.technicalImplementations.map((impl, idx) => `// ${impl.description}\n${impl.codeSnippet}`).join('\n\n')
                          navigator.clipboard.writeText(allCode)
                          setCopiedSnippet(-1)
                          setTimeout(() => setCopiedSnippet(null), 2000)
                        }}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-md hover:bg-emerald-500/10"
                      >
                        {copiedSnippet === -1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSnippet === -1 ? 'Copied All!' : 'Copy All'}
                      </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(16,185,129,0.3) transparent' }}>
                      {data.deepStrategy.technicalImplementations.map((impl, i) => (
                        <div key={i} className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={impl.priority} />
                              <PillarBadge pillar={impl.pillar} />
                              <span className="text-xs text-muted-foreground capitalize">{impl.type}</span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(impl.codeSnippet)
                                setCopiedSnippet(i)
                                setTimeout(() => setCopiedSnippet(null), 2000)
                              }}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
                            >
                              {copiedSnippet === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedSnippet === i ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-muted-foreground mb-2">{impl.description}</p>
                            <div className="relative rounded-lg bg-gray-950 border border-white/5 overflow-hidden">
                              <pre className="p-4 text-xs text-emerald-300/90 overflow-x-auto font-mono leading-relaxed" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(16,185,129,0.2) transparent' }}>
                                <code>{impl.codeSnippet}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backlink Outreach Targets */}
                {data.deepStrategy.backlinkOutreach && data.deepStrategy.backlinkOutreach.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold">Backlink Outreach Targets</span>
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{data.deepStrategy.backlinkOutreach.length}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {data.deepStrategy.backlinkOutreach.map((target, i) => (
                        <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-sm font-semibold truncate">{target.targetSite}</span>
                            <ImpactBadge level={target.priority} />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1.5"><strong>Strategy:</strong> {target.strategy}</p>
                          <p className="text-xs text-cyan-400/80"><strong>Content Angle:</strong> {target.contentAngle}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Citation Strategy */}
                {data.deepStrategy.aiCitationStrategy && data.deepStrategy.aiCitationStrategy.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold">AI Citation Strategy</span>
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">{data.deepStrategy.aiCitationStrategy.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {data.deepStrategy.aiCitationStrategy.map((technique, i) => (
                        <div key={i} className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">{technique.targetEngine}</Badge>
                            <span className="text-sm font-semibold text-purple-300">{technique.technique}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1.5">{technique.implementation}</p>
                          <p className="text-xs text-emerald-400/80">Expected: {technique.expectedResult}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              12-MONTH ROADMAP TIMELINE (ENHANCED)
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
              {/* Horizontal Timeline */}
              <div className="relative mb-6">
                {/* Horizontal Timeline Line */}
                <div className="h-1 bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-amber-500/50 rounded-full" />
                <div className="flex justify-between -mt-3">
                  {data.roadmap.quarters.map((q, i) => {
                    const dotColors = ['bg-emerald-500 border-emerald-400', 'bg-cyan-500 border-cyan-400', 'bg-amber-500 border-amber-400', 'bg-violet-500 border-violet-400']
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full border-2 ${dotColors[i % 4]} flex items-center justify-center bg-background z-10`}>
                          <span className="text-[8px] font-bold text-foreground">{i + 1}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">{q.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* Quarter Cards */}
              <div className="relative">
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
                    const quarterWeeks = data.measure.weeklyActions?.slice(i * 4, (i + 1) * 4) || []
                    const deliverables = quarterWeeks.flatMap(w => w.tasks?.filter(t => t.priority === 'high').map(t => t.task) || []).slice(0, 3)

                    return (
                      <div key={i} className="relative sm:pl-14">
                        <div className={`absolute left-3 top-3 w-5 h-5 rounded-full ${qc.bg} border-2 ${qc.border} hidden sm:flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${qc.text}`} style={{ backgroundColor: i === 0 ? '#10b981' : i === 1 ? '#06b6d4' : i === 2 ? '#f59e0b' : '#8b5cf6' }} />
                        </div>
                        <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
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
                          <div className="space-y-2.5 mb-4">
                            {[
                              { label: 'SEO', score: q.targetScores.seo, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                              { label: 'AEO', score: q.targetScores.aeo, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
                              { label: 'GEO', score: q.targetScores.geo, color: 'bg-amber-500', textColor: 'text-amber-400' },
                            ].map((target, j) => (
                              <div key={j} className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold ${target.textColor} w-10 shrink-0`}>{target.label}</span>
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
              TRAFFIC INSIGHTS WINNERS/LOSERS (ENHANCED)
              ══════════════════════════════════════════════════ */}
          {data.trafficInsights && (data.trafficInsights.winners?.length > 0 || data.trafficInsights.losers?.length > 0) && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Traffic Insights — Winners & Losers</h2>
                  <p className="text-sm text-muted-foreground">Page-level performance changes with impact indicators</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Winners */}
                {data.trafficInsights.winners?.length > 0 && (
                  <div className="bg-emerald-500/5 rounded-xl p-5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">Winners</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">{data.trafficInsights.winners.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {data.trafficInsights.winners.map((w, i) => {
                        const changeNum = parseInt(w.change?.replace(/[^0-9.-]/g, '') || '0')
                        return (
                          <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5 hover:border-emerald-500/20 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <PillarBadge pillar={w.pillar} />
                                <span className="text-sm font-medium truncate">{w.page}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-400">{w.change}</span>
                              </div>
                            </div>
                            {/* Change bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(Math.abs(changeNum), 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* Losers */}
                {data.trafficInsights.losers?.length > 0 && (
                  <div className="bg-rose-500/5 rounded-xl p-5 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-rose-400" />
                      <span className="text-sm font-bold text-rose-400">Losers</span>
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold">{data.trafficInsights.losers.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {data.trafficInsights.losers.map((l, i) => {
                        const changeNum = parseInt(l.change?.replace(/[^0-9.-]/g, '') || '0')
                        return (
                          <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5 hover:border-rose-500/20 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <PillarBadge pillar={l.pillar} />
                                <span className="text-sm font-medium truncate">{l.page}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                <span className="text-sm font-bold text-rose-400">{l.change}</span>
                              </div>
                            </div>
                            {/* Change bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.min(Math.abs(changeNum), 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

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
                        {safeArr(dim.findings).slice(0, 2).map((f, i) => (
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
                      {Array.isArray(dim.data?.findings) ? dim.data.findings.map((f: string, i: number) => (
                        <p key={i} className="text-[11px] text-muted-foreground leading-snug">• {typeof f === 'string' ? f : JSON.stringify(f)}</p>
                      )) : dim.data?.findings ? (
                        <p className="text-[11px] text-muted-foreground leading-snug">• {String(dim.data.findings)}</p>
                      ) : null}
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

                {/* ── llms.txt Generator ── */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-cyan-500/10 rounded-xl p-5 border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Download className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">llms.txt Generator</h3>
                      <p className="text-xs text-muted-foreground">One-click generate AI-readable files for instant LLM discoverability</p>
                    </div>
                  </div>
                  
                  {!llmsTxtContent ? (
                    <button
                      onClick={async () => {
                        setGeneratingLlmsTxt(true)
                        try {
                          const response = await fetch('/api/generate-llms-txt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              url: data.url,
                              siteName: data.siteName,
                              analysisData: data,
                            }),
                          })
                          if (!response.ok) throw new Error('Generation failed')
                          const result = await response.json()
                          setLlmsTxtContent(result.llmsTxt)
                          setLlmsFullTxtContent(result.llmsFullTxt)
                        } catch (err) {
                          console.error('llms.txt generation failed:', err)
                        } finally {
                          setGeneratingLlmsTxt(false)
                        }
                      }}
                      disabled={generatingLlmsTxt}
                      className="w-full flex items-center justify-center gap-2 text-sm bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                    >
                      {generatingLlmsTxt ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate llms.txt & llms-full.txt</>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm text-emerald-300">Files generated successfully!</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            const blob = new Blob([llmsTxtContent], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'llms.txt'
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                          className="flex items-center justify-center gap-2 text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-foreground font-semibold px-4 py-2.5 rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" /> Download llms.txt
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([llmsFullTxtContent || ''], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'llms-full.txt'
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                          className="flex items-center justify-center gap-2 text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-foreground font-semibold px-4 py-2.5 rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" /> Download llms-full.txt
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground/60 text-center">Deploy these files to your server root directory for instant AI discoverability</p>
                    </div>
                  )}
                </div>
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
                {safeArr(data.parasiteRisk.findings).map((f, i) => (
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
                      {safeArr(data.localSEO.gbpSignals.findings).map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">• {f}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <ScoreRing score={data.localSEO.napConsistency.score} label="NAP Consistency" color={scoreColor(data.localSEO.napConsistency.score)} size={72} />
                    <div className="mt-2 space-y-1">
                      {safeArr(data.localSEO.napConsistency.findings).map((f, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground">• {f}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                    <ScoreRing score={data.localSEO.reviewSignals.score} label="Review Signals" color={scoreColor(data.localSEO.reviewSignals.score)} size={72} />
                    <div className="mt-2 space-y-1">
                      {safeArr(data.localSEO.reviewSignals.findings).map((f, i) => (
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

          {/* ── AI Visibility Alerts ────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-rose-500/10 via-background to-amber-500/10 border-rose-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Visibility Alerts</h2>
                    <p className="text-sm text-muted-foreground">Get notified when your AI citation signals change</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400 bg-rose-500/10">NEW</Badge>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-bold text-rose-300">Citation Drop Alert</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Get alerted when Perplexity or Google AI Overview stops citing your site as a source</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-300">Rank Change Alert</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Track sudden changes in your AI visibility score across ChatGPT, Claude, and Gemini</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-300">Competitor Alert</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Know when a competitor gains AI citations you lost, or appears in AI Overviews you don't</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Configure Alert Channels</p>
                    <p className="text-xs text-muted-foreground">Receive alerts via email, Slack, or webhook when your AI visibility changes</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground cursor-pointer hover:border-emerald-500/30 hover:text-emerald-400 transition-colors">
                      <MessageSquare className="w-3 h-3 mr-1" /> Slack
                    </Badge>
                    <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground cursor-pointer hover:border-emerald-500/30 hover:text-emerald-400 transition-colors">
                      <Globe className="w-3 h-3 mr-1" /> Email
                    </Badge>
                    <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground cursor-pointer hover:border-emerald-500/30 hover:text-emerald-400 transition-colors">
                      <Code2 className="w-3 h-3 mr-1" /> Webhook
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Google Search Console Integration ────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-blue-500/10 via-background to-emerald-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Google Search Console</h2>
                    <p className="text-sm text-muted-foreground">Connect real search data with AI visibility insights</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">NEW</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold text-blue-300">Impressions vs AI Citations</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Compare your GSC impression data with AI citation counts. See where traditional search and AI visibility diverge.</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-300">Click-Through vs AI Position</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Correlate your click data with AI ranking positions. Identify pages with high CTR but low AI visibility.</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Connect Google Search Console</p>
                    <p className="text-xs text-muted-foreground">Link your GSC account to enable real data comparison between traditional and AI search performance</p>
                  </div>
                  <button className="flex items-center gap-2 text-sm bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300">
                    <Database className="w-4 h-4" /> Connect GSC
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Bottom CTA ────────────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Execute This Strategy?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Start your free trial and begin building the authority signals that make AI cite you across SEO, AEO, and GEO.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={onStartFree}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
                  >
                    Start Free Trial
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

      {/* ── Co-Pilot Pending Approvals Panel ──────────────────── */}
      <PendingApprovalsPanel
        isOpen={showApprovalsPanel}
        onClose={() => setShowApprovalsPanel(false)}
      />

      {/* ── AI Visibility Alerts Panel ────────────────────────── */}
      <AlertsPanel
        isOpen={showAlertsPanel}
        onClose={() => setShowAlertsPanel(false)}
        domain={alertDomain}
      />

      {/* ── Co-Pilot Mode Banner ──────────────────────────────── */}
      {mode === 'co-pilot' && !showApprovalsPanel && (
        <motion.div
          className="fixed bottom-6 right-6 z-30"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowApprovalsPanel(true)}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:bg-amber-500/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-amber-400">Co-Pilot Mode</p>
              <p className="text-[11px] text-amber-400/60">
                {pendingCount > 0
                  ? `${pendingCount} action${pendingCount > 1 ? 's' : ''} awaiting approval`
                  : 'No pending approvals'}
              </p>
            </div>
            {pendingCount > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            )}
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold">
              {pendingCount}
            </Badge>
          </button>
        </motion.div>
      )}
    </div>
  )
}
