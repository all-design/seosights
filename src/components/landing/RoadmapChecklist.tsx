'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ListChecks,
  CheckCircle2,
  Circle,
  Loader,
  Wrench,
  Bot,
  PenTool,
  Rocket,
} from 'lucide-react'

type TaskStatus = 'done' | 'in-progress' | 'pending'

interface RoadmapTask {
  text: string
  status: TaskStatus
}

interface RoadmapWeek {
  week: number
  theme: string
  icon: typeof Wrench
  accent: string
  badgeClass: string
  iconColor: string
  iconBg: string
  border: string
  progress: number
  tasks: RoadmapTask[]
}

const weeks: RoadmapWeek[] = [
  {
    week: 1,
    theme: 'Technical Foundation',
    icon: Wrench,
    accent: 'emerald',
    badgeClass:
      'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    progress: 100,
    tasks: [
      { text: 'Generate llms.txt', status: 'done' },
      { text: 'Unblock GPTBot / ClaudeBot', status: 'done' },
      { text: 'Fix meta tags', status: 'done' },
      { text: 'Submit sitemap', status: 'done' },
    ],
  },
  {
    week: 2,
    theme: 'AI Accessibility',
    icon: Bot,
    accent: 'cyan',
    badgeClass: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    border: 'border-cyan-500/40',
    progress: 75,
    tasks: [
      { text: 'Add FAQ schema', status: 'done' },
      { text: 'Create answer blocks', status: 'done' },
      { text: 'Optimize for PAA', status: 'done' },
      { text: 'Deploy llms-full.txt', status: 'in-progress' },
    ],
  },
  {
    week: 3,
    theme: 'Content & Authority',
    icon: PenTool,
    accent: 'amber',
    badgeClass: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    progress: 50,
    tasks: [
      { text: 'Publish 3 entity articles', status: 'done' },
      { text: 'Build Wikipedia mention', status: 'done' },
      { text: 'Reddit AMA', status: 'pending' },
      { text: 'Knowledge Graph submission', status: 'pending' },
    ],
  },
  {
    week: 4,
    theme: 'Scale & Dominate',
    icon: Rocket,
    accent: 'purple',
    badgeClass: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    border: 'border-purple-500/40',
    progress: 25,
    tasks: [
      { text: 'Competitor citation gap', status: 'done' },
      { text: 'Backlink outreach', status: 'pending' },
      { text: 'Schema expansion', status: 'pending' },
      { text: 'Monthly review', status: 'pending' },
    ],
  },
]

// ── Per-status icon renderer ─────────────────────────────────────────────
function TaskIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
  }
  if (status === 'in-progress') {
    return <Loader className="w-5 h-5 text-amber-400 shrink-0 animate-spin [animation-duration:3s]" />
  }
  return <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
}

// ── Connecting progress indicator (Week 2 of 4) ──────────────────────────
function OverallProgress({ isInView }: { isInView: boolean }) {
  const currentWeek = 2
  const segmentPct = 100 / weeks.length
  const overallPct = ((currentWeek - 0.5) / weeks.length) * 100 // ~37.5%
  const accentColors = [
    'from-emerald-500 to-cyan-500',
    'from-cyan-500 to-amber-500',
    'from-amber-500 to-purple-500',
    'from-purple-500 to-purple-700',
  ]

  return (
    <motion.div
      className="mb-10 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-muted-foreground">Overall roadmap progress</span>
        <span className="font-semibold text-foreground">
          Week{' '}
          <span className="text-purple-400">{currentWeek}</span> of{' '}
          {weeks.length}
        </span>
      </div>
      {/* Segmented progress bar */}
      <div className="relative h-2.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${overallPct}%` } : { width: 0 }}
          transition={{ duration: 1.1, delay: 0.6, ease: 'easeInOut' }}
        />
        {/* Week tick markers */}
        <div className="absolute inset-0 flex">
          {weeks.map((w, i) => (
            <div
              key={i}
              className={`flex-1 border-r ${
                i === weeks.length - 1 ? 'border-r-0' : 'border-white/10'
              }`}
            />
          ))}
        </div>
      </div>
      {/* Week labels under bar */}
      <div className="grid grid-cols-4 mt-2">
        {weeks.map((w, i) => (
          <div
            key={w.week}
            className={`text-center text-xs ${
              i < currentWeek
                ? 'text-foreground font-medium'
                : 'text-muted-foreground/60'
            }`}
          >
            W{w.week}
          </div>
        ))}
      </div>
      {/* Hidden helper so accentColors is referenced (kept for future gradient theming) */}
      <span className="sr-only">{accentColors.join(',')}</span>
    </motion.div>
  )
}

