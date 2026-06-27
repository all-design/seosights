'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GitCompare,
  Check,
  X,
  Minus,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

type Cell = 'yes' | 'no' | 'partial' | string

interface ComparisonRow {
  feature: string
  seosights: Cell
  ahrefs: Cell
  semrush: Cell
  surfer: Cell
  note?: string
}

const rows: ComparisonRow[] = [
  {
    feature: 'SEO Audit',
    seosights: 'yes',
    ahrefs: 'yes',
    semrush: 'yes',
    surfer: 'partial',
  },
  {
    feature: 'AEO (Answer Engine Optimization)',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'partial',
  },
  {
    feature: 'GEO (Generative Engine Optimization)',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'no',
  },
  {
    feature: 'AI Citation Tracking (ChatGPT/Claude/Perplexity)',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'no',
  },
  {
    feature: 'GPTBot / ClaudeBot crawl monitor',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'no',
  },
  {
    feature: 'llms.txt generator',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'no',
  },
  {
    feature: 'AI Visibility Timeline',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'no',
  },
  {
    feature: '8 AI agents auto-execute',
    seosights: 'yes',
    ahrefs: 'no',
    semrush: 'no',
    surfer: 'no',
  },
  {
    feature: 'White-label reports',
    seosights: 'yes',
    ahrefs: 'partial',
    semrush: 'partial',
    surfer: 'no',
    note: 'Ahrefs/Semrush: enterprise only',
  },
  {
    feature: 'Price starts at',
    seosights: '$9.90/mo',
    ahrefs: '$129/mo',
    semrush: '$139/mo',
    surfer: '$89/mo',
  },
]

const competitors = [
  { key: 'ahrefs', name: 'Ahrefs' },
  { key: 'semrush', name: 'Semrush' },
  { key: 'surfer', name: 'Surfer' },
] as const

function CellRenderer({ value }: { value: Cell }) {
  if (value === 'yes') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
        </div>
      </div>
    )
  }
  if (value === 'no') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground/60" />
        </div>
      </div>
    )
  }
  if (value === 'partial') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
          <Minus className="w-4 h-4 text-amber-400" strokeWidth={3} />
        </div>
      </div>
    )
  }
  // Plain string (price)
  return (
    <span className="text-sm font-semibold text-foreground">{value}</span>
  )
}

export default function ComparisonSection({
  onStartFree,
}: {
  onStartFree?: () => void
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 relative" ref={ref} id="comparison">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm border-purple-500/50 text-purple-400 bg-purple-500/10 backdrop-blur-sm mb-6"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Why Switch
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            seosights vs{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              The Old Guard
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Traditional SEO tools were built for 2015. seosights was built for
            the AI search era.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
            <CardContent className="p-0">
              {/* "Our Platform" floating badge */}
              <div className="relative">
                <div className="hidden lg:block absolute top-0 left-[31%] z-20 -translate-y-1/2">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Our Platform
                  </div>
                </div>
              </div>

              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="h-16 px-4 sm:px-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Feature
                    </TableHead>
                    <TableHead className="h-16 px-3 sm:px-4 text-center align-bottom bg-gradient-to-b from-purple-500/20 to-purple-500/5 border-x border-purple-500/20">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-base font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                          seosights
                        </span>
                        <span className="text-[10px] text-purple-300/70 uppercase tracking-wider">
                          AI Search Era
                        </span>
                      </div>
                    </TableHead>
                    {competitors.map((c) => (
                      <TableHead
                        key={c.key}
                        className="h-16 px-3 sm:px-4 text-center align-bottom"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base font-bold text-foreground/80">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                            Legacy
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, ri) => (
                    <TableRow
                      key={row.feature}
                      className={`border-white/5 hover:bg-white/[0.02] ${
                        ri % 2 === 1 ? 'bg-white/[0.015]' : ''
                      }`}
                    >
                      <TableCell className="px-4 sm:px-6 py-4 text-sm font-medium text-foreground/90">
                        <div className="flex flex-col gap-0.5">
                          <span>{row.feature}</span>
                          {row.note && (
                            <span className="text-[11px] text-muted-foreground/60 italic">
                              {row.note}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 py-4 text-center bg-purple-500/5 border-x border-purple-500/15">
                        <CellRenderer value={row.seosights} />
                      </TableCell>
                      {competitors.map((c) => (
                        <TableCell
                          key={c.key}
                          className="px-3 sm:px-4 py-4 text-center"
                        >
                          <CellRenderer value={row[c.key]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Below table CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-muted-foreground text-sm mb-5">
            Same budget. Three Sights instead of one. Built for the era of AI
            search.
          </p>
          <Button
            onClick={onStartFree}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
          >
            See It For Yourself — Free
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
