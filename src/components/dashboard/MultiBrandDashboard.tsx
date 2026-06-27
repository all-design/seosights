'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Building2, Search, ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react'

interface BrandHealth {
  domain: string
  name: string
  aiVisibilityScore: number
  trend: 'up' | 'down' | 'stable'
  trendDelta: number
  status: 'healthy' | 'warning' | 'critical'
  engineBreakdown: { chatgpt: number; claude: number; gemini: number; perplexity: number; copilot: number }
  lastChecked: string
  alerts: number
}

// Simulation data
const SIM_BRANDS: BrandHealth[] = [
  { domain: 'acme.com', name: 'Acme Corp', aiVisibilityScore: 78, trend: 'up', trendDelta: 5, status: 'healthy', engineBreakdown: { chatgpt: 82, claude: 75, gemini: 80, perplexity: 78, copilot: 72 }, lastChecked: '2 min ago', alerts: 0 },
  { domain: 'beta.io', name: 'Beta.io', aiVisibilityScore: 62, trend: 'up', trendDelta: 3, status: 'healthy', engineBreakdown: { chatgpt: 68, claude: 55, gemini: 60, perplexity: 65, copilot: 58 }, lastChecked: '15 min ago', alerts: 1 },
  { domain: 'gamma.tech', name: 'Gamma Tech', aiVisibilityScore: 45, trend: 'down', trendDelta: -4, status: 'warning', engineBreakdown: { chatgpt: 50, claude: 40, gemini: 42, perplexity: 48, copilot: 38 }, lastChecked: '1 hour ago', alerts: 3 },
  { domain: 'delta.co', name: 'Delta & Co', aiVisibilityScore: 28, trend: 'down', trendDelta: -8, status: 'critical', engineBreakdown: { chatgpt: 32, claude: 22, gemini: 25, perplexity: 30, copilot: 20 }, lastChecked: '3 hours ago', alerts: 5 },
  { domain: 'epsilon.dev', name: 'Epsilon Dev', aiVisibilityScore: 85, trend: 'stable', trendDelta: 0, status: 'healthy', engineBreakdown: { chatgpt: 88, claude: 82, gemini: 85, perplexity: 90, copilot: 80 }, lastChecked: '5 min ago', alerts: 0 },
  { domain: 'zeta.ai', name: 'Zeta AI', aiVisibilityScore: 55, trend: 'up', trendDelta: 2, status: 'warning', engineBreakdown: { chatgpt: 60, claude: 50, gemini: 52, perplexity: 58, copilot: 48 }, lastChecked: '30 min ago', alerts: 2 },
]

function StatusLight({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    warning: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    critical: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  }
  return <div className={`h-3 w-3 rounded-full ${colors[status] || colors.warning}`} />
}

function TrendIcon({ trend, delta }: { trend: string; delta: number }) {
  if (trend === 'up') return <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold"><ArrowUp className="h-3 w-3" />+{delta}</span>
  if (trend === 'down') return <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold"><ArrowDown className="h-3 w-3" />{delta}</span>
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs font-bold"><Minus className="h-3 w-3" />0</span>
}

export default function MultiBrandDashboard() {
  const [brands] = useState<BrandHealth[]>(SIM_BRANDS)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const healthyCount = brands.filter(b => b.status === 'healthy').length
  const warningCount = brands.filter(b => b.status === 'warning').length
  const criticalCount = brands.filter(b => b.status === 'critical').length

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Multi-Brand Dashboard</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">○ Simulation</Badge>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" /> {healthyCount} Healthy
          </Badge>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" /> {warningCount} Warning
          </Badge>
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" /> {criticalCount} Critical
          </Badge>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {filtered.map((brand, i) => (
              <motion.div
                key={brand.domain}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
              >
                <StatusLight status={brand.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{brand.name}</span>
                    <span className="text-[10px] text-muted-foreground/60">{brand.domain}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${brand.aiVisibilityScore}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{brand.aiVisibilityScore}</div>
                    <TrendIcon trend={brand.trend} delta={brand.trendDelta} />
                  </div>
                  {brand.alerts > 0 && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                      {brand.alerts} alert{brand.alerts > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
