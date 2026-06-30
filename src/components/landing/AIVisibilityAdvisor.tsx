'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Brain,
  X,
  Send,
  ArrowRight,
  Sparkles,
  Loader2,
  Eye,
  TrendingUp,
  ShieldCheck,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIVisibilityAdvisorProps {
  onStartFree?: () => void
}

type AdvisorState = 'closed' | 'open' | 'conversation' | 'results'

interface QuickAuditResult {
  url: string
  domain: string
  siteName: string
  scores: { seo: number; aeo: number; geo: number }
  blockedBots: { bot: string; blocked: boolean; detail: string }[]
  allowedBots: { bot: string; blocked: boolean; detail: string }[]
  quickFindings: {
    critical: string[]
    warnings: string[]
    opportunities: string[]
  }
  aeoReadiness: { hasFAQ: boolean; hasSchema: boolean; answerFormatScore: number }
  geoReadiness: { llmsTxtPresent: boolean; aiCrawlerAccess: string; entityRecognition: number }
  llmsTxtPresent: boolean
  topRecommendation: string
  fullReportAvailable: boolean
}

interface QuickReplyOption {
  id: string
  label: string
  icon: typeof Bot
  response: string
}

// ── Quick Reply Config ────────────────────────────────────────
const QUICK_REPLIES: QuickReplyOption[] = [
  {
    id: 'recommend',
    label: 'I want ChatGPT to recommend my SaaS',
    icon: Bot,
    response:
      "Most SaaS products are invisible to AI because they block crawlers or lack structured content. Let's check your site and find out exactly where you stand — it takes 15 seconds.",
  },
  {
    id: 'track',
    label: 'I want to track my AI Visibility Score',
    icon: TrendingUp,
    response:
      "Your AI Visibility Score changes every day as AI models update. Let's see your current score right now — enter your URL and get an instant snapshot.",
  },
  {
    id: 'compare',
    label: 'I want to compare my AI Visibility vs competitors',
    icon: Eye,
    response:
      "Competitor intelligence is key. Let's start with your site — once we see your score, you can compare against any competitor instantly.",
  },
]

// ── Animated Score Counter ────────────────────────────────────
function AnimatedScore({ value, size = 56 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (value / 100) * circumference

  const color =
    value >= 70
      ? '#10b981'
      : value >= 40
        ? '#f59e0b'
        : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-lg font-bold font-mono"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value}
        </motion.span>
      </div>
    </div>
  )
}

