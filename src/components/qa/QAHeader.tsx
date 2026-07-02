'use client'

import { Shield, Menu, X } from 'lucide-react'
import { useQAStore, type QASection } from '@/lib/qa-store'

const sectionLabels: Record<QASection, string> = {
  overview: 'Overview',
  functional: 'Functional QA',
  ux: 'UX Reviewer',
  product: 'Product Reviewer',
  growth: 'Growth Reviewer',
  copy: 'Copy Reviewer',
  accessibility: 'Accessibility',
  performance: 'Performance',
  security: 'Security',
  seo: 'SEO',
  observatory: 'Observatory',
  board: 'Board Report',
  perspectives: 'Perspectives',
}

const sectionAccents: Record<QASection, string> = {
  overview: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  functional: 'text-red-400 bg-red-500/10 border-red-500/20',
  ux: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  product: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  growth: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  copy: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  accessibility: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  performance: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  security: 'text-red-400 bg-red-500/10 border-red-500/20',
  seo: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  observatory: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  board: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  perspectives: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

interface QAHeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function QAHeader({ onToggleSidebar, sidebarOpen }: QAHeaderProps) {
  const { section } = useQAStore()

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm shrink-0">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            AI QA Center<span className="text-emerald-400 align-super text-[10px] ml-0.5">™</span>
          </h1>
        </div>
      </div>

      {/* Right: Current Section Name */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 hidden sm:inline">Section:</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${sectionAccents[section]}`}>
          {sectionLabels[section]}
        </span>
      </div>
    </header>
  )
}
