'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  type LucideIcon,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  Activity,
  Star,
  HelpCircle,
  Mic,
  MessageSquare,
  Brain,
  ShieldCheck,
  Award,
  Hash,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  AlertOctagon,
  Bot,
  BarChart3,
  Lock,
  RefreshCw,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type SightKey = 'seo' | 'aeo' | 'geo'
type EngineStatus = 'visible' | 'blocked' | 'partial'
type TrendDir = 'up' | 'down'

interface KpiData {
  label: string
  value: string
  delta: string
  trend: TrendDir
  goodDirection: TrendDir
  icon: LucideIcon
  spark: number[]
}

interface EnginePillData {
  name: string
  status: EngineStatus
}

interface SightConfig {
  key: SightKey
  label: string
  tabLabel: string
  headline: string
  color: string
  textClass: string
  borderClass: string
  bgClass: string
  glowClass: string
  kpis: KpiData[]
  engines: EnginePillData[]
  chartData: number[]
  chartLabel: string
  blockedCrawlers?: string[]
  llmsTxtPresent?: boolean
}

// ─── Per-sight config ────────────────────────────────────────────────────────

const SIGHTS: Record<SightKey, SightConfig> = {
  seo: {
    key: 'seo',
    label: 'SEO',
    tabLabel: 'SEO',
    headline: 'Traditional Search Visibility',
    color: '#10b981',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/10',
    glowClass: 'shadow-[0_0_40px_rgba(16,185,129,0.10)]',
    kpis: [
      { label: 'Organic Traffic', value: '48.2K', delta: '+12.4%', trend: 'up', goodDirection: 'up', icon: TrendingUp, spark: [40, 42, 41, 46, 48] },
      { label: 'Avg Position', value: '4.7', delta: '-1.3', trend: 'down', goodDirection: 'down', icon: Target, spark: [6.1, 5.8, 5.5, 5.1, 4.7] },
      { label: 'Indexed Pages', value: '1,284', delta: '+38', trend: 'up', goodDirection: 'up', icon: FileText, spark: [1200, 1220, 1240, 1260, 1284] },
      { label: 'Core Web Vitals', value: '92', delta: '+5', trend: 'up', goodDirection: 'up', icon: Activity, spark: [82, 84, 87, 89, 92] },
    ],
    engines: [
      { name: 'Google', status: 'visible' },
    ],
    chartData: [42, 48, 55, 63],
    chartLabel: 'Organic visibility — last 4 weeks',
  },
  aeo: {
    key: 'aeo',
    label: 'AEO',
    tabLabel: 'AEO',
    headline: 'Answer Engine Optimization',
    color: '#06b6d4',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    bgClass: 'bg-cyan-500/10',
    glowClass: 'shadow-[0_0_40px_rgba(6,182,212,0.10)]',
    kpis: [
      { label: 'Featured Snippets', value: '47', delta: '+9', trend: 'up', goodDirection: 'up', icon: Star, spark: [32, 35, 38, 42, 47] },
      { label: 'PAA Boxes', value: '213', delta: '+24', trend: 'up', goodDirection: 'up', icon: HelpCircle, spark: [170, 182, 195, 203, 213] },
      { label: 'Voice Search Ready', value: '68%', delta: '+6%', trend: 'up', goodDirection: 'up', icon: Mic, spark: [55, 58, 61, 64, 68] },
      { label: 'Answer Coverage', value: '84%', delta: '+11%', trend: 'up', goodDirection: 'up', icon: MessageSquare, spark: [68, 72, 76, 80, 84] },
    ],
    engines: [
      { name: 'Google', status: 'visible' },
      { name: 'Siri', status: 'partial' },
      { name: 'Alexa', status: 'partial' },
      { name: 'Google Assistant', status: 'visible' },
    ],
    chartData: [38, 44, 52, 61],
    chartLabel: 'Answer visibility — last 4 weeks',
  },
  geo: {
    key: 'geo',
    label: 'GEO',
    tabLabel: 'GEO',
    headline: 'Generative Engine Optimization',
    color: '#f59e0b',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/10',
    glowClass: 'shadow-[0_0_40px_rgba(245,158,11,0.10)]',
    kpis: [
      { label: 'AI Citation Probability', value: '73%', delta: '+8%', trend: 'up', goodDirection: 'up', icon: Brain, spark: [58, 62, 66, 70, 73] },
      { label: 'ChatGPT Trust Score', value: '8.4/10', delta: '+0.6', trend: 'up', goodDirection: 'up', icon: ShieldCheck, spark: [7.2, 7.5, 7.8, 8.1, 8.4] },
      { label: 'Entity Authority', value: 'High', delta: '+2 lvl', trend: 'up', goodDirection: 'up', icon: Award, spark: [60, 65, 70, 75, 78] },
      { label: 'AI Mention Index', value: '142', delta: '+18', trend: 'up', goodDirection: 'up', icon: Hash, spark: [110, 118, 126, 134, 142] },
    ],
    engines: [
      { name: 'Google', status: 'visible' },
      { name: 'ChatGPT', status: 'blocked' },
      { name: 'Claude', status: 'blocked' },
      { name: 'Perplexity', status: 'partial' },
      { name: 'Gemini', status: 'visible' },
      { name: 'Copilot', status: 'partial' },
      { name: 'You.com', status: 'visible' },
    ],
    chartData: [30, 42, 56, 72],
    chartLabel: 'AI citation visibility — last 4 weeks',
    blockedCrawlers: ['GPTBot', 'ClaudeBot', 'PerplexityBot'],
    llmsTxtPresent: false,
  },
}

