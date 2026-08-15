'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Gauge,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  Zap,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────

interface LighthouseMetric {
  label: string
  value: number
  unit?: string
  color: string
  target: number
}

interface BundleEntry {
  name: string
  size: number
  fill: string
}

interface ImageIssue {
  image: string
  issue: string
  savings: string
}

interface TtfbEntry {
  route: string
  ttfb: string
  status: string
}

interface CoreVital {
  name: string
  value: string
  threshold: string
  status: 'pass' | 'fail'
}

interface PerformanceData {
  hasRealData: boolean
  auditRun?: {
    id: string
    performanceScore: number
    accessibilityScore: number
    seoScore: number
    completedAt: string | null
    triggeredBy: string
    duration: number | null
  }
  lighthouse?: {
    performance: number
    fcp: number | null
    lcp: number | null
    cls: number | null
    ttfb: number | null
    tti: number | null
    tbt: number | null
  }
  bundleData?: Array<{ name: string; size: number; unit: string }>
  imageIssues?: Array<{ image: string; issue: string; savings: string }>
  ttfbByRoute?: Array<{ route: string; ttfb: string; loadTime: number; status: string }>
  coreWebVitals?: Array<{
    name: string
    value: string | null
    rawValue: number | null
    threshold: string
    status: string | null
  }>
}

// ── Demo / Mock Data ──────────────────────────────────────────────────

const DEMO_LIGHTHOUSE_METRICS: LighthouseMetric[] = [
  { label: 'Performance', value: 92, color: '#34d399', target: 90 },
  { label: 'FCP', value: 1.2, unit: 's', color: '#34d399', target: 1.8 },
  { label: 'LCP', value: 2.4, unit: 's', color: '#fbbf24', target: 2.5 },
  { label: 'CLS', value: 0.08, unit: '', color: '#34d399', target: 0.1 },
]

const DEMO_BUNDLE_DATA: BundleEntry[] = [
  { name: 'main.js', size: 245, fill: '#f87171' },
  { name: 'vendor.js', size: 380, fill: '#fb923c' },
  { name: 'app.js', size: 120, fill: '#fbbf24' },
  { name: 'styles.css', size: 85, fill: '#34d399' },
  { name: 'polyfills.js', size: 45, fill: '#22d3ee' },
  { name: 'analytics.js', size: 32, fill: '#a78bfa' },
]

const DEMO_IMAGE_ISSUES: ImageIssue[] = [
  { image: 'hero-banner.png', issue: 'No WebP/AVIF format — 2.4MB PNG', savings: '~1.8MB' },
  { image: 'team-photo.jpg', issue: 'Not lazy loaded — loads immediately', savings: '~340KB' },
  { image: 'logo.svg', issue: 'Not preloaded — delays first paint', savings: '~12KB earlier' },
  { image: 'screenshot-1.png', issue: 'Oversized — rendered at 400px, served at 1200px', savings: '~450KB' },
  { image: 'icon-sprite.svg', issue: 'Contains unused icons — 80% waste', savings: '~28KB' },
]

const DEMO_TTFB_DATA: TtfbEntry[] = [
  { route: '/', ttfb: '180ms', status: 'good' },
  { route: '/features', ttfb: '320ms', status: 'needs-work' },
  { route: '/pricing', ttfb: '210ms', status: 'good' },
  { route: '/dashboard', ttfb: '450ms', status: 'poor' },
  { route: '/api/analytics', ttfb: '680ms', status: 'poor' },
  { route: '/settings', ttfb: '190ms', status: 'good' },
  { route: '/blog', ttfb: '380ms', status: 'needs-work' },
  { route: '/docs', ttfb: '520ms', status: 'poor' },
]

const DEMO_CORE_WEB_VITALS: CoreVital[] = [
  { name: 'LCP', value: '2.4s', threshold: '< 2.5s', status: 'pass' },
  { name: 'FID', value: '45ms', threshold: '< 100ms', status: 'pass' },
  { name: 'CLS', value: '0.08', threshold: '< 0.1', status: 'pass' },
  { name: 'INP', value: '180ms', threshold: '< 200ms', status: 'pass' },
  { name: 'TTFB', value: '450ms', threshold: '< 800ms', status: 'pass' },
]

const bundleChartConfig = {
  size: { label: 'Size (KB)' },
} satisfies ChartConfig

// ── Helpers ────────────────────────────────────────────────────────────

function getColorForScore(score: number, isTimeMetric = false): string {
  if (isTimeMetric) {
    // For time-based metrics, higher = worse
    return score > 0.7 ? '#34d399' : score > 0.5 ? '#fbbf24' : '#f87171'
  }
  // For score-based metrics, higher = better
  if (score >= 90) return '#34d399'
  if (score >= 50) return '#fbbf24'
  return '#f87171'
}

const BUNDLE_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#22d3ee', '#a78bfa', '#f472b6', '#818cf8']

function getTtfbStatus(status: string) {
  switch (status) {
    case 'good': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'needs-work': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'poor': return 'text-red-400 bg-red-500/10 border-red-500/20'
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  }
}

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Circular Gauge Component ───────────────────────────────────────────

function GaugeCard({ label, value, maxVal, color, unit }: { label: string; value: number; maxVal: number; color: string; unit?: string }) {
  const pct = Math.min((value / maxVal) * 100, 100)
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle cx="44" cy="44" r="36" stroke="#27272a" strokeWidth="6" fill="none" />
        <circle
          cx="44" cy="44" r="36" stroke={color} strokeWidth="6" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 88, height: 88 }}>
        <span className="text-lg font-bold text-zinc-100">{label === 'Performance' ? Math.round(value) : value}{unit}</span>
      </div>
      <span className="text-xs text-zinc-500 mt-2">{label}</span>
    </div>
  )
}

