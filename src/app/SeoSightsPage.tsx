'use client'

import { useState, useCallback } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import SocialProofSection from '@/components/landing/SocialProofSection'
import LiveStatsSection from '@/components/landing/LiveStatsSection'
import StatsSection from '@/components/landing/StatsSection'
import TrustSection from '@/components/landing/TrustSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import DashboardPreview from '@/components/landing/DashboardPreview'
import AIVisibilityScoreSection from '@/components/landing/AIVisibilityScoreSection'
import ComparisonSection from '@/components/landing/ComparisonSection'
import CompleteSolutionSection from '@/components/landing/CompleteSolutionSection'
import ObservatorySection from '@/components/landing/ObservatorySection'
import FreeToolsSection from '@/components/landing/FreeToolsSection'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import BuildInPublicSection from '@/components/landing/BuildInPublicSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import SiteFooter from '@/components/site/SiteFooter'
import URLInputModal from '@/components/landing/URLInputModal'
import AIStickyScore from '@/components/landing/AIStickyScore'
import LoginModal from '@/components/landing/LoginModal'

/**
 * seosights.com — Full SaaS landing page.
 * Complete set of landing components with dark theme,
 * purple gradient branding, floating elements, and all navigation links.
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
        <SocialProofSection />
        <LiveStatsSection />
        <StatsSection />
        <TrustSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DashboardPreview />
        <AIVisibilityScoreSection />
        <ComparisonSection />
        <CompleteSolutionSection />
        <ObservatorySection />
        <FreeToolsSection />
        <IntegrationsSection />
        <BuildInPublicSection />
        <PricingSection onStartFree={handleStartFree} />
        <CTASection onStartFree={handleStartFree} />
      </main>

      <SiteFooter />

      {/* Floating AI Visibility Score — sticky bottom-right */}
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
