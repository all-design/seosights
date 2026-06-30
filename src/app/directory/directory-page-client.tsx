'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Building2,
  Sparkles,
  Brain,
  Cpu,
  Zap,
  Eye,
  MessageSquare,
  BarChart3,
} from 'lucide-react'

import { directoryCompanies, DirectoryCompany, directoryCategories, directoryLocations, directoryAiEngines } from '@/data/directory-data'

// ── Types ───────────────────────────────────────────────────────────────

type DirectoryCompanyType = DirectoryCompany

// ── Data imported from shared directory-data.ts ─────────────────────────

const companies = directoryCompanies

// ── Category / Location / Engine options ────────────────────────────────

const categories = [...directoryCategories]
const locations = [...directoryLocations]
const aiEngines = [...directoryAiEngines]
const sortOptions = [
  { key: 'aiVisibilityScore', label: 'AI Visibility Score' },
  { key: 'chatgptScore', label: 'ChatGPT Score' },
  { key: 'recommendationRate', label: 'Recommendation Rate' },
  { key: 'citations', label: 'Citations' },
  { key: 'trend', label: 'Trend' },
] as const

type SortKey = typeof sortOptions[number]['key']

// ── Helpers ─────────────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 75) return 'text-cyan-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-slate-400'
}

function getScoreBg(score: number) {
  if (score >= 90) return 'from-emerald-500/20 to-emerald-600/5'
  if (score >= 75) return 'from-cyan-500/20 to-cyan-600/5'
  if (score >= 60) return 'from-amber-500/20 to-amber-600/5'
  return 'from-slate-500/20 to-slate-600/5'
}

function getRankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (rank === 2) return 'bg-slate-400/20 text-slate-300 border-slate-400/30'
  if (rank === 3) return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
  return 'bg-slate-800/50 text-slate-400 border-slate-700/50'
}

