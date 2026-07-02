'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RotateCcw,
  Zap,
  LayoutDashboard,
  GitCompare,
  Rss,
  Mail,
  Wand2,
  Swords,
  Wrench,
  Sparkles,
  Brain,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Users,
  Activity,
} from 'lucide-react'
import QAOrchestrator from '@/components/superadmin/QAOrchestrator'
import DecisionLog from '@/components/superadmin/DecisionLog'
import AITwinInsights from '@/components/superadmin/AITwinInsights'

// ─── Types ──────────────────────────────────────────────────────────────

interface QAData {
  score: number
  warnings: number
  degraded: number
  critical: number
  passRate: number
  totalTests: number
  passed: number
  lastRun: string | null
}

interface FeatureAdoption {
  featureKey: string
  featureName: string
  activeUsersToday: number
  activeUsers7dAvg: number
  adoptionRate: number
  retention7d: number
  status: 'adopted' | 'at_risk' | 'low_adoption'
  trend: string
}

interface FeatureValidation {
  featureKey: string
  featureName: string
  usedCount: number
  avgSessionMin: number
  avgSessionSec: number
  convLift: number
  decision: 'KEEP' | 'REVIEW' | 'KILL'
}

interface RecentDecision {
  id: string
  changeTitle: string
  changeType: string
  aiScoreDelta: number
  createdAt: string
}

interface TopInsight {
  id: string
  title: string
  insightType: string
  priority: string
  description: string
  confidence: number
  status: string
}

interface ProductData {
  qa: QAData
  featureAdoption: FeatureAdoption[]
  featureValidation: FeatureValidation[]
  recentDecisions: RecentDecision[]
  topInsights: TopInsight[]
  summary: {
    adoptedCount: number
    atRiskCount: number
    lowAdoptionCount: number
    keepCount: number
    reviewCount: number
    killCount: number
  }
}

// ─── Feature icon map ────────────────────────────────────────────────────

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  replay: <RotateCcw className="h-4 w-4" />,
  auto_execute: <Zap className="h-4 w-4" />,
  mission_control: <LayoutDashboard className="h-4 w-4" />,
  diff: <GitCompare className="h-4 w-4" />,
  feed: <Rss className="h-4 w-4" />,
  digest: <Mail className="h-4 w-4" />,
  content_simulator: <Wand2 className="h-4 w-4" />,
  competitor_race: <Swords className="h-4 w-4" />,
  one_click_fix: <Wrench className="h-4 w-4" />,
}

// ─── Circular Progress Ring ──────────────────────────────────────────────

