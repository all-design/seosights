'use client'

/**
 * Content Lab — A/B testing and Self-Optimizing Blog
 *
 * Active experiments, completed experiments, create experiment form, and self-optimizing stats.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FlaskConical,
  Trophy,
  Plus,
  Clock,
  TrendingUp,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

interface ActiveExperiment {
  id: string
  keyword: string
  versionA: { title: string; score: number }
  versionB: { title: string; score: number }
  daysRemaining: number
  totalDays: number
}

interface CompletedExperiment {
  id: string
  keyword: string
  versionA: { title: string; score: number }
  versionB: { title: string; score: number }
  winner: 'A' | 'B'
  autoPromoted: boolean
  improvement: number
}

interface RewriteStat {
  id: string
  title: string
  beforeScore: number
  afterScore: number
  improvement: number
}

interface LabData {
  activeExperiments: ActiveExperiment[]
  completedExperiments: CompletedExperiment[]
  rewriteStats: RewriteStat[]
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK: LabData = {
  activeExperiments: [
    {
      id: '1',
      keyword: 'AI Visibility Guide',
      versionA: { title: 'Complete Guide to AI Visibility in 2025', score: 72 },
      versionB: { title: 'AI Visibility: How to Get Found by ChatGPT & Claude', score: 78 },
      daysRemaining: 3,
      totalDays: 7,
    },
    {
      id: '2',
      keyword: 'LLM SEO Strategy',
      versionA: { title: 'LLM SEO: The Definitive Strategy Guide', score: 65 },
      versionB: { title: 'How to Optimize for LLM Search (Step-by-Step)', score: 71 },
      daysRemaining: 5,
      totalDays: 7,
    },
    {
      id: '3',
      keyword: 'Citation Building',
      versionA: { title: 'Citation Building for AI Search Engines', score: 59 },
      versionB: { title: 'Build Citations That ChatGPT Trusts', score: 63 },
      daysRemaining: 2,
      totalDays: 7,
    },
  ],
  completedExperiments: [
    {
      id: '4',
      keyword: 'GEO Optimization',
      versionA: { title: 'GEO Optimization Strategies', score: 55 },
      versionB: { title: 'GEO Optimization: Get Ranked by Every AI', score: 63 },
      winner: 'B',
      autoPromoted: true,
      improvement: 8,
    },
    {
      id: '5',
      keyword: 'AEO Best Practices',
      versionA: { title: 'AEO Best Practices for 2025', score: 61 },
      versionB: { title: 'Answer Engine Optimization That Works', score: 68 },
      winner: 'B',
      autoPromoted: true,
      improvement: 7,
    },
    {
      id: '6',
      keyword: 'Schema Markup',
      versionA: { title: 'Schema Markup for AI Visibility', score: 70 },
      versionB: { title: 'Schema Markup: The Secret to AI Citations', score: 66 },
      winner: 'A',
      autoPromoted: false,
      improvement: 4,
    },
  ],
  rewriteStats: [
    { id: '1', title: 'AI Visibility for Hotels', beforeScore: 59, afterScore: 73, improvement: 14 },
    { id: '2', title: 'GEO vs AEO Comparison', beforeScore: 58, afterScore: 69, improvement: 11 },
    { id: '3', title: 'How to Build Citations', beforeScore: 55, afterScore: 64, improvement: 9 },
    { id: '4', title: 'LLM SEO Beginner Guide', beforeScore: 48, afterScore: 61, improvement: 13 },
  ],
}

// ── Animation ───────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ───────────────────────────────────────────────────────────

export default function ContentLab() {
  const [data, setData] = useState<LabData | null>(null)
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState<string | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [newVersionA, setNewVersionA] = useState('')
  const [newVersionB, setNewVersionB] = useState('')
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client-zero/content-engine/experiments')
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(FALLBACK)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handlePromote = async (experimentId: string) => {
    setPromoting(experimentId)
    try {
      await fetch('/api/client-zero/content-engine/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId, action: 'promote' }),
      })
    } catch {
      // silent
    }
    setTimeout(() => setPromoting(null), 1500)
  }

  const handleCreateExperiment = async () => {
    if (!newKeyword || !newVersionA || !newVersionB) return
    setCreating(true)
    try {
      await fetch('/api/client-zero/content-engine/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          keyword: newKeyword,
          versionA: newVersionA,
          versionB: newVersionB,
        }),
      })
    } catch {
      // silent
    }
    setTimeout(() => {
      setCreating(false)
      setDialogOpen(false)
      setNewKeyword('')
      setNewVersionA('')
      setNewVersionB('')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
            <CardContent className="p-6 h-48" />
          </Card>
        ))}
      </div>
    )
  }

  const { activeExperiments, completedExperiments, rewriteStats } = data || FALLBACK

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Content Lab</h3>
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
            {activeExperiments.length} active
          </Badge>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Create A/B Experiment</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Keyword</label>
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., AI Visibility for Dentists"
                  className="bg-background border-white/10"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Version A Title</label>
                <Input
                  value={newVersionA}
                  onChange={(e) => setNewVersionA(e.target.value)}
                  placeholder="e.g., Complete Guide to AI Visibility"
                  className="bg-background border-white/10"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Version B Title</label>
                <Input
                  value={newVersionB}
                  onChange={(e) => setNewVersionB(e.target.value)}
                  placeholder="e.g., AI Visibility: Get Found by ChatGPT"
                  className="bg-background border-white/10"
                />
              </div>
              <Button
                onClick={handleCreateExperiment}
                disabled={creating || !newKeyword || !newVersionA || !newVersionB}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FlaskConical className="h-4 w-4 mr-2" />}
                Create Experiment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ── Active Experiments ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold">Active Experiments</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeExperiments.map((exp) => {
            const progressPercent = Math.round(((exp.totalDays - exp.daysRemaining) / exp.totalDays) * 100)
            const aLeading = exp.versionA.score >= exp.versionB.score
            return (
              <Card key={exp.id} className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-amber-500/30 transition-colors">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                      {exp.keyword}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{exp.daysRemaining}d left</span>
                    </div>
                  </div>

                  {/* Version A */}
                  <div className={`rounded-md border p-2.5 ${aLeading ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">Version A</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{exp.versionA.score}</span>
                    </div>
                    <p className="text-[11px] leading-tight">{exp.versionA.title}</p>
                    <Progress value={exp.versionA.score} className="h-1 mt-1.5" />
                  </div>

                  {/* Version B */}
                  <div className={`rounded-md border p-2.5 ${!aLeading ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">Version B</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{exp.versionB.score}</span>
                    </div>
                    <p className="text-[11px] leading-tight">{exp.versionB.title}</p>
                    <Progress value={exp.versionB.score} className="h-1 mt-1.5" />
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercent} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* ── Completed Experiments ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold">Completed Experiments</span>
        </div>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <ScrollArea className="max-h-64">
              <div className="flex flex-col gap-2">
                {completedExperiments.map((exp) => {
                  const winnerData = exp.winner === 'A' ? exp.versionA : exp.versionB
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 p-3 hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground shrink-0">
                            {exp.keyword}
                          </Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] shrink-0">
                            <Trophy className="h-2.5 w-2.5 mr-0.5" />
                            {exp.winner} won
                          </Badge>
                          {exp.autoPromoted && (
                            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[9px] shrink-0">
                              Auto-promoted
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          &quot;{winnerData.title}&quot; → +{exp.improvement} AI Visibility
                        </p>
                      </div>
                      {!exp.autoPromoted && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0 ml-2"
                          onClick={() => handlePromote(exp.id)}
                          disabled={promoting === exp.id}
                        >
                          {promoting === exp.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          Promote
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Self-Optimizing Stats ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold">Self-Optimizing Stats</span>
          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
            Auto-rewritten articles
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rewriteStats.map((stat) => (
            <Card key={stat.id} className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-cyan-500/30 transition-colors">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2 leading-tight">{stat.title}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-muted-foreground">{stat.beforeScore}</span>
                  <ArrowRight className="h-3 w-3 text-cyan-400" />
                  <span className="text-sm font-mono text-emerald-400">{stat.afterScore}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] ml-auto">
                    +{stat.improvement}
                  </Badge>
                </div>
                <Progress value={(stat.afterScore / 100) * 100} className="h-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
