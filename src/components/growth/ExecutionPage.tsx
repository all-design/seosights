'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  CheckCircle2,
  Clock,
  Loader2,
  Circle,
  ExternalLink,
  Globe,
  Zap,
  Timer,
  TrendingUp,
  Radio,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Types ──────────────────────────────────────────────────────────────

type PipelineStatus = 'completed' | 'in_progress' | 'pending'

interface PipelineStep {
  label: string
  status: PipelineStatus
  timestamp?: string
}

// ── Mock Data ──────────────────────────────────────────────────────────

const pipelineSteps: PipelineStep[] = [
  { label: 'Schema Added', status: 'completed', timestamp: '14:30:02' },
  { label: 'Internal Links', status: 'completed', timestamp: '14:30:08' },
  { label: 'Sitemap Updated', status: 'completed', timestamp: '14:30:15' },
  { label: 'RSS Updated', status: 'in_progress', timestamp: '14:30:22' },
  { label: 'Index Request', status: 'pending' },
  { label: 'Webhook Sent', status: 'pending' },
  { label: 'Analytics Setup', status: 'pending' },
  { label: 'Live', status: 'pending' },
]

const currentlyPublishing = {
  title: 'AI Visibility for Dentists',
  type: 'Industry Page',
  currentStep: 'RSS Updated',
  stepIndex: 3, // 0-based
  totalSteps: 8,
}

const publishedToday = [
  {
    id: 1,
    title: 'AI Visibility for Real Estate',
    url: '/industries/ai-visibility-real-estate',
    publishedTime: '14:12',
    status: 'indexed' as const,
  },
  {
    id: 2,
    title: 'SEO for Restaurant Owners',
    url: '/industries/seo-restaurant-owners',
    publishedTime: '13:48',
    status: 'indexed' as const,
  },
  {
    id: 3,
    title: 'AEO for Financial Advisors',
    url: '/guides/aeo-financial-advisors',
    publishedTime: '12:22',
    status: 'pending' as const,
  },
  {
    id: 4,
    title: 'GEO for Travel Industry',
    url: '/blog/geo-travel-industry',
    publishedTime: '11:55',
    status: 'indexed' as const,
  },
  {
    id: 5,
    title: 'Local AI Search for Retail',
    url: '/industries/local-ai-search-retail',
    publishedTime: '10:30',
    status: 'indexed' as const,
  },
]

const executionLog = [
  { time: '14:30:02', step: 'Schema Added', status: 'completed' as const, detail: 'JSON-LD schema markup applied (DentalProcedure + LocalBusiness)' },
  { time: '14:30:05', step: 'Internal Links', status: 'completed' as const, detail: '8 internal links added across 4 related pages' },
  { time: '14:30:08', step: 'Internal Links', status: 'completed' as const, detail: 'Link validation: 8/8 links verified' },
  { time: '14:30:12', step: 'Sitemap Updated', status: 'completed' as const, detail: 'sitemap.xml updated — new entry added at priority 0.8' },
  { time: '14:30:15', step: 'Sitemap Updated', status: 'completed' as const, detail: 'Sitemap ping sent to Google & Bing' },
  { time: '14:30:22', step: 'RSS Updated', status: 'in_progress' as const, detail: 'Generating RSS feed entry...' },
  { time: '14:30:28', step: 'Index Request', status: 'pending' as const, detail: 'Waiting — Google Indexing API request' },
  { time: '14:30:35', step: 'Webhook Sent', status: 'pending' as const, detail: 'Waiting — CMS publish webhook' },
  { time: '14:30:42', step: 'Analytics Setup', status: 'pending' as const, detail: 'Waiting — GA4 event tracking' },
  { time: '14:30:50', step: 'Live', status: 'pending' as const, detail: 'Waiting — final deployment verification' },
]

const quickStats = {
  publishedToday: 12,
  avgTimeToLive: '4.2 min',
  indexRequestRate: '94%',
  webhookDelivery: '100%',
}

// ── Step Icon ──────────────────────────────────────────────────────────

function StepIcon({ status }: { status: PipelineStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    case 'in_progress':
      return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
    case 'pending':
      return <Circle className="w-4 h-4 text-zinc-600" />
  }
}

