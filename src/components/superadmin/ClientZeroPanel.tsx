'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Radio,
  Search,
  PenTool,
  Rocket,
  TrendingUp,
  Brain,
  Zap,
  Clock,
  Target,
  BookOpen,
  Network,
  ShieldCheck,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  FileText,
  Eye,
  Globe,
  Link2,
  Play,
  Calendar,
  Award,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Send,
  Layers,
  Activity,
  Database,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────

interface GrowthBrainBriefing {
  todayGrowth: number
  actionsPending: number
  estimatedVisitors: number
  recommendations: Recommendation[]
  generatedAt: string
}

interface Recommendation {
  id: string
  rank: number
  category: 'content' | 'technical' | 'entity' | 'link' | 'schema' | 'experiment'
  text: string
  evidence: string
  confidence: number
  estimatedImpact: number
  sourceCount: number
}

interface EvidenceCard {
  actionType: string
  confidence: number
  avgVisibilityGain: number
  sourceCount: number
  category: string
}

interface KnowledgeNode {
  id: string
  label: string
  status: 'complete' | 'missing' | 'partial'
  type: string
  warning?: string
}

interface GrowthMemoryEntry {
  id: string
  action: string
  impact: number
  type: string
  date: string
  details: string
}

interface VisibilityMonth {
  month: string
  score: number
  actions: { label: string; impact: number }[]
}

interface Sprint {
  id: string
  name: string
  goal: number
  current: number
  total: number
  status: 'active' | 'completed' | 'planned'
  startDate: string
  aiChose: string
  result?: string
}

interface ArticleROI {
  id: string
  title: string
  cost: number
  time: number
  visibilityDelta: number
  citations: number
  leads: number
  revenue: number
  roi: number
  type: string
}

interface KPIData {
  articlesPublished: number
  avgAIScoreGain: number
  totalCitationGain: number
  autoExecuteRate: number
}

interface Article {
  id: string
  title: string
  status: string
  estimatedImpact: number
  pillar: string
  format: string
}

// ─── Mock Data Generators ──────────────────────────────────────────────

function generateMockBriefing(): GrowthBrainBriefing {
  return {
    todayGrowth: 8,
    actionsPending: 3,
    estimatedVisitors: 420,
    generatedAt: new Date().toISOString(),
    recommendations: [
      {
        id: 'r1',
        rank: 1,
        category: 'content',
        text: 'Create a comprehensive FAQ page targeting "SaaS pricing comparison" queries — 3 competitors are cited but you are not',
        evidence: 'Based on 214 SaaS, 41 replays, Confidence: 91%',
        confidence: 91,
        estimatedImpact: 4,
        sourceCount: 214,
      },
      {
        id: 'r2',
        rank: 2,
        category: 'entity',
        text: 'Add founder author entity with Wikipedia-style bio — your content is attributed to "Admin" instead of a real person',
        evidence: 'Based on 127 SaaS, 23 replays, Confidence: 84%',
        confidence: 84,
        estimatedImpact: 2,
        sourceCount: 127,
      },
      {
        id: 'r3',
        rank: 3,
        category: 'schema',
        text: 'Add Organization schema with sameAs links to social profiles — AI models use these for entity verification',
        evidence: 'Based on 89 SaaS, 15 replays, Confidence: 78%',
        confidence: 78,
        estimatedImpact: 2,
        sourceCount: 89,
      },
    ],
  }
}

function generateMockEvidence(): EvidenceCard[] {
  return [
    { actionType: 'FAQ Pages', confidence: 93, avgVisibilityGain: 3.8, sourceCount: 214, category: 'content' },
    { actionType: 'Entity Author Bio', confidence: 87, avgVisibilityGain: 2.1, sourceCount: 127, category: 'entity' },
    { actionType: 'Schema Markup', confidence: 82, avgVisibilityGain: 1.9, sourceCount: 89, category: 'schema' },
    { actionType: 'Comparison Articles', confidence: 79, avgVisibilityGain: 4.2, sourceCount: 156, category: 'content' },
    { actionType: 'Link Building', confidence: 74, avgVisibilityGain: 1.5, sourceCount: 63, category: 'link' },
    { actionType: 'Technical SEO', confidence: 91, avgVisibilityGain: 2.8, sourceCount: 198, category: 'technical' },
    { actionType: 'Wikipedia Entry', confidence: 68, avgVisibilityGain: 5.1, sourceCount: 31, category: 'entity' },
    { actionType: 'A/B Experiments', confidence: 62, avgVisibilityGain: 1.2, sourceCount: 18, category: 'experiment' },
  ]
}

