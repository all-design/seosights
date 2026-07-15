'use client'

import { useEffect, useState } from 'react'
import {
  Palette, RefreshCw, CheckCircle2, ChevronRight, Clock,
  Layers, Type, Space, Sparkles, Box, MousePointer,
  Camera, Search, Filter,
} from 'lucide-react'

// ─── Static Design Data (structural design system tokens) ──

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

// ─── Main Component ──────────────────────────────────────

export default function DesignSystemDocsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {}
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
  }

  const factory = data?.factory || {}
  const system = factory.system || {}
  const counts = factory.counts || {}
  const systemHealthy = Object.values(system).filter((s: any) => s === 'operational').length
  const systemTotal = Object.keys(system).length

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
            <span className="text-xs font-medium text-pink-400">{systemHealthy}/{systemTotal} systems OK</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Rescan
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. System Status Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-pink-500/5 via-slate-900 to-slate-900 border border-pink-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-pink-400" />
              <span className="text-2xl font-bold text-pink-400">{Object.keys(counts).length}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">System Modules</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{systemHealthy}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Operational</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-2xl font-bold text-pink-400">4</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Token Categories</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <MousePointer className="w-4 h-4 text-pink-400" />
              <span className="text-2xl font-bold text-pink-400">Tailwind 4</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Framework</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Color Tokens
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
          4. Spacing Scale
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
          5. Typography
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
          6. Animation Tokens
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
          7. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>Last captured: <span className="text-slate-300">{factory.timestamp ? new Date(factory.timestamp).toLocaleTimeString() : '—'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Framework: <span className="text-slate-300">Tailwind CSS 4</span></span>
        <span className="text-slate-700">|</span>
        <span>Components: <span className="text-slate-300">shadcn/ui (New York)</span></span>
        <span className="text-slate-700">|</span>
        <span>System: <span className="text-pink-400">{systemHealthy}/{systemTotal} healthy</span></span>
      </div>

    </div>
  )
}
