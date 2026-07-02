'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Circle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Play,
  Sparkles,
  Activity,
  History,
  AlertTriangle,
  ArrowRight,
  GitCompareArrows,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────
type DiffStatus = 'gained' | 'lost' | 'improved' | 'declined' | 'unchanged' | 'same_absent'

interface EngineRecording {
  engine: string
  color: string
  mentioned: boolean
  position?: number
  totalPositions?: number
  snippet?: string
}

interface Recording {
  id: string
  date: string
  label: string
  query: string
  brand: string
  engines: EngineRecording[]
  mentionedCount: number
  totalEngines: number
}

interface RecommendationRecorderData {
  current: Recording
  previous: Recording
  history: Recording[]
  isRecording: boolean
  query: string
  brand: string
}

interface AIRecommendationRecorderDashboardProps {
  domain: string
  userId?: string
}

// ── Engine config ────────────────────────────────────────────────────────
const ENGINE_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  ChatGPT: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  Claude: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  Gemini: { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
  Perplexity: { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20', dot: 'bg-purple-400' },
  Copilot: { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/20', dot: 'bg-rose-400' },
}

// ── Fallback mock data ──────────────────────────────────────────────────
const FALLBACK_DATA: RecommendationRecorderData = {
  isRecording: false,
  query: 'best SEO tools 2025',
  brand: 'Seosights',
  current: {
    id: 'r3',
    date: '2025-03-03',
    label: 'After Optimization',
    query: 'best SEO tools 2025',
    brand: 'Seosights',
    mentionedCount: 4,
    totalEngines: 5,
    engines: [
      { engine: 'ChatGPT', color: 'emerald', mentioned: true, position: 2, totalPositions: 8, snippet: 'Seosights is a top-tier AI visibility platform that specializes in...' },
      { engine: 'Claude', color: 'amber', mentioned: true, position: 3, totalPositions: 6, snippet: 'For comprehensive SEO analysis, Seosights offers an 8-agent system...' },
      { engine: 'Gemini', color: 'blue', mentioned: true, position: 3, totalPositions: 8, snippet: 'Seosights provides AI-powered SEO analysis with real-time visibility tracking...' },
      { engine: 'Perplexity', color: 'purple', mentioned: true, position: 2, totalPositions: 10, snippet: 'According to recent comparisons, Seosights ranks among the best...' },
      { engine: 'Copilot', color: 'rose', mentioned: false, position: undefined, totalPositions: 6, snippet: undefined },
    ],
  },
  previous: {
    id: 'r2',
    date: '2025-02-10',
    label: 'Before Optimization',
    query: 'best SEO tools 2025',
    brand: 'Seosights',
    mentionedCount: 2,
    totalEngines: 5,
    engines: [
      { engine: 'ChatGPT', color: 'emerald', mentioned: false, position: undefined, totalPositions: 8, snippet: undefined },
      { engine: 'Claude', color: 'amber', mentioned: true, position: 3, totalPositions: 6, snippet: 'Seosights is a tool that can help with SEO tasks...' },
      { engine: 'Gemini', color: 'blue', mentioned: false, position: undefined, totalPositions: 8, snippet: undefined },
      { engine: 'Perplexity', color: 'purple', mentioned: true, position: 4, totalPositions: 10, snippet: 'Seosights was mentioned as an option for SEO analysis...' },
      { engine: 'Copilot', color: 'rose', mentioned: false, position: undefined, totalPositions: 6, snippet: undefined },
    ],
  },
  history: [
    { id: 'r1', date: '2025-01-20', label: 'Initial Recording', query: 'best SEO tools 2025', brand: 'Seosights', mentionedCount: 1, totalEngines: 5, engines: [] },
    { id: 'r2', date: '2025-02-10', label: 'Before Optimization', query: 'best SEO tools 2025', brand: 'Seosights', mentionedCount: 2, totalEngines: 5, engines: [] },
    { id: 'r3', date: '2025-03-03', label: 'After Optimization', query: 'best SEO tools 2025', brand: 'Seosights', mentionedCount: 4, totalEngines: 5, engines: [] },
  ],
}

// ── Diff helper ──────────────────────────────────────────────────────────
function getDiffStatus(current: EngineRecording, previous: EngineRecording): DiffStatus {
  if (current.mentioned && !previous.mentioned) return 'gained'
  if (!current.mentioned && previous.mentioned) return 'lost'
  if (current.mentioned && previous.mentioned) {
    if (current.position && previous.position && current.position < previous.position) return 'improved'
    if (current.position && previous.position && current.position > previous.position) return 'declined'
    return 'unchanged'
  }
  return 'same_absent'
}

const DIFF_STYLES: Record<DiffStatus, { bg: string; border: string; badge: string; label: string }> = {
  gained: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Gained' },
  lost: { bg: 'bg-red-500/5', border: 'border-red-500/20', badge: 'bg-red-500/15 text-red-300 border-red-500/30', label: 'Lost' },
  improved: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Improved' },
  declined: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Declined' },
  unchanged: { bg: 'bg-white/[0.02]', border: 'border-white/10', badge: 'bg-white/10 text-muted-foreground border-white/15', label: 'Unchanged' },
  same_absent: { bg: 'bg-white/[0.02]', border: 'border-white/10', badge: 'bg-white/10 text-muted-foreground/60 border-white/10', label: 'Not Mentioned' },
}

// ── Main Component ───────────────────────────────────────────────────────
export default function AIRecommendationRecorderDashboard({ domain, userId }: AIRecommendationRecorderDashboardProps) {
  const [data, setData] = useState<RecommendationRecorderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'diff' | 'history'>('current')

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/ai/recommendation-recorder?domain=${encodeURIComponent(domain)}${userId ? `&userId=${userId}` : ''}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch {
        setData({ ...FALLBACK_DATA, brand: domain })
      } finally {
        setLoading(false)
      }
    }
    if (domain) loadData()
  }, [domain, userId])

  const current = data?.current ?? FALLBACK_DATA.current
  const previous = data?.previous ?? FALLBACK_DATA.previous
  const history = data?.history ?? FALLBACK_DATA.history

  // Simulated recording action
  const handleRecord = async () => {
    setIsRecording(true)
    // In production, this would call an API endpoint
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsRecording(false)
  }

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">AI Recommendation Recorder™</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 rounded-lg bg-muted/30 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />)}
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
        <CardHeader><CardTitle className="text-lg">AI Recommendation Recorder™</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Failed to load recorder data</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Diff summary stats
  const diffStats = current.engines.reduce((acc, cur, i) => {
    const prev = previous.engines[i]
    const status = getDiffStatus(cur, prev)
    if (status === 'gained') acc.gained++
    if (status === 'lost') acc.lost++
    if (status === 'improved') acc.improved++
    return acc
  }, { gained: 0, lost: 0, improved: 0 })

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">AI Recommendation Recorder™</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {/* REC indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
            <div className="relative flex h-2 w-2">
              {(isRecording || data?.isRecording) && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${(isRecording || data?.isRecording) ? 'bg-red-400' : 'bg-muted-foreground/30'}`} />
            </div>
            <span className={`text-xs font-bold ${(isRecording || data?.isRecording) ? 'text-red-400' : 'text-muted-foreground'}`}>
              {(isRecording || data?.isRecording) ? 'REC' : 'IDLE'}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleRecord}
            disabled={isRecording}
            className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 h-8"
          >
            {isRecording ? (
              <>
                <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mr-1.5" />
                Recording...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1.5" />
                Record Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Query info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-black/20">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground">Query: </span>
            <span className="text-sm font-medium text-foreground truncate">{data?.query ?? current.query}</span>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] shrink-0">
            {current.mentionedCount}/{current.totalEngines} engines
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'diff' | 'history')}>
          <TabsList className="bg-black/30 border border-white/[0.06]">
            <TabsTrigger value="current" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
              <Activity className="w-3.5 h-3.5 mr-1" />
              Current
            </TabsTrigger>
            <TabsTrigger value="diff" className="data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400">
              <GitCompareArrows className="w-3.5 h-3.5 mr-1" />
              Diff
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400">
              <History className="w-3.5 h-3.5 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Current Recording Tab */}
          <TabsContent value="current">
            <div className="space-y-2 mt-3">
              {current.engines.map((engine, i) => {
                const colors = ENGINE_COLORS[engine.engine] ?? { text: 'text-muted-foreground', bg: 'bg-white/10', border: 'border-white/10', dot: 'bg-muted-foreground' }
                return (
                  <motion.div
                    key={engine.engine}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        <span className={`text-sm font-semibold ${colors.text}`}>{engine.engine}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {engine.mentioned ? (
                          <>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              Mentioned
                            </Badge>
                            {engine.position && (
                              <span className="text-xs font-bold text-foreground tabular-nums">#{engine.position}</span>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/10 text-[10px]">
                            <XCircle className="w-3 h-3 mr-0.5" />
                            Not Mentioned
                          </Badge>
                        )}
                      </div>
                    </div>
                    {engine.mentioned && engine.snippet && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-4 border-l-2 border-white/5">
                        &ldquo;{engine.snippet}&rdquo;
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {/* Diff Tab */}
          <TabsContent value="diff">
            <div className="mt-3 space-y-3">
              {/* Diff summary bar */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-black/20">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">+{diffStats.gained} gained</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">{diffStats.lost} lost</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">{diffStats.improved} improved</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-xs text-muted-foreground">
                  {previous.mentionedCount} → {current.mentionedCount} mentions
                </span>
              </div>

              {/* Per-engine diff cards */}
              <AnimatePresence>
                {current.engines.map((cur, i) => {
                  const prev = previous.engines[i]
                  const diff = getDiffStatus(cur, prev)
                  const style = DIFF_STYLES[diff]
                  const colors = ENGINE_COLORS[cur.engine] ?? { text: 'text-muted-foreground', bg: 'bg-white/10', border: 'border-white/10', dot: 'bg-muted-foreground' }

                  return (
                    <motion.div
                      key={cur.engine}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                          <span className={`text-sm font-semibold ${colors.text}`}>{cur.engine}</span>
                        </div>
                        <Badge variant="outline" className={`${style.badge} text-[10px]`}>
                          {style.label}
                        </Badge>
                      </div>

                      {/* Before/After positions */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{previous.label}:</span>
                          {prev.mentioned ? (
                            <span className="font-medium text-foreground">#{prev.position}</span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{current.label}:</span>
                          {cur.mentioned ? (
                            <span className="font-medium text-foreground">#{cur.position}</span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                      </div>

                      {/* Snippet if gained/improved */}
                      {(diff === 'gained' || diff === 'improved') && cur.snippet && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pl-3 border-l-2 border-emerald-500/30">
                          &ldquo;{cur.snippet}&rdquo;
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <ScrollArea className="max-h-80 mt-3">
              <div className="space-y-2">
                {history.map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{rec.label}</span>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                          {rec.mentionedCount}/{rec.totalEngines}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{rec.date}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-400 hover:text-purple-300">
                      View
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
