'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Target, ArrowRight } from 'lucide-react'

interface ContentGap {
  id: string
  topic: string
  competitorsWhoHaveIt: string[]
  gapType: string
  severity: string
  estimatedScoreGain: number
  recommendation: string
}

const GAP_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  topic: { label: 'Topic', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  entity: { label: 'Entity', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  format: { label: 'Format', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  source: { label: 'Source', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-muted/30 text-muted-foreground border-border/30',
}

// Simulation data
const SIM_GAPS: ContentGap[] = [
  { id: '1', topic: 'AI-powered analytics', competitorsWhoHaveIt: ['CompetitorA', 'CompetitorB'], gapType: 'topic', severity: 'critical', estimatedScoreGain: 8, recommendation: 'Create a detailed guide about AI-powered analytics.' },
  { id: '2', topic: 'Wikipedia presence', competitorsWhoHaveIt: ['CompetitorA'], gapType: 'entity', severity: 'high', estimatedScoreGain: 7, recommendation: 'Create or improve your Wikipedia article.' },
  { id: '3', topic: 'Comparison pages', competitorsWhoHaveIt: ['CompetitorB', 'CompetitorC'], gapType: 'format', severity: 'high', estimatedScoreGain: 6, recommendation: 'Create "vs [Competitor]" comparison pages.' },
  { id: '4', topic: 'Reddit community presence', competitorsWhoHaveIt: ['CompetitorA'], gapType: 'source', severity: 'high', estimatedScoreGain: 5, recommendation: 'Engage in relevant subreddit discussions.' },
  { id: '5', topic: 'G2 review volume', competitorsWhoHaveIt: ['CompetitorA', 'CompetitorB', 'CompetitorC'], gapType: 'source', severity: 'critical', estimatedScoreGain: 9, recommendation: '8 G2 reviews vs competitors\' 200+. Launch a review campaign.' },
  { id: '6', topic: 'FAQ section', competitorsWhoHaveIt: ['CompetitorB'], gapType: 'format', severity: 'medium', estimatedScoreGain: 4, recommendation: 'Add comprehensive FAQ page with FAQPage schema.' },
]

export default function AIContentGap({ domain }: { domain: string }) {
  const [gaps] = useState<ContentGap[]>(SIM_GAPS)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const filtered = selectedType ? gaps.filter(g => g.gapType === selectedType) : gaps
  const totalPotentialGain = gaps.reduce((sum, g) => sum + g.estimatedScoreGain, 0)

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">AI Content Gap</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">○ Simulation</Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Potential gain:</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">+{totalPotentialGain} AI Visibility Points</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Gap type filters */}
        <div className="flex gap-1.5 mb-3">
          <Badge variant="outline" className={`cursor-pointer ${!selectedType ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'hover:bg-muted/50'}`} onClick={() => setSelectedType(null)}>
            All ({gaps.length})
          </Badge>
          {Object.entries(GAP_TYPE_STYLES).map(([type, style]) => {
            const count = gaps.filter(g => g.gapType === type).length
            return (
              <Badge key={type} variant="outline" className={`cursor-pointer ${selectedType === type ? style.color : 'hover:bg-muted/50'}`} onClick={() => setSelectedType(selectedType === type ? null : type)}>
                {style.label} ({count})
              </Badge>
            )
          })}
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {filtered.map((gap, i) => {
              const typeStyle = GAP_TYPE_STYLES[gap.gapType] || GAP_TYPE_STYLES.topic
              const severityStyle = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.medium
              return (
                <motion.div
                  key={gap.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{gap.topic}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeStyle.color}`}>{typeStyle.label}</Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityStyle}`}>{gap.severity}</Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/200 shrink-0">
                      +{gap.estimatedScoreGain} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{gap.recommendation}</p>
                  {gap.competitorsWhoHaveIt.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Competitors:</span>
                      {gap.competitorsWhoHaveIt.map((c, ci) => (
                        <span key={ci} className="text-muted-foreground/80">{c}{ci < gap.competitorsWhoHaveIt.length - 1 ? ',' : ''}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