// ── Main Performance Page ──────────────────────────────────────────────

export function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/qa/performance-data')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData({ hasRealData: false })
        }
      } catch {
        setData({ hasRealData: false })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const isRealData = data?.hasRealData === true

  // ── Derive display data ────────────────────────────────────────────

  const performanceScore = isRealData && data.auditRun
    ? data.auditRun.performanceScore
    : 92

  const lighthouseMetrics: LighthouseMetric[] = isRealData && data.lighthouse
    ? [
        { label: 'Performance', value: data.lighthouse.performance, color: getColorForScore(data.lighthouse.performance), target: 90 },
        { label: 'FCP', value: data.lighthouse.fcp ?? 0, unit: 's', color: getColorForScore(data.lighthouse.fcp ? (1.8 / data.lighthouse.fcp) * 50 : 0), target: 1.8 },
        { label: 'LCP', value: data.lighthouse.lcp ?? 0, unit: 's', color: getColorForScore(data.lighthouse.lcp ? (2.5 / data.lighthouse.lcp) * 50 : 0), target: 2.5 },
        { label: 'CLS', value: data.lighthouse.cls ?? 0, unit: '', color: getColorForScore(data.lighthouse.cls ? (0.1 / data.lighthouse.cls) * 50 : 0), target: 0.1 },
      ]
    : DEMO_LIGHTHOUSE_METRICS

  const bundleData: BundleEntry[] = isRealData && data.bundleData && data.bundleData.length > 0
    ? data.bundleData.map((b, i) => ({
        name: b.name,
        size: b.size,
        fill: BUNDLE_COLORS[i % BUNDLE_COLORS.length],
      }))
    : DEMO_BUNDLE_DATA

  const imageIssues: ImageIssue[] = isRealData && data.imageIssues && data.imageIssues.length > 0
    ? data.imageIssues
    : DEMO_IMAGE_ISSUES

  const ttfbData: TtfbEntry[] = isRealData && data.ttfbByRoute && data.ttfbByRoute.length > 0
    ? data.ttfbByRoute.map(t => ({
        route: t.route,
        ttfb: t.ttfb,
        status: t.status,
      }))
    : DEMO_TTFB_DATA

  const coreWebVitals: CoreVital[] = isRealData && data.coreWebVitals && data.coreWebVitals.some(v => v.value !== null)
    ? data.coreWebVitals
        .filter(v => v.value !== null)
        .map(v => ({
          name: v.name,
          value: v.value!,
          threshold: v.threshold,
          status: (v.status === 'pass' ? 'pass' : 'fail') as 'pass' | 'fail',
        }))
    : DEMO_CORE_WEB_VITALS

  // ── Loading state ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
        <span className="ml-3 text-sm text-zinc-400">Loading performance data…</span>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Data Source Indicator ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {isRealData ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-3 py-1 text-xs font-medium">
                Live Data
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/25 px-3 py-1 text-xs font-medium">
                Demo Data
              </Badge>
            )}
            {!isRealData && (
              <span className="text-xs text-zinc-500">
                Run a real Lighthouse audit for actual measurements
              </span>
            )}
            {isRealData && data.auditRun?.completedAt && (
              <span className="text-xs text-zinc-500">
                Last audit: {new Date(data.auditRun.completedAt).toLocaleString()}
              </span>
            )}
          </div>
          <a href="/control/performance">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-zinc-700 text-zinc-300 hover:text-orange-400 hover:border-orange-500/40 gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Run Audit
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Button>
          </a>
        </div>
      </motion.div>

      {/* ── Score ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <Gauge className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Performance Score</p>
                <span className="text-5xl font-bold text-orange-400 tracking-tighter">{performanceScore}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Lighthouse Metrics (4 Gauge Charts) ────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Lighthouse Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {lighthouseMetrics.map((metric) => (
                <div key={metric.label} className="flex flex-col items-center relative">
                  <GaugeCard
                    label={metric.label}
                    value={metric.label === 'Performance' ? metric.value : metric.value}
                    maxVal={metric.label === 'Performance' ? 100 : metric.label === 'CLS' ? 0.25 : metric.label.endsWith('CP') ? 4 : 3}
                    color={metric.color}
                    unit={metric.unit}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bundle Size Bar Chart ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Bundle Size</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">Total: {bundleData.reduce((a, b) => a + b.size, 0)} KB</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bundleChartConfig} className="h-[180px] w-full aspect-auto">
              <BarChart data={bundleData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={85} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="size" radius={[0, 4, 4, 0]} barSize={14}>
                  {bundleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Image Optimization + TTFB Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Image Optimization */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Image Optimization</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {imageIssues.map((img, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-zinc-300">{img.image}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        Save {img.savings}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-zinc-500">{img.issue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* TTFB by Route */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">TTFB by Route</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {ttfbData.map((route) => (
                  <div key={route.route} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    <span className="text-xs font-mono text-zinc-300 flex-1">{route.route}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${getTtfbStatus(route.status)}`}>
                      {route.ttfb}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Core Web Vitals ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Core Web Vitals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {coreWebVitals.map((vital) => (
                <div key={vital.name} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40 text-center">
                  {vital.status === 'pass' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  )}
                  <span className="text-xs font-medium text-zinc-200 block">{vital.name}</span>
                  <span className={`text-sm font-bold ${vital.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>{vital.value}</span>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{vital.threshold}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
