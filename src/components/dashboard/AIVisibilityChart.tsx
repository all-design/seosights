'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useAppStore } from '@/lib/store'

// ── Generate realistic demo data for AI Visibility ────────────
interface VisibilityDataRow {
  day: string
  yourSite: number
  chatgpt: number
  perplexity: number
  competitor1: number
  competitor2: number
}

function generateVisibilityData(): VisibilityDataRow[] {
  const days = 30
  const data: VisibilityDataRow[] = []
  let yourSite = 8
  let competitor1 = 22
  let competitor2 = 15

  for (let i = 1; i <= days; i++) {
    yourSite = Math.min(100, Math.max(0, yourSite + (Math.random() - 0.35) * 3))
    competitor1 = Math.min(100, Math.max(0, competitor1 + (Math.random() - 0.48) * 2))
    competitor2 = Math.min(100, Math.max(0, competitor2 + (Math.random() - 0.45) * 2.5))

    data.push({
      day: `Jun ${i}`,
      yourSite: Math.round(yourSite * 10) / 10,
      chatgpt: Math.round((yourSite * 0.8 + Math.random() * 5) * 10) / 10,
      perplexity: Math.round((yourSite * 1.1 + Math.random() * 3) * 10) / 10,
      competitor1: Math.round(competitor1 * 10) / 10,
      competitor2: Math.round(competitor2 * 10) / 10,
    })
  }
  return data
}

// ── Chart Config ──────────────────────────────────────────────
const chartConfig: ChartConfig = {
  yourSite: {
    label: 'Your Site',
    color: '#a855f7',
  },
  competitor1: {
    label: 'Competitor 1',
    color: 'rgba(148, 163, 184, 0.5)',
  },
  competitor2: {
    label: 'Competitor 2',
    color: 'rgba(148, 163, 184, 0.3)',
  },
  chatgpt: {
    label: 'ChatGPT Only',
    color: '#10b981',
  },
  perplexity: {
    label: 'Perplexity Only',
    color: '#06b6d4',
  },
}

type FilterKey = 'all' | 'chatgpt' | 'perplexity'

// ── Main Component ────────────────────────────────────────────
export default function AIVisibilityChart() {
  const { analysis } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const rawData = useMemo(() => generateVisibilityData(), [])

  // Filter data based on selected AI engine
  const chartData = useMemo(() => {
    return rawData.map((d) => {
      const row: Record<string, string | number> = {
        day: d.day,
        yourSite: d.yourSite,
      }
      if (activeFilter === 'all') {
        row.competitor1 = d.competitor1
        row.competitor2 = d.competitor2
      }
      if (activeFilter === 'chatgpt') row.chatgpt = d.chatgpt
      if (activeFilter === 'perplexity') row.perplexity = d.perplexity
      return row
    })
  }, [rawData, activeFilter])

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All 17+ AI Engines' },
    { key: 'chatgpt', label: 'ChatGPT' },
    { key: 'perplexity', label: 'Perplexity' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="pt-6 pb-4 px-4 sm:px-6">
          {/* Header + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                AI Search Visibility
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI Citation Share over time — how often AI engines cite your site
              </p>
            </div>

            {/* Interactive Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    activeFilter === f.key
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart */}
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillYourSite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillCompetitor1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(148,163,184,0.5)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="rgba(148,163,184,0.5)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillCompetitor2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(148,163,184,0.3)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="rgba(148,163,184,0.3)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillChatgpt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillPerplexity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                interval={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 50]}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />

              {/* Your site — always shown */}
              <Area
                type="monotone"
                dataKey="yourSite"
                stroke="#a855f7"
                strokeWidth={2.5}
                fill="url(#fillYourSite)"
              />

              {/* Conditional areas based on filter */}
              {activeFilter === 'all' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="competitor1"
                    stroke="rgba(148,163,184,0.5)"
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    fill="url(#fillCompetitor1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="competitor2"
                    stroke="rgba(148,163,184,0.3)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#fillCompetitor2)"
                  />
                </>
              )}
              {activeFilter === 'chatgpt' && (
                <Area
                  type="monotone"
                  dataKey="chatgpt"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#fillChatgpt)"
                />
              )}
              {activeFilter === 'perplexity' && (
                <Area
                  type="monotone"
                  dataKey="perplexity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#fillPerplexity)"
                />
              )}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
