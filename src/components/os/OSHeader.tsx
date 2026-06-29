'use client'

import { motion } from 'framer-motion'
import { Star, Menu, X } from 'lucide-react'
import { useOSStore, type OSMode } from '@/lib/os-store'
import { cn } from '@/lib/utils'

const modeOptions: { key: OSMode; label: string }[] = [
  { key: 'executive', label: 'Executive' },
  { key: 'builder', label: 'Builder' },
  { key: 'developer', label: 'Developer' },
]

interface OSHeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function OSHeader({ onToggleSidebar, sidebarOpen }: OSHeaderProps) {
  const { mode, setMode } = useOSStore()

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
            <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          </div>
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            AI Visibility OS<span className="text-emerald-400 align-super text-[10px] ml-0.5">™</span>
          </h1>
        </div>
      </div>

      {/* Right: Mode Toggle */}
      <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800/50">
        {modeOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              mode === opt.key
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {mode === opt.key && (
              <motion.div
                layoutId="mode-toggle"
                className="absolute inset-0 bg-zinc-800 rounded-md border border-zinc-700/50"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
