'use client'

import { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Crown,
  Medal,
  Trophy,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
type TabKey = 'highest' | 'growing' | 'saas' | 'agencies'

interface LeaderRow {
  rank: number
  brand: string
  category: string
  score: number
  delta: number
  /** Tailwind classes for the brand favicon-dot */
  dotClass: string
}

interface TabDef {
  key: TabKey
  label: string
  blurb: string
  rows: LeaderRow[]
}

// ── Data ───────────────────────────────────────────────────────────────
const TABS: TabDef[] = [
  {
    key: 'highest',
    label: 'Highest Score',
    blurb: 'The all-category top of the board. Sorted by AI Visibility Score.',
    rows: [
      { rank: 1, brand: 'Stripe',    category: 'Payments',     score: 94, delta: 2,  dotClass: 'bg-indigo-400' },
      { rank: 2, brand: 'Notion',    category: 'Productivity', score: 91, delta: 1,  dotClass: 'bg-zinc-200' },
      { rank: 3, brand: 'Linear',    category: 'PM',           score: 89, delta: 3,  dotClass: 'bg-violet-400' },
      { rank: 4, brand: 'Vercel',    category: 'Dev Tools',    score: 87, delta: 0,  dotClass: 'bg-white' },
      { rank: 5, brand: 'Figma',     category: 'Design',       score: 86, delta: -1, dotClass: 'bg-pink-500' },
      { rank: 6, brand: 'Webflow',   category: 'Web Builder',  score: 84, delta: 2,  dotClass: 'bg-blue-400' },
      { rank: 7, brand: 'HubSpot',   category: 'Marketing',    score: 82, delta: -2, dotClass: 'bg-orange-400' },
      { rank: 8, brand: 'Shopify',   category: 'Ecommerce',    score: 81, delta: 4,  dotClass: 'bg-emerald-500' },
    ],
  },
  {
    key: 'growing',
    label: 'Fastest Growing',
    blurb: 'Biggest 7-day jump. These brands are climbing the AI rankings right now.',
    rows: [
      { rank: 1, brand: 'Cursor',       category: 'Dev Tools',  score: 78, delta: 12, dotClass: 'bg-zinc-200' },
      { rank: 2, brand: 'Replit',       category: 'Dev Tools',  score: 74, delta: 10, dotClass: 'bg-orange-400' },
      { rank: 3, brand: 'Perplexity',   category: 'AI Search',  score: 88, delta: 9,  dotClass: 'bg-teal-400' },
      { rank: 4, brand: 'Anthropic',    category: 'AI Platform',score: 92, delta: 8,  dotClass: 'bg-amber-500' },
      { rank: 5, brand: 'Vercel',       category: 'Dev Tools',  score: 87, delta: 6,  dotClass: 'bg-white' },
      { rank: 6, brand: 'Mistral',      category: 'AI Platform',score: 71, delta: 6,  dotClass: 'bg-orange-500' },
      { rank: 7, brand: 'Notion',       category: 'Productivity',score: 91, delta: 5, dotClass: 'bg-zinc-200' },
      { rank: 8, brand: 'Supabase',     category: 'Backend',    score: 76, delta: 5,  dotClass: 'bg-emerald-400' },
    ],
  },
  {
    key: 'saas',
    label: 'Top SaaS',
    blurb: 'The SaaS brands dominating AI recommendations in B2B queries.',
    rows: [
      { rank: 1, brand: 'Salesforce', category: 'CRM',        score: 92, delta: 1,  dotClass: 'bg-sky-400' },
      { rank: 2, brand: 'HubSpot',    category: 'Marketing',  score: 88, delta: 2,  dotClass: 'bg-orange-400' },
      { rank: 3, brand: 'Slack',      category: 'Comms',      score: 85, delta: -1, dotClass: 'bg-purple-400' },
      { rank: 4, brand: 'Asana',      category: 'PM',         score: 82, delta: 0,  dotClass: 'bg-rose-400' },
      { rank: 5, brand: 'Monday',     category: 'PM',         score: 80, delta: 3,  dotClass: 'bg-yellow-400' },
      { rank: 6, brand: 'Zendesk',    category: 'Support',    score: 79, delta: -2, dotClass: 'bg-emerald-400' },
      { rank: 7, brand: 'Atlassian',  category: 'Dev',        score: 78, delta: 1,  dotClass: 'bg-blue-500' },
      { rank: 8, brand: 'Airtable',   category: 'Database',   score: 76, delta: 4,  dotClass: 'bg-orange-500' },
    ],
  },
  {
    key: 'agencies',
    label: 'Top Agencies',
    blurb: 'Agencies ranked by their aggregate client AI Visibility Score.',
    rows: [
      { rank: 1, brand: 'Wpromote',           category: 'Performance', score: 78, delta: 3,  dotClass: 'bg-emerald-400' },
      { rank: 2, brand: 'NP Digital',         category: 'SEO',         score: 76, delta: 1,  dotClass: 'bg-purple-400' },
      { rank: 3, brand: 'iPullRank',          category: 'SEO',         score: 74, delta: 2,  dotClass: 'bg-blue-400' },
      { rank: 4, brand: 'Seer Interactive',   category: 'SEO',         score: 72, delta: -1, dotClass: 'bg-amber-400' },
      { rank: 5, brand: 'Logical Position',   category: 'PPC',         score: 70, delta: 0,  dotClass: 'bg-rose-400' },
      { rank: 6, brand: 'Tinuiti',            category: 'Performance', score: 68, delta: 2,  dotClass: 'bg-orange-400' },
      { rank: 7, brand: 'HigherVisibility',   category: 'SEO',         score: 66, delta: -3, dotClass: 'bg-teal-400' },
      { rank: 8, brand: 'WebFX',              category: 'SEO',         score: 64, delta: 1,  dotClass: 'bg-sky-400' },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────
function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Crown className="w-4 h-4 text-amber-300" />
  }
  if (rank === 2) {
    return <Medal className="w-4 h-4 text-slate-300" />
  }
  if (rank === 3) {
    return <Medal className="w-4 h-4 text-amber-600" />
  }
  return null
}

function DeltaCell({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
        0
      </span>
    )
  }
  const positive = delta > 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        positive ? 'text-emerald-400' : 'text-rose-400'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {positive ? `+${delta}` : delta}
    </span>
  )
}