// ─── "Wow" gauges (below dashboard) ──────────────────────────────────────────

interface GaugeData {
  ringValue: number
  display: string
  suffix: string
  label: string
  sub: string
  color: string
  icon: LucideIcon
}

const GAUGES: GaugeData[] = [
  { ringValue: 73, display: '73', suffix: '%', label: 'AI Citation Probability', sub: 'Likelihood of appearing in AI answers', color: '#f59e0b', icon: Brain },
  { ringValue: 84, display: '8.4', suffix: '/10', label: 'ChatGPT Trust Score', sub: 'How ChatGPT perceives your authority', color: '#a855f7', icon: ShieldCheck },
  { ringValue: 78, display: '78', suffix: '', label: 'Entity Authority', sub: 'Knowledge-graph entity strength', color: '#60a5fa', icon: Award },
]

// ─── Chart helpers ───────────────────────────────────────────────────────────

function buildPoints(values: number[]): [number, number][] {
  const W = 320
  const H = 100
  const padX = 24
  const padTop = 14
  const padBottom = 28
  const chartH = H - padTop - padBottom
  const innerW = W - padX * 2
  const n = values.length
  return values.map((v, i) => {
    const clamped = Math.max(0, Math.min(100, v))
    const x = padX + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1))
    const y = padTop + chartH - (clamped / 100) * chartH
    return [x, y] as [number, number]
  })
}

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : ''
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx.toFixed(2)} ${y0.toFixed(2)}, ${cx.toFixed(2)} ${y1.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }
  return d
}

function areaPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const lineD = smoothPath(pts)
  const last = pts[pts.length - 1]
  const first = pts[0]
  const bottomY = 100 - 28
  return `${lineD} L ${last[0].toFixed(2)} ${bottomY} L ${first[0].toFixed(2)} ${bottomY} Z`
}