function generateMockKnowledgeGraph(): KnowledgeNode[] {
  return [
    { id: 'n1', label: 'Wikipedia', status: 'missing', type: 'entity', warning: '⚠️ Wikipedia missing' },
    { id: 'n2', label: 'Crunchbase', status: 'missing', type: 'entity', warning: '⚠️ No Crunchbase' },
    { id: 'n3', label: 'Founder Bio', status: 'partial', type: 'entity', warning: '⚠️ Incomplete bio' },
    { id: 'n4', label: 'Organization Schema', status: 'complete', type: 'schema' },
    { id: 'n5', label: 'Social Profiles', status: 'complete', type: 'entity' },
    { id: 'n6', label: 'Product Schema', status: 'complete', type: 'schema' },
    { id: 'n7', label: 'G2 Profile', status: 'complete', type: 'entity' },
    { id: 'n8', label: 'LinkedIn Company', status: 'complete', type: 'entity' },
  ]
}

function generateMockGrowthMemory(): GrowthMemoryEntry[] {
  return [
    { id: 'gm1', action: 'Created FAQ Page', impact: 3, type: 'content', date: '2025-06-28', details: 'SaaS pricing FAQ targeting 12 comparison queries' },
    { id: 'gm2', action: 'Added Author Entity', impact: 1, type: 'entity', date: '2025-06-27', details: 'Linked founder bio to all articles' },
    { id: 'gm3', action: 'Published Dentist Guide', impact: 7, type: 'content', date: '2025-06-25', details: 'Long-form guide cited by 3 AI models' },
    { id: 'gm4', action: 'Fixed Schema Errors', impact: 2, type: 'schema', date: '2025-06-24', details: 'Added missing Organization and Product schemas' },
    { id: 'gm5', action: 'Built Comparison Page', impact: 5, type: 'content', date: '2025-06-22', details: 'Us vs Competitors page now cited in Perplexity' },
    { id: 'gm6', action: 'Added Crunchbase Link', impact: 1, type: 'entity', date: '2025-06-20', details: 'Linked Crunchbase to sameAs schema' },
    { id: 'gm7', action: 'Internal Link Cluster', impact: 2, type: 'link', date: '2025-06-18', details: 'Created hub-spoke linking for 8 articles' },
    { id: 'gm8', action: 'Technical SEO Audit', impact: 3, type: 'technical', date: '2025-06-15', details: 'Fixed 14 crawl errors, improved Core Web Vitals' },
  ]
}

function generateMockVisibilityMemory(): VisibilityMonth[] {
  return [
    { month: 'Jan', score: 62, actions: [{ label: 'Launched blog', impact: 2 }, { label: 'First 5 articles', impact: 3 }] },
    { month: 'Feb', score: 65, actions: [{ label: 'FAQ page', impact: 3 }] },
    { month: 'Mar', score: 68, actions: [{ label: 'Schema fixes', impact: 2 }, { label: 'Author entity', impact: 1 }] },
    { month: 'Apr', score: 69, actions: [{ label: 'Comparison page', impact: 1 }] },
    { month: 'May', score: 71, actions: [{ label: 'Link cluster', impact: 2 }] },
    { month: 'Jun', score: 74, actions: [{ label: 'Dentist guide', impact: 3 }] },
    { month: 'Jul', score: 81, actions: [{ label: 'FAQ rewrite', impact: 4 }, { label: 'Entity build', impact: 3 }] },
  ]
}

function generateMockSprints(): Sprint[] {
  return [
    { id: 's27', name: 'Sprint 27', goal: 10, current: 7, total: 11, status: 'active', startDate: '2025-06-25', aiChose: '3 articles, 2 FAQs, 1 schema, 5 links' },
    { id: 's26', name: 'Sprint 26', goal: 10, current: 10, total: 10, status: 'completed', startDate: '2025-06-18', aiChose: '2 articles, 3 FAQs, 2 schema, 3 links', result: '+8 AI Visibility (Goal: +10) ✅' },
    { id: 's25', name: 'Sprint 25', goal: 8, current: 8, total: 8, status: 'completed', startDate: '2025-06-11', aiChose: '4 articles, 1 FAQ, 1 schema, 2 links', result: '+9 AI Visibility (Goal: +8) ✅' },
    { id: 's24', name: 'Sprint 24', goal: 8, current: 6, total: 9, status: 'completed', startDate: '2025-06-04', aiChose: '3 articles, 2 FAQs, 2 schema, 2 links', result: '+6 AI Visibility (Goal: +8) ⚠️' },
  ]
}

