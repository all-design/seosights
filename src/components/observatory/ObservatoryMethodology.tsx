'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Microscope,
  Database,
  Lock,
  Eye,
  GitBranch,
  FlaskConical,
  BarChart3,
  Fingerprint,
  Link2,
  Server,
  Monitor,
  EyeOff,
  Ban,
} from 'lucide-react'

export default function ObservatoryMethodology() {
  const principles = [
    { icon: Shield, title: 'No Simulated Data in Public Reports', description: 'Seed data is used exclusively for development. No public report is ever published based on simulated or incomplete data.', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
    { icon: FileText, title: 'Methodology Transparency', description: 'Every published finding includes methodology: number of queries, which AI models tested, time period covered, and significance criteria used.', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    { icon: Microscope, title: 'Statistical Rigor', description: 'We require sufficient sample sizes before publishing. A single anomalous response is not a finding. Trends are confirmed across multiple queries and time periods.', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { icon: Database, title: 'Full Archive Access', description: 'Our raw data is verifiable. The AI Search Archive™ stores every response with full provenance: prompt, model, citations, entities, date.', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { icon: Lock, title: 'Confidence Gates', description: 'Before any finding is published, it must pass evidence scoring, confidence evaluation, and editorial review. Low-confidence observations are flagged, never hidden.', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { icon: Eye, title: 'Independent & Unbiased', description: 'We are an independent research center. We do not favor any AI model, platform, or company. Our only allegiance is to accurate, reproducible data.', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  ]

  const confidenceDistribution = [
    { level: '90+', bar: '■■■■■■', count: 42 },
    { level: '80+', bar: '■■■', count: 18 },
    { level: '70+', bar: '■', count: 5 },
    { level: '60+', bar: '■', count: 2 },
    { level: '<60', bar: '', count: 1 },
  ]

  const dataModes = [
    { mode: 'Development', icon: Monitor, rule: 'Everything allowed, simulated data visible', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    { mode: 'Preview', icon: EyeOff, rule: 'Everything allowed, simulated data clearly labeled', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { mode: 'Production', icon: Ban, rule: 'If isSimulated==true, API REFUSES. No option. Not even by mistake.', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  ]

  return (
    <section id="observatory-methodology" className="py-20 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-slate-400 border-slate-700 bg-slate-900/50">
            <Shield className="w-3 h-3 mr-1" /> Data Integrity
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Our Methodology & Integrity Rules</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">The only serious risk we see is publishing unreliable data. Here is how we prevent it.</p>
        </motion.div>

        {/* A) Methodology Versioning */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-400/10"><GitBranch className="w-4 h-4 text-violet-400" /></div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-semibold">Methodology v1.4</span>
                  <span className="text-slate-500 text-sm">— Last updated July 2026</span>
                </div>
                <p className="text-slate-400 text-sm">When methodology changes, people must know. Every version is documented.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* B) Reproducibility */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-lg bg-emerald-400/10"><FlaskConical className="w-4 h-4 text-emerald-400" /></div>
                <h3 className="text-white font-semibold pt-1">Every Report Includes</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
                {[
                  { label: 'Prompt Set', value: '2026-07' },
                  { label: 'Models', value: 'Claude 4, Gemini, GPT-5' },
                  { label: 'Sample', value: '4,218 queries' },
                  { label: 'Period', value: '30 days' },
                  { label: 'Significance', value: 'p < 0.05' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-slate-500 text-xs mb-1">{item.label}</div>
                    <div className="text-white text-sm font-medium">{item.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm">Every finding includes how it was produced, even if it can&apos;t be fully reproduced.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* C) Confidence Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-lg bg-purple-400/10"><BarChart3 className="w-4 h-4 text-purple-400" /></div>
                <h3 className="text-white font-semibold pt-1">Confidence Distribution</h3>
              </div>
              <div className="space-y-2 mb-3">
                {confidenceDistribution.map((row) => (
                  <div key={row.level} className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm font-mono w-8 text-right">{row.level}</span>
                    <span className="text-emerald-400 font-mono text-sm tracking-wider">{row.bar}</span>
                    <span className="text-slate-400 text-sm">{row.count} findings</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm">We don&apos;t hide low-confidence findings. We show the full distribution.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Warning Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 sm:p-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Critical Rule</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                If we ever publish &quot;research&quot; based on synthetic data without clear labeling, that credibility is nearly impossible to recover. We treat data integrity as our highest priority.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {principles.map((principle, i) => (
            <motion.div key={principle.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${principle.bg}`}><principle.icon className={`w-4 h-4 ${principle.color}`} /></div>
                    <h3 className="text-white font-semibold text-sm leading-tight pt-1">{principle.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{principle.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* D) Observatory DOI + E) Permanent URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="bg-slate-900/50 border-slate-800 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-400/10"><Fingerprint className="w-4 h-4 text-cyan-400" /></div>
                  <h3 className="text-white font-semibold pt-1">Observatory DOI</h3>
                </div>
                <p className="text-cyan-300 font-mono text-sm mb-2">OBS-2026-0042</p>
                <p className="text-slate-400 text-sm">Like academic DOI. Citable. Permanent. Never changes.</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="bg-slate-900/50 border-slate-800 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-2 rounded-lg bg-amber-400/10"><Link2 className="w-4 h-4 text-amber-400" /></div>
                  <h3 className="text-white font-semibold pt-1">Permanent URLs</h3>
                </div>
                <p className="text-amber-300 font-mono text-sm mb-2">/research/2026/07/chatgpt-github-citations</p>
                <p className="text-slate-400 text-sm">Never /latest. Always permanent. This is an archive.</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* F) Three Data Modes */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-400/10"><Server className="w-4 h-4 text-slate-400" /></div>
            <h3 className="text-white font-semibold">Three Data Modes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataModes.map((dm) => (
              <Card key={dm.mode} className={`bg-slate-900/50 ${dm.border} border`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${dm.bg}`}><dm.icon className={`w-4 h-4 ${dm.color}`} /></div>
                    <span className={`font-semibold ${dm.color}`}>{dm.mode}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{dm.rule}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All public findings include full methodology, sample sizes, and confidence scores</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
