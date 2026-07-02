'use client'

/**
 * AI Writer — Content generation and editing interface
 *
 * Select a brief, generate content, edit, and submit for review.
 * Includes Content Factory for multi-format generation.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PenTool,
  Sparkles,
  Save,
  Send,
  RotateCcw,
  Loader2,
  FileText,
  BookOpen,
  Hash,
  Database,
  Target,
  CheckCircle2,
  Linkedin,
  Twitter,
  Mail,
  Layout,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

interface Brief {
  id: string
  title: string
  keyword: string
  secondaryKeywords: string[]
  entityTargets: string[]
  dataSources: string[]
  targetWordCount: number
  status: 'approved' | 'draft'
}

interface ArticleDraft {
  id: string
  briefId: string
  content: string
  wordCount: number
  targetWordCount: number
}

interface ContentFactoryOutput {
  type: 'blog' | 'programmatic' | 'linkedin' | 'twitter' | 'newsletter'
  status: 'pending' | 'generating' | 'done'
  label: string
  icon: React.ElementType
}

interface WriterData {
  briefs: Brief[]
  currentDraft: ArticleDraft | null
  factoryOutputs: ContentFactoryOutput[]
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK_BRIEFS: Brief[] = [
  {
    id: '1',
    title: 'AI Visibility for Dentists',
    keyword: 'AI Visibility for Dentists',
    secondaryKeywords: ['LLM SEO dental', 'AI search dental practice', 'ChatGPT dentist visibility'],
    entityTargets: ['Dental SEO', 'AI Visibility', 'Seosights'],
    dataSources: ['AI Twin Analysis', 'Opportunity Queue', 'Citation Database'],
    targetWordCount: 2500,
    status: 'approved',
  },
  {
    id: '2',
    title: 'LLM SEO vs Traditional SEO',
    keyword: 'LLM SEO vs Traditional SEO',
    secondaryKeywords: ['LLM optimization', 'AI search ranking', 'GEO vs SEO'],
    entityTargets: ['LLM SEO', 'Traditional SEO', 'AI Optimization'],
    dataSources: ['AI Twin Analysis', 'Competitor Analysis'],
    targetWordCount: 3000,
    status: 'approved',
  },
  {
    id: '3',
    title: 'Citation Building Strategy',
    keyword: 'Citation Building Strategy',
    secondaryKeywords: ['AI citation', 'entity citation', 'knowledge graph citation'],
    entityTargets: ['Citation Building', 'Knowledge Graph', 'Seosights'],
    dataSources: ['Citation Database', 'Replay Analysis'],
    targetWordCount: 2000,
    status: 'approved',
  },
]

const FALLBACK_DRAFT: ArticleDraft = {
  id: 'd1',
  briefId: '1',
  content: `# AI Visibility for Dentists: The Complete Guide to Getting Found by AI Search

## Why AI Visibility Matters for Dental Practices

The landscape of search is undergoing a fundamental shift. While traditional Google Search still drives significant traffic, an increasing number of patients are turning to AI assistants like ChatGPT, Claude, and Gemini for recommendations — including finding a dentist.

**Key insight**: 67% of patients under 35 now use AI-powered search to find local healthcare providers, including dentists. If your dental practice isn't visible in AI search results, you're invisible to a growing segment of potential patients.

## Understanding AI Visibility in Dental SEO

AI Visibility refers to how prominently your dental practice appears when patients ask AI assistants for recommendations. Unlike traditional SEO, which focuses on ranking in Google's 10 blue links, AI Visibility focuses on being cited and recommended by language models.

### How AI Models Find and Recommend Dentists

AI models like ChatGPT and Gemini don't crawl the web in real-time. Instead, they rely on:

1. **Training data** — Information ingested during model training
2. **Retrieval-augmented generation (RAG)** — Real-time search results fed into the model
3. **Structured data** — Schema markup and entity relationships
4. **Citations and mentions** — References from authoritative sources

## The AI Visibility Framework for Dentists

### Step 1: Entity Optimization

Ensure your practice is properly defined as a dental entity:

- Use **LocalBusiness** schema with \`medicalSpecialty\` set to Dentistry
- Add **Dentist** schema from schema.org
- Include NAP (Name, Address, Phone) consistently across all platforms

### Step 2: Citation Building

Build citations on platforms that AI models trust:

- Wikipedia (if notable enough)
- Healthgrades and Zocdoc
- ADA (American Dental Association) directories
- Local medical directories
- Reddit and Quora mentions

### Step 3: Content Strategy

Create content that AI models are likely to cite:

- Comprehensive guides on dental procedures
- FAQ pages addressing common patient questions
- Before/after galleries with descriptive alt text
- Educational blog posts on oral health

### Step 4: Technical Optimization

- Deploy \`/llms.txt\` for AI crawler access
- Implement FAQ schema markup
- Use \`Organization\` and \`MedicalBusiness\` structured data
- Ensure mobile-first indexing compliance

## Measuring Your AI Visibility

Track your practice's AI Visibility using Seosights' comprehensive dashboard:

- **AI Score**: Overall visibility across AI engines (0-100)
- **Citation Count**: How often AI assistants mention your practice
- **Engine Coverage**: ChatGPT, Claude, Gemini, Perplexity presence
- **Score Delta**: Week-over-week improvement tracking

## Case Study: Downtown Dental Clinic

Downtown Dental Clinic implemented the AI Visibility framework and saw:

- **+18 AI Score** improvement in 30 days
- **ChatGPT citations** increased from 0 to 4 per week
- **Gemini recommendations** started appearing for "best dentist near me"
- **Patient inquiries** from AI search increased 23%

## Conclusion

AI Visibility is no longer optional for dental practices. As patients increasingly rely on AI assistants for recommendations, practices that invest in AI Visibility today will have a significant competitive advantage tomorrow.

Start with entity optimization, build authoritative citations, create comprehensive content, and measure your results with Seosights. Your future patients are asking AI — make sure AI knows about you.`,
  wordCount: 582,
  targetWordCount: 2500,
}

const FALLBACK_FACTORY: ContentFactoryOutput[] = [
  { type: 'blog', status: 'done', label: 'Blog Post', icon: FileText },
  { type: 'programmatic', status: 'done', label: 'Programmatic Pages', icon: Layout },
  { type: 'linkedin', status: 'generating', label: 'LinkedIn Post', icon: Linkedin },
  { type: 'twitter', status: 'pending', label: 'Twitter Thread', icon: Twitter },
  { type: 'newsletter', status: 'pending', label: 'Newsletter', icon: Mail },
]

// ── Animation ───────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ───────────────────────────────────────────────────────────

export default function AIWriter() {
  const [briefs, setBriefs] = useState<Brief[]>(FALLBACK_BRIEFS)
  const [selectedBriefId, setSelectedBriefId] = useState<string>(FALLBACK_BRIEFS[0].id)
  const [draft, setDraft] = useState<ArticleDraft>(FALLBACK_DRAFT)
  const [factoryOutputs, setFactoryOutputs] = useState<ContentFactoryOutput[]>(FALLBACK_FACTORY)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/client-zero/content-engine/briefs').then((r) => r.json()).catch(() => ({ briefs: FALLBACK_BRIEFS })),
      fetch('/api/client-zero/content-engine/articles').then((r) => r.json()).catch(() => ({ draft: FALLBACK_DRAFT, factoryOutputs: FALLBACK_FACTORY })),
    ])
      .then(([briefsData, articlesData]) => {
        if (!cancelled) {
          if (briefsData.briefs) setBriefs(briefsData.briefs)
          if (articlesData.draft) setDraft(articlesData.draft)
          if (articlesData.factoryOutputs) setFactoryOutputs(articlesData.factoryOutputs)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const selectedBrief = briefs.find((b) => b.id === selectedBriefId) || briefs[0]
  const wordProgress = draft ? Math.round((draft.wordCount / draft.targetWordCount) * 100) : 0

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/client-zero/content-engine/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId: selectedBriefId, action: 'generate' }),
      })
      const json = await res.json()
      if (json.draft) setDraft(json.draft)
    } catch {
      // keep existing
    }
    setTimeout(() => setGenerating(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 800)
  }

  const handleSubmitReview = async () => {
    setSubmitting(true)
    setTimeout(() => setSubmitting(false), 1000)
  }

  const handleGenerateAll = async () => {
    setGeneratingAll(true)
    // Simulate sequential generation
    const updated = [...factoryOutputs]
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'done') {
        updated[i] = { ...updated[i], status: 'generating' }
        setFactoryOutputs([...updated])
        await new Promise((r) => setTimeout(r, 600))
        updated[i] = { ...updated[i], status: 'done' }
        setFactoryOutputs([...updated])
      }
    }
    setGeneratingAll(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
            <CardContent className="p-6 h-96" />
          </Card>
        </div>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
          <CardContent className="p-6 h-96" />
        </Card>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Brief Selector ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <PenTool className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">AI Writer</h3>
        <Select value={selectedBriefId} onValueChange={setSelectedBriefId}>
          <SelectTrigger className="h-8 w-72 text-xs bg-card/80 border-white/10">
            <SelectValue placeholder="Select a brief..." />
          </SelectTrigger>
          <SelectContent>
            {briefs.filter((b) => b.status === 'approved').map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="lg:col-span-2">
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{selectedBrief.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-white/10"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    {generating ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-white/10"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleSubmitReview}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                    Submit for Review
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[500px] w-full">
                <div className="prose prose-invert prose-sm max-w-none">
                  {draft.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-0 mb-3">{line.slice(2)}</h1>
                    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-emerald-400">{line.slice(3)}</h2>
                    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-1.5">{line.slice(4)}</h3>
                    if (line.startsWith('- ')) return <li key={i} className="text-sm ml-4 text-muted-foreground">{line.slice(2)}</li>
                    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold my-1">{line.slice(2, -2)}</p>
                    if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) return <li key={i} className="text-sm ml-4 text-muted-foreground">{line}</li>
                    if (line.trim() === '') return <br key={i} />
                    return <p key={i} className="text-sm text-muted-foreground my-1">{line}</p>
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Target Keyword */}
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-muted-foreground">Target Keyword</span>
              </div>
              <p className="text-sm font-medium">{selectedBrief.keyword}</p>
            </CardContent>
          </Card>

          {/* Secondary Keywords */}
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-muted-foreground">Secondary Keywords</span>
              </div>
              <div className="flex flex-col gap-1">
                {selectedBrief.secondaryKeywords.map((kw) => (
                  <span key={kw} className="text-xs text-muted-foreground">• {kw}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Entity Targets */}
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-semibold text-muted-foreground">Entity Targets</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedBrief.entityTargets.map((ent) => (
                  <Badge key={ent} variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">
                    {ent}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold text-muted-foreground">Data Sources</span>
              </div>
              <div className="flex flex-col gap-1">
                {selectedBrief.dataSources.map((ds) => (
                  <div key={ds} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">{ds}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Word Count */}
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Word Count</span>
                <span className="text-xs text-muted-foreground">
                  {draft.wordCount} / {draft.targetWordCount}
                </span>
              </div>
              <Progress value={wordProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">{wordProgress}% complete</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Content Factory ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm">Content Factory</CardTitle>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleGenerateAll}
                disabled={generatingAll}
              >
                {generatingAll ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Generate All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {factoryOutputs.map((output) => {
                const Icon = output.icon
                const statusColor =
                  output.status === 'done'
                    ? 'border-emerald-500/30 text-emerald-400'
                    : output.status === 'generating'
                      ? 'border-amber-500/30 text-amber-400'
                      : 'border-white/10 text-muted-foreground'
                const statusLabel =
                  output.status === 'done'
                    ? 'Ready'
                    : output.status === 'generating'
                      ? 'Generating...'
                      : 'Pending'
                return (
                  <div
                    key={output.type}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${statusColor}`}
                  >
                    {output.status === 'generating' ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                    <span className="text-xs font-medium">{output.label}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 border-0 ${
                        output.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : output.status === 'generating'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/10 text-muted-foreground'
                      }`}
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
