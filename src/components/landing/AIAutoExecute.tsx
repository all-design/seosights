'use client'

import { useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Bot,
  UserCheck,
  Rocket,
  Sparkles,
  FileText,
  Code,
  Globe,
  Settings,
  Image,
  Type,
} from 'lucide-react'

// ── Mock execution actions ───────────────────────────────────────────────
interface ExecutionAction {
  id: string
  icon: React.ElementType
  label: string
  detail: string
  status: 'recommended' | 'approved' | 'executed'
  platform: 'wordpress' | 'webflow'
  time: string
}

const mockActions: ExecutionAction[] = [
  { id: '1', icon: FileText, label: 'Add FAQ Schema', detail: 'Added FAQ structured data to /services page', status: 'executed', platform: 'wordpress', time: '2.1s' },
  { id: '2', icon: Code, label: 'Generate llms.txt', detail: 'Created llms.txt with 47 content URLs', status: 'executed', platform: 'wordpress', time: '1.8s' },
  { id: '3', icon: Type, label: 'Optimize H2 Tags', detail: 'Updated 3 heading tags for AI readability', status: 'executed', platform: 'webflow', time: '3.2s' },
  { id: '4', icon: Image, label: 'Add Alt Text', detail: 'Generated alt text for 12 images on /gallery', status: 'approved', platform: 'wordpress', time: '—' },
  { id: '5', icon: Globe, label: 'Update Meta Descriptions', detail: 'Optimized 5 meta descriptions for AI citation', status: 'recommended', platform: 'webflow', time: '—' },
  { id: '6', icon: Settings, label: 'Fix robots.txt', detail: 'Allow GPTBot and ClaudeBot access', status: 'recommended', platform: 'wordpress', time: '—' },
]

// ── Workflow steps ────────────────────────────────────────────────────────
const workflowSteps = [
  {
    icon: Bot,
    label: 'AI Recommends',
    description: 'Engine analyzes gaps & generates actions',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
  },
  {
    icon: UserCheck,
    label: 'You Approve',
    description: 'One-click review & approve recommendations',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
  },
  {
    icon: Rocket,
    label: 'Auto-Executed',
    description: 'Changes deployed directly to your CMS',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
]

// ── Stats ─────────────────────────────────────────────────────────────────
const stats = [
  { label: 'Actions This Month', value: '127', icon: Zap, color: 'text-emerald-400' },
  { label: 'Avg. Execution', value: '2.3s', icon: Clock, color: 'text-cyan-400' },
  { label: 'Success Rate', value: '99.2%', icon: CheckCircle2, color: 'text-purple-400' },
]

interface AIAutoExecuteProps {
  onStartFree?: () => void
}

export default function AIAutoExecute({ onStartFree }: AIAutoExecuteProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [visibleActions, setVisibleActions] = useState(0)

  // Stagger-reveal the live feed
  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => {
      setVisibleActions((prev) => {
        if (prev >= mockActions.length) {
          clearInterval(timer)
          return prev
        }
        return prev + 1
      })
    }, 500)
    return () => clearInterval(timer)
  }, [isInView])

  return (
    <section className="py-24 relative" ref={ref} id="ai-auto-execute">
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
            <Rocket className="w-3.5 h-3.5" />
            Auto Execute™
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            One-Click{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              CMS Execution
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI recommends changes, you approve them, and they&apos;re deployed automatically. No copy-paste. No developer needed.
          </p>
        </motion.div>

        {/* 3-Panel Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          {workflowSteps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
            >
              <Card className={`bg-white/[0.03] backdrop-blur-xl border-white/10 border-l-4 ${step.border} h-full`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Step {i + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{step.label}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {/* Arrow between steps on desktop */}
                  {i < 2 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main content: Live feed + stats */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Live execution feed */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10">
              <CardContent className="p-4 sm:p-6">
                {/* Feed header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Live Execution Feed
                    </span>
                  </div>
                  {/* Platform badges */}
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                      WordPress
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                      Webflow
                    </Badge>
                  </div>
                </div>

                {/* Feed items */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {mockActions.slice(0, visibleActions).map((action) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        action.status === 'executed'
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : action.status === 'approved'
                            ? 'bg-cyan-500/5 border-cyan-500/20'
                            : 'bg-white/[0.02] border-white/10'
                      }`}
                    >
                      {/* Status indicator */}
                      <div className="shrink-0">
                        {action.status === 'executed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : action.status === 'approved' ? (
                          <UserCheck className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Bot className="w-5 h-5 text-purple-400" />
                        )}
                      </div>

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <action.icon className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{action.label}</span>
                          <Badge
                            className={`text-[9px] px-1.5 py-0 h-4 ${
                              action.status === 'executed'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : action.status === 'approved'
                                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            }`}
                          >
                            {action.status === 'executed' ? 'DONE' : action.status === 'approved' ? 'QUEUED' : 'NEW'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{action.detail}</p>
                      </div>

                      {/* Meta */}
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground capitalize">{action.platform}</div>
                        {action.time !== '—' && (
                          <div className="text-xs font-mono text-emerald-400">{action.time}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
              >
                <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Integration logos card */}
            <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Integrations
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span className="text-xs font-medium text-blue-400">WordPress</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <span className="text-xs font-medium text-emerald-400">Webflow</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-base px-8 py-5 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            Enable Auto Execute
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
