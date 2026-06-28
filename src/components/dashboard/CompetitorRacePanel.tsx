'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw,
  Crown,
  Trophy,
  Flag,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Radio,
  Users,
  AlertCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface CompetitorRanking {
  rank: number
  domain: string
  score: number
  change: number
  isYou: boolean
}

interface CompetitorRaceMeta {
  status: 'live' | 'estimated' | 'simulation'
  source: 'database' | 'mock' | 'partial'
}

interface CompetitorRaceData {
  rankings: CompetitorRanking[]
  yourPosition: number
  totalCompetitors: number
  _meta: CompetitorRaceMeta
}

interface CompetitorRacePanelProps {
  domain: string
  userId?: string
  industry?: string
}

// ── Constants ──────────────────────────────────────────────────
const AUTO_REFRESH_INTERVAL = 120_000

// ── Rank Icon Component ────────────────────────────────────────
function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />
  if (rank === 2) return <Trophy className="w-4 h-4 text-gray-300" />
  if (rank === 3) return <Flag className="w-4 h-4 text-amber-600" />
  return null
}

// ── Change Indicator Component ─────────────────────────────────
function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
        <ArrowUp className="w-3 h-3" />+{change}
      </span>
    )
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-rose-400 text-xs font-semibold">
        <ArrowDown className="w-3 h-3" />{change}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-white/30 text-xs font-semibold">
      <Minus className="w-3 h-3" />0
    </span>
  )
}

// ── Score Bar Colors ───────────────────────────────────────────
function getScoreBarColor(ranking: CompetitorRanking): string {
  if (ranking.isYou) return 'bg-emerald-500'
  if (ranking.rank === 1) return 'bg-amber-500'
  if (ranking.rank <= 3) return 'bg-purple-500'
  return 'bg-white/20'
}

function getScoreBarTrackColor(ranking: CompetitorRanking): string {
  if (ranking.isYou) return 'bg-emerald-500/10'
  if (ranking.rank === 1) return 'bg-amber-500/10'
  if (ranking.rank <= 3) return 'bg-purple-500/10'
  return 'bg-white/5'
}

