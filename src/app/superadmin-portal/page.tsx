'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Shield,
  Activity,
  RefreshCw,
  Loader2,
  Eye,
  Server,
  Database,
  Wifi,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import SuperadminPanel from '@/components/superadmin/SuperadminPanel'
import SuperadminNav from '@/components/superadmin/SuperadminNav'
import CEODashboard from '@/components/superadmin/CEODashboard'
import RetentionDashboard from '@/components/superadmin/RetentionDashboard'
import ActivationDashboard from '@/components/superadmin/ActivationDashboard'
import EventTracker from '@/components/superadmin/EventTracker'
import P1Dashboard from '@/components/superadmin/P1Dashboard'

// ─── Types ──────────────────────────────────────────────────────────────

interface AuthCheck {
  authorized: boolean
  user: { name: string; email: string } | null
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function SuperadminPortalPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<AuthCheck | null>(null)
  const [checking, setChecking] = useState(true)
  const [showFullPanel, setShowFullPanel] = useState(false)
  const [activeTab, setActiveTab] = useState('ceo')
  const [systemHealth, setSystemHealth] = useState<'ok' | 'degraded' | 'down'>('ok')

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/superadmin/check')
        const data: AuthCheck = await res.json()
        setAuth(data)
      } catch {
        setAuth({ authorized: false, user: null })
      } finally {
        setChecking(false)
      }
    }
    checkAuth()
  }, [])

  // Quick health check
  const checkHealth = useCallback(async () => {
    try {
      const start = Date.now()
      await fetch('/api/superadmin/check')
      const elapsed = Date.now() - start
      setSystemHealth(elapsed < 2000 ? 'ok' : 'degraded')
    } catch {
      setSystemHealth('down')
    }
  }, [])

  useEffect(() => {
    if (auth?.authorized) checkHealth()
  }, [auth, checkHealth])

  // Loading state
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying access...</p>
        </motion.div>
      </div>
    )
  }

  // Access denied
  if (!auth?.authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            You do not have permission to access this portal. This area is restricted to authorized administrators only.
          </p>
          <Button
            onClick={() => router.push('/superadmin-portal/login')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Shield className="w-4 h-4 mr-2" />
            Authenticate
          </Button>
        </motion.div>
      </div>
    )
  }

  const healthIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
    if (status === 'degraded') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
    return <XCircle className="w-3.5 h-3.5 text-red-400" />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Superadmin</h1>
              <p className="text-[10px] text-muted-foreground">{auth.user?.email}</p>
            </div>
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[9px] ml-1">
              CEO
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* System health indicator */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {healthIcon(systemHealth)}
              <span className="text-[10px] text-muted-foreground">DB</span>
              <Wifi className="w-3 h-3 text-emerald-400 ml-1" />
              <span className="text-[10px] text-muted-foreground">API</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              className="border-white/10 h-7 text-[11px]"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Health
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullPanel(true)}
              className="border-white/10 h-7 text-[11px]"
            >
              <Settings className="w-3 h-3 mr-1" />
              Panel
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                document.cookie = 'superadmin_key=; path=/; max-age=0'
                router.push('/')
              }}
              className="text-muted-foreground h-7 text-[11px]"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation tabs */}
        <SuperadminNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Dashboard content */}
      <div className="flex-1 p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'ceo' && <CEODashboard />}
            {activeTab === 'retention' && <RetentionDashboard />}
            {activeTab === 'activation' && <ActivationDashboard />}
            {activeTab === 'events' && <EventTracker />}
            {activeTab === 'p1' && <P1Dashboard />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer health bar */}
      <div className="border-t border-white/5 bg-background/80 backdrop-blur-sm px-4 sm:px-6 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>{systemHealth === 'ok' ? 'Database OK' : systemHealth === 'degraded' ? 'Database Slow' : 'Database Down'}</span>
          </div>
          <Separator orientation="vertical" className="h-3 bg-white/5" />
          <div className="flex items-center gap-1.5">
            {systemHealth === 'ok' ? <Wifi className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
            <span>API {systemHealth === 'ok' ? 'Healthy' : 'Issues'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          <span>Superadmin View</span>
        </div>
      </div>

      {/* Full Panel as Dialog overlay */}
      <SuperadminPanel
        isOpen={showFullPanel}
        onClose={() => setShowFullPanel(false)}
      />
    </div>
  )
}
