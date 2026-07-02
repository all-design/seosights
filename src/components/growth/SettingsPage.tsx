'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  SlidersHorizontal,
  Clock,
  Shield,
  Scissors,
  AlertTriangle,
  Pause,
  RotateCcw,
  Search,
  BarChart3,
  Sparkles,
  CheckCircle,
  Rocket,
  BookOpen,
  Brain,
  Eye,
  Activity,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// ── Types ──────────────────────────────────────────────────────────────

interface EngineConfig {
  name: string
  icon: React.ElementType
  interval: string
  enabled: boolean
  lastRun: string
  nextRun: string
}

// ── Mock Data ──────────────────────────────────────────────────────────

const initialEngines: EngineConfig[] = [
  { name: 'Discovery', icon: Search, interval: 'Every 2h', enabled: true, lastRun: '14:00', nextRun: '16:00' },
  { name: 'Scoring', icon: BarChart3, interval: 'Every 4h', enabled: true, lastRun: '12:00', nextRun: '16:00' },
  { name: 'Generation', icon: Sparkles, interval: 'Hourly', enabled: true, lastRun: '14:00', nextRun: '15:00' },
  { name: 'Review', icon: CheckCircle, interval: 'Immediately', enabled: true, lastRun: '—', nextRun: '—' },
  { name: 'Publishing', icon: Rocket, interval: '09:00, 14:00, 18:00', enabled: true, lastRun: '14:00', nextRun: '18:00' },
  { name: 'Replay', icon: Activity, interval: '24h', enabled: true, lastRun: '08:00', nextRun: 'Tomorrow 08:00' },
  { name: 'Learning', icon: Brain, interval: 'Daily', enabled: true, lastRun: '06:00', nextRun: 'Tomorrow 06:00' },
  { name: 'Pruning', icon: Scissors, interval: 'Weekly', enabled: true, lastRun: 'Mon', nextRun: 'Next Mon' },
  { name: 'Observatory', icon: Eye, interval: 'Continuous', enabled: true, lastRun: '—', nextRun: '—' },
]

const assetTypes = [
  { name: 'Industry Pages', allocation: 25, color: 'bg-emerald-500' },
  { name: 'Blog Posts', allocation: 20, color: 'bg-cyan-500' },
  { name: 'FAQ Pages', allocation: 20, color: 'bg-amber-500' },
  { name: 'Case Studies', allocation: 15, color: 'bg-violet-500' },
  { name: 'Comparison Pages', allocation: 10, color: 'bg-rose-500' },
  { name: 'Tools', allocation: 10, color: 'bg-orange-500' },
]

