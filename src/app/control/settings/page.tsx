'use client'

import { useEffect, useState } from 'react'
import {
  Settings, Key, Bell, Shield, Database, Globe, Mail, Zap,
  AlertCircle, RefreshCw, Lock, CheckCircle2, XCircle,
  Loader2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────

interface SettingItem {
  key: string
  label: string
  value: string | null
  source: string
  category: string
  type: string
  description: string
  isSecret: boolean
  required: boolean
}

interface SettingsData {
  success: boolean
  settings: Record<string, SettingItem[]>
  total: number
  configured: number
}

// ─── Category icon mapping ───────────────────────────────────────

function categoryIcon(category: string): React.ElementType {
  switch (category.toLowerCase()) {
    case 'api_keys':
    case 'api':
      return Key
    case 'notifications':
      return Bell
    case 'security':
      return Shield
    case 'database':
      return Database
    case 'email':
      return Mail
    case 'integration':
    case 'integrations':
      return Globe
    case 'ai':
      return Zap
    default:
      return Settings
  }
}

function sourceStatus(source: string): { color: string; bg: string; label: string } {
  switch (source) {
    case 'database':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Configured' }
    case 'env':
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Env Var' }
    case 'default':
      return { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Default' }
    case 'unset':
    default:
      return { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Not Set' }
  }
}

// ─── Main Component ──────────────────────────────────────────────

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/control/data')
        if (res.status === 401) {
          setIsUnauthorized(true)
          return
        }
        if (!res.ok) throw new Error('Failed to fetch settings')
        const json = await res.json()
        const settingsArr: any[] = json.settings || []
        // Group settings by category
        const grouped: Record<string, SettingItem[]> = {}
        let configured = 0
        for (const s of settingsArr) {
          const cat = s.category || 'general'
          if (!grouped[cat]) grouped[cat] = []
          grouped[cat].push({
            key: s.key || s.id,
            label: s.label || s.key || s.id,
            value: s.value ?? null,
            source: s.source || (s.value ? 'database' : 'unset'),
            category: cat,
            type: s.type || 'string',
            description: s.description || '',
            isSecret: s.isSecret ?? false,
            required: s.required ?? false,
          })
          if (s.value != null && s.value !== '') configured++
        }
        setData({
          success: true,
          settings: grouped,
          total: settingsArr.length,
          configured,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform configuration and API keys</p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (isUnauthorized) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform configuration and API keys</p>
        </div>
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-8 text-center">
          <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            You must be logged in as a superadmin to view and manage platform settings.
            Please log in via the control panel to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform configuration and API keys</p>
        </div>
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">Failed to load settings</p>
          <p className="text-slate-500 text-xs mt-1">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); setData(null); setIsUnauthorized(false); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || !data.settings || Object.keys(data.settings).length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform configuration and API keys</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Settings className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No Settings Found</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            No platform settings are currently configured. Settings will appear here once they are set up.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-400" />
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform configuration and API keys</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {data.configured} configured
          </span>
          <span className="text-slate-700">|</span>
          <span>{data.total} total settings</span>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {Object.entries(data.settings).map(([category, items]) => {
          const Icon = categoryIcon(category)
          return (
            <div key={category} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white capitalize">
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  <p className="text-xs text-slate-500">{items.length} settings</p>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const status = sourceStatus(item.source)
                  const isConfigured = item.source !== 'unset'
                  return (
                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConfigured ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-slate-300">{item.label || item.key}</span>
                        {item.description && (
                          <p className="text-[10px] text-slate-600 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      {item.isSecret && item.value && (
                        <span className="text-[10px] text-slate-600 font-mono">
                          {item.value}
                        </span>
                      )}
                      {!item.isSecret && item.value && (
                        <span className="text-[10px] text-slate-600 font-mono max-w-[120px] truncate">
                          {item.value}
                        </span>
                      )}
                      {item.required && !isConfigured && (
                        <span className="text-[10px] text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Required
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
