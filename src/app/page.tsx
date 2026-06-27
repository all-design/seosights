'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SuperadminNav from '@/components/superadmin/SuperadminNav'
import CEODashboard from '@/components/superadmin/CEODashboard'
import RetentionDashboard from '@/components/superadmin/RetentionDashboard'
import ActivationDashboard from '@/components/superadmin/ActivationDashboard'
import EventTracker from '@/components/superadmin/EventTracker'
import P1Dashboard from '@/components/superadmin/P1Dashboard'

const dashboardComponents: Record<string, React.ReactNode> = {
  ceo: <CEODashboard />,
  retention: <RetentionDashboard />,
  activation: <ActivationDashboard />,
  events: <EventTracker />,
  p1: <P1Dashboard />,
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('ceo')

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Navigation */}
        <SuperadminNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {dashboardComponents[activeTab] || <CEODashboard />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
