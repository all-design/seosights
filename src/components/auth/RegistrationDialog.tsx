'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Zap,
  Building2,
  Settings,
  ShieldCheck,
  CreditCard,
  Clock,
} from 'lucide-react'

export type RegistrationTier = 'starter' | 'pro' | 'managed'

interface RegistrationDialogProps {
  isOpen: boolean
  onClose: () => void
  tier: RegistrationTier
}

const TIER_CONFIG: Record<RegistrationTier, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  description: string
  badgeText: string
}> = {
  starter: {
    label: 'Starter',
    icon: Zap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    description: '14-day free trial · $9.90/mo for 6 months, then $19/mo',
    badgeText: 'Launch Special · 50% Off',
  },
  pro: {
    label: 'Pro Agency',
    icon: Building2,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    description: 'White-label reports · 20 domains · $79/month',
    badgeText: 'Most Popular',
  },
  managed: {
    label: 'Managed',
    icon: Settings,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    description: 'Done-For-You service · Custom pricing',
    badgeText: 'Contact Us',
  },
}

export default function RegistrationDialog({
  isOpen,
  onClose,
  tier,
}: RegistrationDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const config = TIER_CONFIG[tier]
  const TierIcon = config.icon

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' })
    setError('')
    setSuccess(false)
    setCheckoutUrl(null)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Register the user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          tier,
        }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok || !registerData.success) {
        setError(registerData.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      const userId = registerData.user?.id

      // Step 2: For managed tier, redirect to contact form
      if (tier === 'managed') {
        setSuccess(true)
        setIsLoading(false)
        // Scroll to CTA section after brief delay
        setTimeout(() => {
          handleClose()
          const ctaEl = document.getElementById('cta')
          if (ctaEl) ctaEl.scrollIntoView({ behavior: 'smooth' })
        }, 1500)
        return
      }

      // Step 3: Create Stripe checkout session for starter/pro
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        // Registration succeeded but checkout failed — still mark success
        // User can retry checkout from their dashboard
        setSuccess(true)
        setError('Account created! Redirecting to dashboard...')
        setIsLoading(false)
        setTimeout(() => handleClose(), 2000)
        return
      }

      // For managed redirect
      if (checkoutData.redirect === 'contact') {
        setSuccess(true)
        setIsLoading(false)
        setTimeout(() => {
          handleClose()
          const ctaEl = document.getElementById('cta')
          if (ctaEl) ctaEl.scrollIntoView({ behavior: 'smooth' })
        }, 1500)
        return
      }

      // Redirect to Stripe checkout
      if (checkoutData.url) {
        setCheckoutUrl(checkoutData.url)
        setSuccess(true)
        window.location.href = checkoutData.url
        return
      }

      // Fallback — no checkout URL returned
      setSuccess(true)
      setIsLoading(false)
      setTimeout(() => handleClose(), 2000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-0 bg-background border-white/10 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor} mb-4`}>
              <TierIcon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {tier === 'managed' ? 'Get in Touch' : 'Start Your Free Trial'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tier === 'managed'
                ? 'Create an account and our team will reach out to discuss your needs.'
                : 'Create your account to get started with SEOSights.'}
            </p>
          </div>

          {/* Tier Info Badge */}
          <div className={`mb-5 p-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TierIcon className={`w-4 h-4 ${config.color}`} />
                <span className="text-sm font-medium text-foreground">{config.label} Plan</span>
              </div>
              <Badge variant="outline" className={`${config.borderColor} ${config.color} text-xs`}>
                {config.badgeText}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{config.description}</p>
          </div>

          {/* Success State */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center"
              >
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-400">
                  {tier === 'managed'
                    ? 'Account created! We\'ll be in touch soon.'
                    : checkoutUrl
                      ? 'Account created! Redirecting to checkout...'
                      : 'Account created successfully!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-sm">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-white/5 border-white/10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-white/5 border-white/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 bg-white/5 border-white/10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password" className="text-sm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 bg-white/5 border-white/10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Hidden tier field indicator */}
              <input type="hidden" value={tier} />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className={`w-full font-semibold transition-all duration-300 ${
                  tier === 'pro'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : tier === 'managed'
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                      : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {tier === 'managed' ? 'Create Account & Contact Us' : `Start ${config.label} Free Trial`}
              </Button>

              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {tier === 'managed' ? 'Custom Timeline' : '14-Day Free Trial'}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  No Credit Card Required
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  Cancel Anytime
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By registering you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
