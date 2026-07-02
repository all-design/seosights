'use client'

import { motion } from 'framer-motion'
import {
  Palette,
  Image as ImageIcon,
  AlignHorizontalSpaceAround,
  Sparkles,
  Route,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// ── Mock Data ──────────────────────────────────────────────────────────

const uxIssues = [
  { id: 1, element: 'Homepage hero section', description: 'Hero section has 3 competing CTAs. Users don\'t know which to click.', severity: 'major' },
  { id: 2, element: 'Settings page layout', description: 'Settings form is too wide on desktop. Feels stretched and hard to scan.', severity: 'medium' },
  { id: 3, element: 'Mobile navigation', description: 'Hamburger menu items are too close together. Touch targets under 44px.', severity: 'major' },
  { id: 4, element: 'Dashboard cards', description: 'Cards have inconsistent border radius — some 8px, some 12px.', severity: 'minor' },
]

const spacingIssues = [
  { location: 'Header → Hero', current: '0px', recommended: '24px', severity: 'major' },
  { location: 'Section gaps', current: '48px', recommended: '32px', severity: 'medium' },
  { location: 'Card padding', current: '12px', recommended: '24px', severity: 'major' },
  { location: 'Button to text', current: '4px', recommended: '8px', severity: 'minor' },
  { location: 'Footer spacing', current: '80px', recommended: '48px', severity: 'minor' },
]

const animationIssues = [
  { element: 'Modal open', issue: 'No animation — appears instantly, feels jarring', severity: 'medium' },
  { element: 'Page transitions', issue: 'No transition between pages, feels like a static site', severity: 'minor' },
  { element: 'Dropdown menus', issue: 'Appear instantly, should have a subtle fade + slide', severity: 'minor' },
  { element: 'Loading states', issue: 'Content jumps in when loaded — use skeleton instead', severity: 'major' },
]

const confusingFlows = [
  { step: 1, flow: 'Onboarding', issue: '7 steps to complete — industry standard is 3', clickCount: 7, recommended: 3 },
  { step: 2, flow: 'Settings → Profile', issue: 'Two separate pages that should be one', clickCount: 4, recommended: 2 },
  { step: 3, flow: 'Upgrade flow', issue: 'Pricing → Select → Confirm → Payment — too many steps', clickCount: 5, recommended: 3 },
  { step: 4, flow: 'Create project', issue: 'Hidden behind 2 dropdowns and a modal', clickCount: 4, recommended: 2 },
]

// ── Animation variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'major': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'minor': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  }
}

// ── Main UX Reviewer Page ──────────────────────────────────────────────

export function UXReviewerPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Score ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <Palette className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">UX Review Score</p>
                <span className="text-5xl font-bold text-violet-400 tracking-tighter">88</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── UX Issues (Cards with screenshot placeholder) ──────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">UX Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uxIssues.map((issue) => (
                <div key={issue.id} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                  {/* Screenshot placeholder */}
                  <div className="w-full h-24 rounded-md bg-zinc-800/50 border border-zinc-700/30 mb-3 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-zinc-700" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-200">{issue.element}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${getSeverityStyle(issue.severity)}`}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500">{issue.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Spacing Issues ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlignHorizontalSpaceAround className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Spacing Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="h-[220px]">
              <div className="px-2 space-y-1">
                {spacingIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${issue.severity === 'major' ? 'text-orange-400' : issue.severity === 'medium' ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span className="text-xs text-zinc-300 flex-1">{issue.location}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400/70 line-through font-mono">{issue.current}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-emerald-400 font-mono">{issue.recommended}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Animation Issues ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Animation Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="space-y-1 px-2">
              {animationIssues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border shrink-0 mt-0.5 ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity}
                  </Badge>
                  <div>
                    <span className="text-xs font-medium text-zinc-300">{issue.element}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">{issue.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Confusing Flows / Click Count Analysis ─────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Confusing Flows</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">Click count analysis — fewer is better</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confusingFlows.map((flow) => (
                <div key={flow.step} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-200">{flow.flow}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-400 font-mono">{flow.clickCount} clicks</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-emerald-400 font-mono">{flow.recommended} clicks</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">{flow.issue}</p>
                  {/* Visual click comparison */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400/50 rounded-full" style={{ width: `${(flow.clickCount / 10) * 100}%` }} />
                    </div>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400/50 rounded-full" style={{ width: `${(flow.recommended / 10) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-600">Current</span>
                    <span className="text-[10px] text-zinc-600">Recommended</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
