'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore, type OSSection } from '@/lib/os-store'
import {
  Star, TrendingUp, Brain, FileText, Eye, Zap, Database, FlaskConical,
  Menu, X, ChevronLeft, LayoutDashboard, Code2, Briefcase, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────────────

type OSMode = 'executive' | 'builder' | 'developer'

interface Mission {
  action: string
  timeEstimate: string
  impact: string
  confidence: number
}

// ── Sidebar Config ──────────────────────────────────────────────────────

const sidebarItems: { key: OSSection; label: string; icon: React.ElementType }[] = [
  { key: 'today', label: 'Today', icon: Star },
  { key: 'growth', label: 'Growth', icon: TrendingUp },
  { key: 'learning', label: 'Learning', icon: Brain },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'insights', label: 'Insights', icon: Eye },
  { key: 'execute', label: 'Execute', icon: Zap },
  { key: 'memory', label: 'Memory', icon: Database },
  { key: 'experiments', label: 'Experiments', icon: FlaskConical },
]

const sectionLabels: Record<OSSection, string> = {
  today: 'Today',
  growth: 'Growth',
  learning: 'Learning',
  content: 'Content',
  insights: 'Insights',
  execute: 'Execute',
  memory: 'Memory',
  experiments: 'Experiments',
}

// ── Animated Score ──────────────────────────────────────────────────────

function AnimatedScore({ value, size = 'xl' }: { value: number; size?: string }) {
  const [displayed, setDisplayed] = useState(0)
  
  useEffect(() => {
    let start = 0
    const duration = 1200
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(2, -10 * progress)
      const current = Math.round(eased * value)
      setDisplayed(current)
      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [value])

  const sizeClass = size === 'xl' ? 'text-7xl' : size === 'lg' ? 'text-5xl' : 'text-3xl'

  return (
    <motion.span
      className={cn(sizeClass, 'font-bold text-emerald-400 tabular-nums')}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {displayed}
    </motion.span>
  )
}

// ── Morph Button ────────────────────────────────────────────────────────

function MorphButton({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleClick = async () => {
    setState('loading')
    setTimeout(() => setState('success'), 2000)
    setTimeout(() => setState('idle'), 4000)
    onClick()
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={cn(
        'px-8 py-3 rounded-xl font-semibold text-sm transition-all',
        state === 'idle' && 'bg-emerald-600 hover:bg-emerald-500 text-white',
        state === 'loading' && 'bg-emerald-600/80 text-emerald-200 cursor-wait',
        state === 'success' && 'bg-emerald-500 text-white',
        className
      )}
      layout
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{children}</motion.span>}
        {state === 'loading' && <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⟳</motion.span> Executing...</motion.span>}
        {state === 'success' && <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>Done ✓</motion.span>}
      </AnimatePresence>
    </motion.button>
  )
}

// ── Section Skeleton ────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-zinc-800" />
      <Skeleton className="h-4 w-96 bg-zinc-800" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-24 bg-zinc-800 rounded-lg" />
        <Skeleton className="h-24 bg-zinc-800 rounded-lg" />
        <Skeleton className="h-24 bg-zinc-800 rounded-lg" />
      </div>
      <Skeleton className="h-64 bg-zinc-800 rounded-lg mt-4" />
    </div>
  )
}

// ── Placeholder Page ────────────────────────────────────────────────────

function PlaceholderPage({ label, mode }: { label: string; mode: OSMode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Layers className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">{label}</h3>
      <p className="text-sm text-zinc-600 max-w-sm">
        {mode === 'executive'
          ? 'Key metrics and insights for this section.'
          : 'Full data and controls for this section.'}
      </p>
    </div>
  )
}

// ── TODAY PAGE — AI Executive Mode™ ────────────────────────────────────

