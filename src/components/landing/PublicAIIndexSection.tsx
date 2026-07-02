'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Bell,
  Radio,
  ArrowRight,
  Cpu,
  Sparkles,
  Clock,
  Globe,
  Zap,
  RefreshCw,
} from 'lucide-react'

const engineData = [
  {
    engine: 'OpenAI',
    model: 'GPT-4o',
    status: 'operational',
    lastUpdate: 'Mar 2025',
    crawlFrequency: 'Daily',
    citationTendency: 'High',
    userBase: '200M+ weekly',
    crawlerBot: 'GPTBot',
    color: 'emerald',
  },
  {
    engine: 'Anthropic',
    model: 'Claude 3.5 Sonnet',
    status: 'operational',
    lastUpdate: 'Feb 2025',
    crawlFrequency: 'Weekly',
    citationTendency: 'High',
    userBase: '100M+ monthly',
    crawlerBot: 'ClaudeBot',
    color: 'amber',
  },
  {
    engine: 'Google',
    model: 'Gemini 2.0 Flash',
    status: 'new_release',
    lastUpdate: 'Mar 2025',
    crawlFrequency: 'Daily',
    citationTendency: 'Medium',
    userBase: '300M+ monthly',
    crawlerBot: 'Google-Extended',
    color: 'violet',
  },
  {
    engine: 'Perplexity',
    model: 'Sonar Large',
    status: 'operational',
    lastUpdate: 'Ongoing',
    crawlFrequency: 'Real-time',
    citationTendency: 'Very High',
    userBase: '15M+ daily',
    crawlerBot: 'PerplexityBot',
    color: 'cyan',
  },
  {
    engine: 'Meta',
    model: 'Llama 3.1',
    status: 'operational',
    lastUpdate: 'Jan 2025',
    crawlFrequency: 'Weekly',
    citationTendency: 'Low',
    userBase: 'Open source',
    crawlerBot: 'MetaBot',
    color: 'purple',
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'operational':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Operational</Badge>
    case 'new_release':
      return <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]"><Sparkles className="w-3 h-3 mr-1" />New Release</Badge>
    case 'degraded':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]"><RefreshCw className="w-3 h-3 mr-1" />Degraded</Badge>
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>
  }
}

export default function PublicAIIndexSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 relative" ref={ref} id="ai-index">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-6"
          >
            <Radio className="w-3.5 h-3.5" />
            AI Visibility Index™ — Updated Daily
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Public AI Engine{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Status Index
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The reference point for the internet. Track every major AI model update, crawl frequency, and citation behavior.
          </p>
        </motion.div>

        {/* Engine Status Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 border-b border-white/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Engine</div>
              <div>Model</div>
              <div>Status</div>
              <div>Last Updated</div>
              <div>Crawl Freq</div>
              <div>Citation</div>
              <div>User Base</div>
            </div>

            {/* Table Rows */}
            {engineData.map((e, i) => (
              <motion.div
                key={e.engine}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-${e.color}-500/20 flex items-center justify-center`}>
                    <Cpu className={`w-4 h-4 text-${e.color}-400`} />
                  </div>
                  <span className="font-semibold text-foreground text-sm">{e.engine}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="md:hidden text-xs text-muted-foreground/60 mr-2">Model:</span>
                  {e.model}
                </div>
                <div className="flex items-center">
                  {getStatusBadge(e.status)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1.5 hidden md:inline" />
                  {e.lastUpdate}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Globe className="w-3 h-3 mr-1.5 hidden md:inline" />
                  {e.crawlFrequency}
                </div>
                <div className="flex items-center text-sm">
                  <span className={e.citationTendency === 'Very High' ? 'text-emerald-400' : e.citationTendency === 'High' ? 'text-amber-400' : 'text-muted-foreground'}>
                    {e.citationTendency}
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {e.userBase}
                </div>
              </motion.div>
            ))}
          </Card>
        </motion.div>

        {/* Last Checked */}
        <motion.div
          className="text-center mt-6 mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3" />
            Last checked: {new Date().toLocaleString()} · Auto-updated daily
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-900/20"
          >
            <Bell className="mr-2 w-4 h-4" />
            Get Alerted When AI Models Update — Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
