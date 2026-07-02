'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Calendar,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  BarChart3,
  Target,
  Shield,
  Brain,
  Zap,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ── Types ──────────────────────────────────────────────────────────────

interface DailyReport {
  id: string
  date: string
  headline: string
  assetCount: number
  impactSummary: string
  summary: string
  categories: { name: string; count: number }[]
  keyMetrics: { label: string; value: string; change: string; positive: boolean }[]
  governorActions: { rejected: number; topReason: string }
  highlights: string[]
  recommendations: string[]
}

interface WeeklySummary {
  weekRange: string
  totalAssets: number
  avgDailyAssets: number
  totalImpact: number
  topCategory: string
  improvementWeekOverWeek: number
  highlights: string[]
}

// ── Mock Data ──────────────────────────────────────────────────────────

const dailyReports: DailyReport[] = [
  {
    id: '1',
    date: 'March 4, 2026',
    headline: 'Platform added 12 high-value assets',
    assetCount: 12,
    impactSummary: '+17 AI Visibility points',
    summary:
      "Yesterday the platform autonomously created 12 new assets across 5 categories. Expected impact: +17 AI Visibility points. The Governor rejected 6 opportunities, primarily due to duplication with existing content.",
    categories: [
      { name: 'Industry Pages', count: 4 },
      { name: 'Blog Posts', count: 3 },
      { name: 'FAQ Pages', count: 2 },
      { name: 'Case Studies', count: 2 },
      { name: 'Comparison Pages', count: 1 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '12', change: '+3', positive: true },
      { label: 'AI Visibility', value: '+17', change: '+5', positive: true },
      { label: 'Avg Quality Score', value: '84/100', change: '+2', positive: true },
      { label: 'Citations Earned', value: '8', change: '+3', positive: true },
    ],
    governorActions: { rejected: 6, topReason: 'Duplicate (4)' },
    highlights: [
      'Industry page for "HVAC SEO" achieved 92 quality score — highest this week',
      'FAQ page for "AI Citation Factors" earned 3 citations within 6 hours of publishing',
      'Blog post "Voice Search 2026" trending above prediction by 12%',
    ],
    recommendations: [
      'Consider increasing budget for FAQ pages — highest ROI asset type',
      'Duplicate detection is working well — maintain current Governor thresholds',
      'Schedule case study generation for afternoon when quality scores are highest',
    ],
  },
  {
    id: '2',
    date: 'March 3, 2026',
    headline: 'Strong citation growth across 8 new assets',
    assetCount: 8,
    impactSummary: '+12 AI Visibility points',
    summary:
      'The platform created 8 new assets with a focus on citation-rich content. Governor rejected 4 opportunities. Citation rate improved by 18% compared to the previous day.',
    categories: [
      { name: 'FAQ Pages', count: 3 },
      { name: 'Blog Posts', count: 2 },
      { name: 'Industry Pages', count: 2 },
      { name: 'Tools', count: 1 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '8', change: '-2', positive: false },
      { label: 'AI Visibility', value: '+12', change: '+4', positive: true },
      { label: 'Avg Quality Score', value: '82/100', change: '+1', positive: true },
      { label: 'Citations Earned', value: '6', change: '+2', positive: true },
    ],
    governorActions: { rejected: 4, topReason: 'Too Similar (2)' },
    highlights: [
      'Citation rate per asset reached 0.75 — best this month',
      'New visibility calculator tool attracted 340 visitors on day one',
    ],
    recommendations: [
      'FAQ pages are outperforming — increase allocation to 30%',
      'Similarity threshold may need adjustment — 2 "too similar" rejections were borderline',
    ],
  },
  {
    id: '3',
    date: 'March 2, 2026',
    headline: 'Quality-focused day with 10 curated assets',
    assetCount: 10,
    impactSummary: '+14 AI Visibility points',
    summary:
      'Focus on quality over quantity. 10 assets published with an average quality score of 87 — highest this week. Governor active with 7 rejections protecting content standards.',
    categories: [
      { name: 'Blog Posts', count: 4 },
      { name: 'Industry Pages', count: 3 },
      { name: 'Case Studies', count: 2 },
      { name: 'Comparison Pages', count: 1 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '10', change: '+4', positive: true },
      { label: 'AI Visibility', value: '+14', change: '+6', positive: true },
      { label: 'Avg Quality Score', value: '87/100', change: '+5', positive: true },
      { label: 'Citations Earned', value: '5', change: '-1', positive: false },
    ],
    governorActions: { rejected: 7, topReason: 'Low Quality (3)' },
    highlights: [
      'Highest quality score day this week — 87 average',
      'Case study for restaurant chain earned 2 premium citations',
    ],
    recommendations: [
      'Quality-focused strategy is paying off — maintain approach',
      'Consider adjusting Governor quality threshold from 70 to 65 to increase volume',
    ],
  },
  {
    id: '4',
    date: 'March 1, 2026',
    headline: '6 assets created with mixed results',
    assetCount: 6,
    impactSummary: '+8 AI Visibility points',
    summary:
      'Lower output day due to Governor rejecting 9 opportunities — mostly duplicates from a competitor analysis sweep. 6 assets published, 4 meeting predictions.',
    categories: [
      { name: 'Industry Pages', count: 2 },
      { name: 'Blog Posts', count: 2 },
      { name: 'FAQ Pages', count: 2 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '6', change: '-4', positive: false },
      { label: 'AI Visibility', value: '+8', change: '-2', positive: false },
      { label: 'Avg Quality Score', value: '82/100', change: '0', positive: true },
      { label: 'Citations Earned', value: '4', change: '-2', positive: false },
    ],
    governorActions: { rejected: 9, topReason: 'Duplicate (5)' },
    highlights: [
      'Governor correctly blocked a sweep of duplicate opportunities from competitor analysis',
    ],
    recommendations: [
      'Adjust discovery engine to filter competitor-derived duplicates earlier in the pipeline',
    ],
  },
  {
    id: '5',
    date: 'February 28, 2026',
    headline: 'Strong finish to February with 14 assets',
    assetCount: 14,
    impactSummary: '+19 AI Visibility points',
    summary:
      'Best day of the week. 14 assets created across 6 categories. High citation rate and quality scores. February monthly target exceeded by 12%.',
    categories: [
      { name: 'Blog Posts', count: 4 },
      { name: 'Industry Pages', count: 3 },
      { name: 'FAQ Pages', count: 3 },
      { name: 'Case Studies', count: 2 },
      { name: 'Tools', count: 1 },
      { name: 'Comparison Pages', count: 1 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '14', change: '+6', positive: true },
      { label: 'AI Visibility', value: '+19', change: '+8', positive: true },
      { label: 'Avg Quality Score', value: '85/100', change: '+3', positive: true },
      { label: 'Citations Earned', value: '9', change: '+4', positive: true },
    ],
    governorActions: { rejected: 5, topReason: 'Already Covered (2)' },
    highlights: [
      'February monthly target exceeded — 287 assets vs 256 target',
      'New interactive tool "Citation Tracker" became the most visited page',
    ],
    recommendations: [
      'March budget should increase by 15% based on February performance',
      'Explore case study expansion — high engagement, low volume currently',
    ],
  },
  {
    id: '6',
    date: 'February 27, 2026',
    headline: 'Steady growth with 11 new assets',
    assetCount: 11,
    impactSummary: '+11 AI Visibility points',
    summary:
      'Consistent growth day. 11 assets created with stable quality scores. Governor rejected 3 low-confidence opportunities.',
    categories: [
      { name: 'Industry Pages', count: 4 },
      { name: 'Blog Posts', count: 3 },
      { name: 'FAQ Pages', count: 2 },
      { name: 'Comparison Pages', count: 2 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '11', change: '+1', positive: true },
      { label: 'AI Visibility', value: '+11', change: '+3', positive: true },
      { label: 'Avg Quality Score', value: '83/100', change: '-1', positive: false },
      { label: 'Citations Earned', value: '5', change: '+1', positive: true },
    ],
    governorActions: { rejected: 3, topReason: 'Low Confidence (2)' },
    highlights: [
      'Comparison page "Claude vs ChatGPT SEO" earned 4 citations in 24 hours',
    ],
    recommendations: [
      'Comparison pages showing high citation rates — consider increasing allocation',
    ],
  },
  {
    id: '7',
    date: 'February 26, 2026',
    headline: '10 assets with focus on FAQ expansion',
    assetCount: 10,
    impactSummary: '+10 AI Visibility points',
    summary:
      'Targeted FAQ expansion day. 5 FAQ pages created, all meeting quality thresholds. FAQ pages now represent the highest ROI asset type.',
    categories: [
      { name: 'FAQ Pages', count: 5 },
      { name: 'Industry Pages', count: 3 },
      { name: 'Blog Posts', count: 2 },
    ],
    keyMetrics: [
      { label: 'New Assets', value: '10', change: '+2', positive: true },
      { label: 'AI Visibility', value: '+10', change: '+2', positive: true },
      { label: 'Avg Quality Score', value: '84/100', change: '+2', positive: true },
      { label: 'Citations Earned', value: '7', change: '+3', positive: true },
    ],
    governorActions: { rejected: 4, topReason: 'Duplicate (2)' },
    highlights: [
      'FAQ expansion strategy showing strong results — citation rate 40% above average',
    ],
    recommendations: [
      'Continue FAQ expansion — target 50 new FAQ pages by end of March',
    ],
  },
]

