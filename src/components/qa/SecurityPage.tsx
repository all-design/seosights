'use client'

import { motion } from 'framer-motion'
import {
  Lock,
  Shield,
  Cookie,
  KeyRound,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── Mock Data ──────────────────────────────────────────────────────────

const securityHeaders = [
  { header: 'Content-Security-Policy', status: 'pass', detail: 'Strict CSP with nonce-based inline scripts' },
  { header: 'X-Frame-Options', status: 'pass', detail: 'DENY — prevents clickjacking' },
  { header: 'X-Content-Type-Options', status: 'pass', detail: 'nosniff set correctly' },
  { header: 'Strict-Transport-Security', status: 'pass', detail: 'max-age=31536000; includeSubDomains' },
  { header: 'Referrer-Policy', status: 'pass', detail: 'strict-origin-when-cross-origin' },
  { header: 'Permissions-Policy', status: 'fail', detail: 'Not set — allows all features by default' },
  { header: 'X-XSS-Protection', status: 'pass', detail: '1; mode=block' },
]

const cookieAnalysis = [
  { name: 'session', secure: true, httpOnly: true, sameSite: 'Strict', domain: '.seo.com', maxAge: '7d', issue: null },
  { name: '_ga', secure: true, httpOnly: false, sameSite: 'Lax', domain: '.seo.com', maxAge: '2y', issue: 'Long expiry — consider shortening' },
  { name: 'theme_pref', secure: false, httpOnly: false, sameSite: 'Lax', domain: '.seo.com', maxAge: '365d', issue: 'Missing Secure flag' },
  { name: 'csrf_token', secure: true, httpOnly: true, sameSite: 'Strict', domain: '.seo.com', maxAge: '1d', issue: null },
  { name: 'tracking_id', secure: true, httpOnly: false, sameSite: 'None', domain: '.seo.com', maxAge: '1y', issue: 'SameSite=None may allow third-party tracking' },
]

const secretsCheck = [
  { check: 'API keys in client bundle', status: 'pass', detail: 'No API keys found in JavaScript bundles' },
  { check: 'Secrets in environment variables', status: 'pass', detail: 'All secrets properly stored in .env' },
  { check: 'Hardcoded credentials', status: 'pass', detail: 'No hardcoded credentials in source code' },
  { check: 'Debug endpoints exposed', status: 'pass', detail: 'Debug endpoints disabled in production' },
  { check: 'Source maps exposed', status: 'fail', detail: '2 source maps publicly accessible' },
  { check: 'Git history leaks', status: 'pass', detail: 'No sensitive data in git history' },
]

const permissionAudit = [
  { role: 'Admin', users: 2, canDelete: true, canExport: true, canInvite: true, risk: 'low' },
  { role: 'Manager', users: 5, canDelete: false, canExport: true, canInvite: true, risk: 'low' },
  { role: 'Editor', users: 12, canDelete: false, canExport: true, canInvite: false, risk: 'low' },
  { role: 'Viewer', users: 48, canDelete: false, canExport: false, canInvite: false, risk: 'low' },
  { role: 'API Key', users: 3, canDelete: false, canExport: true, canInvite: false, risk: 'medium' },
]

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Main Security Page ─────────────────────────────────────────────────

export function SecurityPage() {
  const headersPass = securityHeaders.filter(h => h.status === 'pass').length
  const secretsPass = secretsCheck.filter(s => s.status === 'pass').length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Score ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20">
                <Lock className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Security Score</p>
                <span className="text-5xl font-bold text-red-400 tracking-tighter">97</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Security Headers ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Security Headers</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">{headersPass} of {securityHeaders.length} headers properly configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Progress value={(headersPass / securityHeaders.length) * 100} className="h-2 bg-zinc-800 [&>div]:bg-emerald-500" />
            </div>
            <div className="space-y-1">
              {securityHeaders.map((h) => (
                <div key={h.header} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  {h.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-xs text-zinc-300 font-mono flex-1">{h.header}</span>
                  <span className="text-[10px] text-zinc-500 hidden sm:inline max-w-[250px] truncate">{h.detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cookie Analysis ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Cookie className="w-4 h-4 text-red-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Cookie Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Cookie</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Secure</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">HttpOnly</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">SameSite</th>
                    <th className="text-left text-zinc-500 font-medium pb-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieAnalysis.map((cookie) => (
                    <tr key={cookie.name} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-3 text-zinc-300 font-mono">{cookie.name}</td>
                      <td className="py-2.5 pr-3">
                        {cookie.secure ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {cookie.httpOnly ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-400">{cookie.sameSite}</td>
                      <td className="py-2.5">
                        {cookie.issue ? (
                          <span className="text-amber-400">{cookie.issue}</span>
                        ) : (
                          <span className="text-emerald-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Secrets Check + Permission Audit Row ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Secrets Check */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Secrets Check</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600">{secretsPass} of {secretsCheck.length} checks passed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {secretsCheck.map((check) => (
                  <div key={check.check} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-xs text-zinc-300">{check.check}</span>
                      {check.status === 'fail' && (
                        <p className="text-[10px] text-red-400 mt-0.5">{check.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Permission Audit */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Permission Audit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Role</th>
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Users</th>
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Delete</th>
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Export</th>
                      <th className="text-left text-zinc-500 font-medium pb-2">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionAudit.map((perm) => (
                      <tr key={perm.role} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                        <td className="py-2.5 pr-3 text-zinc-300">{perm.role}</td>
                        <td className="py-2.5 pr-3 text-zinc-400">{perm.users}</td>
                        <td className="py-2.5 pr-3">
                          {perm.canDelete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-zinc-600" />}
                        </td>
                        <td className="py-2.5 pr-3">
                          {perm.canExport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-zinc-600" />}
                        </td>
                        <td className="py-2.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${perm.risk === 'low' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                            {perm.risk}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
