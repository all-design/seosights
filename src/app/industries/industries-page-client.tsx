'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import IconRenderer from '@/components/site/IconRenderer'
import {
  ArrowRight,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  Activity,
  Zap,
} from 'lucide-react'

import { industries as industriesData, Industry, industryCategories } from '@/data/industries-data'

/* ─── Industry data (imported from shared industries-data.ts) ─────────── */
type IndustryType = Industry

const industries = industriesData

/* ─── Category filter options ───────────────────────────────────────────── */
const categoryFilters = [...industryCategories]

/* ─── Trend icon helper ─────────────────────────────────────────────────── */
function TrendIcon({ trend }: { trend: Industry['trend'] }) {
  switch (trend) {
    case 'rising':
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          Rising
        </span>
      )
    case 'declining':
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
          <TrendingDown className="w-3.5 h-3.5" />
          Declining
        </span>
      )
    case 'stable':
      return (
        <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
          <Minus className="w-3.5 h-3.5" />
          Stable
        </span>
      )
  }
}

/* ─── Score color helper ────────────────────────────────────────────────── */
function scoreColor(score: number): string {
  if (score >= 50) return 'text-emerald-400'
  if (score >= 35) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 50) return 'bg-emerald-500/15'
  if (score >= 35) return 'bg-amber-500/15'
  return 'bg-red-500/15'
}

/* ─── Industry card component ───────────────────────────────────────────── */
function IndustryCard({ industry }: { industry: Industry }) {
  return (
    <Link href={`/industries/${industry.slug}`} className="block h-full">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/25 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group">
        <CardContent className="p-5 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between">
            <div
              className={`w-11 h-11 rounded-xl ${scoreBg(industry.avgVisibilityScore)} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
            >
              <IconRenderer
                name={industry.icon}
                className={`w-5 h-5 ${scoreColor(industry.avgVisibilityScore)}`}
              />
            </div>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 h-5 border-white/20 text-muted-foreground/70 bg-white/5"
            >
              {industry.category}
            </Badge>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1">{industry.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {industry.description}
            </p>
          </div>

          {/* Score & stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                Avg Score
              </p>
              <p className={`text-lg font-bold ${scoreColor(industry.avgVisibilityScore)}`}>
                {industry.avgVisibilityScore}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                Companies
              </p>
              <p className="text-lg font-bold text-foreground">
                {industry.companiesTracked.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                Top Engine
              </p>
              <p className="text-sm font-semibold text-foreground">{industry.topEngine}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                Trend
              </p>
              <TrendIcon trend={industry.trend} />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <span className="text-sm font-medium text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Explore
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/* ─── Main client component ─────────────────────────────────────────────── */
export default function IndustriesPageClient() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return industries.filter((ind) => {
      const matchesCategory =
        activeCategory === 'All' || ind.category === activeCategory
      const matchesSearch =
        search.trim() === '' ||
        ind.name.toLowerCase().includes(search.toLowerCase()) ||
        ind.description.toLowerCase().includes(search.toLowerCase()) ||
        ind.category.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, search])

  const getCategoryCount = (cat: string) =>
    cat === 'All'
      ? industries.length
      : industries.filter((i) => i.category === cat).length

  const avgScoreAll = Math.round(
    industries.reduce((acc, i) => acc + i.avgVisibilityScore, 0) / industries.length
  )
  const totalCompanies = industries.reduce((acc, i) => acc + i.companiesTracked, 0)

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm rounded-full mb-6">
            <Activity className="w-3.5 h-3.5" />
            Real-time AI Visibility Data
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            AI Visibility
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              by Industry
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            See how AI recommends businesses in your industry. Real-time scores. Real citations. Real
            recommendations.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{industries.length}</p>
              <p className="text-sm text-muted-foreground">Industries</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{avgScoreAll}</p>
              <p className="text-sm text-muted-foreground">Avg Visibility</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {(totalCompanies / 1000).toFixed(1)}K+
              </p>
              <p className="text-sm text-muted-foreground">Companies Tracked</p>
            </div>
          </div>

          <Link
            href="/#cta"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300"
          >
            <Zap className="w-4 h-4" />
            Check your AI Visibility
          </Link>
        </div>
      </section>

      {/* ── Search + Category Filters + Grid ───────────────────────────── */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search industries by name, description or category…"
              className="w-full pl-12 pr-4 py-3 min-h-[48px] rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-base"
              aria-label="Search industries"
            />
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                {cat} ({getCategoryCount(cat)})
              </button>
            ))}
          </div>

          {/* Result count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'industry' : 'industries'} found
              {activeCategory !== 'All' && (
                <button
                  onClick={() => setActiveCategory('All')}
                  className="ml-2 text-purple-400 hover:text-purple-300 underline"
                >
                  Show all
                </button>
              )}
            </p>
          </div>

          {/* Industries grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((industry) => (
                <motion.div
                  key={industry.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <IndustryCard industry={industry} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No industries match your search</p>
              <p className="text-sm">Try a different keyword or category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── AI Visibility Index™ explanation ────────────────────────────── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm rounded-full mb-4">
              <Gauge className="w-3.5 h-3.5" />
              Methodology
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI Visibility Index™
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How we measure AI visibility across industries.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Probe AI Engines',
                description:
                  'We send representative queries to ChatGPT, Claude, Gemini, Perplexity, and Copilot for each industry vertical.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/15',
              },
              {
                step: '02',
                title: 'Record Citations',
                description:
                  'Every citation, mention, and recommendation is recorded with the exact snippet and context.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/15',
              },
              {
                step: '03',
                title: 'Score & Benchmark',
                description:
                  'Each business receives a 0–100 AI Visibility Score based on citation frequency, position, and authority.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/15',
              },
              {
                step: '04',
                title: 'Track Over Time',
                description:
                  'Scores are updated continuously so you can see trends, measure improvements, and catch declines early.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/15',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/25 transition-all duration-300"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4`}
                >
                  <span className={`text-lg font-bold ${item.color}`}>{item.step}</span>
                </div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-emerald-500/5 to-amber-500/10 p-8 sm:p-12 backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Check your AI Visibility
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Enter your website and see how AI engines recommend — or don&apos;t recommend — your
              business. Free, instant, no signup.
            </p>
            <Link
              href="/#cta"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300"
            >
              Check your AI Visibility
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-4">
              No credit card required · Results in 30 seconds
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
