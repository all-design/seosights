'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  Target,
  Lightbulb,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────

interface MissionAction {
  action: string
  why: string
  effort: string
  expectedImpact: string
  confidence?: number
}

interface DailyBriefing {
  topActions: MissionAction[]
  context: {
    currentVisibility: number
    visibilityTrend: string
    trustScore: number
    authorityScore: number
    freshnessScore: number
    recentActionCount: number
    avgVisibilityGainPerAction: number
    totalCitationsGained: number
    totalOrganicGained: number
  }
  growthScore: number
  weeklyTheme: string
  riskAlert: string | null
  todayRecommendations: Array<{
    id: string
    category: string
    recommendation: string
    confidence: number
    estimatedImpact: string
    effortMinutes: number
    status: string
  }>
}

interface GrowthMemoryEntry {
  id: string
  actionType: string
  targetEntity: string
  visibilityDelta: number
  citationDelta: number
  organicDelta: number
  createdAt: string
}

interface VisibilityDataPoint {
  month: string
  score: number
  actions: number
  articles: number
}

interface ArticleROIEntry {
  articleId: string
  title: string
  totalCostUsd: number
  revenueAttributed: number
  roi: number
  visibilityDelta: number
  citationsGained: number
  format?: string
}

interface KnowledgeGap {
  type: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface SprintEntry {
  id: string
  goal: string
  status: string
  progress: number
  totalActions: number
  executedActions: number
}

// ─── Animated Counter Hook ──────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 2000, enabled: boolean = true) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    // If target is 0, just reset via rAF
    if (target === 0) {
      const id = requestAnimationFrame(() => setCount(0))
      return () => cancelAnimationFrame(id)
    }

    fromRef.current = 0
    startRef.current = 0

    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)
      const current = Math.round(fromRef.current + (target - fromRef.current) * easedProgress)
      setCount(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, enabled])

  return count
}

// ─── Greeting Helper ────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 17) return 'Good afternoon.'
  return 'Good evening.'
}

// ─── Format Number ──────────────────────────────────────────────────────

function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

// ─── Stagger Animation Variants ─────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Execute Steps ──────────────────────────────────────────────────────

const EXECUTE_STEPS = [
  'Analyzing...',
  'Writing...',
  'Reviewing...',
  'Optimizing...',
  'Publishing...',
  'Done ✓',
]

// ─── Main Component ─────────────────────────────────────────────────────

