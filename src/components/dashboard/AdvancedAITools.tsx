'use client'

import { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Target,
  Swords,
  Network,
  FileText,
  Radar,
  Wrench,
  Sparkles,
} from 'lucide-react'

import PromptRankTracker from './PromptRankTracker'
import CompetitorCitationGap from './CompetitorCitationGap'
import EntityGraphBuilder from './EntityGraphBuilder'
import AIContentSimulator from './AIContentSimulator'
import AICrawlLogs from './AICrawlLogs'
import OneClickFix from './OneClickFix'

interface AdvancedAIToolsProps {
  url?: string
}

const tabs = [
  {
    key: 'prompt-rank',
    label: 'Prompt Rank',
    icon: Target,
    color: 'purple',
    description: 'Track how AI models rank your brand',
    badge: 'New',
  },
  {
    key: 'competitor-gap',
    label: 'Competitor Gap',
    icon: Swords,
    color: 'amber',
    description: 'See who AI cites more — you or competitors',
    badge: 'New',
  },
  {
    key: 'entity-graph',
    label: 'Entity Graph',
    icon: Network,
    color: 'cyan',
    description: 'Visualize brand-entity associations',
    badge: 'New',
  },
  {
    key: 'content-simulator',
    label: 'Content Simulator',
    icon: FileText,
    color: 'emerald',
    description: 'Preview how AI reads your content',
    badge: 'New',
  },
  {
    key: 'crawl-logs',
    label: 'Crawl Logs',
    icon: Radar,
    color: 'rose',
    description: 'AI bot visits to your site',
    badge: 'New',
  },
  {
    key: 'one-click-fix',
    label: 'One-Click Fix',
    icon: Wrench,
    color: 'emerald',
    description: 'Auto-fix technical AI search issues',
    badge: 'New',
  },
]

const colorMap: Record<string, { text: string; border: string; bg: string; activeBg: string }> = {
  purple: {
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    activeBg: 'data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:border-purple-400/50',
  },
  amber: {
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    activeBg: 'data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-amber-400/50',
  },
  cyan: {
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    activeBg: 'data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-400/50',
  },
  emerald: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    activeBg: 'data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-400/50',
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    activeBg: 'data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-300 data-[state=active]:border-rose-400/50',
  },
}

export default function AdvancedAITools({ url }: AdvancedAIToolsProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [activeTab, setActiveTab] = useState('prompt-rank')

  const activeTabData = tabs.find((t) => t.key === activeTab) || tabs[0]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <Card className="bg-gradient-to-br from-purple-500/5 via-background to-amber-500/5 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                Advanced AI Tools
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold border-amber-500/40 text-amber-400 bg-amber-500/10"
                >
                  New
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">
                Six specialized tools for deep AI search optimization
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-1 border border-white/10 rounded-xl mb-5">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const colors = colorMap[tab.color]
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-white/5 transition-all ${colors.activeBg}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Active tab description */}
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <activeTabData.icon className={`w-3.5 h-3.5 ${colorMap[activeTabData.color].text}`} />
              <span>{activeTabData.description}</span>
            </div>

            {/* Tab content with AnimatePresence for smooth transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="prompt-rank" className="mt-0 focus-visible:outline-none">
                  <PromptRankTracker url={url} />
                </TabsContent>
                <TabsContent value="competitor-gap" className="mt-0 focus-visible:outline-none">
                  <CompetitorCitationGap url={url} />
                </TabsContent>
                <TabsContent value="entity-graph" className="mt-0 focus-visible:outline-none">
                  <EntityGraphBuilder url={url} />
                </TabsContent>
                <TabsContent value="content-simulator" className="mt-0 focus-visible:outline-none">
                  <AIContentSimulator url={url} />
                </TabsContent>
                <TabsContent value="crawl-logs" className="mt-0 focus-visible:outline-none">
                  <AICrawlLogs url={url} />
                </TabsContent>
                <TabsContent value="one-click-fix" className="mt-0 focus-visible:outline-none">
                  <OneClickFix url={url} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
