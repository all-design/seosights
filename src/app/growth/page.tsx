'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGrowthStore, type GrowthSection } from '@/lib/growth-store'
import { GrowthHeader } from '@/components/growth/GrowthHeader'
import { GrowthSidebar } from '@/components/growth/GrowthSidebar'
import { renderGrowthSection } from '@/components/growth/GrowthSections'

// ── Section Labels ────────────────────────────────────────────────────

const sectionLabels: Record<GrowthSection, string> = {
  dashboard: 'Dashboard',
  discovery: 'Discovery',
  opportunities: 'Opportunities',
  queue: 'Queue',
  generation: 'Generation',
  review: 'Review',
  execution: 'Execution',
  learning: 'Learning',
  governor: 'Governor',
  reports: 'Reports',
  settings: 'Settings',
}

// ── Main Growth Page ─────────────────────────────────────────────────

export default function GrowthPage() {
  const { section, sidebarOpen, setSidebarOpen } = useGrowthStore()

  // Close sidebar on mobile when section changes
  useEffect(() => {
    const isMobile = window.innerWidth < 1024
    if (isMobile) setSidebarOpen(false)
  }, [section, setSidebarOpen])

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <GrowthHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Sidebar Desktop ──────────────────────────────────────── */}
        <div className="hidden lg:block">
          <GrowthSidebar />
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
                <GrowthSidebar />
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
                {renderGrowthSection(section)}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
