'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CircleDot,
  TrendingUp,
  Clock,
  Target,
  Zap,
  ArrowUpRight,
  Bug,
  Palette,
  Package,
  Type,
  Eye,
  Gauge,
  Lock,
  Search,
  Telescope,
  FileText,
  Users,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

const scoreGrid = [
  { label: 'Product', score: 92, icon: Package, accent: 'blue' },
  { label: 'UX', score: 88, icon: Palette, accent: 'violet' },
  { label: 'Engineering', score: 97, icon: Shield, accent: 'emerald' },
  { label: 'Research', score: 95, icon: Telescope, accent: 'purple' },
  { label: 'Conversion', score: 81, icon: TrendingUp, accent: 'orange' },
  { label: 'Enterprise', score: 84, icon: Lock, accent: 'cyan' },
]

const issueSummary = [
  { label: 'Critical', count: 2, accent: 'red' },
  { label: 'Major', count: 8, accent: 'orange' },
  { label: 'Medium', count: 14, accent: 'amber' },
  { label: 'Minor', count: 37, accent: 'zinc' },
]

const trendData = [
  { day: 'Mon', score: 88 },
  { day: 'Tue', score: 89 },
  { day: 'Wed', score: 87 },
  { day: 'Thu', score: 90 },
  { day: 'Fri', score: 91 },
  { day: 'Sat', score: 90 },
  { day: 'Sun', score: 91 },
]

const trendChartConfig = {
  score: { label: 'Health Score', color: '#34d399' },
} satisfies ChartConfig

const recentIssues = [
  { id: 1, title: 'Homepage CTA below fold on mobile', severity: 'major', section: 'Growth', time: '12 min ago' },
  { id: 2, title: 'Onboarding step 3 validation error', severity: 'critical', section: 'Functional', time: '25 min ago' },
  { id: 3, title: 'Pricing table contrast ratio 3.1:1', severity: 'medium', section: 'Accessibility', time: '1h ago' },
  { id: 4, title: 'Hero text says "leverage" 3 times', severity: 'minor', section: 'Copy', time: '1.5h ago' },
  { id: 5, title: 'Dashboard LCP 3.2s on 3G', severity: 'major', section: 'Performance', time: '2h ago' },
  { id: 6, title: 'Missing alt text on 12 images', severity: 'medium', section: 'Accessibility', time: '2.5h ago' },
  { id: 7, title: 'API /users returns 500 on empty query', severity: 'critical', section: 'Functional', time: '3h ago' },
  { id: 8, title: 'Confusing flow: Settings → Profile → Edit', severity: 'medium', section: 'UX', time: '3.5h ago' },
  { id: 9, title: 'Cookie missing SameSite attribute', severity: 'major', section: 'Security', time: '4h ago' },
  { id: 10, title: 'Duplicate H1 on /features page', severity: 'minor', section: 'SEO', time: '5h ago' },
]

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Accent helpers ─────────────────────────────────────────────────────

function getAccentClasses(accent: string, type: 'text' | 'bg' | 'border' | 'glow' | 'progress') {
  const map: Record<string, Record<string, string>> = {
    red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'bg-red-500/5', progress: '[&>div]:bg-red-500' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'bg-orange-500/5', progress: '[&>div]:bg-orange-500' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'bg-amber-500/5', progress: '[&>div]:bg-amber-500' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'bg-emerald-500/5', progress: '[&>div]:bg-emerald-500' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', glow: 'bg-violet-500/5', progress: '[&>div]:bg-violet-500' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'bg-blue-500/5', progress: '[&>div]:bg-blue-500' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'bg-cyan-500/5', progress: '[&>div]:bg-cyan-500' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'bg-purple-500/5', progress: '[&>div]:bg-purple-500' },
    zinc: { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', glow: 'bg-zinc-500/5', progress: '[&>div]:bg-zinc-500' },
  }
  return map[accent]?.[type] || ''
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'major': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'minor': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  }
}

// ── Main Overview Page ─────────────────────────────────────────────────

export function OverviewPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Hero: Product Health Score ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Product Health Score</p>
                  <div className="flex items-end gap-2 mt-1">
                    <motion.span
                      className="text-6xl font-bold text-emerald-400 tracking-tighter"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    >
                      91
                    </motion.span>
                    <span className="text-sm text-zinc-500 mb-2">/ 100</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-zinc-400">Last Run: 2 hours ago</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">+3 vs last week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Score Grid (2x3) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {scoreGrid.map((item) => {
          const Icon = item.icon
          return (
            <motion.div key={item.label} variants={itemVariants}>
              <Card className="bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/60 transition-colors py-4 gap-3">
                <CardContent className="px-4 pt-0 pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500 font-medium">{item.label}</span>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${getAccentClasses(item.accent, 'bg')}`}>
                      <Icon className={`w-3.5 h-3.5 ${getAccentClasses(item.accent, 'text')}`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getAccentClasses(item.accent, 'text')} tracking-tight`}>
                    {item.score}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Issue Summary (4 severity cards) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {issueSummary.map((item) => (
          <motion.div key={item.label} variants={itemVariants}>
            <Card className={`bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/60 transition-colors py-4 gap-3`}>
              <CardContent className="px-4 pt-0 pb-0">
                <span className="text-xs text-zinc-500 font-medium">{item.label}</span>
                <div className={`text-3xl font-bold mt-1 ${getAccentClasses(item.accent, 'text')}`}>
                  {item.count}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Technical Debt + Customer Delight Row ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Technical Debt */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Technical Debt</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-orange-400 tracking-tight">12</span>
                <span className="text-xs text-zinc-500 mb-1">items tracked</span>
              </div>
              <Progress value={40} className="h-2 bg-zinc-800 [&>div]:bg-orange-500" />
              <p className="text-[10px] text-zinc-600 mt-2">Low debt — well within healthy range</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Delight */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Customer Delight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-cyan-400 tracking-tight">79</span>
                <span className="text-xs text-zinc-500 mb-1">/ 100</span>
              </div>
              <Progress value={79} className="h-2 bg-zinc-800 [&>div]:bg-cyan-500" />
              <p className="text-[10px] text-zinc-600 mt-2">Good — focus on onboarding to improve</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Biggest Risk + Today's Priority + Confidence Row ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Biggest Risk */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-red-500/20 hover:border-red-500/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Biggest Risk</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-red-400">Homepage too feature-focused</p>
              <p className="text-xs text-zinc-500 mt-1">Overwhelming for new visitors. Simplify hero section.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Priority */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Today&apos;s Priority</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-emerald-400">Improve onboarding</p>
              <p className="text-xs text-zinc-500 mt-1">Reduce steps from 7 to 3. Add progress indicator.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confidence */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Confidence</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-emerald-400 tracking-tight">94</span>
                <span className="text-sm text-zinc-500 mb-0.5">%</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">High confidence in product direction</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── 7-Day Score Trend + Recent Issues Row ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-Day Score Trend */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">7-Day Score Trend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-[200px] w-full aspect-auto">
                <LineChart data={trendData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    dot={{ fill: '#34d399', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Issues */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Recent Issues</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600">Last 10 issues found</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ScrollArea className="h-[230px]">
                <div className="space-y-1 px-2">
                  {recentIssues.map((issue, idx) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 truncate">{issue.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 border ${getSeverityColor(issue.severity)}`}
                          >
                            {issue.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 border border-zinc-700 text-zinc-400 bg-zinc-800/50"
                          >
                            {issue.section}
                          </Badge>
                          <span className="text-[10px] text-zinc-600">{issue.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
