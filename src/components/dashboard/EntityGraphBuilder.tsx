'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network, Sparkles, Info, ArrowRight, Share2, X } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
type EntityType = 'concept' | 'tool' | 'ai-model' | 'standard'

interface GraphEntity {
  id: string; label: string; type: EntityType; strength: number
  description: string; mentionedBy: string[]; x: number; y: number
}

// ── Type color tokens (no indigo / no blue as primary) ───────
const TYPE_COLORS: Record<
  EntityType,
  { stroke: string; fill: string; glow: string; label: string }
> = {
  concept: { stroke: '#10b981', fill: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.45)', label: 'Concept' },
  tool: { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.15)', glow: 'rgba(6,182,212,0.45)', label: 'Tool' },
  'ai-model': { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.45)', label: 'AI Model' },
  standard: { stroke: '#a855f7', fill: 'rgba(168,85,247,0.15)', glow: 'rgba(168,85,247,0.45)', label: 'Standard' },
}

const AI_MODELS: Record<string, { label: string; color: string }> = {
  chatgpt: { label: 'ChatGPT', color: '#10b981' },
  claude: { label: 'Claude', color: '#f59e0b' },
  perplexity: { label: 'Perplexity', color: '#06b6d4' },
  gemini: { label: 'Gemini', color: '#a855f7' },
}

const CENTER = { x: 400, y: 250 }
const AUTHORITY_SCORE = 78
// radius / edge thickness scale with association strength
const nodeRadius = (s: number) => 14 + (s - 50) * 0.26
const edgeThickness = (s: number) => 0.8 + (s / 100) * 3.4
function deriveBrand(url?: string): string {
  if (!url) return 'seosights'
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'seosights'
}

// ── Mock entity data with fixed radial positions around CENTER ─
const ENTITIES: GraphEntity[] = [
  { id: 'seo', label: 'SEO', type: 'concept', strength: 92, x: 400, y: 75,
    description: 'Search Engine Optimization — the foundational discipline of earning organic discovery across Google, Bing, and other index-based engines.',
    mentionedBy: ['chatgpt', 'claude', 'perplexity'] },
  { id: 'geo', label: 'GEO', type: 'concept', strength: 88, x: 503, y: 108,
    description: 'Generative Engine Optimization — the practice of being cited inside AI-generated responses and AI Overviews rather than classic blue links.',
    mentionedBy: ['chatgpt', 'claude', 'perplexity', 'gemini'] },
  { id: 'aeo', label: 'AEO', type: 'concept', strength: 84, x: 566, y: 196,
    description: 'Answer Engine Optimization — structuring content so AI assistants can extract it as a clean, citable direct answer.',
    mentionedBy: ['chatgpt', 'perplexity'] },
  { id: 'schema', label: 'Schema Markup', type: 'standard', strength: 86, x: 566, y: 304,
    description: 'Structured-data vocabularies (JSON-LD, Microdata, RDFa) that disambiguate entities and relationships for machine readers.',
    mentionedBy: ['chatgpt', 'claude', 'gemini'] },
  { id: 'knowledge-graph', label: 'Knowledge Graph', type: 'tool', strength: 81, x: 503, y: 392,
    description: "Google's entity database that weaves people, places, concepts, and organizations into a single queryable graph.",
    mentionedBy: ['chatgpt', 'gemini'] },
  { id: 'ai-search', label: 'AI Search', type: 'concept', strength: 79, x: 400, y: 425,
    description: 'The emerging search category mediated by large language models rather than keyword indices — where answers replace result lists.',
    mentionedBy: ['chatgpt', 'perplexity', 'claude'] },
  { id: 'chatgpt', label: 'ChatGPT', type: 'ai-model', strength: 76, x: 297, y: 392,
    description: "OpenAI's flagship assistant, used by 200M+ weekly users for search-style queries and cited answers.",
    mentionedBy: ['chatgpt'] },
  { id: 'llms-txt', label: 'llms.txt', type: 'standard', strength: 71, x: 234, y: 304,
    description: 'A proposed convention that surfaces site context — products, docs, entities — to AI crawlers in a concise, machine-readable form.',
    mentionedBy: ['claude', 'perplexity'] },
  { id: 'perplexity', label: 'Perplexity', type: 'ai-model', strength: 73, x: 234, y: 196,
    description: 'AI-native answer engine that cites web sources inline with each generated response, blurring the line between search and chat.',
    mentionedBy: ['perplexity'] },
  { id: 'claude', label: 'Claude', type: 'ai-model', strength: 68, x: 297, y: 108,
    description: "Anthropic's assistant known for nuanced reasoning, long-context analysis, and citation-aware responses.",
    mentionedBy: ['claude'] },
]

