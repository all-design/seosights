'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckSquare, ArrowRight, AlertTriangle, ArrowUp, Zap, Flame } from 'lucide-react'

// ── Sample Task Data ────────────────────────────────────────
interface ActionTask {
  id: string
  emoji: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  scoreGain: number
  category: string
}

const TASKS: ActionTask[] = [
  {
    id: '1',
    emoji: '📄',
    title: 'Create llms.txt at site root',
    description: 'Add a machine-readable llms.txt file so AI crawlers can parse your content structure.',
    priority: 'critical',
    scoreGain: 5,
    category: 'Crawlability',
  },
  {
    id: '2',
    emoji: '❓',
    title: 'Add FAQ schema to top 10 pages',
    description: 'FAQ schema helps AI engines extract direct answers, increasing your citation probability by ~30%.',
    priority: 'critical',
    scoreGain: 4,
    category: 'Schema',
  },
  {
    id: '3',
    emoji: '👤',
    title: 'Add author bios with E-E-A-T signals',
    description: 'Author entities strengthen trust signals — link to LinkedIn profiles and credentials.',
    priority: 'high',
    scoreGain: 3,
    category: 'Authority',
  },
  {
    id: '4',
    emoji: '💬',
    title: 'Answer 3 Reddit threads in your niche',
    description: 'Reddit is heavily cited by AI engines. Thoughtful answers drive direct citation volume.',
    priority: 'high',
    scoreGain: 2,
    category: 'Citations',
  },
  {
    id: '5',
    emoji: '⭐',
    title: 'Get 2 new G2 reviews this week',
    description: 'Review volume is a top-5 signal for ChatGPT recommendations. Aim for 3+ new reviews/month.',
    priority: 'medium',
    scoreGain: 2,
    category: 'Reviews',
  },
  {
    id: '6',
    emoji: '✏️',
    title: 'Update thin content on /features page',
    description: 'Pages under 800 words are rarely cited. Expand with specifics and examples.',
    priority: 'low',
    scoreGain: 1,
    category: 'Content',
  },
]

const PRIORITY_CONFIG: Record<string, { bg: string; border: string; color: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { bg: 'bg-red-500/5', border: 'border-red-500/20', color: 'text-red-400', icon: AlertTriangle, label: 'Critical' },
  high: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', color: 'text-amber-400', icon: ArrowUp, label: 'High' },
  medium: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', color: 'text-emerald-400', icon: Zap, label: 'Medium' },
  low: { bg: 'bg-slate-500/5', border: 'border-slate-500/20', color: 'text-muted-foreground', icon: Flame, label: 'Low' },
}

const TOTAL_GAIN = TASKS.reduce((sum, t) => sum + t.scoreGain, 0)

// ── Component ───────────────────────────────────────────────
export default function AIActionCenterSection({ onStartFree }: { onStartFree: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const toggleTask = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const completedGain = TASKS.filter((t) => completedIds.has(t.id)).reduce((sum, t) => sum + t.scoreGain, 0)
  const gainPct = TOTAL_GAIN > 0 ? (completedGain / TOTAL_GAIN) * 100 : 0

  return (
    <section id="action-center" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/8 to-background" />
      <div className="absolute -top-20 right-1/3 w-[450px] h-[350px] rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-5 border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            Action Center
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Today&apos;s Tasks to{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              Improve Your Score
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-generated action items with estimated score impact — check them off and watch your visibility grow
          </p>
        </motion.div>

        {/* Action center card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-emerald-500/20 bg-black/30 backdrop-blur-sm overflow-hidden">
            {/* Card header with progress */}
            <div className="p-4 sm:p-5 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Daily Action Items</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {completedIds.size} of {TASKS.length} completed
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold"
                >
                  +{completedGain} pts gained today
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${gainPct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {completedGain}/{TOTAL_GAIN} pts
                </span>
              </div>
            </div>

            {/* Task list */}
            <div className="p-3 sm:p-4 space-y-2 max-h-[520px] overflow-y-auto">
              <AnimatePresence>
                {TASKS.map((task, i) => {
                  const isCompleted = completedIds.has(task.id)
                  const pConfig = PRIORITY_CONFIG[task.priority]
                  const PriorityIcon = pConfig.icon
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={isInView ? { opacity: isCompleted ? 0.5 : 1, y: 0 } : {}}
                      transition={{ duration: 0.35, delay: 0.25 + i * 0.06 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${pConfig.bg} ${pConfig.border} ${
                        isCompleted ? 'line-through' : ''
                      } transition-opacity`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        className="mt-0.5 shrink-0"
                        onClick={() => toggleTask(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleTask(task.id)}
                      >
                        <Checkbox checked={isCompleted} className="pointer-events-none" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-sm">{task.emoji}</span>
                          <span
                            className={`text-sm font-medium ${
                              isCompleted ? 'text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {task.title}
                          </span>
                          <PriorityIcon className={`h-3 w-3 ${pConfig.color}`} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          >
                            +{task.scoreGain} pts
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${pConfig.bg} ${pConfig.color} ${pConfig.border}`}
                          >
                            {pConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10">
                            {task.category}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Card footer */}
            <div className="p-4 border-t border-white/5 flex items-center justify-center">
              <Button
                variant="ghost"
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-sm"
                onClick={onStartFree}
              >
                Get personalized tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            New tasks generated daily based on your AI visibility data — no guessing, just action
          </p>
          <Button
            size="lg"
            onClick={onStartFree}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-12 px-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            Start improving <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
