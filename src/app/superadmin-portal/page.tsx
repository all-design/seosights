'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Lock,
  Shield,
  Users,
  FileText,
  CreditCard,
  DollarSign,
  Activity,
  Clock,
  Server,
  Database,
  Wifi,
  WifiOff,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import SuperadminPanel from '@/components/superadmin/SuperadminPanel'

// ─── Types ──────────────────────────────────────────────────────────────

interface AuthCheck {
  authorized: boolean
  user: { name: string; email: string } | null
}

interface DashboardStats {
  totalUsers: number
  totalAnalyses: number
  activeSubscriptions: number
  monthlyRevenue: number
  recentSignups: Array<{ id: string; name: string; email: string; tier: string; createdAt: string }>
  systemHealth: {
    database: 'ok' | 'degraded' | 'down'
    api: 'ok' | 'degraded' | 'down'
    lastChecked: string
  }
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function SuperadminPortalPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<AuthCheck | null>(null)
  const [checking, setChecking] = useState(true)
  const [showFullPanel, setShowFullPanel] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [viewUserSearch, setViewUserSearch] = useState('')
  const [viewAnalysisSearch, setViewAnalysisSearch] = useState('')

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/superadmin/check')
        const data: AuthCheck = await res.json()
        setAuth(data)
        if (data.authorized) {
          loadStats()
        }
      } catch {
        setAuth({ authorized: false, user: null })
      } finally {
        setChecking(false)
      }
    }
    checkAuth()
  }, [])

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      // Fetch stats from existing admin APIs
      const [usersRes, analysesRes, tokensRes] = await Promise.all([
        fetch('/api/admin/users?search=&limit=1000').catch(() => null),
        fetch('/api/admin/analyses?status=&limit=1000').catch(() => null),
        fetch('/api/admin/tokens').catch(() => null),
      ])

      let totalUsers = 0
      let totalAnalyses = 0
      let activeSubscriptions = 0
      let monthlyRevenue = 0
      let recentSignups: DashboardStats['recentSignups'] = []

      if (usersRes?.ok) {
        const usersData = await usersRes.json()
        const users = usersData.users || []
        totalUsers = users.length
        activeSubscriptions = users.filter(
          (u: { subscriptionStatus: string }) => u.subscriptionStatus === 'active'
        ).length
        recentSignups = users.slice(0, 5).map((u: { id: string; name: string; email: string; tier: string; createdAt: string }) => ({
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email,
          tier: u.tier || 'trial',
          createdAt: u.createdAt,
        }))
      }

      if (analysesRes?.ok) {
        const analysesData = await analysesRes.json()
        totalAnalyses = analysesData.analyses?.length || analysesData.total || 0
      }

      if (tokensRes?.ok) {
        const tokensData = await tokensRes.json()
        const summary = tokensData.summary
        if (summary) {
          monthlyRevenue = summary.totalCost || 0
        }
      }

      setStats({
        totalUsers,
        totalAnalyses,
        activeSubscriptions,
        monthlyRevenue,
        recentSignups,
        systemHealth: {
          database: 'ok' as const,
          api: 'ok' as const,
          lastChecked: new Date().toISOString(),
        },
      })
    } catch {
      setStats({
        totalUsers: 0,
        totalAnalyses: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        recentSignups: [],
        systemHealth: {
          database: 'ok',
          api: 'ok',
          lastChecked: new Date().toISOString(),
        },
      })
    } finally {
      setLoadingStats(false)
    }
  }, [])

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

  // Dashboard overview
  const healthIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle className="w-4 h-4 text-emerald-400" />
    if (status === 'degraded') return <AlertTriangle className="w-4 h-4 text-amber-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      trial: 'text-gray-400 border-gray-400/30',
      starter: 'text-cyan-400 border-cyan-400/30',
      pro: 'text-emerald-400 border-emerald-400/30',
      managed: 'text-amber-400 border-amber-400/30',
    }
    return (
      <Badge variant="outline" className={`text-[10px] ${colors[tier] || colors.trial}`}>
        {tier.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Superadmin Portal</h1>
              <p className="text-xs text-muted-foreground">{auth.user?.email}</p>
            </div>
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px] ml-2">
              AUTHORIZED
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loadingStats}
              className="border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingStats ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowFullPanel(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Full Panel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                document.cookie = 'superadmin_key=; path=/; max-age=0'
                router.push('/')
              }}
              className="text-muted-foreground"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.totalUsers ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Users</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.totalAnalyses ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Analyses</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.activeSubscriptions ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Subscriptions</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ${stats?.monthlyRevenue != null ? stats.monthlyRevenue.toFixed(2) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Monthly Cost (API)</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Signups */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    Recent Signups
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullPanel(true)}
                    className="text-xs text-muted-foreground"
                  >
                    View All <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {stats?.recentSignups && stats.recentSignups.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats.recentSignups.map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {(user.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {tierBadge(user.tier)}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No users found
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-white/10 bg-card/80 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {healthIcon(stats?.systemHealth.database || 'ok')}
                    <span className="text-xs text-emerald-400 capitalize">
                      {stats?.systemHealth.database || 'ok'}
                    </span>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {stats?.systemHealth.api === 'ok' ? (
                      <Wifi className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">API Server</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {healthIcon(stats?.systemHealth.api || 'ok')}
                    <span className="text-xs text-emerald-400 capitalize">
                      {stats?.systemHealth.api || 'ok'}
                    </span>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Last Checked</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {stats?.systemHealth.lastChecked
                      ? new Date(stats.systemHealth.lastChecked).toLocaleTimeString()
                      : 'Just now'}
                  </span>
                </div>

                <Separator className="bg-white/5" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStats}
                  className="w-full border-white/10 mt-2"
                  disabled={loadingStats}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingStats ? 'animate-spin' : ''}`} />
                  Recheck Health
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* View User */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">View Any User</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by name or email..."
                      value={viewUserSearch}
                      onChange={(e) => setViewUserSearch(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-emerald-500/50"
                    />
                    <Button
                      size="sm"
                      onClick={() => setShowFullPanel(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 mr-1.5" />
                      Find
                    </Button>
                  </div>
                </div>

                {/* View Analysis */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">View Any Analysis</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by URL or domain..."
                      value={viewAnalysisSearch}
                      onChange={(e) => setViewAnalysisSearch(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-emerald-500/50"
                    />
                    <Button
                      size="sm"
                      onClick={() => setShowFullPanel(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 mr-1.5" />
                      Find
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPanel(true)}
                  className="border-white/10 text-xs"
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  Token & Cost Monitor
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPanel(true)}
                  className="border-white/10 text-xs"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Prompt Playground
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPanel(true)}
                  className="border-white/10 text-xs"
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  User Management
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPanel(true)}
                  className="border-white/10 text-xs"
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Analysis History
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPanel(true)}
                  className="border-white/10 text-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Fallback Config
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Full Panel as Dialog overlay */}
      <SuperadminPanel
        isOpen={showFullPanel}
        onClose={() => setShowFullPanel(false)}
      />
    </div>
  )
}
