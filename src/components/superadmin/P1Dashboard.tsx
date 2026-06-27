'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Eye,
  Camera,
  Wrench,
  Target,
  Mail,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface RecentItem {
  id: string
  label: string
  detail: string
  timestamp: string
  status?: string
}

interface P1Module {
  key: string
  label: string
  icon: React.ReactNode
  metrics: { label: string; value: string; trend?: number }[]
  recentItems: RecentItem[]
}

interface P1Data {
  modules: P1Module[]
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusBadge(status?: string) {
  if (!status) return null
  switch (status) {
    case 'success':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" /> Success
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      )
    case 'critical':
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" /> Critical
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

// ─── Sub-component: Module Card ─────────────────────────────────────────

function ModuleCard({ module }: { module: P1Module }) {
  return (
    <div className="space-y-4">
      {/* Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {module.metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-card/80 backdrop-blur-sm hover:border-white/20 transition-colors">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-lg font-bold text-foreground">{metric.value}</p>
              {metric.trend !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      metric.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {metric.trend >= 0 ? '+' : ''}
                    {metric.trend.toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Items Table */}
      <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {module.recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs">Item</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Detail</TableHead>
                    <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {module.recentItems.map((item) => (
                    <TableRow key={item.id} className="border-white/5">
                      <TableCell className="text-xs font-medium text-foreground">
                        {item.label}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {item.detail}
                      </TableCell>
                      <TableCell className="text-xs">
                        {statusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right">
                        {formatTimestamp(item.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────

export default function P1Dashboard() {
  const [data, setData] = useState<P1Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchP1() {
      try {
        setLoading(true)
        const res = await fetch('/api/superadmin/p1-overview')
        if (!res.ok) throw new Error('Failed to fetch P1 overview')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchP1()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="border-red-500/30 bg-card/80 backdrop-blur-sm p-6 text-center">
          <p className="text-red-400 text-sm">Error loading P1 overview: {error}</p>
        </Card>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const moduleIcons: Record<string, React.ReactNode> = {
    replay: <Eye className="h-4 w-4" />,
    recorder: <Camera className="h-4 w-4" />,
    autoExecute: <Wrench className="h-4 w-4" />,
    roiQueue: <Target className="h-4 w-4" />,
    digest: <Mail className="h-4 w-4" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-white/10 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <Tabs defaultValue={data.modules[0]?.key} className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {data.modules.map((mod) => (
                <TabsTrigger
                  key={mod.key}
                  value={mod.key}
                  className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs sm:text-sm"
                >
                  {moduleIcons[mod.key] || <BarChart3 className="h-4 w-4" />}
                  <span className="hidden sm:inline">{mod.label}</span>
                  <span className="sm:hidden">{mod.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {data.modules.map((mod) => (
              <TabsContent key={mod.key} value={mod.key}>
                <ModuleCard module={mod} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
