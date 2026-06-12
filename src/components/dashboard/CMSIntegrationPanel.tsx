'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { Shield, Eye, Zap, Globe, Lock, CheckCircle2, Loader2 } from 'lucide-react'

// ── Mode Type (aligned with store AnalysisMode) ────────
type ExtendedMode = 'audit' | 'co-pilot' | 'auto-pilot'

// ── Mode Configuration ────────────────────────────────────────
interface ModeConfig {
  id: ExtendedMode
  label: string
  subtitle: string
  description: string
  icon: typeof Shield
  activeStyle: string
  activeIconBg: string
  badge?: string
}

const MODES: ModeConfig[] = [
  {
    id: 'audit',
    label: 'Audit Only',
    subtitle: 'Kaistone Style',
    description:
      'Read-only mode. Agents generate PDFs and roadmaps. No site changes.',
    icon: Shield,
    activeStyle: 'border-slate-600 bg-slate-900/80',
    activeIconBg: 'bg-slate-700/50 text-slate-300',
  },
  {
    id: 'co-pilot',
    label: 'Co-Pilot Mode',
    subtitle: 'Recommended',
    description:
      'Agents generate code and blogs, but wait for your "Approve & Publish" click.',
    icon: Eye,
    activeStyle: 'border-purple-500/50 bg-purple-950/20 ring-1 ring-purple-500/20',
    activeIconBg: 'bg-purple-500/20 text-purple-400',
    badge: 'Recommended',
  },
  {
    id: 'auto-pilot',
    label: 'Auto-Pilot',
    subtitle: 'Trysoro Style',
    description:
      'Full automation. 8 agents deploy fixes, schema, and content while you sleep.',
    icon: Zap,
    activeStyle: 'border-amber-500/40 bg-amber-950/10',
    activeIconBg: 'bg-amber-500/20 text-amber-400',
  },
]

// ── Toast State ───────────────────────────────────────────────
interface ToastState {
  visible: boolean
  message: string
  type: 'success' | 'error'
}

