'use client'

import { useEffect, useState } from 'react'
import {
  Activity, Bell, Clock, Flame, Inbox, Lock, Mail, Trophy, Zap,
  AlertTriangle, Target, Calendar, Star, Sparkles,
} from 'lucide-react'

// ── API Types ────────────────────────────────────────────────

interface EngagementMomentum {
  id: string
  domain: string
  momentumScore: number
  previousScore: number
  delta: number
  createdAt: string
}

interface EngagementBrief {
  id: string
  domain: string
  briefDate: string
  headline1: string
  headline2: string | null
  headline3: string | null
  greeting: string | null
  estimatedMinutes: number | null
  aiVisibilityDelta: number | null
  newOpportunities: number | null
  unreadInbox: number | null
  isRead: boolean | null
  createdAt: string
}

interface EngagementMissionStep {
  id: string
  stepOrder: number
  title: string
  rewardText: string | null
  isCompleted: boolean
}

interface EngagementMission {
  id: string
  domain: string
  missionDate: string
  title: string
  difficulty: string | null
  rewardVisibility: number | null
  totalSteps: number | null
  completedSteps: number | null
  status: string
  steps?: EngagementMissionStep[]
  createdAt: string
}

interface EngagementStreak {
  id: string
  domain: string
  currentStreak: number
  bestStreak: number
  lastImprovedAt: string | null
  streakType: string | null
  createdAt: string
}

interface EngagementActivitySummary {
  id: string
  domain: string
  summaryDate: string
  opportunitiesFound: number
  pagesImproved: number
  competitorsDropped: number
  signalsDetected: number
  articlesPublished: number
  createdAt: string
}

interface EngagementCountdown {
  id: string
  domain: string
  countdownType: string
  label: string
  targetTime: string
  isCompleted: boolean
}

interface EngagementMysteryBox {
  id: string
  domain: string
  revealDate: string
  teaserText: string
  revealedText: string | null
  isRevealed: boolean
  category: string | null
  createdAt: string
}

interface EngagementCoach {
  id: string
  domain: string
  coachDate: string
  greeting: string | null
  message: string | null
  recommendedAction: string | null
  estimatedMinutes: number | null
  estimatedImpact: string | null
  isCompleted: boolean
  createdAt: string
}

interface EngagementSeason {
  id: string
  domain: string
  seasonName: string
  challenge: string | null
  startDate: string
  endDate: string
  status: string
  createdAt: string
}

interface EngagementWeeklyMission {
  id: string
  domain: string
  title: string
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  status: string
  weekStart: string
  rewardType: string | null
  createdAt: string
}

interface EngagementData {
  momentum: EngagementMomentum | null
  brief: EngagementBrief | null | undefined
  activeMission: EngagementMission | null | undefined
  streak: EngagementStreak | null
  activitySummary: EngagementActivitySummary | null | undefined
  inboxCount: number | undefined
  countdowns: EngagementCountdown[] | undefined
  mysteryBox: EngagementMysteryBox | null | undefined
  coach: EngagementCoach | null | undefined
  season: EngagementSeason | null | undefined
  weeklyMission: EngagementWeeklyMission | null | undefined
}

// ── Component ────────────────────────────────────────────────

