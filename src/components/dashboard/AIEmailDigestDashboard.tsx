'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ClipboardList,
  Target,
  Clock,
  ChevronRight,
  Zap,
  AlertTriangle,
  Calendar,
  Bell,
  BarChart3,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
type Frequency = 'daily' | 'weekly' | 'monthly'

interface EngineDelta {
  name: string
  icon: string
  delta: number
  color: string
}

interface DigestEntry {
  id: string
  date: string
  subject: string
  scoreBefore: number
  scoreAfter: number
  delta: number
  enginesGained: number
  enginesLost: number
  topOpportunity: string
}

interface ScoreTrendPoint {
  date: string
  score: number
}

interface DigestData {
  latestDigest: {
    id: string
    date: string
    subject: string
    scoreBefore: number
    scoreAfter: number
    delta: number
    engines: EngineDelta[]
    citationsGained: number
    citationsLost: number
    topOpportunity: string
    topOpportunityGain: number
    topOpportunityTime: string
  }
  history: DigestEntry[]
  scoreTrend: ScoreTrendPoint[]
  frequency: Frequency
}

interface AIEmailDigestDashboardProps {
  domain: string
  userId?: string
}

// ── Frequency options ────────────────────────────────────────────────────
const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every morning at 7:00 AM with overnight changes.' },
  { value: 'weekly', label: 'Weekly', description: 'Every Monday with the past 7 days of changes.' },
  { value: 'monthly', label: 'Monthly', description: '1st of each month with full month trends.' },
]

// ── Fallback mock data ──────────────────────────────────────────────────
const FALLBACK_DATA: DigestData = {
  frequency: 'daily',
  latestDigest: {
    id: 'd1',
    date: '2025-03-05',
    subject: 'AI Visibility Report — March 5, 2025',
    scoreBefore: 62,
    scoreAfter: 67,
    delta: 5,
    engines: [
      { name: 'ChatGPT', icon: '🟢', delta: 2, color: 'text-emerald-400' },
      { name: 'Perplexity', icon: '🔵', delta: 3, color: 'text-cyan-400' },
      { name: 'Claude', icon: '🟡', delta: 0, color: 'text-amber-400' },
      { name: 'Gemini', icon: '🔷', delta: -1, color: 'text-purple-400' },
      { name: 'Grok', icon: '🔴', delta: 1, color: 'text-rose-400' },
    ],
    citationsGained: 2,
    citationsLost: 0,
    topOpportunity: 'Add FAQ schema to /pricing',
    topOpportunityGain: 4,
    topOpportunityTime: '15 min',
  },
  history: [
    { id: 'd1', date: 'Mar 5, 2025', subject: 'AI Visibility Report — March 5', scoreBefore: 62, scoreAfter: 67, delta: 5, enginesGained: 2, enginesLost: 0, topOpportunity: 'Add FAQ schema to /pricing' },
    { id: 'd2', date: 'Mar 4, 2025', subject: 'AI Visibility Report — March 4', scoreBefore: 60, scoreAfter: 62, delta: 2, enginesGained: 1, enginesLost: 0, topOpportunity: 'Update meta descriptions' },
    { id: 'd3', date: 'Mar 3, 2025', subject: 'AI Visibility Report — March 3', scoreBefore: 58, scoreAfter: 60, delta: 2, enginesGained: 1, enginesLost: 1, topOpportunity: 'Create llms.txt' },
    { id: 'd4', date: 'Mar 2, 2025', subject: 'AI Visibility Report — March 2', scoreBefore: 57, scoreAfter: 58, delta: 1, enginesGained: 0, enginesLost: 0, topOpportunity: 'Build Wikipedia presence' },
    { id: 'd5', date: 'Mar 1, 2025', subject: 'Weekly Digest — Week 9', scoreBefore: 52, scoreAfter: 57, delta: 5, enginesGained: 2, enginesLost: 0, topOpportunity: 'Deploy structured data' },
  ],
  scoreTrend: [
    { date: 'Feb 1', score: 42 },
    { date: 'Feb 8', score: 44 },
    { date: 'Feb 15', score: 48 },
    { date: 'Feb 22', score: 52 },
    { date: 'Mar 1', score: 57 },
    { date: 'Mar 5', score: 67 },
  ],
}

