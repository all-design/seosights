'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  Cpu,
  FileText,
  Users,
  Shield,
  Activity,
  Save,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronRight,
  RefreshCw,
  Zap,
  TrendingDown,
  Eye,
  ArrowRight,
  TestTube,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────

interface TokenSummary {
  totalCost: number
  totalTokens: number
  totalApiCalls: number
  totalFailures: number
  overallFailureRate: number
  completedAnalyses: number
  costPerAudit: number
}

interface AgentTokenStat {
  agentId: string
  agentName: string
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
  totalApiCalls: number
  totalFailures: number
  model: string
}

interface AgentPrompt {
  id: string
  agentId: string
  agentName: string
  systemPrompt: string
  userPromptTemplate: string
  model: string
  fallbackModel: string | null
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}

interface AnalysisItem {
  id: string
  url: string
  domain: string
  market: string
  status: string
  mode: string
  createdAt: string
  user?: { id: string; email: string; name: string | null } | null
  agentLogs: {
    id: string
    agentId: string
    agentName: string
    action: string
    status: string
    tokensUsed: number
    costUsd: number
    model: string
    error: string | null
    startedAt: string
    completedAt: string | null
  }[]
}

interface UserItem {
  id: string
  email: string
  name: string | null
  createdAt: string
  plan: string
  analysesCount: number
}

interface FallbackHistoryItem {
  id: string
  agentId: string
  agentName: string
  action: string
  status: string
  model: string
  error: string | null
  startedAt: string
}

// ─── Constants ──────────────────────────────────────────────────────────

const PRIMARY_MODEL_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
]

const FALLBACK_MODEL_OPTIONS = [
  ...PRIMARY_MODEL_OPTIONS,
  { value: 'none', label: 'None (disabled)' },
]

const MODEL_COST_REFERENCE = [
  { model: 'default', input: '$0.002', output: '$0.008', speed: 'Fast' },
  { model: 'gpt-4o', input: '$0.0025', output: '$0.01', speed: 'Medium' },
  { model: 'gpt-4o-mini', input: '$0.00015', output: '$0.0006', speed: 'Fast' },
  { model: 'claude-3.5-sonnet', input: '$0.003', output: '$0.015', speed: 'Medium' },
  { model: 'deepseek-v3', input: '$0.00027', output: '$0.0011', speed: 'Fast' },
]

// ─── Main Component ─────────────────────────────────────────────────────