// ── Per-week card ─────────────────────────────────────────────────────────
function WeekCard({ wk, index, isInView }: { wk: RoadmapWeek; index: number; isInView: boolean }) {
  const doneCount = wk.tasks.filter((t) => t.status === 'done').length
  const total = wk.tasks.length

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
    >
      <Card
        className={`bg-white/5 backdrop-blur-sm border-white/10 border-t-4 ${wk.border} hover:bg-white/8 transition-all duration-300 h-full`}
      >
        <CardContent className="p-5 sm:p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-lg ${wk.iconBg} flex items-center justify-center shrink-0`}
            >
              <wk.icon className={`w-5 h-5 ${wk.iconColor}`} />
            </div>
            <div className="min-w-0">
              <Badge
                variant="outline"
                className={`mb-1 ${wk.badgeClass}`}
              >
                Week {wk.week}
              </Badge>
              <p className="text-sm font-semibold text-foreground truncate">
                {wk.theme}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <ul className="space-y-3 flex-1 mb-4">
            {wk.tasks.map((task, ti) => (
              <motion.li
                key={task.text}
                className="flex items-start gap-2.5 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={
                  isInView
                    ? task.status === 'done'
                      ? { opacity: 1, x: 0, scale: [0.9, 1.05, 1] }
                      : { opacity: 1, x: 0 }
                    : { opacity: 0, x: -10 }
                }
                transition={{
                  duration: 0.4,
                  delay: 0.4 + index * 0.15 + ti * 0.08,
                }}
              >
                <TaskIcon status={task.status} />
                <span
                  className={`leading-snug ${
                    task.status === 'done'
                      ? 'text-foreground line-through decoration-emerald-500/40 decoration-1'
                      : task.status === 'in-progress'
                        ? 'text-amber-300/90'
                        : 'text-muted-foreground'
                  }`}
                >
                  {task.text}
                  {task.status === 'in-progress' && (
                    <span className="ml-1.5 text-xs text-amber-400/70">
                      (in progress)
                    </span>
                  )}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">
                {doneCount}/{total} complete
              </span>
              <span className={`font-semibold ${wk.iconColor}`}>
                {wk.progress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${
                  wk.accent === 'emerald'
                    ? 'from-emerald-500 to-emerald-400'
                    : wk.accent === 'cyan'
                      ? 'from-cyan-500 to-cyan-400'
                      : wk.accent === 'amber'
                        ? 'from-amber-500 to-amber-400'
                        : 'from-purple-500 to-purple-400'
                }`}
                initial={{ width: 0 }}
                animate={
                  isInView ? { width: `${wk.progress}%` } : { width: 0 }
                }
                transition={{
                  duration: 0.9,
                  delay: 0.5 + index * 0.15,
                  ease: 'easeOut',
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function RoadmapChecklist() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="roadmap">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-emerald-500/50 text-emerald-400 bg-emerald-500/10 backdrop-blur-sm mb-6"
          >
            <ListChecks className="w-3.5 h-3.5" />
            90-Day Roadmap
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Your First{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              90 Days
            </span>
            , Planned and Tracked
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every analysis generates a week-by-week execution plan. Check off
            tasks as your AI agents complete them — and watch your visibility
            climb.
          </p>
        </motion.div>

        {/* Overall progress indicator */}
        <OverallProgress isInView={isInView} />

        {/* Week cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {weeks.map((wk, i) => (
            <WeekCard
              key={wk.week}
              wk={wk}
              index={i}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