// ── Main Component ───────────────────────────────────────────────────────
export default function AIEmailDigestDashboard({ domain, userId }: AIEmailDigestDashboardProps) {
  const [data, setData] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<Frequency>('daily')
  const [saving, setSaving] = useState(false)

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/ai/digest?domain=${encodeURIComponent(domain)}${userId ? `&userId=${userId}` : ''}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
        setFrequency(json.frequency ?? 'daily')
      } catch {
        setData(FALLBACK_DATA)
        setFrequency(FALLBACK_DATA.frequency)
      } finally {
        setLoading(false)
      }
    }
    if (domain) loadData()
  }, [domain, userId])

  const handleFrequencyChange = async (newFreq: Frequency) => {
    setFrequency(newFreq)
    setSaving(true)
    // Simulate API call to save preference
    await new Promise(resolve => setTimeout(resolve, 500))
    setSaving(false)
  }

  const digest = data?.latestDigest ?? FALLBACK_DATA.latestDigest
  const history = data?.history ?? FALLBACK_DATA.history
  const scoreTrend = data?.scoreTrend ?? FALLBACK_DATA.scoreTrend

  // ── Score trend mini chart ────────────────────────────────────────────
  const chartH = 80
  const chartW = 100
  const padX = 5
  const padY = 8
  const trendMin = Math.min(...scoreTrend.map(p => p.score)) - 3
  const trendMax = Math.max(...scoreTrend.map(p => p.score)) + 3
  const trendRange = trendMax - trendMin

  function scoreToY(s: number) {
    return padY + ((trendMax - s) / trendRange) * (chartH - padY * 2)
  }
  function pointToX(i: number) {
    return padX + (i / (scoreTrend.length - 1)) * (chartW - padX * 2)
  }

  const trendLine = scoreTrend.map((p, i) => `${pointToX(i)},${scoreToY(p.score)}`).join(' ')
  const trendArea = `${pointToX(0)},${chartH - padY} ${trendLine} ${pointToX(scoreTrend.length - 1)},${chartH - padY}`

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">Email Digest</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-24 rounded-lg bg-muted/30 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">Email Digest</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load digest data</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">Email Digest</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Bell className="w-3 h-3 mr-1" />
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Latest Digest Preview ──────────────────────────────────── */}
        <div className="rounded-xl border border-emerald-500/20 bg-black/30 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-white/5 bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{digest.subject}</p>
                <p className="text-[10px] text-muted-foreground">{digest.date} • digest@seosights.com</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] shrink-0">
                Morning Digest
              </Badge>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Score change hero */}
            <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 via-teal-500/8 to-purple-500/10 border border-emerald-500/15 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">AI Visibility Score</span>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold tabular-nums text-foreground">{digest.scoreBefore}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold tabular-nums text-foreground">{digest.scoreAfter}</span>
                <Badge className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold px-2 py-0.5 gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{digest.delta}
                </Badge>
              </div>
            </div>

            {/* Citations */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">{digest.citationsGained} gained</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400/70" />
                <span className="text-xs font-medium text-muted-foreground">{digest.citationsLost} lost</span>
              </div>
            </div>

            {/* Engine breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-foreground">Engine Breakdown</span>
              </div>
              <div className="space-y-1.5">
                {digest.engines.map(engine => (
                  <div key={engine.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{engine.icon}</span>
                      <span className="text-xs font-medium text-foreground">{engine.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {engine.delta > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">+{engine.delta}</span>
                        </>
                      ) : engine.delta < 0 ? (
                        <>
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-bold text-red-400">{engine.delta}</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground">No change</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top opportunity */}
            <div className="rounded-lg border border-purple-500/25 bg-purple-500/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">Top Opportunity</span>
              </div>
              <p className="text-sm text-foreground font-medium mb-1.5">{digest.topOpportunity}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 text-[10px]">
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                  +{digest.topOpportunityGain} points
                </Badge>
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10 text-[10px]">
                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                  {digest.topOpportunityTime}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ── Score Trend Mini Chart ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Score Trend</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-20" preserveAspectRatio="none">
              <polygon points={trendArea} fill="url(#digestAreaGrad)" opacity="0.4" />
              <polyline points={trendLine} fill="none" stroke="#10b981" strokeWidth="1" strokeLinejoin="round" />
              {/* Current score dot */}
              <circle
                cx={pointToX(scoreTrend.length - 1)}
                cy={scoreToY(scoreTrend[scoreTrend.length - 1].score)}
                r="2"
                fill="#10b981"
              />
              <circle
                cx={pointToX(scoreTrend.length - 1)}
                cy={scoreToY(scoreTrend[scoreTrend.length - 1].score)}
                r="4"
                fill="none"
                stroke="#10b981"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="digestAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{scoreTrend[0]?.date}</span>
              <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
                +{scoreTrend[scoreTrend.length - 1].score - scoreTrend[0].score} pts
              </span>
              <span className="text-[10px] text-muted-foreground">{scoreTrend[scoreTrend.length - 1]?.date}</span>
            </div>
          </div>
        </div>

        {/* ── Frequency Settings ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Frequency</span>
            {saving && (
              <span className="text-[10px] text-emerald-400">Saving...</span>
            )}
          </div>
          <div className="flex rounded-lg bg-white/5 border border-white/10 p-1">
            {FREQUENCY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleFrequencyChange(opt.value)}
                className={`relative flex-1 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                  frequency === opt.value ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {frequency === opt.value && (
                  <motion.div
                    layoutId="freq-pill-digest"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-md shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {FREQUENCY_OPTIONS.find(o => o.value === frequency)?.description}
          </p>
        </div>

        {/* ── Digest History ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">History</span>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5">
              {history.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{entry.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                      <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
                        {entry.scoreBefore} → {entry.scoreAfter} ({entry.delta > 0 ? '+' : ''}{entry.delta})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.enginesGained > 0 && (
                      <span className="text-[10px] text-emerald-400">+{entry.enginesGained} 🟢</span>
                    )}
                    {entry.enginesLost > 0 && (
                      <span className="text-[10px] text-red-400">-{entry.enginesLost} 🔴</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
