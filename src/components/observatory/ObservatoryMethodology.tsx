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
} from 'lucide-react'

export default function ObservatoryMethodology() {
  const principles = [
    {
      icon: Shield,
      title: 'No Simulated Data in Public Reports',
      description:
        'Seed data is used exclusively for development. No public report is ever published based on simulated or incomplete data. Every public finding is backed by real AI model responses.',
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
    },
    {
      icon: FileText,
      title: 'Methodology Transparency',
      description:
        'Every published finding includes methodology: number of queries, which AI models tested, time period covered, and significance criteria used. No black boxes.',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
    {
      icon: Microscope,
      title: 'Statistical Rigor',
      description:
        'We require sufficient sample sizes before publishing. A single anomalous response is not a finding. Trends are confirmed across multiple queries and time periods.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      icon: Database,
      title: 'Full Archive Access',
      description:
        'Our raw data is verifiable. The AI Search Archive™ stores every response with full provenance: prompt, model, citations, entities, date. Auditable by anyone.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
    },
    {
      icon: Lock,
      title: 'Confidence Gates',
      description:
        'Before any finding is published, it must pass evidence scoring, confidence evaluation, and editorial review. Low-confidence observations are flagged, never hidden.',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
    },
    {
      icon: Eye,
      title: 'Independent & Unbiased',
      description:
        'We are an independent research center. We do not favor any AI model, platform, or company. Our only allegiance is to accurate, reproducible data.',
      color: 'text-slate-400',
      bg: 'bg-slate-400/10',
      border: 'border-slate-400/20',
    },
  ]

  return (
    <section id="observatory-methodology" className="py-20 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge
            variant="outline"
            className="mb-4 text-slate-400 border-slate-700 bg-slate-900/50"
          >
            <Shield className="w-3 h-3 mr-1" />
            Data Integrity
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Our Methodology & Integrity Rules
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            The only serious risk we see is publishing unreliable data. Here is how we prevent it.
          </p>
        </motion.div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 sm:p-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Critical Rule</h3>
              <p className="text-red-300/80 text-sm leading-relaxed">
                If we ever publish &quot;research&quot; based on synthetic data without clear
                labeling, that credibility is nearly impossible to recover. We treat data
                integrity as our highest priority.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {principles.map((principle, i) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${principle.bg}`}>
                      <principle.icon className={`w-4 h-4 ${principle.color}`} />
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-tight pt-1">
                      {principle.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {principle.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              All public findings include full methodology, sample sizes, and confidence scores
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
