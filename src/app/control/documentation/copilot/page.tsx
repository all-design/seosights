'use client'

import { useSyncExternalStore } from 'react'
import {
  MessageSquare, RefreshCw, Send, Sparkles, Clock, Zap,
  Database, Route, Box, ChevronRight, Search, BookOpen,
  FileCode, Cpu, Hash, TrendingUp, CheckCircle2, ArrowRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

type MessageRole = 'user' | 'copilot'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  sources?: string[]
}

interface SuggestedQuestion {
  id: string
  question: string
  icon: React.ElementType
}

// ─── Mock Data ───────────────────────────────────────────

const chatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'How does Replay work?',
    timestamp: '2:34 PM',
  },
  {
    id: 'msg-2',
    role: 'copilot',
    content: 'The Replay Engine™ records every state mutation and user interaction during a session, storing them as an event stream in the Engineering Memory database. When you trigger a replay, it reconstructs the exact state at any point by replaying the event stream from the beginning. Key components:\n\n• **Event Capture** — Intercepts all state changes via the `useStateObserver` hook\n• **Storage** — Serialized to `ReplayEvent` table in Prisma (SQLite)\n• **Playback** — `ReplayPlayer` component re-applies events in sequence with configurable speed\n• **Time Travel** — Jump to any point in the session timeline using the scrubber\n\nAverage session replay is ~2.3MB compressed. Supports up to 10,000 events per session.',
    timestamp: '2:34 PM',
    sources: ['/control/replay', '/api/replay/events', 'prisma/schema.prisma → ReplayEvent'],
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'Which APIs use Growth Memory?',
    timestamp: '2:35 PM',
  },
  {
    id: 'msg-4',
    role: 'copilot',
    content: 'The following API routes directly reference Growth Memory™:\n\n• **`/api/growth/sessions`** — Reads/writes growth session data with memory context\n• **`/api/growth/insights`** — Generates insights from accumulated growth memory\n• **`/api/growth/score`** — Computes Knowledge Score™ using memory depth\n• **`/api/ai-router/growth`** — AI Router fallback reads growth memory for context-aware suggestions\n• **`/api/engineering-memory/sync`** — Syncs engineering memory with growth memory on deploy\n\nGrowth Memory is also read (read-only) by the Dashboard API for the growth chart widget.',
    timestamp: '2:35 PM',
    sources: ['/api/growth/sessions', '/api/growth/insights', '/api/growth/score', '/api/ai-router/growth'],
  },
  {
    id: 'msg-5',
    role: 'user',
    content: 'Which pages depend on Mission Control?',
    timestamp: '2:36 PM',
  },
  {
    id: 'msg-6',
    role: 'copilot',
    content: 'Pages that depend on Mission Control™:\n\n• **`/control`** — Main dashboard, imports `MissionControl` component directly\n• **`/control/architecture`** — Reads Mission Control state for architecture decisions\n• **`/control/observatory`** — Observatory panels receive data from Mission Control broadcast\n• **`/control/qa`** — QA pipeline uses Mission Control for test orchestration\n• **`/control/deploy`** — Deploy Engine confirms deployments through Mission Control\n• **`/control/replay`** — Replay Engine registers sessions with Mission Control\n\nTotal: **6 pages** have a direct dependency. The `/control/product` page also has an indirect dependency through the AI Router.',
    timestamp: '2:36 PM',
    sources: ['/control', '/control/architecture', '/control/observatory', '/control/qa'],
  },
]

const suggestedQuestions: SuggestedQuestion[] = [
  { id: 'sq-1', question: 'What is the Architecture Reviewer?', icon: BookOpen },
  { id: 'sq-2', question: 'Show me all API endpoints', icon: Route },
  { id: 'sq-3', question: 'Which components use the Database?', icon: Database },
  { id: 'sq-4', question: 'What changed in v0.9.12?', icon: FileCode },
]

// ─── Hydration Guard ─────────────────────────────────────

const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// ─── Main Component ──────────────────────────────────────

export default function AIDocumentationCopilotPage() {
  const mounted = useHydrated()

  if (!mounted) return null

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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Online</span>
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
              <span className="text-2xl font-bold text-cyan-400">431</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Queries Today</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">372</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cached (86% hit)</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-2xl font-bold text-cyan-400">$0.00</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cost Today</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-2xl font-bold text-cyan-400">48ms</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Response</div>
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
            <span className="text-[10px] text-slate-500">{chatMessages.length} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 space-y-4 max-h-[520px] overflow-y-auto custom-scrollbar">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'copilot' && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/15 border border-cyan-500/20 text-slate-200'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-300'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sources</div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700/50 text-cyan-400"
                          >
                            <Route className="w-2.5 h-2.5" />
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="w-2.5 h-2.5 text-slate-600" />
                    <span className="text-[10px] text-slate-600">{msg.timestamp}</span>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Box className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
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
                  Gemini Flash
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-slate-500">Free model — $0.00/mo</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Session Stats
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Questions asked</span>
                <span className="text-[11px] text-white font-medium">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Sources referenced</span>
                <span className="text-[11px] text-white font-medium">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Cache hits</span>
                <span className="text-[11px] text-emerald-400 font-medium">3/3 (100%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Session cost</span>
                <span className="text-[11px] text-cyan-400 font-medium">$0.00</span>
              </div>
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
          <span>Session started: <span className="text-slate-300">2:34 PM</span></span>
        </div>
        <span className="text-slate-700">|</span>
        <span>Docs indexed: <span className="text-slate-300">1,247 files</span></span>
        <span className="text-slate-700">|</span>
        <span>Last sync: <span className="text-slate-300">3m ago</span></span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Model: <span className="text-cyan-400">Gemini Flash (free)</span></span>
        </div>
      </div>

    </div>
  )
}
