'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowRight,
  MessageSquare,
  Satellite,
  TrendingUp,
  FileCode,
  ShoppingCart,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface ObservatoryStatus {
  aiModelsTracked: number
  signalsDetected: number
  researchPublished: number
  industriesCovered: number
  dataPointsCollected: number
  confidenceScore: number
  models: AIModel[]
  latestSignals: SignalItem[]
  researchReports: ResearchReport[]
}

interface AIModel {
  name: string
  shortName: string
  color: string
}

interface SignalItem {
  id: string
  text: string
  model: string
  timeAgo: string
  type: 'citation_change' | 'source_shift' | 'ranking_change' | 'new_capability'
}

interface ResearchReport {
  title: string
  type: 'research' | 'benchmark' | 'industry_update' | 'monthly_report'
  date: string
  readingTime: number
  excerpt: string
  slug: string
}

// ── Research Cards Data ───────────────────────────────────────
const FEATURED_RESEARCH = {
  title: 'ChatGPT increased GitHub citations 27%',
  stat: '891 prompts analyzed · 91% confidence',
  link: '/observatory',
}

const RESEARCH_CARDS = [
  {
    icon: MessageSquare,
    title: 'Claude shifts to Reddit sources for SaaS queries',
    stat: '62% increase in Reddit citations',
    time: 'Today',
    link: '/observatory',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'hover:border-amber-500/30',
    statColor: 'text-amber-300',
  },
  {
    icon: FileCode,
    title: 'Gemini now prioritizes llms.txt content',
    stat: '3.2x more citations with llms.txt',
    time: 'Today',
    link: '/observatory',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'hover:border-cyan-500/30',
    statColor: 'text-cyan-300',
  },
  {
    icon: ShoppingCart,
    title: 'Perplexity doubles e-commerce references',
    stat: 'Product schema citations up 48%',
    time: 'Mar 4',
    link: '/observatory',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'hover:border-rose-500/30',
    statColor: 'text-rose-300',
  },
]

// ── Main Component ────────────────────────────────────────────
export default function ObservatorySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [data, setData] = useState<ObservatoryStatus | null>(null)

  useEffect(() => {
    // Try fetching from API, fall back to mock data
    const fetchData = async () => {
      try {
        const res = await fetch('/api/observatory/status')
        if (res.ok) {
          const json = await res.json()
          if (json && json.overview) {
            // Transform API response to match our interface
            setData({
              aiModelsTracked: json.overview.totalSignals || 6,
              signalsDetected: json.overview.totalChanges || 12847,
              researchPublished: json.overview.totalReports || 94,
              industriesCovered: json.overview.totalIndustries || 312,
              dataPointsCollected: json.overview.totalResponses || 2840000,
              confidenceScore: 94.7,
              models: [],
              latestSignals: [],
              researchReports: [],
            })
          }
        }
      } catch {
        // Silently use fallback — we rely on static research cards
      }
    }
    fetchData()
  }, [])

  return (
    <section
      ref={ref}
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* ── Dark Gradient Background ──────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/95 to-gray-950" />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Top radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(16,185,129,0.07)_0%,transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div
          className="text-center mb-14 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest gap-1.5"
            >
              <Satellite className="size-3" />
              Research
            </Badge>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
            AI Search Observatory
          </h2>
          <p className="text-sm sm:text-base text-emerald-400/70 font-medium tracking-wide uppercase mb-5">
            Powered by SeoSights
          </p>
          <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            The only open research center tracking how AI models cite, rank, and recommend businesses. 
            Updated daily. Cited by the industry.
          </p>
        </motion.div>

        {/* ── Featured Research Card ──────────────────────────── */}
        <motion.div
          className="mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-emerald-950/60 to-gray-900/80 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 backdrop-blur-sm py-0 gap-0 overflow-hidden group">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400" />
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="size-5 text-emerald-400" />
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold"
                    >
                      Featured Research
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight group-hover:text-emerald-50 transition-colors">
                    {FEATURED_RESEARCH.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {FEATURED_RESEARCH.stat}
                  </p>
                </div>
                <Link
                  href={FEATURED_RESEARCH.link}
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors group/link shrink-0"
                >
                  Read report
                  <ArrowRight className="size-4 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 3 Smaller Research Cards ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-12 sm:mb-14">
          {RESEARCH_CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
              >
                <Card className={`h-full bg-gray-900/60 border-gray-800/60 ${card.borderColor} transition-all duration-300 backdrop-blur-sm py-0 gap-0 overflow-hidden`}>
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon className={`size-4 ${card.color}`} />
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">{card.time}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">
                      {card.title}
                    </h4>
                    <p className={`text-sm font-medium ${card.statColor}`}>
                      {card.stat}
                    </p>
                    <Link
                      href={card.link}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors mt-auto pt-2 border-t border-gray-800/60"
                    >
                      Read more
                      <ArrowRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────── */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/observatory">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 shadow-lg shadow-emerald-500/20 transition-all duration-300"
            >
              <Satellite className="size-4 mr-2" />
              Explore the Observatory
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-gray-500">
            Free access to the research library · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  )
}
