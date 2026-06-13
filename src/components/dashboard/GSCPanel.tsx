'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Bot,
  Brain,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Database,
  AlertCircle,
  Link2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
interface GSCQuery {
  query: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  aiCitation: boolean
  aiEngines: string[]
}

interface GSCPage {
  url: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface CrawlError {
  url: string
  type: string
  lastCrawled: string
  occurrences: number
}

interface GSCData {
  connected: boolean
  siteUrl: string
  domain: string
  connectedAt: string
  topQueries: GSCQuery[]
  topPages: GSCPage[]
  crawlErrors: CrawlError[]
  indexingStatus: {
    totalPages: number
    indexedPages: number
    pendingPages: number
    excludedPages: number
    coverage: number
  }
  performanceOverTime: {
    date: string
    impressions: number
    clicks: number
  }[]
}

interface ComparisonData {
  domain: string
  period: string
  days: number
  generatedAt: string
  summary: {
    googleImpressions: number
    googleClicks: number
    googleCtr: number
    googleAvgPosition: number
    aiMentions: number
    aiCitationRate: string
  }
  comparison: {
    googleVsAi: string
    correlation: string
    insight: string
  }
  aiVsGoogleCards: {
    title: string
    value: string
    change: string
    changeDirection: 'up' | 'down'
    description: string
    color: string
  }[]
  performanceChart: {
    date: string
    impressions: number
    clicks: number
    aiMentions: number
  }[]
  topCorrelatedPages: {
    url: string
    googlePosition: number
    aiCited: boolean
    aiEngines: string[]
    correlation: string
  }[]
}

// ── Mini Sparkline ──────────────────────────────────────────
function MiniSparkline({ data, color = '#10b981', width = 140, height = 36 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 6) - 3
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 6) - 3} r="2.5" fill={color} />
    </svg>
  )
}

// ── Change Indicator ────────────────────────────────────────
function ChangeIndicator({ value, direction }: { value: string; direction: 'up' | 'down' }) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
        <ArrowUpRight className="w-3 h-3" />
        {value}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-rose-400 text-xs font-semibold">
      <ArrowDownRight className="w-3 h-3" />
      {value}
    </span>
  )
}

