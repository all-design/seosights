'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  ArrowUpRight,
  DollarSign,
  Activity,
  AlertTriangle,
  Zap,
  Mail,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface KeyMetrics {
  mrr: { value: number; trend: number }
  aiScore: { value: number; goal: number }
  activationRate: { value: number; activated: number; total: number }
  netChurn: { value: number }
}

interface FunnelStep {
  step: string
  count: number
  conversion: number | null
}

interface DailyTrendPoint {
  date: string
  visitors: number
  registrations: number
  paidUsers: number
}

interface ChurnRiskUser {
  id: string
  user: string
  plan: string
  daysInactive: number
  churnRisk: string
  suggestedAction: string
}

interface AIScoreTrendPoint {
  date: string
  overall: number
  chatgpt: number
  claude: number
  gemini: number
  perplexity: number
}

interface GrowthLever {
  id: string
  title: string
  description: string
  impact: string
  count: number
  cta: string
}

interface GrowthData {
  keyMetrics: KeyMetrics
  funnel: FunnelStep[]
  dailyTrend: DailyTrendPoint[]
  churnRiskUsers: ChurnRiskUser[]
  aiScoreTrend: AIScoreTrendPoint[]
  growthLevers: GrowthLever[]
  status: string
  confidence: number
  fallbacksUsed: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${n.toLocaleString('en-US')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function churnRiskColor(risk: string): string {
  switch (risk) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'high': return 'bg-red-500/15 text-red-300 border-red-500/25'
    case 'medium': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'low': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    default: return 'bg-white/10 text-muted-foreground border-white/10'
  }
}

function planBadgeColor(plan: string): string {
  switch (plan) {
    case 'pro': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'starter': return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'managed': return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    default: return 'bg-white/10 text-muted-foreground border-white/10'
  }
}

// ─── Stagger Animation Variants ─────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ─── Sub-Components ─────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  trend,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend?: number
  suffix?: string
}) {
  return (
    <Card className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-emerald-500/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FunnelVisualization({ funnel }: { funnel: FunnelStep[] }) {
  const maxCount = Math.max(...funnel.map((s) => s.count), 1)

  return (
    <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {funnel.map((step, idx) => {
            const widthPercent = (step.count / maxCount) * 100
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs text-muted-foreground w-24 text-right truncate">
                  {step.step}
                </span>
                <div className="flex-1 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.6, ease: 'easeOut' }}
                    className="h-9 rounded-md bg-gradient-to-r from-emerald-500/40 to-emerald-600/20 flex items-center px-3 min-w-[40px]"
                  >
                    <span className="text-xs font-semibold text-emerald-300">
                      {step.count.toLocaleString()}
                    </span>
                  </motion.div>
                </div>
                {step.conversion !== null && (
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 shrink-0">
                    {step.conversion.toFixed(1)}%
                  </Badge>
                )}
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function SevenDayTrendChart({ data }: { data: DailyTrendPoint[] }) {
  return (
    <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          7-Day Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,15,15,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="visitors" fill="rgba(16,185,129,0.3)" name="Visitors" radius={[4, 4, 0, 0]} />
              <Bar dataKey="registrations" fill="rgba(16,185,129,0.5)" name="Registrations" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paidUsers" fill="rgba(16,185,129,0.8)" name="Paid Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function ChurnRiskPanel({ users }: { users: ChurnRiskUser[] }) {
  return (
    <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Churn Risk
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 ml-auto">
            Top {users.length} At Risk
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="max-h-80">
          <div className="space-y-3">
            {users.map((u, idx) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{u.user}</span>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${planBadgeColor(u.plan)}`}>
                      {u.plan}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${churnRiskColor(u.churnRisk)} ${
                        u.churnRisk === 'critical' ? 'animate-pulse' : ''
                      }`}
                    >
                      {u.churnRisk}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{u.daysInactive}d inactive</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    {u.suggestedAction}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 text-xs border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 h-7">
                  <Mail className="h-3 w-3 mr-1" />
                  Reach Out
                </Button>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function AIScoreTrendChart({ data, goal }: { data: AIScoreTrendPoint[]; goal: number }) {
  return (
    <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-400" />
          AI Score Trend — Client Zero
          <span className="text-xs text-muted-foreground ml-1">(seosights.com)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickFormatter={formatDate}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,15,15,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}
              />
              <ReferenceLine
                y={goal}
                stroke="rgba(16,185,129,0.5)"
                strokeDasharray="6 3"
                label={{ value: `Goal: ${goal}`, fill: 'rgba(16,185,129,0.7)', fontSize: 11, position: 'right' }}
              />
              <Line type="monotone" dataKey="overall" stroke="rgba(16,185,129,0.9)" strokeWidth={2.5} dot={false} name="Overall" />
              <Line type="monotone" dataKey="chatgpt" stroke="rgba(34,197,94,0.7)" strokeWidth={1.5} dot={false} name="ChatGPT" />
              <Line type="monotone" dataKey="claude" stroke="rgba(251,146,60,0.7)" strokeWidth={1.5} dot={false} name="Claude" />
              <Line type="monotone" dataKey="gemini" stroke="rgba(96,165,250,0.7)" strokeWidth={1.5} dot={false} name="Gemini" />
              <Line type="monotone" dataKey="perplexity" stroke="rgba(167,139,250,0.7)" strokeWidth={1.5} dot={false} name="Perplexity" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function GrowthLeversPanel({ levers }: { levers: GrowthLever[] }) {
  const leverIcons: Record<string, React.ReactNode> = {
    connect_gsc: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    first_auto_execute: <Zap className="h-5 w-5 text-amber-400" />,
    digest_setup: <Mail className="h-5 w-5 text-blue-400" />,
    upgrade_prompt: <ArrowUpRight className="h-5 w-5 text-purple-400" />,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {levers.map((lever, idx) => (
        <motion.div
          key={lever.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
        >
          <Card className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-emerald-500/20 transition-colors h-full">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5 shrink-0">
                  {leverIcons[lever.id] || <Activity className="h-5 w-5 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{lever.title}</h4>
                    <span className="text-lg font-bold text-emerald-400">{lever.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{lever.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      {lever.impact}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 h-7"
                    >
                      {lever.cta}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function GrowthTab() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGrowthData() {
      try {
        setLoading(true)
        const res = await fetch('/api/superadmin/growth')
        if (!res.ok) throw new Error('Failed to fetch growth data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchGrowthData()
  }, [])

  // ── Error State ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">Error loading growth data: {error}</p>
          <Button
            variant="outline"
            className="mt-4 border-white/10 hover:border-emerald-500/30"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  // ── Loading State ─────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { keyMetrics, funnel, dailyTrend, churnRiskUsers, aiScoreTrend, growthLevers } = data

  // ── AI Score Progress toward Goal ─────────────────────────────────────
  const aiScoreProgress = Math.min(100, Math.round((keyMetrics.aiScore.value / keyMetrics.aiScore.goal) * 100))

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Growth</h2>
          <p className="text-sm text-muted-foreground">Analytics, churn, benchmarks, and AI score trends</p>
        </div>
        {data.status !== 'live' && (
          <Badge variant="outline" className="ml-auto text-xs border-amber-500/30 text-amber-400">
            {data.status === 'estimated' ? 'Estimated' : 'Fallback'} · {data.confidence}% confidence
          </Badge>
        )}
      </motion.div>

      {/* ── Section 1: Key Growth Metrics ───────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* MRR */}
          <MetricCard
            icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            label="MRR"
            value={formatCurrency(keyMetrics.mrr.value)}
            trend={keyMetrics.mrr.trend}
          />
          {/* AI Score */}
          <Card className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-emerald-500/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Target className="h-4 w-4 text-emerald-400" />
                <span className="truncate">AI Score (Client Zero)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{keyMetrics.aiScore.value}</p>
                <span className="text-sm text-muted-foreground">/ {keyMetrics.aiScore.goal}</span>
              </div>
              <div className="mt-2">
                <Progress value={aiScoreProgress} className="h-1.5 bg-white/5" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {keyMetrics.aiScore.goal - keyMetrics.aiScore.value} points to goal
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Activation Rate */}
          <MetricCard
            icon={<Users className="h-4 w-4 text-emerald-400" />}
            label="Activation Rate"
            value={`${keyMetrics.activationRate.value}%`}
            suffix="activated"
          />
          {/* Net Churn */}
          <Card className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-emerald-500/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="truncate">Net Churn</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${keyMetrics.netChurn.value <= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                  {keyMetrics.netChurn.value}%
                </p>
                <span className="text-sm text-muted-foreground">monthly</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {keyMetrics.netChurn.value <= 2 ? 'Below target' : keyMetrics.netChurn.value <= 5 ? 'Monitor closely' : 'Action needed'}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Section 2: Funnel Visualization ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <FunnelVisualization funnel={funnel} />
      </motion.div>

      {/* ── Section 3: 7-Day Trend Chart ───────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SevenDayTrendChart data={dailyTrend} />
      </motion.div>

      {/* ── Section 4: Churn Risk Panel ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <ChurnRiskPanel users={churnRiskUsers} />
      </motion.div>

      {/* ── Section 5: AI Score Trend (Client Zero) ─────────────────────── */}
      <motion.div variants={itemVariants}>
        <AIScoreTrendChart data={aiScoreTrend} goal={keyMetrics.aiScore.goal} />
      </motion.div>

      {/* ── Section 6: Growth Levers ────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-foreground">Growth Levers</h3>
          <span className="text-xs text-muted-foreground">— Quick wins to move the needle</span>
        </div>
        <GrowthLeversPanel levers={growthLevers} />
      </motion.div>
    </motion.div>
  )
}
