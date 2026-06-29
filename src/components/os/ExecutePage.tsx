'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Upload, RefreshCw, Shield, ArrowRight } from 'lucide-react'
import { MorphButton } from '@/components/delight/MorphButton'
import { useOSStore } from '@/lib/os-store'
import { cn } from '@/lib/utils'

interface PendingAction {
  id: string
  title: string
  type: string
  status: string
  estimatedImpact: string
}

export function ExecutePage() {
  const { mode } = useOSStore()
  const [actions] = useState<PendingAction[]>([
    { id: '1', title: 'Publish FAQ for pricing page', type: 'publish', status: 'pending', estimatedImpact: '+3 Visibility' },
    { id: '2', title: 'Create entity page for Seosights', type: 'create', status: 'pending', estimatedImpact: '+4 Visibility' },
    { id: '3', title: 'Update llms.txt with latest content', type: 'update', status: 'pending', estimatedImpact: '+2 Visibility' },
  ])

  const handleExecuteAll = async () => {
    // Simulated execute
    await new Promise((r) => setTimeout(r, 2000))
  }

  // ── Executive Mode ────────────────────────────────────────────────────────
  if (mode === 'executive') {
    return (
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-zinc-200 text-lg">
            {actions.length} action{actions.length !== 1 ? 's' : ''} pending.
          </p>
          <div className="pt-2">
            <MorphButton onClick={handleExecuteAll}>
              Execute All
            </MorphButton>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Builder / Developer Mode ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Action Queue */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Publishing Queue
          </h3>
          <MorphButton onClick={handleExecuteAll} className="px-4 py-1.5 text-xs">
            Execute All ({actions.length})
          </MorphButton>
        </div>

        <div className="space-y-2">
          {actions.map((action, idx) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800/30 hover:border-zinc-700/50 transition-colors"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/10">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{action.title}</p>
                <p className="text-[10px] text-zinc-600">{action.type} · {action.estimatedImpact}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                {action.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Two columns: CMS + Index */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CMS Connections */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            CMS Connections
          </h3>
          <div className="space-y-2">
            {[
              { name: 'WordPress', status: 'Connected', connected: true },
              { name: 'Webflow', status: 'Not connected', connected: false },
              { name: 'Custom CMS', status: 'Not connected', connected: false },
            ].map((cms) => (
              <div key={cms.name} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/30 last:border-0">
                <span className="text-zinc-300">{cms.name}</span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded',
                  cms.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                )}>
                  {cms.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Index Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Index Status
          </h3>
          <div className="space-y-3">
            {[
              { engine: 'Google', indexed: true, lastCrawled: '2h ago' },
              { engine: 'Bing', indexed: true, lastCrawled: '1d ago' },
              { engine: 'ChatGPT', indexed: true, lastCrawled: '6h ago' },
              { engine: 'Perplexity', indexed: false, lastCrawled: 'Never' },
            ].map((item) => (
              <div key={item.engine} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn('w-1.5 h-1.5 rounded-full', item.indexed ? 'bg-emerald-400' : 'bg-zinc-600')} />
                  <span className="text-zinc-300">{item.engine}</span>
                </div>
                <span className="text-zinc-600">{item.lastCrawled}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Developer Mode: Replay & Rollback */}
      {mode === 'developer' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4"
        >
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-zinc-400" />
            Developer: Replay & Rollback
          </h3>
          <div className="flex gap-3">
            <button className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
              View Execution Log
            </button>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
              Rollback Last
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
