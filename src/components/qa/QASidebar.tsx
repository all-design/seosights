'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Bug,
  Palette,
  Package,
  TrendingUp,
  Type,
  Eye,
  Gauge,
  Lock,
  Search,
  Telescope,
  FileText,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { useQAStore, type QASection } from '@/lib/qa-store'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const sidebarItems: { key: QASection; label: string; icon: React.ElementType; accent: string }[] = [
  { key: 'overview', label: 'Overview', icon: Shield, accent: 'emerald' },
  { key: 'functional', label: 'Functional QA', icon: Bug, accent: 'red' },
  { key: 'ux', label: 'UX Reviewer', icon: Palette, accent: 'violet' },
  { key: 'product', label: 'Product Reviewer', icon: Package, accent: 'blue' },
  { key: 'growth', label: 'Growth Reviewer', icon: TrendingUp, accent: 'emerald' },
  { key: 'copy', label: 'Copy Reviewer', icon: Type, accent: 'cyan' },
  { key: 'accessibility', label: 'Accessibility', icon: Eye, accent: 'amber' },
  { key: 'performance', label: 'Performance', icon: Gauge, accent: 'orange' },
  { key: 'security', label: 'Security', icon: Lock, accent: 'red' },
  { key: 'seo', label: 'SEO', icon: Search, accent: 'teal' },
  { key: 'observatory', label: 'Observatory', icon: Telescope, accent: 'purple' },
  { key: 'board', label: 'Board Report', icon: FileText, accent: 'emerald' },
  { key: 'perspectives', label: 'Perspectives', icon: Users, accent: 'rose' },
]

const accentStyles: Record<string, { activeText: string; activeBg: string; hoverBg: string; indicator: string }> = {
  emerald: { activeText: 'text-emerald-400', activeBg: 'bg-emerald-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-emerald-400' },
  red: { activeText: 'text-red-400', activeBg: 'bg-red-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-red-400' },
  violet: { activeText: 'text-violet-400', activeBg: 'bg-violet-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-violet-400' },
  blue: { activeText: 'text-blue-400', activeBg: 'bg-blue-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-blue-400' },
  cyan: { activeText: 'text-cyan-400', activeBg: 'bg-cyan-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-cyan-400' },
  amber: { activeText: 'text-amber-400', activeBg: 'bg-amber-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-amber-400' },
  orange: { activeText: 'text-orange-400', activeBg: 'bg-orange-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-orange-400' },
  teal: { activeText: 'text-teal-400', activeBg: 'bg-teal-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-teal-400' },
  purple: { activeText: 'text-purple-400', activeBg: 'bg-purple-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-purple-400' },
  rose: { activeText: 'text-rose-400', activeBg: 'bg-rose-500/10', hoverBg: 'hover:bg-zinc-800/50', indicator: 'bg-rose-400' },
}

interface QASidebarProps {
  className?: string
}

export function QASidebar({ className }: QASidebarProps) {
  const { section, setSection } = useQAStore()
  const router = useRouter()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-zinc-950 border-r border-zinc-800/50 select-none w-52',
        className
      )}
    >
      {/* Logo Area */}
      <div className="px-3 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-zinc-100 tracking-tight">
              AI QA Center<span className="text-emerald-400 align-super text-[8px] ml-0.5">™</span>
            </h1>
            <p className="text-[10px] text-zinc-600">Quality Assurance</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = section === item.key
          const Icon = item.icon
          const styles = accentStyles[item.accent]

          return (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={cn(
                'group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950',
                isActive
                  ? `${styles.activeText} ${styles.activeBg}`
                  : `text-zinc-400 hover:text-zinc-200 ${styles.hoverBg}`
              )}
            >
              {/* Active left border indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="qa-sidebar-active"
                    className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full', styles.indicator)}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
              </AnimatePresence>

              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors duration-150',
                  isActive ? styles.activeText : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />

              <span className="truncate text-xs">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom: Back to Home */}
      <div className="p-3 border-t border-zinc-800/50">
        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>
    </aside>
  )
}
