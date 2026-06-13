'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import {
  ChevronRight,
  Code2,
  Eye,
  Sparkles,
  CheckCircle2,
  Lock,
  Play,
  Clock,
} from 'lucide-react'

// ── Task & Week Types ─────────────────────────────────────────
type TaskStatus = 'in_progress' | 'locked' | 'completed' | 'pending'

interface StrategyTask {
  id: string
  title: string
  agentName: string
  agentEmoji: string
  status: TaskStatus
  pillar: 'seo' | 'aeo' | 'geo' | 'all'
  actionLabel?: string
  actionType?: 'generate_code' | 'view_change' | 'approve'
}

interface StrategyWeek {
  weekNumber: number
  title: string
  focus: string
  status: 'in_progress' | 'locked' | 'completed' | 'upcoming'
  tasks: StrategyTask[]
  pillar: 'seo' | 'aeo' | 'geo' | 'all'
}

// ── Demo Strategy Data ────────────────────────────────────────
function getStrategyWeeks(): StrategyWeek[] {
  return [
    {
      weekNumber: 1,
      title: 'Week 1',
      focus: 'GEO & Tech Foundation',
      status: 'in_progress',
      pillar: 'geo',
      tasks: [
        {
          id: 'w1t1',
          title: 'Create and deploy llms.txt file in root directory',
          agentName: 'Tech & Schema',
          agentEmoji: '⚙️',
          status: 'in_progress',
          pillar: 'geo',
          actionLabel: 'Generate Code',
          actionType: 'generate_code',
        },
        {
          id: 'w1t2',
          title: 'Unblock GPTBot and ClaudeBot in robots.txt',
          agentName: 'On-Page Auditor',
          agentEmoji: '🔍',
          status: 'pending',
          pillar: 'seo',
          actionLabel: 'View Change',
          actionType: 'view_change',
        },
        {
          id: 'w1t3',
          title: 'Add Organization schema markup with AI-crawler hints',
          agentName: 'Tech & Schema',
          agentEmoji: '⚙️',
          status: 'pending',
          pillar: 'geo',
          actionLabel: 'Generate Code',
          actionType: 'generate_code',
        },
      ],
    },
    {
      weekNumber: 2,
      title: 'Week 2',
      focus: 'AEO & Content Optimization',
      status: 'locked',
      pillar: 'aeo',
      tasks: [
        {
          id: 'w2t1',
          title: 'Rewrite FAQ section on services page into 40-60 word answers for Perplexity',
          agentName: 'Content Architect',
          agentEmoji: '🏗️',
          status: 'locked',
          pillar: 'aeo',
        },
        {
          id: 'w2t2',
          title: 'Create "People Also Ask" answer blocks for top 10 keywords',
          agentName: 'Content Architect',
          agentEmoji: '🏗️',
          status: 'locked',
          pillar: 'aeo',
        },
        {
          id: 'w2t3',
          title: 'Optimize meta descriptions for AI snippet extraction',
          agentName: 'On-Page Auditor',
          agentEmoji: '🔍',
          status: 'locked',
          pillar: 'seo',
        },
      ],
    },
    {
      weekNumber: 3,
      title: 'Week 3',
      focus: 'Authority & Link Building',
      status: 'locked',
      pillar: 'seo',
      tasks: [
        {
          id: 'w3t1',
          title: 'Outreach to 15 high-authority sites for guest posts',
          agentName: 'Backlink Prospector',
          agentEmoji: '🤝',
          status: 'locked',
          pillar: 'seo',
        },
        {
          id: 'w3t2',
          title: 'Create linkable asset — Original research report',
          agentName: 'Content Architect',
          agentEmoji: '🏗️',
          status: 'locked',
          pillar: 'all',
        },
      ],
    },
    {
      weekNumber: 4,
      title: 'Week 4',
      focus: 'Measurement & Iteration',
      status: 'locked',
      pillar: 'all',
      tasks: [
        {
          id: 'w4t1',
          title: 'Run full 8-agent re-audit and compare with Week 1 baseline',
          agentName: 'Master Director',
          agentEmoji: '🎯',
          status: 'locked',
          pillar: 'all',
        },
        {
          id: 'w4t2',
          title: 'Adjust 90-day plan based on AI citation improvements',
          agentName: 'Master Director',
          agentEmoji: '🎯',
          status: 'locked',
          pillar: 'all',
        },
      ],
    },
  ]
}

