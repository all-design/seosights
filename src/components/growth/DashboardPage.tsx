'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Wallet,
  Send,
  XCircle,
  GitMerge,
  Archive,
  Gauge,
  Eye,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
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
  BarChart,
  Bar,
  Cell,
} from 'recharts'

// ── Mock Data ──────────────────────────────────────────────────────────

const topMetrics = [
  { label: "Today's Growth", value: '+14 Assets', icon: TrendingUp, accent: 'emerald' },
  { label: 'Growth Budget', value: '18 / 20', icon: Wallet, accent: 'emerald', progress: 90 },
  { label: 'Published', value: '12', icon: Send, accent: 'emerald' },
  { label: 'Rejected', value: '6', icon: XCircle, accent: 'red' },
  { label: 'Merged', value: '3', icon: GitMerge, accent: 'cyan' },
  { label: 'Archived', value: '1', icon: Archive, accent: 'zinc' },
  { label: 'Quality Score', value: '96', icon: Gauge, accent: 'emerald' },
  { label: 'AI Visibility Gain', value: '+11', icon: Eye, accent: 'emerald' },
]

// North Star calculation
const northStarValues = {
  aiVisibilityGain: 11,
  citationGain: 8,
  entityGrowth: 5,
  organicGrowth: 7,
  knowledgeCoverage: 6,
  assetsPublished: 12,
}
const northStarValue = (
  (northStarValues.aiVisibilityGain +
    northStarValues.citationGain +
    northStarValues.entityGrowth +
    northStarValues.organicGrowth +
    northStarValues.knowledgeCoverage) /
  northStarValues.assetsPublished
).toFixed(1)

const budgetAllocation = [
  { name: 'Industry Pages', count: 8, color: '#34d399' },
  { name: 'Tools', count: 5, color: '#22d3ee' },
  { name: 'Research', count: 3, color: '#a78bfa' },
  { name: 'VS Pages', count: 2, color: '#fb923c' },
  { name: 'Resources', count: 2, color: '#f472b6' },
]

const recentActivity = [
  { id: 1, action: 'Published "AI-Powered SEO Audit Tool"', type: 'published', time: '2 min ago', status: 'success' },
  { id: 2, action: 'Generated "Machine Learning Entity Page"', type: 'generated', time: '8 min ago', status: 'success' },
  { id: 3, action: 'Rejected "Low-Quality Backlink Report"', type: 'rejected', time: '15 min ago', status: 'error' },
  { id: 4, action: 'Merged "NLP vs LLM Comparison" into KB', type: 'merged', time: '22 min ago', status: 'success' },
  { id: 5, action: 'Discovered 12 new keyword opportunities', type: 'discovery', time: '30 min ago', status: 'info' },
  { id: 6, action: 'Published "Entity Graph Visualization"', type: 'published', time: '45 min ago', status: 'success' },
  { id: 7, action: 'Quality review passed for "BERT Guide"', type: 'review', time: '1h ago', status: 'success' },
  { id: 8, action: 'Archived "Outdated API Reference"', type: 'archived', time: '1.5h ago', status: 'info' },
  { id: 9, action: 'Generated "Transformer Architecture Tool"', type: 'generated', time: '2h ago', status: 'success' },
  { id: 10, action: 'Rejected "Duplicate Content Analysis"', type: 'rejected', time: '2.5h ago', status: 'error' },
]

const trendData = [
  { day: 'Mon', published: 10, quality: 94, visibility: 8 },
  { day: 'Tue', published: 12, quality: 95, visibility: 9 },
  { day: 'Wed', published: 9, quality: 93, visibility: 7 },
  { day: 'Thu', published: 14, quality: 96, visibility: 11 },
  { day: 'Fri', published: 11, quality: 95, visibility: 10 },
  { day: 'Sat', published: 8, quality: 97, visibility: 9 },
  { day: 'Sun', published: 12, quality: 96, visibility: 11 },
]

const trendChartConfig = {
  published: { label: 'Published', color: '#34d399' },
  quality: { label: 'Quality Score', color: '#22d3ee' },
  visibility: { label: 'AI Visibility', color: '#a78bfa' },
} satisfies ChartConfig

