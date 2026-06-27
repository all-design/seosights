'use client'

import { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import SocialProofSection from '@/components/landing/SocialProofSection'
import AIVisibilityScoreSection from '@/components/landing/AIVisibilityScoreSection'
import AIVisibilityMap from '@/components/landing/AIVisibilityMap'
import AIMissionControl from '@/components/landing/AIMissionControl'
import AIRecommendationSimulator from '@/components/landing/AIRecommendationSimulator'
import TerminalPreview from '@/components/landing/TerminalPreview'
import DashboardPreview from '@/components/landing/DashboardPreview'
import AIRevenueCalculator from '@/components/landing/AIRevenueCalculator'
import AICitationExplorer from '@/components/landing/AICitationExplorer'
import AIOpportunityFinder from '@/components/landing/AIOpportunityFinder'
import AIInfluenceGraph from '@/components/landing/AIInfluenceGraph'
import AICompetitorWarRoom from '@/components/landing/AICompetitorWarRoom'
import AIDailyFeedSection from '@/components/landing/AIDailyFeedSection'
import IndustryBenchmarksSection from '@/components/landing/IndustryBenchmarksSection'
import AIActionCenterSection from '@/components/landing/AIActionCenterSection'
import AIVisibilityForecast from '@/components/landing/AIVisibilityForecast'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AIVisibilityTimeline from '@/components/landing/AIVisibilityTimeline'
import RoadmapChecklist from '@/components/landing/RoadmapChecklist'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import ComparisonSection from '@/components/landing/ComparisonSection'
import FreeToolsSection from '@/components/landing/FreeToolsSection'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import URLInputModal from '@/components/landing/URLInputModal'
import LoginModal from '@/components/landing/LoginModal'
import RegistrationDialog, { type RegistrationTier } from '@/components/auth/RegistrationDialog'
import AgencyRegistrationDialog from '@/components/auth/AgencyRegistrationDialog'
import AnalyzingView from '@/components/landing/AnalyzingView'
import AnalysisDashboard from '@/components/landing/AnalysisDashboard'
import SuperadminPanel from '@/components/superadmin/SuperadminPanel'
import WebhooksPanel from '@/components/dashboard/WebhooksPanel'
import AffiliatePortal from '@/components/dashboard/AffiliatePortal'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isWebhooksOpen, setIsWebhooksOpen] = useState(false)
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loginDefaultTab, setLoginDefaultTab] = useState<'login' | 'register'>('register')

  // Registration dialog state with tier
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<RegistrationTier>('starter')
  const [isAgencyRegisterOpen, setIsAgencyRegisterOpen] = useState(false)

  const { view } = useAppStore()
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openModal = () => setIsModalOpen(true)

  // Open registration dialog with a specific tier
  const openRegistration = (tier: RegistrationTier = 'starter') => {
    if (tier === 'managed') {
      setIsAgencyRegisterOpen(true)
      return
    }
    setSelectedTier(tier)
    setIsRegDialogOpen(true)
  }

  // Keyboard shortcut: Ctrl+Shift+A for admin, Ctrl+Shift+W for webhooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setIsAdminOpen(true)
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault()
        setIsWebhooksOpen(true)
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setIsAffiliateOpen(true)
      }
      if (e.key === 'Escape') {
        if (isAdminOpen) setIsAdminOpen(false)
        if (isWebhooksOpen) setIsWebhooksOpen(false)
        if (isAffiliateOpen) setIsAffiliateOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAdminOpen, isWebhooksOpen])

  // Logo 5-click handler (exposed globally)
  useEffect(() => {
    const handleLogoClick = () => {
      logoClickCount.current += 1
      if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
      logoClickTimer.current = setTimeout(() => {
        logoClickCount.current = 0
      }, 2000)
      if (logoClickCount.current >= 5) {
        logoClickCount.current = 0
        setIsAdminOpen(true)
      }
    }
    ;(window as unknown as Record<string, unknown>).__seosightsLogoClick = handleLogoClick
  }, [])

  // Default demo userId for webhook panel (Pro/Agency feature)
  const webhookUserId = 'demo-user-pro'

  // ── Affiliate Referral Cookie Handler ──────────────────────────────────
  // When someone visits via ?ref=CODE, we store the code in a cookie
  // that lasts 60 days. When they register, the code is sent to the backend
  // to link them to the referring affiliate.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    if (refCode) {
      // Store in cookie with 60-day expiry
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 60)
      document.cookie = `seosights_ref=${refCode};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`
      console.log(`[affiliate] Referral code stored: ${refCode}`)

      // Clean the URL (remove ?ref= parameter so it looks clean)
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('ref')
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [])

  if (view === 'analyzing') {
    return (
      <>
        <AnalyzingView />
        <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} />
        <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
            <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (view === 'dashboard') {
    return (
      <>
        <AnalysisDashboard onStartFree={openModal} onOpenWebhooks={() => setIsWebhooksOpen(true)} onOpenAffiliate={() => setIsAffiliateOpen(true)} />
        <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} />
        <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
            <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar onStartFree={() => setIsModalOpen(true)} />
      {/* 1 ── HERO: The ONE question ─────────────────────────────── */}
      <HeroSection onStartFree={() => openRegistration('starter')} />

      {/* 2 ── SOCIAL PROOF ───────────────────────────────────────── */}
      <SocialProofSection />

      {/* 3 ── THE KPI: AI Visibility Score™ ──────────────────────── */}
      <AIVisibilityScoreSection onStartFree={() => openRegistration('starter')} />

      {/* 4 ── AI VISIBILITY MAP ──────────────────────────────────── */}
      <AIVisibilityMap onStartFree={() => openRegistration('starter')} />

      {/* 4.5 ── AI MISSION CONTROL ──────────────────────────────── */}
      <AIMissionControl onStartFree={() => openRegistration('starter')} />

      {/* 5 ── DAILY USE: Reasons to come back every morning ──────── */}
      <AIDailyFeedSection onStartFree={() => openRegistration('starter')} />

      {/* 6 ── DAILY USE: Forecast ────────────────────────────────── */}
      <AIVisibilityForecast onStartFree={() => openRegistration('starter')} />

      {/* 7 ── DAILY USE: Score tracking timeline ─────────────────── */}
      <AIVisibilityTimeline />

      {/* 8 ── DIFFERENTIATION: Industry Benchmarks ───────────────── */}
      <IndustryBenchmarksSection onStartFree={() => openRegistration('starter')} />

      {/* 9 ── DIFFERENTIATION: Recommendation Simulator ──────────── */}
      <AIRecommendationSimulator onStartFree={() => openRegistration('starter')} />

      {/* 10 ── DIFFERENTIATION: Action Center ────────────────────── */}
      <AIActionCenterSection onStartFree={() => openRegistration('starter')} />

      {/* 11 ── DEEP ANALYSIS: Citation Explorer ──────────────────── */}
      <AICitationExplorer onStartFree={() => openRegistration('starter')} />

      {/* 12 ── DEEP ANALYSIS: Opportunity Finder ─────────────────── */}
      <AIOpportunityFinder onStartFree={() => openRegistration('starter')} />

      {/* 13 ── DEEP ANALYSIS: Competitor War Room ────────────────── */}
      <AICompetitorWarRoom onStartFree={() => openRegistration('starter')} />

      {/* 14 ── DEEP ANALYSIS: Influence Graph ────────────────────── */}
      <AIInfluenceGraph onStartFree={() => openRegistration('starter')} />

      {/* 15 ── BUSINESS CASE: Revenue Calculator ─────────────────── */}
      <AIRevenueCalculator onStartFree={() => openRegistration('starter')} />

      {/* 16 ── BUSINESS CASE: Terminal Preview ───────────────────── */}
      <TerminalPreview onStartFree={() => openRegistration('starter')} />

      {/* 17 ── FEATURES ──────────────────────────────────────────── */}
      <FeaturesSection />

      {/* 18 ── HOW IT WORKS ──────────────────────────────────────── */}
      <HowItWorksSection />

      {/* 19 ── COMPARISON ────────────────────────────────────────── */}
      <ComparisonSection onStartFree={() => openRegistration('starter')} />

      {/* 20 ── DASHBOARD PREVIEW ─────────────────────────────────── */}
      <DashboardPreview onStartFree={() => openRegistration('starter')} />

      {/* 21 ── FREE TOOLS ────────────────────────────────────────── */}
      <FreeToolsSection onStartFree={() => setIsModalOpen(true)} />

      {/* 22 ── INTEGRATIONS ──────────────────────────────────────── */}
      <IntegrationsSection />

      {/* 23 ── ROADMAP ───────────────────────────────────────────── */}
      <RoadmapChecklist />

      {/* 24 ── PRICING ───────────────────────────────────────────── */}
      <PricingSection
        onStartFree={() => openRegistration('starter')}
        onTierSelect={openRegistration}
      />

      {/* 25 ── CTA ──────────────────────────────────────────────── */}
      <CTASection onStartFree={() => openRegistration('starter')} />

      {/* 26 ── FOOTER ───────────────────────────────────────────── */}
      <Footer />
      <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} defaultTab={loginDefaultTab} />
      <RegistrationDialog
        isOpen={isRegDialogOpen}
        onClose={() => setIsRegDialogOpen(false)}
        tier={selectedTier}
      />
      <AgencyRegistrationDialog
        isOpen={isAgencyRegisterOpen}
        onClose={() => setIsAgencyRegisterOpen(false)}
      />
      <SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} />
      <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-white/10">
          <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
