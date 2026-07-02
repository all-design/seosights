'use client'

import { useOpsStore } from '@/lib/ops-store'
import { OpsSidebar } from '@/components/ops/OpsSidebar'
import { OpsHeader } from '@/components/ops/OpsHeader'
import { OpsSections } from '@/components/ops/OpsSections'
import { Radar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OpsPage() {
  const { sidebarOpen, setSidebarOpen } = useOpsStore()

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1a] text-gray-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 lg:z-auto
            h-screen w-64 flex-shrink-0
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <OpsSidebar />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <OpsHeader />

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <OpsSections />
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-gray-800 px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radar className="h-3 w-3 text-emerald-500" />
              <span>AI Operations Center™ — SeoSights Autonomous Platform</span>
            </div>
            <span>v2.0 · Mission Control</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
