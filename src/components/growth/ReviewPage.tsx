'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  ThumbsUp,
  RefreshCw,
  XCircle,
  FileText,
  Star,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'

// ── Mock Data ──────────────────────────────────────────────────────────

const currentReview = {
  title: 'AI Visibility for Dentists',
  type: 'Industry Page',
  contentPreview: `# AI Visibility for Dentists

## How AI Search is Reshaping Dental Patient Acquisition

The dental industry is experiencing a fundamental shift in how patients discover and choose providers. With **87% of patients** now using AI-powered search tools to find local dental services, traditional SEO alone is no longer sufficient.

### Key Findings

- **AEO Score**: Dental practices optimizing for answer engines see 3.2x more patient inquiries
- **GEO Impact**: Geographic entity optimization increases local visibility by 67%
- **Schema Markup**: Dental-specific schema improves AI citation rates by 45%

### Recommended Actions

1. Implement DentalProcedure schema markup
2. Create location-specific entity clusters
3. Optimize for conversational dental queries
4. Build authority through dental health knowledge panels

> "Practices that adapt to AI search patterns are capturing 2.8x more new patients compared to those relying solely on traditional SEO." — Industry Report 2025`,
}

interface QualityCheck {
  name: string
  score: number
}

const qualityChecks: QualityCheck[] = [
  { name: 'SEO', score: 92 },
  { name: 'AEO', score: 85 },
  { name: 'GEO', score: 88 },
  { name: 'Grammar', score: 96 },
  { name: 'Links', score: 78 },
  { name: 'Schema', score: 90 },
  { name: 'Entities', score: 82 },
  { name: 'Facts', score: 94 },
  { name: 'Duplicate', score: 98 },
  { name: 'Brand Voice', score: 88 },
  { name: 'LLM Eval', score: 91 },
  { name: 'AI Visibility', score: 86 },
]

const overallScore = 89

const reviewQueue = [
  { id: 1, title: 'SEO Strategies for Plumbers', type: 'Industry Page', qualityScore: 91 },
  { id: 2, title: 'Local Search for Lawyers', type: 'Location Page', qualityScore: 87 },
  { id: 3, title: 'AI Citation Guide for E-commerce', type: 'Guide', qualityScore: 93 },
  { id: 4, title: 'GEO Optimization for SaaS', type: 'Blog Post', qualityScore: 84 },
  { id: 5, title: 'AEO for Healthcare Providers', type: 'Industry Page', qualityScore: 90 },
]

// ── Helpers ────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/15 border-emerald-500/25'
  if (score >= 60) return 'bg-amber-500/15 border-amber-500/25'
  return 'bg-red-500/15 border-red-500/25'
}

function getBarColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

// ── Radar chart data ──────────────────────────────────────────────────

const radarData = qualityChecks.map((c) => ({
  subject: c.name,
  score: c.score,
  fullMark: 100,
}))

// ── Bar chart data ────────────────────────────────────────────────────

const barData = qualityChecks.map((c) => ({
  name: c.name,
  score: c.score,
}))

// ── Custom Tooltip ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400">{payload[0].name}</p>
      <p className={`text-sm font-semibold ${getScoreColor(payload[0].value)}`}>
        {payload[0].value}/100
      </p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export function ReviewPage() {
  const [contentOpen, setContentOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Overall Score + Current Review ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Review Card */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-zinc-100">{currentReview.title}</CardTitle>
                    <CardDescription className="text-xs text-zinc-500 mt-0.5">
                      {currentReview.type} · Quality Review
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20">
                  <FileText className="w-3 h-3" />
                  Under Review
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {/* Collapsible Content Preview */}
              <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 mb-2"
                  >
                    <span className="text-xs">Content Preview (Markdown)</span>
                    {contentOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-zinc-950 rounded-lg border border-zinc-800/50 p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {currentReview.contentPreview}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Review Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Request Revision
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quality Checks — Bar Chart */}
          <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm text-zinc-300">Quality Checks — Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={{ stroke: '#27272a' }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={{ stroke: '#27272a' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Overall Score + Radar + Queue */}
        <div className="space-y-4">
          {/* Overall Quality Score */}
          <Card className="bg-zinc-900 border-emerald-500/20 py-0 gap-0">
            <CardContent className="p-5 flex flex-col items-center">
              <p className="text-xs text-zinc-500 mb-2">Overall Quality Score</p>
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42 * (overallScore / 100)} ${2 * Math.PI * 42}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className="text-2xl font-bold text-emerald-400">{overallScore}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Above Threshold (80)</span>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm text-zinc-300">Quality Radar</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="#27272a" strokeDasharray="2 2" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#71717a', fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#52525b', fontSize: 8 }}
                    tickCount={4}
                  />
                  <Radar
                    name="Quality"
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Individual Scores */}
          <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm text-zinc-300">Individual Scores</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="max-h-52">
                <div className="space-y-1.5">
                  {qualityChecks.map((check) => (
                    <div key={check.name} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-zinc-800/40 transition-colors">
                      <span className="text-xs text-zinc-400">{check.name}</span>
                      <span className={`text-xs font-semibold ${getScoreColor(check.score)}`}>
                        {check.score}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Review Queue */}
          <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-zinc-300">Review Queue</CardTitle>
                <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                  {reviewQueue.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {reviewQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-md border text-xs font-bold ${getScoreBg(item.qualityScore)}`}>
                        <span className={getScoreColor(item.qualityScore)}>{item.qualityScore}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                          {item.title}
                        </p>
                        <span className="text-[11px] text-zinc-600">{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
