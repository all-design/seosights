'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  MessageSquare,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type Status = 'Mentioned' | 'Cited' | 'Not Mentioned' | 'Partial'
type Sentiment = 'positive' | 'neutral' | 'negative'
type ModelKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

interface ModelResult {
  rank: number | null // null = not mentioned
  status: Status
  sentiment: Sentiment
  history: (number | null)[] // 4 weeks of ranks
}

interface PromptResult {
  id: string
  text: string
  models: Record<ModelKey, ModelResult>
}

// ── Preset prompts (hardcoded realistic mock data) ─────────────
const PRESET_PROMPTS: PromptResult[] = [
  { id: 'p1', text: 'best SEO tools', models: {
    chatgpt: { rank: 3, status: 'Cited', sentiment: 'positive', history: [7, 5, 4, 3] },
    claude: { rank: 5, status: 'Mentioned', sentiment: 'neutral', history: [null, 8, 6, 5] },
    gemini: { rank: 2, status: 'Cited', sentiment: 'positive', history: [6, 4, 3, 2] },
    perplexity: { rank: 1, status: 'Cited', sentiment: 'positive', history: [4, 3, 2, 1] } } },
  { id: 'p2', text: 'how to optimize for AI search', models: {
    chatgpt: { rank: 4, status: 'Mentioned', sentiment: 'positive', history: [8, 7, 6, 4] },
    claude: { rank: 2, status: 'Cited', sentiment: 'positive', history: [5, 4, 3, 2] },
    gemini: { rank: 6, status: 'Partial', sentiment: 'neutral', history: [9, 8, 7, 6] },
    perplexity: { rank: 3, status: 'Cited', sentiment: 'positive', history: [7, 5, 4, 3] } } },
  { id: 'p3', text: 'what is AEO', models: {
    chatgpt: { rank: 6, status: 'Partial', sentiment: 'neutral', history: [10, 9, 8, 6] },
    claude: { rank: null, status: 'Not Mentioned', sentiment: 'neutral', history: [null, null, null, null] },
    gemini: { rank: 4, status: 'Mentioned', sentiment: 'positive', history: [7, 6, 5, 4] },
    perplexity: { rank: 5, status: 'Mentioned', sentiment: 'neutral', history: [9, 8, 7, 5] } } },
  { id: 'p4', text: 'top GEO software', models: {
    chatgpt: { rank: 2, status: 'Cited', sentiment: 'positive', history: [5, 4, 3, 2] },
    claude: { rank: 4, status: 'Mentioned', sentiment: 'positive', history: [8, 7, 6, 4] },
    gemini: { rank: 3, status: 'Cited', sentiment: 'positive', history: [6, 5, 4, 3] },
    perplexity: { rank: 2, status: 'Cited', sentiment: 'positive', history: [4, 3, 3, 2] } } },
  { id: 'p5', text: 'AI visibility checker', models: {
    chatgpt: { rank: 1, status: 'Cited', sentiment: 'positive', history: [3, 2, 2, 1] },
    claude: { rank: 3, status: 'Cited', sentiment: 'positive', history: [6, 5, 4, 3] },
    gemini: { rank: 7, status: 'Partial', sentiment: 'neutral', history: [10, 9, 8, 7] },
    perplexity: { rank: 2, status: 'Cited', sentiment: 'positive', history: [5, 4, 3, 2] } } },
  { id: 'p6', text: 'llms.txt generator', models: {
    chatgpt: { rank: 1, status: 'Cited', sentiment: 'positive', history: [2, 2, 1, 1] },
    claude: { rank: 2, status: 'Cited', sentiment: 'positive', history: [4, 3, 2, 2] },
    gemini: { rank: null, status: 'Not Mentioned', sentiment: 'neutral', history: [null, null, 10, null] },
    perplexity: { rank: 1, status: 'Cited', sentiment: 'positive', history: [3, 2, 1, 1] } } },
]

// ── Model columns config (NO indigo/blue — purple, emerald, cyan, amber) ──
const MODELS: { key: ModelKey; label: string }[] = [
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'claude', label: 'Claude' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'perplexity', label: 'Perplexity' },
]

const STATUS_STYLES: Record<Status, string> = {
  Cited: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  Mentioned: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  Partial: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Not Mentioned': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
}

function rankColor(rank: number | null): string {
  if (rank === null) return 'text-slate-500'
  if (rank <= 3) return 'text-emerald-300'
  if (rank <= 6) return 'text-amber-300'
  return 'text-rose-300'
}

// ── Sentiment icon ─────────────────────────────────────────────
function SentimentIcon({ sentiment }: { sentiment: Sentiment }) {
  if (sentiment === 'positive')
    return <TrendingUp className="w-3 h-3 text-emerald-400" aria-label="positive" />
  if (sentiment === 'negative')
    return <TrendingDown className="w-3 h-3 text-rose-400" aria-label="negative" />
  return <Minus className="w-3 h-3 text-slate-400" aria-label="neutral" />
}

