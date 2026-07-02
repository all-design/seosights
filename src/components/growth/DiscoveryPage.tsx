'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Radio,
  Clock,
  Globe,
  TrendingUp,
  Bot,
  BarChart3,
  FileSearch,
  RefreshCw,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────

type SourceType = 'observatory' | 'gsc' | 'trends' | 'ai-models' | 'competitor' | 'entity'

interface DiscoveryItem {
  id: number
  title: string
  source: SourceType
  type: string
  discoveredAt: string
  isRecent: boolean
}

// ── Mock Data ──────────────────────────────────────────────────────────

const sourceConfig: Record<SourceType, { label: string; color: string; icon: React.ElementType }> = {
  observatory: { label: 'Observatory', color: '#34d399', icon: Radio },
  gsc: { label: 'GSC', color: '#22d3ee', icon: BarChart3 },
  trends: { label: 'Trends', color: '#a78bfa', icon: TrendingUp },
  'ai-models': { label: 'AI Models', color: '#fb923c', icon: Bot },
  competitor: { label: 'Competitor', color: '#f472b6', icon: Globe },
  entity: { label: 'Entity', color: '#fbbf24', icon: FileSearch },
}

const sourceBreakdown = [
  { source: 'observatory' as SourceType, count: 89 },
  { source: 'gsc' as SourceType, count: 45 },
  { source: 'trends' as SourceType, count: 32 },
  { source: 'ai-models' as SourceType, count: 28 },
  { source: 'competitor' as SourceType, count: 24 },
  { source: 'entity' as SourceType, count: 20 },
]

const discoveryFeed: DiscoveryItem[] = [
  { id: 1, title: 'LLM Citation Pattern Shift — GPT-4o favoring entity-rich content', source: 'ai-models', type: 'Citation Shift', discoveredAt: '2 min ago', isRecent: true },
  { id: 2, title: 'Competitor launched "AI SEO Audit" tool page', source: 'competitor', type: 'Competitor Move', discoveredAt: '3 min ago', isRecent: true },
  { id: 3, title: 'New keyword cluster: "semantic search optimization"', source: 'observatory', type: 'Keyword Cluster', discoveredAt: '4 min ago', isRecent: true },
  { id: 4, title: 'Google Search Console: 15 queries gained positions', source: 'gsc', type: 'Rank Change', discoveredAt: '8 min ago', isRecent: false },
  { id: 5, title: 'Trending: "RAG architecture" +340% search volume', source: 'trends', type: 'Trend Spike', discoveredAt: '12 min ago', isRecent: false },
  { id: 6, title: 'New entity: "Vector Database" appearing in 12 AI responses', source: 'entity', type: 'Entity Signal', discoveredAt: '15 min ago', isRecent: false },
  { id: 7, title: 'Competitor acquired backlink from TechCrunch', source: 'competitor', type: 'Backlink Alert', discoveredAt: '18 min ago', isRecent: false },
  { id: 8, title: 'Observatory: "AI visibility score" dropping for 3 pages', source: 'observatory', type: 'Visibility Drop', discoveredAt: '22 min ago', isRecent: false },
  { id: 9, title: 'Gemini now citing Wikipedia + Schema-rich pages more', source: 'ai-models', type: 'Citation Pattern', discoveredAt: '28 min ago', isRecent: false },
  { id: 10, title: 'GSC: "knowledge graph optimization" impression +120%', source: 'gsc', type: 'Impression Spike', discoveredAt: '35 min ago', isRecent: false },
  { id: 11, title: 'Trending: "embedding model comparison" rising steadily', source: 'trends', type: 'Trend Signal', discoveredAt: '42 min ago', isRecent: false },
  { id: 12, title: 'New entity relationship: "LLM" ↔ "Fine-tuning" cluster', source: 'entity', type: 'Entity Link', discoveredAt: '50 min ago', isRecent: false },
  { id: 13, title: 'Competitor published "RAG vs Fine-tuning" comparison', source: 'competitor', type: 'Content Alert', discoveredAt: '1h ago', isRecent: false },
  { id: 14, title: 'Observatory detected 8 new AI answer boxes for target keywords', source: 'observatory', type: 'AI Overview', discoveredAt: '1.2h ago', isRecent: false },
  { id: 15, title: 'Claude citations now favoring long-form research content', source: 'ai-models', type: 'Model Update', discoveredAt: '1.5h ago', isRecent: false },
]

