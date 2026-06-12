'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Globe, AlertTriangle, CheckCircle2, XCircle, Loader2, Sparkles, TrendingUp, BarChart3, Brain, Link2, Lock } from 'lucide-react'

interface HeroSectionProps {
  onStartFree?: () => void
}

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
      <span className={`text-xs font-bold uppercase tracking-wider`} style={{ color }}>{label}</span>
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

  return (
    <section className="relative bg-background text-white py-24 px-6 overflow-hidden">
      {/* Background AI effect — Blurred orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
        <div className="absolute top-12 left-10 w-72 h-72 bg-purple-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-12 right-10 w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-purple-400">
            <span>⚡ Not a Wrapper. A Purpose-Built SEO Engine.</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          className="text-5xl md:text-6xl font-black tracking-tight leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Get Customers from{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
            Google &amp; AI
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-normal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          8 AI agents audit, strategize, and auto-execute your SEO, AEO, and GEO — all while you sleep.
        </motion.p>

        {/* URL Scan Form */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleQuickScan() }}
            className="max-w-2xl mx-auto mt-10 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur flex flex-col md:flex-row gap-2"
          >
            <div className="flex-1 flex items-center gap-3 px-3">
              <Globe className="w-5 h-5 text-slate-500 shrink-0" />
              <Input
                type="url"
                required
                value={scanUrl}
                onChange={(e) => { setScanUrl(e.target.value); setScanError('') }}
                placeholder="enter your website url (e.g. domain.com)"
                className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 focus-visible:ring-0 border-0 shadow-none text-base h-12"
                disabled={isScanning}
              />
            </div>
            <Button
              type="submit"
              disabled={isScanning}
              className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-6 py-4 rounded-xl transition duration-200 shadow-lg shadow-purple-900/20 whitespace-nowrap h-12"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Analyze All Three Sights'
              )}
            </Button>
          </form>

          {scanError && (
            <motion.p
              className="text-rose-400 text-sm mt-3"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {scanError}
            </motion.p>
          )}
        </motion.div>

        {/* Three Sights Indicators */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-6 pt-6 text-sm text-slate-400 font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            1st Sight: Traditional SEO
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            2nd Sight: AI Assistants
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            3rd Sight: Generative Engines
          </div>
        </motion.div>

        {/* Scan Results */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(147,51,234,0.1)] text-left mt-8"
            >
              {/* Site name + domain */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{scanResult.siteName}</h3>
                  <p className="text-sm text-muted-foreground">{scanResult.domain}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-medium text-purple-400">
                  Free Scan
                </div>
              </div>

              {/* Score Rings — Purple / Indigo / Blue */}
              <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
                <ScoreRing score={scanResult.scores.seo} label="SEO" color="#a855f7" />
                <ScoreRing score={scanResult.scores.aeo} label="AEO" color="#818cf8" />
                <ScoreRing score={scanResult.scores.geo} label="GEO" color="#60a5fa" />
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
                  <p className="text-xs text-rose-300/70 mt-2">These AI bots cannot access your site — you&apos;re invisible to their users.</p>
                </div>
              )}

              {/* Allowed Bots */}
              {scanResult.allowedBots.length > 0 && (
                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-purple-400">AI Crawlers Allowed</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.allowedBots.slice(0, 5).map((b) => (
                      <span key={b.bot} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300">
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
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">llms.txt</span>
                  <span className={`text-sm ml-2 ${scanResult.llmsTxtPresent ? 'text-purple-400' : 'text-rose-400'}`}>
                    {scanResult.llmsTxtPresent ? 'Found' : 'Missing'}
                  </span>
                  {!scanResult.llmsTxtPresent && (
                    <p className="text-xs text-muted-foreground mt-0.5">AI models can&apos;t discover your content efficiently without llms.txt</p>
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
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-purple-300">{f}</span>
                  </div>
                ))}
              </div>

              {/* Top Recommendation */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-400">Top Recommendation</span>
                </div>
                <p className="text-sm text-indigo-200/80">{scanResult.topRecommendation}</p>
              </div>

              {/* Compare with GSC Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mb-5 p-4 bg-gradient-to-r from-purple-500/10 via-background to-indigo-500/10 border border-purple-500/20 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Link2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-purple-400 mb-1">Compare with Google Search Console</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Want to see how your Google rankings correlate with AI visibility? Pages ranking #1-3 are 3X more likely to be cited by AI engines.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2.5 py-1">
                        <BarChart3 className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-300 font-medium">GSC Correlation</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-1">
                        <Brain className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] text-indigo-300 font-medium">3X AI Boost</span>
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
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all duration-300 w-full sm:w-auto"
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
    </section>
  )
}
