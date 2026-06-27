'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Store,
  Bot,
  ArrowRight,
  Bell,
  Sparkles,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface AgentCard {
  name: string
  author: string
  description: string
  price: number
  /** Lucide icon element for the agent avatar */
  emoji: string
  /** Tailwind gradient classes for the avatar tile */
  accent: string
}

// ── Data ───────────────────────────────────────────────────────────────
const AGENTS: AgentCard[] = [
  {
    name: 'Dental Visibility Agent',
    author: 'BrightSmile Agency',
    description:
      "Monitors Google AI Overviews for 'dentist near me' queries and surfaces citation gaps.",
    price: 49,
    emoji: 'D',
    accent: 'from-emerald-500/30 to-teal-500/20 border-emerald-500/30',
  },
  {
    name: 'Law Firm Authority Agent',
    author: 'LexGrowth',
    description:
      'Builds Wikipedia + Avvo + Martindale entity authority to land in AI legal recommendations.',
    price: 79,
    emoji: 'L',
    accent: 'from-amber-500/30 to-orange-500/20 border-amber-500/30',
  },
  {
    name: 'Real Estate Local Agent',
    author: 'PropertyRank',
    description:
      "Tracks ChatGPT recommendations for 'realtor in [city]' across every market you operate in.",
    price: 59,
    emoji: 'R',
    accent: 'from-sky-500/30 to-blue-500/20 border-sky-500/30',
  },
  {
    name: 'Ecommerce Product Agent',
    author: 'ShopVis',
    description:
      'Optimizes product schema for AI shopping citations and tracks buy-box mentions.',
    price: 39,
    emoji: 'E',
    accent: 'from-rose-500/30 to-pink-500/20 border-rose-500/30',
  },
  {
    name: 'SaaS Comparison Agent',
    author: 'CompareLab',
    description:
      "Gets you into 'best [category]' AI lists and monitors competitor comparison snippets.",
    price: 99,
    emoji: 'S',
    accent: 'from-violet-500/30 to-purple-500/20 border-violet-500/30',
  },
  {
    name: 'Enterprise Brand Agent',
    author: 'seosights',
    description:
      'Full entity + citation + monitoring suite across every AI engine we track.',
    price: 299,
    emoji: 'X',
    accent: 'from-purple-500/30 to-fuchsia-500/20 border-purple-500/40',
  },
]

// ── Main ───────────────────────────────────────────────────────────────
export default function AgentMarketplace({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="marketplace">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/8 to-background" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-fuchsia-500/8 rounded-full blur-[160px]" />

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
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <Store className="w-3.5 h-3.5" />
            Coming Soon — Agent Marketplace
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/30 text-[10px] font-bold uppercase tracking-wider text-purple-200">
              Soon
            </span>
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            The{' '}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent">
              App Store
            </span>{' '}
            for AI Visibility agents.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Agencies build specialized agents for their vertical — Dental,
            Legal, Real Estate, Ecommerce, SaaS. List them on the marketplace.
            Keep 80% of every sale.
          </p>
        </motion.div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="opacity-90 hover:opacity-100 transition-opacity"
            >
              <Card
                className={`relative bg-white/5 backdrop-blur-sm border ${agent.accent} h-full overflow-hidden group transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.18)] hover:-translate-y-1`}
              >
                {/* "Soon" ribbon */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/40 text-[10px] font-bold uppercase tracking-wider text-purple-200 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
                    Soon
                  </span>
                </div>

                <CardContent className="p-6 flex flex-col h-full">
                  {/* Avatar */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.accent} border flex items-center justify-center shrink-0`}
                    >
                      <Bot className="w-6 h-6 text-purple-200" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground leading-tight">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">
                        by{' '}
                        <span className="text-purple-300/90 font-medium">
                          {agent.author}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                    {agent.description}
                  </p>

                  {/* Footer: price + notify */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums text-foreground">
                        ${agent.price}
                      </span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-500/40 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/60 hover:text-purple-100"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Notify me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Builder CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-fuchsia-600/10 to-purple-600/20 backdrop-blur-sm p-8 sm:p-10">
            {/* glow accents */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-500/15 rounded-full blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="w-12 h-12 rounded-xl bg-purple-500/25 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
                    Build an agent. Reach{' '}
                    <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                      10,000+ seosights users
                    </span>
                    . Keep 80% revenue.
                  </h3>
                  <p className="text-sm text-muted-foreground/90">
                    We host, bill, and distribute. You ship the agent and
                    collect on every renewal.
                  </p>
                </div>
              </div>
              <Button
                onClick={onStartFree}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold px-7 h-12 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all shrink-0"
              >
                Apply as a builder
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
