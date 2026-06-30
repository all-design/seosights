'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import IconRenderer from '@/components/site/IconRenderer'
import { ArrowRight, Search, Zap, Gift, Sparkles } from 'lucide-react'
import type { FreeTool } from '@/data/free-tools'

/* ─── Display category definitions ──────────────────────────────────────── */
type DisplayCategory = {
  name: string
  slug: string
  description: string
}

const displayCategories: DisplayCategory[] = [
  { name: 'SEO', slug: 'seo', description: 'Classic & AI-powered SEO tools' },
  { name: 'AEO', slug: 'aeo', description: 'Answer Engine Optimization' },
  { name: 'GEO', slug: 'geo', description: 'Generative Engine Optimization' },
  { name: 'Schema', slug: 'schema', description: 'Structured data generators' },
  { name: 'AI Search', slug: 'ai-search', description: 'AI search engine tools' },
  { name: 'Technical', slug: 'technical', description: 'Crawl & technical SEO' },
  { name: 'Content', slug: 'content', description: 'Content optimization' },
  { name: 'Entities', slug: 'entities', description: 'Entity & knowledge graph' },
  { name: 'Local SEO', slug: 'local-seo', description: 'Local search visibility' },
  { name: 'Crawlers', slug: 'crawlers', description: 'AI crawler testing' },
  { name: 'Audits', slug: 'audits', description: 'Full readiness audits' },
  { name: 'Visibility', slug: 'visibility', description: 'AI visibility scoring' },
]

/* Map each tool slug to one or more display categories */
const slugToDisplayCategories: Record<string, string[]> = {
  'ai-visibility-checker': ['visibility', 'ai-search', 'seo'],
  'llms-txt-generator': ['schema', 'technical'],
  'schema-generator': ['schema', 'seo'],
  'robots-txt-tester': ['technical', 'crawlers'],
  'gptbot-checker': ['crawlers', 'ai-search'],
  'claudebot-checker': ['crawlers', 'ai-search'],
  'geo-audit': ['geo', 'audits', 'seo'],
  'aeo-audit': ['aeo', 'audits', 'seo'],
  'prompt-visibility-checker': ['visibility', 'aeo', 'ai-search'],
  'entity-graph-viewer': ['entities', 'seo'],
  'chatgpt-rank-checker': ['ai-search', 'visibility', 'seo'],
  'claude-rank-checker': ['ai-search', 'visibility', 'seo'],
  'gemini-rank-checker': ['ai-search', 'visibility', 'seo'],
  'perplexity-rank-checker': ['ai-search', 'visibility', 'seo'],
  'copilot-rank-checker': ['ai-search', 'visibility', 'seo'],
  'ai-citation-checker': ['visibility', 'ai-search', 'aeo'],
  'brand-mention-scanner': ['visibility', 'ai-search', 'aeo'],
  'ai-snippet-tester': ['aeo', 'content', 'ai-search'],
  'citation-velocity-tracker': ['visibility', 'ai-search'],
  'entity-finder': ['entities', 'seo'],
  'entity-gap-analyzer': ['entities', 'seo', 'aeo'],
  'ai-authority-score': ['entities', 'visibility'],
  'knowledge-graph-explorer': ['entities', 'seo'],
  'wikidata-checker': ['entities', 'seo'],
  'ai-readiness-audit': ['audits', 'aeo', 'geo'],
  'ai-content-readability-checker': ['content', 'aeo'],
  'answer-format-checker': ['aeo', 'content'],
  'ai-crawl-tester': ['crawlers', 'technical'],
  'ai-schema-generator': ['schema', 'seo'],
  'ai-prompt-generator': ['aeo', 'content', 'ai-search'],
  'faq-schema-generator': ['schema', 'aeo', 'seo'],
  'ai-meta-tag-generator': ['seo', 'content', 'technical'],
  'ai-competitor-citation-report': ['visibility', 'ai-search', 'seo'],
  'ai-opportunity-finder': ['aeo', 'geo', 'seo'],
  'ai-visibility-forecast': ['visibility', 'ai-search'],
  'ai-revenue-calculator': ['visibility', 'seo'],
  'ai-influence-graph-viewer': ['entities', 'visibility'],
}