// ── Mini Score Bar ────────────────────────────────────────────
function MiniScoreBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
          {label}
        </span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function AIVisibilityAdvisor({ onStartFree }: AIVisibilityAdvisorProps) {
  const [state, setState] = useState<AdvisorState>('closed')
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [auditResult, setAuditResult] = useState<QuickAuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'closed') {
        setState('closed')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state])

  // Focus input when entering conversation state
  useEffect(() => {
    if (state === 'conversation' && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 400)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleQuickReply = useCallback((reply: QuickReplyOption) => {
    setSelectedGoal(reply.id)
    setState('conversation')
  }, [])

  const handleAnalyze = useCallback(async () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return

    // Auto-prepend https:// if missing
    let url = trimmed
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const res = await fetch('/api/quick-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Analysis failed (${res.status})`)
      }

      const data: QuickAuditResult = await res.json()
      setAuditResult(data)
      setState('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsAnalyzing(false)
    }
  }, [urlInput])

  const handleClose = useCallback(() => {
    setState('closed')
  }, [])

  const handleReset = useCallback(() => {
    setState('open')
    setSelectedGoal(null)
    setUrlInput('')
    setAuditResult(null)
    setError(null)
  }, [])

  // Compute overall AI Visibility Score from audit result
  const overallScore = auditResult
    ? Math.round(
        (auditResult.scores.seo + auditResult.scores.aeo + auditResult.scores.geo) / 3
      )
    : 0

  // ── Get the selected reply data ──
  const selectedReply = QUICK_REPLIES.find((r) => r.id === selectedGoal)

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {state === 'closed' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setState('open')}
            className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer group"
            aria-label="Open AI Visibility Advisor"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600" />
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-500/30"
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <Brain className="relative z-10 h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {state !== 'closed' && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-h-[500px] rounded-2xl border border-white/10 bg-[#0d1117]/98 backdrop-blur-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white/90">
                    AI Visibility Advisor
                  </h3>
                  <p className="text-[10px] text-white/30">
                    Guided analysis · No signup needed
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close advisor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">
                {/* ── State: Open (quick replies) ── */}
                {state === 'open' && (
                  <motion.div
                    key="open"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 space-y-4"
                  >
                    {/* Opening message */}
                    <div className="flex gap-2.5">
                      <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                        <p className="text-sm text-white/80 leading-relaxed">
                          What are you trying to achieve?
                        </p>
                      </div>
                    </div>

                    {/* Quick reply buttons */}
                    <div className="space-y-2">
                      {QUICK_REPLIES.map((reply, i) => (
                        <motion.button
                          key={reply.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          onClick={() => handleQuickReply(reply)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 text-left transition-all group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                            <reply.icon className="h-4 w-4 text-emerald-400" />
                          </div>
                          <span className="text-xs sm:text-sm text-white/70 group-hover:text-white/90 transition-colors leading-snug">
                            {reply.label}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 ml-auto shrink-0 transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── State: Conversation (response + URL input) ── */}
                {state === 'conversation' && selectedReply && (
                  <motion.div
                    key="conversation"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 space-y-4"
                  >
                    {/* User's selection shown as "their message" */}
                    <div className="flex justify-end">
                      <div className="rounded-xl rounded-tr-sm bg-emerald-500/15 border border-emerald-500/20 px-3 py-2 max-w-[85%]">
                        <p className="text-xs sm:text-sm text-emerald-300 leading-relaxed">
                          {selectedReply.label}
                        </p>
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex gap-2.5">
                      <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 max-w-[90%]">
                        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                          {selectedReply.response}
                        </p>
                      </div>
                    </div>

                    {/* URL input area */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/30 px-0.5">
                        Enter your website to see a live demo
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            ref={inputRef}
                            value={urlInput}
                            onChange={(e) => {
                              setUrlInput(e.target.value)
                              setError(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isAnalyzing) {
                                handleAnalyze()
                              }
                            }}
                            placeholder="yoursite.com"
                            disabled={isAnalyzing}
                            className="h-9 bg-white/[0.04] border-white/10 text-white/90 placeholder:text-white/20 text-sm focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                          />
                        </div>
                        <Button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing || !urlInput.trim()}
                          className="h-9 px-3 bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white border-0 shadow-none disabled:opacity-50"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Loading state */}
                      {isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2.5 px-0.5"
                        >
                          <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                          <span className="text-xs text-white/40">
                            Analyzing your AI visibility…
                          </span>
                        </motion.div>
                      )}

                      {/* Error */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span className="text-xs text-red-300">{error}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Back link */}
                    <button
                      onClick={handleReset}
                      className="text-[10px] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
                    >
                      ← Choose a different goal
                    </button>
                  </motion.div>
                )}

                {/* ── State: Results (mini audit display) ── */}
                {state === 'results' && auditResult && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 space-y-4"
                  >
                    {/* Success message */}
                    <div className="flex gap-2.5">
                      <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                          Here&apos;s your AI Visibility snapshot for{' '}
                          <span className="text-emerald-400 font-semibold">
                            {auditResult.domain}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Score card */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                      {/* Overall score + domain */}
                      <div className="flex items-center gap-4">
                        <AnimatedScore value={overallScore} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-0.5">
                            AI Visibility Score
                          </p>
                          <p className="text-lg font-bold text-white/90">
                            {overallScore}
                            <span className="text-sm text-white/30 font-normal">
                              /100
                            </span>
                          </p>
                          <p className="text-[10px] text-white/25 truncate mt-0.5">
                            {auditResult.siteName || auditResult.domain}
                          </p>
                        </div>
                      </div>

                      {/* Score breakdown bars */}
                      <div className="space-y-2.5">
                        <MiniScoreBar
                          label="SEO"
                          value={auditResult.scores.seo}
                          color="#10b981"
                        />
                        <MiniScoreBar
                          label="AEO"
                          value={auditResult.scores.aeo}
                          color="#8b5cf6"
                        />
                        <MiniScoreBar
                          label="GEO"
                          value={auditResult.scores.geo}
                          color="#f59e0b"
                        />
                      </div>

                      {/* Blocked bots warning */}
                      {auditResult.blockedBots.length > 0 && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-500/[0.06] border border-red-500/10 px-3 py-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-semibold text-red-300">
                              {auditResult.blockedBots.length} AI crawler
                              {auditResult.blockedBots.length > 1 ? 's' : ''} blocked
                            </p>
                            <p className="text-[9px] text-red-300/60 mt-0.5">
                              {auditResult.blockedBots
                                .slice(0, 3)
                                .map((b) => b.bot)
                                .join(', ')}
                              {auditResult.blockedBots.length > 3
                                ? ` +${auditResult.blockedBots.length - 3} more`
                                : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Top finding */}
                      {auditResult.topRecommendation && (
                        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-3 py-2">
                          <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-white/60 leading-relaxed">
                            {auditResult.topRecommendation}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="space-y-2">
                      <Button
                        onClick={onStartFree}
                        className="w-full bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white font-semibold h-10 rounded-xl shadow-lg shadow-emerald-500/15 transition-all"
                      >
                        Get the Full Report
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                      <p className="text-center text-[10px] text-white/20">
                        8-agent deep analysis · No credit card required
                      </p>
                    </div>

                    {/* Try another */}
                    <button
                      onClick={handleReset}
                      className="w-full text-center text-[10px] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
                    >
                      ← Try another website
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer branding */}
            <div className="shrink-0 border-t border-white/[0.04] px-4 py-2 flex items-center justify-between">
              <span className="text-[9px] text-white/15 font-medium">
                Powered by SeoSights
              </span>
              <span className="text-[9px] text-white/15">
                Free instant scan
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
