'use client'

import { Settings, Key, Bell, Shield, Database, Globe, Mail, Zap } from 'lucide-react'

const sections = [
  {
    title: 'API Keys',
    icon: Key,
    description: 'Manage API keys for AI providers and integrations',
    items: [
      { name: 'OpenAI API Key', status: 'configured', lastUsed: '2m ago' },
      { name: 'Anthropic API Key', status: 'configured', lastUsed: '15m ago' },
      { name: 'Google AI API Key', status: 'missing', lastUsed: 'Never' },
      { name: 'Perplexity API Key', status: 'configured', lastUsed: '45m ago' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    description: 'Alert and notification preferences',
    items: [
      { name: 'Email Alerts', status: 'enabled', lastUsed: 'Always' },
      { name: 'Slack Integration', status: 'disabled', lastUsed: '—' },
      { name: 'Webhook Notifications', status: 'enabled', lastUsed: 'Always' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    description: 'Authentication and access control',
    items: [
      { name: 'Stripe Secret Key', status: 'configured', lastUsed: '1h ago' },
      { name: 'Resend API Key', status: 'configured', lastUsed: '3h ago' },
      { name: 'Rate Limiting', status: 'enabled', lastUsed: '—' },
    ],
  },
  {
    title: 'Database',
    icon: Database,
    description: 'Database configuration and connections',
    items: [
      { name: 'Turso Connection', status: 'connected', lastUsed: 'Live' },
      { name: 'Local SQLite', status: 'connected', lastUsed: 'Dev only' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-slate-400" />
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform configuration and API keys</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">{section.title}</h2>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.status === 'configured' || item.status === 'connected' || item.status === 'enabled'
                        ? 'bg-emerald-400'
                        : item.status === 'missing' || item.status === 'disabled'
                          ? 'bg-red-400'
                          : 'bg-amber-400'
                    }`} />
                    <span className="text-xs text-slate-300 flex-1">{item.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.status === 'configured' || item.status === 'connected' || item.status === 'enabled'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : item.status === 'missing' || item.status === 'disabled'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-600">{item.lastUsed}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
