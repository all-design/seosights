'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Plus,
  Trash2,
  Webhook,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Slack,
  MessageSquare,
  Globe,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ── Types ────────────────────────────────────────────────────
interface WebhookConfig {
  id: string
  userId: string
  type: 'slack' | 'discord' | 'custom'
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

interface TestResult {
  success: boolean
  status?: number
  error?: string
}

const VALID_EVENTS = [
  { id: 'analysis.complete', label: 'Analysis Complete', description: 'When an SEO analysis finishes' },
  { id: 'analysis.failed', label: 'Analysis Failed', description: 'When an analysis fails' },
  { id: 'alert.critical', label: 'Critical Alert', description: 'Critical visibility alerts' },
  { id: 'alert.warning', label: 'Warning Alert', description: 'Warning visibility alerts' },
  { id: 'approval.pending', label: 'Approval Pending', description: 'When an agent action needs approval' },
  { id: 'report.ready', label: 'Report Ready', description: 'When a report is ready for download' },
]

// ── Helper: mask URL ─────────────────────────────────────────
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    const segments = path.split('/').filter(Boolean)
    if (segments.length <= 1) return `${parsed.origin}${path}`
    const masked = segments.map((s, i) => (i < segments.length - 1 ? '•••' : s)).join('/')
    return `${parsed.origin}/${masked}`
  } catch {
    return url.slice(0, 20) + '...'
  }
}

// ── Helper: type icon ────────────────────────────────────────
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'slack':
      return <Slack className="w-4 h-4 text-[#E01E5A]" />
    case 'discord':
      return <MessageSquare className="w-4 h-4 text-[#5865F2]" />
    default:
      return <Globe className="w-4 h-4 text-emerald-400" />
  }
}

