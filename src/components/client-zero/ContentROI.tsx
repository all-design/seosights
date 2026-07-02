'use client'

/**
 * Content ROI — KPIs and performance dashboard
 *
 * Hero metrics, performance chart, top articles, content factory output, ROI timeline
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  FileText,
  BarChart3,
  MessageSquare,
  MousePointerClick,
  Layers,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

// ── Types ───────────────────────────────────────────────────────────────

interface TopArticle {
  id: string
  title: string
  scoreGain: number
  citations: number
  mentions: number
}

interface FactoryOutput {
  type: string
  count: number
  color: string
}

interface ROIData {
  heroMetrics: {
    articlesPublished: number
    avgScoreGain: number
    citationGain: number
    aiMentions: number
    organicClicks: string
  }
  performanceChart: { article: string; delta: number }[]
  topArticles: TopArticle[]
  factoryOutput: FactoryOutput[]
  roiTimeline: { date: string; cumulativeGain: number }[]
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK: ROIData = {
  heroMetrics: {
    articlesPublished: 31,
    avgScoreGain: 4.2,
    citationGain: 38,
    aiMentions: 12,
    organicClicks: '+18%',
  },
  performanceChart: [
    { article: 'AI Visibility Dentists', delta: 6 },
    { article: 'LLM SEO Guide', delta: 8 },
    { article: 'Schema for AI', delta: 4 },
    { article: 'Citation Strategy', delta: 7 },
    { article: 'GEO Optimization', delta: 5 },
    { article: 'AEO Best Practices', delta: 3 },
    { article: 'Programmatic SEO', delta: 9 },
    { article: 'AI Search Changes', delta: 2 },
    { article: 'Dental AI Visibility', delta: 6 },
    { article: 'Hotel AI Visibility', delta: 4 },
  ],
  topArticles: [
    { id: '1', title: 'Programmatic SEO for AI', scoreGain: 9, citations: 8, mentions: 5 },
    { id: '2', title: 'LLM SEO Guide (50 cities)', scoreGain: 8, citations: 6, mentions: 4 },
    { id: '3', title: 'Citation Building Strategy', scoreGain: 7, citations: 7, mentions: 3 },
    { id: '4', title: 'AI Visibility for Dentists', scoreGain: 6, citations: 5, mentions: 4 },
    { id: '5', title: 'Dental AI Visibility Guide', scoreGain: 6, citations: 4, mentions: 3 },
    { id: '6', title: 'GEO Ranking Optimization', scoreGain: 5, citations: 3, mentions: 2 },
    { id: '7', title: 'Schema Markup for AI', scoreGain: 4, citations: 4, mentions: 2 },
    { id: '8', title: 'Hotel AI Visibility', scoreGain: 4, citations: 2, mentions: 1 },
  ],
  factoryOutput: [
    { type: 'Blog', count: 31, color: '#10b981' },
    { type: 'Programmatic', count: 87, color: '#3b82f6' },
    { type: 'LinkedIn', count: 31, color: '#8b5cf6' },
    { type: 'Newsletter', count: 4, color: '#f59e0b' },
  ],
  roiTimeline: [
    { date: 'Week 1', cumulativeGain: 12 },
    { date: 'Week 2', cumulativeGain: 28 },
    { date: 'Week 3', cumulativeGain: 45 },
    { date: 'Week 4', cumulativeGain: 58 },
    { date: 'Week 5', cumulativeGain: 72 },
    { date: 'Week 6', cumulativeGain: 91 },
    { date: 'Week 7', cumulativeGain: 108 },
    { date: 'Week 8', cumulativeGain: 130 },
  ],
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

export default function ContentROI() {
  const [data, setData] = useState<ROIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client-zero/content-engine/roi')
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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
          <CardContent className="p-6 h-64" />
        </Card>
      </div>
    )
  }

  const { heroMetrics, performanceChart, topArticles, factoryOutput, roiTimeline } = data || FALLBACK

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">Content ROI</h3>
      </motion.div>

      {/* ── Hero Metrics ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Articles Published', value: heroMetrics.articlesPublished, icon: FileText, color: 'text-emerald-400' },
            { label: 'Avg AI Score Gain', value: `+${heroMetrics.avgScoreGain}`, icon: TrendingUp, color: 'text-amber-400' },
            { label: 'Citation Gain', value: `+${heroMetrics.citationGain}`, icon: BarChart3, color: 'text-cyan-400' },
            { label: 'AI Mentions', value: `+${heroMetrics.aiMentions}`, icon: MessageSquare, color: 'text-violet-400' },
            { label: 'Organic Clicks', value: heroMetrics.organicClicks, icon: MousePointerClick, color: 'text-emerald-400' },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`rounded-lg bg-white/5 p-2 ${metric.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* ── Performance Chart ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm">AI Score Delta per Article</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="article"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="delta" fill="#10b981" radius={[4, 4, 0, 0]} name="Score Delta" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Top Performing Articles ──────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 h-full">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm">Top Performing Articles</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-[10px] text-muted-foreground">Article</TableHead>
                      <TableHead className="text-[10px] text-muted-foreground text-right">Gain</TableHead>
                      <TableHead className="text-[10px] text-muted-foreground text-right">Citations</TableHead>
                      <TableHead className="text-[10px] text-muted-foreground text-right">Mentions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topArticles.map((article) => (
                      <TableRow key={article.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="text-xs font-medium py-2">{article.title}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px] border-0 bg-emerald-500/20 text-emerald-400">
                            +{article.scoreGain}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-cyan-400 text-right">{article.citations}</TableCell>
                        <TableCell className="text-xs text-violet-400 text-right">{article.mentions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Content Factory Output ───────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 h-full">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-400" />
                <CardTitle className="text-sm">Content Factory Output</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col gap-4">
                {factoryOutput.map((output) => (
                  <div key={output.type} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: output.color }}
                    />
                    <span className="text-xs text-muted-foreground w-28">{output.type}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all"
                        style={{
                          width: `${Math.min(100, (output.count / Math.max(...factoryOutput.map((o) => o.count))) * 100)}%`,
                          backgroundColor: output.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: output.color }}>
                      {output.count}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {factoryOutput.reduce((sum, o) => sum + o.count, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── ROI Timeline ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm">ROI Timeline — Cumulative Score Gain</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiTimeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeGain"
                    stroke="#10b981"
                    fill="url(#roiGrad)"
                    strokeWidth={2}
                    name="Cumulative Gain"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
