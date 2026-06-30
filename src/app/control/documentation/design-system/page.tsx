'use client'

import { useSyncExternalStore, useState } from 'react'
import {
  Palette, RefreshCw, CheckCircle2, ChevronRight, Clock,
  Layers, Type, Space, Sparkles, Box, MousePointer,
  Camera, Search, Filter,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface DesignCategory {
  name: string
  icon: React.ComponentType<{ className?: string }>
  componentCount: number
  documentedCount: number
  coverage: number
}

interface DesignComponent {
  name: string
  purpose: string
  propsCount: number
  variants: number
  states: number
  dependencies: number
  usedByCount: number
  status: 'complete' | 'partial' | 'undocumented'
}

// ─── Mock Data ───────────────────────────────────────────

const designCategories: DesignCategory[] = [
  { name: 'Buttons', icon: MousePointer, componentCount: 12, documentedCount: 12, coverage: 100 },
  { name: 'Cards', icon: Layers, componentCount: 8, documentedCount: 7, coverage: 88 },
  { name: 'Inputs', icon: Box, componentCount: 14, documentedCount: 12, coverage: 86 },
  { name: 'Typography', icon: Type, componentCount: 6, documentedCount: 6, coverage: 100 },
  { name: 'Spacing', icon: Space, componentCount: 4, documentedCount: 4, coverage: 100 },
  { name: 'Animation', icon: Sparkles, componentCount: 9, documentedCount: 6, coverage: 67 },
  { name: 'Icons', icon: Palette, componentCount: 24, documentedCount: 24, coverage: 100 },
  { name: 'Tokens', icon: Box, componentCount: 18, documentedCount: 16, coverage: 89 },
]

const designComponents: DesignComponent[] = [
  { name: 'Button', purpose: 'Primary action trigger with multiple variants', propsCount: 12, variants: 6, states: 5, dependencies: 3, usedByCount: 142, status: 'complete' },
  { name: 'Card', purpose: 'Container for grouped content and actions', propsCount: 8, variants: 4, states: 3, dependencies: 2, usedByCount: 89, status: 'complete' },
  { name: 'Input', purpose: 'Text input with validation and formatting', propsCount: 18, variants: 5, states: 4, dependencies: 4, usedByCount: 67, status: 'partial' },
  { name: 'Dialog', purpose: 'Modal overlay for focused interactions', propsCount: 14, variants: 3, states: 4, dependencies: 5, usedByCount: 34, status: 'complete' },
  { name: 'Badge', purpose: 'Status indicator and label component', propsCount: 6, variants: 8, states: 2, dependencies: 1, usedByCount: 112, status: 'complete' },
  { name: 'Tooltip', purpose: 'Contextual information on hover/focus', propsCount: 9, variants: 2, states: 3, dependencies: 2, usedByCount: 56, status: 'partial' },
  { name: 'Sheet', purpose: 'Side panel for progressive disclosure', propsCount: 11, variants: 2, states: 3, dependencies: 3, usedByCount: 23, status: 'undocumented' },
  { name: 'Tabs', purpose: 'Content organization with tab navigation', propsCount: 7, variants: 3, states: 2, dependencies: 2, usedByCount: 41, status: 'complete' },
]

const colorTokens = [
  { name: 'Primary', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'], color: 'blue' },
  { name: 'Success', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'], color: 'emerald' },
  { name: 'Warning', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'], color: 'amber' },
  { name: 'Danger', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'], color: 'red' },
  { name: 'Neutral', scale: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'], color: 'slate' },
]

const spacingScale = [
  { token: '0', value: '0px', usage: 'Reset' },
  { token: '0.5', value: '2px', usage: 'Micro gaps' },
  { token: '1', value: '4px', usage: 'Inline spacing' },
  { token: '1.5', value: '6px', usage: 'Tight padding' },
  { token: '2', value: '8px', usage: 'Standard gap' },
  { token: '3', value: '12px', usage: 'Card padding' },
  { token: '4', value: '16px', usage: 'Section padding' },
  { token: '6', value: '24px', usage: 'Component spacing' },
  { token: '8', value: '32px', usage: 'Layout spacing' },
  { token: '10', value: '40px', usage: 'Section margin' },
  { token: '12', value: '48px', usage: 'Page margin' },
  { token: '16', value: '64px', usage: 'Hero spacing' },
]

const typographyScale = [
  { token: 'text-xs', size: '12px', lineHeight: '16px', weight: '400/500', usage: 'Captions, badges' },
  { token: 'text-sm', size: '14px', lineHeight: '20px', weight: '400/500', usage: 'Body, labels' },
  { token: 'text-base', size: '16px', lineHeight: '24px', weight: '400/500/600', usage: 'Body, inputs' },
  { token: 'text-lg', size: '18px', lineHeight: '28px', weight: '500/600', usage: 'Subheadings' },
  { token: 'text-xl', size: '20px', lineHeight: '28px', weight: '600/700', usage: 'Card titles' },
  { token: 'text-2xl', size: '24px', lineHeight: '32px', weight: '700', usage: 'Section titles' },
  { token: 'text-3xl', size: '30px', lineHeight: '36px', weight: '700/800', usage: 'Page titles' },
  { token: 'text-4xl', size: '36px', lineHeight: '40px', weight: '800', usage: 'Hero headings' },
]

const animationTokens = [
  { token: 'duration-fast', value: '150ms', usage: 'Hover, focus' },
  { token: 'duration-normal', value: '200ms', usage: 'Toggle, expand' },
  { token: 'duration-slow', value: '300ms', usage: 'Modal, sheet' },
  { token: 'duration-slower', value: '500ms', usage: 'Page transitions' },
  { token: 'ease-default', value: 'cubic-bezier(0.4, 0, 0.2, 1)', usage: 'Standard' },
  { token: 'ease-in', value: 'cubic-bezier(0.4, 0, 1, 1)', usage: 'Exit animations' },
  { token: 'ease-out', value: 'cubic-bezier(0, 0, 0.2, 1)', usage: 'Enter animations' },
  { token: 'ease-bounce', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', usage: 'Playful feedback' },
]

// ─── Helpers ─────────────────────────────────────────────

function statusConfig(status: DesignComponent['status']) {
  switch (status) {
    case 'complete': return { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', label: 'Complete' }
    case 'partial': return { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', label: 'Partial' }
    case 'undocumented': return { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', label: 'Undocumented' }
  }
}

function coverageColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-400'
  if (rate >= 80) return 'text-blue-400'
  if (rate >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function coverageBarColor(rate: number): string {
  if (rate >= 95) return 'bg-emerald-500'
  if (rate >= 80) return 'bg-blue-500'
  if (rate >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function DesignSystemDocsPage() {
  const mounted = useHydrated()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  if (!mounted) return null

  const totalComponents = designComponents.length
  const documentedCount = designComponents.filter(c => c.status !== 'undocumented').length
  const overallCoverage = Math.round((designCategories.reduce((sum, c) => sum + c.coverage, 0)) / designCategories.length)
  const totalUsedBy = designComponents.reduce((sum, c) => sum + c.usedByCount, 0)

  const filteredComponents = selectedStatus === 'all'
    ? designComponents
    : designComponents.filter(c => c.status === selectedStatus)

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/15 flex items-center justify-center">
            <Palette className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Design System Docs™</h1>
            <p className="text-slate-400 text-sm">Component documentation & design tokens</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-xs font-medium text-pink-400">412 components captured</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Rescan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-pink-500/5 via-slate-900 to-slate-900 border border-pink-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-pink-400" />
              <span className="text-2xl font-bold text-pink-400">{totalComponents}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Core Components</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{documentedCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Documented</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-2xl font-bold text-pink-400">{overallCoverage}%</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Coverage</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MousePointer className="w-4 h-4 text-pink-400" />
              <span className="text-2xl font-bold text-pink-400">{totalUsedBy}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Usages</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Categories
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-pink-400" />
          Design Categories
          <span className="ml-auto text-[10px] text-slate-400">{designCategories.length} categories</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {designCategories.map((cat) => {
            const CatIcon = cat.icon
            return (
              <div
                key={cat.name}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center">
                    <CatIcon className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <span className="text-sm font-medium text-white">{cat.name}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                  <span>{cat.documentedCount}/{cat.componentCount} documented</span>
                  <span className={`font-bold ${coverageColor(cat.coverage)}`}>{cat.coverage}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${coverageBarColor(cat.coverage)}`}
                    style={{ width: `${cat.coverage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Component List
          ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-pink-400" />
            Components
            <span className="text-[10px] text-slate-400">{designComponents.length} core</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-500" />
            {(['all', 'complete', 'partial', 'undocumented'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-3">Purpose</div>
            <div className="col-span-1">Props</div>
            <div className="col-span-1">Variants</div>
            <div className="col-span-1">States</div>
            <div className="col-span-1">Deps</div>
            <div className="col-span-1">Used By</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-800/50">
            {filteredComponents.map((comp) => {
              const config = statusConfig(comp.status)
              return (
                <div
                  key={comp.name}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="col-span-2 text-xs font-mono font-medium text-slate-200">{comp.name}</div>
                  <div className="col-span-3 text-[11px] text-slate-400 truncate">{comp.purpose}</div>
                  <div className="col-span-1 text-xs text-slate-300 text-center">{comp.propsCount}</div>
                  <div className="col-span-1 text-xs text-slate-300 text-center">{comp.variants}</div>
                  <div className="col-span-1 text-xs text-slate-300 text-center">{comp.states}</div>
                  <div className="col-span-1 text-xs text-slate-300 text-center">{comp.dependencies}</div>
                  <div className="col-span-1 text-xs text-pink-400 font-medium text-center">{comp.usedByCount}</div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                      {config.label}
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
          5. Color Tokens
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-400" />
          Color Tokens
          <span className="ml-auto text-[10px] text-slate-400">Accent color system</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="space-y-4">
            {colorTokens.map((token) => (
              <div key={token.name}>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{token.name}</div>
                <div className="flex gap-0.5">
                  {token.scale.map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-8 rounded-sm bg-${token.color}-${step} flex items-center justify-center`}
                      title={`${token.name}-${step}`}
                    >
                      <span className="text-[8px] text-slate-400 mix-blend-difference">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          6. Spacing Scale
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Space className="w-4 h-4 text-pink-400" />
          Spacing Scale
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Token</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-4">Visual</div>
            <div className="col-span-4">Usage</div>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-64 overflow-y-auto custom-scrollbar">
            {spacingScale.map((item) => (
              <div key={item.token} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                <div className="col-span-2 text-xs font-mono text-pink-400">p-{item.token}</div>
                <div className="col-span-2 text-xs text-slate-300">{item.value}</div>
                <div className="col-span-4">
                  <div className="h-2 bg-pink-500/40 rounded-full" style={{ width: item.value }} />
                </div>
                <div className="col-span-4 text-[11px] text-slate-400">{item.usage}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          7. Typography
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Type className="w-4 h-4 text-pink-400" />
          Typography Scale
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Token</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2">Line Height</div>
            <div className="col-span-2">Weight</div>
            <div className="col-span-3">Preview</div>
            <div className="col-span-2">Usage</div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {typographyScale.map((item) => (
              <div key={item.token} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                <div className="col-span-2 text-xs font-mono text-pink-400">{item.token}</div>
                <div className="col-span-1 text-xs text-slate-300">{item.size}</div>
                <div className="col-span-2 text-xs text-slate-400">{item.lineHeight}</div>
                <div className="col-span-2 text-xs text-slate-400">{item.weight}</div>
                <div className="col-span-3 text-slate-200 truncate" style={{ fontSize: item.size, lineHeight: item.lineHeight }}>
                  Aa
                </div>
                <div className="col-span-2 text-[11px] text-slate-400">{item.usage}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          8. Animation Tokens
          ═══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Animation Tokens
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Token</div>
            <div className="col-span-4">Value</div>
            <div className="col-span-5">Usage</div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {animationTokens.map((item) => (
              <div key={item.token} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                <div className="col-span-3 text-xs font-mono text-pink-400">{item.token}</div>
                <div className="col-span-4 text-xs font-mono text-slate-300">{item.value}</div>
                <div className="col-span-5 text-[11px] text-slate-400">{item.usage}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          9. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>Last captured: <span className="text-slate-300">1h ago</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Screenshots: <span className="text-pink-400">412 components</span></span>
        <span className="text-slate-700">|</span>
        <span>Framework: <span className="text-slate-300">Tailwind CSS 4</span></span>
        <span className="text-slate-700">|</span>
        <span>Components: <span className="text-slate-300">shadcn/ui (New York)</span></span>
      </div>

    </div>
  )
}
