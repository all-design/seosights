'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import SocialProofSection from '@/components/landing/SocialProofSection'
import TrustSection from '@/components/landing/TrustSection'
import LiveStatsSection from '@/components/landing/LiveStatsSection'
import DashboardPreview from '@/components/landing/DashboardPreview'
import ObservatorySection from '@/components/landing/ObservatorySection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AIVisibilityTimeline from '@/components/landing/AIVisibilityTimeline'
import AIVisibilityReplay from '@/components/landing/AIVisibilityReplay'
import AIRecommendationRecorder from '@/components/landing/AIRecommendationRecorder'
import AIAutoExecute from '@/components/landing/AIAutoExecute'
import AIOpportunityQueue from '@/components/landing/AIOpportunityQueue'
import AIEmailDigest from '@/components/landing/AIEmailDigest'
import RoadmapChecklist from '@/components/landing/RoadmapChecklist'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import ComparisonSection from '@/components/landing/ComparisonSection'
import FreeToolsSection from '@/components/landing/FreeToolsSection'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import AffiliateCTASection from '@/components/landing/AffiliateCTASection'
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
import OperationsCenter from '@/components/ops/OperationsCenter'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import FloatingAIAssistant from '@/components/delight/FloatingAIAssistant'
import SpotlightSearch from '@/components/delight/SpotlightSearch'
import KeyboardShortcutsOverlay from '@/components/delight/KeyboardShortcutsOverlay'
import { useKeyboardShortcuts } from '@/components/delight/useKeyboardShortcuts'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isWebhooksOpen, setIsWebhooksOpen] = useState(false)
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false)
  const [isOpsOpen, setIsOpsOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loginDefaultTab, setLoginDefaultTab] = useState<'login' | 'register'>('register')

  // Registration dialog state with tier
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<RegistrationTier>('starter')
  const [isAgencyRegisterOpen, setIsAgencyRegisterOpen] = useState(false)

  const { view } = useAppStore()
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Delight Sprint: shortcuts state
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)

  const toggleShortcutsHelp = useCallback(() => {
    setIsShortcutsHelpOpen(prev => !prev)
  }, [])

  useKeyboardShortcuts({
    onToggleShortcutsHelp: toggleShortcutsHelp,
    onCloseAll: () => {
      setIsShortcutsHelpOpen(false)
    },
  })

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
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        setIsOpsOpen(true)
      }
      if (e.key === 'Escape') {
        if (isAdminOpen) setIsAdminOpen(false)
        if (isWebhooksOpen) setIsWebhooksOpen(false)
        if (isAffiliateOpen) setIsAffiliateOpen(false)
        if (isOpsOpen) setIsOpsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAdminOpen, isWebhooksOpen, isOpsOpen])

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
        <OperationsCenter isOpen={isOpsOpen} onClose={() => setIsOpsOpen(false)} />
        <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
            <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
          </DialogContent>
        </Dialog>
        <FloatingAIAssistant />
        <SpotlightSearch />
        <KeyboardShortcutsOverlay isOpen={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} />
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
        <OperationsCenter isOpen={isOpsOpen} onClose={() => setIsOpsOpen(false)} />
        <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
            <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
          </DialogContent>
        </Dialog>
        <FloatingAIAssistant />
        <SpotlightSearch />
        <KeyboardShortcutsOverlay isOpen={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar onStartFree={() => setIsModalOpen(true)} />
      <HeroSection onStartFree={() => openRegistration('starter')} />
      <SocialProofSection />
      <TrustSection />
      <LiveStatsSection />
      <DashboardPreview onStartFree={() => openRegistration('starter')} />
      <ObservatorySection />
      <FeaturesSection />
      <AIVisibilityTimeline />
      <AIVisibilityReplay onStartFree={() => openRegistration('starter')} />
      <AIRecommendationRecorder onStartFree={() => openRegistration('starter')} />
      <AIAutoExecute onStartFree={() => openRegistration('starter')} />
      <AIOpportunityQueue onStartFree={() => openRegistration('starter')} />
      <AIEmailDigest onStartFree={() => openRegistration('starter')} />
      <RoadmapChecklist />
      <HowItWorksSection />
      <ComparisonSection onStartFree={() => openRegistration('starter')} />
      <FreeToolsSection onStartFree={() => setIsModalOpen(true)} />
      <IntegrationsSection />
      <PricingSection
        onStartFree={() => openRegistration('starter')}
        onTierSelect={openRegistration}
      />
      <CTASection onStartFree={() => openRegistration('starter')} />
      <AffiliateCTASection />
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
      <OperationsCenter isOpen={isOpsOpen} onClose={() => setIsOpsOpen(false)} />
      <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-white/10">
          <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
        </DialogContent>
      </Dialog>
      <FloatingAIAssistant />
      <SpotlightSearch />
      <KeyboardShortcutsOverlay isOpen={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} />
    </div>
  )
}
