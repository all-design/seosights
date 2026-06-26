'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Eye,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Quote,
} from 'lucide-react'

// ── Sample content (pre-filled) ────────────────────────────────
const SAMPLE_CONTENT = `# How to Optimize Your Content for AI Search in 2025

The way people search is changing fast. By 2025, more than 60% of information queries will be answered by AI engines like ChatGPT, Claude, Perplexity, and Gemini — without the user ever clicking through to a website. This shift from traditional SEO to AI Search Optimization is the most significant change in search since Google launched in 1998.

## What is AEO?

Answer Engine Optimization (AEO) is the practice of structuring your content so AI models can read it, understand it, and cite it when answering user questions. Unlike traditional SEO, which targets rankings on a search engine results page, AEO targets inclusion in AI-generated answers.

## What is GEO?

Generative Engine Optimization (GEO) goes one step further. It optimizes content for the next generation of AI search engines — Perplexity, Google's AI Overviews, Microsoft Copilot, and others. GEO focuses on entity clarity, structured data, and brand mentions across the web.

## Three Foundations of AI Search Visibility

1. **Structured Data**: Use schema markup (JSON-LD) so AI crawlers can parse your content unambiguously.
2. **Entity Clarity**: Define key terms explicitly. AI models prefer content where entities are named, defined, and connected.
3. **Crawlability**: Make sure your robots.txt allows GPTBot, ClaudeBot, and PerplexityBot. Many sites accidentally block AI crawlers.

## Why Most Sites Are Invisible to AI

The biggest problem we see is that 71% of enterprise websites block at least one major AI crawler in their robots.txt. Even when content is excellent, if the crawler cannot read it, the AI cannot cite it. Publishing an llms.txt file at your site root is one of the highest-impact fixes you can make this quarter.`

// ── Types ──────────────────────────────────────────────────────
type Sentiment = 'positive' | 'neutral' | 'negative'
type ModelKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

interface ModelAnalysis {
  summary: string
  entities: string[]
  citationLikelihood: number
  sentiment: Sentiment
  snippet: string
}

interface Suggestion {
  tip: string
  priority: 'high' | 'medium' | 'low'
}

interface SimulationResult {
  models: Record<ModelKey, ModelAnalysis>
  suggestions: Suggestion[]
}

// ── Pre-computed mock analysis (matches sample content) ─────────
const MOCK_RESULT: SimulationResult = {
  models: {
    chatgpt: {
      summary:
        'This article explains the shift from traditional SEO toward AI Search Optimization, framing AEO and GEO as complementary disciplines. The author defines key terms, lists three foundational pillars (structured data, entity clarity, crawlability), and quantifies the problem of AI crawler blocking.',
      entities: ['AI Search', 'AEO', 'GEO', 'Schema Markup', 'Structured Data', 'llms.txt', 'Crawlability'],
      citationLikelihood: 78,
      sentiment: 'positive',
      snippet:
        '"Answer Engine Optimization (AEO) is the practice of structuring your content so AI models can read it, understand it, and cite it when answering user questions." [Source: provided content]',
    },
    claude: {
      summary:
        'The piece frames AEO and GEO as a strategic evolution of SEO, not a replacement. It draws a clean distinction between ranking-based optimization and citation-based optimization, and grounds the discussion in three concrete technical foundations: structured data, entity clarity, and crawlability.',
      entities: ['AEO', 'GEO', 'SEO', 'Structured Data', 'Entity', 'Crawlability', 'llms.txt'],
      citationLikelihood: 72,
      sentiment: 'neutral',
      snippet:
        'According to the source, "Generative Engine Optimization (GEO) goes one step further" by optimizing for the next generation of AI search engines, with emphasis on entity clarity and brand mentions across the web.',
    },
    gemini: {
      summary:
        'Content addresses AI Search Optimization with a 2025 forward-looking frame and a 60% adoption statistic. Three foundations are enumerated: structured data (JSON-LD), entity clarity, and crawlability. The 71% crawler-blocking figure is the strongest citable data point for synthesized answer extraction.',
      entities: ['AI Search', 'AEO', 'GEO', 'JSON-LD', 'Schema Markup', 'GPTBot', 'ClaudeBot', 'PerplexityBot'],
      citationLikelihood: 81,
      sentiment: 'neutral',
      snippet:
        '> 71% of enterprise websites block at least one major AI crawler in their robots.txt. Even when content is excellent, if the crawler cannot read it, the AI cannot cite it.',
    },
    perplexity: {
      summary:
        'Source discusses AI search readiness and would be cited for queries such as "how to optimize content for AI search engines" or "what is the difference between AEO and GEO". The content provides definitional clarity on AEO vs GEO and lists three actionable foundations with a quantified problem statement.',
      entities: ['AI Search', 'AEO', 'GEO', 'Schema Markup', 'llms.txt', 'Knowledge Graph', 'Entity', 'Citation'],
      citationLikelihood: 84,
      sentiment: 'positive',
      snippet:
        '[1] "By 2025, more than 60% of information queries will be answered by AI engines like ChatGPT, Claude, Perplexity, and Gemini — without the user ever clicking through to a website." — cited from user-submitted content',
    },
  },
  suggestions: [
    {
      tip: 'Add an FAQ section with 4-6 question-answer pairs and wrap them in FAQPage schema markup so models can extract direct answer snippets.',
      priority: 'high',
    },
    {
      tip: 'Embed JSON-LD structured data (Article + Organization + DefinedTerm schema) so AI crawlers can parse entities unambiguously.',
      priority: 'high',
    },
    {
      tip: 'Cite primary sources for the 60% and 71% statistics — AI engines reward quantifiable claims backed by research with higher citation rates.',
      priority: 'medium',
    },
    {
      tip: 'Add a "Last updated: January 2025" timestamp and author byline to strengthen E-E-A-T signals evaluated by AI answer engines.',
      priority: 'medium',
    },
  ],
}

