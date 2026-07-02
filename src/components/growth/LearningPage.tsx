'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import {
  Brain,
  TrendingUp,
  Eye,
  CheckCircle2,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  CheckCheck,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── Mock Data ──────────────────────────────────────────────────────────

const predictionVsActual = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  const predicted = 400 + Math.sin(i * 0.3) * 80 + i * 5
  const gap = i < 15
    ? (Math.random() - 0.3) * 60
    : (Math.random() - 0.5) * 30
  const actual = predicted + gap
  return {
    day: `Day ${day}`,
    predicted: Math.round(predicted),
    actual: Math.round(actual),
    match: Math.abs(gap) < 25,
  }
})

const confidenceOverTime = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  confidence: Math.min(97, 62 + i * 1.1 + Math.random() * 3),
}))

interface LearningEntry {
  id: string
  asset: string
  predicted: { traffic: number; citations: number }
  actual: { traffic: number; citations: number }
  trafficError: string
  citationError: string
  lesson: string
  applied: boolean
}

const learningFeed: LearningEntry[] = [
  {
    id: '1',
    asset: '/industries/dentists-seo',
    predicted: { traffic: 500, citations: 12 },
    actual: { traffic: 478, citations: 14 },
    trafficError: '-4.4%',
    citationError: '+16.7%',
    lesson:
      'Industry pages consistently over-predict traffic by 5%, under-predict citations by 15%',
    applied: true,
  },
  {
    id: '2',
    asset: '/blog/ai-visibility-guide',
    predicted: { traffic: 820, citations: 28 },
    actual: { traffic: 845, citations: 26 },
    trafficError: '+3.0%',
    citationError: '-7.1%',
    lesson:
      'Blog content traffic predictions are within 5% accuracy — model is well-calibrated',
    applied: true,
  },
  {
    id: '3',
    asset: '/services/local-seo-audit',
    predicted: { traffic: 340, citations: 8 },
    actual: { traffic: 290, citations: 9 },
    trafficError: '-14.7%',
    citationError: '+12.5%',
    lesson:
      'Service pages in competitive niches underperform traffic predictions by 10-15%',
    applied: false,
  },
  {
    id: '4',
    asset: '/industries/plumbers-near-me',
    predicted: { traffic: 620, citations: 18 },
    actual: { traffic: 608, citations: 17 },
    trafficError: '-1.9%',
    citationError: '-5.6%',
    lesson:
      '"Near me" pages show high prediction accuracy — local intent signal is reliable',
    applied: true,
  },
  {
    id: '5',
    asset: '/case-studies/restaurant-growth',
    predicted: { traffic: 210, citations: 5 },
    actual: { traffic: 268, citations: 7 },
    trafficError: '+27.6%',
    citationError: '+40.0%',
    lesson:
      'Case study pages significantly outperform predictions when containing specific metrics',
    applied: false,
  },
  {
    id: '6',
    asset: '/faq/ai-citation-factors',
    predicted: { traffic: 390, citations: 10 },
    actual: { traffic: 385, citations: 11 },
    trafficError: '-1.3%',
    citationError: '+10.0%',
    lesson:
      'FAQ pages are the most predictable asset type — consider increasing budget allocation',
    applied: true,
  },
  {
    id: '7',
    asset: '/compare/chatgpt-vs-claude-seo',
    predicted: { traffic: 720, citations: 22 },
    actual: { traffic: 695, citations: 20 },
    trafficError: '-3.5%',
    citationError: '-9.1%',
    lesson:
      'Comparison pages underperform when both subjects have similar visibility scores',
    applied: true,
  },
  {
    id: '8',
    asset: '/tools/visibility-calculator',
    predicted: { traffic: 450, citations: 15 },
    actual: { traffic: 520, citations: 19 },
    trafficError: '+15.6%',
    citationError: '+26.7%',
    lesson:
      'Interactive tool pages exceed predictions by 15%+ — strong engagement signal for AI citations',
    applied: false,
  },
]

