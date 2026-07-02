'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Filter,
  Clock,
  FileText,
  Code,
  Palette,
  DollarSign,
  Server,
  GitBranch,
  RotateCcw,
  Trash2,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface DecisionEntry {
  id: string
  changeType: string
  changeTitle: string
  changeDescription: string
  changeCategory: string
  beforeState?: string | null
  afterState?: string | null
  aiScoreDelta: number
  signupDelta: number
  conversionDelta: number
  revenueDelta: number
  citationDelta: number
  author?: string | null
  source?: string | null
  tags?: string | null
  verified: boolean
  verifiedAt?: string | null
  createdAt: string
}

// ─── Config ─────────────────────────────────────────────────────────────

const CHANGE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  feature_added: { label: 'Feature Added', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', icon: <Plus className="w-3 h-3" /> },
  feature_removed: { label: 'Feature Removed', color: 'bg-red-400/10 text-red-400 border-red-400/20', icon: <Trash2 className="w-3 h-3" /> },
  content_change: { label: 'Content Change', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20', icon: <FileText className="w-3 h-3" /> },
  schema_change: { label: 'Schema Change', color: 'bg-purple-400/10 text-purple-400 border-purple-400/20', icon: <Code className="w-3 h-3" /> },
  design_change: { label: 'Design Change', color: 'bg-pink-400/10 text-pink-400 border-pink-400/20', icon: <Palette className="w-3 h-3" /> },
  pricing_change: { label: 'Pricing Change', color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20', icon: <DollarSign className="w-3 h-3" /> },
  config_change: { label: 'Config Change', color: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20', icon: <Server className="w-3 h-3" /> },
  deploy: { label: 'Deploy', color: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20', icon: <GitBranch className="w-3 h-3" /> },
  rollback: { label: 'Rollback', color: 'bg-orange-400/10 text-orange-400 border-orange-400/20', icon: <RotateCcw className="w-3 h-3" /> },
}

const CATEGORY_OPTIONS = [
  { value: 'content', label: 'Content' },
  { value: 'technical', label: 'Technical' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'infrastructure', label: 'Infrastructure' },
]

// ─── Impact Metric ──────────────────────────────────────────────────────

function ImpactMetric({ label, value, isCurrency = false, isPercentage = false }: {
  label: string
  value: number
  isCurrency?: boolean
  isPercentage?: boolean
}) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const formattedValue = isCurrency
    ? `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString()}`
    : isPercentage
    ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    : `${value >= 0 ? '+' : ''}${value}`

  return (
    <div className="flex items-center gap-1.5">
      {isNeutral ? (
        <Minus className="w-3 h-3 text-gray-400" />
      ) : isPositive ? (
        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
      ) : (
        <ArrowDownRight className="w-3 h-3 text-red-400" />
      )}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${
        isNeutral ? 'text-gray-400' : isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {formattedValue}
      </span>
    </div>
  )
}

// ─── Timeline Entry ─────────────────────────────────────────────────────

function TimelineEntry({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: DecisionEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const typeConfig = CHANGE_TYPE_CONFIG[entry.changeType] || {
    label: entry.changeType,
    color: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    icon: <FileText className="w-3 h-3" />,
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <Card
        className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-white/20 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className={`text-[10px] ${typeConfig.color}`}>
                  {typeConfig.icon}
                  <span className="ml-1">{typeConfig.label}</span>
                </Badge>
                {entry.verified ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-gray-400/10 text-gray-400 border-gray-400/20">
                    Unverified
                  </Badge>
                )}
                {entry.source === 'ai_twin' && (
                  <Badge variant="outline" className="text-[10px] bg-purple-400/10 text-purple-400 border-purple-400/20">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    AI Twin
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-medium text-foreground">{entry.changeTitle}</h4>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(entry.createdAt)}
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 p-2.5 rounded-lg bg-white/[0.02]">
            <ImpactMetric label="AI Score" value={entry.aiScoreDelta} />
            <ImpactMetric label="Signups" value={entry.signupDelta} isPercentage />
            <ImpactMetric label="Citations" value={entry.citationDelta} />
            <ImpactMetric label="Revenue" value={entry.revenueDelta} isCurrency />
          </div>
        </CardContent>
      </Card>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/40 backdrop-blur-sm border-white/5 mt-1">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
                    <p className="text-sm text-foreground/90">{entry.changeDescription}</p>
                  </div>

                  {/* Before/After State */}
                  {(entry.beforeState || entry.afterState) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entry.beforeState && (
                        <div className="p-2.5 rounded-lg bg-red-400/5 border border-red-400/10">
                          <h5 className="text-xs font-medium text-red-400 mb-1">Before</h5>
                          <pre className="text-[11px] text-foreground/70 whitespace-pre-wrap">
                            {formatJsonState(entry.beforeState)}
                          </pre>
                        </div>
                      )}
                      {entry.afterState && (
                        <div className="p-2.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
                          <h5 className="text-xs font-medium text-emerald-400 mb-1">After</h5>
                          <pre className="text-[11px] text-foreground/70 whitespace-pre-wrap">
                            {formatJsonState(entry.afterState)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>Category: <strong className="text-foreground/70">{entry.changeCategory}</strong></span>
                    {entry.author && <span>Author: <strong className="text-foreground/70">{entry.author}</strong></span>}
                    {entry.source && <span>Source: <strong className="text-foreground/70">{entry.source}</strong></span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function formatJsonState(state: string | null | undefined): string {
  if (!state) return ''
  try {
    const parsed = JSON.parse(state)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return state
  }
}

// ─── Add Entry Form ─────────────────────────────────────────────────────

function AddEntryForm({ onAdd, onCancel }: { onAdd: (entry: Partial<DecisionEntry>) => void; onCancel: () => void }) {
  const [changeType, setChangeType] = useState('content_change')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('content')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/superadmin/decision-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeType,
          changeTitle: title,
          changeDescription: description,
          changeCategory: category,
          author: 'superadmin',
          source: 'manual',
        }),
      })
      const json = await res.json()
      if (json.success) {
        onAdd(json.entry)
      }
    } catch (err) {
      console.error('[DecisionLog] Add error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-emerald-400/20">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Change Type</label>
              <Select value={changeType} onValueChange={setChangeType}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANGE_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Added FAQ section to /pricing"
              className="bg-background/50 border-white/10"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what changed and why..."
              className="bg-background/50 border-white/10 min-h-[80px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !description.trim()}
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-400/20"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1.5" />
              )}
              Add Entry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function DecisionLog() {
  const [entries, setEntries] = useState<DecisionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterVerified, setFilterVerified] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterType !== 'all') params.set('changeType', filterType)
      if (filterVerified !== 'all') params.set('verified', filterVerified)

      const res = await fetch(`/api/superadmin/decision-log?${params.toString()}`)
      const json = await res.json()
      setEntries(json.entries || [])
    } catch (err) {
      console.error('[DecisionLog] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterType, filterVerified])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Client-side search filter
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      entry.changeTitle.toLowerCase().includes(q) ||
      entry.changeDescription.toLowerCase().includes(q) ||
      entry.changeType.toLowerCase().includes(q)
    )
  })

  // Stats
  const totalEntries = entries.length
  const verifiedCount = entries.filter(e => e.verified).length
  const avgAiScoreDelta = totalEntries > 0 ? entries.reduce((acc, e) => acc + e.aiScoreDelta, 0) / totalEntries : 0
  const totalRevenueDelta = entries.reduce((acc, e) => acc + e.revenueDelta, 0)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading decision log...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <style jsx global>{`
        .dl-scroll::-webkit-scrollbar { width: 6px; }
        .dl-scroll::-webkit-scrollbar-track { background: transparent; }
        .dl-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .dl-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Decision Log
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Every change. What happened because of it.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-400/20"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Entry
        </Button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Decisions', value: totalEntries, color: 'text-foreground' },
          { label: 'Verified', value: verifiedCount, color: 'text-emerald-400' },
          { label: 'Avg AI Score Δ', value: `+${avgAiScoreDelta.toFixed(1)}`, color: 'text-emerald-400' },
          { label: 'Total Revenue Δ', value: `+$${totalRevenueDelta.toLocaleString()}`, color: 'text-emerald-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Add Entry Form (collapsible) ─────────────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-6 overflow-hidden"
          >
            <AddEntryForm
              onAdd={() => {
                setShowAddForm(false)
                fetchEntries()
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions..."
            className="pl-9 bg-background/50 border-white/10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-background/50 border-white/10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50 border-white/10">
              <SelectValue placeholder="Change Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CHANGE_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterVerified} onValueChange={setFilterVerified}>
            <SelectTrigger className="w-[110px] h-8 text-xs bg-background/50 border-white/10">
              <SelectValue placeholder="Verified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <ScrollArea className="max-h-[calc(100vh-400px)]">
        <div className="space-y-3 pr-3">
          {filteredEntries.length === 0 ? (
            <Card className="bg-card/40 backdrop-blur-sm border-white/5">
              <CardContent className="p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No decisions logged yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Click &quot;Add Entry&quot; to record your first decision</p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TimelineEntry
                  entry={entry}
                  isExpanded={expandedEntry === entry.id}
                  onToggle={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                />
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
