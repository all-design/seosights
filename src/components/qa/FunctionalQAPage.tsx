'use client'

import { motion } from 'framer-motion'
import {
  Bug,
  Globe,
  Server,
  MousePointerClick,
  FileInput,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Mock Data ──────────────────────────────────────────────────────────

const testMetrics = [
  { label: 'Pages Tested', value: '47', icon: Globe },
  { label: 'Clicks Tested', value: '312', icon: MousePointerClick },
  { label: 'APIs Tested', value: '89', icon: Server },
  { label: 'Forms Tested', value: '12', icon: FileInput },
]

const pageTestResults = [
  { url: '/', statusCode: 200, loadTime: '1.2s', errors: 0, actions: 14 },
  { url: '/features', statusCode: 200, loadTime: '1.8s', errors: 1, actions: 8 },
  { url: '/pricing', statusCode: 200, loadTime: '1.5s', errors: 0, actions: 6 },
  { url: '/dashboard', statusCode: 200, loadTime: '2.1s', errors: 2, actions: 22 },
  { url: '/settings', statusCode: 200, loadTime: '1.4s', errors: 0, actions: 10 },
  { url: '/onboarding', statusCode: 200, loadTime: '2.4s', errors: 3, actions: 18 },
  { url: '/api/health', statusCode: 200, loadTime: '45ms', errors: 0, actions: 1 },
  { url: '/profile', statusCode: 200, loadTime: '1.6s', errors: 1, actions: 7 },
]

const apiHealth = [
  { endpoint: 'GET /api/users', status: 'healthy', responseTime: '52ms' },
  { endpoint: 'POST /api/auth/login', status: 'healthy', responseTime: '180ms' },
  { endpoint: 'GET /api/projects', status: 'healthy', responseTime: '89ms' },
  { endpoint: 'PUT /api/settings', status: 'degraded', responseTime: '450ms' },
  { endpoint: 'POST /api/checkout', status: 'healthy', responseTime: '220ms' },
  { endpoint: 'GET /api/analytics', status: 'healthy', responseTime: '310ms' },
  { endpoint: 'DELETE /api/users/:id', status: 'healthy', responseTime: '67ms' },
  { endpoint: 'GET /api/search', status: 'failing', responseTime: 'timeout' },
]

const failedClicks = [
  { element: '#submit-btn', page: '/onboarding', error: 'Element not clickable — overlapped by cookie banner' },
  { element: '.dropdown-toggle', page: '/dashboard', error: 'Timeout waiting for visibility' },
  { element: '[data-testid="save"]', page: '/settings', error: 'Click triggered JS error: undefined is not a function' },
  { element: 'a[href="/upgrade"]', page: '/pricing', error: 'Link navigates to 404' },
]

const consoleErrors = [
  { time: '14:23:01', level: 'error', message: 'Uncaught TypeError: Cannot read property "map" of undefined at Dashboard.render' },
  { time: '14:22:58', level: 'warn', message: 'Deprecation warning: ReactDOM.render is no longer supported' },
  { time: '14:22:45', level: 'error', message: 'Failed to fetch /api/search: NetworkError when attempting to fetch resource' },
  { time: '14:22:30', level: 'warn', message: 'Cookie "session" does not have a SameSite attribute' },
  { time: '14:22:15', level: 'error', message: 'Unhandled Promise Rejection: SyntaxError: Unexpected token < in JSON' },
  { time: '14:21:50', level: 'warn', message: 'Slow network detected — consider reducing bundle size' },
  { time: '14:21:30', level: 'error', message: 'ReferenceError: analytics is not defined at trackEvent' },
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

// ── Helpers ────────────────────────────────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case 'healthy': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    case 'degraded': return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
    case 'failing': return <XCircle className="w-3.5 h-3.5 text-red-400" />
    default: return <Clock className="w-3.5 h-3.5 text-zinc-500" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'healthy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'degraded': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'failing': return 'text-red-400 bg-red-500/10 border-red-500/20'
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  }
}

// ── Main Functional QA Page ────────────────────────────────────────────

export function FunctionalQAPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Score + Metrics Row ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <Bug className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Functional QA Score</p>
                  <span className="text-5xl font-bold text-red-400 tracking-tighter">94</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {testMetrics.map((m) => {
          const Icon = m.icon
          return (
            <motion.div key={m.label} variants={itemVariants}>
              <Card className="bg-zinc-900/80 border-zinc-800/60 py-4 gap-3">
                <CardContent className="px-4 pt-0 pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500 font-medium">{m.label}</span>
                    <Icon className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-100 tracking-tight">{m.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Page Test Results Table ───────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Page Test Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="h-[280px]">
              <div className="px-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-4">URL</th>
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-4">Status</th>
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-4">Load Time</th>
                      <th className="text-left text-zinc-500 font-medium pb-2 pr-4">Errors</th>
                      <th className="text-left text-zinc-500 font-medium pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageTestResults.map((row) => (
                      <tr key={row.url} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                        <td className="py-2.5 pr-4 text-zinc-300 font-mono">{row.url}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" className={row.statusCode === 200 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}>
                            {row.statusCode}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-zinc-400">{row.loadTime}</td>
                        <td className="py-2.5 pr-4">
                          {row.errors === 0 ? (
                            <span className="text-emerald-400">0</span>
                          ) : (
                            <span className="text-red-400 font-medium">{row.errors}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-zinc-400">{row.actions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── API Health + Failed Clicks Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* API Health */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">API Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ScrollArea className="h-[250px]">
                <div className="space-y-1 px-2">
                  {apiHealth.map((api) => (
                    <div key={api.endpoint} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                      {getStatusIcon(api.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 font-mono truncate">{api.endpoint}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${getStatusBadge(api.status)}`}>
                        {api.status}
                      </Badge>
                      <span className="text-[10px] text-zinc-500 font-mono w-16 text-right">{api.responseTime}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Failed Clicks */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Failed Clicks</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-zinc-600">{failedClicks.length} click interactions failed</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 px-2">
                  {failedClicks.map((click, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-xs text-zinc-300 font-mono">{click.element}</span>
                      </div>
                      <div className="ml-5.5">
                        <p className="text-[10px] text-zinc-500">Page: <span className="text-zinc-400 font-mono">{click.page}</span></p>
                        <p className="text-[10px] text-red-400/80 mt-0.5">{click.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Console Errors (Terminal Style) ────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Console Errors</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3 font-mono text-[11px] space-y-1.5">
              {consoleErrors.map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="text-zinc-600 shrink-0">{entry.time}</span>
                  <span className={entry.level === 'error' ? 'text-red-400' : 'text-amber-400'} shrink-0 w-10>
                    [{entry.level.toUpperCase().padEnd(5)}]
                  </span>
                  <span className="text-zinc-300 break-all">{entry.message}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-emerald-400">❯</span>
                <span className="text-zinc-600 animate-pulse">▊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
