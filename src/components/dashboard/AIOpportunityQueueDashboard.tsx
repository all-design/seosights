'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Sparkles,
  Shield,
  FileCode2,
  Globe,
  MessageSquare,
  BookOpen,
  Star,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
type Priority = 'critical' | 'high' | 'medium' | 'low'
type OpportunityStatus = 'pending' | 'in_progress' | 'completed'
type Category = 'quick-win' | 'big-impact'

interface OpportunityItem {
  id: string
  title: string
  description: string
  roiScore: number
  scoreGain: number
  estimatedTime: string
  estimatedMinutes: number
  priority: Priority
  category: Category[]
  icon: string
  status: OpportunityStatus
}

interface OpportunityQueueData {
  opportunities: OpportunityItem[]
  summary: {
    totalPotentialGain: number
    totalEffortMinutes: number
    quickWinCount: number
  }
}

interface AIOpportunityQueueDashboardProps {
  domain: string
  userId?: string
}

// ── Icon mapping ────────────────────────────────────────────────────────
const ICON_MAP: Record<string, typeof FileCode2> = {
  schema: FileCode2,
  llmsTxt: Sparkles,
  meta: Target,
  wikipedia: BookOpen,
  reddit: MessageSquare,
  g2: Star,
  wikidata: Globe,
  eeat: Shield,
  default: Zap,
}

// ── Priority config ─────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', label: 'Critical' },
  high: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', label: 'High' },
  medium: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30', label: 'Medium' },
  low: { bg: 'bg-white/10', text: 'text-white/60', border: 'border-white/15', label: 'Low' },
}

// ── Status config ───────────────────────────────────────────────────────
const STATUS_STYLES: Record<OpportunityStatus, { bg: string; text: string; border: string; label: string; icon: typeof Circle }> = {
  pending: { bg: 'bg-white/5', text: 'text-muted-foreground', border: 'border-white/10', label: 'Pending', icon: Circle },
  in_progress: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'In Progress', icon: Loader2 },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Done', icon: CheckCircle2 },
}

const NEXT_STATUS: Record<OpportunityStatus, OpportunityStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}

// ── Fallback mock data ──────────────────────────────────────────────────
const FALLBACK_DATA: OpportunityQueueData = {
  summary: { totalPotentialGain: 57, totalEffortMinutes: 510, quickWinCount: 5 },
  opportunities: [
    { id: '1', title: 'Add JSON-LD structured data', description: 'Implement Organization + Product schema on all key pages to boost AI crawler understanding.', roiScore: 4.8, scoreGain: 8, estimatedTime: '20 min', estimatedMinutes: 20, priority: 'critical', category: ['quick-win', 'big-impact'], icon: 'schema', status: 'pending' },
    { id: '2', title: 'Create llms.txt in root directory', description: 'Add a machine-readable file that tells AI crawlers exactly what your site offers.', roiScore: 4.5, scoreGain: 5, estimatedTime: '10 min', estimatedMinutes: 10, priority: 'critical', category: ['quick-win'], icon: 'llmsTxt', status: 'in_progress' },
    { id: '3', title: 'Fix missing meta descriptions', description: '12 pages have no meta description. AI engines use these to understand page purpose.', roiScore: 4.2, scoreGain: 4, estimatedTime: '25 min', estimatedMinutes: 25, priority: 'high', category: ['quick-win'], icon: 'meta', status: 'pending' },
    { id: '4', title: 'Build Wikipedia presence', description: 'Create a notability-backed Wikipedia article. Claude and Gemini weight this heavily.', roiScore: 3.9, scoreGain: 12, estimatedTime: '3 hours', estimatedMinutes: 180, priority: 'high', category: ['big-impact'], icon: 'wikipedia', status: 'pending' },
    { id: '5', title: 'Launch Reddit engagement strategy', description: 'Answer 5 relevant questions per week in target subreddits to build citation sources.', roiScore: 3.6, scoreGain: 6, estimatedTime: '45 min', estimatedMinutes: 45, priority: 'medium', category: ['quick-win', 'big-impact'], icon: 'reddit', status: 'pending' },
    { id: '6', title: 'Claim & optimize G2 profile', description: 'G2 reviews are cited by ChatGPT and Perplexity. 8 reviews vs competitor\'s 312.', roiScore: 3.4, scoreGain: 7, estimatedTime: '30 min', estimatedMinutes: 30, priority: 'high', category: ['quick-win'], icon: 'g2', status: 'completed' },
    { id: '7', title: 'Build Wikidata entity record', description: 'Create a structured entity with 15+ statements. Gemini relies on Wikidata for fact-checking.', roiScore: 3.1, scoreGain: 10, estimatedTime: '2 hours', estimatedMinutes: 120, priority: 'medium', category: ['big-impact'], icon: 'wikidata', status: 'pending' },
    { id: '8', title: 'Implement E-E-A-T trust signals', description: 'Add author bios, "Why trust us" page, and editorial policy to satisfy AI trust criteria.', roiScore: 2.8, scoreGain: 5, estimatedTime: '1.5 hours', estimatedMinutes: 90, priority: 'low', category: ['big-impact'], icon: 'eeat', status: 'pending' },
  ],
}

