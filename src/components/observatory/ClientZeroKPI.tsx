'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Quote,
  Sparkles,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface PipelineStep {
  stage: string
  count: number
  icon: React.ElementType
  color: string
  bg: string
  border: string
}

interface ClientZeroData {
  domain: string
  pipeline: PipelineStep[]
  totalArticles: number
  totalCitations: number
  totalRecommendations: number
  totalPipeline: number
  estimatedRevenue: number
  lastUpdated: string
}

// ── Fallback Data ─────────────────────────────────────────────

const FALLBACK: ClientZeroData = {
  domain: 'seosights.com',
  pipeline: [
    { stage: 'Articles', count: 47, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { stage: 'Citations', count: 23, icon: Quote, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { stage: 'Recommendations', count: 12, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { stage: 'Pipeline', count: 8, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { stage: 'Revenue', count: 3, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ],
  totalArticles: 47,
  totalCitations: 23,
  totalRecommendations: 12,
  totalPipeline: 8,
  estimatedRevenue: 3,
  lastUpdated: new Date().toISOString(),
}

// ── Loading Skeleton ─────────────────────────────────────────

function KPISkeleton() {
  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-6 w-20 bg-slate-800 rounded-full" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="h-12 w-12 bg-slate-800 rounded-full" />
            <Skeleton className="h-6 w-16 bg-slate-800" />
            <Skeleton className="h-4 w-20 bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ClientZeroKPI() {
  const [data, setData] = useState<ClientZeroData | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/observatory/client-zero?domain=seosights.com')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)

        // API returns pipeline as object — map to our array format
        const p = json.pipeline || {}
        const mapped: ClientZeroData = {
          domain: json.domain || 'seosights.com',
          pipeline: [
            { stage: 'Articles', count: p.articles || 0, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { stage: 'Citations', count: p.citations || 0, icon: Quote, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { stage: 'Recommendations', count: p.recommendations || 0, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { stage: 'Pipeline', count: p.pipelineValue || 0, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { stage: 'Revenue', count: p.revenue || 0, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          ],
          totalArticles: p.articles || 0,
          totalCitations: p.citations || 0,
          totalRecommendations: p.recommendations || 0,
          totalPipeline: p.pipelineValue || 0,
          estimatedRevenue: p.revenue || 0,
          lastUpdated: new Date().toISOString(),
        }
        setData(mapped)
        setIsFallback(false)
      } catch {
        setData(FALLBACK)
        setIsFallback(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <KPISkeleton />
  if (!data) return null

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Client Zero KPI
          </motion.h2>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
            SeoSights
          </Badge>
          {isFallback && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
              Preview
            </Badge>
          )}
        </div>
        <p className="text-slate-500 text-xs">
          One line. One idea: Articles → Citations → Recommendations → Pipeline → Revenue
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
        {data.pipeline.map((step, idx) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.stage}
              className="flex items-center gap-2 sm:gap-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.12 }}
            >
              {/* Step Card */}
              <Card className={`bg-slate-900/50 ${step.border} min-w-[120px]`}>
                <CardContent className="p-4 text-center">
                  <div className={`mx-auto mb-2 p-2 rounded-lg ${step.bg} w-fit`}>
                    <Icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                  <div className={`text-2xl font-bold ${step.color}`}>{step.count}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-wider mt-1">{step.stage}</div>
                </CardContent>
              </Card>

              {/* Arrow */}
              {idx < data.pipeline.length - 1 && (
                <motion.div
                  className="hidden sm:flex items-center px-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.12 }}
                >
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Bottom note */}
      <motion.p
        className="text-center text-slate-600 text-xs max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        SeoSights must grow exclusively through SeoSights. Content Engine decides — publish, rewrite, FAQ, schema, internal links — zero manual intervention.
      </motion.p>
    </div>
  )
}
