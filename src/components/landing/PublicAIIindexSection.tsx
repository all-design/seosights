'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react'

// ── AI Engine data ─────────────────────────────────────────────────────────
interface AIEngine {
  company: string
  model: string
  status: string
  statusIcon: 'operational' | 'new'
  lastUpdated: string
  crawlFrequency: string
  citationTendency: string
  tendencyColor: string
}

const engines: AIEngine[] = [
  {
    company: 'OpenAI',
    model: 'GPT-4o',
    status: 'Operational',
    statusIcon: 'operational',
    lastUpdated: 'Mar 2025',
    crawlFrequency: 'Daily',
    citationTendency: 'High',
    tendencyColor: 'text-emerald-400',
  },
  {
    company: 'Anthropic',
    model: 'Claude 3.5 Sonnet',
    status: 'Operational',
    statusIcon: 'operational',
    lastUpdated: 'Feb 2025',
    crawlFrequency: 'Weekly',
    citationTendency: 'High',
    tendencyColor: 'text-emerald-400',
  },
  {
    company: 'Google',
    model: 'Gemini 2.0 Flash',
    status: 'New Release',
    statusIcon: 'new',
    lastUpdated: 'Mar 2025',
    crawlFrequency: 'Daily',
    citationTendency: 'Medium',
    tendencyColor: 'text-amber-400',
  },
  {
    company: 'Perplexity',
    model: 'Sonar Large',
    status: 'Operational',
    statusIcon: 'operational',
    lastUpdated: 'Ongoing',
    crawlFrequency: 'Real-time',
    citationTendency: 'Very High',
    tendencyColor: 'text-emerald-400',
  },
  {
    company: 'Meta',
    model: 'Llama 3.1',
    status: 'Operational',
    statusIcon: 'operational',
    lastUpdated: 'Jan 2025',
    crawlFrequency: 'Weekly',
    citationTendency: 'Low',
    tendencyColor: 'text-rose-400',
  },
]

// ── Engine card component ──────────────────────────────────────────────────
function EngineCard({ engine, index }: { engine: AIEngine; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="bg-card/50 border border-white/[0.06] hover:border-white/15 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Company + Model */}
            <div className="flex items-center gap-3 sm:w-52">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{engine.company}</p>
                <p className="text-xs text-muted-foreground">{engine.model}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 sm:w-32">
              {engine.statusIcon === 'operational' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )}
              <span className={`text-xs font-medium ${engine.statusIcon === 'operational' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {engine.status}
              </span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 sm:w-28">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground">{engine.lastUpdated}</span>
            </div>

            {/* Crawl Frequency */}
            <div className="flex items-center gap-2 sm:w-24">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground">{engine.crawlFrequency}</span>
            </div>

            {/* Citation Tendency */}
            <div className="flex items-center gap-2 sm:w-24">
              <Activity className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className={`text-xs font-semibold ${engine.tendencyColor}`}>{engine.citationTendency}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PublicAIIindexSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 px-6 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            <Activity className="w-3 h-3 mr-1" />
            AI Visibility Index™ — Updated Daily
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            Public AI Engine{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Status Index
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time status and citation behavior of every major AI engine. Know when models update, how often they crawl, and how likely they are to cite your content.
          </p>
        </motion.div>

        {/* Last checked indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Last checked: {new Date().toLocaleString()}</span>
        </motion.div>

        {/* Column headers (desktop) */}
        <motion.div
          className="hidden sm:grid sm:grid-cols-[208px_128px_112px_96px_96px] gap-4 px-5 mb-3"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Engine</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Status</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Updated</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Crawl Freq</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">Citations</span>
        </motion.div>

        {/* Engine cards */}
        <div className="space-y-3 mb-12">
          {engines.map((engine, i) => (
            <EngineCard key={engine.company} engine={engine} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-background to-cyan-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-bold text-foreground">Get Alerted When AI Models Update</span>
            </div>
            <p className="text-muted-foreground text-sm">Free email alerts when AI engines change their behavior</p>
            <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold">
              <Zap className="w-4 h-4 mr-2" />
              Get Free Alerts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
