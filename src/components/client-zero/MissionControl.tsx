'use client'

/**
 * Mission Control — Today's Opportunities + Execution Loop Status
 *
 * The nerve center for daily content operations.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  TrendingUp,
  BarChart3,
  MessageSquare,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

interface Opportunity {
  id: string
  keyword: string
  estimatedScoreGain: number
  source: string
  engines: string[]
  dataAvailable: boolean
  contentType?: string
  priority?: string
}

interface ExecutionStep {
  label: string
  status: 'done' | 'in_progress' | 'pending'
}

// ── Fallback Data ───────────────────────────────────────────────────────

const FALLBACK_OPPS: Opportunity[] = [
  { id: '1', keyword: 'AI Visibility for Dentists', estimatedScoreGain: 6, source: 'opportunity_queue', engines: ['chatgpt', 'claude', 'gemini'], dataAvailable: true, priority: 'high' },
  { id: '2', keyword: 'LLM SEO vs Traditional SEO', estimatedScoreGain: 4, source: 'ai_twin', engines: ['chatgpt', 'perplexity'], dataAvailable: true, priority: 'high' },
  { id: '3', keyword: 'Geo Ranking Optimization', estimatedScoreGain: 5, source: 'replay', engines: ['claude', 'gemini'], dataAvailable: true, priority: 'medium' },
  { id: '4', keyword: 'Schema Markup for AI Crawlers', estimatedScoreGain: 3, source: 'opportunity_queue', engines: ['chatgpt', 'gemini', 'perplexity'], dataAvailable: false, priority: 'medium' },
  { id: '5', keyword: 'Citation Building Strategy', estimatedScoreGain: 7, source: 'ai_twin', engines: ['chatgpt', 'claude', 'gemini', 'perplexity'], dataAvailable: true, priority: 'high' },
]

const FALLBACK_LOOP: ExecutionStep[] = [
  { label: 'AI Visibility Data', status: 'done' },
  { label: 'Opportunity Queue', status: 'done' },
  { label: 'Keyword Discovery', status: 'done' },
  { label: 'Content Brief', status: 'done' },
  { label: 'AI Writer', status: 'in_progress' },
  { label: 'Fact Checker', status: 'pending' },
  { label: 'SEO Review', status: 'pending' },
  { label: 'AEO Review', status: 'pending' },
  { label: 'GEO Review', status: 'pending' },
  { label: 'Schema', status: 'pending' },
  { label: 'Internal Links', status: 'pending' },
  { label: 'Auto Execute', status: 'pending' },
  { label: 'WordPress', status: 'pending' },
  { label: 'Index', status: 'pending' },
  { label: 'Replay 24h', status: 'pending' },
]

const FALLBACK_KPIS = {
  articlesPublished: 31,
  avgScoreGain: 4.2,
  citationGain: 38,
  aiMentions: 12,
}

// ── Display Helpers ─────────────────────────────────────────────────────

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  copilot: 'Copilot',
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: 'text-emerald-400',
  claude: 'text-orange-400',
  gemini: 'text-blue-400',
  perplexity: 'text-cyan-400',
  copilot: 'text-violet-400',
}

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  opportunity_queue: { label: 'Queue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ai_twin: { label: 'AI Twin', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  replay: { label: 'Replay', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ai_visibility_gap: { label: 'Gap', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  industry_benchmark: { label: 'Benchmark', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-amber-500/20 text-amber-400',
  medium: 'bg-white/10 text-muted-foreground',
  low: 'bg-white/5 text-muted-foreground/60',
}

// ── Animation ───────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

// ── Component ───────────────────────────────────────────────────────────

export default function MissionControl() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(FALLBACK_OPPS)
  const [loading, setLoading] = useState(true)
  const [generatingBrief, setGeneratingBrief] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client-zero/content-engine/opportunities')
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.opportunities) {
          setOpportunities(json.opportunities)
        }
      })
      .catch(() => {
        if (!cancelled) setOpportunities(FALLBACK_OPPS)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleGenerateBrief = async (oppId: string) => {
    setGeneratingBrief(oppId)
    try {
      await fetch('/api/client-zero/content-engine/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId }),
      })
    } catch {
      // silent fail
    }
    setTimeout(() => setGeneratingBrief(null), 1500)
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
              <CardContent className="p-6 h-36" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* ── Today's Opportunities ─────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Today&apos;s Opportunities</h3>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            {opportunities.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => {
            const src = SOURCE_BADGES[opp.source] || SOURCE_BADGES.opportunity_queue
            return (
              <motion.div key={opp.id} variants={fadeUp}>
                <Card className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-emerald-500/30 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm leading-tight">{opp.keyword}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs shrink-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        +{opp.estimatedScoreGain}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${src.color}`}>
                        {src.label}
                      </Badge>
                      {opp.priority && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${PRIORITY_COLORS[opp.priority] || PRIORITY_COLORS.medium}`}>
                          {opp.priority}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        {opp.engines.map((eng) => (
                          <span key={eng} className={`text-[10px] font-medium ${ENGINE_COLORS[eng] || 'text-muted-foreground'}`}>
                            {ENGINE_LABELS[eng] || eng}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        {opp.dataAvailable ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {opp.dataAvailable ? 'Data ready' : 'Awaiting data'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        onClick={() => handleGenerateBrief(opp.id)}
                        disabled={generatingBrief === opp.id || !opp.dataAvailable}
                      >
                        {generatingBrief === opp.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <FileText className="h-3 w-3 mr-1" />
                        )}
                        Generate Brief
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Execution Loop Pipeline ───────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold">Execution Loop</h3>
        </div>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {FALLBACK_LOOP.map((step, idx) => {
                const dotColor =
                  step.status === 'done'
                    ? 'bg-emerald-400'
                    : step.status === 'in_progress'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-muted-foreground/30'
                const textColor =
                  step.status === 'done'
                    ? 'text-emerald-400'
                    : step.status === 'in_progress'
                      ? 'text-amber-400'
                      : 'text-muted-foreground'
                return (
                  <div key={step.label} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center gap-1.5 px-2 py-1">
                      <div className={`h-3 w-3 rounded-full ${dotColor}`} />
                      <span className={`text-[10px] font-medium whitespace-nowrap ${textColor}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < FALLBACK_LOOP.length - 1 && (
                      <div className="h-px w-4 bg-white/10 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Today's KPIs ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Articles Published', value: FALLBACK_KPIS.articlesPublished, icon: FileText, color: 'text-emerald-400' },
            { label: 'Avg AI Score Gain', value: `+${FALLBACK_KPIS.avgScoreGain}`, icon: TrendingUp, color: 'text-amber-400' },
            { label: 'Citation Gain', value: `+${FALLBACK_KPIS.citationGain}`, icon: BarChart3, color: 'text-cyan-400' },
            { label: 'AI Mentions', value: `+${FALLBACK_KPIS.aiMentions}`, icon: MessageSquare, color: 'text-violet-400' },
          ].map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label} className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`rounded-lg bg-white/5 p-2 ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
