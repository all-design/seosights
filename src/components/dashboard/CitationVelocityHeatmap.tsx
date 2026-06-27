'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

// Generate heatmap data for the last 12 weeks
function generateHeatmapData() {
  const data: { week: number; day: number; count: number; date: string }[] = []
  const now = new Date()
  for (let w = 11; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(now.getTime() - (w * 7 + (6 - d)) * 86400000)
      const count = Math.random() > 0.3 ? Math.floor(Math.random() * 8) : 0
      data.push({ week: 11 - w, day: d, count, date: date.toISOString().split('T')[0] })
    }
  }
  return data
}

const HEATMAP_COLORS = [
  'bg-muted/30',           // 0 citations
  'bg-emerald-500/20',     // 1-2
  'bg-emerald-500/40',     // 3-4
  'bg-emerald-500/60',     // 5-6
  'bg-emerald-500/80',     // 7+
]

function getColorIndex(count: number) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

export default function CitationVelocityHeatmap({ domain }: { domain: string }) {
  const [data] = useState(generateHeatmapData)
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null)

  const totalCitations = data.reduce((sum, d) => sum + d.count, 0)
  const activeDays = data.filter(d => d.count > 0).length

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Citation Velocity</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">○ Simulation</Badge>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-muted-foreground"><span className="font-bold text-emerald-400">{totalCitations}</span> citations in 12 weeks</span>
          <span className="text-xs text-muted-foreground"><span className="font-bold text-blue-400">{activeDays}</span> / 84 active days</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3.5 text-[9px] text-muted-foreground/50 flex items-center">{label}</div>
            ))}
          </div>
          {/* Heatmap grid */}
          <div className="flex gap-0.5 flex-1 overflow-x-auto">
            {Array.from({ length: 12 }, (_, w) => (
              <div key={w} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }, (_, d) => {
                  const cell = data.find(c => c.week === w && c.day === d)
                  const count = cell?.count || 0
                  const colorIdx = getColorIndex(count)
                  return (
                    <div
                      key={`${w}-${d}`}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-[3px] ${HEATMAP_COLORS[colorIdx]} transition-colors cursor-pointer hover:ring-1 hover:ring-emerald-400/50`}
                      onMouseEnter={() => setHoveredCell({ date: cell?.date || '', count })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1">Less</span>
            {HEATMAP_COLORS.map((color, i) => (
              <div key={i} className={`h-3 w-3 rounded-[2px] ${color}`} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">More</span>
          </div>
          {hoveredCell && (
            <span className="text-[10px] text-muted-foreground">
              {hoveredCell.date}: {hoveredCell.count} citation{hoveredCell.count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
