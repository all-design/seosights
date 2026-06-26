'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  DollarSign,
  Cookie,
  Calendar,
  TrendingUp,
  Users,
  Crown,
  Zap,
  Star,
  Gift,
} from 'lucide-react'

// Compact tier ladder preview
const tierPreview = [
  { name: 'Starter', commission: 10, icon: Gift, color: 'text-slate-400' },
  { name: 'Growth', commission: 20, icon: Zap, color: 'text-emerald-400' },
  { name: 'Pro', commission: 30, icon: Star, color: 'text-cyan-400' },
  { name: 'Elite', commission: 40, icon: TrendingUp, color: 'text-purple-400' },
  { name: 'VIP', commission: 50, icon: Crown, color: 'text-amber-400' },
]

const quickStats = [
  { icon: DollarSign, label: 'Max Commission', value: '50%', color: 'text-amber-400' },
  { icon: Cookie, label: 'Cookie Window', value: '60 days', color: 'text-cyan-400' },
  { icon: Calendar, label: 'Payouts', value: 'Monthly', color: 'text-emerald-400' },
  { icon: Users, label: 'Active Affiliates', value: '500+', color: 'text-purple-400' },
]

export default function AffiliateCTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="affiliate" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-background to-amber-500/10 backdrop-blur-sm">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/15 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/15 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3" />

            <CardContent className="relative pt-10 pb-10 px-6 sm:px-10 lg:px-14">
              {/* Header */}
              <div className="text-center mb-10">
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Affiliate Program — Up to 50% Recurring
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
                  Earn Up to{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                    50% Recurring Commission
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Promote the Operating System for AI Search. 5-tier scale, 60-day cookie,
                  monthly payouts. No fees, no minimums.
                </p>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
                {quickStats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        {stat.label}
                      </p>
                      <p className="text-sm sm:text-base font-bold">{stat.value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Tier ladder preview */}
              <div className="mb-8 max-w-4xl mx-auto">
                <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  5-Tier Commission Scale
                </p>
                <div className="flex items-end justify-between gap-2 sm:gap-3">
                  {tierPreview.map((tier, i) => {
                    const Icon = tier.icon
                    const heightClass = `h-${8 + i * 3}`
                    return (
                      <div
                        key={tier.name}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div
                          className={`w-full ${heightClass} sm:h-${10 + i * 4} rounded-t-lg bg-gradient-to-t from-purple-500/20 to-amber-500/20 border border-purple-500/20 flex items-start justify-center pt-2`}
                          style={{ minHeight: `${30 + i * 10}px` }}
                        >
                          <span className={`text-base sm:text-lg font-black ${tier.color}`}>
                            {tier.commission}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <Icon className={`w-3.5 h-3.5 ${tier.color}`} />
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                            {tier.name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link href="/affiliates">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-semibold text-base sm:text-lg px-7 sm:px-8 py-5 sm:py-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
                  >
                    See the Full Affiliate Program
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  Commission calculator, FAQ, full tier details on the affiliate page
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
