'use client'

import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────
interface EngineResult {
  engine: string
  dotClass: string
  glowClass: string
  mentioned: boolean
  position?: number
  totalPositions?: number
  confidence: number
  snippet?: string
  competitors: string[]
  sources: string[]
}

interface PromptScenario {
  prompt: string
  results: EngineResult[]
  reasons: { title: string; detail: string }[]
}

// ── Mock data ───────────────────────────────────────────────────────────
// Default "Best CRM for startups" is the hero demo. Other quick-prompts
// reuse the same structure with swapped competitor names per the spec.
const REASONS: { title: string; detail: string }[] = [
  {
    title: 'Your entity is missing from Wikipedia and Wikidata',
    detail: 'Claude & Perplexity lean heavily on knowledge-graph sources. No entity = no mention.',
  },
  {
    title: 'Only 2 G2 reviews vs competitors\' 200+',
    detail: 'Review volume is the #1 signal AI engines use for B2B SaaS recommendations.',
  },
  {
    title: 'No presence in top Reddit threads for this query',
    detail: 'r/SaaS and r/startups threads drive 38% of ChatGPT citations in this category.',
  },
]

// Helper to build a scenario row with sensible defaults
function row(
  engine: string,
  dotClass: string,
  glowClass: string,
  mentioned: boolean,
  opts: Partial<EngineResult> = {}
): EngineResult {
  return {
    engine,
    dotClass,
    glowClass,
    mentioned,
    confidence: mentioned ? opts.confidence ?? 70 : 0,
    position: mentioned ? opts.position ?? 2 : undefined,
    totalPositions: mentioned ? opts.totalPositions ?? 5 : undefined,
    snippet: opts.snippet,
    competitors: opts.competitors ?? ['Notion', 'Monday.com', 'ClickUp'],
    sources: opts.sources ?? ['G2', 'Reddit'],
  }
}

const EM = 'bg-emerald-400'
const AM = 'bg-amber-400'
const BL = 'bg-blue-400'
const CY = 'bg-cyan-400'
const EG = 'shadow-[0_0_12px_rgba(16,185,129,0.6)]'
const AG = 'shadow-[0_0_12px_rgba(245,158,11,0.6)]'
const BG = 'shadow-[0_0_12px_rgba(96,165,250,0.6)]'
const CG = 'shadow-[0_0_12px_rgba(34,211,238,0.6)]'

const SCENARIOS: PromptScenario[] = [
  {
    prompt: 'Best CRM for startups',
    reasons: REASONS,
    results: [
      row('ChatGPT', EM, EG, true, { position: 2, totalPositions: 5, confidence: 78, snippet: '"…a solid pick for early-stage teams is seosights — lightweight, fast onboarding, and a generous free tier."', competitors: ['Notion', 'Monday.com', 'HubSpot'], sources: ['G2', 'Reddit'] }),
      row('Claude', AM, AG, false, { competitors: ['Notion', 'ClickUp', 'Asana'], sources: ['Wikipedia', 'G2'] }),
      row('Gemini', BL, BG, true, { position: 4, totalPositions: 6, confidence: 61, snippet: '"…seosights appears among newer entrants worth considering, particularly for cost-conscious founders."', competitors: ['Monday.com', 'Asana', 'Trello'], sources: ['Forbes', 'G2'] }),
      row('Perplexity', CY, CG, false, { competitors: ['Notion', 'Monday.com', 'ClickUp'], sources: ['Reddit', 'G2', 'Wikipedia'] }),
    ],
  },
  {
    prompt: 'Best dentist in Chicago',
    reasons: REASONS,
    results: [
      row('ChatGPT', EM, EG, true, { position: 2, totalPositions: 5, confidence: 72, snippet: '"…seosights Dental in River North gets consistent praise for same-day crowns."', competitors: ['Bright Smile', 'Windy City Dental', 'Loop Dentistry'], sources: ['Yelp', 'Google'] }),
      row('Claude', AM, AG, false, { competitors: ['Bright Smile', 'Loop Dentistry', 'Family Dental'], sources: ['Wikipedia', 'Yelp'] }),
      row('Gemini', BL, BG, true, { position: 4, totalPositions: 6, confidence: 55, snippet: '"…seosights Dental shows up for patients prioritizing evening and weekend hours."', competitors: ['Windy City Dental', 'Loop Dentistry', 'Smile Studio'], sources: ['Google', 'Healthgrades'] }),
      row('Perplexity', CY, CG, false, { competitors: ['Bright Smile', 'Windy City Dental', 'Loop Dentistry'], sources: ['Reddit', 'Yelp', 'Wikipedia'] }),
    ],
  },
  {
    prompt: 'Best SEO agency in Serbia',
    reasons: REASONS,
    results: [
      row('ChatGPT', EM, EG, true, { position: 2, totalPositions: 5, confidence: 81, snippet: '"…seosights is one of the most cited SEO agencies in Belgrade, known for technical depth."', competitors: ['Zavod', 'Mediapoint', 'PopArt Studio'], sources: ['Clutch', 'Reddit'] }),
      row('Claude', AM, AG, false, { competitors: ['Zavod', 'Mediapoint', 'PopArt Studio'], sources: ['Wikipedia', 'Clutch'] }),
      row('Gemini', BL, BG, true, { position: 4, totalPositions: 6, confidence: 58, snippet: '"…seosights appears in regional roundups, often cited for SaaS and B2B clients."', competitors: ['Mediapoint', 'PopArt Studio', 'WiP'], sources: ['Forbes', 'Clutch'] }),
      row('Perplexity', CY, CG, false, { competitors: ['Zavod', 'Mediapoint', 'PopArt Studio'], sources: ['Reddit', 'Clutch', 'Wikipedia'] }),
    ],
  },
  {
    prompt: 'Top project management tools 2025',
    reasons: REASONS,
    results: [
      row('ChatGPT', EM, EG, true, { position: 2, totalPositions: 5, confidence: 76, snippet: '"…seosights PM has gained traction in 2025 for AI-native task automation and clean UX."', competitors: ['Notion', 'Asana', 'ClickUp'], sources: ['G2', 'Reddit'] }),
      row('Claude', AM, AG, false, { competitors: ['Notion', 'ClickUp', 'Asana'], sources: ['Wikipedia', 'G2'] }),
      row('Gemini', BL, BG, true, { position: 4, totalPositions: 6, confidence: 60, snippet: '"…seosights PM rounds out the 2025 list as an AI-first alternative for smaller teams."', competitors: ['Asana', 'Trello', 'Monday.com'], sources: ['Forbes', 'G2'] }),
      row('Perplexity', CY, CG, false, { competitors: ['Notion', 'Monday.com', 'ClickUp'], sources: ['Reddit', 'G2', 'Wikipedia'] }),
    ],
  },
]

