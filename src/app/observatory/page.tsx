'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import LoginModal from '@/components/landing/LoginModal'
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
import { Button } from '@/components/ui/button'
import {
  Lock,
  Eye,
  Database,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Bot,
  BarChart3,
  ArrowRight,
} from 'lucide-react'

// ── Internal Section Labels ──────────────────────────────────────────

const internalSections = [
  { key: 'raw-dataset', label: 'Raw Dataset', icon: Database, description: 'Full crawl data with source URLs and timestamps' },
  { key: 'citation-warehouse', label: 'Citation Warehouse', icon: BookOpen, description: 'Complete citation database with AI response mapping' },
  { key: 'learning', label: 'Learning', icon: Eye, description: 'AI model learning patterns and training data influence' },
  { key: 'editorial-queue', label: 'Editorial Queue', icon: ClipboardCheck, description: 'Content review and approval pipeline' },
  { key: 'confidence-review', label: 'Confidence Review', icon: ShieldCheck, description: 'Confidence scoring and quality assessment' },
  { key: 'source-validation', label: 'Source Validation', icon: Search, description: 'Source credibility and fact-check verification' },
  { key: 'crawler-jobs', label: 'Crawler Jobs', icon: Bot, description: 'Crawl scheduling, monitoring and job management' },
]

// ── Lock Overlay for Internal Sections ───────────────────────────────

function InternalLockOverlay({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-slate-950/60 flex flex-col items-center justify-center rounded-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 px-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Login to access internal data</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            Create a free account to unlock raw datasets, citation warehouse, crawler jobs, and more.
          </p>
        </div>
        <Button
          onClick={onLoginClick}
          className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Log In
        </Button>
      </motion.div>
    </div>
  )
}

/**
 * /observatory — AI Search Observatory™
 *
 * Standalone research product accessible at:
 * - seosights.com/observatory
 * - ai.seosights.com (via host-based routing in page.tsx)
 *
 * Independent identity, dark theme, research-first.
 * Split into Public (no login) and Internal (login required) sections.
 */
export default function ObservatoryRoutePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const isLocked = !isLoading && !isAuthenticated

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <ObservatoryNavbar />

      <main className="flex-1">
        <ObservatoryHero />

        {/* ═══════════════════════════════════════════════════════════
            PUBLIC SECTIONS — Visible to everyone
            ═══════════════════════════════════════════════════════════ */}

        {/* ── Research ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-emerald-400/80">Public Research</span>
          </div>
        </div>

        <section id="observatory-health" className="scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <ObservatoryHealth />
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

        {/* ── Charts ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-emerald-400/80">Public Charts</span>
          </div>
        </div>

        <section id="observatory-index" className="scroll-mt-16">
          <ObservatoryIndex />
        </section>

        <section id="observatory-charts" className="scroll-mt-16">
          <ObservatoryCharts />
        </section>

        {/* ── Reports ────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-emerald-400/80">Public Reports</span>
          </div>
        </div>

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

        {/* ── API ────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-emerald-400/80">Public API</span>
          </div>
        </div>

        <section id="observatory-methodology" className="scroll-mt-16">
          <ObservatoryMethodology />
        </section>

        {/* ═══════════════════════════════════════════════════════════
            DIVIDER — Public ↔ Internal
            ═══════════════════════════════════════════════════════════ */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/60">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Internal Data</span>
              {isLocked && (
                <span className="text-xs text-slate-500 ml-1">— Login Required</span>
              )}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            INTERNAL SECTIONS — Login required (locked overlay when not authed)
            ═══════════════════════════════════════════════════════════ */}

        <div className="relative">
          {/* Lock overlay when not authenticated */}
          {isLocked && (
            <InternalLockOverlay onLoginClick={() => setShowLoginModal(true)} />
          )}

          {/* Internal sections grid overview (always visible but blurred when locked) */}
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 pb-8 ${isLocked ? 'blur-[2px] opacity-70 pointer-events-none select-none' : ''}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {internalSections.map(({ key, label, icon: Icon, description }) => (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-amber-400/80" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">{label}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Internal: Raw Dataset (Archive) ──────────────────── */}
          <section id="observatory-archive" className="scroll-mt-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-12 ${isLocked ? 'blur-[2px] opacity-70 pointer-events-none select-none' : ''}`}>
              <div className="flex items-center gap-2 mb-6">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium uppercase tracking-widest text-amber-400/80">Raw Dataset</span>
              </div>
              <ObservatoryArchive />
            </div>
          </section>

          {/* ── Internal: Citation Warehouse ──────────────────────── */}
          <section id="observatory-citations" className="scroll-mt-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-12 ${isLocked ? 'blur-[2px] opacity-70 pointer-events-none select-none' : ''}`}>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium uppercase tracking-widest text-amber-400/80">Citation Warehouse</span>
              </div>
              <ObservatoryCitations />
            </div>
          </section>

          {/* ── Internal: Learning & Revenue Pipeline (ClientZeroKPI) */}
          <section id="observatory-client-zero" className="scroll-mt-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-12 ${isLocked ? 'blur-[2px] opacity-70 pointer-events-none select-none' : ''}`}>
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium uppercase tracking-widest text-amber-400/80">Learning & Revenue Pipeline</span>
              </div>
              <ClientZeroKPI />
            </div>
          </section>

          {/* ── Internal: Graph (Editorial & Confidence) ──────────── */}
          <section id="observatory-graph" className="scroll-mt-16">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-12 ${isLocked ? 'blur-[2px] opacity-70 pointer-events-none select-none' : ''}`}>
              <div className="flex items-center gap-2 mb-6">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium uppercase tracking-widest text-amber-400/80">Editorial Queue & Confidence Review</span>
              </div>
              <ObservatoryGraph />
            </div>
          </section>
        </div>
      </main>

      <ObservatoryFooter />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultTab="login"
      />
    </div>
  )
}
