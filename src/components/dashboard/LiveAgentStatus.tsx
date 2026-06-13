'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { Eye, Check, Loader2, Clock, X } from 'lucide-react'

// ── Agent Status Types ────────────────────────────────────────
type AgentStatus = 'active' | 'scanning' | 'waiting_approval' | 'idle' | 'completed'

interface AgentInfo {
  id: string
  name: string
  emoji: string
  focus: string
  status: AgentStatus
  currentAction: string
  pillar: 'seo' | 'aeo' | 'geo' | 'orchestration'
}

// ── Demo Agent Data (would come from WebSocket in production) ──
function getAgentsFromAnalysis(analysis: import('@/lib/store').SEOAnalysis | null): AgentInfo[] {
  const hasAnalysis = !!analysis

  return [
    {
      id: 'master-director',
      name: 'Master Director',
      emoji: '🎯',
      focus: 'Orchestration',
      status: hasAnalysis ? 'active' : 'active',
      currentAction: hasAnalysis
        ? 'Overseeing execution of 90-day strategy plan'
        : 'Coordinating 8-agent analysis pipeline',
      pillar: 'orchestration',
    },
    {
      id: 'competitor-analyst',
      name: 'Competitor Analyst',
      emoji: '🕵️',
      focus: 'GEO / LLM Monitoring',
      status: hasAnalysis ? 'scanning' : 'scanning',
      currentAction: hasAnalysis
        ? 'Comparing Reddit signals with Notion positioning'
        : 'Scanning competitor landscape for AI visibility',
      pillar: 'geo',
    },
    {
      id: 'tech-schema',
      name: 'Tech & Schema',
      emoji: '⚙️',
      focus: 'Technical SEO & Bots',
      status: hasAnalysis ? 'waiting_approval' : 'scanning',
      currentAction: hasAnalysis
        ? 'Prepared llms.txt file for site deployment'
        : 'Analyzing robots.txt and schema markup',
      pillar: 'seo',
    },
    {
      id: 'content-architect',
      name: 'Content Architect',
      emoji: '🏗️',
      focus: 'Content Optimization',
      status: hasAnalysis ? 'idle' : 'idle',
      currentAction: hasAnalysis
        ? 'Waiting for Tech agent to complete site structure'
        : 'Standing by for content strategy',
      pillar: 'aeo',
    },
    {
      id: 'on-page-auditor',
      name: 'On-Page Auditor',
      emoji: '🔍',
      focus: 'On-Page SEO',
      status: hasAnalysis ? 'completed' : 'active',
      currentAction: hasAnalysis
        ? 'Completed meta tag analysis — 14 issues found'
        : 'Scanning page titles, meta descriptions, headings',
      pillar: 'seo',
    },
    {
      id: 'keyword-researcher',
      name: 'Keyword Researcher',
      emoji: '🔑',
      focus: 'Keyword Opportunities',
      status: hasAnalysis ? 'completed' : 'scanning',
      currentAction: hasAnalysis
        ? 'Identified 23 keyword gaps across 3 pillars'
        : 'Researching keyword opportunities',
      pillar: 'seo',
    },
    {
      id: 'link-strategist',
      name: 'Link Strategist',
      emoji: '🔗',
      focus: 'Authority & Backlinks',
      status: hasAnalysis ? 'idle' : 'idle',
      currentAction: hasAnalysis
        ? 'Analyzing backlink profile and authority score'
        : 'Standing by for link analysis',
      pillar: 'seo',
    },
    {
      id: 'backlink-prospector',
      name: 'Backlink Prospector',
      emoji: '🤝',
      focus: 'Outreach & KPIs',
      status: hasAnalysis ? 'idle' : 'idle',
      currentAction: hasAnalysis
        ? 'Preparing outreach targets from competitor gaps'
        : 'Standing by for prospecting',
      pillar: 'geo',
    },
  ]
}

// ── Status Indicator ──────────────────────────────────────────
function StatusDot({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    active: 'bg-emerald-500',
    scanning: 'bg-blue-500',
    waiting_approval: 'bg-amber-500',
    idle: 'bg-slate-500',
    completed: 'bg-emerald-500',
  }

  const shouldPulse = status === 'active' || status === 'scanning' || status === 'waiting_approval'

  return (
    <span className="relative flex h-3 w-3">
      {shouldPulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-40`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${colors[status]}`}
      />
    </span>
  )
}

// ── Status Label ──────────────────────────────────────────────
function StatusLabel({ status }: { status: AgentStatus }) {
  const config: Record<AgentStatus, { label: string; className: string }> = {
    active: { label: 'Aktivan', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    scanning: { label: 'Skenira', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    waiting_approval: { label: 'Čeka odobrenje', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    idle: { label: 'Na čekanju', className: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
    completed: { label: 'Završeno', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${c.className}`}>
      {c.label}
    </Badge>
  )
}

// ── Pillar Dot ────────────────────────────────────────────────
function PillarDot({ pillar }: { pillar: string }) {
  const colors: Record<string, string> = {
    seo: 'bg-purple-500',
    aeo: 'bg-blue-500',
    geo: 'bg-indigo-500',
    orchestration: 'bg-emerald-500',
  }
  return <span className={`w-2 h-2 rounded-full ${colors[pillar] || 'bg-slate-500'}`} />
}

// ── Main Component ────────────────────────────────────────────
export default function LiveAgentStatus() {
  const { analysis, mode } = useAppStore()
  const agents = getAgentsFromAnalysis(analysis)
  const isCoPilot = mode === 'co-pilot'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="pt-6 pb-4 px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Live Agent Status
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                8 AI agents working for you in real-time
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase ${
                isCoPilot
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                  : mode === 'audit'
                  ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              }`}
            >
              {isCoPilot ? 'Co-Pilot Mode' : mode === 'audit' ? 'Audit Mode' : 'Auto-Pilot Mode'}
            </Badge>
          </div>

          {/* Agent List */}
          <div className="space-y-2">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-white/[0.03] ${
                  agent.status === 'waiting_approval'
                    ? 'border-amber-500/20 bg-amber-500/[0.03]'
                    : 'border-white/5 bg-white/[0.01]'
                }`}
              >
                {/* Emoji + Status Dot */}
                <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 shrink-0">
                  <span className="text-lg">{agent.emoji}</span>
                </div>

                {/* Agent Name + Focus */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {agent.name}
                    </span>
                    <PillarDot pillar={agent.pillar} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">{agent.focus}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusDot status={agent.status} />
                  <StatusLabel status={agent.status} />
                </div>

                {/* Current Action */}
                <div className="hidden lg:block min-w-0 max-w-[280px]">
                  <p className="text-xs text-muted-foreground truncate">{agent.currentAction}</p>
                </div>

                {/* Co-Pilot Action Button — "Vidi i Odobri Akciju" */}
                {isCoPilot && agent.status === 'waiting_approval' && (
                  <Button
                    size="sm"
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold shrink-0"
                  >
                    <Eye className="w-3 h-3 mr-1.5" />
                    Vidi i Odobri Akciju
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
