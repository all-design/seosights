'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EngagementSidebar, { MobileMenuButton } from './EngagementSidebar'
import MomentumWidget from './MomentumWidget'
import AIWorkingBanner from './AIWorkingBanner'
import DailyBrief from './DailyBrief'
import DailyMissions from './DailyMissions'
import AIStreak from './AIStreak'
import WaitingMechanic from './WaitingMechanic'
import MysteryBox from './MysteryBox'
import AIInbox from './AIInbox'
import PredictionGame from './PredictionGame'
import ObservatoryDrops from './ObservatoryDrops'
import WeeklyBoss from './WeeklyBoss'
import AICoach from './AICoach'
import AISeason from './AISeason'
import Leaderboards from './Leaderboards'
import AIVault from './AIVault'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  momentum: {
    momentumScore: number
    previousScore: number
    daysActive: number
    bestStreak: number
  } | null
  activitySummary: {
    opportunitiesFound: number
    pagesImproved: number
    competitorsDropped: number
    signalsDetected: number
    learningConfidenceDelta: number
    decisionsWaiting: number
  } | null
  brief: Record<string, unknown> | null
  activeMission: Record<string, unknown> | null
  streak: Record<string, unknown> | null
  unreadInboxCount: number
  countdowns: unknown[]
  mysteryBox: Record<string, unknown> | null
  coach: Record<string, unknown> | null
  season: Record<string, unknown> | null
  weeklyMission: Record<string, unknown> | null
}

export default function EngagementShell() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/engagement/dashboard')
      const data = await res.json()
      setDashboardData(data)
      return data
    } catch {
      return null
    }
  }

  const seedData = async () => {
    setSeeding(true)
    try {
      await fetch('/api/engagement/seed', { method: 'POST' })
      await fetchData()
    } catch {
      // Silently fail
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const data = await fetchData()
      // If no momentum data, seed demo data
      if (data && !data.momentum) {
        await seedData()
      } else {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (dashboardData) {
      setLoading(false)
    }
  }, [dashboardData])

  const unreadCount = dashboardData?.unreadInboxCount ?? 0

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <MomentumWidget momentum={dashboardData?.momentum ?? null} />
            <AIWorkingBanner activity={dashboardData?.activitySummary ?? null} />

            {/* Quick overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.brief && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase mb-1">Today&apos;s Brief</p>
                  <p className="text-sm text-slate-200 line-clamp-2">
                    {(dashboardData.brief.headline1 as string) || 'No brief yet'}
                  </p>
                </div>
              )}
              {dashboardData?.streak && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase mb-1">Current Streak</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {(dashboardData.streak.currentStreak as number) || 0}{' '}
                    <span className="text-sm text-slate-500">days</span>
                  </p>
                </div>
              )}
              {dashboardData?.weeklyMission && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase mb-1">Weekly Mission</p>
                  <p className="text-sm text-slate-200">
                    {(dashboardData.weeklyMission.currentValue as number) ?? 0} /{' '}
                    {(dashboardData.weeklyMission.targetValue as number) ?? 0} AI Visibility
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      case 'brief':
        return <DailyBrief />
      case 'missions':
        return <DailyMissions />
      case 'streak':
        return <AIStreak />
      case 'inbox':
        return <AIInbox />
      case 'countdowns':
        return <WaitingMechanic />
      case 'mystery-box':
        return <MysteryBox />
      case 'predictions':
        return <PredictionGame />
      case 'drops':
        return <ObservatoryDrops />
      case 'weekly-mission':
        return <WeeklyBoss />
      case 'coach':
        return <AICoach />
      case 'season':
        return <AISeason />
      case 'leaderboard':
        return <Leaderboards />
      case 'vault':
        return <AIVault />
      case 'momentum':
        return <MomentumWidget momentum={dashboardData?.momentum ?? null} />
      case 'activity':
        return <AIWorkingBanner activity={dashboardData?.activitySummary ?? null} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-800 p-6">
          <div className="w-full space-y-3">
            <Skeleton className="h-8 w-32 bg-slate-800" />
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full bg-slate-800" />
            ))}
          </div>
        </div>
        {/* Main skeleton */}
        <div className="flex-1 lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full bg-slate-900 rounded-xl" />
            <Skeleton className="h-36 w-full bg-slate-900 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <EngagementSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        unreadCount={unreadCount}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3 lg:hidden">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <h1 className="text-sm font-bold text-slate-200">
            <span className="text-emerald-500">Momentum</span>™
          </h1>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
