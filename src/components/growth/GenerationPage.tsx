'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Zap,
  Hash,
  Timer,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Mock Data ──────────────────────────────────────────────────────────

const generationStats = {
  generatedToday: 14,
  avgGenerationTime: '3.2 min',
  avgQualityScore: 94,
  tokensUsed: '142K',
}

const currentGeneration = {
  title: 'AI Visibility for Dentists',
  type: 'Industry Page',
  progress: 92,
  status: 'Generating content...',
  eta: '~2 min remaining',
}

const queueItems = [
  { id: 1, title: 'SEO Strategies for Plumbers', type: 'Industry Page', position: 1, estimatedTime: '3.5 min' },
  { id: 2, title: 'Local Search for Lawyers', type: 'Location Page', position: 2, estimatedTime: '2.8 min' },
  { id: 3, title: 'AI Citation Guide for E-commerce', type: 'Guide', position: 3, estimatedTime: '4.1 min' },
  { id: 4, title: 'GEO Optimization for SaaS', type: 'Blog Post', position: 4, estimatedTime: '3.0 min' },
  { id: 5, title: 'AEO for Healthcare Providers', type: 'Industry Page', position: 5, estimatedTime: '3.3 min' },
]

const recentlyGenerated = [
  { id: 1, title: 'AI Visibility for Real Estate', type: 'Industry Page', generationTime: '3.1 min', qualityScore: 96, status: 'Sent to Review' },
  { id: 2, title: 'SEO for Restaurant Owners', type: 'Industry Page', generationTime: '2.9 min', qualityScore: 92, status: 'Sent to Review' },
  { id: 3, title: 'AEO for Financial Advisors', type: 'Guide', generationTime: '3.8 min', qualityScore: 89, status: 'Sent to Review' },
  { id: 4, title: 'GEO for Travel Industry', type: 'Blog Post', generationTime: '2.7 min', qualityScore: 95, status: 'Sent to Review' },
  { id: 5, title: 'Local AI Search for Retail', type: 'Location Page', generationTime: '3.4 min', qualityScore: 91, status: 'Sent to Review' },
]

const initialLogEntries = [
  { time: '14:23:01', message: 'Started generating: AI Visibility for Dentists' },
  { time: '14:23:15', message: 'Generated schema markup' },
  { time: '14:23:28', message: 'Generated internal links (8 links)' },
  { time: '14:23:45', message: 'Content generation complete, sending to review' },
]

const streamingLogEntries = [
  { time: '14:24:02', message: 'Applying brand voice consistency check' },
  { time: '14:24:10', message: 'Running entity extraction — found 12 entities' },
  { time: '14:24:22', message: 'Fact-verification pass: 24/24 facts verified' },
  { time: '14:24:35', message: 'Duplicate detection: 2% similarity (threshold: 15%)' },
  { time: '14:24:48', message: 'LLM evaluation: Score 91/100 — passing' },
  { time: '14:25:01', message: 'AI Visibility prediction: 86/100 — above threshold' },
  { time: '14:25:12', message: 'Final quality gate: PASSED — queueing for review' },
  { time: '14:25:15', message: '───────────────────────────────────────' },
  { time: '14:25:16', message: 'Starting next: SEO Strategies for Plumbers' },
  { time: '14:25:18', message: 'Loading knowledge graph context...' },
]

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
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${accent === 'emerald' ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
            <Icon className={`w-4 h-4 ${accent === 'emerald' ? 'text-emerald-400' : 'text-zinc-400'}`} />
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

export function GenerationPage() {
  const [logEntries, setLogEntries] = useState(initialLogEntries)
  const [logIndex, setLogIndex] = useState(0)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Simulate live log entries
  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((prev) => {
        if (prev < streamingLogEntries.length) {
          setLogEntries((entries) => [...entries, streamingLogEntries[prev]])
          return prev + 1
        }
        return prev
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logEntries])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Generation Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="Generated Today" value={generationStats.generatedToday} />
        <StatCard icon={Timer} label="Avg Generation Time" value={generationStats.avgGenerationTime} />
        <StatCard icon={Activity} label="Avg Quality Score" value={generationStats.avgQualityScore} />
        <StatCard icon={Hash} label="Tokens Used" value={generationStats.tokensUsed} />
      </div>

      {/* ── Current Generation ───────────────────────────────────── */}
      <Card className="bg-zinc-900 border-emerald-500/20 py-0 gap-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-100">{currentGeneration.title}</CardTitle>
                <CardDescription className="text-xs text-zinc-500 mt-0.5">
                  {currentGeneration.type}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{currentGeneration.status}</span>
              <span className="text-emerald-400 font-medium">{currentGeneration.progress}%</span>
            </div>
            <div className="relative h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentGeneration.progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>ETA: {currentGeneration.eta}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Queue + Recently Generated ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Queue */}
        <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-zinc-300">Generation Queue</CardTitle>
              <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                {queueItems.length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {queueItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item.position * 0.05 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 text-xs font-medium text-zinc-500 shrink-0">
                      {item.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-600">{item.type}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[11px] text-zinc-600">{item.estimatedTime}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recently Generated */}
        <Card className="bg-zinc-900 border-zinc-800/60 py-0 gap-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-zinc-300">Recently Generated</CardTitle>
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/25 bg-emerald-500/5">
                Last 5
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {recentlyGenerated.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item.id * 0.05 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-600">{item.type}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[11px] text-zinc-600">{item.generationTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-medium text-emerald-400">{item.qualityScore}</span>
                      <span className="text-[10px] text-zinc-600">{item.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ── Live Log (Terminal) ──────────────────────────────────── */}
      <Card className="bg-zinc-950 border-zinc-800/60 py-0 gap-0 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <CardTitle className="text-sm text-zinc-400 ml-2">Live Generation Log</CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-500">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ScrollArea className="h-56">
            <div className="font-mono text-xs space-y-1">
              <AnimatePresence>
                {logEntries.map((entry, i) => (
                  <motion.div
                    key={`${entry.time}-${i}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                  >
                    <span className="text-zinc-600 shrink-0 select-none">{entry.time}</span>
                    <span className="text-zinc-500 shrink-0 select-none">—</span>
                    <span className={`${entry.message.includes('PASSED') || entry.message.includes('complete') || entry.message.includes('verified') ? 'text-emerald-400' : entry.message.includes('────') ? 'text-zinc-700' : 'text-emerald-300/80'}`}>
                      {entry.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {/* Blinking cursor */}
              <div className="flex gap-3">
                <span className="text-zinc-600 shrink-0 select-none">
                  {new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 8)}
                </span>
                <span className="text-zinc-500 shrink-0 select-none">—</span>
                <span className="text-emerald-400 animate-pulse">▌</span>
              </div>
              <div ref={logEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
