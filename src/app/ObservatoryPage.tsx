'use client'

import ObservatoryNavbar from '@/components/observatory/ObservatoryNavbar'
import ObservatoryHero from '@/components/observatory/ObservatoryHero'
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
 * ai.seosights.com — The Observatory as a standalone research product.
 * Independent identity, dark theme, research-first.
 */
export default function ObservatoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <ObservatoryNavbar />

      <main className="flex-1">
        {/* Hero: One-liner pitch + Three Pillars */}
        <ObservatoryHero />

        {/* ── Observatory: The Data ──────────────────────────── */}

        {/* Live AI Search Pulse™ — real-time operations center */}
        <section id="observatory-pulse" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryPulse />
          </div>
        </section>

        {/* AI Search Weather™ — daily stability indicator */}
        <section id="observatory-weather" className="scroll-mt-16">
          <ObservatoryWeather />
        </section>

        {/* Observatory Index™ — industry health scores */}
        <section id="observatory-index" className="scroll-mt-16">
          <ObservatoryIndex />
        </section>

        {/* AI Search Graph™ — global citation network */}
        <section id="observatory-graph" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryGraph />
          </div>
        </section>

        {/* AI Search Timeline™ — internet-wide AI search history */}
        <section id="observatory-timeline" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryTimeline />
          </div>
        </section>

        {/* Evidence Explorer™ — click a source, see AI visibility */}
        <section id="observatory-evidence" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryEvidenceExplorer />
          </div>
        </section>

        {/* AI Search Archive™ — every response, forever */}
        <section id="observatory-archive" className="scroll-mt-16">
          <ObservatoryArchive />
        </section>

        {/* Public Charts — embeddable, citable, linkable */}
        <section id="observatory-charts" className="scroll-mt-16">
          <ObservatoryCharts />
        </section>

        {/* Methodology & Data Integrity */}
        <section id="observatory-methodology" className="scroll-mt-16">
          <ObservatoryMethodology />
        </section>

        {/* Cited By — External Citations KPI */}
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
