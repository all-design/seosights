'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth, type UserRole } from '@/lib/auth-context'
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Building2,
  Users,
  Shield,
  Loader2,
} from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

// ── Role Selection Card ──────────────────────────────────────────────────
function RoleCard({
  role,
  title,
  description,
  icon: Icon,
  selected,
  onClick,
}: {
  role: UserRole
  title: string
  description: string
  icon: React.ElementType
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? 'bg-emerald-500/20' : 'bg-white/10'
        }`}>
          <Icon className={`w-5 h-5 ${selected ? 'text-emerald-400' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">{title}</div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  )
}

export default function LoginModal({ isOpen, onClose, defaultTab = 'login' }: LoginModalProps) {
  const { login, register } = useAuth()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regRole, setRegRole] = useState<UserRole>('user')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(loginEmail, loginPassword)
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      // Get referral code from cookie if present
      const refCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('seosights_ref='))
      const referralCode = refCookie?.split('=')[1]

      const result = await register({
        email: regEmail,
        password: regPassword,
        name: regName || undefined,
        role: regRole,
        referralCode,
      })

      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-background border-white/10 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Welcome to seosights</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-Powered SEO, AEO & GEO Platform
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError('') }}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
              <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-sm">Start Free Trial</TabsTrigger>
            </TabsList>

            {/* ── Login Tab ──────────────────────────────────────────── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Log In
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Superadmin? Use your credentials — dashboard auto-redirects based on role.
                </p>
              </form>
            </TabsContent>

            {/* ── Register Tab ───────────────────────────────────────── */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-sm">I am a...</Label>
                  <div className="grid gap-2">
                    <RoleCard
                      role="user"
                      title="Business Owner / Marketer"
                      description="Track 1 domain, SEO/AEO/GEO dashboard, 50 queries"
                      icon={User}
                      selected={regRole === 'user'}
                      onClick={() => setRegRole('user')}
                    />
                    <RoleCard
                      role="agency"
                      title="Agency / Pro"
                      description="Track 20 sites, white-label PDFs, client management"
                      icon={Building2}
                      selected={regRole === 'agency'}
                      onClick={() => setRegRole('agency')}
                    />
                    <RoleCard
                      role="affiliate"
                      title="Affiliate / Reseller"
                      description="Earn 10-50% recurring commissions per referral"
                      icon={Users}
                      selected={regRole === 'affiliate'}
                      onClick={() => setRegRole('affiliate')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm">Name (optional)</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Your name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Start Free Trial
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By registering you agree to our Terms of Service.
                  {regRole === 'affiliate' && ' Your affiliate code will be generated automatically.'}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
