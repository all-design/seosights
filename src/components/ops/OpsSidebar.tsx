'use client'

import { useOpsStore, type OpsSection } from '@/lib/ops-store'
import {
  Radar,
  LayoutDashboard,
  Zap,
  ShieldCheck,
  Target,
  Telescope,
  Clock,
  Users,
  CalendarClock,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS: { id: OpsSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'age', label: 'AGE', icon: Zap },
  { id: 'qa', label: 'QA Engine', icon: ShieldCheck },
  { id: 'client-zero', label: 'Client Zero', icon: Target },
  { id: 'observatory', label: 'Observatory', icon: Telescope },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'workers', label: 'Workers', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'autonomy', label: 'Autonomy', icon: Gauge },
]

export function OpsSidebar() {
  const { section, setSection } = useOpsStore()

  return (
    <div className="h-full flex flex-col bg-[#0d1321] border-r border-gray-800">
      {/* Branding */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Radar className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              AI Operations Center™
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Mission Control
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = section === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-emerald-400' : 'text-gray-500'
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Status indicator */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Platform Online</span>
        </div>
      </div>
    </div>
  )
}
