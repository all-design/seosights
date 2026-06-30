'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore, type OSSection } from '@/lib/os-store'
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

// ── Main OS Page ─────────────────────────────────────────────────────

export default function OSPage() {
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
