'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Github,
  Newspaper,
  FileText,
  Star,
  MessageCircle,
  MessagesSquare,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Target,
  type LucideIcon,
} from 'lucide-react'

// NOTE: lucide-react@0.525.0 does not export `Wikipedia` or `Reddit`.
// Substitutes: BookOpen (Wikipedia-style knowledge), MessagesSquare (Reddit threads).

type EngineKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'
type Authority = 'High' | 'Medium' | 'Low'

interface CitationSource {
  id: string
  engine: EngineKey
  icon: LucideIcon
  source: string
  detail: string
  mentions: number
  lastSeen: string
  authority: Authority
  snippet: string
}

interface EngineMeta {
  key: EngineKey
  name: string
  count: number
  accent: string
  text: string
  bg: string
  glow: string
}

const engines: EngineMeta[] = [
  { key: 'chatgpt', name: 'ChatGPT', count: 31, accent: 'border-emerald-500/60', text: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]' },
  { key: 'claude', name: 'Claude', count: 14, accent: 'border-amber-500/60', text: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]' },
  { key: 'gemini', name: 'Gemini', count: 8, accent: 'border-cyan-500/60', text: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]' },
  { key: 'perplexity', name: 'Perplexity', count: 42, accent: 'border-purple-500/60', text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]' },
]

