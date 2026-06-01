'use client'

import { motion } from 'framer-motion'
import { useAppStore, SEOAnalysis } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ExternalLink,
  Target,
  Link2,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Search,
  BarChart3,
  Map,
} from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function ScoreRing({ score, label, icon: Icon, color }: { score: number; label: string; icon: React.ElementType; color: string }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/5" />
          <circle
            cx="48" cy="48" r="40"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        {label}
      </div>
    </div>
  )
}

export default function AnalysisDashboard({ onStartFree }: { onStartFree?: () => void }) {
  const { analysis, reset } = useAppStore()
  const data = analysis as SEOAnalysis | null

  if (!data) return null

  const scoreColor = (s: number) =>
    s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Agent <span className="text-emerald-400">OS</span>
            </span>
            <Separator />
            <span className="text-sm text-muted-foreground hidden sm:block">{data.siteName || data.url}</span>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">

          {/* Executive Summary */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      SEO Analysis: <span className="text-emerald-400">{data.siteName}</span>
                    </h1>
                    <p className="text-muted-foreground leading-relaxed text-lg">{data.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Scores Section */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Performance Scores
            </h2>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                  <ScoreRing score={data.scores.overall} label="Overall" icon={Target} color={scoreColor(data.scores.overall)} />
                  <ScoreRing score={data.scores.aiCitationReadiness} label="AI Citations" icon={Brain} color={scoreColor(data.scores.aiCitationReadiness)} />
                  <ScoreRing score={data.scores.contentQuality} label="Content" icon={FileText} color={scoreColor(data.scores.contentQuality)} />
                  <ScoreRing score={data.scores.backlinkProfile} label="Backlinks" icon={Link2} color={scoreColor(data.scores.backlinkProfile)} />
                  <ScoreRing score={data.scores.technicalSEO} label="Technical" icon={Shield} color={scoreColor(data.scores.technicalSEO)} />
                  <ScoreRing score={data.scores.keywordCoverage} label="Keywords" icon={Search} color={scoreColor(data.scores.keywordCoverage)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Citation Gap Audit */}
            <motion.div variants={item}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Citation Gap Audit
              </h2>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardContent className="p-6 space-y-5">
                  <p className="text-muted-foreground leading-relaxed">{data.citationGap.gapSummary}</p>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground/80 mb-3">Competitors AI Cites Instead of You</h3>
                    <div className="space-y-3">
                      {data.citationGap.competitors?.map((comp, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <ExternalLink className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{comp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{comp.url}</p>
                            <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/30 text-amber-400">
                              Cited by {comp.citedBy}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground/80 mb-3">3 Fixes to Close the Gap</h3>
                    <div className="space-y-2">
                      {data.citationGap.fixes?.map((fix, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">{fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Backlink Strategy */}
            <motion.div variants={item}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-400" />
                Backlink Strategy
              </h2>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 h-full">
                <CardContent className="p-6 space-y-5">
                  <p className="text-muted-foreground leading-relaxed">{data.backlinkStrategy.currentProfile}</p>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground/80 mb-3">Recommended Actions</h3>
                    <div className="space-y-3">
                      {data.backlinkStrategy.recommendedActions?.map((action, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{action.title}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                action.impact === 'high'
                                  ? 'border-emerald-500/30 text-emerald-400'
                                  : action.impact === 'medium'
                                  ? 'border-amber-500/30 text-amber-400'
                                  : 'border-white/20 text-muted-foreground'
                              }`}
                            >
                              {action.impact} impact
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground/80 mb-3">Linkable Assets to Create</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.backlinkStrategy.linkableAssets?.map((asset, i) => (
                        <Badge key={i} variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                          {asset}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Keywords Section */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              Keyword Opportunities
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Primary Keywords */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Primary Keywords
                  </h3>
                  <div className="space-y-3">
                    {data.keywords.primary?.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                        <div>
                          <p className="font-medium text-sm">{kw.keyword}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{kw.opportunity}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 ml-2">
                          <Badge variant="outline" className={`text-[10px] ${kw.volume === 'High' ? 'border-emerald-500/30 text-emerald-400' : 'border-white/20 text-muted-foreground'}`}>
                            {kw.volume}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${kw.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-400' : kw.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-400' : 'border-rose-500/30 text-rose-400'}`}>
                            {kw.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Secondary Keywords */}
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Secondary Keywords
                  </h3>
                  <div className="space-y-3">
                    {data.keywords.secondary?.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                        <div>
                          <p className="font-medium text-sm">{kw.keyword}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{kw.opportunity}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 ml-2">
                          <Badge variant="outline" className={`text-[10px] ${kw.volume === 'High' ? 'border-emerald-500/30 text-emerald-400' : 'border-white/20 text-muted-foreground'}`}>
                            {kw.volume}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${kw.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-400' : kw.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-400' : 'border-rose-500/30 text-rose-400'}`}>
                            {kw.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Content Strategy */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Content Strategy
            </h2>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  {data.contentStrategy.priority?.map((content, i) => (
                    <div key={i} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-cyan-400">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{content.title}</p>
                          <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                            {content.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Target: <span className="text-emerald-400">{content.targetKeyword}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{content.estimatedImpact}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground/80 mb-3">Content Gaps to Fill</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.contentStrategy.contentGaps?.map((gap, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Roadmap */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" />
              Path-to-Page-1 Roadmap
            </h2>
            <div className="space-y-4">
              {data.roadmap?.map((phase, i) => (
                <Card key={i} className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        i === 0 ? 'bg-emerald-500/20' : i === 1 ? 'bg-amber-500/20' : 'bg-cyan-500/20'
                      }`}>
                        <span className={`text-sm font-bold ${
                          i === 0 ? 'text-emerald-400' : i === 1 ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {i + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold">{phase.phase}</h3>
                        <p className="text-sm text-muted-foreground">{phase.timeframe}</p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-14">
                      {phase.tasks?.map((task, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400/60 shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">{task}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* CTA at bottom */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Execute This Strategy?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Get the Agent OS installed free — Hermes, OpenClaw, or Claude — and start building the backlinks that make AI cite you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={onStartFree}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
                  >
                    Get Free Agent OS Setup
                  </button>
                  <button
                    onClick={reset}
                    className="border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300"
                  >
                    Analyze Another Site
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

function Separator() {
  return <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />
}
