'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Globe,
  Search,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'

interface UsageData {
  tier: string
  subscriptionStatus: string
  domains: { used: number; limit: number }
  audits: { used: number; limit: number }
  trackedQueries: { used: number; limit: number }
  monthlySpend: { used: number; cap: number; percentUsed: number }
  agentsEnabled: string[]
  allowWhiteLabel: boolean
  prioritySupport: boolean
  apiAccess: boolean
}

interface UsageIndicatorProps {
  userId?: string
  onUpgrade?: () => void
}

const TIER_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free_trial: { label: 'Free Trial', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' },
  starter: { label: 'Starter', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  pro: { label: 'Pro Agency', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  managed: { label: 'Managed', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
}

function UsageBar({ used, limit, color = 'emerald' }: { used: number; limit: number; color?: string }) {
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const isWarning = percent >= 80
  const isCritical = percent >= 100

  const barColor = isCritical
    ? 'bg-rose-500'
    : isWarning
      ? 'bg-amber-500'
      : color === 'emerald'
        ? 'bg-emerald-500'
        : color === 'amber'
          ? 'bg-amber-500'
          : 'bg-cyan-500'

  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${barColor}`}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function UsageIndicator({ userId, onUpgrade }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return

    const fetchUsage = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/limits?userId=${encodeURIComponent(userId)}`)
        if (!res.ok) throw new Error('Failed to fetch usage')
        const data = await res.json()
        setUsage(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()
    // Refresh every 60 seconds
    const interval = setInterval(fetchUsage, 60000)
    return () => clearInterval(interval)
  }, [userId])

  if (!userId) {
    // Anonymous user — show free trial limits
    return (
      <div className="p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-foreground">Free Scanner</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Sign up for a free trial to unlock all 8 AI agents with full analysis.
        </p>
        <Button
          size="sm"
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs"
          onClick={onUpgrade}
        >
          Start Free Trial
          <ArrowUpRight className="ml-1 w-3 h-3" />
        </Button>
      </div>
    )
  }

  if (isLoading && !usage) {
    return (
      <div className="p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !usage) {
    return null
  }

  const tierStyle = TIER_LABELS[usage.tier] || TIER_LABELS.free_trial
  const isNearLimit = usage.audits.limit > 0 && (usage.audits.used / usage.audits.limit) >= 0.8
  const isOverCostCap = usage.monthlySpend.percentUsed >= 100

  return (
    <div className="p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl">
      {/* Tier Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${tierStyle.border} ${tierStyle.color} ${tierStyle.bg} text-xs`}
          >
            {tierStyle.label}
          </Badge>
          {usage.subscriptionStatus === 'active' && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {usage.subscriptionStatus === 'past_due' && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
        </div>
        {(usage.tier === 'free_trial' || usage.tier === 'starter') && onUpgrade && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-400 hover:text-amber-300 h-6 px-2"
            onClick={onUpgrade}
          >
            Upgrade
            <ArrowUpRight className="ml-1 w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Usage Stats */}
      <div className="space-y-3">
        {/* Domains */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Domains</span>
            </div>
            <span className="text-xs font-medium text-foreground">
              {usage.domains.used}/{usage.domains.limit >= 999 ? '∞' : usage.domains.limit}
            </span>
          </div>
          <UsageBar used={usage.domains.used} limit={usage.domains.limit} color="emerald" />
        </div>

        {/* Audits */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Audits this month</span>
            </div>
            <span className="text-xs font-medium text-foreground">
              {usage.audits.used}/{usage.audits.limit >= 9999 ? '∞' : usage.audits.limit}
            </span>
          </div>
          <UsageBar used={usage.audits.used} limit={usage.audits.limit} color="cyan" />
        </div>

        {/* Monthly Spend */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`w-3 h-3 ${isOverCostCap ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="text-xs text-muted-foreground">Processing budget</span>
            </div>
            <span className={`text-xs font-medium ${isOverCostCap ? 'text-rose-400' : 'text-foreground'}`}>
              ${usage.monthlySpend.used.toFixed(2)}/${usage.monthlySpend.cap.toFixed(0)}
            </span>
          </div>
          <UsageBar used={usage.monthlySpend.percentUsed} limit={100} color="amber" />
          {isOverCostCap && (
            <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
              <XCircle className="w-2.5 h-2.5" />
              Limit reached — upgrade for more
            </p>
          )}
        </div>

        {/* Agents */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-muted-foreground">AI Agents</span>
          </div>
          <span className="text-xs font-medium text-foreground">
            {usage.agentsEnabled.length === 8 ? 'All 8' : `${usage.agentsEnabled.length}/8`}
          </span>
        </div>
      </div>

      {/* Warning Banner */}
      <AnimatePresence>
        {(isNearLimit || isOverCostCap) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-400">
                  {isOverCostCap
                    ? 'Processing limit reached'
                    : 'Approaching plan limit'}
                </p>
                <p className="text-[10px] text-amber-300/70 mt-0.5">
                  {isOverCostCap
                    ? 'Upgrade to Pro for higher processing limits.'
                    : `${Math.round(usage.audits.used / usage.audits.limit * 100)}% of monthly audits used.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
