'use client'

import { useState, useCallback } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import EmotionalSection from '@/components/landing/EmotionalSection'
import UnderstandSection from '@/components/landing/UnderstandSection'
import MeasureSection from '@/components/landing/MeasureSection'
import ImproveSection from '@/components/landing/ImproveSection'
import ObservatorySection from '@/components/landing/ObservatorySection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import SiteFooter from '@/components/site/SiteFooter'
import AIVisibilityAdvisor from '@/components/landing/AIVisibilityAdvisor'
import AIStickyScore from '@/components/landing/AIStickyScore'
import URLInputModal from '@/components/landing/URLInputModal'
import LoginModal from '@/components/landing/LoginModal'

/**
 * seosights.com — Streamlined SaaS landing page.
 * Understand → Measure → Improve narrative.
 */
export default function SeoSightsPage() {
  const [showURLModal, setShowURLModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleStartFree = useCallback(() => {
    setShowURLModal(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar onStartFree={handleStartFree} />

      <main className="flex-1">
        <HeroSection onStartFree={handleStartFree} />
        <EmotionalSection />
        <UnderstandSection onStartFree={handleStartFree} />
        <MeasureSection onStartFree={handleStartFree} />
        <ImproveSection onStartFree={handleStartFree} />
        <ObservatorySection />
        <PricingSection onStartFree={handleStartFree} />
        <CTASection onStartFree={handleStartFree} />
      </main>

      <SiteFooter />

      {/* Floating elements */}
      <AIVisibilityAdvisor onStartFree={handleStartFree} />
      <AIStickyScore onStartFree={handleStartFree} />

      {/* Modals */}
      <URLInputModal
        isOpen={showURLModal}
        onClose={() => setShowURLModal(false)}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}
