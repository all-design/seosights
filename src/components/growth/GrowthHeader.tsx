'use client'

import { Brain, Menu, X } from 'lucide-react'
import { useGrowthStore, type GrowthSection } from '@/lib/growth-store'

const sectionLabels: Record<GrowthSection, string> = {
  dashboard: 'Dashboard',
  discovery: 'Discovery',
  opportunities: 'Opportunities',
  queue: 'Queue',
  generation: 'Generation',
  review: 'Review',
  execution: 'Execution',
  learning: 'Learning',
  governor: 'Governor',
  reports: 'Reports',
  settings: 'Settings',
}

interface GrowthHeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function GrowthHeader({ onToggleSidebar, sidebarOpen }: GrowthHeaderProps) {
  const { section } = useGrowthStore()

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
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Autonomous Growth Engine<span className="text-emerald-400 align-super text-[10px] ml-0.5">™</span>
          </h1>
        </div>
      </div>

      {/* Right: Current Section Name */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 hidden sm:inline">Section:</span>
        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
          {sectionLabels[section]}
        </span>
      </div>
    </header>
  )
}
