'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, ArrowUp, ArrowDown } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  rank: number
  companyName: string
  industryVertical: string
  aiVisibilityScore: number
  visibilityGain: number
  isUser: boolean
}

const CATEGORIES = [
  { key: 'visibility_gains', label: 'Visibility Gains' },
  { key: 'most_improved', label: 'Most Improved' },
]

export default function Leaderboards() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('visibility_gains')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/engagement/leaderboard?category=${category}&period=monthly`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [category])

  if (loading && entries.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="h-5 w-5 text-emerald-500" />
        <span className="text-emerald-500 font-semibold text-sm uppercase tracking-wider">
          Leaderboards
        </span>
      </div>

      <h2 className="text-lg font-bold text-slate-100 mb-1">Most Improved SaaS</h2>
      <p className="text-slate-500 text-xs mb-4">This month</p>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 p-0.5 bg-slate-800/50 rounded-lg w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              category === cat.key
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-[10px] text-slate-600 uppercase py-2 pr-3 font-medium">
                Rank
              </th>
              <th className="text-left text-[10px] text-slate-600 uppercase py-2 pr-3 font-medium">
                Company
              </th>
              <th className="text-right text-[10px] text-slate-600 uppercase py-2 pr-3 font-medium">
                Score
              </th>
              <th className="text-right text-[10px] text-slate-600 uppercase py-2 font-medium">
                Gain
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`border-b border-slate-800/50 ${
                  entry.isUser
                    ? 'bg-emerald-500/5'
                    : ''
                }`}
              >
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      entry.rank <= 3
                        ? 'bg-amber-400/10 text-amber-400'
                        : entry.isUser
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`font-medium ${
                      entry.isUser ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {entry.companyName}
                  </span>
                  {entry.isUser && (
                    <span className="ml-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right text-slate-300">
                  {entry.aiVisibilityScore}
                </td>
                <td className="py-2.5 text-right">
                  <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
                    <ArrowUp className="h-3 w-3" />
                    {entry.visibilityGain}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">No leaderboard data.</p>
      )}
    </div>
  )
}
