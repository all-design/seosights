'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Shield,
  Copy,
  GitMerge,
  TrendingDown,
  HelpCircle,
  CheckCheck,
  AlertTriangle,
  XCircle,
  Unlock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ── Types ──────────────────────────────────────────────────────────────

type RejectionReason =
  | 'duplicate'
  | 'too_similar'
  | 'low_quality'
  | 'low_confidence'
  | 'already_covered'
  | 'low_evidence'

interface Rejection {
  id: string
  title: string
  reason: RejectionReason
  confidence: number
  overrideable: boolean
  overridden: boolean
  details: string
  timestamp: string
}

interface Override {
  id: string
  title: string
  overriddenBy: string
  reason: string
  timestamp: string
  outcome: string
}

// ── Reason Config ──────────────────────────────────────────────────────

const reasonConfig: Record<RejectionReason, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  duplicate: { label: 'Duplicate', icon: Copy, color: 'text-rose-400', bgColor: 'bg-rose-500/10' },
  too_similar: { label: 'Too Similar', icon: GitMerge, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  low_quality: { label: 'Low Quality', icon: TrendingDown, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  low_confidence: { label: 'Low Confidence', icon: HelpCircle, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  already_covered: { label: 'Already Covered', icon: CheckCheck, color: 'text-violet-400', bgColor: 'bg-violet-500/10' },
  low_evidence: { label: 'Low Evidence', icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
}

// ── Mock Data ──────────────────────────────────────────────────────────

const rejectionFeed: Rejection[] = [
  {
    id: '1',
    title: 'Dentist SEO Best Practices 2026',
    reason: 'duplicate',
    confidence: 96,
    overrideable: true,
    overridden: false,
    details: "Similar to existing page '/industries/dentists' (similarity: 0.94)",
    timestamp: '2 min ago',
  },
  {
    id: '2',
    title: 'Local SEO for Dental Clinics',
    reason: 'too_similar',
    confidence: 89,
    overrideable: true,
    overridden: false,
    details: "Similar to '/industries/dentists' (similarity: 0.87) — topic overlap >80%",
    timestamp: '15 min ago',
  },
  {
    id: '3',
    title: 'AI Citation Trends Q1 2026',
    reason: 'low_confidence',
    confidence: 52,
    overrideable: true,
    overridden: false,
    details: 'Discovery signal strength below threshold (0.34 < 0.6) — insufficient data to confirm opportunity',
    timestamp: '1h ago',
  },
  {
    id: '4',
    title: 'Quick SEO Tips for Beginners',
    reason: 'low_quality',
    confidence: 91,
    overrideable: false,
    overridden: false,
    details: 'Generated content quality score: 42/100 — below minimum threshold of 70',
    timestamp: '2h ago',
  },
  {
    id: '5',
    title: 'ChatGPT Optimization Guide',
    reason: 'already_covered',
    confidence: 87,
    overrideable: true,
    overridden: false,
    details: "Topic already comprehensively covered in '/blog/ai-visibility-guide' and '/tools/visibility-calculator'",
    timestamp: '3h ago',
  },
  {
    id: '6',
    title: 'Plumber Marketing Statistics 2025',
    reason: 'low_evidence',
    confidence: 78,
    overrideable: true,
    overridden: false,
    details: 'Only 2 supporting data sources found — minimum 5 required for statistical validity',
    timestamp: '4h ago',
  },
  {
    id: '7',
    title: 'SEO for Orthodontists',
    reason: 'too_similar',
    confidence: 82,
    overrideable: true,
    overridden: false,
    details: "Similar to '/industries/dentists' (similarity: 0.81) — consider expanding existing page instead",
    timestamp: '5h ago',
  },
  {
    id: '8',
    title: 'Generic Marketing Tips',
    reason: 'low_quality',
    confidence: 98,
    overrideable: false,
    overridden: false,
    details: 'Generated content quality score: 31/100 — far below minimum threshold of 70',
    timestamp: '6h ago',
  },
  {
    id: '9',
    title: 'AI Visibility FAQ Duplicate',
    reason: 'duplicate',
    confidence: 99,
    overrideable: false,
    overridden: false,
    details: "Exact duplicate of '/faq/ai-citation-factors' — content hash match",
    timestamp: '8h ago',
  },
]

const reasonBreakdown = [
  { reason: 'Duplicate', count: 18, color: '#f43f5e' },
  { reason: 'Too Similar', count: 12, color: '#f97316' },
  { reason: 'Low Quality', count: 8, color: '#f59e0b' },
  { reason: 'Low Confidence', count: 5, color: '#22d3ee' },
  { reason: 'Already Covered', count: 3, color: '#8b5cf6' },
  { reason: 'Low Evidence', count: 1, color: '#eab308' },
]

const recentOverrides: Override[] = [
  {
    id: '1',
    title: 'Voice Search Optimization Guide',
    overriddenBy: 'Sarah Chen',
    reason: 'Strategic importance — emerging trend that justifies the risk',
    timestamp: 'Yesterday 14:23',
    outcome: 'Published — gained 340 traffic in 24h',
  },
  {
    id: '2',
    title: 'Perplexity AI Ranking Factors',
    overriddenBy: 'Marcus Rodriguez',
    reason: 'Unique angle not covered by existing content',
    timestamp: '2 days ago 09:15',
    outcome: 'Published — earned 8 AI citations in 48h',
  },
  {
    id: '3',
    title: 'Dental SEO Case Study',
    overriddenBy: 'Sarah Chen',
    reason: 'Client requested — high-priority deliverable',
    timestamp: '3 days ago 16:45',
    outcome: 'Published — monitoring performance',
  },
]

// ── Sub-components ──────────────────────────────────────────────────────

function GovernorStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${color.includes('rose') ? 'bg-rose-500/10' : color.includes('amber') ? 'bg-amber-500/10' : color.includes('emerald') ? 'bg-emerald-500/10' : 'bg-cyan-500/10'}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <div className="text-2xl font-bold text-zinc-100 mb-0.5">{value}</div>
        <div className="text-xs text-zinc-500">{title}</div>
        <div className="text-[11px] text-zinc-600 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  )
}

function RejectionItem({
  rejection,
  onOverride,
}: {
  rejection: Rejection
  onOverride: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = reasonConfig[rejection.reason]
  const ReasonIcon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title and decision */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="text-sm font-medium text-zinc-200 truncate">{rejection.title}</h4>
            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/25 shrink-0">
              <XCircle className="w-3 h-3 mr-1" />
              REJECTED
            </Badge>
            {rejection.overridden && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 shrink-0">
                <Unlock className="w-3 h-3 mr-1" />
                OVERRIDDEN
              </Badge>
            )}
          </div>

          {/* Reason */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1 rounded ${config.bgColor}`}>
              <ReasonIcon className={`w-3.5 h-3.5 ${config.color}`} />
            </div>
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{rejection.timestamp}</span>
          </div>

          {/* Confidence bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">Confidence</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  rejection.confidence >= 90
                    ? 'bg-emerald-500'
                    : rejection.confidence >= 70
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${rejection.confidence}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 shrink-0">{rejection.confidence}%</span>
          </div>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        </div>

        {/* Override button */}
        {rejection.overrideable && !rejection.overridden && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs border-zinc-700 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10"
            onClick={() => onOverride(rejection.id)}
          >
            <Unlock className="w-3 h-3 mr-1" />
            Override
          </Button>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
              <p className="text-xs text-zinc-400 leading-relaxed">{rejection.details}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ReasonBarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { reason: string; count: number; color: string } }> }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-300 font-medium">{d.reason}</p>
      <p className="text-xs text-zinc-400">{d.count} rejections</p>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export default function GovernorPage() {
  const [rejections, setRejections] = useState(rejectionFeed)

  const handleOverride = (id: string) => {
    setRejections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, overridden: true } : r))
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Governor Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GovernorStatCard
          title="Total Rejections"
          value="47"
          subtitle="Last 30 days"
          icon={ShieldAlert}
          color="text-rose-400"
        />
        <GovernorStatCard
          title="Top Reason"
          value="Duplicate"
          subtitle="38% of all rejections"
          icon={Copy}
          color="text-orange-400"
        />
        <GovernorStatCard
          title="Override Rate"
          value="8%"
          subtitle="4 of 47 rejections overridden"
          icon={Unlock}
          color="text-amber-400"
        />
        <GovernorStatCard
          title="False Positive Rate"
          value="3%"
          subtitle="1 incorrect rejection identified"
          icon={ShieldCheck}
          color="text-emerald-400"
        />
      </div>

      {/* ── Rejection Feed ──────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Rejection Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                {rejections.length} items
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            {rejections.map((rejection) => (
              <RejectionItem
                key={rejection.id}
                rejection={rejection}
                onOverride={handleOverride}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Reason Breakdown ────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">
            Rejection Reason Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reasonBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<ReasonBarTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                  {reasonBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Overrides ────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Recent Overrides
            </CardTitle>
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {recentOverrides.length} overrides
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {recentOverrides.map((override) => (
              <motion.div
                key={override.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
                    <h4 className="text-sm font-medium text-zinc-200">{override.title}</h4>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">{override.timestamp}</span>
                </div>

                <div className="ml-6 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">By:</span>
                    <span className="text-zinc-300">{override.overriddenBy}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-zinc-500 shrink-0">Reason:</span>
                    <span className="text-zinc-400">{override.reason}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-zinc-500 shrink-0">Outcome:</span>
                    <span className="text-emerald-400">{override.outcome}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
