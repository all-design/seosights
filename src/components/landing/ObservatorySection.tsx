'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ObservatoryResearchCard from '@/components/landing/ObservatoryResearchCard'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  Cpu,
  Database,
  Eye,
  FileSearch,
  Globe,
  Layers,
  Library,
  MonitorSmartphone,
  Radio,
  Satellite,
  Search,
  Shield,
  Signal,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface ObservatoryStatus {
  aiModelsTracked: number
  signalsDetected: number
  researchPublished: number
  industriesCovered: number
  dataPointsCollected: number
  confidenceScore: number
  models: AIModel[]
  latestSignals: SignalItem[]
  researchReports: ResearchReport[]
}

interface AIModel {
  name: string
  shortName: string
  color: string
}

interface SignalItem {
  id: string
  text: string
  model: string
  timeAgo: string
  type: 'citation_change' | 'source_shift' | 'ranking_change' | 'new_capability'
}

interface ResearchReport {
  title: string
  type: 'research' | 'benchmark' | 'industry_update' | 'monthly_report'
  date: string
  readingTime: number
  excerpt: string
  slug: string
}

// ── Fallback Mock Data ────────────────────────────────────────
const FALLBACK_DATA: ObservatoryStatus = {
  aiModelsTracked: 6,
  signalsDetected: 12847,
  researchPublished: 94,
  industriesCovered: 312,
  dataPointsCollected: 2840000,
  confidenceScore: 94.7,
  models: [
    { name: 'ChatGPT', shortName: 'GPT', color: '#10b981' },
    { name: 'Claude', shortName: 'CLD', color: '#f59e0b' },
    { name: 'Gemini', shortName: 'GEM', color: '#06b6d4' },
    { name: 'Perplexity', shortName: 'PRX', color: '#8b5cf6' },
    { name: 'Grok', shortName: 'GRK', color: '#ef4444' },
    { name: 'DeepSeek', shortName: 'DSK', color: '#ec4899' },
  ],
  latestSignals: [
    { id: 's1', text: 'ChatGPT started citing GitHub more frequently in technical queries', model: 'ChatGPT', timeAgo: '2 hours ago', type: 'citation_change' },
    { id: 's2', text: 'Gemini no longer references Reddit for health queries', model: 'Gemini', timeAgo: '5 hours ago', type: 'source_shift' },
    { id: 's3', text: 'Claude favoring PDF sources in legal queries', model: 'Claude', timeAgo: '1 day ago', type: 'source_shift' },
    { id: 's4', text: 'Perplexity added real-time X/Twitter citations for news', model: 'Perplexity', timeAgo: '1 day ago', type: 'new_capability' },
    { id: 's5', text: 'Grok shifted ranking toward .gov domains for finance', model: 'Grok', timeAgo: '2 days ago', type: 'ranking_change' },
    { id: 's6', text: 'DeepSeek increased Wikipedia citation weight by 15%', model: 'DeepSeek', timeAgo: '3 days ago', type: 'citation_change' },
    { id: 's7', text: 'ChatGPT reduced reliance on medium.com for dev tutorials', model: 'ChatGPT', timeAgo: '4 days ago', type: 'source_shift' },
    { id: 's8', text: 'Claude added arxiv.org as primary source for academic queries', model: 'Claude', timeAgo: '5 days ago', type: 'new_capability' },
  ],
  researchReports: [
    {
      title: 'How ChatGPT Selects Sources: A 90-Day Longitudinal Study',
      type: 'research',
      date: 'Feb 28, 2025',
      readingTime: 12,
      excerpt: 'Our analysis of 50,000+ ChatGPT responses reveals a significant shift toward official documentation and away from user-generated content.',
      slug: 'chatgpt-source-selection-90-day',
    },
    {
      title: 'AI Model Confidence Benchmark: Q1 2025',
      type: 'benchmark',
      date: 'Feb 15, 2025',
      readingTime: 8,
      excerpt: 'Comparing self-reported confidence scores across six major AI models reveals Claude leads in accuracy while Gemini leads in citation density.',
      slug: 'ai-confidence-benchmark-q1-2025',
    },
    {
      title: 'Healthcare Industry: AI Citation Patterns',
      type: 'industry_update',
      date: 'Feb 10, 2025',
      readingTime: 6,
      excerpt: 'AI models increasingly favor .gov and .edu domains for health queries, with Reddit citations dropping 40% since December.',
      slug: 'healthcare-ai-citation-patterns',
    },
    {
      title: 'Monthly Observatory Report — January 2025',
      type: 'monthly_report',
      date: 'Feb 1, 2025',
      readingTime: 15,
      excerpt: 'January saw 3,200+ significant citation changes across monitored models, with the biggest shifts in finance and legal verticals.',
      slug: 'monthly-observatory-report-jan-2025',
    },
  ],
}