export default function EngagementPage() {
  const [data, setData] = useState<EngagementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (!res.ok) throw new Error('Failed to fetch control data')
        const json = await res.json()
        setData(json.engagement ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-slate-800 rounded h-8 w-64" />
        <div className="animate-pulse bg-slate-800 rounded-xl h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-28" />
          ))}
        </div>
        <div className="animate-pulse bg-slate-800 rounded-xl h-64" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Failed to load engagement data</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  // Safe accessors with defaults
  const countdowns = data.countdowns ?? []
  const inboxCount = data.inboxCount ?? 0
  const brief = data.brief ?? null
  const mysteryBox = data.mysteryBox ?? null
  const coach = data.coach ?? null
  const season = data.season ?? null
  const weeklyMission = data.weeklyMission ?? null
  const activitySummary = data.activitySummary ?? null
  const missionSteps = data.activeMission?.steps ?? []

  // Derive section data from API response
  const momentumScore = data.momentum?.momentumScore ?? 0
  const momentumDelta = data.momentum?.previousScore
    ? momentumScore - (data.momentum?.previousScore ?? 0)
    : 0
  const currentStreak = data.streak?.currentStreak ?? 0

  // Brief headline: use headline1 as the primary headline
  const briefHeadline = brief?.headline1 || brief?.greeting || null

  const sections = [
    { name: 'Daily Brief', icon: Mail, description: briefHeadline || 'No brief today', status: brief ? 'active' : 'idle', items: brief ? 1 : 0 },
    { name: 'Missions', icon: Zap, description: data.activeMission ? data.activeMission.title : 'No active mission', status: data.activeMission ? 'active' : 'idle', items: data.activeMission ? 1 : 0 },
    { name: 'Momentum', icon: Flame, description: `${Math.round(momentumScore)}%${momentumDelta > 0 ? ` — +${Math.round(momentumDelta)} from yesterday` : ''}`, status: momentumScore > 0 ? 'active' : 'idle', items: 0 },
    { name: 'Streak', icon: Trophy, description: currentStreak > 0 ? `${currentStreak} day${currentStreak !== 1 ? 's' : ''} improving` : 'No streak', status: currentStreak > 0 ? 'active' : 'idle', items: 0 },
    { name: 'Inbox', icon: Inbox, description: `${inboxCount} unread notification${inboxCount !== 1 ? 's' : ''}`, status: inboxCount > 0 ? 'active' : 'idle', items: inboxCount },
    { name: 'Countdowns', icon: Clock, description: `${countdowns.length} active countdown${countdowns.length !== 1 ? 's' : ''}`, status: countdowns.length > 0 ? 'active' : 'idle', items: countdowns.length },
    { name: 'Mystery Box', icon: Lock, description: mysteryBox ? (mysteryBox.teaserText || 'Vault item') : 'No mystery box', status: mysteryBox ? 'active' : 'idle', items: mysteryBox ? 1 : 0 },
    { name: 'Notifications', icon: Bell, description: `${inboxCount} unread`, status: inboxCount > 0 ? 'active' : 'idle', items: inboxCount },
  ]

  // Compute remaining time for a countdown
  function getRemainingHuman(targetTime: string): string {
    const diff = new Date(targetTime).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          Engagement Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">User momentum, daily habits, and retention signals</p>
      </div>

      {/* Momentum Score */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Momentum</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-emerald-400">{Math.round(momentumScore)}%</span>
              {momentumDelta !== 0 && (
                <span className={`text-sm ${momentumDelta > 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                  {momentumDelta > 0 ? '+' : ''}{Math.round(momentumDelta)} from yesterday
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">Active Streak</div>
            <div className="text-2xl font-bold text-amber-400">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Coach Tip */}
      {coach && (coach.message || coach.recommendedAction) && (
        <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">AI Coach</div>
              {coach.message && <div className="text-sm text-slate-300">{coach.message}</div>}
              {coach.recommendedAction && <div className="text-xs text-slate-500 mt-1">{coach.recommendedAction}</div>}
              {coach.estimatedImpact && <div className="text-[10px] text-cyan-400/60 mt-1">Impact: {coach.estimatedImpact}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Engagement Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.name} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${section.status === 'active' ? 'text-emerald-400' : 'text-slate-600'}`} />
                {section.items > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{section.items}</span>
                )}
              </div>
              <div className="text-sm font-semibold text-white">{section.name}</div>
              <div className="text-xs text-slate-500 mt-1">{section.description}</div>
            </div>
          )
        })}
      </div>

      {/* Active Mission */}
      {data.activeMission && (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Active Mission
          </h2>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{data.activeMission.title}</div>
              {data.activeMission.difficulty && (
                <div className="text-xs text-slate-400 mt-1">Difficulty: {data.activeMission.difficulty}</div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                  {data.activeMission.status}
                </span>
                {data.activeMission.rewardVisibility != null && (
                  <span className="text-[10px] text-amber-400">+{data.activeMission.rewardVisibility} AI Visibility</span>
                )}
              </div>
            </div>
          </div>
          {missionSteps.length > 0 && (
            <div className="space-y-2 ml-11">
              {missionSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.isCompleted ? 'bg-emerald-500/20' : 'bg-slate-700'
                  }`}>
                    {step.isCompleted && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                  <span className={`text-xs ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                    {step.title}
                  </span>
                  {step.rewardText && (
                    <span className="text-[10px] text-amber-400 ml-auto">{step.rewardText}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Countdowns */}
      {countdowns.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Active Countdowns
          </h2>
          <div className="space-y-3">
            {countdowns.map((countdown) => (
              <div key={countdown.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-300">{countdown.label || countdown.countdownType}</span>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  {getRemainingHuman(countdown.targetTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season / Weekly Mission */}
      {(season || weeklyMission) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {season && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Current Season
              </h2>
              <div className="text-lg font-bold text-amber-400">{season.seasonName}</div>
              {season.challenge && (
                <div className="text-xs text-slate-400 mt-1">{season.challenge}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  season.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {season.status}
                </span>
              </div>
            </div>
          )}
          {weeklyMission && (
            <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Weekly Mission
              </h2>
              <div className="text-sm font-medium text-white">{weeklyMission.title}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {weeklyMission.status}
                </span>
                {weeklyMission.rewardType && (
                  <span className="text-[10px] text-amber-400">{weeklyMission.rewardType}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Summary */}
      {activitySummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Today&apos;s Activity
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{activitySummary.opportunitiesFound}</div>
              <div className="text-[10px] text-slate-500 uppercase">Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{activitySummary.pagesImproved}</div>
              <div className="text-[10px] text-slate-500 uppercase">Improved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{activitySummary.competitorsDropped}</div>
              <div className="text-[10px] text-slate-500 uppercase">Competitors Dropped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{activitySummary.signalsDetected}</div>
              <div className="text-[10px] text-slate-500 uppercase">Signals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{activitySummary.articlesPublished}</div>
              <div className="text-[10px] text-slate-500 uppercase">Published</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no data at all */}
      {!data.momentum && !brief && !data.activeMission && !data.streak && inboxCount === 0 && countdowns.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No engagement data yet</h3>
          <p className="text-xs text-slate-500 mt-1">Engagement data will appear as you use the platform and complete missions.</p>
        </div>
      )}
    </div>
  )
}
