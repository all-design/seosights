'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Unlock, Clock, FileText, BarChart3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VaultItem {
  id: string
  itemType: string
  title: string
  description: string
  isUnlocked: boolean
  unlocksInMs: number
  unlocksInHuman: string
  unlockAt: string
}

const typeIcons: Record<string, React.ElementType> = {
  report: FileText,
  prediction_result: BarChart3,
  benchmark: BarChart3,
  analysis: Search,
}

export default function AIVault() {
  const [vaultData, setVaultData] = useState<{
    items: VaultItem[]
    unlocked: VaultItem[]
    locked: VaultItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engagement/vault')
      .then((r) => r.json())
      .then((data) => setVaultData(data))
      .catch(() => setVaultData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!vaultData) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <Lock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No vault items available.</p>
      </div>
    )
  }

  const lockedCount = vaultData.locked.length

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          AI Vault™
        </span>
      </div>

      {/* Teaser */}
      {lockedCount > 0 && (
        <p className="text-slate-400 text-xs mt-2 mb-5">
          <span className="text-slate-200 font-medium">
            {lockedCount} report{lockedCount > 1 ? 's' : ''}
          </span>{' '}
          unlock{lockedCount === 1 ? 's' : ''} soon
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vaultData.items.map((item, i) => {
          const Icon = typeIcons[item.itemType] || FileText

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-lg border ${
                item.isUnlocked
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-slate-700/50 bg-slate-800/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    item.isUnlocked
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        item.isUnlocked ? 'text-slate-100' : 'text-slate-500'
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.isUnlocked ? (
                      <Unlock className="h-3 w-3 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="h-3 w-3 text-slate-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>

                  {item.isUnlocked ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-7"
                    >
                      Open
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-2 text-slate-600">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{item.unlocksInHuman}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
