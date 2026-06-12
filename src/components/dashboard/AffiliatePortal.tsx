'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Link2,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle2,
  Loader2,
  Gift,
  ArrowUpRight,
  Star,
  Zap,
  Crown,
  Rocket,
  ChevronRight,
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
  { minReferrals: 50, percentage: 30, label: 'Pro', icon: Star, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { minReferrals: 10, percentage: 20, label: 'Rising Star', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { minReferrals: 0, percentage: 10, label: 'Starter', icon: Gift, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
]

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
        await fetchData() // Refresh stats
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
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
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
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Link2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Become an Affiliate</h2>
            <p className="text-sm text-muted-foreground">Earn up to 50% commission by referring users</p>
          </div>
        </div>

        {/* Commission Tiers Preview */}
        <Card className="bg-gradient-to-br from-emerald-500/5 via-background to-amber-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 uppercase tracking-wider">Commission Scale</h3>
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
              250+ Pro referrals at $79/mo = <span className="text-emerald-400 font-bold">$9,875/mo</span> passive income
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
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 font-mono"
                maxLength={20}
              />
              <Button
                onClick={handleRegister}
                disabled={registering}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6"
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

  // ── ACTIVE AFFILIATE: Show Dashboard ──
  const currentTierInfo = TIERS.find(t => t.percentage === Math.round((data.currentCommissionPercentage || 0.10) * 100)) || TIERS[TIERS.length - 1]
  const TierIcon = currentTierInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Referrals</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">{data.totalReferredActive || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Earnings</span>
            </div>
            <div className="text-2xl font-black text-cyan-400">${(data.totalEarningsUsd || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending Payout</span>
            </div>
            <div className="text-2xl font-black text-amber-400">${(data.pendingPayoutUsd || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Commission Rate</span>
            </div>
            <div className="text-2xl font-black text-purple-400">{data.currentTierLabel}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-cyan-500/10 border-emerald-500/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">Your Referral Link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-foreground truncate">
              {data.referralLink || `https://seosights.com/?ref=${data.affiliateCode}`}
            </div>
            <Button
              onClick={() => copyToClipboard(data.referralLink || '', 'link')}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shrink-0"
            >
              {copied === 'link' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Code:</span>
              <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded">{data.affiliateCode}</code>
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

      {/* Next Tier Progress */}
      {data.nextTier && (
        <Card className="bg-gradient-to-r from-amber-500/5 via-background to-purple-500/5 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-amber-400">Next Tier: {data.nextTier.label}</span>
              <span className="text-xs text-muted-foreground">
                {data.referralsToNextTier} more referral{data.referralsToNextTier !== 1 ? 's' : ''} needed
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((data.totalReferredActive || 0) / data.nextTier.minReferrals) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{data.totalReferredActive || 0} active</span>
              <span>{data.nextTier.minReferrals} needed</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Tiers */}
      <div>
        <h3 className="text-sm font-bold mb-3">Commission Scale</h3>
        <div className="space-y-2">
          {TIERS.map((tier) => {
            const isActive = tier.percentage === Math.round((data.currentCommissionPercentage || 0.10) * 100)
            const isUnlocked = (data.totalReferredActive || 0) >= tier.minReferrals
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
                  <DollarSign className="w-4 h-4 text-emerald-400" />
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
                        ? 'border-emerald-500/30 text-emerald-400'
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

      {/* Recent Referrals */}
      {data.recentReferrals && data.recentReferrals.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3">Recent Referrals ({data.totalRegistered || 0} total)</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.recentReferrals.slice(0, 8).map((ref) => (
              <div key={ref.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    ref.status === 'active'
                      ? 'border-emerald-500/30 text-emerald-400'
                      : ref.status === 'registered'
                      ? 'border-amber-500/30 text-amber-400'
                      : 'border-rose-500/30 text-rose-400'
                  }`}
                >
                  {ref.status}
                </Badge>
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
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400">{item.step}</span>
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