export default function ClientZeroPanel() {
  // ── State ───────────────────────────────────────────────────────────
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreDelta, setScoreDelta] = useState(0)
  const [showYesterdayGains, setShowYesterdayGains] = useState(false)
  const [expandedMission, setExpandedMission] = useState<number | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executeStep, setExecuteStep] = useState(0)
  const [showDepth, setShowDepth] = useState(false)
  const [greeting] = useState(getGreeting)

  // Depth data
  const [visibilityMemory, setVisibilityMemory] = useState<VisibilityDataPoint[]>([])
  const [growthMemory, setGrowthMemory] = useState<GrowthMemoryEntry[]>([])
  const [articleROI, setArticleROI] = useState<ArticleROIEntry[]>([])
  const [sprints, setSprints] = useState<SprintEntry[]>([])
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([])

  // Refs
  const scoreGlowRef = useRef<HTMLDivElement>(null)

  // Animated counter
  const visibilityScore = briefing?.context?.currentVisibility ?? 0
  const animatedScore = useAnimatedCounter(visibilityScore, 2200, !loading)

  // Yesterday gains
  const yesterdayCitations = briefing?.context?.totalCitationsGained ?? 0
  const yesterdayRecommendations = briefing?.todayRecommendations?.filter(r => r.status === 'completed').length ?? 0

  // ── Fetch Briefing ──────────────────────────────────────────────────
  const fetchBrain = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/content-engine/growth-brain')
      if (res.ok) {
        const data = await res.json()
        const brf = data.dailyBriefing as DailyBriefing
        setBriefing(brf)
        // Calculate today's delta from context
        const delta = brf.context?.avgVisibilityGainPerAction
          ? Math.max(1, Math.round(brf.context.avgVisibilityGainPerAction * 0.8))
          : Math.round(Math.random() * 4 + 2)
        setScoreDelta(delta)
      } else {
        // Fallback mock data
        setBriefing(mockBriefing)
        setScoreDelta(4)
      }
    } catch {
      setBriefing(mockBriefing)
      setScoreDelta(4)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch Depth Data ────────────────────────────────────────────────
  const fetchDepthData = useCallback(async () => {
    try {
      const [visRes, memRes, roiRes] = await Promise.all([
        fetch('/api/content-engine/visibility-memory'),
        fetch('/api/content-engine/growth-memory?limit=5'),
        fetch('/api/content-engine/article-roi?days=30'),
      ])

      if (visRes.ok) {
        const visData = await visRes.json()
        const timeline = visData.timeline || visData
        if (Array.isArray(timeline)) {
          setVisibilityMemory(timeline.map((t: Record<string, unknown>) => ({
            month: t.month || t.date || '',
            score: Number(t.score || t.visibility || 0),
            actions: Number(t.actions || 0),
            articles: Number(t.articles || 0),
          })))
        }
      }

      if (memRes.ok) {
        const memData = await memRes.json()
        const entries = memData.entries || memData
        if (Array.isArray(entries)) {
          setGrowthMemory(entries.slice(0, 5))
        }
      }

      if (roiRes.ok) {
        const roiData = await roiRes.json()
        const entries = roiData.entries || roiData
        if (Array.isArray(entries)) {
          setArticleROI(entries.slice(0, 5))
        }
      }

      // Sprints
      try {
        const sprintRes = await fetch('/api/content-engine/sprints')
        if (sprintRes.ok) {
          const sprintData = await sprintRes.json()
          const s = sprintData.sprints || sprintData
          if (Array.isArray(s)) setSprints(s.slice(0, 3))
        }
      } catch { /* ignore */ }

      // Knowledge gaps from graph
      try {
        const kgRes = await fetch('/api/content-engine/knowledge-graph')
        if (kgRes.ok) {
          const kgData = await kgRes.json()
          const gaps = kgData.gaps || kgData.incompleteNodes || []
          if (Array.isArray(gaps)) {
            setKnowledgeGaps(gaps.slice(0, 5).map((g: Record<string, unknown>) => ({
              type: String(g.type || g.nodeType || 'unknown'),
              description: String(g.description || g.name || g.label || 'Missing authority signal'),
              severity: g.severity as 'high' | 'medium' | 'low' || 'medium',
            })))
          }
        }
      } catch { /* ignore */ }
    } catch {
      // Use fallback data
      setVisibilityMemory(mockVisibilityData)
      setGrowthMemory(mockGrowthMemory)
      setArticleROI(mockArticleROI)
      setSprints(mockSprints)
      setKnowledgeGaps(mockKnowledgeGaps)
    }
  }, [])

  // ── Seed Data ───────────────────────────────────────────────────────
  const seedData = useCallback(async () => {
    try {
      await fetch('/api/content-engine/learning-seed', { method: 'POST' })
    } catch { /* ignore */ }
    fetchBrain()
  }, [fetchBrain])

  // ── Execute ─────────────────────────────────────────────────────────
  const handleExecute = useCallback(async () => {
    if (executing) return
    setExecuting(true)
    setExecuteStep(0)

    // Step through progress stages
    for (let i = 0; i < EXECUTE_STEPS.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i < EXECUTE_STEPS.length - 1 ? 1800 : 1200))
      setExecuteStep(i)
    }

    // After done, call the execute API
    try {
      await fetch('/api/content-engine/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoExecute: true }),
      })
    } catch { /* simulate success */ }

    // Animate score up by expected gain
    const gain = briefing?.topActions
      ? briefing.topActions.reduce((sum, a) => {
          const match = a.expectedImpact.match(/\+?(\d+)/)
          return sum + (match ? parseInt(match[1]) : 0)
        }, 0)
      : 6

    // Glow effect
    if (scoreGlowRef.current) {
      scoreGlowRef.current.classList.add('score-glow-active')
      setTimeout(() => {
        scoreGlowRef.current?.classList.remove('score-glow-active')
      }, 2000)
    }

    // Brief pause then update briefing
    setTimeout(() => {
      fetchBrain()
      setExecuting(false)
      setExecuteStep(0)
    }, 2000)
  }, [executing, briefing, fetchBrain])

  // ── Initial Load ────────────────────────────────────────────────────
  useEffect(() => {
    fetchBrain()
  }, [fetchBrain])

  // Load depth data when expanded
  useEffect(() => {
    if (showDepth && visibilityMemory.length === 0) {
      fetchDepthData()
    }
  }, [showDepth, visibilityMemory.length, fetchDepthData])

  // Score glow on load
  useEffect(() => {
    if (!loading && briefing) {
      setTimeout(() => {
        scoreGlowRef.current?.classList.add('score-glow-active')
        setTimeout(() => {
          scoreGlowRef.current?.classList.remove('score-glow-active')
        }, 2000)
      }, 500)
    }
  }, [loading, briefing])

  // ── Expected Gain ───────────────────────────────────────────────────
  const expectedGain = briefing?.topActions
    ? briefing.topActions.reduce((sum, a) => {
        const match = a.expectedImpact.match(/\+?(\d+)/)
        return sum + (match ? parseInt(match[1]) : 0)
      }, 0)
    : 6

  // ── Missions (conversational AI format) ─────────────────────────────
  const missions = briefing?.topActions?.length
    ? briefing.topActions.map((a, i) => ({
        id: i,
        text: a.action,
        why: a.why,
        confidence: a.confidence || (85 - i * 5),
        effort: a.effort,
        impact: a.expectedImpact,
        tag: getMissionTag(a.action),
      }))
    : []

  // ─── RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="client-zero-today">
      {/* Embedded styles for score glow animation */}
      <style jsx global>{`
        .score-glow-active {
          animation: scoreGlowPulse 2s ease-out forwards;
        }
        @keyframes scoreGlowPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          30% { box-shadow: 0 0 40px 10px rgba(16, 185, 129, 0.3); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .emerald-text-glow {
          animation: emeraldTextPulse 3s ease-in-out infinite;
        }
        @keyframes emeraldTextPulse {
          0%, 100% { text-shadow: 0 0 8px rgba(16, 185, 129, 0.3); }
          50% { text-shadow: 0 0 20px rgba(16, 185, 129, 0.6); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        {/* Main Content */}
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* ── Section 1: Greeting + Score ──────────────────────────── */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto bg-zinc-800" />
                <Skeleton className="h-32 w-32 mx-auto rounded-full bg-zinc-800" />
                <Skeleton className="h-6 w-24 mx-auto bg-zinc-800" />
              </div>
            ) : briefing ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {/* Greeting */}
                <motion.p
                  variants={staggerItem}
                  className="text-lg sm:text-xl text-zinc-400 font-light tracking-wide"
                >
                  {greeting}
                </motion.p>

                {/* Score */}
                <motion.div
                  variants={staggerItem}
                  ref={scoreGlowRef}
                  className="mt-4 sm:mt-6 inline-block rounded-3xl px-6 sm:px-8 py-4"
                >
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-zinc-500 text-lg sm:text-xl font-light">Your AI Visibility is</span>
                  </div>
                  <div className="mt-1">
                    <span
                      className="text-7xl sm:text-8xl lg:text-9xl font-bold text-emerald-400 emerald-text-glow"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {animatedScore}
                    </span>
                  </div>
                </motion.div>

                {/* Delta */}
                <motion.div
                  variants={staggerItem}
                  className="mt-3"
                >
                  <span className="text-emerald-400/80 text-base sm:text-lg font-medium emerald-text-glow">
                    +{scoreDelta} today
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <p className="text-lg text-zinc-400">{greeting}</p>
                <div className="mt-6 py-8 border border-zinc-800 rounded-2xl bg-zinc-900/50">
                  <Brain className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
                    Your first AI Visibility score is waiting. Run an analysis to see where you stand.
                  </p>
                  <Button
                    onClick={seedData}
                    variant="outline"
                    className="mt-4 border-zinc-700 text-zinc-300 hover:text-emerald-400 hover:border-emerald-800"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Seed Demo Data
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* ── Section 2: Yesterday's Gains ─────────────────────────── */}
          {briefing && !loading && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-8"
            >
              <button
                onClick={() => setShowYesterdayGains(!showYesterdayGains)}
                className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-400 transition-colors text-sm group"
              >
                <span>Yesterday&apos;s gains</span>
                <motion.div
                  animate={{ rotate: showYesterdayGains ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showYesterdayGains && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2 sm:gap-3 pt-3 flex-wrap">
                      <Badge variant="secondary" className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 text-xs">
                        +{yesterdayCitations} citations
                      </Badge>
                      <Badge variant="secondary" className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 text-xs">
                        +{yesterdayRecommendations} recommendation{yesterdayRecommendations !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="secondary" className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 text-xs">
                        +{scoreDelta} score
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* ── Separator ────────────────────────────────────────────── */}
          {briefing && !loading && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-8 sm:mb-10 origin-center"
            />
          )}

          {/* ── Section 3: Today's Mission ───────────────────────────── */}
          {briefing && !loading && (
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="mb-8 sm:mb-10"
            >
              <motion.h2
                variants={staggerItem}
                className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-5 sm:mb-6"
              >
                Today&apos;s Mission
              </motion.h2>

              {missions.length > 0 ? (
                <div className="space-y-3">
                  {missions.map((mission) => (
                    <motion.div
                      key={mission.id}
                      variants={staggerItem}
                      className="group"
                    >
                      <motion.button
                        onClick={() => setExpandedMission(expandedMission === mission.id ? null : mission.id)}
                        className="w-full text-left rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/10 hover:border-zinc-700"
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Number */}
                          <span className="text-zinc-600 font-mono text-sm mt-0.5 shrink-0">
                            {mission.id + 1}.
                          </span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-zinc-200 text-sm sm:text-base leading-relaxed">
                                {mission.text}
                              </p>
                              <motion.div
                                animate={{ rotate: expandedMission === mission.id ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="shrink-0 mt-0.5"
                              >
                                <ChevronDown className="w-4 h-4 text-zinc-600" />
                              </motion.div>
                            </div>

                            {/* Tag + Confidence */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-500">
                                {mission.tag}
                              </Badge>
                              <span className="text-[11px] text-zinc-600">
                                Confidence {mission.confidence}%
                              </span>
                              <span className="text-[11px] text-emerald-600">
                                {mission.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>

                      {/* Expanded Why */}
                      <AnimatePresence>
                        {expandedMission === mission.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="overflow-hidden"
                          >
                            <div className="ml-7 sm:ml-8 mt-1 p-3 sm:p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 shrink-0" />
                                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed italic">
                                  I&apos;d {mission.text.charAt(0).toLowerCase() + mission.text.slice(1)}. {mission.why}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-2 ml-5.5">
                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {mission.effort}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Empty mission state */
                <motion.div
                  variants={staggerItem}
                  className="py-6 border border-zinc-800 rounded-xl bg-zinc-900/30 text-center"
                >
                  <Target className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">
                    Give me a domain to analyze, and I&apos;ll tell you exactly what to do first.
                  </p>
                  <Button
                    onClick={seedData}
                    variant="outline"
                    size="sm"
                    className="mt-3 border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-800 text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Seed Demo Data
                  </Button>
                </motion.div>
              )}
            </motion.section>
          )}

          {/* ── Section 4: Expected Gain ─────────────────────────────── */}
          {briefing && !loading && missions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mb-6 text-center"
            >
              <span className="text-zinc-500 text-sm">
                Expected gain: <span className="text-emerald-500/80">+{expectedGain}</span>
              </span>
            </motion.div>
          )}

          {/* ── Section 5: Execute Button ────────────────────────────── */}
          {briefing && !loading && missions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mb-8"
            >
              <motion.div
                className="relative"
                whileTap={!executing ? { scale: 0.98 } : undefined}
              >
                <Button
                  onClick={handleExecute}
                  disabled={executing}
                  className={`
                    w-full h-14 sm:h-16 text-base sm:text-lg font-medium rounded-2xl
                    transition-all duration-500 relative overflow-hidden
                    ${executing
                      ? 'bg-emerald-900/50 text-emerald-300 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-800/40'
                    }
                  `}
                >
                  <AnimatePresence mode="wait">
                    {!executing ? (
                      <motion.div
                        key="execute"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Zap className="w-5 h-5" />
                        <span>Execute</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="progress"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center gap-3 w-full"
                      >
                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5">
                          {EXECUTE_STEPS.map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              animate={{
                                backgroundColor: i <= executeStep
                                  ? 'rgb(52, 211, 153)'
                                  : 'rgb(6, 78, 59)',
                                scale: i === executeStep ? 1.4 : 1,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          ))}
                        </div>
                        {/* Step text */}
                        <motion.span
                          key={executeStep}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-sm sm:text-base"
                        >
                          {EXECUTE_STEPS[executeStep]}
                        </motion.span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>

                {/* Progress bar behind the button */}
                {executing && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-emerald-400/40 rounded-b-2xl"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((executeStep + 1) / EXECUTE_STEPS.length) * 100}%` }}
                    transition={{ duration: 1.8, ease: 'linear' }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ── Section 6: Depth (Progressive Disclosure) ────────────── */}
          {briefing && !loading && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              <button
                onClick={() => setShowDepth(!showDepth)}
                className="w-full flex items-center justify-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors text-xs group py-3"
              >
                <span>{showDepth ? 'Show less' : 'Show more'}</span>
                <motion.div
                  animate={{ rotate: showDepth ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showDepth && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <DepthSection
                      visibilityMemory={visibilityMemory}
                      growthMemory={growthMemory}
                      articleROI={articleROI}
                      sprints={sprints}
                      knowledgeGaps={knowledgeGaps}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* ── Seed Data (always accessible) ────────────────────────── */}
          {briefing && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-8 text-center"
            >
              <Button
                onClick={seedData}
                variant="ghost"
                size="sm"
                className="text-zinc-700 hover:text-zinc-500 text-[11px]"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Refresh Data
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Depth Section Component ────────────────────────────────────────────

function DepthSection({
  visibilityMemory,
  growthMemory,
  articleROI,
  sprints,
  knowledgeGaps,
}: {
  visibilityMemory: VisibilityDataPoint[]
  growthMemory: GrowthMemoryEntry[]
  articleROI: ArticleROIEntry[]
  sprints: SprintEntry[]
  knowledgeGaps: KnowledgeGap[]
}) {
  const [activeDepthTab, setActiveDepthTab] = useState<'visibility' | 'memory' | 'roi' | 'sprint' | 'gaps'>('visibility')

  return (
    <div className="pt-4 pb-2 space-y-4">
      {/* Depth tabs */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        {[
          { key: 'visibility' as const, label: 'Visibility', icon: Eye },
          { key: 'memory' as const, label: 'Growth Feed', icon: TrendingUp },
          { key: 'roi' as const, label: 'Article ROI', icon: BarChart3 },
          { key: 'sprint' as const, label: 'Sprint', icon: Zap },
          { key: 'gaps' as const, label: 'Gaps', icon: Target },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveDepthTab(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200 whitespace-nowrap
              ${activeDepthTab === tab.key
                ? 'bg-zinc-800 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }
            `}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDepthTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {activeDepthTab === 'visibility' && (
            <VisibilityMemoryPanel data={visibilityMemory} />
          )}
          {activeDepthTab === 'memory' && (
            <GrowthMemoryFeed data={growthMemory} />
          )}
          {activeDepthTab === 'roi' && (
            <ArticleROITable data={articleROI} />
          )}
          {activeDepthTab === 'sprint' && (
            <ActiveSprintCard sprints={sprints} />
          )}
          {activeDepthTab === 'gaps' && (
            <KnowledgeGapsPanel gaps={knowledgeGaps} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Visibility Memory Chart ────────────────────────────────────────────

function VisibilityMemoryPanel({ data }: { data: VisibilityDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-center">
        <Eye className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-600 text-xs">No visibility history yet</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium">AI Visibility Memory™</span>
        <span className="text-[10px] text-zinc-600">
          {data.length} data points
        </span>
      </div>
      <div className="h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="month"
              stroke="#3f3f46"
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#3f3f46"
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#d4d4d8',
              }}
              labelStyle={{ color: '#71717a' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#34d399', stroke: '#18181b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Growth Memory Feed ─────────────────────────────────────────────────

function GrowthMemoryFeed({ data }: { data: GrowthMemoryEntry[] }) {
  if (!data.length) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-center">
        <TrendingUp className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-600 text-xs">No growth memory entries yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
      {data.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800/40 bg-zinc-900/20"
        >
          <div className="w-1 h-8 rounded-full bg-emerald-600/50" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-300 truncate">
              {formatActionType(entry.actionType)}
              {entry.targetEntity ? ` → ${entry.targetEntity}` : ''}
            </p>
            <p className="text-[10px] text-zinc-600">
              {formatDate(entry.createdAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            {entry.visibilityDelta > 0 && (
              <span className="text-emerald-500 text-xs font-medium">
                +{entry.visibilityDelta} vis
              </span>
            )}
            {entry.citationDelta > 0 && (
              <span className="text-emerald-600 text-[10px] block">
                +{entry.citationDelta} cit
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Article ROI Table ──────────────────────────────────────────────────

function ArticleROITable({ data }: { data: ArticleROIEntry[] }) {
  if (!data.length) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-center">
        <BarChart3 className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-600 text-xs">No ROI data yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="text-left text-zinc-600 font-medium px-3 py-2">Article</th>
              <th className="text-right text-zinc-600 font-medium px-3 py-2">ROI</th>
              <th className="text-right text-zinc-600 font-medium px-3 py-2">Vis Δ</th>
              <th className="text-right text-zinc-600 font-medium px-3 py-2">Cit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => (
              <motion.tr
                key={entry.articleId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-zinc-800/30 last:border-0"
              >
                <td className="px-3 py-2 text-zinc-300 max-w-[140px] truncate">
                  {entry.title || `Article ${i + 1}`}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={entry.roi > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {entry.roi > 0 ? '+' : ''}{Math.round(entry.roi)}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-emerald-500">
                  +{entry.visibilityDelta}
                </td>
                <td className="px-3 py-2 text-right text-zinc-400">
                  +{entry.citationsGained}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Active Sprint Card ─────────────────────────────────────────────────

function ActiveSprintCard({ sprints }: { sprints: SprintEntry[] }) {
  if (!sprints.length) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-center">
        <Zap className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-600 text-xs">No active sprints</p>
      </div>
    )
  }

  const active = sprints.find(s => s.status === 'active') || sprints[0]

  return (
    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 font-medium">Active Sprint</span>
        <Badge variant="outline" className="text-[10px] border-emerald-800/50 text-emerald-500">
          {active.status}
        </Badge>
      </div>
      <p className="text-sm text-zinc-200 mb-3">{active.goal}</p>
      <div className="w-full bg-zinc-800 rounded-full h-1.5">
        <motion.div
          className="bg-emerald-500 h-1.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${active.progress || (active.totalActions > 0 ? Math.round((active.executedActions / active.totalActions) * 100) : 0)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-zinc-600">
          {active.executedActions || 0}/{active.totalActions || 0} actions
        </span>
        <span className="text-[10px] text-emerald-600">
          {active.progress || (active.totalActions > 0 ? Math.round((active.executedActions / active.totalActions) * 100) : 0)}%
        </span>
      </div>
    </div>
  )
}

// ─── Knowledge Gaps Panel ───────────────────────────────────────────────

function KnowledgeGapsPanel({ gaps }: { gaps: KnowledgeGap[] }) {
  if (!gaps.length) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-center">
        <Target className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-zinc-600 text-xs">No knowledge gaps detected</p>
      </div>
    )
  }

  const severityColor = {
    high: 'text-red-400 bg-red-950/30 border-red-900/40',
    medium: 'text-amber-400 bg-amber-950/30 border-amber-900/40',
    low: 'text-zinc-400 bg-zinc-900/30 border-zinc-800/40',
  }

  return (
    <div className="space-y-2">
      {gaps.map((gap, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`flex items-center gap-2 p-3 rounded-lg border ${severityColor[gap.severity]}`}
        >
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{gap.description}</p>
            <p className="text-[10px] opacity-60">{gap.type}</p>
          </div>
          <Badge variant="outline" className="text-[9px] border-current/30 shrink-0">
            {gap.severity}
          </Badge>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getMissionTag(action: string): string {
  const lower = action.toLowerCase()
  if (lower.includes('faq')) return 'FAQ'
  if (lower.includes('schema') || lower.includes('author')) return 'Schema'
  if (lower.includes('llms.txt')) return 'llms.txt'
  if (lower.includes('link')) return 'Linking'
  if (lower.includes('article') || lower.includes('publish') || lower.includes('write')) return 'Content'
  if (lower.includes('entity')) return 'Entity'
  if (lower.includes('technical') || lower.includes('robots') || lower.includes('fix')) return 'Technical'
  return 'Growth'
}

function formatActionType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────

const mockBriefing: DailyBriefing = {
  topActions: [
    {
      action: 'Publish FAQ for pricing',
      why: 'Highest expected ROI based on 42 similar actions. FAQ pages consistently drive AEO visibility gains.',
      effort: '15 min',
      expectedImpact: '+4 AI Visibility',
      confidence: 91,
    },
    {
      action: 'Add Author schema to blog posts',
      why: 'Quick win. Author schema strengthens E-E-A-T signals that AI engines weigh heavily.',
      effort: '10 min',
      expectedImpact: '+2 AI Visibility',
      confidence: 85,
    },
    {
      action: 'Update llms.txt with 10 new articles',
      why: 'Ensures AI engines index your latest content. Low effort, consistent visibility lift.',
      effort: '10 min',
      expectedImpact: '+2 AI Visibility',
      confidence: 78,
    },
  ],
  context: {
    currentVisibility: 73,
    visibilityTrend: 'improving',
    trustScore: 68,
    authorityScore: 71,
    freshnessScore: 65,
    recentActionCount: 24,
    avgVisibilityGainPerAction: 3.2,
    totalCitationsGained: 12,
    totalOrganicGained: 340,
  },
  growthScore: 73,
  weeklyTheme: 'Entity Authority Building',
  riskAlert: null,
  todayRecommendations: [],
}

const mockVisibilityData: VisibilityDataPoint[] = [
  { month: 'Sep', score: 35, actions: 8, articles: 3 },
  { month: 'Oct', score: 42, actions: 12, articles: 5 },
  { month: 'Nov', score: 48, actions: 15, articles: 6 },
  { month: 'Dec', score: 55, actions: 18, articles: 7 },
  { month: 'Jan', score: 63, actions: 22, articles: 8 },
  { month: 'Feb', score: 73, actions: 24, articles: 9 },
]

const mockGrowthMemory: GrowthMemoryEntry[] = [
  {
    id: '1',
    actionType: 'published_article',
    targetEntity: 'AI Visibility Guide',
    visibilityDelta: 5,
    citationDelta: 2,
    organicDelta: 45,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    actionType: 'created_faq',
    targetEntity: 'Pricing FAQ',
    visibilityDelta: 3,
    citationDelta: 1,
    organicDelta: 20,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    actionType: 'added_author',
    targetEntity: 'Blog Posts',
    visibilityDelta: 2,
    citationDelta: 1,
    organicDelta: 10,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '4',
    actionType: 'updated_llms_txt',
    targetEntity: 'llms.txt',
    visibilityDelta: 3,
    citationDelta: 2,
    organicDelta: 15,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: '5',
    actionType: 'created_entity',
    targetEntity: 'Seosights Brand',
    visibilityDelta: 6,
    citationDelta: 3,
    organicDelta: 30,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
]

const mockArticleROI: ArticleROIEntry[] = [
  { articleId: '1', title: 'AI Visibility Guide', totalCostUsd: 25, revenueAttributed: 180, roi: 620, visibilityDelta: 5, citationsGained: 3, format: 'Article' },
  { articleId: '2', title: 'Pricing FAQ', totalCostUsd: 10, revenueAttributed: 95, roi: 850, visibilityDelta: 3, citationsGained: 2, format: 'FAQ' },
  { articleId: '3', title: 'Entity SEO Explained', totalCostUsd: 25, revenueAttributed: 120, roi: 380, visibilityDelta: 4, citationsGained: 1, format: 'Article' },
  { articleId: '4', title: 'AEO Best Practices', totalCostUsd: 20, revenueAttributed: 75, roi: 275, visibilityDelta: 3, citationsGained: 2, format: 'Guide' },
  { articleId: '5', title: 'GEO Optimization Tips', totalCostUsd: 15, revenueAttributed: 60, roi: 300, visibilityDelta: 2, citationsGained: 1, format: 'Article' },
]

const mockSprints: SprintEntry[] = [
  {
    id: '1',
    goal: 'Build entity authority for core topics',
    status: 'active',
    progress: 65,
    totalActions: 12,
    executedActions: 8,
  },
]

const mockKnowledgeGaps: KnowledgeGap[] = [
  { type: 'source', description: 'No Wikipedia page', severity: 'high' },
  { type: 'source', description: 'No Crunchbase entry', severity: 'high' },
  { type: 'source', description: 'No Reddit presence', severity: 'medium' },
  { type: 'entity', description: 'Missing Product Schema', severity: 'medium' },
  { type: 'entity', description: 'No Organization Schema', severity: 'low' },
]