/* ─── Tool card component ───────────────────────────────────────────────── */
function ToolCard({ tool }: { tool: FreeTool }) {
  return (
    <Link href={`/free-ai-seo-tools/${tool.slug}`} className="block h-full">
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/25 hover:shadow-[0_0_25px_rgba(168,85,247,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group">
        <CardContent className="p-5 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between">
            <div
              className={`w-11 h-11 rounded-xl ${tool.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
            >
              <IconRenderer name={tool.icon} className={`w-5 h-5 ${tool.color}`} />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 h-5 border-amber-500/40 text-amber-300 bg-amber-500/5"
              >
                {tool.category}
              </Badge>
              {tool.status === 'live' ? (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 h-5 border-emerald-500/50 text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 h-5 border-white/20 text-muted-foreground/70 bg-white/5"
                >
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1">{tool.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.tagline}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 h-5 border-emerald-500/40 text-emerald-300 bg-emerald-500/5"
            >
              Free
            </Badge>
            <span
              className={`text-sm font-medium ${tool.color} flex items-center gap-1 group-hover:gap-2 transition-all`}
            >
              Use Tool
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/* ─── Main client component ─────────────────────────────────────────────── */
export default function ToolsPageClient({ tools }: { tools: FreeTool[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  const liveCount = tools.filter((t) => t.status === 'live').length

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchesCategory =
        activeCategory === 'all' ||
        (slugToDisplayCategories[t.slug] || []).includes(activeCategory)
      const matchesSearch =
        search.trim() === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tagline.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [tools, activeCategory, search])

  const getCategoryCount = (slug: string) =>
    tools.filter((t) => (slugToDisplayCategories[t.slug] || []).includes(slug)).length

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm rounded-full mb-6">
            <Gift className="w-3.5 h-3.5" />
            Free Forever · No Signup Required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Free AI Visibility
            <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
              Tools
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            {tools.length}+ free tools to understand, measure and improve your AI Visibility. No
            signup required. {liveCount} are live now — more ship every month.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/free-ai-seo-tools/${tools[0]?.slug ?? 'ai-visibility-checker'}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300"
            >
              <Zap className="w-4 h-4" />
              Try the AI Visibility Checker
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 text-foreground font-semibold rounded-lg transition-all duration-300"
            >
              See paid plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
              placeholder="Search tools by name, description or category…"
              className="w-full pl-12 pr-4 py-3 min-h-[48px] rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
              aria-label="Search free tools"
            />
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              All ({tools.length})
            </button>
            {displayCategories.map((cat) => {
              const count = getCategoryCount(cat.slug)
              if (count === 0) return null
              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.slug
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Tool count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'tool' : 'tools'} available
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="ml-2 text-emerald-400 hover:text-emerald-300 underline"
                >
                  Show all
                </button>
              )}
            </p>
          </div>

          {/* Tools grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((tool) => (
                <motion.div
                  key={tool.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ToolCard tool={tool} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No tools match your search</p>
              <p className="text-sm">Try a different keyword or category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Why free tools ─────────────────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why use our free tools?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by the same team that powers the SeoSights AI Visibility Intelligence Platform.
              Free forever, no credit card, no email wall.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'No signup, no credit card',
                description:
                  'Every tool runs instantly in your browser. We rate-limit by IP to keep the service fast for everyone — that is the only gate.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/15',
              },
              {
                icon: Zap,
                title: 'Real results in 30 seconds',
                description:
                  'No mock data, no fake demos. The AI Visibility Checker and Robots.txt Tester fetch your real site and probe real answer engines.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/15',
              },
              {
                icon: Gift,
                title: 'Built to be shared',
                description:
                  'Every check produces a shareable URL. Bookmark it, send it to your team, or drop it in a client report.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/15',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/25 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-purple-500/5 to-amber-500/10 p-8 sm:p-12 backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Want AI to recommend your business?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Free tools are great for spot checks. The SeoSights platform runs all checks
              continuously, alerts you when something changes, and ships a 90-day auto-executed
              roadmap.
            </p>
            <Link
              href="/#cta"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
            >
              Start your free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-4">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