// ── Pillar Colors ─────────────────────────────────────────────
function getPillarColors(pillar: string) {
  const map: Record<string, { dot: string; bg: string; border: string; text: string }> = {
    seo: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    aeo: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    geo: { dot: 'bg-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    all: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  }
  return map[pillar] || map.all
}

// ── Task Status Badge ─────────────────────────────────────────
function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; className: string }> = {
    in_progress: { label: 'In Progress', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    locked: { label: 'Locked', className: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
    completed: { label: 'Done', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    pending: { label: 'Pending', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${c.className}`}>
      {c.label}
    </Badge>
  )
}

// ── Week Status Badge ─────────────────────────────────────────
function WeekStatusBadge({ status }: { status: StrategyWeek['status'] }) {
  const config: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    in_progress: { label: 'In Progress', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <Play className="w-3 h-3" /> },
    locked: { label: 'Locked', className: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: <Lock className="w-3 h-3" /> },
    completed: { label: 'Completed', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
    upcoming: { label: 'Upcoming', className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', icon: <Clock className="w-3 h-3" /> },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider gap-1 ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function StrategyRoadmap() {
  const { analysis, mode } = useAppStore()
  const weeks = getStrategyWeeks()
  const isCoPilot = mode === 'co-pilot'
  const [expandedWeek, setExpandedWeek] = useState<number>(1)

  // Timeline connector line
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <CardContent className="pt-6 pb-4 px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                90-Day Strategy Roadmap
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-generated plan — executed week by week
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase text-purple-400 bg-purple-500/10 border-purple-500/30"
            >
              AI-Planned
            </Badge>
          </div>

          {/* Timeline Layout */}
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/40 via-indigo-500/20 to-transparent hidden md:block" />

            <div className="space-y-4">
              {weeks.map((week, wi) => {
                const pillarColors = getPillarColors(week.pillar)
                const isExpanded = expandedWeek === week.weekNumber
                const isLocked = week.status === 'locked'

                return (
                  <motion.div
                    key={week.weekNumber}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + wi * 0.1 }}
                  >
                    {/* Week Header — clickable */}
                    <button
                      onClick={() => !isLocked && setExpandedWeek(isExpanded ? -1 : week.weekNumber)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                        isLocked
                          ? 'border-white/5 bg-white/[0.01] opacity-60'
                          : isExpanded
                          ? `border-${week.pillar === 'geo' ? 'indigo' : week.pillar === 'aeo' ? 'blue' : 'purple'}-500/20 ${pillarColors.bg}`
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 shrink-0 relative z-10">
                        {week.status === 'in_progress' ? (
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        ) : week.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>

                      {/* Week Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">
                            {week.title}
                          </span>
                          <span className={`text-xs font-semibold ${pillarColors.text}`}>
                            Focus: {week.focus}
                          </span>
                        </div>
                      </div>

                      {/* Status + Expand */}
                      <div className="flex items-center gap-3 shrink-0">
                        <WeekStatusBadge status={week.status} />
                        {!isLocked && (
                          <ChevronRight
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        )}
                      </div>
                    </button>

                    {/* Expanded Tasks */}
                    <AnimatePresence>
                      {isExpanded && !isLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-0 md:ml-[52px] mt-2 space-y-2">
                            {week.tasks.map((task, ti) => {
                              const taskPillarColors = getPillarColors(task.pillar)
                              return (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: ti * 0.05 }}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                    task.status === 'in_progress'
                                      ? `${taskPillarColors.bg} ${taskPillarColors.border}`
                                      : 'border-white/5 bg-white/[0.01]'
                                  }`}
                                >
                                  {/* Agent Emoji */}
                                  <span className="text-base shrink-0">{task.agentEmoji}</span>

                                  {/* Task Title */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${
                                      task.status === 'locked'
                                        ? 'text-muted-foreground'
                                        : 'text-foreground'
                                    }`}>
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-muted-foreground">
                                        Agent: {task.agentName}
                                      </span>
                                      <span className={`w-1.5 h-1.5 rounded-full ${taskPillarColors.dot}`} />
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <TaskStatusBadge status={task.status} />

                                  {/* Action Button */}
                                  {task.actionLabel && task.status !== 'locked' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className={`text-xs font-semibold shrink-0 ${
                                        task.actionType === 'generate_code'
                                          ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                                          : task.actionType === 'view_change'
                                          ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                                          : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                                      }`}
                                    >
                                      {task.actionType === 'generate_code' ? (
                                        <Code2 className="w-3 h-3 mr-1.5" />
                                      ) : task.actionType === 'view_change' ? (
                                        <Eye className="w-3 h-3 mr-1.5" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                      )}
                                      {task.actionLabel}
                                    </Button>
                                  )}
                                </motion.div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
