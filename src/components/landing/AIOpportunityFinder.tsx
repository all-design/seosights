'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessagesSquare,
  MessageCircle,
  Star,
  FileText,
  Github,
  Database,
  Newspaper,
  BookOpen,
  ArrowRight,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

// NOTE: lucide-react@0.525.0 does not export `Wikipedia` or `Reddit`.
// Substitutes: BookOpen (Wikipedia-style knowledge), MessagesSquare (Reddit threads).

interface MissingSource {
  id: string
  name: string
  detail: string
  icon: LucideIcon
  competitor: number
  you: number
  accent: string
  iconColor: string
  iconBg: string
}

const missingSources: MissingSource[] = [
  {
    id: 'reddit',
    name: 'Reddit',
    detail: 'r/SaaS + 4 subreddits',
    icon: MessagesSquare,
    competitor: 38,
    you: 0,
    accent: 'border-orange-500/25 hover:border-orange-500/50',
    iconColor: 'text-orange-300',
    iconBg: 'bg-orange-500/15',
  },
  {
    id: 'quora',
    name: 'Quora',
    detail: '8 question threads',
    icon: MessageCircle,
    competitor: 12,
    you: 0,
    accent: 'border-red-500/25 hover:border-red-500/50',
    iconColor: 'text-red-300',
    iconBg: 'bg-red-500/15',
  },
  {
    id: 'g2',
    name: 'G2',
    detail: 'category & comparison pages',
    icon: Star,
    competitor: 24,
    you: 0,
    accent: 'border-amber-500/25 hover:border-amber-500/50',
    iconColor: 'text-amber-300',
    iconBg: 'bg-amber-500/15',
  },
  {
    id: 'trustpilot',
    name: 'Trustpilot',
    detail: 'brand profile + reviews',
    icon: FileText,
    competitor: 9,
    you: 0,
    accent: 'border-emerald-500/25 hover:border-emerald-500/50',
    iconColor: 'text-emerald-300',
    iconBg: 'bg-emerald-500/15',
  },
  {
    id: 'crunchbase',
    name: 'Crunchbase',
    detail: 'company entity record',
    icon: Github,
    competitor: 6,
    you: 0,
    accent: 'border-cyan-500/25 hover:border-cyan-500/50',
    iconColor: 'text-cyan-300',
    iconBg: 'bg-cyan-500/15',
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    detail: 'structured entity',
    icon: Database,
    competitor: 4,
    you: 0,
    accent: 'border-fuchsia-500/25 hover:border-fuchsia-500/50',
    iconColor: 'text-fuchsia-300',
    iconBg: 'bg-fuchsia-500/15',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    detail: '12 review videos',
    icon: Newspaper,
    competitor: 18,
    you: 0,
    accent: 'border-rose-500/25 hover:border-rose-500/50',
    iconColor: 'text-rose-300',
    iconBg: 'bg-rose-500/15',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    detail: "'CRM' article",
    icon: BookOpen,
    competitor: 1,
    you: 0,
    accent: 'border-purple-500/25 hover:border-purple-500/50',
    iconColor: 'text-purple-300',
    iconBg: 'bg-purple-500/15',
  },
]

