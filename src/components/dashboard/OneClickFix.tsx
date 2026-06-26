'use client'

import { useState, useCallback, useMemo, useEffect, type ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Wrench, Zap, CheckCircle2, AlertTriangle, Loader2, Code2, Download,
  Eye, EyeOff, FileText, FileCode, Settings, Link2,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────
type IssueType = 'Schema' | 'llms.txt' | 'robots.txt' | 'Meta' | 'Canonical' | 'Sitemap'
type Severity = 'Critical' | 'Warning' | 'Info'
type FixStatus = 'not_fixed' | 'fixing' | 'fixed' | 'manual_review'

interface FixIssue {
  id: string
  type: IssueType
  severity: Severity
  title: string
  description: string
  status: FixStatus
  fixCode: string
  fixLanguage: string
}

interface FixSummary {
  total: number
  fixable: number
  fixed: number
  manualReview: number
}

interface ApiResponse {
  issues: FixIssue[]
  summary: FixSummary
}

// ── Config maps ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<IssueType, { icon: ElementType; color: string; bg: string; border: string }> = {
  Schema: { icon: Code2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'llms.txt': { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'robots.txt': { icon: Settings, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  Meta: { icon: FileCode, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Canonical: { icon: Link2, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  Sitemap: { icon: FileCode, color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; border: string }> = {
  Critical: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  Warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Info: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
}

const STATUS_CONFIG: Record<FixStatus, { label: string; color: string; bg: string; border: string; icon?: ElementType; spin?: boolean }> = {
  not_fixed: { label: 'Not Fixed', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  fixing: { label: 'Fixing...', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Loader2, spin: true },
  fixed: { label: 'Fixed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
  manual_review: { label: 'Manual Review', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
}

// ── Fix Card ────────────────────────────────────────────────────
function FixCard({
  issue, index, expanded, onTogglePreview, onFix,
}: {
  issue: FixIssue
  index: number
  expanded: boolean
  onTogglePreview: () => void
  onFix: () => void
}) {
  const typeCfg = TYPE_CONFIG[issue.type]
  const sevCfg = SEVERITY_CONFIG[issue.severity]
  const statusCfg = STATUS_CONFIG[issue.status]
  const TypeIcon = typeCfg.icon
  const StatusIcon = statusCfg.icon
  const isFixed = issue.status === 'fixed'
  const isFixing = issue.status === 'fixing'
  const isManual = issue.status === 'manual_review'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.06, ease: 'easeOut' }}
      className={`rounded-xl border p-4 backdrop-blur-sm transition-colors ${
        isFixed ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] uppercase font-bold gap-1 ${typeCfg.color} ${typeCfg.bg} ${typeCfg.border}`}>
            <TypeIcon className="w-3 h-3" />
            {issue.type}
          </Badge>
          <Badge variant="outline" className={`text-[10px] uppercase font-bold gap-1 ${sevCfg.color} ${sevCfg.bg} ${sevCfg.border}`}>
            <AlertTriangle className="w-3 h-3" />
            {issue.severity}
          </Badge>
        </div>
        <Badge variant="outline" className={`text-[10px] uppercase font-bold gap-1 ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
          {StatusIcon && <StatusIcon className={`w-3 h-3 ${statusCfg.spin ? 'animate-spin' : ''}`} />}
          {statusCfg.label}
        </Badge>
      </div>

      <h4 className="text-sm font-bold text-foreground leading-tight">{issue.title}</h4>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{issue.description}</p>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Button
          size="sm"
          onClick={onFix}
          disabled={isFixing || isFixed || isManual}
          className={`text-xs font-semibold h-7 px-3 ${
            isFixed
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/20'
              : isManual
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isFixing ? (
            <><Loader2 className="w-3 h-3 animate-spin" />Fixing...</>
          ) : isFixed ? (
            <><CheckCircle2 className="w-3 h-3" />Fixed</>
          ) : isManual ? (
            <><AlertTriangle className="w-3 h-3" />Manual Required</>
          ) : (
            <><Zap className="w-3 h-3" />Fix Now</>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onTogglePreview}
          className="text-xs font-semibold h-7 px-3 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300"
        >
          {expanded ? (
            <><EyeOff className="w-3 h-3" />Hide Code</>
          ) : (
            <><Eye className="w-3 h-3" />Preview Code</>
          )}
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
          {issue.fixLanguage}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <pre className="mt-3 rounded-lg border border-white/10 bg-zinc-950 text-zinc-300 text-[11px] leading-relaxed p-3 overflow-x-auto font-mono">
              <code>{issue.fixCode}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Loading skeleton ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 rounded bg-white/5" />
        <div className="h-5 w-16 rounded bg-white/5" />
      </div>
      <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
      <div className="h-3 w-full rounded bg-white/5" />
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────
export default function OneClickFix({ url }: { url?: string }) {
  const [issues, setIssues] = useState<FixIssue[]>([])
  const [summary, setSummary] = useState<FixSummary>({ total: 0, fixable: 0, fixed: 0, manualReview: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fixingAll, setFixingAll] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [zipReady, setZipReady] = useState(false)

  // ── Fetch detected issues from API ──────────────────────────
  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (url) params.set('url', url)
      const res = await fetch(`/api/dashboard/one-click-fix?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: ApiResponse = await res.json()
      setIssues(data.issues)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const progress = summary.total > 0
    ? Math.round((summary.fixed / summary.total) * 100)
    : 0

  // ── Fix one issue (optimistic + simulate) ───────────────────
  const fixOne = useCallback(async (id: string) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'fixing' as FixStatus } : i)))
    setSummary((prev) => ({ ...prev, fixed: prev.fixed }))
    await new Promise((r) => setTimeout(r, 1000))
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'fixed' as FixStatus } : i)))
    setSummary((prev) => ({ ...prev, fixed: prev.fixed + 1 }))
  }, [])

  // ── Fix All — sequential staggered animation ────────────────
  const fixAll = useCallback(async () => {
    setFixingAll(true)
    const toFix = issues.filter((i) => i.status === 'not_fixed')
    for (const issue of toFix) {
      await fixOne(issue.id)
      await new Promise((r) => setTimeout(r, 220))
    }
    setFixingAll(false)
  }, [issues, fixOne])

  // ── Download .zip (demo) ────────────────────────────────────
  const handleDownloadZip = useCallback(async () => {
    setZipping(true)
    setZipReady(false)
    await new Promise((r) => setTimeout(r, 1400))
    setZipping(false)
    setZipReady(true)
    setTimeout(() => setZipReady(false), 3500)
  }, [])

  const allFixed = summary.fixable > 0 && summary.fixed === summary.fixable

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="pt-6 pb-6 px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-emerald-500/20 border border-white/10 shrink-0">
              <Wrench className="w-5 h-5 text-purple-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground leading-tight">One-Click Fix</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auto-generate fixes for technical AI search issues
              </p>
            </div>
          </div>

          {/* Top banner */}
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 mb-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  <span className="text-rose-400">{summary.total} issues</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span className="text-emerald-400">{summary.fixable} can be auto-fixed</span>
                  {summary.manualReview > 0 && (
                    <>
                      <span className="text-muted-foreground mx-1.5">·</span>
                      <span className="text-cyan-400">{summary.manualReview} need review</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {loading
                    ? 'Scanning your site for AI search issues...'
                    : error
                    ? `Failed to load: ${error}`
                    : allFixed
                    ? 'All auto-fixable issues resolved. Download the patch bundle below.'
                    : fixingAll
                    ? `Applying fixes sequentially... ${summary.fixed}/${summary.fixable} done`
                    : 'Review each issue and apply individually, or hit Fix All.'}
                </p>
              </div>
              <Button
                onClick={fixAll}
                disabled={fixingAll || allFixed || summary.fixable === 0 || loading}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border border-emerald-400/40 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)] font-bold"
              >
                {fixingAll ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Fixing...</>
                ) : allFixed ? (
                  <><CheckCircle2 className="w-4 h-4" />All Fixed</>
                ) : (
                  <><Zap className="w-4 h-4" />Fix All ({summary.fixable - summary.fixed})</>
                )}
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Progress
                value={progress}
                className="h-1.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400"
              />
              <span className="text-[10px] font-mono text-muted-foreground w-9 text-right">
                {progress}%
              </span>
            </div>
          </div>

          {/* Fix cards list / loading / error */}
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
              <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-rose-300 mb-3">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchIssues} className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10">
                <Loader2 className="w-3 h-3" />Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {issues.map((issue, idx) => (
                <FixCard
                  key={issue.id}
                  issue={issue}
                  index={idx}
                  expanded={expandedId === issue.id}
                  onTogglePreview={() => setExpandedId((cur) => (cur === issue.id ? null : issue.id))}
                  onFix={() => fixOne(issue.id)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={handleDownloadZip}
              disabled={zipping || loading || !!error}
              className="text-xs font-semibold text-zinc-300 hover:text-foreground hover:bg-white/5"
            >
              {zipping ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Preparing .zip...</>
              ) : zipReady ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Bundle Ready (demo)</>
              ) : (
                <><Download className="w-3.5 h-3.5" />Download all fixes as .zip</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