// ── Helper: type label ───────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    slack: 'border-[#E01E5A]/30 text-[#E01E5A] bg-[#E01E5A]/5',
    discord: 'border-[#5865F2]/30 text-[#5865F2] bg-[#5865F2]/5',
    custom: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
  }
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[type] || styles.custom}`}>
      {type}
    </Badge>
  )
}

// ── Help Tooltip ──────────────────────────────────────────────
function HelpTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function WebhooksPanel({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean
  onClose: () => void
  userId: string
}) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, TestResult | null>>({})
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set())

  // Form state
  const [formType, setFormType] = useState<'slack' | 'discord' | 'custom'>('slack')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>(['analysis.complete'])
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await fetch(`/api/webhooks?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (err) {
      console.error('[WebhooksPanel] Failed to fetch webhooks:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen && userId) {
      fetchWebhooks()
    }
  }, [isOpen, userId, fetchWebhooks])

  // Create webhook
  const handleCreate = async () => {
    setFormError(null)
    if (!formUrl.trim()) {
      setFormError('URL is required')
      return
    }
    if (formEvents.length === 0) {
      setFormError('Select at least one event')
      return
    }

    setFormSubmitting(true)
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: formType,
          url: formUrl.trim(),
          events: formEvents,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFormError(data.error || 'Failed to create webhook')
        return
      }
      // Reset form and refresh
      setFormUrl('')
      setFormEvents(['analysis.complete'])
      setFormType('slack')
      setAddDialogOpen(false)
      await fetchWebhooks()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete webhook
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id))
        setTestResults((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    } catch (err) {
      console.error('[WebhooksPanel] Delete failed:', err)
    }
  }

  // Toggle active state
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (response.ok) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isActive } : w))
        )
      }
    } catch (err) {
      console.error('[WebhooksPanel] Toggle failed:', err)
    }
  }

  // Test webhook
  const handleTest = async (webhook: WebhookConfig) => {
    setTestingIds((prev) => new Set(prev).add(webhook.id))
    setTestResults((prev) => ({ ...prev, [webhook.id]: null }))
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: webhook.type, url: webhook.url }),
      })
      const result: TestResult = await response.json()
      setTestResults((prev) => ({ ...prev, [webhook.id]: result }))
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [webhook.id]: { success: false, error: 'Network error' },
      }))
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev)
        next.delete(webhook.id)
        return next
      })
    }
  }

  // Toggle event in form
  const toggleEvent = (eventId: string) => {
    setFormEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-xl h-full bg-background border-l border-white/10 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Webhook className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Webhook Integrations</h2>
                  <p className="text-xs text-muted-foreground">Connect Slack, Discord, or custom endpoints</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Webhook Button */}
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2"
                    size="lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-white/10 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Webhook className="w-5 h-5 text-emerald-400" />
                      Add New Webhook
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-5 pt-2">
                    {/* Type Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Platform Type</Label>
                      <Select value={formType} onValueChange={(v) => setFormType(v as 'slack' | 'discord' | 'custom')}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10">
                          <SelectItem value="slack">
                            <span className="flex items-center gap-2">
                              <Slack className="w-4 h-4 text-[#E01E5A]" />
                              Slack
                            </span>
                          </SelectItem>
                          <SelectItem value="discord">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                              Discord
                            </span>
                          </SelectItem>
                          <SelectItem value="custom">
                            <span className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-emerald-400" />
                              Custom
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Webhook URL</Label>
                        {formType === 'slack' && (
                          <HelpTooltip text="Create a Slack Incoming Webhook at api.slack.com/messaging/webhooks" />
                        )}
                        {formType === 'discord' && (
                          <HelpTooltip text="Create a Discord Webhook in Server Settings → Integrations → Webhooks" />
                        )}
                      </div>
                      <Input
                        placeholder={
                          formType === 'slack'
                            ? 'https://hooks.slack.com/services/T.../B.../xxx'
                            : formType === 'discord'
                              ? 'https://discord.com/api/webhooks/.../...'
                              : 'https://your-server.com/webhook'
                        }
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        className="bg-white/5 border-white/10 font-mono text-sm"
                      />
                      {formType === 'slack' && (
                        <p className="text-[11px] text-muted-foreground">
                          URL should start with <code className="text-[#E01E5A]">https://hooks.slack.com/services/</code>
                        </p>
                      )}
                      {formType === 'discord' && (
                        <p className="text-[11px] text-muted-foreground">
                          URL should start with <code className="text-[#5865F2]">https://discord.com/api/webhooks/</code>
                        </p>
                      )}
                    </div>

                    {/* Event Checkboxes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Events to Subscribe</Label>
                      <div className="space-y-2 bg-white/[0.02] rounded-lg border border-white/5 p-3">
                        {VALID_EVENTS.map((event) => (
                          <label
                            key={event.id}
                            className="flex items-start gap-3 cursor-pointer group"
                          >
                            <Checkbox
                              checked={formEvents.includes(event.id)}
                              onCheckedChange={() => toggleEvent(event.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors">
                                {event.label}
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                {event.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Error */}
                    {formError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-sm text-rose-400">
                        {formError}
                      </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-white/10"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                        onClick={handleCreate}
                        disabled={formSubmitting}
                      >
                        {formSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Create Webhook
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Webhook List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
              ) : webhooks.length === 0 ? (
                <Card className="bg-white/[0.02] border-white/5">
                  <CardContent className="p-8 text-center">
                    <Webhook className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold mb-1">No Webhooks Configured</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Add a webhook to receive real-time notifications when analyses complete, alerts trigger, or reports are ready.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <Card
                      key={webhook.id}
                      className={`bg-white/[0.02] border-white/5 transition-all ${
                        !webhook.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <TypeIcon type={webhook.type} />
                              <TypeBadge type={webhook.type} />
                              {!webhook.isActive && (
                                <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">
                                  Paused
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate mb-2">
                              {maskUrl(webhook.url)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event) => (
                                <Badge
                                  key={event}
                                  variant="outline"
                                  className="text-[9px] border-white/10 text-muted-foreground"
                                >
                                  {event}
                                </Badge>
                              ))}
                            </div>
                            {webhook.lastTriggeredAt && (
                              <p className="text-[10px] text-muted-foreground mt-2">
                                Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                              </p>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Active Toggle */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {webhook.isActive ? 'Active' : 'Paused'}
                              </span>
                              <Switch
                                checked={webhook.isActive}
                                onCheckedChange={(checked) =>
                                  handleToggleActive(webhook.id, checked)
                                }
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>

                            {/* Test + Delete Row */}
                            <div className="flex items-center gap-2">
                              {/* Test Result Indicator */}
                              {testResults[webhook.id] && (
                                <span className="text-sm">
                                  {testResults[webhook.id]!.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <TooltipProvider delayDuration={200}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <XCircle className="w-4 h-4 text-rose-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs max-w-xs">
                                          {testResults[webhook.id]!.error || `HTTP ${testResults[webhook.id]!.status}`}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </span>
                              )}

                              {/* Test Button */}
                              <button
                                onClick={() => handleTest(webhook)}
                                disabled={testingIds.has(webhook.id) || !webhook.isActive}
                                className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-muted-foreground hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Test webhook"
                              >
                                {testingIds.has(webhook.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(webhook.id)}
                                className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-muted-foreground hover:text-rose-400"
                                title="Delete webhook"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Info Section */}
              <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Slack Webhooks:</strong> Create an Incoming Webhook in your Slack app settings.{' '}
                        <a
                          href="https://api.slack.com/messaging/webhooks"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E01E5A] hover:underline inline-flex items-center gap-1"
                        >
                          Learn more <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                      <p>
                        <strong className="text-foreground">Discord Webhooks:</strong> Go to Server Settings → Integrations → Webhooks.{' '}
                        <a
                          href="https://support.discord.com/hc/en-us/articles/228383668"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#5865F2] hover:underline inline-flex items-center gap-1"
                        >
                          Learn more <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                      <p>
                        <strong className="text-foreground">Custom Webhooks:</strong> Any HTTP endpoint that accepts POST requests with JSON payloads. Payloads include event type, domain, message, and optional data.
                      </p>
                      <p className="text-muted-foreground/60">
                        Webhook delivery is non-blocking and best-effort. Failed deliveries are logged but not retried. Maximum 10 webhooks per user.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
