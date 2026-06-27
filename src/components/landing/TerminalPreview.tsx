'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Bot,
  Radio,
  Clock,
} from 'lucide-react'

// ─── Mock data ───────────────────────────────────────────────────────────
// 30-day trend ending at 72 — used by the big sparkline in Panel A.
const SPARK_30D = [
  55, 56, 58, 57, 59, 60, 62, 61, 63, 65, 64, 66, 67, 65, 68, 69, 67, 70,
  71, 69, 72, 70, 73, 71, 74, 72, 75, 73, 71, 72,
]

// 7-day citation velocity — last value = today.
const CITATIONS_7D = [3, 5, 4, 6, 7, 5, 8]
const CIT_MAX = Math.max(...CITATIONS_7D)
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Faux live crawler log + prompt rankings.
const CRAWL_LOG: { bot: string; path: string; time: string; status: 'ok' | 'blocked' }[] = [
  { bot: 'GPTBot', path: '/pricing', time: '2:31pm', status: 'ok' },
  { bot: 'ClaudeBot', path: '/blog/llms-txt', time: '2:29pm', status: 'ok' },
  { bot: 'PerplexityBot', path: '/robots.txt', time: '2:28pm', status: 'blocked' },
  { bot: 'Google-Extended', path: '/', time: '2:25pm', status: 'ok' },
]
const PROMPTS: { prompt: string; rank: number | null }[] = [
  { prompt: 'best crm for startups', rank: 2 },
  { prompt: 'crm for small business', rank: 5 },
  { prompt: 'affordable crm', rank: null },
]

// Entity-authority side metadata.
const ENTITY_META = [
  { label: 'Wikipedia', value: 'Yes', tone: 'text-emerald-400' },
  { label: 'Wikidata', value: 'Yes', tone: 'text-emerald-400' },
  { label: 'Crunchbase', value: 'No', tone: 'text-rose-400' },
  { label: 'Knowledge Graph', value: 'Linked', tone: 'text-purple-400' },
]

// ─── Hand-coded sparkline SVG ────────────────────────────────────────────
function Sparkline({
  data, color, w = 240, h = 52,
}: { data: number[]; color: string; w?: number; h?: number }) {
  const pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const pts = data.map((v, i) => {
    const x = pad + (innerW * i) / (data.length - 1)
    const y = pad + innerH - ((v - min) / range) * innerH
    return [x, y] as [number, number]
  })

  // Smooth cubic-bezier path
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx.toFixed(2)} ${y0.toFixed(2)}, ${cx.toFixed(2)} ${y1.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }

  const last = pts[pts.length - 1]
  const area = `${d} L ${last[0].toFixed(2)} ${h - pad} L ${pts[0][0].toFixed(2)} ${h - pad} Z`

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  )
}

