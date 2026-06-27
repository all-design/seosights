'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRight,
  ChevronRight,
  Crown,
  Flag,
  Minus,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AICompetitorRaceProps {
  onStartFree?: () => void
}

interface RankingItem {
  rank: number
  domain: string
  score: number
  change: number
  isYou: boolean
}

interface CompetitorRaceResponse {
  rankings: RankingItem[]
  yourPosition: number
  totalCompetitors: number
  _meta: {
    status: 'live' | 'estimated' | 'simulation'
    source: string
  }
}

// ── Fallback Data ─────────────────────────────────────────────
const FALLBACK_RANKINGS: RankingItem[] = [
  { rank: 1, domain: 'rushforsheets.com', score: 78, change: 3, isYou: false },
  { rank: 2, domain: 'seosights.com', score: 71, change: 3, isYou: true },
  { rank: 3, domain: 'sheetmagic.io', score: 65, change: -2, isYou: false },
  { rank: 4, domain: 'formulabot.com', score: 52, change: 0, isYou: false },
  { rank: 5, domain: 'excelforum.com', score: 41, change: -3, isYou: false },
]

const FALLBACK_YOUR_POSITION = 2
const FALLBACK_TOTAL_COMPETITORS = 5

// ── Helpers ───────────────────────────────────────────────────
function getChangeIndicator(change: number) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-mono font-bold text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        +{change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-mono font-bold text-red-400">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-mono text-white/30">
      <Minus className="h-3 w-3" />
      0
    </span>
  )
}

function getRankBadge(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-400" />
  if (rank === 2) return <Trophy className="h-4 w-4 text-gray-300" />
  if (rank === 3) return <Flag className="h-4 w-4 text-amber-600" />
  return <span className="text-xs font-mono font-bold text-white/40">#{rank}</span>
}

function getBarColor(isYou: boolean, rank: number) {
  if (isYou) return 'bg-emerald-400'
  if (rank === 1) return 'bg-amber-400'
  if (rank <= 3) return 'bg-purple-400/70'
  return 'bg-white/20'
}

