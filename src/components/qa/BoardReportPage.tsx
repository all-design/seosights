'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Shield,
  Target,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

// ── Mock Data ──────────────────────────────────────────────────────────

const dailyReport = {
  date: 'June 30, 2026',
  productScore: 92,
  ux: 88,
  engineering: 97,
  research: 95,
  conversion: 81,
  enterprise: 84,
  technicalDebt: 12,
  customerDelight: 79,
  biggestRisk: 'Homepage too feature-focused',
  todayPriority: 'Improve onboarding',
  confidence: '94%',
}

const reportArchive = [
  {
    date: 'June 29',
    scores: { product: 91, ux: 87, engineering: 96, research: 94, conversion: 80, enterprise: 83 },
    risk: 'Onboarding drop-off at step 4',
    priority: 'Fix onboarding form validation',
  },
  {
    date: 'June 28',
    scores: { product: 90, ux: 86, engineering: 97, research: 94, conversion: 79, enterprise: 82 },
    risk: 'API error rate spike on /users',
    priority: 'Investigate /users 500 errors',
  },
  {
    date: 'June 27',
    scores: { product: 90, ux: 87, engineering: 96, research: 93, conversion: 78, enterprise: 82 },
    risk: 'Homepage CTA below fold on mobile',
    priority: 'Redesign mobile hero section',
  },
  {
    date: 'June 26',
    scores: { product: 89, ux: 85, engineering: 95, research: 93, conversion: 77, enterprise: 81 },
    risk: 'Performance regression on /dashboard',
    priority: 'Optimize dashboard bundle size',
  },
  {
    date: 'June 25',
    scores: { product: 88, ux: 84, engineering: 95, research: 92, conversion: 76, enterprise: 80 },
    risk: 'Cookie consent banner blocking CTAs',
    priority: 'Fix cookie banner overlay issue',
  },
  {
    date: 'June 24',
    scores: { product: 87, ux: 83, engineering: 94, research: 92, conversion: 75, enterprise: 79 },
    risk: 'Accessibility audit failed 3 WCAG criteria',
    priority: 'Fix contrast and keyboard issues',
  },
  {
    date: 'June 23',
    scores: { product: 86, ux: 82, engineering: 94, research: 91, conversion: 74, enterprise: 78 },
    risk: 'Pricing page confusing for new visitors',
    priority: 'Simplify pricing tiers',
  },
]

const trend30Day = Array.from({ length: 30 }, (_, i) => ({
  day: `Jun ${i + 1}`,
  score: 85 + Math.round(Math.sin(i / 5) * 3 + i * 0.2 + Math.random() * 2),
}))

const trendChartConfig = {
  score: { label: 'Product Score', color: '#34d399' },
} satisfies ChartConfig

const executiveSummary = `The platform shows strong overall health at 92/100, up from 86 a week ago. Engineering excellence (97) continues to be our strongest pillar, while Conversion (81) remains our primary growth bottleneck. The homepage is overly feature-focused, creating cognitive overload for first-time visitors. Today's priority is improving the onboarding flow — reducing it from 7 steps to 3 would significantly impact our conversion funnel. Customer delight at 79 suggests users find value but struggle to reach the "aha moment" quickly. Technical debt is well-managed at 12 items. The team should focus on three key actions: (1) simplify onboarding, (2) redesign the homepage hero section, and (3) add a guided first-run experience. With 94% confidence in our assessment, we expect a 5-8 point improvement in the next sprint if these priorities are addressed.`

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Archive Item Component ─────────────────────────────────────────────

function ArchiveItem({ report }: { report: typeof reportArchive[0] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg bg-zinc-800/30 border border-zinc-800/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-300">{report.date}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            {report.scores.product}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-800/40">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {Object.entries(report.scores).map(([key, val]) => (
              <div key={key} className="text-center">
                <span className="text-sm font-bold text-zinc-200">{val}</span>
                <p className="text-[9px] text-zinc-500 capitalize">{key}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-[10px]">
            <p className="text-red-400">Risk: {report.risk}</p>
            <p className="text-emerald-400">Priority: {report.priority}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Board Report Page ─────────────────────────────────────────────

export function BoardReportPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Daily Board Report ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Daily Board Report™</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">{dailyReport.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 uppercase">Product Score</span>
                <p className="text-2xl font-bold text-emerald-400 mt-0.5">{dailyReport.productScore}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 uppercase">UX</span>
                <p className="text-2xl font-bold text-violet-400 mt-0.5">{dailyReport.ux}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 uppercase">Engineering</span>
                <p className="text-2xl font-bold text-blue-400 mt-0.5">{dailyReport.engineering}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 uppercase">Research</span>
                <p className="text-2xl font-bold text-purple-400 mt-0.5">{dailyReport.research}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 uppercase">Conversion</span>
                <p className="text-2xl font-bold text-orange-400 mt-0.5">{dailyReport.conversion}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 uppercase">Enterprise</span>
                <p className="text-2xl font-bold text-cyan-400 mt-0.5">{dailyReport.enterprise}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Technical Debt</span>
                  <p className="text-sm font-bold text-orange-400">{dailyReport.technicalDebt} items</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Customer Delight</span>
                  <p className="text-sm font-bold text-cyan-400">{dailyReport.customerDelight}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Biggest Risk</span>
                </div>
                <p className="text-sm font-medium text-red-400">{dailyReport.biggestRisk}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Today&apos;s Priority</span>
                </div>
                <p className="text-sm font-medium text-emerald-400">{dailyReport.todayPriority}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Confidence</span>
                </div>
                <p className="text-sm font-bold text-emerald-400">{dailyReport.confidence}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 30-Day Score Trend ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">30-Day Score Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[200px] w-full aspect-auto">
              <LineChart data={trend30Day} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis domain={[80, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Report Archive ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Report Archive</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">Last 7 daily reports — click to expand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportArchive.map((report) => (
                <ArchiveItem key={report.date} report={report} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Executive Summary ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-emerald-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Executive Summary</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">AI-generated analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 leading-relaxed">{executiveSummary}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
