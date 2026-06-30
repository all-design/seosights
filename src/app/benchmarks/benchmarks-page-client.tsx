'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Microscope,
  Globe,
  Award,
} from 'lucide-react'

import { industryBenchmarks, BenchmarkCompany, IndustryBenchmark } from '@/data/benchmarks-data'

// ── Types re-exported from shared benchmarks-data.ts ─────────────────────

type BenchmarkCompanyType = BenchmarkCompany
type IndustryBenchmarkType = IndustryBenchmark

// ── Helper ──────────────────────────────────────────────────────────────

function getRankStyle(rank: number) {
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

function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 75) return 'text-cyan-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-slate-400'
}

// ── Component ───────────────────────────────────────────────────────────

export default function BenchmarksPageClient() {
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
              <Microscope className="w-4 h-4" />
              Verified by Observatory™
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              AI Visibility{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Benchmarks
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Public rankings powered by the AI Search Observatory™.{' '}
              <span className="text-white font-medium">Real-time data. Transparent methodology.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Industry Benchmarks ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-2xl font-bold">Industry Rankings</h2>
        </div>

        <div className="space-y-10">
          {industryBenchmarks.map((industry, industryIdx) => (
            <motion.div
              key={industry.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: industryIdx * 0.05 }}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/40 overflow-hidden"
            >
              {/* Industry header */}
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{industry.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">Top AI Visibility: {industry.name}</h3>
                    <p className="text-xs text-slate-500">Top 10 companies ranked by AI Visibility Score</p>
                  </div>
                </div>
                <Link
                  href={`/industries/${industry.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View Full Ranking
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/40 text-slate-500">
                      <th className="text-left py-3 px-4 font-medium w-16">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Company</th>
                      <th className="text-center py-3 px-3 font-medium">AI Visibility</th>
                      <th className="text-center py-3 px-3 font-medium">ChatGPT</th>
                      <th className="text-center py-3 px-3 font-medium">Claude</th>
                      <th className="text-center py-3 px-3 font-medium">Gemini</th>
                      <th className="text-center py-3 px-3 font-medium">Perplexity</th>
                      <th className="text-center py-3 px-3 font-medium">Trend</th>
                      <th className="text-center py-3 px-3 font-medium">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industry.companies.map((company) => (
                      <tr
                        key={company.slug}
                        className="border-b border-slate-800/20 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${getRankStyle(company.rank)}`}>
                            {company.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/directory/${company.slug}`}
                            className="text-white hover:text-emerald-400 font-medium transition-colors"
                          >
                            {company.name}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-bold ${getScoreColor(company.aiVisibilityScore)}`}>
                            {company.aiVisibilityScore}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">{company.chatgptScore}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{company.claudeScore}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{company.geminiScore}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{company.perplexityScore}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(company.trend)}
                            <span className={`text-xs font-medium ${company.trend > 0 ? 'text-emerald-400' : company.trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                              {company.trend > 0 ? '+' : ''}{company.trend}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {company.verified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile link */}
              <div className="px-6 py-3 border-t border-slate-800/40 sm:hidden">
                <Link
                  href={`/industries/${industry.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-emerald-400"
                >
                  View Full Ranking
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Methodology ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Methodology</h3>
              <p className="text-xs text-emerald-400 font-medium">Verified by Observatory™</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
            <p>
              AI Visibility Scores are calculated by the <span className="text-white font-medium">AI Search Observatory™</span>, which
              continuously monitors how AI models (ChatGPT, Claude, Gemini, Perplexity) recommend businesses across thousands of real
              queries in every industry.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Multi-Engine Scoring</span>
                </div>
                <p className="text-xs text-slate-500">
                  Each company is scored across 4 AI engines using standardized prompts per industry.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Weighted Composite</span>
                </div>
                <p className="text-xs text-slate-500">
                  The AI Visibility Score is a weighted composite: citation frequency, recommendation rank, and response prominence.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Verified Badge</span>
                </div>
                <p className="text-xs text-slate-500">
                  Companies with the verified badge have been validated through direct API queries and human review.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
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
              Where does your company rank?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Get your AI Visibility Score and see how AI models recommend your business.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-lg shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300"
            >
              Get your AI Visibility Score
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
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