const weeklySummary: WeeklySummary = {
  weekRange: 'Feb 26 — Mar 4, 2026',
  totalAssets: 71,
  avgDailyAssets: 10.1,
  totalImpact: 91,
  topCategory: 'Industry Pages',
  improvementWeekOverWeek: 14,
  highlights: [
    'Best week for AI Visibility gains — +91 points total',
    'FAQ pages achieved highest citation-per-asset ratio (0.75)',
    'Governor rejection rate stable at 23% — healthy balance',
    'February monthly target exceeded by 12%',
  ],
}

// ── Sub-components ──────────────────────────────────────────────────────

function ReportCard({ report, isLatest = false }: { report: DailyReport; isLatest?: boolean }) {
  const [expanded, setExpanded] = useState(isLatest)

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-colors ${
        isLatest
          ? 'bg-zinc-900/90 border-emerald-500/20 hover:border-emerald-500/30'
          : 'bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/50'
      }`}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isLatest && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Latest
              </Badge>
            )}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Calendar className="w-3 h-3" />
              {report.date}
            </div>
          </div>
          <h4 className="text-sm font-medium text-zinc-200 mb-1">{report.headline}</h4>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{report.assetCount} assets</span>
            <span className="text-zinc-700">·</span>
            <span className="text-emerald-400">{report.impactSummary}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Summary */}
              <p className="text-xs text-zinc-400 leading-relaxed">{report.summary}</p>

              <Separator className="bg-zinc-800/60" />

              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {report.keyMetrics.map((metric) => (
                  <div key={metric.label} className="p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{metric.label}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-zinc-200">{metric.value}</span>
                      <span className={`text-[10px] font-mono ${metric.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Categories</div>
                <div className="flex flex-wrap gap-1.5">
                  {report.categories.map((cat) => (
                    <Badge key={cat.name} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                      {cat.name} <span className="ml-1 text-zinc-500">×{cat.count}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Governor Actions */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-xs text-zinc-400">
                  Governor rejected <span className="text-rose-400 font-medium">{report.governorActions.rejected}</span> opportunities
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-500">{report.governorActions.topReason}</span>
              </div>

              {/* Highlights */}
              {report.highlights.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Highlights</div>
                  <div className="space-y-1.5">
                    {report.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-400 leading-relaxed">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">AI Recommendations</div>
                  <div className="space-y-1.5">
                    {report.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Brain className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-400 leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* ── Latest Report (prominent) ─────────────────────────────── */}
      <Card className="bg-zinc-900/90 border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-zinc-200">Latest Daily Report</CardTitle>
              <p className="text-xs text-zinc-500">Auto-generated executive summary</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ReportCard report={dailyReports[0]} isLatest={true} />
        </CardContent>
      </Card>

      {/* ── Report Archive ─────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Report Archive
            </CardTitle>
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              7 reports
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            {dailyReports.slice(1).map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Weekly Summary ─────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-zinc-200">Weekly Summary</CardTitle>
                <p className="text-xs text-zinc-500">{weeklySummary.weekRange}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono">+{weeklySummary.improvementWeekOverWeek}%</span>
              <span className="text-zinc-500">vs last week</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Total Assets</div>
              <div className="text-xl font-bold text-zinc-100">{weeklySummary.totalAssets}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Daily Average</div>
              <div className="text-xl font-bold text-zinc-100">{weeklySummary.avgDailyAssets}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">AI Visibility Gain</div>
              <div className="text-xl font-bold text-emerald-400">+{weeklySummary.totalImpact}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Top Category</div>
              <div className="text-sm font-bold text-zinc-100">{weeklySummary.topCategory}</div>
            </div>
          </div>

          <Separator className="bg-zinc-800/60 mb-4" />

          {/* Weekly Highlights */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Week Highlights</div>
            <div className="space-y-2">
              {weeklySummary.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-400 leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
