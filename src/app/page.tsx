'use client'

import ObservatoryNavbar from '@/components/observatory/ObservatoryNavbar'
import ObservatoryPulse from '@/components/observatory/ObservatoryPulse'
import ObservatoryWeather from '@/components/observatory/ObservatoryWeather'
import ObservatoryIndex from '@/components/observatory/ObservatoryIndex'
import ObservatoryArchive from '@/components/observatory/ObservatoryArchive'
import ObservatoryCharts from '@/components/observatory/ObservatoryCharts'
import ObservatoryMethodology from '@/components/observatory/ObservatoryMethodology'
import ObservatoryFooter from '@/components/observatory/ObservatoryFooter'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <ObservatoryNavbar />

      <main className="flex-1 pt-14">
        {/* Moat 1: Live AI Search Pulse™ — the hero */}
        <ObservatoryPulse />

        {/* Moat 2: AI Search Weather™ — daily indicator */}
        <ObservatoryWeather />

        {/* Moat 3: Observatory Index™ — industry health scores */}
        <ObservatoryIndex />

        {/* Moat 4: AI Search Archive™ — every response, forever */}
        <ObservatoryArchive />

        {/* Moat 5: Public Charts — embeddable, citable, linkable */}
        <ObservatoryCharts />

        {/* Methodology & Data Integrity */}
        <ObservatoryMethodology />
      </main>

      <ObservatoryFooter />
    </div>
  )
}