// ── Model metadata (brand-tinted accents; purple remains primary) ──
type ModelMeta = { label: string; accent: string; ring: string; dot: string; tint: string }
const MODEL_META: Record<ModelKey, ModelMeta> = {
  chatgpt: { label: 'ChatGPT', accent: 'text-emerald-400', ring: 'border-emerald-500/30', dot: 'bg-emerald-500', tint: 'data-[state=active]:bg-emerald-500/10' },
  claude: { label: 'Claude', accent: 'text-amber-400', ring: 'border-amber-500/30', dot: 'bg-amber-500', tint: 'data-[state=active]:bg-amber-500/10' },
  gemini: { label: 'Gemini', accent: 'text-teal-400', ring: 'border-teal-500/30', dot: 'bg-teal-500', tint: 'data-[state=active]:bg-teal-500/10' },
  perplexity: { label: 'Perplexity', accent: 'text-cyan-400', ring: 'border-cyan-500/30', dot: 'bg-cyan-500', tint: 'data-[state=active]:bg-cyan-500/10' },
}

const MODEL_ORDER: ModelKey[] = ['chatgpt', 'claude', 'gemini', 'perplexity']

// ── Color helpers ──────────────────────────────────────────────
function getCitationTone(score: number): { bar: string; text: string; bg: string } {
  if (score > 70) return { bar: '[&_[data-slot=progress-indicator]]:bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (score >= 40) return { bar: '[&_[data-slot=progress-indicator]]:bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' }
  return { bar: '[&_[data-slot=progress-indicator]]:bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' }
}

function getSentimentBadge(s: Sentiment): { label: string; className: string } {
  if (s === 'positive') return { label: 'Positive', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
  if (s === 'negative') return { label: 'Negative', className: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }
  return { label: 'Neutral', className: 'bg-slate-500/10 text-slate-300 border-slate-500/30' }
}

function getPriorityBadge(p: Suggestion['priority']): { label: string; className: string; icon: typeof AlertTriangle } {
  if (p === 'high') return { label: 'High', className: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: AlertTriangle }
  if (p === 'medium') return { label: 'Medium', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Lightbulb }
  return { label: 'Low', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 }
}

// ── Model result panel ─────────────────────────────────────────
function ModelResult({ analysis, modelKey }: { analysis: ModelAnalysis; modelKey: ModelKey }) {
  const meta = MODEL_META[modelKey]
  const tone = getCitationTone(analysis.citationLikelihood)
  const sentiment = getSentimentBadge(analysis.sentiment)

  // Animate progress from 0 → score on mount
  const [animatedScore, setAnimatedScore] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimatedScore(analysis.citationLikelihood), 80)
    return () => clearTimeout(t)
  }, [analysis.citationLikelihood])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Summary */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Summary
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Entities */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Key Entities Extracted
        </div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.entities.map((entity) => (
            <Badge
              key={entity}
              variant="outline"
              className="bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10"
            >
              {entity}
            </Badge>
          ))}
        </div>
      </div>

      {/* Citation likelihood + sentiment */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="space-y-2 sm:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Citation Likelihood
            </span>
            <span className={`text-sm font-bold ${tone.text}`}>
              {analysis.citationLikelihood}%
            </span>
          </div>
          <Progress value={animatedScore} className={`h-2.5 ${tone.bar}`} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sentiment
          </span>
          <div>
            <Badge variant="outline" className={sentiment.className}>
              {sentiment.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Snippet */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Quote className="w-3.5 h-3.5 text-purple-400" />
          Potential Answer Snippet
        </div>
        <div className={`whitespace-pre-wrap break-words rounded-lg border ${meta.ring} bg-black/40 px-3 py-2.5 ${meta.accent} font-mono text-xs leading-relaxed`}>
          {analysis.snippet}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function AIContentSimulator({ url }: { url?: string }) {
  const [content, setContent] = useState(SAMPLE_CONTENT)
  const [isSimulating, setIsSimulating] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [activeModel, setActiveModel] = useState<ModelKey>('chatgpt')
  const [result, setResult] = useState<SimulationResult | null>(null)

  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const maxChars = 10000

  const handleSimulate = () => {
    if (!content.trim() || isSimulating) return
    setIsSimulating(true)
    setHasResult(false)
    // Simulate model inference (1.5s)
    window.setTimeout(() => {
      setResult(MOCK_RESULT)
      setHasResult(true)
      setIsSimulating(false)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
          <FileText className="w-5 h-5 text-purple-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
            AI Content Simulator
            {url && (
              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                <Eye className="w-3 h-3" />
                URL mode
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preview how AI models read and cite your content
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input */}
        <Card className="border-white/10 bg-white/[0.02] backdrop-blur-sm">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-foreground">Your content</label>
              <span className={`text-xs ${charCount > maxChars ? 'text-rose-400' : 'text-muted-foreground'}`}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars · {wordCount} words
              </span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
              placeholder="Paste your blog post, article, or product description here…"
              className="min-h-[320px] resize-y bg-black/30 border-white/10 text-sm leading-relaxed font-mono"
              disabled={isSimulating}
            />
            <Button
              onClick={handleSimulate}
              disabled={isSimulating || !content.trim()}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white border-0"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Simulating AI models…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Simulate
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground/70 text-center">
              Runs against 4 AI models. No data leaves your browser in this demo.
            </p>
          </CardContent>
        </Card>

        {/* Right: Output */}
        <Card className="border-white/10 bg-white/[0.02] backdrop-blur-sm">
          <CardContent className="pt-5 space-y-4">
            {(!hasResult || isSimulating) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[360px] text-center gap-3 px-6"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                    <p className="text-sm text-muted-foreground">Analyzing across 4 AI models…</p>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Click <span className="text-purple-400 font-semibold">Simulate</span> to see how ChatGPT, Claude, Gemini, and Perplexity would summarize and cite your content.
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {hasResult && result && (
              <Tabs value={activeModel} onValueChange={(v) => setActiveModel(v as ModelKey)}>
                <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-4 h-auto p-1 gap-1">
                  {MODEL_ORDER.map((key) => {
                    const meta = MODEL_META[key]
                    const isActive = activeModel === key
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className={`flex flex-col items-center gap-1 py-2 px-1 h-auto border border-transparent ${meta.tint} ${
                          isActive ? meta.accent : 'text-muted-foreground'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span className="text-[11px] font-medium">{meta.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                {MODEL_ORDER.map((key) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    {activeModel === key && (
                      <ModelResult analysis={result.models[key]} modelKey={key} />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Optimization suggestions */}
      <AnimatePresence>
        {hasResult && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-foreground">Optimization Suggestions</h4>
                  <span className="text-xs text-muted-foreground">
                    · {result.suggestions.length} actionable tips
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suggestions.map((s, i) => {
                    const priority = getPriorityBadge(s.priority)
                    const Icon = priority.icon
                    return (
                      <motion.div
                        key={s.tip}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${
                            s.priority === 'high' ? 'text-rose-400' : s.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                          }`} />
                          <Badge variant="outline" className={priority.className}>
                            {priority.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground/85 leading-relaxed">{s.tip}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
