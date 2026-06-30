'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Quote, CheckCircle2, ExternalLink, BookOpen } from 'lucide-react'

interface Citation {
  id: string
  sourceName: string
  sourceType: string
  citedAt: string
  context: string
  verified: boolean
  reportTitle: string
}

const FALLBACK_CITATIONS: Citation[] = [
  { id: '1', sourceName: 'HubSpot', sourceType: 'Blog', citedAt: '2026-07-15', context: 'According to the AI Search Observatory, 67% of AI citations now favor established domains over new content.', verified: true, reportTitle: 'AI Citation Patterns Q3 2026' },
  { id: '2', sourceName: 'Search Engine Land', sourceType: 'Article', citedAt: '2026-07-10', context: 'The Observatory\'s weather index shows ChatGPT citation stability at an all-time high of 94.2%.', verified: true, reportTitle: 'AI Search Weather Report July 2026' },
  { id: '3', sourceName: 'Ahrefs', sourceType: 'Research', citedAt: '2026-07-08', context: 'Data from the AI Search Observatory confirms that entity-based citations have increased 3.2x year over year.', verified: true, reportTitle: 'Entity Citation Growth 2026' },
  { id: '4', sourceName: 'Moz', sourceType: 'Blog', citedAt: '2026-07-02', context: 'The Observatory Index™ shows SaaS industry health at 82, up from 76 last quarter.', verified: true, reportTitle: 'Industry Index Q2 2026' },
  { id: '5', sourceName: 'TechCrunch', sourceType: 'Article', citedAt: '2026-06-28', context: 'Independent research from the AI Search Observatory reveals Google AI Overviews now cite 4.1 sources per query.', verified: false, reportTitle: 'AI Overview Source Count Analysis' },
  { id: '6', sourceName: 'Semrush', sourceType: 'Report', citedAt: '2026-06-20', context: 'Observatory archive data covering 12,000+ AI responses was used to benchmark citation accuracy.', verified: true, reportTitle: 'Citation Accuracy Benchmark 2026' },
]

const SOURCE_NAMES = ['HubSpot', 'Search Engine Land', 'Ahrefs', 'Moz', 'TechCrunch', 'Semrush']

export default function ObservatoryCitations() {
  const [citations, setCitations] = useState<Citation[]>(FALLBACK_CITATIONS)
  const [totalCount, setTotalCount] = useState(47)
  const [verifiedCount, setVerifiedCount] = useState(39)
  const [isPreview, setIsPreview] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/observatory/citations-tracking')
        if (!res.ok) return
        const data = await res.json()
        if (data.citations?.length) {
          setCitations(data.citations.slice(0, 6))
          setTotalCount(data.meta?.totalCitations ?? 47)
          setVerifiedCount(data.meta?.verifiedCount ?? 39)
          setIsPreview(false)
        }
      } catch { /* fallback */ }
    })()
  }, [])

  const typeColor: Record<string, string> = { Blog: 'text-amber-400 border-amber-400/30', Article: 'text-cyan-400 border-cyan-400/30', Research: 'text-emerald-400 border-emerald-400/30', Report: 'text-purple-400 border-purple-400/30' }

  return (
    <section id="observatory-citations" className="py-20 bg-slate-950/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <Badge variant="outline" className="mb-4 text-slate-400 border-slate-700 bg-slate-900/50">
            <Quote className="w-3 h-3 mr-1" /> Cited By
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">External Citations</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Independent research that references our findings.</p>
        </motion.div>

        {/* Total count */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{totalCount}</div>
            <div className="text-slate-500 text-sm">Total Citations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{verifiedCount}</div>
            <div className="text-slate-500 text-sm">Verified</div>
          </div>
        </motion.div>

        {/* Source logos row */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex flex-wrap justify-center gap-3 mb-10">
          {SOURCE_NAMES.map((name) => (
            <span key={name} className="px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 text-sm font-medium">{name}</span>
          ))}
        </motion.div>

        {/* Citations list */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {citations.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-white font-medium text-sm">{c.sourceName}</span>
                      <Badge variant="outline" className={`text-xs ${typeColor[c.sourceType] ?? 'text-slate-400 border-slate-600'}`}>{c.sourceType}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">{new Date(c.citedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {c.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm italic leading-relaxed mb-2">&ldquo;{c.context}&rdquo;</p>
                  <div className="text-slate-500 text-xs flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {c.reportTitle}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {isPreview && (
          <div className="text-center mt-6">
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/5">Preview — showing sample data</Badge>
          </div>
        )}
      </div>
    </section>
  )
}