// ── Main ───────────────────────────────────────────────────────────────
export default function CommunityLeaderboard({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeTab, setActiveTab] = useState<TabKey>('highest')

  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0]

  return (
    <section className="py-24 relative" ref={ref} id="leaderboard">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-500/8 rounded-full blur-[150px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-300 bg-purple-500/10 backdrop-blur-sm"
            >
              <Trophy className="w-3.5 h-3.5" />
              The Leaderboard
            </Badge>
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border-amber-500/60 text-amber-400 bg-amber-500/10 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Illustrative Examples
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Who dominates{' '}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent">
              AI visibility
            </span>{' '}
            this week?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Public AI Visibility Scores, ranked. See the fastest climbers, the
            top SaaS, the top agencies, the top ecommerce. Compete for the top
            spot in your category.
          </p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="leaderboard-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.key === 'growing' && <TrendingUp className="w-3.5 h-3.5" />}
                  {tab.key === 'agencies' && <Users className="w-3.5 h-3.5" />}
                  {tab.label}
                </span>
              </button>
            )
          })}
        </motion.div>

        {/* Blurb */}
        <motion.p
          key={`blurb-${activeTab}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-sm text-muted-foreground/80 mb-6"
        >
          {active.blurb}
        </motion.p>

        {/* Leaderboard table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Table className="w-full min-w-[640px]">
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="h-12 px-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-16">
                            Rank
                          </TableHead>
                          <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                            Brand
                          </TableHead>
                          <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 hidden sm:table-cell">
                            Category
                          </TableHead>
                          <TableHead className="h-12 px-4 text-right text-xs font-semibold uppercase tracking-wider text-purple-300/80">
                            AI Visibility
                          </TableHead>
                          <TableHead className="h-12 px-4 sm:px-6 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 w-24">
                            Weekly
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {active.rows.map((row, i) => (
                          <motion.tr
                            key={`${activeTab}-${row.brand}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.04 * i }}
                            className={`border-white/5 hover:bg-purple-500/5 transition-colors ${
                              i % 2 === 1 ? 'bg-white/[0.015]' : ''
                            }`}
                          >
                            <TableCell className="px-4 sm:px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-bold tabular-nums ${
                                    row.rank <= 3
                                      ? 'text-amber-300'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  #{row.rank}
                                </span>
                                <RankIcon rank={row.rank} />
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-6 h-6 rounded-full ${row.dotClass} flex items-center justify-center text-[10px] font-bold text-black/80 shrink-0 ring-1 ring-white/20`}
                                >
                                  {row.brand[0]}
                                </span>
                                <span className="text-sm font-semibold text-foreground/95">
                                  {row.brand}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 hidden sm:table-cell">
                              <Badge
                                variant="outline"
                                className="border-white/15 text-muted-foreground bg-white/5 text-[11px] px-2 py-0.5"
                              >
                                {row.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-right">
                              <span className="text-xl font-bold tabular-nums bg-gradient-to-r from-purple-200 to-fuchsia-300 bg-clip-text text-transparent">
                                {row.score}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 sm:px-6 py-3.5 text-right">
                              <DeltaCell delta={row.delta} />
                            </TableCell>
                          </motion.tr>
                        ))}

                        {/* CTA row */}
                        <TableRow className="border-0 hover:bg-transparent">
                          <TableCell colSpan={5} className="p-0">
                            <button
                              onClick={onStartFree}
                              className="group w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-5 text-sm font-medium text-purple-300 border-2 border-dashed border-purple-500/30 m-3 rounded-xl hover:border-purple-500/60 hover:bg-purple-500/5 transition-all"
                            >
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              Your brand could be here — claim your spot, start
                              tracking
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs text-muted-foreground/60 mt-6"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          These scores are illustrative examples for demonstration purposes. Real AI Visibility Scores are computed from live citation data across AI models.{' '}
            <span className="text-purple-300/80">Sign up to see real benchmark data for your industry.</span>
        </motion.p>
          <motion.p
            className="text-center text-xs text-muted-foreground/60 mt-2"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
          Scores updated every Monday. Public profile pages coming soon.
        </motion.p>
      </div>
    </section>
  )
}
