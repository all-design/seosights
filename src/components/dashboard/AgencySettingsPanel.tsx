'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Palette,
  Upload,
  Save,
  Loader2,
  Lock,
  CheckCircle2,
  Building2,
  Eye,
} from 'lucide-react'

interface AgencySettingsProps {
  userId?: string
  onClose?: () => void
}

export default function AgencySettingsPanel({ userId, onClose }: AgencySettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [canWhiteLabel, setCanWhiteLabel] = useState(false)
  const [tier, setTier] = useState('free_trial')

  // Form state
  const [agencyName, setAgencyName] = useState('')
  const [agencyLogoUrl, setAgencyLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [secondaryColor, setSecondaryColor] = useState('#6B7280')

  // Success message
  const [saved, setSaved] = useState(false)

  // Load existing settings
  useEffect(() => {
    if (!userId) return
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/agency?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setCanWhiteLabel(data.canWhiteLabel)
          setTier(data.tier)
          setAgencyName(data.agencyName || '')
          setAgencyLogoUrl(data.agencyLogoUrl || '')
          setPrimaryColor(data.agencyPrimaryColor || '#10b981')
          setSecondaryColor(data.agencySecondaryColor || '#6B7280')
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [userId])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          agencyName,
          agencyLogoUrl,
          agencyPrimaryColor: primaryColor,
          agencySecondaryColor: secondaryColor,
        }),
      })

      if (res.status === 403) {
        // User needs to upgrade
        alert('White-label branding is a Pro feature. Please upgrade to customize your reports.')
        return
      }

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // Handle error silently
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="ml-3 text-muted-foreground">Loading agency settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Agency Branding</h2>
            <p className="text-xs text-muted-foreground">Customize your PDF reports with your agency branding</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            canWhiteLabel
              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
              : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
          }
        >
          {canWhiteLabel ? (
            <><CheckCircle2 className="w-3 h-3 mr-1" /> Pro Access</>
          ) : (
            <><Lock className="w-3 h-3 mr-1" /> Upgrade Required</>
          )}
        </Badge>
      </div>

      {/* Pro upgrade notice */}
      {!canWhiteLabel && (
        <Card className="bg-gradient-to-r from-amber-500/10 via-background to-emerald-500/10 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-400 mb-1">White-Label is a Pro Feature</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  SEO agencies don&apos;t just use tools — they show reports to clients to justify invoices.
                  With Pro, you get branded PDFs with your logo, colors, and agency name.
                </p>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                >
                  Upgrade to Pro — $79/mo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Form */}
      <div className={`space-y-4 ${!canWhiteLabel ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Agency Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Agency Name
          </label>
          <Input
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            placeholder="e.g. Apex Digital Agency"
            className="bg-white/5 border-white/10 focus:border-emerald-500/50"
            disabled={!canWhiteLabel}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Appears on the cover page and footer of generated PDFs
          </p>
        </div>

        {/* Logo URL */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            Logo URL
          </label>
          <Input
            value={agencyLogoUrl}
            onChange={(e) => setAgencyLogoUrl(e.target.value)}
            placeholder="https://cdn.youragency.com/logo.png"
            className="bg-white/5 border-white/10 focus:border-emerald-500/50"
            disabled={!canWhiteLabel}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Direct URL to your agency logo (PNG/SVG recommended, max height 48px in report)
          </p>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              Primary Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer"
                disabled={!canWhiteLabel}
              />
              <Input
                value={primaryColor}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                    setPrimaryColor(e.target.value)
                  }
                }}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 font-mono text-sm"
                disabled={!canWhiteLabel}
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              Secondary Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer"
                disabled={!canWhiteLabel}
              />
              <Input
                value={secondaryColor}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                    setSecondaryColor(e.target.value)
                  }
                }}
                className="bg-white/5 border-white/10 focus:border-emerald-500/50 font-mono text-sm"
                disabled={!canWhiteLabel}
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            Report Preview
          </label>
          <div
            className="rounded-xl p-6 border-2 overflow-hidden"
            style={{ borderColor: primaryColor + '40', borderTopColor: primaryColor }}
          >
            <div className="flex items-center justify-between mb-4">
              {agencyLogoUrl ? (
                <img src={agencyLogoUrl} alt="Logo" className="h-10 object-contain" />
              ) : (
                <span className="text-lg font-bold" style={{ color: primaryColor }}>
                  seosights
                </span>
              )}
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Digital Marketing Report</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">
              Unified SEO &middot; AEO &middot; GEO Audit
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Prepared by: <span className="font-semibold" style={{ color: primaryColor }}>{agencyName || 'seosights Engine'}</span>
            </p>
            <div className="w-16 h-1.5 rounded" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || !canWhiteLabel}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Branding</>
          )}
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  )
}
