'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PLAN_PRICES } from '@/lib/stripe'
import {
  Check,
  ArrowRight,
  Building2,
  Zap,
  Phone,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface PlanFeature {
  icon: LucideIcon
  title: string
  description: string
}

interface PricingCardProps {
  name: string
  subtitle: string
  price: string
  period: string
  freeTrial: string | null
  description: string
  features: PlanFeature[]
  cta: string
  planKey: 'starter' | 'pro' | 'managed'
  ctaAction: 'free' | 'pro' | 'managed' | 'contact'
  highlighted: boolean
  borderColor: string
  iconColor: string
  iconBg: string
  glowColor: string
  userId?: string
  onStartFree?: () => void
}

export default function PricingCard({
  name,
  subtitle,
  price,
  period,
  freeTrial,
  description,
  features,
  cta,
  planKey,
  ctaAction,
  highlighted,
  borderColor,
  iconColor,
  iconBg,
  glowColor,
  userId,
  onStartFree,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (ctaAction === 'contact') {
      const el = document.getElementById('cta')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      return
    }

    if (ctaAction === 'free') {
      onStartFree?.()
      return
    }

    // For 'pro' and 'managed' actions, use Stripe checkout
    if (!userId) {
      // If no userId, trigger the free trial flow instead
      onStartFree?.()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const priceId = PLAN_PRICES[planKey]
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          priceId,
          plan: planKey,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative ${highlighted ? 'md:-mt-4 md:mb-[-16px]' : ''}`}>
      {/* Popular badge */}
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-amber-500 text-black font-bold px-4 py-1 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            Most Popular
          </Badge>
        </div>
      )}

      <Card
        className={`bg-white/5 backdrop-blur-sm border-2 ${borderColor} ${glowColor} transition-all duration-300 h-full flex flex-col ${
          highlighted
            ? 'shadow-[0_0_40px_rgba(245,158,11,0.1)] border-amber-500/50'
            : ''
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
            >
              {name === 'Starter' && <Zap className={`w-4 h-4 ${iconColor}`} />}
              {name === 'Pro Agency' && (
                <Building2 className={`w-4 h-4 ${iconColor}`} />
              )}
              {name === 'Managed' && (
                <Settings className={`w-4 h-4 ${iconColor}`} />
              )}
            </div>
            <div className="leading-none font-semibold text-xl">{name}</div>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-4">
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-muted-foreground text-lg">{period}</span>
          </div>
          {freeTrial && (
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 w-fit border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs mt-2"
            >
              <Check className="w-3 h-3" />
              {freeTrial}
            </Badge>
          )}
          <p className="text-sm text-muted-foreground mt-3">{description}</p>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            {features.map((feature, fi) => (
              <div key={fi} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <feature.icon className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/90">
                    {feature.title}
                  </p>
                  {feature.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            size="lg"
            className={`w-full mt-6 font-semibold text-base py-5 transition-all duration-300 ${
              highlighted
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]'
                : name === 'Managed'
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)]'
            }`}
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {cta}
                {ctaAction !== 'contact' && <ArrowRight className="ml-2 w-4 h-4" />}
                {ctaAction === 'contact' && <Phone className="ml-2 w-4 h-4" />}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
