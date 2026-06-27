'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Network,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────
type LayerKey = 'brand' | 'entity' | 'review' | 'forum' | 'news' | 'wiki' | 'ai'
type NodeStatus = 'strong' | 'weak' | 'missing'

interface GraphNode {
  id: string
  label: string
  layer: LayerKey
  x: number
  y: number
  r: number
  status: NodeStatus
  title: string
  description: string
  fix: string
}

interface GraphEdge {
  from: string
  to: string
  broken: boolean
}

// ── Color tokens (purple primary, rose for missing, amber for weak) ──
const STATUS_COLOR: Record<NodeStatus, { stroke: string; fill: string; label: string }> = {
  strong: { stroke: '#a855f7', fill: 'rgba(168,85,247,0.22)', label: 'Strong' },
  weak: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.18)', label: 'Weak' },
  missing: { stroke: '#f43f5e', fill: 'rgba(244,63,94,0.18)', label: 'Missing' },
}

const LAYER_LABEL: Record<LayerKey, string> = {
  brand: 'Brand',
  entity: 'Entities',
  review: 'Reviews',
  forum: 'Forums',
  news: 'News',
  wiki: 'Knowledge',
  ai: 'AI Engines',
}

const VIEW_W = 760
const VIEW_H = 780

// ── Graph nodes (vertical / hierarchical) ───────────────────
const NODES: GraphNode[] = [
  // Layer 1: Brand (top center)
  { id: 'brand', label: 'Your Brand', layer: 'brand', x: 380, y: 60, r: 42, status: 'strong',
    title: 'Your Brand — the seed of authority',
    description: 'Your brand is the central entity. AI engines build their understanding of you by reading the web of evidence around this node. Every broken link below weakens your authority downstream — and ultimately blocks AI citation.',
    fix: 'Audit your brand entity' },
  // Layer 2: Entities (4)
  { id: 'products', label: 'Products', layer: 'entity', x: 110, y: 180, r: 24, status: 'strong',
    title: 'Products — well-structured entities',
    description: 'Your product catalog uses schema.org Product markup. AI crawlers can identify your products and reference them in shopping-style answers.',
    fix: 'Strengthen product schema' },
  { id: 'founder', label: 'Founder', layer: 'entity', x: 290, y: 180, r: 24, status: 'weak',
    title: 'Founder — underlinked',
    description: "Your founder has a bio page but no independent third-party coverage. AI models can't confidently attribute the brand to a known person, weakening E-E-A-T signals.",
    fix: 'Build founder PR campaign' },
  { id: 'locations', label: 'Locations', layer: 'entity', x: 470, y: 180, r: 24, status: 'missing',
    title: 'Locations — no entity coverage',
    description: 'No local business schema, no Google Business Profile. Local Pack and AI location answers never surface you — a clean miss for any geo-modified query.',
    fix: 'Create GBP + local schema' },
  { id: 'awards', label: 'Awards', layer: 'entity', x: 650, y: 180, r: 24, status: 'weak',
    title: 'Awards — claimed but uncited',
    description: 'You list awards on your site, but no authoritative third-party verifies them. AI treats self-claimed awards as marketing copy, not authority signal.',
    fix: 'Get awards verified externally' },
  // Layer 3: Reviews + Forums (5)
  { id: 'g2', label: 'G2', layer: 'review', x: 70, y: 310, r: 22, status: 'weak',
    title: 'G2 — only 8 reviews',
    description: "Your G2 profile exists but has only 8 reviews vs. competitors' 300+. G2 is a primary source AI uses for product credibility and B2B recommendations.",
    fix: 'Launch G2 review campaign' },
  { id: 'trustpilot', label: 'Trustpilot', layer: 'review', x: 215, y: 310, r: 22, status: 'missing',
    title: 'Trustpilot — no profile',
    description: 'No Trustpilot profile exists. AI assistants that cross-check trust signals will skip you in favor of rated competitors when buyers ask "is X legit?"',
    fix: 'Claim Trustpilot profile' },
  { id: 'capterra', label: 'Capterra', layer: 'review', x: 380, y: 310, r: 22, status: 'weak',
    title: 'Capterra — 4 reviews',
    description: 'Capterra has only 4 reviews. Software buyers cross-reference G2 + Capterra; missing either halves your authority in software recommendation queries.',
    fix: 'Sync Capterra review ask' },
  { id: 'reddit', label: 'Reddit', layer: 'forum', x: 545, y: 310, r: 22, status: 'weak',
    title: 'Reddit — 1 thread',
    description: 'Your brand appears in 1 Reddit thread vs. competitors in 12+. Reddit is now a top citation source for ChatGPT and Perplexity — and the most underweighted channel in B2B marketing.',
    fix: 'Seed Reddit discussions' },
  { id: 'quora', label: 'Quora', layer: 'forum', x: 690, y: 310, r: 22, status: 'missing',
    title: 'Quora — silent',
    description: 'Zero Quora mentions. Quora answers rank well in AI training data and Claude often cites them for "how does X compare to Y" style queries.',
    fix: 'Activate Quora presence' },
  // Layer 4: News (3)
  { id: 'techcrunch', label: 'TechCrunch', layer: 'news', x: 170, y: 440, r: 24, status: 'missing',
    title: 'TechCrunch — no coverage',
    description: "Zero TechCrunch mentions. Competitors have 5+ TC articles — a major citation source AI trusts heavily for 'leading' / 'emerging' style answers.",
    fix: 'Pitch TechCrunch reporter' },
  { id: 'forbes', label: 'Forbes', layer: 'news', x: 380, y: 440, r: 24, status: 'weak',
    title: 'Forbes — 1 contributor post',
    description: 'One Forbes Council contributor post from 2 years ago. Stale and from a contributor, not editorial — AI weights it low.',
    fix: 'Refresh Forbes coverage' },
  { id: 'blogs', label: 'Industry Blogs', layer: 'news', x: 590, y: 440, r: 24, status: 'strong',
    title: 'Industry Blogs — strong',
    description: "You're featured in 14 industry blog roundups. Strongest news-layer signal but weighted lower than tier-1 outlets like TechCrunch and Forbes.",
    fix: 'Convert blog mentions to features' },
  // Layer 5: Knowledge (Wikipedia + Wikidata)
  { id: 'wikipedia', label: 'Wikipedia', layer: 'wiki', x: 260, y: 570, r: 28, status: 'missing',
    title: 'Wikipedia — no article',
    description: "No Wikipedia article about your brand exists. This is the #1 reason Claude doesn't cite you. Wikipedia is the most heavily weighted knowledge source in AI training sets and the cleanest disambiguation signal.",
    fix: 'Create article plan' },
  { id: 'wikidata', label: 'Wikidata', layer: 'wiki', x: 500, y: 570, r: 28, status: 'weak',
    title: 'Wikidata — stub only',
    description: 'A bare Wikidata stub exists (Q-number assigned) but has no statements, descriptions, or references. AI engines read this as low-confidence entity.',
    fix: 'Expand Wikidata statements' },
  // Layer 6: AI Engines (4, bottom)
  { id: 'chatgpt', label: 'ChatGPT', layer: 'ai', x: 110, y: 720, r: 22, status: 'weak',
    title: 'ChatGPT — mentions you 31x',
    description: "ChatGPT mentions you 31 times vs. competitor's 142. The chain above is missing Wikipedia + Reddit, which ChatGPT weights heavily in B2B and recommendation queries.",
    fix: 'Fix upstream authority' },
  { id: 'claude', label: 'Claude', layer: 'ai', x: 290, y: 720, r: 22, status: 'missing',
    title: 'Claude — does not cite you',
    description: 'Claude effectively never cites you. Claude weights Wikipedia and academic sources most — you have neither. Fixing Wikipedia alone typically 5-10× Claude mentions within 60 days.',
    fix: 'Build Wikipedia presence' },
  { id: 'gemini', label: 'Gemini', layer: 'ai', x: 470, y: 720, r: 22, status: 'weak',
    title: 'Gemini — sparse mentions',
    description: 'Gemini mentions you 18 times, mostly from your Google Business Profile stub. Weak Wikidata is your only knowledge-graph signal — Gemini weights KG heavily given its Google lineage.',
    fix: 'Strengthen Wikidata' },
  { id: 'perplexity', label: 'Perplexity', layer: 'ai', x: 650, y: 720, r: 22, status: 'weak',
    title: 'Perplexity — cites competitor 5× more',
    description: "Perplexity cites you 22 times vs. competitor's 110. Perplexity weights Reddit + live news heavily — you're missing Reddit volume and breaking news velocity.",
    fix: 'Build Reddit + news velocity' },
]