// ── Main Component ────────────────────────────────────────────
export default function CMSIntegrationPanel() {
  // Read mode from store directly (store now supports all 3 modes)
  const storeMode = useAppStore((s) => s.mode)
  const storeSetMode = useAppStore((s) => s.setMode)

  // Local mode tracks the selected mode (includes 'audit')
  const [localMode, setLocalMode] = useState<ExtendedMode>(
    storeMode === 'audit' ? 'audit' : storeMode === 'auto-pilot' ? 'auto-pilot' : 'co-pilot'
  )

  // Form state
  const [wpUrl, setWpUrl] = useState('')
  const [wpUsername, setWpUsername] = useState('')
  const [wpAppPassword, setWpAppPassword] = useState('')

  // Loading / feedback states
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  })

  // ── Helpers ───────────────────────────────────────────────
  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500)
  }

  const handleModeSelect = (mode: ExtendedMode) => {
    setLocalMode(mode)
    // Sync all modes to store (store now supports 'audit' too)
    storeSetMode(mode)
  }

  const handleTestConnection = async () => {
    if (!wpUrl.trim()) {
      showToast('Please enter a WordPress site URL.', 'error')
      return
    }
    setTesting(true)
    try {
      const response = await fetch('/api/cms/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: wpUrl.replace(/\/+$/, ''),
          username: wpUsername || 'test',
          applicationPassword: wpAppPassword || 'test',
        }),
      })
      const data = await response.json()
      if (data.success) {
        showToast('Connection successful! WordPress site reachable.', 'success')
      } else {
        showToast(data.error || 'Connection failed. Check credentials.', 'error')
      }
    } catch {
      showToast('Could not reach the WordPress site.', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!wpUrl.trim() || !wpUsername.trim() || !wpAppPassword.trim()) {
      showToast('Please fill in all WordPress credentials.', 'error')
      return
    }
    setSaving(true)
    try {
      // Save credentials to a default project (in production, use the actual project ID)
      const response = await fetch('/api/cms/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'default-project',
          credentials: {
            platform: 'wordpress',
            siteUrl: wpUrl.replace(/\/+$/, ''),
            wp_username: wpUsername,
            wp_application_password: wpAppPassword,
          },
        }),
      })
      const data = await response.json()
      if (data.success) {
        showToast('Agents activated! Your site is now connected.', 'success')
      } else {
        showToast(data.error || 'Failed to save credentials.', 'error')
      }
    } catch {
      showToast('Failed to save. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 bg-slate-950 text-white min-h-screen"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          CMS &amp; Automation Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect your website to allow seosights agents to auto-execute technical
          fixes and content updates.
        </p>
      </div>

      {/* ── Two-Column Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ── Left: Execution Mode Toggle (1/3) ────────────── */}
        <motion.div
          className="md:col-span-1 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400">
            Agent Autonomy
          </h3>
          <p className="text-xs text-slate-400">
            Choose how much control you want to grant the 8 AI agents.
          </p>

          <div className="space-y-3 pt-2">
            {MODES.map((m, i) => {
              const Icon = m.icon
              const isActive = localMode === m.id
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
                  onClick={() => handleModeSelect(m.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer ${
                    isActive ? m.activeStyle : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                        isActive ? m.activeIconBg : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isActive
                              ? m.id === 'co-pilot'
                                ? 'text-purple-300'
                                : 'text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {m.label}
                        </span>
                        {m.badge && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border-purple-500/30"
                          >
                            {m.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    {/* Radio indicator */}
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isActive
                            ? m.id === 'co-pilot'
                              ? 'border-purple-500'
                              : m.id === 'auto-pilot'
                              ? 'border-amber-500'
                              : 'border-slate-400'
                            : 'border-slate-600'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mode-indicator"
                            className={`w-2 h-2 rounded-full ${
                              m.id === 'co-pilot'
                                ? 'bg-purple-500'
                                : m.id === 'auto-pilot'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Current mode display */}
          <div className="pt-2">
            <p className="text-xs text-slate-500">
              Current mode:{' '}
              <span className={`font-medium ${
                localMode === 'co-pilot'
                  ? 'text-purple-400'
                  : localMode === 'auto-pilot'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}>
                {localMode === 'co-pilot' ? 'Co-Pilot' : localMode === 'auto-pilot' ? 'Auto-Pilot' : 'Audit Only'}
              </span>
            </p>
          </div>
        </motion.div>

        {/* ── Right: WordPress Integration Form (2/3) ──────── */}
        <motion.div
          className="md:col-span-2 space-y-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* WordPress Header — matching user spec */}
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="WordPress">🌐</span>
            <div>
              <h3 className="text-base font-bold">WordPress Integration</h3>
              <p className="text-xs text-slate-400">
                Sync with your WordPress site via native Application Passwords.
              </p>
            </div>
          </div>

          {/* Form — border-t separator matching spec */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSave() }}
            className="space-y-4 pt-4 border-t border-slate-800"
          >
            {/* Site URL — full width */}
            <div className="space-y-1">
              <Label className="block text-xs font-medium text-slate-400">
                WordPress Site URL
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  className="pl-10 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-slate-300 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Username + Password — 2-column layout matching spec */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div className="space-y-1">
                <Label className="block text-xs font-medium text-slate-400">
                  WP Admin Username
                </Label>
                <Input
                  type="text"
                  placeholder="admin_username"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-slate-300 placeholder:text-slate-600"
                />
              </div>

              {/* Application Password */}
              <div className="space-y-1">
                <Label className="block text-xs font-medium text-slate-400">
                  Application Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    className="pl-10 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-slate-300 placeholder:text-slate-600"
                  />
                </div>
                <span className="block text-[10px] text-slate-500 mt-1">
                  Do not use your main login password. Generate an Application Password in WP → Users → Profile.
                </span>
              </div>
            </div>

            {/* Action Buttons — matching spec: justify-end, Test Connection outline + Save purple */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium hover:bg-slate-800 transition bg-transparent text-slate-300"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-sm font-semibold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-900/30"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Saving &amp; Activating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1" />
                    Save &amp; Activate Agents
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Coming Soon Platforms */}
          <div className="border-t border-slate-800 pt-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
              More Platforms
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Webflow */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/30 opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 shrink-0">
                  <Globe className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-400">
                    Webflow
                  </span>
                  <span className="block text-[11px] text-slate-600">
                    CMS Integration
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-800/50 border-slate-700/50"
                >
                  Coming Soon
                </Badge>
              </div>

              {/* Shopify */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/30 opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 shrink-0">
                  <Globe className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-400">
                    Shopify
                  </span>
                  <span className="block text-[11px] text-slate-600">
                    Store Integration
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-800/50 border-slate-700/50"
                >
                  Coming Soon
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Toast Notification ──────────────────────────────── */}
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/90 border-red-500/30 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