// ─── Sparkline (tiny inline SVG for KPI cards) ───────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 56
  const h = 18
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const pts = data.map((v, i) => {
    const x = pad + ((w - pad * 2) * i) / (data.length - 1)
    const y = pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2)
    return [x, y] as [number, number]
  })
  const d = smoothPath(pts)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="1.8" fill={color} />
    </svg>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  kpi,
  color,
  textClass,
  delay,
  isInView,
}: {
  kpi: KpiData
  color: string
  textClass: string
  delay: number
  isInView: boolean
}) {
  const Icon = kpi.icon
  const isGood = kpi.goodDirection === kpi.trend
  const deltaClass = isGood ? 'text-emerald-400' : 'text-rose-400'
  const ArrowIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors duration-300 overflow-hidden">
        <div className="absolute top-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1a` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">{kpi.label}</span>
          </div>
          <Sparkline data={kpi.spark} color={color} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className={`text-2xl font-bold ${textClass} leading-none`}>{kpi.value}</span>
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${deltaClass}`}>
            <ArrowIcon className="w-3 h-3" />
            {kpi.delta}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Engine status pill ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<EngineStatus, { dot: string; pill: string; label: string; ring?: string }> = {
  visible: { dot: 'bg-emerald-400', pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', label: 'Visible', ring: 'shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' },
  blocked: { dot: 'bg-rose-400', pill: 'border-rose-500/30 bg-rose-500/10 text-rose-300', label: 'Blocked' },
  partial: { dot: 'bg-amber-400', pill: 'border-amber-500/30 bg-amber-500/10 text-amber-300', label: 'Partial' },
}

function EnginePills({ engines, accent }: { engines: EnginePillData[]; accent: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4" style={{ color: accent }} />
        <h4 className="text-sm font-semibold text-foreground">AI Engine Status</h4>
        <span className="text-xs text-muted-foreground">
          {engines.length} {engines.length === 1 ? 'engine' : 'engines'} monitored
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {engines.map((e) => {
          const s = STATUS_STYLES[e.status]
          return (
            <span
              key={e.name}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${s.pill}`}
            >
              <span className={`relative w-1.5 h-1.5 rounded-full ${s.dot}`}>
                {e.status === 'visible' && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </span>
              {e.name}
              <span className="opacity-70">· {s.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mini line/area chart ────────────────────────────────────────────────────

function MiniChart({ config }: { config: SightConfig }) {
  const pts = buildPoints(config.chartData)
  const lineD = smoothPath(pts)
  const areaD = areaPath(pts)
  const gradId = `chart-grad-${config.key}`
  const weekLabels = ['W1', 'W2', 'W3', 'W4']
  const padBottom = 28
  const padTop = 14

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: config.color }} />
          <h4 className="text-sm font-semibold text-foreground">{config.chartLabel}</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-medium">
            <TrendingUp className="w-3 h-3" />
            Trending up
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <svg viewBox="0 0 320 100" className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* gridlines */}
          {[0, 0.5, 1].map((t) => {
            const y = padTop + (100 - padTop - padBottom) * t
            return <line key={t} x1="24" y1={y} x2="296" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2 4" />
          })}
          {/* area */}
          {areaD && <path d={areaD} fill={`url(#${gradId})`} />}
          {/* line */}
          <path d={lineD} fill="none" stroke={config.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* points */}
          {pts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#0a0a0a" stroke={config.color} strokeWidth="2" />
              <circle cx={x} cy={y} r="1.5" fill={config.color} />
            </g>
          ))}
          {/* week labels */}
          {weekLabels.map((label, i) => {
            const x = 24 + ((296 - 24) * i) / (weekLabels.length - 1)
            return (
              <text key={label} x={x} y="96" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9, fontWeight: 500 }}>
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ─── Blocked crawlers alert (GEO only) ───────────────────────────────────────

function BlockedCrawlersAlert({
  crawlers,
  llmsTxtPresent,
}: {
  crawlers: string[]
  llmsTxtPresent?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-rose-500/30 bg-rose-500/[0.07] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertOctagon className="w-4 h-4 text-rose-400" />
        <h4 className="text-sm font-bold text-rose-300">Critical — AI Crawlers Blocked</h4>
        <span className="ml-auto text-[11px] text-rose-400/70 font-medium uppercase tracking-wide">Action needed</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {crawlers.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300"
          >
            <XCircle className="w-3 h-3" />
            {c}
            <span className="opacity-60">blocked</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        {llmsTxtPresent ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground">llms.txt</span>
          <span className={`text-sm ml-2 font-semibold ${llmsTxtPresent ? 'text-emerald-400' : 'text-rose-400'}`}>
            {llmsTxtPresent ? 'Found' : 'Missing'}
          </span>
          {!llmsTxtPresent && (
            <p className="text-xs text-muted-foreground mt-0.5">
              AI models cannot discover your content efficiently without an llms.txt file — you are invisible to their users.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Circular gauge ring (the "scores people love") ─────────────────────────

function GaugeRing({
  ringValue,
  display,
  suffix,
  label,
  sub,
  color,
  icon: Icon,
  size = 132,
}: GaugeData & { size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (Math.max(0, Math.min(100, ringValue)) / 100) * circumference
  const gap = 0.25 * circumference
  const dashArray = `${progress} ${circumference - progress}`

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            strokeDasharray={`${circumference - gap} ${gap}`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-bold text-foreground leading-none">{display}</span>
            {suffix && <span className="text-xs font-semibold text-muted-foreground">{suffix}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-sm font-bold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 max-w-[180px] leading-snug">{sub}</div>
      </div>
    </div>
  )
}

// ─── Per-sight dashboard mockup ──────────────────────────────────────────────

function SightDashboard({ sightKey, isInView }: { sightKey: SightKey; isInView: boolean }) {
  const config = SIGHTS[sightKey]
  const showBlocked = config.blockedCrawlers && config.blockedCrawlers.length > 0

  return (
    <motion.div
      key={sightKey}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Sight summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config.color}1a` }}>
            <BarChart3 className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div>
            <div className={`text-sm font-bold ${config.textClass}`}>{config.label} Sight</div>
            <div className="text-xs text-muted-foreground">{config.headline}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          Updated 2 min ago
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {config.kpis.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            kpi={kpi}
            color={config.color}
            textClass={config.textClass}
            delay={0.1 + i * 0.08}
            isInView={isInView}
          />
        ))}
      </div>

      {/* Engine pills */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <EnginePills engines={config.engines} accent={config.color} />
      </div>

      {/* Chart */}
      <MiniChart config={config} />

      {/* Blocked crawlers alert (GEO only) */}
      {showBlocked && (
        <BlockedCrawlersAlert crawlers={config.blockedCrawlers!} llmsTxtPresent={config.llmsTxtPresent} />
      )}
    </motion.div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function DashboardPreview({ onStartFree }: { onStartFree?: () => void }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/[0.04] to-background pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-amber-500/[0.06] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 mb-5 gap-2">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-amber-400" />
            </span>
            Live Product Preview
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            One Dashboard. Three Sights.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Every AI Engine.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            See Google, ChatGPT, Claude, Perplexity, Gemini, Copilot, and You.com status in one unified command center —
            separate dashboards per Sight, real-time AI engine health, and the exact blockers killing your AI visibility.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          {/* Outer glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 via-transparent to-amber-500/10 rounded-3xl blur-xl" />

          <Card className="relative bg-white/[0.03] backdrop-blur-xl border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Browser / app chrome */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-muted-foreground max-w-md w-full justify-center">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">app.threesights.io/dashboard</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            <CardContent className="p-0">
              {/* Tabs */}
              <Tabs defaultValue="geo" className="w-full">
                <div className="px-4 sm:px-6 pt-5 pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Sight Dashboards</h3>
                    <p className="text-xs text-muted-foreground">Switch between the three Sights — each tracks a different layer of visibility.</p>
                  </div>
                  <TabsList className="bg-white/5 border border-white/10 h-auto p-1">
                    <TabsTrigger
                      value="seo"
                      className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:shadow-none px-4 py-1.5 text-xs font-semibold"
                    >
                      SEO
                    </TabsTrigger>
                    <TabsTrigger
                      value="aeo"
                      className="data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 data-[state=active]:shadow-none px-4 py-1.5 text-xs font-semibold"
                    >
                      AEO
                    </TabsTrigger>
                    <TabsTrigger
                      value="geo"
                      className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:shadow-none px-4 py-1.5 text-xs font-semibold"
                    >
                      GEO
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-4 sm:px-6 pb-6 pt-3">
                  <TabsContent value="seo" className="mt-0">
                    <SightDashboard sightKey="seo" isInView={isInView} />
                  </TabsContent>
                  <TabsContent value="aeo" className="mt-0">
                    <SightDashboard sightKey="aeo" isInView={isInView} />
                  </TabsContent>
                  <TabsContent value="geo" className="mt-0">
                    <SightDashboard sightKey="geo" isInView={isInView} />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* "Wow" gauges row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              The scores{' '}
              <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                people love
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">Three headline metrics from your GEO analysis — instantly shareable.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {GAUGES.map((g, i) => (
              <motion.div
                key={g.label}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col items-center hover:bg-white/[0.06] transition-colors duration-300"
              >
                <GaugeRing {...g} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-14 text-center"
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-700/40 transition-all duration-300"
          >
            <Zap className="mr-2 w-5 h-5" />
            Run My Free Analysis
          </Button>
          <p className="text-xs text-muted-foreground/70 mt-3">
            No credit card · 8-agent analysis · Results in 90 seconds
          </p>
        </motion.div>
      </div>
    </section>
  )
}