const QUICK_PROMPTS = SCENARIOS.map((s) => s.prompt)
const DEFAULT_PROMPT = QUICK_PROMPTS[0]
const ENGINE_LABELS = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity']

function getScenario(prompt: string): PromptScenario {
  return (
    SCENARIOS.find((s) => s.prompt.toLowerCase() === prompt.toLowerCase()) ??
    SCENARIOS[0]
  )
}

export default function AIRecommendationSimulator({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const [currentPrompt, setCurrentPrompt] = useState(DEFAULT_PROMPT)
  const [isSimulating, setIsSimulating] = useState(false)
  const [hasResults, setHasResults] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [isLive, setIsLive] = useState(false)

  // Live data overrides mock SCENARIOS when API succeeds
  const [liveResults, setLiveResults] = useState<EngineResult[] | null>(null)
  const [liveReasons, setLiveReasons] = useState<{ title: string; detail: string }[] | null>(null)

  const scenario = getScenario(currentPrompt)
  const displayResults = liveResults ?? scenario.results
  const displayReasons = liveReasons ?? scenario.reasons

  const run = useCallback((prompt: string) => {
    if (isSimulating) return
    setCurrentPrompt(prompt)
    setIsSimulating(true)
    setHasResults(false)
    setWhyOpen(false)
    setLiveResults(null)
    setLiveReasons(null)
    setIsLive(false)

    // Fire API call — UI shows loading animation while waiting
    const controller = new AbortController()
    fetch('/api/ai/recommendation-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, brand: 'Acme Inc' }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data.results && Array.isArray(data.results)) {
          setLiveResults(data.results)
          setLiveReasons(data.reasons ?? null)
          setIsLive(true)
        }
      })
      .catch(() => {
        // Fallback to mock data — demo always works
        setIsLive(false)
      })
      .finally(() => {
        setIsSimulating(false)
        setHasResults(true)
      })
  }, [isSimulating])

  const handleRun = () => run(currentPrompt)
  const handleQuickPrompt = (p: string) => {
    if (p === currentPrompt && hasResults) return
    run(p)
  }

  return (
    <section className="py-24 relative" ref={ref} id="recommendation-simulator">
      {/* Background — subtle purple radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Killer Feature
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Type the question your customers ask AI.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              See if you&apos;re the answer.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            The AI Recommendation Simulator runs your prompt across ChatGPT,
            Claude, Gemini &amp; Perplexity and shows you exactly who gets
            recommended — and why.
          </p>
        </motion.div>

        {/* Simulator Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="bg-card border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.12)] overflow-hidden">
            <CardContent className="p-5 sm:p-7 space-y-5">
              {/* Prompt input row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRun()
                    }}
                    placeholder="Ask AI anything your customers ask…"
                    className="pl-9 h-11 bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/30 text-foreground"
                  />
                </div>
                <Button
                  onClick={handleRun}
                  disabled={isSimulating}
                  className="h-11 px-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_28px_rgba(168,85,247,0.55)] transition-all duration-300"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run simulation
                    </>
                  )}
                </Button>
              </div>

              {/* Quick-prompt chips */}
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleQuickPrompt(p)}
                    disabled={isSimulating}
                    className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      p === currentPrompt
                        ? 'border-purple-500/60 bg-purple-500/15 text-purple-200'
                        : 'border-white/10 bg-white/5 text-muted-foreground hover:border-purple-500/40 hover:text-purple-200 hover:bg-purple-500/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Body: loading / results / idle placeholder */}
              <AnimatePresence mode="wait">
                {isSimulating && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 pt-2"
                  >
                    {ENGINE_LABELS.map((label, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 * i }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Querying {label}…
                        </span>
                        <div className="ml-auto h-3 w-32 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500/40 to-fuchsia-500/60"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 0.15 * i,
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {hasResults && !isSimulating && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-2"
                  >
                    {/* 2x2 grid of engine results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {displayResults.map((r, i) => (
                        <EngineResultCard key={r.engine} result={r} index={i} />
                      ))}
                    </div>

                    {/* Live / Demo badge */}
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'}`} />
                        {isLive ? 'Live AI analysis' : 'Demo data'}
                      </span>
                    </div>

                    {/* Why panel */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="rounded-xl border border-red-500/20 bg-red-950/10 overflow-hidden"
                    >
                      <button
                        onClick={() => setWhyOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-red-500/5 transition-colors"
                      >
                        <span className="flex items-center gap-2 font-medium text-red-200">
                          <XCircle className="w-4 h-4 text-red-400" />
                          Why isn&apos;t your brand mentioned?
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-red-300 transition-transform duration-300 ${
                            whyOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {whyOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <ul className="px-4 pb-4 space-y-3">
                              {displayReasons.map((reason) => (
                                <li
                                  key={reason.title}
                                  className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 py-2 border-t border-white/5 first:border-t-0"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {reason.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {reason.detail}
                                    </p>
                                  </div>
                                  <button
                                    onClick={onStartFree}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 whitespace-nowrap shrink-0"
                                  >
                                    Fix
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}

                {!isSimulating && !hasResults && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center"
                  >
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Hit{' '}
                      <span className="text-purple-300 font-medium">
                        Run simulation
                      </span>{' '}
                      to see how AI engines answer this prompt today.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer line + CTA */}
        <motion.div
          className="text-center mt-10 space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-base sm:text-lg text-muted-foreground">
            This is what your customers see every day.{' '}
            <span className="text-foreground font-medium">
              Are you the answer?
            </span>
          </p>
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold px-7 py-5 shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] transition-all duration-300"
          >
            Simulate your prompts
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

// ── Engine result card ──────────────────────────────────────────────────
function EngineResultCard({
  result,
  index,
}: {
  result: EngineResult
  index: number
}) {
  const accentBorder = result.mentioned
    ? 'border-white/10'
    : 'border-red-500/30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.12 }}
    >
      <div
        className={`rounded-xl border ${accentBorder} bg-white/[0.03] p-4 h-full flex flex-col gap-3 transition-colors duration-300`}
      >
        {/* Top row: engine + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${result.dotClass} ${result.glowClass}`} />
            <span className="font-semibold text-sm text-foreground">{result.engine}</span>
          </div>
          {result.mentioned ? (
            <Badge className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Mentioned
            </Badge>
          ) : (
            <Badge className="bg-red-500/15 border border-red-500/40 text-red-300 text-[11px] gap-1">
              <XCircle className="w-3 h-3" />
              Not Mentioned
            </Badge>
          )}
        </div>

        {/* Position / snippet (or invisible message) */}
        {result.mentioned ? (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Position <span className="text-foreground font-semibold">#{result.position}</span> of {result.totalPositions}
            </p>
            <p className="text-xs text-foreground/80 italic leading-relaxed line-clamp-3">
              {result.snippet}
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-300/80 italic">You&apos;re invisible here.</p>
        )}

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Confidence</span>
            <span className="font-medium text-foreground">{result.confidence}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                result.mentioned
                  ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                  : 'bg-red-500/40'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.12 }}
            />
          </div>
        </div>

        {/* Competitors mentioned */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Competitors mentioned</p>
          <div className="flex flex-wrap gap-1.5">
            {result.competitors.map((c) => (
              <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/80">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Sources cited by AI */}
        <div className="space-y-1.5 mt-auto">
          <p className="text-[11px] text-muted-foreground">Sources cited by AI</p>
          <div className="flex flex-wrap gap-1.5">
            {result.sources.map((s) => (
              <span key={s} className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-200/90">
                <ExternalLink className="w-2.5 h-2.5" />
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
