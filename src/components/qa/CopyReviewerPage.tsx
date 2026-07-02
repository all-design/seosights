'use client'

import { motion } from 'framer-motion'
import {
  Type,
  FileText,
  MessageSquare,
  AlertTriangle,
  DollarSign,
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

const copyIssues = [
  { page: 'Homepage', element: 'Hero H1', current: 'Leverage AI to leverage your leverage', suggestion: 'Get found by AI, not just search engines', severity: 'critical' },
  { page: 'Homepage', element: 'Subheadline', current: 'We provide a comprehensive suite of solutions', suggestion: 'AI visibility audit in 60 seconds', severity: 'major' },
  { page: 'Pricing', element: 'CTA button', current: 'Submit', suggestion: 'Start Free Trial', severity: 'major' },
  { page: 'Features', element: 'Section title', current: 'Our Features', suggestion: 'What you\'ll love', severity: 'minor' },
  { page: 'Dashboard', element: 'Empty state', current: 'No data available', suggestion: 'Connect your first site to see insights', severity: 'major' },
  { page: 'Settings', element: 'Save button', current: 'Apply Changes', suggestion: 'Save Settings', severity: 'minor' },
  { page: 'Onboarding', element: 'Step title', current: 'Step 1 of 7', suggestion: 'Tell us about your site', severity: 'medium' },
  { page: 'Error page', element: '404 message', current: 'Page not found', suggestion: 'Oops! This page got lost in the AI', severity: 'minor' },
]

const heroAnalysis = {
  headline: 'Leverage AI to leverage your leverage',
  issues: [
    'Uses "leverage" 3 times — jargon overload',
    'Doesn\'t say what the product does',
    'No emotional hook or urgency',
  ],
  recommendation: '"Get found by AI, not just search engines" — clear, specific, and differentiated',
  score: 32,
}

const buttonCopy = [
  { current: 'Submit', location: 'Pricing form', issue: 'Vague, no value proposition', suggestion: 'Start Free Trial' },
  { current: 'Click Here', location: 'Email footer', issue: 'A11y issue, no context', suggestion: 'View Your Report' },
  { current: 'Learn More', location: 'Features section', issue: 'Overused, low commitment', suggestion: 'See How It Works' },
  { current: 'Next', location: 'Onboarding steps', issue: 'No progress indication', suggestion: 'Continue (2/7)' },
  { current: 'OK', location: 'Modal dialogs', issue: 'Too dismissive', suggestion: 'Got It' },
]

const errorMessages = [
  { current: 'An error occurred', context: 'Generic API failure', suggestion: 'Something went wrong. Try again or contact support.' },
  { current: 'Invalid input', context: 'Form validation', suggestion: 'Please enter a valid email address.' },
  { current: '403', context: 'Permission denied', suggestion: 'You don\'t have access to this. Ask your admin for permission.' },
  { current: 'Session expired', context: 'Auth timeout', suggestion: 'Your session has expired. Please sign in again.' },
]

const pricingCopy = {
  strengths: ['Clear tier names', 'Annual discount shown'],
  weaknesses: [
    'No "Most Popular" badge to guide choice',
    'Feature comparison is text-heavy, hard to scan',
    '"Contact Sales" for Enterprise feels like a barrier',
    'No money-back guarantee mentioned',
  ],
  recommendation: 'Add a recommended tier badge, simplify feature comparison with icons, and add "14-day money-back guarantee" to reduce risk.',
}

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

// ── Main Copy Reviewer Page ────────────────────────────────────────────

export function CopyReviewerPage() {
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
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Type className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Copy Review Score</p>
                <span className="text-5xl font-bold text-cyan-400 tracking-tighter">90</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Copy Issues Table ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Copy Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Page</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Element</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Current Text</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Suggestion</th>
                    <th className="text-left text-zinc-500 font-medium pb-2">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {copyIssues.map((issue, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-3 text-zinc-400">{issue.page}</td>
                      <td className="py-2.5 pr-3 text-zinc-300">{issue.element}</td>
                      <td className="py-2.5 pr-3 text-red-400/70 line-through max-w-[150px] truncate">{issue.current}</td>
                      <td className="py-2.5 pr-3 text-emerald-400 max-w-[200px] truncate">{issue.suggestion}</td>
                      <td className="py-2.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${getSeverityStyle(issue.severity)}`}>
                          {issue.severity}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Hero Text Analysis ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60 border-red-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Hero Text Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-800/40 mb-4">
              <p className="text-xs text-zinc-500 mb-1">Current Headline:</p>
              <p className="text-sm text-red-400 font-medium line-through">&quot;{heroAnalysis.headline}&quot;</p>
            </div>
            <div className="space-y-2 mb-4">
              {heroAnalysis.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✗</span>
                  <span className="text-xs text-zinc-400">{issue}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 mb-1">Recommended:</p>
              <p className="text-sm text-emerald-300 font-medium">&quot;{heroAnalysis.recommendation}&quot;</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Button Copy + Error Messages Row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Button Copy */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Button Copy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {buttonCopy.map((btn, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-red-400/70 line-through">{btn.current}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-emerald-400">{btn.suggestion}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">{btn.location}: {btn.issue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Messages */}
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/80 border-zinc-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <CardTitle className="text-sm text-zinc-400 font-medium">Error Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {errorMessages.map((err, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/40">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-red-400/70 line-through">{err.current}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-emerald-400">{err.suggestion}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Context: {err.context}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Pricing Copy Analysis ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Pricing Copy Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-emerald-400 font-medium mb-2">✓ Strengths</p>
                {pricingCopy.strengths.map((s, idx) => (
                  <p key={idx} className="text-xs text-zinc-400 mb-1">• {s}</p>
                ))}
              </div>
              <div>
                <p className="text-xs text-red-400 font-medium mb-2">✗ Weaknesses</p>
                {pricingCopy.weaknesses.map((w, idx) => (
                  <p key={idx} className="text-xs text-zinc-400 mb-1">• {w}</p>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-300">{pricingCopy.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