// ── Sparkline (4-week trend, lower rank = up on chart) ─────────
function Sparkline({
  data,
  color = '#a855f7',
  width = 140,
  height = 40,
}: {
  data: (number | null)[]
  color?: string
  width?: number
  height?: number
}) {
  const maxRank = 11 // 10 + 1 for "not mentioned"
  const points = data.map((d, i) => {
    const rank = d === null ? maxRank : d
    const x = data.length > 1 ? (i / (data.length - 1)) * width : 0
    const y = (rank / maxRank) * height
    return { x, y, isNull: d === null }
  })
  const valid = points.filter((p) => !p.isNull)
  if (valid.length === 0) {
    return <div className="text-[10px] text-slate-500 italic">no data yet</div>
  }
  let path = ''
  valid.forEach((p, i) => {
    path += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`
  })
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      {valid.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
      ))}
    </svg>
  )
}

// ── Random mock data generator for user-added prompts ──────────
function generateMockResult(text: string): PromptResult {
  const sentiments: Sentiment[] = ['positive', 'neutral', 'negative']
  const make = (): ModelResult => {
    if (Math.random() < 0.25) {
      return { rank: null, status: 'Not Mentioned', sentiment: 'neutral', history: [null, null, null, null] }
    }
    const rank = Math.floor(Math.random() * 10) + 1
    const status: Status = rank <= 2 ? 'Cited' : rank <= 5 ? 'Mentioned' : 'Partial'
    const history: (number | null)[] = []
    let r = rank
    for (let i = 0; i < 4; i++) {
      if (Math.random() < 0.15) {
        history.push(null)
      } else {
        r = Math.min(10, Math.max(1, r + Math.floor(Math.random() * 5) - 2))
        history.push(r)
      }
    }
    history[3] = rank
    return { rank, status, sentiment: sentiments[Math.floor(Math.random() * 3)], history }
  }
  return {
    id: `custom-${Date.now()}`,
    text,
    models: { chatgpt: make(), claude: make(), gemini: make(), perplexity: make() },
  }
}

// ── Animation variants ─────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ── Main component ─────────────────────────────────────────────
export default function PromptRankTracker({ url }: { url?: string }) {
  const [prompts, setPrompts] = useState<PromptResult[]>(PRESET_PROMPTS)
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const text = input.trim()
    if (!text) return
    setPrompts((prev) => [generateMockResult(text), ...prev])
    setInput('')
  }

  const summary = useMemo(() => {
    const allResults: ModelResult[] = []
    prompts.forEach((p) => Object.values(p.models).forEach((r) => allResults.push(r)))
    const mentioned = allResults.filter((r) => r.rank !== null)
    const avgRank = mentioned.length > 0
      ? mentioned.reduce((s, r) => s + (r.rank as number), 0) / mentioned.length
      : 0
    const mentionRate = allResults.length > 0 ? (mentioned.length / allResults.length) * 100 : 0
    const trend: (number | null)[] = [0, 1, 2, 3].map((weekIdx) => {
      const weekRanks = allResults.map((r) => r.history[weekIdx]).filter((v): v is number => v !== null)
      return weekRanks.length > 0
        ? Math.round((weekRanks.reduce((a, b) => a + b, 0) / weekRanks.length) * 10) / 10
        : null
    })
    return { avgRank, mentionRate, trend }
  }, [prompts])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* ── Header card + Add Prompt input ─────────────────── */}
      <motion.div variants={item}>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-2.5 shrink-0">
                <Target className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 flex-wrap">
                  AI Prompt Rank Tracker
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" />
                    Beta
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  See where you rank when users ask AI models about your industry
                  {url ? (
                    <span className="text-purple-300">
                      {' '}· tracking{' '}
                      <span className="font-mono text-[12px]">{url}</span>
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                placeholder="Add a prompt to track — e.g. 'best CRM for startups 2025'"
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
              <Button onClick={handleAdd} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border border-purple-500/30">
                <Plus className="w-4 h-4" />
                Add Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Prompt rows ────────────────────────────────────── */}
      {prompts.map((prompt) => {
        const ranks = Object.values(prompt.models).map((m) => m.rank).filter((r): r is number => r !== null)
        const promptAvg = ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null
        return (
          <motion.div key={prompt.id} variants={item}>
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:border-purple-500/30 transition-colors">
              <CardContent className="pt-5 pb-5">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,1fr))] gap-2.5 lg:gap-3 items-stretch">
                  {/* Prompt text cell */}
                  <div className="flex items-start justify-between gap-2 lg:flex-col lg:justify-between lg:pr-3 lg:border-r lg:border-white/10">
                    <div className="flex items-start gap-2 min-w-0">
                      <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-foreground break-words">{prompt.text}</span>
                    </div>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground text-[10px] shrink-0">
                      {promptAvg !== null ? `avg #${promptAvg.toFixed(1)}` : 'not tracked'}
                    </Badge>
                  </div>

                  {/* 4 model columns */}
                  {MODELS.map((m) => {
                    const r = prompt.models[m.key]
                    return (
                      <div
                        key={m.key}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-2"
                      >
                        <div className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-0.5 min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                            {m.label}
                          </span>
                          <span
                            className={`text-xl font-bold leading-none ${rankColor(r.rank)}`}
                          >
                            {r.rank !== null ? `#${r.rank}` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end lg:flex-row lg:items-center lg:gap-1.5 gap-1">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${STATUS_STYLES[r.status]}`}
                          >
                            {r.status}
                          </Badge>
                          <SentimentIcon sentiment={r.sentiment} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}

      {/* ── Summary footer ─────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Avg Rank
                  </div>
                  <div className="text-2xl font-bold text-purple-200">
                    #{summary.avgRank.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    across all models
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10 hidden sm:block" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Mention Rate
                  </div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {summary.mentionRate.toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {prompts.length} prompts · 4 models
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  4-Week Trend
                </div>
                <Sparkline
                  data={summary.trend}
                  color="#a855f7"
                  width={160}
                  height={44}
                />
                <div className="text-[11px] text-muted-foreground">
                  lower rank = better
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
