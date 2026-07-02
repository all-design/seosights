'use client'

/**
 * Auto Execute — Publishing and index requests
 *
 * Ready to Publish list, Recently Published, Index Status, and Auto Execute Log.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Globe,
  Search,
  FileText,
  Upload,
  RefreshCw,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────

interface ReadyArticle {
  id: string
  title: string
  reviewScores: {
    seo: number
    aeo: number
    geo: number
    citation: number
    schema: number
  }
}

interface PublishedArticle {
  id: string
  title: string
  publishedUrl: string
  publishedAt: string
}

interface IndexStatus {
  google: { submitted: number; pending: number; indexed: number }
  bing: { submitted: number; pending: number; indexed: number }
  sitemap: { updated: boolean; lastUpdated: string }
}

interface LogEntry {
  id: string
  timestamp: string
  action: string
  detail: string
  status: 'success' | 'error' | 'info'
}

interface PublishData {
  readyToPublish: ReadyArticle[]
  recentlyPublished: PublishedArticle[]
  indexStatus: IndexStatus
  logs: LogEntry[]
}

// ── Fallback ────────────────────────────────────────────────────────────

const FALLBACK: PublishData = {
  readyToPublish: [
    {
      id: '1',
      title: 'AI Visibility for Dentists',
      reviewScores: { seo: 92, aeo: 87, geo: 78, citation: 85, schema: 95 },
    },
    {
      id: '9',
      title: 'API Reference v2.1',
      reviewScores: { seo: 85, aeo: 79, geo: 72, citation: 80, schema: 91 },
    },
  ],
  recentlyPublished: [
    { id: '5', title: 'Why AI Search Changes SEO', publishedUrl: 'https://seosights.com/blog/ai-search-changes-seo', publishedAt: '2 hours ago' },
    { id: '6', title: 'Monthly AI Visibility Report', publishedUrl: 'https://seosights.com/blog/monthly-ai-visibility-report', publishedAt: '5 hours ago' },
    { id: '7', title: 'Schema Markup for AI Crawlers', publishedUrl: 'https://seosights.com/blog/schema-markup-ai-crawlers', publishedAt: '1 day ago' },
    { id: '8', title: 'Citation Building Strategy', publishedUrl: 'https://seosights.com/blog/citation-building-strategy', publishedAt: '2 days ago' },
  ],
  indexStatus: {
    google: { submitted: 34, pending: 3, indexed: 31 },
    bing: { submitted: 28, pending: 6, indexed: 22 },
    sitemap: { updated: true, lastUpdated: '2 hours ago' },
  },
  logs: [
    { id: '1', timestamp: '14:32', action: 'Publish', detail: 'Published "Why AI Search Changes SEO" to WordPress', status: 'success' },
    { id: '2', timestamp: '14:33', action: 'Index', detail: 'Submitted to Google Indexing API', status: 'success' },
    { id: '3', timestamp: '14:33', action: 'Index', detail: 'Submitted to Bing Webmaster API', status: 'success' },
    { id: '4', timestamp: '14:34', action: 'Sitemap', detail: 'Updated sitemap.xml with new article', status: 'success' },
    { id: '5', timestamp: '14:35', action: 'Index', detail: 'Google confirmed index for "Citation Building Strategy"', status: 'success' },
    { id: '6', timestamp: '12:15', action: 'Publish', detail: 'Published "Monthly AI Visibility Report"', status: 'success' },
    { id: '7', timestamp: '12:16', action: 'Index', detail: 'Google Indexing API rate limited, retrying in 60s', status: 'error' },
    { id: '8', timestamp: '12:17', action: 'Index', detail: 'Retry successful — submitted to Google Indexing API', status: 'success' },
    { id: '9', timestamp: '10:00', action: 'Auto Execute', detail: 'Daily auto-execute cycle started', status: 'info' },
    { id: '10', timestamp: '10:01', action: 'Auto Execute', detail: 'Found 2 articles ready for publishing', status: 'info' },
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

export default function AutoExecute() {
  const [data, setData] = useState<PublishData | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client-zero/content-engine/publish')
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

  const handlePublish = async (articleId: string) => {
    setPublishing(articleId)
    try {
      await fetch('/api/client-zero/content-engine/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action: 'publish' }),
      })
    } catch {
      // silent
    }
    setTimeout(() => setPublishing(null), 2000)
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

  const { readyToPublish, recentlyPublished, indexStatus, logs } = data || FALLBACK

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <Play className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">Auto Execute</h3>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Ready to Publish ──────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 h-full">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-sm">Ready to Publish</CardTitle>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {readyToPublish.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {readyToPublish.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No articles ready for publishing</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {readyToPublish.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 p-3 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-medium">{article.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(article.reviewScores).map(([key, score]) => {
                            const color = score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-red-400'
                            return (
                              <span key={key} className={`text-[10px] font-mono ${color}`}>
                                {key.toUpperCase()}:{score}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                        onClick={() => handlePublish(article.id)}
                        disabled={publishing === article.id}
                      >
                        {publishing === article.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Publish
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Recently Published ────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 h-full">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm">Recently Published</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-64">
                <div className="flex flex-col gap-2">
                  {recentlyPublished.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 p-2.5 hover:border-cyan-500/20 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{article.title}</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{article.publishedAt}</span>
                        </div>
                      </div>
                      <a
                        href={article.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 ml-2"
                      >
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-cyan-400">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Index Status ──────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm">Index Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Google */}
                <div className="rounded-lg border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Search className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs font-semibold">Google</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Submitted</span>
                      <span className="text-xs font-mono text-emerald-400">{indexStatus.google.submitted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Pending</span>
                      <span className="text-xs font-mono text-amber-400">{indexStatus.google.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Indexed</span>
                      <span className="text-xs font-mono text-emerald-400">{indexStatus.google.indexed}</span>
                    </div>
                  </div>
                </div>

                {/* Bing */}
                <div className="rounded-lg border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold">Bing</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Submitted</span>
                      <span className="text-xs font-mono text-emerald-400">{indexStatus.bing.submitted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Pending</span>
                      <span className="text-xs font-mono text-amber-400">{indexStatus.bing.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Indexed</span>
                      <span className="text-xs font-mono text-emerald-400">{indexStatus.bing.indexed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sitemap */}
              <div className="mt-3 rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs font-semibold">Sitemap</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] border-0 ${
                      indexStatus.sitemap.updated
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {indexStatus.sitemap.updated ? 'Updated' : 'Stale'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Last updated: {indexStatus.sitemap.lastUpdated}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Auto Execute Log ──────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-violet-400" />
                  <CardTitle className="text-sm">Auto Execute Log</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10">
                  {logs.length} entries
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-64">
                <div className="flex flex-col gap-1.5">
                  {logs.map((entry) => {
                    const dotColor =
                      entry.status === 'success'
                        ? 'bg-emerald-400'
                        : entry.status === 'error'
                          ? 'bg-red-400'
                          : 'bg-blue-400'
                    return (
                      <div key={entry.id} className="flex items-start gap-2 rounded-md p-1.5 hover:bg-white/5">
                        <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{entry.timestamp}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 h-4 border-0 ${
                                entry.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : entry.status === 'error'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              {entry.action}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{entry.detail}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
