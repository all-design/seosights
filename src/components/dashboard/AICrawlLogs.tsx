'use client'

import { useState, useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import {
  Bug, Radar, Activity, AlertTriangle, CheckCircle2, XCircle,
  Clock, Filter, ArrowUp, Zap, Wrench,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────
type BotStatus = 'allowed' | 'blocked' | 'restricted'
type BotName = 'GPTBot' | 'ClaudeBot' | 'PerplexityBot' | 'Googlebot' | 'Bytespider' | 'Applebot'

interface Summary { totalVisits: number; allowedBots: number; blockedBots: number; trend: number }
interface BotInfo { name: BotName; status: BotStatus; lastSeen: string; visitCount: number; color: string }
interface LogEntry { time: string; bot: BotName; ip: string; path: string; status: number; responseTime: number; userAgent: string }
interface CrawlAlert { bot: BotName; message: string; severity: 'critical' | 'warning' | 'info' }
interface CrawlData { summary: Summary; bots: BotInfo[]; logs: LogEntry[]; alerts: CrawlAlert[] }

// ── Static mock data (last 24h, realistic) ─────────────
const BOT_COLORS: Record<BotName, string> = {
  GPTBot: '#10b981',
  ClaudeBot: '#fb923c',
  PerplexityBot: '#2dd4bf',
  Googlebot: '#fbbf24',
  Bytespider: '#fb7185',
  Applebot: '#a1a1aa',
}

const USER_AGENTS: Record<BotName, string> = {
  GPTBot: 'GPTBot/1.2; +https://openai.com/gptbot',
  ClaudeBot: 'ClaudeBot/1.0; +mailto:bot@anthropic.com',
  PerplexityBot: 'PerplexityBot/1.0; +https://docs.perplexity.ai/docs/bot',
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bytespider: 'Bytespider; spider-feedback@bytedance.com',
  Applebot: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Applebot/0.1; +http://www.apple.com/go/applebot',
}

const isoMinus = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

const MOCK_DATA: CrawlData = {
  summary: { totalVisits: 1247, allowedBots: 3, blockedBots: 3, trend: 18 },
  bots: [
    { name: 'GPTBot', status: 'blocked', lastSeen: isoMinus(14), visitCount: 312, color: BOT_COLORS.GPTBot },
    { name: 'ClaudeBot', status: 'allowed', lastSeen: isoMinus(2), visitCount: 387, color: BOT_COLORS.ClaudeBot },
    { name: 'PerplexityBot', status: 'allowed', lastSeen: isoMinus(8), visitCount: 256, color: BOT_COLORS.PerplexityBot },
    { name: 'Googlebot', status: 'allowed', lastSeen: isoMinus(1), visitCount: 412, color: BOT_COLORS.Googlebot },
    { name: 'Bytespider', status: 'blocked', lastSeen: isoMinus(184), visitCount: 89, color: BOT_COLORS.Bytespider },
    { name: 'Applebot', status: 'blocked', lastSeen: isoMinus(57), visitCount: 67, color: BOT_COLORS.Applebot },
  ],
  logs: [
    { time: isoMinus(1), bot: 'Googlebot', ip: '66.249.66.91', path: '/', status: 200, responseTime: 124, userAgent: USER_AGENTS.Googlebot },
    { time: isoMinus(2), bot: 'ClaudeBot', ip: '54.241.140.121', path: '/blog/aeo-guide', status: 200, responseTime: 211, userAgent: USER_AGENTS.ClaudeBot },
    { time: isoMinus(3), bot: 'Googlebot', ip: '66.249.66.144', path: '/pricing', status: 200, responseTime: 98, userAgent: USER_AGENTS.Googlebot },
    { time: isoMinus(8), bot: 'PerplexityBot', ip: '54.161.81.16', path: '/blog/geo-optimization', status: 200, responseTime: 167, userAgent: USER_AGENTS.PerplexityBot },
    { time: isoMinus(14), bot: 'GPTBot', ip: '20.171.207.45', path: '/blog/ai-search-ranking', status: 403, responseTime: 12, userAgent: USER_AGENTS.GPTBot },
    { time: isoMinus(22), bot: 'ClaudeBot', ip: '54.241.140.122', path: '/llms.txt', status: 200, responseTime: 41, userAgent: USER_AGENTS.ClaudeBot },
    { time: isoMinus(31), bot: 'Googlebot', ip: '66.249.66.92', path: '/sitemap.xml', status: 200, responseTime: 67, userAgent: USER_AGENTS.Googlebot },
    { time: isoMinus(48), bot: 'GPTBot', ip: '20.171.207.46', path: '/', status: 403, responseTime: 9, userAgent: USER_AGENTS.GPTBot },
    { time: isoMinus(57), bot: 'Applebot', ip: '17.121.112.18', path: '/docs/schema-markup', status: 403, responseTime: 11, userAgent: USER_AGENTS.Applebot },
    { time: isoMinus(74), bot: 'PerplexityBot', ip: '54.161.81.17', path: '/case-studies/ai-search', status: 200, responseTime: 189, userAgent: USER_AGENTS.PerplexityBot },
    { time: isoMinus(123), bot: 'ClaudeBot', ip: '54.241.140.123', path: '/faq', status: 200, responseTime: 88, userAgent: USER_AGENTS.ClaudeBot },
    { time: isoMinus(184), bot: 'Bytespider', ip: '110.53.92.41', path: '/blog/geo-optimization', status: 403, responseTime: 14, userAgent: USER_AGENTS.Bytespider },
  ],
  alerts: [
    { bot: 'GPTBot', message: 'GPTBot is BLOCKED by your robots.txt — ChatGPT cannot read your site.', severity: 'critical' },
    { bot: 'Bytespider', message: 'Bytespider is blocked. ByteDance AI search (Douyin AI) cannot access your content.', severity: 'warning' },
    { bot: 'Applebot', message: 'Applebot is blocked. Apple Intelligence & Siri summaries cannot access your content.', severity: 'info' },
  ],
}

// ── Helpers ────────────────────────────────────────────
function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

function statusBadgeClass(status: number): string {
  if (status >= 200 && status < 300) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (status === 403) return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  if (status === 404) return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  return 'bg-white/10 text-muted-foreground border-white/20'
}

// Mini sparkline — +18% trend over 30 days
function Sparkline({ color = '#10b981' }: { color?: string }) {
  const vals = [42, 45, 41, 48, 52, 50, 55, 58, 54, 62, 65, 60, 68, 72, 70, 75, 78, 74, 82, 85, 80, 88, 92, 89, 95, 99, 96, 103, 108, 112]
  const w = 80, h = 24, max = Math.max(...vals), min = Math.min(...vals)
  const span = Math.max(1, max - min)
  const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity={0.15} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

type Accent = 'purple' | 'emerald' | 'rose' | 'amber'
const ACCENT_CLASS: Record<Accent, string> = {
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

// ── KPI subcomponent ───────────────────────────────────
function KpiCard({ label, value, icon, accent, delay, extra, isInView }: {
  label: string
  value: string
  icon: React.ReactNode
  accent: Accent
  delay: number
  extra?: React.ReactNode
  isInView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${ACCENT_CLASS[accent]}`}>{icon}</div>
        {extra}
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{label}</div>
    </motion.div>
  )
}

// ── Bot status subcomponent ────────────────────────────
function BotStatusCard({ bot, delay, isInView }: { bot: BotInfo; delay: number; isInView: boolean }) {
  const badge =
    bot.status === 'allowed' ? (
      <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[9px] px-1.5 py-0">
        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Allowed
      </Badge>
    ) : bot.status === 'restricted' ? (
      <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-[9px] px-1.5 py-0">
        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Restricted
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-rose-500/10 border-rose-500/30 text-rose-400 text-[9px] px-1.5 py-0">
        <XCircle className="w-2.5 h-2.5 mr-0.5" />Blocked
      </Badge>
    )
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.35 }}
      className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="relative flex h-2 w-2 shrink-0">
          {bot.status === 'allowed' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: bot.color }} />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: bot.color }} />
        </span>
        <span className="text-xs font-semibold text-foreground truncate">{bot.name}</span>
      </div>
      <div className="mb-1.5">{badge}</div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="w-2.5 h-2.5" /><span>{relativeTime(bot.lastSeen)}</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        <span className="text-foreground font-semibold tabular-nums">{bot.visitCount.toLocaleString()}</span> visits
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────
export default function AICrawlLogs({ url }: { url?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeBot, setActiveBot] = useState<'All' | BotName>('All')
  const data = MOCK_DATA

  const filteredLogs = useMemo(() => {
    if (activeBot === 'All') return data.logs
    return data.logs.filter((l) => l.bot === activeBot)
  }, [activeBot, data.logs])

  const blockedAlerts = data.alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning')
  const filterPills: ('All' | BotName)[] = ['All', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot', 'Bytespider', 'Applebot']

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
      <Card className="border-white/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        <CardContent className="px-4 sm:px-6 py-5 sm:py-6 space-y-5">
          {/* ── Header ───────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Radar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 flex-wrap">
                  AI Crawl Logs
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-[10px]">
                    <Activity className="w-3 h-3 mr-1" />LIVE
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">See when AI models crawl your site</p>
                {url && <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{url}</p>}
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-foreground hover:bg-white/10 self-start sm:self-auto">
              <Filter className="w-3.5 h-3.5 mr-1.5" />Last 24h
            </Button>
          </div>

          {/* ── Blocked alert banners ────────────────── */}
          {blockedAlerts.map((alert, i) => (
            <motion.div
              key={alert.bot}
              initial={{ opacity: 0, y: -8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-100">{alert.message}</p>
              </div>
              <Button size="sm" className="bg-rose-500 hover:bg-rose-400 text-white shrink-0">
                <Wrench className="w-3.5 h-3.5 mr-1.5" />Fix Now
              </Button>
            </motion.div>
          ))}

          {/* ── KPI row ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total AI Bot Visits (30d)" value={data.summary.totalVisits.toLocaleString()} icon={<Bug className="w-4 h-4" />} accent="purple" delay={0.1} isInView={isInView} />
            <KpiCard label="Allowed Bots" value={`${data.summary.allowedBots} of 6`} icon={<CheckCircle2 className="w-4 h-4" />} accent="emerald" delay={0.16} isInView={isInView} />
            <KpiCard label="Blocked Bots" value={`${data.summary.blockedBots} of 6`} icon={<XCircle className="w-4 h-4" />} accent="rose" delay={0.22} isInView={isInView} />
            <KpiCard label="Crawl Trend" value={`+${data.summary.trend}%`} icon={<ArrowUp className="w-4 h-4" />} accent="emerald" delay={0.28} isInView={isInView} extra={<Sparkline color="#10b981" />} />
          </div>

          {/* ── Filter pills ─────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Filter:</span>
            {filterPills.map((p) => {
              const isActive = activeBot === p
              const color = p === 'All' ? '#a855f7' : BOT_COLORS[p as BotName]
              return (
                <button
                  key={p}
                  onClick={() => setActiveBot(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                    isActive ? '' : 'text-muted-foreground hover:text-foreground bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={isActive ? { backgroundColor: `${color}25`, borderColor: `${color}66`, color } : undefined}
                >
                  {p}
                </button>
              )
            })}
          </div>

          {/* ── Bot status row ───────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {data.bots.map((bot, i) => (
              <BotStatusCard key={bot.name} bot={bot} delay={0.3 + i * 0.04} isInView={isInView} />
            ))}
          </div>

          {/* ── Log table ────────────────────────────── */}
          <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Crawl Log
                {activeBot !== 'All' && <span className="text-muted-foreground font-normal">· filtered: {activeBot}</span>}
              </h4>
              <span className="text-[10px] text-muted-foreground">{filteredLogs.length} entries</span>
            </div>
            <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(168,85,247,0.4) transparent' }}>
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">Time</TableHead>
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">Bot</TableHead>
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">IP</TableHead>
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">Path</TableHead>
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">Response</TableHead>
                    <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider">User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                        No crawl entries for {activeBot}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, i) => (
                      <motion.tr
                        key={`${log.time}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.03, duration: 0.3 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono">{shortTime(log.time)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BOT_COLORS[log.bot] }} />
                            {log.bot}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{log.ip}</TableCell>
                        <TableCell className="text-xs text-foreground font-mono max-w-[200px] truncate" title={log.path}>{log.path}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusBadgeClass(log.status)}`}>
                            {log.status >= 200 && log.status < 300 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : log.status === 403 ? <XCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                            {log.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {log.responseTime}<span className="text-muted-foreground/60 ml-0.5">ms</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono max-w-[260px] truncate" title={log.userAgent}>{log.userAgent}</TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────── */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-purple-400" /><span>Auto-refreshes every 60s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Streaming from server logs</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
