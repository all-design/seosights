'use client'

import { useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import StatsSection from '@/components/landing/StatsSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import URLInputModal from '@/components/landing/URLInputModal'
import AnalyzingView from '@/components/landing/AnalyzingView'
import AnalysisDashboard from '@/components/landing/AnalysisDashboard'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { view } = useAppStore()

  const openModal = () => setIsModalOpen(true)

  if (view === 'analyzing') {
    return (
      <>
        <AnalyzingView />
        <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  if (view === 'dashboard') {
    return (
      <>
        <AnalysisDashboard onStartFree={openModal} />
        <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar onStartFree={() => setIsModalOpen(true)} />
      <HeroSection onStartFree={() => setIsModalOpen(true)} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection onStartFree={() => setIsModalOpen(true)} />
      <CTASection onStartFree={() => setIsModalOpen(true)} />
      <Footer />
      <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