// ── GSC Connect Dialog ──────────────────────────────────────
function GSCConnectDialog({ onConnect, domain }: { onConnect: (data: GSCData) => void; domain?: string }) {
  const [siteUrl, setSiteUrl] = useState(domain || '')
  const [accessToken, setAccessToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const handleConnect = async () => {
    if (!siteUrl.trim()) {
      setError('Please enter your website URL')
      return
    }
    if (!accessToken.trim()) {
      setError('Please enter your GSC access token')
      return
    }

    setError('')
    setConnecting(true)

    try {
      const response = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: siteUrl.trim(), accessToken: accessToken.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection failed')
      }

      onConnect(data)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect GSC')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300"
        >
          <Globe className="w-4 h-4 mr-2" />
          Connect Google Search Console
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Connect Google Search Console
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Link your GSC account to compare Google rankings with AI visibility
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Website URL</label>
            <Input
              value={siteUrl}
              onChange={(e) => { setSiteUrl(e.target.value); setError('') }}
              placeholder="https://example.com"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">GSC Access Token</label>
            <Input
              value={accessToken}
              onChange={(e) => { setAccessToken(e.target.value); setError('') }}
              placeholder="Paste your Google OAuth access token"
              type="password"
              className="bg-white/5 border-white/10"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For demo purposes, any token will work — we&apos;ll generate realistic mock data
            </p>
          </div>

          {error && (
            <p className="text-rose-400 text-sm">{error}</p>
          )}

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Why connect GSC?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  See how your Google rankings correlate with AI visibility. Pages ranking #1-3 are 3X more likely to be cited by AI engines.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect GSC
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main GSCPanel Component ─────────────────────────────────
interface GSCPanelProps {
  domain?: string
  onConnect?: () => void
}

export default function GSCPanel({ domain, onConnect }: GSCPanelProps) {
  const [gscData, setGscData] = useState<GSCData | null>(null)
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '28d' | '90d'>('28d')
  const [loadingComparison, setLoadingComparison] = useState(false)

  const handleConnect = async (data: GSCData) => {
    setGscData(data)
    onConnect?.()
    // Automatically fetch comparison data
    await fetchComparisonData(data.domain, selectedPeriod)
  }

  const fetchComparisonData = async (dom: string, period: string) => {
    setLoadingComparison(true)
    try {
      const response = await fetch(`/api/gsc/data?domain=${encodeURIComponent(dom)}&period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setComparisonData(data)
      }
    } catch {
      // Silently handle
    } finally {
      setLoadingComparison(false)
    }
  }

  const handlePeriodChange = async (period: '7d' | '28d' | '90d') => {
    setSelectedPeriod(period)
    if (gscData) {
      await fetchComparisonData(gscData.domain, period)
    }
  }

  // ── Not Connected State ────────────────────────────────
  if (!gscData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-cyan-500/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Google Search Console Integration</h3>
              <p className="text-muted-foreground mb-6">
                Connect your GSC account to see how your Google rankings correlate with AI visibility.
                Discover which pages are cited by AI engines and optimize for both search & AI.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-2xl font-bold text-emerald-400">3X</p>
                  <p className="text-[10px] text-muted-foreground">Top 3 rankings = 3x AI citations</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-2xl font-bold text-cyan-400">AI + G</p>
                  <p className="text-[10px] text-muted-foreground">Dual visibility correlation</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-2xl font-bold text-amber-400">12%</p>
                  <p className="text-[10px] text-muted-foreground">AI citation rate for top pages</p>
                </div>
              </div>

              <GSCConnectDialog onConnect={handleConnect} domain={domain} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ── Connected State ────────────────────────────────────
  const impressionsData = gscData.performanceOverTime.map(d => d.impressions)
  const clicksData = gscData.performanceOverTime.map(d => d.clicks)

  return (
    <div className="space-y-6">
      {/* Connection Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-cyan-500/10 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">GSC Connected: <span className="text-emerald-400">{gscData.domain}</span></h3>
                  <p className="text-xs text-muted-foreground">Connected {new Date(gscData.connectedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Period Selector */}
                {(['7d', '28d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedPeriod === period
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-muted-foreground border border-white/10 hover:text-foreground'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI vs Google Comparison Cards */}
      {comparisonData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {comparisonData.aiVsGoogleCards.map((card, i) => (
              <Card key={i} className="bg-white/[0.03] border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: card.color }} />
                    <span className="text-xs text-muted-foreground">{card.title}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">{card.value}</span>
                    <ChangeIndicator value={card.change} direction={card.changeDirection} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Insight Banner */}
      {comparisonData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="bg-gradient-to-r from-cyan-500/10 via-background to-amber-500/10 border-cyan-500/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Google &times; AI Correlation</h4>
                  <p className="text-sm text-muted-foreground">{comparisonData.comparison.googleVsAi}</p>
                  <p className="text-xs text-amber-400 mt-2 font-medium">{comparisonData.comparison.correlation}</p>
                  <p className="text-xs text-muted-foreground mt-1">{comparisonData.comparison.insight}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-white/[0.03] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Search Performance</h4>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded bg-emerald-500" />
                  <span className="text-muted-foreground">Impressions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded bg-cyan-500" />
                  <span className="text-muted-foreground">Clicks</span>
                </div>
                {comparisonData && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1 rounded bg-amber-500" />
                    <span className="text-muted-foreground">AI Mentions</span>
                  </div>
                )}
              </div>
            </div>

            {/* Simple bar chart for the last 14 days */}
            <div className="flex items-end gap-1 h-32">
              {gscData.performanceOverTime.slice(-14).map((day, i) => {
                const maxImp = Math.max(...gscData.performanceOverTime.slice(-14).map(d => d.impressions))
                const impHeight = (day.impressions / maxImp) * 100
                const maxClk = Math.max(...gscData.performanceOverTime.slice(-14).map(d => d.clicks))
                const clkHeight = (day.clicks / maxClk) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                    <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '128px', justifyContent: 'flex-end' }}>
                      <div
                        className="w-full bg-emerald-500/40 rounded-t-sm min-h-[2px]"
                        style={{ height: `${impHeight}%`, maxHeight: '80px' }}
                        title={`${day.date}: ${day.impressions} impressions`}
                      />
                      <div
                        className="w-full bg-cyan-500/60 rounded-t-sm min-h-[2px]"
                        style={{ height: `${clkHeight}%`, maxHeight: '30px' }}
                        title={`${day.date}: ${day.clicks} clicks`}
                      />
                    </div>
                    {i % 2 === 0 && (
                      <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                        {day.date.slice(5)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Sparklines */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Impressions Trend</p>
                <MiniSparkline data={impressionsData} color="#10b981" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Clicks Trend</p>
                <MiniSparkline data={clicksData} color="#06b6d4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Queries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-white/[0.03] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Top Queries</h4>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                  {gscData.topQueries.length}
                </Badge>
              </div>
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                <Eye className="w-3 h-3 mr-1" />
                AI Citation Status
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(16,185,129,0.3) transparent' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-3">Query</th>
                    <th className="text-right text-xs text-muted-foreground font-medium pb-2 px-2">Impressions</th>
                    <th className="text-right text-xs text-muted-foreground font-medium pb-2 px-2">Clicks</th>
                    <th className="text-right text-xs text-muted-foreground font-medium pb-2 px-2">CTR</th>
                    <th className="text-right text-xs text-muted-foreground font-medium pb-2 px-2">Position</th>
                    <th className="text-center text-xs text-muted-foreground font-medium pb-2 pl-2">AI Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gscData.topQueries.map((q, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-3">
                        <span className="text-sm font-medium">{q.query}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-sm text-muted-foreground">{q.impressions.toLocaleString()}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-sm text-muted-foreground">{q.clicks.toLocaleString()}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-sm text-muted-foreground">{q.ctr.toFixed(1)}%</span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className={`text-sm font-medium ${q.position <= 3 ? 'text-emerald-400' : q.position <= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {q.position.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 text-center">
                        {q.aiCitation ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                              AI Cited
                            </Badge>
                            <span className="text-[8px] text-cyan-400/60">{q.aiEngines.join(', ')}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-white/20 text-muted-foreground">
                            <XCircle className="w-2.5 h-2.5 mr-0.5" />
                            Not Cited
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Indexing & Crawl Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Indexing Status */}
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Indexing Status</h4>
              </div>

              {/* Coverage bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Coverage</span>
                  <span className="text-xs font-bold text-emerald-400">{gscData.indexingStatus.coverage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${gscData.indexingStatus.coverage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/5 rounded-lg p-2.5 border border-emerald-500/10 text-center">
                  <p className="text-lg font-bold text-emerald-400">{gscData.indexingStatus.indexedPages}</p>
                  <p className="text-[10px] text-muted-foreground">Indexed</p>
                </div>
                <div className="bg-amber-500/5 rounded-lg p-2.5 border border-amber-500/10 text-center">
                  <p className="text-lg font-bold text-amber-400">{gscData.indexingStatus.pendingPages}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                <div className="bg-rose-500/5 rounded-lg p-2.5 border border-rose-500/10 text-center">
                  <p className="text-lg font-bold text-rose-400">{gscData.indexingStatus.excludedPages}</p>
                  <p className="text-[10px] text-muted-foreground">Excluded</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 text-center">
                  <p className="text-lg font-bold">{gscData.indexingStatus.totalPages}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crawl Errors */}
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-sm">Crawl Errors</h4>
                <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400">
                  {gscData.crawlErrors.length}
                </Badge>
              </div>

              {gscData.crawlErrors.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-400 font-medium">No crawl errors detected</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(239,68,68,0.3) transparent' }}>
                  {gscData.crawlErrors.map((error, i) => (
                    <div key={i} className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/10">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{error.url}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-rose-300">{error.type}</span>
                            <span className="text-[10px] text-muted-foreground">&middot; {error.occurrences} occurrences</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Last crawled: {error.lastCrawled}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Top Correlated Pages (from comparison data) */}
      {comparisonData && comparisonData.topCorrelatedPages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-white/[0.03] border-white/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">Rank &times; AI Citation Correlation</h4>
              </div>

              <div className="space-y-2">
                {comparisonData.topCorrelatedPages.map((page, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                          page.correlation === 'strong' ? 'bg-emerald-500/20' :
                          page.correlation === 'moderate' ? 'bg-amber-500/20' : 'bg-white/5'
                        }`}>
                          {page.correlation === 'strong' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : page.correlation === 'moderate' ? (
                            <Minus className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{page.url}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">Position: <span className={page.googlePosition <= 3 ? 'text-emerald-400' : page.googlePosition <= 10 ? 'text-amber-400' : 'text-rose-400'}>#{page.googlePosition.toFixed(1)}</span></span>
                            {page.aiCited && (
                              <span className="text-[10px] text-cyan-400">Cited by: {page.aiEngines.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ml-2 ${
                        page.correlation === 'strong' ? 'border-emerald-500/30 text-emerald-400' :
                        page.correlation === 'moderate' ? 'border-amber-500/30 text-amber-400' :
                        'border-white/20 text-muted-foreground'
                      }`}>
                        {page.correlation}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                <p className="text-xs text-emerald-400">
                  <strong>Key Finding:</strong> Pages in Google positions 1-3 have a <strong>12.4%</strong> AI citation rate vs only <strong>0.8%</strong> for pages ranking 11+. Improving your Google rankings directly boosts AI visibility.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading comparison overlay */}
      <AnimatePresence>
        {loadingComparison && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 bg-card border border-emerald-500/20 rounded-xl p-4 shadow-xl flex items-center gap-3"
          >
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading GSC comparison data...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
