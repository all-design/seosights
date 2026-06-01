'use client'

import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import StatsSection from '@/components/landing/StatsSection'
import AgentOSSection from '@/components/landing/AgentOSSection'
import BacklinksSection from '@/components/landing/BacklinksSection'
import JuneStackSection from '@/components/landing/JuneStackSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <AgentOSSection />
      <BacklinksSection />
      <JuneStackSection />
      <CTASection />
      <Footer />
    </div>
  )
}