function getTrendIcon(trend: number) {
  if (trend > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
  if (trend < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
  return <Minus className="w-3.5 h-3.5 text-slate-500" />
}

function MiniScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-6 text-right">{value}</span>
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────

export default function DirectoryPageClient() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [location, setLocation] = useState('Global')
  const [engine, setEngine] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('aiVisibilityScore')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Filtered + sorted companies
  const filtered = useMemo(() => {
    let result = [...companies]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }

    // Category
    if (category !== 'All') {
      result = result.filter((c) => c.industry === category)
    }

    // Location
    if (location !== 'Global') {
      if (location === 'Europe') {
        result = result.filter((c) => ['UK', 'Germany', 'France', 'Switzerland', 'Serbia', 'Croatia'].includes(c.location))
      } else {
        result = result.filter((c) => c.location === location)
      }
    }

    // Engine filter (highlight companies with high score in that engine)
    if (engine) {
      const engineKey = engine.toLowerCase().replace('chatgpt', 'chatgptScore').replace('claude', 'claudeScore').replace('gemini', 'geminiScore').replace('perplexity', 'perplexityScore') as keyof DirectoryCompany
      result = result.filter((c) => (c[engineKey] as number) >= 70)
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy] as number
      const bVal = b[sortBy] as number
      return bVal - aVal
    })

    return result
  }, [search, category, location, engine, sortBy])

  // Top 100 (all companies sorted by AI Visibility Score)
  const top100 = useMemo(() => {
    return [...companies].sort((a, b) => b.aiVisibilityScore - a.aiVisibilityScore).slice(0, 100)
  }, [])

  // Per-engine top 10
  const topChatGPT = useMemo(() => [...companies].sort((a, b) => b.chatgptScore - a.chatgptScore).slice(0, 10), [])
  const topClaude = useMemo(() => [...companies].sort((a, b) => b.claudeScore - a.claudeScore).slice(0, 10), [])
  const topGemini = useMemo(() => [...companies].sort((a, b) => b.geminiScore - a.geminiScore).slice(0, 10), [])
  const topPerplexity = useMemo(() => [...companies].sort((a, b) => b.perplexityScore - a.perplexityScore).slice(0, 10), [])

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              AI Visibility Directory™
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              AI Visibility{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Directory™
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              The only directory ranked by how AI recommends businesses.{' '}
              <span className="text-white font-medium">Not SEO. Not backlinks. AI recommendations.</span>
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies, industries, or locations"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all text-lg"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Filters & View Toggle ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showFilters ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            {/* View toggle */}
            <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Location */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
                  <div className="flex flex-wrap gap-1.5">
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          location === loc
                            ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800/40 text-slate-500 hover:text-white border border-transparent'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Engine */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">AI Engine</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setEngine('')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        engine === ''
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'bg-slate-800/40 text-slate-500 hover:text-white border border-transparent'
                      }`}
                    >
                      All
                    </button>
                    {aiEngines.map((eng) => (
                      <button
                        key={eng}
                        onClick={() => setEngine(eng)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          engine === eng
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-800/40 text-slate-500 hover:text-white border border-transparent'
                        }`}
                      >
                        {eng}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Sort by</label>
                  <div className="flex flex-wrap gap-1.5">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          sortBy === opt.key
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800/40 text-slate-500 hover:text-white border border-transparent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="mt-4 text-sm text-slate-500">
          Showing {filtered.length} of {companies.length} companies
        </div>
      </section>

      {/* ── Company Cards ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No companies found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((company, idx) => (
              <motion.div
                key={company.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.4 }}
                className="group rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getScoreBg(company.aiVisibilityScore)} border border-slate-700/40 flex items-center justify-center`}>
                        <span className="text-sm font-bold text-white">{company.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 className="w-3 h-3" />
                          {company.industry}
                          <span className="text-slate-700">·</span>
                          <span>{company.countryCode} {company.location}</span>
                        </div>
                      </div>
                    </div>
                    {company.verified && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>

                  {/* AI Visibility Score */}
                  <div className="mb-4">
                    <div className="flex items-end gap-2 mb-1">
                      <span className={`text-3xl font-bold ${getScoreColor(company.aiVisibilityScore)}`}>
                        {company.aiVisibilityScore}
                      </span>
                      <span className="text-xs text-slate-500 mb-1">AI Visibility</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          company.aiVisibilityScore >= 90 ? 'bg-emerald-500' :
                          company.aiVisibilityScore >= 75 ? 'bg-cyan-500' :
                          company.aiVisibilityScore >= 60 ? 'bg-amber-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${company.aiVisibilityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Per-engine mini bars */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3 h-3 text-green-400 shrink-0" />
                      <MiniScoreBar value={company.chatgptScore} color="bg-green-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3 text-orange-400 shrink-0" />
                      <MiniScoreBar value={company.claudeScore} color="bg-orange-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                      <MiniScoreBar value={company.geminiScore} color="bg-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-teal-400 shrink-0" />
                      <MiniScoreBar value={company.perplexityScore} color="bg-teal-500" />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(company.trend)}
                        <span className={company.trend > 0 ? 'text-emerald-400' : company.trend < 0 ? 'text-red-400' : 'text-slate-500'}>
                          {company.trend > 0 ? '+' : ''}{company.trend}
                        </span>
                      </div>
                      <span>{company.citations.toLocaleString()} citations</span>
                    </div>
                    <Link
                      href={`/directory/${company.slug}`}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/40">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500">
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">Company</th>
                  <th className="text-center py-3 px-3 font-medium">AI Visibility</th>
                  <th className="text-center py-3 px-3 font-medium">ChatGPT</th>
                  <th className="text-center py-3 px-3 font-medium">Claude</th>
                  <th className="text-center py-3 px-3 font-medium">Gemini</th>
                  <th className="text-center py-3 px-3 font-medium">Perplexity</th>
                  <th className="text-center py-3 px-3 font-medium">Trend</th>
                  <th className="text-center py-3 px-3 font-medium">Citations</th>
                  <th className="text-center py-3 px-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company, idx) => (
                  <tr key={company.slug} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{company.name}</span>
                        <span className="text-xs text-slate-500">{company.countryCode}</span>
                        {company.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-xs text-slate-500">{company.industry} · {company.location}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${getScoreColor(company.aiVisibilityScore)}`}>{company.aiVisibilityScore}</span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">{company.chatgptScore}</td>
                    <td className="py-3 px-3 text-center text-slate-400">{company.claudeScore}</td>
                    <td className="py-3 px-3 text-center text-slate-400">{company.geminiScore}</td>
                    <td className="py-3 px-3 text-center text-slate-400">{company.perplexityScore}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(company.trend)}
                        <span className={`text-xs ${company.trend > 0 ? 'text-emerald-400' : company.trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {company.trend > 0 ? '+' : ''}{company.trend}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">{company.citations.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center">
                      <Link href={`/directory/${company.slug}`} className="text-xs text-emerald-400 hover:text-emerald-300">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Top 100 ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Top 100 Most Recommended Companies by AI</h2>
              <p className="text-sm text-slate-500">The definitive ranking of companies AI models recommend most</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/40 max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                <tr className="border-b border-slate-800/60 text-slate-500">
                  <th className="text-left py-3 px-4 font-medium w-14">Rank</th>
                  <th className="text-left py-3 px-4 font-medium">Company</th>
                  <th className="text-left py-3 px-4 font-medium">Industry</th>
                  <th className="text-center py-3 px-3 font-medium">AI Visibility</th>
                  <th className="text-center py-3 px-3 font-medium">ChatGPT</th>
                  <th className="text-center py-3 px-3 font-medium">Claude</th>
                  <th className="text-center py-3 px-3 font-medium">Gemini</th>
                  <th className="text-center py-3 px-3 font-medium">Perplexity</th>
                  <th className="text-center py-3 px-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {top100.map((company) => (
                  <tr key={company.slug} className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${getRankBadge(company.aiVisibilityScore >= 90 ? 1 : company.aiVisibilityScore >= 80 ? 2 : company.aiVisibilityScore >= 70 ? 3 : 4)}`}>
                        {top100.indexOf(company) + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Link href={`/directory/${company.slug}`} className="font-medium text-white hover:text-emerald-400 transition-colors">
                        {company.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-xs">{company.industry}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-bold ${getScoreColor(company.aiVisibilityScore)}`}>{company.aiVisibilityScore}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{company.chatgptScore}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{company.claudeScore}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{company.geminiScore}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{company.perplexityScore}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(company.trend)}
                        <span className={`text-xs ${company.trend > 0 ? 'text-emerald-400' : company.trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {company.trend > 0 ? '+' : ''}{company.trend}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ── Per-Engine Top 10 Sections ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Top Companies by AI Engine</h2>
            <p className="text-sm text-slate-500">See which companies dominate each AI model</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ChatGPT Top 10 */}
          <EngineTop10 title="Top Companies Recommended by ChatGPT" icon={Brain} iconColor="text-green-400" bgColor="bg-green-500/10" borderColor="border-green-500/20" companies={topChatGPT} scoreKey="chatgptScore" />

          {/* Claude Top 10 */}
          <EngineTop10 title="Top Companies Recommended by Claude" icon={MessageSquare} iconColor="text-orange-400" bgColor="bg-orange-500/10" borderColor="border-orange-500/20" companies={topClaude} scoreKey="claudeScore" />

          {/* Gemini Top 10 */}
          <EngineTop10 title="Top Companies Recommended by Gemini" icon={Sparkles} iconColor="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" companies={topGemini} scoreKey="geminiScore" />

          {/* Perplexity Top 10 */}
          <EngineTop10 title="Top Companies Recommended by Perplexity" icon={Zap} iconColor="text-teal-400" bgColor="bg-teal-500/10" borderColor="border-teal-500/20" companies={topPerplexity} scoreKey="perplexityScore" />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Is your company in the Directory?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Join the AI Visibility Directory™ and see how AI models recommend your business.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-lg shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300"
            >
              Add your company to the Directory
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-800/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} SeoSights — AI Visibility Intelligence Platform
          </p>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/observatory" className="text-sm text-slate-400 hover:text-white transition-colors">
              Observatory
            </Link>
            <Link href="/benchmarks" className="text-sm text-slate-400 hover:text-white transition-colors">
              Benchmarks
            </Link>
            <Link href="/compare" className="text-sm text-slate-400 hover:text-white transition-colors">
              Compare
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Engine Top 10 Sub-Component ─────────────────────────────────────────

function EngineTop10({
  title,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  companies: topCompanies,
  scoreKey,
}: {
  title: string
  icon: React.ElementType
  iconColor: string
  bgColor: string
  borderColor: string
  companies: DirectoryCompany[]
  scoreKey: 'chatgptScore' | 'claudeScore' | 'geminiScore' | 'perplexityScore'
}) {
  return (
    <div className={`rounded-2xl border ${borderColor} bg-slate-900/40 overflow-hidden`}>
      <div className={`px-5 py-3 border-b ${borderColor} flex items-center gap-2`}>
        <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-slate-800/40">
        {topCompanies.map((company, idx) => (
          <div key={company.slug} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-800/20 transition-colors">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold border ${getRankBadge(idx + 1)}`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <Link href={`/directory/${company.slug}`} className="text-sm font-medium text-white hover:text-emerald-400 transition-colors truncate block">
                {company.name}
              </Link>
              <span className="text-xs text-slate-500">{company.industry}</span>
            </div>
            <span className={`text-sm font-bold ${getScoreColor(company[scoreKey])}`}>
              {company[scoreKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
