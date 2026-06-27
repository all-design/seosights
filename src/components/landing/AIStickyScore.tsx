'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Eye,
  Gauge,
  Minus,
  Monitor,
  Pin,
  Plus,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface AIStickyScoreProps {
  onStartFree?: () => void
}

// ── Mock Data ─────────────────────────────────────────────────
const SCORE = { current: 71, yesterday: 68, delta: 3 }

const SPARKLINE_DATA = [62, 64, 63, 66, 65, 68, 67, 69, 71]

// Mock dashboard sections to simulate scrolling
const DASHBOARD_SECTIONS = [
  { id: 'overview', title: 'Overview', icon: Gauge, color: 'text-emerald-400' },
  { id: 'citations', title: 'Citation Tracker', icon: Eye, color: 'text-purple-400' },
  { id: 'competitors', title: 'Competitor Analysis', icon: Users, color: 'text-amber-400' },
  { id: 'performance', title: 'Performance', icon: BarChart3, color: 'text-cyan-400' },
]

// ── Sparkline Component ───────────────────────────────────────
function MiniSparkline({ data, width = 80, height = 28 }: { data: number[]; width?: number; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#sparkGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle
        cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
        r="2.5"
        fill="#10b981"
      />
    </svg>
  )
}

// ── Sticky Widget Component ───────────────────────────────────
function StickyWidget({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8, y: visible ? 0 : 10 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-4 right-4 z-30 w-52"
    >
      <div className="rounded-xl border border-emerald-500/30 bg-[#0d1117]/95 backdrop-blur-xl shadow-xl shadow-black/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">AI Visibility</span>
          <Pin className="h-3 w-3 text-emerald-400" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">{SCORE.current}</span>
          <span className="text-xs font-mono text-white/30 mb-1">/100</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-400">
            <TrendingUp className="h-2.5 w-2.5" />
            +{SCORE.delta}
          </span>
          <span className="text-[9px] text-white/30">vs yesterday</span>
        </div>
        <div className="mt-2">
          <MiniSparkline data={SPARKLINE_DATA} width={160} height={24} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function AIStickyScore({ onStartFree }: AIStickyScoreProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [activeSection, setActiveSection] = useState(0)
  const [widgetVisible, setWidgetVisible] = useState(false)

  // Simulate scrolling through dashboard sections
  useEffect(() => {
    if (!isInView) return

    const timer = setInterval(() => {
      setActiveSection(prev => {
        const next = prev + 1
        if (next >= DASHBOARD_SECTIONS.length) {
          clearInterval(timer)
          return prev
        }
        return next
      })
    }, 1800)

    // Show widget after a short delay
    const widgetTimer = setTimeout(() => setWidgetVisible(true), 800)

    return () => {
      clearInterval(timer)
      clearTimeout(widgetTimer)
    }
  }, [isInView])

  return (
    <section ref={ref} className="relative w-full py-16 md:py-24 overflow-hidden bg-[#0a0a0f]">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gradient glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            <Pin className="h-3.5 w-3.5" />
            ALWAYS VISIBLE
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Sticky AI Visibility{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Score
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
            Your score follows you everywhere. No matter where you are in the dashboard, your AI Visibility Score stays pinned and updated in real-time.
          </p>
        </motion.div>

        {/* Feature Preview: Mock Dashboard with Sticky Widget */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1 text-[10px] text-white/30 font-mono">
                    <Monitor className="h-3 w-3" />
                    app.seosights.io/dashboard
                  </div>
                </div>
              </div>

              {/* Mock dashboard content with sticky widget */}
              <div className="relative min-h-[340px] sm:min-h-[400px] bg-[#0d1117]">
                {/* Sidebar mock */}
                <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-12 border-r border-white/5 bg-white/[0.01]">
                  <div className="flex flex-col items-center gap-3 py-4">
                    {DASHBOARD_SECTIONS.map((section, i) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(i)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          activeSection === i
                            ? 'bg-white/10 text-white/80'
                            : 'text-white/20 hover:text-white/40'
                        }`}
                      >
                        <section.icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main content area */}
                <div className="sm:ml-12 p-4 sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        {(() => {
                          const Icon = DASHBOARD_SECTIONS[activeSection].icon
                          return <Icon className={`h-4 w-4 ${DASHBOARD_SECTIONS[activeSection].color}`} />
                        })()}
                        <span className="text-sm font-semibold text-white/80">
                          {DASHBOARD_SECTIONS[activeSection].title}
                        </span>
                      </div>

                      {/* Mock content blocks */}
                      <div className="space-y-3">
                        <div className="h-20 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                          <span className="text-xs text-white/20 font-mono">Chart Area</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[1, 2, 3].map(n => (
                            <div key={n} className="h-14 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                              <span className="text-[10px] text-white/15 font-mono">Metric {n}</span>
                            </div>
                          ))}
                        </div>
                        <div className="h-24 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                          <span className="text-xs text-white/20 font-mono">Data Table</span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Sticky Widget — the star of the show */}
                <StickyWidget visible={widgetVisible} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Pin,
              title: 'Always Pinned',
              description: 'Score stays in the corner no matter where you navigate in the dashboard.',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              icon: TrendingUp,
              title: 'Real-time Updates',
              description: 'Score updates live as new citations are found or rankings change.',
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
            },
            {
              icon: BarChart3,
              title: 'Mini Sparkline',
              description: 'See 7-day trend at a glance without leaving your current view.',
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
            >
              <Card className={`border ${feature.bg} bg-white/[0.02] backdrop-blur-xl h-full`}>
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${feature.bg} flex items-center justify-center mb-3`}>
                    <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-white/90 mb-1">{feature.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Inline Widget Preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="mt-8 flex justify-center"
        >
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117]/80 backdrop-blur-xl shadow-xl shadow-black/30 p-4 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Widget Preview</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-bold font-mono text-emerald-400">{SCORE.current}</span>
                  <span className="text-sm font-mono text-white/30 mb-1">/100</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Plus className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs font-mono text-emerald-400">{SCORE.delta} from yesterday</span>
                </div>
              </div>
              <MiniSparkline data={SPARKLINE_DATA} width={100} height={32} />
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onStartFree}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 text-base"
          >
            Track Your Score Live
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/30">
            <ArrowRight className="h-3 w-3" />
            No credit card required
          </div>
        </motion.div>
      </div>
    </section>
  )
}
