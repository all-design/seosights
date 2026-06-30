'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  Brain,
  BarChart3,
  Cpu,
  FileText,
  Zap,
  Target,
  Check,
  X,
} from 'lucide-react'

import { competitors as competitorsData, features as featuresData, tableHeaders as tableHeadersData, FeatureCheck } from '@/data/compare-data'

// ── Data imported from shared compare-data.ts ───────────────────────────

const competitors = competitorsData

// Map icon string names from shared data back to Lucide components for rendering
const iconMap: Record<string, React.ElementType> = { Eye, Brain, Cpu, Zap, FileText, ShieldCheck, Target, BarChart3 }

const features: { name: string; icon: React.ElementType; data: FeatureCheck }[] = featuresData.map((f) => ({
  name: f.name,
  icon: iconMap[f.icon] ?? Eye,
  data: f.data,
}))

const tableHeaders = tableHeadersData

// ── Animation Variants ──────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' },
  }),
}

// ── Component ───────────────────────────────────────────────────────────

export default function ComparePageClient() {
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
              AI Visibility Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              How SeoSights{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Compares
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              See how AI Visibility Intelligence compares to traditional SEO tools.{' '}
              <span className="text-white font-medium">A new category. A new metric.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Competitor Cards ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {competitors.map((comp, i) => (
            <motion.div
              key={comp.slug}
              custom={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className={`group relative rounded-2xl bg-gradient-to-br ${comp.color} border ${comp.borderColor} p-6 hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-800/80 border ${comp.borderColor} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${comp.iconColor}`}>
                    {comp.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">SeoSights vs</h3>
                  <p className={`font-bold ${comp.iconColor}`}>{comp.name}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-2 font-medium">{comp.differentiator}</p>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">{comp.description}</p>
              <Link
                href={`/compare/${comp.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Read Comparison
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Feature Comparison</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            A detailed look at how SeoSights stacks up against every major competitor.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/50"
        >
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left py-4 px-4 text-slate-400 font-medium">Feature</th>
                {tableHeaders.map((h) => (
                  <th
                    key={h.key}
                    className={`text-center py-4 px-3 font-semibold ${
                      h.highlight
                        ? 'text-emerald-400 bg-emerald-500/5'
                        : 'text-slate-300'
                    }`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feat, idx) => {
                const Icon = feat.icon
                return (
                  <tr
                    key={feat.name}
                    className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${
                      idx % 2 === 0 ? 'bg-slate-900/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-slate-300">{feat.name}</span>
                      </div>
                    </td>
                    {tableHeaders.map((h) => {
                      const val = feat.data[h.key]
                      return (
                        <td
                          key={h.key}
                          className={`text-center py-3 px-3 ${
                            h.highlight ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          {val ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600 mx-auto" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to see what traditional SEO tools miss?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              AI Visibility is a new category. SeoSights is the only platform built for it.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-lg shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300"
            >
              Start your AI Visibility journey
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
