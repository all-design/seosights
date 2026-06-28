'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Network, Shield, AlertTriangle, Unplug, CircleDot } from 'lucide-react'

interface EntityItem {
  id: string
  name: string
  type: string
  status: 'strong' | 'weak' | 'disconnected' | 'missing'
  authority: number
  connections: number
  recommendation: string
  priority: string
}

interface EntityHealthData {
  entities: EntityItem[]
  overallEntityHealth: number
  strongCount: number
  weakCount: number
  disconnectedCount: number
  missingCount: number
  _meta: { status: string }
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; icon: typeof Shield; color: string; label: string }> = {
  strong: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: Shield, color: 'text-emerald-400', label: 'Strong' },
  weak: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertTriangle, color: 'text-amber-400', label: 'Weak' },
  disconnected: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', icon: Unplug, color: 'text-orange-400', label: 'Disconnected' },
  missing: { bg: 'bg-red-500/5', border: 'border-red-500/20', icon: CircleDot, color: 'text-red-400', label: 'Missing' },
}

const TYPE_ICONS: Record<string, string> = {
  Person: '👤', Organization: '🏢', Product: '📦', Service: '⚡', Concept: '💡',
}

export default function EntityHealth({ domain }: { domain: string }) {
  // Use simulation data for now (will be replaced with API call)
  const [data] = useState<EntityHealthData>({
    entities: [
      { id: '1', name: domain.replace(/^www\./, '').split('.')[0], type: 'Organization', status: 'weak', authority: 45, connections: 12, recommendation: 'Add Wikipedia article and Wikidata entry to strengthen entity.', priority: 'critical' },
      { id: '2', name: 'CEO', type: 'Person', status: 'disconnected', authority: 30, connections: 5, recommendation: 'Create author pages and link CEO entity to organization.', priority: 'high' },
      { id: '3', name: 'Platform', type: 'Product', status: 'weak', authority: 40, connections: 8, recommendation: 'Add Product schema markup and G2 listing.', priority: 'high' },
      { id: '4', name: 'API', type: 'Service', status: 'missing', authority: 0, connections: 0, recommendation: 'Create API documentation page with proper schema markup.', priority: 'medium' },
      { id: '5', name: 'AI Visibility', type: 'Concept', status: 'strong', authority: 72, connections: 45, recommendation: 'Maintain thought leadership content on this topic.', priority: 'low' },
      { id: '6', name: 'SEO Software', type: 'Concept', status: 'disconnected', authority: 55, connections: 3, recommendation: 'Create content connecting your brand to SEO software category.', priority: 'high' },
      { id: '7', name: 'Reviews', type: 'Concept', status: 'missing', authority: 0, connections: 0, recommendation: 'Get listed on G2, Capterra, and Product Hunt.', priority: 'critical' },
      { id: '8', name: 'Blog', type: 'Service', status: 'weak', authority: 35, connections: 6, recommendation: 'Publish more consistently and add author bios with schema.', priority: 'medium' },
    ],
    overallEntityHealth: 38,
    strongCount: 1,
    weakCount: 4,
    disconnectedCount: 2,
    missingCount: 2,
    _meta: { status: 'simulation' },
  })

  const { entities, overallEntityHealth, strongCount, weakCount, disconnectedCount, missingCount } = data

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Entity Health</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">○ Simulation</Badge>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">{overallEntityHealth}</div>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{strongCount} Strong</Badge>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">{weakCount} Weak</Badge>
            <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">{disconnectedCount} Disconnected</Badge>
            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">{missingCount} Missing</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {entities.map((entity, i) => {
              const config = STATUS_CONFIG[entity.status] || STATUS_CONFIG.weak
              const StatusIcon = config.icon
              return (
                <motion.div
                  key={entity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-lg border p-3 ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{TYPE_ICONS[entity.type] || '💡'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-foreground">{entity.name}</span>
                        <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.bg} ${config.color} ${config.border}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">{entity.recommendation}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Authority</span>
                          <span className="text-[10px] font-bold text-foreground">{entity.authority}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">Connections</span>
                          <span className="text-[10px] font-bold text-foreground">{entity.connections}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entity.priority}</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