function TodayPage() {
  const { mode } = useOSStore()
  const [data, setData] = useState<{
    greeting: string
    visibilityScore: number
    visibilityDelta: number
    riskAlert: string | null
    missions: Mission[]
    totalMinutes: number
    expectedImpact: string
    pipelineValue: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/content-engine/growth-brain')
        if (res.ok) {
          const json = await res.json()
          const missions: Mission[] = (json.missions || json.dailyBriefing?.topActions || []).slice(0, 3).map((m: { shortText?: string; text?: string; action?: string; effortMinutes?: number; effort?: string; estimatedImpact?: string; confidence?: number }) => ({
            action: m.shortText || m.text || m.action || '',
            timeEstimate: m.effortMinutes ? `${m.effortMinutes} min` : (m.effort || '15 min'),
            impact: m.estimatedImpact || '+3 AI Visibility',
            confidence: m.confidence || 80,
          }))
          
          const hour = new Date().getHours()
          const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.'
          
          setData({
            greeting,
            visibilityScore: json.growthScore || json.dailyBriefing?.context?.currentVisibility || 75,
            visibilityDelta: json.todayGrowth || json.dailyBriefing?.context?.visibilityDelta || 4,
            riskAlert: json.riskAlert || json.dailyBriefing?.riskAlert || null,
            missions,
            totalMinutes: missions.reduce((sum: number, m: Mission) => sum + parseInt(m.timeEstimate) || 15, 0),
            expectedImpact: json.expectedGain || '+6 AI Visibility',
            pipelineValue: '+$1,200 pipeline',
          })
        }
      } catch {
        // Fallback data
        setData({
          greeting: 'Good evening.',
          visibilityScore: 75,
          visibilityDelta: 4,
          riskAlert: null,
          missions: [
            { action: 'Publish FAQ for pricing page', timeEstimate: '15 min', impact: '+3 AI Visibility', confidence: 82 },
            { action: 'Create entity page for Seosights', timeEstimate: '20 min', impact: '+4 AI Visibility', confidence: 79 },
            { action: 'Update llms.txt with latest content', timeEstimate: '8 min', impact: '+2 AI Visibility', confidence: 74 },
          ],
          totalMinutes: 43,
          expectedImpact: '+6 AI Visibility',
          pipelineValue: '+$1,200 pipeline',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40 bg-zinc-800" />
        <Skeleton className="h-20 w-32 bg-zinc-800" />
        <Skeleton className="h-4 w-64 bg-zinc-800" />
        <div className="space-y-3 mt-8">
          <Skeleton className="h-12 bg-zinc-800 rounded-lg" />
          <Skeleton className="h-12 bg-zinc-800 rounded-lg" />
          <Skeleton className="h-12 bg-zinc-800 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-40 bg-zinc-800 rounded-xl mt-6" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-zinc-400 text-lg"
      >
        {data.greeting}
      </motion.p>

      {/* Visibility Score */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-end gap-3"
      >
        <AnimatedScore value={data.visibilityScore} />
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-emerald-400/80 text-lg font-medium pb-3"
        >
          +{data.visibilityDelta} today
        </motion.span>
      </motion.div>

      {/* Risk Alert */}
      {data.riskAlert && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <span className="text-amber-400 text-sm">⚠️</span>
          <p className="text-amber-200 text-sm">{data.riskAlert}</p>
        </motion.div>
      )}

      {/* Yesterday Summary (Builder mode) */}
      {mode !== 'executive' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Visibility', value: `${data.visibilityScore}`, delta: `+${data.visibilityDelta}` },
            { label: 'Citations', value: '27', delta: '+3' },
            { label: 'Articles', value: '2', delta: 'published' },
            { label: 'Pipeline', value: '$1.2K', delta: 'this week' },
          ].map((metric) => (
            <div key={metric.label} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <p className="text-xs text-zinc-600 mb-1">{metric.label}</p>
              <p className="text-lg font-semibold text-zinc-200">{metric.value}</p>
              <p className="text-xs text-emerald-400">{metric.delta}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <p className="text-zinc-300 text-sm leading-relaxed">
          If I were your Head of Growth today,
          <br />I'd spend exactly <span className="text-emerald-400 font-medium">{data.totalMinutes} minutes</span> doing these three things.
        </p>

        <div className="space-y-3 mt-4">
          {data.missions.map((mission, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group"
            >
              <span className="text-emerald-400 font-bold text-lg mt-0.5 shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-sm font-medium">{mission.action}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    🕐 {mission.timeEstimate}
                  </span>
                  <span className="text-xs text-emerald-400/70">→ {mission.impact}</span>
                  {mode !== 'executive' && (
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                      {mission.confidence}% confidence
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Expected Impact + Execute */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4"
      >
        <div>
          <p className="text-zinc-400 text-sm">Expected impact:</p>
          <p className="text-emerald-400 font-semibold">{data.expectedImpact}</p>
          <p className="text-emerald-400/60 text-sm">{data.pipelineValue}</p>
        </div>
        <MorphButton onClick={() => {}}>
          Execute
        </MorphButton>
      </motion.div>
    </div>
  )
}

// ── Main OS Page ────────────────────────────────────────────────────────

export default function OSPage() {
  const { section, setSection, mode, setMode, sidebarOpen, setSidebarOpen } = useOSStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('os-mode') as OSMode | null
    if (saved) setMode(saved)
  }, [setMode])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [section, isMobile, setSidebarOpen])

  const renderSection = () => {
    if (section === 'today') return <TodayPage />
    return <PlaceholderPage label={sectionLabels[section]} mode={mode} />
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-zinc-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-emerald-400 fill-emerald-400" />
            <span className="text-sm font-semibold text-zinc-100 tracking-tight">AI Visibility OS™</span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
          {([
            { key: 'executive' as OSMode, label: 'Executive', icon: Briefcase },
            { key: 'builder' as OSMode, label: 'Builder', icon: LayoutDashboard },
            { key: 'developer' as OSMode, label: 'Developer', icon: Code2 },
          ]).map((m) => {
            const isActive = mode === m.key
            return (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); localStorage.setItem('os-mode', m.key) }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <m.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Sidebar Desktop ──────────────────────────────────────── */}
        <nav className="hidden lg:flex flex-col w-52 shrink-0 border-r border-zinc-800 bg-zinc-950">
          <div className="flex-1 p-3 space-y-0.5">
            {sidebarItems.map((item) => {
              const isActive = section === item.key
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative',
                    isActive
                      ? 'bg-emerald-600/10 text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="os-sidebar-indicator"
                      className="absolute left-0 w-0.5 h-5 bg-emerald-400 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('h-4 w-4', item.key === 'today' && isActive && 'fill-emerald-400/20')} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
          <div className="p-3 border-t border-zinc-800">
            <a href="/superadmin-portal" className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              <ChevronLeft className="h-3 w-3" />
              Back to Superadmin
            </a>
          </div>
        </nav>

        {/* ── Sidebar Mobile ───────────────────────────────────────── */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.nav
                initial={{ x: -208 }}
                animate={{ x: 0 }}
                exit={{ x: -208 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute left-0 top-0 bottom-0 w-52 z-40 bg-zinc-950 border-r border-zinc-800 flex flex-col"
              >
                <div className="flex-1 p-3 space-y-0.5">
                  {sidebarItems.map((item) => {
                    const isActive = section === item.key
                    const Icon = item.icon
                    return (
                      <button
                        key={item.key}
                        onClick={() => setSection(item.key)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                          isActive
                            ? 'bg-emerald-600/10 text-emerald-400'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
            <motion.div
              key={section + '-title'}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-6"
            >
              <h2 className="text-lg font-semibold text-zinc-100">
                {sectionLabels[section]}
              </h2>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