// ── Pipeline Steps ────────────────────────────────────────────
const PIPELINE_STEPS = [
  { icon: Satellite, label: 'Collect', emoji: '📡', description: 'Query AI models across 1000+ prompts daily' },
  { icon: Search, label: 'Detect', emoji: '🔍', description: 'Identify citation, source, and ranking changes' },
  { icon: Eye, label: 'Evidence', emoji: '👁', description: 'Verify changes have sufficient data backing' },
  { icon: Shield, label: 'Confidence', emoji: '🛡', description: 'Score statistical weight and reliability' },
  { icon: FileSearch, label: 'Generate', emoji: '📝', description: 'Produce research only when evidence demands it' },
  { icon: Radio, label: 'Publish', emoji: '📢', description: 'Signal-driven, never calendar-driven' },
]

// ── Count-up hook ─────────────────────────────────────────────
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function useCountUp(target: number, duration: number, shouldStart: boolean) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!shouldStart) return
    let startTime: number | null = null
    let rafId: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)

      setCurrent(Math.floor(easedProgress * target))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setCurrent(target)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration, shouldStart])

  return current
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  index,
  isInView,
  children,
}: {
  icon: typeof Activity
  label: string
  value: number
  suffix?: string
  index: number
  isInView: boolean
  children?: React.ReactNode
}) {
  const countedValue = useCountUp(value, 2200, isInView)
  const formattedValue = value >= 1000000
    ? `${(countedValue / 1000000).toFixed(1)}M`
    : value >= 1000
    ? new Intl.NumberFormat('en').format(countedValue)
    : countedValue.toString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-gray-900/50 border-gray-800/50 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm py-0 gap-0 overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <Icon className="size-4 text-emerald-400" />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</span>
            </div>
            {children}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight leading-none">
            {formattedValue}{suffix}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PipelineStep({
  step,
  index,
  isInView,
  isLast,
}: {
  step: typeof PIPELINE_STEPS[number]
  index: number
  isInView: boolean
  isLast: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const Icon = step.icon

  return (
    <motion.div
      className="flex items-center gap-0"
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="relative flex flex-col items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Icon circle */}
        <motion.div
          className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-emerald-500/30 bg-gray-900/80 backdrop-blur-sm cursor-pointer"
          whileHover={{ scale: 1.12, borderColor: 'rgba(16,185,129,0.6)' }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="size-5 sm:size-6 text-emerald-400" />
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-emerald-500/20"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          />
        </motion.div>

        {/* Label */}
        <span className="mt-2 text-[11px] sm:text-xs font-semibold text-emerald-300 uppercase tracking-wider">
          {step.label}
        </span>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-8 z-20 w-48 p-2 rounded-lg bg-gray-900 border border-gray-700 shadow-xl"
            >
              <p className="text-[11px] text-gray-300 leading-relaxed text-center">{step.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <motion.div
          className="flex items-center mx-1 sm:mx-2"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.5 + index * 0.12 }}
        >
          <div className="w-6 sm:w-10 h-px bg-gradient-to-r from-emerald-500/40 to-emerald-500/20" />
          <ArrowRight className="size-3 text-emerald-500/40" />
        </motion.div>
      )}
    </motion.div>
  )
}

