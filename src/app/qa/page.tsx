'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQAStore, type QASection } from '@/lib/qa-store'
import { QAHeader } from '@/components/qa/QAHeader'
import { QASidebar } from '@/components/qa/QASidebar'
import { renderQASection } from '@/components/qa/QASections'

// ── Section Labels ────────────────────────────────────────────────────

const sectionLabels: Record<QASection, string> = {
  overview: 'Overview',
  functional: 'Functional QA',
  ux: 'UX Reviewer',
  product: 'Product Reviewer',
  growth: 'Growth Reviewer',
  copy: 'Copy Reviewer',
  accessibility: 'Accessibility',
  performance: 'Performance',
  security: 'Security',
  seo: 'SEO',
  observatory: 'Observatory',
  board: 'Board Report',
  perspectives: 'Perspectives',
}

// ── Main QA Page ──────────────────────────────────────────────────────

export default function QAPage() {
  const { section, sidebarOpen, setSidebarOpen } = useQAStore()

  // Close sidebar on mobile when section changes
  useEffect(() => {
    const isMobile = window.innerWidth < 1024
    if (isMobile) setSidebarOpen(false)
  }, [section, setSidebarOpen])

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <QAHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Sidebar Desktop ──────────────────────────────────────── */}
        <div className="hidden lg:block">
          <QASidebar />
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
                <QASidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
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
                {renderQASection(section)}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