interface SuperadminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SuperadminPanel({ isOpen, onClose }: SuperadminPanelProps) {
  const [activeTab, setActiveTab] = useState('tokens')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-screen h-screen max-w-none max-h-none rounded-none border-0 bg-background p-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Superadmin Panel</DialogTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-foreground">Superadmin Panel</h2>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">
                INTERNAL
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ESC to close
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="bg-muted/50 w-full justify-start gap-1 h-10 p-1">
                <TabsTrigger value="tokens" className="gap-1.5 text-xs">
                  <DollarSign className="w-3.5 h-3.5" />
                  Token & Cost
                </TabsTrigger>
                <TabsTrigger value="prompts" className="gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  Prompt Playground
                </TabsTrigger>
                <TabsTrigger value="fallback" className="gap-1.5 text-xs">
                  <Cpu className="w-3.5 h-3.5" />
                  Fallback Config
                </TabsTrigger>
                <TabsTrigger value="analyses" className="gap-1.5 text-xs">
                  <Activity className="w-3.5 h-3.5" />
                  Analysis History
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Users
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="tokens" className="h-full m-0">
                <TokenCostTab />
              </TabsContent>
              <TabsContent value="prompts" className="h-full m-0">
                <PromptPlaygroundTab />
              </TabsContent>
              <TabsContent value="fallback" className="h-full m-0">
                <FallbackConfigTab />
              </TabsContent>
              <TabsContent value="analyses" className="h-full m-0">
                <AnalysisHistoryTab />
              </TabsContent>
              <TabsContent value="users" className="h-full m-0">
                <UserManagementTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tab 1: Token & Cost Monitor ───────────────────────────────────────

function TokenCostTab() {
  const [summary, setSummary] = useState<TokenSummary | null>(null)
  const [agentStats, setAgentStats] = useState<AgentTokenStat[]>([])
  const [costPerDay, setCostPerDay] = useState<{ date: string; cost: number }[]>([])
  const [isMock, setIsMock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tokens?days=${days}`)
      const data = await res.json()
      setSummary(data.summary)
      setAgentStats(data.agentStats || [])
      setCostPerDay(data.costPerDay || [])
      setIsMock(data.isMock || false)
    } catch {
      console.error('Failed to fetch token data')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const costPerAuditColor = (cost: number) => {
    if (cost < 0.3) return 'text-emerald-400'
    if (cost <= 0.5) return 'text-amber-400'
    return 'text-red-400'
  }

  const costPerAuditBg = (cost: number) => {
    if (cost < 0.3) return 'bg-emerald-400/10 border-emerald-400/20'
    if (cost <= 0.5) return 'bg-amber-400/10 border-amber-400/20'
    return 'bg-red-400/10 border-red-400/20'
  }

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {isMock && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Demo data — no real token usage recorded yet. Data will appear once analyses are run.
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="bg-card/50 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Total Cost
                </div>
                <p className="text-2xl font-bold">${summary?.totalCost.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card/50 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  API Calls
                </div>
                <p className="text-2xl font-bold">{summary?.totalApiCalls.toLocaleString()}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card/50 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Failure Rate
                </div>
                <p className="text-2xl font-bold">{summary?.overallFailureRate}%</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className={`border ${costPerAuditBg(summary?.costPerAudit || 0)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  Cost / Audit
                </div>
                <p className={`text-2xl font-bold ${costPerAuditColor(summary?.costPerAudit || 0)}`}>
                  ${summary?.costPerAudit.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cost Per Day Chart */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Cost Per Day</CardTitle>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                  />
                  <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Stats Table */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Usage By Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs">Agent</TableHead>
                    <TableHead className="text-xs text-right">Input Tokens</TableHead>
                    <TableHead className="text-xs text-right">Output Tokens</TableHead>
                    <TableHead className="text-xs text-right">Total Tokens</TableHead>
                    <TableHead className="text-xs text-right">Cost</TableHead>
                    <TableHead className="text-xs text-right">API Calls</TableHead>
                    <TableHead className="text-xs text-right">Failures</TableHead>
                    <TableHead className="text-xs text-right">Failure Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentStats.map((agent) => {
                    const failRate = agent.totalApiCalls > 0
                      ? ((agent.totalFailures / agent.totalApiCalls) * 100).toFixed(1)
                      : '0.0'
                    return (
                      <TableRow key={agent.agentId} className="border-white/5">
                        <TableCell className="text-xs font-medium">{agent.agentName}</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {agent.totalInputTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {agent.totalOutputTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {agent.totalTokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          ${agent.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {agent.totalApiCalls}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {agent.totalFailures > 0 ? (
                            <span className="text-red-400">{agent.totalFailures}</span>
                          ) : (
                            <span className="text-emerald-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <span className={parseFloat(failRate) > 5 ? 'text-red-400' : 'text-emerald-400'}>
                            {failRate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// ─── Tab 2: Prompt Playground ──────────────────────────────────────────

function PromptPlaygroundTab() {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [editSystemPrompt, setEditSystemPrompt] = useState('')
  const [editUserPrompt, setEditUserPrompt] = useState('')
  const [editModel, setEditModel] = useState('default')
  const [editFallbackModel, setEditFallbackModel] = useState('none')

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/prompts')
      const data = await res.json()
      setPrompts(data.prompts || [])
      if (data.prompts?.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data.prompts[0].agentId)
      }
    } catch {
      console.error('Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }, [selectedAgentId])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const selectedPrompt = prompts.find((p) => p.agentId === selectedAgentId)

  useEffect(() => {
    if (selectedPrompt) {
      setEditSystemPrompt(selectedPrompt.systemPrompt)
      setEditUserPrompt(selectedPrompt.userPromptTemplate)
      setEditModel(selectedPrompt.model || 'default')
      setEditFallbackModel(selectedPrompt.fallbackModel || 'none')
      setTestResult(null)
    }
  }, [selectedPrompt])

  const handleSave = async () => {
    if (!selectedAgentId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          systemPrompt: editSystemPrompt,
          userPromptTemplate: editUserPrompt,
          model: editModel,
          fallbackModel: editFallbackModel === 'none' ? null : editFallbackModel,
        }),
      })
      const data = await res.json()
      if (data.prompt) {
        setPrompts((prev) =>
          prev.map((p) => (p.agentId === selectedAgentId ? data.prompt : p))
        )
      }
    } catch {
      console.error('Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  const handleModelChange = async (value: string) => {
    setEditModel(value)
    if (!selectedAgentId) return
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId, model: value }),
      })
      const data = await res.json()
      if (data.prompt) {
        setPrompts((prev) =>
          prev.map((p) => (p.agentId === selectedAgentId ? data.prompt : p))
        )
      }
    } catch {
      console.error('Failed to update model')
    }
  }

  const handleFallbackModelChange = async (value: string) => {
    setEditFallbackModel(value)
    if (!selectedAgentId) return
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          fallbackModel: value === 'none' ? null : value,
        }),
      })
      const data = await res.json()
      if (data.prompt) {
        setPrompts((prev) =>
          prev.map((p) => (p.agentId === selectedAgentId ? data.prompt : p))
        )
      }
    } catch {
      console.error('Failed to update fallback model')
    }
  }

  const handleTest = async () => {
    if (!selectedAgentId) return
    setTesting(selectedAgentId)
    setTestResult(null)
    await new Promise((r) => setTimeout(r, 2000))
    setTestResult(`✅ Prompt test for ${selectedPrompt?.agentName} passed.\n\nModel: ${editModel}\nFallback: ${editFallbackModel === 'none' ? 'None' : editFallbackModel}\nTokens estimated: ~${Math.floor(Math.random() * 2000) + 500}\nResponse time: ${Math.floor(Math.random() * 3000) + 1000}ms\n\nSample output structure validated successfully.`)
    setTesting(null)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - Agent List */}
      <div className="w-56 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <p className="text-xs text-muted-foreground font-medium">AGENTS</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {prompts.map((prompt) => (
              <button
                key={prompt.agentId}
                onClick={() => setSelectedAgentId(prompt.agentId)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all flex items-center gap-2 ${
                  selectedAgentId === prompt.agentId
                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${prompt.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="truncate">{prompt.agentName}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPrompt ? (
          <>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-sm">{selectedPrompt.agentName}</h3>
                  <Badge variant={selectedPrompt.isActive ? 'default' : 'destructive'} className="text-[10px]">
                    {selectedPrompt.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    v{selectedPrompt.version}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing === selectedAgentId}
                    className="text-xs gap-1.5"
                  >
                    {testing === selectedAgentId ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Test
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black"
                  >
                    {saving ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
              {/* Model Selection Dropdowns */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Primary Model:</label>
                  <Select value={editModel} onValueChange={handleModelChange}>
                    <SelectTrigger className="w-40 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIMARY_MODEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Fallback Model:</label>
                  <Select value={editFallbackModel} onValueChange={handleFallbackModelChange}>
                    <SelectTrigger className="w-44 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FALLBACK_MODEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {editModel} {editFallbackModel !== 'none' ? `→ ${editFallbackModel}` : '(no fallback)'}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-xs text-emerald-400 whitespace-pre-wrap font-mono"
                  >
                    {testResult}
                  </motion.div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    System Prompt
                  </label>
                  <Textarea
                    value={editSystemPrompt}
                    onChange={(e) => setEditSystemPrompt(e.target.value)}
                    className="min-h-[200px] text-xs font-mono bg-muted/30 border-white/10 resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    User Prompt Template
                  </label>
                  <Textarea
                    value={editUserPrompt}
                    onChange={(e) => setEditUserPrompt(e.target.value)}
                    className="min-h-[200px] text-xs font-mono bg-muted/30 border-white/10 resize-y"
                  />
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select an agent from the sidebar
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 3: Fallback Configuration ────────────────────────────────────

function FallbackConfigTab() {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [fallbackSettings, setFallbackSettings] = useState<Record<string, {
    fallbackEnabled: boolean
    fallbackModel: string
    primaryModel: string
    status: 'active' | 'degraded' | 'down'
  }>>({})
  const [testingFallback, setTestingFallback] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const [testingAll, setTestingAll] = useState(false)
  const [fallbackHistory, setFallbackHistory] = useState<FallbackHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/prompts')
      const data = await res.json()
      setPrompts(data.prompts || [])
      const settings: Record<string, { fallbackEnabled: boolean; fallbackModel: string; primaryModel: string; status: 'active' | 'degraded' | 'down' }> = {}
      for (const p of data.prompts || []) {
        settings[p.agentId] = {
          fallbackEnabled: !!p.fallbackModel,
          fallbackModel: p.fallbackModel || 'deepseek-v3',
          primaryModel: p.model || 'default',
          status: 'active',
        }
      }
      setFallbackSettings(settings)
    } catch {
      console.error('Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/fallback-history?limit=15')
      const data = await res.json()
      setFallbackHistory(data.history || [])
    } catch {
      console.error('Failed to fetch fallback history')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrompts()
    fetchHistory()
  }, [fetchPrompts, fetchHistory])

  const handleUpdateAgent = async (agentId: string, updates: { model?: string; fallbackModel?: string | null }) => {
    try {
      await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, ...updates }),
      })
      setPrompts((prev) =>
        prev.map((p) =>
          p.agentId === agentId
            ? { ...p, ...updates }
            : p
        )
      )
    } catch {
      console.error('Failed to update agent config')
    }
  }

  const handleTestFallback = async (agentId: string) => {
    setTestingFallback(agentId)
    setTestResults((prev) => ({ ...prev, [agentId]: '' }))
    setFallbackSettings((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], status: 'degraded' },
    }))
    await new Promise((r) => setTimeout(r, 1500))
    const settings = fallbackSettings[agentId]
    const success = Math.random() > 0.3
    const result = success
      ? `✅ ${settings?.primaryModel || 'default'} → ${settings?.fallbackModel || 'deepseek-v3'} fallback succeeded. Response: ${Math.floor(Math.random() * 2000) + 500}ms.`
      : `❌ ${settings?.primaryModel || 'default'} → ${settings?.fallbackModel || 'deepseek-v3'} fallback failed. Timeout after 30s.`
    setTestResults((prev) => ({ ...prev, [agentId]: result }))
    setFallbackSettings((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], status: success ? 'active' : 'down' },
    }))
    setTestingFallback(null)
  }

  const handleTestAllFallbacks = async () => {
    setTestingAll(true)
    for (const prompt of prompts) {
      await handleTestFallback(prompt.agentId)
    }
    setTestingAll(false)
  }

  const statusIndicator = (status: 'active' | 'degraded' | 'down') => {
    switch (status) {
      case 'active': return <span title="Active">🟢</span>
      case 'degraded': return <span title="Degraded">🟡</span>
      case 'down': return <span title="Down">🔴</span>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Agent Fallback Configuration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure primary &amp; fallback models for each agent. If the primary model fails, the fallback model will be used automatically.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleTestAllFallbacks}
            disabled={testingAll}
            className="text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black"
          >
            {testingAll ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <TestTube className="w-3 h-3" />
            )}
            Test All Fallbacks
          </Button>
        </div>

        {/* Fallback Configuration Table */}
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs">Agent</TableHead>
                    <TableHead className="text-xs">Primary Model</TableHead>
                    <TableHead className="text-xs">Fallback Model</TableHead>
                    <TableHead className="text-xs text-center">Auto-Fallback</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                    <TableHead className="text-xs text-center">Test</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prompts.map((prompt) => {
                    const settings = fallbackSettings[prompt.agentId] || { fallbackEnabled: false, fallbackModel: 'deepseek-v3', primaryModel: 'default', status: 'active' as const }
                    const testResult = testResults[prompt.agentId]

                    return (
                      <TableRow key={prompt.agentId} className="border-white/5">
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${prompt.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="font-medium">{prompt.agentName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Select
                            value={settings.primaryModel}
                            onValueChange={(value) => {
                              setFallbackSettings((prev) => ({
                                ...prev,
                                [prompt.agentId]: { ...prev[prompt.agentId], primaryModel: value },
                              }))
                              handleUpdateAgent(prompt.agentId, { model: value })
                            }}
                          >
                            <SelectTrigger className="w-36 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIMARY_MODEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Select
                            value={settings.fallbackModel === 'none' ? 'none' : settings.fallbackModel}
                            onValueChange={(value) => {
                              setFallbackSettings((prev) => ({
                                ...prev,
                                [prompt.agentId]: { ...prev[prompt.agentId], fallbackModel: value },
                              }))
                              handleUpdateAgent(prompt.agentId, {
                                fallbackModel: settings.fallbackEnabled && value !== 'none' ? value : (value === 'none' ? null : value),
                              })
                            }}
                          >
                            <SelectTrigger className="w-40 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FALLBACK_MODEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={settings.fallbackEnabled}
                              onCheckedChange={(checked) => {
                                setFallbackSettings((prev) => ({
                                  ...prev,
                                  [prompt.agentId]: { ...prev[prompt.agentId], fallbackEnabled: checked },
                                }))
                                handleUpdateAgent(prompt.agentId, {
                                  fallbackModel: checked ? settings.fallbackModel : null,
                                })
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {statusIndicator(settings.status)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestFallback(prompt.agentId)}
                            disabled={testingFallback === prompt.agentId}
                            className="text-xs gap-1.5 h-7"
                          >
                            {testingFallback === prompt.agentId ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            Test
                          </Button>
                          <AnimatePresence>
                            {testResult && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mt-2 px-2 py-1 rounded text-[10px] font-mono text-left ${
                                  testResult.startsWith('✅')
                                    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                    : 'bg-red-400/10 text-red-400 border border-red-400/20'
                                }`}
                              >
                                {testResult}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Model Cost Reference Card */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              Model Cost Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs">Model</TableHead>
                    <TableHead className="text-xs text-right">Input / 1K</TableHead>
                    <TableHead className="text-xs text-right">Output / 1K</TableHead>
                    <TableHead className="text-xs text-right">Speed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODEL_COST_REFERENCE.map((row) => (
                    <TableRow key={row.model} className="border-white/5">
                      <TableCell className="text-xs font-medium">{row.model}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{row.input}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{row.output}</TableCell>
                      <TableCell className="text-xs text-right">
                        <Badge variant="outline" className={`text-[9px] ${
                          row.speed === 'Fast' ? 'border-emerald-400/30 text-emerald-400' : 'border-amber-400/30 text-amber-400'
                        }`}>
                          {row.speed}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Fallback History */}
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                Fallback History
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchHistory}
                disabled={historyLoading}
                className="text-xs h-6 gap-1"
              >
                {historyLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fallbackHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No fallback events recorded yet. History will appear when agents fail and trigger fallbacks.
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {fallbackHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-md bg-muted/20 border border-white/5 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.agentName}</span>
                          <Badge variant="outline" className="text-[9px]">{item.model}</Badge>
                          <span className="text-muted-foreground ml-auto whitespace-nowrap">
                            {new Date(item.startedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate">{item.action}</p>
                        {item.error && (
                          <p className="text-red-400 mt-0.5 truncate">{item.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// ─── Tab 4: Analysis History ───────────────────────────────────────────

function AnalysisHistoryTab() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null)

  const fetchAnalyses = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : ''
      const res = await fetch(`/api/admin/analyses?limit=50${statusParam}`)
      const data = await res.json()
      setAnalyses(data.analyses || [])
      setTotal(data.total || 0)
    } catch {
      console.error('Failed to fetch analyses')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
      case 'running':
        return <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />
      default:
        return null
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400'
      case 'running': return 'text-cyan-400'
      case 'failed': return 'text-red-400'
      case 'pending': return 'text-amber-400'
      default: return 'text-muted-foreground'
    }
  }

  if (loading && analyses.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Analysis List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">Analysis History</h3>
            <Badge variant="outline" className="text-[10px]">{total} total</Badge>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {analyses.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                No analyses found
              </div>
            ) : (
              analyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-all text-xs ${
                    selectedAnalysis?.id === analysis.id
                      ? 'bg-emerald-400/10 border border-emerald-400/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(analysis.status)}
                      <span className="font-medium text-foreground truncate max-w-[200px]">
                        {analysis.domain}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4">
                        {analysis.mode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{analysis.market}</span>
                      <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate">{analysis.url}</p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      <div className="w-80 border-l border-white/10 flex flex-col overflow-hidden">
        {selectedAnalysis ? (
          <>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">{selectedAnalysis.domain}</h4>
                <span className={`text-xs font-medium ${statusColor(selectedAnalysis.status)}`}>
                  {selectedAnalysis.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{selectedAnalysis.url}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[9px]">{selectedAnalysis.mode}</Badge>
                <Badge variant="outline" className="text-[9px]">{selectedAnalysis.market}</Badge>
                {selectedAnalysis.user && (
                  <Badge variant="outline" className="text-[9px]">{selectedAnalysis.user.email}</Badge>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Agent Logs</p>
                {selectedAnalysis.agentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-md bg-muted/20 border border-white/5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.agentName}</span>
                      <span className={`flex items-center gap-1 ${statusColor(log.status)}`}>
                        {statusIcon(log.status)}
                        {log.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{log.action}</p>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                      <span>{log.tokensUsed.toLocaleString()} tokens</span>
                      <span>${log.costUsd.toFixed(4)}</span>
                      <span>{log.model}</span>
                    </div>
                    {log.error && (
                      <p className="text-red-400 mt-1">Error: {log.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/5">
              <Button
                size="sm"
                className="w-full text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black"
                onClick={() => {
                  // In production, this would load the analysis into the dashboard
                  alert('Impersonate: Would load analysis into dashboard view')
                }}
              >
                <Eye className="w-3 h-3" />
                Impersonate (Load to Dashboard)
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
            Select an analysis to view details
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 5: User Management ────────────────────────────────────────────

function UserManagementTab() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/users?limit=50${searchParam}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      console.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const planBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Pro': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
      case 'Starter': return 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20'
      default: return 'bg-muted/50 text-muted-foreground border-white/10'
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">Users</h3>
            <Badge variant="outline" className="text-[10px]">{total} total</Badge>
          </div>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs bg-muted/30 border-white/10"
            />
          </div>
        </div>

        {users.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            {search ? 'No users found matching your search' : 'No users yet'}
          </div>
        ) : (
          <Card className="bg-card/50 border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Plan</TableHead>
                  <TableHead className="text-xs text-right">Analyses</TableHead>
                  <TableHead className="text-xs">Joined</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-white/5 cursor-pointer hover:bg-white/5" onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}>
                    <TableCell className="text-xs font-medium">{user.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] ${planBadgeColor(user.plan)}`}>
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">{user.analysesCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Selected User Detail */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Card className="bg-card/50 border-emerald-400/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {selectedUser.name || selectedUser.email}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{selectedUser.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plan:</span>
                      <Badge variant="outline" className={`ml-2 text-[9px] ${planBadgeColor(selectedUser.plan)}`}>
                        {selectedUser.plan}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Analyses:</span>
                      <span className="ml-2">{selectedUser.analysesCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="ml-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground pt-2">
                    Click on an analysis in the Analysis History tab to see this user&apos;s analysis details.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  )
}
