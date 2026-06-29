'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  TrendingUp,
  Brain,
  FileText,
  Eye,
  Zap,
  Database,
  FlaskConical,
  ArrowLeft,
} from 'lucide-react'
import { useOSStore, type OSSection } from '@/lib/os-store'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const sidebarItems: { key: OSSection; label: string; icon: React.ElementType }[] = [
  { key: 'today', label: 'Today', icon: Star },
  { key: 'growth', label: 'Growth', icon: TrendingUp },
  { key: 'learning', label: 'Learning', icon: Brain },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'insights', label: 'Insights', icon: Eye },
  { key: 'execute', label: 'Execute', icon: Zap },
  { key: 'memory', label: 'Memory', icon: Database },
  { key: 'experiments', label: 'Experiments', icon: FlaskConical },
]

interface OSSidebarProps {
  className?: string
}

export function OSSidebar({ className }: OSSidebarProps) {
  const { section, setSection } = useOSStore()
  const router = useRouter()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-zinc-950 border-r border-zinc-800/50 select-none',
        className
      )}
    >
      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = section === item.key
          const Icon = item.icon

          return (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={cn(
                'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950',
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              {/* Active left border indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full"
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
                  isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />

              <span className="truncate">{item.label}</span>

              {/* Star badge for Today */}
              {item.key === 'today' && !isActive && (
                <span className="ml-auto text-zinc-600 text-xs">⭐</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Back to Superadmin */}
      <div className="p-3 border-t border-zinc-800/50">
        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Superadmin</span>
        </button>
      </div>
    </aside>
  )
}
