'use client'

import { useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Star,
  Flame,
  FileText,
  Code,
  Globe,
  Settings,
  MessageSquare,
  Image,
  Type,
} from 'lucide-react'

// ── Mock data: 8 items with varying ROI/effort/priority ──────────────────
interface QueueItem {
  id: string
  icon: React.ElementType
  title: string
  description: string
  roiScore: number
  effortHours: number
  scoreGain: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'quick-win' | 'big-impact'
  engine: string
}

const queueItems: QueueItem[] = [
  {
    id: '1',
    icon: FileText,
    title: 'Add FAQ Schema to Services Page',
    description: 'Structured data for AI citation targeting',
    roiScore: 95,
    effortHours: 0.5,
    scoreGain: 12,
    priority: 'critical',
    category: 'quick-win',
    engine: 'ChatGPT',
  },
  {
    id: '2',
    icon: Code,
    title: 'Generate llms.txt File',
    description: 'Enable LLM discoverability for all content',
    roiScore: 92,
    effortHours: 0.2,
    scoreGain: 10,
    priority: 'critical',
    category: 'quick-win',
    engine: 'All',
  },
  {
    id: '3',
    icon: Settings,
    title: 'Fix robots.txt for AI Crawlers',
    description: 'Unblock GPTBot, ClaudeBot, PerplexityBot',
    roiScore: 88,
    effortHours: 0.3,
    scoreGain: 8,
    priority: 'critical',
    category: 'quick-win',
    engine: 'All',
  },
  {
    id: '4',
    icon: Globe,
    title: 'Optimize Meta Descriptions',
    description: '5 pages need AI-citation-friendly descriptions',
    roiScore: 78,
    effortHours: 1.0,
    scoreGain: 6,
    priority: 'high',
    category: 'quick-win',
    engine: 'Perplexity',
  },
  {
    id: '5',
    icon: MessageSquare,
    title: 'Create Entity Knowledge Graph',
    description: 'Build entity relationships for AI understanding',
    roiScore: 85,
    effortHours: 3.0,
    scoreGain: 15,
    priority: 'high',
    category: 'big-impact',
    engine: 'Claude',
  },
  {
    id: '6',
    icon: Type,
    title: 'Content Rewrite for AI Readability',
    description: 'Restructure 8 pages with 40-60 word answer blocks',
    roiScore: 82,
    effortHours: 4.0,
    scoreGain: 14,
    priority: 'high',
    category: 'big-impact',
    engine: 'ChatGPT',
  },
  {
    id: '7',
    icon: Image,
    title: 'Add Structured Data to All Pages',
    description: 'Schema.org markup across 12 pages',
    roiScore: 72,
    effortHours: 2.5,
    scoreGain: 9,
    priority: 'medium',
    category: 'big-impact',
    engine: 'Gemini',
  },
  {
    id: '8',
    icon: BarChart3,
    title: 'Build Citation Authority Network',
    description: 'Cross-linking strategy for AI source trust',
    roiScore: 68,
    effortHours: 3.2,
    scoreGain: 7,
    priority: 'medium',
    category: 'big-impact',
    engine: 'Perplexity',
  },
]

function ROIBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : score >= 75
        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        : score >= 60
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-white/10 text-muted-foreground border-white/20'

  return (
    <Badge className={`${color} font-mono font-bold text-xs px-2`}>
      <Star className="w-3 h-3 mr-0.5" />
      {score} ROI
    </Badge>
  )
}

function PriorityIndicator({ priority }: { priority: QueueItem['priority'] }) {
  const config = {
    critical: { color: 'bg-rose-500', label: 'Critical', textColor: 'text-rose-400' },
    high: { color: 'bg-amber-500', label: 'High', textColor: 'text-amber-400' },
    medium: { color: 'bg-cyan-500', label: 'Medium', textColor: 'text-cyan-400' },
    low: { color: 'bg-white/30', label: 'Low', textColor: 'text-muted-foreground' },
  }
  const c = config[priority]
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${c.color}`} />
      <span className={`text-xs font-medium ${c.textColor}`}>{c.label}</span>
    </div>
  )
}

function QueueItemRow({ item, index, isInView }: { item: QueueItem; index: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.4 + index * 0.06 }}
    >
      <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Rank number */}
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
              {index + 1}
            </div>

            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium truncate">{item.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground truncate">{item.description}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 shrink-0">
              <ROIBadge score={item.roiScore} />
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {item.effortHours}h
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <TrendingUp className="w-3 h-3" />
                +{item.scoreGain}
              </div>
              <PriorityIndicator priority={item.priority} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface AIOpportunityQueueProps {
  onStartFree?: () => void
}

export default function AIOpportunityQueue({ onStartFree }: AIOpportunityQueueProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const quickWins = queueItems.filter((i) => i.category === 'quick-win')
  const bigImpact = queueItems.filter((i) => i.category === 'big-impact')

  const totalScoreGain = queueItems.reduce((sum, i) => sum + i.scoreGain, 0)
  const totalEffort = queueItems.reduce((sum, i) => sum + i.effortHours, 0)
  const quickWinCount = quickWins.length

  return (
    <section className="py-24 relative" ref={ref} id="ai-opportunity-queue">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-amber-500/50 text-amber-400 bg-amber-500/10 backdrop-blur-sm mb-6"
          >
            <Target className="w-3.5 h-3.5" />
            ROI Opportunity Queue™
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Actions Ranked by{' '}
            <span className="bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              ROI
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stop guessing what to do first. Every action is scored by return on investment — so you always work on what matters most.
          </p>
        </motion.div>

        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-8 p-4 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-muted-foreground">Potential:</span>
            <span className="text-lg font-bold text-emerald-400">+{totalScoreGain} points</span>
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-muted-foreground">Est. effort:</span>
            <span className="text-lg font-bold text-cyan-400">{totalEffort.toFixed(1)} hours</span>
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-muted-foreground">Quick wins:</span>
            <span className="text-lg font-bold text-amber-400">{quickWinCount}</span>
          </div>
        </motion.div>

        {/* Tabs: Quick Wins / Big Impact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="quick-wins" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger
                  value="quick-wins"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  Quick Wins
                  <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                    {quickWins.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="big-impact"
                  className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  Big Impact
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                    {bigImpact.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="quick-wins">
              <div className="space-y-3">
                {quickWins.map((item, i) => (
                  <QueueItemRow key={item.id} item={item} index={i} isInView={isInView} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="big-impact">
              <div className="space-y-3">
                {bigImpact.map((item, i) => (
                  <QueueItemRow key={item.id} item={item} index={i} isInView={isInView} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 transition-all duration-300"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            View Your Queue
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