// ─── Hand-coded radial gauge (half-arc) ──────────────────────────────────
function RadialGauge({
  value, color, size = 110,
}: { value: number; color: string; size?: number }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const arcLen = Math.PI * r // half-circle
  const dash = (value / 100) * arcLen
  const halfH = size / 2 + 14
  return (
    <svg width={size} height={halfH} viewBox={`0 0 ${size} ${halfH}`}>
      <path
        d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${arcLen * 2}`}
      />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fill={color}
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        style={{ fontSize: 8, letterSpacing: 1 }}
      >
        /100
      </text>
    </svg>
  )
}

// ─── Panel wrapper ───────────────────────────────────────────────────────
function Panel({
  label, children, className = '',
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-slate-950/60 border border-white/5 rounded-lg p-3 ${className}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
        <span className="inline-block w-1 h-1 rounded-full bg-purple-500/70" />
        {label}
      </div>
      {children}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────
export default function TerminalPreview({ onStartFree }: { onStartFree?: () => void }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Live clock — start null to avoid SSR/client hydration mismatch.
  const [now, setNow] = useState<Date | null>(null)
  // Subtly ticking numbers.
  const [score, setScore] = useState(72)
  const [todayCites, setTodayCites] = useState(8)

  useEffect(() => {
    // Set initial time on client to avoid hydration mismatch (server has no clock)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      setScore((s) =>
        Math.max(68, Math.min(76, s + (Math.random() > 0.5 ? 1 : -1)))
      )
      setTodayCites((c) =>
        Math.max(5, Math.min(11, c + (Math.random() > 0.5 ? 1 : -1)))
      )
    }, 3000)
    return () => clearInterval(tick)
  }, [])

  const timeStr = now
    ? now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : '--:--:--'

  return (
    <section className="py-24 relative" ref={ref} id="terminal">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-slate-950/40 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/8 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Radio className="w-3.5 h-3.5" />
            The Terminal
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            The Bloomberg Terminal for{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              AI Visibility.
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            One screen. Every signal that decides whether AI recommends you.
            Live crawl logs, citation velocity, entity authority, prompt
            rankings, competitor gaps — all in one operating system.
          </p>
        </motion.div>

        {/* Terminal card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-6xl mx-auto"
        >
          <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.12)]">
            {/* ── Top bar (window chrome) ── */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-slate-900/80">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 min-w-0 text-xs text-muted-foreground font-mono truncate">
                seosights — AI Visibility Terminal — Acme Inc.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </div>
                <motion.div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30"
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 font-mono">
                    LIVE
                  </span>
                </motion.div>
              </div>
            </div>

            {/* ── Grid body ── */}
            <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Panel A — AI Visibility Score (spans 2 cols) */}
              <Panel
                label="AI Visibility Score"
                className="md:col-span-2"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="shrink-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-bold text-purple-400 font-mono tabular-nums leading-none">
                        {score}
                      </span>
                      <span className="text-lg text-muted-foreground font-mono">
                        /100
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                        <TrendingUp className="w-3 h-3" /> +4
                      </span>
                      <span className="text-muted-foreground">30-day trend</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <Sparkline data={SPARK_30D} color="#a855f7" />
                  </div>
                </div>
              </Panel>

              {/* Panel B — Citation Velocity */}
              <Panel label="Citation Velocity">
                <div className="flex items-end gap-3">
                  <div className="shrink-0">
                    <div className="text-3xl font-bold text-amber-400 font-mono tabular-nums leading-none">
                      {todayCites}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      today
                    </div>
                  </div>
                  <div className="flex-1 flex items-end gap-1 h-12">
                    {CITATIONS_7D.map((v, i) => {
                      const isToday = i === CITATIONS_7D.length - 1
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div className="w-full flex items-end h-9">
                            <div
                              className={`w-full rounded-sm ${
                                isToday ? 'bg-amber-400' : 'bg-amber-500/40'
                              }`}
                              style={{
                                height: `${(v / CIT_MAX) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[8px] text-muted-foreground font-mono">
                            {DOW[i]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Panel>

              {/* Panel C — Live AI Crawl */}
              <Panel label="Live AI Crawl">
                <div className="space-y-1.5 font-mono text-[11px]">
                  {CRAWL_LOG.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 leading-tight"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          row.status === 'ok'
                            ? 'bg-emerald-400'
                            : 'bg-rose-400'
                        }`}
                      />
                      <span className="text-purple-300 truncate shrink-0">
                        {row.bot}
                      </span>
                      <span className="text-muted-foreground/70 shrink-0">
                        →
                      </span>
                      <span className="text-foreground/80 truncate flex-1 min-w-0">
                        {row.path}
                      </span>
                      <span className="text-muted-foreground/60 shrink-0">
                        {row.time}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Panel D — Prompt Rankings */}
              <Panel label="Prompt Rankings">
                <div className="space-y-1.5">
                  {PROMPTS.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="text-muted-foreground truncate flex-1 min-w-0">
                        {p.prompt}
                      </span>
                      {p.rank !== null ? (
                        <span className="font-mono font-bold text-emerald-400 shrink-0">
                          #{p.rank}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-rose-400/80 italic shrink-0">
                          not ranked
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Panel E — Top Competitor Gap */}
              <Panel label="Top Competitor Gap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      Notion
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                      <span className="font-mono font-bold text-rose-400">
                        +111
                      </span>
                      <span className="text-muted-foreground">citations</span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Panel F — Entity Authority (full width) */}
              <Panel
                label="Entity Authority"
                className="md:col-span-3"
              >
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="shrink-0">
                    <RadialGauge value={81} color="#a855f7" />
                  </div>
                  <div className="flex-1 min-w-[220px] grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ENTITY_META.map((m) => (
                      <div key={m.label}>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {m.label}
                        </div>
                        <div
                          className={`text-sm font-mono font-semibold ${m.tone}`}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 font-mono max-w-[200px] leading-relaxed">
                    Strong entity presence. Add a Crunchbase profile to close
                    the citation gap.
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-8">
            <Button
              size="lg"
              className="bg-purple-500 hover:bg-purple-400 text-black font-semibold text-base px-8 py-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
              onClick={onStartFree}
            >
              <Activity className="mr-2 w-4 h-4" />
              Get terminal access →
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
