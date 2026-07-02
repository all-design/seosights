'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  PlayCircle,
  Rocket,
  Search,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

// ── Types ────────────────────────────────────────────────────────────

type QueueColumnType =
  | 'ready'
  | 'waiting'
  | 'generating'
  | 'review'
  | 'approved'
  | 'publishing'
  | 'measuring'
  | 'learning'
  | 'done'

type QueuePriority = 'P1' | 'P2' | 'P3' | 'P4'
type QueueType = 'Blog' | 'Tool' | 'Industry' | 'VS' | 'Benchmark' | 'Research'

interface QueueItem {
  id: string
  title: string
  type: QueueType
  priority: QueuePriority
  growthScore: number
  quality: number // 0-100
  progress?: number
  column: QueueColumnType
}

// ── Column Config ────────────────────────────────────────────────────

interface ColumnConfig {
  key: QueueColumnType
  label: string
  icon: LucideIcon
  color: string
  bgColor: string
}

const columnConfig: ColumnConfig[] = [
  { key: 'ready', label: 'Ready', icon: PlayCircle, color: 'text-zinc-400', bgColor: 'bg-zinc-500/10' },
  { key: 'waiting', label: 'Waiting', icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
  { key: 'generating', label: 'Generating', icon: Sparkles, color: 'text-violet-400', bgColor: 'bg-violet-500/10' },
  { key: 'review', label: 'Review', icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { key: 'publishing', label: 'Publishing', icon: Globe, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { key: 'measuring', label: 'Measuring', icon: Timer, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { key: 'learning', label: 'Learning', icon: Search, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { key: 'done', label: 'Done', icon: Rocket, color: 'text-emerald-500', bgColor: 'bg-emerald-500/15' },
]

// ── Mock Data ────────────────────────────────────────────────────────

const mockQueueItems: QueueItem[] = [
  // Ready
  { id: 'q-001', title: 'AI Citation Tracker Tool', type: 'Tool', priority: 'P1', growthScore: 90, quality: 92, column: 'ready' },
  { id: 'q-002', title: 'ChatGPT vs Perplexity SEO Impact', type: 'VS', priority: 'P1', growthScore: 88, quality: 85, column: 'ready' },
  { id: 'q-003', title: 'FAQ Schema Generator', type: 'Tool', priority: 'P2', growthScore: 83, quality: 78, column: 'ready' },
  { id: 'q-004', title: 'SEO ROI Calculator', type: 'Tool', priority: 'P2', growthScore: 80, quality: 75, column: 'ready' },

  // Waiting
  { id: 'q-005', title: 'E-Commerce SEO Benchmark', type: 'Benchmark', priority: 'P1', growthScore: 85, quality: 80, column: 'waiting' },
  { id: 'q-006', title: 'SaaS Industry SEO Landscape', type: 'Industry', priority: 'P1', growthScore: 84, quality: 76, column: 'waiting' },
  { id: 'q-007', title: 'Featured Snippets Guide', type: 'Research', priority: 'P2', growthScore: 80, quality: 82, column: 'waiting' },

  // Generating
  { id: 'q-008', title: 'AI Overview Optimization FAQ', type: 'Blog', priority: 'P2', growthScore: 84, quality: 0, progress: 67, column: 'generating' },
  { id: 'q-009', title: 'E-E-A-T Optimization Research', type: 'Research', priority: 'P2', growthScore: 81, quality: 0, progress: 42, column: 'generating' },
  { id: 'q-010', title: 'Technical SEO Benchmark Study', type: 'Benchmark', priority: 'P2', growthScore: 79, quality: 0, progress: 23, column: 'generating' },

  // Review
  { id: 'q-011', title: 'Local SEO vs National SEO', type: 'VS', priority: 'P2', growthScore: 77, quality: 88, column: 'review' },
  { id: 'q-012', title: 'Content Freshness Methodology', type: 'Blog', priority: 'P2', growthScore: 77, quality: 91, column: 'review' },

  // Approved
  { id: 'q-013', title: 'Healthcare SEO Research', type: 'Industry', priority: 'P3', growthScore: 70, quality: 82, column: 'approved' },
  { id: 'q-014', title: 'Real Estate SEO Guide', type: 'Industry', priority: 'P3', growthScore: 69, quality: 79, column: 'approved' },
  { id: 'q-015', title: 'Finance Industry Trends', type: 'Industry', priority: 'P3', growthScore: 72, quality: 84, column: 'approved' },

  // Publishing
  { id: 'q-016', title: 'AI SEO Tools Comparison 2025', type: 'VS', priority: 'P1', growthScore: 89, quality: 94, column: 'publishing' },
  { id: 'q-017', title: 'Blog Post Topic Cluster', type: 'Blog', priority: 'P4', growthScore: 64, quality: 70, column: 'publishing' },

  // Measuring
  { id: 'q-018', title: 'SEO Audit Frequency Benchmark', type: 'Benchmark', priority: 'P3', growthScore: 69, quality: 77, column: 'measuring' },
  { id: 'q-019', title: 'AI Search Engine Comparison', type: 'VS', priority: 'P1', growthScore: 86, quality: 90, column: 'measuring' },

  // Learning
  { id: 'q-020', title: 'Schema Markup Best Practices', type: 'Blog', priority: 'P2', growthScore: 75, quality: 86, column: 'learning' },
  { id: 'q-021', title: 'Core Web Vitals Guide', type: 'Blog', priority: 'P2', growthScore: 73, quality: 83, column: 'learning' },
  { id: 'q-022', title: 'Link Building Strategy', type: 'Research', priority: 'P3', growthScore: 68, quality: 79, column: 'learning' },

  // Done
  { id: 'q-023', title: 'Keyword Research Guide 2025', type: 'Blog', priority: 'P1', growthScore: 91, quality: 95, column: 'done' },
  { id: 'q-024', title: 'On-Page SEO Checklist', type: 'Blog', priority: 'P2', growthScore: 82, quality: 88, column: 'done' },
  { id: 'q-025', title: 'Backlink Analysis Tool', type: 'Tool', priority: 'P1', growthScore: 87, quality: 93, column: 'done' },
]

// ── Helper Functions ─────────────────────────────────────────────────

function getPriorityBadgeColor(priority: QueuePriority): string {
  const colors: Record<QueuePriority, string> = {
    P1: 'bg-red-500/15 text-red-400 border-red-500/25',
    P2: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    P3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    P4: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  }
  return colors[priority]
}

function getTypeBadgeColor(type: QueueType): string {
  const colors: Record<QueueType, string> = {
    Blog: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    Tool: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    Industry: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    VS: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    Benchmark: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    Research: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  }
  return colors[type]
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-amber-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

function getQualityDotColor(quality: number): string {
  if (quality >= 90) return 'bg-emerald-500'
  if (quality >= 75) return 'bg-amber-500'
  if (quality >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

// ── Queue Card ───────────────────────────────────────────────────────

function QueueCard({ item, index }: { item: QueueItem; index: number }) {
  const isGenerating = item.column === 'generating'
  const isDone = item.column === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-3 cursor-default group',
        'hover:border-zinc-700/60 transition-colors',
        isDone && 'opacity-60'
      )}
    >
      {/* Title */}
      <h4 className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors leading-snug mb-2 line-clamp-2">
        {item.title}
      </h4>

      {/* Badges Row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-5', getTypeBadgeColor(item.type))}>
          {item.type}
        </Badge>
        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-5', getPriorityBadgeColor(item.priority))}>
          {item.priority}
        </Badge>
      </div>

      {/* Growth Score + Quality */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">Growth</span>
          <span className={cn('text-xs font-bold tabular-nums', getScoreColor(item.growthScore))}>
            {item.growthScore}
          </span>
        </div>
        {item.quality > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-600">Q</span>
            <div className={cn('w-1.5 h-1.5 rounded-full', getQualityDotColor(item.quality))} />
            <span className="text-[10px] text-zinc-500 tabular-nums">{item.quality}</span>
          </div>
        )}
      </div>

      {/* Progress bar for generating items */}
      {isGenerating && item.progress !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-zinc-600">Generating...</span>
            <span className="text-[10px] text-violet-400 tabular-nums">{item.progress}%</span>
          </div>
          <Progress
            value={item.progress}
            className="h-1 bg-zinc-800 [&>div]:bg-violet-500"
          />
        </div>
      )}
    </motion.div>
  )
}

// ── Kanban Column ────────────────────────────────────────────────────

function KanbanColumn({ config, items }: { config: ColumnConfig; items: QueueItem[] }) {
  const Icon = config.icon

  return (
    <div className="flex flex-col min-w-[240px] max-w-[280px] w-[260px] shrink-0">
      {/* Column Header */}
      <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-t-lg border border-b-0', config.bgColor, 'border-zinc-800/40')}>
        <Icon className={cn('w-3.5 h-3.5', config.color)} />
        <span className="text-xs font-medium text-zinc-300 flex-1">{config.label}</span>
        <span className={cn(
          'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
          config.bgColor,
          config.color
        )}>
          {items.length}
        </span>
      </div>

      {/* Cards Stack */}
      <div className="flex-1 bg-zinc-950/40 border border-zinc-800/30 rounded-b-lg p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {items.map((item, i) => (
            <QueueCard key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <span className="text-[11px] text-zinc-700">No items</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mobile List View ─────────────────────────────────────────────────

function MobileQueueList({ items }: { items: QueueItem[] }) {
  const [selectedColumn, setSelectedColumn] = useState<QueueColumnType | 'All'>('All')

  const filteredItems = selectedColumn === 'All'
    ? items
    : items.filter((i) => i.column === selectedColumn)

  return (
    <div className="space-y-4">
      {/* Column Filter Tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-1">
          <button
            onClick={() => setSelectedColumn('All')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors',
              selectedColumn === 'All'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
            )}
          >
            All ({items.length})
          </button>
          {columnConfig.map((col) => {
            const count = items.filter((i) => i.column === col.key).length
            return (
              <button
                key={col.key}
                onClick={() => setSelectedColumn(col.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors',
                  selectedColumn === col.key
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
                )}
              >
                {col.label} ({count})
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredItems.map((item, i) => (
            <QueueCard key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function QueuePage() {
  const isMobile = useIsMobile()

  // Budget calculation
  const publishedToday = 14
  const budgetLimit = 20

  // Group items by column
  const itemsByColumn = columnConfig.reduce<Record<QueueColumnType, QueueItem[]>>((acc, col) => {
    acc[col.key] = mockQueueItems.filter((item) => item.column === col.key)
    return acc
  }, {} as Record<QueueColumnType, QueueItem[]>)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* ── Budget Indicator ───────────────────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-medium text-zinc-300">Daily Budget</span>
          </div>
          <span className="text-sm tabular-nums">
            <span className="text-emerald-400 font-semibold">{publishedToday}</span>
            <span className="text-zinc-600">/{budgetLimit}</span>
            <span className="text-zinc-500 text-xs ml-1">assets published</span>
          </span>
        </div>
        <Progress
          value={(publishedToday / budgetLimit) * 100}
          className="h-2 bg-zinc-800 [&>div]:bg-emerald-500"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-zinc-600">{budgetLimit - publishedToday} slots remaining</span>
          <span className="text-[10px] text-zinc-600">{Math.round((publishedToday / budgetLimit) * 100)}% utilized</span>
        </div>
      </div>

      {/* ── Pipeline Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'In Progress', count: mockQueueItems.filter((i) => i.column === 'generating').length, color: 'text-violet-400' },
          { label: 'In Review', count: mockQueueItems.filter((i) => i.column === 'review').length, color: 'text-blue-400' },
          { label: 'Approved', count: mockQueueItems.filter((i) => i.column === 'approved').length, color: 'text-emerald-400' },
          { label: 'Publishing', count: mockQueueItems.filter((i) => i.column === 'publishing').length, color: 'text-cyan-400' },
          { label: 'Measuring', count: mockQueueItems.filter((i) => i.column === 'measuring').length, color: 'text-amber-400' },
          { label: 'Completed', count: mockQueueItems.filter((i) => i.column === 'done').length, color: 'text-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900/40 border border-zinc-800/30 rounded-md px-3 py-2 text-center">
            <div className={cn('text-lg font-bold tabular-nums', stat.color)}>{stat.count}</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Kanban Board / Mobile List ─────────────────────────────── */}
      {isMobile ? (
        <MobileQueueList items={mockQueueItems} />
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4 min-h-[500px]">
            {columnConfig.map((col) => (
              <KanbanColumn
                key={col.key}
                config={col}
                items={itemsByColumn[col.key]}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </motion.div>
  )
}
