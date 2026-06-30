'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Brain,
  Shield,
  Search,
  BarChart3,
  ScrollText,
  Settings,
  ChevronRight,
  Menu,
  X,
  Activity,
  Target,
  CalendarClock,
  Package,
  TrendingUp,
  Lock,
  Loader2,
} from 'lucide-react'

const navGroups = [
  {
    label: '',
    items: [
      { href: '/control', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: '🧠 Platform',
    items: [
      { href: '/control/client-zero', label: 'Client Zero', icon: Target },
      { href: '/control/observatory', label: 'Observatory', icon: Search },
    ],
  },
  {
    label: '⚙️ Autonomous Systems',
    items: [
      { href: '/control/growth', label: 'Growth Engine', icon: TrendingUp },
      { href: '/control/qa', label: 'QA Engine', icon: Shield },
      { href: '/control/scheduler', label: 'Mission Scheduler', icon: CalendarClock },
      { href: '/control/product', label: 'Product Engine', icon: Package },
    ],
  },
  {
    label: '📊 Operations',
    items: [
      { href: '/control/engagement', label: 'Engagement', icon: Activity },
      { href: '/control/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/control/logs', label: 'Logs', icon: ScrollText },
    ],
  },
  {
    label: '🔧 Admin',
    items: [
      { href: '/control/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface AuthCheck {
  authorized: boolean
  user: { name: string; email: string } | null
}

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [auth, setAuth] = useState<AuthCheck | null>(null)
  const [checking, setChecking] = useState(true)

  // Auth check
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/check')
      const data: AuthCheck = await res.json()
      setAuth(data)
    } catch {
      setAuth({ authorized: false, user: null })
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isActive = (href: string) => {
    if (href === '/control') return pathname === '/control'
    return pathname.startsWith(href)
  }

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-slate-500 text-sm">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Access denied
  if (!auth?.authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6 max-w-sm">
            AI Operations Center™ is restricted to authorized administrators only.
          </p>
          <button
            onClick={() => router.push('/superadmin-portal/login')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Shield className="w-4 h-4" />
            Authenticate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col overflow-hidden
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <Link href="/control" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">AI Operations Center™</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Control Panel</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label}>
              {group.label && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150
                        ${active
                          ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-400' : ''}`} />
                      <span className="truncate">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto text-emerald-400/60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online</span>
            <span className="ml-auto font-mono">{currentTime}</span>
          </div>
          {auth.user && (
            <div className="px-3 py-1 text-[10px] text-slate-600 truncate">
              {auth.user.email}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-950/90 backdrop-blur border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-semibold text-white">AI Operations Center™</span>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
