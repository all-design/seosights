'use client'

/**
 * Review Pipeline — Multi-step review visualization
 *
 * SEO, AEO, GEO, Citation, Internal Links, Schema, Fact Checker, Image Generator
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShieldCheck,
  Search,
  MessageSquare,
  Globe,
  Link2,
  Code2,
  CheckCircle2,
  Image,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Wrench,
  Play,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

interface ReviewStep {
  id: string
  name: string
  icon: React.ElementType
  score: number | null
  passed: boolean | null
  findings: string[]
  suggestions: string[]
  status: 'pending' | 'running' | 'done'
}

interface Article {
  id: string
  title: string
}

interface ReviewData {
  articles: Article[]
  selectedArticle: Article
  steps: ReviewStep[]
  overallReadiness: number
  totalSteps: number
  passedSteps: number
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK_ARTICLES: Article[] = [
  { id: '1', title: 'AI Visibility for Dentists' },
  { id: '2', title: 'LLM SEO vs Traditional SEO' },
  { id: '3', title: 'Citation Building Strategy' },
  { id: '4', title: 'Schema Markup for AI Crawlers' },
  { id: '5', title: 'GEO Ranking Optimization' },
]

const FALLBACK_STEPS: ReviewStep[] = [
  {
    id: 'seo',
    name: 'SEO Review',
    icon: Search,
    score: 92,
    passed: true,
    findings: ['Title tag optimized', 'Meta description present', 'H1-H3 hierarchy correct', 'Keyword density 1.8%'],
    suggestions: ['Add alt text to 2 images', 'Consider adding a table of contents'],
    status: 'done',
  },
  {
    id: 'aeo',
    name: 'AEO Review',
    icon: MessageSquare,
    score: 87,
    passed: true,
    findings: ['FAQ section present', 'Direct answers in first paragraph', 'Entity mentions detected'],
    suggestions: ['Add more Q&A pairs', 'Include comparison tables for "vs" queries'],
    status: 'done',
  },
  {
    id: 'geo',
    name: 'GEO Review',
    icon: Globe,
    score: 78,
    passed: true,
    findings: ['Facts extractable', 'Statistics cited with sources', 'Structured data present'],
    suggestions: ['Add more verifiable statistics', 'Include expert quotes for fact extraction'],
    status: 'done',
  },
  {
    id: 'citation',
    name: 'Citation Optimizer',
    icon: Link2,
    score: 71,
    passed: false,
    findings: ['3 Wikipedia citations suggested', 'GitHub reference available', 'Reddit thread available'],
    suggestions: ['Add Wikipedia citation for "Dental SEO"', 'Link to ADA official guidelines', 'Include .gov source for statistics'],
    status: 'done',
  },
  {
    id: 'internal_links',
    name: 'Internal Links',
    icon: Code2,
    score: 84,
    passed: true,
    findings: ['5 auto-discovered links', 'Anchor text optimized', 'Hub-and-spoke pattern detected'],
    suggestions: ['Add link to /pricing from comparison section', 'Cross-link with LLM SEO guide'],
    status: 'done',
  },
  {
    id: 'schema',
    name: 'Schema Builder',
    icon: Code2,
    score: 95,
    passed: true,
    findings: ['Article schema generated', 'FAQ schema generated', 'Organization schema valid'],
    suggestions: ['Consider adding BreadcrumbList schema'],
    status: 'done',
  },
  {
    id: 'fact_check',
    name: 'Fact Checker',
    icon: CheckCircle2,
    score: 88,
    passed: true,
    findings: ['All statistics verified', 'No hallucinated claims detected', 'Sources cross-referenced'],
    suggestions: ['Add publication dates to statistics for recency'],
    status: 'done',
  },
  {
    id: 'image',
    name: 'Image Generator',
    icon: Image,
    score: 65,
    passed: false,
    findings: ['OG image preview generated', 'Twitter card meta set'],
    suggestions: ['Regenerate OG image with better layout', 'Add article-specific infographic'],
    status: 'done',
  },
]

const FALLBACK: ReviewData = {
  articles: FALLBACK_ARTICLES,
  selectedArticle: FALLBACK_ARTICLES[0],
  steps: FALLBACK_STEPS,
  overallReadiness: 75,
  totalSteps: 8,
  passedSteps: 6,
}

// ── Animation ───────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ───────────────────────────────────────────────────────────

export default function ReviewPipeline() {
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedArticleId, setSelectedArticleId] = useState<string>(FALLBACK_ARTICLES[0].id)
  const [runningStep, setRunningStep] = useState<string | null>(null)
  const [fixingStep, setFixingStep] = useState<string | null>(null)
  const [schemaExpanded, setSchemaExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/client-zero/content-engine/review?articleId=${selectedArticleId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(FALLBACK)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedArticleId])

  const steps = data?.steps || FALLBACK_STEPS
  const readiness = data?.overallReadiness || FALLBACK.overallReadiness
  const passedSteps = data?.passedSteps || FALLBACK.passedSteps
  const totalSteps = data?.totalSteps || FALLBACK.totalSteps
  const articles = data?.articles || FALLBACK.articles

  const handleRunReview = async (stepId: string) => {
    setRunningStep(stepId)
    setTimeout(() => setRunningStep(null), 1500)
  }

  const handleAutoFix = async (stepId: string) => {
    setFixingStep(stepId)
    setTimeout(() => setFixingStep(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
          <CardContent className="p-6 h-24" />
        </Card>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
              <CardContent className="p-4 h-48" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Review Pipeline</h3>
        </div>
        <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
          <SelectTrigger className="h-8 w-64 text-xs bg-card/80 border-white/10">
            <SelectValue placeholder="Select article..." />
          </SelectTrigger>
          <SelectContent>
            {articles.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Overall Readiness ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Readiness</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  {passedSteps}/{totalSteps} passed
                </Badge>
                <span className="text-sm font-bold text-emerald-400">{readiness}%</span>
              </div>
            </div>
            <Progress value={readiness} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Review Cards Pipeline ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <ScrollArea className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-[800px]">
            {steps.map((step) => {
              const Icon = step.icon
              const scoreColor =
                step.score !== null
                  ? step.score >= 85
                    ? 'text-emerald-400'
                    : step.score >= 70
                      ? 'text-amber-400'
                      : 'text-red-400'
                  : 'text-muted-foreground'

              return (
                <Card
                  key={step.id}
                  className={`bg-card/80 backdrop-blur-sm border-white/10 ${
                    step.passed ? 'border-emerald-500/20' : step.passed === false ? 'border-red-500/20' : ''
                  }`}
                >
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-xs font-semibold">{step.name}</CardTitle>
                      </div>
                      {step.passed === true && <Check className="h-4 w-4 text-emerald-400" />}
                      {step.passed === false && <X className="h-4 w-4 text-red-400" />}
                      {step.passed === null && <AlertTriangle className="h-4 w-4 text-muted-foreground/40" />}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex flex-col gap-3">
                    {/* Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold font-mono">{step.score ?? '—'}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] border-0 ${
                          step.passed === true
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : step.passed === false
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-white/10 text-muted-foreground'
                        }`}
                      >
                        {step.passed === true ? 'PASS' : step.passed === false ? 'FAIL' : 'PENDING'}
                      </Badge>
                    </div>

                    {/* Findings */}
                    <div className="max-h-24 overflow-y-auto custom-scrollbar">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">Findings</p>
                      {step.findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-1 mb-0.5">
                          <Check className="h-2.5 w-2.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-[10px] text-muted-foreground leading-tight">{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    {step.suggestions.length > 0 && (
                      <div className="max-h-20 overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-semibold text-amber-400 mb-1">Suggestions</p>
                        {step.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-1 mb-0.5">
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-400 mt-0.5 shrink-0" />
                            <span className="text-[10px] text-muted-foreground leading-tight">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Schema JSON-LD expandable */}
                    {step.id === 'schema' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-full text-[10px] text-muted-foreground"
                          onClick={() => setSchemaExpanded(!schemaExpanded)}
                        >
                          {schemaExpanded ? 'Hide' : 'Show'} JSON-LD
                        </Button>
                        {schemaExpanded && (
                          <pre className="text-[9px] text-emerald-400 bg-black/30 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar font-mono">
{`{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "AI Visibility for Dentists",
  "author": { "@type": "Organization", "name": "Seosights" },
  "datePublished": "${new Date().toISOString().split('T')[0]}"
}`}
                          </pre>
                        )}
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 flex-1 text-[10px] border-white/10"
                        onClick={() => handleRunReview(step.id)}
                        disabled={runningStep === step.id}
                      >
                        {runningStep === step.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Run Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 flex-1 text-[10px] border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => handleAutoFix(step.id)}
                        disabled={fixingStep === step.id}
                      >
                        {fixingStep === step.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Wrench className="h-3 w-3 mr-1" />
                        )}
                        Auto-Fix
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}
