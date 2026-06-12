'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Link2,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle2,
  Loader2,
  Gift,
  Star,
  Zap,
  Crown,
  Rocket,
  ArrowUpRight,
  Wallet,
  MousePointerClick,
  UserPlus,
} from 'lucide-react'

interface AffiliatePortalProps {
  userId: string
  onClose?: () => void
}

interface AffiliateData {
  isAffiliate: boolean
  affiliateCode?: string
  referralLink?: string
  totalReferredActive?: number
  totalRegistered?: number
  totalEarningsUsd?: number
  pendingPayoutUsd?: number
  totalPaidOutUsd?: number
  monthlyEarningsUsd?: number
  currentCommissionPercentage?: number
  currentTierLabel?: string
  nextTier?: {
    minReferrals: number
    percentage: number
    label: string
  } | null
  referralsToNextTier?: number
  recentPayouts?: {
    id: string
    amountUsd: number
    percentageApplied: number
    sourceAmountUsd: number
    status: string
    createdAt: string
  }[]
  recentReferrals?: {
    id: string
    status: string
    createdAt: string
    firstPaymentAt: string | null
  }[]
}

// Commission tiers for the visual display
const TIERS = [
  { minReferrals: 250, percentage: 50, label: 'Legend', icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { minReferrals: 100, percentage: 40, label: 'Superstar', icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { minReferrals: 50, percentage: 30, label: 'Pro', icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { minReferrals: 10, percentage: 20, label: 'Rising Star', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { minReferrals: 0, percentage: 10, label: 'Starter', icon: Gift, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
]

// Chart config for recharts via shadcn/ui ChartContainer
const chartConfig = {
  clicks: {
    label: 'Link Clicks',
    color: 'hsl(262, 83%, 58%)', // purple-500
  },
  registrations: {
    label: 'Registrations',
    color: 'hsl(280, 84%, 60%)', // violet-500
  },
} satisfies ChartConfig

// Status color mapping for referral table
const statusStyles: Record<string, string> = {
  Active: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  Trial: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  Churned: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
}

export default function AffiliatePortal({ userId, onClose }: AffiliatePortalProps) {
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [preferredCode, setPreferredCode] = useState('')
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/affiliate/stats?userId=${userId}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userId])

  // Generate 30 days of mock chart data
  const chartData = useMemo(() => {
    const days: { date: string; clicks: number; registrations: number }[] = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      // Seeded pseudo-random based on day offset for consistent demo data
      const seed1 = Math.sin(i * 9.1 + 3.7) * 10000
      const seed2 = Math.sin(i * 7.3 + 1.2) * 10000
      const clicks = Math.floor(20 + (Math.abs(seed1) % 80))
      const registrations = Math.floor(1 + (Math.abs(seed2) % 9))
      days.push({ date: label, clicks, registrations })
    }
    return days
  }, [])

  // Generate mock anonymized referral data
  const referralTableData = useMemo(() => {
    const packages = [
      { name: 'Pro ($79)', earning: '$15.80/mo' },
      { name: 'Starter ($29)', earning: '$5.80/mo' },
      { name: 'Pro ($79)', earning: '$15.80/mo' },
      { name: 'Managed ($299)', earning: '$59.80/mo' },
      { name: 'Starter ($29)', earning: '$5.80/mo' },
      { name: 'Pro ($79)', earning: '$15.80/mo' },
      { name: 'Pro ($79)', earning: '$15.80/mo' },
      { name: 'Starter ($29)', earning: '$2.90/mo' },
      { name: 'Managed ($299)', earning: '$89.70/mo' },
      { name: 'Pro ($79)', earning: '$15.80/mo' },
      { name: 'Starter ($29)', earning: '$5.80/mo' },
      { name: 'Pro ($79)', earning: '$31.60/mo' },
    ]
    const statuses: ('Active' | 'Trial' | 'Churned')[] = [
      'Active', 'Active', 'Churned', 'Active', 'Trial',
      'Active', 'Active', 'Churned', 'Active', 'Trial',
      'Active', 'Active',
    ]
    const ids = [
      'user_***41', 'user_***23', 'user_***67', 'user_***89', 'user_***12',
      'user_***55', 'user_***33', 'user_***78', 'user_***02', 'user_***94',
      'user_***61', 'user_***47',
    ]
    return ids.map((id, i) => ({
      id,
      package: packages[i].name,
      earning: packages[i].earning,
      status: statuses[i],
    }))
  }, [])

  const handleRegister = async () => {
    setRegistering(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferredCode: preferredCode || undefined }),
      })

      if (res.ok) {
        await fetchData()
      } else {
        const err = await res.json()
        setError(err.error || 'Registration failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setRegistering(false)
    }
  }

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-3 text-muted-foreground">Loading affiliate portal...</span>
      </div>
    )
  }

  // ── NOT YET AN AFFILIATE: Show Registration ──
  if (!data?.isAffiliate) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Link2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Become an Affiliate</h2>
            <p className="text-sm text-muted-foreground">Earn up to 50% commission by referring users</p>
          </div>
        </div>

        {/* Commission Tiers Preview */}
        <Card className="bg-gradient-to-br from-purple-500/5 via-background to-amber-500/5 border-purple-500/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">Commission Scale</h3>
            <div className="space-y-3">
              {TIERS.map((tier) => (
                <div key={tier.minReferrals} className={`flex items-center justify-between p-3 rounded-lg border ${tier.bg}`}>
                  <div className="flex items-center gap-3">
                    <tier.icon className={`w-5 h-5 ${tier.color}`} />
                    <div>
                      <span className="text-sm font-semibold">{tier.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{tier.minReferrals}+ referrals</span>
                    </div>
                  </div>
                  <span className={`text-lg font-black ${tier.color}`}>{tier.percentage}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              250+ Pro referrals at $79/mo = <span className="text-purple-400 font-bold">$9,875/mo</span> passive income
            </p>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Choose Your Affiliate Code</label>
            <div className="flex gap-2">
              <Input
                value={preferredCode}
                onChange={(e) => setPreferredCode(e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20))}
                placeholder="e.g. marko10 or seomaster"
                className="bg-white/5 border-white/10 focus:border-purple-500/50 font-mono"
                maxLength={20}
              />
              <Button
                onClick={handleRegister}
                disabled={registering}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6"
              >
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Now'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your link will be: seosights.com/?ref={preferredCode || 'yourcode'}
            </p>
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  // ── ACTIVE AFFILIATE: Show Enhanced Dashboard ──
  const currentTierInfo = TIERS.find(t => t.percentage === Math.round((data.currentCommissionPercentage || 0.10) * 100)) || TIERS[TIERS.length - 1]
  const TierIcon = currentTierInfo.icon
  const referralLink = data.referralLink || `https://seosights.com/?ref=${data.affiliateCode}`
  const activeReferrals = data.totalReferredActive || 0
  const monthlyEarnings = data.monthlyEarningsUsd ?? data.totalEarningsUsd ?? 0
  const totalPaidOut = data.totalPaidOutUsd ?? data.pendingPayoutUsd ?? 0
  const commissionPct = Math.round((data.currentCommissionPercentage || 0.10) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <TierIcon className={`w-6 h-6 ${currentTierInfo.color}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Affiliate Portal</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className={`text-[10px] ${currentTierInfo.bg} ${currentTierInfo.color}`}>
                {currentTierInfo.label} — {data.currentTierLabel}
              </Badge>
            </div>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        )}
      </div>

      {/* ── 3.1 Copy Link Box (Full Width, Prominent) ── */}
      <Card className="bg-gradient-to-r from-purple-600/10 via-violet-500/5 to-indigo-600/10 border-purple-500/30">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-300">Your Referral Link</span>
            <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400 ml-auto">
              60-day cookie
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/30 border border-purple-500/20 rounded-lg px-4 py-3 font-mono text-sm text-foreground truncate">
              {referralLink}
            </div>
            <Button
              onClick={() => copyToClipboard(referralLink, 'link')}
              className={`font-semibold shrink-0 transition-all ${
                copied === 'link'
                  ? 'bg-emerald-500 hover:bg-emerald-500 text-black'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {copied === 'link' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Code:</span>
              <code className="text-xs font-mono bg-black/20 border border-purple-500/10 px-2 py-1 rounded text-purple-300">
                {data.affiliateCode}
              </code>
              <button
                onClick={() => copyToClipboard(data.affiliateCode || '', 'code')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === 'code' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3.1 Main KPI Widgets ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Current Tier Card */}
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Tier</span>
            </div>
            <div className="text-lg font-black text-purple-400">
              Tier {TIERS.indexOf(currentTierInfo) + 1} — {commissionPct}%
            </div>
            {data.nextTier && (
              <div className="mt-2">
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (activeReferrals / data.nextTier.minReferrals) * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  {data.referralsToNextTier} more for {data.nextTier.label} ({data.nextTier.percentage}%)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Referrals Card */}
        <Card className="bg-violet-500/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Referrals</span>
            </div>
            <div className="text-2xl font-black text-violet-400">{activeReferrals}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {data.totalRegistered || 0} total registered
            </p>
          </CardContent>
        </Card>

        {/* Monthly Earnings (MRR) Card */}
        <Card className="bg-indigo-500/5 border-indigo-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Earnings</span>
            </div>
            <div className="text-2xl font-black text-indigo-400">
              ${monthlyEarnings.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">MRR from subscriptions</p>
          </CardContent>
        </Card>

        {/* Total Paid Out Card */}
        <Card className="bg-fuchsia-500/5 border-fuchsia-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-fuchsia-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Paid Out</span>
            </div>
            <div className="text-2xl font-black text-fuchsia-400">
              ${totalPaidOut.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Lifetime payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tier Progress (full width) ── */}
      {data.nextTier && (
        <Card className="bg-gradient-to-r from-purple-500/5 via-background to-violet-500/5 border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400">Next Tier: {data.nextTier.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                You need <span className="font-semibold text-purple-300">{data.referralsToNextTier}</span> more active users for next tier ({data.nextTier.percentage}%)
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (activeReferrals / data.nextTier.minReferrals) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{activeReferrals} active</span>
              <span>{data.nextTier.minReferrals} needed</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 3.2 Click & Registration Chart ── */}
      <Card className="bg-purple-500/[0.03] border-purple-500/15">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold">Link Performance (30 days)</h3>
          </div>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[10px]"
                interval="preserveStartEnd"
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[10px]"
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <ChartLegend
                content={<ChartLegendContent />}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="var(--color-clicks)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="var(--color-registrations)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 3.2 Anonymized Referral Table ── */}
      <Card className="bg-violet-500/[0.03] border-violet-500/15">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold">Referred Users</h3>
            <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-400 ml-auto">
              GDPR-safe
            </Badge>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">User ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Package</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Your Earning</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralTableData.map((row) => (
                  <TableRow key={row.id} className="border-white/5">
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell className="text-xs">{row.package}</TableCell>
                    <TableCell className="text-xs font-semibold text-purple-300">{row.earning}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${statusStyles[row.status] || 'border-white/10 text-muted-foreground'}`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Commission Tiers */}
      <div>
        <h3 className="text-sm font-bold mb-3">Commission Scale</h3>
        <div className="space-y-2">
          {TIERS.map((tier) => {
            const isActive = tier.percentage === commissionPct
            const isUnlocked = activeReferrals >= tier.minReferrals
            return (
              <div
                key={tier.minReferrals}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isActive
                    ? `${tier.bg} ring-1 ring-current`
                    : isUnlocked
                    ? 'bg-white/[0.02] border-white/5'
                    : 'bg-transparent border-white/5 opacity-40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tier.icon className={`w-4 h-4 ${isActive ? tier.color : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-semibold ${isActive ? tier.color : 'text-muted-foreground'}`}>
                    {tier.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({tier.minReferrals}+ referrals)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${isActive ? tier.color : 'text-muted-foreground'}`}>
                    {tier.percentage}%
                  </span>
                  {isActive && <CheckCircle2 className={`w-4 h-4 ${tier.color}`} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Payouts */}
      {data.recentPayouts && data.recentPayouts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3">Recent Commissions</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.recentPayouts.slice(0, 10).map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-semibold">${payout.amountUsd.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {payout.percentageApplied}% of ${payout.sourceAmountUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      payout.status === 'paid'
                        ? 'border-purple-500/30 text-purple-400'
                        : payout.status === 'pending'
                        ? 'border-amber-500/30 text-amber-400'
                        : 'border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {payout.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affiliate How-It-Works */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold mb-3">How It Works</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your unique referral link with your audience' },
              { step: '2', text: 'Visitors click your link — a 60-day cookie tracks them' },
              { step: '3', text: 'When they subscribe, you earn commission on every payment' },
              { step: '4', text: 'More referrals = higher commission tier (up to 50%)' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-purple-400">{item.step}</span>
                </div>
                <span className="text-xs text-muted-foreground pt-1">{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
