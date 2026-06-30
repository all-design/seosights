'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import type { RegistrationTier } from '@/components/auth/RegistrationDialog'

// Dynamic imports to reduce initial bundle size and prevent OOM in dev
const SocialProofSection = lazy(() => import('@/components/landing/SocialProofSection'))
const DashboardPreview = lazy(() => import('@/components/landing/DashboardPreview'))
const FeaturesSection = lazy(() => import('@/components/landing/FeaturesSection'))
const AIVisibilityTimeline = lazy(() => import('@/components/landing/AIVisibilityTimeline'))
const AIVisibilityReplay = lazy(() => import('@/components/landing/AIVisibilityReplay'))
const AIRecommendationRecorder = lazy(() => import('@/components/landing/AIRecommendationRecorder'))
const AIAutoExecute = lazy(() => import('@/components/landing/AIAutoExecute'))
const AIOpportunityQueue = lazy(() => import('@/components/landing/AIOpportunityQueue'))
const AIEmailDigest = lazy(() => import('@/components/landing/AIEmailDigest'))
const RoadmapChecklist = lazy(() => import('@/components/landing/RoadmapChecklist'))
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection'))
const ComparisonSection = lazy(() => import('@/components/landing/ComparisonSection'))
const FreeToolsSection = lazy(() => import('@/components/landing/FreeToolsSection'))
const IntegrationsSection = lazy(() => import('@/components/landing/IntegrationsSection'))
const PricingSection = lazy(() => import('@/components/landing/PricingSection'))
const CTASection = lazy(() => import('@/components/landing/CTASection'))
const AffiliateCTASection = lazy(() => import('@/components/landing/AffiliateCTASection'))
const Footer = lazy(() => import('@/components/landing/Footer'))
const URLInputModal = lazy(() => import('@/components/landing/URLInputModal'))
const LoginModal = lazy(() => import('@/components/landing/LoginModal'))
const RegistrationDialog = lazy(() => import('@/components/auth/RegistrationDialog'))
const AgencyRegistrationDialog = lazy(() => import('@/components/auth/AgencyRegistrationDialog'))
const AnalyzingView = lazy(() => import('@/components/landing/AnalyzingView'))
const AnalysisDashboard = lazy(() => import('@/components/landing/AnalysisDashboard'))
const SuperadminPanel = lazy(() => import('@/components/superadmin/SuperadminPanel'))
const WebhooksPanel = lazy(() => import('@/components/dashboard/WebhooksPanel'))
const AffiliatePortal = lazy(() => import('@/components/dashboard/AffiliatePortal'))

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
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    if (refCode) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 60)
      document.cookie = `seosights_ref=${refCode};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`
      console.log(`[affiliate] Referral code stored: ${refCode}`)

      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('ref')
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [])

  if (view === 'analyzing') {
    return (
      <>
        <Suspense><AnalyzingView /></Suspense>
        <Suspense><URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /></Suspense>
        <Suspense><SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} /></Suspense>
        <Suspense><WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} /></Suspense>
        <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
            <Suspense><AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} /></Suspense>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (view === 'dashboard') {
    return (
      <>
        <Suspense><AnalysisDashboard onStartFree={openModal} onOpenWebhooks={() => setIsWebhooksOpen(true)} onOpenAffiliate={() => setIsAffiliateOpen(true)} /></Suspense>
        <Suspense><URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /></Suspense>
        <Suspense><SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} /></Suspense>
        <Suspense><WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} /></Suspense>
        <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
            <Suspense><AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} /></Suspense>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar onStartFree={() => setIsModalOpen(true)} />
      <HeroSection onStartFree={() => openRegistration('starter')} />
      <Suspense><SocialProofSection /></Suspense>
      <Suspense><DashboardPreview onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><FeaturesSection /></Suspense>
      <Suspense><AIVisibilityTimeline /></Suspense>
      <Suspense><AIVisibilityReplay onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><AIRecommendationRecorder onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><AIAutoExecute onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><AIOpportunityQueue onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><AIEmailDigest onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><RoadmapChecklist /></Suspense>
      <Suspense><HowItWorksSection /></Suspense>
      <Suspense><ComparisonSection onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><FreeToolsSection onStartFree={() => setIsModalOpen(true)} /></Suspense>
      <Suspense><IntegrationsSection /></Suspense>
      <Suspense><PricingSection
        onStartFree={() => openRegistration('starter')}
        onTierSelect={openRegistration}
      /></Suspense>
      <Suspense><CTASection onStartFree={() => openRegistration('starter')} /></Suspense>
      <Suspense><AffiliateCTASection /></Suspense>
      <Suspense><Footer /></Suspense>
      <Suspense><URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /></Suspense>
      <Suspense><LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} defaultTab={loginDefaultTab} /></Suspense>
      <Suspense><RegistrationDialog
        isOpen={isRegDialogOpen}
        onClose={() => setIsRegDialogOpen(false)}
        tier={selectedTier}
      /></Suspense>
      <Suspense><AgencyRegistrationDialog
        isOpen={isAgencyRegisterOpen}
        onClose={() => setIsAgencyRegisterOpen(false)}
      /></Suspense>
      <Suspense><SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} /></Suspense>
      <Suspense><WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} /></Suspense>
      <Dialog open={isAffiliateOpen} onOpenChange={setIsAffiliateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-white/10">
          <Suspense><AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} /></Suspense>
        </DialogContent>
      </Dialog>
    </div>
  )
}
