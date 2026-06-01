'use client'

import { useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import StatsSection from '@/components/landing/StatsSection'
import AgentOSSection from '@/components/landing/AgentOSSection'
import BacklinksSection from '@/components/landing/BacklinksSection'
import JuneStackSection from '@/components/landing/JuneStackSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import URLInputModal from '@/components/landing/URLInputModal'
import AnalyzingView from '@/components/landing/AnalyzingView'
import AnalysisDashboard from '@/components/landing/AnalysisDashboard'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { view } = useAppStore()

  if (view === 'analyzing') {
    return <AnalyzingView />
  }

  if (view === 'dashboard') {
    return <AnalysisDashboard />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onStartFree={() => setIsModalOpen(true)} />
      <HeroSection onStartFree={() => setIsModalOpen(true)} />
      <StatsSection />
      <AgentOSSection />
      <BacklinksSection />
      <JuneStackSection />
      <CTASection onStartFree={() => setIsModalOpen(true)} />
      <Footer />
      <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
