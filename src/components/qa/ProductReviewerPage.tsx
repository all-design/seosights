'use client'

import { motion } from 'framer-motion'
import {
  Package,
  HelpCircle,
  Minus,
  Lightbulb,
  Trash2,
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

// ── Mock Data ──────────────────────────────────────────────────────────

const productQuestions = [
  {
    question: 'Does this make sense?',
    answer: 'Mostly, but the pricing page is confusing. Users don\'t understand the difference between tiers.',
    severity: 'major',
  },
  {
    question: 'Is this necessary?',
    answer: '3 dashboard sections could be merged. The "Insights" tab duplicates content from "Analytics".',
    severity: 'major',
  },
  {
    question: 'Is this complicated?',
    answer: 'Onboarding has too many steps. 7 steps for what could be done in 3. Users drop off at step 4.',
    severity: 'critical',
  },
  {
    question: 'Would I pay for this?',
    answer: 'Yes, but I\'d need to see value faster. The aha moment is buried 4 screens deep.',
    severity: 'medium',
  },
  {
    question: 'Does this feel trustworthy?',
    answer: 'Mostly, but missing SOC2 badge and SLA page hurts enterprise trust.',
    severity: 'medium',
  },
]

const unnecessaryFeatures = [
  { feature: 'Widget customizer', reason: 'Used by <2% of users. 3 support tickets ever.', impact: 'low' },
  { feature: 'Export to XML', reason: 'Nobody exports to XML anymore. CSV and JSON cover 99% of use cases.', impact: 'low' },
  { feature: 'Theme preview mode', reason: 'Duplicate of "Live Preview". Confusing to have both.', impact: 'medium' },
  { feature: 'Notification sounds', reason: 'Default is off. Only 0.5% ever enable. Not worth maintenance.', impact: 'low' },
]

const simplificationOpportunities = [
  { area: 'Onboarding', current: '7 steps with 12 fields', simplified: '3 steps with 5 fields', savings: '57% fewer drop-offs expected' },
  { area: 'Dashboard', current: '3 tabs, 12 cards', simplified: '1 smart view with 6 cards', savings: '40% less cognitive load' },
  { area: 'Settings', current: '8 sections across 2 pages', simplified: '5 sections, 1 page with search', savings: '60% faster to find setting' },
  { area: 'Pricing page', current: '4 tiers + custom', simplified: '3 tiers with clear comparison', savings: '25% more conversions expected' },
  { area: 'Navigation', current: '12 top-level items', simplified: '6 items + "More" dropdown', savings: '35% fewer misclicks' },
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
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'major': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'minor': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  }
}

// ── Main Product Reviewer Page ─────────────────────────────────────────

export function ProductReviewerPage() {
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
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Package className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Product Review Score</p>
                <span className="text-5xl font-bold text-blue-400 tracking-tighter">85</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Product Questions (Q&A Cards) ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Product Questions</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">AI-powered product review questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-blue-400">Q</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-zinc-200">{q.question}</p>
                      <div className="flex items-start gap-2 mt-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-400">{q.answer}</p>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${getSeverityStyle(q.severity)}`}>
                          {q.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Unnecessary Features ───────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Unnecessary Features</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">Features that add complexity without value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unnecessaryFeatures.map((f, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                  <Minus className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-200">{f.feature}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${f.impact === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'}`}>
                        {f.impact} impact
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{f.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Simplification Opportunities ───────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Simplification Opportunities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {simplificationOpportunities.map((s, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-200">{s.area}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">{s.savings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400/70 line-through">{s.current}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs text-emerald-400">{s.simplified}</span>
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
