'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Shield,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

export interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'ceo', label: 'CEO Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'retention', label: 'Retention', icon: <RotateCcw className="h-4 w-4" /> },
  { key: 'activation', label: 'Activation', icon: <Zap className="h-4 w-4" /> },
  { key: 'events', label: 'Events', icon: <Activity className="h-4 w-4" /> },
  { key: 'p1', label: 'P1 Modules', icon: <Layers className="h-4 w-4" /> },
]

interface SuperadminNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

// ─── Component ──────────────────────────────────────────────────────────

export default function SuperadminNav({ activeTab, onTabChange }: SuperadminNavProps) {
  return (
    <>
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────────── */}
      <nav className="hidden md:flex flex-col w-56 shrink-0 border-r border-white/10 bg-card/50 backdrop-blur-sm rounded-l-xl">
        <div className="p-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <span className="font-semibold text-sm text-foreground">Superadmin</span>
        </div>
        <Separator className="bg-white/5" />
        <div className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key
            return (
              <Button
                key={item.key}
                variant="ghost"
                onClick={() => onTabChange(item.key)}
                className={`w-full justify-start gap-3 text-sm h-10 px-3 transition-all ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/15 hover:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 w-0.5 h-5 bg-emerald-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Button>
            )
          })}
        </div>
        <Separator className="bg-white/5" />
        <div className="p-4">
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </nav>

      {/* ── Mobile Horizontal Tabs (shown on mobile) ──────────────────── */}
      <div className="md:hidden border-b border-white/10 bg-card/50 backdrop-blur-sm">
        <div className="flex overflow-x-auto px-2 py-2 gap-1 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key
            return (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.key)}
                className={`shrink-0 gap-2 text-xs px-3 h-8 rounded-md transition-all ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/15 hover:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