// Mock dataset: "Acme CRM" with 6 citation sources per AI engine (24 total).
const sources: CitationSource[] = [
  // ── ChatGPT ─────────────────────────────────────────────────────────
  { id: 'cg-1', engine: 'chatgpt', icon: MessagesSquare, source: 'Reddit', detail: 'r/SaaS', mentions: 8, lastSeen: '2 days ago', authority: 'High',
    snippet: `"I tried Acme CRM for 3 months — the pipeline automation alone saved my team ~6 hours a week. Worth the switch from HubSpot for sub-50-person teams."` },
  { id: 'cg-2', engine: 'chatgpt', icon: BookOpen, source: 'Wikipedia', detail: "'CRM' article", mentions: 4, lastSeen: '1 week ago', authority: 'High',
    snippet: `"Acme CRM is a cloud-based customer relationship management platform founded in 2018, targeting small and mid-market businesses with workflow automation."` },
  { id: 'cg-3', engine: 'chatgpt', icon: Star, source: 'G2', detail: '142 reviews', mentions: 6, lastSeen: '3 days ago', authority: 'Medium',
    snippet: `"Acme CRM holds a 4.3/5 rating across 142 verified reviews, with reviewers citing automation and ease of setup as standout features versus HubSpot and Pipedrive."` },
  { id: 'cg-4', engine: 'chatgpt', icon: Newspaper, source: 'Forbes', detail: "'Best CRMs 2025'", mentions: 3, lastSeen: '5 days ago', authority: 'High',
    snippet: `"Acme CRM made our 2025 list of best CRMs for small businesses, praised for AI-powered lead scoring and aggressive pricing in the SMB segment."` },
  { id: 'cg-5', engine: 'chatgpt', icon: FileText, source: 'Medium', detail: "'I tried 12 CRMs'", mentions: 5, lastSeen: '2 weeks ago', authority: 'Medium',
    snippet: `"After testing 12 CRMs — Acme, HubSpot, Pipedrive, Zoho and others — Acme won on value-for-money and the depth of its visual automation builder."` },
  { id: 'cg-6', engine: 'chatgpt', icon: Github, source: 'GitHub', detail: 'repo README', mentions: 5, lastSeen: '4 days ago', authority: 'Low',
    snippet: `"Acme CRM exposes a public REST API with full OpenAPI docs. SDKs available for Node, Python, and Ruby. See /docs for quickstart examples."` },

  // ── Claude ───────────────────────────────────────────────────────────
  { id: 'cl-1', engine: 'claude', icon: BookOpen, source: 'Wikipedia', detail: "'CRM' article", mentions: 4, lastSeen: '6 days ago', authority: 'High',
    snippet: `"Acme CRM is a cloud-based CRM founded in 2018, headquartered in Austin, Texas, with a focus on SMB automation workflows and AI lead scoring."` },
  { id: 'cl-2', engine: 'claude', icon: MessagesSquare, source: 'Reddit', detail: 'r/smallbusiness', mentions: 3, lastSeen: '4 days ago', authority: 'High',
    snippet: `"Switched from HubSpot to Acme CRM last quarter — team adapted in a week and we cut our CRM spend by ~60% without losing the workflows we needed."` },
  { id: 'cl-3', engine: 'claude', icon: Star, source: 'G2', detail: '142 reviews', mentions: 3, lastSeen: '1 week ago', authority: 'Medium',
    snippet: `"Acme CRM reviews on G2 highlight strong automation features, with multiple users comparing it favorably to HubSpot and Pipedrive in the SMB tier."` },
  { id: 'cl-4', engine: 'claude', icon: MessageCircle, source: 'Quora', detail: "'Best CRM for startups?'", mentions: 2, lastSeen: '9 days ago', authority: 'Medium',
    snippet: `"For startups, Acme CRM provides a generous free tier and native integrations with Slack and Notion — worth a look before locking into HubSpot."` },
  { id: 'cl-5', engine: 'claude', icon: FileText, source: 'Trustpilot', detail: '89 reviews', mentions: 1, lastSeen: '2 weeks ago', authority: 'Low',
    snippet: `"Acme CRM holds a 4.1 rating across 89 Trustpilot reviews. Common praise: responsive support. Common gripe: limited custom reporting."` },
  { id: 'cl-6', engine: 'claude', icon: Github, source: 'Crunchbase', detail: 'company profile', mentions: 1, lastSeen: '3 weeks ago', authority: 'Medium',
    snippet: `"Acme CRM raised a $12M Series A in 2021 led by Accel, with participation from Y Combinator Continuity and several angel operators."` },

  // ── Gemini ───────────────────────────────────────────────────────────
  { id: 'ge-1', engine: 'gemini', icon: BookOpen, source: 'Wikipedia', detail: "'CRM' article", mentions: 2, lastSeen: '1 week ago', authority: 'High',
    snippet: `"Acme CRM is listed as a notable CRM vendor in the cloud-based category, alongside HubSpot, Pipedrive, and Zoho. Founded 2018."` },
  { id: 'ge-2', engine: 'gemini', icon: Star, source: 'G2', detail: '142 reviews', mentions: 2, lastSeen: '5 days ago', authority: 'Medium',
    snippet: `"Acme CRM has 142 verified reviews on G2 with an average 4.3-star rating, placing it in the top quartile for SMB CRMs in 2024."` },
  { id: 'ge-3', engine: 'gemini', icon: MessagesSquare, source: 'Reddit', detail: 'r/SaaS', mentions: 1, lastSeen: '8 days ago', authority: 'High',
    snippet: `"Acme CRM is mentioned favorably in r/SaaS discussions about affordable HubSpot alternatives for teams under 50 seats."` },
  { id: 'ge-4', engine: 'gemini', icon: Newspaper, source: 'Forbes', detail: "'Best CRMs 2025'", mentions: 1, lastSeen: '11 days ago', authority: 'High',
    snippet: `"Forbes listed Acme CRM as an emerging CRM to watch in 2025, citing its AI lead-scoring and native email sequencing as differentiators."` },
  { id: 'ge-5', engine: 'gemini', icon: FileText, source: 'Medium', detail: "'I tried 12 CRMs'", mentions: 1, lastSeen: '2 weeks ago', authority: 'Medium',
    snippet: `"In a 12-CRM comparison, Acme CRM placed 3rd overall — strongest in automation, weakest in advanced reporting and enterprise SSO."` },
  { id: 'ge-6', engine: 'gemini', icon: Github, source: 'GitHub', detail: 'repo README', mentions: 1, lastSeen: '3 weeks ago', authority: 'Low',
    snippet: `"Acme CRM publishes an open-source Node SDK on GitHub with 1.2k stars and active community contributions across 47 contributors."` },

  // ── Perplexity ───────────────────────────────────────────────────────
  { id: 'px-1', engine: 'perplexity', icon: MessagesSquare, source: 'Reddit', detail: 'r/SaaS', mentions: 12, lastSeen: '1 day ago', authority: 'High',
    snippet: `"Multiple Reddit threads cite Acme CRM as a top affordable alternative to HubSpot for sub-50-person teams. r/SaaS users highlight automation depth."` },
  { id: 'px-2', engine: 'perplexity', icon: Star, source: 'G2', detail: '142 reviews', mentions: 8, lastSeen: '2 days ago', authority: 'Medium',
    snippet: `"G2 reviewers consistently rate Acme CRM above 4 stars, with frequent comparisons to Pipedrive and HubSpot in the SMB segment."` },
  { id: 'px-3', engine: 'perplexity', icon: Newspaper, source: 'Forbes', detail: "'Best CRMs 2025'", mentions: 6, lastSeen: '3 days ago', authority: 'High',
    snippet: `"Forbes highlighted Acme CRM in multiple 2025 roundup articles, praising its AI lead scoring and competitive SMB pricing tier."` },
  { id: 'px-4', engine: 'perplexity', icon: BookOpen, source: 'Wikipedia', detail: "'CRM' article", mentions: 5, lastSeen: '4 days ago', authority: 'High',
    snippet: `"Acme CRM is described as a notable cloud-based CRM founded in 2018, with strengths in workflow automation and SMB-friendly pricing."` },
  { id: 'px-5', engine: 'perplexity', icon: FileText, source: 'Medium', detail: "'I tried 12 CRMs'", mentions: 6, lastSeen: '6 days ago', authority: 'Medium',
    snippet: `"The Medium article benchmarks Acme CRM favorably against 11 competitors, ranking it 3rd overall and 1st for value-for-money."` },
  { id: 'px-6', engine: 'perplexity', icon: Github, source: 'GitHub', detail: 'repo README', mentions: 5, lastSeen: '1 week ago', authority: 'Low',
    snippet: `"Acme CRM's open-source SDK on GitHub has 1.2k stars and an active issue tracker, reflecting a healthy developer ecosystem."` },
]