const budgetChartData = budgetAllocation.map((b) => ({
  name: b.name,
  count: b.count,
  fill: b.color,
}))

const budgetChartConfig = {
  count: { label: 'Assets' },
  'Industry Pages': { label: 'Industry Pages', color: '#34d399' },
  Tools: { label: 'Tools', color: '#22d3ee' },
  Research: { label: 'Research', color: '#a78bfa' },
  'VS Pages': { label: 'VS Pages', color: '#fb923c' },
  Resources: { label: 'Resources', color: '#f472b6' },
} satisfies ChartConfig

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

// ── Status icon helper ─────────────────────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-400" />
    case 'info':
      return <Activity className="w-3.5 h-3.5 text-cyan-400" />
    default:
      return <Clock className="w-3.5 h-3.5 text-zinc-500" />
  }
}

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    generated: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
    merged: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    discovery: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    review: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  }
  return colors[type] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'
}

// ── Metric Card ────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  progress,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent: string
  progress?: number
}) {
  const iconColor = accent === 'emerald' ? 'text-emerald-400' : accent === 'red' ? 'text-red-400' : accent === 'cyan' ? 'text-cyan-400' : 'text-zinc-400'
  const glowColor = accent === 'emerald' ? 'bg-emerald-500/10' : accent === 'red' ? 'bg-red-500/10' : accent === 'cyan' ? 'bg-cyan-500/10' : 'bg-zinc-500/10'

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/60 transition-colors py-4 gap-3">
        <CardContent className="px-4 pt-0 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 font-medium">{label}</span>
            <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${glowColor}`}>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
          </div>
          <div className="text-xl font-bold text-zinc-100 tracking-tight">{value}</div>
          {progress !== undefined && (
            <div className="mt-2">
              <Progress value={progress} className="h-1.5 bg-zinc-800 [&>div]:bg-emerald-500" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Dashboard Page ────────────────────────────────────────────────

export function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Top Metrics Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {topMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            accent={metric.accent}
            progress={metric.progress}
          />
        ))}
      </div>

      {/* ── North Star + Growth Budget Row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* North Star Metric */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">
                  Platform Value Added Today
                </CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600 mt-1">
                (AI Visibility + Citation + Entity + Organic + Knowledge) / Published
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <motion.span
                  className="text-5xl font-bold text-emerald-400 tracking-tighter"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  {northStarValue}
                </motion.span>
                <div className="flex items-center gap-1 mb-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">+1.2 vs yesterday</span>
                </div>
              </div>
              {/* Breakdown */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {[
                  { label: 'AI Vis.', val: northStarValues.aiVisibilityGain },
                  { label: 'Citation', val: northStarValues.citationGain },
                  { label: 'Entity', val: northStarValues.entityGrowth },
                  { label: 'Organic', val: northStarValues.organicGrowth },
                  { label: 'Knowledge', val: northStarValues.knowledgeCoverage },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-sm font-semibold text-zinc-300">{item.val}</div>
                    <div className="text-[10px] text-zinc-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Budget Visualization */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-sm text-zinc-400 font-medium">
                    Growth Budget Allocation
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  18 / 20 used
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bar Chart */}
              <ChartContainer config={budgetChartConfig} className="h-[140px] w-full aspect-auto">
                <BarChart data={budgetChartData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={85} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {budgetChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>

              {/* Breakdown pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {budgetAllocation.map((b) => (
                  <div key={b.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-zinc-400">{b.name}</span>
                    <span className="text-zinc-500 font-medium">{b.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── 7-Day Trend + Recent Activity Row ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-Day Trend Chart */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">
                  7-Day Growth Trend
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-[200px] w-full aspect-auto">
                <LineChart data={trendData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="published"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ fill: '#34d399', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ fill: '#22d3ee', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="visibility"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: '#a78bfa', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ScrollArea className="h-[240px]">
                <div className="space-y-1 px-2">
                  {recentActivity.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="shrink-0">{getStatusIcon(activity.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 truncate">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 border ${getTypeBadge(activity.type)}`}
                          >
                            {activity.type}
                          </Badge>
                          <span className="text-[10px] text-zinc-600">{activity.time}</span>
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
