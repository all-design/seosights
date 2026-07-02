'use client'

/**
 * Client Zero Content Engine™ — Container with Sub-Navigation
 *
 * The Client Zero tab is a multi-section Content Operating System
 * with 9 sub-tabs for the full content lifecycle.
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Rocket,
  CalendarDays,
  ListOrdered,
  PenTool,
  ShieldCheck,
  Play,
  RotateCcw,
  TrendingUp,
  FlaskConical,
  RefreshCw,
  Loader2,
} from 'lucide-react'

import MissionControl from './MissionControl'
import EditorialCalendar from './EditorialCalendar'
import ContentQueue from './ContentQueue'
import AIWriter from './AIWriter'
import ReviewPipeline from './ReviewPipeline'
import AutoExecute from './AutoExecute'
import ContentReplay from './ContentReplay'
import ContentROI from './ContentROI'
import ContentLab from './ContentLab'

// ── Sub-Tab Config ──────────────────────────────────────────────────────

const SUB_TABS = [
  { value: 'mission', label: 'Mission Control', icon: Rocket },
  { value: 'calendar', label: 'Calendar', icon: CalendarDays },
  { value: 'queue', label: 'Queue', icon: ListOrdered },
  { value: 'writer', label: 'Writer', icon: PenTool },
  { value: 'reviews', label: 'Reviews', icon: ShieldCheck },
  { value: 'execute', label: 'Execute', icon: Play },
  { value: 'replay', label: 'Replay', icon: RotateCcw },
  { value: 'roi', label: 'ROI', icon: TrendingUp },
  { value: 'lab', label: 'Lab', icon: FlaskConical },
] as const

type SubTab = (typeof SUB_TABS)[number]['value']

// ── Component ───────────────────────────────────────────────────────────

export default function ClientZeroDashboard() {
  const [activeTab, setActiveTab] = useState<SubTab>('mission')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setRefreshKey((k) => k + 1)
    setTimeout(() => setIsRefreshing(false), 800)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">
            Client Zero Content Engine™
          </h2>
          <Badge
            variant="outline"
            className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 animate-pulse"
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            LIVE
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* ── Sub-Navigation Tabs ─────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SubTab)}>
        <TabsList className="bg-card/80 backdrop-blur-sm border border-white/10 w-full justify-start overflow-x-auto h-auto p-1 gap-0.5">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm flex-shrink-0"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <TabsContent value="mission" className="mt-4">
            <MissionControl key={`mission-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <EditorialCalendar key={`calendar-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="queue" className="mt-4">
            <ContentQueue key={`queue-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="writer" className="mt-4">
            <AIWriter key={`writer-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <ReviewPipeline key={`reviews-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="execute" className="mt-4">
            <AutoExecute key={`execute-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="replay" className="mt-4">
            <ContentReplay key={`replay-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="roi" className="mt-4">
            <ContentROI key={`roi-${refreshKey}`} />
          </TabsContent>
          <TabsContent value="lab" className="mt-4">
            <ContentLab key={`lab-${refreshKey}`} />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  )
}
