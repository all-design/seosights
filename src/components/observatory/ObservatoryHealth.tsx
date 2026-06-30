'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Database,
  Globe,
  Zap,
  Sparkles,
  FileText,
  BookOpen,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface HealthData {
  collectedToday: number
  uniqueDomains: number
  citationChanges: number
  newEntities: number
  newReports: number
  researchCitations: number
  date: string
}

// ── Preview / Fallback Data ──────────────────────────────────

const PREVIEW_DATA: HealthData = {
  collectedToday: 41283,
  uniqueDomains: 18402,
  citationChanges: 418,
  newEntities: 72,
  newReports: 3,
  researchCitations: 127,
  date: new Date().toISOString(),
}

// ── Metric Card Config ────────────────────────────────────────

const METRICS = [
  { key: 'collectedToday' as const, label: 'Collected Today', suffix: 'prompts', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20' },
  { key: 'uniqueDomains' as const, label: 'Unique Domains', suffix: '', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/20' },
  { key: 'citationChanges' as const, label: 'Citation Changes', suffix: '', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20' },
  { key: 'newEntities' as const, label: 'New Entities', suffix: '', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500/20' },
  { key: 'newReports' as const, label: 'New Reports', suffix: '', icon: FileText, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20', iconBg: 'bg-slate-500/20' },
]

function formatNumber(n: number): string {
  return n.toLocaleString()
}

// ── Loading Skeleton ─────────────────────────────────────────

function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-52 bg-slate-800" />
        <Skeleton className="h-6 w-24 bg-slate-800 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 bg-slate-800 mb-2" />
              <Skeleton className="h-8 w-20 bg-slate-800 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-32 w-full bg-slate-800 rounded-xl" />
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────

export default function ObservatoryHealth() {
  const [data, setData] = useState<HealthData | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/observatory/health')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setData(json)
        setIsPreview(false)
      } catch {
        setData(PREVIEW_DATA)
        setIsPreview(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8">
        <HealthSkeleton />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-emerald-400" />
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Observatory Health
          </motion.h2>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
            Live Metrics
          </Badge>
          {isPreview && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
              Preview
            </Badge>
          )}
        </div>
      </div>

      {/* ── 5 Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {METRICS.map((m, idx) => {
          const Icon = m.icon
          const value = data[m.key]
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
            >
              <Card className={`bg-slate-900/50 border-slate-800 hover:${m.border} transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md ${m.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                    </div>
                    <span className="text-slate-400 text-xs font-medium">{m.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white">{formatNumber(value)}</span>
                    {m.suffix && <span className="text-slate-500 text-sm">{m.suffix}</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Research Citations This Month ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">This Month</span>
            </div>
            <motion.div
              className="text-6xl sm:text-8xl font-bold text-emerald-400 tracking-tight"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            >
              {data.researchCitations}
            </motion.div>
            <p className="text-slate-400 text-base sm:text-lg mt-2">Research Citations</p>
            <p className="text-slate-600 text-xs mt-1 max-w-md mx-auto">
              Not visitors. Not articles. Citations — the metric that matters.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
