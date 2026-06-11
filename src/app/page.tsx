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
import { useAppStore } from '@/lib/store'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isWebhooksOpen, setIsWebhooksOpen] = useState(false)
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
      if (e.key === 'Escape') {
        if (isAdminOpen) setIsAdminOpen(false)
        if (isWebhooksOpen) setIsWebhooksOpen(false)
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

  if (view === 'analyzing') {
    return (
      <>
        <AnalyzingView />
        <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} />
      </>
    )
  }

  if (view === 'dashboard') {
    return (
      <>
        <AnalysisDashboard onStartFree={openModal} onOpenWebhooks={() => setIsWebhooksOpen(true)} />
        <URLInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <SuperadminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        <WebhooksPanel isOpen={isWebhooksOpen} onClose={() => setIsWebhooksOpen(false)} userId={webhookUserId} />
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
    </div>
  )
}