const authorityStyles: Record<Authority, string> = {
  High: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Low: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

export default function AICitationExplorer({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeEngine, setActiveEngine] = useState<EngineKey>('chatgpt')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  // Fetch real API data on mount
  useEffect(() => {
    fetch('/api/ai/citation-explorer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'Acme Inc' }),
    }).then(r => r.json()).then(data => {
      if (data?.engines) {
        for (const key of ['chatgpt','claude','gemini','perplexity'] as EngineKey[]) {
          const eng = data.engines[key]
          if (eng) {
            const meta = engines.find(e => e.key === key)!
            meta.count = eng.mentionCount ?? meta.count
            for (const src of (eng.sources || [])) {
              const existing = sources.find(s => s.engine === key && s.source === src.name)
              if (existing) {
                existing.mentions = src.mentions ?? existing.mentions
                existing.snippet = src.snippet || existing.snippet
                existing.lastSeen = src.lastSeen || existing.lastSeen
              }
            }
          }
        }
        setIsLive(true)
      }
    }).catch(() => {})
  }, [])

  const engineMeta = engines.find((e) => e.key === activeEngine)!
  const engineSources = sources.filter((s) => s.engine === activeEngine)
  const totalMentions = engineSources.reduce((a, b) => a + b.mentions, 0)

  return (
    <section className="py-24 relative overflow-hidden" ref={ref} id="citation-explorer">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-fuchsia-500/8 rounded-full blur-[140px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Target className="w-3.5 h-3.5" />
            The AI Backlink Checker{isLive && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Live AI</span>}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Every place AI engines learned about you.{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              In one explorer.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            When ChatGPT recommends your competitor, it&apos;s because it read about
            them somewhere. See exactly which sources feed each AI engine&apos;s
            knowledge of your brand.
          </p>
        </motion.div>

        {/* Citation summary bar — 4 engine tabs */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
        >
          {engines.map((e) => {
            const isActive = activeEngine === e.key
            return (
              <motion.button
                key={e.key}
                onClick={() => {
                  setActiveEngine(e.key)
                  setExpandedId(null)
                }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
                aria-pressed={isActive}
                className={`relative text-left p-4 sm:p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  isActive
                    ? `${e.accent} ${e.bg} ${e.glow}`
                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${isActive ? e.text : 'text-muted-foreground'}`}
                  >
                    {e.name}
                  </span>
                  {isActive && (
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${e.text} bg-current`}
                    />
                  )}
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-bold ${isActive ? e.text : 'text-foreground'}`}
                >
                  {e.count}
                  <span className="text-base sm:text-lg font-normal text-muted-foreground ml-1">
                    ×
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  citations tracked
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Active tab content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
            <CardContent className="p-0">
              {/* Sub-header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${engineMeta.bg} flex items-center justify-center`}
                  >
                    <TrendingUp className={`w-5 h-5 ${engineMeta.text}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      Sources {engineMeta.name} reads about Acme CRM
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {engineSources.length} sources · {totalMentions} mentions ·
                      refreshed daily
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-white/15 text-muted-foreground bg-white/5 hidden sm:inline-flex"
                >
                  Click any row to expand the quoted snippet
                </Badge>
              </div>

              {/* Source rows */}
              <AnimatePresence mode="wait">
                <motion.ul
                  key={activeEngine}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.05, delayChildren: 0.05 },
                    },
                    exit: { opacity: 0, transition: { duration: 0.15 } },
                  }}
                  className="divide-y divide-white/5"
                >
                  {engineSources.map((s) => {
                    const isExpanded = expandedId === s.id
                    return (
                      <motion.li
                        key={s.id}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          aria-expanded={isExpanded}
                          className="w-full text-left px-5 sm:px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4"
                        >
                          {/* source icon */}
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <s.icon className="w-5 h-5 text-purple-300" />
                          </div>

                          {/* source name + detail */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {s.source}
                              <span className="text-muted-foreground font-normal">
                                {' '}
                                — {s.detail}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              <span>Last seen {s.lastSeen}</span>
                              <span className="text-white/20">·</span>
                              <Badge
                                variant="outline"
                                className={`h-5 px-2 text-[10px] ${authorityStyles[s.authority]}`}
                              >
                                {s.authority} authority
                              </Badge>
                            </div>
                          </div>

                          {/* mentions count */}
                          <div className="flex flex-col items-end shrink-0 min-w-[60px]">
                            <div
                              className={`text-lg font-bold ${engineMeta.text}`}
                            >
                              {s.mentions}
                            </div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              mentions
                            </div>
                          </div>

                          {/* chevron */}
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Expandable snippet */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 sm:px-6 pb-5 pl-[5.5rem]">
                                <div className="border-l-2 border-purple-500/40 pl-4 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-purple-300/80 mb-1.5 flex items-center gap-1.5">
                                    <ExternalLink className="w-3 h-3" />
                                    What {engineMeta.name} read here
                                  </div>
                                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                                    {s.snippet}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 h-12 rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all"
          >
            Explore your citations
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Tracked across ChatGPT, Claude, Gemini, and Perplexity
          </p>
        </motion.div>
      </div>
    </section>
  )
}
