'use client'

import { useEffect, useState, useCallback } from 'react'
import { useOpsStore } from '@/lib/ops-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Menu, Radar, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeartbeatData {
  overallStatus: string
  timestamp: string
}

interface AutonomyData {
  today: {
    autonomyPercentage: number
  }
}

export function OpsHeader() {
  const { toggleSidebar } = useOpsStore()
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null)
  const [autonomy, setAutonomy] = useState<AutonomyData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [hbRes, autoRes] = await Promise.all([
        fetch('/api/ops/heartbeat'),
        fetch('/api/ops/autonomy'),
      ])
      if (hbRes.ok) {
        const hbData = await hbRes.json()
        setHeartbeat(hbData)
      }
      if (autoRes.ok) {
        const autoData = await autoRes.json()
        setAutonomy(autoData)
      }
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      // silently fail
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData().finally(() => {
      setTimeout(() => setRefreshing(false), 600)
    })
  }

  useEffect(() => {
    // Auto-refresh heartbeat every 30s
    const hbInterval = setInterval(() => { fetchData() }, 30000)
    // Initial fetch via microtask to avoid synchronous setState in effect
    queueMicrotask(() => { fetchData() })
    return () => { clearInterval(hbInterval) }
  }, [fetchData])

  const statusColor = heartbeat?.overallStatus === 'healthy'
    ? 'bg-emerald-500'
    : heartbeat?.overallStatus === 'degraded'
      ? 'bg-yellow-500'
      : heartbeat?.overallStatus === 'critical'
        ? 'bg-red-500'
        : 'bg-gray-500'

  const statusLabel = heartbeat?.overallStatus === 'healthy'
    ? 'Healthy'
    : heartbeat?.overallStatus === 'degraded'
      ? 'Degraded'
      : heartbeat?.overallStatus === 'critical'
        ? 'Critical'
        : 'Unknown'

  const statusTextColor = heartbeat?.overallStatus === 'healthy'
    ? 'text-emerald-400'
    : heartbeat?.overallStatus === 'degraded'
      ? 'text-yellow-400'
      : heartbeat?.overallStatus === 'critical'
        ? 'text-red-400'
        : 'text-gray-400'

  return (
    <header className="sticky top-0 z-30 bg-[#0d1321]/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-emerald-400 hidden sm:block" />
            <h1 className="text-base font-bold text-white">
              AI Operations Center™
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* AI Heartbeat */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">AI Heartbeat™</span>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={cn_statusDot(statusColor)}
              />
              <span className={cn('text-xs font-medium', statusTextColor)}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Platform Autonomy */}
          {autonomy && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold"
            >
              Platform Autonomy™ {autonomy.today.autonomyPercentage}%
            </Badge>
          )}

          {/* Last updated */}
          <span className="text-[10px] text-gray-600 hidden md:inline">
            {lastUpdated ? `Updated ${lastUpdated}` : 'Loading...'}
          </span>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-white hover:bg-gray-800"
            onClick={handleRefresh}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </header>
  )
}

function cn_statusDot(colorClass: string): string {
  return `h-2.5 w-2.5 rounded-full ${colorClass} shadow-lg shadow-current/20`
}

function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}
