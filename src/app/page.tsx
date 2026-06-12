'use client'

import { useState, useEffect, useRef } from 'react'
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
  const { view } = useAppStore()
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openModal = () => setIsModalOpen(true)

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
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-white/10">
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
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-white/10">
            <AffiliatePortal userId={webhookUserId} onClose={() => setIsAffiliateOpen(false)} />
          </DialogContent>
        </Dialog>
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
      <Footer onAdminClick={() => setIsAdminOpen(true)} />
      <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
