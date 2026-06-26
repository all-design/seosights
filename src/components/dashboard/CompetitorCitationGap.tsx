'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Swords,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type ModelKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot'

interface CompetitorRow {
  domain: string
  isYou: boolean
  citations: Record<ModelKey, number>
}

type InsightType = 'gap' | 'strength' | 'risk' | 'opportunity'
type Severity = 'rose' | 'amber' | 'emerald'

interface Insight {
  type: InsightType
  message: string
  severity: Severity
}

// ── Mock Data ────────────────────────────────────────────────────
const AI_MODELS: { key: ModelKey; label: string; color: string }[] = [
  { key: 'chatgpt', label: 'ChatGPT', color: 'text-emerald-400' },
  { key: 'claude', label: 'Claude', color: 'text-amber-400' },
  { key: 'gemini', label: 'Gemini', color: 'text-cyan-400' },
  { key: 'perplexity', label: 'Perplexity', color: 'text-purple-400' },
  { key: 'copilot', label: 'Copilot', color: 'text-rose-400' },
]

function getMockCompetitors(url?: string): CompetitorRow[] {
  const youDomain = url
    ? url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
    : 'yoursite.com'
  return [
    { domain: youDomain, isYou: true, citations: { chatgpt: 47, claude: 31, gemini: 28, perplexity: 89, copilot: 0 } },
    { domain: 'ahrefs.com', isYou: false, citations: { chatgpt: 142, claude: 96, gemini: 78, perplexity: 134, copilot: 67 } },
    { domain: 'semrush.com', isYou: false, citations: { chatgpt: 118, claude: 88, gemini: 64, perplexity: 78, copilot: 58 } },
    { domain: 'surferseo.com', isYou: false, citations: { chatgpt: 76, claude: 54, gemini: 41, perplexity: 67, copilot: 35 } },
    { domain: 'fractle.com', isYou: false, citations: { chatgpt: 38, claude: 22, gemini: 18, perplexity: 45, copilot: 12 } },
  ]
}

const INSIGHTS: Insight[] = [
  { type: 'gap', message: "You're cited 3x less than Ahrefs on ChatGPT", severity: 'rose' },
  { type: 'strength', message: 'Strong on Perplexity — 2nd most cited', severity: 'emerald' },
  { type: 'risk', message: 'Missing entirely from Copilot', severity: 'rose' },
  { type: 'opportunity', message: 'Claude cites competitors 2x more than you', severity: 'amber' },
]

// ── Helpers ──────────────────────────────────────────────────────
function severityCardClass(s: Severity): string {
  if (s === 'rose') return 'border-rose-500/30 bg-rose-500/[0.06] text-rose-200'
  if (s === 'amber') return 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200'
  return 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200'
}

function insightIcon(ins: Insight): React.ElementType {
  if (ins.type === 'strength') return CheckCircle2
  if (ins.type === 'opportunity') return TrendingUp
  return AlertTriangle
}