// ── Main Component ───────────────────────────────────────────
export default function EntityGraphBuilder({ url }: { url?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const brand = deriveBrand(url)
  const brandLabel = brand.length > 14 ? brand.slice(0, 12) + '…' : brand
  const selected = ENTITIES.find((e) => e.id === selectedId) || null
  const topThree = [...ENTITIES].sort((a, b) => b.strength - a.strength).slice(0, 3)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 flex-wrap">
                Entity Graph Builder
                <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30">
                  <Sparkles className="w-3 h-3" />
                  Live
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                How AI models connect{' '}
                <span className="text-foreground font-medium truncate">{brand}</span> to entities
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
          </div>

          {/* Graph + side panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* SVG Graph */}
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-black/20 p-2 sm:p-3">
              <svg viewBox="0 0 800 500" className="w-full h-auto" role="img" aria-label="Entity graph">
                <defs>
                  <radialGradient id="brandGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d946ef" />
                    <stop offset="60%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7e22ce" />
                  </radialGradient>
                  <radialGradient id="brandGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(217,70,239,0.55)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                  </radialGradient>
                  <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Edges (drawn first so nodes overlay) */}
                {ENTITIES.map((e, i) => {
                  const colors = TYPE_COLORS[e.type]
                  const isSel = selectedId === e.id
                  return (
                    <motion.path
                      key={`edge-${e.id}`}
                      d={`M ${CENTER.x} ${CENTER.y} L ${e.x} ${e.y}`}
                      fill="none"
                      stroke={isSel ? colors.stroke : 'rgba(255,255,255,0.18)'}
                      strokeWidth={edgeThickness(e.strength) * (isSel ? 1.8 : 1)}
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isInView ? { pathLength: 1, opacity: isSel ? 0.9 : 0.55 } : {}}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: 'easeInOut' }}
                    />
                  )
                })}

                {/* Center node with pulsing glow rings */}
                <g>
                  {[0, 1, 2].map((k) => (
                    <motion.circle
                      key={`pulse-${k}`}
                      cx={CENTER.x}
                      cy={CENTER.y}
                      r={38}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={
                        isInView
                          ? { opacity: [0, 0.6, 0], scale: [0.6, 1.9, 2.4] }
                          : { opacity: 0, scale: 0.6 }
                      }
                      transition={{ duration: 3, repeat: Infinity, delay: k, ease: 'easeOut' }}
                      style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
                    />
                  ))}
                  <motion.circle
                    cx={CENTER.x}
                    cy={CENTER.y}
                    r={48}
                    fill="url(#brandGlow)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'backOut' }}
                    style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
                  />
                  <motion.circle
                    cx={CENTER.x}
                    cy={CENTER.y}
                    r={38}
                    fill="url(#brandGrad)"
                    stroke="#d946ef"
                    strokeWidth={2}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.15, ease: 'backOut' }}
                    style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
                  />
                  <motion.text
                    x={CENTER.x}
                    y={CENTER.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize={13}
                    fontWeight={700}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    {brandLabel}
                  </motion.text>
                </g>

                {/* Entity nodes */}
                {ENTITIES.map((e, i) => {
                  const colors = TYPE_COLORS[e.type]
                  const r = nodeRadius(e.strength)
                  const isSel = selectedId === e.id
                  const labelText = e.label.length > 12 ? e.label.slice(0, 11) + '…' : e.label
                  return (
                    <motion.g
                      key={e.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.07, ease: 'backOut' }}
                      style={{ transformOrigin: `${e.x}px ${e.y}px` }}
                      whileHover={{ scale: 1.12 }}
                      onClick={() => setSelectedId(isSel ? null : e.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={e.x}
                        cy={e.y}
                        r={r}
                        fill={colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={isSel ? 2.5 : 1.5}
                        filter={isSel ? 'url(#nodeGlow)' : undefined}
                      />
                      <text
                        x={e.x}
                        y={e.y + 4}
                        textAnchor="middle"
                        fill={colors.stroke}
                        fontSize={11}
                        fontWeight={700}
                      >
                        {labelText}
                      </text>
                      {/* Strength pill */}
                      <g transform={`translate(${e.x + r - 2}, ${e.y - r + 2})`}>
                        <rect
                          x={-17}
                          y={-9}
                          width={34}
                          height={16}
                          rx={8}
                          fill="rgba(0,0,0,0.75)"
                          stroke={colors.stroke}
                          strokeWidth={1}
                        />
                        <text x={0} y={3} textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>
                          {e.strength}%
                        </text>
                      </g>
                    </motion.g>
                  )
                })}
              </svg>
            </div>

            {/* Side panel */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 min-h-[260px]">
              {selected ? (
                <SelectedEntityPanel
                  entity={selected}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <DefaultEntityPanel topThree={topThree} onSelect={setSelectedId} />
              )}
            </div>
          </div>

          {/* Legend + Authority gauge */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Entity Types
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(TYPE_COLORS).map(([key, c]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: c.stroke, boxShadow: `0 0 6px ${c.glow}` }}
                    />
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#a855f7' }} />
                  <span className="text-xs text-muted-foreground">Brand</span>
                </div>
              </div>
            </div>
            <AuthorityGauge score={AUTHORITY_SCORE} inView={isInView} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Default side panel — top 3 strongest associations ────────
function DefaultEntityPanel({
  topThree,
  onSelect,
}: {
  topThree: GraphEntity[]
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-foreground">Entity Details</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Click any node, or pick from the top associations:
      </p>
      <div className="space-y-2">
        {topThree.map((e, i) => {
          const c = TYPE_COLORS[e.type]
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className="w-full text-left p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.stroke }} />
                  <span className="text-sm font-medium text-foreground truncate">{e.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.stroke }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${e.strength}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: c.stroke }}>
                  {e.strength}%
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Selected entity panel ────────────────────────────────────
function SelectedEntityPanel({
  entity,
  onClose,
}: {
  entity: GraphEntity
  onClose: () => void
}) {
  const c = TYPE_COLORS[entity.type]
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: c.stroke, boxShadow: `0 0 8px ${c.glow}` }}
          />
          <h4 className="text-sm font-semibold text-foreground truncate">{entity.label}</h4>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <Badge
        className="mb-3 border"
        style={{ background: c.fill, color: c.stroke, borderColor: c.stroke }}
      >
        {c.label}
      </Badge>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{entity.description}</p>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Association Strength</span>
          <span className="text-xs font-bold" style={{ color: c.stroke }}>
            {entity.strength}/100
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: c.stroke }}
            initial={{ width: 0 }}
            animate={{ width: `${entity.strength}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Mentioned by</div>
        <div className="flex flex-wrap gap-1.5">
          {entity.mentionedBy.map((m) => {
            const model = AI_MODELS[m]
            if (!model) return null
            return (
              <Badge
                key={m}
                className="border"
                style={{ background: `${model.color}1a`, color: model.color, borderColor: `${model.color}55` }}
              >
                {model.label}
              </Badge>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Authority Score gauge ────────────────────────────────────
function AuthorityGauge({ score, inView }: { score: number; inView: boolean }) {
  const size = 64
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#a855f7"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-foreground">{score}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Entity Authority Score</div>
        <div className="text-sm font-semibold text-foreground">Strong · /100</div>
      </div>
    </div>
  )
}
