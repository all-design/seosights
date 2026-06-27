'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSearch,
  RefreshCcw,
  Search,
  XCircle,
  Clock,
  MessageSquare,
  Bot,
  Sparkles,
  Globe,
  Cpu,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIIndexStatusProps {
  onStartFree?: () => void
}

interface EngineCard {
  id: string
  engine: string
  indexed: boolean
  lastCrawled: string | null
  pagesIndexed: number
  totalPages: number
  citationsFound: number
  icon: typeof Bot
  color: string
  accentBg: string
  accentBorder: string
  accentText: string
}

// ── Mock Data ─────────────────────────────────────────────────
const ENGINE_CARDS: EngineCard[] = [
  {
    id: 'chatgpt',
    engine: 'ChatGPT',
    indexed: true,
    lastCrawled: '2 hours ago',
    pagesIndexed: 24,
    totalPages: 32,
    citationsFound: 38,
    icon: MessageSquare,
    color: 'emerald',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
    accentText: 'text-emerald-400',
  },
  {
    id: 'claude',
    engine: 'Claude',
    indexed: true,
    lastCrawled: '6 hours ago',
    pagesIndexed: 18,
    totalPages: 32,
    citationsFound: 22,
    icon: Sparkles,
    color: 'amber',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
    accentText: 'text-amber-400',
  },
  {
    id: 'gemini',
    engine: 'Gemini',
    indexed: true,
    lastCrawled: '1 day ago',
    pagesIndexed: 12,
    totalPages: 32,
    citationsFound: 15,
    icon: Globe,
    color: 'purple',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/20',
    accentText: 'text-purple-400',
  },
  {
    id: 'perplexity',
    engine: 'Perplexity',
    indexed: false,
    lastCrawled: null,
    pagesIndexed: 0,
    totalPages: 32,
    citationsFound: 0,
    icon: Search,
    color: 'cyan',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/20',
    accentText: 'text-cyan-400',
  },
  {
    id: 'copilot',
    engine: 'Copilot',
    indexed: false,
    lastCrawled: null,
    pagesIndexed: 0,
    totalPages: 32,
    citationsFound: 0,
    icon: Cpu,
    color: 'blue',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/20',
    accentText: 'text-blue-400',
  },
]

// ── Component ─────────────────────────────────────────────────
export default function AIIndexStatus({ onStartFree }: AIIndexStatusProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const indexedCount = ENGINE_CARDS.filter(e => e.indexed).length
  const totalEngines = ENGINE_CARDS.length
  const totalPagesIndexed = ENGINE_CARDS.reduce((sum, e) => sum + e.pagesIndexed, 0)
  const totalCitations = ENGINE_CARDS.reduce((sum, e) => sum + e.citationsFound, 0)

  return (
    <section ref={ref} className="relative w-full py-16 md:py-24 overflow-hidden bg-[#0a0a0f]">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/4 bottom-1/4 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <Database className="h-3.5 w-3.5" />
            INDEX TRACKER
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            AI Index{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Status
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            Are you indexed by AI engines? See which engines have discovered your site, how many pages are indexed, and how many citations you&apos;ve earned.
          </p>
        </motion.div>

        {/* Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-white/50">Indexed:</span>
                  <span className="text-lg font-bold text-emerald-400">{indexedCount}/{totalEngines}</span>
                  <span className="text-xs text-white/30">engines</span>
                </div>
                <div className="w-px h-6 bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-purple-400" />
                  <span className="text-sm text-white/50">Pages:</span>
                  <span className="text-lg font-bold text-purple-400">{totalPagesIndexed}</span>
                  <span className="text-xs text-white/30">indexed</span>
                </div>
                <div className="w-px h-6 bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-400" />
                  <span className="text-sm text-white/50">Citations:</span>
                  <span className="text-lg font-bold text-amber-400">{totalCitations}</span>
                  <span className="text-xs text-white/30">found</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engine Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ENGINE_CARDS.map((eng, i) => {
            const completeness = eng.totalPages > 0 ? Math.round((eng.pagesIndexed / eng.totalPages) * 100) : 0
            const Icon = eng.icon

            return (
              <motion.div
                key={eng.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
              >
                <Card className={`h-full border ${
                  eng.indexed
                    ? `${eng.accentBorder} bg-white/[0.03]`
                    : 'border-white/5 bg-white/[0.02]'
                } backdrop-blur-xl transition-all hover:border-white/20`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${eng.accentBg} flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${eng.accentText}`} />
                        </div>
                        <span className="text-sm font-semibold text-white/90">{eng.engine}</span>
                      </div>
                      {eng.indexed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-white/20" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      {eng.indexed ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                            Indexed ✅
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-white/20" />
                          <Badge className="bg-white/10 text-white/40 border-white/10 text-[10px] px-1.5 py-0">
                            Not Indexed ❌
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Last Crawled */}
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <Clock className="h-3 w-3" />
                      {eng.lastCrawled ? (
                        <span>Crawled {eng.lastCrawled}</span>
                      ) : (
                        <span>Never crawled</span>
                      )}
                    </div>

                    {/* Pages Indexed */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Pages Indexed</span>
                        <span className="text-[10px] font-mono text-white/50">{eng.pagesIndexed}/{eng.totalPages}</span>
                      </div>
                      <Progress
                        value={completeness}
                        className={`h-1.5 rounded-full bg-white/5 ${
                          eng.indexed
                            ? `[&>div]:bg-emerald-400`
                            : `[&>div]:bg-white/20`
                        }`}
                      />
                    </div>

                    {/* Citations */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Citations Found</span>
                      <span className={`text-sm font-bold font-mono ${eng.indexed ? eng.accentText : 'text-white/20'}`}>
                        {eng.citationsFound}
                      </span>
                    </div>

                    {/* Re-index button */}
                    <Button
                      onClick={onStartFree}
                      variant="outline"
                      size="sm"
                      className={`w-full h-7 text-[10px] ${
                        eng.indexed
                          ? `${eng.accentBorder} ${eng.accentText} hover:${eng.accentBg}`
                          : 'border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      {eng.indexed ? 'Request Re-index' : 'Request Indexing'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Summary message */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-6"
        >
          <Card className="border border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                  <FileSearch className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-300">Indexing Incomplete</h4>
                  <p className="text-xs text-white/50 mt-0.5">
                    Only <span className="text-amber-400 font-bold">{indexedCount} of {totalEngines}</span> engines have indexed your site. Get indexed by the remaining {totalEngines - indexedCount} to boost your AI Visibility Score.
                  </p>
                </div>
              </div>
              <Button
                onClick={onStartFree}
                variant="outline"
                size="sm"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 shrink-0"
              >
                Get Indexed
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-base"
          >
            Check Your Index Status
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/30">
            <ArrowRight className="h-3 w-3" />
            No credit card required
          </div>
        </motion.div>
      </div>
    </section>
  )
}