// Donut chart data
const donutData = sourceBreakdown.map((s) => ({
  name: sourceConfig[s.source].label,
  value: s.count,
  fill: sourceConfig[s.source].color,
}))

const donutChartConfig = {
  value: { label: 'Opportunities' },
  Observatory: { label: 'Observatory', color: '#34d399' },
  GSC: { label: 'GSC', color: '#22d3ee' },
  Trends: { label: 'Trends', color: '#a78bfa' },
  'AI Models': { label: 'AI Models', color: '#fb923c' },
  Competitor: { label: 'Competitor', color: '#f472b6' },
  Entity: { label: 'Entity', color: '#fbbf24' },
} satisfies ChartConfig

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ──────────────────────────────────────────────────────────

export function DiscoveryPage() {
  const [lastRefresh, setLastRefresh] = useState<string>('Just now')
  const [pulseActive, setPulseActive] = useState(true)

  // Simulate auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh('Just now')
      setPulseActive(true)
      setTimeout(() => setPulseActive(false), 3000)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header Stats ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />

          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-zinc-100 tracking-tight">238</span>
                  <span className="text-sm text-zinc-500">new opportunities</span>
                </div>
                <p className="text-xs text-zinc-600">Discovered in the last 2 hours</p>
              </div>
            </div>

            {/* Source breakdown pills */}
            <div className="flex flex-wrap gap-2">
              {sourceBreakdown.map((s) => {
                const config = sourceConfig[s.source]
                const Icon = config.icon
                return (
                  <motion.button
                    key={s.source}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      backgroundColor: `${config.color}10`,
                      borderColor: `${config.color}30`,
                      color: config.color,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                    <span className="font-semibold">{s.count}</span>
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Discovery Feed + Source Distribution Row ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Discovery Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-sm text-zinc-400 font-medium">
                    Live Discovery Feed
                  </CardTitle>
                </div>
                {/* Auto-refresh indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/40">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={pulseActive ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[10px] text-zinc-400">Auto-refreshing every 2h</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    {lastRefresh}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ScrollArea className="h-[380px]">
                <div className="space-y-1 px-2">
                  <AnimatePresence>
                    {discoveryFeed.map((item, idx) => {
                      const config = sourceConfig[item.source]
                      const Icon = config.icon
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className="group flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors relative"
                        >
                          {/* Pulse indicator for recent items */}
                          {item.isRecent && (
                            <motion.div
                              className="absolute left-1 top-3 w-2 h-2 rounded-full"
                              style={{ backgroundColor: config.color }}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}

                          {/* Source icon */}
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                            style={{ backgroundColor: `${config.color}15` }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-200 leading-relaxed group-hover:text-zinc-100 transition-colors">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 border"
                                style={{
                                  backgroundColor: `${config.color}10`,
                                  borderColor: `${config.color}25`,
                                  color: config.color,
                                }}
                              >
                                {config.label}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 border-zinc-700/50 text-zinc-500 bg-zinc-800/40"
                              >
                                {item.type}
                              </Badge>
                              <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {item.discoveredAt}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Source Distribution Donut */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">
                  Source Distribution
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={donutChartConfig} className="h-[200px] w-full aspect-square">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              {/* Legend below chart */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {sourceBreakdown.map((s) => {
                  const config = sourceConfig[s.source]
                  return (
                    <div key={s.source} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-[11px] text-zinc-400 truncate">{config.label}</span>
                      <span className="text-[11px] text-zinc-600 font-medium ml-auto">{s.count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
