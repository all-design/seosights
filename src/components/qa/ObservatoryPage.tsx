'use client'

import { motion } from 'framer-motion'
import {
  Telescope,
  CheckCircle2,
  XCircle,
  Shield,
  FlaskConical,
  Scale,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

// ── Mock Data ──────────────────────────────────────────────────────────

const methodologyChecks = [
  { check: 'Hypothesis defined before testing', status: 'pass', detail: 'All 13 QA sections have clear hypotheses' },
  { check: 'Control group established', status: 'pass', detail: 'Baseline scores from previous sprint used' },
  { check: 'Sample size adequate', status: 'pass', detail: '47 pages, 312 interactions, 89 APIs tested' },
  { check: 'Statistical significance', status: 'pass', detail: 'p < 0.05 for all major findings' },
  { check: 'Blind review process', status: 'fail', detail: 'AI reviewers may have training bias' },
  { check: 'Reproducible results', status: 'pass', detail: 'All findings can be reproduced with same inputs' },
  { check: 'Peer review completed', status: 'pass', detail: 'Cross-validated by 3 independent AI reviewers' },
  { check: 'Data integrity verified', status: 'pass', detail: 'No missing or corrupted test data' },
]

const confidenceData = [
  { section: 'Functional', confidence: 96 },
  { section: 'UX', confidence: 91 },
  { section: 'Product', confidence: 88 },
  { section: 'Growth', confidence: 82 },
  { section: 'Copy', confidence: 93 },
  { section: 'A11y', confidence: 87 },
  { section: 'Perf', confidence: 94 },
  { section: 'Security', confidence: 98 },
  { section: 'SEO', confidence: 89 },
]

const confidenceChartConfig = {
  confidence: { label: 'Confidence', color: '#a78bfa' },
} satisfies ChartConfig

const evidenceQuality = [
  { section: 'Functional QA', sources: 47, verified: 45, unverified: 2, confidence: 96 },
  { section: 'UX Review', sources: 23, verified: 20, unverified: 3, confidence: 91 },
  { section: 'Product Review', sources: 15, verified: 12, unverified: 3, confidence: 88 },
  { section: 'Growth Review', sources: 18, verified: 14, unverified: 4, confidence: 82 },
  { section: 'Copy Review', sources: 31, verified: 29, unverified: 2, confidence: 93 },
  { section: 'Accessibility', sources: 14, verified: 12, unverified: 2, confidence: 87 },
  { section: 'Performance', sources: 8, verified: 8, unverified: 0, confidence: 94 },
  { section: 'Security', sources: 12, verified: 12, unverified: 0, confidence: 98 },
  { section: 'SEO', sources: 19, verified: 17, unverified: 2, confidence: 89 },
]

const integrityChecklist = [
  { item: 'No conflicting evidence suppressed', status: 'pass' },
  { item: 'All negative findings reported', status: 'pass' },
  { item: 'Source data preserved unchanged', status: 'pass' },
  { item: 'Timestamps recorded for all tests', status: 'pass' },
  { item: 'AI model version documented', status: 'fail', detail: 'GPT-4o version not recorded for 3 tests' },
  { item: 'Bias mitigation applied', status: 'pass' },
  { item: 'Results not cherry-picked', status: 'pass' },
  { item: 'Limitations disclosed', status: 'pass' },
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

// ── Main Observatory Page ──────────────────────────────────────────────

export function ObservatoryPage() {
  const methodPass = methodologyChecks.filter(c => c.status === 'pass').length
  const integrityPass = integrityChecklist.filter(c => c.status === 'pass').length

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
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-3xl rounded-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <Telescope className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Observatory Score</p>
                <span className="text-5xl font-bold text-purple-400 tracking-tighter">95</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Methodology Check ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Methodology Check</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">{methodPass} of {methodologyChecks.length} criteria met</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Progress value={(methodPass / methodologyChecks.length) * 100} className="h-2 bg-zinc-800 [&>div]:bg-purple-500" />
            </div>
            <div className="space-y-1">
              {methodologyChecks.map((check) => (
                <div key={check.check} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-xs text-zinc-300 flex-1">{check.check}</span>
                  {check.status === 'fail' && (
                    <span className="text-[10px] text-red-400">{check.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Confidence Scores Chart ────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Confidence Scores by Section</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={confidenceChartConfig} className="h-[220px] w-full aspect-auto">
              <BarChart data={confidenceData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="section" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="confidence" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Evidence Quality Table ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Evidence Quality</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Section</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Sources</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Verified</th>
                    <th className="text-left text-zinc-500 font-medium pb-2 pr-3">Unverified</th>
                    <th className="text-left text-zinc-500 font-medium pb-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceQuality.map((eq) => (
                    <tr key={eq.section} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                      <td className="py-2.5 pr-3 text-zinc-300">{eq.section}</td>
                      <td className="py-2.5 pr-3 text-zinc-400">{eq.sources}</td>
                      <td className="py-2.5 pr-3 text-emerald-400">{eq.verified}</td>
                      <td className="py-2.5 pr-3">
                        {eq.unverified > 0 ? (
                          <span className="text-amber-400">{eq.unverified}</span>
                        ) : (
                          <span className="text-zinc-600">0</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${eq.confidence}%`, backgroundColor: eq.confidence >= 90 ? '#a78bfa' : eq.confidence >= 85 ? '#fbbf24' : '#f87171' }} />
                          </div>
                          <span className="text-zinc-400 font-mono">{eq.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Research Integrity ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-sm text-zinc-400 font-medium">Research Integrity</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-600">{integrityPass} of {integrityChecklist.length} checks passed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {integrityChecklist.map((item) => (
                <div key={item.item} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="text-xs text-zinc-300 flex-1">{item.item}</span>
                  {item.status === 'fail' && item.detail && (
                    <span className="text-[10px] text-red-400">{item.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