// ── Edges (some solid, some dashed-red/broken) ──────────────
const EDGES: GraphEdge[] = [
  // Brand → Entities (solid — internal brand graph intact)
  { from: 'brand', to: 'products', broken: false }, { from: 'brand', to: 'founder', broken: false },
  { from: 'brand', to: 'locations', broken: false }, { from: 'brand', to: 'awards', broken: false },
  // Entities → Reviews/Forums
  { from: 'products', to: 'g2', broken: false }, { from: 'products', to: 'capterra', broken: false },
  { from: 'products', to: 'trustpilot', broken: true }, { from: 'founder', to: 'reddit', broken: false },
  { from: 'founder', to: 'quora', broken: true }, { from: 'awards', to: 'g2', broken: false },
  { from: 'locations', to: 'reddit', broken: true },
  // Reviews/Forums → News
  { from: 'g2', to: 'forbes', broken: false }, { from: 'capterra', to: 'techcrunch', broken: true },
  { from: 'reddit', to: 'techcrunch', broken: false }, { from: 'quora', to: 'blogs', broken: false },
  { from: 'trustpilot', to: 'forbes', broken: true },
  // News → Wiki (mostly broken — the critical drop-off point)
  { from: 'techcrunch', to: 'wikipedia', broken: true }, { from: 'forbes', to: 'wikipedia', broken: true },
  { from: 'blogs', to: 'wikidata', broken: false },
  // Wiki → AI Engines (missing Wikipedia starves Claude + ChatGPT)
  { from: 'wikipedia', to: 'chatgpt', broken: true }, { from: 'wikipedia', to: 'claude', broken: true },
  { from: 'wikipedia', to: 'perplexity', broken: true }, { from: 'wikidata', to: 'gemini', broken: false },
  { from: 'wikidata', to: 'perplexity', broken: false },
]