// ── Sub-components ──────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [engines, setEngines] = useState(initialEngines)
  const [dailyBudget, setDailyBudget] = useState([20])
  const [qualityThreshold, setQualityThreshold] = useState([70])
  const [similarityThreshold, setSimilarityThreshold] = useState([80])
  const [confidenceThreshold, setConfidenceThreshold] = useState([60])
  const [pruningFrequency, setPruningFrequency] = useState('weekly')
  const [minTrafficForPruning, setMinTrafficForPruning] = useState([50])
  const [autoArchive, setAutoArchive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [allocations, setAllocations] = useState(assetTypes)

  const toggleEngine = (index: number) => {
    setEngines((prev) =>
      prev.map((e, i) => (i === index ? { ...e, enabled: !e.enabled } : e))
    )
  }

  const handlePauseAll = () => {
    setIsPaused(!isPaused)
    if (!isPaused) {
      setEngines((prev) => prev.map((e) => ({ ...e, enabled: false })))
    } else {
      setEngines(initialEngines)
    }
  }

  const handleResetLearning = () => {
    setShowResetConfirm(false)
    // Would reset the learning model in a real implementation
  }

  return (
    <div className="space-y-6">
      {/* ── Growth Budget ───────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-4">
          <SectionHeader
            title="Growth Budget"
            description="Configure daily asset creation limits and allocation"
            icon={SlidersHorizontal}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Budget Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Daily Budget</Label>
              <span className="text-sm font-mono font-bold text-emerald-400">{dailyBudget[0]} assets</span>
            </div>
            <Slider
              value={dailyBudget}
              onValueChange={setDailyBudget}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>5</span>
              <span>Conservative</span>
              <span>Moderate</span>
              <span>Aggressive</span>
              <span>50</span>
            </div>
          </div>

          <Separator className="bg-zinc-800/60" />

          {/* Type Allocation */}
          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">Type Allocation</Label>
            {/* Visual bar */}
            <div className="h-3 rounded-full overflow-hidden flex">
              {allocations.map((type) => (
                <div
                  key={type.name}
                  className={`${type.color} transition-all duration-300`}
                  style={{ width: `${type.allocation}%` }}
                />
              ))}
            </div>
            {/* Individual sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allocations.map((type, i) => (
                <div key={type.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${type.color}`} />
                      <span className="text-xs text-zinc-400">{type.name}</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-300">{type.allocation}%</span>
                  </div>
                  <Slider
                    value={[type.allocation]}
                    onValueChange={([val]) => {
                      setAllocations((prev) =>
                        prev.map((a, idx) => (idx === i ? { ...a, allocation: val } : a))
                      )
                    }}
                    min={0}
                    max={50}
                    step={5}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Schedule Configuration ──────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-4">
          <SectionHeader
            title="Schedule Configuration"
            description="Configure engine run intervals and enable/disable individual engines"
            icon={Clock}
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-zinc-800/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800/60 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500">Engine</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500">Interval</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500 hidden sm:table-cell">Last Run</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500 hidden sm:table-cell">Next Run</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500 text-right">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engines.map((engine, i) => {
                  const EngineIcon = engine.icon
                  return (
                    <TableRow key={engine.name} className="border-zinc-800/40 hover:bg-zinc-800/20">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <EngineIcon className={`w-3.5 h-3.5 ${engine.enabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
                          <span className={`text-xs font-medium ${engine.enabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {engine.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-zinc-400 font-mono">{engine.interval}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        {engine.enabled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">
                            <Zap className="w-2.5 h-2.5 mr-0.5" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-700/30 text-zinc-500 border-zinc-700/50 text-[10px]">
                            Paused
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        <span className="text-xs text-zinc-500 font-mono">{engine.lastRun}</span>
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        <span className="text-xs text-zinc-500 font-mono">{engine.nextRun}</span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Switch
                          checked={engine.enabled}
                          onCheckedChange={() => toggleEngine(i)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Governor Settings ───────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-4">
          <SectionHeader
            title="Governor Settings"
            description="Configure safety thresholds and rejection criteria"
            icon={Shield}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quality Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Minimum Quality Threshold</Label>
              <span className="text-sm font-mono font-bold text-zinc-200">{qualityThreshold[0]}</span>
            </div>
            <Slider
              value={qualityThreshold}
              onValueChange={setQualityThreshold}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Permissive (0)</span>
              <span>Moderate (50)</span>
              <span>Strict (100)</span>
            </div>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Similarity Threshold</Label>
              <span className="text-sm font-mono font-bold text-zinc-200">{(similarityThreshold[0] / 100).toFixed(2)}</span>
            </div>
            <Slider
              value={similarityThreshold}
              onValueChange={setSimilarityThreshold}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Allow similar (0.0)</span>
              <span>Balanced (0.5)</span>
              <span>Strict unique (1.0)</span>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Confidence Threshold</Label>
              <span className="text-sm font-mono font-bold text-zinc-200">{(confidenceThreshold[0] / 100).toFixed(2)}</span>
            </div>
            <Slider
              value={confidenceThreshold}
              onValueChange={setConfidenceThreshold}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Low bar (0.0)</span>
              <span>Moderate (0.5)</span>
              <span>High certainty (1.0)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Self-Pruning Settings ───────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-zinc-800/60">
        <CardHeader className="pb-4">
          <SectionHeader
            title="Self-Pruning Settings"
            description="Configure automatic content pruning and archival"
            icon={Scissors}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pruning Frequency */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Pruning Frequency</Label>
            <Select value={pruningFrequency} onValueChange={setPruningFrequency}>
              <SelectTrigger className="bg-zinc-800/60 border-zinc-700/50 text-zinc-300 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700/50">
                <SelectItem value="weekly" className="text-xs text-zinc-300 focus:text-zinc-100">Weekly</SelectItem>
                <SelectItem value="biweekly" className="text-xs text-zinc-300 focus:text-zinc-100">Bi-weekly</SelectItem>
                <SelectItem value="monthly" className="text-xs text-zinc-300 focus:text-zinc-100">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Traffic for Pruning Consideration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Minimum Traffic for Pruning Consideration</Label>
              <span className="text-sm font-mono font-bold text-zinc-200">{minTrafficForPruning[0]}/mo</span>
            </div>
            <Slider
              value={minTrafficForPruning}
              onValueChange={setMinTrafficForPruning}
              min={10}
              max={200}
              step={10}
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Low (10)</span>
              <span>Moderate (100)</span>
              <span>High (200)</span>
            </div>
          </div>

          {/* Auto-archive vs Manual Approval */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
            <div>
              <Label className="text-xs text-zinc-300">Auto-archive Pruned Content</Label>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {autoArchive
                  ? 'Pruned assets will be automatically archived without review'
                  : 'Pruned assets require manual approval before archiving'}
              </p>
            </div>
            <Switch checked={autoArchive} onCheckedChange={setAutoArchive} />
          </div>
        </CardContent>
      </Card>

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      <Card className="bg-zinc-900/80 border-rose-500/20">
        <CardHeader className="pb-4">
          <SectionHeader
            title="Danger Zone"
            description="Irreversible and high-impact actions"
            icon={AlertTriangle}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pause All Growth */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-rose-500/5 border border-rose-500/10">
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Pause All Growth</h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isPaused
                  ? 'All engines are currently paused. Click to resume.'
                  : 'Immediately stop all growth engines. This can be reversed.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`shrink-0 ml-4 ${
                isPaused
                  ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                  : 'border-rose-500/50 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
              }`}
              onClick={handlePauseAll}
            >
              {isPaused ? (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Resume All
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  Pause All
                </>
              )}
            </Button>
          </div>

          {/* Reset Learning Model */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Reset Learning Model</h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                {showResetConfirm
                  ? 'Are you sure? This will erase all learned patterns and predictions.'
                  : 'Erase all learned patterns and reset prediction models to defaults.'}
              </p>
            </div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-300 text-xs"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 text-xs"
                  onClick={handleResetLearning}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Confirm Reset
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 ml-4 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset Model
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