function generateMockArticleROI(): ArticleROI[] {
  return [
    { id: 'ar1', title: 'SaaS Pricing Comparison Guide', cost: 45, time: 3.2, visibilityDelta: 7, citations: 4, leads: 12, revenue: 2400, roi: 5233, type: 'content' },
    { id: 'ar2', title: 'FAQ: AI Visibility for Dentists', cost: 20, time: 1.1, visibilityDelta: 3, citations: 2, leads: 5, revenue: 800, roi: 3900, type: 'content' },
    { id: 'ar3', title: 'Founder Bio & Entity Page', cost: 15, time: 0.8, visibilityDelta: 1, citations: 1, leads: 2, revenue: 300, roi: 1900, type: 'entity' },
    { id: 'ar4', title: 'Organization Schema Fix', cost: 5, time: 0.3, visibilityDelta: 2, citations: 0, leads: 0, revenue: 0, roi: -100, type: 'schema' },
    { id: 'ar5', title: 'Us vs Competitors Analysis', cost: 35, time: 2.5, visibilityDelta: 5, citations: 3, leads: 8, revenue: 1600, roi: 4471, type: 'content' },
    { id: 'ar6', title: 'Technical SEO Audit Report', cost: 30, time: 2.0, visibilityDelta: 3, citations: 1, leads: 3, revenue: 600, roi: 1900, type: 'technical' },
    { id: 'ar7', title: 'Internal Link Cluster Build', cost: 10, time: 0.5, visibilityDelta: 2, citations: 0, leads: 1, revenue: 200, roi: 1900, type: 'link' },
  ]
}

function generateMockKPI(): KPIData {
  return {
    articlesPublished: 34,
    avgAIScoreGain: 2.8,
    totalCitationGain: 47,
    autoExecuteRate: 78,
  }
}

function generateMockArticles(): Article[] {
  return [
    { id: 'a1', title: 'SaaS Pricing Comparison 2025', status: 'ready', estimatedImpact: 4, pillar: 'Growth', format: 'Article' },
    { id: 'a2', title: 'FAQ: How AI Models Cite Sources', status: 'ready', estimatedImpact: 3, pillar: 'Education', format: 'FAQ' },
    { id: 'a3', title: 'Organization Schema Update', status: 'ready', estimatedImpact: 2, pillar: 'Technical', format: 'Schema Fix' },
    { id: 'a4', title: 'Dentist Marketing AI Guide', status: 'draft', estimatedImpact: 5, pillar: 'Growth', format: 'Article' },
    { id: 'a5', title: 'Founder Entity Bio Page', status: 'ready', estimatedImpact: 1, pillar: 'Entity', format: 'Article' },
  ]
}

// ─── Category Badge Color ──────────────────────────────────────────────

function getCategoryBadge(category: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    content: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Content' },
    technical: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', label: 'Technical' },
    entity: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', label: 'Entity' },
    link: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Link' },
    schema: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', label: 'Schema' },
    experiment: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Experiment' },
  }
  const c = map[category] || map.content
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (confidence >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 90) return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
  if (confidence >= 70) return 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
  return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
}

function getNodeStatusIcon(status: string) {
  if (status === 'complete') return <CheckCircle className="w-4 h-4 text-emerald-500" />
  if (status === 'partial') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  return <XCircle className="w-4 h-4 text-red-500" />
}

// ─── Animation Variants ────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

// ─── Main Component ────────────────────────────────────────────────────

