'use client'

import { useState, useRef } from 'react'
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
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building2,
  Palette,
  Upload,
  Eye,
  Loader2,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react'

interface AgencyRegistrationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// ── HEX validation helper ────────────────────────────────────────────────
function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

function sanitizeHexInput(value: string): string {
  // Auto-add # prefix
  let v = value.trim()
  if (v && !v.startsWith('#')) v = '#' + v
  // Only allow valid HEX chars
  v = v.replace(/[^#0-9A-Fa-f]/g, '')
  // Limit length
  if (v.length > 7) v = v.slice(0, 7)
  return v
}

export default function AgencyRegistrationDialog({
  isOpen,
  onClose,
  onSuccess,
}: AgencyRegistrationDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Step 1 fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agencyName, setAgencyName] = useState('')

  // Step 2 fields
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [secondaryColor, setSecondaryColor] = useState('#6B7280')
  const [accentColor, setAccentColor] = useState('#f59e0b')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Logo handling ─────────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, SVG, JPG)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setLogoPreview(result)
      setLogoBase64(result)
    }
    reader.readAsDataURL(file)
  }

  // ── Step 1 validation ─────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setError('Name is required')
      return false
    }
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!agencyName.trim()) {
      setError('Agency name is required')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError('')
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('')

    // Validate colors
    if (!isValidHex(primaryColor) || !isValidHex(secondaryColor) || !isValidHex(accentColor)) {
      setError('Please enter valid HEX colors (e.g. #10b981)')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          agencyName,
          logo: logoBase64,
          primaryColor,
          secondaryColor,
          accentColor,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Reset all state
    setStep(1)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setAgencyName('')
    setLogoPreview(null)
    setLogoBase64(null)
    setPrimaryColor('#10b981')
    setSecondaryColor('#6B7280')
    setAccentColor('#f59e0b')
    setError('')
    setIsLoading(false)
    setSubmitted(false)
    onClose()
    if (submitted && onSuccess) onSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg p-0 bg-background border-white/10 overflow-hidden">
        <div className="p-6">
          {/* ── Success State ──────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h3>
                <p className="text-muted-foreground mb-2">
                  Your agency registration has been received.
                </p>
                <p className="text-sm text-emerald-400 font-medium mb-6">
                  We&apos;ll contact you within 24 hours to set up your managed account.
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  In the meantime, you&apos;ll have Starter-level access to explore the platform.
                </p>
                <Button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold"
                >
                  Got It
                </Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Agency Registration</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up your managed agency account with custom branding
                  </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= 1 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 border border-white/10'
                    }`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Account</span>
                  </div>
                  <div className={`flex-1 h-px ${step >= 2 ? 'bg-cyan-500/40' : 'bg-white/10'}`} />
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= 2 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 border border-white/10'
                    }`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Branding</span>
                  </div>
                </div>

                {/* ── Step 1: Account ──────────────────────────────────── */}
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="agency-reg-name" className="text-sm">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="agency-reg-name"
                            type="text"
                            placeholder="John Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="agency-reg-email" className="text-sm">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="agency-reg-email"
                            type="email"
                            placeholder="you@agency.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="agency-reg-password" className="text-sm">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="agency-reg-password"
                            type="password"
                            placeholder="Min 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10"
                            required
                            minLength={8}
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="agency-reg-confirm" className="text-sm">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="agency-reg-confirm"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10"
                            required
                          />
                        </div>
                      </div>

                      {/* Agency Name */}
                      <div className="space-y-2">
                        <Label htmlFor="agency-reg-agency-name" className="text-sm">Agency Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="agency-reg-agency-name"
                            type="text"
                            placeholder="Apex Digital Agency"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10"
                            required
                          />
                        </div>
                      </div>

                      {/* Error */}
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

                      {/* Next Button */}
                      <Button
                        type="button"
                        className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold"
                        onClick={handleNext}
                      >
                        Next: Branding
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {/* ── Step 2: Branding ──────────────────────────────────── */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                          Agency Logo
                        </Label>
                        <div
                          className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {logoPreview ? (
                            <div className="flex flex-col items-center gap-2">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-16 w-auto object-contain rounded"
                              />
                              <span className="text-xs text-muted-foreground">Click to change</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-2">
                              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                              <span className="text-sm text-muted-foreground">Click to upload logo</span>
                              <span className="text-xs text-muted-foreground/60">PNG, SVG, JPG — Max 2MB</span>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Color Pickers */}
                      <div className="space-y-3">
                        <Label className="text-sm flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                          Brand Colors
                        </Label>

                        {/* Primary Color */}
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer shrink-0 bg-transparent"
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1">Primary</Label>
                            <Input
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(sanitizeHexInput(e.target.value))}
                              className="bg-white/5 border-white/10 font-mono text-sm h-9"
                              maxLength={7}
                              placeholder="#10b981"
                            />
                          </div>
                        </div>

                        {/* Secondary Color */}
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer shrink-0 bg-transparent"
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1">Secondary</Label>
                            <Input
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(sanitizeHexInput(e.target.value))}
                              className="bg-white/5 border-white/10 font-mono text-sm h-9"
                              maxLength={7}
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>

                        {/* Accent Color */}
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer shrink-0 bg-transparent"
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1">Accent</Label>
                            <Input
                              value={accentColor}
                              onChange={(e) => setAccentColor(sanitizeHexInput(e.target.value))}
                              className="bg-white/5 border-white/10 font-mono text-sm h-9"
                              maxLength={7}
                              placeholder="#f59e0b"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          Brand Preview
                        </Label>
                        <div
                          className="rounded-xl p-5 border-2 overflow-hidden bg-white"
                          style={{ borderColor: (isValidHex(primaryColor) ? primaryColor : '#10b981') + '40', borderTopColor: isValidHex(primaryColor) ? primaryColor : '#10b981' }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo preview" className="h-8 object-contain" />
                            ) : (
                              <span className="text-base font-bold" style={{ color: isValidHex(primaryColor) ? primaryColor : '#10b981' }}>
                                {agencyName || 'Your Agency'}
                              </span>
                            )}
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest">SEO Audit Report</span>
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-900 mb-1">
                            Unified SEO &middot; AEO &middot; GEO Audit
                          </h4>
                          <p className="text-xs text-gray-500 mb-2">
                            Prepared by: <span className="font-semibold" style={{ color: isValidHex(primaryColor) ? primaryColor : '#10b981' }}>{agencyName || 'Your Agency'}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-1.5 rounded" style={{ backgroundColor: isValidHex(primaryColor) ? primaryColor : '#10b981' }} />
                            <div className="w-6 h-1.5 rounded" style={{ backgroundColor: isValidHex(secondaryColor) ? secondaryColor : '#6B7280' }} />
                            <div className="w-4 h-1.5 rounded" style={{ backgroundColor: isValidHex(accentColor) ? accentColor : '#f59e0b' }} />
                          </div>
                          {/* Sample badge */}
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium" style={{ backgroundColor: (isValidHex(accentColor) ? accentColor : '#f59e0b') + '20', color: isValidHex(accentColor) ? accentColor : '#f59e0b' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isValidHex(accentColor) ? accentColor : '#f59e0b' }} />
                            Managed Client
                          </div>
                        </div>
                      </div>

                      {/* Error */}
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

                      {/* Back / Submit buttons */}
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/10 hover:bg-white/5 flex-1"
                          onClick={handleBack}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          className="flex-[2] bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold"
                          onClick={handleSubmit}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Application
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="text-xs text-center text-muted-foreground">
                        Managed tier requires manual setup. We&apos;ll contact you within 24 hours.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