// ── Loading Skeleton ───────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-40 bg-white/5" />
          <Skeleton className="h-5 w-12 bg-white/5 rounded-full" />
        </div>
        <Skeleton className="h-8 w-8 bg-white/5 rounded-md" />
      </div>

      {/* Position summary skeleton */}
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 bg-white/5 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-white/5" />
            <Skeleton className="h-3 w-24 bg-white/5" />
          </div>
        </div>
      </div>

      {/* Leaderboard rows skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01]"
        >
          <Skeleton className="h-8 w-8 bg-white/5 rounded-md" />
          <Skeleton className="h-4 w-28 bg-white/5" />
          <div className="flex-1">
            <Skeleton className="h-2 w-full bg-white/5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-8 bg-white/5" />
        </div>
      ))}
    </div>
  )
}

// ── Error State Component ──────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-rose-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white/80">Failed to load race data</p>
        <p className="text-xs text-white/50 mt-1">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90"
      >
        <RefreshCw className="w-3 h-3 mr-1.5" />
        Retry
      </Button>
    </div>
  )
}

// ── Expanded Row Details ───────────────────────────────────────
function ExpandedDetails({ ranking, maxScore }: { ranking: CompetitorRanking; maxScore: number }) {
  const percentage = Math.round((ranking.score / maxScore) * 100)
  const gapToLeader = maxScore - ranking.score

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Score</p>
          <p className="text-sm font-bold text-white/80">{ranking.score}/100</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Rank Change</p>
          <div className="flex items-center gap-1">
            <ChangeIndicator change={ranking.change} />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
            {ranking.rank === 1 ? 'Lead over #2' : 'Gap to Leader'}
          </p>
          <p className="text-sm font-bold text-white/80">
            {ranking.rank === 1 ? `+${gapToLeader}` : `-${gapToLeader}`} pts
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Relative</p>
          <p className="text-sm font-bold text-white/80">{percentage}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Position</p>
          <p className="text-sm font-bold text-white/80">#{ranking.rank}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function CompetitorRacePanel({ domain, userId, industry }: CompetitorRacePanelProps) {
  const [data, setData] = useState<CompetitorRaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ── Data Fetching ──────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({ domain })
      if (userId) params.set('userId', userId)
      if (industry) params.set('industry', industry)

      const res = await fetch(`/api/ai/competitor-race?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`)
      }

      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [domain, userId, industry])

  // ── Initial fetch + auto-refresh ───────────────────────────
  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData(true)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchData])

  // ── Derived Data ───────────────────────────────────────────
  const yourRanking = data?.rankings.find((r) => r.isYou) ?? null
  const leaderRanking = data?.rankings.find((r) => r.rank === 1) ?? null
  const maxScore = data?.rankings.reduce((max, r) => Math.max(max, r.score), 0) ?? 100
  const gapToLeader =
    yourRanking && leaderRanking ? leaderRanking.score - yourRanking.score : 0
  const nextRankAbove =
    yourRanking && data
      ? data.rankings.find((r) => r.rank === yourRanking.rank - 1)
      : null
  const gapToNext =
    yourRanking && nextRankAbove ? nextRankAbove.score - yourRanking.score : 0

  // ── Industry average (estimated from data if industry provided) ──
  const industryAverage =
    data && industry
      ? Math.round(
          data.rankings.reduce((sum, r) => sum + r.score, 0) / data.rankings.length
        )
      : null

  // ── Render ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="pt-6 pb-4 px-4 sm:px-6 bg-[#0d1117]">
          {/* ── Header ──────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white/80 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Competitor Race
              </h3>
              {data?._meta.status === 'live' && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1"
                >
                  <Radio className="w-2.5 h-2.5" />
                  Live
                </Badge>
              )}
              {data?._meta.status === 'estimated' && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border-amber-500/30"
                >
                  Estimated
                </Badge>
              )}
              {data?._meta.status === 'simulation' && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/5 border-white/10"
                >
                  Simulation
                </Badge>
              )}
              {data && (
                <span className="text-xs text-white/30 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {data.totalCompetitors} competitors
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-8 w-8 text-white/40 hover:text-white/80 hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* ── Last Updated ────────────────────────────────── */}
          {lastUpdated && (
            <p className="text-[10px] text-white/20 mb-4 -mt-3">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}

          {/* ── Content ─────────────────────────────────────── */}
          {loading && !refreshing ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchData()} />
          ) : data ? (
            <div className="space-y-4">
              {/* ── Your Position Summary Card ─────────────── */}
              {yourRanking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      {/* Rank circle */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-lg font-black text-emerald-400">
                          #{yourRanking.rank}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/80">
                          Your Position
                        </p>
                        <p className="text-xs text-white/50">
                          Score: <span className="text-emerald-400 font-bold">{yourRanking.score}</span>
                          {' / '}
                          {yourRanking.change > 0
                            ? `+${yourRanking.change} from last period`
                            : yourRanking.change < 0
                            ? `${yourRanking.change} from last period`
                            : 'No change'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Overtake alert */}
                      {yourRanking.change > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Gaining +{yourRanking.change}
                        </Badge>
                      )}
                      {/* Gap to leader */}
                      {gapToLeader > 0 && leaderRanking && (
                        <div className="text-xs text-white/50 flex items-center gap-1">
                          <span className="text-amber-400 font-bold">{gapToLeader}</span> pts behind leader
                        </div>
                      )}
                      {/* You are the leader! */}
                      {yourRanking.rank === 1 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border-amber-500/30 flex items-center gap-1"
                        >
                          <Crown className="w-3 h-3" />
                          You&#39;re #1!
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Leaderboard ────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/30">
                    Leaderboard
                  </h4>
                  <span className="text-[10px] text-white/20">Score out of 100</span>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {data.rankings
                    .sort((a, b) => a.rank - b.rank)
                    .map((ranking, index) => (
                      <motion.div
                        key={ranking.domain}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                        className={`group rounded-xl border p-3 transition-all duration-200 cursor-pointer hover:bg-white/[0.03] ${
                          ranking.isYou
                            ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                            : ranking.rank === 1
                            ? 'border-amber-500/20 bg-amber-500/[0.03]'
                            : 'border-white/5 bg-white/[0.01]'
                        }`}
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === ranking.rank ? null : ranking.rank
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          {/* Rank badge */}
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${
                              ranking.rank === 1
                                ? 'bg-amber-500/20 text-amber-400'
                                : ranking.rank <= 3
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-white/5 text-white/50'
                            }`}
                          >
                            {RankIcon({ rank: ranking.rank }) || (
                              <span>{ranking.rank}</span>
                            )}
                          </div>

                          {/* Domain + badges */}
                          <div className="flex items-center gap-2 min-w-0 flex-shrink-0 w-[140px] sm:w-[180px]">
                            <span
                              className={`text-sm font-medium truncate ${
                                ranking.isYou
                                  ? 'text-emerald-400'
                                  : ranking.rank === 1
                                  ? 'text-amber-400'
                                  : 'text-white/80'
                              }`}
                            >
                              {ranking.domain}
                            </span>
                            {ranking.isYou && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shrink-0 px-1.5 py-0"
                              >
                                YOU
                              </Badge>
                            )}
                            {ranking.rank === 1 && !ranking.isYou && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border-amber-500/30 shrink-0 px-1.5 py-0"
                              >
                                LEADER
                              </Badge>
                            )}
                          </div>

                          {/* Score bar */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`h-2 rounded-full overflow-hidden ${getScoreBarTrackColor(ranking)}`}
                            >
                              <motion.div
                                className={`h-full rounded-full ${getScoreBarColor(ranking)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${ranking.score}%` }}
                                transition={{
                                  duration: 0.8,
                                  ease: 'easeOut',
                                  delay: 0.2 + index * 0.05,
                                }}
                              />
                            </div>
                          </div>

                          {/* Score value */}
                          <span
                            className={`text-sm font-bold tabular-nums shrink-0 w-8 text-right ${
                              ranking.isYou
                                ? 'text-emerald-400'
                                : ranking.rank === 1
                                ? 'text-amber-400'
                                : 'text-white/80'
                            }`}
                          >
                            {ranking.score}
                          </span>

                          {/* Change indicator */}
                          <div className="w-12 shrink-0 text-right">
                            <ChangeIndicator change={ranking.change} />
                          </div>

                          {/* Expand chevron */}
                          <div className="w-4 shrink-0 text-white/20 group-hover:text-white/40 transition-colors">
                            {expandedRow === ranking.rank ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {expandedRow === ranking.rank && (
                            <ExpandedDetails ranking={ranking} maxScore={maxScore} />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}

                  {/* ── Industry Average Reference Line ──────── */}
                  {industryAverage !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.01]"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-xs text-white/40 shrink-0">
                        Avg
                      </div>
                      <span className="text-sm text-white/40 min-w-0 flex-shrink-0 w-[140px] sm:w-[180px]">
                        Industry Average
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="h-2 rounded-full overflow-hidden bg-white/5 relative">
                          <motion.div
                            className="h-full rounded-full bg-white/15"
                            initial={{ width: 0 }}
                            animate={{ width: `${industryAverage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
                          />
                          <div
                            className="absolute top-0 h-full w-px bg-white/40"
                            style={{ left: `${industryAverage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white/40 tabular-nums shrink-0 w-8 text-right">
                        {industryAverage}
                      </span>
                      <div className="w-12 shrink-0" />
                      <div className="w-4 shrink-0" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* ── Overtake Opportunity Card ─────────────── */}
              {yourRanking && yourRanking.rank > 1 && nextRankAbove && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.04]"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/80">
                          Overtake Opportunity
                        </p>
                        <p className="text-xs text-white/50">
                          <span className="text-purple-400 font-bold">{gapToNext}</span> points
                          behind{' '}
                          <span className="text-white/70 font-medium">
                            {nextRankAbove.domain}
                          </span>{' '}
                          (#{nextRankAbove.rank})
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-xs font-semibold"
                    >
                      <Target className="w-3 h-3 mr-1.5" />
                      Take the Lead
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Data Source Badge ──────────────────────── */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {data._meta.source === 'database' && (
                    <span className="text-[10px] text-white/20">Source: Live database</span>
                  )}
                  {data._meta.source === 'partial' && (
                    <span className="text-[10px] text-amber-400/60">Source: Partial data</span>
                  )}
                  {data._meta.source === 'mock' && (
                    <span className="text-[10px] text-white/20">Source: Simulation</span>
                  )}
                </div>
                {industry && (
                  <span className="text-[10px] text-white/20">
                    Industry: {industry}
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* Refreshing overlay indicator */}
          {refreshing && data && (
            <div className="flex items-center gap-2 pt-2">
              <RefreshCw className="w-3 h-3 animate-spin text-white/30" />
              <span className="text-[10px] text-white/30">Refreshing data…</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </motion.div>
  )
}
