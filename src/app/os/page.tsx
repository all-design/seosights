'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore, type OSSection } from '@/lib/os-store'
import { useAuth } from '@/lib/auth-context'
import { OSHeader } from '@/components/os/OSHeader'
import { OSSidebar } from '@/components/os/OSSidebar'
import { TodayPage } from '@/components/os/TodayPage'
import { GrowthPage } from '@/components/os/GrowthPage'
import { LearningPage } from '@/components/os/LearningPage'
import { ContentPage } from '@/components/os/ContentPage'
import { InsightsPage } from '@/components/os/InsightsPage'
import { ExecutePage } from '@/components/os/ExecutePage'
import { MemoryPage } from '@/components/os/MemoryPage'
import { ExperimentsPage } from '@/components/os/ExperimentsPage'
import LoginModal from '@/components/landing/LoginModal'
import { Button } from '@/components/ui/button'
import {
  Lock,
  ArrowRight,
  Zap,
  BarChart3,
  Brain,
  Eye,
  Shield,
  Loader2,
  Monitor,
  LayoutDashboard,
  Activity,
} from 'lucide-react'

// ── Section Labels ────────────────────────────────────────────────────

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

// ── Section Renderer ──────────────────────────────────────────────────

function renderSection(section: OSSection) {
  switch (section) {
    case 'today':
      return <TodayPage />
    case 'growth':
      return <GrowthPage />
    case 'learning':
      return <LearningPage />
    case 'content':
      return <ContentPage />
    case 'insights':
      return <InsightsPage />
    case 'execute':
      return <ExecutePage />
    case 'memory':
      return <MemoryPage />
    case 'experiments':
      return <ExperimentsPage />
  }
}

// ── Mock OS Preview (blurred) ─────────────────────────────────────────

function MockOSPreview() {
  return (
    <div className="relative w-full max-w-4xl mx-auto select-none pointer-events-none">
      {/* Mock Header Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/60 rounded-t-xl">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Monitor className="w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500 font-mono">AI Visibility OS™</span>
        </div>
        <div className="w-16 h-5 rounded bg-zinc-800" />
      </div>

      {/* Mock Body */}
      <div className="flex bg-zinc-950/90 rounded-b-xl overflow-hidden" style={{ height: 340 }}>
        {/* Mock Sidebar */}
        <div className="w-44 border-r border-zinc-800/60 p-3 space-y-2 shrink-0">
          {['Today', 'Growth', 'Learning', 'Content', 'Insights', 'Execute', 'Memory', 'Experiments'].map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                i === 0 ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-600'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded bg-zinc-700/50" />
              {item}
            </div>
          ))}
        </div>

        {/* Mock Content */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'AI Visibility Score', value: '72', change: '+5.2%' },
              { label: 'Citations This Week', value: '148', change: '+12%' },
              { label: 'Rank Change', value: '#3', change: '↑ 2' },
            ].map((metric) => (
              <div key={metric.label} className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/40">
                <div className="text-[10px] text-zinc-600 mb-1">{metric.label}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-zinc-400">{metric.value}</span>
                  <span className="text-[10px] text-emerald-600">{metric.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-zinc-600 font-medium">Visibility Trend — 30 Days</div>
              <div className="flex gap-1">
                {['1W', '1M', '3M'].map((t) => (
                  <div key={t} className="px-1.5 py-0.5 rounded text-[8px] bg-zinc-800/50 text-zinc-600">{t}</div>
                ))}
              </div>
            </div>
            {/* Fake chart lines */}
            <svg viewBox="0 0 400 80" className="w-full h-16 opacity-40">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points="0,60 30,55 60,50 90,52 120,40 150,38 180,30 210,35 240,25 270,20 300,22 330,15 360,12 400,8"
              />
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                points="0,65 30,60 60,58 90,55 120,50 150,48 180,45 210,42 240,38 270,35 300,30 330,28 360,25 400,20"
              />
            </svg>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/30">
              <div className="text-[10px] text-zinc-600 mb-2">Top AI Citations</div>
              <div className="space-y-1.5">
                {['ChatGPT', 'Perplexity', 'Gemini'].map((src) => (
                  <div key={src} className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">{src}</span>
                    <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-700/40 rounded-full" style={{ width: `${Math.random() * 60 + 30}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/30">
              <div className="text-[10px] text-zinc-600 mb-2">Recent Actions</div>
              <div className="space-y-1.5">
                {['Content optimized', 'Schema updated', 'Crawl completed'].map((action) => (
                  <div key={action} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span className="text-[10px] text-zinc-500">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-zinc-950/30 rounded-xl" />
    </div>
  )
}

// ── Gate Page (shown when not authenticated) ──────────────────────────

function OSGatePage() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-200 tracking-tight">seosights</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLoginModal(true)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Log In
          </Button>
        </div>
      </div>

      {/* Main Gate Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Requires Account</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            AI Visibility OS™
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Access the operating system for AI Visibility. Track your score, 
            monitor citations, and execute growth strategies — all in one place.
          </p>
        </motion.div>

        {/* Mock OS Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full mb-10"
        >
          <MockOSPreview />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Button
            size="lg"
            onClick={() => setShowLoginModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold px-8 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Free Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowLoginModal(true)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Log In
          </Button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
            14-Day Free Trial
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500/60" />
            No Credit Card Required
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500/60" />
            Full Dashboard Access
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl"
        >
          {[
            { icon: LayoutDashboard, label: '8 Workspaces' },
            { icon: Brain, label: 'AI Executive Mode' },
            { icon: BarChart3, label: 'Live Metrics' },
            { icon: Eye, label: 'Real-time Tracking' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
              <Icon className="w-5 h-5 text-zinc-500" />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultTab="register"
      />
    </div>
  )
}

// ── Loading State ──────────────────────────────────────────────────────

function OSLoadingState() {
  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="text-sm text-zinc-500">Loading AI Visibility OS™...</span>
      </div>
    </div>
  )
}

// ── Main OS Page ─────────────────────────────────────────────────────

export default function OSPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { section, setSection, mode, setMode, sidebarOpen, setSidebarOpen } = useOSStore()

  // Persist mode to localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('os-mode')
    if (saved === 'executive' || saved === 'builder' || saved === 'developer') {
      setMode(saved)
    }
  }, [setMode])

  // Close sidebar on mobile when section changes
  useEffect(() => {
    const isMobile = window.innerWidth < 1024
    if (isMobile) setSidebarOpen(false)
  }, [section, setSidebarOpen])

  // Show loading while checking auth
  if (isLoading) {
    return <OSLoadingState />
  }

  // Show gate page if not authenticated
  if (!isAuthenticated) {
    return <OSGatePage />
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <OSHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Sidebar Desktop ──────────────────────────────────────── */}
        <div className="hidden lg:block">
          <OSSidebar />
        </div>

        {/* ── Sidebar Mobile ───────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -208 }}
                animate={{ x: 0 }}
                exit={{ x: -208 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute left-0 top-0 bottom-0 w-52 z-40"
              >
                <OSSidebar />
              </motion.div>
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
                {renderSection(section)}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