// ── Stat Card ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'emerald',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${accent === 'emerald' ? 'bg-emerald-500/10' : accent === 'amber' ? 'bg-amber-500/10' : 'bg-zinc-800'}`}>
            <Icon className={`w-4 h-4 ${accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-400' : 'text-zinc-400'}`} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
            <p className="text-lg font-semibold text-zinc-100">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export function ExecutionPage() {
  const [animatedSteps, setAnimatedSteps] = useState(0)

  // Animate pipeline steps appearing
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedSteps((prev) => {
        if (prev < pipelineSteps.length) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 120)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Quick Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Rocket} label="Published Today" value={quickStats.publishedToday} />
        <StatCard icon={Timer} label="Avg Time to Live" value={quickStats.avgTimeToLive} accent="amber" />
        <StatCard icon={TrendingUp} label="Index Request Rate" value={quickStats.indexRequestRate} />
        <StatCard icon={Zap} label="Webhook Delivery" value={quickStats.webhookDelivery} />
      </div>

      {/* ── Pipeline Visualization ───────────────────────────────── */}
      <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-zinc-300">Deployment Pipeline</CardTitle>
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20">
              <Radio className="w-3 h-3" />
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {/* Horizontal Stepper */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-800" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-1000"
              style={{
                width: `${(pipelineSteps.filter((s) => s.status === 'completed').length / (pipelineSteps.length - 1)) * 100}%`,
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {pipelineSteps.slice(0, animatedSteps).map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="flex flex-col items-center gap-2"
                  style={{ width: `${100 / pipelineSteps.length}%` }}
                >
                  <div
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      step.status === 'completed'
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : step.status === 'in_progress'
                          ? 'bg-amber-500/20 border-amber-500'
                          : 'bg-zinc-900 border-zinc-700'
                    }`}
                  >
                    <StepIcon status={step.status} />
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs text-center leading-tight max-w-[72px] ${
                      step.status === 'completed'
                        ? 'text-emerald-400'
                        : step.status === 'in_progress'
                          ? 'text-amber-400'
                          : 'text-zinc-600'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && (
                    <span className="text-[9px] text-zinc-600 hidden sm:block">{step.timestamp}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Currently Publishing + Published Today ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Currently Publishing */}
        <Card className="bg-zinc-900 border-amber-500/20 py-0 gap-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20">
                  <Rocket className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base text-zinc-100">{currentlyPublishing.title}</CardTitle>
                  <CardDescription className="text-xs text-zinc-500 mt-0.5">
                    {currentlyPublishing.type} · Publishing
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {/* Step indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">
                  Step {currentlyPublishing.stepIndex + 1} of {currentlyPublishing.totalSteps}
                </span>
                <span className="text-amber-400 font-medium">
                  {currentlyPublishing.currentStep}
                </span>
              </div>
              <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentlyPublishing.stepIndex + 1) / currentlyPublishing.totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Active pipeline items */}
            <div className="space-y-1 mt-3">
              {pipelineSteps.map((step) => (
                <div
                  key={step.label}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                >
                  <StepIcon status={step.status} />
                  <span
                    className={
                      step.status === 'completed'
                        ? 'text-emerald-400/70 line-through'
                        : step.status === 'in_progress'
                          ? 'text-amber-400 font-medium'
                          : 'text-zinc-600'
                    }
                  >
                    {step.label}
                  </span>
                  {step.status === 'in_progress' && (
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Published Today */}
        <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-zinc-300">Published Today</CardTitle>
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/25 bg-emerald-500/5">
                {publishedToday.length} live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="max-h-72">
              <div className="space-y-1">
                {publishedToday.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item.id * 0.05 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${
                      item.status === 'indexed'
                        ? 'bg-emerald-500/15 border border-emerald-500/25'
                        : 'bg-amber-500/15 border border-amber-500/25'
                    }`}>
                      {item.status === 'indexed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-2.5 h-2.5 text-zinc-600" />
                        <span className="text-[11px] text-zinc-600 truncate">{item.url}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <span className="text-[10px] text-zinc-600">{item.publishedTime}</span>
                      <span className={`text-[10px] font-medium ${
                        item.status === 'indexed' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {item.status === 'indexed' ? 'Indexed' : 'Pending'}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ── Execution Log ────────────────────────────────────────── */}
      <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-zinc-300">Execution Log</CardTitle>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-500">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ScrollArea className="max-h-64">
            <div className="space-y-0">
              {executionLog.map((entry, i) => (
                <motion.div
                  key={`${entry.time}-${entry.step}-${i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.15 }}
                  className="flex items-start gap-3 py-2 border-b border-zinc-800/40 last:border-0"
                >
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {entry.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {entry.status === 'in_progress' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                    {entry.status === 'pending' && <Circle className="w-3.5 h-3.5 text-zinc-600" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        entry.status === 'completed'
                          ? 'text-emerald-400'
                          : entry.status === 'in_progress'
                            ? 'text-amber-400'
                            : 'text-zinc-600'
                      }`}>
                        {entry.step}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${
                      entry.status === 'pending' ? 'text-zinc-700' : 'text-zinc-500'
                    }`}>
                      {entry.detail}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5 font-mono">
                    {entry.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