// ── Skeleton Components ───────────────────────────────────────
function SummarySkeleton() {
  return (
    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <div className="text-center">
            <Skeleton className="h-3 w-16 mx-auto mb-2 bg-white/10" />
            <Skeleton className="h-9 w-12 mx-auto bg-white/10" />
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          <div className="text-center">
            <Skeleton className="h-3 w-16 mx-auto mb-2 bg-white/10" />
            <Skeleton className="h-9 w-10 mx-auto bg-white/10" />
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          <div className="text-center">
            <Skeleton className="h-3 w-16 mx-auto mb-2 bg-white/10" />
            <Skeleton className="h-9 w-16 mx-auto bg-white/10" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RowSkeleton({ index }: { index: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 sm:py-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-8 shrink-0 flex items-center justify-center">
          <Skeleton className="h-4 w-4 rounded-full bg-white/10" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Skeleton className="h-4 w-28 bg-white/10" />
          </div>
          <Skeleton className="h-3 w-full rounded-full bg-white/5" />
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <Skeleton className="h-6 w-8 bg-white/10" />
          <Skeleton className="h-3 w-10 bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
          <Trophy className="h-4 w-4 text-white/40" />
          AI Visibility Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function OpportunitySkeleton() {
  return (
    <Card className="border border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-xl">
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg bg-amber-500/15" />
          <div>
            <Skeleton className="h-4 w-36 mb-1 bg-white/10" />
            <Skeleton className="h-3 w-56 bg-white/10" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-md bg-white/10" />
      </CardContent>
    </Card>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function AICompetitorRace({ onStartFree }: AICompetitorRaceProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [rankings, setRankings] = useState<RankingItem[] | null>(null)
  const [yourPosition, setYourPosition] = useState<number>(FALLBACK_YOUR_POSITION)
  const [totalCompetitors, setTotalCompetitors] = useState<number>(FALLBACK_TOTAL_COMPETITORS)
  const [meta, setMeta] = useState<CompetitorRaceResponse['_meta'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/competitor-race?domain=seosights.com')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data: CompetitorRaceResponse = await res.json()
      setRankings(data.rankings)
      setYourPosition(data.yourPosition)
      setTotalCompetitors(data.totalCompetitors)
      setMeta(data._meta)
      setError(false)
    } catch (err) {
      console.error('Failed to fetch competitor race data:', err)
      // Fallback to hardcoded data on error
      if (!rankings) {
        setRankings(FALLBACK_RANKINGS)
        setYourPosition(FALLBACK_YOUR_POSITION)
        setTotalCompetitors(FALLBACK_TOTAL_COMPETITORS)
      }
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [rankings])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    intervalRef.current = setInterval(fetchData, 60000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchData])

  // Derived values
  const yourData = rankings?.find(r => r.isYou)
  const yourRank = yourPosition || (rankings ? rankings.findIndex(r => r.isYou) + 1 : 2)
  const leaderData = rankings?.[0]
  const leaderScore = leaderData?.score ?? 0
  const gapToLeader = yourData && leaderData ? leaderScore - yourData.score : 0

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
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-purple-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[300px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <Swords className="h-3.5 w-3.5" />
            LIVE LEADERBOARD
            {meta && (
              <span className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${
                meta.status === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Competitor{' '}
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Race
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            See how you stack up against competitors in AI visibility. Track rankings, spot opportunities to overtake, and close the gap.
          </p>
          {error && (
            <p className="mt-2 text-xs text-amber-400/60">Showing estimated data — live update unavailable</p>
          )}
        </motion.div>

        {/* Your Position Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          {loading ? (
            <SummarySkeleton />
          ) : (
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                  <div className="text-center">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Your Rank</span>
                    <div className="text-3xl font-bold text-emerald-400 mt-1">#{yourRank}</div>
                  </div>
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                  <div className="text-center">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Your Score</span>
                    <div className="text-3xl font-bold font-mono text-white mt-1">{yourData?.score ?? '—'}</div>
                  </div>
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                  <div className="text-center">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Gap to #1</span>
                    <div className="text-3xl font-bold font-mono text-amber-400 mt-1">{gapToLeader} pts</div>
                  </div>
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                  <div className="text-center">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Competitors</span>
                    <div className="text-3xl font-bold font-mono text-white/70 mt-1">{totalCompetitors}</div>
                  </div>
                </div>

                {/* Overtake Alert */}
                {yourData && yourData.change > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2"
                  >
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-medium">
                      Overtake Alert! You gained +{yourData.change} points and are closing in on #{yourRank - 1 > 0 ? yourRank - 1 : 1}
                    </span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {loading ? (
            <LeaderboardSkeleton />
          ) : (
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                  <Trophy className="h-4 w-4 text-white/40" />
                  AI Visibility Leaderboard
                  {meta && (
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-white/10 text-white/30">
                      {meta.status}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {rankings?.map((row, i) => {
                    const rank = row.rank
                    const barWidth = (row.score / 100) * 100

                    return (
                      <motion.div
                        key={row.domain}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className={`rounded-lg border ${
                          row.isYou
                            ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                            : 'border-white/5 bg-white/[0.02]'
                        } px-4 py-3 sm:py-4`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Rank */}
                          <div className="w-8 shrink-0 flex items-center justify-center">
                            {getRankBadge(rank)}
                          </div>

                          {/* Domain */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-sm font-semibold truncate ${row.isYou ? 'text-emerald-400' : 'text-white/80'}`}>
                                {row.domain}
                              </span>
                              {row.isYou && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                  YOU
                                </Badge>
                              )}
                              {rank === 1 && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                  LEADER
                                </Badge>
                              )}
                            </div>

                            {/* Score Bar */}
                            <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={isInView ? { width: `${barWidth}%` } : { width: 0 }}
                                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 + i * 0.1 }}
                                className={`h-full rounded-full ${getBarColor(row.isYou, rank)}`}
                              />
                            </div>
                          </div>

                          {/* Score + Change */}
                          <div className="shrink-0 flex flex-col items-end gap-0.5">
                            <span className={`text-lg font-bold font-mono ${row.isYou ? 'text-emerald-400' : 'text-white/70'}`}>
                              {row.score}
                            </span>
                            {getChangeIndicator(row.change)}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Overtake Opportunity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-6"
        >
          {loading ? (
            <OpportunitySkeleton />
          ) : (
            <Card className="border border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-xl">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-300">Overtake Opportunity</h4>
                    <p className="text-xs text-white/50 mt-0.5">
                      You&apos;re only <span className="text-amber-400 font-bold">{gapToLeader} points</span> behind <span className="text-white/70 font-medium">{leaderData?.domain ?? 'the leader'}</span>. Fix 2 quick wins to take the lead.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onStartFree}
                  variant="outline"
                  size="sm"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 shrink-0"
                >
                  Take the Lead
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/20 text-base"
          >
            Start Racing
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
