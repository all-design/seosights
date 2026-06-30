'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Loader2,
  LogOut,
  Factory,
  PenTool,
  Eye,
  GitMerge,
  Rocket,
  RotateCcw,
  GraduationCap,
  Bug,
  Lock,
  Gauge,
  Code2,
  Database,
  Route,
  DollarSign,
  Landmark,
  BookOpen,
  FileText,
  Webhook,
  Table2,
  TestTube,
  Network,
  MessageSquare,
  FileClock,
  Download,
  Palette,
  Crown,
  Scale,
  Scroll,
  ClipboardList,
} from 'lucide-react'

const navGroups = [
  {
    label: '',
    items: [
      { href: '/control', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: '⚖️ Governance',
    items: [
      { href: '/control/governor', label: 'AI Governor™', icon: Crown },
      { href: '/control/governor/constitution', label: 'Constitution', icon: Scale },
      { href: '/control/governor/master-spec', label: 'Master Spec', icon: Scroll },
      { href: '/control/governor/daily-mission', label: 'Daily Mission', icon: ClipboardList },
    ],
  },
  {
    label: '🧠 Intelligence',
    items: [
      { href: '/control/observatory', label: 'Observatory', icon: Search },
      { href: '/control/product', label: 'Product Engine', icon: Package },
    ],
  },
  {
    label: '🏭 AI Software Factory™',
    items: [
      { href: '/control/architecture', label: 'Architecture Engine', icon: Landmark },
      { href: '/control/engineering', label: 'Engineering Engine', icon: Code2 },
      { href: '/control/qa', label: 'QA Engine', icon: Shield },
      { href: '/control/review', label: 'Review Engine', icon: Eye },
      { href: '/control/security', label: 'Security Engine', icon: Lock },
      { href: '/control/performance', label: 'Performance Engine', icon: Gauge },
    ],
  },
  {
    label: '🔀 Pipeline',
    items: [
      { href: '/control/merge', label: 'Merge Engine', icon: GitMerge },
      { href: '/control/deploy', label: 'Deploy Engine', icon: Rocket },
      { href: '/control/replay', label: 'Replay Engine', icon: RotateCcw },
      { href: '/control/learning', label: 'Learning Engine', icon: GraduationCap },
      { href: '/control/engineering-memory', label: 'Engineering Memory', icon: Database },
    ],
  },
  {
    label: '📚 Documentation',
    items: [
      { href: '/control/documentation', label: 'Documentation Engine™', icon: BookOpen },
      { href: '/control/documentation/product', label: 'Product Docs', icon: Package },
      { href: '/control/documentation/technical', label: 'Technical Docs', icon: FileText },
      { href: '/control/documentation/api', label: 'API Docs', icon: Webhook },
      { href: '/control/documentation/database', label: 'Database Docs', icon: Table2 },
      { href: '/control/documentation/qa', label: 'QA Docs', icon: TestTube },
      { href: '/control/documentation/design-system', label: 'Design System', icon: Palette },
      { href: '/control/documentation/knowledge-graph', label: 'Knowledge Graph™', icon: Network },
      { href: '/control/documentation/copilot', label: 'AI Copilot™', icon: MessageSquare },
      { href: '/control/documentation/changelog', label: 'Changelog', icon: FileClock },
      { href: '/control/documentation/downloads', label: 'Downloads', icon: Download },
    ],
  },
  {
    label: '🤖 AI Mesh',
    items: [
      { href: '/control/ai-router', label: 'AI Router™', icon: Route },
      { href: '/control/ai-cost', label: 'AI Cost Dashboard', icon: DollarSign },
    ],
  },
  {
    label: '⚙️ Operations',
    items: [
      { href: '/control/growth', label: 'Growth Engine', icon: TrendingUp },
      { href: '/control/scheduler', label: 'Mission Scheduler', icon: CalendarClock },
      { href: '/control/client-zero', label: 'Client Zero', icon: Target },
      { href: '/control/engagement', label: 'Engagement', icon: Activity },
    ],
  },
  {
    label: '🔧 Admin',
    items: [
      { href: '/control/tech-debt', label: 'Tech Debt Engine', icon: Bug },
      { href: '/control/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/control/logs', label: 'Logs', icon: ScrollText },
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
  const currentTime = useCurrentTime()
  const [auth, setAuth] = useState<AuthCheck | null>(null)
  const [checking, setChecking] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const hasRedirected = useRef(false)

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

  // Redirect to login if not authorized (but not if already on login page)
  useEffect(() => {
    if (!checking && !auth?.authorized && pathname !== '/control/login' && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace(`/control/login?from=${encodeURIComponent(pathname)}`)
    }
  }, [checking, auth, pathname, router])

  // Logout handler
  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/control/logout', { method: 'POST' })
    } finally {
      router.replace('/control/login')
    }
  }, [router])

  // Don't wrap login page in the control layout shell
  if (pathname === '/control/login') {
    return <>{children}</>
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

  // If not authorized, show nothing (redirect is handled in useEffect)
  if (!auth?.authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-slate-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === '/control') return pathname === '/control'
    return pathname.startsWith(href)
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
              <Factory className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">AI Software Factory™</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Operations Center</div>
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

        {/* Footer with auth info + logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online</span>
            <span className="ml-auto font-mono">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-300 font-medium truncate">
                {auth.user?.name || 'Admin'}
              </div>
              <div className="text-[10px] text-slate-600 truncate">
                {auth.user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-950/90 backdrop-blur border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-semibold text-white">AI Software Factory™</span>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Custom hook for clock
function useCurrentTime() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }))
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return time
}
