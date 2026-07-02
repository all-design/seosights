'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Brain,
  AlertTriangle,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Shield,
  BarChart3,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  ArrowUpRight,
  Lightbulb,
  Rocket,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface AITwinInsight {
  id: string
  date: string
  insightType: string
  priority: string
  title: string
  description: string
  recommendations: string | null
  dataSources: string | null
  confidence: number
  status: string
  implementedAt?: string | null
  impactMeasured: boolean
  impactResult?: string | null
  createdAt: string
}

interface BriefingItem {
  order: number
  action: string
  expectedImpact: string
  effort: string
}

interface WeeklySummary {
  implemented: AITwinInsight[]
  totalImplemented: number
  totalInsights: number
}

// ─── Config ─────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-400 border-red-400/20', icon: <AlertTriangle className="w-3 h-3" /> },
  high: { label: 'High', color: 'bg-amber-400/10 text-amber-400 border-amber-400/20', icon: <Zap className="w-3 h-3" /> },
  medium: { label: 'Medium', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20', icon: <Target className="w-3 h-3" /> },
  low: { label: 'Low', color: 'bg-gray-400/10 text-gray-400 border-gray-400/20', icon: <Clock className="w-3 h-3" /> },
}

const INSIGHT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  daily_priority: { label: 'Daily Priority', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  weekly_review: { label: 'Weekly Review', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  risk_alert: { label: 'Risk Alert', color: 'bg-red-400/10 text-red-400 border-red-400/20' },
  opportunity: { label: 'Opportunity', color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  benchmark_gap: { label: 'Benchmark Gap', color: 'bg-purple-400/10 text-purple-400 border-purple-400/20' },
}

const EFFORT_COLORS: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
}

// ─── Briefing Card ──────────────────────────────────────────────────────

function BriefingCard({ briefing }: { briefing: BriefingItem[] }) {
  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 via-card/80 to-purple-500/5 backdrop-blur-sm border-emerald-400/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-400/10">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Today&apos;s Briefing</h3>
            <p className="text-xs text-muted-foreground">If I were Product Manager today, I&apos;d do:</p>
          </div>
        </div>

        <div className="space-y-3">
          {briefing.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-400/10 text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                {item.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.action}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-0.5">
                    <ArrowUpRight className="w-2.5 h-2.5" />
                    {item.expectedImpact}
                  </span>
                  <span className={`text-[11px] ${EFFORT_COLORS[item.effort] || 'text-gray-400'}`}>
                    Effort: {item.effort}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] shrink-0 ${
                  item.effort === 'low'
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                    : item.effort === 'medium'
                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    : 'bg-red-400/10 text-red-400 border-red-400/20'
                }`}
              >
                {item.effort.toUpperCase()}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Insight Card ───────────────────────────────────────────────────────

function InsightCard({
  insight,
  isExpanded,
  onToggle,
  onAction,
}: {
  insight: AITwinInsight
  isExpanded: boolean
  onToggle: () => void
  onAction: (action: string, insightId: string) => void
}) {
  const priorityConfig = PRIORITY_CONFIG[insight.priority] || PRIORITY_CONFIG.medium
  const typeConfig = INSIGHT_TYPE_CONFIG[insight.insightType] || { label: insight.insightType, color: 'bg-gray-400/10 text-gray-400 border-gray-400/20' }

  const dataSources = (() => {
    try {
      return insight.dataSources ? JSON.parse(insight.dataSources) : []
    } catch {
      return []
    }
  })()

  const recommendations = (() => {
    try {
      return insight.recommendations ? JSON.parse(insight.recommendations) : []
    } catch {
      return []
    }
  })()

  const impactResult = (() => {
    try {
      return insight.impactResult ? JSON.parse(insight.impactResult) : null
    } catch {
      return null
    }
  })()

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <Card className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="outline" className={`text-[10px] ${priorityConfig.color}`}>
                  {priorityConfig.icon}
                  <span className="ml-0.5">{priorityConfig.label}</span>
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${typeConfig.color}`}>
                  {typeConfig.label}
                </Badge>
                {insight.status === 'implemented' && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                    Implemented
                  </Badge>
                )}
                {insight.status === 'dismissed' && (
                  <Badge variant="outline" className="text-[10px] bg-gray-400/10 text-gray-400 border-gray-400/20">
                    <XCircle className="w-2.5 h-2.5 mr-0.5" />
                    Dismissed
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Confidence Score */}
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400/60"
                    style={{ width: `${insight.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(insight.confidence * 100)}%</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{insight.description}</p>

          {/* Data Sources Chips */}
          {dataSources.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              {dataSources.map((ds: { source: string; metric: string; value: string }, idx: number) => (
                <Badge key={idx} variant="outline" className="text-[9px] bg-white/[0.02] text-muted-foreground border-white/5">
                  {ds.source}: {ds.metric} = {ds.value}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons (only for active insights) */}
          {insight.status === 'active' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <Button
                size="sm"
                variant="ghost"
                className="text-[11px] h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                onClick={(e) => { e.stopPropagation(); onAction('implement', insight.id) }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Implement
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[11px] h-7 text-gray-400 hover:text-gray-300 hover:bg-gray-400/10"
                onClick={(e) => { e.stopPropagation(); onAction('dismiss', insight.id) }}
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[11px] h-7 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                onClick={(e) => { e.stopPropagation(); onAction('snooze', insight.id) }}
              >
                <BellOff className="w-3 h-3 mr-1" />
                Snooze
              </Button>
              <span className="text-[10px] text-muted-foreground ml-auto">
                <Clock className="w-3 h-3 inline mr-0.5" />
                {formatDate(insight.createdAt)}
              </span>
            </div>
          )}

          {/* Impact measured (for implemented insights) */}
          {insight.status === 'implemented' && insight.impactMeasured && impactResult && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Measured Impact:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(impactResult).map(([key, value], idx) => (
                  <Badge key={idx} variant="outline" className="text-[9px] bg-emerald-400/5 text-emerald-400 border-emerald-400/10">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded: Recommendations */}
      <AnimatePresence>
        {isExpanded && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/40 backdrop-blur-sm border-white/5 mt-1">
              <CardContent className="p-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Recommendations</h5>
                <div className="space-y-2">
                  {recommendations.map((rec: { order?: number; action: string; expectedImpact: string; effort: string }, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-white/[0.02]">
                      {rec.order && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-bold shrink-0">
                          {rec.order}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground">{rec.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-emerald-400">{rec.expectedImpact}</span>
                          <span className={`text-[10px] ${EFFORT_COLORS[rec.effort] || ''}`}>{rec.effort}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function AITwinInsights() {
  const [insights, setInsights] = useState<AITwinInsight[]>([])
  const [briefing, setBriefing] = useState<BriefingItem[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ implemented: [], totalImplemented: 0, totalInsights: 0 })
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/ai-twin')
      const json = await res.json()
      setInsights(json.insights || [])
      setBriefing(json.briefing || [])
      setWeeklySummary(json.weeklySummary || { implemented: [], totalImplemented: 0, totalInsights: 0 })
      setTotalActive(json.totalActive || 0)
    } catch (err) {
      console.error('[AITwinInsights] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateInsights = async () => {
    setGenerating(true)
    try {
      await fetch('/api/superadmin/ai-twin', { method: 'POST' })
      await fetchData()
    } catch (err) {
      console.error('[AITwinInsights] Generate error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleAction = async (action: string, insightId: string) => {
    try {
      const newStatus = action === 'implement' ? 'implemented' : action === 'dismiss' ? 'dismissed' : 'snoozed'
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, status: newStatus } : i))
      setTotalActive(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[AITwinInsights] Action error:', err)
    }
  }

  // Filter insights
  const filteredInsights = insights.filter(insight => {
    if (filterPriority !== 'all' && insight.priority !== filterPriority) return false
    if (filterType !== 'all' && insight.insightType !== filterType) return false
    if (filterStatus !== 'all' && insight.status !== filterStatus) return false
    return true
  })

  // Weekly summary stats
  const implementationRate = weeklySummary.totalInsights > 0
    ? ((weeklySummary.totalImplemented / weeklySummary.totalInsights) * 100).toFixed(0)
    : '0'

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading AI Twin insights...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <style jsx global>{`
        .ai-twin-scroll::-webkit-scrollbar { width: 6px; }
        .ai-twin-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-twin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .ai-twin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-400/10">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Product Twin™</h3>
            <p className="text-xs text-muted-foreground">Daily AI PM recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchData}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={generateInsights}
            disabled={generating}
            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-400/20"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Brain className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate Insights
          </Button>
        </div>
      </div>

      {/* ── Today's Briefing Hero ────────────────────────────────────────── */}
      {briefing.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <BriefingCard briefing={briefing} />
        </motion.div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Insights', value: totalActive, icon: <Lightbulb className="w-4 h-4 text-amber-400" /> },
          { label: 'Implemented This Week', value: weeklySummary.totalImplemented, icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
          { label: 'Total Insights', value: weeklySummary.totalInsights, icon: <BarChart3 className="w-4 h-4 text-blue-400" /> },
          { label: 'Implementation Rate', value: `${implementationRate}%`, icon: <Rocket className="w-4 h-4 text-purple-400" /> },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {stat.icon}
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-background/50 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[110px] h-8 text-xs bg-background/50 border-white/10">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50 border-white/10">
            <SelectValue placeholder="Insight Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(INSIGHT_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Insight Cards ────────────────────────────────────────────────── */}
      <ScrollArea className="max-h-[calc(100vh-520px)]">
        <div className="space-y-3 pr-3">
          {filteredInsights.length === 0 ? (
            <Card className="bg-card/40 backdrop-blur-sm border-white/5">
              <CardContent className="p-8 text-center">
                <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No insights match your filters</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting filters or generate new insights</p>
              </CardContent>
            </Card>
          ) : (
            filteredInsights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <InsightCard
                  insight={insight}
                  isExpanded={expandedInsight === insight.id}
                  onToggle={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                  onAction={handleAction}
                />
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* ── Weekly Summary ───────────────────────────────────────────────── */}
      {weeklySummary.implemented.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Weekly Summary
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {weeklySummary.totalImplemented} of {weeklySummary.totalInsights} insights implemented this week
              </p>
            </CardHeader>
            <CardContent>
              <Progress
                value={weeklySummary.totalInsights > 0 ? (weeklySummary.totalImplemented / weeklySummary.totalInsights) * 100 : 0}
                className="h-2 bg-white/5 mb-4"
              />

              <div className="space-y-2">
                {weeklySummary.implemented.slice(0, 3).map((impl, idx) => {
                  const implImpact = (() => {
                    try {
                      return impl.impactResult ? JSON.parse(impl.impactResult) : null
                    } catch {
                      return null
                    }
                  })()

                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs text-foreground truncate">{impl.title}</span>
                      </div>
                      {implImpact && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {Object.entries(implImpact).slice(0, 2).map(([key, value], i) => (
                            <Badge key={i} variant="outline" className="text-[9px] bg-emerald-400/5 text-emerald-400 border-emerald-400/10">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
