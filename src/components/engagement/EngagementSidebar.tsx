'use client'

import {
  Home,
  Sun,
  Target,
  Flame,
  Mail,
  Clock,
  Gift,
  Brain,
  Zap,
  Trophy,
  Sparkles,
  Calendar,
  BarChart3,
  Lock,
  TrendingUp,
  Activity,
  Menu,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'brief', label: 'Daily Brief', icon: Sun },
  { id: 'missions', label: 'Missions', icon: Target },
  { id: 'streak', label: 'Streak', icon: Flame },
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'countdowns', label: 'Countdowns', icon: Clock },
  { id: 'mystery-box', label: 'Mystery Box', icon: Gift },
  { id: 'predictions', label: 'Predictions', icon: Brain },
  { id: 'drops', label: 'Drops', icon: Zap },
  { id: 'weekly-mission', label: 'Weekly Mission', icon: Trophy },
  { id: 'coach', label: 'AI Coach', icon: Sparkles },
  { id: 'season', label: 'Season', icon: Calendar },
  { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'momentum', label: 'Momentum', icon: TrendingUp },
  { id: 'activity', label: 'Activity', icon: Activity },
]

interface EngagementSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  unreadCount: number
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function EngagementSidebar({
  activeSection,
  onSectionChange,
  unreadCount,
  mobileOpen,
  onMobileClose,
}: EngagementSidebarProps) {
  const handleClick = (id: string) => {
    onSectionChange(id)
    onMobileClose()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <h1 className="text-xl font-bold">
          <span className="text-emerald-500">Momentum</span>
          <span className="text-slate-500 text-sm ml-1">™</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Engagement System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            const showBadge = item.id === 'inbox' && unreadCount > 0

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom branding */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 font-medium">SeoSights</p>
        <p className="text-[10px] text-slate-700 mt-0.5">AI Search Observatory</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