const nodeById = (id: string) => NODES.find((n) => n.id === id)!

// ── Component ───────────────────────────────────────────────
export default function AIInfluenceGraph({ onStartFree }: { onStartFree: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  // Default to Wikipedia so the punchline ("#1 reason Claude doesn't cite you") is front-and-center.
  const [selectedId, setSelectedId] = useState<string | null>('wikipedia')
  const [isLive, setIsLive] = useState(false)

  // Fetch API data and update node descriptions/status when available
  useEffect(() => {
    fetch('/api/ai/influence-graph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'Acme Inc' }),
    }).then(r => r.json()).then(data => {
      if (data?.nodes && Array.isArray(data.nodes)) {
        for (const apiNode of data.nodes) {
          const existing = NODES.find(n => n.id === apiNode.id || n.label.toLowerCase().includes(apiNode.label?.toLowerCase()?.split(' ')[0] ?? ''))
          if (existing) {
            existing.description = apiNode.description || existing.description
            existing.fix = apiNode.fixAction || existing.fix
            if (apiNode.authority === 'strong') existing.status = 'strong'
            else if (apiNode.authority === 'broken') existing.status = 'weak'
            else if (apiNode.authority === 'missing') existing.status = 'missing'
          }
        }
        // Update edge broken state from API
        if (Array.isArray(data.edges)) {
          for (const apiEdge of data.edges) {
            const existing = EDGES.find(e => (e.from === apiEdge.from && e.to === apiEdge.to) || (e.to === apiEdge.from && e.from === apiEdge.to))
            if (existing) existing.broken = apiEdge.strength === 'broken'
          }
        }
        setIsLive(true)
      }
    }).catch(() => {})
  }, [])

  const selected = NODES.find((n) => n.id === selectedId) || null
  const isEdgeActive = (e: GraphEdge) => selectedId === e.from || selectedId === e.to
  const solidCount = EDGES.filter((e) => !e.broken).length
  const brokenCount = EDGES.filter((e) => e.broken).length
  const missingCount = NODES.filter((n) => n.status === 'missing').length

  return (
    <section id="influence-graph" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-background to-background" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 mb-4">
            <Network className="w-3 h-3 mr-1" /> The Authority Map{isLive && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Live AI</span>}
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            See the exact chain of authority that makes{' '}
            <span className="text-purple-400">AI recommend you.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI doesn&apos;t pick winners randomly. It reads a web of entities, reviews, forums, news, and Wikipedia.
            The Influence Graph maps yours — and shows every broken link.
          </p>
        </motion.div>

        {/* Graph + side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* SVG Graph */}
          <motion.div
            className="lg:col-span-3 rounded-2xl border border-purple-500/20 bg-black/30 p-3 sm:p-4 backdrop-blur-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" role="img" aria-label="Influence graph showing the chain of authority from your brand to AI engines">
              <defs>
                <radialGradient id="brandGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e879f9" />
                  <stop offset="55%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7e22ce" />
                </radialGradient>
                <radialGradient id="brandGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(217,70,239,0.55)" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                </radialGradient>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Edges (drawn first, behind nodes) */}
              {EDGES.map((e, i) => {
                const a = nodeById(e.from)
                const b = nodeById(e.to)
                const active = isEdgeActive(e)
                const stroke = e.broken ? '#f43f5e' : '#a855f7'
                const baseOpacity = selectedId && !active ? 0.16 : e.broken ? 0.78 : 0.65
                // Trim edge endpoints so they don't overlap node circles
                const dx = b.x - a.x
                const dy = b.y - a.y
                const len = Math.sqrt(dx * dx + dy * dy) || 1
                const ux = dx / len
                const uy = dy / len
                const x1 = a.x + ux * (a.r - 2)
                const y1 = a.y + uy * (a.r - 2)
                const x2 = b.x - ux * (b.r - 2)
                const y2 = b.y - uy * (b.r - 2)
                return (
                  <motion.path
                    key={`edge-${i}`}
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={active ? 2.6 : 1.5}
                    strokeLinecap="round"
                    strokeDasharray={e.broken ? '5 5' : 'none'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={isInView ? { pathLength: 1, opacity: baseOpacity } : {}}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.04, ease: 'easeInOut' }}
                  />
                )
              })}

              {/* Brand node with pulsing glow rings */}
              <g>
                {[0, 1, 2].map((k) => (
                  <motion.circle
                    key={`pulse-${k}`}
                    cx={380}
                    cy={60}
                    r={42}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={
                      isInView
                        ? { opacity: [0, 0.6, 0], scale: [0.7, 1.6, 2.3] }
                        : { opacity: 0, scale: 0.7 }
                    }
                    transition={{ duration: 3, repeat: Infinity, delay: k * 1, ease: 'easeOut' }}
                    style={{ transformOrigin: '380px 60px' }}
                  />
                ))}
                <motion.circle
                  cx={380}
                  cy={60}
                  r={52}
                  fill="url(#brandGlow)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'backOut' }}
                  style={{ transformOrigin: '380px 60px' }}
                />
                <motion.circle
                  cx={380}
                  cy={60}
                  r={42}
                  fill="url(#brandGrad)"
                  stroke="#d946ef"
                  strokeWidth={2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.15, ease: 'backOut' }}
                  style={{ transformOrigin: '380px 60px' }}
                />
                <motion.text
                  x={380}
                  y={56}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontWeight={800}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  YOUR
                </motion.text>
                <motion.text
                  x={380}
                  y={70}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontWeight={800}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  BRAND
                </motion.text>
              </g>

              {/* All other nodes (entities, reviews, forums, news, wiki, ai) */}
              {NODES.filter((n) => n.layer !== 'brand').map((n, i) => {
                const c = STATUS_COLOR[n.status]
                const active = selectedId === n.id
                const labelText = n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label
                return (
                  <motion.g
                    key={n.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.05, ease: 'backOut' }}
                    style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                    whileHover={{ scale: 1.12 }}
                    onClick={() => setSelectedId(active ? null : n.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={c.fill}
                      stroke={c.stroke}
                      strokeWidth={active ? 2.8 : 1.8}
                      filter={active ? 'url(#nodeGlow)' : undefined}
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10.5}
                      fontWeight={700}
                      pointerEvents="none"
                    >
                      {labelText}
                    </text>
                    {/* Status dot (top-right) */}
                    <circle
                      cx={n.x + n.r - 6}
                      cy={n.y - n.r + 6}
                      r={4.5}
                      fill={c.stroke}
                      stroke="rgba(0,0,0,0.7)"
                      strokeWidth={1}
                      pointerEvents="none"
                    />
                  </motion.g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#a855f7" strokeWidth="2" /></svg>
                Solid = strong authority
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" /></svg>
                Dashed red = broken link
              </span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Strong</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Weak</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Missing</span>
            </div>
          </motion.div>

          {/* Side panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm p-6 h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30">
                      {LAYER_LABEL[selected.layer]}
                    </Badge>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-tight">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {selected.description}
                  </p>
                  <div className="flex items-center gap-2 mb-5">
                    {selected.status === 'strong' && (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {STATUS_COLOR.strong.label}
                      </Badge>
                    )}
                    {selected.status === 'weak' && (
                      <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" /> {STATUS_COLOR.weak.label}
                      </Badge>
                    )}
                    {selected.status === 'missing' && (
                      <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" /> {STATUS_COLOR.missing.label}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={onStartFree}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> {selected.fix}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 h-full"
                >
                  <div className="grid place-items-center w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 mb-4">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Click any node to inspect</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Each node is one link in your authority chain. Click <span className="text-rose-300 font-medium">Wikipedia</span> to see
                    why Claude never cites you. Click <span className="text-amber-300 font-medium">Reddit</span> to see why ChatGPT
                    picks your competitor. Every broken red edge is a fixable gap.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="text-xl font-bold text-purple-300">{solidCount}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Solid edges</div>
                    </div>
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="text-xl font-bold text-rose-300">{brokenCount}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Broken edges</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-xl font-bold">{missingCount}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Missing nodes</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg h-12 px-8"
          >
            Map your influence graph <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