// ── ROI badge color ─────────────────────────────────────────────────────
function getRoiBadgeColor(score: number) {
  if (score >= 4.5) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (score >= 3.5) return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  if (score >= 3.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  return 'bg-white/10 text-muted-foreground border-white/20'
}

function getScoreGainColor(gain: number) {
  if (gain >= 8) return 'text-emerald-400'
  if (gain >= 5) return 'text-purple-400'
  return 'text-amber-400'
}

// ── Main Component ───────────────────────────────────────────────────────
export default function AIOpportunityQueueDashboard({ domain, userId }: AIOpportunityQueueDashboardProps) {
  const [data, setData] = useState<OpportunityQueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'quick-win' | 'big-impact'>('quick-win')

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/ai/opportunity-queue?domain=${encodeURIComponent(domain)}${userId ? `&userId=${userId}` : ''}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch {
        setData(FALLBACK_DATA)
      } finally {
        setLoading(false)
      }
    }
    if (domain) loadData()
  }, [domain, userId])

  const opportunities = data?.opportunities ?? FALLBACK_DATA.opportunities
  const summary = data?.summary ?? FALLBACK_DATA.summary

  // Toggle status
  const handleStatusToggle = (id: string) => {
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        opportunities: prev.opportunities.map(o =>
          o.id === id ? { ...o, status: NEXT_STATUS[o.status] } : o
        ),
      }
    })
  }

  // Filtered + sorted
  const filtered = useMemo(() => {
    return opportunities
      .filter(o => o.category.includes(activeTab))
      .sort((a, b) => b.roiScore - a.roiScore)
  }, [opportunities, activeTab])

  const totalEffortHours = (summary.totalEffortMinutes / 60).toFixed(1)

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">ROI Opportunity Queue</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 rounded-lg bg-muted/30 animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">ROI Opportunity Queue</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load opportunity data</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">ROI Opportunity Queue</CardTitle>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
          {domain}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Summary Bar ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.07] via-purple-500/[0.05] to-emerald-500/[0.07] p-3">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-center">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Potential:</span>
              <span className="text-xs font-bold text-emerald-400">+{summary.totalPotentialGain} pts</span>
            </div>
            <div className="w-px h-3 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-muted-foreground">Effort:</span>
              <span className="text-xs font-bold text-purple-400">{totalEffortHours}h</span>
            </div>
            <div className="w-px h-3 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-muted-foreground">Quick wins:</span>
              <span className="text-xs font-bold text-amber-400">{summary.quickWinCount} &lt;30m</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick-win' | 'big-impact')}>
          <TabsList className="bg-black/30 border border-white/[0.06]">
            <TabsTrigger value="quick-win" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
              <Zap className="w-3.5 h-3.5 mr-1" />
              Quick Wins
            </TabsTrigger>
            <TabsTrigger value="big-impact" className="data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Big Impact
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <ScrollArea className="max-h-[520px] mt-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {filtered.map((item, index) => {
                    const Icon = ICON_MAP[item.icon] ?? ICON_MAP.default
                    const priorityStyle = PRIORITY_STYLES[item.priority]
                    const statusStyle = STATUS_STYLES[item.status]
                    const StatusIcon = statusStyle.icon
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        className={`rounded-lg border p-3 transition-colors ${
                          item.status === 'completed'
                            ? 'border-emerald-500/15 bg-emerald-500/[0.03] opacity-60'
                            : item.status === 'in_progress'
                            ? 'border-purple-500/15 bg-purple-500/[0.03]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/10'
                              : item.status === 'in_progress'
                              ? 'bg-purple-500/10'
                              : 'bg-emerald-500/10'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              item.status === 'completed'
                                ? 'text-emerald-400/60'
                                : item.status === 'in_progress'
                                ? 'text-purple-400'
                                : 'text-emerald-400'
                            }`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className={`text-sm font-semibold ${
                                item.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                              }`}>
                                {item.title}
                              </span>
                              <Badge variant="outline" className={`${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border} text-[10px] px-1.5 py-0`}>
                                {priorityStyle.label}
                              </Badge>
                              <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} text-[10px] px-1.5 py-0`}>
                                {statusStyle.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <Badge variant="outline" className={`${getRoiBadgeColor(item.roiScore)} text-[10px] px-1.5 py-0`}>
                                ROI {item.roiScore.toFixed(1)}
                              </Badge>
                              <span className={`text-xs font-bold tabular-nums ${getScoreGainColor(item.scoreGain)}`}>
                                +{item.scoreGain} pts
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {item.estimatedTime}
                              </span>
                            </div>
                          </div>

                          {/* Status toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 text-[10px]"
                            onClick={() => handleStatusToggle(item.id)}
                          >
                            <StatusIcon className={`w-3.5 h-3.5 ${statusStyle.text} ${item.status === 'in_progress' ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* ── ROI Distribution Visual ────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">ROI Distribution</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-1.5">
            {opportunities.slice(0, 5).map((item, i) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-32 sm:w-44 truncate shrink-0">{item.title}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-emerald-500/80' : i === 2 ? 'bg-purple-500' : i === 3 ? 'bg-purple-500/70' : 'bg-amber-500/70'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.roiScore / 5) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-8 text-right shrink-0">
                  {item.roiScore.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
