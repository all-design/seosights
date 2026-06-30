'use client'

import ObservatoryNavbar from '@/components/observatory/ObservatoryNavbar'
import ObservatoryHero from '@/components/observatory/ObservatoryHero'
import ObservatoryHealth from '@/components/observatory/ObservatoryHealth'
import ClientZeroKPI from '@/components/observatory/ClientZeroKPI'
import ObservatoryPulse from '@/components/observatory/ObservatoryPulse'
import ObservatoryWeather from '@/components/observatory/ObservatoryWeather'
import ObservatoryIndex from '@/components/observatory/ObservatoryIndex'
import ObservatoryArchive from '@/components/observatory/ObservatoryArchive'
import ObservatoryCharts from '@/components/observatory/ObservatoryCharts'
import ObservatoryGraph from '@/components/observatory/ObservatoryGraph'
import ObservatoryTimeline from '@/components/observatory/ObservatoryTimeline'
import ObservatoryEvidenceExplorer from '@/components/observatory/ObservatoryEvidenceExplorer'
import ObservatoryMethodology from '@/components/observatory/ObservatoryMethodology'
import ObservatoryCitations from '@/components/observatory/ObservatoryCitations'
import ObservatoryFooter from '@/components/observatory/ObservatoryFooter'

/**
 * /observatory — AI Search Observatory™
 *
 * Standalone research product accessible at:
 * - seosights.com/observatory
 * - ai.seosights.com (via host-based routing in page.tsx)
 *
 * Independent identity, dark theme, research-first.
 */
export default function ObservatoryRoutePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <ObservatoryNavbar />

      <main className="flex-1">
        <ObservatoryHero />

        {/* ── Observatory Health: daily metrics ──────────────────── */}
        <section id="observatory-health" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryHealth />
          </div>
        </section>

        {/* ── Client Zero KPI: Articles → Revenue pipeline ──────── */}
        <section id="observatory-client-zero" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ClientZeroKPI />
          </div>
        </section>

        <section id="observatory-pulse" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryPulse />
          </div>
        </section>

        <section id="observatory-weather" className="scroll-mt-16">
          <ObservatoryWeather />
        </section>

        <section id="observatory-index" className="scroll-mt-16">
          <ObservatoryIndex />
        </section>

        <section id="observatory-graph" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryGraph />
          </div>
        </section>

        <section id="observatory-timeline" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryTimeline />
          </div>
        </section>

        <section id="observatory-evidence" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryEvidenceExplorer />
          </div>
        </section>

        <section id="observatory-archive" className="scroll-mt-16">
          <ObservatoryArchive />
        </section>

        <section id="observatory-charts" className="scroll-mt-16">
          <ObservatoryCharts />
        </section>

        <section id="observatory-methodology" className="scroll-mt-16">
          <ObservatoryMethodology />
        </section>

        <section id="observatory-citations" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryCitations />
          </div>
        </section>
      </main>

      <ObservatoryFooter />
    </div>
  )
}