function CircularScore({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 95 ? '#10b981' : score >= 80 ? '#f59e0b' : score >= 60 ? '#f97316' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

// ─── Status color helpers ────────────────────────────────────────────────

const ADOPTION_STATUS: Record<string, { label: string; color: string; bgColor: string }> = {
  adopted: { label: 'Adopted', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10 border-emerald-400/20' },
  at_risk: { label: 'At Risk', color: 'text-amber-400', bgColor: 'bg-amber-400/10 border-amber-400/20' },
  low_adoption: { label: 'Low', color: 'text-red-400', bgColor: 'bg-red-400/10 border-red-400/20' },
}

const DECISION_STYLES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  KEEP: { label: 'KEEP', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  REVIEW: { label: 'REVIEW', icon: <AlertTriangle className="w-3 h-3" />, color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  KILL: { label: 'KILL', icon: <XCircle className="w-3 h-3" />, color: 'bg-red-400/10 text-red-400 border-red-400/20' },
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-400/10 text-red-400 border-red-400/20',
  high: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  medium: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  low: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  feature_added: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  content_change: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  schema_change: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  design_change: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  config_change: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  deploy: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  rollback: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
}

// ─── Format helpers ──────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
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

function formatSessionTime(min: number, sec: number): string {
  return `${min}m ${sec.toString().padStart(2, '0')}s`
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function ProductTab() {
  const [data, setData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningQA, setRunningQA] = useState(false)
  const [qaDialogOpen, setQaDialogOpen] = useState(false)
  const [decisionLogOpen, setDecisionLogOpen] = useState(false)
  const [aiTwinOpen, setAiTwinOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/product')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('[ProductTab] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const runQASuite = async () => {
    setRunningQA(true)
    try {
      const res = await fetch('/api/superadmin/qa/run', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        await fetchData()
      }
    } catch (err) {
      console.error('[ProductTab] QA run error:', err)
    } finally {
      setRunningQA(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
            <Layers className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-56 bg-white/5 rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-white/10 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                <div className="h-8 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Failed to load product data</p>
        <Button variant="ghost" size="sm" onClick={fetchData} className="ml-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    )
  }

  const qa = data.qa
  const adoption = data.featureAdoption
  const validation = data.featureValidation
  const decisions = data.recentDecisions
  const insights = data.topInsights
  const summary = data.summary

  return (
    <div className="space-y-6">
      {/* Custom scrollbar */}
      <style jsx global>{`
        .product-scroll::-webkit-scrollbar { width: 6px; }
        .product-scroll::-webkit-scrollbar-track { background: transparent; }
        .product-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .product-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Layers className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Product</h2>
            <p className="text-sm text-muted-foreground">Feature adoption, QA score, validation & AI insights</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 1: Daily QA Score Hero
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Score Ring */}
              <CircularScore score={qa.score} />

              {/* Score Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-foreground">Daily QA Score</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {qa.passed} of {qa.totalTests} tests passing
                </p>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                  {qa.warnings > 0 && (
                    <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {qa.warnings} warning{qa.warnings > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {qa.degraded > 0 && (
                    <Badge variant="outline" className="bg-orange-400/10 text-orange-400 border-orange-400/20">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {qa.degraded} degraded
                    </Badge>
                  )}
                  {qa.critical > 0 ? (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      <XCircle className="w-3 h-3 mr-1" />
                      {qa.critical} critical
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      0 critical
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Button
                    onClick={runQASuite}
                    disabled={runningQA}
                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-400/20"
                    size="sm"
                  >
                    {runningQA ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Running Suite...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Run Full Suite
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQaDialogOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View QA Orchestrator
                  </Button>
                </div>

                {/* Last Run Timestamp */}
                {qa.lastRun && (
                  <div className="flex items-center gap-1.5 mt-3 justify-center md:justify-start">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      Last run: {formatDate(qa.lastRun)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 2: Feature Adoption Grid
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">Feature Adoption</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-[10px]">
              {summary.adoptedCount} adopted
            </Badge>
            <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px]">
              {summary.atRiskCount} at risk
            </Badge>
            <Badge variant="outline" className="bg-red-400/10 text-red-400 border-red-400/20 text-[10px]">
              {summary.lowAdoptionCount} low
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {adoption.map((feature, idx) => {
            const statusConfig = ADOPTION_STATUS[feature.status]
            const icon = FEATURE_ICONS[feature.featureKey] || <Activity className="h-4 w-4" />

            return (
              <motion.div
                key={feature.featureKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <Card className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-white/20 transition-colors h-full">
                  <CardContent className="p-4">
                    {/* Feature Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={statusConfig.color}>{icon}</span>
                        <span className="text-sm font-medium text-foreground">{feature.featureName}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${statusConfig.bgColor}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Adoption Rate */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">Adoption</span>
                        <span className="text-sm font-bold text-foreground">{feature.adoptionRate}%</span>
                      </div>
                      <Progress
                        value={feature.adoptionRate}
                        className={`h-1.5 ${
                          feature.status === 'adopted'
                            ? '[&>[data-slot=progress-indicator]]:bg-emerald-400'
                            : feature.status === 'at_risk'
                            ? '[&>[data-slot=progress-indicator]]:bg-amber-400'
                            : '[&>[data-slot=progress-indicator]]:bg-red-400'
                        } bg-white/5`}
                      />
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-2 rounded-md bg-white/[0.02]">
                        <p className="text-[10px] text-muted-foreground">Today / 7d avg</p>
                        <p className="text-xs font-semibold text-foreground">
                          {feature.activeUsersToday} / {feature.activeUsers7dAvg}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-white/[0.02]">
                        <p className="text-[10px] text-muted-foreground">7d Retention</p>
                        <p className="text-xs font-semibold text-foreground">
                          {Math.round(feature.retention7d * 100)}%
                        </p>
                      </div>
                    </div>

                    {/* Trend indicator */}
                    <div className="flex items-center gap-1 mt-2">
                      {feature.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      ) : feature.trend === 'down' ? (
                        <ArrowDownRight className="w-3 h-3 text-red-400" />
                      ) : (
                        <Minus className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {feature.trend === 'up' ? 'Trending up' : feature.trend === 'down' ? 'Declining' : 'Stable'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 3: Feature Validation (Kill/Keep)
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">Feature Validation</h3>
            <span className="text-[11px] text-muted-foreground">Data-driven Kill / Keep</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-[10px]">
              {summary.keepCount} KEEP
            </Badge>
            <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px]">
              {summary.reviewCount} REVIEW
            </Badge>
            <Badge variant="outline" className="bg-red-400/10 text-red-400 border-red-400/20 text-[10px]">
              {summary.killCount} KILL
            </Badge>
          </div>
        </div>

        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Feature</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Used</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Avg Session</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Conv. Lift</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validation.map((feature, idx) => {
                    const decisionStyle = DECISION_STYLES[feature.decision]
                    return (
                      <motion.tr
                        key={feature.featureKey}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                        className="border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={feature.decision === 'KEEP' ? 'text-emerald-400' : feature.decision === 'REVIEW' ? 'text-amber-400' : 'text-red-400'}>
                              {FEATURE_ICONS[feature.featureKey] || <Activity className="h-4 w-4" />}
                            </span>
                            <span className="text-sm font-medium text-foreground">{feature.featureName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">{feature.usedCount}x</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">{formatSessionTime(feature.avgSessionMin, feature.avgSessionSec)}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-semibold ${
                            feature.convLift >= 10 ? 'text-emerald-400' : feature.convLift >= 3 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            +{feature.convLift}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`text-[10px] ${decisionStyle.color}`}>
                            {decisionStyle.icon}
                            <span className="ml-1">{decisionStyle.label}</span>
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 4: Decision Log (Embedded Compact)
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">Decision Log</h3>
            <span className="text-[11px] text-muted-foreground">Last 5 decisions</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDecisionLogOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 text-xs"
          >
            View Full Log
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-64 product-scroll">
              {decisions.length === 0 ? (
                <div className="p-6 text-center">
                  <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No decisions logged yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {decisions.map((decision, idx) => (
                    <motion.div
                      key={decision.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${CHANGE_TYPE_COLORS[decision.changeType] || 'bg-gray-400/10 text-gray-400 border-gray-400/20'}`}
                        >
                          {decision.changeType.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-foreground truncate">{decision.changeTitle}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <div className="flex items-center gap-1">
                          {decision.aiScoreDelta > 0 ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                          ) : decision.aiScoreDelta < 0 ? (
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                          ) : (
                            <Minus className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className={`text-xs font-semibold ${
                            decision.aiScoreDelta > 0 ? 'text-emerald-400' : decision.aiScoreDelta < 0 ? 'text-red-400' : 'text-muted-foreground'
                          }`}>
                            {decision.aiScoreDelta > 0 ? '+' : ''}{decision.aiScoreDelta}
                          </span>
                          <span className="text-[10px] text-muted-foreground">AI Δ</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground hidden sm:block">
                          {formatDate(decision.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          Section 5: AI Product Twin (Embedded Compact)
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">AI Product Twin™</h3>
            <span className="text-[11px] text-muted-foreground">Today&apos;s top recommendations</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiTwinOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 text-xs"
          >
            View All Insights
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-64 product-scroll">
              {insights.length === 0 ? (
                <div className="p-6 text-center">
                  <Sparkles className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No active insights</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Generate insights from the AI Product Twin panel</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {insights.map((insight, idx) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      className="p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.medium}`}
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground mb-1 leading-tight">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.description}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${
                              insight.insightType === 'daily_priority'
                                ? 'bg-purple-400/10 text-purple-400 border-purple-400/20'
                                : insight.insightType === 'risk_alert'
                                ? 'bg-red-400/10 text-red-400 border-red-400/20'
                                : insight.insightType === 'opportunity'
                                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                                : 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                            }`}
                          >
                            {insight.insightType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          Dialogs
          ══════════════════════════════════════════════════════════════════════ */}

      {/* QA Orchestrator Dialog */}
      <Dialog open={qaDialogOpen} onOpenChange={setQaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              QA Orchestrator
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] product-scroll">
            <QAOrchestrator />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Decision Log Dialog */}
      <Dialog open={decisionLogOpen} onOpenChange={setDecisionLogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Decision Log
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] product-scroll">
            <DecisionLog />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI Twin Insights Dialog */}
      <Dialog open={aiTwinOpen} onOpenChange={setAiTwinOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Brain className="w-5 h-5 text-emerald-400" />
              AI Product Twin™ Insights
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] product-scroll">
            <AITwinInsights />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
