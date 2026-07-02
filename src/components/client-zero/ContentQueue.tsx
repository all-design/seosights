'use client'

/**
 * Content Queue — Kanban-style pipeline for content in progress
 *
 * Shows articles moving through stages: Brief → Writing → Reviewing → Approved → Publishing → Measuring
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ListOrdered,
  Search,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  PenTool,
  ShieldCheck,
  Play,
  BarChart3,
  Loader2,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

type ArticleStatus = 'brief' | 'writing' | 'reviewing' | 'approved' | 'publishing' | 'measuring'
type ContentType = 'blog' | 'programmatic' | 'linkedin' | 'newsletter' | 'docs'
type Priority = 'high' | 'medium' | 'low'

interface Article {
  id: string
  title: string
  keyword: string
  contentType: ContentType
  status: ArticleStatus
  priority: Priority
  reviewScores: {
    seo: number | null
    aeo: number | null
    geo: number | null
  }
}

interface ArticlesData {
  articles: Article[]
}

// ── Column Config ───────────────────────────────────────────────────────

const COLUMNS: { status: ArticleStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'brief', label: 'Brief', icon: FileText, color: 'text-gray-400' },
  { status: 'writing', label: 'Writing', icon: PenTool, color: 'text-amber-400' },
  { status: 'reviewing', label: 'Reviewing', icon: ShieldCheck, color: 'text-violet-400' },
  { status: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-emerald-400' },
  { status: 'publishing', label: 'Publishing', icon: Play, color: 'text-cyan-400' },
  { status: 'measuring', label: 'Measuring', icon: BarChart3, color: 'text-blue-400' },
]

const TYPE_COLORS: Record<ContentType, string> = {
  blog: 'bg-emerald-500/20 text-emerald-400',
  programmatic: 'bg-blue-500/20 text-blue-400',
  linkedin: 'bg-violet-500/20 text-violet-400',
  newsletter: 'bg-amber-500/20 text-amber-400',
  docs: 'bg-gray-500/20 text-gray-400',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-gray-500/20 text-gray-400',
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK: ArticlesData = {
  articles: [
    { id: '1', title: 'AI Visibility for Dentists', keyword: 'AI Visibility for Dentists', contentType: 'blog', status: 'approved', priority: 'high', reviewScores: { seo: 92, aeo: 87, geo: 78 } },
    { id: '2', title: 'LLM SEO vs Traditional SEO', keyword: 'LLM SEO vs Traditional SEO', contentType: 'blog', status: 'writing', priority: 'high', reviewScores: { seo: null, aeo: null, geo: null } },
    { id: '3', title: 'Geo Ranking Optimization', keyword: 'Geo Ranking Optimization', contentType: 'blog', status: 'reviewing', priority: 'medium', reviewScores: { seo: 88, aeo: 75, geo: 82 } },
    { id: '4', title: 'LLM SEO Guide (50 cities)', keyword: 'LLM SEO Guide', contentType: 'programmatic', status: 'brief', priority: 'high', reviewScores: { seo: null, aeo: null, geo: null } },
    { id: '5', title: 'Why AI Search Changes SEO', keyword: 'AI Search SEO', contentType: 'linkedin', status: 'publishing', priority: 'medium', reviewScores: { seo: 91, aeo: 84, geo: 76 } },
    { id: '6', title: 'Monthly AI Visibility Report', keyword: 'AI Visibility Report', contentType: 'newsletter', status: 'measuring', priority: 'low', reviewScores: { seo: 79, aeo: 71, geo: 68 } },
    { id: '7', title: 'Schema Markup for AI Crawlers', keyword: 'Schema Markup AI', contentType: 'blog', status: 'writing', priority: 'medium', reviewScores: { seo: null, aeo: null, geo: null } },
    { id: '8', title: 'Citation Building Strategy', keyword: 'Citation Building', contentType: 'blog', status: 'brief', priority: 'high', reviewScores: { seo: null, aeo: null, geo: null } },
    { id: '9', title: 'API Reference v2.1', keyword: 'Seosights API', contentType: 'docs', status: 'approved', priority: 'low', reviewScores: { seo: 85, aeo: 79, geo: 72 } },
    { id: '10', title: 'AI SEO Tools Comparison', keyword: 'AI SEO Tools', contentType: 'blog', status: 'reviewing', priority: 'high', reviewScores: { seo: 94, aeo: 88, geo: 81 } },
  ],
}

// ── Animation ───────────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Component ───────────────────────────────────────────────────────────

export default function ContentQueue() {
  const [data, setData] = useState<ArticlesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [advancing, setAdvancing] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client-zero/content-engine/articles')
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

  const articles = data?.articles || FALLBACK.articles
  const filtered = articles.filter((a) => {
    if (filterType !== 'all' && a.contentType !== filterType) return false
    if (filterPriority !== 'all' && a.priority !== filterPriority) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.keyword.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAdvance = async (articleId: string) => {
    setAdvancing(articleId)
    try {
      await fetch('/api/client-zero/content-engine/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action: 'advance' }),
      })
    } catch {
      // silent
    }
    setTimeout(() => setAdvancing(null), 800)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-card/80 backdrop-blur-sm border-white/10 animate-pulse">
            <CardContent className="p-3 h-64" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Header + Filters ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Content Queue</h3>
          <Badge variant="outline" className="border-white/10 text-muted-foreground">
            {filtered.length} articles
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 w-44 text-xs bg-card/80 border-white/10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 w-32 text-xs bg-card/80 border-white/10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="programmatic">Programmatic</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="docs">Docs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 w-28 text-xs bg-card/80 border-white/10">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ── Kanban Board ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <ScrollArea className="w-full">
          <div className="grid grid-cols-6 gap-3 min-w-[1100px]">
            {COLUMNS.map((col) => {
              const Icon = col.icon
              const colArticles = filtered.filter((a) => a.status === col.status)
              return (
                <div key={col.status} className="flex flex-col gap-2">
                  {/* Column Header */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/5">
                    <Icon className={`h-3.5 w-3.5 ${col.color}`} />
                    <span className="text-xs font-semibold text-muted-foreground">{col.label}</span>
                    <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4 border-white/10">
                      {colArticles.length}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {colArticles.length === 0 ? (
                      <div className="text-center py-6">
                        <Clock className="h-4 w-4 mx-auto text-muted-foreground/30 mb-1" />
                        <span className="text-[10px] text-muted-foreground/40">Empty</span>
                      </div>
                    ) : (
                      colArticles.map((article) => (
                        <Card key={article.id} className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-emerald-500/30 transition-colors">
                          <CardContent className="p-3 flex flex-col gap-2">
                            <p className="text-xs font-medium leading-tight">{article.title}</p>
                            <p className="text-[10px] text-muted-foreground">{article.keyword}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-0 ${TYPE_COLORS[article.contentType]}`}>
                                {article.contentType}
                              </Badge>
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-0 ${PRIORITY_COLORS[article.priority]}`}>
                                {article.priority}
                              </Badge>
                            </div>
                            {/* Review Scores */}
                            {article.reviewScores.seo !== null && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {(['seo', 'aeo', 'geo'] as const).map((review) => {
                                  const score = article.reviewScores[review]
                                  if (score === null) return null
                                  const color = score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'
                                  return (
                                    <span key={review} className={`text-[9px] font-mono ${color}`}>
                                      {review.toUpperCase()}:{score}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                            {/* Advance button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-full text-[10px] text-muted-foreground hover:text-emerald-400"
                              onClick={() => handleAdvance(article.id)}
                              disabled={advancing === article.id}
                            >
                              {advancing === article.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <ArrowRight className="h-3 w-3 mr-1" />
                              )}
                              Advance
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}