function SignalFeed({ signals }: { signals: SignalItem[] }) {
  const typeConfig: Record<SignalItem['type'], { color: string; label: string }> = {
    citation_change: { color: 'text-emerald-400', label: 'Citation' },
    source_shift: { color: 'text-amber-400', label: 'Source Shift' },
    ranking_change: { color: 'text-cyan-400', label: 'Ranking' },
    new_capability: { color: 'text-rose-400', label: 'New' },
  }

  return (
    <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2 pr-1">
      {signals.map((signal, i) => {
        const config = typeConfig[signal.type]
        return (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/40 border border-gray-800/40 hover:border-emerald-500/20 transition-colors group"
          >
            <div className="mt-0.5 flex-shrink-0">
              <Signal className="size-4 text-emerald-500/60 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 leading-snug">{signal.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-medium text-gray-500">{signal.model}</span>
                <span className="text-gray-700">·</span>
                <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
                <span className="text-gray-700">·</span>
                <span className="text-[11px] text-gray-500">{signal.timeAgo}</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function ObservatorySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [data, setData] = useState<ObservatoryStatus>(FALLBACK_DATA)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Try fetching from API, fall back to mock data
    const fetchData = async () => {
      try {
        const res = await fetch('/api/observatory/status')
        if (res.ok) {
          const json = await res.json()
          if (json && json.aiModelsTracked) {
            setData(json)
          }
        }
      } catch {
        // Silently use fallback data
      }
    }
    fetchData()
  }, [])

  return (
    <section
      ref={ref}
      className="relative py-20 sm:py-28 overflow-hidden bg-gray-950"
    >
      {/* ── Animated Background ─────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08)_0%,transparent_50%)]" />
        {/* Radial glow from bottom-right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.05)_0%,transparent_40%)]" />

        {/* Animated constellation dots */}
        {mounted && (
          <div className="absolute inset-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute rounded-full bg-emerald-400"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.1, 0.5, 0.1],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Hero Area ──────────────────────────────────────── */}
        <motion.div
          className="text-center mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            >
              Observatory Live
            </Badge>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            AI Visibility Observatory
            <span className="text-emerald-400">™</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            An independent research center that daily analyzes the behavior of leading AI
            models based on a large set of real queries and publishes only findings with
            sufficient evidence and statistical weight.
          </p>
        </motion.div>

        {/* ── Live Dashboard Preview (6 Cards) ───────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 sm:mb-20">
          <StatCard
            icon={Cpu}
            label="AI Models Tracked"
            value={data.aiModelsTracked}
            index={0}
            isInView={isInView}
          >
            <div className="flex -space-x-1">
              {data.models.slice(0, 4).map((model) => (
                <div
                  key={model.shortName}
                  className="w-5 h-5 rounded-full border border-gray-800 flex items-center justify-center text-[7px] font-bold"
                  style={{ backgroundColor: model.color + '20', color: model.color }}
                  title={model.name}
                >
                  {model.shortName[0]}
                </div>
              ))}
              {data.models.length > 4 && (
                <div className="w-5 h-5 rounded-full border border-gray-800 bg-gray-800 flex items-center justify-center text-[7px] font-bold text-gray-400">
                  +{data.models.length - 4}
                </div>
              )}
            </div>
          </StatCard>

          <StatCard
            icon={Zap}
            label="Signals Detected"
            value={data.signalsDetected}
            index={1}
            isInView={isInView}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </motion.div>
          </StatCard>

          <StatCard
            icon={BookOpen}
            label="Research Published"
            value={data.researchPublished}
            index={2}
            isInView={isInView}
          />

          <StatCard
            icon={Layers}
            label="Industries Covered"
            value={data.industriesCovered}
            index={3}
            isInView={isInView}
          />

          <StatCard
            icon={Database}
            label="Data Points Collected"
            value={data.dataPointsCollected}
            suffix="+"
            index={4}
            isInView={isInView}
          />

          <StatCard
            icon={Eye}
            label="Confidence Score"
            value={Math.round(data.confidenceScore * 10) / 10}
            suffix="%"
            index={5}
            isInView={isInView}
          />
        </div>

        {/* ── Pipeline Visualization ─────────────────────────── */}
        <motion.div
          className="mb-14 sm:mb-20"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">The Detection Pipeline</h3>
            <p className="text-sm text-gray-400">Six layers of automated intelligence processing</p>
          </div>

          {/* Pipeline flow */}
          <div className="flex items-start justify-center overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex items-center gap-0 min-w-max px-4">
              {PIPELINE_STEPS.map((step, i) => (
                <PipelineStep
                  key={step.label}
                  step={step}
                  index={i}
                  isInView={isInView}
                  isLast={i === PIPELINE_STEPS.length - 1}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Breaking Research Alerts ──────────────────────── */}
        <motion.div
          className="mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">🚨</span>
            <h3 className="text-lg sm:text-xl font-bold text-white">Breaking Research</h3>
            <Badge
              variant="outline"
              className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px] px-1.5 py-0"
            >
              ALERT
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { headline: 'Claude stopped citing Reddit', model: 'Claude', type: 'source_shift', evidence: 142, confidence: 94, time: '2h ago' },
              { headline: 'ChatGPT increases GitHub citations by 27%', model: 'ChatGPT', type: 'citation_shift', evidence: 89, confidence: 91, time: '5h ago' },
              { headline: 'Gemini adds .gov domain preference for health', model: 'Gemini', type: 'source_shift', evidence: 67, confidence: 88, time: '8h ago' },
            ].map((alert, i) => (
              <motion.div
                key={alert.headline}
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-red-500/10 hover:border-red-500/20 transition-all duration-300 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2.5">
                      <span className="text-sm mt-0.5">🚨</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">{alert.headline}</h4>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="border-gray-700 text-gray-300 text-[9px] px-1 py-0 capitalize">{alert.model}</Badge>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[9px] px-1 py-0">{alert.type.replace('_', ' ')}</Badge>
                          <span className="text-[10px] text-gray-500">{alert.evidence} evidence</span>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] text-gray-500">{alert.confidence}% conf</span>
                          <span className="text-gray-700">·</span>
                          <span className="text-[10px] text-gray-500">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Latest Signals Feed + Research Library ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-14 sm:mb-20">
          {/* Signals Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Signal className="size-5 text-emerald-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Latest Signals</h3>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] px-1.5 py-0"
              >
                LIVE
              </Badge>
            </div>
            <SignalFeed signals={data.latestSignals} />
          </motion.div>

          {/* Research Library Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Library className="size-5 text-emerald-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Research Library</h3>
            </div>
            <div className="space-y-3">
              {data.researchReports.map((report, i) => (
                <motion.div
                  key={report.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                >
                  <ObservatoryResearchCard {...report} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="size-4 mr-2" />
              Explore the Observatory
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-emerald-500/30 font-semibold px-8"
            >
              <Library className="size-4 mr-2" />
              Access Research Library
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/50 font-semibold px-8"
            >
              <Database className="size-4 mr-2" />
              Browse Dataset Explorer
            </Button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Free access to the research library · No credit card required
          </p>
        </motion.div>
      </div>

      {/* ── Custom scrollbar style ─────────────────────────────── */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </section>
  )
}