function barColorForValue(value: number, max: number): string {
  if (value === 0) return 'bg-rose-500/30'
  const ratio = max > 0 ? value / max : 0
  if (ratio < 0.33) return 'bg-rose-500'
  if (ratio < 0.66) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function textColorForValue(value: number, max: number): string {
  if (value === 0) return 'text-rose-400/80'
  const ratio = max > 0 ? value / max : 0
  if (ratio < 0.33) return 'text-rose-300'
  if (ratio < 0.66) return 'text-amber-300'
  return 'text-emerald-300'
}

function rowTotal(c: CompetitorRow): number {
  return AI_MODELS.reduce((sum, m) => sum + c.citations[m.key], 0)
}

// ── Component ────────────────────────────────────────────────────
export default function CompetitorCitationGap({ url }: { url?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [newCompetitor, setNewCompetitor] = useState('')

  const competitors = useMemo(() => getMockCompetitors(url), [url])

  const maxValue = useMemo(() => {
    let max = 0
    for (const c of competitors) {
      for (const m of AI_MODELS) {
        if (c.citations[m.key] > max) max = c.citations[m.key]
      }
    }
    return max
  }, [competitors])

  const summary = useMemo(() => {
    const totals = competitors
      .map((c) => ({ domain: c.domain, isYou: c.isYou, total: rowTotal(c) }))
      .sort((a, b) => b.total - a.total)
    const yourIdx = totals.findIndex((t) => t.isYou)
    const yourTotal = totals.find((t) => t.isYou)?.total ?? 0
    const leaderTotal = totals[0]?.total ?? 0
    return {
      yourRank: yourIdx >= 0 ? yourIdx + 1 : 0,
      yourTotal,
      gapToLeader: yourTotal - leaderTotal,
      totalSites: totals.length,
    }
  }, [competitors])

  const handleAdd = () => {
    if (newCompetitor.trim()) setNewCompetitor('')
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="pt-6 px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 shrink-0">
                <Swords className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Competitor Citation Gap</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  How often AI models cite you vs. your competitors
                </p>
              </div>
            </div>
            <Badge className="border-purple-500/30 bg-purple-500/10 text-purple-300 self-start sm:self-auto">
              {competitors.length} sites · {AI_MODELS.length} models
            </Badge>
          </div>

          {/* Comparison Matrix */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 pb-2">
            <div className="min-w-[680px] px-4 sm:px-0">
              {/* Column headers */}
              <div className="grid grid-cols-[150px_repeat(5,1fr)] gap-2 mb-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium flex items-end pb-2">
                  Domain
                </div>
                {AI_MODELS.map((m) => (
                  <div
                    key={m.key}
                    className={`text-xs font-semibold text-center pb-2 ${m.color}`}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {competitors.map((row, i) => (
                  <motion.div
                    key={row.domain}
                    initial={{ opacity: 0, y: 12 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                    className={`grid grid-cols-[150px_repeat(5,1fr)] gap-2 items-center rounded-lg p-3 ${
                      row.isYou
                        ? 'bg-purple-500/[0.08] border border-purple-500/40 shadow-[0_0_24px_-6px_rgba(168,85,247,0.5)]'
                        : 'bg-white/[0.02] border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.domain}
                      </span>
                      {row.isYou && (
                        <Badge className="border-purple-500/40 bg-purple-500/20 text-purple-200 text-[10px] px-1.5 py-0 shrink-0">
                          You
                        </Badge>
                      )}
                    </div>
                    {AI_MODELS.map((m) => {
                      const v = row.citations[m.key]
                      const widthPct = maxValue > 0 ? (v / maxValue) * 100 : 0
                      return (
                        <div key={m.key} className="flex flex-col gap-1 min-w-0">
                          <span className={`text-sm font-semibold ${textColorForValue(v, maxValue)}`}>
                            {v}
                          </span>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${barColorForValue(v, maxValue)}`}
                              initial={{ width: 0 }}
                              animate={isInView ? { width: `${widthPct}%` } : {}}
                              transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-rose-500/15 flex items-center justify-center shrink-0">
                <ArrowDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  Your Rank
                </div>
                <div className="text-sm font-semibold text-rose-200">
                  #{summary.yourRank} of {summary.totalSites}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
                <ArrowUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  Your Mentions
                </div>
                <div className="text-sm font-semibold text-emerald-200">
                  {summary.yourTotal} citations
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center shrink-0">
                <ArrowDown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  Gap to Leader
                </div>
                <div className="text-sm font-semibold text-amber-200">
                  {summary.gapToLeader > 0 ? '+' : ''}{summary.gapToLeader}
                </div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="mt-7">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-foreground">Citation Gap Analysis</h4>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {INSIGHTS.map((ins, i) => {
                const Icon = insightIcon(ins)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.55 + i * 0.1 }}
                    className={`rounded-lg border p-3 flex items-start gap-3 ${severityCardClass(ins.severity)}`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{ins.message}</p>
                      <p className="text-[10px] uppercase tracking-wider opacity-60 mt-1">
                        {ins.type}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Footer: Add Competitor */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                placeholder="Add competitor domain (e.g. competitor.com)"
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                }}
              />
              <Button
                onClick={handleAdd}
                className="bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 hover:text-purple-100 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Competitor
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-2">
              Demo only — added competitors would appear in the matrix above on next refresh.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
