'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, SEOAnalysis } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Shield,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  FileText,
  Target,
  Wrench,
  Database,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ── Pillar Badge ──────────────────────────────────────────────
function PillarBadge({ pillar }: { pillar: string }) {
  const styles: Record<string, string> = {
    seo: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    aeo: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
    geo: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    all: 'border-white/20 text-foreground bg-white/5',
  }
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[pillar] || styles.all}`}>
      {pillar}
    </Badge>
  )
}

// ── Score Ring ────────────────────────────────────────────────
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/5" />
          <circle cx="48" cy="48" r="40" stroke={color} strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Severity Badge ────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
    warning: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    info: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
  }
  return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${styles[severity] || styles.info}`}>{severity}</Badge>
}

// ── Collapsible Section ───────────────────────────────────────
function Collapsible({ title, icon: Icon, children, defaultOpen = false, badge }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/5 pt-4">{children}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export default function AnalysisDashboard({ onStartFree }: { onStartFree?: () => void }) {
  const { analysis, reset } = useAppStore()
  const data = analysis as SEOAnalysis | null

  if (!data) return null

  const scoreColor = (s: number) => (s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444')

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────── */}
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

          {/* ── Executive Summary ─────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      SEO · AEO · GEO Analysis: <span className="text-emerald-400">{data.siteName}</span>
                    </h1>
                    <p className="text-muted-foreground leading-relaxed text-lg">{data.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Three Pillar Scores ───────────────────────── */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Three-Pillar Performance
            </h2>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <ScoreRing score={data.overallScores.seo} label="SEO" color={scoreColor(data.overallScores.seo)} />
                  <ScoreRing score={data.overallScores.aeo} label="AEO" color={scoreColor(data.overallScores.aeo)} />
                  <ScoreRing score={data.overallScores.geo} label="GEO" color={scoreColor(data.overallScores.geo)} />
                  <ScoreRing score={data.overallScores.combined} label="Combined" color={scoreColor(data.overallScores.combined)} />
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> SEO — Search Engine Optimization
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" /> AEO — Answer Engine Optimization
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-amber-500" /> GEO — Generative Engine Optimization
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Executive Actions ──────────────────────────── */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Top 5 Actions to Take Now
            </h2>
            <div className="grid gap-3">
              {data.executiveActions?.map((action, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 1: AUDIT
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 1: Audit</h2>
                <p className="text-sm text-muted-foreground">Technical SEO · AEO Readiness · GEO Visibility</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Technical SEO */}
              <Collapsible title="Technical SEO Issues" icon={Wrench} badge={<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.audit.technicalSEO.score}/100</Badge>} defaultOpen>
                <div className="space-y-3">
                  {data.audit.technicalSEO.issues?.map((issue, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityBadge severity={issue.severity} />
                        <span className="text-sm font-medium">{issue.issue}</span>
                      </div>
                      <p className="text-xs text-emerald-400 ml-2">→ {issue.fix}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Crawlability */}
              <Collapsible title="Crawlability" icon={Database} badge={<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.audit.crawlability.score}/100</Badge>}>
                <div className="space-y-2">
                  {data.audit.crawlability.issues?.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm">{issue.issue}</p>
                        <p className="text-xs text-muted-foreground">Impact: {issue.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Page Speed */}
              <Collapsible title="Core Web Vitals" icon={Zap} badge={<Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{data.audit.pageSpeed.score}/100</Badge>}>
                <div className="grid sm:grid-cols-3 gap-3">
                  {data.audit.pageSpeed.coreVitals?.map((vital, i) => (
                    <div key={i} className={`rounded-xl p-4 text-center border ${vital.status === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' : vital.status === 'poor' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                      <p className="text-xs text-muted-foreground mb-1">{vital.metric}</p>
                      <p className="text-xl font-bold">{vital.value}</p>
                      <Badge variant="outline" className={`text-[10px] mt-2 ${vital.status === 'good' ? 'border-emerald-500/30 text-emerald-400' : vital.status === 'poor' ? 'border-rose-500/30 text-rose-400' : 'border-amber-500/30 text-amber-400'}`}>{vital.status}</Badge>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* AEO Readiness */}
              <Collapsible title="AEO Readiness" icon={MessageSquare} badge={<PillarBadge pillar="aeo" />}>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-lg p-3 text-center border ${data.audit.aeoReadiness.hasFAQ ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">FAQ Page</p>
                      <p className="text-lg font-bold">{data.audit.aeoReadiness.hasFAQ ? '✓' : '✗'}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center border ${data.audit.aeoReadiness.hasSchema ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">Schema Markup</p>
                      <p className="text-lg font-bold">{data.audit.aeoReadiness.hasSchema ? '✓' : '✗'}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center border ${data.audit.aeoReadiness.hasStructuredData ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">Structured Data</p>
                      <p className="text-lg font-bold">{data.audit.aeoReadiness.hasStructuredData ? '✓' : '✗'}</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Answer Format Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${data.audit.aeoReadiness.answerFormatScore}%` }} />
                      </div>
                      <span className="text-sm font-mono text-cyan-400">{data.audit.aeoReadiness.answerFormatScore}</span>
                    </div>
                  </div>
                  {data.audit.aeoReadiness.issues?.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{issue}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* GEO Visibility */}
              <Collapsible title="GEO Visibility" icon={Brain} badge={<PillarBadge pillar="geo" />}>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI Engines That May Cite You</p>
                    <div className="flex flex-wrap gap-2">
                      {data.audit.geoVisibility.citedByAI?.map((ai, i) => (
                        <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5">{ai}</Badge>
                      ))}
                      {(!data.audit.geoVisibility.citedByAI || data.audit.geoVisibility.citedByAI.length === 0) && (
                        <span className="text-sm text-muted-foreground">None detected</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <p className="text-xs text-muted-foreground">Entity Recognition</p>
                      <p className="text-xl font-bold text-amber-400">{data.audit.geoVisibility.entityRecognition}/100</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${data.audit.geoVisibility.knowledgeGraphPresence ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <p className="text-xs text-muted-foreground">Knowledge Graph</p>
                      <p className="text-xl font-bold">{data.audit.geoVisibility.knowledgeGraphPresence ? '✓ Present' : '✗ Missing'}</p>
                    </div>
                  </div>
                  {data.audit.geoVisibility.issues?.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{issue}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 2: STRUCTURE
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 2: Structure</h2>
                <p className="text-sm text-muted-foreground">Topic Clusters · Keyword Gaps · Schema · Architecture</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Topic Clusters */}
              <Collapsible title="Topic Clusters" icon={Target} defaultOpen>
                <div className="space-y-4">
                  {data.structure.topicClusters?.map((cluster, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-emerald-400">{cluster.cluster}</span>
                        <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">Pillar: {cluster.pillarKeyword}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {cluster.supportingKeywords?.map((kw, j) => (
                          <Badge key={j} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{kw}</Badge>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <p className="text-[10px] text-emerald-400 font-bold mb-1">SEO</p>
                          <p className="text-xs text-muted-foreground">{cluster.seoOpportunity}</p>
                        </div>
                        <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                          <p className="text-[10px] text-cyan-400 font-bold mb-1">AEO</p>
                          <p className="text-xs text-muted-foreground">{cluster.aeoOpportunity}</p>
                        </div>
                        <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                          <p className="text-[10px] text-amber-400 font-bold mb-1">GEO</p>
                          <p className="text-xs text-muted-foreground">{cluster.geoOpportunity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Keyword Gaps */}
              <Collapsible title="Keyword Gaps" icon={Search}>
                <div className="space-y-2">
                  {data.structure.keywordGaps?.map((kw, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <PillarBadge pillar={kw.type} />
                        <span className="text-sm font-medium">{kw.keyword}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">{kw.volume} vol</Badge>
                        <Badge variant="outline" className={`text-[10px] ${kw.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-400' : kw.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-400' : 'border-rose-500/30 text-rose-400'}`}>{kw.difficulty}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Schema Recommendations */}
              <Collapsible title="Schema Recommendations" icon={Database}>
                <div className="space-y-2">
                  {data.structure.schemaRecommendations?.map((schema, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <PillarBadge pillar={schema.pillar} />
                        <span className="text-sm font-bold">{schema.schemaType}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{schema.purpose}</p>
                      <p className="text-xs text-emerald-400">→ {schema.implementation}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 3: CREATIVE
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 3: Creative</h2>
                <p className="text-sm text-muted-foreground">Content Briefs · On-Page Optimization · Answer Blocks</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Content Briefs */}
              <Collapsible title="Content Briefs" icon={FileText} defaultOpen>
                <div className="space-y-3">
                  {data.creative.contentBriefs?.map((brief, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-amber-400">{i + 1}</span>
                        </div>
                        <span className="text-sm font-semibold">{brief.title}</span>
                        <PillarBadge pillar={brief.pillar} />
                        <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{brief.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{brief.brief}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span>🎯 {brief.targetKeyword}</span>
                        <span>📊 {brief.estimatedImpact}</span>
                        <span>📝 {brief.wordCount}</span>
                      </div>
                      {brief.structure?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {brief.structure.map((heading, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">{heading}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Answer Blocks */}
              <Collapsible title="Answer Blocks for AI Citation" icon={MessageSquare} badge={<PillarBadge pillar="geo" />}>
                <div className="space-y-3">
                  {data.creative.answerBlocks?.map((block, i) => (
                    <div key={i} className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{block.format}</Badge>
                        <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">→ {block.targetEngine}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">Q: {block.question}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">A: {block.suggestedAnswer}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* On-Page Optimizations */}
              <Collapsible title="On-Page Optimizations" icon={Wrench}>
                <div className="space-y-3">
                  {data.creative.onPageOptimizations?.map((opt, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <p className="text-sm font-semibold mb-2">{opt.page}</p>
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-muted-foreground">Current: <span className="text-rose-400">{opt.currentTitle}</span></p>
                        <p className="text-xs text-muted-foreground">Suggested: <span className="text-emerald-400">{opt.suggestedTitle}</span></p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{opt.suggestedDescription}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-cyan-400 font-bold mb-1">AEO Tweaks</p>
                          {opt.aeoTweaks?.map((tweak, j) => (
                            <p key={j} className="text-xs text-muted-foreground">• {tweak}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-400 font-bold mb-1">GEO Tweaks</p>
                          {opt.geoTweaks?.map((tweak, j) => (
                            <p key={j} className="text-xs text-muted-foreground">• {tweak}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════
              PHASE 4: MEASURE
              ══════════════════════════════════════════════════ */}
          <motion.div variants={item}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Phase 4: Measure</h2>
                <p className="text-sm text-muted-foreground">KPIs · Competitor Benchmarks · Weekly Actions</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* KPI Tracking */}
              <Collapsible title="KPI Tracking" icon={Target} defaultOpen>
                <div className="grid sm:grid-cols-3 gap-4">
                  {(['seo', 'aeo', 'geo'] as const).map((pillar) => (
                    <div key={pillar}>
                      <div className="flex items-center gap-2 mb-3">
                        <PillarBadge pillar={pillar} />
                        <span className="text-sm font-semibold capitalize">{pillar} KPIs</span>
                      </div>
                      <div className="space-y-2">
                        {data.measure.kpiTracking?.[pillar]?.map((kpi, i) => (
                          <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            <p className="text-xs font-medium mb-1">{kpi.metric}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>Now: <span className="text-rose-400">{kpi.current}</span></span>
                              <ArrowRight className="w-3 h-3" />
                              <span>Target: <span className="text-emerald-400">{kpi.target}</span></span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.timeline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Competitor Benchmarks */}
              <Collapsible title="Competitor Benchmarks" icon={Users}>
                <div className="space-y-3">
                  {data.measure.competitorBenchmarks?.map((comp, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{comp.competitor}</p>
                          <p className="text-xs text-muted-foreground">{comp.url}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
                          <p className="text-xs text-muted-foreground">SEO</p>
                          <p className="text-lg font-bold text-emerald-400">{comp.seoScore}</p>
                        </div>
                        <div className="text-center bg-cyan-500/5 rounded-lg p-2 border border-cyan-500/10">
                          <p className="text-xs text-muted-foreground">AEO</p>
                          <p className="text-lg font-bold text-cyan-400">{comp.aeoScore}</p>
                        </div>
                        <div className="text-center bg-amber-500/5 rounded-lg p-2 border border-amber-500/10">
                          <p className="text-xs text-muted-foreground">GEO</p>
                          <p className="text-lg font-bold text-amber-400">{comp.geoScore}</p>
                        </div>
                      </div>
                      {comp.citedBy?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {comp.citedBy.map((ai, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{ai}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Collapsible>

              {/* Weekly Actions */}
              <Collapsible title="4-Week Action Plan" icon={Calendar} defaultOpen>
                <div className="space-y-4">
                  {data.measure.weeklyActions?.map((week, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-emerald-500/20' : i === 1 ? 'bg-cyan-500/20' : i === 2 ? 'bg-amber-500/20' : 'bg-rose-500/20'}`}>
                          <span className={`text-xs font-bold ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-cyan-400' : i === 2 ? 'text-amber-400' : 'text-rose-400'}`}>{i + 1}</span>
                        </div>
                        <span className="text-sm font-bold">{week.week}</span>
                      </div>
                      <div className="ml-9 space-y-1.5">
                        {week.tasks?.map((task, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${task.priority === 'high' ? 'text-emerald-400' : task.priority === 'medium' ? 'text-amber-400' : 'text-muted-foreground/50'}`} />
                            <PillarBadge pillar={task.pillar} />
                            <span className="text-xs text-muted-foreground">{task.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          </motion.div>

          {/* ── Bottom CTA ────────────────────────────────── */}
          <motion.div variants={item}>
            <Card className="bg-gradient-to-r from-emerald-500/10 via-background to-amber-500/10 border-emerald-500/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to Execute This Strategy?</h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Get the Agent OS installed free — Hermes, OpenClaw, or Claude — and start building the backlinks that make AI cite you across SEO, AEO, and GEO.
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
