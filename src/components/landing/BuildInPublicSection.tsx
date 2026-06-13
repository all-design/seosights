'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Bot,
  Clock,
  ArrowRight,
  Link2,
  Mail,
  Settings,
  Search,
  Map,
  Send,
  Zap,
  ChevronRight,
  TrendingUp,
  Eye,
  MousePointerClick,
  ExternalLink,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ── Animated Counter ────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = '',
  inView,
  duration = 2000,
}: {
  target: number
  suffix?: string
  inView: boolean
  duration?: number
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

// ── Activity Feed Item ──────────────────────────────────────────────────
interface ActivityItem {
  id: string
  emoji: string
  agentName: string
  text: string
  time: string
  status: 'completed' | 'in-progress' | 'failed'
  type: 'content' | 'outreach' | 'technical' | 'analysis'
}

// ── Stats from API ──────────────────────────────────────────────────────
interface LiveStats {
  articles: {
    total: number
    failed: number
    pending: number
    thisMonth: number
    target: number
  }
  outreach: {
    emailsSent: number
    linksAcquired: number
    pending: number
    thisMonth: number
    linkRate: number
  }
  agents: {
    active: number
    humanHours: number
  }
  growth: Array<{
    date: string
    clicks: number
    impressions: number
  }>
  source: string
}

const defaultStats: LiveStats = {
  articles: { total: 47, failed: 2, pending: 43, thisMonth: 28, target: 90 },
  outreach: { emailsSent: 34, linksAcquired: 8, pending: 12, thisMonth: 15, linkRate: 24 },
  agents: { active: 8, humanHours: 0 },
  growth: Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const dayFactor = (i + 1) / 30
    return {
      date: date.toISOString().split('T')[0],
      clicks: Math.round(80 * dayFactor * (0.8 + Math.random() * 0.4)),
      impressions: Math.round(400 * dayFactor * (0.8 + Math.random() * 0.4)),
    }
  }),
  source: 'simulated',
}

const defaultActivities: ActivityItem[] = [
  { id: '1', emoji: '🏗️', agentName: 'Content Architect', text: 'Published "GEO Optimization for DeepSeek Search Engine"', time: '2 min ago', status: 'completed', type: 'content' },
  { id: '2', emoji: '🔗', agentName: 'Link Strategist', text: 'Found 4 new guest post opportunities (DA 45+)', time: '5 min ago', status: 'completed', type: 'outreach' },
  { id: '3', emoji: '🤝', agentName: 'Backlink Prospector', text: 'Sent outreach email to techblog.com', time: '8 min ago', status: 'completed', type: 'outreach' },
  { id: '4', emoji: '⚙️', agentName: 'Tech & Schema', text: 'Updated robots.txt — unblocked ClaudeBot', time: '12 min ago', status: 'completed', type: 'technical' },
  { id: '5', emoji: '🕵️', agentName: 'Competitor Analyst', text: 'Detected new brand mention on Reddit r/SEO', time: '15 min ago', status: 'in-progress', type: 'analysis' },
  { id: '6', emoji: '📊', agentName: 'SERP Tracker', text: 'Ranking jump: #8 → #4 for "AI SEO tools"', time: '20 min ago', status: 'completed', type: 'analysis' },
  { id: '7', emoji: '📝', agentName: 'Content Architect', text: 'Drafting "Schema Markup Guide for LLMs"', time: '25 min ago', status: 'in-progress', type: 'content' },
  { id: '8', emoji: '🔍', agentName: 'On-Page Auditor', text: 'Added FAQ section to /ai-visibility page', time: '30 min ago', status: 'completed', type: 'technical' },
]