export default function ClientZeroPanel() {
  const [activeTab, setActiveTab] = useState('discover')
  const [briefing, setBriefing] = useState<GrowthBrainBriefing | null>(null)
  const [evidence, setEvidence] = useState<EvidenceCard[]>([])
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([])
  const [growthMemory, setGrowthMemory] = useState<GrowthMemoryEntry[]>([])
  const [visibilityMemory, setVisibilityMemory] = useState<VisibilityMonth[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [articleROI, setArticleROI] = useState<ArticleROI[]>([])
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<VisibilityMonth | null>(null)
  const [contentFactoryOpen, setContentFactoryOpen] = useState(false)
  const [createType, setCreateType] = useState<string>('')
  const [createProgress, setCreateProgress] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [createProgressLabel, setCreateProgressLabel] = useState('')
  const [newSprintDialog, setNewSprintDialog] = useState(false)
  const [newSprintGoal, setNewSprintGoal] = useState('')
  const [growthMemoryFilter, setGrowthMemoryFilter] = useState<string>('all')
  const [growthMemorySort, setGrowthMemorySort] = useState<string>('impact')
  const [seeding, setSeeding] = useState(false)

  // ─── Data Fetching ──────────────────────────────────────────────────

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [briefingRes, evidenceRes, kgRes, memoryRes, visRes, sprintsRes, roiRes, kpiRes, articlesRes] = await Promise.allSettled([
        fetch('/api/content-engine/growth-brain').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/evidence').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/knowledge-graph').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/growth-memory').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/visibility-memory').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/sprints').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/article-roi').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/kpi').then(r => r.json()).catch(() => null),
        fetch('/api/content-engine/articles').then(r => r.json()).catch(() => null),
      ])

      setBriefing(
        briefingRes.status === 'fulfilled' && briefingRes.value?.recommendations
          ? briefingRes.value
          : generateMockBriefing()
      )
      setEvidence(
        evidenceRes.status === 'fulfilled' && Array.isArray(evidenceRes.value) && evidenceRes.value.length > 0
          ? evidenceRes.value
          : generateMockEvidence()
      )
      setKnowledgeNodes(
        kgRes.status === 'fulfilled' && Array.isArray(kgRes.value) && kgRes.value.length > 0
          ? kgRes.value
          : generateMockKnowledgeGraph()
      )
      setGrowthMemory(
        memoryRes.status === 'fulfilled' && Array.isArray(memoryRes.value) && memoryRes.value.length > 0
          ? memoryRes.value
          : generateMockGrowthMemory()
      )
      setVisibilityMemory(
        visRes.status === 'fulfilled' && Array.isArray(visRes.value) && visRes.value.length > 0
          ? visRes.value
          : generateMockVisibilityMemory()
      )
      setSprints(
        sprintsRes.status === 'fulfilled' && Array.isArray(sprintsRes.value) && sprintsRes.value.length > 0
          ? sprintsRes.value
          : generateMockSprints()
      )
      setArticleROI(
        roiRes.status === 'fulfilled' && Array.isArray(roiRes.value) && roiRes.value.length > 0
          ? roiRes.value
          : generateMockArticleROI()
      )
      setKpi(
        kpiRes.status === 'fulfilled' && kpiRes.value?.articlesPublished
          ? kpiRes.value
          : generateMockKPI()
      )
      setArticles(
        articlesRes.status === 'fulfilled' && Array.isArray(articlesRes.value) && articlesRes.value.length > 0
          ? articlesRes.value
          : generateMockArticles()
      )
    } catch {
      // Fallback to mock data
      setBriefing(generateMockBriefing())
      setEvidence(generateMockEvidence())
      setKnowledgeNodes(generateMockKnowledgeGraph())
      setGrowthMemory(generateMockGrowthMemory())
      setVisibilityMemory(generateMockVisibilityMemory())
      setSprints(generateMockSprints())
      setArticleROI(generateMockArticleROI())
      setKpi(generateMockKPI())
      setArticles(generateMockArticles())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ─── Action Handlers ────────────────────────────────────────────────

  const handleExecuteAll = async () => {
    setExecuting(true)
    try {
      await fetch('/api/content-engine/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute_all' }),
      })
    } catch {
      // silent
    }
    setTimeout(() => {
      setExecuting(false)
    }, 2000)
  }

  const handleExecuteRecommendation = async (recId: string) => {
    setExecuting(true)
    try {
      await fetch('/api/content-engine/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute_recommendation', recommendationId: recId }),
      })
    } catch {
      // silent
    }
    setTimeout(() => {
      setExecuting(false)
    }, 1500)
  }

  const handleCreateContent = async () => {
    if (!createType) return
    setIsCreating(true)
    setCreateProgress(0)

    const steps = [
      { label: 'Analyzing...', progress: 20 },
      { label: 'Writing...', progress: 45 },
      { label: 'Reviewing...', progress: 65 },
      { label: 'Optimizing...', progress: 85 },
      { label: 'Done!', progress: 100 },
    ]

    for (const step of steps) {
      setCreateProgressLabel(step.label)
      setCreateProgress(step.progress)
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      await fetch('/api/content-engine/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_content', type: createType }),
      })
    } catch {
      // silent
    }

    setTimeout(() => {
      setIsCreating(false)
      setCreateProgress(0)
      setCreateType('')
    }, 1000)
  }

  const handleBuildKnowledgeGraph = async () => {
    try {
      await fetch('/api/content-engine/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'build' }),
      })
    } catch {
      // silent
    }
  }

  const handleStartSprint = async () => {
    try {
      await fetch('/api/content-engine/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: newSprintGoal || 'AI Auto-Plan' }),
      })
    } catch {
      // silent
    }
    setNewSprintDialog(false)
    setNewSprintGoal('')
  }

  const handleSeedDemo = async () => {
    setSeeding(true)
    try {
      await fetch('/api/content-engine/learning-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      await fetchAllData()
    } catch {
      // silent
    }
    setSeeding(false)
  }

  const handleGenerateRecommendations = async () => {
    try {
      await fetch('/api/content-engine/growth-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      await fetchAllData()
    } catch {
      // silent
    }
  }

  // ─── Filtered/Sorted Data ───────────────────────────────────────────

  const filteredGrowthMemory = growthMemory
    .filter(e => growthMemoryFilter === 'all' || e.type === growthMemoryFilter)
    .sort((a, b) => {
      if (growthMemorySort === 'impact') return b.impact - a.impact
      if (growthMemorySort === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime()
      return a.action.localeCompare(b.action)
    })

  const activeSprint = sprints.find(s => s.status === 'active')
  const completedSprints = sprints.filter(s => s.status === 'completed')
  const readyArticles = articles.filter(a => a.status === 'ready')

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* ─── AI Growth Brain™ Top Bar ─────────────────────────────────── */}
      <motion.div {...fadeIn} className="mb-4">
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/30 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md"
                  >
                    <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </motion.div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                    AI Growth Brain™
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                      LIVE
                    </Badge>
                  </h2>
                  {briefing ? (
                    <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Today&apos;s Growth: <span className="font-bold">+{briefing.todayGrowth} AI Visibility</span> · {briefing.actionsPending} actions pending · +{briefing.estimatedVisitors} est. visitors
                    </p>
                  ) : (
                    <Skeleton className="h-4 w-64 mt-1" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRecommendations}
                  className="text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteAll}
                  disabled={executing}
                  className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm"
                >
                  {executing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Execute All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  className="text-xs gap-1.5 text-muted-foreground"
                >
                  {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  Seed Demo
                </Button>
              </div>
            </div>

            {/* Top 3 Recommendations */}
            {briefing && (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2"
              >
                {briefing.recommendations.map((rec) => (
                  <motion.div key={rec.id} variants={staggerItem}>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/60 dark:bg-background/60 border border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {rec.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {getCategoryBadge(rec.category)}
                          <span className={`text-[10px] font-semibold ${getConfidenceColor(rec.confidence)}`}>
                            {rec.confidence}%
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-snug line-clamp-2">{rec.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            +{rec.estimatedImpact} AI Visibility
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            onClick={() => handleExecuteRecommendation(rec.id)}
                            disabled={executing}
                          >
                            Execute <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 4 Main Tabs ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-4 mb-3 bg-muted/50">
          <TabsTrigger value="discover" className="gap-1.5 text-xs data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-300">
            <Search className="w-3.5 h-3.5" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1.5 text-xs data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-300">
            <PenTool className="w-3.5 h-3.5" />
            Create
          </TabsTrigger>
          <TabsTrigger value="publish" className="gap-1.5 text-xs data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-300">
            <Rocket className="w-3.5 h-3.5" />
            Publish
          </TabsTrigger>
          <TabsTrigger value="measure" className="gap-1.5 text-xs data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-300">
            <BarChart3 className="w-3.5 h-3.5" />
            Measure
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: DISCOVER                                               */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'discover' && (
              <motion.div key="discover" {...fadeIn} className="space-y-4 pb-4">
                {/* AI Growth Brain Detailed Section */}
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">AI Growth Brain™ — Morning Briefing</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateRecommendations}
                        className="text-xs gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate New
                      </Button>
                    </div>
                    <CardDescription className="text-xs">
                      &quot;If I had one hour today to grow your AI visibility, here&apos;s what I&apos;d do...&quot;
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                        {briefing?.recommendations.map((rec) => (
                          <motion.div key={rec.id} variants={staggerItem}>
                            <div className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getConfidenceBg(rec.confidence)}`}>
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                  {rec.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    {getCategoryBadge(rec.category)}
                                    <Badge variant="outline" className="text-[10px] gap-1">
                                      <Target className="w-3 h-3" />
                                      +{rec.estimatedImpact} AI Visibility
                                    </Badge>
                                    <span className={`text-xs font-semibold ${getConfidenceColor(rec.confidence)}`}>
                                      {rec.confidence}% confidence
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground leading-relaxed">{rec.text}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      {rec.evidence}
                                    </div>
                                    <Button
                                      size="sm"
                                      className="ml-auto text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-7"
                                      onClick={() => handleExecuteRecommendation(rec.id)}
                                      disabled={executing}
                                    >
                                      {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                      Execute
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Evidence Engine Grid */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">Evidence Engine</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Every recommendation backed by data from hundreds of SaaS companies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                          <Skeleton key={i} className="h-28 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {evidence.map((e, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-3 rounded-lg border-2 cursor-default transition-all hover:shadow-md ${getConfidenceBg(e.confidence)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-foreground">{e.actionType}</span>
                              <span className={`text-lg font-bold ${getConfidenceColor(e.confidence)}`}>
                                {e.confidence}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                              +{e.avgVisibilityGain} avg gain
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <BookOpen className="w-3 h-3" />
                              {e.sourceCount} sources
                            </div>
                            <div className="mt-2">
                              {getCategoryBadge(e.category)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Knowledge Graph */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="w-5 h-5 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Brand Knowledge Graph</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                        onClick={handleBuildKnowledgeGraph}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Build Graph
                      </Button>
                    </div>
                    <CardDescription className="text-xs">
                      How AI models understand your brand — incomplete nodes mean missed citations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex flex-wrap gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                          <Skeleton key={i} className="h-16 w-28 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Simplified Knowledge Graph as node cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {knowledgeNodes.map((node, i) => (
                            <motion.div
                              key={node.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.06 }}
                              className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-sm ${
                                node.status === 'complete'
                                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                                  : node.status === 'partial'
                                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                  : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {getNodeStatusIcon(node.status)}
                                <span className="text-xs font-semibold">{node.label}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">{node.type}</div>
                              {node.warning && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                  {node.warning}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>

                        {/* Connection lines (decorative) */}
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Network className="w-3.5 h-3.5" />
                            <span>
                              {knowledgeNodes.filter(n => n.status === 'complete').length}/{knowledgeNodes.length} nodes complete — 
                              <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                                {knowledgeNodes.filter(n => n.status !== 'complete').length} need attention
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: CREATE                                                  */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'create' && (
              <motion.div key="create" {...fadeIn} className="space-y-4 pb-4">
                {/* Content Creation Prompt */}
                <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 via-background to-emerald-50/50 dark:from-emerald-950/10 dark:to-emerald-950/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">What do you want to create?</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Pick a format or let the AI Growth Brain decide — we handle the pipeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { key: 'article', label: 'Article', icon: FileText, desc: 'Long-form content' },
                        { key: 'faq', label: 'FAQ', icon: BookOpen, desc: 'FAQ page' },
                        { key: 'schema', label: 'Schema Fix', icon: ShieldCheck, desc: 'Structured data' },
                        { key: 'ai-decide', label: 'Let AI Decide', icon: Brain, desc: 'Best choice for you' },
                      ].map((opt) => (
                        <motion.button
                          key={opt.key}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setCreateType(opt.key)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            createType === opt.key
                              ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30 shadow-md'
                              : 'border-muted hover:border-emerald-200 dark:hover:border-emerald-800 bg-background'
                          }`}
                        >
                          <opt.icon className={`w-6 h-6 mx-auto mb-2 ${createType === opt.key ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          <div className="text-sm font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Creation Progress */}
                    {isCreating && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {createProgressLabel}
                          </span>
                        </div>
                        <Progress value={createProgress} className="h-2" />
                        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                          <span>Analyzing → Writing → Reviewing → Optimizing</span>
                          <span>{createProgress}%</span>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      size="lg"
                      className="w-full text-sm gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md h-11"
                      disabled={!createType || isCreating}
                      onClick={handleCreateContent}
                    >
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isCreating ? 'Creating...' : 'Create & Execute'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Sprint */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">Active Sprint</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    ) : activeSprint ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-bold">{activeSprint.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Goal: +{activeSprint.goal} AI Visibility
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                            Active
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{activeSprint.current}/{activeSprint.total} actions completed</span>
                            <span>{Math.round((activeSprint.current / activeSprint.total) * 100)}%</span>
                          </div>
                          <Progress value={(activeSprint.current / activeSprint.total) * 100} className="h-2" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Brain className="w-3.5 h-3.5 text-emerald-500" />
                          AI chose: {activeSprint.aiChose}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No active sprint. Start one in the Publish tab.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content Factory (collapsed by default) */}
                <Card>
                  <CardHeader className="pb-2">
                    <button
                      onClick={() => setContentFactoryOpen(!contentFactoryOpen)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Content Factory</CardTitle>
                        <Badge variant="outline" className="text-[10px]">One brief → 8 formats</Badge>
                      </div>
                      {contentFactoryOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </CardHeader>
                  <AnimatePresence>
                    {contentFactoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground mb-3">
                            Write one brief and automatically generate 8 content formats optimized for different channels
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {[
                              { label: 'Blog', icon: FileText, color: 'text-emerald-500' },
                              { label: 'Landing Page', icon: Globe, color: 'text-sky-500' },
                              { label: 'Case Study', icon: BookOpen, color: 'text-violet-500' },
                              { label: 'LinkedIn', icon: Link2, color: 'text-blue-500' },
                              { label: 'Twitter Thread', icon: Radio, color: 'text-sky-400' },
                              { label: 'Newsletter', icon: Send, color: 'text-rose-500' },
                              { label: 'Docs', icon: FileText, color: 'text-amber-500' },
                              { label: 'VS Page', icon: Award, color: 'text-orange-500' },
                            ].map((fmt, i) => (
                              <motion.div
                                key={fmt.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-2 p-2.5 rounded-lg border bg-background hover:shadow-sm transition-shadow"
                              >
                                <fmt.icon className={`w-4 h-4 ${fmt.color}`} />
                                <span className="text-xs font-medium">{fmt.label}</span>
                              </motion.div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white w-full"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate All
                          </Button>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: PUBLISH                                                 */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'publish' && (
              <motion.div key="publish" {...fadeIn} className="space-y-4 pb-4">
                {/* Sprint View */}
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Sprint Management</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                        onClick={() => setNewSprintDialog(true)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Start New Sprint
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                      </div>
                    ) : activeSprint ? (
                      <div className="p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold">{activeSprint.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Goal: +{activeSprint.goal} AI Visibility · Started {activeSprint.startDate}
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                            Active
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{activeSprint.current}/{activeSprint.total} actions completed</span>
                            <span>{Math.round((activeSprint.current / activeSprint.total) * 100)}%</span>
                          </div>
                          <Progress value={(activeSprint.current / activeSprint.total) * 100} className="h-2.5" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
                          <Brain className="w-3.5 h-3.5 text-emerald-500" />
                          AI chose: {activeSprint.aiChose}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        <Rocket className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                        No active sprint. Start one to begin!
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Auto-Execute Queue */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Auto-Execute Queue</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleExecuteAll}
                        disabled={executing}
                        className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                      >
                        {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        Execute All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : readyArticles.length > 0 ? (
                      <ScrollArea className="max-h-64">
                        <div className="space-y-2">
                          {readyArticles.map((article, i) => (
                            <motion.div
                              key={article.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{article.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                      {article.format}
                                    </Badge>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      +{article.estimatedImpact} visibility
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex-shrink-0 h-7"
                                onClick={() => handleExecuteRecommendation(article.id)}
                                disabled={executing}
                              >
                                <Play className="w-3 h-3" />
                                Execute
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No articles in queue
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sprint History */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">Sprint History</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                          {completedSprints.map((sprint, i) => (
                            <motion.div
                              key={sprint.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center justify-between p-3 rounded-lg border bg-background"
                            >
                              <div>
                                <span className="text-xs font-semibold">{sprint.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {sprint.startDate}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  sprint.result?.includes('✅')
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
                                    : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
                                }`}
                              >
                                {sprint.result}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: MEASURE                                                 */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'measure' && (
              <motion.div key="measure" {...fadeIn} className="space-y-4 pb-4">
                {/* KPI Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {loading ? (
                    [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
                  ) : kpi ? (
                    [
                      { label: 'Articles Published', value: kpi.articlesPublished, icon: FileText, color: 'text-emerald-500' },
                      { label: 'Avg AI Score Gain', value: `+${kpi.avgAIScoreGain}`, icon: TrendingUp, color: 'text-emerald-500' },
                      { label: 'Total Citation Gain', value: `+${kpi.totalCitationGain}`, icon: Eye, color: 'text-emerald-500' },
                      { label: 'Auto-Execute Rate', value: `${kpi.autoExecuteRate}%`, icon: Zap, color: 'text-emerald-500' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <Card className="border-emerald-100 dark:border-emerald-900/40">
                          <CardContent className="p-4 text-center">
                            <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
                            <div className="text-xl font-bold text-foreground">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : null}
                </div>

                {/* AI Visibility Memory™ */}
                <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">AI Visibility Memory™</CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                        KEY FEATURE
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Track your AI Visibility Score over time — click any month to see what drove the change
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-64 w-full rounded-lg" />
                    ) : (
                      <div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={visibilityMemory} onClick={(data) => {
                              if (data?.activePayload?.[0]) {
                                const idx = data.activeTooltipIndex ?? 0
                                setSelectedMonth(visibilityMemory[idx])
                              }
                            }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                }}
                                formatter={(value: number) => [`Score: ${value}`, 'AI Visibility']}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 5, cursor: 'pointer' }}
                                activeDot={{ r: 7, stroke: '#059669', strokeWidth: 2, fill: '#10b981', cursor: 'pointer' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Drill-down for selected month */}
                        <AnimatePresence>
                          {selectedMonth && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold">
                                  {selectedMonth.month} — Score: {selectedMonth.score}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-[10px] px-1.5"
                                  onClick={() => setSelectedMonth(null)}
                                >
                                  Close
                                </Button>
                              </div>
                              <div className="space-y-1.5">
                                {selectedMonth.actions.map((action, i) => (
                                  <div key={i} className="flex items-center justify-between text-[11px]">
                                    <span className="text-foreground">{action.label}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      +{action.impact} visibility
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Lightbulb className="w-3 h-3" />
                          Click any data point to see what drove the change
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Growth Memory */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        <CardTitle className="text-sm font-bold">Growth Memory</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={growthMemoryFilter} onValueChange={setGrowthMemoryFilter}>
                          <SelectTrigger className="w-28 h-7 text-[10px]">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="content">Content</SelectItem>
                            <SelectItem value="entity">Entity</SelectItem>
                            <SelectItem value="schema">Schema</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={growthMemorySort} onValueChange={setGrowthMemorySort}>
                          <SelectTrigger className="w-24 h-7 text-[10px]">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="impact">By Impact</SelectItem>
                            <SelectItem value="date">By Date</SelectItem>
                            <SelectItem value="name">By Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      Every action with its outcome — the system learns what works best
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <ScrollArea className="max-h-72">
                        <div className="space-y-1.5">
                          {filteredGrowthMemory.map((entry, i) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center justify-between p-2.5 rounded-lg border bg-background hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  entry.impact >= 4 ? 'bg-emerald-500' :
                                  entry.impact >= 2 ? 'bg-amber-500' :
                                  'bg-red-400'
                                }`} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {getCategoryBadge(entry.type)}
                                    <span className="text-xs font-medium truncate">{entry.action}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entry.details}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  +{entry.impact}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Article ROI */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                      <CardTitle className="text-sm font-bold">Article ROI</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Full funnel from cost to revenue — the system learns which content types perform best
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        {[1, 2, 3, 4].map(i => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div>
                        <ScrollArea className="max-h-64">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-[10px]">Article</TableHead>
                                <TableHead className="text-[10px] text-right">Cost</TableHead>
                                <TableHead className="text-[10px] text-right">Time</TableHead>
                                <TableHead className="text-[10px] text-right">Vis. Δ</TableHead>
                                <TableHead className="text-[10px] text-right">Citations</TableHead>
                                <TableHead className="text-[10px] text-right">Leads</TableHead>
                                <TableHead className="text-[10px] text-right">Revenue</TableHead>
                                <TableHead className="text-[10px] text-right">ROI</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {articleROI.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell className="text-xs font-medium max-w-[180px] truncate py-2">
                                    <div className="flex items-center gap-1.5">
                                      {getCategoryBadge(row.type)}
                                      <span className="truncate">{row.title}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-right py-2">${row.cost}</TableCell>
                                  <TableCell className="text-xs text-right py-2">{row.time}h</TableCell>
                                  <TableCell className="text-xs text-right py-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{row.visibilityDelta}</span>
                                  </TableCell>
                                  <TableCell className="text-xs text-right py-2">{row.citations}</TableCell>
                                  <TableCell className="text-xs text-right py-2">{row.leads}</TableCell>
                                  <TableCell className="text-xs text-right py-2">${row.revenue.toLocaleString()}</TableCell>
                                  <TableCell className="text-xs text-right py-2">
                                    <span className={`font-bold ${
                                      row.roi > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {row.roi > 0 ? '+' : ''}{row.roi}%
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>

                        {/* Summary Stats */}
                        <div className="mt-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">Best performing:</span>
                            <span className="text-emerald-700 dark:text-emerald-300">
                              Content articles (+4.2 avg visibility)
                            </span>
                          </div>
                        </div>

                        {/* ROI Bar Chart */}
                        <div className="mt-4 h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={articleROI.map(r => ({ name: r.title.slice(0, 20), roi: r.roi, type: r.type }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} angle={-25} textAnchor="end" height={50} />
                              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                }}
                                formatter={(value: number) => [`${value}%`, 'ROI']}
                              />
                              <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                                {articleROI.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.roi > 3000 ? '#10b981' : entry.roi > 1000 ? '#f59e0b' : '#ef4444'}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>

      {/* ─── New Sprint Dialog ─────────────────────────────────────────── */}
      <Dialog open={newSprintDialog} onOpenChange={setNewSprintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-500" />
              Start New Sprint
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Sprint Goal (AI Visibility gain target)
              </label>
              <Input
                placeholder="e.g., +10 AI Visibility"
                value={newSprintGoal}
                onChange={(e) => setNewSprintGoal(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-xs">
                <Brain className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-emerald-700 dark:text-emerald-300">
                  AI Auto-Plan
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Leave empty or type &quot;AI Auto-Plan&quot; to let the Growth Brain set the optimal goal and choose actions automatically
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewSprintDialog(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleStartSprint}
              className="text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              <Rocket className="w-3.5 h-3.5" />
              Start Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
