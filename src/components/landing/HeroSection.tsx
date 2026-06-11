'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowRight, Bot, Brain, Search, Eye, BarChart3, TrendingUp, Shield, Zap, Sparkles, Globe, AlertTriangle, CheckCircle2, XCircle, Download, Lock, Loader2, Link2 } from 'lucide-react'

interface HeroSectionProps {
  onStartFree?: () => void
}

const agentPills = [
  { name: 'Master Director', icon: '🎯', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Keyword Researcher', icon: '🔑', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Competitor Analyst', icon: '🕵️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { name: 'Content Architect', icon: '🏗️', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'On-Page Auditor', icon: '🔍', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Link Strategist', icon: '🔗', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { name: 'Tech & Schema', icon: '⚙️', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Backlink Prospector', icon: '🤝', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
]

const threeSights = [
  {
    number: '1st',
    name: 'LOVE AT FIRST SIGHT',
    label: 'SEO',
    description: 'Traditional search',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  {
    number: '2nd',
    name: 'Second Sight',
    label: 'AEO',
    description: 'AI assistants',
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
  },
  {
    number: '3rd',
    name: 'Third Sight',
    label: 'GEO',
    description: 'Generative engines',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
]

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

function ScoreRing({ score, label, color, size = 80 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const strokeColor = score >= 70 ? color : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth="4" strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className={`text-xs font-bold ${color} uppercase tracking-wider`}>{label}</span>
    </div>
  )
}

export default function HeroSection({ onStartFree }: HeroSectionProps) {
  const [scanUrl, setScanUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<QuickAuditResult | null>(null)
  const [scanError, setScanError] = useState('')

  const handleQuickScan = async () => {
    if (!scanUrl.trim()) {
      setScanError('Please enter a website URL')
      return
    }

    let cleanUrl = scanUrl.trim()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    try {
      new URL(cleanUrl)
    } catch {
      setScanError('Please enter a valid URL')
      return
    }

    setScanError('')
    setIsScanning(true)
    setScanResult(null)

    try {
      const response = await fetch('/api/quick-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Scan failed')
      }

      const data = await response.json()
      setScanResult(data)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-emerald-950/20 to-background" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/6 rounded-full blur-[100px]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* ── Text-only Logo: seosights (big) + tagline centered below ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-400 bg-clip-text text-transparent">
              seosights
            </span>
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.35em] text-emerald-400/60 uppercase mt-2 text-center">
            Multiple pillars, one unified AI engine
          </p>
        </motion.div>

        {/* Badge: SEO · AEO · GEO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Three Sights. One Platform.
          </Badge>
        </motion.div>

        {/* ── FREE AUDIT SCANNER (Trojan Horse) ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              <span className="text-foreground">Get Customers from </span>
              <span className="text-emerald-400">Google</span>
              <span className="text-foreground"> & </span>
              <span className="text-amber-400">AI</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-5">
              Free AI Visibility Scan — see your GEO & AEO scores in seconds
            </p>

            {/* Scanner Input */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <Input
                  value={scanUrl}
                  onChange={(e) => { setScanUrl(e.target.value); setScanError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickScan() }}
                  placeholder="Enter your website URL..."
                  className="pl-12 h-14 bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30 text-lg placeholder:text-muted-foreground/40"
                  disabled={isScanning}
                />
              </div>
              <Button
                onClick={handleQuickScan}
                disabled={isScanning}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg h-14 px-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    Free Scan
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>

            {scanError && (
              <motion.p
                className="text-rose-400 text-sm mb-3"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {scanError}
              </motion.p>
            )}

            {/* ── Scan Results ── */}
            <AnimatePresence>
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] text-left"
                >
                  {/* Site name + domain */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{scanResult.siteName}</h3>
                      <p className="text-sm text-muted-foreground">{scanResult.domain}</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                      Free Scan
                    </Badge>
                  </div>

                  {/* Score Rings */}
                  <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
                    <ScoreRing score={scanResult.scores.seo} label="SEO" color="text-emerald-400" />
                    <ScoreRing score={scanResult.scores.aeo} label="AEO" color="text-cyan-400" />
                    <ScoreRing score={scanResult.scores.geo} label="GEO" color="text-amber-400" />
                  </div>

                  {/* Blocked Bots */}
                  {scanResult.blockedBots.length > 0 && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-bold text-rose-400">AI Crawlers Blocked</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.blockedBots.map((b) => (
                          <span key={b.bot} className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full text-xs font-medium text-rose-300">
                            <XCircle className="w-3 h-3" />
                            {b.bot}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-rose-300/70 mt-2">These AI bots cannot access your site — you're invisible to their users.</p>
                    </div>
                  )}

                  {/* Allowed Bots */}
                  {scanResult.allowedBots.length > 0 && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">AI Crawlers Allowed</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.allowedBots.slice(0, 5).map((b) => (
                          <span key={b.bot} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            {b.bot}
                          </span>
                        ))}
                        {scanResult.allowedBots.length > 5 && (
                          <span className="text-xs text-muted-foreground self-center">+{scanResult.allowedBots.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* llms.txt status */}
                  <div className="mb-4 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    {scanResult.llmsTxtPresent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-foreground">llms.txt</span>
                      <span className={`text-sm ml-2 ${scanResult.llmsTxtPresent ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {scanResult.llmsTxtPresent ? 'Found' : 'Missing'}
                      </span>
                      {!scanResult.llmsTxtPresent && (
                        <p className="text-xs text-muted-foreground mt-0.5">AI models can't discover your content efficiently without llms.txt</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Findings */}
                  <div className="space-y-2 mb-5">
                    {scanResult.quickFindings.critical.slice(0, 2).map((f, i) => (
                      <div key={`c-${i}`} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-rose-300">{f}</span>
                      </div>
                    ))}
                    {scanResult.quickFindings.opportunities.slice(0, 2).map((f, i) => (
                      <div key={`o-${i}`} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-emerald-300">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Top Recommendation */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">Top Recommendation</span>
                    </div>
                    <p className="text-sm text-amber-200/80">{scanResult.topRecommendation}</p>
                  </div>

                  {/* Compare with GSC Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mb-5 p-4 bg-gradient-to-r from-cyan-500/10 via-background to-emerald-500/10 border border-cyan-500/20 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                        <Link2 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-cyan-400 mb-1">Compare with Google Search Console</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Want to see how your Google rankings correlate with AI visibility? Pages ranking #1-3 are 3X more likely to be cited by AI engines.
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                            <BarChart3 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-300 font-medium">GSC Correlation</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1">
                            <Brain className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] text-amber-300 font-medium">3X AI Boost</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* CTA: Full Report */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Want the full 8-agent strategy?</span>
                    </div>
                    <Button
                      onClick={onStartFree}
                      size="lg"
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-base px-8 py-5 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300 w-full sm:w-auto"
                    >
                      Start 1-Month Free Trial — Full Report
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-xs text-muted-foreground/50 mt-3">8 AI agents · Full SEO/AEO/GEO strategy · llms.txt generator · No credit card</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* "Not a Wrapper" Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-sm mb-6"
          >
            ⚡ Not a Wrapper. A Purpose-Built SEO Engine.
          </Badge>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="text-base sm:text-lg text-muted-foreground/70 max-w-3xl mx-auto mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          8 AI agents audit, strategize, and auto-execute your SEO, AEO & GEO —{' '}
          <span className="text-foreground font-semibold">all while you sleep</span>.
        </motion.p>

        {/* ── Three Sights Visual ── */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {threeSights.map((sight, idx) => (
            <motion.div
              key={sight.label}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border ${sight.border} ${sight.bg} backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.35 + idx * 0.1 }}
            >
              <Eye className={`w-4 h-4 ${sight.color}`} />
              <div className="text-left">
                <span className={`text-xs font-bold ${sight.color} uppercase tracking-wider`}>
                  {sight.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{sight.label}</span>
                  <span className="text-xs text-muted-foreground">· {sight.description}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Platform Badges — "Tracked across 17+ AI Engines" */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <span className="text-sm text-muted-foreground/70 block mb-3">Tracked across 17+ AI Engines</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { name: 'ChatGPT', icon: Bot, color: 'text-emerald-400' },
              { name: 'Claude', icon: Brain, color: 'text-amber-400' },
              { name: 'Perplexity', icon: Search, color: 'text-cyan-400' },
              { name: 'AI Overviews', icon: Eye, color: 'text-rose-400' },
              { name: 'Gemini', icon: Sparkles, color: 'text-blue-400' },
              { name: 'DeepSeek', icon: Zap, color: 'text-purple-400' },
              { name: 'Grok', icon: Bot, color: 'text-orange-400' },
              { name: 'Copilot', icon: Search, color: 'text-teal-400' },
            ].map((engine, idx) => (
              <motion.div
                key={engine.name}
                className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + idx * 0.04 }}
              >
                <engine.icon className={`w-3.5 h-3.5 ${engine.color}`} />
                <span className="text-xs font-medium text-foreground/80">{engine.name}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm border border-emerald-500/30 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-emerald-400">+9 more</span>
            </div>
          </div>
        </motion.div>

        {/* ── "Your 24/7 AI SEO Team" Section ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
              Your 24/7 AI SEO Team
            </span>
          </h2>
          <p className="text-muted-foreground/80 text-base sm:text-lg mb-5">
            8 specialized agents. Auto-executing your strategy while you sleep.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {agentPills.map((agent, idx) => (
              <motion.div
                key={agent.name}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium ${agent.color} backdrop-blur-sm`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.45 + idx * 0.05 }}
              >
                <span className="text-sm">{agent.icon}</span>
                {agent.name}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            onClick={onStartFree}
          >
            Deploy Your AI Team — Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-semibold text-lg px-8 py-6 transition-all duration-300"
            onClick={() => scrollToSection('pricing')}
          >
            View Pricing
          </Button>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-emerald-500/20 rounded-xl px-5 py-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-xl">8X</span>
            <span className="text-muted-foreground text-sm">SEO rankings</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-cyan-500/20 rounded-xl px-5 py-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xl">5X</span>
            <span className="text-muted-foreground text-sm">AEO featured snippets</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-xl px-5 py-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold text-xl">3X</span>
            <span className="text-muted-foreground text-sm">Brand mentions → AI</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-rose-500/20 rounded-xl px-5 py-3">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <span className="text-rose-400 font-bold text-xl">9X</span>
            <span className="text-muted-foreground text-sm">LLM traffic converts</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
