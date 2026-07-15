'use client'

import { useEffect, useState } from 'react'
import {
  MessageSquare, RefreshCw, Send, Sparkles, Clock, Zap,
  Database, Route, Box, ChevronRight, Search, BookOpen,
  FileCode, Cpu, Hash, TrendingUp, CheckCircle2, ArrowRight,
} from 'lucide-react'

// ─── Static Data (suggested questions — structural UI) ──

const suggestedQuestions = [
  { id: 'sq-1', question: 'What is the Architecture Reviewer?', icon: BookOpen },
  { id: 'sq-2', question: 'Show me all API endpoints', icon: Route },
  { id: 'sq-3', question: 'Which components use the Database?', icon: Database },
  { id: 'sq-4', question: 'What changed in the latest release?', icon: FileCode },
]

// ─── Main Component ──────────────────────────────────────

export default function AIDocumentationCopilotPage() {
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
  const aiProviders = factory.aiProviders || { configured: [], available: [], using: 'rule-based-fallback' }
  const providers = aiProviders.configured.map((id: string) => ({
    id,
    configured: true,
    models: aiProviders.available?.filter((m: any) => m.provider === id) || [],
  })) || []
  const isOnline = aiProviders.using !== 'rule-based-fallback'
  const configuredProviders = providers

  // Get primary model from configured providers
  const primaryProvider = configuredProviders[0]
  const primaryModel = primaryProvider?.models?.find((m: any) => m.free) || primaryProvider?.models?.[0]

  // Derive stats from real data
  const totalModels = providers.reduce((sum: number, p: any) => sum + (p.models?.length || 0), 0)
  const freeModels = providers.reduce((sum: number, p: any) => sum + (p.models?.filter((m: any) => m.free).length || 0), 0)

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════
          1. Header
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Documentation Copilot™</h1>
            <p className="text-slate-400 text-sm">Ask anything about the codebase</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            New Session
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. Stats Banner
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-cyan-500/5 via-slate-900 to-slate-900 border border-cyan-500/15 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span className="text-2xl font-bold text-cyan-400">{aiProviders.configured.length}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Providers</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">{freeModels}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Free Models</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-2xl font-bold text-cyan-400">$0.00</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cost (Free Tier)</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-2xl font-bold text-cyan-400">{totalModels}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Models</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. Chat Interface + Sidebar
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Documentation Session</span>
            </div>
            <span className="text-[10px] text-slate-500">AI-powered</span>
          </div>

          {/* Welcome message */}
          <div className="flex-1 p-5 space-y-4 max-h-[520px] overflow-y-auto custom-scrollbar">
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="max-w-[80%]">
                <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line bg-slate-800/50 border border-slate-700/50 text-slate-300">
                  Hi! I'm the AI Documentation Copilot™. I can help you understand the codebase, find API endpoints, trace dependencies, and answer questions about any system component.

Try asking me about the architecture, specific APIs, database models, or recent changes!
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="text-[10px] text-slate-600">Just now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Input field */}
          <div className="px-4 py-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ask about the codebase..."
                  className="flex-1 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none"
                  readOnly
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 transition-colors text-sm font-medium">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — Suggested Questions */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Suggested Questions
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((sq) => {
                const SIcon = sq.icon
                return (
                  <button
                    key={sq.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-left hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group"
                  >
                    <SIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{sq.question}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Powered By */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Powered By</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">AI Router™</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" />
                  {primaryProvider ? `${primaryProvider.id} — ${primaryModel?.id || 'default'}` : 'No provider configured'}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-slate-500">{primaryModel?.free ? 'Free model — $0.00/mo' : 'Paid model'}</span>
            </div>
          </div>

          {/* Available Models */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Available Models
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {configuredProviders.length === 0 ? (
                <p className="text-[11px] text-slate-500">No providers configured</p>
              ) : (
                configuredProviders.map((provider: any) => (
                  <div key={provider.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${provider.configured ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className="text-[11px] text-slate-300">{provider.id}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{provider.models?.length || 0} models</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. Footer
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Status: <span className="text-slate-300">{aiProviders.using === 'rule-based-fallback' ? 'Rule-based fallback' : 'Online'}</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Providers: <span className="text-slate-300">{aiProviders.configured.length}/{aiProviders.configured.length + aiProviders.available?.length}</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Model: <span className="text-cyan-400">{primaryProvider ? `${primaryProvider.id}/${primaryModel?.id || 'default'}` : 'None'}</span></span>
        </div>
      </div>

    </div>
  )
}