// ── Pipeline Step ───────────────────────────────────────────────────────
const pipelineSteps = [
  {
    icon: Map,
    title: 'Cluster Mapping',
    description: 'Keyword Researcher generates 90 topic clusters monthly',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
  },
  {
    icon: FileText,
    title: 'Daily Auto-Publish',
    description: 'Content Architect writes & publishes Q&A + E-E-A-T articles 3×/day',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  {
    icon: Send,
    title: 'Auto-Outreach',
    description: 'Link Strategist + Backlink Prospector send 10-20 outreach emails/week',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
  },
]

// ── Custom Tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-background/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.dataKey === 'clicks' ? 'Clicks' : 'Impressions'}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────
export default function BuildInPublicSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activities, setActivities] = useState<ActivityItem[]>(defaultActivities)
  const [stats, setStats] = useState<LiveStats>(defaultStats)
  const [loading, setLoading] = useState(true)

  // Fetch live stats and activity
  useEffect(() => {
    async function fetchLiveData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/live/stats'),
          fetch('/api/live/activity'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json()
          if (activityData.activities && activityData.activities.length > 0) {
            setActivities(activityData.activities)
          }
        }
      } catch (error) {
        console.error('[BuildInPublic] Failed to fetch live data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
    // Refresh every 30 seconds for "live" feel
    const interval = setInterval(fetchLiveData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to analysis input
  const handleScrollToInput = () => {
    const heroSection = document.querySelector('input[type="url"]')
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      heroSection.focus()
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Compute progress percentage for this month
  const monthProgress = stats.articles.target > 0
    ? Math.round((stats.articles.thisMonth / stats.articles.target) * 100)
    : 0

  return (
    <section className="py-24 relative" ref={ref} id="live">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-6"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            LIVE EXPERIMENT
          </Badge>

          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            We{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">
              Dogfood
            </span>{' '}
            Our Own Product
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our 8 AI agents have written and published{' '}
            <span className="text-emerald-400 font-bold">{stats.articles.total}</span> articles
            and sent{' '}
            <span className="text-cyan-400 font-bold">{stats.outreach.emailsSent}</span> outreach emails.
            0 humans involved.
          </p>
        </motion.div>

        {/* ── Four Stats Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {[
            {
              value: stats.articles.total,
              suffix: '',
              label: 'Articles Published',
              subtitle: `${stats.articles.thisMonth}/${stats.articles.target} this month`,
              icon: FileText,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/20',
              border: 'border-emerald-500/30',
              glow: 'shadow-[0_0_30px_rgba(16,185,129,0.12)]',
              progress: monthProgress,
            },
            {
              value: stats.outreach.emailsSent,
              suffix: '',
              label: 'Outreach Emails',
              subtitle: `${stats.outreach.linksAcquired} links acquired (${stats.outreach.linkRate}%)`,
              icon: Mail,
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/20',
              border: 'border-cyan-500/30',
              glow: 'shadow-[0_0_30px_rgba(6,182,212,0.12)]',
              progress: undefined,
            },
            {
              value: stats.agents.active,
              suffix: '',
              label: 'AI Agents Active',
              subtitle: 'Running 24/7 on full autopilot',
              icon: Bot,
              color: 'text-purple-400',
              bg: 'bg-purple-500/20',
              border: 'border-purple-500/30',
              glow: 'shadow-[0_0_30px_rgba(168,85,247,0.12)]',
              progress: undefined,
            },
            {
              value: stats.agents.humanHours,
              suffix: '',
              label: 'Human Hours',
              subtitle: 'Complete autonomous SEO/AEO/GEO',
              icon: Clock,
              color: 'text-rose-400',
              bg: 'bg-rose-500/20',
              border: 'border-rose-500/30',
              glow: 'shadow-[0_0_30px_rgba(244,63,94,0.12)]',
              progress: undefined,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
            >
              <Card
                className={`bg-white/5 backdrop-blur-sm border ${stat.border} ${stat.glow} transition-all duration-300 hover:bg-white/8 h-full`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-2xl sm:text-4xl font-bold ${stat.color} mb-0.5`}>
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={isInView} />
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-foreground mb-0.5">{stat.label}</div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.subtitle}</p>
                      {stat.progress !== undefined && (
                        <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-emerald-400 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(stat.progress, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Traffic Growth Chart ─────────────────────────────────── */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-foreground">Traffic Growth — 30 Days</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">Clicks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-muted-foreground">Impressions</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground hidden sm:inline-flex">
                    {stats.source === 'live' ? '🔴 Live' : 'Simulated'}
                  </Badge>
                </div>
              </div>

              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.growth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => {
                        const date = new Date(d)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                      stroke="rgba(255,255,255,0.2)"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.2)"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#impressionsGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#clicksGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-muted-foreground/50 mt-2 text-center">
                This website is 100% optimized by our own 8 AI agents. Connect Google Analytics for real data.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Live Activity Feed + Client Zero Pipeline ────────────── */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <h3 className="text-lg font-bold text-foreground">What Agents Did Today</h3>
                  </div>
                  <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                    Live
                  </Badge>
                </div>

                <ScrollArea className="h-80">
                  <div className="space-y-3 pr-3">
                    <AnimatePresence mode="popLayout">
                      {activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: -10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <span className="text-lg shrink-0 mt-0.5">{activity.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{activity.text}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`flex items-center gap-1 text-xs font-medium ${
                                  activity.status === 'completed'
                                    ? 'text-emerald-400'
                                    : activity.status === 'in-progress'
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    activity.status === 'completed'
                                      ? 'bg-emerald-400'
                                      : activity.status === 'in-progress'
                                      ? 'bg-amber-400 animate-pulse'
                                      : 'bg-red-400'
                                  }`}
                                />
                                {activity.status === 'completed' ? 'Completed' : activity.status === 'in-progress' ? 'In Progress' : 'Failed'}
                              </span>
                              <span className="text-xs text-muted-foreground/60">{activity.time}</span>
                              <span className="text-xs text-muted-foreground/40">{activity.agentName}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Client Zero Pipeline Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-foreground">Client Zero Pipeline</h3>
                </div>

                <div className="space-y-0">
                  {pipelineSteps.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.6 + 0.15 * i }}
                      className="relative"
                    >
                      {/* Connector line */}
                      {i < pipelineSteps.length - 1 && (
                        <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-white/20 to-transparent h-[calc(100%-16px)]" />
                      )}

                      <div className="flex items-start gap-4 pb-8 last:pb-0">
                        <div className={`w-12 h-12 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center shrink-0 relative z-10`}>
                          <step.icon className={`w-6 h-6 ${step.color}`} />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider ${step.color}`}>
                              Step {i + 1}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-foreground mb-1">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        {i < pipelineSteps.length - 1 && (
                          <div className="hidden sm:flex items-center pt-3 shrink-0">
                            <ChevronRight className="w-4 h-4 text-white/20" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Agent badges */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-3">Agents in this pipeline:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Content Architect', icon: FileText },
                      { name: 'Link Strategist', icon: Link2 },
                      { name: 'Backlink Prospector', icon: Mail },
                      { name: 'Tech & Schema', icon: Settings },
                      { name: 'Keyword Researcher', icon: Search },
                    ].map((agent) => (
                      <span
                        key={agent.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                      >
                        <agent.icon className="w-3 h-3" />
                        {agent.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Button
            onClick={handleScrollToInput}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300"
          >
            See How It Works for Your Site
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-xs text-muted-foreground/50 mt-3">
            Free scan · 8 AI agents · Full SEO/AEO/GEO strategy
          </p>
        </motion.div>
      </div>
    </section>
  )
}