// ── Sub-components ──────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  accent = 'emerald',
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  trend?: string
  trendUp?: boolean
  accent?: string
}) {
  const accentColors: Record<string, { icon: string; bg: string; border: string; text: string }> = {
    emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    rose: { icon: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
  }
  const c = accentColors[accent] || accentColors.emerald

  return (
    <Card className="bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${c.bg} ${c.border} border`}>
            <Icon className={`w-4 h-4 ${c.icon}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-zinc-100 mb-0.5">{value}</div>
        <div className="text-xs text-zinc-500">{title}</div>
        <div className="text-[11px] text-zinc-600 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  )
}

function ConfidenceGauge({ value }: { value: number }) {
  return (
    <div className="relative flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-zinc-800"
        />
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${(value / 100) * 138.23} 138.23`}
          strokeLinecap="round"
          className="text-emerald-400"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="absolute text-xs font-bold text-emerald-400">{value}%</span>
    </div>
  )
}

function LearningFeedItem({ entry }: { entry: LearningEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="text-sm font-medium text-zinc-200 truncate">{entry.asset}</span>
        </div>
        {entry.applied ? (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20 shrink-0">
            <CheckCheck className="w-3 h-3 mr-1" />
            Applied
          </Badge>
        ) : (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20 shrink-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Predicted */}
        <div className="p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Predicted</div>
          <div className="text-xs text-zinc-300">
            Traffic: <span className="font-mono text-cyan-400">{entry.predicted.traffic}</span>
            {' · '}
            Citations: <span className="font-mono text-cyan-400">{entry.predicted.citations}</span>
          </div>
        </div>

        {/* Actual */}
        <div className="p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Actual</div>
          <div className="text-xs text-zinc-300">
            Traffic: <span className="font-mono text-emerald-400">{entry.actual.traffic}</span>
            {' · '}
            Citations: <span className="font-mono text-emerald-400">{entry.actual.citations}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-xs font-mono ${entry.trafficError.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
          Traffic {entry.trafficError}
        </span>
        <span className="text-zinc-700">·</span>
        <span className={`text-xs font-mono ${entry.citationError.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
          Citations {entry.citationError}
        </span>
      </div>

      {/* Lesson */}
      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
        <div className="text-[10px] uppercase tracking-wider text-emerald-500/70 mb-1">Lesson Learned</div>
        <p className="text-xs text-zinc-400 leading-relaxed">{entry.lesson}</p>
      </div>
    </motion.div>
  )
}

// ── Custom Tooltip ──────────────────────────────────────────────────────

function PredictionTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-mono" style={{ color: p.color }}>
          {p.dataKey === 'predicted' ? 'Predicted' : 'Actual'}: {p.value}
        </p>
      ))}
    </div>
  )
}

function ConfidenceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className="text-xs font-mono text-emerald-400">Confidence: {payload[0].value.toFixed(1)}%</p>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export default function LearningPage() {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* ── Top Metrics Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prediction Accuracy"
          value="84%"
          subtitle="Across all asset types"
          icon={Brain}
          trend="↑3%"
          trendUp={true}
          accent="emerald"
        />
        <MetricCard
          title="Confidence"
          value="91%"
          subtitle="Model certainty level"
          icon={Gauge}
          accent="cyan"
        />
        <MetricCard
          title="AI Visibility Gain"
          value="+213"
          subtitle="Cumulative from learned optimizations"
          icon={Eye}
          trend="↑28"
          trendUp={true}
          accent="amber"
        />
        <MetricCard
          title="Successful Assets"
          value="83%"
          subtitle="Met or exceeded predictions"
          icon={CheckCircle2}
          trend="↑5%"
          trendUp={true}
          accent="rose"
        />
      </div>

      {/* ── Confidence Gauge Highlight ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Model Confidence</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-0">
            <ConfidenceGauge value={91} />
            <div className="space-y-2 flex-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Traffic predictions</span>
                  <span className="text-zinc-300 font-mono">89%</span>
                </div>
                <Progress value={89} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Citation predictions</span>
                  <span className="text-zinc-300 font-mono">93%</span>
                </div>
                <Progress value={93} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">Ranking predictions</span>
                  <span className="text-zinc-300 font-mono">86%</span>
                </div>
                <Progress value={86} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Accuracy by Asset Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {[
              { type: 'FAQ Pages', accuracy: 96, color: 'emerald' },
              { type: 'Blog Posts', accuracy: 91, color: 'emerald' },
              { type: 'Industry Pages', accuracy: 84, color: 'amber' },
              { type: 'Comparison Pages', accuracy: 79, color: 'amber' },
              { type: 'Service Pages', accuracy: 72, color: 'rose' },
              { type: 'Case Studies', accuracy: 68, color: 'rose' },
            ].map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">{item.type}</span>
                  <span className={`font-mono ${item.color === 'emerald' ? 'text-emerald-400' : item.color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
                    {item.accuracy}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Prediction vs Actual Chart ──────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Prediction vs Actual Performance
            </CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded-full bg-cyan-400" />
                <span className="text-zinc-500">Predicted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-500">Actual</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionVsActual} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PredictionTooltip />} />
                <ReferenceLine
                  x="Day 15"
                  stroke="#52525b"
                  strokeDasharray="3 3"
                  label={{ value: 'Model update', fill: '#71717a', fontSize: 10, position: 'top' }}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#predGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#22d3ee' }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-3 px-1">
            <div className="flex-1 h-1 rounded-full bg-emerald-500/30" />
            <span className="text-[10px] text-zinc-500 shrink-0">← Learning gap closing over time →</span>
            <div className="flex-1 h-1 rounded-full bg-emerald-500/10" />
          </div>
        </CardContent>
      </Card>

      {/* ── Learning Feed ───────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Learning Feed
            </CardTitle>
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {learningFeed.length} entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            {learningFeed.map((entry) => (
              <LearningFeedItem key={entry.id} entry={entry} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Model Confidence Over Time ─────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Model Confidence Over Time
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono">+29%</span>
              <span className="text-zinc-500">improvement</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={confidenceOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  domain={[55, 100]}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ConfidenceTooltip />} />
                <Area
                  type="monotone"
                  dataKey="confidence"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#confidenceGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
