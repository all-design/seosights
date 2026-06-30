'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  TestTube, RefreshCw, CheckCircle2, XCircle, MinusCircle,
  Clock, Shield, Zap, Eye, Lock, Accessibility, Flame,
  ChevronRight, Search, Filter, BarChart3, FileText,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type TestStatus = 'pass' | 'fail' | 'skip'

interface TestCategory {
  name: string
  count: number
  passRate: number
  lastRun: string
  icon: React.ComponentType<{ className?: string }>
}

interface TestCase {
  id: string
  name: string
  type: string
  status: TestStatus
  component: string
  lastRun: string
}

// ─── Mock Data ───────────────────────────────────────────

const testCategories: TestCategory[] = [
  { name: 'Test Cases', count: 431, passRate: 94, lastRun: '2m ago', icon: FileText },
  { name: 'Regression', count: 128, passRate: 97, lastRun: '15m ago', icon: RefreshCw },
  { name: 'Smoke', count: 47, passRate: 100, lastRun: '5m ago', icon: Flame },
  { name: 'Performance', count: 23, passRate: 87, lastRun: '1h ago', icon: Zap },
  { name: 'Security', count: 34, passRate: 91, lastRun: '30m ago', icon: Lock },
  { name: 'Accessibility', count: 19, passRate: 79, lastRun: '45m ago', icon: Accessibility },
]

const testCases: TestCase[] = [
  { id: 'TC-4012', name: 'Dashboard renders all metric cards', type: 'Smoke', status: 'pass', component: 'Dashboard', lastRun: '2m ago' },
  { id: 'TC-4128', name: 'Growth pipeline stage transitions', type: 'Regression', status: 'pass', component: 'GrowthEngine', lastRun: '5m ago' },
  { id: 'TC-4256', name: 'Login auth flow with 2FA', type: 'Test Cases', status: 'pass', component: 'Auth', lastRun: '8m ago' },
  { id: 'TC-4301', name: 'API rate limiting under load', type: 'Performance', status: 'fail', component: 'API', lastRun: '12m ago' },
  { id: 'TC-4315', name: 'Color contrast ratio WCAG AA', type: 'Accessibility', status: 'skip', component: 'DesignSystem', lastRun: '15m ago' },
  { id: 'TC-4402', name: 'SQL injection prevention on search', type: 'Security', status: 'pass', component: 'Search', lastRun: '18m ago' },
  { id: 'TC-4421', name: 'Deployment rollback on metric regression', type: 'Regression', status: 'fail', component: 'DeployEngine', lastRun: '22m ago' },
  { id: 'TC-4498', name: 'Sidebar navigation active state highlight', type: 'Test Cases', status: 'pass', component: 'Navigation', lastRun: '25m ago' },
]

const coverageComponents = [
  { name: 'Dashboard', tests: 42, covered: true },
  { name: 'GrowthEngine', tests: 38, covered: true },
  { name: 'QAEngine', tests: 31, covered: true },
  { name: 'Auth', tests: 27, covered: true },
  { name: 'API', tests: 24, covered: true },
  { name: 'DesignSystem', tests: 19, covered: true },
  { name: 'Search', tests: 16, covered: true },
  { name: 'DeployEngine', tests: 14, covered: true },
  { name: 'Navigation', tests: 12, covered: true },
  { name: 'Observatory', tests: 11, covered: true },
  { name: 'Scheduler', tests: 9, covered: true },
  { name: 'SecurityEngine', tests: 8, covered: true },
  { name: 'ReviewEngine', tests: 6, covered: false },
  { name: 'MergeEngine', tests: 4, covered: false },
  { name: 'ReplayEngine', tests: 3, covered: false },
]

// ─── Helpers ─────────────────────────────────────────────

function statusConfig(status: TestStatus) {
  switch (status) {
    case 'pass': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Pass' }
    case 'fail': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: XCircle, label: 'Fail' }
    case 'skip': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: MinusCircle, label: 'Skip' }
  }
}

function passRateColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-400'
  if (rate >= 85) return 'text-blue-400'
  if (rate >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function passRateBarColor(rate: number): string {
  if (rate >= 95) return 'bg-emerald-500'
  if (rate >= 85) return 'bg-blue-500'
  if (rate >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function QADocsPage() {
  const mounted = useHydrated()
  const [selectedType, setSelectedType] = useState<string>('all')

  if (!mounted) return null

  const totalTests = testCategories.reduce((sum, c) => sum + c.count, 0)
  const avgPassRate = Math.round(testCategories.reduce((sum, c) => sum + c.passRate, 0) / testCategories.length)
  const failedTests = testCases.filter(t => t.status === 'fail').length
  const skippedTests = testCases.filter(t => t.status === 'skip').length

  const filteredCases = selectedType === 'all'
    ? testCases
    : testCases.filter(t => t.type === selectedType)

  const types = ['all', ...Array.from(new Set(testCases.map(t => t.type)))]

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <TestTube className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">QA Docs™</h1>
            <p className="text-slate-400 text-sm">Auto-generated test documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-400">Auto-generated</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-blue-500/5 via-slate-900 to-slate-900 border border-blue-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{totalTests}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Tests</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{avgPassRate}%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Pass Rate</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-2xl font-bold text-red-400">{failedTests}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Failed</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MinusCircle className="w-4 h-4 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">{skippedTests}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Skipped</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Test Categories
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Test Categories
          <span className="ml-auto text-[10px] text-slate-400">{testCategories.length} categories</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testCategories.map((cat) => {
            const CatIcon = cat.icon
            return (
              <div
                key={cat.name}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <CatIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{cat.name}</div>
                    <div className="text-[10px] text-slate-500">{cat.count} tests</div>
                  </div>
                </div>
                {/* Pass rate bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Pass Rate</span>
                    <span className={`text-xs font-bold ${passRateColor(cat.passRate)}`}>{cat.passRate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${passRateBarColor(cat.passRate)}`}
                      style={{ width: `${cat.passRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last run: {cat.lastRun}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Test Cases
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Test Cases
            <span className="text-[10px] text-slate-400">{testCases.length} shown</span>
          </h2>
          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-500" />
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Component</div>
            <div className="col-span-2">Last Run</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-800/50">
            {filteredCases.map((tc) => {
              const config = statusConfig(tc.status)
              const StatusIcon = config.icon
              return (
                <div
                  key={tc.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="col-span-1 text-xs font-mono text-slate-500">{tc.id}</div>
                  <div className="col-span-4 text-xs text-slate-300 truncate">{tc.name}</div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/15">
                      {tc.type}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-xs font-mono text-slate-400">{tc.component}</div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {tc.lastRun}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          5. Coverage Map
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          Coverage Map
          <span className="ml-auto text-[10px] text-slate-400">{coverageComponents.filter(c => c.covered).length}/{coverageComponents.length} components covered</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {coverageComponents.map((comp) => (
              <div
                key={comp.name}
                className={`relative p-3 rounded-lg border transition-all duration-200 ${
                  comp.covered
                    ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                    : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${comp.covered ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  <span className={`text-xs font-medium ${comp.covered ? 'text-slate-200' : 'text-slate-500'}`}>
                    {comp.name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {comp.tests} tests
                </div>
                {comp.covered && (
                  <div className="absolute top-1.5 right-1.5">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-400">Covered</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-slate-400">Not covered</span>
            </div>
            <span className="ml-auto text-[10px] text-slate-500">
              Auto-generated from test runner output
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Last generated: <span className="text-slate-300">2m ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Test runner: <span className="text-slate-300">Jest + Playwright</span></span>
        <span className="text-slate-700">|</span>
        <span>Total coverage: <span className="text-blue-400">87%</span></span>
        <span className="text-slate-700">|</span>
        <span>Auto-regen: <span className="text-slate-300">Every 5 min</span></span>
      </div>

    </div>
  )
}