export default function AIOpportunityFinder({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      className="py-24 relative overflow-hidden"
      ref={ref}
      id="opportunity-finder"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-rose-500/8 rounded-full blur-[140px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Target className="w-3.5 h-3.5" />
            Where You&apos;re Losing
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Your competitor is mentioned{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              162 times.
            </span>{' '}
            <span className="text-rose-400">You: 11.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The Opportunity Finder shows the exact gap — and the exact sources
            you&apos;re missing. One click to start closing them.
          </p>
        </motion.div>

        {/* Big comparison header */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4 sm:gap-6 mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {/* You column */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 text-center md:text-right relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/8 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider text-rose-400 font-semibold mb-2">
                You · Acme CRM
              </div>
              <div className="text-6xl sm:text-7xl font-bold text-rose-400 leading-none mb-2">
                11
              </div>
              <div className="text-sm text-muted-foreground">
                mentions across 4 AI engines
              </div>
            </div>
          </div>

          {/* Center gap */}
          <div className="flex md:flex-col items-center justify-center gap-3 md:gap-2 py-2 md:py-0 md:px-4">
            <div className="text-[10px] uppercase tracking-widest text-rose-400/80 font-semibold">
              Citation Gap
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-rose-500 leading-none">
              −151
            </div>
            <div className="hidden md:block h-px w-12 bg-rose-500/30 my-2" />
            <div className="text-xs text-muted-foreground text-center max-w-[140px]">
              citations behind
            </div>
          </div>

          {/* Competitor column */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] backdrop-blur-sm p-6 sm:p-8 text-center md:text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-2">
                Top Competitor · Notion
              </div>
              <div className="text-6xl sm:text-7xl font-bold text-emerald-400 leading-none mb-2">
                162
              </div>
              <div className="text-sm text-muted-foreground">
                mentions across 4 AI engines
              </div>
            </div>
          </div>
        </motion.div>

        {/* Missing sources grid */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
              Missing sources{' '}
              <span className="text-muted-foreground font-normal text-base">
                — competitor is cited here, you are not
              </span>
            </h3>
            <Badge
              variant="outline"
              className="border-rose-500/40 text-rose-300 bg-rose-500/10"
            >
              {missingSources.length} sources to fix
            </Badge>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.06, delayChildren: 0.4 },
              },
            }}
          >
            {missingSources.map((src) => {
              const delta = src.competitor - src.you
              return (
                <motion.div
                  key={src.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.4 }}
                  className={`group relative rounded-xl border bg-white/5 backdrop-blur-sm p-4 transition-all duration-300 ${src.accent} hover:bg-white/[0.07] hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]`}
                >
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <div className="bg-zinc-900 border border-purple-500/30 text-purple-200 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                      We&apos;ll generate a step-by-step plan to get cited here.
                    </div>
                    <div className="w-2 h-2 bg-zinc-900 border-r border-b border-purple-500/30 rotate-45 mx-auto -mt-1" />
                  </div>

                  {/* Header row: icon + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg ${src.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <src.icon className={`w-5 h-5 ${src.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm">
                        {src.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {src.detail}
                      </div>
                    </div>
                  </div>

                  {/* Delta row */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Competitor
                      </div>
                      <div className="text-xl font-bold text-emerald-400">
                        {src.competitor}
                      </div>
                    </div>
                    <div className="text-muted-foreground/50 text-sm pb-1">vs</div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        You
                      </div>
                      <div className="text-xl font-bold text-rose-400">
                        {src.you}
                      </div>
                    </div>
                  </div>

                  {/* Gap + Fix */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                    <div className="text-xs">
                      <span className="text-rose-400 font-semibold">
                        −{delta}
                      </span>
                      <span className="text-muted-foreground ml-1">gap</span>
                    </div>
                    <button
                      onClick={onStartFree}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 hover:border-purple-500/50 rounded-md px-2.5 py-1.5 transition-all"
                    >
                      Fix
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Projected impact callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 backdrop-blur-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-300" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-xs uppercase tracking-wider text-purple-300/80 font-semibold mb-1">
                  Projected impact
                </div>
                <p className="text-base sm:text-lg text-foreground/90 leading-relaxed">
                  Closing{' '}
                  <span className="font-bold text-purple-300">4 of these gaps</span>{' '}
                  could add{' '}
                  <span className="font-bold text-emerald-400">~48 AI citations</span>{' '}
                  and raise your{' '}
                  <span className="font-bold text-purple-300">
                    AI Visibility Score
                  </span>{' '}
                  by{' '}
                  <span className="font-bold text-emerald-400">~14 points</span>.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 h-12 rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all"
          >
            Find your opportunities
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            See your full citation gap across ChatGPT, Claude, Gemini &amp; Perplexity
          </p>
        </motion.div>
      </div>
    </section>
  )
}
