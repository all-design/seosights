'use client'

/**
 * Content Replay — Post-publish measurement
 *
 * 24h Replay Results, Self-Optimizing Blog™, and Performance Timeline
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Clock,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

interface ReplayArticle {
  id: string
  title: string
  scoreBefore: number
  scoreAfter: number
  delta: number
  citationsGained: number
  publishedAt: string
}

interface RewriteArticle {
  id: string
  title: string
  originalScore: number
  currentScore: number
  declinePercent: number
  needsRewrite: boolean
}

interface PerformancePoint {
  day: string
  score: number
}

interface ReplayData {
  replayResults: ReplayArticle[]
  rewriteArticles: RewriteArticle[]
  performanceTimeline: PerformancePoint[]
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK: ReplayData = {
  replayResults: [
    { id: '1', title: 'AI Visibility for Dentists', scoreBefore: 62, scoreAfter: 68, delta: 6, citationsGained: 3, publishedAt: '24h ago' },
    { id: '2', title: 'LLM SEO vs Traditional SEO', scoreBefore: 55, scoreAfter: 61, delta: 6, citationsGained: 2, publishedAt: '24h ago' },
    { id: '3', title: 'Why AI Search Changes SEO', scoreBefore: 71, scoreAfter: 73, delta: 2, citationsGained: 1, publishedAt: '48h ago' },
    { id: '4', title: 'Schema Markup for AI Crawlers', scoreBefore: 58, scoreAfter: 65, delta: 7, citationsGained: 4, publishedAt: '24h ago' },
    { id: '5', title: 'Citation Building Strategy', scoreBefore: 44, scoreAfter: 51, delta: 7, citationsGained: 5, publishedAt: '48h ago' },
  ],
  rewriteArticles: [
    { id: '6', title: 'AI Visibility for Hotels', originalScore: 72, currentScore: 59, declinePercent: 18, needsRewrite: true },
    { id: '7', title: 'GEO vs AEO Comparison', originalScore: 68, currentScore: 58, declinePercent: 15, needsRewrite: true },
    { id: '8', title: 'How to Build Citations', originalScore: 61, currentScore: 55, declinePercent: 10, needsRewrite: true },
  ],
  performanceTimeline: [
    { day: 'Mon', score: 62 },
    { day: 'Tue', score: 64 },
    { day: 'Wed', score: 63 },
    { day: 'Thu', score: 67 },
    { day: 'Fri', score: 69 },
    { day: 'Sat', score: 68 },
    { day: 'Sun', score: 72 },
  ],
}

// ── SVG Sparkline ───────────────────────────────────────────────────────

function MiniSparkline({ data, width = 200, height = 48 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padY = 4

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = padY + ((max - v) / range) * (height - padY * 2)
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaD = `${pathD} L${width},${height} L0,${height} Z`

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />
      ))}
    </svg>
  )
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

export default function ContentReplay() {
  const [data, setData] = useState<ReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rewriting, setRewriting] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client-zero/content-engine/replay-check')
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
  }, [])

  const handleAutoRewrite = async (articleId: string) => {
    setRewriting(articleId)
    try {
      await fetch('/api/client-zero/content-engine/replay-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action: 'auto_rewrite' }),
      })
    } catch {
      // silent
    }
    setTimeout(() => setRewriting(null), 2000)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
            <CardContent className="p-6 h-48" />
          </Card>
        ))}
      </div>
    )
  }

  const { replayResults, rewriteArticles, performanceTimeline } = data || FALLBACK
  const avgDelta = replayResults.length > 0
    ? Math.round(replayResults.reduce((sum, r) => sum + r.delta, 0) / replayResults.length * 10) / 10
    : 0
  const totalCitations = replayResults.reduce((sum, r) => sum + r.citationsGained, 0)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">Replay</h3>
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
          24h Measurement
        </Badge>
      </motion.div>

      {/* ── Summary KPIs ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Articles Measured', value: replayResults.length, color: 'text-emerald-400' },
            { label: 'Avg Score Delta', value: `+${avgDelta}`, color: 'text-emerald-400' },
            { label: 'Total Citations', value: `+${totalCitations}`, color: 'text-cyan-400' },
            { label: 'Needs Rewrite', value: rewriteArticles.length, color: 'text-amber-400' },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card/80 backdrop-blur-sm border-white/10">
              <CardContent className="p-3">
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── 24h Replay Results ─────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 h-full">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm">24h Replay Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-80">
                <div className="flex flex-col gap-2">
                  {replayResults.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 p-3 hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{article.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Score:</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{article.scoreBefore}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] font-mono text-emerald-400">{article.scoreAfter}</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 h-4 border-0 ${
                              article.delta > 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {article.delta > 0 ? '+' : ''}{article.delta}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-2.5 w-2.5 text-cyan-400" />
                          <span className="text-[10px] text-cyan-400">{article.citationsGained} citations gained</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{article.publishedAt}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Self-Optimizing Blog™ ──────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 h-full">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm">Self-Optimizing Blog™</CardTitle>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {rewriteArticles.length} flagged
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-80">
                <div className="flex flex-col gap-3">
                  {rewriteArticles.map((article) => (
                    <div
                      key={article.id}
                      className="rounded-lg border border-amber-500/20 p-3 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium flex-1 min-w-0 truncate">{article.title}</p>
                        <Button
                          size="sm"
                          className="h-6 text-[10px] bg-amber-600 hover:bg-amber-700 text-white shrink-0 ml-2"
                          onClick={() => handleAutoRewrite(article.id)}
                          disabled={rewriting === article.id}
                        >
                          {rewriting === article.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Auto-Rewrite
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Original:</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{article.originalScore}</span>
                        </div>
                        <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Current:</span>
                          <span className="text-[10px] font-mono text-red-400">{article.currentScore}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-0 bg-red-500/20 text-red-400">
                          <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                          -{article.declinePercent}%
                        </Badge>
                      </div>
                      <Progress
                        value={Math.max(0, 100 - article.declinePercent)}
                        className="h-1.5"
                      />
                      <p className="text-[10px] text-amber-400 mt-1">
                        <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />
                        Lost {article.declinePercent}% AI visibility → Rewrite recommended
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Performance Timeline ───────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm">Performance Timeline</CardTitle>
              <Badge variant="outline" className="border-white/10 text-muted-foreground">
                7-day view
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="max-w-md">
              <MiniSparkline data={performanceTimeline.map((p) => p.score)} width={400} height={80} />
              <div className="flex items-center justify-between mt-2">
                {performanceTimeline.map((p) => (
                  <div key={p.day} className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-emerald-400">{p.score}</span>
                    <span className="text-[9px] text-muted-foreground">{p.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
