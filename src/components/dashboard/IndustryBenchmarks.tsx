'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Benchmark {
  id: string
  industry: string
  industryLabel: string
  avgAIVisibility: number
  avgTrust: number
  avgFreshness: number
  avgAuthority: number
  sampleSize: number
}

interface BenchmarksResponse {
  industries: Benchmark[]
  _meta: { status: string }
}

function ScoreBar({ value, max = 100, color = 'emerald' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
  }
  return (
    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${colorMap[color] || colorMap.emerald}`}
      />
    </div>
  )
}

function getScoreVerdict(score: number) {
  if (score >= 70) return { label: 'High', color: 'text-emerald-400', icon: ArrowUp }
  if (score >= 45) return { label: 'Medium', color: 'text-amber-400', icon: Minus }
  return { label: 'Low', color: 'text-red-400', icon: ArrowDown }
}

export default function IndustryBenchmarks({ userScore, userIndustry }: { userScore?: number; userIndustry?: string }) {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState('simulation')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ai/benchmarks')
        const data: BenchmarksResponse = await res.json()
        setBenchmarks(data.industries || [])
        setDataSource(data._meta?.status || 'simulation')
      } catch { /* empty */ } finally { setLoading(false) }
    }
    load()
  }, [])

  const sorted = [...benchmarks].sort((a, b) => b.avgAIVisibility - a.avgAIVisibility)

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="text-lg">Industry Benchmarks</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded bg-muted/30 animate-pulse" />)}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-lg">Industry Benchmarks</CardTitle>
        </div>
        <Badge variant="outline" className={dataSource === 'live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
          {dataSource === 'live' ? '● Live' : dataSource === 'estimated' ? '◐ Estimated' : '○ Simulation'}
        </Badge>
      </CardHeader>
      <CardContent>
        {userScore !== undefined && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs text-muted-foreground mb-1">Your AI Visibility Score</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-400">{userScore}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              {userIndustry && (() => {
                const industryBench = benchmarks.find(b => b.industry === userIndustry)
                if (!industryBench) return null
                const diff = userScore - industryBench.avgAIVisibility
                return (
                  <Badge variant="outline" className={diff >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                    {diff >= 0 ? '+' : ''}{diff} vs industry avg
                  </Badge>
                )
              })()}
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {sorted.map((bench, i) => {
              const verdict = getScoreVerdict(bench.avgAIVisibility)
              const VerdictIcon = verdict.icon
              const isUserIndustry = bench.industry === userIndustry
              return (
                <motion.div
                  key={bench.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${isUserIndustry ? 'bg-emerald-500/5 border border-emerald-500/20' : 'hover:bg-muted/30'} transition-colors`}
                >
                  <div className="w-28 sm:w-36 shrink-0">
                    <span className={`text-sm font-medium ${isUserIndustry ? 'text-emerald-400' : 'text-foreground'}`}>{bench.industryLabel}</span>
                  </div>
                  <div className="flex-1">
                    <ScoreBar value={bench.avgAIVisibility} color={bench.avgAIVisibility >= 60 ? 'emerald' : bench.avgAIVisibility >= 40 ? 'amber' : 'red'} />
                  </div>
                  <div className="flex items-center gap-1.5 w-14 shrink-0 justify-end">
                    <VerdictIcon className={`h-3 w-3 ${verdict.color}`} />
                    <span className="text-sm font-bold text-foreground">{bench.avgAIVisibility}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
